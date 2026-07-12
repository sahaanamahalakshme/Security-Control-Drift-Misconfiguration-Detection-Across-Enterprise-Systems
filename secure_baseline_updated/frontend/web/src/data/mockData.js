// Demo datasets mirroring the SentinelDNA mockups. Used whenever the
// FastAPI backend is unreachable or hasn't generated data yet, and to
// power the Normal / Crisis / Optimal scenario switcher for demos.

function control(control_id, name, system, health, drift_count = 0, category = 'General', description = '') {
  const status = health >= 80 ? 'healthy' : health >= 50 ? 'drifting' : 'critical'
  return { control_id, name, system, health, status, drift_count, category, description, last_checked: new Date(Date.now() - Math.random() * 3600e3).toISOString() }
}

const NORMAL_CONTROLS = [
  control('aws-cloudtrail', 'CloudTrail Logging', 'AWS', 95, 0, 'Logging & Monitoring'),
  control('aws-iam-policies', 'IAM Policies', 'AWS', 62, 3, 'Identity & Access Management', 'Ensures IAM policies follow the principle of least privilege and do not allow excessive permissions.'),
  control('aws-s3-encryption', 'S3 Bucket Encryption', 'AWS', 98, 0, 'Data Protection'),
  control('aws-vpc-sg', 'VPC Security Groups', 'AWS', 35, 2, 'Network Security'),
  control('azure-key-vault', 'Key Vault', 'Azure', 92, 0, 'Data Protection'),
  control('azure-rbac', 'RBAC Configuration', 'Azure', 71, 1, 'Identity & Access Management'),
  control('azure-nsg', 'NSG', 'Azure', 89, 0, 'Network Security'),
  control('fw-rules', 'Firewall Rules', 'Firewall', 96, 0, 'Network Security'),
  control('fw-logging', 'Firewall Logging', 'Firewall', 58, 1, 'Logging & Monitoring'),
  control('iam-mfa', 'MFA Enforcement', 'IAM', 100, 0, 'Identity & Access Management'),
  control('iam-password-policy', 'Password Policy', 'IAM', 42, 1, 'Identity & Access Management'),
  control('endpoint-av', 'Antivirus', 'Endpoint', 94, 0, 'Endpoint Protection'),
]

const CRISIS_CONTROLS = NORMAL_CONTROLS.map((c) =>
  control(c.control_id, c.name, c.system, Math.max(5, Math.round(c.health * 0.45)), c.drift_count + 2, c.category, c.description)
)

const OPTIMAL_CONTROLS = NORMAL_CONTROLS.map((c) =>
  control(c.control_id, c.name, c.system, Math.min(99, Math.round(c.health * 1.35)), Math.max(0, c.drift_count - 2), c.category, c.description)
)

const BASE_DRIFTS = [
  {
    drift_id: 'drift-2026-07-11-00123',
    control_id: 'aws-vpc-sg',
    control: 'VPC Security Groups',
    title: 'VPC Security Groups - Unrestricted SSH access',
    severity: 'CRITICAL',
    description: 'Security group allows unrestricted SSH access from 0.0.0.0/0 on port 22.',
    expected: 'SSH restricted to corporate IPs 10.0.0.0/8',
    actual: '0.0.0.0/0:22',
    detected_by: 'SentinelDNA Drift Detection Engine',
    timestamp: '2026-07-11T10:18:07Z',
    affected_resources: ['sg-0abc123def456ghi7 (prod-web-sg)', 'sg-0def456ghi789jkl0 (bastion-sg)'],
    remediation_steps: [
      'Edit the security group inbound rules.',
      'Locate the rule allowing SSH (port 22) from 0.0.0.0/0.',
      'Replace 0.0.0.0/0 with the approved corporate IP range: 10.0.0.0/8.',
      'Save the changes and verify SSH access is restricted to authorized IPs.',
    ],
  },
  {
    drift_id: 'drift-2026-07-11-00122',
    control_id: 'aws-iam-policies',
    control: 'IAM Policies',
    title: 'IAM Policies - Overly permissive S3 access policy',
    severity: 'HIGH',
    description: 'An IAM policy was updated to allow public access to S3 buckets, granting overly broad permissions that could expose sensitive data.',
    expected: 's3:ListBucket, s3:GetObject on arn:aws:s3:::my-bucket/*',
    actual: 's3:* on arn:aws:s3:::* (public)',
    detected_by: 'SentinelDNA Drift Detection Engine',
    timestamp: '2026-07-11T10:24:31Z',
    affected_resources: ['policy-iam-analytics-role'],
    remediation_steps: ['Review the modified IAM policy diff.', 'Restrict actions to s3:ListBucket and s3:GetObject.', 'Scope resource ARN to the specific bucket.', 'Re-apply least-privilege condition.'],
  },
  {
    drift_id: 'drift-2026-07-11-00121',
    control_id: 'fw-logging',
    control: 'Firewall Logging',
    title: 'Firewall Logging - Logging destination changed',
    severity: 'MEDIUM',
    description: 'Firewall logging destination was changed from the centralized SIEM to a local storage bucket, which may impact log monitoring and alerting.',
    expected: 'Destination: siem-logs-central · Retention: 365 days',
    actual: 'Destination: s3://local-logs-bucket · Retention: 30 days',
    detected_by: 'SentinelDNA Drift Detection Engine',
    timestamp: '2026-07-11T10:11:45Z',
    affected_resources: ['fw-edge-01'],
    remediation_steps: ['Restore logging destination to siem-logs-central.', 'Confirm retention policy is reset to 365 days.'],
  },
  {
    drift_id: 'drift-2026-07-11-00120',
    control_id: 'iam-password-policy',
    control: 'Password Policy',
    title: 'Password Policy - Minimum password length reduced',
    severity: 'CRITICAL',
    description: 'The minimum password length was reduced, which may weaken account security and increase the risk of brute-force attacks.',
    expected: 'Minimum Length: 14 · Symbols required · Expiry: 90 days',
    actual: 'Minimum Length: 8 · Symbols disabled · Expiry: 90 days',
    detected_by: 'SentinelDNA Drift Detection Engine',
    timestamp: '2026-07-11T10:05:22Z',
    affected_resources: ['iam-account-policy'],
    remediation_steps: ['Restore minimum password length to 14 characters.', 'Re-enable symbol requirement.'],
  },
  {
    drift_id: 'drift-2026-07-11-00119',
    control_id: 'azure-rbac',
    control: 'RBAC Configuration',
    title: 'RBAC Configuration - Service principal granted Owner role',
    severity: 'HIGH',
    description: 'A service principal was granted the Owner role, providing unrestricted permissions across all resources — violating least privilege.',
    expected: 'Role: Contributor · Scope: Resource Group',
    actual: 'Role: Owner · Scope: Subscription',
    detected_by: 'SentinelDNA Drift Detection Engine',
    timestamp: '2026-07-11T09:58:10Z',
    affected_resources: ['sp-analytics-pipeline'],
    remediation_steps: ['Downgrade service principal role to Contributor.', 'Scope the assignment to the resource group.'],
  },
  {
    drift_id: 'drift-2026-07-11-00118',
    control_id: 'aws-vpc-sg',
    control: 'VPC Security Groups',
    title: 'VPC Security Groups - Database access opened publicly',
    severity: 'HIGH',
    description: 'Database security group rule was modified to allow inbound access from a broader CIDR range than approved.',
    expected: 'Port 5432 from 10.0.4.0/24',
    actual: 'Port 5432 from 10.0.0.0/8',
    detected_by: 'SentinelDNA Drift Detection Engine',
    timestamp: '2026-07-11T09:47:00Z',
    affected_resources: ['sg-0aa11bb22cc33dd44 (rds-sg)'],
    remediation_steps: ['Restrict inbound CIDR to 10.0.4.0/24.'],
  },
]

const CRISIS_DRIFTS = [
  ...BASE_DRIFTS,
  { drift_id: 'drift-crisis-01', control_id: 'iam-mfa', control: 'MFA Enforcement', title: 'MFA Enforcement - Root account MFA disabled', severity: 'CRITICAL', description: 'Root account MFA was disabled, exposing the account to credential-based takeover.', expected: 'MFA: Enabled', actual: 'MFA: Disabled', detected_by: 'SentinelDNA Drift Detection Engine', timestamp: '2026-07-11T10:30:00Z', affected_resources: ['root-account'], remediation_steps: ['Re-enable MFA on the root account immediately.'] },
  { drift_id: 'drift-crisis-02', control_id: 'aws-s3-encryption', control: 'S3 Bucket Encryption', title: 'S3 Bucket Encryption - Encryption disabled on sensitive bucket', severity: 'CRITICAL', description: 'Server-side encryption was disabled on a bucket containing sensitive customer data.', expected: 'SSE-KMS: Enabled', actual: 'SSE-KMS: Disabled', detected_by: 'SentinelDNA Drift Detection Engine', timestamp: '2026-07-11T10:28:00Z', affected_resources: ['sensitive-data-bucket'], remediation_steps: ['Re-enable SSE-KMS encryption.', 'Rotate exposed data encryption keys.'] },
  { drift_id: 'drift-crisis-03', control_id: 'fw-rules', control: 'Firewall Rules', title: 'Firewall Rules - Default deny rule removed', severity: 'CRITICAL', description: 'The default-deny egress rule was removed, allowing unrestricted outbound traffic.', expected: 'Default: Deny all', actual: 'Default: Allow all', detected_by: 'SentinelDNA Drift Detection Engine', timestamp: '2026-07-11T10:26:00Z', affected_resources: ['fw-edge-01', 'fw-edge-02'], remediation_steps: ['Restore default-deny egress rule.'] },
]

const OPTIMAL_DRIFTS = BASE_DRIFTS.slice(4, 6).map((d) => ({ ...d, severity: 'LOW' }))

function summaryFor(controls) {
  const healthy = controls.filter((c) => c.status === 'healthy').length
  const drifting = controls.filter((c) => c.status === 'drifting').length
  const critical = controls.filter((c) => c.status === 'critical').length
  const avg = Math.round(controls.reduce((s, c) => s + c.health, 0) / controls.length)
  return { total_controls: controls.length, healthy, drifting, critical, avg_health: avg }
}

const ATTACK_GRAPH_NORMAL = {
  nodes: [
    { id: 'public-ssh', label: 'Public SSH', type: 'exploit', status: 'critical' },
    { id: 'ec2-instance', label: 'EC2 Instance', type: 'asset', status: 'critical', note: 'Compromised' },
    { id: 'iam-credentials', label: 'IAM Credentials', type: 'control', status: 'warn' },
    { id: 's3-bucket', label: 'S3 Bucket', type: 'control', status: 'warn' },
    { id: 'rds-database', label: 'RDS Database', type: 'asset', status: 'critical', note: 'Compromised' },
    { id: 'backup-vault', label: 'Backup Vault', type: 'asset', status: 'healthy', note: 'Safe' },
    { id: 'data-exfiltration', label: 'Data Exfiltration', type: 'impact', status: 'critical' },
    { id: 'lateral-movement', label: 'Lateral Movement', type: 'control', status: 'warn' },
    { id: 'azure-subscription', label: 'Azure Subscription', type: 'asset', status: 'healthy', note: 'Safe' },
  ],
  edges: [
    { source: 'public-ssh', target: 'ec2-instance', type: 'exploit' },
    { source: 'ec2-instance', target: 'iam-credentials', type: 'propagation' },
    { source: 'ec2-instance', target: 'lateral-movement', type: 'propagation' },
    { source: 'lateral-movement', target: 'iam-credentials', type: 'propagation' },
    { source: 'iam-credentials', target: 's3-bucket', type: 'exploit' },
    { source: 'iam-credentials', target: 'azure-subscription', type: 'propagation' },
    { source: 's3-bucket', target: 'rds-database', type: 'exploit' },
    { source: 'lateral-movement', target: 'rds-database', type: 'propagation' },
    { source: 'rds-database', target: 'backup-vault', type: 'propagation' },
    { source: 'rds-database', target: 'data-exfiltration', type: 'impact' },
  ],
  blast_radius: 7,
  critical_path: ['public-ssh', 'ec2-instance', 'iam-credentials', 's3-bucket', 'rds-database', 'data-exfiltration'],
}

const ATTACK_GRAPH_CRISIS = {
  ...ATTACK_GRAPH_NORMAL,
  nodes: ATTACK_GRAPH_NORMAL.nodes.map((n) => (n.status === 'healthy' ? { ...n, status: 'warn', note: 'At risk' } : n)),
  blast_radius: 12,
}

const ATTACK_GRAPH_OPTIMAL = {
  ...ATTACK_GRAPH_NORMAL,
  nodes: ATTACK_GRAPH_NORMAL.nodes.map((n) => ({ ...n, status: n.id === 'public-ssh' ? 'warn' : 'healthy', note: n.id === 'public-ssh' ? 'Monitored' : 'Safe' })),
  blast_radius: 1,
  critical_path: [],
}

function toSystems(controls) {
  const map = {}
  controls.forEach((c) => {
    map[c.system] = map[c.system] || []
    map[c.system].push(c)
  })
  return Object.entries(map).map(([name, list]) => ({ name, controls: list }))
}

export const SCENARIOS = {
  normal: {
    label: 'Normal',
    controls: NORMAL_CONTROLS,
    systems: toSystems(NORMAL_CONTROLS),
    drifts: BASE_DRIFTS,
    graph: ATTACK_GRAPH_NORMAL,
    summary: summaryFor(NORMAL_CONTROLS),
  },
  crisis: {
    label: 'Crisis',
    controls: CRISIS_CONTROLS,
    systems: toSystems(CRISIS_CONTROLS),
    drifts: CRISIS_DRIFTS,
    graph: ATTACK_GRAPH_CRISIS,
    summary: summaryFor(CRISIS_CONTROLS),
  },
  optimal: {
    label: 'Optimal',
    controls: OPTIMAL_CONTROLS,
    systems: toSystems(OPTIMAL_CONTROLS),
    drifts: OPTIMAL_DRIFTS,
    graph: ATTACK_GRAPH_OPTIMAL,
    summary: summaryFor(OPTIMAL_CONTROLS),
  },
}

export const TRUST = [
  { actor: 'svc-deploy-bot', trust_score: 88, risk_band: 'LOW' },
  { actor: 'alex.turner', trust_score: 74, risk_band: 'MEDIUM' },
  { actor: 'sp-analytics-pipeline', trust_score: 31, risk_band: 'HIGH' },
]

// ---------------------------------------------------------------------
// Demo fallbacks for the Intelligence Engine / Remediation endpoints.
// Shapes are inferred from the docstrings in backend/api/main.py since
// shared/schemas.py wasn't included in the uploaded zip — the pages that
// consume these normalize defensively the same way AppContext does.
// ---------------------------------------------------------------------

export const TTL_FINDINGS = [
  { id: 'ttl-001', control_id: 'aws-vpc-sg', control: 'VPC Security Groups', window: 'Maintenance: SSH temp-allow', expires_at: '2026-07-10T18:00:00Z', status: 'EXPIRED', approved_by: 'alex.turner' },
  { id: 'ttl-002', control_id: 'azure-rbac', control: 'RBAC Configuration', window: 'Emergency Owner grant', expires_at: '2026-07-12T09:00:00Z', status: 'EXPIRES_SOON', approved_by: 'sp-analytics-pipeline' },
  { id: 'ttl-003', control_id: 'fw-logging', control: 'Firewall Logging', window: 'Change freeze exception', expires_at: '2026-07-20T00:00:00Z', status: 'ACTIVE', approved_by: 'svc-deploy-bot' },
]

export const FORENSICS = [
  { event_id: 'drift-2026-07-11-00123', control: 'VPC Security Groups', isolation_forest_score: 0.91, change_point: true, anomaly_band: 'HIGH' },
  { event_id: 'drift-2026-07-11-00122', control: 'IAM Policies', isolation_forest_score: 0.74, change_point: true, anomaly_band: 'MEDIUM' },
  { event_id: 'drift-2026-07-11-00121', control: 'Firewall Logging', isolation_forest_score: 0.38, change_point: false, anomaly_band: 'LOW' },
  { event_id: 'drift-2026-07-11-00120', control: 'Password Policy', isolation_forest_score: 0.88, change_point: true, anomaly_band: 'HIGH' },
  { event_id: 'drift-2026-07-11-00119', control: 'RBAC Configuration', isolation_forest_score: 0.62, change_point: false, anomaly_band: 'MEDIUM' },
]

export const TRIBUNAL_VERDICTS = [
  { drift_id: 'drift-2026-07-11-00123', control: 'VPC Security Groups', verdict: 'BLOCK', confidence: 0.94, reason: 'Public SSH exposure combined with low actor trust score.' },
  { drift_id: 'drift-2026-07-11-00122', control: 'IAM Policies', verdict: 'ESCALATE', confidence: 0.78, reason: 'Overly permissive policy change from a medium-trust actor.' },
  { drift_id: 'drift-2026-07-11-00121', control: 'Firewall Logging', verdict: 'ALLOW', confidence: 0.61, reason: 'Low severity, known maintenance window active.' },
  { drift_id: 'drift-2026-07-11-00120', control: 'Password Policy', verdict: 'BLOCK', confidence: 0.89, reason: 'Critical control weakened with no approved change record.' },
  { drift_id: 'drift-2026-07-11-00119', control: 'RBAC Configuration', verdict: 'ESCALATE', confidence: 0.7, reason: 'Privilege escalation pattern flagged by forensics engine.' },
]

export const COUNTERFACTUALS = [
  { control_id: 'aws-vpc-sg', control: 'VPC Security Groups', blast_radius_now: 7, blast_radius_if_fixed: 1, risk_reduction_pct: 86 },
  { control_id: 'aws-iam-policies', control: 'IAM Policies', blast_radius_now: 5, blast_radius_if_fixed: 2, risk_reduction_pct: 60 },
  { control_id: 'iam-password-policy', control: 'Password Policy', blast_radius_now: 4, blast_radius_if_fixed: 1, risk_reduction_pct: 75 },
]

export const DRIFT_DNA = [
  { drift_id: 'drift-2026-07-11-00123', lineage: ['baseline-established', 'sg-rule-widened-2026-06-02', 'sg-rule-widened-2026-07-11'], generation: 2, mutation: 'CIDR widened twice in 5 weeks' },
  { drift_id: 'drift-2026-07-11-00119', lineage: ['baseline-established', 'role-elevated-2026-07-11'], generation: 1, mutation: 'First observed elevation for this principal' },
]

export const IMMUNE_MEMORY = [
  { signature_id: 'ab-001', pattern: 'Public 0.0.0.0/0 on port 22', source_verdicts: ['drift-2026-07-11-00123'], strength: 'STRONG' },
  { signature_id: 'ab-002', pattern: 'Password minimum length below 10', source_verdicts: ['drift-2026-07-11-00120'], strength: 'STRONG' },
]

export const FORECASTING = [
  { domain: 'Identity & Access Management', likelihood_pct: 72, trend: 'up' },
  { domain: 'Network Security', likelihood_pct: 58, trend: 'up' },
  { domain: 'Data Protection', likelihood_pct: 24, trend: 'down' },
  { domain: 'Logging & Monitoring', likelihood_pct: 33, trend: 'flat' },
  { domain: 'Endpoint Protection', likelihood_pct: 12, trend: 'down' },
]

export const BUSINESS_IMPACT = {
  estimated_fine_inr: 36125000,
  frameworks_at_risk: ['SOC 2', 'ISO 27001', 'PCI-DSS'],
  findings: [
    { control: 'VPC Security Groups', framework: 'PCI-DSS', clause: 'Req 1.3.1', estimated_fine_inr: 21250000, severity: 'CRITICAL' },
    { control: 'Password Policy', framework: 'SOC 2', clause: 'CC6.1', estimated_fine_inr: 8500000, severity: 'CRITICAL' },
    { control: 'IAM Policies', framework: 'ISO 27001', clause: 'A.9.2', estimated_fine_inr: 6375000, severity: 'HIGH' },
  ],
}

export const CREDIT_SCORE = { score: 612, band: 'FAIR', max: 850, delta_30d: -38, factors: [
  { label: 'Unresolved critical drifts', impact: -60 },
  { label: 'MFA enforced org-wide', impact: 25 },
  { label: 'Repeated IAM privilege escalations', impact: -40 },
  { label: 'Timely maintenance window approvals', impact: 15 },
] }

export const TIME_MACHINE = [
  { incident_id: 'ti-001', title: 'Coordinated privilege escalation, June 2–July 11', related_drifts: ['drift-2026-07-11-00119', 'drift-2026-07-11-00122'], span_days: 39, severity: 'HIGH' },
]

export const STORYTELLING = [
  { incident_id: 'ti-001', narrative: 'Over five weeks, a service principal was granted increasing Azure privileges while a parallel IAM policy change opened public S3 access — consistent with a slow-burn lateral-movement attempt rather than an isolated misconfiguration.' },
]

export const AUTO_HEAL_ACTIONS = [
  { control: 'VPC Security Groups', action: 'Revert inbound rule to 10.0.0.0/8', status: 'PENDING_APPROVAL' },
  { control: 'Password Policy', action: 'Restore minimum length to 14', status: 'PENDING_APPROVAL' },
]

export const WEBHOOK_STATUS = { total_dispatched: 2, alerts: [{ control: 'VPC Security Groups' }, { control: 'Password Policy' }] }
