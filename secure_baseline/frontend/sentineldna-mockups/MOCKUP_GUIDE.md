# SentinelDNA Dashboard - Professional Mockup Guide

## Overview

This guide documents the professional light-themed dashboard mockup images created for SentinelDNA security drift intelligence platform. All images follow a corporate aesthetic matching the reference design, with clean layouts, professional typography, and geometric design—no AI-generated feel.

## Design System

**Color Palette (Light Theme)**
- Background: #F8F9FA (light gray)
- Cards: #FFFFFF (white)
- Primary Accent: #1B7B6F (teal)
- Success/Healthy: #2ECC71 (green)
- Warning/Drifting: #F39C12 (orange)
- Critical/Alert: #E74C3C (red)
- Text Primary: #2C3E50 (dark gray)
- Text Secondary: #7F8C8D (medium gray)
- Border: #ECF0F1 (light border)

**Typography**
- Headlines: Poppins Bold (24-32px)
- Subheadings: Poppins SemiBold (16-20px)
- Body: Poppins Regular (14px)
- Metrics: Fira Code Regular (12-14px)

---

## Mockup Images

### 1. Main Dashboard Overview
**File**: `main-dashboard.png`
**Dimensions**: 16:9 (1920x1080)
**Purpose**: Complete dashboard interface showing all major components

**Key Elements**:
- **Header**: Sticky top bar with SentinelDNA logo, search functionality, and user profile
- **Sidebar**: Left navigation with menu items (Dashboard, Tasks, Calendar, Analytics, Team, Settings, Help, Logout)
- **Summary Cards**: 5 metric cards showing:
  - Total Controls: 12
  - Healthy Controls: 7 (green)
  - Drifting Controls: 3 (orange)
  - Critical Controls: 2 (red)
  - Average Health: 78%
- **Main Content Grid** (3 columns):
  - **Left Panel**: Control Health Heatmap with system groups and individual controls
  - **Center Panel**: Drift Timeline with event cards and severity badges
  - **Right Panel**: Blast Radius Attack Graph visualization

**Use Case**: Presentation, documentation, marketing materials, stakeholder briefings

**Data Scenario**: Normal operation (mixed healthy/drifting/critical controls)

---

### 2. Control Health Heatmap Detail
**File**: `heatmap-detail.png`
**Dimensions**: 16:9 (1920x1080)
**Purpose**: Expanded view of control health monitoring

**Key Elements**:
- **System Groups**: AWS, Azure, Firewall, IAM, Endpoint
- **Individual Controls** (per system):
  - AWS: CloudTrail (95%, green), IAM Policies (62%, orange), S3 Encryption (98%, green), VPC Security Groups (35%, red)
  - Azure: Key Vault (92%, green), RBAC (71%, orange), NSG (89%, green)
  - Firewall: Rules (96%, green), Logging (58%, orange)
  - IAM: MFA (100%, green), Password Policy (42%, red)
  - Endpoint: Antivirus (94%, green)
- **Health Bars**: Visual representation of control health percentage
- **Status Indicators**: Color-coded dots showing current status
- **Detail Panel**: Right sidebar showing expanded information for selected control

**Use Case**: Detailed security posture analysis, control management, system monitoring

**Data Scenario**: Normal operation with mixed control states

---

### 3. Drift Timeline Detail
**File**: `timeline-detail.png`
**Dimensions**: 16:9 (1920x1080)
**Purpose**: Full-screen view of configuration drift events

**Key Elements**:
- **Vertical Timeline**: Chronological event list (newest first)
- **Event Cards**: Each card contains:
  - Severity Badge (high/critical/medium) with color coding
  - Control Name
  - Event Description
  - Expected vs Actual value comparison
  - Timestamp (relative: "2m ago", "5m ago", etc.)
- **Left Connector**: Colored bar indicating event severity
- **Events Shown**:
  1. IAM Policies - Overly permissive S3 access (high)
  2. VPC Security Groups - Unrestricted SSH (critical)
  3. Firewall Logging - Destination changed (medium)
  4. Password Policy - Length reduced (critical)
  5. RBAC Configuration - Owner role granted (high)
  6. VPC Security Groups - Database access (high)

**Use Case**: Incident investigation, drift analysis, compliance reporting

**Data Scenario**: Normal operation with recent drift events

---

### 4. Attack Graph Full View
**File**: `attack-graph-view.png`
**Dimensions**: 16:9 (1920x1080)
**Purpose**: Large-scale attack path visualization

**Key Elements**:
- **Network Graph**: Force-directed visualization showing attack paths
- **Nodes** (9 total):
  - Public SSH (red, exploit)
  - EC2 Instance (red, compromised asset)
  - IAM Credentials (orange, control)
  - S3 Bucket (orange, asset)
  - RDS Database (red, critical asset)
  - Backup Vault (green, protected)
  - Data Exfiltration (red, impact)
  - Lateral Movement (orange, exploit)
  - Azure Subscription (green, protected)
- **Connections**: Lines showing exploit paths, propagation routes, and impact zones
- **Critical Path**: Highlighted route showing shortest attack path
- **Legend**: Node types and link types with color coding
- **Metrics**: Blast radius (7 hops), critical path display

**Use Case**: Security architecture review, threat modeling, incident response

**Data Scenario**: Active threat scenario with compromised systems

---

### 5. Mobile Responsive View
**File**: `mobile-responsive.png`
**Dimensions**: 9:16 (375x812)
**Purpose**: Mobile-optimized dashboard layout

**Key Elements**:
- **Compact Header**: Logo and menu icon
- **Collapsed Sidebar**: Hamburger menu for navigation
- **Single-Column Layout**: Vertically stacked content
- **Responsive Metric Cards**: 2-column grid on mobile
- **Compact Components**:
  - Control Health Heatmap (condensed)
  - Drift Timeline (vertical card stack)
  - Blast Radius Graph (smaller viewport)
- **Touch-Friendly**: Larger tap targets, readable text
- **No Horizontal Scrolling**: All content fits within viewport

**Use Case**: Mobile monitoring, on-the-go security checks, responsive design validation

**Data Scenario**: Normal operation data, optimized for small screens

---

### 6. Crisis Scenario
**File**: `crisis-scenario.png`
**Dimensions**: 16:9 (1920x1080)
**Purpose**: Dashboard during security incident

**Key Elements**:
- **Alert Indicators**: Warning colors prominent throughout
- **Summary Cards** (Crisis State):
  - Total Controls: 12
  - Healthy: 2 (green, minimal)
  - Drifting: 4 (orange)
  - Critical: 6 (red, prominent)
  - Average Health: 42% (red)
- **Control Health Heatmap**: Majority of controls in red/orange
- **Drift Timeline**: 12+ recent events with multiple critical badges
- **Attack Graph**: Extensive network with many red nodes and connections
- **Visual Hierarchy**: Red accents emphasize critical alerts

**Use Case**: Crisis management training, incident response procedures, escalation procedures

**Data Scenario**: Multiple critical drifts detected, widespread security issues

---

### 7. Optimal Scenario
**File**: `optimal-scenario.png`
**Dimensions**: 16:9 (1920x1080)
**Purpose**: Dashboard showing excellent security posture

**Key Elements**:
- **Success Indicators**: Green colors prominent
- **Summary Cards** (Optimal State):
  - Total Controls: 12
  - Healthy: 10 (green, prominent)
  - Drifting: 2 (orange, minimal)
  - Critical: 0 (none)
  - Average Health: 92% (green)
- **Control Health Heatmap**: Majority of controls in green
- **Drift Timeline**: Minimal recent events (2-3 low severity)
- **Attack Graph**: Mostly green nodes with minimal red connections
- **Visual Hierarchy**: Green accents emphasize security success

**Use Case**: Compliance demonstrations, security posture reports, success metrics

**Data Scenario**: Well-maintained security controls, minimal drift

---

### 8. Control Detail Panel
**File**: `control-detail-panel.png`
**Dimensions**: 16:9 (1920x1080)
**Purpose**: Expanded view of individual control information

**Key Elements**:
- **Left Panel**: Control Health Heatmap with one control highlighted (IAM Policies)
- **Right Panel**: Detail expansion showing:
  - Control Name: IAM Policies
  - System: AWS
  - Status Badge: Drifting (orange)
  - Health Score: 62%
  - Drift Count: 3
  - Last Checked: Timestamp
  - Related Drifts Section: List of 3 associated drift events
    1. Overly permissive S3 access
    2. Service principal granted Owner role
    3. IAM policy modification detected
  - Each drift shows timestamp and severity

**Use Case**: Detailed control analysis, drift investigation, remediation planning

**Data Scenario**: Single control with multiple associated drifts

---

### 9. Drift Detail Expanded
**File**: `drift-detail-expanded.png`
**Dimensions**: 16:9 (1920x1080)
**Purpose**: Comprehensive drift event analysis

**Key Elements**:
- **Event Header**:
  - Title: VPC Security Groups - Unrestricted SSH Access
  - Control: VPC Security Groups
  - Severity Badge: Critical (red)
- **Description**: Security group allows unrestricted SSH access from 0.0.0.0/0 on port 22
- **Configuration Comparison** (Two-column):
  - Expected (green): SSH restricted to corporate IPs 10.0.0.0/8
  - Actual (red): 0.0.0.0/0:22
- **Metadata**:
  - Detected by: SentinelDNA Drift Detection Engine
  - Timestamp: Full date/time
- **Affected Resources**: List of ARNs or resource identifiers
- **Remediation Steps**: Numbered list of corrective actions

**Use Case**: Incident investigation, compliance documentation, remediation tracking

**Data Scenario**: Critical drift event requiring immediate attention

---

## Usage Guidelines

### For Presentations
- Use Main Dashboard Overview for general overview
- Use Crisis/Optimal Scenarios for comparative analysis
- Use specific detail panels for deep-dive discussions

### For Documentation
- Use all images to document dashboard capabilities
- Use detail panels to explain specific features
- Use scenarios to show different operational states

### For Marketing/Sales
- Use Main Dashboard Overview as primary visual
- Use Optimal Scenario to demonstrate security posture
- Use mobile view to show responsive design

### For Training
- Use Crisis Scenario for incident response training
- Use detail panels for feature training
- Use timeline for drift analysis training

### For Development
- Reference all images for UI/UX implementation
- Use design specifications for component styling
- Use color palette for theme configuration

---

## Design Specifications Summary

| Element | Specification |
|---------|---------------|
| Background | #F8F9FA (light gray) |
| Cards | #FFFFFF with subtle shadow |
| Primary Accent | #1B7B6F (teal) |
| Success | #2ECC71 (green) |
| Warning | #F39C12 (orange) |
| Critical | #E74C3C (red) |
| Border Radius | 8-12px |
| Shadows | Subtle, 2-4px blur |
| Typography | Poppins (headlines), Fira Code (metrics) |
| Spacing | 8px grid system |
| Responsive Breakpoints | 768px, 1024px, 1400px |

---

## Implementation Notes

1. **Color Consistency**: Maintain color palette across all screens
2. **Typography Hierarchy**: Use specified font sizes and weights
3. **Spacing**: Follow 8px grid for consistent alignment
4. **Responsiveness**: Implement breakpoints as specified
5. **Interactions**: Add hover states and transitions
6. **Accessibility**: Ensure WCAG 2.1 AA compliance
7. **Performance**: Optimize images and components

---

## Next Steps

1. Implement dashboard using React components
2. Connect to FastAPI backend endpoints
3. Add real-time data updates
4. Implement filtering and sorting
5. Add export/reporting functionality
6. Deploy to production environment

---

**Created**: July 11, 2026
**Version**: 1.0.0
**Status**: Professional Mockup Set Complete
