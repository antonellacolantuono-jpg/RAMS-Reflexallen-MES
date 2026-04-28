/* global React, ReactDOM, DesignCanvas, DCSection, DCArtboard,
   GlassPlantOverview, GlassWODetail, GlassAndon */

const Probe = () => (
  <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column' }}>
    <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(0,0,0,0.08)', background: '#f0eee9', flexShrink: 0 }}>
      <div style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600, color: '#6b6660' }}>RAMS · Style Probe</div>
      <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em', marginTop: 2 }}>Glassmorphism direction</div>
      <div style={{ fontSize: 12, color: '#6b6660', marginTop: 4, maxWidth: 720 }}>3 representative screens rendered in the glass direction. Drag to pan, scroll to zoom, double-click an artboard to focus. Compare against the current industrial-utilitarian system.</div>
    </div>
    <div style={{ flex: 1, position: 'relative' }}>
      <DesignCanvas>
        <DCSection title="Direction · Glassmorphism" subtitle="Translucent panels, ambient gradients, soft inner highlights, glow accents. Premium consumer feel — best for executive dashboards & Andon. Use with caution on touch HMI.">
          <DCArtboard label="Plant Overview" width={1400} height={900}>
            <GlassPlantOverview />
          </DCArtboard>
          <DCArtboard label="Work Order Detail" width={1400} height={1000}>
            <GlassWODetail />
          </DCArtboard>
          <DCArtboard label="Andon Dashboard (fullscreen)" width={1600} height={1100}>
            <GlassAndon />
          </DCArtboard>
        </DCSection>
      </DesignCanvas>
    </div>
  </div>
);

ReactDOM.createRoot(document.getElementById('root')).render(<Probe />);
