/* global React, ReactDOM, DesignCanvas, DCSection, DCArtboard,
   LightPlantOverview, LightWODetail, LightAndon */

const Probe = () => (
  <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column' }}>
    <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(0,0,0,0.08)', background: '#f0eee9', flexShrink: 0 }}>
      <div style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600, color: '#6b6660' }}>RAMS · Style Probe</div>
      <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em', marginTop: 2 }}>Light · Industrial-Utilitarian</div>
      <div style={{ fontSize: 12, color: '#6b6660', marginTop: 4, maxWidth: 720 }}>The same 3 screens redrawn in the existing RAMS token system: paper surfaces, hairline borders, viola accent, tabular numerals, phase colors. Drag to pan, scroll to zoom, double-click an artboard to focus.</div>
    </div>
    <div style={{ flex: 1, position: 'relative' }}>
      <DesignCanvas>
        <DCSection title="Direction · Light Industrial-Utilitarian" subtitle="No blur, no glow, no shadow. The visual language already in the live RAMS prototype — confirmed as the chosen baseline.">
          <DCArtboard label="Plant Overview" width={1400} height={900}>
            <LightPlantOverview />
          </DCArtboard>
          <DCArtboard label="Work Order Detail" width={1400} height={1000}>
            <LightWODetail />
          </DCArtboard>
          <DCArtboard label="Andon Dashboard (fullscreen)" width={1600} height={1000}>
            <LightAndon />
          </DCArtboard>
        </DCSection>
      </DesignCanvas>
    </div>
  </div>
);

ReactDOM.createRoot(document.getElementById('root')).render(<Probe />);
