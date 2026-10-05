# System Design Fieldnotes

A local, responsive reference for system design. It indexes all 200 topics in the public Fanout system design curriculum across 18 modules. Every topic has an original, research-backed expanded lesson, written independently from the source pages. The lesson names and module structure are used as an index; the explanations are not copied from lesson pages.

## Run locally

```sh
npm install
npm run dev
```

Open the local address printed by Vite (usually `http://127.0.0.1:5173`). To create a production build, run `npm run build`.

## Features

- Overview of all 200 topics and their 18 modules
- Search across topic names and note text (`⌘K` / `Ctrl+K`)
- Filter to system designs or case studies; switch grid and list layouts
- Lesson navigation and module sidebar
- Local reading progress stored in this browser
- Responsive desktop and mobile layouts

Expanded lessons are authored as Markdown in `src/data/deep/` and include source links. `src/data/notes.json`, `src/data/notes.tsv`, and `src/data/content.tsv` hold the concise index notes. Curriculum titles and ordering live in `src/data/curriculum.json`. Run `npm run audit:content -- --require-all` to check lesson depth and require all 200 expanded lessons. The full-text index is generated into `public/deep-search.json` and loaded only when search opens.
