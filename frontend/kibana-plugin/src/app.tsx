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
    timeline?: Array<{ timestamp?: string; event: string }>;
    hypotheses?: Array<{ cause: string; confidence?: number; description?: string }>;
    rcca?: {
      timeline?: Array<{ ts?: string; event: string }>;
      hypotheses?: Array<{ cause: string; confidence?: number; description?: string }>;
    };
  };
  resolver_proposals?: Array<{
    action_id: string;
    title: string;
    description?: string;
    requires_approval?: boolean;
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

  const fetchIncidentDetail = useCallback(async (incidentId: string) => {
    const response = await axios.get<Incident>(`${API_BASE}/api/datapulse/v1/incidents/${incidentId}`);
    setIncident(response.data);
  }, []);

  const fetchIncidents = useCallback(async () => {
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
  }, [fetchIncidentDetail, selectedIncidentId]);

  const refreshData = useCallback(async () => {
    try {
      setError(null);
      await fetchIncidents();
    } catch (err) {
      console.error('Failed to load incidents', err);
      setError('Failed to load incidents from API.');
    } finally {
      setLoading(false);
    }
  }, [fetchIncidents]);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, [refreshData]);

  const filteredIncidents = useMemo(() => {
    const term = searchValue.trim().toLowerCase();
    if (!term) {
      return incidents;
    }
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

  const rcca = incident?.analyst_report?.rcca;
  const timeline = rcca?.timeline || incident?.analyst_report?.timeline || [];
  const hypotheses = rcca?.hypotheses || incident?.analyst_report?.hypotheses || [];

  return (
    <EuiProvider colorMode="dark">
      <EuiPage style={{ background: '#141519' }} paddingSize="m">
        <EuiPageBody>
          <EuiFlexGroup alignItems="center" justifyContent="spaceBetween">
            <EuiFlexItem grow={false}>
              <EuiTitle size="m">
                <h2>DataPulse Incident Command Center</h2>
              </EuiTitle>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButton iconType="refresh" onClick={refreshData} isLoading={loading}>
                Refresh
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>

          <EuiSpacer size="m" />

          <EuiFieldSearch
            placeholder="Search incidents by id, service, status, severity"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            fullWidth
          />

          <EuiSpacer size="m" />

          {error && (
            <EuiPanel color="danger" hasBorder>
              <EuiText color="danger">{error}</EuiText>
            </EuiPanel>
          )}

          {loading && incidents.length === 0 && (
            <EuiEmptyPrompt
              title={<h3>Loading incidents</h3>}
              body={<p>Fetching live incident data from the DataPulse API.</p>}
            />
          )}

          {!loading && incidents.length === 0 && !error && (
            <EuiEmptyPrompt
              title={<h3>No incidents found</h3>}
              body={<p>There are currently no incidents matching the selected filters.</p>}
            />
          )}

          {incidents.length > 0 && (
            <EuiFlexGroup gutterSize="m" alignItems="flexStart">
              <EuiFlexItem grow={1}>
                <EuiPanel hasBorder>
                  <EuiTitle size="s">
                    <h3>Open incidents ({filteredIncidents.length})</h3>
                  </EuiTitle>
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
                      { field: 'incident_id', name: 'Incident ID' },
                      { field: 'service', name: 'Service' },
                      {
                        name: 'Severity',
                        render: (item: Incident) => (
                          <EuiBadge color={getSeverityColor(item.severity)}>{(item.severity || 'unknown').toUpperCase()}</EuiBadge>
                        ),
                      },
                      { field: 'status', name: 'Status' },
                    ]}
                  />
                </EuiPanel>
              </EuiFlexItem>

              <EuiFlexItem grow={2}>
                <EuiPanel hasBorder>
                  {incident ? (
                    <>
                      <EuiFlexGroup gutterSize="s" alignItems="center">
                        <EuiFlexItem grow={false}>
                          <EuiTitle size="s">
                            <h3>{incident.incident_id}</h3>
                          </EuiTitle>
                        </EuiFlexItem>
                        <EuiFlexItem grow={false}>
                          <EuiBadge color={getSeverityColor(incident.severity)}>{incident.severity?.toUpperCase() || 'UNKNOWN'}</EuiBadge>
                        </EuiFlexItem>
                        <EuiFlexItem grow={false}>
                          <EuiBadge color="hollow">{incident.status || 'unknown'}</EuiBadge>
                        </EuiFlexItem>
                        <EuiFlexItem grow={false}>
                          <EuiText size="s" color="subdued">{incident.service || 'unknown service'}</EuiText>
                        </EuiFlexItem>
                      </EuiFlexGroup>

                      <EuiSpacer size="m" />

                      <EuiFlexGroup>
                        <EuiFlexItem>
                          <EuiPanel hasBorder>
                            <EuiText size="s" color="subdued">Error rate</EuiText>
                            <EuiTitle size="m">
                              <h4>{((incident.metrics?.error_rate || 0) * 100).toFixed(2)}%</h4>
                            </EuiTitle>
                          </EuiPanel>
                        </EuiFlexItem>
                        <EuiFlexItem>
                          <EuiPanel hasBorder>
                            <EuiText size="s" color="subdued">P99 latency</EuiText>
                            <EuiTitle size="m">
                              <h4>{incident.metrics?.p99_latency_ms || 0}ms</h4>
                            </EuiTitle>
                          </EuiPanel>
                        </EuiFlexItem>
                      </EuiFlexGroup>

                      <EuiSpacer size="m" />

                      <EuiTitle size="xs">
                        <h4>Root cause analysis</h4>
                      </EuiTitle>
                      <EuiSpacer size="s" />
                      {hypotheses.length === 0 ? (
                        <EuiText size="s" color="subdued">No analyst hypothesis yet.</EuiText>
                      ) : (
                        hypotheses.slice(0, 3).map((hypothesis, idx) => (
                          <EuiPanel key={`${hypothesis.cause}-${idx}`} hasBorder style={{ marginBottom: 8 }}>
                            <EuiText size="s">
                              <strong>{hypothesis.cause}</strong>
                            </EuiText>
                            <EuiText size="s" color="subdued">
                              Confidence: {Math.round((hypothesis.confidence || 0) * 100)}%
                            </EuiText>
                            {hypothesis.description && <EuiText size="s">{hypothesis.description}</EuiText>}
                          </EuiPanel>
                        ))
                      )}

                      <EuiSpacer size="m" />

                      <EuiTitle size="xs">
                        <h4>Timeline</h4>
                      </EuiTitle>
                      <EuiSpacer size="s" />
                      {timeline.length === 0 ? (
                        <EuiText size="s" color="subdued">No timeline events available.</EuiText>
                      ) : (
                        timeline.slice(0, 6).map((event, idx) => (
                          <EuiText size="s" key={`${event.event}-${idx}`}>
                            {(event.timestamp || event.ts || 'n/a')}: {event.event}
                          </EuiText>
                        ))
                      )}

                      <EuiSpacer size="m" />

                      <EuiTitle size="xs">
                        <h4>Resolver proposals</h4>
                      </EuiTitle>
                      <EuiSpacer size="s" />
                      {incident.resolver_proposals?.length ? (
                        incident.resolver_proposals.map((proposal) => (
                          <EuiPanel key={proposal.action_id} hasBorder style={{ marginBottom: 8 }}>
                            <EuiText size="s">
                              <strong>{proposal.title}</strong>
                            </EuiText>
                            {proposal.description && <EuiText size="s">{proposal.description}</EuiText>}
                          </EuiPanel>
                        ))
                      ) : (
                        <EuiText size="s" color="subdued">No resolver proposals yet.</EuiText>
                      )}
                    </>
                  ) : (
                    <EuiEmptyPrompt
                      title={<h3>Select an incident</h3>}
                      body={<p>Choose an incident from the list to view full details.</p>}
                    />
                  )}
                </EuiPanel>
              </EuiFlexItem>
            </EuiFlexGroup>
          )}
        </EuiPageBody>
      </EuiPage>
    </EuiProvider>
  );
};
