import React, { useState, useEffect, useCallback } from 'react';
import {
    EuiProvider,
    EuiHeader,
    EuiHeaderSection,
    EuiHeaderLogo,
    EuiPage,
    EuiPageBody,
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
    EuiAvatar,
    EuiBasicTable,
    EuiHealth,
    EuiLink,
    EuiCallOut,
    EuiHorizontalRule,
    EuiIcon,
    EuiAccordion,
    EuiStepsHorizontal,
    EuiComment,
    EuiCommentList,
    EuiLoadingSpinner,
    EuiToast,
    EuiGlobalToastList,
} from '@elastic/eui';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api/datapulse/v1';

export const DataPulseApp = () => {
    const [searchValue, setSearchValue] = useState('');
    const [isAuditOpen, setIsAuditOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [incident, setIncident] = useState(null);
    const [incidentsList, setIncidentsList] = useState([]);
    const [toasts, setToasts] = useState([]);

    const addToast = (title, color = 'success', text = '') => {
        setToasts([...toasts, { id: Math.random().toString(), title, color, text }]);
    };

    const removeToast = (removedToast) => {
        setToasts(toasts.filter((toast) => toast.id !== removedToast.id));
    };

    const fetchLatestIncident = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/incidents?page_size=1&sort_by=created_at&sort_order=desc`);
            const data = await response.json();
            if (data.records && data.records.length > 0) {
                const latest = data.records[0];
                // Fetch full details for the latest incident
                const detailResponse = await fetch(`${API_BASE_URL}/incidents/${latest.incident_id}`);
                const detailData = await detailResponse.json();
                setIncident(detailData);
            }
        } catch (err) {
            console.error('Failed to fetch incidents:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLatestIncident();
        const interval = setInterval(fetchLatestIncident, 5000); // Poll every 5 seconds
        return () => clearInterval(interval);
    }, [fetchLatestIncident]);

    const handleAction = async (actionId, type) => {
        if (!incident) return;
        try {
            const response = await fetch(`${API_BASE_URL}/incidents/${incident.incident_id}/actions/${actionId}/${type}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ actor: 'kibana-user', source: 'ui', reason: 'User initiative' })
            });
            if (response.ok) {
                addToast(`Action ${type}ed successfully`, 'success');
                fetchLatestIncident();
            } else {
                addToast(`Failed to ${type} action`, 'danger');
            }
        } catch (err) {
            addToast(`Error: ${err.message}`, 'danger');
        }
    };

    if (loading && !incident) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#141519' }}>
                <EuiLoadingSpinner size="xl" />
            </div>
        );
    }

    if (!incident) {
        return (
            <EuiPage paddingSize="m" style={{ background: '#141519' }}>
                <EuiCallOut title="No incidents found" color="primary" iconType="help">
                    <p>Start the data generator to see live incidents here.</p>
                </EuiCallOut>
            </EuiPage>
        );
    }

    const timeline = incident.timeline || [];
    const agentStates = [
        { name: 'Sentinel', status: 'complete', message: 'Detected', icon: 'check', color: 'success' },
        { name: 'Analyst', status: incident.analyst_report ? 'complete' : 'pending', message: incident.analyst_report ? 'RCA completed' : 'Investigating...', icon: incident.analyst_report ? 'check' : 'clock', color: incident.analyst_report ? 'success' : 'warning' },
        { name: 'Resolver', status: incident.actions?.length > 0 ? 'complete' : 'pending', message: incident.actions?.length > 0 ? 'Proposals ready' : 'Waiting for RCA', icon: incident.actions?.length > 0 ? 'bullseye' : 'clock', color: incident.actions?.length > 0 ? 'success' : 'warning' },
    ];

    const evidence = incident.evidence || [];
    const auditLog = incident.action_history || [];
    const metrics = incident.metrics || { error_rate: 0, p99_latency_ms: 0 };

    const incidentSteps = [
        { title: 'Open', status: incident.status === 'open' ? 'current' : 'complete' },
        { title: incident.status === 'investigating' ? 'Investigating' : 'Analysis', status: incident.status === 'investigating' ? 'current' : (incident.analyst_report ? 'complete' : 'incomplete') },
        { title: 'Remediation', status: incident.actions?.length > 0 ? 'current' : 'incomplete' },
        { title: 'Resolved', status: incident.status === 'resolved' ? 'current' : 'incomplete' },
    ];


    return (
        <>
            {/* Sub-header with title */}
            <div style={{ background: '#25262E', padding: '12px 16px', borderBottom: '1px solid #343741' }}>
                <EuiTitle size="s">
                    <h1>DataPulse: Incident Response Center</h1>
                </EuiTitle>
            </div>

            {/* Incident Identity & Lifecycle */}
            <div style={{ background: '#1D1E24', padding: '12px 16px', borderBottom: '1px solid #343741' }}>
                <EuiFlexGroup alignItems="center" justifyContent="spaceBetween">
                    <EuiFlexItem grow={false}>
                        <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
                            <EuiFlexItem grow={false}>
                                <EuiText size="s">
                                    <strong>{incident.incident_id}</strong>
                                </EuiText>
                            </EuiFlexItem>
                            <EuiFlexItem grow={false}>
                                <EuiText size="s" color="subdued">·</EuiText>
                            </EuiFlexItem>
                            <EuiFlexItem grow={false}>
                                <EuiBadge color="danger">{incident.severity}</EuiBadge>
                            </EuiFlexItem>
                            <EuiFlexItem grow={false}>
                                <EuiText size="s" color="subdued">·</EuiText>
                            </EuiFlexItem>
                            <EuiFlexItem grow={false}>
                                <EuiBadge color="warning">{incident.status?.toUpperCase()}</EuiBadge>
                            </EuiFlexItem>
                        </EuiFlexGroup>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                        <EuiText size="xs" color="subdued">
                            Detected: {incident.detected_at} · Created: {incident.created_at}
                        </EuiText>
                    </EuiFlexItem>
                </EuiFlexGroup>
                <EuiSpacer size="xs" />
                <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
                    <EuiFlexItem grow={false}>
                        <EuiText size="xs">
                            Service: <EuiBadge color="hollow">{incident.service}</EuiBadge>
                        </EuiText>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                        <EuiText size="xs" color="subdued">·</EuiText>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                        <EuiLink href="#">{incident.jira_ticket || 'No Ticket'}</EuiLink>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                        <EuiText size="xs" color="subdued">·</EuiText>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                        <EuiText size="xs">Correlation ID: {incident.correlation_id || 'N/A'}</EuiText>
                    </EuiFlexItem>
                </EuiFlexGroup>
            </div>

            {/* Context Controls & Filters */}
            <div style={{ background: '#1D1E24', padding: '12px 16px', borderBottom: '1px solid #343741' }}>
                <EuiFlexGroup alignItems="center" gutterSize="m">
                    <EuiFlexItem grow={false}>
                        <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
                            <EuiFlexItem grow={false}>
                                <EuiBadge color="hollow">env: {incident.environment}</EuiBadge>
                            </EuiFlexItem>
                            <EuiFlexItem grow={false}>
                                <EuiBadge color="hollow">region: {incident.region}</EuiBadge>
                            </EuiFlexItem>
                            <EuiFlexItem grow={false}>
                                <EuiBadge color="hollow">slo: {incident.slo}</EuiBadge>
                            </EuiFlexItem>
                        </EuiFlexGroup>
                    </EuiFlexItem>
                    <EuiFlexItem grow={true} style={{ maxWidth: 400 }}>
                        <EuiFieldSearch
                            placeholder="Search KQL"
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                        />
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
                    {/* Lifecycle Progress */}
                    <EuiPanel hasShadow={false} style={{ background: '#1D1E24', border: '1px solid #343741', marginBottom: 16 }}>
                        <EuiStepsHorizontal steps={incidentSteps} size="s" />
                    </EuiPanel>

                    {/* Status Badges */}
                    <EuiFlexGroup gutterSize="s">
                        <EuiFlexItem grow={false}>
                            <EuiBadge color="danger">CRITICAL</EuiBadge>
                        </EuiFlexItem>
                        <EuiFlexItem grow={false}>
                            <EuiBadge color="hollow">{incident.service}</EuiBadge>
                        </EuiFlexItem>
                    </EuiFlexGroup>

                    <EuiSpacer size="m" />

                    {/* Main Grid */}
                    <EuiFlexGroup gutterSize="m">
                        {/* Left Column */}
                        <EuiFlexItem grow={2}>
                            {/* Detection Summary */}
                            <EuiPanel hasShadow={false} style={{ background: '#1D1E24', border: '1px solid #343741' }}>
                                <EuiTitle size="xs">
                                    <h3>Current Detection Summary</h3>
                                </EuiTitle>
                                <EuiSpacer size="m" />
                                <EuiFlexGroup>
                                    <EuiFlexItem>
                                        <EuiStat
                                            title={`${(metrics.error_rate * 100).toFixed(2)}%`}
                                            description="Current Error Rate"
                                            titleColor="danger"
                                            titleSize="l"
                                        />
                                    </EuiFlexItem>
                                    <EuiFlexItem>
                                        <EuiStat
                                            title={`${metrics.p99_latency_ms.toFixed(0)}ms`}
                                            description="P99 Latency"
                                            titleSize="l"
                                        />
                                    </EuiFlexItem>
                                    <EuiFlexItem>
                                        <EuiStat
                                            title={incident.source || 'Sentinel'}
                                            description="Source"
                                            titleSize="l"
                                        />
                                    </EuiFlexItem>
                                </EuiFlexGroup>
                            </EuiPanel>

                            <EuiSpacer size="m" />

                            {/* Timeline / Causality View */}
                            <EuiPanel hasShadow={false} style={{ background: '#1D1E24', border: '1px solid #343741' }}>
                                <EuiTitle size="xs">
                                    <h3>Incident Timeline</h3>
                                </EuiTitle>
                                <EuiSpacer size="m" />
                                <EuiCommentList>
                                    {timeline.map((event, idx) => (
                                        <EuiComment
                                            key={idx}
                                            username={event.timestamp ? new Date(event.timestamp).toLocaleTimeString() : 'N/A'}
                                            event={
                                                <EuiText size="s">{event.event}</EuiText>
                                            }
                                            timestamp={event.timestamp}
                                            timelineAvatar={
                                                <EuiIcon type={event.event.includes('Detected') ? 'bullseye' : 'dot'} size="m" />
                                            }
                                        />
                                    ))}
                                </EuiCommentList>
                            </EuiPanel>

                            <EuiSpacer size="m" />

                            {/* Recent Errors with Evidence Links */}
                            <EuiPanel hasShadow={false} style={{ background: '#1D1E24', border: '1px solid #343741' }}>
                                <EuiTitle size="xs">
                                    <h3>[Detection] Raw Evidence</h3>
                                </EuiTitle>
                                <EuiSpacer size="s" />
                                <EuiBasicTable
                                    items={incident.evidence || []}
                                    columns={[
                                        { field: 'type', name: 'Type', width: '80px' },
                                        { field: 'snippet', name: 'Evidence Snippet' },
                                        {
                                            name: 'Inspect',
                                            width: '60px',
                                            render: (item) => (
                                                <EuiButtonIcon iconType="inspect" aria-label="View" />
                                            )
                                        }
                                    ]}
                                />
                            </EuiPanel>
                        </EuiFlexItem>

                        {/* Right Column */}
                        <EuiFlexItem grow={1}>
                            {/* Agent State Transparency */}
                            <EuiPanel hasShadow={false} style={{ background: '#25262E', border: '1px solid #343741' }}>
                                <EuiTitle size="xs">
                                    <h3>Agent Status</h3>
                                </EuiTitle>
                                <EuiSpacer size="m" />
                                {agentStates.map((agent, idx) => (
                                    <div key={idx}>
                                        <EuiFlexGroup gutterSize="s" alignItems="center">
                                            <EuiFlexItem grow={false}>
                                                <EuiIcon
                                                    type={agent.icon}
                                                    color={agent.color}
                                                />
                                            </EuiFlexItem>
                                            <EuiFlexItem>
                                                <EuiText size="s">
                                                    <strong>{agent.name}</strong>
                                                </EuiText>
                                            </EuiFlexItem>
                                            <EuiFlexItem grow={false}>
                                                <EuiText size="xs" color="subdued">
                                                    {agent.message}
                                                </EuiText>
                                            </EuiFlexItem>
                                        </EuiFlexGroup>
                                        {idx < agentStates.length - 1 && <EuiSpacer size="s" />}
                                    </div>
                                ))}
                            </EuiPanel>

                            <EuiSpacer size="m" />

                            {/* Root Cause Analysis with Evidence */}
                            <EuiPanel hasShadow={false} style={{ background: '#25262E', border: '1px solid #343741' }}>
                                <EuiTitle size="xs">
                                    <h3>Root Cause Analysis</h3>
                                </EuiTitle>
                                <EuiSpacer size="m" />
                                {incident.analyst_report ? (
                                    <>
                                        <EuiText size="s">
                                            <strong>Cause ({(incident.analyst_report.confidence * 100).toFixed(0)}% confidence):</strong>
                                        </EuiText>
                                        <EuiSpacer size="s" />
                                        <EuiText size="s">
                                            {incident.analyst_report.root_cause}
                                        </EuiText>
                                        <EuiSpacer size="m" />
                                        <EuiText size="xs">
                                            <strong>Tool Evidence:</strong>
                                        </EuiText>
                                        <EuiSpacer size="xs" />
                                        {incident.analyst_report.evidence?.slice(0, 3).map((item, idx) => (
                                            <div key={idx} style={{ marginBottom: 4 }}>
                                                <EuiText size="xs">
                                                    • {item.tool_id}: {item.snippet?.substring(0, 50)}...
                                                </EuiText>
                                            </div>
                                        ))}
                                    </>
                                ) : (
                                    <EuiText size="s" color="subdued">Analyst agent is conducting investigation...</EuiText>
                                )}
                            </EuiPanel>

                            <EuiSpacer size="m" />

                            {/* Remediation with Safety Context */}
                            <EuiPanel hasShadow={false} style={{ background: '#25262E', border: '1px solid #343741' }}>
                                <EuiTitle size="xs">
                                    <h3>Proposed Remediation</h3>
                                </EuiTitle>
                                <EuiSpacer size="m" />
                                {incident.actions?.length > 0 ? (
                                    incident.actions.map((action, idx) => (
                                        <div key={idx} style={{ marginBottom: 16, padding: 8, background: '#1d1e24', borderRadius: 4 }}>
                                            <EuiFlexGroup alignItems="center">
                                                <EuiFlexItem>
                                                    <EuiText size="s">
                                                        <strong>{idx + 1}. {action.title}</strong>
                                                    </EuiText>
                                                    <EuiText size="xs" color="subdued">{action.description}</EuiText>
                                                </EuiFlexItem>
                                                <EuiFlexItem grow={false}>
                                                    <EuiBadge color={action.state === 'approved' ? 'success' : 'hollow'}>{action.state}</EuiBadge>
                                                </EuiFlexItem>
                                            </EuiFlexGroup>
                                            {action.state === 'proposed' && (
                                                <>
                                                    <EuiSpacer size="s" />
                                                    <EuiFlexGroup gutterSize="s">
                                                        <EuiFlexItem>
                                                            <EuiButton fill color="primary" size="s" onClick={() => handleAction(action.action_id, 'approve')}>
                                                                Approve
                                                            </EuiButton>
                                                        </EuiFlexItem>
                                                        <EuiFlexItem>
                                                            <EuiButton color="danger" size="s" onClick={() => handleAction(action.action_id, 'reject')}>
                                                                Reject
                                                            </EuiButton>
                                                        </EuiFlexItem>
                                                    </EuiFlexGroup>
                                                </>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <EuiText size="s" color="subdued">Waiting for remediation proposals...</EuiText>
                                )}
                            </EuiPanel>

                            <EuiSpacer size="m" />

                            {/* Audit Trail */}
                            <EuiPanel hasShadow={false} style={{ background: '#1D1E24', border: '1px solid #343741' }}>
                                <EuiAccordion
                                    id="audit-trail"
                                    buttonContent={
                                        <EuiTitle size="xs">
                                            <h3>Audit Log</h3>
                                        </EuiTitle>
                                    }
                                    paddingSize="none"
                                >
                                    <EuiSpacer size="m" />
                                    {auditLog.map((entry, idx) => (
                                        <div key={idx}>
                                            <EuiFlexGroup gutterSize="s" responsive={false}>
                                                <EuiFlexItem grow={false} style={{ minWidth: 80 }}>
                                                    <EuiText size="xs" color="subdued">{new Date(entry.timestamp).toLocaleTimeString()}</EuiText>
                                                </EuiFlexItem>
                                                <EuiFlexItem>
                                                    <EuiText size="xs">
                                                        <strong>{entry.actor}</strong> {entry.from_state ? `transitioned ${entry.action_id} to ${entry.to_state}` : entry.reason}
                                                    </EuiText>
                                                </EuiFlexItem>
                                            </EuiFlexGroup>
                                            {idx < auditLog.length - 1 && <EuiSpacer size="xs" />}
                                        </div>
                                    ))}
                                </EuiAccordion>
                            </EuiPanel>
                        </EuiFlexItem>
                    </EuiFlexGroup>

                    <EuiSpacer size="l" />
                    <EuiText size="xs" textAlign="right" color="subdued">
                        System Connected: {new Date().toLocaleString()}
                    </EuiText>
                </EuiPageBody>
            </EuiPage>
            <EuiGlobalToastList
                toasts={toasts}
                dismissToast={removeToast}
                toastLifeTimeMs={6000}
            />
        </>
    );
};
