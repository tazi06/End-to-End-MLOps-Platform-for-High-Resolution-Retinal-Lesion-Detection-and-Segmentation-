
import base64
import json
import logging
import os
import time
import uuid
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import URLError

import bentoml
from PIL import Image, ImageDraw, ImageStat

from sahi import AutoDetectionModel
from sahi.predict import get_sliced_prediction


MODEL_PATH = Path(__file__).resolve().parent.parent / "models" / "best.pt"

MODEL_VERSION = os.getenv("MODEL_VERSION", "yolo26-baseline")

COLLECTOR_URL = os.getenv("EVIDENTLY_COLLECTOR_URL")
COLLECTOR_SECRET = os.getenv("EVIDENTLY_SECRET")

logger = logging.getLogger(__name__)

MONITORING_EXECUTOR = ThreadPoolExecutor(max_workers=2)

CLASS_COLORS = {
    "MA": (255, 0, 0),
    "HE": (0, 0, 255),
    "EX": (255, 255, 0),
    "SE": (0, 255, 0),
    "OD": (255, 0, 255),
}

CLASSES = list(CLASS_COLORS.keys())


def encode_png(image: Image.Image) -> str:
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


def send_to_evidently(event: dict):
    if not COLLECTOR_URL or not COLLECTOR_SECRET:
        return

    try:
        payload = json.dumps([event]).encode("utf-8")

        request = Request(
            COLLECTOR_URL,
            data=payload,
            headers={
                "Content-Type": "application/json",
                "evidently-secret": COLLECTOR_SECRET,
            },
            method="POST",
        )

        with urlopen(request, timeout=3) as response:
            logger.info(
                "Evidently event sent: HTTP %s",
                response.status,
            )

    except Exception:
        logger.exception("Failed to send monitoring event")


@bentoml.service
class RetinaOpsService:

    def __init__(self):
        self.model = AutoDetectionModel.from_pretrained(
            model_type="ultralytics",
            model_path=str(MODEL_PATH),
            confidence_threshold=0.25,
            device="cpu",
        )

    @bentoml.api
    def predict(self, image: Image.Image) -> dict[str, str]:

        image = image.convert("RGB")

        started_at = time.perf_counter()

        result = get_sliced_prediction(
            image,
            self.model,
            slice_height=1024,
            slice_width=1024,
            overlap_height_ratio=0.2,
            overlap_width_ratio=0.2,
        )

        inference_latency_ms = (
            time.perf_counter() - started_at
        ) * 1000

        width, height = image.size

        # Image features
        stats = ImageStat.Stat(image)

        brightness = sum(stats.mean) / 3
        contrast = sum(stats.stddev) / 3

        # Prediction statistics
        counts = {name: 0 for name in CLASSES}
        confidences = []

        mask = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(mask)

        for prediction in result.object_prediction_list:

            class_name = prediction.category.name

            if class_name in counts:
                counts[class_name] += 1
                confidences.append(float(prediction.score.value))

            if prediction.mask is None:
                continue

            color = CLASS_COLORS.get(
                class_name,
                (255, 255, 255),
            )

            for polygon in prediction.mask.segmentation:
                points = [
                    (polygon[i], polygon[i + 1])
                    for i in range(0, len(polygon), 2)
                ]

                if len(points) >= 3:
                    draw.polygon(
                        points,
                        fill=(*color, 180),
                    )

        annotated = Image.alpha_composite(
            image.convert("RGBA"),
            mask,
        )

        mean_confidence = (
            sum(confidences) / len(confidences)
            if confidences else 0.0
        )

        # Evidently monitoring event
        event = {
            "prediction_id": str(uuid.uuid4()),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "model_version": MODEL_VERSION,
            "brightness": brightness,
            "contrast": contrast,
            "width": width,
            "height": height,
            "MA_count": counts["MA"],
            "HE_count": counts["HE"],
            "EX_count": counts["EX"],
            "SE_count": counts["SE"],
            "OD_count": counts["OD"],
            "mean_confidence": mean_confidence,
            "inference_latency_ms": inference_latency_ms,
        }

        # Send monitoring event without blocking inference response
        MONITORING_EXECUTOR.submit(
            send_to_evidently,
            event,
        )

        logger.info(
            "Prediction completed in %.2f ms",
            inference_latency_ms,
        )

        return {
            "mask.png": encode_png(mask),
            "annotated_retina.png": encode_png(annotated),
        }
