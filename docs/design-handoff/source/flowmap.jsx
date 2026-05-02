/* global React, ReactDOM, FlowMap */
const { useState, useRef, useEffect, useMemo, useCallback } = React;
const { PHASES, NODES, EDGES, DECISIONS, CANVAS } = FlowMap;

// ============================================================
// PAN / ZOOM HOOK
// ============================================================
function usePanZoom(initial = { x: 40, y: 40, k: 0.42 }) {
  const [t, setT] = useState(initial);
  const ref = useRef(null);
  const drag = useRef(null);

  const onWheel = useCallback((e) => {
    e.preventDefault();
    const rect = ref.current.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    setT(prev => {
      const factor = e.deltaY < 0 ? 1.1 : 0.909;
      const nk = Math.max(0.15, Math.min(2.5, prev.k * factor));
      // zoom toward pointer
      const nx = px - ((px - prev.x) * nk) / prev.k;
      const ny = py - ((py - prev.y) * nk) / prev.k;
      return { x: nx, y: ny, k: nk };
    });
  }, []);

  const onPointerDown = (e) => {
    if (e.target.closest('.node, .diamond')) return;
    drag.current = { x: e.clientX, y: e.clientY, tx: t.x, ty: t.y };
    ref.current.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    setT(prev => ({ ...prev, x: drag.current.tx + dx, y: drag.current.ty + dy }));
  };
  const onPointerUp = () => { drag.current = null; };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  return { ref, t, setT, onPointerDown, onPointerMove, onPointerUp };
}

// ============================================================
// EDGE GEOMETRY
// ============================================================
function nodeRect(id) {
  const n = NODES.find(x => x.id === id);
  if (n) return { x: n.x, y: n.y, w: n.w, h: n.h, kind: 'node' };
  const d = DECISIONS.find(x => x.id === id);
  if (d) return { x: d.x - 50, y: d.y - 50, w: 100, h: 100, kind: 'diamond' };
  return null;
}

function anchorOnRect(r, towardX, towardY) {
  const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
  const dx = towardX - cx, dy = towardY - cy;
  if (Math.abs(dx) === 0 && Math.abs(dy) === 0) return { x: cx, y: cy };
  const sx = (r.w / 2) / Math.abs(dx || 1e-6);
  const sy = (r.h / 2) / Math.abs(dy || 1e-6);
  const s = Math.min(sx, sy);
  return { x: cx + dx * s, y: cy + dy * s };
}

function buildPath(from, to) {
  const a = anchorOnRect(from, to.x + to.w / 2, to.y + to.h / 2);
  const b = anchorOnRect(to, from.x + from.w / 2, from.y + from.h / 2);
  const dx = b.x - a.x, dy = b.y - a.y;
  const horiz = Math.abs(dx) > Math.abs(dy);
  // bezier with handles biased on dominant axis
  const c1x = horiz ? a.x + dx * 0.5 : a.x;
  const c1y = horiz ? a.y : a.y + dy * 0.5;
  const c2x = horiz ? b.x - dx * 0.5 : b.x;
  const c2y = horiz ? b.y : b.y - dy * 0.5;
  return { d: `M ${a.x} ${a.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${b.x} ${b.y}`, mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, a, b };
}

// ============================================================
// NODE
// ============================================================
const SURFACE_LABEL = { back: 'BACK-OFFICE', hmi: 'HMI · OPERATOR', andon: 'ANDON' };

function NodeCard({ n, onOpen, onHover }) {
  const surfaceCls = `surface-${n.surface}`;
  return (
    <div
      className="node absolute cursor-pointer"
      style={{ left: n.x, top: n.y, width: n.w, height: n.h }}
      onClick={() => onOpen(n)}
      onMouseEnter={(e) => onHover(n, e)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Header */}
      <div className={`${surfaceCls} px-2.5 h-[26px] flex items-center justify-between text-[10px] mono tracking-[0.12em] font-semibold`}>
        <span>{SURFACE_LABEL[n.surface]}</span>
        <span className="opacity-70">↗ open</span>
      </div>
      {/* Title block */}
      <div className="px-3 pt-2 pb-1.5 hairline-b">
        <div className="text-[13px] font-semibold leading-tight tracking-tight">{n.title}</div>
        <div className="text-[10.5px] text-[var(--ink-3)] mono mt-0.5 truncate">{n.sub}</div>
      </div>
      {/* Iframe thumbnail */}
      <div className="relative" style={{ height: n.h - 26 - 44 }}>
        <iframe
          className="node-iframe absolute top-0 left-0"
          src={`index.html#route=${n.route}`}
          width={1440}
          height={900}
          style={{ transform: `scale(${(n.w) / 1440})`, width: 1440, height: 900 }}
          loading="lazy"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 70%, rgba(0,0,0,.04))' }} />
      </div>
    </div>
  );
}

function DecisionDiamond({ d }) {
  return (
    <div className="absolute" style={{ left: d.x - 50, top: d.y - 50, width: 100, height: 100 }}>
      <div className="diamond w-full h-full flex items-center justify-center">
        <div className="diamond-label px-2">{d.label}</div>
      </div>
    </div>
  );
}

// ============================================================
// EDGE
// ============================================================
function Edge({ e }) {
  const from = nodeRect(e.from);
  const to = nodeRect(e.to);
  if (!from || !to) return null;
  const { d, mid } = buildPath(from, to);
  const labelW = Math.max(28, e.label.length * 5.6 + 10);
  return (
    <g>
      <path className={`edge-path ${e.kind}`} d={d} markerEnd={`url(#arrow-${e.kind})`} />
      {e.label && (
        <g>
          <rect className="edge-label-bg" x={mid.x - labelW / 2} y={mid.y - 7} width={labelW} height={14} rx={3} />
          <text className="edge-label" x={mid.x} y={mid.y + 3} textAnchor="middle">{e.label}</text>
        </g>
      )}
    </g>
  );
}

// ============================================================
// APP
// ============================================================
function App() {
  const { ref, t, setT, onPointerDown, onPointerMove, onPointerUp } = usePanZoom();
  const [hover, setHover] = useState(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });

  const onHover = (n, e) => {
    if (n) { setHover(n); setHoverPos({ x: e.clientX, y: e.clientY }); }
    else setHover(null);
  };

  const openNode = (n) => {
    window.open(`index.html#route=${n.route}`, '_blank');
  };

  const reset = () => setT({ x: 40, y: 40, k: 0.42 });
  const zoomTo = (k) => setT(prev => ({ ...prev, k }));
  const fitAll = () => {
    const vw = window.innerWidth - 40;
    const vh = window.innerHeight - 100;
    const k = Math.min(vw / CANVAS.w, vh / CANVAS.h);
    setT({ x: 20, y: 60, k });
  };

  return (
    <div className="w-screen h-screen relative overflow-hidden flex flex-col">
      {/* Top bar */}
      <div className="hairline-b bg-[var(--paper)] px-4 h-12 flex items-center gap-3 z-20 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[var(--ink)] text-[var(--paper)] flex items-center justify-center mono text-[11px] font-bold">M3</div>
          <div className="leading-tight">
            <div className="text-[12.5px] font-bold tracking-tight">MES Suite — Flow Map</div>
            <div className="text-[9.5px] uppercase tracking-[0.15em] text-[var(--ink-3)]">{NODES.length} screens · {EDGES.length} connections</div>
          </div>
        </div>
        <div className="w-px h-5 bg-[var(--line)] mx-2" />
        <a href="index.html" className="text-[12px] text-[var(--ink-3)] hover:text-[var(--ink)] flex items-center gap-1">← Back to prototype</a>
        <div className="flex-1" />
        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] mono">
          <LegendDot color="oklch(0.55 0.012 260)" label="flow" />
          <LegendDot color="oklch(0.7 0.13 75)" label="auto-gen" dashed />
          <LegendDot color="oklch(0.6 0.21 27)" label="recovery" />
          <LegendDot color="oklch(0.6 0.14 235)" label="data" dashed />
          <LegendDot color="oklch(0.55 0.17 285)" label="event" dashed />
        </div>
        <div className="w-px h-5 bg-[var(--line)] mx-2" />
        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <button className="hairline rounded h-7 w-7 flex items-center justify-center text-[14px]" onClick={() => zoomTo(Math.min(2.5, t.k * 1.2))}>+</button>
          <span className="mono text-[11px] tabular w-10 text-center text-[var(--ink-3)]">{Math.round(t.k * 100)}%</span>
          <button className="hairline rounded h-7 w-7 flex items-center justify-center text-[14px]" onClick={() => zoomTo(Math.max(0.15, t.k * 0.83))}>−</button>
          <button className="hairline rounded h-7 px-2 text-[11px] mono ml-1" onClick={fitAll}>fit</button>
          <button className="hairline rounded h-7 px-2 text-[11px] mono" onClick={reset}>reset</button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={ref}
        className="flex-1 relative canvas-bg cursor-grab active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <div
          className="absolute origin-top-left"
          style={{ transform: `translate(${t.x}px, ${t.y}px) scale(${t.k})`, width: CANVAS.w, height: CANVAS.h }}
        >
          {/* Phase swimlanes */}
          {PHASES.map(p => (
            <div key={p.id} className="phase-band absolute left-0" style={{ top: p.y[0], width: CANVAS.w, height: p.y[1] - p.y[0], background: p.color }}>
              <div className="phase-label absolute" style={{ left: 16, top: 16, color: p.ink }}>{p.label}</div>
              <div className="absolute left-0 right-0 bottom-0 h-px" style={{ background: 'oklch(0.85 0.01 260)' }} />
            </div>
          ))}

          {/* SVG edges layer */}
          <svg className="absolute inset-0 pointer-events-none" width={CANVAS.w} height={CANVAS.h}>
            <defs>
              {['flow','auto','recovery','data','event'].map(k => (
                <marker key={k} id={`arrow-${k}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill={
                    k === 'flow' ? 'oklch(0.55 0.012 260)' :
                    k === 'auto' ? 'oklch(0.7 0.13 75)' :
                    k === 'recovery' ? 'oklch(0.6 0.21 27)' :
                    k === 'data' ? 'oklch(0.6 0.14 235)' :
                    'oklch(0.55 0.17 285)'
                  } />
                </marker>
              ))}
            </defs>
            {EDGES.map((e, i) => <Edge key={i} e={e} />)}
          </svg>

          {/* Decision diamonds */}
          {DECISIONS.map(d => <DecisionDiamond key={d.id} d={d} />)}

          {/* Nodes */}
          {NODES.map(n => <NodeCard key={n.id} n={n} onOpen={openNode} onHover={onHover} />)}
        </div>

        {/* Hover info panel */}
        {hover && (
          <div className="pin-info" style={{ left: Math.min(hoverPos.x + 16, window.innerWidth - 300), top: Math.min(hoverPos.y + 16, window.innerHeight - 160) }}>
            <div className="font-semibold text-[12px]"><b>{hover.title}</b></div>
            <div className="mono text-[10px] opacity-70 mt-0.5">{hover.surface.toUpperCase()} · {PHASES.find(p => p.id === hover.phase)?.label}</div>
            <div className="mt-1.5 text-[11.5px] opacity-90">{hover.note}</div>
            <div className="mt-1.5 text-[10px] mono opacity-50">click to open ↗</div>
          </div>
        )}

        {/* Minimap */}
        <Minimap t={t} setT={setT} />

        {/* Help */}
        <div className="absolute left-4 bottom-4 text-[10.5px] mono text-[var(--ink-3)] bg-[var(--paper)]/80 backdrop-blur hairline rounded px-2 py-1.5 leading-relaxed">
          <div>drag to pan · scroll to zoom · click a screen to open</div>
        </div>
      </div>
    </div>
  );
}

function LegendDot({ color, label, dashed }) {
  return (
    <div className="flex items-center gap-1.5">
      <svg width="22" height="6"><line x1="0" y1="3" x2="22" y2="3" stroke={color} strokeWidth="1.5" strokeDasharray={dashed ? '3 2' : ''} /></svg>
      <span className="text-[var(--ink-3)]">{label}</span>
    </div>
  );
}

function Minimap({ t, setT }) {
  const W = 200, H = (CANVAS.h / CANVAS.w) * W;
  const vx = -t.x / t.k * (W / CANVAS.w);
  const vy = -t.y / t.k * (W / CANVAS.w);
  const vw = (window.innerWidth / t.k) * (W / CANVAS.w);
  const vh = (window.innerHeight / t.k) * (W / CANVAS.w);
  return (
    <div className="absolute right-4 bottom-4 hairline rounded bg-[var(--paper)]/95 backdrop-blur p-1 z-10">
      <svg width={W} height={H}>
        {PHASES.map(p => (
          <rect key={p.id} x={0} y={p.y[0] * (W/CANVAS.w)} width={W} height={(p.y[1]-p.y[0])*(W/CANVAS.w)} fill={p.color} />
        ))}
        {NODES.map(n => (
          <rect key={n.id} x={n.x*(W/CANVAS.w)} y={n.y*(W/CANVAS.w)} width={n.w*(W/CANVAS.w)} height={n.h*(W/CANVAS.w)}
            fill={n.surface === 'hmi' ? 'oklch(0.78 0.16 75)' : n.surface === 'andon' ? '#000' : 'oklch(0.18 0.012 260)'} opacity="0.55" />
        ))}
        <rect x={vx} y={vy} width={vw} height={vh} fill="none" stroke="oklch(0.55 0.17 285)" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
