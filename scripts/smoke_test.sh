#!/bin/bash
set -euo pipefail

URL="${1:-http://127.0.0.1:3000/healthz}"
MAX_RETRIES=30

echo "Running smoke test: $URL"

for i in $(seq 1 "$MAX_RETRIES"); do
    if curl --fail --silent --show-error "$URL"; then
        echo
        echo "Smoke test PASSED"
        exit 0
    fi

    echo "Attempt $i/$MAX_RETRIES failed. Retrying..."
    sleep 2
done

echo "Smoke test FAILED"
exit 1