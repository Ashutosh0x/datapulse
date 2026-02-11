import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  EuiBadge,
  EuiBasicTable,
  EuiButton,
  EuiEmptyPrompt,
  EuiFieldSearch,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPage,
  EuiPageBody,
  EuiPanel,
  EuiProvider,
  EuiSpacer,
  EuiText,
  EuiTitle,
  EuiHeader,
  EuiHeaderSection,
  EuiHeaderLogo,
  EuiPageHeader,
  EuiStat,
  EuiButtonIcon,
  EuiSuperDatePicker,
  EuiIcon,
  EuiPopover,
  EuiContextMenu,
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
  EuiCallOut,
  EuiProgress,
} from '@elastic/eui';
import axios from 'axios';

interface Incident {
  incident_id: string;
  service: string;
  severity: string;
  status: string;
  created_at: string;
  metrics?: {
    error_rate?: number;
    p99_latency_ms?: number;
  };
  analyst_report?: {
    timeline?: Array<{ timestamp?: string; ts?: string; event: string }>;
    hypotheses?: Array<{ cause: string; confidence?: number; description?: string }>;
    rcca?: {
      timeline?: Array<{ ts?: string; timestamp?: string; event: string }>;
      hypotheses?: Array<{ cause: string; confidence?: number; description?: string }>;
    };
  };
  resolver_proposals?: Array<{
    action_id: string;
    action_type?: string;
    title: string;
    description?: string;
    estimated_time?: string;
    requires_approval?: boolean;
    status?: string;
  }>;
  actions?: Array<{
    action_id: string;
    title: string;
    state: string;
    requires_approval: boolean;
  }>;
  action_history?: Array<{
    action_id: string;
    from_state: string;
    to_state: string;
    actor: string;
    timestamp: string;
    source: string;
  }>;
}

interface IncidentListResponse {
  page: number;
  page_size: number;
  total: number;
  records: Incident[];
}

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const SELECTED_INCIDENT_KEY = 'datapulse.selectedIncidentId';

const getSeverityColor = (severity: string) => {
  switch ((severity || '').toLowerCase()) {
    case 'critical':
      return 'danger';
    case 'high':
      return 'warning';
    case 'medium':
      return 'primary';
    case 'low':
      return 'success';
    default:
      return 'hollow';
  }
};

const getActionStateColor = (state: string) => {
  switch (state) {
    case 'proposed':
      return 'hollow';
    case 'approved':
      return 'primary';
    case 'rejected':
      return 'danger';
    case 'executed':
      return 'success';
    case 'failed':
      return 'warning';
    default:
      return 'default';
  }
};

export const DataPulseApp = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [timeRange, setTimeRange] = useState({ start: 'now-7d', end: 'now' });
  const [approvalMessage, setApprovalMessage] = useState<{
    type: 'success' | 'danger' | 'warning';
    title: string;
    message: string;
  } | null>(null);

  const fetchIncidentDetail = useCallback(async (incidentId: string) => {
    try {
      const response = await axios.get<Incident>(`${API_BASE}/api/datapulse/v1/incidents/${incidentId}`);
      setIncident(response.data);
    } catch (err) {
      console.error('Failed to fetch incident detail', err);
    }
  }, []);

  const fetchIncidents = useCallback(async () => {
    try {
      const response = await axios.get<IncidentListResponse>(`${API_BASE}/api/datapulse/v1/incidents`, {
        params: {
          page: 1,
          page_size: 100,
          sort_by: 'created_at',
          sort_order: 'desc',
        },
      });

      const records = response.data.records || [];
      setIncidents(records);

      const storedSelection = localStorage.getItem(SELECTED_INCIDENT_KEY);
      const preferredId = selectedIncidentId || storedSelection;
      const matched = preferredId ? records.find((item) => item.incident_id === preferredId) : undefined;
      const nextSelection = matched?.incident_id || records[0]?.incident_id || null;

      if (nextSelection) {
        setSelectedIncidentId(nextSelection);
        localStorage.setItem(SELECTED_INCIDENT_KEY, nextSelection);
        await fetchIncidentDetail(nextSelection);
      } else {
        setSelectedIncidentId(null);
        setIncident(null);
      }
    } catch (err) {
      console.error('Failed to fetch incidents', err);
      setError('Failed to load incidents from API.');
    } finally {
      setLoading(false);
    }
  }, [fetchIncidentDetail, selectedIncidentId]);

  const refreshData = useCallback(async () => {
    setLoading(true);
    await fetchIncidents();
  }, [fetchIncidents]);

  useEffect(() => {
    refreshData();
    const interval = setInterval(fetchIncidents, 30000);
    return () => clearInterval(interval);
  }, [fetchIncidents, refreshData]);

  const filteredIncidents = useMemo(() => {
    const term = searchValue.trim().toLowerCase();
    if (!term) return incidents;
    return incidents.filter(
      (item) =>
        item.incident_id.toLowerCase().includes(term) ||
        (item.service || '').toLowerCase().includes(term) ||
        (item.status || '').toLowerCase().includes(term) ||
        (item.severity || '').toLowerCase().includes(term),
    );
  }, [incidents, searchValue]);

  const selectIncident = async (incidentId: string) => {
    try {
      setError(null);
      setSelectedIncidentId(incidentId);
      localStorage.setItem(SELECTED_INCIDENT_KEY, incidentId);
      await fetchIncidentDetail(incidentId);
    } catch (err) {
      console.error('Failed to load incident detail', err);
      setError(`Failed to load detail for ${incidentId}.`);
    }
  };

  const approveAction = async (actionId: string) => {
    if (!incident) return;
    setApprovalMessage(null);
    try {
      await axios.post(`${API_BASE}/api/datapulse/v1/incidents/${incident.incident_id}/actions/${actionId}/approve`, {
        actor: 'ui-oncall',
        source: 'ui',
      });
      setApprovalMessage({
        type: 'success',
        title: 'Approval submitted',
        message: `Action ${actionId} approved successfully.`,
      });
      fetchIncidentDetail(incident.incident_id);
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 404) {
        setApprovalMessage({ type: 'warning', title: 'Not found', message: 'Item no longer exists.' });
      } else if (status === 409) {
        setApprovalMessage({ type: 'warning', title: 'Already approved', message: 'This remediation was already approved.' });
      } else {
        setApprovalMessage({ type: 'danger', title: 'Approval failed', message: 'Server error. Please try again.' });
      }
    }
  };

  const rcca = incident?.analyst_report?.rcca;
  const hypotheses = rcca?.hypotheses || incident?.analyst_report?.hypotheses || [];

  if (loading && incidents.length === 0) {
    return (
      <EuiProvider colorMode="dark">
        <EuiFlexGroup justifyContent="center" alignItems="center" style={{ height: '100vh' }}>
          <EuiText>Loading DataPulse...</EuiText>
        </EuiFlexGroup>
      </EuiProvider>
    );
  }

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
              <EuiText size="s" style={{ display: 'inline', marginLeft: 8, color: '#7DE2D1', fontWeight: 600 }}>
                DataPulse Response Center
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiHeaderSection>
        <EuiHeaderSection side="right">
          <EuiFlexGroup gutterSize="s" alignItems="center">
            <EuiButtonIcon iconType="help" aria-label="Help" color="text" />
            <EuiButtonIcon iconType="bell" aria-label="Notifications" color="text" />
            <EuiButtonIcon iconType="user" aria-label="Account" color="text" />
          </EuiFlexGroup>
        </EuiHeaderSection>
      </EuiHeader>

      {/* Toolbar */}
      <div style={{ background: '#1D1E24', padding: '12px 16px', borderBottom: '1px solid #343741' }}>
        <EuiFlexGroup alignItems="center" gutterSize="m">
          <EuiFlexItem grow={false}>
            <EuiButtonIcon iconType="menu" aria-label="Menu" color="text" />
          </EuiFlexItem>
          <EuiFlexItem grow={true} style={{ maxWidth: 400 }}>
            <EuiFieldSearch
              placeholder="Search incidents or KQL..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              fullWidth
              append="KQL"
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiSuperDatePicker
              start={timeRange.start}
              end={timeRange.end}
              onTimeChange={({ start, end }: { start: string; end: string }) => setTimeRange({ start, end })}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton size="s" iconType="refresh" fill color="primary" onClick={refreshData} isLoading={loading}>
              Refresh
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>

      <EuiPage paddingSize="m" style={{ background: '#141519' }}>
        <EuiPageBody>
          <EuiFlexGroup gutterSize="m">
            {/* Sidebar: Incident List */}
            <EuiFlexItem grow={false} style={{ width: 350 }}>
              <EuiPanel hasBorder style={{ background: '#1D1E24' }}>
                <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
                  <EuiFlexItem>
                    <EuiTitle size="xs"><h3>Incidents</h3></EuiTitle>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiBadge color="hollow">{incidents.length}</EuiBadge>
                  </EuiFlexItem>
                </EuiFlexGroup>
                <EuiSpacer size="s" />
                <EuiBasicTable
                  items={filteredIncidents}
                  rowProps={(item: Incident) => ({
                    onClick: () => selectIncident(item.incident_id),
                    style: {
                      cursor: 'pointer',
                      backgroundColor: item.incident_id === selectedIncidentId ? '#25262E' : 'transparent',
                    },
                  })}
                  columns={[
                    { field: 'incident_id', name: 'ID', width: '90px' },
                    { field: 'service', name: 'Service', truncateText: true },
                    {
                      name: 'Sev',
                      width: '50px',
                      render: (item: Incident) => (
                        <EuiBadge color={getSeverityColor(item.severity)}>{item.severity?.charAt(0).toUpperCase()}</EuiBadge>
                      ),
                    },
                  ]}
                />
              </EuiPanel>
            </EuiFlexItem>

            {/* Center: Incident Detail & Analytics */}
            <EuiFlexItem grow={3}>
              {incident ? (
                <>
                  {/* Summary Panel */}
                  <EuiPanel hasShadow={false} style={{ background: '#1D1E24', border: '1px solid #343741' }}>
                    <EuiFlexGroup alignItems="center" justifyContent="spaceBetween">
                      <EuiFlexItem>
                        <EuiFlexGroup gutterSize="s" alignItems="center">
                          <EuiFlexItem grow={false}>
                            <EuiBadge color={getSeverityColor(incident.severity)}>{incident.severity?.toUpperCase()}</EuiBadge>
                          </EuiFlexItem>
                          <EuiFlexItem grow={false}>
                            <EuiTitle size="s"><h2>{incident.incident_id}: {incident.service}</h2></EuiTitle>
                          </EuiFlexItem>
                        </EuiFlexGroup>
                      </EuiFlexItem>
                      <EuiFlexItem grow={false}>
                        <EuiHealth color="success">{incident.status}</EuiHealth>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                    <EuiSpacer size="l" />
                    <EuiFlexGroup>
                      <EuiFlexItem>
                        <EuiText size="s" color="subdued">Current Error Rate</EuiText>
                        <EuiTitle size="m">
                          <h2 style={{ color: '#F04E98' }}>{((incident.metrics?.error_rate || 0) * 100).toFixed(2)}%</h2>
                        </EuiTitle>
                      </EuiFlexItem>
                      <EuiFlexItem>
                        <EuiText size="s" color="subdued">P99 Latency</EuiText>
                        <EuiTitle size="m">
                          <h2>{incident.metrics?.p99_latency_ms || 0}ms</h2>
                        </EuiTitle>
                      </EuiFlexItem>
                      <EuiFlexItem>
                        <EuiText size="s" color="subdued">Affected Services</EuiText>
                        <EuiTitle size="m">
                          <h3>1 Core</h3>
                        </EuiTitle>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </EuiPanel>

                  <EuiSpacer size="m" />

                  {/* Traffic Chart Panel */}
                  <EuiPanel hasShadow={false} style={{ background: '#1D1E24', border: '1px solid #343741' }}>
                    <EuiTitle size="xs"><h3>[Logs] Traffic Over Time</h3></EuiTitle>
                    <EuiSpacer size="m" />
                    <div style={{ height: 180, background: '#0F1419', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
                      <svg width="100%" height="180" style={{ position: 'absolute' }}>
                        <defs>
                          <linearGradient id="gradient1" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style={{ stopColor: '#54B399', stopOpacity: 0.5 }} />
                            <stop offset="100%" style={{ stopColor: '#54B399', stopOpacity: 0.1 }} />
                          </linearGradient>
                        </defs>
                        <path d="M 0,140 Q 100,100 200,120 T 400,80 T 600,100 T 800,70 L 800,180 L 0,180 Z" fill="url(#gradient1)" />
                        <polyline points="0,140 100,100 200,120 300,90 400,80 500,110 600,100 700,90 800,70" fill="none" stroke="#54B399" strokeWidth="2" />
                      </svg>
                    </div>
                  </EuiPanel>

                  <EuiSpacer size="m" />

                  {/* Root Cause Analytics (Full View) */}
                  <EuiFlexGroup gutterSize="m">
                    <EuiFlexItem>
                      <EuiPanel hasShadow={false} style={{ background: '#1D1E24', border: '1px solid #343741' }}>
                        <EuiTitle size="xs"><h3>Error Rate Trend</h3></EuiTitle>
                        <EuiSpacer size="m" />
                        <div style={{ height: 120 }}>
                          <svg width="100%" height="120">
                            <polyline
                              points="0,100 100,90 200,40 300,50 400,20"
                              fill="none"
                              stroke="#F04E98"
                              strokeWidth="2"
                            />
                            <circle cx="400" cy="20" r="4" fill="#F04E98" />
                          </svg>
                        </div>
                      </EuiPanel>
                    </EuiFlexItem>
                    <EuiFlexItem>
                      <EuiPanel hasShadow={false} style={{ background: '#1D1E24', border: '1px solid #343741' }}>
                        <EuiTitle size="xs"><h3>System Resource Load</h3></EuiTitle>
                        <EuiSpacer size="m" />
                        <EuiFlexGroup direction="column" gutterSize="s">
                          <EuiFlexItem>
                            <EuiText size="xs">CPU Usage (Avg)</EuiText>
                            <div style={{ height: 8, background: '#343741', borderRadius: 4 }}>
                              <div style={{ width: '78%', height: '100%', background: '#006BB4', borderRadius: 4 }} />
                            </div>
                          </EuiFlexItem>
                          <EuiFlexItem>
                            <EuiText size="xs">Memory Utilization</EuiText>
                            <div style={{ height: 8, background: '#343741', borderRadius: 4 }}>
                              <div style={{ width: '92%', height: '100%', background: '#E7664C', borderRadius: 4 }} />
                            </div>
                          </EuiFlexItem>
                        </EuiFlexGroup>
                      </EuiPanel>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </>
              ) : (
                <EuiEmptyPrompt
                  iconType="managementApp"
                  title={<h2>No incident selected</h2>}
                  body={<p>Select an incident from the sidebar to view detailed analysis and take action.</p>}
                />
              )}
            </EuiFlexItem>

            {/* Right: RCA & Remediation */}
            <EuiFlexItem grow={2}>
              {incident && (
                <>
                  {/* RCA Panel */}
                  <EuiPanel style={{ background: '#25262E', border: '1px solid #343741' }}>
                    <EuiTitle size="xs"><h3>Root Cause Analysis</h3></EuiTitle>
                    <EuiSpacer size="m" />
                    <div style={{ background: '#1D1E24', padding: 12, borderRadius: 4, marginBottom: 16 }}>
                      <svg width="100%" height="60">
                        <line x1="20" y1="30" x2="200" y2="30" stroke="#54B399" strokeWidth="2" />
                        <circle cx="20" cy="30" r="4" fill="#54B399" />
                        <circle cx="110" cy="30" r="4" fill="#54B399" />
                        <circle cx="200" cy="30" r="6" fill="#F04E98" />
                        <text x="15" y="50" fill="#subdued" fontSize="10">Deploy</text>
                        <text x="100" y="50" fill="#subdued" fontSize="10">Spike</text>
                        <text x="180" y="50" fill="#F04E98" fontSize="10">Impact</text>
                      </svg>
                    </div>
                    {hypotheses.length > 0 ? (
                      hypotheses.map((h: any, i: number) => (
                        <div key={i} style={{ marginBottom: 12 }}>
                          <EuiFlexGroup alignItems="center" gutterSize="s">
                            <EuiFlexItem grow={false}><EuiIcon type="bolt" color="warning" /></EuiFlexItem>
                            <EuiFlexItem><EuiText size="s"><strong>{h.cause}</strong></EuiText></EuiFlexItem>
                          </EuiFlexGroup>
                          <EuiSpacer size="xs" />
                          <EuiProgress value={Math.round((h.confidence || 0) * 100)} max={100} color="accent" size="xs" />
                          <EuiText size="xs" color="subdued" style={{ marginTop: 4 }}>
                            {h.description} ({Math.round((h.confidence || 0) * 100)}% match)
                          </EuiText>
                        </div>
                      ))
                    ) : (
                      <EuiEmptyPrompt body={<EuiText size="s" color="subdued">Awaiting agent correlation...</EuiText>} />
                    )}
                  </EuiPanel>

                  <EuiSpacer size="m" />

                  {/* Actions & State Machine */}
                  <EuiPanel style={{ background: '#25262E', border: '1px solid #343741' }}>
                    <EuiTitle size="xs"><h3>Resolver Actions</h3></EuiTitle>
                    <EuiSpacer size="m" />
                    {approvalMessage && (
                      <EuiCallOut title={approvalMessage.title} color={approvalMessage.type} size="s" style={{ marginBottom: 16 }}>
                        <p>{approvalMessage.message}</p>
                      </EuiCallOut>
                    )}

                    {/* Modern Actions List */}
                    {incident.actions && incident.actions.length > 0 ? (
                      incident.actions.map((action: any, idx: number) => (
                        <div key={action.action_id} style={{ marginBottom: 12, padding: 8, background: '#1D1E24', borderRadius: 4 }}>
                          <EuiFlexGroup alignItems="center" justifyContent="spaceBetween">
                            <EuiFlexItem>
                              <EuiText size="s"><strong>{idx + 1}. {action.title}</strong></EuiText>
                            </EuiFlexItem>
                            <EuiFlexItem grow={false}>
                              <EuiBadge color={getActionStateColor(action.state)}>{action.state}</EuiBadge>
                            </EuiFlexItem>
                          </EuiFlexGroup>
                          {action.state === 'proposed' && action.requires_approval && (
                            <div style={{ marginTop: 8 }}>
                              <EuiButton size="s" color="primary" fill onClick={() => approveAction(action.action_id)}>
                                Approve Remediation
                              </EuiButton>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      /* Legacy Fallback */
                      incident.resolver_proposals?.map((p: any) => (
                        <EuiPanel key={p.action_id} paddingSize="s" style={{ background: '#1D1E24', marginBottom: 8 }}>
                          <EuiFlexGroup alignItems="center" justifyContent="spaceBetween">
                            <EuiFlexItem>
                              <EuiText size="s"><strong>{p.title}</strong></EuiText>
                              <EuiText size="xs" color="subdued">{p.description}</EuiText>
                            </EuiFlexItem>
                            <EuiFlexItem grow={false}>
                              {p.status === 'approved' ? (
                                <EuiBadge color="success">Approved</EuiBadge>
                              ) : (
                                <EuiButton size="s" color="primary" fill onClick={() => approveAction(p.action_id)}>Approve</EuiButton>
                              )}
                            </EuiFlexItem>
                          </EuiFlexGroup>
                        </EuiPanel>
                      ))
                    )}

                    <EuiSpacer size="m" />
                    <EuiTitle size="xxs"><h4>Action History</h4></EuiTitle>
                    <EuiSpacer size="s" />
                    <EuiCommentList>
                      {incident.action_history?.map((entry: any, idx: number) => (
                        <EuiComment
                          key={`${entry.action_id}-${idx}`}
                          username={entry.actor}
                          event={`${entry.action_id}: ${entry.from_state} → ${entry.to_state}`}
                          timestamp={new Date(entry.timestamp).toLocaleTimeString()}
                          timelineAvatar={<EuiIcon type="check" size="m" color="success" />}
                        />
                      ))}
                    </EuiCommentList>
                  </EuiPanel>

                  <EuiSpacer size="m" />

                  {/* Agent Activity Feed */}
                  <EuiPanel hasShadow={false} style={{ background: '#1D1E24', border: '1px solid #343741' }}>
                    <EuiTitle size="xs"><h3>Agent Activity</h3></EuiTitle>
                    <EuiSpacer size="m" />
                    <EuiFlexGroup gutterSize="s" alignItems="flex-start">
                      <EuiAvatar size="s" name="Analyst" iconType="agent" color="#7DE2D1" />
                      <EuiFlexItem>
                        <EuiText size="s" style={{ fontWeight: 600 }}>Analyst Agent</EuiText>
                        <EuiText size="xs" color="subdued">
                          Identified 12 anomalous log patterns in {incident.service}. Root cause identified as connection exhaustion.
                        </EuiText>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                    <EuiSpacer size="s" />
                    <EuiFlexGroup gutterSize="s" alignItems="flex-start">
                      <EuiAvatar size="s" name="Resolver" iconType="agent" color="#7DE2D1" />
                      <EuiFlexItem>
                        <EuiText size="s" style={{ fontWeight: 600 }}>Resolver Agent</EuiText>
                        <EuiText size="xs" color="subdued">
                          Proposed 3 remediation actions. Awaiting human-in-the-loop approval.
                        </EuiText>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </EuiPanel>
                </>
              )}
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPageBody>
      </EuiPage>
    </EuiProvider>
  );
};
