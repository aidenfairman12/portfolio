'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Github,
  Linkedin,
  Mail,
  ExternalLink,
  FileDown,
  Truck,
  BarChart2,
  Map,
  Database,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Brain,
  Layers,
  FlaskConical,
} from 'lucide-react'

// ─── Config — fill these in before publishing ────────────────────────────────

const ME = {
  name:     'Aiden Fairman',
  title:    'Bioinformatician / Computer Scientist',
  tagline:  'I build data-driven tools at the intersection of computational biology and software engineering, ' +
            'and occasionally wherever else interesting problems take me.',
  email:    'aidenfairman12@gmail.com',
  github:   'https://github.com/aidenfairman12',
  linkedin: 'https://linkedin.com/in/aiden-fairman-8300b1204',
  resume:   '/resume.pdf',
}

const PROJECTS = [
  {
    key:         'freightflow',
    name:        'FreightFlow',
    year:        '2025',
    type:        'Solo project',
    status:      'Live' as const,
    description: 'A US freight supply chain intelligence platform. Pick a finished product: ' +
                 'automobiles, beef, pharmaceuticals, or steel. Select an assembly hub, and ' +
                 'visualise how precursor materials flow across America\'s freight network to ' +
                 'reach it. Includes cost modelling, mode analysis, and concentration risk ' +
                 'scoring based on 522k real freight records from the Bureau of Transportation ' +
                 'Statistics.',
    liveUrl:     'https://af-freight-flow.vercel.app/',
    githubUrl:   'https://github.com/aidenfairman12/FreightFlow',
    tech:        ['Next.js 14', 'TypeScript', 'Python', 'PostgreSQL', 'Leaflet', 'Recharts', 'Tailwind CSS', 'Vercel'],
    highlights: [
      { icon: Map,       label: 'Interactive Map',    desc: 'Weighted freight-flow lines across US corridors' },
      { icon: BarChart2, label: 'Concentration Risk', desc: 'Top-3 supplier concentration scored across 4 supply chains' },
      { icon: Database,  label: 'FAF5 Data',          desc: '522k freight flow records from BTS/FHWA (2022)' },
    ],
  },
]

const CASE_STUDY = {
  intro: [
    'I wanted to understand how supply chains work, specifically in the geographic dimension: which regions feed which industries, and how fragile those connections are. The U.S. federal government publishes detailed records of every major freight flow across the country in a 2 million row spreadsheet. I built a tool to make it explorable: pick a finished product, see where its raw materials come from, how concentrated those sources are, and what happens if a key region goes offline.',
    'The app lets you pick between 4 diverse supply chains tracked to a primary US assembly hub: automobiles, beef, pharmaceuticals, and steel. For each product, you can explore which raw materials feed it, where they originate geographically, and what share of total input each source zone contributes. You can also simulate disruptions: select one or more source zones and see the resulting tonnage gap and estimated cost impact. A separate view identifies the most systemically critical source zones, whose disruption would ripple across multiple supply chains simultaneously.',
  ],
  methodology: [
    'The data comes from the Freight Analysis Framework (FAF5 v5.7.1), published by the Bureau of Transportation Statistics and the Federal Highway Administration. FAF5 covers domestic freight flows between 132 geographic zones across the US, with records for commodity type, transport mode, origin, destination, tonnage, and value. The dataset contains 522,000 domestic flow records for 2022.',
    'To model each supply chain, I identified the key precursor commodity types for each finished product and pulled the corresponding FAF5 freight flows into the headline assembly zone. For automobiles, the relevant commodity categories — base metals, plastics and rubber, electronics, chemicals, and glass — were selected based on material composition data from the American Chemistry Council\'s Chemistry and Automobiles: Driving the Future (2024). For pharmaceuticals, no equivalent public source exists; drug formulations are proprietary and vary widely by product, so the precursor categories used are rough approximations based on general industry knowledge. The geographic flow patterns shown are real FAF5 data; the commodity selection for pharmaceuticals should be understood as illustrative rather than precise.',
    'Concentration risk is calculated as the percentage of a product\'s primary precursor tonnage that flows into the headline assembly zone from just the top three source zones. A high percentage means a small number of regions are responsible for the majority of supply, indicating fragility.',
    'The Critical Nodes score takes a broader view. Rather than looking at one supply chain in isolation, it measures what share of total modelled precursor tonnage across all four supply chains a given source zone supplies. A zone that feeds multiple supply chains in large quantities scores higher. Intra-zone flows are excluded from this calculation, because those flows don\'t represent a genuine external dependency and would artificially inflate scores for large industrial zones.',
    'Two of the four supply chains warrant a note on scope. Beef is modelled as a raw commodity rather than a manufactured product; the analysis tracks where beef is produced and shipped from, not upstream feed or agricultural inputs. Steel is treated as a precursor material in its own right: the app tracks flows of base metal into the automobile assembly zone rather than modelling the steelmaking process itself. These are intentional simplifications — the FAF5 commodity codes align more cleanly with these materials as freight categories, and the geographic concentration story is more meaningful at the level of where the material ships from.',
  ],
  decisions: [
    {
      title: 'Static pre-computed data over a live backend',
      body: 'Rather than running a database and API server at runtime, all supply chain analysis is pre-computed into static JSON files that the frontend loads directly. This means the app runs for free on Vercel with no infrastructure to maintain, loads instantly, and has no moving parts that can fail. The tradeoff is that updating the data requires re-running the precompute script, which is acceptable for a dataset that updates annually.',
    },
    {
      title: 'Aggregating FAF5 metro zones',
      body: 'FAF5 splits some metro areas across state lines; Chicago, for example, appears as separate Illinois and Indiana zones. Left uncorrected, this made Chicago show up as two different assembly locations. The solution was to remap those zone IDs to a single "Chicago Metro" entry before processing, which produces a more accurate and readable result.',
    },
    {
      title: 'Excluding intra-zone flows from Critical Nodes',
      body: 'When calculating which source zones pose the greatest systemic risk, flows where a zone supplies itself were excluded. Without this, large industrial zones like Detroit would appear as top critical nodes simply because they consume their own output — which isn\'t a supply chain vulnerability.',
    },
  ],
  nextSteps: [
    {
      title: 'Source better BOM data for pharmaceuticals',
      body: 'The pharmaceutical precursor categories are rough approximations. Ideally these would be grounded in a published source the way the automobile inputs are grounded in ACC material composition data. No clean public source currently exists for this, but FDA API sourcing reports or academic literature on drug manufacturing inputs could improve it.',
    },
    {
      title: 'Improve the disruption model',
      body: 'The current simulator calculates a simple tonnage gap when a zone goes offline. A more realistic model would account for partial substitution — the ability of other source zones to absorb some of the shortfall — and would model lead times and inventory buffers. This would move the simulator from illustrative to genuinely analytical.',
    },
    {
      title: 'Mode-level breakdown on the map',
      body: 'FAF5 records transport mode: truck, rail, water, pipeline. Visualizing which corridors are truck-dependent versus rail-dependent would add another dimension to the fragility analysis, since mode concentration is itself a vulnerability.',
    },
  ],
}

// ─── FreightSignal data ───────────────────────────────────────────────────────

const FREIGHT_SIGNAL = {
  name:        'FreightSignal',
  year:        '2025',
  type:        'Solo project',
  status:      'Research' as const,
  description: 'A supply chain disruption intelligence system built on retrieval-augmented generation. ' +
               'Ask a natural-language question about what\'s affecting freight markets; the system ' +
               'retrieves the most relevant chunks from a live corpus of logistics news, passes them to ' +
               'an LLM, and returns a grounded answer with full source attribution. Built entirely on ' +
               'open-source models — no OpenAI dependency.',
  githubUrl:   'https://github.com/aidenfairman12/FreightSignal',
  tech:        ['Python', 'FastAPI', 'Next.js 14', 'Chroma', 'sentence-transformers', 'Groq / Llama 3.1', 'RAGAS', 'Vercel'],
  highlights: [
    { icon: Layers,       label: 'Retrieve-then-rerank',   desc: 'Bi-encoder first pass (top 20) → cross-encoder reranker → top 5 chunks' },
    { icon: FlaskConical, label: 'RAGAS evaluation',        desc: 'Systematic pipeline scoring across 50 synthetic QA pairs with LLM-as-judge' },
    { icon: Brain,        label: 'Open-source stack',       desc: 'BAAI/bge-small + bge-reranker + Llama 3.1 8B — no proprietary model dependency' },
  ],
}

const FREIGHT_SIGNAL_CASE_STUDY = {
  intro: [
    'Most RAG tutorials stop at cosine similarity search → LLM call. FreightSignal was built to go one step further on two fronts: retrieval quality and evaluation rigour. The goal was to build something I could actually measure, not just demo.',
    'The system ingests RSS feeds from five logistics publications, chunks and embeds new articles into a Chroma vector store, and serves queries through a FastAPI backend. At query time, a user\'s question is embedded, the top 20 candidate chunks are retrieved by approximate nearest-neighbour search, then a cross-encoder reranker scores each query-chunk pair together and selects the final top 5. The reranked context is passed to Llama 3.1 8B via Groq, which generates a grounded answer with source metadata.',
  ],
  decisions: [
    {
      title: 'Retrieve-then-rerank rather than retrieval alone',
      body: 'A bi-encoder encodes the query and each document independently — fast, but it misses fine-grained query-document interactions. A cross-encoder reads both together, which is more accurate but too slow to run against the full corpus. The standard solution is to use the bi-encoder for a fast first-pass over 20 candidates, then apply the cross-encoder to rerank to 5. This is the pattern most RAG implementations skip.',
    },
    {
      title: 'Fully open-source model stack',
      body: 'BAAI/bge-small-en-v1.5 scores within ~2 points of OpenAI\'s ada-002 on the MTEB leaderboard at 33 MB vs ~1.5 GB for the large variant — small enough to run on CPU in CI and on Render\'s free tier. The reranker (bge-reranker-base) and generation model (Llama 3.1 8B via Groq) are also open weights. No proprietary API dependency for the core pipeline.',
    },
    {
      title: 'Evaluation with RAGAS rather than manual inspection',
      body: 'Most RAG demos are evaluated by eyeballing a few outputs. RAGAS uses an LLM as a judge to score four pipeline properties systematically across a held-out synthetic test set of 50 QA pairs. Context precision and recall both scored 1.0, confirming the retrieve-then-rerank pipeline is selecting relevant chunks. Answer relevancy scored 0.917. Faithfulness scored 0.0 — a documented limitation of using smaller open-source models as LLM judges, not a reflection of generation quality, and discussed honestly in the README.',
    },
  ],
  nextSteps: [
    {
      title: 'Use a dedicated NLI model for faithfulness evaluation',
      body: 'The 0.0 faithfulness score is a known failure mode of using a small LLM as a judge for claim verification. Replacing the LLM judge with a dedicated natural language inference model (e.g., cross-encoder/nli-deberta-v3-base) would give a more reliable faithfulness signal independent of generation model quality.',
    },
    {
      title: 'Domain-specific embedding fine-tuning',
      body: 'The off-the-shelf BGE embeddings are general-purpose. Fine-tuning on logistics/supply-chain text pairs — using the existing corpus to generate hard negatives — would likely improve retrieval quality for domain-specific terminology.',
    },
    {
      title: 'Human-labelled evaluation set',
      body: 'The synthetic QA pairs were generated by prompting the LLM to write realistic questions from held-out articles. A small human-labelled set would give a ground-truth baseline to compare against and validate whether the LLM-generated pairs are representative.',
    },
  ],
}

const SKILLS = [
  { category: 'Programming',    items: ['Python', 'R', 'SQL', 'JavaScript', 'Bash'] },
  { category: 'Technical',      items: ['Machine Learning', 'Full-stack Web Dev', 'RESTful APIs', 'Git', 'Bioinformatics Tools'] },
  { category: 'Analytical',     items: ['Data Analysis & Visualization', 'Pipeline Architecture', 'Workflow Design & Standardization'] },
  { category: 'Collaboration',  items: ['Agile / Scrum', 'Cross-functional Teams', 'Stakeholder Communication', 'Parallel Workload Management'] },
]

const ABOUT_PARAGRAPHS = [
  'I studied Computer Science at Boston University before pursuing a Master\'s in Bioinformatics ' +
  'and Computational Biology at the University of Bern. I currently work part-time as a ' +
  'Computational Biology Consultant at Novo Nordisk, while finishing my Master\'s, applying computational methods to biological ' +
  'research problems.',
  'I\'m drawn to problems that sit at the intersection of data and complex systems — spatial ' +
  'alignments, pathway modeling, and finding where bottlenecks emerge in large-scale pipelines. ' +
  'FreightFlow grew out of that same instinct applied to supply chain networks. Machine learning ' +
  'is the next direction I\'m actively building toward, both within computational biology and beyond.',
  'Outside of work I enjoy travelling, skiing, and exploring nature.',
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function TechBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-sky-500/25 bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-300">
      {label}
    </span>
  )
}

function SkillGroup({ category, items }: { category: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-5">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">{category}</p>
      <ul className="space-y-1.5">
        {items.map(item => (
          <li key={item} className="flex items-center gap-2 text-sm text-slate-300">
            <span className="h-1 w-1 shrink-0 rounded-full bg-sky-400/60" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function CaseStudySection() {
  const [open, setOpen] = useState(false)

  return (
    <div className="mt-6 border-t border-slate-700/50 pt-6">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="text-sm font-semibold text-slate-300">Case Study</span>
        {open
          ? <ChevronUp className="h-4 w-4 text-slate-500" />
          : <ChevronDown className="h-4 w-4 text-slate-500" />
        }
      </button>

      {open && (
        <div className="mt-6 space-y-8 text-sm leading-relaxed text-slate-400">

          {/* Introduction */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-sky-400">Introduction</p>
            <div className="space-y-3">
              {CASE_STUDY.intro.map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </div>

          {/* Data & Methodology */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-sky-400">Data &amp; Methodology</p>
            <div className="space-y-3">
              {CASE_STUDY.methodology.map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </div>

          {/* Key Technical Decisions */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-sky-400">Key Technical Decisions</p>
            <div className="space-y-4">
              {CASE_STUDY.decisions.map(({ title, body }) => (
                <div key={title}>
                  <p className="mb-1 font-semibold text-slate-300">{title}</p>
                  <p>{body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Next Steps */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-sky-400">What I&apos;d Do Differently / Next Steps</p>
            <div className="space-y-4">
              {CASE_STUDY.nextSteps.map(({ title, body }) => (
                <div key={title}>
                  <p className="mb-1 font-semibold text-slate-300">{title}</p>
                  <p>{body}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}

function FreightSignalCaseStudySection() {
  const [open, setOpen] = useState(false)

  return (
    <div className="mt-6 border-t border-slate-700/50 pt-6">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="text-sm font-semibold text-slate-300">Case Study</span>
        {open
          ? <ChevronUp className="h-4 w-4 text-slate-500" />
          : <ChevronDown className="h-4 w-4 text-slate-500" />
        }
      </button>

      {open && (
        <div className="mt-6 space-y-8 text-sm leading-relaxed text-slate-400">

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-sky-400">Introduction</p>
            <div className="space-y-3">
              {FREIGHT_SIGNAL_CASE_STUDY.intro.map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-sky-400">Key Engineering Decisions</p>
            <div className="space-y-4">
              {FREIGHT_SIGNAL_CASE_STUDY.decisions.map(({ title, body }) => (
                <div key={title}>
                  <p className="mb-1 font-semibold text-slate-300">{title}</p>
                  <p>{body}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-sky-400">What I&apos;d Do Next</p>
            <div className="space-y-4">
              {FREIGHT_SIGNAL_CASE_STUDY.nextSteps.map(({ title, body }) => (
                <div key={title}>
                  <p className="mb-1 font-semibold text-slate-300">{title}</p>
                  <p>{body}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PortfolioPage() {
  useEffect(() => { document.title = `${ME.name} — Portfolio` }, [])

  const projectsRef = useRef<HTMLElement>(null)
  const aboutRef    = useRef<HTMLElement>(null)
  const resumeRef   = useRef<HTMLElement>(null)

  function scrollTo(ref: React.RefObject<HTMLElement | null>) {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const project = PROJECTS[0]

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100">

      {/* ── Sticky nav ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-slate-700/50 bg-[#0f172a]/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <span className="text-sm font-bold tracking-tight text-white">{ME.name}</span>

          <nav className="hidden items-center gap-6 sm:flex">
            {[
              { label: 'Projects', ref: projectsRef },
              { label: 'About',    ref: aboutRef },
              { label: 'Resume',   ref: resumeRef },
            ].map(({ label, ref }) => (
              <button key={label} onClick={() => scrollTo(ref)}
                className="text-sm text-slate-400 transition-colors hover:text-white">
                {label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <a href={ME.github} target="_blank" rel="noopener noreferrer"
              className="rounded-md p-2 text-slate-400 transition-colors hover:bg-slate-700/60 hover:text-white">
              <Github className="h-4 w-4" />
            </a>
            <a href={ME.linkedin} target="_blank" rel="noopener noreferrer"
              className="rounded-md p-2 text-slate-400 transition-colors hover:bg-slate-700/60 hover:text-white">
              <Linkedin className="h-4 w-4" />
            </a>
            <a href={`mailto:${ME.email}`}
              className="rounded-md p-2 text-slate-400 transition-colors hover:bg-slate-700/60 hover:text-white">
              <Mail className="h-4 w-4" />
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6">

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <section className="flex min-h-[80vh] flex-col items-start justify-center py-20">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-sky-400">
            Available for opportunities
          </p>
          <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl">
            {ME.name}
          </h1>
          <p className="mt-3 text-xl font-medium text-slate-400">{ME.title}</p>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-400">{ME.tagline}</p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button onClick={() => scrollTo(projectsRef)}
              className="flex items-center gap-2 rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-400">
              View Projects <ChevronRight className="h-4 w-4" />
            </button>
            <a href={ME.resume} download="Aiden_Fairman_Resume.pdf"
              className="flex items-center gap-2 rounded-lg border border-slate-600 px-5 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:border-slate-400 hover:text-white">
              <FileDown className="h-4 w-4" /> Download Resume
            </a>
          </div>
        </section>

        {/* ── Projects ──────────────────────────────────────────────────── */}
        <section ref={projectsRef} className="scroll-mt-20 pb-24">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-sky-400">Projects</p>
          <h2 className="mb-10 text-3xl font-extrabold text-white">What I&apos;ve built</h2>

          {/* FreightFlow featured card */}
          <div className="rounded-2xl border border-slate-700/60 bg-slate-800/50 p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-500/25 bg-sky-500/15">
                  <Truck className="h-5 w-5 text-sky-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{project.name}</h3>
                  <p className="text-xs text-slate-500">{project.year} · {project.type}</p>
                </div>
              </div>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                {project.status}
              </span>
            </div>

            <p className="mt-5 text-sm leading-relaxed text-slate-300">{project.description}</p>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {project.highlights.map(({ icon: Icon, label, desc }) => (
                <div key={label} className="rounded-lg border border-slate-700/50 bg-slate-900/50 p-4">
                  <Icon className="mb-2 h-4 w-4 text-sky-400" />
                  <p className="text-xs font-semibold text-white">{label}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {project.tech.map(t => <TechBadge key={t} label={t} />)}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <a href={project.liveUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-400">
                <ExternalLink className="h-4 w-4" /> Live Demo
              </a>
              <a href={project.githubUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-300 transition-colors hover:border-slate-400 hover:text-white">
                <Github className="h-4 w-4" /> Source Code
              </a>
            </div>

            {/* ── Case Study (expandable) ── */}
            <CaseStudySection />
          </div>

          {/* FreightSignal card */}
          <div className="mt-4 rounded-2xl border border-slate-700/60 bg-slate-800/50 p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-500/25 bg-violet-500/15">
                  <Brain className="h-5 w-5 text-violet-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{FREIGHT_SIGNAL.name}</h3>
                  <p className="text-xs text-slate-500">{FREIGHT_SIGNAL.year} · {FREIGHT_SIGNAL.type}</p>
                </div>
              </div>
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
                {FREIGHT_SIGNAL.status}
              </span>
            </div>

            <p className="mt-5 text-sm leading-relaxed text-slate-300">{FREIGHT_SIGNAL.description}</p>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {FREIGHT_SIGNAL.highlights.map(({ icon: Icon, label, desc }) => (
                <div key={label} className="rounded-lg border border-slate-700/50 bg-slate-900/50 p-4">
                  <Icon className="mb-2 h-4 w-4 text-violet-400" />
                  <p className="text-xs font-semibold text-white">{label}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {FREIGHT_SIGNAL.tech.map(t => (
                <span key={t} className="rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300">
                  {t}
                </span>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <a href={FREIGHT_SIGNAL.githubUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-300 transition-colors hover:border-slate-400 hover:text-white">
                <Github className="h-4 w-4" /> Source Code
              </a>
            </div>

            <FreightSignalCaseStudySection />
          </div>

          {/* Future projects placeholder */}
          <div className="mt-4 flex items-center justify-center rounded-2xl border border-dashed border-slate-700/60 p-10">
            <p className="text-sm text-slate-600">More projects coming soon</p>
          </div>
        </section>

        {/* ── About ─────────────────────────────────────────────────────── */}
        <section ref={aboutRef} className="scroll-mt-20 pb-24">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-sky-400">About</p>
          <h2 className="mb-8 text-3xl font-extrabold text-white">Background</h2>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="space-y-4 text-sm leading-relaxed text-slate-400">
              {ABOUT_PARAGRAPHS.map((p, i) => <p key={i}>{p}</p>)}

              <div className="flex flex-wrap gap-4 pt-2">
                <a href={ME.github} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sky-400 transition-colors hover:text-sky-300">
                  <Github className="h-4 w-4" />
                  <span className="text-xs font-medium">GitHub</span>
                </a>
                <a href={ME.linkedin} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sky-400 transition-colors hover:text-sky-300">
                  <Linkedin className="h-4 w-4" />
                  <span className="text-xs font-medium">LinkedIn</span>
                </a>
                <a href={`mailto:${ME.email}`}
                  className="flex items-center gap-1.5 text-sky-400 transition-colors hover:text-sky-300">
                  <Mail className="h-4 w-4" />
                  <span className="text-xs font-medium">{ME.email}</span>
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {SKILLS.map(group => <SkillGroup key={group.category} {...group} />)}
            </div>
          </div>
        </section>

        {/* ── Resume ────────────────────────────────────────────────────── */}
        <section ref={resumeRef} className="scroll-mt-20 pb-24">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-sky-400">Resume</p>
          <h2 className="mb-8 text-3xl font-extrabold text-white">Experience &amp; Education</h2>

          <div className="rounded-2xl border border-slate-700/60 bg-slate-800/50 p-10 text-center">
            <FileDown className="mx-auto mb-4 h-10 w-10 text-slate-500" />
            <p className="text-sm text-slate-400">Download my full resume as a PDF</p>
            <a href={ME.resume} download="Aiden_Fairman_Resume.pdf"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-sky-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-sky-400">
              <FileDown className="h-4 w-4" /> Download Resume
            </a>
            <p className="mt-4 text-[11px] text-slate-600">PDF · Updated March 2026</p>
          </div>
        </section>

      </main>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-700/50 py-8">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6">
          <p className="text-xs text-slate-600">© {new Date().getFullYear()} {ME.name}</p>
          <p className="text-[11px] text-slate-700">Built with Next.js · Deployed on Vercel</p>
        </div>
      </footer>
    </div>
  )
}
