# Changelog

All notable changes to the UK RAG Portal are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.0] - 2026-01-31

### Added

- **useHidePreviewBanner** hook to hide host-injected "Preview mode" banners via MutationObserver.
- **LoginDialog** component (generic sign-in dialog; replaces Manus-specific dialog).
- **authTypes.ts** for OAuth/session types (replaces manusTypes).
- **docs/DATABASE_CODE_REVIEW.md** documenting MongoDB usage, security, and performance.
- Compound index `{ metricKey: 1, dataDate: -1, recordedAt: -1 }` on `metricHistory` for faster history queries.

### Changed

- **Layout / full-width:** Main content area now uses full window width:
  - `html`, `body`, `#root` set to `width: 100%`, `min-height: 100vh` so the app fills the viewport.
  - **SidebarInset** and main content use `min-w-0` / `w-full` so the main pane fills space to the right of the sidebar.
  - Sidebar wrapper uses `min-w-0 max-w-full` for correct flex behaviour.
- **Auth / Manus removal:**
  - Renamed `manusTypes.ts` → `authTypes.ts`; all imports and comments updated.
  - Renamed `ManusDialog.tsx` → `LoginDialog.tsx` with generic "Sign in" copy.
  - `useAuth` now uses `uk-rag-user-info` in localStorage (replaced `manus-runtime-user-info`).
  - Removed `vite-plugin-manus-runtime` from dependencies and Vite config; removed debug collector and `__manus__` public folder.
  - Removed Manus fallback URL from `server/_core/llm.ts`.
  - Server comments in `storage.ts`, `notification.ts`, `map.ts`, `dataApi.ts` updated to drop Manus references.
- **Database:**
  - `metrics.list` input `category` restricted to an allow-list (enum).
  - `metrics.getById` input validation: `metricKey` min/max length, `historyLimit` capped 1–500.
  - `addMetricHistory` refactored to `findOneAndUpdate` with `upsert: true` (single round-trip).
  - Cache invalidation for metric history updated for new max limit (500).
- **Tests:** All auth-related test mocks use `loginMethod: "password"` instead of `"manus"`.

### Removed

- **Manus:** All references to Manus, `vite-plugin-manus-runtime`, `__manus__/debug-collector.js`, and `manusTypes`.
- **client/public/__manus__/** directory and its contents.

### Fixed

- **useHidePreviewBanner** was referenced in `App.tsx` but not defined; hook added in `client/src/hooks/useHidePreviewBanner.ts` and imported in `App.tsx`.
- Production build no longer depends on removed `vite-plugin-manus-runtime` (server bundle rebuilt with current vite.config).
