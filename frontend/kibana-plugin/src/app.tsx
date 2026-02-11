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

export const DataPulseApp = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [timeRange, setTimeRange] = useState({ start: 'now-7d', end: 'now' });
  const [approvalMessage, setApprovalMessage] = useState<{ type: 'success' | 'danger' | 'warning'; title: string; message: string } | null>(null);

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
      const response = await axios.post(`${API_BASE}/api/datapulse/v1/incidents/${incident.incident_id}/actions/${actionId}/approve`);
      setApprovalMessage({
        type: 'success',
        title: 'Approval submitted',
        message: `Action ${response.data.action_id} approved successfully.`
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
  const timeline = rcca?.timeline || incident?.analyst_report?.timeline || [];
  const hypotheses = rcca?.hypotheses || incident?.analyst_report?.hypotheses || [];

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
                DataPulse Agent
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

      <div style={{ background: '#25262E', padding: '12px 16px', borderBottom: '1px solid #343741' }}>
        <EuiFlexGroup alignItems="center" gutterSize="s">
          <EuiFlexItem grow={false}><EuiBadge color="primary">D</EuiBadge></EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiTitle size="s"><h1>Incident Response Center</h1></EuiTitle>
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>

      <div style={{ background: '#1D1E24', padding: '12px 16px', borderBottom: '1px solid #343741' }}>
        <EuiFlexGroup alignItems="center" gutterSize="m">
          <EuiFlexItem grow={true} style={{ maxWidth: 400 }}>
            <EuiFieldSearch
              placeholder="Search incidents..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              fullWidth
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiSuperDatePicker
              start={timeRange.start}
              end={timeRange.end}
              onTimeChange={({ start, end }: any) => setTimeRange({ start, end })}
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
            {/* Left/Sidebar: Incident List */}
            <EuiFlexItem grow={false} style={{ width: 350 }}>
              <EuiPanel hasBorder>
                <EuiTitle size="xs"><h3>Quick List</h3></EuiTitle>
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
                    { field: 'incident_id', name: 'ID', width: '80px' },
                    { field: 'service', name: 'Service' },
                    {
                      name: 'Sev',
                      render: (item: Incident) => (
                        <EuiBadge color={getSeverityColor(item.severity)}>{(item.severity || '??').charAt(0).toUpperCase()}</EuiBadge>
                      ),
                    },
                  ]}
                />
              </EuiPanel>
            </EuiFlexItem>

            {/* Center: Dashboard/Detail */}
            <EuiFlexItem grow={3}>
              {incident ? (
                <>
                  <EuiPanel hasShadow={false} style={{ background: '#1D1E24', border: '1px solid #343741' }}>
                    <EuiFlexGroup alignItems="center" justifyContent="spaceBetween">
                      <EuiFlexItem>
                        <EuiTitle size="s"><h2>{incident.incident_id}: {incident.service}</h2></EuiTitle>
                        <EuiFlexGroup gutterSize="s" style={{ marginTop: 4 }}>
                          <EuiFlexItem grow={false}><EuiBadge color={getSeverityColor(incident.severity)}>{incident.severity?.toUpperCase()}</EuiBadge></EuiFlexItem>
                          <EuiFlexItem grow={false}><EuiBadge color="hollow">{incident.status}</EuiBadge></EuiFlexItem>
                        </EuiFlexGroup>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                    <EuiSpacer size="l" />
                    <EuiFlexGroup>
                      <EuiFlexItem>
                        <EuiStat title={`${((incident.metrics?.error_rate || 0) * 100).toFixed(2)}%`} description="Current Error Rate" titleColor="#F04E98" />
                      </EuiFlexItem>
                      <EuiFlexItem>
                        <EuiStat title={`${incident.metrics?.p99_latency_ms || 0}ms`} description="P99 Latency" />
                      </EuiFlexItem>
                      <EuiFlexItem>
                        <EuiStat title={incident.status || 'Active'} description="Incident Status" />
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </EuiPanel>

                  <EuiSpacer size="m" />

                  <EuiPanel hasShadow={false} style={{ background: '#1D1E24', border: '1px solid #343741' }}>
                    <EuiTitle size="xs"><h3>Signals & Timeline</h3></EuiTitle>
                    <EuiSpacer size="m" />
                    <div style={{ height: 120, background: '#0F1419', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <EuiText color="subdued">Live Signal Graph Placeholder</EuiText>
                    </div>
                  </EuiPanel>
                </>
              ) : (
                <EuiEmptyPrompt title={<h3>No incident selected</h3>} body={<p>Select an incident from the list to begin investigation.</p>} />
              )}
            </EuiFlexItem>

            {/* Right: RCA & Actions */}
            <EuiFlexItem grow={2}>
              {incident && (
                <>
                  <EuiPanel style={{ background: '#25262E', border: '1px solid #343741' }}>
                    <EuiTitle size="xs"><h3>Root Cause Analysis</h3></EuiTitle>
                    <EuiSpacer size="m" />
                    {hypotheses.length > 0 ? (
                      hypotheses.map((h, i) => (
                        <div key={i} style={{ marginBottom: 12 }}>
                          <EuiText size="s"><strong>{h.cause}</strong></EuiText>
                          <EuiHealth color={h.confidence && h.confidence > 0.8 ? 'success' : 'warning'}>
                            Confidence: {Math.round((h.confidence || 0) * 100)}%
                          </Health>
                          <EuiText size="xs" color="subdued">{h.description}</EuiText>
                        </div>
                      ))
                    ) : (
                      <EuiText color="subdued">Awaiting agent analysis...</EuiText>
                    )}
                  </EuiPanel>

                  <EuiSpacer size="m" />

                  <EuiPanel style={{ background: '#25262E', border: '1px solid #343741' }}>
                    <EuiTitle size="xs"><h3>Resolver Actions</h3></EuiTitle>
                    <EuiSpacer size="m" />
                    {approvalMessage && (
                      <EuiCallOut title={approvalMessage.title} color={approvalMessage.type} size="s" style={{ marginBottom: 12 }}>
                        <p>{approvalMessage.message}</p>
                      </EuiCallOut>
                    )}
                    {incident.resolver_proposals?.map((p) => (
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
                    ))}
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
