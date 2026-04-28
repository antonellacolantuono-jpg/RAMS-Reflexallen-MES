/* global React */
const { useState, useMemo, useEffect, useRef, createContext, useContext, Fragment } = React;

// ============================================================
// PRIMITIVES
// ============================================================
const cx = (...c) => c.filter(Boolean).join(' ');

const Icon = ({ name, size = 16, className = '' }) => {
  const paths = {
    home: 'M3 12l9-9 9 9M5 10v10h14V10',
    box: 'M21 16V8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5M12 13v10',
    boxes: 'M2.97 12.92L2 13.4v6.34a1 1 0 00.44.83L8 23M10 21.74L13.5 23.5l5.06-2.53M21 7.74V14M2.97 7.41L8 10M21 7.74L16 10',
    workflow: 'M5 4h4v4H5zM15 4h4v4h-4zM5 16h4v4H5zM15 16h4v4h-4zM7 8v8M17 8v8M9 18h6M9 6h6',
    layers: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
    factory: 'M2 20h20M4 20V8l6 4V8l6 4V8l4 4v8',
    settings: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z',
    user: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z',
    users: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
    play: 'M5 3l14 9-14 9V3z',
    pause: 'M6 4h4v16H6zM14 4h4v16h-4z',
    check: 'M20 6L9 17l-5-5',
    x: 'M18 6L6 18M6 6l12 12',
    plus: 'M12 5v14M5 12h14',
    chevronR: 'M9 6l6 6-6 6',
    chevronD: 'M6 9l6 6 6-6',
    chevronU: 'M18 15l-6-6-6 6',
    chevronL: 'M15 6l-6 6 6 6',
    search: 'M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z',
    filter: 'M22 3H2l8 9.46V19l4 2v-8.54L22 3z',
    grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
    list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
    flow: 'M5 3v4M19 17v4M5 17v4M19 3v4M3 5h4M17 5h4M3 19h4M17 19h4M9 12h6',
    alert: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01',
    shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    target: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 18a6 6 0 100-12 6 6 0 000 12zM12 14a2 2 0 100-4 2 2 0 000 4z',
    wrench: 'M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z',
    book: 'M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z',
    bell: 'M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0',
    monitor: 'M2 3h20v14H2zM8 21h8M12 17v4',
    clock: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2',
    package: 'M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12',
    barcode: 'M3 5v14M7 5v14M11 5v9M11 17v2M15 5v14M19 5v14',
    arrowR: 'M5 12h14M12 5l7 7-7 7',
    arrowL: 'M19 12H5M12 19l-7-7 7-7',
    refresh: 'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15',
    eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 100-6 3 3 0 000 6z',
    edit: 'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.12 2.12 0 113 3L12 15l-4 1 1-4 9.5-9.5z',
    trash: 'M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2',
    save: 'M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2zM17 21v-8H7v8M7 3v5h8',
    download: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3',
    info: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 16v-4M12 8h.01',
    zap: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
    truck: 'M1 3h15v13H1zM16 8h4l3 3v5h-7M5.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
    lock: 'M5 11h14v11H5zM7 11V7a5 5 0 0110 0v4',
    unlock: 'M5 11h14v11H5zM7 11V7a5 5 0 019.9-1',
    seal: 'M12 2l3 6 6 1-4.5 4.5L18 20l-6-3-6 3 1.5-6.5L3 9l6-1z',
    sliders: 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6',
    qr: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM18 18h3v3h-3z',
    history: 'M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8M3 3v5h5M12 7v5l4 2',
    activity: 'M22 12h-4l-3 9L9 3l-3 9H2',
    chart: 'M3 3v18h18M7 14l4-4 4 4 5-5',
    sparkle: 'M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z',
    minus: 'M5 12h14',
    file: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
    clipboard: 'M9 2h6a1 1 0 011 1v2H8V3a1 1 0 011-1zM8 5H5a2 2 0 00-2 2v13a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2h-3',
    tv: 'M3 5h18v13H3zM8 21h8M12 18v3',
    cube: 'M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12',
    cog: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z',
    gear: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z',
    badge: 'M12 2l2.5 4.5L19 7l-3.5 3.5L16 16l-4-2-4 2 .5-5.5L5 7l4.5-.5L12 2zM7 14v8l5-3 5 3v-8',
    plug: 'M9 2v6M15 2v6M6 8h12v3a6 6 0 01-12 0V8zM12 17v5',
    dots: 'M5 12h.01M12 12h.01M19 12h.01',
    expand: 'M3 8V3h5M21 8V3h-5M3 16v5h5M21 16v5h-5',
    help: 'M12 22a10 10 0 100-20 10 10 0 000 20zM9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01',
    tablet: 'M5 2h14a2 2 0 012 2v16a2 2 0 01-2 2H5a2 2 0 01-2-2V4a2 2 0 012-2zM12 18h.01',
    bookmark: 'M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z',
    flask: 'M9 2h6M10 2v7L4 19a2 2 0 001.7 3h12.6a2 2 0 001.7-3L14 9V2',
  };
  const d = paths[name];
  if (!d) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={d} />
    </svg>
  );
};

const Btn = ({ variant = 'default', size = 'md', icon, iconR, children, className, ...props }) => {
  const base = 'inline-flex items-center gap-1.5 font-medium select-none cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap';
  const sizes = { sm: 'h-7 px-2 text-[12px]', md: 'h-8 px-3 text-[12.5px]', lg: 'h-10 px-4 text-[13.5px]' };
  const variants = {
    default: 'bg-[var(--paper)] hover:bg-[var(--paper-2)] border border-[var(--line)] text-[var(--ink)] rounded-[var(--r-1)]',
    primary: 'bg-[var(--accent)] hover:bg-[var(--accent-2)] text-white rounded-[var(--r-1)]',
    ghost: 'hover:bg-[var(--paper-2)] text-[var(--ink-2)] rounded-[var(--r-1)]',
    danger: 'bg-[var(--bad)] hover:opacity-90 text-white rounded-[var(--r-1)]',
    soft: 'bg-[var(--paper-2)] hover:bg-[var(--paper-3)] text-[var(--ink)] border border-[var(--line)] rounded-[var(--r-1)]',
  };
  return (
    <button className={cx(base, sizes[size], variants[variant], className)} {...props}>
      {icon && <Icon name={icon} size={size === 'sm' ? 12 : 14} />}
      {children}
      {iconR && <Icon name={iconR} size={size === 'sm' ? 12 : 14} />}
    </button>
  );
};

const Badge = ({ tone = 'neutral', children, dot, className }) => {
  const tones = {
    neutral: 'bg-[var(--neutral-soft)] text-[var(--ink-2)]',
    accent: 'bg-[var(--accent-soft)] text-[var(--accent-ink)]',
    ok: 'bg-[var(--ok-soft)] text-[var(--ok-ink)]',
    warn: 'bg-[var(--warn-soft)] text-[var(--warn-ink)]',
    bad: 'bg-[var(--bad-soft)] text-[var(--bad-ink)]',
    info: 'bg-[var(--info-soft)] text-[var(--info-ink)]',
  };
  const dotColor = { neutral: 'var(--ink-3)', accent: 'var(--accent)', ok: 'var(--ok)', warn: 'var(--warn)', bad: 'var(--bad)', info: 'var(--info)' };
  return (
    <span className={cx('inline-flex items-center gap-1.5 px-1.5 h-[20px] text-[11px] font-medium rounded-[3px] tabular', tones[tone], className)}>
      {dot && <span className="dot" style={{ background: dotColor[tone] }} />}
      {children}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const map = {
    draft: { tone: 'neutral', label: 'Draft' },
    planned: { tone: 'info', label: 'Planned' },
    released: { tone: 'info', label: 'Released' },
    in_progress: { tone: 'accent', label: 'In Progress' },
    on_hold: { tone: 'warn', label: 'On Hold' },
    completed: { tone: 'ok', label: 'Completed' },
    partially_completed: { tone: 'ok', label: 'Partial' },
    closed: { tone: 'ok', label: 'Closed' },
    cancelled: { tone: 'bad', label: 'Cancelled' },
    available: { tone: 'ok', label: 'Available' },
    in_use: { tone: 'warn', label: 'In Use' },
    maintenance: { tone: 'warn', label: 'Maintenance' },
    broken: { tone: 'bad', label: 'Broken' },
    offline: { tone: 'neutral', label: 'Offline' },
    empty: { tone: 'neutral', label: 'Empty' },
    partially_filled: { tone: 'info', label: 'Partial' },
    full: { tone: 'info', label: 'Full' },
    sealed: { tone: 'accent', label: 'Sealed' },
    shipped: { tone: 'ok', label: 'Shipped' },
    returned: { tone: 'warn', label: 'Returned' },
    in_cleaning: { tone: 'warn', label: 'Cleaning' },
    damaged: { tone: 'bad', label: 'Damaged' },
    approved: { tone: 'ok', label: 'Approved' },
    quarantine: { tone: 'warn', label: 'Quarantine' },
    rejected: { tone: 'bad', label: 'Rejected' },
    active: { tone: 'ok', label: 'Active' },
    training: { tone: 'info', label: 'Training' },
    on_leave: { tone: 'neutral', label: 'On Leave' },
    inactive: { tone: 'neutral', label: 'Inactive' },
    deprecated: { tone: 'neutral', label: 'Deprecated' },
  };
  const m = map[status] || { tone: 'neutral', label: status };
  return <Badge tone={m.tone} dot>{m.label}</Badge>;
};

const PriorityBadge = ({ p }) => {
  const map = { low: { tone: 'neutral', l: 'Low' }, normal: { tone: 'info', l: 'Normal' }, high: { tone: 'warn', l: 'High' }, urgent: { tone: 'bad', l: 'Urgent' } };
  const m = map[p] || map.normal;
  return <Badge tone={m.tone}>{m.l}</Badge>;
};

const Placeholder = ({ label, h = 80, className }) => (
  <div className={cx('striped flex items-center justify-center text-[10px] mono uppercase tracking-wider text-[var(--ink-3)]', className)} style={{ height: h }}>
    {label}
  </div>
);

const Progress = ({ value, max, tone = 'accent', showLabel = false }) => {
  const pct = Math.min(100, (value / max) * 100);
  const colors = { accent: 'var(--accent)', ok: 'var(--ok)', warn: 'var(--warn)', bad: 'var(--bad)', info: 'var(--info)' };
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-[6px] bg-[var(--paper-3)] rounded-[2px] overflow-hidden">
        <div className="h-full transition-all" style={{ width: `${pct}%`, background: colors[tone] }} />
      </div>
      {showLabel && <span className="text-[11px] tabular text-[var(--ink-3)] mono">{Math.round(pct)}%</span>}
    </div>
  );
};

const KPI = ({ label, value, unit, trend, tone, sub }) => (
  <div className="hairline rounded-[var(--r-2)] p-3 bg-[var(--paper)]">
    <div className="uppercase-label">{label}</div>
    <div className="flex items-baseline gap-1.5 mt-1">
      <span className="text-[26px] font-semibold tabular leading-none" style={{ color: tone ? `var(--${tone})` : 'var(--ink)' }}>{value}</span>
      {unit && <span className="text-[11px] mono text-[var(--ink-3)]">{unit}</span>}
    </div>
    {sub && <div className="text-[11px] text-[var(--ink-3)] mt-1">{sub}</div>}
    {trend && (
      <div className="text-[11px] mt-1 tabular flex items-center gap-1" style={{ color: trend.startsWith('+') || trend.startsWith('▲') ? 'var(--ok)' : 'var(--bad)' }}>
        {trend}
      </div>
    )}
  </div>
);

const Tabs = ({ tabs, value, onChange }) => (
  <div className="flex border-b border-[var(--line)] gap-0">
    {tabs.map(t => (
      <button key={t.id} onClick={() => onChange(t.id)}
        className={cx('px-3 h-9 text-[12.5px] font-medium border-b-2 transition-colors -mb-px', value === t.id ? 'border-[var(--accent)] text-[var(--ink)]' : 'border-transparent text-[var(--ink-3)] hover:text-[var(--ink)]')}>
        {t.label}{t.count != null && <span className="ml-1.5 text-[10px] mono opacity-60">{t.count}</span>}
      </button>
    ))}
  </div>
);

const Field = ({ label, hint, children, required }) => (
  <div className="flex flex-col gap-1">
    <label className="uppercase-label flex items-center gap-1">
      {label}{required && <span className="text-[var(--bad)]">*</span>}
    </label>
    {children}
    {hint && <span className="text-[11px] text-[var(--ink-3)]">{hint}</span>}
  </div>
);

const Input = ({ className, ...props }) => (
  <input className={cx('h-8 px-2 text-[13px] bg-[var(--paper)] border border-[var(--line)] rounded-[var(--r-1)] focus:border-[var(--accent)] outline-none transition-colors', className)} {...props} />
);

const Select = ({ children, className, ...props }) => (
  <select className={cx('h-8 px-2 text-[13px] bg-[var(--paper)] border border-[var(--line)] rounded-[var(--r-1)] focus:border-[var(--accent)] outline-none', className)} {...props}>{children}</select>
);

const Card = ({ children, className, padded = true }) => (
  <div className={cx('hairline rounded-[var(--r-2)] bg-[var(--paper)]', padded && 'p-3', className)}>
    {children}
  </div>
);

const Drawer = ({ open, onClose, title, subtitle, children, width = 720, actions }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1 bg-black/30 backdrop-blur-[2px]" />
      <div className="bg-[var(--paper)] hairline-l flex flex-col h-full overflow-hidden" style={{ width }} onClick={e => e.stopPropagation()}>
        <div className="hairline-b px-4 h-12 flex items-center justify-between flex-shrink-0">
          <div>
            <div className="font-semibold text-[13.5px]">{title}</div>
            {subtitle && <div className="text-[11px] text-[var(--ink-3)] mono">{subtitle}</div>}
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded hover:bg-[var(--paper-2)]"><Icon name="x" /></button>
        </div>
        <div className="flex-1 overflow-auto">{children}</div>
        {actions && <div className="hairline-t px-4 h-14 flex items-center justify-end gap-2 flex-shrink-0 bg-[var(--paper-2)]">{actions}</div>}
      </div>
    </div>
  );
};

const Modal = ({ open, onClose, title, children, actions, width = 480 }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      <div className="relative bg-[var(--paper)] hairline rounded-[var(--r-3)] flex flex-col max-h-[80vh] overflow-hidden shadow-xl" style={{ width }} onClick={e => e.stopPropagation()}>
        <div className="hairline-b px-4 h-12 flex items-center justify-between">
          <div className="font-semibold">{title}</div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded hover:bg-[var(--paper-2)]"><Icon name="x" /></button>
        </div>
        <div className="flex-1 overflow-auto p-4">{children}</div>
        {actions && <div className="hairline-t px-4 h-14 flex items-center justify-end gap-2 bg-[var(--paper-2)]">{actions}</div>}
      </div>
    </div>
  );
};

// Toast system
const ToastCtx = createContext(null);
const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const push = (t) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, ...t }]);
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 3500);
  };
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map(t => (
          <div key={t.id} className="hairline rounded-[var(--r-2)] bg-[var(--paper)] px-3 py-2 shadow-lg min-w-[260px] flex items-start gap-2">
            <Icon name={t.tone === 'bad' ? 'alert' : t.tone === 'ok' ? 'check' : 'info'} className={t.tone === 'bad' ? 'text-[var(--bad)]' : t.tone === 'ok' ? 'text-[var(--ok)]' : 'text-[var(--info)]'} />
            <div className="flex-1">
              <div className="text-[12.5px] font-medium">{t.title}</div>
              {t.desc && <div className="text-[11.5px] text-[var(--ink-3)] mt-0.5">{t.desc}</div>}
            </div>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
};
const useToast = () => useContext(ToastCtx);

Object.assign(window, { cx, Icon, Btn, Badge, StatusBadge, PriorityBadge, Placeholder, Progress, KPI, Tabs, Field, Input, Select, Card, Drawer, Modal, ToastProvider, useToast });
