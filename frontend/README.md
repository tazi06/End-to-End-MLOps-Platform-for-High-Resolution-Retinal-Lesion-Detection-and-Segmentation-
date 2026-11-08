# RetinaOps — Frontend

A premium, minimalist, **monochrome** web interface for **RetinaOps**, an AI-powered retinal fundus image segmentation platform. Upload a high-resolution retinal image, run sliced lesion segmentation on the deployed backend, and inspect / download the results.

> **Research & educational use only.** RetinaOps is not intended for clinical diagnosis or medical decision-making.

---

## Overview

RetinaOps analyzes retinal fundus images and returns two generated images:

- **Segmentation mask** — colored lesion masks on a transparent background.
- **Annotated retina** — the original image with colored segmentation overlays.

Lesion classes segmented by the model:

| Code | Class          | Color   |
| ---- | -------------- | ------- |
| MA   | Microaneurysms | Red     |
| HE   | Hemorrhages    | Blue    |
| EX   | Hard Exudates  | Yellow  |
| SE   | Soft Exudates  | Green   |
| OD   | Optic Disc     | Magenta |

> The backend returns **only the two images** — it does not return per-class detection counts, so the UI never fabricates them. Colors above correspond to `CLASS_COLORS` in `service/service.py`.

---

## Architecture & inference workflow

```text
┌──────────┐   multipart    ┌──────────────────────────────────────┐
│ Frontend │  POST /predict │           BentoML Service            │
│ (React)  │ ─────────────▶ │  1. SAHI slices the image (1024²)    │
│          │   field=image  │  2. YOLO26n-Seg segments each tile   │
│          │ ◀───────────── │  3. SAHI recombines predictions      │
└──────────┘   JSON (b64)   │  4. Returns mask + annotated (b64)   │
                            └──────────────────────────────────────┘
```

**Verified API contract** (from `service/service.py`, `bentofile.yaml`, `deployment/deployment.yaml`):

| Concern            | Value                                                                         |
| ------------------ | ----------------------------------------------------------------------------- |
| Inference endpoint | `POST /predict`                                                               |
| Request format     | `multipart/form-data`, file field **`image`** (BentoML auto IO from `PIL.Image.Image`) |
| Response           | JSON `{ "mask.png": "<base64>", "annotated_retina.png": "<base64>" }` (raw base64, no data-URI prefix) |
| Health endpoint    | `GET /healthz` (used by the k8s readiness/liveness probes)                     |
| Model              | YOLO26n-Seg (`best.pt`), confidence `0.25`, SAHI slicing `1024×1024`, overlap `0.2`, CPU |

The frontend adapts entirely to this backend — no backend changes were made.

---

## Tech stack

- **React 18** + **TypeScript**
- **Vite 5** (dev server + build)
- **Tailwind CSS 3** (strict monochrome design tokens)
- **lucide-react** (icons)

No other runtime dependencies.

### Project structure

```text
frontend/
├── src/
│   ├── components/
│   │   ├── layout/      # Sidebar, Header, AppLayout
│   │   ├── upload/      # ImageUploader, ImagePreview
│   │   ├── analysis/    # Workspace, Loading, Results, Error, ImagePanel
│   │   ├── overview/    # OverviewPage
│   │   ├── history/     # HistoryPage
│   │   ├── settings/    # SettingsPage
│   │   └── ui/          # Button, StatusDot, ImageLightbox
│   ├── services/
│   │   └── retinaops-api.ts   # API client (predict + health)
│   ├── hooks/           # useHealthCheck, useImageSelection, useAnalysis
│   ├── types/           # shared TypeScript interfaces
│   ├── utils/           # constants, formatting, validation, cn
│   ├── App.tsx
│   └── main.tsx
├── .env.example
├── index.html
└── package.json
```

---

## Getting started

### Prerequisites

- **Node.js ≥ 18**

### 1. Install

```bash
cd frontend
npm install
```

### 2. Configure the backend URL

Copy the example env file and point it at your deployed RetinaOps API:

```bash
cp .env.example .env
```

```env
# .env — Option A (default): dev proxy, avoids CORS
VITE_API_URL=/api
VITE_DEV_PROXY_TARGET=http://<NODE-IP>:30080
```

- **Option A (default):** `VITE_API_URL` is a relative path (`/api`) and `VITE_DEV_PROXY_TARGET` is the real backend. The Vite dev server proxies `/api/*` to the backend, so the browser never hits CORS. Replace `<NODE-IP>` with your node IP/host (use `localhost` for a local port-forward).
- **Option B (direct):** set `VITE_API_URL` to the absolute backend URL and leave `VITE_DEV_PROXY_TARGET` empty — requires backend CORS (see [CORS](#cors)).
- Variables are read **at build time** (Vite). After changing `.env`, restart the dev server or rebuild.

### 3. Development server

```bash
npm run dev
```

Open the printed URL (default `http://localhost:5173`).

### 4. Type-check

```bash
npm run typecheck
```

### 5. Production build

```bash
npm run build      # tsc -b && vite build  → outputs to dist/
npm run preview    # preview the production build locally
```

---

## Backend API integration

All backend communication lives in [`src/services/retinaops-api.ts`](src/services/retinaops-api.ts):

- `predict(file, signal)` — posts the image as `multipart/form-data` (field `image`), parses the JSON response, decodes the two base64 PNGs into displayable data URLs, and measures round-trip duration. Enforces a request timeout.
- `checkHealth(signal)` — `GET /healthz`; resolves `true` only on a 2xx response, never throws.
- `getApiBaseUrl()` — resolves/validates `VITE_API_URL` and rejects the unconfigured placeholder.

The client handles network errors, timeouts, non-2xx HTTP responses, and invalid/unexpected response bodies, mapping each to a user-friendly message. It contains **no credentials, no mock responses, and no fabricated segmentation results**.

### Backend health check

The top navigation and sidebar show a live connection indicator driven by a real `/healthz` poll:

- **Connected** — solid dot
- **Checking connection** — pulsing dot
- **Disconnected** — hollow ring

Re-check manually from the header button or the Settings page. The status is never hardcoded.

### CORS

The browser enforces CORS; `curl` does not. The deployed BentoML service does **not** send `Access-Control-Allow-*` headers and answers the browser's `OPTIONS /predict` preflight with `405`, so a direct browser call is blocked even though `curl` succeeds. There are two supported ways to handle this:

**Option A — Vite dev proxy (default, recommended, no backend change).**
The browser talks to the Vite dev server same-origin and Vite forwards the request to the backend, so CORS never applies. Configured in `.env`:

```env
VITE_API_URL=/api                          # relative → calls the dev server
VITE_DEV_PROXY_TARGET=http://<NODE-IP>:30080   # where Vite forwards /api/*
```

`vite.config.ts` proxies `/api/*` → `<target>/*` (the `/api` prefix is stripped). This is the setup the project ships with.

**Option B — Direct call (production, or when the backend sends CORS headers).**
Point `VITE_API_URL` at the absolute backend URL and leave `VITE_DEV_PROXY_TARGET` empty:

```env
VITE_API_URL=http://<NODE-IP>:30080
VITE_DEV_PROXY_TARGET=
```

For this to work in a browser, the backend must allow the frontend origin. For BentoML 1.2+ enable CORS on the service (do this only if you choose Option B):

```python
# service/service.py
@bentoml.service(
    http={
        "cors": {
            "enabled": True,
            "access_control_allow_origins": ["*"],  # or your exact frontend origin
            "access_control_allow_methods": ["GET", "POST", "OPTIONS"],
            "access_control_allow_headers": ["*"],
        }
    }
)
class RetinaOpsService:
    ...
```

In production, prefer serving the built frontend behind the **same host/ingress** as the API (e.g. the frontend at `/` and the API at `/api` via the ingress), which also avoids CORS.

---

## Deployment considerations

- `npm run build` produces a fully static bundle in `dist/` — host it on any static file server, CDN, S3 + CloudFront, Nginx, or alongside the cluster ingress.
- `VITE_API_URL` is **baked in at build time**. To target a different backend, rebuild with the appropriate `.env`, or run separate builds per environment.
- Ensure the deployed frontend can reach the backend's NodePort / ingress over the network, and that CORS permits the frontend origin.
- Never commit real `.env` files — only `.env.example` is tracked (`.env*` is gitignored).

---

## Design system

Strict monochrome palette (`tailwind.config.js`):

| Token          | Hex       | Use                 |
| -------------- | --------- | ------------------- |
| `canvas`       | `#FFFFFF` | Main background     |
| `ink`          | `#111111` | Primary text / CTA  |
| `ink-secondary`| `#737373` | Secondary text      |
| `ink-muted`    | `#A3A3A3` | Muted text          |
| `line`         | `#E5E5E5` | Borders             |
| `subtle`       | `#F8F8F8` | Subtle backgrounds  |
| `hover`        | `#F3F3F3` | Hover backgrounds   |

The **only** non-monochrome colors in the interface are the actual segmentation mask/overlay colors returned by the backend and the lesion-class legend swatches that mirror them. Typography uses **Inter** (with Geist fallbacks).

---

## Notes

- **Analysis History** honestly reflects that the backend is stateless — it shows an empty state instead of fabricating saved records. If a real persistence layer is added later, this page is the place to wire it in.
- Downloads (`mask.png`, `annotated_retina.png`) contain the exact images returned by the backend, unmodified.
- The loading state shows an indeterminate indicator (no fake progress %) because the backend does not stream progress.
