import shutil
from pathlib import Path

import mlflow
from mlflow import MlflowClient


MODEL_NAME = "retinaops-yolo"
MODEL_VERSION = "4"

ROOT_DIR = Path(__file__).resolve().parent.parent
MODEL_DIR = ROOT_DIR / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

client = MlflowClient()

version = client.get_model_version(
    name=MODEL_NAME,
    version=MODEL_VERSION,
)

downloaded_path = mlflow.artifacts.download_artifacts(
    artifact_uri=version.source
)

source_file = Path(downloaded_path) / "best.pt"

if not source_file.exists():
    raise FileNotFoundError(f"Model checkpoint not found: {source_file}")

destination = MODEL_DIR / "best.pt"
shutil.copy2(source_file, destination)

print(f"Model: {MODEL_NAME}")
print(f"Version: {MODEL_VERSION}")
print(f"Downloaded to: {destination}")