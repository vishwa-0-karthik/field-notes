import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, ChevronDown, ChevronRight,
  Command, Grid2X2, List, Menu, Search, X, Layers3, Compass, CircleHelp,
  Bookmark, ExternalLink
} from 'lucide-react';
import curriculum from './data/curriculum.json';
import notes from './data/notes.json';
import './styles.css';

type Lesson = (typeof curriculum.lessons)[number];
type Note = {
  thesis: string;
  design: string;
  mechanics: string;
  example: string;
  failure: string;
  review: string;
};
type View = 'all' | 'systems' | 'cases';
const allLessons = curriculum.lessons as Lesson[];
const noteMap = notes as Record<string, Note>;
// Vite imports the authored Markdown as plain text; react-markdown renders it without raw HTML.
// https://vite.dev/guide/features.html#glob-import and https://github.com/remarkjs/react-markdown
const lessonFiles = import.meta.glob('./data/deep/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const deepNotes = Object.fromEntries(Object.entries(lessonFiles).map(([path, body]) => [path.split('/').pop()!.replace(/\.md$/, ''), body]));
const lessonBySlug = new Map(allLessons.map((lesson) => [lesson.slug, lesson]));
const moduleById = new Map(curriculum.parts.flatMap((part) => part.modules).map((module) => [module.id, module]));
const moduleSummaries: Record<string, string> = {
  'learning-foundations': 'Clarify the problem, estimate its shape, and choose only the complexity the system needs.',
  'learning-apis-services': 'Set service boundaries, define contracts, and keep communication reliable under load.',
  'learning-data-sql': 'Model durable records and understand the query paths relational databases optimize.',
  'learning-nosql-partitioning': 'Choose data stores, distribute keys, and generate identifiers across machines.',
  'learning-caching-fast-reads': 'Place caches where they help, keep their contents useful, and plan for failure.',
  'learning-distributed-coordination': 'Reason about agreement, clocks, replication, and ownership across nodes.',
  'learning-storage-engines': 'Follow how databases and object stores organize, persist, and retrieve bytes.',
  'learning-async-streams': 'Move work off request paths and handle ordering, retries, and contention.',
  'learning-search-retrieval': 'Build indexes, interpret queries, retrieve candidates, and rank useful results.',
  'learning-analytics-sketches': 'Aggregate event streams and estimate large scale metrics with bounded memory.',
  'learning-realtime-social': 'Deliver messages, live updates, and feeds to large and changing audiences.',
  'learning-geo-matching': 'Find nearby candidates, match supply to demand, and rank recommendations.',
  'learning-media-files': 'Upload, transform, store, and deliver large media and files efficiently.',
  'learning-reliability-ops': 'Observe services, make changes safely, and recover data after failures.',
  'design-services': 'Design service and data systems from requirements through failure behavior.',
  'design-products': 'Work through end-to-end designs for familiar product experiences.',
  'design-operations': 'Connect media pipelines and operational systems to their user-visible goals.',
  'company-cases': 'Study published engineering decisions, constraints, and incident lessons.'
};
const completionKey = 'fieldnotes.completed.v1';

function currentSlug() {
  const match = location.pathname.match(/^\/system\/lesson\/(.+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}
function navigate(path: string) {
  history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0, behavior: 'instant' });
}
function loadCompleted(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(completionKey) || '[]');
    return Array.isArray(value) ? value.filter((item) => typeof item === 'string') : [];
  } catch { return []; }
}
function groupLessons(id: string) { return allLessons.filter((lesson) => lesson.group === id); }
function lessonTitle(lesson: Lesson) { return lesson.title.replace(/^(Design|Case): /, ''); }
function IconMark() {
  return <span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span>;
}

function App() {
  const [slug, setSlug] = useState<string | null>(currentSlug);
  const [completed, setCompleted] = useState<string[]>(loadCompleted);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [filter, setFilter] = useState<View>('all');
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const selected = slug ? lessonBySlug.get(slug) : undefined;
  const selectedIndex = selected ? allLessons.findIndex((lesson) => lesson.slug === selected.slug) : -1;

  useEffect(() => {
    const onPop = () => { setSlug(currentSlug()); setMenuOpen(false); };
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault(); setSearchOpen((open) => !open);
      }
      if (event.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('popstate', onPop);
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('popstate', onPop); window.removeEventListener('keydown', onKey); };
  }, []);
  useEffect(() => {
    if (selected) setExpanded(selected.group);
    document.title = selected ? `${selected.title} — Fieldnotes` : 'System design — Fieldnotes';
  }, [selected]);
  useEffect(() => { localStorage.setItem(completionKey, JSON.stringify(completed)); }, [completed]);

  const searchResults = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return allLessons.slice(0, 8);
    return allLessons.filter((lesson) => `${lesson.code} ${lesson.title} ${moduleById.get(lesson.group)?.title || ''} ${deepNotes[lesson.code] || Object.values(noteMap[lesson.code] || {}).join(' ')}`.toLowerCase().includes(term)).slice(0, 30);
  }, [query]);
  const displayParts = curriculum.parts.map((part) => ({
    ...part,
    modules: part.modules.filter((module) => filter === 'all' || (filter === 'systems' ? +module.number >= 15 && +module.number <= 17 : +module.number === 18))
  })).filter((part) => part.modules.length);
  const toggleComplete = (code: string) => setCompleted((previous) => previous.includes(code) ? previous.filter((item) => item !== code) : [...previous, code]);
  const openLesson = (lesson: Lesson) => { navigate(`/system/lesson/${lesson.slug}`); setSearchOpen(false); setMenuOpen(false); };
  const openOverview = (anchor?: string) => {
    navigate('/system/overview');
    setMenuOpen(false);
    if (anchor) requestAnimationFrame(() => document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' }));
  };

  return <div className="app-shell">
    <header className="topbar">
      <button className="mobile-menu icon-button" aria-label="Open navigation" onClick={() => setMenuOpen(true)}><Menu size={19} /></button>
      <button className="top-brand" onClick={() => openOverview()}><IconMark /><span>Fieldnotes</span><ChevronDown size={13} /></button>
      <div className="top-divider" />
      <span className="top-course"><Layers3 size={16} /> System design</span>
      <ChevronRight className="crumb-chevron" size={14} />
      <span className="top-crumb">{selected ? lessonTitle(selected) : 'Overview'}</span>
      <div className="top-actions"><span className="local-badge"><span className="status-dot" /> Local library</span><button className="search-trigger" aria-label="Search lessons" onClick={() => setSearchOpen(true)}><Search size={17} /><span>Search</span><kbd>⌘ K</kbd></button></div>
    </header>

    {menuOpen && <button className="scrim" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
    <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-scroll">
        <div className="mobile-sidebar-head"><IconMark /><strong>Fieldnotes</strong><button className="icon-button" aria-label="Close navigation" onClick={() => setMenuOpen(false)}><X size={18} /></button></div>
        <button className="roadmap-link" onClick={() => openOverview()}><BookOpen size={15} /> Course roadmap</button>
        <p className="side-label">WORKSPACE</p>
        <nav className="workspace-nav" aria-label="Workspace">
          <button className={!selected ? 'active' : ''} onClick={() => openOverview()}><Compass size={16} /> Overview</button>
          <button onClick={() => { setFilter('systems'); openOverview('curriculum'); }}><Layers3 size={16} /> Real-world systems</button>
          <button onClick={() => { setFilter('cases'); openOverview('curriculum'); }}><Bookmark size={16} /> Case studies</button>
          <button onClick={() => setSearchOpen(true)}><Search size={16} /> Search all topics</button>
        </nav>
        <div className="side-stat"><div><strong>{allLessons.length} lessons</strong><span>across {curriculum.parts.reduce((sum, part) => sum + part.modules.length, 0)} modules</span></div><span className="side-stat-icon"><Grid2X2 size={15} /></span></div>
        <div className="side-modules">
          {curriculum.parts.map((part) => <div key={part.id} className="side-part">
            <p className="side-label">PART {part.number} · {part.title.toUpperCase()}</p>
            {part.modules.map((module) => <div key={module.id}>
              <button className={`module-row ${expanded === module.id ? 'expanded' : ''}`} onClick={() => setExpanded(expanded === module.id ? null : module.id)} aria-expanded={expanded === module.id}>
                <span className="module-num">{module.number}</span>{expanded === module.id ? <ChevronDown size={12} /> : <ChevronRight size={12} />}<span className="module-name">{module.title}</span><span className="module-count">{module.count}</span>
              </button>
              {expanded === module.id && <div className="side-lessons">{groupLessons(module.id).map((lesson) => <button key={lesson.code} className={selected?.code === lesson.code ? 'current' : ''} onClick={() => openLesson(lesson)}><span className="side-lesson-title">{lessonTitle(lesson)}</span>{completed.includes(lesson.code) && <Check size={12} />}</button>)}</div>}
            </div>)}
          </div>)}
        </div>
      </div>
      <div className="sidebar-footer"><div className="progress-bar"><span style={{ width: `${completed.length / allLessons.length * 100}%` }} /></div><span><b>{completed.length}</b> / {allLessons.length} UNDERSTOOD</span></div>
    </aside>

    <main className="main-content">
      {selected ? <div className="lesson-layout">
        <article className="lesson-main">
          <div className="lesson-hero">
            <div className="lesson-breadcrumb"><button onClick={() => openOverview()}>← Overview</button><span>/</span><button onClick={() => openOverview(selected.group)}>Module {selected.code.slice(0, 2)}</button></div>
            <div className="lesson-code">{selected.code}</div>
            <h1>{lessonTitle(selected)}</h1>
            <p>{curriculum.parts.flatMap((part) => part.modules).find((module) => module.id === selected.group)?.title}</p>
          </div>
          <div className="note-card">
            <div className="note-meta"><span>FIELDNOTE {selected.code}</span><span>{deepNotes[selected.code] ? 'EXPANDED RESEARCH NOTE' : 'CONCISE REFERENCE NOTE'}</span></div>
            <div className="diagram-card" aria-label="Design flow illustration"><span>REQUEST</span><div className="diagram-line" /><span className="diagram-node">{selected.title.toLowerCase().includes('database') || selected.title.toLowerCase().includes('storage') ? 'STORE' : selected.title.toLowerCase().includes('search') ? 'INDEX' : 'SYSTEM'}</span><div className="diagram-line" /><span>OUTCOME</span></div>
            {deepNotes[selected.code] ? <div className="note-body article-markdown"><Markdown remarkPlugins={[remarkGfm]}>{deepNotes[selected.code]}</Markdown></div> : <div className="note-body">
              <p className="eyebrow">NOTES</p>
              <p className="lead">{noteMap[selected.code].thesis}</p>
              <h2>Design boundaries</h2><p>{noteMap[selected.code].design}</p>
              <h2>How it works</h2><p>{noteMap[selected.code].mechanics}</p>
              <h2>Worked example</h2><p>{noteMap[selected.code].example}</p>
              <h2>Failure modes</h2><p>{noteMap[selected.code].failure}</p>
              <div className="thinking-box"><CircleHelp size={18} /><div><strong>Design review</strong><p>{noteMap[selected.code].review}</p></div></div>
            </div>}
            <div className="understood-row"><span>Mark this note as understood when you can explain its main tradeoff.</span><button className={completed.includes(selected.code) ? 'understood done' : 'understood'} onClick={() => toggleComplete(selected.code)}>{completed.includes(selected.code) ? <CheckCircle2 size={16} /> : <Check size={16} />}{completed.includes(selected.code) ? 'Understood' : 'Mark understood'}</button></div>
          </div>
          <div className="lesson-navigation">{selectedIndex > 0 && <button onClick={() => openLesson(allLessons[selectedIndex - 1])}><ArrowLeft size={16} /><span><small>PREVIOUS</small>{lessonTitle(allLessons[selectedIndex - 1])}</span></button>}{selectedIndex < allLessons.length - 1 && <button className="next" onClick={() => openLesson(allLessons[selectedIndex + 1])}><span><small>NEXT</small>{lessonTitle(allLessons[selectedIndex + 1])}</span><ArrowRight size={16} /></button>}</div>
        </article>
        <aside className="lesson-aside"><div className="aside-card"><p className="eyebrow">IN THIS MODULE</p><strong>{curriculum.parts.flatMap((part) => part.modules).find((module) => module.id === selected.group)?.title}</strong><div className="aside-links">{groupLessons(selected.group).map((lesson) => <button key={lesson.code} className={selected.code === lesson.code ? 'active' : ''} onClick={() => openLesson(lesson)}><span>{lesson.code}</span>{lessonTitle(lesson)}{completed.includes(lesson.code) && <Check size={12} />}</button>)}</div></div><div className="aside-source">Independent notes organized against the <a href="https://fanout.sh/system/overview" target="_blank" rel="noreferrer">public Fanout curriculum <ExternalLink size={12} /></a>.</div></aside>
      </div> : <div className="overview">
        <section className="overview-hero"><div><p className="hero-kicker">THE SYSTEM DESIGN LIBRARY</p><h1>Learn system design from <em>first principles.</em></h1><p className="hero-sub">{Object.keys(deepNotes).length} expanded research notes and {allLessons.length - Object.keys(deepNotes).length} concise notes across all {allLessons.length} topics.</p></div><div className="hero-art" aria-hidden="true"><div className="art-layer layer-back" /><div className="art-layer layer-middle" /><div className="art-layer layer-front"><span>system<br />design</span><span className="art-dots">···</span></div></div></section>
        <div className="progress-callout"><div className="callout-left"><span className="callout-icon"><CheckCircle2 size={18} /></span><div><strong>Track what you understand.</strong><span>Your progress stays in this browser.</span></div></div><div className="callout-right"><span>{completed.length} of {allLessons.length} notes understood</span><button onClick={() => openLesson(allLessons.find((lesson) => !completed.includes(lesson.code)) || allLessons[0])}>Continue learning <ArrowRight size={15} /></button></div></div>
        <section className="structure-card"><div className="section-top"><p className="eyebrow">CURRICULUM STRUCTURE</p><span>18 MODULES / 200 NOTES</span></div><div className="module-grid">{curriculum.parts.flatMap((part) => part.modules).map((module) => <button key={module.id} onClick={() => document.getElementById(module.id)?.scrollIntoView({ behavior: 'smooth' })}><span className="grid-number">{module.number}</span><span className="grid-name">{module.title}</span><ArrowRight size={14} /><small>{module.count} NOTES</small></button>)}</div></section>
        <section className="curriculum" id="curriculum"><div className="curriculum-heading"><div><p className="eyebrow">FULL CURRICULUM</p><h2>Every topic, in one place.</h2></div><button className="inline-search" onClick={() => setSearchOpen(true)}><Search size={16} /> Search notes <kbd>⌘ K</kbd></button></div><div className="curriculum-controls"><div className="filter-group" aria-label="Filter curriculum"><button className={filter === 'all' ? 'selected' : ''} onClick={() => setFilter('all')}>All <span>200</span></button><button className={filter === 'systems' ? 'selected' : ''} onClick={() => setFilter('systems')}>Real-world systems <span>21</span></button><button className={filter === 'cases' ? 'selected' : ''} onClick={() => setFilter('cases')}>Case studies <span>5</span></button></div><div className="layout-group" aria-label="Layout"><button aria-label="Grid layout" className={layout === 'grid' ? 'selected' : ''} onClick={() => setLayout('grid')}><Grid2X2 size={16} /></button><button aria-label="List layout" className={layout === 'list' ? 'selected' : ''} onClick={() => setLayout('list')}><List size={17} /></button></div></div>
          {displayParts.map((part) => <div className="part-section" key={part.id}><div className="part-label">PART {part.number} <span>·</span> {part.title.toUpperCase()}</div>{part.modules.map((module) => <section className="lesson-section" id={module.id} key={module.id}><div className="module-heading"><div><span>{module.number}</span><h3>{module.title}</h3></div><p>{moduleSummaries[module.id] || module.summary}</p></div><div className={`lesson-grid ${layout === 'list' ? 'as-list' : ''}`}>{groupLessons(module.id).map((lesson) => <button className="lesson-tile" key={lesson.code} onClick={() => openLesson(lesson)}><span className="tile-code">{lesson.code}</span><span className="tile-symbol" aria-hidden="true">{+module.number >= 15 ? '◇' : ['◈','○','⌁','▥','✧','⋈'][+module.number % 6]}</span><strong>{lessonTitle(lesson)}</strong><span className="tile-bottom">{completed.includes(lesson.code) ? <><CheckCircle2 size={14} /> UNDERSTOOD</> : <>READ NOTE <ArrowRight size={14} /></>}</span></button>)}</div></section>)}</div>)}
        </section><footer className="page-footer">Independent personal fieldnotes · Topics mapped from the <a href="https://fanout.sh/system/overview" target="_blank" rel="noreferrer">Fanout system design curriculum <ExternalLink size={12} /></a>.</footer>
      </div>}
    </main>
    {searchOpen && <div className="search-overlay" role="presentation" onMouseDown={() => setSearchOpen(false)}><div className="search-dialog" role="dialog" aria-modal="true" aria-label="Search lessons" onMouseDown={(event) => event.stopPropagation()}><div className="search-input-row"><Search size={19} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search 200 system design notes..." aria-label="Search lessons" /><button aria-label="Close search" onClick={() => setSearchOpen(false)}><X size={18} /></button></div><div className="search-results"><p className="eyebrow">{query ? `${searchResults.length} RESULTS` : 'START HERE'}</p>{searchResults.length ? searchResults.map((lesson) => <button key={lesson.code} onClick={() => openLesson(lesson)}><span>{lesson.code}</span><strong>{lessonTitle(lesson)}</strong><ArrowRight size={15} /></button>) : <div className="no-results">No matching notes. Try a broader term.</div>}</div><div className="search-foot"><Command size={13} /> K to search <span>ESC to close</span></div></div></div>}
  </div>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
