# Forest Park field notes — Website #2

A weather-aware, single-page outing planner for fourteen real places in Forest Park, St. Louis. The existing hand-painted guide has been upgraded in place: vanilla HTML, CSS and JavaScript, no framework migration, build step, account, API key or runtime dependency.

## Run and verify

```sh
python3 -m http.server 4173 --directory dist
# Open http://127.0.0.1:4173/
node --test tests/planner.test.mjs
node --check dist/app.js
node --check dist/cinema.js
node --check dist/planner.mjs
node --check dist/planner-core.mjs
npx --yes --package html-validate html-validate dist/index.html
```

The HTML validator uses recommended rules. Four conventions are allowed in `.htmlvalidate.json`: lowercase doctype, HTML-compatible trailing slashes on void elements, explicit `for` on wrapping labels, and shared checkbox names for a multi-select group. These are formatting or valid form conventions, not suppressed missing labels or structural errors. Prettier formats the implementation. Dependencies for validation are development tools only; they are not shipped to the browser.

## A coherent three-API experience

| API                              | Type                          | Purpose                                                                                                                                 | Failure/degradation                                                                      |
| -------------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Open-Meteo Forecast API          | External data                 | Hourly temperature, apparent temperature, precipitation probability, weather code, clouds, wind and daylight for fixed park coordinates | 12-second timeout; validation; retry; timestamped saved forecast; interest-only fallback |
| Web Storage API (`localStorage`) | Browser                       | Remember the itinerary, preferences, last saved planning reference and recent weather                                                   | Catch blocked storage/quota/corrupt JSON; keep working in memory; offer download         |
| Intersection Observer API        | Browser                       | Reveal sections and pause painted scenes when outside the viewport                                                                      | Content remains visible and usable when unsupported; reduced-motion static alternative   |
| Blob and Object URL APIs         | Additional browser capability | Export the suggested plan with reasons, source links, timestamp and timing caveats                                                      | Local file creation, no upload; object URLs revoked after use                            |

The APIs work together: external weather changes the recommendation rules and optional scene atmosphere; preferences and the resulting day can be retained locally; only visible animated scenes run; the visitor can take the plan away as a text file. The fixed park coordinates do not identify the visitor. No geolocation or notification permission is requested, so there is no unused permission prompt to deny. Storage denial is explicitly handled and tested.

## Interaction

1. Use **Plan with the forecast** or **Plan a day**.
2. Choose today/tomorrow, a future start time in St. Louis, one/two/four hours and any interests.
3. Inspect the forecast for the entire selected window, including hourly values, retrieval time and whether it came from cache.
4. Generate suggestions with a reason and time block for each stop. Reorder, remove, restore, inspect venue details and official access links. Changing preferences or refreshing weather preserves edits and asks you to explicitly update suggestions before saving. Keyboard focus stays with edited controls.
5. Add suggestions to the existing saved day without replacing earlier choices, or download the suggestion directly. Saved notes can still be reordered, removed and downloaded using the original controls.
6. Optionally let the forecast color the layered scene. Manual morning/golden/dusk buttons turn this option off. The art is an interpretation, never a claim of live visual conditions.

## Recommendation rules and limits

Rules are deterministic, inspectable and tested in `dist/planner-core.mjs`. Match interests first. Prefer verified indoor visit options (museum exhibitions or a booked planetarium show) for precipitation or uncomfortable temperature; favor woodland shade in heat. Penalize exposed outdoor stops for wind or darkness. For storm/icing, wind at least 30 mph, apparent temperature at least 100°F or at most 10°F, exclude outdoor suggestions and advise reconsidering the outing. These editorial thresholds are not official alerts or safety guarantees.

The outdoor Jewel Box gardens and The Muny are not indoor rain shelters. The Muny remains in the fourteen-place guide but is excluded from automatic plans because no performance schedule is supplied. Golf visits are suggested blocks, not promises of a complete round. Reservations, equipment, accessibility and opening hours must be checked with each venue.

Each stop retains its original visit duration. By default, the planner stays in one editorial park area; visitors can uncheck this preference to explore more widely. It fits up to three stops within the budget and reserves 20 minutes within an area or 40 minutes between areas as **editorial planning allowances, not measured journey times**. Suggested time blocks, area labels and remaining time make the schedule reviewable. Reordering recalculates allowances; an over-budget plan cannot be saved or downloaded. This is not a walking route or route optimizer. The remaining time is shown honestly; longer actual travel can require fewer stops. Weather uses the whole chosen time window, not a forecast only for the first stop.

Unix timestamps are formatted with `America/Chicago`, independently of the visitor’s timezone and with daylight-saving handling. Inputs exclude elapsed start hours. Partial weather windows and null values produce an explicitly unweathered recommendation, not invented zeroes. Cached forecasts are reused for 30 minutes; after a failed refresh, validated cache up to 24 hours old may be displayed with a saved/not-latest notice. Older or wrong-date cache is never presented as a complete forecast. Revisiting the tab refreshes old forecasts. No continuously polling background service.

## Sources and privacy

Weather documentation: https://open-meteo.com/en/docs . Attribution is visible beside the forecast. Requests send only fixed Forest Park coordinates and forecast parameters; no account, device location or saved preferences. The provider and host can receive normal connection metadata. All user choices remain in browser storage or memory.

Places remain the curated original collection with official source links in their details. Representative sources: https://www.forestparkforever.org/picnic-spots, https://www.forestparkmap.org/, https://www.forestparkmap.org/alerts. Illustrations are original artistic interpretations, not geographic navigation maps or evidence of present conditions.

## Testing and a short classroom demonstration

Fifteen Node tests cover park timezone/DST, weather units/nulls/missing hours, rain-vs-indoor rules, severe-weather exclusions, interest/budget fitting, manual fallback, caching, HTTP failure, corrupt/expired cache, storage denial and timeout. UI checks cover live data, preference persistence, suggestion ordering/removal/restoration, detail dialog + Escape focus return, append-to-day, download content, mobile overflow, forecast atmosphere and manual override.

Local-only test server (not deployed):

```sh
python3 tests/preview.py --scenario recover --port 4174
python3 tests/preview.py --scenario storm --port 4175
python3 tests/preview.py --scenario denied --port 4176
```

Each serves the real UI with a conspicuous **LOCAL QA · TEST SCENARIO** banner. `recover` fails the first request then succeeds on Retry. `storm` supplies thunderstorm conditions to test outdoor exclusions and empty results. `denied` makes storage unavailable. Use an unused port or clear that local origin’s test storage if you want to repeat a first-load scenario; a fresh cached result intentionally bypasses the request. Do not use these synthetic forecasts for real outings.

For a two-minute demonstration: select a future window and interests; show the weather and explanations; reorder a stop; add to the saved day and reload; download notes; then demonstrate the isolated failure/retry preview. Explain which external and browser APIs make each part work.

Verification limits: live UI was checked in the supplied browser at desktop and mobile viewport widths. No physical-phone or full cross-browser lab, no official weather-alert integration, and no live opening-hours/reservation service. Reduced-motion was verified through a local source fixture that activates the existing CSS rules and matchMedia branch: the decorative world was hidden and no Hero animations remained. This is not an OS-level preference or physical-device test. Chrome received a basic load and axe check; it was not a full independent interaction matrix. See FINAL-POLISH.md for this round’s evidence.

## AI assistance and design decisions

OpenAI Codex assisted with code, original raster illustrations, debugging and tests. The user directed the Forest Park focus, fixed real places, hand-painted art direction, exact palette, preservation requirements and motion behavior. The weather upgrade was chosen to restore the assignment’s API requirements while keeping the site focused. No AI service generates live recommendations: explicit local rules explain every suggestion. All existing artwork prompts and attribution remain in `ARTWORK.md`; no new raster images were generated for this upgrade. The earlier `CINEMATIC-UPGRADE.md` is a historical record of the visual-only revision; this README describes the current weather-enabled version.

## Design and assets

Applied the requested design skill: https://github.com/elayadesign/ai-design-skills (landing-page-design), including its redesign companion. Art direction: pastoral Japanese animation backgrounds, watercolor/gouache greenery, cream paper, quiet movement, and unhurried editorial copy.

`dist/assets/forest-hero.jpg` was created with OpenAI's built-in image generation tool, then converted to JPEG. The full prompt:

> Use case: illustration-story. Create a wide landscape website hero illustration, 3:2 aspect ratio, no text. Forest Park in St. Louis, view across the Grand Basin with its pale fountain jets toward the grassy Art Hill and distant low classical Saint Louis Art Museum, not a castle. Hand-painted Japanese animated feature background, lyrical and pastoral, delicate watercolor and gouache textures, lush layered green trees framing left and right, warm cream sunlight, pale turquoise sky, generous billowing clouds, soft olive shadows, a winding footpath and tiny seated picnickers near the lake. Gentle sense of wonder and summer nostalgia reminiscent of Hayao Miyazaki animation backgrounds. Extremely beautiful detailed painterly environment, not flat vector, not 3D, no existing fictional characters. Landscape image fills the frame; sky occupies top half with uncluttered left sky for website heading overlay. No words, letters, logos, borders, watermark.

Fourteen raster paintings replace the original SVG vignettes. See ARTWORK.md for the complete prompt set. Assets are in dist/assets/places; new sunset and dusk art is in dist/assets. Animated layers use only transform and opacity, pause offscreen, and honor reduced motion. Font: Manrope (SIL Open Font License). Icons: Phosphor Icons (MIT). Both are bundled locally. License texts are in dist/assets.
