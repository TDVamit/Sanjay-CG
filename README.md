# Sanjay Career Guidance — frontend

Sanjay is an AI career-guide application that turns a computer-science student’s interests, skills, experience, and goals into explainable career-roadmap recommendations and practical next steps.

This repository contains the authenticated React frontend. The companion API is maintained in [TDVamit/sanjay-cg-backend](https://github.com/TDVamit/sanjay-cg-backend).

## What the product does

- Guides a signed-in user through a required 30-question assessment across six areas: interests, goals, academics and skills, practical exposure, future planning, and industry awareness.
- Loads available roadmaps from the API, sends the completed assessment plus roadmap catalog to the backend AI chat endpoint, and renders four recommendations.
- Uses returned roadmap IDs to open matching roadmap detail pages; recommendations are constrained client-side to IDs returned by the API.
- Accepts a resume PDF and displays the backend’s ATS-oriented category scores and comments.
- Browses, filters, creates, edits, and deletes career roadmaps, categories, and guidance agents through authenticated API calls.
- Provides an AI career assistant that answers questions and suggests in-app destinations such as assessment, resume analysis, roadmaps, and personalized guidance.
- Includes built-in career-guide PDFs for common paths including frontend, backend, full-stack, AI engineering, data analysis, DevOps, cybersecurity, mobile, product, and UX roles.

## User flow

1. Register or sign in.
2. Start the six-step assessment; each step validates that all five questions are answered.
3. Review four AI-selected roadmaps, then open a roadmap for its full content.
4. Optionally analyze a resume, browse maintained roadmaps, or ask the assistant where to go next.

All primary routes are protected by `ProtectedRoute`. Access and refresh tokens are stored in browser `localStorage`; the API client refreshes access tokens proactively and retries once after a 401 response.

## Architecture

```text
React/Vite browser app
  ├─ AuthContext + ProtectedRoute + token refresh
  ├─ Assessment, resume analyzer, roadmaps, guidance agents, AI chat
  ├─ Static career-guide PDFs in public/pdfs/
  └─ Axios service layer
       │  /api/v1/* with Bearer tokens
       ▼
FastAPI backend (TDVamit/sanjay-cg-backend)
  ├─ JWT auth and user/profile APIs
  ├─ MongoDB persistence
  ├─ OpenAI chat and resume ATS analysis
  └─ PDF processing and roadmap/category/guidance-agent APIs
```

The frontend owns routing, form state, token handling, result validation, and presentation. The backend owns authentication, persistence, PDF conversion, AI calls, and business APIs. The assessment prompt is assembled in `src/components/CareerAssessment.tsx`; the AI response is expected to contain four roadmap objects with exact IDs from the catalog.

## Tech stack

- React 19, TypeScript, React Router 7
- Vite 6, Tailwind CSS 3, PostCSS
- Axios for API access
- `@react-pdf-viewer/*` and `pdfjs-dist` for PDF viewing
- TipTap for rich text editing
- Vercel configuration with a Vite build and `/api/*` rewrite

## Local setup

Requirements: Node.js 18+ and npm 8+.

```bash
git clone https://github.com/TDVamit/Sanjay-CG.git
cd Sanjay-CG
npm install
npm run dev
```

The repository does not include an `.env.example`. For local development, create `.env` with the URL of a running backend:

```env
VITE_BACKEND_SERVER_URL=http://127.0.0.1:8000/api/v1
```

Start the backend separately, then open the Vite URL printed by `npm run dev`. Do not place API keys, database URLs, JWT secrets, or bearer tokens in this repository or in `VITE_*` variables; Vite exposes `VITE_*` values to the browser.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Type-check and build the production bundle |
| `npm run build:original` | Standard TypeScript + Vite build |
| `npm run build:fallback` | Build with the Rollup fallback used by Vercel |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview the built bundle locally |
| `npm run deploy` | Build and invoke `vercel --prod` |

## Configuration and deployment

- Development uses `VITE_BACKEND_SERVER_URL`, with a legacy hardcoded fallback in `src/services/api.ts`.
- Production uses `/api/v1`, relying on the checked-in Vercel rewrite configuration.

`vercel.json` is configured for a Vite build and includes a rewrite to a backend host. Treat that host as deployment-specific infrastructure: verify it is reachable over HTTPS and update it through deployment configuration before publishing. No public live-demo URL is verified in this repository, so none is advertised here.

For production, configure frontend and backend origins explicitly, use HTTPS, and keep secrets only in deployment-provider secret/environment settings. A browser-exposed frontend variable must contain only a public API origin or path.

## Project layout

```text
src/
  components/       UI screens and feature components
  contexts/         authentication context
  services/api.ts   typed Axios API client and token lifecycle
  utils/            roadmap templates and helpers
public/pdfs/        bundled career-guide PDFs
scripts/            build helpers
vercel.json         Vercel build and rewrite configuration
```

## Current status and limitations

- Active prototype/portfolio application rather than a formally versioned release.
- AI recommendations depend on a configured backend, OpenAI availability, and a populated roadmap catalog.
- The assessment prompt asks the model for JSON and validates roadmap IDs, but has no deterministic ranking or offline fallback.
- No automated frontend test suite is present; verify changes with `npm run lint` and `npm run build`.
- The legacy API fallback and current Vercel rewrite should be replaced with an environment-managed HTTPS backend URL before production use.

## Links

- [Frontend repository](https://github.com/TDVamit/Sanjay-CG)
- [Backend repository](https://github.com/TDVamit/sanjay-cg-backend)
