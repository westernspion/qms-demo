// ============================================================================
// data.js — All fake data for RAG QMS Demo
// Corning-adjacent: specialty glass, optical fiber, advanced materials
// ============================================================================

// Company branding
export const COMPANY = {
  name: 'Apex Glass Technologies',
  tagline: 'Precision Glass & Advanced Optical Materials',
  division: 'Specialty Materials Division',
};

// Dashboard stats (animated counters will count up to these)
export const STATS = {
  totalDocuments: 12847,
  activeCAPAs: 23,
  complianceScore: 97.3,
  pendingReviews: 8,
  aiActionsToday: 147,
  riskScore: 'Low',
};

// Recent AI activity feed entries
export const AI_ACTIVITY = [
  { time: '2 min ago',  action: 'Auto-classified SOP-2024-031 as "Manufacturing Process Control"', type: 'classification', icon: 'brain' },
  { time: '5 min ago',  action: 'Generated root cause analysis for CAPA-089 (Fiber Draw Tension Deviation)', type: 'analysis', icon: 'sparkles' },
  { time: '12 min ago', action: 'Detected regulatory cross-reference: ISO 9001:2015 §8.5.1 in WI-4420', type: 'detection', icon: 'link' },
  { time: '18 min ago', action: 'Flagged NCR-2024-156 as potential duplicate of NCR-2024-141', type: 'flag', icon: 'flag' },
  { time: '24 min ago', action: 'Auto-generated corrective action plan for Supplier Deviation SD-0892', type: 'generation', icon: 'wand' },
  { time: '31 min ago', action: 'Updated risk matrix for Glass Tempering Process P-2200', type: 'update', icon: 'shield' },
  { time: '45 min ago', action: 'Completed batch review of 34 incoming inspection records', type: 'review', icon: 'check' },
  { time: '1 hr ago',   action: 'Identified training gap: 3 operators missing Furnace Safety SOP certification', type: 'training', icon: 'alert' },
  { time: '1.5 hr ago', action: 'Cross-referenced CAPA-087 with supplier audit findings from Q3', type: 'xref', icon: 'search' },
  { time: '2 hr ago',   action: 'Extracted 12 action items from Management Review Meeting Minutes MR-2024-Q4', type: 'extraction', icon: 'file' },
];

// Documents database
export const DOCUMENTS = [
  { id: 'SOP-2024-031', title: 'Optical Fiber Draw Process Control', type: 'SOP', status: 'Active', version: '4.2', owner: 'Dr. Sarah Chen', dept: 'Fiber Optics', lastReview: '2024-11-15', nextReview: '2025-05-15', aiScore: 0.96 },
  { id: 'SOP-2024-028', title: 'Glass Substrate Cleaning Procedure', type: 'SOP', status: 'Active', version: '3.1', owner: 'James Rodriguez', dept: 'Display Technologies', lastReview: '2024-10-22', nextReview: '2025-04-22', aiScore: 0.91 },
  { id: 'SOP-2024-019', title: 'Fusion Draw Machine Calibration', type: 'SOP', status: 'Under Review', version: '5.0', owner: 'Dr. Sarah Chen', dept: 'Manufacturing', lastReview: '2024-09-01', nextReview: '2025-03-01', aiScore: 0.88 },
  { id: 'WI-4420',      title: 'Borosilicate Glass Batch Mixing', type: 'Work Instruction', status: 'Active', version: '2.3', owner: 'Michael Torres', dept: 'Batch Processing', lastReview: '2024-08-14', nextReview: '2025-02-14', aiScore: 0.94 },
  { id: 'WI-4455',      title: 'Fiber Preform Deposition Parameters', type: 'Work Instruction', status: 'Active', version: '6.1', owner: 'Dr. Li Wei', dept: 'Fiber Optics', lastReview: '2024-11-02', nextReview: '2025-05-02', aiScore: 0.97 },
  { id: 'WI-4398',      title: 'Anti-Reflective Coating Application', type: 'Work Instruction', status: 'Active', version: '3.0', owner: 'Rebecca Hoffman', dept: 'Optical Coatings', lastReview: '2024-07-19', nextReview: '2025-01-19', aiScore: 0.89 },
  { id: 'CAPA-089',     title: 'Fiber Draw Tension Deviation — Line 3', type: 'CAPA', status: 'In Progress', version: '1.0', owner: 'James Rodriguez', dept: 'Fiber Optics', lastReview: '2024-12-01', nextReview: null, aiScore: 0.82 },
  { id: 'CAPA-087',     title: 'Substrate Thickness Variation — Supplier B', type: 'CAPA', status: 'In Progress', version: '1.2', owner: 'Michael Torres', dept: 'Quality', lastReview: '2024-11-20', nextReview: null, aiScore: 0.79 },
  { id: 'CAPA-085',     title: 'Coating Adhesion Failure — Display Glass', type: 'CAPA', status: 'Closed', version: '2.0', owner: 'Rebecca Hoffman', dept: 'Optical Coatings', lastReview: '2024-10-15', nextReview: null, aiScore: 0.95 },
  { id: 'NCR-2024-156', title: 'Out-of-Spec Refractive Index — Batch 7842', type: 'NCR', status: 'Open', version: '1.0', owner: 'Dr. Li Wei', dept: 'Quality', lastReview: '2024-12-05', nextReview: null, aiScore: 0.73 },
  { id: 'NCR-2024-141', title: 'Surface Defect — Gorilla Glass Substrate Lot 22B', type: 'NCR', status: 'Under Investigation', version: '1.1', owner: 'James Rodriguez', dept: 'Display Technologies', lastReview: '2024-11-28', nextReview: null, aiScore: 0.77 },
  { id: 'NCR-2024-138', title: 'Fiber Attenuation Exceeds Spec — Spool 9920', type: 'NCR', status: 'Closed', version: '2.0', owner: 'Dr. Sarah Chen', dept: 'Fiber Optics', lastReview: '2024-11-10', nextReview: null, aiScore: 0.92 },
  { id: 'AR-2024-Q3',   title: 'Q3 2024 Internal Audit Report — Fiber Division', type: 'Audit Report', status: 'Final', version: '1.0', owner: 'Compliance Team', dept: 'Quality', lastReview: '2024-10-30', nextReview: '2025-10-30', aiScore: 0.98 },
  { id: 'AR-2024-EXT',  title: 'ISO 9001:2015 Surveillance Audit Report', type: 'Audit Report', status: 'Final', version: '1.0', owner: 'External Auditor', dept: 'Quality', lastReview: '2024-09-20', nextReview: '2025-09-20', aiScore: 0.99 },
  { id: 'TR-2024-015',  title: 'Fusion Draw Furnace Operator Training Record', type: 'Training Record', status: 'Active', version: '1.0', owner: 'HR/Training', dept: 'Manufacturing', lastReview: '2024-11-01', nextReview: '2025-11-01', aiScore: 0.90 },
  { id: 'RA-2024-008',  title: 'Risk Assessment — New Preform Supplier Qualification', type: 'Risk Assessment', status: 'Active', version: '1.1', owner: 'Michael Torres', dept: 'Supply Chain', lastReview: '2024-10-05', nextReview: '2025-04-05', aiScore: 0.86 },
];

// Suppliers
export const SUPPLIERS = [
  { name: 'Silica Source Inc.', code: 'SUP-001', type: 'Raw Material', rating: 'A', location: 'Charlotte, NC' },
  { name: 'PrecisionCoat GmbH', code: 'SUP-002', type: 'Coating Materials', rating: 'A', location: 'Munich, Germany' },
  { name: 'Batch Materials Co.', code: 'SUP-003', type: 'Raw Material', rating: 'B', location: 'Toledo, OH' },
  { name: 'FurnaceTech Japan', code: 'SUP-004', type: 'Equipment', rating: 'A+', location: 'Osaka, Japan' },
  { name: 'Optical Testing Systems', code: 'SUP-005', type: 'Inspection Equipment', rating: 'A', location: 'Rochester, NY' },
  { name: 'CleanRoom Solutions', code: 'SUP-006', type: 'Facility', rating: 'B+', location: 'Portland, OR' },
];

// Pre-built AI search queries and responses
export const SEARCH_QUERIES = [
  {
    query: "What are our nonconformance trends for Silica Source in Q4?",
    response: `Based on analysis of **47 quality records** from Q4 2024, here are the key findings for **Silica Source Inc. (SUP-001)**:

**Nonconformance Summary:**
- **3 NCRs filed** in Q4 2024 (up from 1 in Q3)
- Primary issue: **Refractive index variation** in high-purity silica batches
- Batch rejection rate: **4.2%** (threshold: 2.0%)

**Root Cause Pattern:**
The AI analysis identified a correlation between NCRs and Silica Source's furnace maintenance schedule. All 3 nonconformances occurred within 48 hours of their scheduled furnace reline, suggesting **incomplete post-maintenance qualification**.

**Risk Assessment:**
- Current supplier risk score: **Medium-High** (was Low in Q2)
- Recommended action: Require post-maintenance batch certification before shipment
- Related CAPA: CAPA-087 addresses substrate thickness variation linked to raw material inconsistency

**Regulatory Impact:**
- ISO 9001:2015 §8.4 (Control of externally provided processes) — potential finding
- FDA 21 CFR 211.84 — incoming material testing requirements apply`,
    sources: [
      { id: 'NCR-2024-156', title: 'Out-of-Spec Refractive Index — Batch 7842', relevance: 0.96, snippet: 'Batch 7842 from Silica Source showed refractive index of 1.4589, outside spec range of 1.4570-1.4585...' },
      { id: 'NCR-2024-141', title: 'Surface Defect — Gorilla Glass Substrate Lot 22B', relevance: 0.89, snippet: 'Incoming inspection detected micro-inclusions traced to silica feedstock variation...' },
      { id: 'AR-2024-Q3', title: 'Q3 2024 Internal Audit Report — Fiber Division', relevance: 0.82, snippet: 'Supplier performance metrics show declining trend for SUP-001, recommend increased surveillance...' },
      { id: 'CAPA-087', title: 'Substrate Thickness Variation — Supplier B', relevance: 0.78, snippet: 'Root cause analysis indicates correlation with incoming material lot variation from primary silica supplier...' },
      { id: 'RA-2024-008', title: 'Risk Assessment — New Preform Supplier Qualification', relevance: 0.71, snippet: 'Dual-source qualification recommended to mitigate single-supplier dependency risk...' },
    ]
  },
  {
    query: "Show me all open CAPAs related to fiber optic manufacturing",
    response: `Found **2 active CAPAs** related to fiber optic manufacturing processes:

---

**CAPA-089: Fiber Draw Tension Deviation — Line 3**
- **Status:** In Progress (Phase: Root Cause Analysis)
- **Opened:** 2024-12-01 | **Owner:** James Rodriguez
- **Description:** Draw tension on Line 3 exceeded control limits during overnight production run on Nov 28. 
- **Impact:** 12 spools quarantined, estimated yield loss: $34,200
- **AI Root Cause Hypothesis:** Temperature gradient in the draw furnace heating zone 3 showed a 2.3°C drift correlating with tension spikes. Likely cause: aging heating element approaching end-of-life.
- **AI Confidence:** 87%

---

**CAPA-087: Substrate Thickness Variation — Supplier B**  
- **Status:** In Progress (Phase: Corrective Action Implementation)
- **Opened:** 2024-11-20 | **Owner:** Michael Torres
- **Description:** Incoming inspection data shows increasing thickness variation in glass substrates from Batch Materials Co.
- **Impact:** 3 production delays in Q4, 2.1% increase in scrap rate
- **AI Recommended Actions:**
  1. Implement tighter incoming inspection criteria (AQL shift from 1.0 to 0.65)
  2. Require supplier to provide Cpk data per shipment
  3. Initiate dual-source qualification for backup supplier
- **AI Confidence:** 91%

**Cross-Reference Note:** Both CAPAs share a common thread — raw material variability affecting downstream process stability. Consider systemic review of incoming material qualification procedures.`,
    sources: [
      { id: 'CAPA-089', title: 'Fiber Draw Tension Deviation — Line 3', relevance: 0.99, snippet: 'Draw tension exceeded UCL of 245g on Line 3 during overnight run. SPC chart shows special cause variation...' },
      { id: 'CAPA-087', title: 'Substrate Thickness Variation — Supplier B', relevance: 0.97, snippet: 'Statistical analysis of incoming inspection data shows Cpk declining from 1.8 to 1.1 over last 6 months...' },
      { id: 'SOP-2024-031', title: 'Optical Fiber Draw Process Control', relevance: 0.85, snippet: 'Draw tension shall be maintained within ±5g of setpoint. Any excursion >10g requires immediate line stop...' },
      { id: 'NCR-2024-138', title: 'Fiber Attenuation Exceeds Spec — Spool 9920', relevance: 0.72, snippet: 'Post-mortem analysis links elevated attenuation to draw tension instability during manufacturing...' },
    ]
  },
  {
    query: "What training is required before operating the fusion draw machine?",
    response: `Here's the complete training matrix for **Fusion Draw Machine (FDM) Operation**:

**Required Certifications (in order):**

1. **Glass Manufacturing Safety Fundamentals** (TR-BASE-001)
   - Duration: 8 hours | Validity: 2 years
   - Covers: PPE, chemical handling, high-temperature equipment safety
   - Status: ✅ All current operators certified

2. **Fusion Draw Theory & Principles** (TR-FDM-100)
   - Duration: 16 hours classroom + 8 hours lab
   - Covers: Glass viscosity, thermal profiles, overflow process fundamentals
   - Prerequisite: TR-BASE-001
   - Status: ✅ 12/12 operators current

3. **FDM Operation Level 1 — Supervised** (TR-FDM-200)
   - Duration: 40 hours supervised operation
   - Covers: Startup/shutdown procedures, SPC monitoring, basic troubleshooting
   - Requires: Sign-off from certified Level 2 operator
   - Status: ⚠️ 3 operators expired (due for recertification Feb 2025)

4. **FDM Operation Level 2 — Independent** (TR-FDM-300)
   - Duration: 80 hours + practical assessment
   - Covers: Parameter optimization, grade changes, emergency procedures
   - Status: ✅ 8/8 required operators certified

**⚠️ Gap Identified:**
3 operators on second shift have **expired Level 1 certifications**. AI has auto-generated training requests and notified the Training Coordinator.

**Regulatory References:**
- ISO 9001:2015 §7.2 — Competence
- 21 CFR Part 820.25 — Personnel qualification
- IATF 16949 §7.2.1 — Training requirements`,
    sources: [
      { id: 'TR-2024-015', title: 'Fusion Draw Furnace Operator Training Record', relevance: 0.98, snippet: 'Training matrix for FDM operators. Level 1 certification requires 40 hours supervised operation...' },
      { id: 'SOP-2024-019', title: 'Fusion Draw Machine Calibration', relevance: 0.88, snippet: 'Only Level 2 certified operators may perform calibration adjustments on the fusion draw machine...' },
      { id: 'AR-2024-Q3', title: 'Q3 2024 Internal Audit Report', relevance: 0.76, snippet: 'Observation: Training records for 2nd shift FDM operators approaching expiration. Recommend proactive scheduling...' },
    ]
  }
];

// Document Intelligence — sample document for analysis demo
export const SAMPLE_DOCUMENT = {
  id: 'SOP-2024-031',
  title: 'Optical Fiber Draw Process Control',
  content: `1. PURPOSE
This Standard Operating Procedure establishes the process controls for optical fiber drawing operations at the Apex Glass Technologies Fiber Optics Division.

2. SCOPE  
Applies to all fiber draw lines (Lines 1-4) in Building 7, including preform loading, draw tower operation, coating application, and spool winding.

3. REFERENCES
- ISO 9001:2015 Quality Management Systems
- IEC 60793-2-50 Optical Fibres — Product Specifications
- FDA 21 CFR Part 820 Quality System Regulation
- IATF 16949:2016 Automotive Quality Management
- Internal: WI-4455 Fiber Preform Deposition Parameters
- Internal: WI-4420 Borosilicate Glass Batch Mixing

4. PROCESS PARAMETERS
4.1 Draw Temperature: 2050°C ± 15°C
4.2 Draw Speed: 20-25 m/s (grade dependent)
4.3 Draw Tension: 45-55g (nominal 50g)
4.4 Fiber Diameter: 125.0 ± 0.7 μm
4.5 Coating Diameter: 245 ± 5 μm

5. STATISTICAL PROCESS CONTROL
All parameters in Section 4 shall be monitored continuously using SPC software. Control limits are set at ±3σ. Any special cause variation requires immediate operator response per the escalation matrix.

6. NONCONFORMANCE HANDLING
Any fiber failing to meet specifications shall be quarantined and an NCR initiated within 4 hours of detection.`,
  aiAnalysis: {
    documentType: { label: 'Standard Operating Procedure (SOP)', confidence: 0.98 },
    regulatoryRefs: [
      { standard: 'ISO 9001:2015', sections: ['§7.5 Documented Information', '§8.5.1 Control of Production'], confidence: 0.96 },
      { standard: 'IEC 60793-2-50', sections: ['Optical fiber product specifications'], confidence: 0.94 },
      { standard: 'FDA 21 CFR Part 820', sections: ['§820.70 Production and Process Controls'], confidence: 0.91 },
      { standard: 'IATF 16949:2016', sections: ['§8.5.1.1 Control Plan'], confidence: 0.88 },
    ],
    keyEntities: [
      { entity: 'Draw Temperature', value: '2050°C ± 15°C', type: 'Process Parameter' },
      { entity: 'Draw Speed', value: '20-25 m/s', type: 'Process Parameter' },
      { entity: 'Draw Tension', value: '45-55g', type: 'Process Parameter' },
      { entity: 'Fiber Diameter', value: '125.0 ± 0.7 μm', type: 'Specification' },
      { entity: 'Coating Diameter', value: '245 ± 5 μm', type: 'Specification' },
    ],
    actionItems: [
      'Ensure SPC software is configured for continuous monitoring of all Section 4 parameters',
      'Verify escalation matrix is current and accessible to all operators',
      'Confirm NCR initiation SLA of 4 hours is tracked in quality system',
      'Cross-reference with WI-4455 and WI-4420 for consistency',
    ],
    suggestedTags: ['Fiber Optics', 'Process Control', 'SPC', 'Draw Tower', 'Manufacturing', 'ISO 9001'],
    relatedDocs: ['WI-4455', 'WI-4420', 'CAPA-089', 'NCR-2024-138', 'TR-2024-015'],
  }
};

// CAPA Workflow data
export const CAPA_DETAIL = {
  id: 'CAPA-089',
  title: 'Fiber Draw Tension Deviation — Line 3',
  status: 'In Progress',
  phase: 'Root Cause Analysis',
  priority: 'High',
  owner: 'James Rodriguez',
  openedDate: '2024-12-01',
  targetClose: '2025-01-15',
  ncr: 'NCR-2024-156',
  description: 'During overnight production run on November 28, 2024, fiber draw tension on Line 3 exceeded upper control limit (UCL) of 55g, reaching peak of 62g. Event lasted approximately 45 minutes before operator intervention. 12 spools produced during excursion were quarantined.',
  timeline: [
    { date: '2024-11-28', event: 'Tension excursion detected by SPC system', status: 'completed', aiInvolved: true },
    { date: '2024-11-29', event: 'NCR-2024-156 initiated, 12 spools quarantined', status: 'completed', aiInvolved: false },
    { date: '2024-12-01', event: 'CAPA opened, assigned to J. Rodriguez', status: 'completed', aiInvolved: false },
    { date: '2024-12-03', event: 'AI root cause analysis generated', status: 'completed', aiInvolved: true },
    { date: '2024-12-05', event: 'Engineering review of AI findings', status: 'in_progress', aiInvolved: false },
    { date: '2024-12-10', event: 'Corrective action plan due', status: 'pending', aiInvolved: false },
    { date: '2024-12-20', event: 'Implementation verification', status: 'pending', aiInvolved: true },
    { date: '2025-01-15', event: 'Effectiveness check & closure', status: 'pending', aiInvolved: true },
  ],
  aiRootCause: {
    confidence: 0.87,
    summary: 'Temperature gradient instability in draw furnace heating zone 3, correlated with aging heating element approaching end-of-life.',
    details: [
      'SPC data analysis shows draw tension drift correlating with Zone 3 thermocouple readings beginning Oct 15',
      'Heating element runtime: 4,200 hours (rated life: 4,500 hours — 93% consumed)',
      'Similar failure pattern observed in Line 2 incident from March 2024 (CAPA-071)',
      'Maintenance records show last element replacement was 11 months ago',
    ],
    contributingFactors: [
      'Preventive maintenance interval for heating elements set at 12 months — may need reduction to 10 months',
      'Overnight shift had no Level 2 operator on duty to recognize early drift pattern',
      'SPC alarm threshold may benefit from tighter warning limits',
    ],
  },
  aiCorrectiveActions: {
    confidence: 0.91,
    actions: [
      { action: 'Replace heating element in Zone 3 of Line 3 draw furnace', priority: 'Immediate', owner: 'Maintenance', status: 'Pending' },
      { action: 'Reduce preventive maintenance interval for draw furnace heating elements from 12 to 10 months', priority: 'High', owner: 'Engineering', status: 'Pending' },
      { action: 'Add pre-failure degradation monitoring (current draw trending) to heating elements', priority: 'Medium', owner: 'Engineering', status: 'Pending' },
    ]
  },
  aiPreventiveActions: {
    confidence: 0.84,
    actions: [
      { action: 'Implement predictive maintenance model using heating element current draw data', priority: 'High', owner: 'Engineering' },
      { action: 'Require Level 2 operator coverage on all shifts for draw operations', priority: 'Medium', owner: 'Operations' },
      { action: 'Tighten SPC warning limits from ±2σ to ±1.5σ for early detection', priority: 'Medium', owner: 'Quality' },
    ]
  },
  aiRiskAssessment: {
    confidence: 0.89,
    severity: 'Moderate',
    likelihood: 'Likely (if uncorrected)',
    riskLevel: 'High',
    customerImpact: 'Potential fiber attenuation increase in affected spools — customer spec compliance at risk',
    regulatoryImpact: 'ISO 9001 §8.5.1 process control requirements; customer audit finding possible',
  }
};

// Audit Trail entries
export const AUDIT_TRAIL = [
  { timestamp: '2024-12-06 14:23:01', user: 'Dr. Sarah Chen', role: 'Quality Director', action: 'Approved', document: 'SOP-2024-031 v4.2', aiInvolved: false, signature: 'Verified', ip: '10.0.42.15' },
  { timestamp: '2024-12-06 14:15:33', user: 'AI Agent — DocClassifier', role: 'System', action: 'Auto-classified', document: 'SOP-2024-031', aiInvolved: true, signature: 'System', ip: 'internal' },
  { timestamp: '2024-12-06 13:58:12', user: 'James Rodriguez', role: 'Process Engineer', action: 'Edited', document: 'CAPA-089 v1.0', aiInvolved: false, signature: 'Verified', ip: '10.0.42.28' },
  { timestamp: '2024-12-06 13:45:00', user: 'AI Agent — RootCauseAnalyzer', role: 'System', action: 'Generated analysis', document: 'CAPA-089', aiInvolved: true, signature: 'System', ip: 'internal' },
  { timestamp: '2024-12-06 12:30:15', user: 'Michael Torres', role: 'Supplier Quality Eng.', action: 'Viewed', document: 'NCR-2024-156', aiInvolved: false, signature: 'N/A', ip: '10.0.42.33' },
  { timestamp: '2024-12-06 12:22:40', user: 'AI Agent — RiskScorer', role: 'System', action: 'Updated risk score', document: 'RA-2024-008', aiInvolved: true, signature: 'System', ip: 'internal' },
  { timestamp: '2024-12-06 11:15:22', user: 'Rebecca Hoffman', role: 'Coating Specialist', action: 'Uploaded', document: 'WI-4398 v3.0', aiInvolved: false, signature: 'Verified', ip: '10.0.42.41' },
  { timestamp: '2024-12-06 10:55:09', user: 'AI Agent — DocClassifier', role: 'System', action: 'Auto-tagged', document: 'WI-4398', aiInvolved: true, signature: 'System', ip: 'internal' },
  { timestamp: '2024-12-06 10:30:45', user: 'Dr. Li Wei', role: 'Senior Scientist', action: 'Reviewed', document: 'NCR-2024-156', aiInvolved: false, signature: 'Verified', ip: '10.0.42.19' },
  { timestamp: '2024-12-06 09:45:30', user: 'AI Agent — ComplianceChecker', role: 'System', action: 'Compliance scan', document: 'AR-2024-Q3', aiInvolved: true, signature: 'System', ip: 'internal' },
  { timestamp: '2024-12-06 09:12:18', user: 'Admin — System', role: 'System Admin', action: 'Backup completed', document: 'Full QMS Backup', aiInvolved: false, signature: 'System', ip: '10.0.42.1' },
  { timestamp: '2024-12-05 17:30:00', user: 'AI Agent — BatchReviewer', role: 'System', action: 'Batch review completed', document: '34 Inspection Records', aiInvolved: true, signature: 'System', ip: 'internal' },
  { timestamp: '2024-12-05 16:45:22', user: 'Dr. Sarah Chen', role: 'Quality Director', action: 'Exported', document: 'Monthly Quality Report', aiInvolved: false, signature: 'Verified', ip: '10.0.42.15' },
  { timestamp: '2024-12-05 15:20:11', user: 'AI Agent — TrainingTracker', role: 'System', action: 'Flagged gap', document: 'TR-2024-015', aiInvolved: true, signature: 'System', ip: 'internal' },
  { timestamp: '2024-12-05 14:10:33', user: 'James Rodriguez', role: 'Process Engineer', action: 'Created', document: 'CAPA-089 v1.0', aiInvolved: false, signature: 'Verified', ip: '10.0.42.28' },
];

// Knowledge graph nodes and edges
export const KNOWLEDGE_GRAPH = {
  nodes: [
    // Documents
    { id: 'SOP-2024-031', label: 'SOP-2024-031', type: 'document', group: 'sop', size: 18 },
    { id: 'SOP-2024-028', label: 'SOP-2024-028', type: 'document', group: 'sop', size: 14 },
    { id: 'SOP-2024-019', label: 'SOP-2024-019', type: 'document', group: 'sop', size: 14 },
    { id: 'WI-4420', label: 'WI-4420', type: 'document', group: 'wi', size: 12 },
    { id: 'WI-4455', label: 'WI-4455', type: 'document', group: 'wi', size: 12 },
    { id: 'WI-4398', label: 'WI-4398', type: 'document', group: 'wi', size: 12 },
    { id: 'CAPA-089', label: 'CAPA-089', type: 'document', group: 'capa', size: 16 },
    { id: 'CAPA-087', label: 'CAPA-087', type: 'document', group: 'capa', size: 14 },
    { id: 'NCR-2024-156', label: 'NCR-156', type: 'document', group: 'ncr', size: 14 },
    { id: 'NCR-2024-141', label: 'NCR-141', type: 'document', group: 'ncr', size: 12 },
    // People
    { id: 'sarah', label: 'Dr. Chen', type: 'person', group: 'person', size: 14 },
    { id: 'james', label: 'J. Rodriguez', type: 'person', group: 'person', size: 14 },
    { id: 'michael', label: 'M. Torres', type: 'person', group: 'person', size: 12 },
    { id: 'li', label: 'Dr. Wei', type: 'person', group: 'person', size: 12 },
    { id: 'rebecca', label: 'R. Hoffman', type: 'person', group: 'person', size: 12 },
    // Processes
    { id: 'fiber-draw', label: 'Fiber Draw', type: 'process', group: 'process', size: 16 },
    { id: 'coating', label: 'Coating', type: 'process', group: 'process', size: 14 },
    { id: 'batch-mix', label: 'Batch Mixing', type: 'process', group: 'process', size: 14 },
    { id: 'fusion-draw', label: 'Fusion Draw', type: 'process', group: 'process', size: 14 },
    // Regulations
    { id: 'iso9001', label: 'ISO 9001', type: 'regulation', group: 'regulation', size: 18 },
    { id: 'fda820', label: 'FDA 820', type: 'regulation', group: 'regulation', size: 16 },
    { id: 'iatf', label: 'IATF 16949', type: 'regulation', group: 'regulation', size: 14 },
    // Suppliers
    { id: 'silica-src', label: 'Silica Source', type: 'supplier', group: 'supplier', size: 14 },
    { id: 'batch-mat', label: 'Batch Materials', type: 'supplier', group: 'supplier', size: 12 },
  ],
  edges: [
    // Document → Process
    { source: 'SOP-2024-031', target: 'fiber-draw', label: 'controls' },
    { source: 'SOP-2024-028', target: 'coating', label: 'controls' },
    { source: 'SOP-2024-019', target: 'fusion-draw', label: 'controls' },
    { source: 'WI-4420', target: 'batch-mix', label: 'instructs' },
    { source: 'WI-4455', target: 'fiber-draw', label: 'instructs' },
    { source: 'WI-4398', target: 'coating', label: 'instructs' },
    // CAPAs → Process
    { source: 'CAPA-089', target: 'fiber-draw', label: 'affects' },
    { source: 'CAPA-087', target: 'batch-mix', label: 'affects' },
    // NCRs → CAPAs
    { source: 'NCR-2024-156', target: 'CAPA-089', label: 'triggered' },
    { source: 'NCR-2024-141', target: 'CAPA-087', label: 'related' },
    // People → Documents (ownership)
    { source: 'sarah', target: 'SOP-2024-031', label: 'owns' },
    { source: 'james', target: 'CAPA-089', label: 'owns' },
    { source: 'michael', target: 'CAPA-087', label: 'owns' },
    { source: 'li', target: 'WI-4455', label: 'owns' },
    { source: 'rebecca', target: 'WI-4398', label: 'owns' },
    // Regulations → Documents
    { source: 'iso9001', target: 'SOP-2024-031', label: 'governs' },
    { source: 'iso9001', target: 'SOP-2024-028', label: 'governs' },
    { source: 'iso9001', target: 'SOP-2024-019', label: 'governs' },
    { source: 'fda820', target: 'SOP-2024-031', label: 'governs' },
    { source: 'fda820', target: 'WI-4455', label: 'governs' },
    { source: 'iatf', target: 'SOP-2024-019', label: 'governs' },
    // Suppliers → NCRs
    { source: 'silica-src', target: 'NCR-2024-156', label: 'sourced' },
    { source: 'batch-mat', target: 'NCR-2024-141', label: 'sourced' },
    // Cross-references
    { source: 'SOP-2024-031', target: 'WI-4455', label: 'references' },
    { source: 'SOP-2024-031', target: 'WI-4420', label: 'references' },
    { source: 'CAPA-089', target: 'SOP-2024-031', label: 'references' },
    { source: 'NCR-2024-156', target: 'NCR-2024-141', label: 'AI: potential duplicate' },
  ]
};

// Graph node color scheme
export const GRAPH_COLORS = {
  sop: '#8b5cf6',        // Purple
  wi: '#6366f1',         // Indigo
  capa: '#f59e0b',       // Amber
  ncr: '#ef4444',        // Red
  person: '#10b981',     // Emerald
  process: '#06b6d4',    // Cyan
  regulation: '#f97316', // Orange
  supplier: '#ec4899',   // Pink
};

// Navigation items
export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
  { id: 'search', label: 'AI Search', icon: 'search' },
  { id: 'documents', label: 'Documents', icon: 'file' },
  { id: 'workflow', label: 'CAPA Workflow', icon: 'workflow' },
  { id: 'audit', label: 'Audit Trail', icon: 'shield' },
  { id: 'graph', label: 'Knowledge Graph', icon: 'graph' },
];
