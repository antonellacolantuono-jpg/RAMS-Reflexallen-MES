/* global React, ReactDOM, MESData, useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakToggle, TweakSelect, TweakSlider */

const { useState, useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "density": "balanced",
  "theme": "light",
  "accent": "amber",
  "lang": "en",
  "showCodes": true
}/*EDITMODE-END*/;

// ============================================================
// SIDEBAR NAV
// ============================================================
const NAV = [
  {
    section: 'Production',
    items: [
      { id: 'dashboard', label: 'Plant overview', icon: 'home' },
      { id: 'workorders', label: 'Work Orders', icon: 'clipboard', badge: 8 },
      { id: 'andon', label: 'Andon (live)', icon: 'tv', mode: 'fullscreen' },
    ],
  },
  {
    section: 'Master data',
    items: [
      { id: 'workflows', label: 'Workflows', icon: 'layers' },
      { id: 'items', label: 'Items & BOM', icon: 'cube' },
      { id: 'recipes', label: 'Recipes', icon: 'cog' },
      { id: 'skills', label: 'Skills', icon: 'badge' },
    ],
  },
  {
    section: 'Resources',
    items: [
      { id: 'equipment', label: 'Equipment', icon: 'factory' },
      { id: 'devices', label: 'Devices', icon: 'plug' },
      { id: 'boxes', label: 'Box management', icon: 'box' },
    ],
  },
  {
    section: 'Shop floor',
    items: [
      { id: 'hmi', label: 'HMI walkthrough', icon: 'tablet', mode: 'fullscreen' },
    ],
  },
  {
    section: 'System',
    items: [
      { id: 'settings', label: 'Settings', icon: 'gear' },
    ],
  },
];

const App = () => {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [route, setRoute] = useState({ name: 'dashboard', params: null });

  const go = (name, params = null) => {
    setRoute({ name, params });
    if (typeof window !== 'undefined') window.scrollTo(0, 0);
  };

  // expose density/accent on root
  useEffect(() => {
    document.documentElement.dataset.density = tweaks.density;
    document.documentElement.dataset.theme = tweaks.theme;
    document.documentElement.dataset.accent = tweaks.accent;
    document.documentElement.dataset.codes = tweaks.showCodes ? 'on' : 'off';
  }, [tweaks]);

  const screens = {
    dashboard: window.ScreenDashboard,
    workorders: window.ScreenWorkOrders,
    'wo-detail': window.ScreenWODetail,
    'wo-create': () => <window.ScreenStub title="Create Work Order" subtitle="3-step wizard" />,
    workflows: window.ScreenWorkflows,
    'workflow-editor': window.ScreenWorkflowEditor,
    items: window.ScreenItems,
    'item-detail': window.ScreenItemDetail,
    recipes: window.ScreenRecipes,
    skills: window.ScreenSkills,
    equipment: window.ScreenEquipment,
    devices: window.ScreenDevices,
    boxes: window.ScreenBoxes,
    hmi: window.ScreenHMI,
    andon: window.ScreenAndon,
    settings: window.ScreenSettings,
  };
  const Screen = screens[route.name] || (() => <window.ScreenStub title={route.name} />);

  // fullscreen modes (HMI, Andon) bypass sidebar
  const currentNav = NAV.flatMap(s => s.items).find(x => x.id === route.name);
  const fullscreen = currentNav?.mode === 'fullscreen';

  if (fullscreen) {
    return (
      <div className="flex h-screen w-screen flex-col">
        <div className="px-4 py-2 hairline-b bg-[var(--paper)] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => go('dashboard')} className="text-[var(--ink-3)] hover:text-[var(--ink)] flex items-center gap-1.5 text-[12px]">
              <Icon name="arrowL" size={13} /> Back to back-office
            </button>
            <div className="w-px h-4 bg-[var(--line)]" />
            <span className="text-[12.5px] font-semibold tracking-tight">{currentNav.label}</span>
          </div>
          <Brand />
        </div>
        <div className="flex-1 min-h-0">
          <Screen go={go} params={route.params} />
        </div>
        <TweaksPanelHost tweaks={tweaks} setTweak={setTweak} />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar route={route.name} go={go} />
      <main className="flex-1 flex flex-col min-w-0 bg-[var(--paper-2)]">
        <Topbar />
        <div className="flex-1 overflow-hidden bg-[var(--paper)]">
          <Screen go={go} params={route.params} />
        </div>
      </main>
      <TweaksPanelHost tweaks={tweaks} setTweak={setTweak} />
    </div>
  );
};

const Brand = () => (
  <div className="flex items-center gap-2">
    <div className="w-6 h-6 rounded bg-[var(--ink)] text-[var(--paper)] flex items-center justify-center mono text-[11px] font-bold tracking-tighter">M3</div>
    <div className="leading-tight">
      <div className="text-[12.5px] font-bold tracking-tight">MES Suite</div>
      <div className="text-[9.5px] uppercase tracking-[0.15em] text-[var(--ink-3)]">v0.4.0 · Site Milano</div>
    </div>
  </div>
);

const Sidebar = ({ route, go }) => (
  <aside className="w-[220px] flex-shrink-0 hairline-r bg-[var(--paper)] flex flex-col">
    <div className="px-3 py-3 hairline-b">
      <Brand />
    </div>
    <nav className="flex-1 overflow-y-auto px-2 py-3">
      {NAV.map(sec => (
        <div key={sec.section} className="mb-3">
          <div className="px-2 mb-1 uppercase-label">{sec.section}</div>
          <div className="space-y-0.5">
            {sec.items.map(it => (
              <button key={it.id} onClick={() => go(it.id)}
                className={cx('w-full flex items-center gap-2 px-2 py-1.5 rounded text-[12.5px] text-left',
                  route === it.id ? 'bg-[var(--accent-soft)] text-[var(--accent-ink)] font-medium' : 'hover:bg-[var(--paper-2)]')}>
                <Icon name={it.icon} size={13} className={cx(route === it.id ? 'text-[var(--accent-ink)]' : 'text-[var(--ink-3)]')} />
                <span className="flex-1">{it.label}</span>
                {it.badge != null && (
                  <span className="mono text-[10px] tabular px-1.5 h-4 rounded-full bg-[var(--ink)] text-[var(--paper)] flex items-center">{it.badge}</span>
                )}
                {it.mode === 'fullscreen' && <Icon name="expand" size={10} className="text-[var(--ink-3)]" />}
              </button>
            ))}
          </div>
        </div>
      ))}
    </nav>
    <div className="hairline-t p-2.5 flex items-center gap-2">
      <div className="w-7 h-7 rounded-full bg-[var(--ink)] text-[var(--paper)] flex items-center justify-center mono text-[11px] font-bold flex-shrink-0">LR</div>
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-medium truncate">Laura Russo</div>
        <div className="text-[10.5px] text-[var(--ink-3)] truncate">Production Manager</div>
      </div>
      <Btn variant="ghost" icon="dots" size="sm" />
    </div>
  </aside>
);

const Topbar = () => (
  <div className="h-9 hairline-b bg-[var(--paper)] flex items-center px-3 gap-3 flex-shrink-0">
    <div className="flex items-center gap-1.5 text-[11.5px]">
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--ok)]" />
      <span className="text-[var(--ink-3)]">Site:</span>
      <span className="font-medium">Milano</span>
      <span className="text-[var(--ink-3)] mx-1">·</span>
      <span className="text-[var(--ink-3)]">Shift:</span>
      <span className="font-medium">A · 06:00–14:00</span>
    </div>
    <div className="w-px h-4 bg-[var(--line)]" />
    <div className="relative w-[260px]">
      <Icon name="search" size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--ink-3)]" />
      <input className="w-full hairline rounded h-6 pl-7 pr-2 text-[11.5px] bg-[var(--paper-2)]" placeholder="⌘K — Search items, WOs, serials, lots…" />
    </div>
    <div className="flex-1" />
    <button className="text-[var(--ink-3)] hover:text-[var(--ink)] relative">
      <Icon name="bell" size={13} />
      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[var(--bad)] ring-2 ring-[var(--paper)]" />
    </button>
    <button className="text-[var(--ink-3)] hover:text-[var(--ink)]"><Icon name="help" size={13} /></button>
  </div>
);

const TweaksPanelHost = ({ tweaks, setTweak }) => (
  <TweaksPanel>
    <TweakSection title="Appearance">
      <TweakRadio label="Theme" value={tweaks.theme} onChange={v => setTweak('theme', v)}
        options={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} />
      <TweakRadio label="Accent" value={tweaks.accent} onChange={v => setTweak('accent', v)}
        options={[{ value: 'amber', label: 'Amber' }, { value: 'blue', label: 'Blue' }, { value: 'green', label: 'Green' }]} />
    </TweakSection>
    <TweakSection title="Density">
      <TweakRadio label="Row density" value={tweaks.density} onChange={v => setTweak('density', v)}
        options={[{ value: 'compact', label: 'Compact' }, { value: 'balanced', label: 'Balanced' }, { value: 'comfortable', label: 'Comfortable' }]} />
      <TweakToggle label="Show object codes (WO, ITM, etc)" value={tweaks.showCodes} onChange={v => setTweak('showCodes', v)} />
    </TweakSection>
    <TweakSection title="Localization">
      <TweakSelect label="Language" value={tweaks.lang} onChange={v => setTweak('lang', v)}
        options={[{ value: 'en', label: 'English' }, { value: 'it', label: 'Italiano' }, { value: 'de', label: 'Deutsch' }]} />
    </TweakSection>
  </TweaksPanel>
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
