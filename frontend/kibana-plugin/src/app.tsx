import React, { useState, useEffect } from 'react';
import {
  EuiProvider,
  EuiHeader,
  EuiHeaderSection,
  EuiHeaderLogo,
  EuiPage,
  EuiPageBody,
  EuiPageHeader,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiStat,
  EuiBadge,
  EuiButton,
  EuiButtonIcon,
  EuiSpacer,
  EuiText,
  EuiTitle,
  EuiFieldSearch,
  EuiSuperDatePicker,
  EuiIcon,
  EuiPopover,
  EuiContextMenu,
  EuiBasicTable,
  EuiHealth,
  EuiAvatar,
  EuiComment,
  EuiCommentList,
  EuiHorizontalRule,
  EuiLink,
  EuiFlexGrid,
  EuiToolTip,
  EuiTextColor,
  EuiButtonEmpty,
} from '@elastic/eui';
import axios from 'axios';

interface Incident {
  incident_id: string;
  service: string;
  severity: string;
  status: string;
  metrics: {
    error_rate: number;
    p99_latency_ms: number;
  };
  analyst_report?: {
    rcca?: {
      timeline?: Array<{ ts: string; event: string }>;
      hypotheses?: Array<{ cause: string; confidence: number; description: string }>;
    };
  };
  resolver_proposals?: Array<{
    action_id: string;
    action_type: string;
    title: string;
    description: string;
    estimated_time: string;
    requires_approval: boolean;
  }>;
  created_at: string;
}

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const DataPulseApp = () => {
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRCA, setShowRCA] = useState(false);
  const [showResolver, setShowResolver] = useState(false);
  const [showAgent, setShowAgent] = useState(false);
  const [timeRange, setTimeRange] = useState({ start: 'now-7d', end: 'now' });
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    fetchLatestIncident();
    const interval = setInterval(fetchLatestIncident, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchLatestIncident = async () => {
    try {
      setIncident({
        incident_id: "INC-A7B3C1",
        service: "payment-service",
        severity: "critical",
        status: "investigating",
        metrics: {
          error_rate: 0.1203,
          p99_latency_ms: 2359
        },
        analyst_report: {
          rcca: {
            timeline: [
              { ts: "2026-01-31T14:15:00Z", event: "Deployment v2.4.1 by john" },
              { ts: "2026-01-31T14:30:00Z", event: "Error rate spike detected" },
              { ts: "2026-01-31T14:45:00Z", event: "847 DatabaseConnectionTimeout errors" }
            ],
            hypotheses: [
              {
                cause: "Deployment caused connection exhaustion",
                confidence: 0.92,
                description: "Depalyment v2.4.1 -> High Error Re Rate -> High connection exhaustion"
              }
            ]
          }
        },
        resolver_proposals: [
          {
            action_id: "ACT-001",
            action_type: "rollback",
            title: "[IMMEDIATE]",
            description: "Rollback deployment",
            estimated_time: "5 min",
            requires_approval: true
          },
          {
            action_id: "ACT-002",
            action_type: "scale",
            title: "Rollback, pool size",
            description: "Increase DB connection pool",
            estimated_time: "2 min",
            requires_approval: true
          },
          {
            action_id: "ACT-003",
            action_type: "config",
            title: "Increase Pool Size",
            description: "Scale connection pool by 50%",
            estimated_time: "3 min",
            requires_approval: true
          }
        ],
        created_at: "2026-01-31T14:15:02Z"
      });
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch incident", error);
      setLoading(false);
    }
  };

  const approveAction = async (actionId: string) => {
    try {
      await axios.post(`${API_BASE}/api/datapulse/v1/incidents/${incident!.incident_id}/actions/${actionId}/approve`);
      console.log(`Action ${actionId} approved`);
    } catch (error) {
      console.error("Failed to approve action", error);
    }
  };

  if (loading) {
    return (
      <EuiProvider colorMode="dark">
        <EuiFlexGroup justifyContent="center" alignItems="center" style={{ height: '100vh' }}>
          <EuiText>Loading...</EuiText>
        </EuiFlexGroup>
      </EuiProvider>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'primary';
      default: return 'default';
    }
  };

  const logsData = [
    { service: '@service.name', deployments: '23', logLevel: '13.95', message: '66' },
    { service: 'brooklyvi.ferrocent.loficlashed', deployments: '42', logLevel: '11.98', message: '87' },
    { service: 'brossals.Cumpuit', deployments: '86', logLevel: '13.34', message: '960' },
    { service: 'serrices.on name', deployments: '2%', logLevel: '11.99', message: '191' },
    { service: 'bergies.bigstaduti', deployments: '2%', logLevel: '1.93', message: '88' },
    { service: 'bergies. RestSfor.B2 Select team', deployments: '45', logLevel: '13.93', message: '855' },
    { service: 'thaga.letstoure.beone', deployments: '7%', logLevel: '1.56', message: '893' }
  ];

  const deployments = [
    { action: 'Create Rollback', status: 'success', time: 'Now' },
    { action: 'Resow Onlitest', status: 'pending', time: '>>' }
  ];

  return (
    <EuiProvider colorMode="dark">
      {/* Header */}
      <EuiHeader style={{ background: '#1D1E24', borderBottom: '1px solid #343741' }}>
        <EuiHeaderSection grow={false}>
          <EuiFlexGroup gutterSize="s" alignItems="center">
            <EuiFlexItem grow={false}>
              <EuiHeaderLogo iconType="logoElastic">Elastic</EuiHeaderLogo>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiIcon type="agentApp" size="m" style={{ marginLeft: 8 }} />
              <EuiText size="s" style={{ display: 'inline', marginLeft: 8, color: '#7DE2D1' }}>
                Agent Builder
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiHeaderSection>
        <EuiHeaderSection side="right">
          <EuiFlexGroup gutterSize="s" alignItems="center">
            <EuiFlexItem grow={false}>
              <EuiButtonIcon iconType="help" aria-label="Help" color="text" />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonIcon iconType="bell" aria-label="Notifications" color="text" />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonIcon iconType="user" aria-label="Account" color="text" />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiHeaderSection>
      </EuiHeader>

      {/* Sub-header */}
      <div style={{ background: '#25262E', padding: '12px 16px', borderBottom: '1px solid #343741' }}>
        <EuiFlexGroup alignItems="center" gutterSize="s">
          <EuiFlexItem grow={false}>
            <EuiButtonIcon iconType="menu" aria-label="Menu" color="text" />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiBadge color="primary" iconType="logoElastic">D</EuiBadge>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiTitle size="s">
              <h1>DataPulse: Incident Response Center</h1>
            </EuiTitle>
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>

      {/* Toolbar */}
      <div style={{ background: '#1D1E24', padding: '12px 16px', borderBottom: '1px solid #343741' }}>
        <EuiFlexGroup alignItems="center" gutterSize="m">
          <EuiFlexItem grow={false}>
            <EuiButton size="s" fill={false}>Filters</EuiButton>
          </EuiFlexItem>
          <EuiFlexItem grow={true} style={{ maxWidth: 400 }}>
            <EuiFieldSearch
              placeholder="Search"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              append="KQL"
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiIcon type="clock" />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiSuperDatePicker
              start={timeRange.start}
              end={timeRange.end}
              onTimeChange={({ start, end }: any) => setTimeRange({ start, end })}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton size="s" fill={false}>Show dates</EuiButton>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton size="s" iconType="refresh" fill color="primary">
              Refresh
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>

      <EuiPage paddingSize="m" style={{ background: '#141519' }}>
        <EuiPageBody>
          {/* Status Badges */}
          <EuiFlexGroup gutterSize="s">
            <EuiFlexItem grow={false}>
              <EuiBadge color="danger">CRITICAL</EuiBadge>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiBadge color="hollow">payment-service</EuiBadge>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiIcon type="globe" size="s" />
              <EuiText size="xs" style={{ display: 'inline', marginLeft: 4 }}>Suree country</EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>

          <EuiSpacer size="m" />

          {/* Main Content Grid */}
          <EuiFlexGroup gutterSize="m">
            {/* Left Column - 2/3 width */}
            <EuiFlexItem grow={2}>
              {/* Current Detection Summary */}
              <EuiPanel hasShadow={false} style={{ background: '#1D1E24', border: '1px solid #343741' }}>
                <EuiFlexGroup alignItems="center" justifyContent="spaceBetween">
                  <EuiFlexItem>
                    <EuiTitle size="xs">
                      <h3>Current Detection Summary</h3>
                    </EuiTitle>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiButtonIcon iconType="cross" aria-label="Close" />
                  </EuiFlexItem>
                </EuiFlexGroup>
                <EuiSpacer size="m" />
                <EuiFlexGroup>
                  <EuiFlexItem>
                    <EuiText size="s" color="subdued">Current Error Rate</EuiText>
                    <EuiTitle size="l">
                      <h2 style={{ color: '#F04E98' }}>12.03%</h2>
                    </EuiTitle>
                    <EuiLink>
                      <EuiText size="xs">115msster tteam... &gt;</EuiText>
                    </EuiLink>
                  </EuiFlexItem>
                  <EuiFlexItem>
                    <EuiText size="s" color="subdued">P99 Latency</EuiText>
                    <EuiTitle size="l">
                      <h2>P99 2359ms</h2>
                    </EuiTitle>
                    <EuiLink>
                      <EuiText size="xs">&gt;</EuiText>
                    </EuiLink>
                  </EuiFlexItem>
                  <EuiFlexItem>
                    <EuiText size="s" color="subdued">Affected</EuiText>
                    <EuiTitle size="m">
                      <h3>8 Ervices</h3>
                    </EuiTitle>
                    <EuiLink>
                      <EuiText size="xs">payments team &gt;</EuiText>
                    </EuiLink>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiPanel>

              <EuiSpacer size="m" />

              {/* Traffic Chart */}
              <EuiPanel hasShadow={false} style={{ background: '#1D1E24', border: '1px solid #343741' }}>
                <EuiTitle size="xs">
                  <h3>[Logs] Traffic Overtime</h3>
                </EuiTitle>
                <EuiSpacer size="m" />
                <div style={{ height: 200, background: '#0F1419', borderRadius: 4, position: 'relative' }}>
                  <svg width="100%" height="200" style={{ position: 'absolute' }}>
                    <defs>
                      <linearGradient id="gradient1" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#54B399', stopOpacity: 0.5 }} />
                        <stop offset="100%" style={{ stopColor: '#54B399', stopOpacity: 0.1 }} />
                      </linearGradient>
                      <linearGradient id="gradient2" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#6092C0', stopOpacity: 0.4 }} />
                        <stop offset="100%" style={{ stopColor: '#6092C0', stopOpacity: 0.05 }} />
                      </linearGradient>
                    </defs>
                    <path d="M 0,150 Q 50,120 100,130 T 200,110 T 300,100 T 400,90 T 500,95 L 500,200 L 0,200 Z" fill="url(#gradient1)" />
                    <path d="M 0,180 Q 50,160 100,170 T 200,150 T 300,140 T 400,130 T 500,135 L 500,200 L 0,200 Z" fill="url(#gradient2)" />
                  </svg>
                </div>
                <EuiSpacer size="s" />
                <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
                  <EuiFlexItem>
                    <EuiText size="s">
                      <strong>Top Errors:</strong>
                      <div>DatabaseConnectionTiomoud</div>
                      <div>847 occurances</div>
                    </EuiText>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiFlexGroup gutterSize="s">
                      <EuiButtonIcon iconType="inspect" aria-label="Inspect" />
                      <EuiButtonIcon iconType="copyClipboard" aria-label="Copy" />
                    </EuiFlexGroup>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiPanel>

              <EuiSpacer size="m" />

              {/* Bottom Row - Charts and Tables */}
              <EuiFlexGroup gutterSize="m">
                <EuiFlexItem>
                  <EuiPanel hasShadow={false} style={{ background: '#1D1E24', border: '1px solid #343741' }}>
                    <EuiTitle size="xs">
                      <h3>[Metrics] Error Rate Over Time</h3>
                    </EuiTitle>
                    <EuiSpacer size="m" />
                    <div style={{ height: 150 }}>
                      <svg width="100%" height="150">
                        <polyline
                          points="0,120 50,110 100,100 150,95 200,85 250,75 300,60"
                          fill="none"
                          stroke="#F04E98"
                          strokeWidth="2"
                        />
                        <circle cx="0" cy="120" r="3" fill="#F04E98" />
                        <circle cx="100" cy="100" r="3" fill="#F04E98" />
                        <circle cx="200" cy="85" r="3" fill="#F04E98" />
                        <circle cx="300" cy="60" r="3" fill="#F04E98" />
                      </svg>
                    </div>
                  </EuiPanel>
                </EuiFlexItem>

                <EuiFlexItem>
                  <EuiPanel hasShadow={false} style={{ background: '#1D1E24', border: '1px solid #343741' }}>
                    <EuiTitle size="xs">
                      <h3>[Logs] Filter1-ded Recent Changes</h3>
                    </EuiTitle>
                    <EuiSpacer size="s" />
                    <div style={{ fontSize: '11px' }}>
                      <EuiBasicTable
                        items={logsData.slice(0, 6)}
                        columns={[
                          { field: 'service', name: 'service.name', width: '140px', truncateText: true },
                          { field: 'deployments', name: 'deployments', width: '40px' },
                          { field: 'logLevel', name: 'log level', width: '50px' },
                          { field: 'message', name: 'message', width: '50px' }
                        ]}
                      />
                    </div>
                  </EuiPanel>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>

            {/* Right Column - 1/3 width */}
            <EuiFlexItem grow={1}>
              {/* RCA Panel */}
              <EuiPanel hasShadow={false} style={{ background: '#25262E', border: '1px solid #343741' }}>
                <EuiFlexGroup alignItems="center" justifyContent="spaceBetween">
                  <EuiFlexItem>
                    <EuiTitle size="xs">
                      <h3>Root Cause Analysis</h3>
                    </EuiTitle>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiButtonIcon iconType="cross" aria-label="Close" onClick={() => setShowRCA(false)} />
                  </EuiFlexItem>
                </EuiFlexGroup>
                <EuiSpacer size="m" />

                {/* Timeline visualization */}
                <div style={{ background: '#1D1E24', padding: 12, borderRadius: 4 }}>
                  <svg width="100%" height="80">
                    <line x1="60" y1="10" x2="240" y2="10" stroke="#54B399" strokeWidth="2" />
                    <line x1="240" y1="10" x2="280" y2="50" stroke="#54B399" strokeWidth="2" markerEnd="url(#arrow)" />
                    <circle cx="60" cy="10" r="4" fill="#54B399" />
                    <circle cx="240" cy="10" r="4" fill="#54B399" />
                    <circle cx="280" cy="50" r="4" fill="#F04E98" />
                    <text x="70" y="25" fill="#DFE5EF" fontSize="10">Depalyment v2.4.1</text>
                    <text x="200" y="25" fill="#DFE5EF" fontSize="10">High Error Re Rate</text>
                    <text x="180" y="70" fill="#DFE5EF" fontSize="10">High connection exhaustion</text>
                  </svg>
                </div>

                <EuiSpacer size="m" />
                <EuiText size="s">
                  <strong>Most Likely cause (92%):</strong>
                  <div style={{ marginTop: 8 }}>Deployment caused connection action exhaustion</div>
                </EuiText>
              </EuiPanel>

              <EuiSpacer size="m" />

              {/* Resolver Panel */}
              <EuiPanel hasShadow={false} style={{ background: '#25262E', border: '1px solid #343741' }}>
                <EuiFlexGroup alignItems="center" justifyContent="spaceBetween">
                  <EuiFlexItem>
                    <EuiTitle size="xs">
                      <h3>Resolver</h3>
                    </EuiTitle>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiButtonIcon iconType="cross" aria-label="Close" />
                  </EuiFlexItem>
                </EuiFlexGroup>

                <EuiSpacer size="s" />
                <EuiTitle size="xxs">
                  <h4>Remedeation Steps</h4>
                </EuiTitle>
                <EuiSpacer size="m" />

                {incident?.resolver_proposals?.map((proposal, idx) => (
                  <div key={proposal.action_id} style={{ marginBottom: 8 }}>
                    <EuiText size="s">
                      {idx + 1}. {proposal.title}
                    </EuiText>
                  </div>
                ))}

                <EuiSpacer size="m" />
                <EuiFlexGroup gutterSize="s">
                  <EuiButton fill color="primary" size="s" onClick={() => approveAction('ACT-001')}>
                    Approve Rollback
                  </EuiButton>
                  <EuiButtonIcon iconType="lock" aria-label="Lock" />
                </EuiFlexGroup>
              </EuiPanel>

              <EuiSpacer size="m" />

              {/* Agent Activity */}
              <EuiPanel hasShadow={false} style={{ background: '#1D1E24', border: '1px solid #343741' }}>
                <EuiFlexGroup alignItems="center" justifyContent="spaceBetween">
                  <EuiFlexItem>
                    <EuiTitle size="xs">
                      <h3>DataPulse Agent</h3>
                    </EuiTitle>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiButtonIcon iconType="cross" aria-label="Close" />
                  </EuiFlexItem>
                </EuiFlexGroup>

                <EuiSpacer size="s" />
                <EuiText size="xs" color="subdued">
                  Analyze incident for<br />Q Runtime Agen
                </EuiText>
                <EuiSpacer size="s" />
                <EuiButtonIcon iconType="search" aria-label="Search" />

                <EuiSpacer size="m" />

                <EuiFlexGroup gutterSize="s" alignItems="center">
                  <EuiAvatar size="s" name="User Pulse Agent" />
                  <EuiText size="s">User Pulse Agent</EuiText>
                </EuiFlexGroup>

                <EuiSpacer size="s" />
                <EuiText size="xs" style={{ background: '#25262E', padding: 8, borderRadius: 4 }}>
                  Analyze detect-anomalies lo... @payment-service.
                </EuiText>

                <EuiSpacer size="m" />

                <EuiFlexGroup gutterSize="s" alignItems="flex-start">
                  <EuiAvatar size="s" name="Agent" iconType="agent" color="#7DE2D1" />
                  <EuiFlexItem>
                    <EuiText size="s" style={{ fontWeight: 600 }}>Curat Helvikiem lasstoma</EuiText>
                    <EuiBadge color="danger" style={{ marginTop: 4 }}>CRITICAL</EuiBadge>
                    <EuiSpacer size="xs" />
                    <EuiText size="xs" color="subdued">
                      Sent Slack notification to<br />
                      @payments-onputita tionfi...
                    </EuiText>
                  </EuiFlexItem>
                </EuiFlexGroup>

                <EuiSpacer size="m" />

                <EuiFlexGroup gutterSize="s" alignItems="flex-start">
                  <EuiAvatar size="s" name="Agent" iconType="agent" color="#7DE2D1" />
                  <EuiFlexItem>
                    <EuiText size="xs" color="subdued">
                      Sent Slack notification to<br />
                      Jira ticket cancelt. Jira ticket<br />
                      INC-1214
                    </EuiText>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiPanel>

              <EuiSpacer size="m" />

              {/* Deployments Panel */}
              <EuiPanel hasShadow={false} style={{ background: '#1D1E24', border: '1px solid #343741' }}>
                <EuiTitle size="xs">
                  <h3>Deployments</h3>
                </EuiTitle>
                <EuiSpacer size="s" />
                {deployments.map((dep, idx) => (
                  <EuiFlexGroup key={idx} justifyContent="spaceBetween" alignItems="center" style={{ marginBottom: 8 }}>
                    <EuiFlexItem>
                      <EuiHealth color={dep.status === 'success' ? 'success' : 'subdued'}>
                        {dep.action}
                      </EuiHealth>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <EuiButtonIcon iconType="boxesHorizontal" aria-label="More" />
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <EuiText size="xs">{dep.time}</EuiText>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                ))}
              </EuiPanel>
            </EuiFlexItem>
          </EuiFlexGroup>

          {/* Footer */}
          <EuiSpacer size="l" />
          <EuiText size="xs" textAlign="right" color="subdued">
            Saturday, 31, January 2026 - 3:20:14 PM IST
          </EuiText>
        </EuiPageBody>
      </EuiPage>
    </EuiProvider>
  );
};
