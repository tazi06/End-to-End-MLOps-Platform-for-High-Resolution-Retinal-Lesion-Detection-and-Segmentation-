
from pathlib import Path
import csv

import numpy as np
from PIL import Image
from zenml import step


PATCH_SIZE = 1024
OVERLAP = 0.20

SPLITS = {
    "train": "a. Training Set",
    "test": "b. Testing Set",
}

CLASSES = {
    "MA": "1. Microaneurysms",
    "HE": "2. Haemorrhages",
    "EX": "3. Hard Exudates",
    "SE": "4. Soft Exudates",
    "OD": "5. Optic Disc",
}


def get_patch_positions(length: int) -> list[int]:
    stride = int(PATCH_SIZE * (1 - OVERLAP))

    positions = list(
        range(0, length - PATCH_SIZE + 1, stride)
    )

    last = length - PATCH_SIZE

    if positions[-1] != last:
        positions.append(last)

    return positions


def has_all_masks(image_id: str, masks_base: Path) -> bool:
    for class_name, class_dir in CLASSES.items():
        mask_path = (
            masks_base
            / class_dir
            / f"{image_id}_{class_name}.tif"
        )

        if not mask_path.exists():
            return False

    return True


@step
def preprocess_idrid_data(data_dir: str) -> str:
    base = Path(data_dir)
    output = Path("data/processed/idrid_patches")

    manifest = []

    for split, split_dir in SPLITS.items():

        images_dir = (
            base / "1. Original Images" / split_dir
        )

        masks_base = (
            base / "2. All Segmentation Groundtruths" / split_dir
        )

        complete_images = 0
        excluded_images = 0

        for image_path in sorted(images_dir.glob("*.jpg")):

            image_id = image_path.stem

            if not has_all_masks(image_id, masks_base):
                excluded_images += 1
                continue

            complete_images += 1

            with Image.open(image_path) as img:
                image = img.convert("RGB")

            width, height = image.size

            for row, y in enumerate(get_patch_positions(height)):
                for col, x in enumerate(get_patch_positions(width)):

                    patch_id = f"{image_id}_{row}_{col}"

                    image_patch = image.crop(
                        (x, y, x + PATCH_SIZE, y + PATCH_SIZE)
                    )

                    image_output = (
                        output / "images" / split
                    )

                    image_output.mkdir(
                        parents=True,
                        exist_ok=True
                    )

                    image_patch.save(
                        image_output / f"{patch_id}.jpg"
                    )

                    for class_name, class_dir in CLASSES.items():

                        mask_path = (
                            masks_base
                            / class_dir
                            / f"{image_id}_{class_name}.tif"
                        )

                        with Image.open(mask_path) as mask_img:
                            mask = np.array(
                                mask_img.convert("L")
                            )

                        binary_mask = (
                            mask > 0
                        ).astype(np.uint8) * 255

                        mask_image = Image.fromarray(
                            binary_mask
                        )

                        mask_patch = mask_image.crop(
                            (
                                x,
                                y,
                                x + PATCH_SIZE,
                                y + PATCH_SIZE,
                            )
                        )

                        mask_output = (
                            output
                            / "masks"
                            / split
                            / class_name
                        )

                        mask_output.mkdir(
                            parents=True,
                            exist_ok=True
                        )

                        mask_patch.save(
                            mask_output / f"{patch_id}.png"
                        )

                    manifest.append({
                        "patch_id": patch_id,
                        "split": split,
                        "source_image": image_path.name,
                        "x": x,
                        "y": y,
                        "available_classes": ",".join(CLASSES.keys()),
                    })

        print(f"\nSplit: {split}")
        print(f"Complete images: {complete_images}")
        print(f"Excluded images: {excluded_images}")

    output.mkdir(parents=True, exist_ok=True)

    with open(
        output / "manifest.csv",
        "w",
        newline=""
    ) as file:

        writer = csv.DictWriter(
            file,
            fieldnames=[
                "patch_id",
                "split",
                "source_image",
                "x",
                "y",
                "available_classes",
            ],
        )

        writer.writeheader()
        writer.writerows(manifest)

    print(f"\nTotal patches created: {len(manifest)}")
    print(f"Output directory: {output}")

    return str(output)
