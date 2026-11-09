
from pathlib import Path

import numpy as np
from PIL import Image
from zenml import step


@step
def validate_idrid_data(data_dir: str) -> str:
    base = Path(data_dir)

    splits = {
        "Training": "a. Training Set",
        "Testing": "b. Testing Set",
    }

    classes = {
        "MA": "1. Microaneurysms",
        "HE": "2. Haemorrhages",
        "EX": "3. Hard Exudates",
        "SE": "4. Soft Exudates",
        "OD": "5. Optic Disc",
    }

    for split_name, split_dir in splits.items():
        images_dir = base / "1. Original Images" / split_dir
        masks_base = base / "2. All Segmentation Groundtruths" / split_dir

        images = sorted(images_dir.glob("*.jpg"))
        print(f"\n{split_name}: {len(images)} images")

        for image_path in images:
            with Image.open(image_path) as image:
                image_size = image.size

            image_id = image_path.stem

            for class_name, class_dir in classes.items():
                mask_path = (
                    masks_base / class_dir / f"{image_id}_{class_name}.tif"
                )

                # Missing annotation is not a negative label.
                if not mask_path.exists():
                    continue

                with Image.open(mask_path) as mask_image:
                    mask_size = mask_image.size
                    mask = np.array(mask_image)

                assert image_size == mask_size, (
                    f"Size mismatch: {image_id} - {class_name}"
                )

                unique_values = set(np.unique(mask).tolist())

                assert unique_values.issubset({0, 1, 255}), (
                    f"Invalid mask values: {image_id} - "
                    f"{class_name}: {unique_values}"
                )

        print(f"{split_name}: validation passed")

    print("\nAll dataset validation checks passed.")
    return "IDRiD data validation passed"
