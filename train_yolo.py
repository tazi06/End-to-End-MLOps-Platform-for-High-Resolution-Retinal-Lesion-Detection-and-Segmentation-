
from pathlib import Path
from typing import Dict, Tuple

import mlflow
import yaml

from ultralytics import YOLO
from zenml import step


@step(experiment_tracker="mlflow_tracker")
def train_yolo_model(
    epochs: int = 1,
    imgsz: int = 640,
    batch: int = 2,
) -> Tuple[bytes, Dict[str, float]]:

    dataset_dir = Path("data/processed/yolo_dataset").resolve()
    data_yaml = dataset_dir / "data.yaml"

    if not data_yaml.exists():
        raise FileNotFoundError(
            f"Dataset configuration not found: {data_yaml}"
        )

    # Load dataset configuration
    with open(data_yaml, "r") as file:
        data_config = yaml.safe_load(file)

    # Use absolute dataset path
    data_config["path"] = str(dataset_dir)

    with open(data_yaml, "w") as file:
        yaml.safe_dump(data_config, file, sort_keys=False)

    print(f"Dataset: {dataset_dir}")
    print(f"Epochs: {epochs}")
    print(f"Image size: {imgsz}")
    print(f"Batch size: {batch}")
    print("Device: CPU")

    # Log training parameters through ZenML's active MLflow run
    mlflow.log_params({
        "model_architecture": "YOLO26n-Seg",
        "pretrained_weights": "yolo26n-seg.pt",
        "epochs": epochs,
        "imgsz": imgsz,
        "batch": batch,
        "device": "cpu",
        "dataset": "IDRiD",
    })

    # Load pretrained model
    model = YOLO("yolo26n-seg.pt")

    # Fine-tuning
    results = model.train(
        data=str(data_yaml),
        epochs=epochs,
        imgsz=imgsz,
        batch=batch,
        device="cpu",
        workers=2,
        cache=False,
        amp=False,
        plots=False,
        project="data/training_runs",
        name="yolo26_baseline",
        exist_ok=True,
        verbose=True,
    )

    # Extract metrics
    metrics = {
        key: float(value)
        for key, value in results.results_dict.items()
    }

    # Log metrics
    mlflow.log_metrics(metrics)

    # Locate best model weights
    best_weights = (
        Path(results.save_dir) / "weights" / "best.pt"
    )

    if not best_weights.exists():
        raise FileNotFoundError(
            f"Best model weights not found: {best_weights}"
        )

    # Log model artifact
    mlflow.log_artifact(
        str(best_weights),
        artifact_path="model",
    )

    # Return model weights as ZenML artifact
    model_bytes = best_weights.read_bytes()

    print("Training completed.")
    print(f"Best model: {best_weights}")
    print(f"Metrics: {metrics}")

    return model_bytes, metrics
