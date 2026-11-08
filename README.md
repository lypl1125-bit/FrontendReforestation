<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/5d3e3547-9689-4e59-a938-5be57be7a103

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Reforest API data source

The app defaults to bundled demo data (`VITE_DATA_SOURCE="mock"`), which is the safe
setting for production until API mode is intentionally configured. To test against
the local FastAPI service, set `VITE_DATA_SOURCE="api"` in `.env.local`.

- `VITE_API_BASE_URL`: API origin/base path, such as `http://localhost:8000`.
- `VITE_LOTE_ID`: temporary seeded test lot identifier used for diagnosis, map,
  species and project requests. It is not a tenant-wide setting; replace it with a
  lot selector backed by `GET /lotes` when that endpoint is available.
- `VITE_TEST_PROJECT_ID` (optional): seeded project to load while testing the
  project screen. Leave it empty in production; production should select projects
  from the authenticated user's data.

Restart Vite after changing environment variables. The API server must allow the
frontend origin through CORS. API errors are shown in the relevant view; the app does
not silently fall back to mock data when API mode is selected.

The client in `src/services/api.ts` exposes the documented endpoints for basins,
diagnostics, map zones, species/nurseries, and project planning. The mock transport
in `src/services/mockApi.ts` mirrors those endpoints for development without a server.
Projects are created in the API when requested from the project screen; their IDs are
read from the API response. In local testing only, `VITE_TEST_PROJECT_ID` can load a
pre-existing seeded project and its botanical mix and supplies.

The diagnostic map uses the configured base tiles from `GET /mapa/capas` and GeoJSON
zones from `GET /lotes/{lote_id}/zonas-mapa`. Map objectives filter those zone types in
the current view; the API does not yet persist an objective. The API's NDVI route
returns a summary placeholder rather than a raster map layer, so no canopy/NDVI map
option is shown. The zones endpoint does not provide the lot's cadastral boundary.

## Authentication

- `/` is the public landing page.
- `/login` calls `POST /auth/login`; `/register` calls `POST /auth/register`.
- Authenticated API requests send the returned Supabase access token as a bearer token.
- `GET /auth/me` validates saved sessions on startup. The “remember me” option stores
  the access token in local storage; otherwise it is limited to the browser session.
- Registration currently sends only `email`, `password`, and `full_name`, which are
  the fields accepted by the API. If registration returns no access token, the page
  asks the user to confirm the email (if required) and then sign in.
- Logout removes the local token. The API does not currently document a refresh or
  logout endpoint, so an expired access token requires signing in again.

## Lot selection and test data

Until the API exposes `GET /lotes`, `VITE_LOTE_ID` selects one temporary test lot for
requests that require a lot ID. It is not a user or tenant setting, and it does not
create a lot or seed its database records. The API must already contain a lot with
that ID and the related diagnostic/map data for those screens to work.

The species-suggestions endpoint supports a minimum compatibility (`min`) and result
limit (`limit`). Catalog filters for functional groups/ecosystem services are applied
to the fields present in the returned species. The API currently does not document a
species altitude-range field or server-side filters for altitude or ecosystem service;
those require adding the corresponding data/fields to the API response for reliable
filtering on real API data.
