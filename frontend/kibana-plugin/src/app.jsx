import React, { useState } from 'react';
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
} from '@elastic/eui';

export const DataPulseApp = () => {
    const [searchValue, setSearchValue] = useState('');
    const [isAuditOpen, setIsAuditOpen] = useState(false);

    const incident = {
        id: 'INC-2026-0132',
        severity: 'P1',
        status: 'Investigating',
        service: 'payment-service',
        detected_at: '14:18 IST',
        updated_at: '14:27 IST',
        owner: 'payments-team',
        oncall: '@payments-oncall',
        slack_channel: '#payments-oncall',
        environment: 'prod',
        region: 'ap-south-1',
        slo: '99.9%'
    };

    const timeline = [
        { time: '14:02', event: 'Deployment v2.4.1', type: 'deployment', icon: 'package' },
        { time: '14:05', event: 'Error rate spike detected', type: 'alert', icon: 'alert' },
        { time: '14:08', event: 'DB connection timeouts', type: 'error', icon: 'error' },
        { time: '14:10', event: 'Sentinel detected anomaly', type: 'agent', icon: 'bullseye' },
        { time: '14:12', event: 'Slack notification sent', type: 'notification', icon: 'bell' },
        { time: '14:18', event: 'RCA completed (92% confidence)', type: 'analysis', icon: 'check' },
    ];

    const agentStates = [
        { name: 'Sentinel', status: 'complete', message: 'Detected', icon: 'check', color: 'success' },
        { name: 'Analyst', status: 'complete', message: 'RCA completed (92%)', icon: 'check', color: 'success' },
        { name: 'Resolver', status: 'pending', message: 'Awaiting approval', icon: 'clock', color: 'warning' },
    ];

    const evidence = [
        { type: 'logs', count: '847', description: 'DatabaseConnectionTimeout logs', link: true },
        { type: 'metrics', count: '5x', description: 'p99 latency increase after deploy', link: true },
        { type: 'deployment', count: 'v2.4.1', description: 'changed pool size from 50→25', link: true },
    ];

    const auditLog = [
        { time: '14:10', user: 'Sentinel Agent', action: 'Created incident INC-2026-0132' },
        { time: '14:12', user: 'Sentinel Agent', action: 'Notified Slack channel #payments-oncall' },
        { time: '14:15', user: 'Analyst Agent', action: 'Started root cause analysis' },
        { time: '14:18', user: 'Analyst Agent', action: 'Completed RCA with 92% confidence' },
        { time: '14:20', user: 'Resolver Agent', action: 'Proposed remediation: rollback to v2.4.0' },
        { time: '14:27', user: 'System', action: 'Status updated to: Investigating' },
    ];

    const logsData = [
        { service: 'payment-service', error: 'ConnectionTimeout', count: '847', severity: 'error' },
        { service: 'auth-service', error: 'HighLatency', count: '124', severity: 'warning' },
        { service: 'order-service', error: 'QueueBacklog', count: '56', severity: 'warning' },
    ];

    const incidentSteps = [
        { title: 'Open', status: 'complete', onClick: () => { } },
        { title: 'Investigating', status: 'current', onClick: () => { } },
        { title: 'Mitigated', status: 'incomplete', onClick: () => { } },
        { title: 'Resolved', status: 'incomplete', onClick: () => { } },
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
                                    <strong>{incident.id}</strong>
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
                                <EuiBadge color="warning">{incident.status}</EuiBadge>
                            </EuiFlexItem>
                        </EuiFlexGroup>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                        <EuiText size="xs" color="subdued">
                            Detected: {incident.detected_at} · Updated: {incident.updated_at}
                        </EuiText>
                    </EuiFlexItem>
                </EuiFlexGroup>
                <EuiSpacer size="xs" />
                <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
                    <EuiFlexItem grow={false}>
                        <EuiText size="xs">
                            Owner: <EuiBadge color="hollow">{incident.owner}</EuiBadge>
                        </EuiText>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                        <EuiText size="xs" color="subdued">·</EuiText>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                        <EuiLink href="#">{incident.slack_channel}</EuiLink>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                        <EuiText size="xs" color="subdued">·</EuiText>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                        <EuiText size="xs">On-call: {incident.oncall}</EuiText>
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
                                            title="12.03%"
                                            description="Current Error Rate"
                                            titleColor="danger"
                                            titleSize="l"
                                        />
                                    </EuiFlexItem>
                                    <EuiFlexItem>
                                        <EuiStat
                                            title="2359ms"
                                            description="P99 Latency"
                                            titleSize="l"
                                        />
                                    </EuiFlexItem>
                                    <EuiFlexItem>
                                        <EuiStat
                                            title="8 Services"
                                            description="Affected"
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
                                            username={event.time}
                                            event={
                                                <EuiLink href="#">{event.event}</EuiLink>
                                            }
                                            timestamp={event.time}
                                            timelineAvatar={
                                                <EuiIcon type={event.icon} size="m" />
                                            }
                                        />
                                    ))}
                                </EuiCommentList>
                            </EuiPanel>

                            <EuiSpacer size="m" />

                            {/* Recent Errors with Evidence Links */}
                            <EuiPanel hasShadow={false} style={{ background: '#1D1E24', border: '1px solid #343741' }}>
                                <EuiTitle size="xs">
                                    <h3>[Logs] Top Errors</h3>
                                </EuiTitle>
                                <EuiSpacer size="s" />
                                <EuiBasicTable
                                    items={logsData}
                                    columns={[
                                        {
                                            field: 'service',
                                            name: 'Service',
                                            render: (service) => <EuiLink href="#">{service}</EuiLink>
                                        },
                                        { field: 'error', name: 'Error Type' },
                                        { field: 'count', name: 'Count', width: '80px' },
                                        {
                                            field: 'severity',
                                            name: 'Severity',
                                            render: (severity) => (
                                                <EuiHealth color={severity === 'error' ? 'danger' : 'warning'}>
                                                    {severity}
                                                </EuiHealth>
                                            )
                                        },
                                        {
                                            name: 'Actions',
                                            width: '100px',
                                            render: () => (
                                                <EuiFlexGroup gutterSize="s" responsive={false}>
                                                    <EuiFlexItem grow={false}>
                                                        <EuiButtonIcon iconType="inspect" aria-label="View logs" size="s" />
                                                    </EuiFlexItem>
                                                    <EuiFlexItem grow={false}>
                                                        <EuiButtonIcon iconType="visLine" aria-label="View metrics" size="s" />
                                                    </EuiFlexItem>
                                                </EuiFlexGroup>
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
                                <EuiText size="s">
                                    <strong>Most likely cause (92% confidence):</strong>
                                </EuiText>
                                <EuiSpacer size="s" />
                                <EuiText size="s">
                                    Deployment v2.4.1 caused database connection pool exhaustion
                                </EuiText>
                                <EuiSpacer size="m" />
                                <EuiText size="xs">
                                    <strong>Evidence:</strong>
                                </EuiText>
                                <EuiSpacer size="xs" />
                                {evidence.map((item, idx) => (
                                    <div key={idx} style={{ marginBottom: 4 }}>
                                        <EuiText size="xs">
                                            • <EuiLink href="#">{item.count} {item.description}</EuiLink>
                                        </EuiText>
                                    </div>
                                ))}
                            </EuiPanel>

                            <EuiSpacer size="m" />

                            {/* Remediation with Safety Context */}
                            <EuiPanel hasShadow={false} style={{ background: '#25262E', border: '1px solid #343741' }}>
                                <EuiTitle size="xs">
                                    <h3>Proposed Remediation</h3>
                                </EuiTitle>
                                <EuiSpacer size="m" />
                                <EuiText size="s">
                                    <strong>1. [IMMEDIATE] Rollback to v2.4.0</strong>
                                </EuiText>
                                <EuiText size="s" color="subdued">2. Restore connection pool size to 50</EuiText>
                                <EuiText size="s" color="subdued">3. Monitor for 15 minutes</EuiText>

                                <EuiSpacer size="m" />

                                {/* Impact & Safety Warning */}
                                <EuiCallOut
                                    title="Impact Assessment"
                                    color="warning"
                                    iconType="alert"
                                    size="s"
                                >
                                    <EuiText size="xs">
                                        <p><strong>Affects:</strong> 8 services</p>
                                        <p><strong>Est. recovery:</strong> ~5 minutes</p>
                                        <p><strong>Risk:</strong> Low (known-good version)</p>
                                        <p><strong>Requires:</strong> Platform team approval</p>
                                    </EuiText>
                                    <EuiSpacer size="s" />
                                    <EuiLink href="#" external>
                                        <EuiText size="xs">Preview affected services</EuiText>
                                    </EuiLink>
                                </EuiCallOut>

                                <EuiSpacer size="m" />

                                <EuiFlexGroup gutterSize="s">
                                    <EuiFlexItem>
                                        <EuiButton fill color="primary" size="s" iconType="check">
                                            Approve Rollback
                                        </EuiButton>
                                    </EuiFlexItem>
                                    <EuiFlexItem grow={false}>
                                        <EuiButton size="s" iconType="cross">
                                            Reject
                                        </EuiButton>
                                    </EuiFlexItem>
                                </EuiFlexGroup>
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
                                                <EuiFlexItem grow={false} style={{ minWidth: 50 }}>
                                                    <EuiText size="xs" color="subdued">{entry.time}</EuiText>
                                                </EuiFlexItem>
                                                <EuiFlexItem>
                                                    <EuiText size="xs">
                                                        <strong>{entry.user}</strong> – {entry.action}
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
                        Last updated: Saturday, 31 January 2026 - 5:01 PM IST
                    </EuiText>
                </EuiPageBody>
            </EuiPage>
        </>
    );
};
