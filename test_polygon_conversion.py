
from pathlib import Path
import csv

import cv2
import numpy as np
from PIL import Image


BASE = Path("data/raw/2. All Segmentation Groundtruths/a. Training Set")

CLASSES = {
    "MA": "1. Microaneurysms",
    "HE": "2. Haemorrhages",
    "EX": "3. Hard Exudates",
    "SE": "4. Soft Exudates",
    "OD": "5. Optic Disc",
}

OUTPUT = Path("data/processed/polygon_test")


def evaluate(mask):
    contours, _ = cv2.findContours(
        mask.copy(),
        cv2.RETR_EXTERNAL,
        cv2.CHAIN_APPROX_SIMPLE,
    )

    reconstructed = np.zeros_like(mask)
    polygons = 0

    for contour in contours:
        if len(contour) < 3:
            continue

        points = contour.reshape(-1, 2)
        cv2.fillPoly(reconstructed, [points], 1)
        polygons += 1

    intersection = np.logical_and(mask, reconstructed).sum()
    union = np.logical_or(mask, reconstructed).sum()

    original_pixels = mask.sum()
    reconstructed_pixels = reconstructed.sum()

    iou = intersection / union if union else 1.0
    denominator = original_pixels + reconstructed_pixels
    dice = 2 * intersection / denominator if denominator else 1.0

    return polygons, iou, dice


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    results = []

    for class_name, folder in CLASSES.items():
        mask_dir = BASE / folder

        for path in sorted(mask_dir.glob(f"*_{class_name}.tif")):
            with Image.open(path) as img:
                mask = np.array(img.convert("L"))

            binary = (mask > 0).astype(np.uint8)

            polygons, iou, dice = evaluate(binary)

            results.append({
                "class": class_name,
                "file": path.name,
                "polygons": polygons,
                "iou": iou,
                "dice": dice,
            })

    report = OUTPUT / "all_masks_report.csv"

    with open(report, "w", newline="") as file:
        writer = csv.DictWriter(
            file,
            fieldnames=["class", "file", "polygons", "iou", "dice"],
        )
        writer.writeheader()
        writer.writerows(results)

    for class_name in CLASSES:
        rows = [r for r in results if r["class"] == class_name]
        if rows:
            avg_iou = np.mean([r["iou"] for r in rows])
            avg_dice = np.mean([r["dice"] for r in rows])
            print(
                f"{class_name}: {len(rows)} masks | "
                f"Mean IoU: {avg_iou:.6f} | "
                f"Mean Dice: {avg_dice:.6f}"
            )

    print(f"\nTotal masks tested: {len(results)}")
    print(f"Report: {report}")


if __name__ == "__main__":
    main()
