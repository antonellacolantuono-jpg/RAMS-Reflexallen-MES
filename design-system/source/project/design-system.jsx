/* global React, ReactDOM,
   cx, Icon, Btn, Badge, StatusBadge, PriorityBadge, Placeholder, Progress,
   KPI, Tabs, Field, Input, Select, Card, Drawer, Modal, ToastProvider, useToast */

const { useState, useEffect, useRef, useMemo } = React;

// ============================================================
// AUTO-REFRESH: poll source files; reload if any changed
// ============================================================
const SOURCES = ['styles/tokens.css', 'primitives.jsx', 'design-system.jsx', 'design-system-dashboard.jsx', 'design-system-views.jsx'];
function useAutoRefresh() {
  const sigsRef = useRef({});
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    let killed = false;
    const tick = async () => {
      try {
        const next = {};
        await Promise.all(SOURCES.map(async (s) => {
          const r = await fetch(`${s}?t=${Date.now()}`, { cache: 'no-store' });
          const txt = await r.text();
          // hash light: length + first/last 64 chars
          next[s] = `${txt.length}:${txt.slice(0,64)}:${txt.slice(-64)}`;
        }));
        if (killed) return;
        const prev = sigsRef.current;
        const changed = Object.keys(next).some(k => prev[k] && prev[k] !== next[k]);
        sigsRef.current = next;
        if (changed) {
          // soft refresh: bump pulse + reload page (so JSX modules re-evaluate)
          location.reload();
        } else {
          setPulse(p => p + 1);
        }
      } catch (_) { /* ignore */ }
    };
    tick();
    const id = setInterval(tick, 2500);
    return () => { killed = true; clearInterval(id); };
  }, []);
  return pulse;
}

// ============================================================
// TOKEN INTROSPECTION (read computed values from :root)
// ============================================================
function readToken(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

const TOKEN_GROUPS = [
  { id: 'surface', label: 'Surfaces', tokens: ['--paper', '--paper-2', '--paper-3'] },
  { id: 'ink',     label: 'Ink',      tokens: ['--ink', '--ink-2', '--ink-3', '--ink-4'] },
  { id: 'line',    label: 'Lines',    tokens: ['--line', '--line-2'] },
  { id: 'accent',  label: 'Accent',   tokens: ['--accent', '--accent-2', '--accent-soft', '--accent-ink'] },
  { id: 'ok',      label: 'Status / OK',     tokens: ['--ok', '--ok-soft', '--ok-ink'] },
  { id: 'warn',    label: 'Status / Warn',   tokens: ['--warn', '--warn-soft', '--warn-ink'] },
  { id: 'bad',     label: 'Status / Bad',    tokens: ['--bad', '--bad-soft', '--bad-ink'] },
  { id: 'info',    label: 'Status / Info',   tokens: ['--info', '--info-soft', '--info-ink'] },
  { id: 'neutral', label: 'Status / Neutral',tokens: ['--neutral', '--neutral-soft'] },
  { id: 'phase',   label: 'Phase colors (workflow)', tokens: ['--c-inbound','--c-setup','--c-production','--c-qc','--c-outbound','--c-teardown'] },
];

const RADII = ['--r-1', '--r-2', '--r-3', '--r-pill'];
const GAPS = ['--gap-1','--gap-2','--gap-3','--gap-4','--gap-5','--gap-6'];

// ============================================================
// LAYOUT PRIMITIVES
// ============================================================
const Anchor = ({ id, children }) => (
  <h2 id={id} className="text-[18px] font-semibold tracking-tight scroll-mt-16">{children}</h2>
);

const Section = ({ id, label, title, sub, children }) => (
  <section id={id} className="py-10 hairline-b">
    <div className="max-w-[1200px] mx-auto px-8">
      <div className="uppercase-label mb-1.5">{label}</div>
      <Anchor id={id}>{title}</Anchor>
      {sub && <p className="text-[13px] text-[var(--ink-3)] mt-1.5 max-w-[680px]">{sub}</p>}
      <div className="mt-6">{children}</div>
    </div>
  </section>
);

const Stage = ({ children, padded = true, dark = false, className }) => (
  <div className={cx('hairline rounded-[var(--r-2)] overflow-hidden bg-[var(--paper)]', className)}>
    <div className={cx('uppercase-label px-3 py-1.5 hairline-b bg-[var(--paper-2)] flex items-center gap-2')}>
      <span className="dot" style={{ background: 'var(--accent)' }} />
      <span>Live preview</span>
    </div>
    <div className={cx(padded && 'p-5', dark && 'bg-[var(--ink)]')}>{children}</div>
  </div>
);

const Code = ({ children }) => (
  <pre className="mono text-[11.5px] bg-[var(--paper-2)] hairline rounded-[var(--r-1)] p-2.5 leading-relaxed overflow-x-auto whitespace-pre">
    {children}
  </pre>
);

const Row = ({ label, hint, children }) => (
  <div className="grid grid-cols-[180px_1fr] gap-6 py-3 hairline-b items-start">
    <div>
      <div className="text-[12.5px] font-semibold">{label}</div>
      {hint && <div className="text-[11px] text-[var(--ink-3)] mt-0.5">{hint}</div>}
    </div>
    <div>{children}</div>
  </div>
);

// ============================================================
// SIDEBAR NAV
// ============================================================
const SECTIONS = [
  { id: 'brief', label: 'Brief', items: [
    { id: 'setup', label: 'Setup form' },
    { id: 'brand', label: 'Brand & logo' },
  ]},
  { id: 'foundations', label: 'Foundations', items: [
    { id: 'principles', label: 'Principles' },
    { id: 'type', label: 'Typography' },
    { id: 'color', label: 'Color' },
    { id: 'spacing', label: 'Spacing & Radii' },
    { id: 'iconography', label: 'Iconography' },
  ]},
  { id: 'components', label: 'Components', items: [
    { id: 'buttons', label: 'Buttons' },
    { id: 'badges', label: 'Badges & Status' },
    { id: 'forms', label: 'Forms' },
    { id: 'tabs', label: 'Tabs' },
    { id: 'progress', label: 'Progress & KPIs' },
    { id: 'cards', label: 'Cards' },
    { id: 'overlays', label: 'Drawer & Modal' },
    { id: 'feedback', label: 'Toasts & Placeholder' },
  ]},
  { id: 'patterns', label: 'Patterns', items: [
    { id: 'tables', label: 'Data tables' },
    { id: 'page-header', label: 'Page header' },
    { id: 'phase-bar', label: 'Phase bar' },
  ]},
  { id: 'dashboard', label: 'Dashboard', items: [
    { id: 'kpi-hero', label: 'KPI Hero' },
    { id: 'phase-chip', label: 'Phase Chip' },
    { id: 'exec-log-row', label: 'Execution Log Row' },
    { id: 'wc-card', label: 'Work Center Card' },
    { id: 'alert-banner', label: 'Alert Banner' },
    { id: 'phase-mix', label: 'Phase Mix Bar' },
    { id: 'live-alert', label: 'Live Alert Item' },
  ]},
  { id: 'views', label: 'Views', items: [
    { id: 'view-switcher', label: 'View Switcher' },
    { id: 'tree-node', label: 'Tree Node' },
    { id: 'empty-state', label: 'Empty State' },
    { id: 'split-view', label: 'Split View Browser' },
    { id: 'card-grid', label: 'Card Grid' },
  ]},
  { id: 'canvas', label: 'Canvas (React Flow)', items: [
    { id: 'canvas-foundation', label: 'Canvas Foundation' },
    { id: 'canvas-inspector', label: 'Properties Inspector' },
    { id: 'recipe-workflow', label: 'Workflow Designer' },
    { id: 'recipe-plant', label: 'Plant Map' },
    { id: 'recipe-routing', label: 'Process Routing' },
  ]},
];

const ScrollSpy = ({ activeId, setActiveId }) => {
  useEffect(() => {
    const ids = SECTIONS.flatMap(s => s.items.map(i => i.id));
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) setActiveId(e.target.id);
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);
  return null;
};

const Sidebar = ({ activeId, setActiveId }) => (
  <aside className="w-[240px] flex-shrink-0 hairline-r bg-[var(--paper)] flex flex-col h-screen sticky top-0">
    <div className="px-4 py-4 hairline-b">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded bg-[var(--ink)] text-[var(--paper)] flex items-center justify-center mono text-[12px] font-bold">DS</div>
        <div className="leading-tight">
          <div className="text-[13px] font-bold tracking-tight">RAMS · Design System</div>
          <div className="text-[10px] uppercase tracking-[0.15em] text-[var(--ink-3)]">v0.6 · live</div>
        </div>
      </div>
      <a href="index.html" className="mt-3 text-[11px] text-[var(--ink-3)] hover:text-[var(--ink)] flex items-center gap-1">← Back to prototype</a>
      <a href="Flow Map.html" className="mt-1 text-[11px] text-[var(--ink-3)] hover:text-[var(--ink)] flex items-center gap-1">↗ Flow map</a>
    </div>
    <ScrollSpy activeId={activeId} setActiveId={setActiveId} />
    <nav className="flex-1 overflow-y-auto px-3 py-3">
      {SECTIONS.map(sec => (
        <div key={sec.id} className="mb-3">
          <div className="px-2 mb-1 uppercase-label">{sec.label}</div>
          <div className="space-y-0.5">
            {sec.items.map(it => (
              <a key={it.id} href={`#${it.id}`}
                 onClick={() => setActiveId(it.id)}
                 className={cx('block px-2 py-1 rounded text-[12.5px]',
                   activeId === it.id ? 'bg-[var(--accent-soft)] text-[var(--accent-ink)] font-medium' : 'text-[var(--ink-2)] hover:bg-[var(--paper-2)]')}>
                {it.label}
              </a>
            ))}
          </div>
        </div>
      ))}
    </nav>
    <div className="hairline-t px-3 py-2.5 text-[10.5px] text-[var(--ink-3)] flex items-center gap-1.5">
      <span className="dot" style={{ background: 'var(--ok)' }} />
      auto-refresh on file change
    </div>
  </aside>
);

// ============================================================
// COLOR SWATCHES
// ============================================================
const Swatch = ({ name }) => {
  const [v, setV] = useState('');
  useEffect(() => { setV(readToken(name)); }, [name]);
  // contrast text (rough): if very light → dark text
  return (
    <div className="hairline rounded-[var(--r-2)] overflow-hidden bg-[var(--paper)]">
      <div className="h-14" style={{ background: `var(${name})` }} />
      <div className="px-2.5 py-1.5">
        <div className="mono text-[11px] font-semibold">{name}</div>
        <div className="mono text-[10px] text-[var(--ink-3)] truncate" title={v}>{v}</div>
      </div>
    </div>
  );
};

// ============================================================
// SETUP FORM (filled with RAMS data)
// ============================================================
const COMPANY_BLURB = `RAMS — Reflex Allen Manufacturing System. An MES suite for the Reflex Allen plants: web back-office (work orders, workflows, items/BOM, equipment hierarchy ISA-95, box management, recipes & skills), shop-floor HMI (timer-driven step execution, BOM check, parallel ops, recovery flows, packing), and a fullscreen Andon dashboard for line supervisors. Built for high information density on the office side and ≥44px touch targets on the floor.`;

const NOTES = `Industrial / utilitarian aesthetic — flat surfaces, hairline borders (no shadows except overlays), tabular numerals everywhere quantities matter. Two type families only: Avenir Next Cyr for UI, JetBrains Mono for codes / IDs / numerics. Codes are first-class (WO-2026-0142, ITM-FG-00042, BOX-PLT-001234). Status is shape + color (dot + soft fill + ink) — never color alone, color-blind safe, calibrated for daylight on shop-floor screens. Three densities (compact / balanced / spacious) — HMI mode auto-flips to spacious + 15px base. Six canonical workflow phases: inbound · setup · production · qc · outbound · teardown, each with a dedicated --c-{phase} token. Tone: precise, terse, factual — no marketing copy.`;

const GITHUB_URL = 'https://github.com/antonellacolantuono-jpg/RAMS---Design-System';

const ASSETS_LIST = [
  { name: 'reflexallen-completed-light.svg', kind: 'Brand', size: '36 kb' },
  { name: 'reflexallen-completed-dark.svg', kind: 'Brand', size: '36 kb' },
  { name: 'reflexallen-logomark-light.svg', kind: 'Brand', size: '2.7 kb' },
  { name: 'reflexallen-logomark-dark.svg', kind: 'Brand', size: '2.7 kb' },
  { name: 'reflexallen-nopayoff-light.svg', kind: 'Brand', size: '8 kb' },
  { name: 'reflexallen-nopayoff-dark.svg', kind: 'Brand', size: '8 kb' },
  { name: 'tokens.css', kind: 'Tokens', size: 'live' },
  { name: 'primitives.jsx', kind: 'Components', size: 'live' },
  { name: 'Avenir Next Cyr (400/500/600/700/800)', kind: 'Font', size: 'self-hosted' },
  { name: 'JetBrains Mono (400/500/600)', kind: 'Font', size: 'Google Fonts' },
];

const FormCard = ({ children, className }) => (
  <div className={cx('hairline rounded-[var(--r-2)] bg-[var(--paper)]', className)}>{children}</div>
);

const FormRow = ({ label, sub, right, children, last }) => (
  <div className={cx('grid grid-cols-[200px_1fr] gap-5 px-5 py-4 items-start', !last && 'hairline-b')}>
    <div className="pt-1">
      <div className="text-[13px] font-semibold">{label}</div>
      {sub && <div className="text-[11.5px] text-[var(--ink-3)] mt-0.5">{sub}</div>}
    </div>
    <div>{children}</div>
  </div>
);

const FilledInput = ({ value, mono, multiline }) => {
  if (multiline) {
    return (
      <div className="hairline rounded-[var(--r-1)] bg-[var(--paper-2)] p-3 text-[12.5px] leading-relaxed text-[var(--ink)] relative">
        <span className="absolute top-2 right-2 text-[9.5px] mono uppercase tracking-[0.12em] text-[var(--ok-ink)] bg-[var(--ok-soft)] px-1.5 py-0.5 rounded">filled</span>
        {value}
      </div>
    );
  }
  return (
    <div className="hairline rounded-[var(--r-1)] bg-[var(--paper-2)] px-2.5 h-9 flex items-center text-[13px] relative">
      <span className={cx(mono && 'mono text-[12.5px]')}>{value}</span>
      <span className="ml-auto text-[9.5px] mono uppercase tracking-[0.12em] text-[var(--ok-ink)] bg-[var(--ok-soft)] px-1.5 py-0.5 rounded">filled</span>
    </div>
  );
};

const SetupFormSection = () => (
  <Section id="setup" label="Brief" title="Set up your design system" sub="The intake form, pre-filled with everything Claude needs to keep this system internally consistent. Acts as a single source of truth for brand, scope, and aesthetic direction.">
    <FormCard className="overflow-hidden">
      {/* Header card */}
      <div className="px-5 py-5 hairline-b bg-[var(--paper-2)] flex items-start gap-4">
        <div className="w-12 h-12 hairline rounded-[var(--r-1)] bg-[var(--paper)] flex items-center justify-center">
          <Icon name="layers" size={22} className="text-[var(--accent)]" />
        </div>
        <div className="flex-1">
          <div className="text-[16px] font-semibold tracking-tight">Set up your design system</div>
          <div className="text-[12px] text-[var(--ink-3)] mt-0.5">Tell us about your company and attach any design resources you have.</div>
        </div>
        <Badge tone="ok" dot>complete</Badge>
      </div>

      <FormRow label="Company name and blurb" sub="(or name of design system)">
        <div className="space-y-2">
          <FilledInput value="RAMS — Reflex Allen Manufacturing System" />
          <FilledInput multiline value={COMPANY_BLURB} />
        </div>
      </FormRow>

      <div className="px-5 pt-6 pb-2">
        <div className="text-[14px] font-semibold">Provide examples of your design system and products <span className="text-[var(--ink-3)] font-normal">(all optional)</span></div>
        <div className="text-[11.5px] text-[var(--ink-3)] mt-0.5">What works best: code and designs for your design system and your code products.</div>
      </div>

      <FormRow label="Link code on GitHub">
        <div className="space-y-2">
          <div className="hairline rounded-[var(--r-1)] bg-[var(--paper-2)] px-2.5 h-9 flex items-center text-[12.5px] mono">
            <Icon name="info" size={12} className="mr-1.5 text-[var(--ink-3)] flex-shrink-0" />
            <a href="https://github.com/antonellacolantuono-jpg/RAMS-V.4" target="_blank" rel="noreferrer" className="text-[var(--accent-ink)] hover:underline truncate">
              github.com/antonellacolantuono-jpg/RAMS-V.4
            </a>
            <span className="ml-2 text-[9.5px] mono uppercase tracking-[0.12em] text-[var(--accent-ink)] bg-[var(--accent-soft)] px-1.5 py-0.5 rounded flex-shrink-0">app</span>
            <span className="ml-1.5 text-[9.5px] mono uppercase tracking-[0.12em] text-[var(--ok-ink)] bg-[var(--ok-soft)] px-1.5 py-0.5 rounded flex-shrink-0">linked</span>
          </div>
          <div className="hairline rounded-[var(--r-1)] bg-[var(--paper-2)] px-2.5 h-9 flex items-center text-[12.5px] mono">
            <Icon name="info" size={12} className="mr-1.5 text-[var(--ink-3)] flex-shrink-0" />
            <a href="https://github.com/antonellacolantuono-jpg/RAMS---Design-System" target="_blank" rel="noreferrer" className="text-[var(--accent-ink)] hover:underline truncate">
              github.com/antonellacolantuono-jpg/RAMS---Design-System
            </a>
            <span className="ml-2 text-[9.5px] mono uppercase tracking-[0.12em] text-[var(--accent-ink)] bg-[var(--accent-soft)] px-1.5 py-0.5 rounded flex-shrink-0">design system</span>
            <span className="ml-1.5 text-[9.5px] mono uppercase tracking-[0.12em] text-[var(--ok-ink)] bg-[var(--ok-soft)] px-1.5 py-0.5 rounded flex-shrink-0">linked</span>
          </div>
        </div>
      </FormRow>

      <FormRow label="Link code from your computer" sub="This doesn't upload the whole codebase; Claude will copy selected files. For large codebases, attach a frontend-focused subfolder.">
        <div className="hairline-dashed rounded-[var(--r-1)] bg-[var(--paper-2)] px-3 py-3 flex items-center justify-between" style={{ borderStyle: 'dashed' }}>
          <div className="flex items-center gap-2 min-w-0">
            <Icon name="layers" size={14} className="text-[var(--ink-3)] flex-shrink-0" />
            <div className="min-w-0">
              <div className="mono text-[12px] font-semibold truncate" title="C:\Users\antonella.colantuono.REFLEXALLEN\Desktop\RAMS_V4">C:\…\Desktop\RAMS_V4</div>
              <div className="text-[10.5px] text-[var(--ink-3)] mono truncate">local copy of RAMS-V.4 · primitives.jsx · tokens.css · screens</div>
            </div>
          </div>
          <Badge tone="ok" dot>linked</Badge>
        </div>
      </FormRow>

      <FormRow label="Upload a .fig file" sub="Parsed locally in your browser — never uploaded.">
        <div className="hairline rounded-[var(--r-1)] bg-[var(--paper-2)] px-3 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[12.5px] text-[var(--ink-3)]">
            <Icon name="file" size={14} /> No .fig file — design system is code-first
          </div>
          <Btn variant="ghost" size="sm">Drop .fig here or browse</Btn>
        </div>
      </FormRow>

      <FormRow label="Add fonts, logos and assets">
        <div className="hairline rounded-[var(--r-1)] bg-[var(--paper-2)] divide-y divide-[var(--line)]">
          {ASSETS_LIST.map(a => (
            <div key={a.name} className="px-3 h-9 flex items-center gap-3 text-[12px]">
              <Icon name={a.kind === 'Font' ? 'book' : a.kind === 'Brand' ? 'sparkle' : 'file'} size={13} className="text-[var(--ink-3)]" />
              <span className="mono flex-1 truncate">{a.name}</span>
              <span className="text-[10.5px] uppercase tracking-[0.1em] text-[var(--ink-3)]">{a.kind}</span>
              <span className="mono text-[10.5px] text-[var(--ink-3)] w-24 text-right">{a.size}</span>
              <Icon name="check" size={12} className="text-[var(--ok)]" />
            </div>
          ))}
        </div>
      </FormRow>

      <FormRow last label="Any other notes?">
        <FilledInput multiline value={NOTES} />
      </FormRow>
    </FormCard>

    <div className="mt-4 flex items-center justify-end gap-2">
      <Btn variant="ghost">Reset</Btn>
      <Btn variant="primary" icon="check">Create design system</Btn>
    </div>
  </Section>
);

// ============================================================
// BRAND & LOGO
// ============================================================
const LogoTile = ({ src, label, sub, dark }) => (
  <div className={cx('hairline rounded-[var(--r-2)] overflow-hidden', dark ? 'bg-[var(--ink)]' : 'bg-[var(--paper)]')}>
    <div className="h-32 flex items-center justify-center p-6">
      <img src={src} alt={label} className="max-h-full max-w-full" />
    </div>
    <div className={cx('px-3 py-2 hairline-t flex items-center justify-between text-[11.5px]', dark ? 'bg-[var(--ink-2)] text-[var(--paper)]' : 'bg-[var(--paper-2)]')}>
      <span className="font-semibold">{label}</span>
      <span className={cx('mono text-[10.5px]', dark ? 'text-[var(--paper-3,#bbb)]' : 'text-[var(--ink-3)]')} style={dark ? { opacity: 0.7 } : null}>{sub}</span>
    </div>
  </div>
);

const RamsLockup = ({ dark, stacked }) => (
  <div className={cx('hairline rounded-[var(--r-2)] overflow-hidden', dark ? 'bg-[var(--ink)]' : 'bg-[var(--paper)]')}>
    <div className={cx('flex items-center justify-center p-8', stacked ? 'h-56' : 'h-32')}>
      {stacked ? (
        <div className="flex flex-col items-center gap-3">
          <img src={dark ? 'assets/brand/reflexallen-logomark-light.svg' : 'assets/brand/reflexallen-logomark-dark.svg'} className="w-16 h-16 block" alt="" />
          <div className="text-center">
            <div className="font-fahkwang font-semibold text-[36px] leading-none tracking-[0.06em]" style={{ color: dark ? '#F7F7F7' : '#1F0B28' }}>RAMS</div>
            <div className="font-avenir text-[9px] mt-1.5 tracking-[0.2em] uppercase" style={{ color: dark ? '#F7F7F7' : '#1F0B28', opacity: 0.7 }}>Reflex Allen<br/>Management System</div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-5">
          <img src={dark ? 'assets/brand/reflexallen-logomark-light.svg' : 'assets/brand/reflexallen-logomark-dark.svg'} className="w-16 h-16" alt="" />
          <div>
            <div className="font-fahkwang font-semibold text-[44px] leading-none tracking-[0.04em]" style={{ color: dark ? '#F7F7F7' : '#1F0B28' }}>RAMS</div>
            <div className="h-px w-full my-1.5" style={{ background: dark ? '#F7F7F7' : '#1F0B28', opacity: dark ? 0.6 : 0.4 }} />
            <div className="font-avenir text-[10.5px] tracking-[0.18em] uppercase" style={{ color: dark ? '#F7F7F7' : '#1F0B28', opacity: 0.75 }}>Reflex Allen Management System</div>
          </div>
        </div>
      )}
    </div>
    <div className={cx('px-3 py-2 hairline-t flex items-center justify-between text-[11.5px]', dark ? 'bg-[var(--ink-2)] text-[var(--paper)]' : 'bg-[var(--paper-2)]')}>
      <span className="font-semibold">{stacked ? 'RAMS · stacked' : 'RAMS · horizontal'} · {dark ? 'dark' : 'light'}</span>
      <span className="mono text-[10.5px]" style={{ opacity: dark ? 0.7 : 1, color: dark ? null : 'var(--ink-3)' }}>Fahkwang + Avenir</span>
    </div>
  </div>
);

const BrandSection = () => (
  <Section id="brand" label="Brand" title="Brand & logo" sub="Reflex Allen is the parent brand. RAMS is the product. The product lockup pairs the Reflex Allen logomark with the RAMS wordmark in Fahkwang and the payoff in Avenir.">
    <div className="mb-4">
      <div className="text-[13px] font-semibold mb-2.5">RAMS product lockup</div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <RamsLockup />
        <RamsLockup dark />
        <RamsLockup stacked />
        <RamsLockup dark stacked />
      </div>
      <div className="hairline rounded-[var(--r-2)] p-4 bg-[var(--paper)] grid grid-cols-3 gap-4 text-[12.5px]">
        <div>
          <div className="uppercase-label mb-1.5">Wordmark</div>
          <div className="font-fahkwang font-semibold text-[28px] leading-none">RAMS</div>
          <div className="mono text-[10.5px] text-[var(--ink-3)] mt-1.5">Fahkwang · 600 · +0.04em tracking</div>
        </div>
        <div>
          <div className="uppercase-label mb-1.5">Payoff</div>
          <div className="font-avenir text-[11px] uppercase tracking-[0.18em]">Reflex Allen Management System</div>
          <div className="mono text-[10.5px] text-[var(--ink-3)] mt-1.5">Avenir Next · 400 · +0.18em tracking</div>
        </div>
        <div>
          <div className="uppercase-label mb-1.5">Mark</div>
          <div className="text-[12.5px]">Reflex Allen logomark — never alter shape, only swap light/dark.</div>
          <div className="mono text-[10.5px] text-[var(--ink-3)] mt-1.5">color #1F0B28 / #F7F7F7</div>
        </div>
      </div>
    </div>

    <div className="text-[13px] font-semibold mb-2.5 mt-8">Reflex Allen parent lockups</div>
    <div className="grid grid-cols-2 gap-3 mb-3">
      <LogoTile src="assets/brand/reflexallen-completed-dark.svg" label="Completed lockup · light" sub="external · covers" />
      <LogoTile dark src="assets/brand/reflexallen-completed-light.svg" label="Completed lockup · dark" sub="external · covers" />
      <LogoTile src="assets/brand/reflexallen-nopayoff-dark.svg" label="No payoff · light" sub="app chrome" />
      <LogoTile dark src="assets/brand/reflexallen-nopayoff-light.svg" label="No payoff · dark" sub="app chrome · andon" />
      <LogoTile src="assets/brand/reflexallen-logomark-dark.svg" label="Logomark · light" sub="favicon · tight space" />
      <LogoTile dark src="assets/brand/reflexallen-logomark-light.svg" label="Logomark · dark" sub="favicon · tight space" />
    </div>

    <div className="grid grid-cols-2 gap-3 mt-6">
      <div className="hairline rounded-[var(--r-2)] p-4 bg-[var(--paper)]">
        <div className="uppercase-label mb-2">Naming</div>
        <div className="space-y-2 text-[12.5px]">
          <div className="flex gap-3"><span className="mono w-24 text-[var(--ink-3)] flex-shrink-0">Company</span><span className="font-semibold">Reflex Allen</span></div>
          <div className="flex gap-3"><span className="mono w-24 text-[var(--ink-3)] flex-shrink-0">Product</span><span className="font-semibold">RAMS</span><span className="text-[var(--ink-3)]">Reflex Allen Manufacturing System</span></div>
          <div className="flex gap-3"><span className="mono w-24 text-[var(--ink-3)] flex-shrink-0">Surfaces</span><span>Back-office · HMI · Andon</span></div>
        </div>
      </div>
      <div className="hairline rounded-[var(--r-2)] p-4 bg-[var(--paper)]">
        <div className="uppercase-label mb-2">Clearspace & min size</div>
        <div className="text-[12.5px] text-[var(--ink-2)] space-y-1.5">
          <div>Clearspace = height of the logomark "R" on all sides.</div>
          <div>Min size — wordmark: <span className="mono">96px</span> wide. Logomark: <span className="mono">24px</span>.</div>
          <div>Never recolor the logo outside of light/dark variants.</div>
        </div>
      </div>
    </div>
  </Section>
);

// ============================================================
// PRINCIPLES
// ============================================================
const PrinciplesSection = () => (
  <Section id="principles" label="Foundations" title="Design principles" sub="Five rules everything in this UI is checked against. When in doubt, lean on these.">
    <div className="grid grid-cols-2 gap-4">
      {[
        { k: '01', t: 'Information density first', d: 'Operators and managers spend their day in this. Compact rows, tabular numerals, no decorative whitespace. Density toggle exists but balanced is the default.' },
        { k: '02', t: 'Codes are first-class', d: 'WO-2026-0142, ITM-FG-00042, BOX-PLT-001234. Codes use JetBrains Mono, are scannable, and stay visible even when names are hidden.' },
        { k: '03', t: 'Status is shape + color', d: 'Never rely on color alone. Every status badge has a dot + text. Color-blind safe. Calibrated for daylight on shop-floor screens.' },
        { k: '04', t: 'Hierarchy by hairline, not shadow', d: 'Borders divide regions. Shadows only on overlays. Surfaces flat, no gradients except in dashboards.' },
        { k: '05', t: 'Touch targets ≥ 44px in HMI', d: 'Back-office is mouse + keyboard, dense. HMI mode flips density to spacious automatically. Buttons grow, font scales up.' },
      ].map(p => (
        <div key={p.k} className="hairline rounded-[var(--r-2)] p-4 bg-[var(--paper)]">
          <div className="flex items-baseline gap-2">
            <span className="mono text-[11px] text-[var(--accent)] font-bold">{p.k}</span>
            <span className="text-[14px] font-semibold">{p.t}</span>
          </div>
          <p className="text-[12.5px] text-[var(--ink-2)] mt-1.5 leading-relaxed">{p.d}</p>
        </div>
      ))}
    </div>
  </Section>
);

// ============================================================
// TYPOGRAPHY
// ============================================================
const TypeSpec = ({ size, weight, family, label, sample }) => (
  <Row label={label} hint={`${size} · ${weight} · ${family}`}>
    <div style={{ fontSize: size, fontWeight: weight, fontFamily: family, lineHeight: 1.25 }}>{sample}</div>
  </Row>
);

const TypeSection = () => (
  <Section id="type" label="Foundations" title="Typography" sub="Two families. Avenir Next Cyr for everything UI. JetBrains Mono for codes, IDs, numerics, and inline code. Pure tabular numerals everywhere quantities matter.">
    <div className="grid grid-cols-2 gap-6 mb-8">
      <div className="hairline rounded-[var(--r-2)] p-5 bg-[var(--paper)]">
        <div className="uppercase-label mb-2">Display family</div>
        <div className="text-[44px] font-semibold tracking-tight leading-[1.05]">Avenir Next Cyr</div>
        <div className="mono text-[11px] text-[var(--ink-3)] mt-2">400 / 500 / 600 / 700 / 800 · self-hosted</div>
      </div>
      <div className="hairline rounded-[var(--r-2)] p-5 bg-[var(--paper)]">
        <div className="uppercase-label mb-2">Mono family</div>
        <div className="text-[44px] font-semibold mono tracking-tight leading-[1.05]">JetBrains</div>
        <div className="mono text-[11px] text-[var(--ink-3)] mt-2">400 / 500 / 600 · tabular-nums</div>
      </div>
    </div>
    <div className="hairline rounded-[var(--r-2)] bg-[var(--paper)] px-5 pb-1">
      <TypeSpec label="Display"  size="32px" weight="600" family="Avenir Next Cyr" sample="Plant Overview" />
      <TypeSpec label="H1"       size="22px" weight="600" family="Avenir Next Cyr" sample="Work Orders" />
      <TypeSpec label="H2"       size="18px" weight="600" family="Avenir Next Cyr" sample="Caliper Assembly · WC-A2" />
      <TypeSpec label="H3"       size="14px" weight="600" family="Avenir Next Cyr" sample="Phase progress" />
      <TypeSpec label="Body"     size="13px" weight="400" family="Avenir Next Cyr" sample="The piston seal must be inserted before applying torque to the bleeder." />
      <TypeSpec label="Small"    size="12px" weight="400" family="Avenir Next Cyr" sample="Operator: M. Conti · Shift A · 06:00–14:00" />
      <TypeSpec label="Label"    size="10.5px" weight="600" family="Avenir Next Cyr" sample="UPPERCASE LABEL · 0.06EM TRACKING" />
      <TypeSpec label="Mono / code"  size="12.5px" weight="500" family="JetBrains Mono" sample="WO-2026-0142 · ITM-FG-00042" />
      <TypeSpec label="Mono / numeric" size="20px" weight="600" family="JetBrains Mono" sample="168 / 240 · 70.0%" />
    </div>
  </Section>
);

// ============================================================
// COLOR
// ============================================================
const ColorSection = () => (
  <Section id="color" label="Foundations" title="Color" sub="Calibrated in oklch. Surfaces and ink hold the page; status colors carry meaning. All status pairs include a soft fill + ink for badges, with an optional bold for chrome. Phase colors map workflow stages.">
    {TOKEN_GROUPS.map(g => (
      <div key={g.id} className="mb-7">
        <div className="text-[13px] font-semibold mb-2.5">{g.label}</div>
        <div className="grid grid-cols-6 gap-2.5">
          {g.tokens.map(t => <Swatch key={t} name={t} />)}
        </div>
      </div>
    ))}
    <div className="mt-6 hairline rounded-[var(--r-2)] p-4 bg-[var(--paper-2)]">
      <div className="uppercase-label mb-2">Token usage</div>
      <Code>{`/* Surfaces */     --paper  →  page bg, cards
/* Ink */          --ink    →  primary text     --ink-3 → secondary
/* Status pair */  --ok       bold (banners, dots)
                   --ok-soft  badge bg
                   --ok-ink   badge text
/* Phase */        --c-production  →  workflow phase ribbon`}</Code>
    </div>
  </Section>
);

// ============================================================
// SPACING & RADII
// ============================================================
const SpacingSection = () => {
  const [gaps, setGaps] = useState([]);
  const [radii, setRadii] = useState([]);
  useEffect(() => {
    setGaps(GAPS.map(t => ({ name: t, v: readToken(t) })));
    setRadii(RADII.map(t => ({ name: t, v: readToken(t) })));
  }, []);
  return (
    <Section id="spacing" label="Foundations" title="Spacing & Radii" sub="Spacing is on a 4px grid. Radii are small — 3 / 5 / 8px — keeping the industrial feel. Pills only for status badges where shape carries semantic weight.">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="uppercase-label mb-3">Gap scale</div>
          <div className="space-y-2">
            {gaps.map(g => (
              <div key={g.name} className="flex items-center gap-3">
                <span className="mono text-[11px] w-16 text-[var(--ink-3)]">{g.name}</span>
                <span className="mono text-[11px] w-10 text-[var(--ink)]">{g.v}</span>
                <div style={{ width: g.v, height: 8 }} className="bg-[var(--accent)] rounded-[2px]" />
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="uppercase-label mb-3">Radii</div>
          <div className="grid grid-cols-2 gap-3">
            {radii.map(r => (
              <div key={r.name} className="hairline p-3 flex items-center gap-3" style={{ borderRadius: r.v }}>
                <div className="w-10 h-10 bg-[var(--accent)]" style={{ borderRadius: r.v }} />
                <div>
                  <div className="mono text-[11px] font-semibold">{r.name}</div>
                  <div className="mono text-[10.5px] text-[var(--ink-3)]">{r.v}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-6 hairline rounded-[var(--r-2)] p-4 bg-[var(--paper-2)]">
        <div className="uppercase-label mb-2">Density modes</div>
        <div className="text-[12.5px] text-[var(--ink-2)]">Three densities flip <code className="mono text-[11px] bg-[var(--paper)] hairline px-1 rounded">--row-h</code> and <code className="mono text-[11px] bg-[var(--paper)] hairline px-1 rounded">--cell-px</code> globally. HMI mode forces spacious + 15px base font.</div>
      </div>
    </Section>
  );
};

// ============================================================
// ICONOGRAPHY
// ============================================================
const ICON_NAMES = ['home','box','boxes','workflow','layers','factory','settings','user','users','play','pause','check','x','plus','chevronR','chevronD','chevronU','chevronL','search','filter','grid','list','flow','alert','shield','target','wrench','book','bell','monitor','clock','package','barcode','arrowR','arrowL','refresh','eye','edit','trash','save','download','info','zap','truck','lock','unlock','seal','sliders','qr','history','activity','chart','sparkle','minus','file','clipboard','tv','cube','cog','badge','plug','dots','expand','help','tablet','bookmark','flask'];

const IconographySection = () => (
  <Section id="iconography" label="Foundations" title="Iconography" sub={`${ICON_NAMES.length} hand-picked icons. Stroked, 1.75 weight, 24px viewBox. Sizes: 11 / 13 / 14 / 16. Never filled, never colored — they inherit currentColor.`}>
    <div className="hairline rounded-[var(--r-2)] bg-[var(--paper)] p-4 grid grid-cols-8 gap-3">
      {ICON_NAMES.map(n => (
        <div key={n} className="flex flex-col items-center gap-1.5 p-2 hairline rounded hover:bg-[var(--paper-2)]">
          <Icon name={n} size={20} />
          <span className="mono text-[10px] text-[var(--ink-3)] truncate w-full text-center">{n}</span>
        </div>
      ))}
    </div>
  </Section>
);

// ============================================================
// BUTTONS
// ============================================================
const ButtonsSection = () => (
  <Section id="buttons" label="Components" title="Buttons" sub="Five variants × three sizes. Default for most actions, primary for the one main CTA per surface, danger for destructive, ghost for inline, soft for secondary in headers.">
    <div className="grid grid-cols-[1fr_1fr] gap-6">
      <Stage>
        <div className="space-y-3">
          {['primary','default','soft','ghost','danger'].map(v => (
            <div key={v} className="grid grid-cols-[80px_1fr] items-center gap-3">
              <span className="mono text-[11px] text-[var(--ink-3)]">{v}</span>
              <div className="flex items-center gap-2">
                <Btn variant={v} size="sm">Small</Btn>
                <Btn variant={v} size="md">Medium</Btn>
                <Btn variant={v} size="lg">Large</Btn>
                <Btn variant={v} icon="plus">With icon</Btn>
                <Btn variant={v} icon="check" />
              </div>
            </div>
          ))}
        </div>
      </Stage>
      <Stage>
        <div className="space-y-3">
          <div className="uppercase-label">In context — toolbar</div>
          <div className="hairline rounded p-2 flex items-center gap-2 bg-[var(--paper-2)]">
            <Btn variant="primary" icon="plus">New WO</Btn>
            <Btn variant="default" icon="download">Export</Btn>
            <Btn variant="default" icon="filter">Filter</Btn>
            <div className="flex-1" />
            <Btn variant="ghost" icon="refresh" />
            <Btn variant="ghost" icon="dots" />
          </div>
          <div className="uppercase-label mt-4">In context — destructive</div>
          <div className="hairline rounded p-2 flex items-center justify-end gap-2 bg-[var(--paper-2)]">
            <Btn variant="ghost">Cancel</Btn>
            <Btn variant="danger" icon="trash">Delete WO</Btn>
          </div>
        </div>
      </Stage>
    </div>
  </Section>
);

// ============================================================
// BADGES & STATUS
// ============================================================
const STATUS_GROUPS = [
  { l: 'Work Order', s: ['draft','planned','released','in_progress','on_hold','completed','partially_completed','cancelled'] },
  { l: 'Equipment',  s: ['available','in_use','maintenance','broken','offline'] },
  { l: 'Box',        s: ['empty','partially_filled','full','sealed','shipped','returned','in_cleaning','damaged'] },
  { l: 'Quality',    s: ['approved','quarantine','rejected'] },
  { l: 'Operator',   s: ['active','training','on_leave','inactive'] },
];

const BadgesSection = () => (
  <Section id="badges" label="Components" title="Badges & Status" sub="Status is the single most important visual in the system. Badge = soft fill + ink text + status dot. Tones map 1:1 to semantic colors.">
    <Stage>
      <div className="space-y-4">
        <div>
          <div className="uppercase-label mb-2">Tones</div>
          <div className="flex flex-wrap gap-2">
            {['neutral','accent','ok','warn','bad','info'].map(t => (
              <Badge key={t} tone={t} dot>{t}</Badge>
            ))}
          </div>
        </div>
        {STATUS_GROUPS.map(g => (
          <div key={g.l}>
            <div className="uppercase-label mb-2">{g.l}</div>
            <div className="flex flex-wrap gap-2">
              {g.s.map(s => <StatusBadge key={s} status={s} />)}
            </div>
          </div>
        ))}
        <div>
          <div className="uppercase-label mb-2">Priority</div>
          <div className="flex flex-wrap gap-2">
            {['low','normal','high','urgent'].map(p => <PriorityBadge key={p} p={p} />)}
          </div>
        </div>
      </div>
    </Stage>
  </Section>
);

// ============================================================
// FORMS
// ============================================================
const FormsSection = () => (
  <Section id="forms" label="Components" title="Forms" sub="Input height 32. Border focus instead of glow ring. Labels use uppercase-label spec. Fields stack with flex-col gap-1.">
    <div className="grid grid-cols-2 gap-6">
      <Stage>
        <div className="space-y-3 max-w-[320px]">
          <Field label="Work order code" required>
            <Input placeholder="WO-2026-0146" />
          </Field>
          <Field label="Quantity" required hint="Target produced quantity (pieces)">
            <Input type="number" defaultValue={240} />
          </Field>
          <Field label="Work center" required>
            <Select defaultValue="WC-A2">
              <option value="WC-A2">WC-A2 · Assembly Line 2</option>
              <option value="WC-B1">WC-B1 · CNC Cell 1</option>
            </Select>
          </Field>
          <Field label="Notes">
            <textarea className="px-2 py-1.5 text-[13px] bg-[var(--paper)] border border-[var(--line)] rounded-[var(--r-1)] focus:border-[var(--accent)] outline-none" rows={3} placeholder="Optional notes…" />
          </Field>
        </div>
      </Stage>
      <Stage>
        <div className="space-y-2 max-w-[320px]">
          <div className="uppercase-label">Inline composite</div>
          <div className="flex gap-2">
            <Input className="flex-1" placeholder="Search code, item…" />
            <Btn variant="default" icon="filter">Filter</Btn>
          </div>
          <div className="uppercase-label mt-4">Tags / chips</div>
          <div className="flex flex-wrap gap-1.5">
            {['SKL-ASSY','SKL-LEAK','SKL-QC'].map(s => (
              <span key={s} className="hairline mono text-[11px] px-2 h-6 inline-flex items-center gap-1 rounded">
                {s}<button className="text-[var(--ink-3)] hover:text-[var(--bad)]"><Icon name="x" size={10}/></button>
              </span>
            ))}
          </div>
          <div className="uppercase-label mt-4">Validation states</div>
          <div className="flex gap-2 items-center"><Input style={{ borderColor: 'var(--bad)' }} defaultValue="WO-XX" /> <Badge tone="bad" dot>error</Badge></div>
          <div className="flex gap-2 items-center"><Input style={{ borderColor: 'var(--ok)' }} defaultValue="WO-2026-0146" /> <Badge tone="ok" dot>valid</Badge></div>
        </div>
      </Stage>
    </div>
  </Section>
);

// ============================================================
// TABS
// ============================================================
const TabsSection = () => {
  const [v, setV] = useState('overview');
  return (
    <Section id="tabs" label="Components" title="Tabs" sub="Underline tabs for screen-level navigation. Counts inline as small monospace badges.">
      <Stage padded={false}>
        <Tabs value={v} onChange={setV} tabs={[
          { id: 'overview', label: 'Overview' },
          { id: 'workflow', label: 'Workflow' },
          { id: 'materials', label: 'Materials', count: 6 },
          { id: 'execution', label: 'Execution', count: 168 },
          { id: 'quality', label: 'Quality', count: 4 },
          { id: 'genealogy', label: 'Genealogy' },
          { id: 'activity', label: 'Activity' },
        ]} />
        <div className="p-5 text-[12.5px] text-[var(--ink-3)]">Active: <span className="mono text-[var(--ink)]">{v}</span></div>
      </Stage>
    </Section>
  );
};

// ============================================================
// PROGRESS & KPI
// ============================================================
const ProgressSection = () => (
  <Section id="progress" label="Components" title="Progress & KPIs" sub="Linear bars 6px, no animation on render. KPI tiles use 26px tabular numerals as the focal weight.">
    <div className="grid grid-cols-2 gap-6">
      <Stage>
        <div className="space-y-3 max-w-[420px]">
          <div className="text-[12.5px]">WO progress · 168 / 240</div>
          <Progress value={168} max={240} tone="accent" showLabel />
          <div className="text-[12.5px] mt-3">First-pass yield</div>
          <Progress value={94} max={100} tone="ok" showLabel />
          <div className="text-[12.5px] mt-3">OEE vs target</div>
          <Progress value={78.4} max={100} tone="warn" showLabel />
          <div className="text-[12.5px] mt-3">Scrap rate</div>
          <Progress value={2.3} max={5} tone="bad" showLabel />
        </div>
      </Stage>
      <Stage>
        <div className="grid grid-cols-2 gap-3">
          <KPI label="OEE" value="78.4" unit="%" sub="Target 82%" tone="warn" />
          <KPI label="Throughput" value="312" unit="pc/h" trend="+4.2%" sub="vs. yesterday" />
          <KPI label="Scrap" value="2.3" unit="%" tone="bad" sub="↑ 0.4 vs target" />
          <KPI label="Active WOs" value="8" sub="2 at risk" />
        </div>
      </Stage>
    </div>
  </Section>
);

// ============================================================
// CARDS
// ============================================================
const CardsSection = () => (
  <Section id="cards" label="Components" title="Cards" sub="Cards are bordered, never shadowed. They group; they don't float. Reserve shadow for overlays.">
    <div className="grid grid-cols-3 gap-4">
      <Card>
        <div className="uppercase-label mb-1">Headerless</div>
        <div className="text-[14px] font-semibold">Plain content card</div>
        <div className="text-[12.5px] text-[var(--ink-3)] mt-1">Default 12px padding. Use for grouping inline content.</div>
      </Card>
      <Card padded={false}>
        <div className="hairline-b px-3 h-9 flex items-center gap-2">
          <Icon name="cog" size={13} className="text-[var(--ink-3)]" />
          <span className="mono text-[11.5px] font-semibold">RCP-LEAK-001</span>
          <span className="text-[12.5px] flex-1">· Caliper Leak Test</span>
          <Badge tone="ok" dot>approved</Badge>
        </div>
        <div className="p-3 text-[12.5px]">Header + body with hairline divider. Use for lists of objects with codes.</div>
      </Card>
      <Card padded={false}>
        <div className="px-3 py-2 surface-back" style={{ background: 'var(--ink)', color: 'var(--paper)' }}>
          <div className="text-[10px] mono tracking-[0.12em] font-semibold">BACK-OFFICE</div>
          <div className="text-[13px] font-semibold">Stage card · with surface header</div>
        </div>
        <div className="p-3 text-[12.5px] text-[var(--ink-3)]">Used in the Flow Map to identify back-office vs HMI vs Andon.</div>
      </Card>
    </div>
  </Section>
);

// ============================================================
// OVERLAYS
// ============================================================
const OverlaysSection = () => {
  const [drawer, setDrawer] = useState(false);
  const [modal, setModal] = useState(false);
  return (
    <Section id="overlays" label="Components" title="Drawer & Modal" sub="Right-side drawer for object detail (default 720). Centered modal for short tasks (default 480). Both backdrop-blur with 30% scrim.">
      <Stage>
        <div className="flex gap-2">
          <Btn variant="primary" onClick={() => setDrawer(true)}>Open drawer</Btn>
          <Btn variant="default" onClick={() => setModal(true)}>Open modal</Btn>
        </div>
      </Stage>
      <Drawer open={drawer} onClose={() => setDrawer(false)} title="WO-2026-0142" subtitle="Brake Caliper Assembly · WC-A2"
        actions={<><Btn variant="ghost" onClick={() => setDrawer(false)}>Close</Btn><Btn variant="primary" icon="check">Release</Btn></>}>
        <div className="p-5 space-y-3 text-[13px]">
          <div className="uppercase-label">Drawer body</div>
          <p>This is where the WO detail panel lives. Tabs, KPIs, BOM, execution log — everything fits in a 720px right panel without leaving the list context.</p>
          <Card>
            <div className="text-[12.5px] font-medium">Inline content</div>
            <Progress value={168} max={240} showLabel />
          </Card>
        </div>
      </Drawer>
      <Modal open={modal} onClose={() => setModal(false)} title="Confirm release"
        actions={<><Btn variant="ghost" onClick={() => setModal(false)}>Cancel</Btn><Btn variant="primary" onClick={() => setModal(false)}>Release WO</Btn></>}>
        <div className="space-y-2 text-[13px]">
          <p>You're about to release <span className="mono">WO-2026-0142</span>. Workflow snapshot will be frozen and the WO will appear on the floor HMIs.</p>
          <Field label="Reason (optional)"><Input placeholder="e.g. customer request" /></Field>
        </div>
      </Modal>
    </Section>
  );
};

// ============================================================
// TOASTS & PLACEHOLDER
// ============================================================
const ToastBar = () => {
  const push = useToast();
  return (
    <Stage>
      <div className="flex gap-2">
        <Btn variant="default" onClick={() => push({ tone: 'info', title: 'Snapshot frozen', desc: 'Workflow v3 captured at release.' })}>Info toast</Btn>
        <Btn variant="default" onClick={() => push({ tone: 'ok', title: 'WO completed', desc: '240/240 pieces. FPY 94%.' })}>Success toast</Btn>
        <Btn variant="default" onClick={() => push({ tone: 'bad', title: 'Device NOK', desc: 'Leak test failed on piece 168.' })}>Error toast</Btn>
      </div>
    </Stage>
  );
};

const FeedbackSection = () => (
  <Section id="feedback" label="Components" title="Toasts & Placeholder" sub="Toasts auto-dismiss in 3.5s, max 4 stacked. Striped placeholders mark missing imagery without faking content.">
    <div className="grid grid-cols-2 gap-6">
      <ToastBar />
      <Stage>
        <div className="grid grid-cols-2 gap-2">
          <Placeholder label="caliper.jpg" h={120} />
          <Placeholder label="bom diagram" h={120} />
          <div className="col-span-2"><Placeholder label="device telemetry chart" h={80} /></div>
        </div>
      </Stage>
    </div>
  </Section>
);

// ============================================================
// PATTERNS — TABLES
// ============================================================
const TablesSection = () => (
  <Section id="tables" label="Patterns" title="Data tables" sub="Compact rows, hairline dividers, mono code in first columns. Status + priority right-aligned. Click → drawer or detail page.">
    <Stage padded={false}>
      <table className="w-full text-[12.5px]">
        <thead className="bg-[var(--paper-2)]">
          <tr className="text-left">
            <th className="uppercase-label px-3 py-2">Code</th>
            <th className="uppercase-label px-3 py-2">Item</th>
            <th className="uppercase-label px-3 py-2">Qty</th>
            <th className="uppercase-label px-3 py-2">Work center</th>
            <th className="uppercase-label px-3 py-2">Priority</th>
            <th className="uppercase-label px-3 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['WO-2026-0142','Brake Caliper Assembly','168 / 240','WC-A2 · Line 2','high','in_progress'],
            ['WO-2026-0143','Brake Caliper Assembly','0 / 120','WC-A2 · Line 2','normal','released'],
            ['WO-2026-0140','Caliper Body, Machined','500 / 500','WC-B1 · CNC Cell','normal','completed'],
            ['WO-2026-0141','Caliper Body, Machined','312 / 400','WC-B1 · CNC Cell','high','on_hold'],
          ].map((r, i) => (
            <tr key={i} className="hairline-b hover:bg-[var(--paper-2)]">
              <td className="px-3 py-2 mono">{r[0]}</td>
              <td className="px-3 py-2">{r[1]}</td>
              <td className="px-3 py-2 mono tabular">{r[2]}</td>
              <td className="px-3 py-2 text-[var(--ink-3)]">{r[3]}</td>
              <td className="px-3 py-2"><PriorityBadge p={r[4]} /></td>
              <td className="px-3 py-2"><StatusBadge status={r[5]} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Stage>
  </Section>
);

// ============================================================
// PATTERNS — PAGE HEADER
// ============================================================
const PageHeaderSection = () => (
  <Section id="page-header" label="Patterns" title="Page header" sub="Every screen starts with the same anatomy: title, optional subtitle, right-side actions. 14px vertical padding, hairline-b.">
    <Stage padded={false}>
      <div className="px-5 py-3 hairline-b flex items-center justify-between">
        <div>
          <div className="text-[15px] font-semibold tracking-tight">Work Orders</div>
          <div className="text-[11.5px] text-[var(--ink-3)] mono mt-0.5">8 orders · Site Milano</div>
        </div>
        <div className="flex items-center gap-2">
          <Btn variant="default" icon="download">Export</Btn>
          <Btn variant="default" icon="filter">Filter</Btn>
          <Btn variant="primary" icon="plus">New WO</Btn>
        </div>
      </div>
      <div className="p-5 text-[12.5px] text-[var(--ink-3)]">Page body starts here…</div>
    </Stage>
  </Section>
);

// ============================================================
// PATTERNS — PHASE BAR
// ============================================================
const PHASES = [
  { code: 'inbound', label: 'Inbound', token: '--c-inbound' },
  { code: 'setup', label: 'Setup', token: '--c-setup' },
  { code: 'production', label: 'Production', token: '--c-production' },
  { code: 'qc', label: 'QC', token: '--c-qc' },
  { code: 'outbound', label: 'Outbound', token: '--c-outbound' },
  { code: 'teardown', label: 'Teardown', token: '--c-teardown' },
];

const PhaseBarSection = () => (
  <Section id="phase-bar" label="Patterns" title="Phase bar" sub="Visualizes a workflow's six canonical phases. Filled = completed, striped = current, empty = pending. Color comes from --c-{phase}.">
    <Stage>
      <div className="space-y-4">
        <div>
          <div className="uppercase-label mb-2">In progress (production)</div>
          <div className="flex gap-1">
            {PHASES.map((p, i) => (
              <div key={p.code} className="flex-1 hairline rounded-[var(--r-1)] overflow-hidden">
                <div className="h-2" style={{ background: i < 2 ? `var(${p.token})` : i === 2 ? `var(${p.token})` : 'transparent', opacity: i < 3 ? 1 : 0.15 }} />
                <div className="px-2 py-1.5 text-[11px] flex items-center justify-between">
                  <span className={cx(i === 2 && 'font-semibold')}>{p.label}</span>
                  {i < 2 && <Icon name="check" size={11} className="text-[var(--ok)]" />}
                  {i === 2 && <span className="dot" style={{ background: `var(${p.token})` }} />}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="uppercase-label mb-2">Completed</div>
          <div className="flex gap-1">
            {PHASES.map((p) => (
              <div key={p.code} className="flex-1 hairline rounded-[var(--r-1)] overflow-hidden">
                <div className="h-2" style={{ background: `var(${p.token})` }} />
                <div className="px-2 py-1.5 text-[11px] flex items-center justify-between">
                  <span>{p.label}</span>
                  <Icon name="check" size={11} className="text-[var(--ok)]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Stage>
  </Section>
);

// ============================================================
// HEADER
// ============================================================
const Header = ({ pulse }) => (
  <div className="hairline-b bg-[var(--paper)] sticky top-0 z-30">
    <div className="max-w-[1200px] mx-auto px-8 py-6">
      <div className="flex items-end justify-between">
        <div>
          <div className="uppercase-label mb-1">RAMS · MES Suite</div>
          <h1 className="text-[40px] font-semibold tracking-tight leading-none">Design system</h1>
          <p className="text-[13px] text-[var(--ink-3)] mt-2 max-w-[640px]">
            Source of truth for type, color, components and patterns used across the back-office, HMI, and Andon surfaces.
            All examples render live from the same components used in the prototype.
          </p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--ok-ink)]">
            <span className="dot" style={{ background: 'var(--ok)' }} />
            <span className="mono">live · auto-refresh</span>
            <span className="mono text-[var(--ink-3)]">·</span>
            <span className="mono text-[var(--ink-3)]">tick {pulse}</span>
          </div>
          <div className="mono text-[11px] text-[var(--ink-3)] mt-1.5">tokens.css · primitives.jsx</div>
        </div>
      </div>
    </div>
  </div>
);

// ============================================================
// ROOT
// ============================================================
function DesignSystemApp() {
  const pulse = useAutoRefresh();
  const [activeId, setActiveId] = useState('principles');
  return (
    <ToastProvider>
      <div className="flex">
        <Sidebar activeId={activeId} setActiveId={setActiveId} />
        <main className="flex-1 min-w-0">
          <Header pulse={pulse} />
          <SetupFormSection />
          <BrandSection />
          <PrinciplesSection />
          <TypeSection />
          <ColorSection />
          <SpacingSection />
          <IconographySection />
          <ButtonsSection />
          <BadgesSection />
          <FormsSection />
          <TabsSection />
          <ProgressSection />
          <CardsSection />
          <OverlaysSection />
          <FeedbackSection />
          <TablesSection />
          <PageHeaderSection />
          <PhaseBarSection />
          {window.DashboardComponentsSections && <window.DashboardComponentsSections />}
          {window.ViewsAndCanvasSections && <window.ViewsAndCanvasSections />}
          <div className="py-12 text-center text-[11px] text-[var(--ink-3)] mono">— end of design system · v0.6 —</div>
        </main>
      </div>
    </ToastProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<DesignSystemApp />);
