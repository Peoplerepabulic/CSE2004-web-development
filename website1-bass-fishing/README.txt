WEBSITE #1 — Bass Fishing for Beginners

A personal bass-fishing companion site: beginner guide, lure picker,
seasonal patterns, St. Louis-area waters, trip checklist, trip planner,
and a catch log. Everything interactive runs client-side (localStorage);
no accounts, no servers.

Files:
- index.html
- styles.css
- script.js
- bass-fishing.svg (original hero illustration, no longer used on the page)
- images/hero-bass.jpg (free stock photo, credit on the page)
- images/tackle-box.jpg (free stock photo, credit on the page)
- images/angler-bass.jpg (free stock photo, credit on the page)

How to test locally:
1. Put all four files in the same folder.
2. From that folder, run: python3 -m http.server 8000
3. Open http://localhost:8000 in a browser.
4. Test the checklist and form, then refresh the page: the checklist
   and your trip plan should still be there (saved in localStorage).
5. Resize the browser to about 375px wide and check the layout.
6. Open Developer Tools > Console and confirm there are no errors.
7. Check accessibility quickly: tab through the page (a "Skip to content"
   link should appear first) and confirm every control is reachable.

Deployment suggestion:
Use GitHub Pages. Upload these files to a repository, then enable Pages in the repository settings.

Validation:
After deployment, paste the public URL into https://validator.w3.org/
