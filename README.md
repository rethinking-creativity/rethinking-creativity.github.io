# Rethinking Human Creativity in the Generative AI Era

Website for a meet-up proposed to CHI 2027 (Pittsburgh, PA, May 10–14, 2027).

Live site: https://rethinking-creativity.github.io/

## Structure

- `index.html` — the single page (overview, four questions, format, who should come, organizers, reading list)
- `style.css` — styles, with light and dark themes via `prefers-color-scheme`
- `.nojekyll` — serve the files as-is on GitHub Pages

There is no build step. Edit the files and push to `main`; GitHub Pages serves the repository root.

## Local preview

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Updating after the decision

The hero currently says the meet-up is proposed and under review. Once CHI announces the decision and the
program, update the status box in `index.html` with the session time and room, and after the session add a
section with the four discussion sheets and the synthesis.
