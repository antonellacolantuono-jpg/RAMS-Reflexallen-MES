/* global React */
// Mock data for the entire MES prototype
window.MESData = (() => {
  const items = [
    { id: 'i1', code: 'ITM-FG-00042', name: 'Brake Caliper Assembly', type: 'finished_good', uom: 'pc', tracking: 'serial', img: 'caliper' },
    { id: 'i2', code: 'ITM-SL-00118', name: 'Caliper Body, Machined', type: 'semi_finished', uom: 'pc', tracking: 'serial', img: 'body' },
    { id: 'i3', code: 'ITM-MP-00903', name: 'Aluminum Billet 7075-T6', type: 'raw_material', uom: 'kg', tracking: 'lot', img: 'billet' },
    { id: 'i4', code: 'ITM-CMP-00211', name: 'Piston Seal, NBR 32mm', type: 'component', uom: 'pc', tracking: 'lot', img: 'seal' },
    { id: 'i5', code: 'ITM-CMP-00284', name: 'Brake Piston, Phenolic', type: 'component', uom: 'pc', tracking: 'lot', img: 'piston' },
    { id: 'i6', code: 'ITM-CMP-00177', name: 'Bleeder Screw M10', type: 'component', uom: 'pc', tracking: 'lot' },
    { id: 'i7', code: 'ITM-CSM-00012', name: 'Brake Fluid DOT-4 (5L)', type: 'consumable', uom: 'l', tracking: 'lot' },
  ];

  const workOrders = [
    { id: 'w1', code: 'WO-2026-0142', item: 'i1', itemName: 'Brake Caliper Assembly', qtyTarget: 240, qtyProduced: 168, qtyScrap: 4, qtyRework: 2, status: 'in_progress', priority: 'high', type: 'production', plannedStart: '2026-04-26 06:00', plannedEnd: '2026-04-27 14:00', operator: 'M. Conti', workCenter: 'WC-A2 · Line 2', workflow: 'WF-0042 v3' },
    { id: 'w2', code: 'WO-2026-0143', item: 'i1', itemName: 'Brake Caliper Assembly', qtyTarget: 120, qtyProduced: 0, qtyScrap: 0, qtyRework: 0, status: 'released', priority: 'normal', type: 'production', plannedStart: '2026-04-27 14:00', plannedEnd: '2026-04-28 02:00', operator: '—', workCenter: 'WC-A2 · Line 2', workflow: 'WF-0042 v3' },
    { id: 'w3', code: 'WO-2026-0140', item: 'i2', itemName: 'Caliper Body, Machined', qtyTarget: 500, qtyProduced: 500, qtyScrap: 11, qtyRework: 6, status: 'completed', priority: 'normal', type: 'production', plannedStart: '2026-04-25 06:00', plannedEnd: '2026-04-26 14:00', operator: 'L. Russo', workCenter: 'WC-B1 · CNC Cell', workflow: 'WF-0017 v5' },
    { id: 'w4', code: 'WO-2026-0144', item: 'i1', itemName: 'Brake Caliper Assembly', qtyTarget: 60, qtyProduced: 0, qtyScrap: 0, qtyRework: 0, status: 'planned', priority: 'urgent', type: 'rework', plannedStart: '2026-04-27 22:00', plannedEnd: '2026-04-28 06:00', operator: '—', workCenter: 'WC-A2 · Line 2', workflow: 'WF-0042 v3' },
    { id: 'w5', code: 'WO-2026-0141', item: 'i2', itemName: 'Caliper Body, Machined', qtyTarget: 400, qtyProduced: 312, qtyScrap: 7, qtyRework: 3, status: 'on_hold', priority: 'high', type: 'production', plannedStart: '2026-04-26 14:00', plannedEnd: '2026-04-27 06:00', operator: 'A. Bianchi', workCenter: 'WC-B1 · CNC Cell', workflow: 'WF-0017 v5', holdReason: 'No material — ITM-MP-00903' },
    { id: 'w6', code: 'WO-2026-0139', item: 'i1', itemName: 'Brake Caliper Assembly', qtyTarget: 200, qtyProduced: 195, qtyScrap: 5, qtyRework: 0, status: 'partially_completed', priority: 'normal', type: 'production', plannedStart: '2026-04-24 06:00', plannedEnd: '2026-04-25 14:00', operator: 'L. Russo', workCenter: 'WC-A2 · Line 2', workflow: 'WF-0042 v2' },
    { id: 'w7', code: 'WO-2026-0138', item: 'i2', itemName: 'Caliper Body, Machined', qtyTarget: 80, qtyProduced: 0, qtyScrap: 0, qtyRework: 0, status: 'cancelled', priority: 'low', type: 'prototype', plannedStart: '2026-04-23 06:00', plannedEnd: '2026-04-23 14:00', operator: '—', workCenter: 'WC-B1 · CNC Cell', workflow: 'WF-0017 v4' },
    { id: 'w8', code: 'WO-2026-0145', item: 'i1', itemName: 'Brake Caliper Assembly', qtyTarget: 300, qtyProduced: 0, qtyScrap: 0, qtyRework: 0, status: 'draft', priority: 'normal', type: 'production', plannedStart: '2026-04-28 06:00', plannedEnd: '2026-04-29 14:00', operator: '—', workCenter: 'WC-A2 · Line 2', workflow: 'WF-0042 v3' },
  ];

  const equipment = [
    { id: 'e1', code: 'SITE-MILANO', name: 'Site Milano', level: 'site', class: 'production', status: 'available', parent: null },
    { id: 'e2', code: 'AREA-ASSY', name: 'Assembly Area', level: 'area', class: 'production', status: 'available', parent: 'e1' },
    { id: 'e3', code: 'AREA-MACH', name: 'Machining Area', level: 'area', class: 'production', status: 'available', parent: 'e1' },
    { id: 'e4', code: 'WC-A2', name: 'Caliper Line 2', level: 'work_center', class: 'production', status: 'in_use', parent: 'e2' },
    { id: 'e5', code: 'WC-B1', name: 'CNC Cell 1', level: 'work_center', class: 'production', status: 'in_use', parent: 'e3' },
    { id: 'e6', code: 'WS-A2-01', name: 'Assembly WS 01', level: 'work_unit', class: 'production', status: 'in_use', parent: 'e4' },
    { id: 'e7', code: 'WS-A2-02', name: 'Assembly WS 02', level: 'work_unit', class: 'production', status: 'available', parent: 'e4' },
    { id: 'e8', code: 'WS-B1-01', name: 'CNC WS 01', level: 'work_unit', class: 'production', status: 'maintenance', parent: 'e5' },
    { id: 'e9', code: 'DEV-LEAK-01', name: 'Leak Tester', level: 'equipment_module', class: 'test', status: 'in_use', parent: 'e6', deviceType: 'leak_tester' },
    { id: 'e10', code: 'DEV-PRESS-01', name: 'Hydraulic Press', level: 'equipment_module', class: 'production', status: 'in_use', parent: 'e6', deviceType: 'press' },
    { id: 'e11', code: 'DEV-SCN-01', name: 'Datamatrix Scanner', level: 'equipment_module', class: 'test', status: 'available', parent: 'e6', deviceType: 'scanner' },
    { id: 'e12', code: 'DEV-CNC-01', name: 'CNC Mill 5-axis', level: 'equipment_module', class: 'production', status: 'broken', parent: 'e8', deviceType: 'press' },
  ];

  const boxTypes = [
    { id: 'bt1', code: 'BTYPE-PLT-001', name: 'EUR Pallet (1200×800)', category: 'standard_pallet', maxUnits: 48, maxWeightKg: 1500, returnable: true, requiresSeal: false, tracking: 'serial', cycles: 80 },
    { id: 'bt2', code: 'BTYPE-CRT-007', name: 'Plastic Crate 600×400', category: 'plastic_crate', maxUnits: 24, maxWeightKg: 25, returnable: true, requiresSeal: false, tracking: 'mixed', cycles: 200 },
    { id: 'bt3', code: 'BTYPE-CBX-014', name: 'Cardboard Box L', category: 'cardboard_box', maxUnits: 12, maxWeightKg: 18, returnable: false, requiresSeal: true, tracking: 'serial', cycles: 1 },
    { id: 'bt4', code: 'BTYPE-KAN-022', name: 'Kanban Bin Small', category: 'kanban_bin', maxUnits: 60, maxWeightKg: 8, returnable: true, requiresSeal: false, tracking: 'quantity', cycles: 500 },
    { id: 'bt5', code: 'BTYPE-MTL-003', name: 'Steel Container 1m³', category: 'metal_container', maxUnits: 200, maxWeightKg: 800, returnable: true, requiresSeal: true, tracking: 'mixed', cycles: 1500 },
  ];

  const boxes = [
    { id: 'b1', code: 'BOX-PLT-001234', type: 'bt1', status: 'partially_filled', currentUnits: 24, currentWeight: 312.0, location: 'WIP-A2', cycles: 14, condition: 92, sealed: false },
    { id: 'b2', code: 'BOX-PLT-001235', type: 'bt1', status: 'sealed', currentUnits: 48, currentWeight: 624.0, location: 'SHIP-DOCK-3', cycles: 22, condition: 88, sealed: true, sealNumber: 'SEAL-2026-00742' },
    { id: 'b3', code: 'BOX-CRT-004821', type: 'bt2', status: 'empty', currentUnits: 0, currentWeight: 0, location: 'BUFFER-L2', cycles: 87, condition: 71, sealed: false },
    { id: 'b4', code: 'BOX-CBX-009114', type: 'bt3', status: 'shipped', currentUnits: 12, currentWeight: 14.4, location: 'CUSTOMER-FERRARI', cycles: 1, condition: 100, sealed: true, sealNumber: 'SEAL-2026-00741' },
    { id: 'b5', code: 'BOX-KAN-012003', type: 'bt4', status: 'full', currentUnits: 60, currentWeight: 7.2, location: 'WS-A2-01', cycles: 312, condition: 64, sealed: false },
    { id: 'b6', code: 'BOX-MTL-000812', type: 'bt5', status: 'returned', currentUnits: 0, currentWeight: 0, location: 'RECV-DOCK-1', cycles: 421, condition: 58, sealed: false },
    { id: 'b7', code: 'BOX-CRT-004822', type: 'bt2', status: 'in_cleaning', currentUnits: 0, currentWeight: 0, location: 'WASH-BAY', cycles: 142, condition: 78, sealed: false },
    { id: 'b8', code: 'BOX-PLT-001190', type: 'bt1', status: 'damaged', currentUnits: 0, currentWeight: 0, location: 'QUAR-A', cycles: 156, condition: 12, sealed: false },
  ];

  const recipes = [
    { id: 'r1', code: 'RCP-LEAK-001', name: 'Caliper Leak Test', version: 'v3', status: 'approved', device: 'DEV-LEAK-01', cycleTime: 42 },
    { id: 'r2', code: 'RCP-CNC-014', name: 'Body Roughing 7075', version: 'v5', status: 'approved', device: 'DEV-CNC-01', cycleTime: 186 },
    { id: 'r3', code: 'RCP-PRESS-007', name: 'Piston Insertion 8kN', version: 'v2', status: 'approved', device: 'DEV-PRESS-01', cycleTime: 18 },
    { id: 'r4', code: 'RCP-LEAK-002', name: 'Caliper Leak Test (HP)', version: 'v1', status: 'draft', device: 'DEV-LEAK-01', cycleTime: 55 },
  ];

  const skills = [
    { id: 's1', code: 'SKL-ASSY', name: 'Assembly Line', operators: 12, status: 'active' },
    { id: 's2', code: 'SKL-CNC', name: 'CNC Operation', operators: 5, status: 'active' },
    { id: 's3', code: 'SKL-QC', name: 'Quality Control', operators: 4, status: 'active' },
    { id: 's4', code: 'SKL-FORK', name: 'Forklift Driver', operators: 8, status: 'active' },
    { id: 's5', code: 'SKL-LEAK', name: 'Leak Tester Cert.', operators: 3, status: 'active' },
  ];

  const operators = [
    { id: 'o1', name: 'Marco Conti', code: 'OP-0142', shift: 'A · 06–14', status: 'active', skills: ['SKL-ASSY', 'SKL-LEAK'], wo: 'WO-2026-0142' },
    { id: 'o2', name: 'Lucia Russo', code: 'OP-0091', shift: 'A · 06–14', status: 'active', skills: ['SKL-ASSY', 'SKL-QC'], wo: '—' },
    { id: 'o3', name: 'Andrea Bianchi', code: 'OP-0203', shift: 'B · 14–22', status: 'active', skills: ['SKL-CNC'], wo: '—' },
    { id: 'o4', name: 'Sara Romano', code: 'OP-0118', shift: 'B · 14–22', status: 'training', skills: ['SKL-ASSY'], wo: '—' },
    { id: 'o5', name: 'Davide Marini', code: 'OP-0250', shift: 'C · 22–06', status: 'active', skills: ['SKL-FORK'], wo: '—' },
  ];

  const causeCodes = [
    { id: 'c1', code: 'DT-BD-001', label: 'Mechanical breakdown', cat: 'breakdown' },
    { id: 'c2', code: 'DT-BD-002', label: 'Electrical fault', cat: 'breakdown' },
    { id: 'c3', code: 'DT-SU-001', label: 'Format changeover', cat: 'setup_adjustment' },
    { id: 'c4', code: 'DT-MS-001', label: 'Jam clearance', cat: 'minor_stop' },
    { id: 'c5', code: 'DT-NM-001', label: 'No material', cat: 'no_material' },
    { id: 'c6', code: 'SCRP-DM-001', label: 'Dimensional out of tolerance', cat: 'dimensional' },
    { id: 'c7', code: 'SCRP-CO-001', label: 'Cosmetic defect', cat: 'cosmetic' },
  ];

  const attentionPoints = [
    { id: 'a1', code: 'AP-SAFETY-042', cat: 'safety', title: 'Hot surface — wear gloves', source: 'manual' },
    { id: 'a2', code: 'AP-QUALITY-019', cat: 'quality', title: 'Tolerance ±0.02mm critical', source: 'lesson_learned' },
    { id: 'a3', code: 'AP-TECH-031', cat: 'technical', title: 'Apply torque cross-pattern', source: 'manual' },
    { id: 'a4', code: 'AP-REG-007', cat: 'regulatory', title: 'Sign batch record before exit', source: 'regulatory' },
    { id: 'a5', code: 'AP-GEN-114', cat: 'general', title: 'Wipe sealing groove before insertion', source: 'lesson_learned' },
  ];

  // Workflow definition for WF-0042 (Brake Caliper Assembly)
  const workflow = {
    code: 'WF-0042', name: 'Brake Caliper Assembly', version: 'v3', status: 'active',
    phases: [
      { id: 'p1', code: 'inbound', name: 'Inbound Logistics', icon: '📥', autogen: false, groups: [
        { id: 'g1', cat: 'logistics', name: 'Material Reception', steps: [
          { id: 'st1', cat: 'identification', action: 'scan_qr', title: 'Scan delivery note QR' },
          { id: 'st2', cat: 'logistics', action: 'move', title: 'Move pallet to staging' },
        ]},
      ]},
      { id: 'p2', code: 'setup', name: 'Setup', icon: '🔧', autogen: true, groups: [
        { id: 'g2', cat: 'skills_check', name: 'Skills Check', autogen: true, steps: [
          { id: 'st3', cat: 'identification', action: 'verify_skill', title: 'Verify operator: SKL-ASSY' },
          { id: 'st4', cat: 'identification', action: 'verify_skill', title: 'Verify operator: SKL-LEAK' },
        ]},
        { id: 'g3', cat: 'bom_check', name: 'BOM Check (Sequential)', autogen: true, steps: [
          { id: 'st5', cat: 'identification', action: 'scan_datamatrix', title: 'Scan: Caliper Body (qty 1)' },
          { id: 'st6', cat: 'identification', action: 'scan_datamatrix', title: 'Scan: Piston Seal (qty 2)' },
          { id: 'st7', cat: 'identification', action: 'scan_datamatrix', title: 'Scan: Brake Piston (qty 2)' },
          { id: 'st8', cat: 'identification', action: 'scan_datamatrix', title: 'Scan: Bleeder Screw (qty 1)' },
        ]},
        { id: 'g4', cat: 'tooling_check', name: 'Tooling Check', autogen: true, steps: [
          { id: 'st9', cat: 'identification', action: 'verify_tool', title: 'Verify: Torque wrench 30Nm' },
        ]},
        { id: 'g5', cat: 'device_setup', name: 'Device Setup', autogen: true, steps: [
          { id: 'st10', cat: 'identification', action: 'load_recipe', title: 'Load RCP-LEAK-001 v3 → DEV-LEAK-01' },
          { id: 'st11', cat: 'setup', action: 'first_piece', title: 'First piece approval (QC)' },
        ]},
      ]},
      { id: 'p3', code: 'production', name: 'Production', icon: '⚙️', autogen: false, groups: [
        { id: 'g6', cat: 'assembly', name: 'Caliper Assembly', steps: [
          { id: 'st12', cat: 'production', action: 'assembly', title: 'Insert seals into bores', dur: 22 },
          { id: 'st13', cat: 'production', action: 'assembly', title: 'Press-fit pistons', dur: 18, recipe: 'RCP-PRESS-007' },
          { id: 'st14', cat: 'production', action: 'assembly', title: 'Torque bleeder M10', dur: 12 },
        ]},
        { id: 'g7', cat: 'device_execution', name: 'Leak Test (Device)', steps: [
          { id: 'st15', cat: 'production', action: 'device_run', title: 'Pre: load fixture', dur: 8, devCat: 'pre' },
          { id: 'st16', cat: 'production', action: 'device_run', title: 'Run leak test', dur: 42, devCat: 'device_main', recipe: 'RCP-LEAK-001' },
          { id: 'st17', cat: 'identification', action: 'apply_label', title: 'Label NEXT piece', dur: 0, devCat: 'parallel', partRef: 'next' },
          { id: 'st18', cat: 'quality_control', action: 'visual_check', title: 'Visual: PREVIOUS piece', dur: 0, devCat: 'parallel', partRef: 'previous' },
          { id: 'st19', cat: 'production', action: 'device_run', title: 'Post: unload', dur: 6, devCat: 'post' },
        ]},
      ]},
      { id: 'p4', code: 'quality_control', name: 'QC', icon: '🎯', autogen: false, groups: [
        { id: 'g8', cat: 'qc', name: 'Final QC', steps: [
          { id: 'st20', cat: 'quality_control', action: 'dimensional_check', title: 'Dimensional ±0.02mm' },
          { id: 'st21', cat: 'quality_control', action: 'visual_check', title: 'Visual surface check' },
        ]},
      ]},
      { id: 'p5', code: 'outbound', name: 'Outbound', icon: '📤', autogen: false, groups: [
        { id: 'g9', cat: 'packaging', name: 'Packaging', autogen: true, steps: [
          { id: 'st22', cat: 'logistics', action: 'select_empty_box', title: 'Select empty BTYPE-CBX-014' },
          { id: 'st23', cat: 'logistics', action: 'pack_into_box', title: 'Pack piece into box' },
          { id: 'st24', cat: 'identification', action: 'validate_box_capacity', title: 'Validate capacity' },
          { id: 'st25', cat: 'logistics', action: 'seal_box', title: 'Seal box' },
          { id: 'st26', cat: 'identification', action: 'print_box_label', title: 'Print box label' },
        ]},
      ]},
      { id: 'p6', code: 'teardown', name: 'Teardown', icon: '✅', autogen: true, groups: [
        { id: 'g10', cat: 'tooling_check', name: 'Tool Return', autogen: true, steps: [
          { id: 'st27', cat: 'teardown', action: 'verify_tool', title: 'Return torque wrench' },
        ]},
        { id: 'g11', cat: 'device_setup', name: 'Device Reset', autogen: true, steps: [
          { id: 'st28', cat: 'teardown', action: 'unload_recipe', title: 'Unload recipe' },
          { id: 'st29', cat: 'teardown', action: 'cleanup', title: 'Cleanup workstation' },
        ]},
      ]},
    ]
  };

  const bomTree = {
    root: 'i1',
    nodes: {
      i1: { qty: 1, children: [
        { id: 'i2', qty: 1, children: [
          { id: 'i3', qty: 1.4 },
        ]},
        { id: 'i4', qty: 2 },
        { id: 'i5', qty: 2 },
        { id: 'i6', qty: 1 },
        { id: 'i7', qty: 0.05 },
      ]}
    }
  };

  return { items, workOrders, equipment, boxTypes, boxes, recipes, skills, operators, causeCodes, attentionPoints, workflow, bomTree };
})();
