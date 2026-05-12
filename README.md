# X Archive Extractor

Chrome extension + web app to extract, sort, filter, and archive Twitter/X profile tweets. Rich interactive HTML reports, cloud-hosted, JSON/CSV export.

[**Live →**](https://extractor.aayushman.dev/dashboard) · [**Releases →**](https://github.com/aayushman-singh/tweet-extractor/releases) · [![License](https://img.shields.io/badge/License-MIT-c8693d?style=flat)](LICENSE.txt) · [![Sponsor](https://img.shields.io/badge/Buy_me_a_coffee-FFDD00?style=flat&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/aayushmansingh)

---

## Why

Twitter killed third-party archive APIs and the official export is incomplete, slow, and undatable. This tool runs in-page on profile views, scrapes via the same fetches the UI already makes, and ships a self-contained HTML archive with sort/filter/export built in. Cloud-hosted reports get a shareable URL; local downloads get a zip you own.

## Use it now (no setup)

**Extension** — download `x_archive_extractor.zip` from [releases](https://github.com/aayushman-singh/tweet-extractor/releases) → extract → load unpacked in Chrome (Developer mode).

**Web app** — [extractor.aayushman.dev](https://extractor.aayushman.dev/dashboard) for archive management.

**Flow:** open any X/Twitter profile → click extension → pick count → download or upload.

## Features

**Extension**
- Tweet extraction at any depth (10 / 100 / 1k / 10k / custom)
- Sort by date, likes, retweets, views, engagement
- Search across content
- Export JSON / CSV / interactive HTML
- Upload to cloud or download locally

**API (backend)**
- S3 upload, public report URLs
- JWT-authenticated dashboard
- Health + recent-uploads endpoints
- Deploys to Vercel / Netlify / AWS Lambda

**Frontend dashboard**
- Login / registration
- Browse + manage archives
- Responsive (desktop + mobile)
- React 18 + Vite + Tailwind

## Stack

**Extension** — Chrome Manifest V3 · vanilla JS
**Backend** — Node.js · Express · AWS S3 · MongoDB · JWT
**Frontend** — React 18 · TypeScript · Vite · Tailwind

## Project structure

```
tweet-extractor/
├── extension/   Chrome extension (manifest, popup, content, background)
├── api/         Node backend (S3 upload, auth)
└── frontend/    React + TS dashboard
```

## Self-hosting

### Prerequisites

- Node.js 16+
- Chrome/Chromium (Manifest V3)
- AWS S3 bucket + IAM keys
- MongoDB URI (optional, for dashboard auth)

### Setup

```bash
git clone https://github.com/aayushman-singh/tweet-extractor.git
cd tweet-extractor

# API
cd api && npm install && cp .env.example .env  # fill keys
npm start

# Frontend
cd ../frontend && npm install && cp .env.example .env
npm run dev
```

### Environment

**API (`api/.env`):**
```
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
S3_BUCKET_NAME=
JWT_SECRET=
MONGODB_URI=         # optional
```

**Frontend (`frontend/.env`):**
```
VITE_API_BASE_URL=https://your-api-domain.com
```

### Wire extension to your API

Edit before loading unpacked:
- `extension/working.js` → `apiBase` constant
- `extension/popup.js` → `API_BASE` constant
- `extension/manifest.json` → `host_permissions`

Load: `chrome://extensions/` → Developer mode → Load unpacked → select `extension/`.

## Deploy

| Component | Recommended | Alt |
| --- | --- | --- |
| API | AWS Lambda (serverless) | Vercel · Netlify |
| Frontend | Vercel | Netlify |
| Extension | Chrome Web Store | Unpacked install |

## Output

Generated reports land at `https://your-domain.com/report<timestamp>.html` — interactive, sortable, filterable, JSON/CSV-exportable inline.

## Security

- Extension scoped to X/Twitter domains only
- API CORS locked to extension origins
- S3 reports are read-only public; uploads require auth
- AWS credentials env-only, never committed
- Frontend uses JWT bearer auth

## Data model

See [`extension/README.md`](extension/README.md) and [`api/README.md`](api/README.md) for the full Twitter/X internal API response schema this tool consumes.

## Contributing

PRs welcome. Open an issue first for non-trivial features. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Author

Built by [Aayushman Singh](https://aayushman.dev) — engineer building autonomous coding agents and OSINT tooling. Smart India Hackathon '24 winner.

## License

MIT — see [LICENSE.txt](LICENSE.txt).
