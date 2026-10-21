# Computer Science — Susana Rojas

Open `docs/index.html` in Chrome. Press **F** for full screen.

## Moving through it
- **Scroll** (mouse wheel or trackpad) moves freely, like a website.
- **→ / ↓ / Space / PageDown** jumps to the next stop. Presentation clickers work too.
- **← / ↑ / PageUp** goes back.
- The dots on the right jump to any section.
- **N** shows speaker notes (with sources for the Netflix numbers). **H** hides the yellow placeholder boxes.

## Two looks
- **Dark sections** (`data-mode="fun"`): particles, motion, the personal parts.
- **Paper sections** (`data-mode="learn"`): calm, big, readable, for the information.

## Editing text
All the text is in `docs/index.html`. Every placeholder has been filled in. If you add a new one, wrap it in `<span class="fill">…</span>` so it's highlighted until you replace it.

## Photos (in `docs/photos/`)
Already added from your site: `me.jpg`, `formation-netflix.jpg`, `moodmatcher.jpg`, `island.jpg`, `fifa.jpg`, `handtracker.jpg`.
The Netflix slide (section 7) uses `nf-25.jpg`, `nf-building.jpg`, `nf-dream-team.jpg` and `nf-photobooth.jpg`. The My path slide (section 6) uses `init-logo.png`, `island.jpg` and `fifa.jpg`. To swap a graphic for a photo, add `path-undecided.jpg`, `path-criminal.jpg`, `path-finance.jpg` or `path-backend.jpg`. Other `nf-*.jpg` photos are kept in case you want them back.

## Particle shapes
Each dark section picks a shape with `data-shape`: `sphere`, `ring`, `wave`, `helix`, `galaxy`, `rows`, or `text:ANY`.
`data-px="0.25"` shifts it sideways, and `data-dim="0.4"` makes it fainter.
