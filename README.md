# System Design Fieldnotes

A local, responsive reference for system design. It indexes all 200 topics in the public Fanout system design curriculum across 18 modules. Every topic has an original concise note; the Foundations, APIs, services and protocols, Data modeling and SQL, and NoSQL, partitioning and IDs modules have expanded, research-backed lessons. The lesson names and module structure are used as an index; explanations here are independently written and are not copied from lesson pages.

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

Expanded lessons are authored as Markdown in `src/data/deep/` and include links to primary sources. Lessons without an expanded Markdown file use `src/data/notes.json`; `src/data/notes.tsv` and `src/data/content.tsv` are the editable source text for those concise notes. Curriculum titles and ordering live in `src/data/curriculum.json`. Run `npm run audit:content` to check lesson depth and coverage; `npm run audit:content -- --require-all` additionally requires all 200 expanded lessons.
