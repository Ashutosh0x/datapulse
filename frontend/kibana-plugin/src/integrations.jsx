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
    EuiBadge,
    EuiButton,
    EuiButtonIcon,
    EuiSpacer,
    EuiText,
    EuiTitle,
    EuiIcon,
    EuiFlyout,
    EuiFlyoutHeader,
    EuiFlyoutBody,
    EuiFlyoutFooter,
    EuiHealth,
    EuiSwitch,
    EuiFormRow,
    EuiFieldText,
    EuiSelect,
    EuiCallOut,
    EuiCode,
    EuiLink,
    EuiDescriptionList,
    EuiHorizontalRule,
} from '@elastic/eui';

export const IntegrationsApp = () => {
    const [slackFlyoutOpen, setSlackFlyoutOpen] = useState(false);
    const [jiraFlyoutOpen, setJiraFlyoutOpen] = useState(false);

    const integrations = [
        {
            id: 'slack',
            name: 'Slack',
            icon: 'logoSlack',
            status: 'connected',
            workspace: 'Elastic-DevOps',
            description: 'Real-time incident notifications and approval workflows',
            connectedBy: 'admin@elastic.co',
            connectedAt: '2 days ago',
        },
        {
            id: 'jira',
            name: 'Jira',
            icon: 'editorChecklist',
            status: 'connected',
            workspace: 'Elastic Cloud Jira',
            description: 'Automatic ticket creation and lifecycle sync',
            connectedBy: 'admin@elastic.co',
            connectedAt: '2 days ago',
        },
        {
            id: 'pagerduty',
            name: 'PagerDuty',
            icon: 'bell',
            status: 'available',
            description: 'On-call escalation and incident routing',
        },
        {
            id: 'servicenow',
            name: 'ServiceNow',
            icon: 'package',
            status: 'available',
            description: 'Enterprise ITSM integration',
        },
    ];

    const SlackFlyout = () => (
        <EuiFlyout onClose={() => setSlackFlyoutOpen(false)} size="m">
            <EuiFlyoutHeader hasBorder>
                <EuiFlexGroup alignItems="center" gutterSize="m">
                    <EuiFlexItem grow={false}>
                        <EuiIcon type="logoSlack" size="l" />
                    </EuiFlexItem>
                    <EuiFlexItem>
                        <EuiTitle size="m">
                            <h2>Slack Integration · DataPulse</h2>
                        </EuiTitle>
                    </EuiFlexItem>
                </EuiFlexGroup>
            </EuiFlyoutHeader>

            <EuiFlyoutBody>
                <EuiTitle size="xs">
                    <h3>Connection Status</h3>
                </EuiTitle>
                <EuiSpacer size="m" />
                <EuiDescriptionList
                    listItems={[
                        { title: 'Workspace', description: 'Elastic-DevOps' },
                        { title: 'Status', description: <EuiHealth color="success">Connected</EuiHealth> },
                        { title: 'Installed by', description: 'admin@elastic.co' },
                        {
                            title: 'Scopes',
                            description: (
                                <EuiFlexGroup gutterSize="xs" wrap>
                                    <EuiFlexItem grow={false}><EuiBadge>chat:write</EuiBadge></EuiFlexItem>
                                    <EuiFlexItem grow={false}><EuiBadge>channels:read</EuiBadge></EuiFlexItem>
                                    <EuiFlexItem grow={false}><EuiBadge>users:read</EuiBadge></EuiFlexItem>
                                </EuiFlexGroup>
                            )
                        },
                    ]}
                />

                <EuiSpacer size="l" />
                <EuiHorizontalRule />
                <EuiSpacer size="l" />

                <EuiTitle size="xs">
                    <h3>Notification Rules</h3>
                </EuiTitle>
                <EuiSpacer size="m" />

                <EuiText size="s">
                    <strong>When:</strong>
                </EuiText>
                <EuiSpacer size="s" />

                <EuiPanel color="subdued" paddingSize="s">
                    <EuiText size="s">
                        • Incident severity ≥ P1<br />
                        • OR Agent confidence ≥ 90%<br />
                        • OR Manual escalation
                    </EuiText>
                </EuiPanel>

                <EuiSpacer size="m" />

                <EuiText size="s">
                    <strong>Then notify:</strong>
                </EuiText>
                <EuiSpacer size="s" />

                <EuiFormRow label="Channel">
                    <EuiFieldText value="#data-pulse-incidents" readOnly />
                </EuiFormRow>

                <EuiFormRow label="Mention">
                    <EuiFieldText value="@oncall-team" readOnly />
                </EuiFormRow>

                <EuiSpacer size="l" />
                <EuiHorizontalRule />
                <EuiSpacer size="l" />

                <EuiTitle size="xs">
                    <h3>Approval Routing</h3>
                </EuiTitle>
                <EuiSpacer size="m" />

                <EuiText size="s">
                    <strong>Actions requiring approval:</strong>
                </EuiText>
                <EuiSpacer size="s" />

                <EuiFormRow>
                    <div>
                        <EuiSwitch label="Rollback" checked={true} onChange={() => { }} />
                        <EuiSpacer size="s" />
                        <EuiSwitch label="Config changes" checked={true} onChange={() => { }} />
                        <EuiSpacer size="s" />
                        <EuiSwitch label="Scale up/down" checked={false} onChange={() => { }} />
                    </div>
                </EuiFormRow>

                <EuiSpacer size="m" />

                <EuiFormRow label="Approval channel">
                    <EuiFieldText value="#platform-approvals" readOnly />
                </EuiFormRow>

                <EuiSpacer size="l" />
                <EuiHorizontalRule />
                <EuiSpacer size="l" />

                <EuiTitle size="xs">
                    <h3>Preview Message</h3>
                </EuiTitle>
                <EuiSpacer size="m" />

                <EuiCallOut
                    title="Example incident notification"
                    color="primary"
                    iconType="article"
                >
                    <EuiPanel color="subdued" paddingSize="m">
                        <EuiText>
                            <h4>[ALERT] P1 Incident Detected</h4>
                        </EuiText>
                        <EuiSpacer size="s" />
                        <EuiFlexGroup>
                            <EuiFlexItem>
                                <EuiText size="s"><strong>Service:</strong> payment-service</EuiText>
                            </EuiFlexItem>
                            <EuiFlexItem>
                                <EuiText size="s"><strong>Error Rate:</strong> 12.03%</EuiText>
                            </EuiFlexItem>
                        </EuiFlexGroup>
                        <EuiFlexGroup>
                            <EuiFlexItem>
                                <EuiText size="s"><strong>P99 Latency:</strong> 2359ms</EuiText>
                            </EuiFlexItem>
                            <EuiFlexItem>
                                <EuiText size="s"><strong>Confidence:</strong> 92%</EuiText>
                            </EuiFlexItem>
                        </EuiFlexGroup>
                        <EuiSpacer size="m" />
                        <EuiFlexGroup gutterSize="s">
                            <EuiFlexItem grow={false}>
                                <EuiButton fill size="s">View Incident</EuiButton>
                            </EuiFlexItem>
                            <EuiFlexItem grow={false}>
                                <EuiButton size="s">Acknowledge</EuiButton>
                            </EuiFlexItem>
                        </EuiFlexGroup>
                    </EuiPanel>
                </EuiCallOut>

                <EuiSpacer size="m" />

                <EuiText size="xs">
                    <EuiLink href="#" external>View full Block Kit JSON</EuiLink>
                </EuiText>
            </EuiFlyoutBody>

            <EuiFlyoutFooter>
                <EuiFlexGroup justifyContent="spaceBetween">
                    <EuiFlexItem grow={false}>
                        <EuiButton onClick={() => setSlackFlyoutOpen(false)}>
                            Close
                        </EuiButton>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                        <EuiFlexGroup gutterSize="s">
                            <EuiFlexItem grow={false}>
                                <EuiButton color="danger" iconType="trash">
                                    Disconnect
                                </EuiButton>
                            </EuiFlexItem>
                            <EuiFlexItem grow={false}>
                                <EuiButton fill iconType="save">
                                    Save Changes
                                </EuiButton>
                            </EuiFlexItem>
                        </EuiFlexGroup>
                    </EuiFlexItem>
                </EuiFlexGroup>
            </EuiFlyoutFooter>
        </EuiFlyout>
    );

    const JiraFlyout = () => (
        <EuiFlyout onClose={() => setJiraFlyoutOpen(false)} size="m">
            <EuiFlyoutHeader hasBorder>
                <EuiFlexGroup alignItems="center" gutterSize="m">
                    <EuiFlexItem grow={false}>
                        <EuiIcon type="editorChecklist" size="l" />
                    </EuiFlexItem>
                    <EuiFlexItem>
                        <EuiTitle size="m">
                            <h2>Jira Integration · DataPulse</h2>
                        </EuiTitle>
                    </EuiFlexItem>
                </EuiFlexGroup>
            </EuiFlyoutHeader>

            <EuiFlyoutBody>
                <EuiTitle size="xs">
                    <h3>Connection Status</h3>
                </EuiTitle>
                <EuiSpacer size="m" />
                <EuiDescriptionList
                    listItems={[
                        { title: 'Instance', description: 'elastic.atlassian.net' },
                        { title: 'Status', description: <EuiHealth color="success">Connected</EuiHealth> },
                        { title: 'Installed by', description: 'admin@elastic.co' },
                        { title: 'API version', description: 'Cloud REST API v3' },
                    ]}
                />

                <EuiSpacer size="l" />
                <EuiHorizontalRule />
                <EuiSpacer size="l" />

                <EuiTitle size="xs">
                    <h3>Project & Issue Mapping</h3>
                </EuiTitle>
                <EuiSpacer size="m" />

                <EuiFormRow label="Project">
                    <EuiSelect
                        options={[
                            { value: 'OPS', text: 'OPS - Operations' },
                            { value: 'INC', text: 'INC - Incidents' },
                        ]}
                        value="OPS"
                    />
                </EuiFormRow>

                <EuiFormRow label="Issue type mapping">
                    <div>
                        <EuiText size="s">
                            <p><EuiBadge color="danger">P1</EuiBadge> → Incident</p>
                            <p><EuiBadge color="warning">P2/P3</EuiBadge> → Story</p>
                        </EuiText>
                    </div>
                </EuiFormRow>

                <EuiSpacer size="l" />
                <EuiHorizontalRule />
                <EuiSpacer size="l" />

                <EuiTitle size="xs">
                    <h3>Field Mapping</h3>
                </EuiTitle>
                <EuiSpacer size="m" />

                <EuiText size="s">
                    <strong>Automatic field mapping:</strong>
                </EuiText>
                <EuiSpacer size="s" />

                <EuiPanel color="subdued" paddingSize="s">
                    <EuiText size="s">
                        <p><EuiCode>Summary</EuiCode> ← Incident title</p>
                        <p><EuiCode>Description</EuiCode> ← Agent RCA + Evidence</p>
                        <p><EuiCode>Labels</EuiCode> ← service.name, env</p>
                        <p><EuiCode>Priority</EuiCode> ← Incident severity</p>
                        <p><EuiCode>Reporter</EuiCode> ← DataPulse Agent</p>
                        <p><EuiCode>Assignee</EuiCode> ← Team owner</p>
                    </EuiText>
                </EuiPanel>

                <EuiSpacer size="l" />
                <EuiHorizontalRule />
                <EuiSpacer size="l" />

                <EuiTitle size="xs">
                    <h3>Lifecycle Sync</h3>
                </EuiTitle>
                <EuiSpacer size="m" />

                <EuiText size="s">
                    <strong>Auto-sync options:</strong>
                </EuiText>
                <EuiSpacer size="s" />

                <EuiFormRow>
                    <div>
                        <EuiSwitch
                            label="Update Jira when incident resolves"
                            checked={true}
                            onChange={() => { }}
                        />
                        <EuiSpacer size="s" />
                        <EuiSwitch
                            label="Add comments on agent updates"
                            checked={true}
                            onChange={() => { }}
                        />
                        <EuiSpacer size="s" />
                        <EuiSwitch
                            label="Link deployments automatically"
                            checked={true}
                            onChange={() => { }}
                        />
                        <EuiSpacer size="s" />
                        <EuiSwitch
                            label="Create subtasks for remediation steps"
                            checked={false}
                            onChange={() => { }}
                        />
                    </div>
                </EuiFormRow>

                <EuiSpacer size="l" />
                <EuiHorizontalRule />
                <EuiSpacer size="l" />

                <EuiTitle size="xs">
                    <h3>Example Ticket Preview</h3>
                </EuiTitle>
                <EuiSpacer size="m" />

                <EuiCallOut
                    title="How incidents appear in Jira"
                    color="primary"
                    iconType="article"
                >
                    <EuiPanel color="subdued" paddingSize="m">
                        <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
                            <EuiFlexItem>
                                <EuiText>
                                    <h4>OPS-1234: P1 Incident - payment-service error rate spike</h4>
                                </EuiText>
                            </EuiFlexItem>
                            <EuiFlexItem grow={false}>
                                <EuiBadge color="danger">Highest</EuiBadge>
                            </EuiFlexItem>
                        </EuiFlexGroup>

                        <EuiSpacer size="s" />

                        <EuiFlexGroup gutterSize="s">
                            <EuiFlexItem grow={false}>
                                <EuiBadge>payment-service</EuiBadge>
                            </EuiFlexItem>
                            <EuiFlexItem grow={false}>
                                <EuiBadge>prod</EuiBadge>
                            </EuiFlexItem>
                            <EuiFlexItem grow={false}>
                                <EuiBadge>auto-incident</EuiBadge>
                            </EuiFlexItem>
                        </EuiFlexGroup>

                        <EuiSpacer size="m" />

                        <EuiText size="s">
                            <strong>Root Cause Analysis (92% confidence)</strong>
                            <p>Deployment v2.4.1 caused database connection pool exhaustion</p>

                            <strong>Evidence:</strong>
                            <ul>
                                <li>847 DatabaseConnectionTimeout logs</li>
                                <li>5x p99 latency increase after deploy</li>
                                <li>Deployment v2.4.1 changed pool size from 50→25</li>
                            </ul>
                        </EuiText>
                    </EuiPanel>
                </EuiCallOut>

                <EuiSpacer size="m" />

                <EuiButton iconType="beaker" size="s">
                    Create Test Ticket
                </EuiButton>
            </EuiFlyoutBody>

            <EuiFlyoutFooter>
                <EuiFlexGroup justifyContent="spaceBetween">
                    <EuiFlexItem grow={false}>
                        <EuiButton onClick={() => setJiraFlyoutOpen(false)}>
                            Close
                        </EuiButton>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                        <EuiFlexGroup gutterSize="s">
                            <EuiFlexItem grow={false}>
                                <EuiButton color="danger" iconType="trash">
                                    Disconnect
                                </EuiButton>
                            </EuiFlexItem>
                            <EuiFlexItem grow={false}>
                                <EuiButton fill iconType="save">
                                    Save Changes
                                </EuiButton>
                            </EuiFlexItem>
                        </EuiFlexGroup>
                    </EuiFlexItem>
                </EuiFlexGroup>
            </EuiFlyoutFooter>
        </EuiFlyout>
    );

    return (
        <>
            <div style={{ background: '#25262E', padding: '12px 16px', borderBottom: '1px solid #343741' }}>
                <EuiTitle size="s">
                    <h1>Integrations</h1>
                </EuiTitle>
                <EuiSpacer size="xs" />
                <EuiText size="s" color="subdued">
                    Configure how DataPulse communicates with external systems
                </EuiText>
            </div>

            <EuiPage paddingSize="m" style={{ background: '#141519' }}>
                <EuiPageBody>
                    <EuiFlexGroup gutterSize="l" wrap>
                        {integrations.map((integration) => (
                            <EuiFlexItem key={integration.id} style={{ minWidth: '300px', maxWidth: '450px' }}>
                                <EuiPanel hasShadow={false} style={{ background: '#1D1E24', border: '1px solid #343741' }}>
                                    <EuiFlexGroup gutterSize="m" alignItems="center">
                                        <EuiFlexItem grow={false}>
                                            <EuiIcon type={integration.icon} size="xl" />
                                        </EuiFlexItem>
                                        <EuiFlexItem>
                                            <EuiTitle size="xs">
                                                <h3>{integration.name}</h3>
                                            </EuiTitle>
                                            <EuiSpacer size="xs" />
                                            <EuiText size="s" color="subdued">
                                                {integration.description}
                                            </EuiText>
                                        </EuiFlexItem>
                                    </EuiFlexGroup>

                                    <EuiSpacer size="m" />

                                    {integration.status === 'connected' ? (
                                        <>
                                            <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
                                                <EuiFlexItem>
                                                    <EuiHealth color="success">Connected</EuiHealth>
                                                    <EuiText size="xs" color="subdued">
                                                        {integration.workspace}
                                                    </EuiText>
                                                </EuiFlexItem>
                                                <EuiFlexItem grow={false}>
                                                    <EuiButton
                                                        size="s"
                                                        onClick={() => {
                                                            if (integration.id === 'slack') setSlackFlyoutOpen(true);
                                                            if (integration.id === 'jira') setJiraFlyoutOpen(true);
                                                        }}
                                                    >
                                                        Configure
                                                    </EuiButton>
                                                </EuiFlexItem>
                                            </EuiFlexGroup>
                                            <EuiSpacer size="xs" />
                                            <EuiText size="xs" color="subdued">
                                                Connected by {integration.connectedBy} · {integration.connectedAt}
                                            </EuiText>
                                        </>
                                    ) : (
                                        <EuiButton size="s" iconType="plusInCircle" fullWidth>
                                            Connect
                                        </EuiButton>
                                    )}
                                </EuiPanel>
                            </EuiFlexItem>
                        ))}
                    </EuiFlexGroup>

                    <EuiSpacer size="xl" />

                    <EuiPanel hasShadow={false} style={{ background: '#1D1E24', border: '1px solid #343741' }}>
                        <EuiTitle size="s">
                            <h3>Integration Flow</h3>
                        </EuiTitle>
                        <EuiSpacer size="m" />
                        <EuiText size="s" color="subdued">
                            How DataPulse routes incidents through your systems
                        </EuiText>
                        <EuiSpacer size="m" />

                        <EuiFlexGroup direction="column" gutterSize="s">
                            <EuiFlexItem>
                                <EuiPanel color="subdued" paddingSize="s">
                                    <EuiFlexGroup alignItems="center" gutterSize="s">
                                        <EuiFlexItem grow={false}>
                                            <EuiIcon type="bullseye" size="m" />
                                        </EuiFlexItem>
                                        <EuiFlexItem>
                                            <EuiText size="s"><strong>1. Detection</strong></EuiText>
                                            <EuiText size="xs" color="subdued">Sentinel detects anomaly</EuiText>
                                        </EuiFlexItem>
                                    </EuiFlexGroup>
                                </EuiPanel>
                            </EuiFlexItem>

                            <EuiFlexItem>
                                <EuiIcon type="sortDown" />
                            </EuiFlexItem>

                            <EuiFlexItem>
                                <EuiPanel color="subdued" paddingSize="s">
                                    <EuiFlexGroup alignItems="center" gutterSize="s">
                                        <EuiFlexItem grow={false}>
                                            <EuiIcon type="logoSlack" size="m" />
                                        </EuiFlexItem>
                                        <EuiFlexItem>
                                            <EuiText size="s"><strong>2. Slack Alert</strong></EuiText>
                                            <EuiText size="xs" color="subdued">Notify #data-pulse-incidents</EuiText>
                                        </EuiFlexItem>
                                    </EuiFlexGroup>
                                </EuiPanel>
                            </EuiFlexItem>

                            <EuiFlexItem>
                                <EuiIcon type="sortDown" />
                            </EuiFlexItem>

                            <EuiFlexItem>
                                <EuiPanel color="subdued" paddingSize="s">
                                    <EuiFlexGroup alignItems="center" gutterSize="s">
                                        <EuiFlexItem grow={false}>
                                            <EuiIcon type="logoJira" size="m" />
                                        </EuiFlexItem>
                                        <EuiFlexItem>
                                            <EuiText size="s"><strong>3. Jira Ticket</strong></EuiText>
                                            <EuiText size="xs" color="subdued">Auto-create in OPS project</EuiText>
                                        </EuiFlexItem>
                                    </EuiFlexGroup>
                                </EuiPanel>
                            </EuiFlexItem>

                            <EuiFlexItem>
                                <EuiIcon type="sortDown" />
                            </EuiFlexItem>

                            <EuiFlexItem>
                                <EuiPanel color="subdued" paddingSize="s">
                                    <EuiFlexGroup alignItems="center" gutterSize="s">
                                        <EuiFlexItem grow={false}>
                                            <EuiIcon type="check" size="m" color="success" />
                                        </EuiFlexItem>
                                        <EuiFlexItem>
                                            <EuiText size="s"><strong>4. Approval</strong></EuiText>
                                            <EuiText size="xs" color="subdued">Slack interactive approval</EuiText>
                                        </EuiFlexItem>
                                    </EuiFlexGroup>
                                </EuiPanel>
                            </EuiFlexItem>

                            <EuiFlexItem>
                                <EuiIcon type="sortDown" />
                            </EuiFlexItem>

                            <EuiFlexItem>
                                <EuiPanel color="subdued" paddingSize="s">
                                    <EuiFlexGroup alignItems="center" gutterSize="s">
                                        <EuiFlexItem grow={false}>
                                            <EuiIcon type="checkInCircleFilled" size="m" color="success" />
                                        </EuiFlexItem>
                                        <EuiFlexItem>
                                            <EuiText size="s"><strong>5. Resolution</strong></EuiText>
                                            <EuiText size="xs" color="subdued">Update Slack + Jira + Audit log</EuiText>
                                        </EuiFlexItem>
                                    </EuiFlexGroup>
                                </EuiPanel>
                            </EuiFlexItem>
                        </EuiFlexGroup>
                    </EuiPanel>

                    <EuiSpacer size="l" />

                    <EuiText size="xs" textAlign="right" color="subdued">
                        Last updated: Saturday, 31 January 2026 - 5:18 PM IST
                    </EuiText>
                </EuiPageBody>
            </EuiPage>

            {slackFlyoutOpen && <SlackFlyout />}
            {jiraFlyoutOpen && <JiraFlyout />}
        </>
    );
};
