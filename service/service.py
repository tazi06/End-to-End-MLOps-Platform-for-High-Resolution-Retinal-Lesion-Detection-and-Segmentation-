
import base64
from io import BytesIO
from pathlib import Path

import bentoml
from PIL import Image, ImageDraw

from sahi import AutoDetectionModel
from sahi.predict import get_sliced_prediction


MODEL_PATH = Path(__file__).resolve().parent.parent / "models" / "best.pt"

CLASS_COLORS = {
    "MA": (255, 0, 0),
    "HE": (0, 0, 255),
    "EX": (255, 255, 0),
    "SE": (0, 255, 0),
    "OD": (255, 0, 255),
}


def encode_png(image: Image.Image) -> str:
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


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

        result = get_sliced_prediction(
            image,
            self.model,
            slice_height=1024,
            slice_width=1024,
            overlap_height_ratio=0.2,
            overlap_width_ratio=0.2,
        )

        width, height = image.size

        mask = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(mask)

        for prediction in result.object_prediction_list:

            if prediction.mask is None:
                continue

            class_name = prediction.category.name
            color = CLASS_COLORS.get(class_name, (255, 255, 255))

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

        return {
            "mask.png": encode_png(mask),
            "annotated_retina.png": encode_png(annotated),
        }
