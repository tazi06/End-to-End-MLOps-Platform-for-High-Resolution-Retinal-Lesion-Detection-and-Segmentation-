
import os
import time
import uuid
import logging
import threading

from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from datetime import datetime, timezone

import bentoml
import numpy as np
import requests

from PIL import Image, ImageDraw
from sahi import AutoDetectionModel
from sahi.predict import get_sliced_prediction


# --------------------------------------------------
# Configuration
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "models" / "best.pt"

CONFIDENCE_THRESHOLD = 0.25

SLICE_HEIGHT = 1024
SLICE_WIDTH = 1024

OVERLAP_HEIGHT_RATIO = 0.2
OVERLAP_WIDTH_RATIO = 0.2

MODEL_VERSION = os.getenv("MODEL_VERSION", "yolo26-baseline")

EVIDENTLY_COLLECTOR_URL = os.getenv(
    "EVIDENTLY_COLLECTOR_URL"
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("retinaops")

executor = ThreadPoolExecutor(max_workers=2)


# --------------------------------------------------
# Evidently Monitoring
# --------------------------------------------------

def send_to_evidently(event: dict):
    """
    Send prediction events to Evidently Collector.
    This runs in the background and does not block inference.
    """

    if not EVIDENTLY_COLLECTOR_URL:
        return

    try:
        response = requests.post(
            EVIDENTLY_COLLECTOR_URL,
            json=[event],
            headers={"Content-Type": "application/json"},
            timeout=3,
        )

        response.raise_for_status()

        logger.info("Prediction event sent to Evidently")

    except requests.RequestException as exc:
        logger.warning("Evidently monitoring failed: %s", exc)


def extract_image_metrics(image: Image.Image):
    """
    Extract basic image-level monitoring features.
    """

    image_array = np.asarray(image.convert("RGB"), dtype=np.float32)

    grayscale = np.mean(image_array, axis=2)

    return {
        "image_width": int(image.width),
        "image_height": int(image.height),
        "brightness": float(np.mean(grayscale)),
        "contrast": float(np.std(grayscale)),
    }


def build_monitoring_event(
    predictions,
    image: Image.Image,
    inference_time: float,
):
    """
    Build a structured event from one prediction.
    """

    lesion_counts = {
        "MA": 0,
        "HE": 0,
        "EX": 0,
        "SE": 0,
        "OD": 0,
    }

    confidences = []

    for prediction in predictions:
        category = prediction.category.name.upper()
        confidence = float(prediction.score.value)

        if category in lesion_counts:
            lesion_counts[category] += 1

        confidences.append(confidence)

    mean_confidence = (
        float(np.mean(confidences))
        if confidences else 0.0
    )

    return {
        "prediction_id": str(uuid.uuid4()),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "model_version": MODEL_VERSION,
        "inference_time_ms": round(inference_time * 1000, 2),
        "mean_confidence": mean_confidence,
        "total_predictions": len(predictions),
        **lesion_counts,
        **extract_image_metrics(image),
    }


# --------------------------------------------------
# Segmentation Visualization
# --------------------------------------------------

def render_predictions(image: Image.Image, predictions):
    """
    Render segmentation masks and bounding boxes
    on the original retinal image.
    """

    output = image.convert("RGBA")
    overlay = Image.new("RGBA", output.size, (0, 0, 0, 0))

    draw = ImageDraw.Draw(overlay)

    colors = {
        "MA": (255, 50, 50, 110),
        "HE": (255, 140, 0, 110),
        "EX": (255, 220, 0, 110),
        "SE": (0, 180, 255, 110),
        "OD": (180, 0, 255, 110),
    }

    for prediction in predictions:

        category = prediction.category.name.upper()
        color = colors.get(category, (0, 255, 0, 110))

        # Draw segmentation mask when available
        if prediction.mask is not None:

            mask = prediction.mask.bool_mask

            if mask is not None:
                mask_array = np.asarray(mask, dtype=bool)

                if mask_array.shape == (
                    image.height,
                    image.width,
                ):
                    mask_layer = Image.new(
                        "RGBA",
                        image.size,
                        (0, 0, 0, 0),
                    )

                    pixels = np.zeros(
                        (image.height, image.width, 4),
                        dtype=np.uint8,
                    )

                    pixels[mask_array] = color

                    mask_layer = Image.fromarray(pixels, "RGBA")
                    overlay = Image.alpha_composite(
                        overlay,
                        mask_layer,
                    )

        # Draw bounding box
        bbox = prediction.bbox.to_xyxy()

        x1, y1, x2, y2 = map(int, bbox)

        draw.rectangle(
            (x1, y1, x2, y2),
            outline=color[:3] + (255,),
            width=2,
        )

        label = (
            f"{category} "
            f"{float(prediction.score.value):.2f}"
        )

        draw.text(
            (x1, max(0, y1 - 15)),
            label,
            fill=(255, 255, 255, 255),
        )

    output = Image.alpha_composite(output, overlay)

    return output.convert("RGB")


# --------------------------------------------------
# BentoML Service
# --------------------------------------------------

@bentoml.service
class RetinaOpsService:

    def __init__(self):

        logger.info("Loading RetinaOps YOLO26-Seg model")

        if not MODEL_PATH.exists():
            raise FileNotFoundError(
                f"Model not found: {MODEL_PATH}"
            )

        self.detection_model = (
            AutoDetectionModel.from_pretrained(
                model_type="ultralytics",
                model_path=str(MODEL_PATH),
                confidence_threshold=CONFIDENCE_THRESHOLD,
                device="cpu",
            )
        )

        logger.info("YOLO26-Seg model loaded successfully")

    @bentoml.api
    def predict(self, image: Image.Image) -> Image.Image:
        """
        Run SAHI sliced inference and return an
        annotated retinal image.
        """

        start_time = time.perf_counter()

        image = image.convert("RGB")

        logger.info(
            "Starting inference: %s x %s",
            image.width,
            image.height,
        )

        # SAHI sliced inference
        result = get_sliced_prediction(
            image=image,
            detection_model=self.detection_model,
            slice_height=SLICE_HEIGHT,
            slice_width=SLICE_WIDTH,
            overlap_height_ratio=OVERLAP_HEIGHT_RATIO,
            overlap_width_ratio=OVERLAP_WIDTH_RATIO,
            perform_standard_pred=True,
            postprocess_type="NMS",
            postprocess_match_threshold=0.5,
        )

        predictions = result.object_prediction_list

        inference_time = time.perf_counter() - start_time

        logger.info(
            "Inference completed: %s predictions in %.2f ms",
            len(predictions),
            inference_time * 1000,
        )

        # Generate annotated image
        annotated_image = render_predictions(
            image,
            predictions,
        )

        # Send monitoring event asynchronously
        event = build_monitoring_event(
            predictions,
            image,
            inference_time,
        )

        executor.submit(send_to_evidently, event)

        return annotated_image
