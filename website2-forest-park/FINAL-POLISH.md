# Final polish — November 11, 2026

## Preserved

Vanilla HTML/CSS/JavaScript, all fourteen places and paintings, morning hero, original links, SEO metadata and image alt text, saved-day controls, forecast and cache fallback, local-only data storage, layered decorative scenes. No new runtime dependency or generated raster asset.

## Changed

- Default same-area itinerary, optional wider exploration.
- Suggested visit time blocks, area and access labels; 20/40-minute editorial transfer allowances. These are not measured routes or guaranteed travel times.
- Manual order survives preference changes and forecast refresh. An explicit update action avoids stale-weather exports and silent replacement.
- Reorder/remove keeps keyboard focus near the action; over-budget plans explain the issue and disable export/save until adjusted.
- Tighter helper text, mobile timeline layout and restrained weather-light opacity transition.

Files: dist/index.html, dist/planner-core.mjs, dist/planner.mjs, dist/planner.css; tests/planner.test.mjs, tests/preview.py, tests/accessibility.js; README.md and this report.

## Verification

- 15 Node tests: existing forecast/cache/failure tests plus area grouping, transfer accounting, reordered-budget overflow, time labels and interest/budget/exclusion combinations.
- JavaScript syntax and HTML validation.
- 1440px desktop, 390px and 320px responsive viewports: no horizontal page overflow.
- In-app browser: generation, reorder focus, preserved edits after refresh, explicit update; no captured console errors in final check.
- axe WCAG A/AA checks: no violations in initial and generated planner states; color-contrast had incomplete checks requiring human review. Native Chrome initial-page check also returned no violations, with the same incomplete category.
- Local reduced-motion fixture: decorative world display:none; zero active animation names among Hero descendants. Original poster remains. The fixture bypasses local CSS cache with a QA query string and does not ship.

Local audit reproduction (development only): install axe-core into a temporary folder with npm; pass its axe.min.js path using --axe-js to python3 tests/preview.py --scenario audit --port 4174. Use --scenario reduced for the CSS/matchMedia simulation. The audit UI and all synthetic scenarios live outside dist.

## Limits

No physical phone, full screen-reader audit, Safari/Firefox matrix or OS-level reduced-motion switch was tested. Existing scenic artwork remains an interpretation of the park. Opening hours, reservations and actual travel are checked through original venue links; they are not live inputs. Real-world weather may change, and the site is not an official alert service.
