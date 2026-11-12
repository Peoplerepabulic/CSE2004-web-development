# In-place cinematic visual upgrade

## Preserved
Original buildless HTML/CSS/JavaScript stack (no package.json or build script exists), page structure, all visible text, title/description/OG, alt text, accessibility labels, IDs, anchors, external links, place data and application logic. app.js changes only replace image suffixes with WebP. Morning artwork is the same image, compressed; original JPEG and OG URL remain.

## Four stages
1. Palette derived from the supplied colors, existing rounded Manrope retained, no new fonts or remote dependencies. Solid paper navigation replaces blur/glass.
2. Hero layers: original opaque painted poster; static blue atmospheric distance; two transparent cloud layers at 90/120 seconds; irregular leafy branch; occasional original bird silhouettes; two grass/flower waves; slow sunlight/shadow layer; two floating seeds. SVGs are original code, not generated raster or film assets. Layered animation is an artistic overlay, not a video.
3. Paper grain, consistent card image ratios and 20px control icons, paper panels, warm colored shadows, WebP conversions. No new location or fictional building added.
4. Pointer parallax uses bounded requestAnimationFrame and transforms. Scroll depth uses CSS view timelines with no scroll event listener. Section reveals retain IntersectionObserver at 800ms. Animation properties are transform/opacity only. Paused or offscreen scenes stop; mobile hides four layers and one seed; reduced motion hides the decorative stack and shows the unchanged poster, with no loops.

## Asset inventory
- assets/scenery/clouds.svg: original gently irregular cream clouds.
- distance.svg: translucent blue atmospheric horizon.
- leaves.svg: original green foreground branch.
- grass.svg: original grass and yellow wildflower shapes, rendered in two phased layers.
- birds.svg: original small countryside bird silhouettes.
- paper.svg: subtle static paper grain.
- 17 WebP derivatives: three existing hero illustrations and fourteen existing place paintings. Card images bounded to 960px, heroes to 1440px. Original JPEGs retained for old references and unchanged OG metadata.

No new AI raster artwork was generated in this revision. SVG art brief: original summer countryside, soft irregular silhouettes in the user palette, cream cumulus clouds, translucent distant terrain, green leafy edges, slender grass and restrained yellow wildflowers, no existing characters, names or film frames. Existing raster prompts remain in ARTWORK.md.

## Validation and limits
Each stage ran JavaScript syntax/resource checks (there is no framework build). Desktop 1440 and mobile 390 screenshots are in outputs/cinematic-checks. Automated preservation check compares visible text, metadata, alt, anchors, IDs and accessibility labels, and verifies application logic changed only image paths.

CSS view timelines are progressive enhancement: unsupported browsers retain pointer parallax and ambient motion, without scroll depth. No automatic video. No new forms, routes, loading workflows or errors introduced: original empty/error states and logic retained. Native SVG terrain is a subtle decorative horizon, not a geographic map. No cross-browser/device lab available; verification covers the supplied browser and CSS fallback inspection.

## Files changed
- dist/index.html: decorative aria-hidden scene stack, new visual stylesheet/script, WebP hero path.
- dist/app.js: image suffix replacements only; existing application logic retained.
- dist/cinema.css and dist/cinema.js: all new appearance, motion and lifecycle behavior.
- dist/assets/scenery/*.svg and 17 WebP derivatives: local optimized visual assets.
- CINEMATIC-UPGRADE.md: this inventory and verification record.

## Final browser verification
1440×900 desktop and 390×844 mobile: no horizontal overflow. All three lighting illustrations load. Wildlife filter returns Saint Louis Zoo. Manual motion pause and fully offscreen Hero pause both report paused animations. No captured browser console errors. Empty hero image slots before their first mood selection are intentional lazy loading, not failed requests. Early stage screenshots were recaptured at correct dimensions using isolated stage stylesheets; final screenshots include the final softened foreground polish.

Reduced-motion behavior was checked in CSS, not through OS-level emulation. Cross-browser CSS scroll-timeline behavior and physical touch-device performance remain untested. Unsupported scroll timelines omit scroll parallax. The retained buildless project has no build command; JavaScript syntax checks, local asset checks, browser QA and source-preservation checks passed instead.
