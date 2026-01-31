import React, { useState, useEffect } from 'react';
import {
    EuiProvider,
    EuiPage,
    EuiPageBody,
    EuiPageHeader,
    EuiTitle,
    EuiText,
    EuiSpacer,
    EuiFlexGroup,
    EuiFlexItem,
    EuiPanel,
    EuiForm,
    EuiFormRow,
    EuiFieldText,
    EuiSwitch,
    EuiButton,
    EuiTabs,
    EuiTab,
    EuiHorizontalRule,
    EuiCallOut,
    EuiCode,
    EuiGlobalToastList,
    EuiFieldPassword,
} from '@elastic/eui';

export const SettingsApp = () => {
    const [selectedTab, setSelectedTab] = useState('general');
    const [apiKey, setApiKey] = useState(() => localStorage.getItem('dp_api_key') || 'elastic_6f8g2h9k0l1m2n3o4p5q6r7s8t9u0v1w2x3y4z');
    const [workspaceName, setWorkspaceName] = useState(() => localStorage.getItem('dp_workspace_name') || 'Elastic Hackathon Lab');
    const [refreshInterval, setRefreshInterval] = useState(() => localStorage.getItem('dp_refresh_interval') || '30');
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('dp_dark_mode') === 'true');
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        localStorage.setItem('dp_api_key', apiKey);
        localStorage.setItem('dp_workspace_name', workspaceName);
        localStorage.setItem('dp_refresh_interval', refreshInterval);
        localStorage.setItem('dp_dark_mode', darkMode);
    }, [apiKey, workspaceName, refreshInterval, darkMode]);

    const addToast = (title, color = 'success') => {
        setToasts([...toasts, {
            id: Date.now().toString(),
            title,
            color,
            iconType: color === 'success' ? 'check' : 'alert',
        }]);
    };

    const saveApiKey = () => {
        // Logic to save the key would go here (e.g., API call or localStorage)
        addToast('API Key saved successfully!');
    };

    const tabs = [
        { id: 'general', name: 'General', icon: 'gear' },
        { id: 'integrations', name: 'Integrations', icon: 'tableDensityExpanded' },
        { id: 'security', name: 'Security', icon: 'lock' },
        { id: 'notifications', name: 'Notifications', icon: 'bell' },
    ];

    const renderTabContent = () => {
        switch (selectedTab) {
            case 'general':
                return (
                    <EuiForm component="form">
                        <EuiFormRow label="Workspace Name" helpText="The primary name for your DataPulse environment">
                            <EuiFieldText
                                placeholder="DataPulse Command Center"
                                value={workspaceName}
                                onChange={(e) => setWorkspaceName(e.target.value)}
                            />
                        </EuiFormRow>
                        <EuiFormRow label="Refresh Interval (Seconds)">
                            <EuiFieldText
                                type="number"
                                value={refreshInterval}
                                onChange={(e) => setRefreshInterval(e.target.value)}
                            />
                        </EuiFormRow>
                        <EuiSpacer size="m" />
                        <EuiFormRow label="Dark Mode">
                            <EuiSwitch
                                label="Enable high-contrast dark theme"
                                checked={darkMode}
                                onChange={(e) => setDarkMode(e.target.checked)}
                            />
                        </EuiFormRow>
                        <EuiSpacer size="l" />
                        <EuiButton fill onClick={() => addToast('General settings saved!')}>Save Changes</EuiButton>
                    </EuiForm>
                );
            case 'integrations':
                return (
                    <>
                        <EuiCallOut title="Active Integrations" iconType="check">
                            <p>All core adapters are currently healthy and communicating with the API Gateway.</p>
                        </EuiCallOut>
                        <EuiSpacer size="l" />
                        <EuiTitle size="xs"><h3>Slack Configuration</h3></EuiTitle>
                        <EuiFormRow label="Webhook URL">
                            <EuiFieldText placeholder="https://hooks.slack.com/services/..." />
                        </EuiFormRow>
                        <EuiSpacer size="m" />
                        <EuiTitle size="xs"><h3>Jira Configuration</h3></EuiTitle>
                        <EuiFormRow label="Base URL">
                            <EuiFieldText placeholder="https://company.atlassian.net" />
                        </EuiFormRow>
                        <EuiSpacer size="l" />
                        <EuiButton fill>Update Integrations</EuiButton>
                    </>
                );
            case 'security':
                return (
                    <>
                        <EuiTitle size="xs"><h3>Elastic API Key</h3></EuiTitle>
                        <EuiText color="subdued"><p>Used by agents to query ES|QL and manage Agent Builder. Strictly confidential.</p></EuiText>
                        <EuiSpacer size="m" />
                        <EuiFormRow label="Enter New API Key">
                            <EuiFieldPassword
                                placeholder="elastic_..."
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                fullWidth
                            />
                        </EuiFormRow>
                        <EuiSpacer size="l" />
                        <EuiButton fill iconType="save" onClick={saveApiKey}>Save API Key</EuiButton>

                        <EuiSpacer size="xl" />
                        <EuiTitle size="xs"><h3>Agent Builder Secrets</h3></EuiTitle>
                        <EuiHorizontalRule margin="s" />
                        <EuiText size="s"><p>Ensure your Kibana URL and Agent ID match the ones in your <code>.env</code> file for real-time agent execution.</p></EuiText>
                    </>
                );
            case 'notifications':
                return (
                    <EuiFlexGroup direction="column">
                        <EuiFlexItem>
                            <EuiSwitch label="Send notifications to your mail" checked={true} onChange={() => { }} />
                        </EuiFlexItem>
                        <EuiFlexItem>
                            <EuiSwitch label="Email alerts for critical incidents" checked={true} onChange={() => { }} />
                        </EuiFlexItem>
                        <EuiFlexItem>
                            <EuiSwitch label="Slack summaries for resolved issues" checked={false} onChange={() => { }} />
                        </EuiFlexItem>
                        <EuiFlexItem>
                            <EuiSwitch label="Browser notifications" checked={true} onChange={() => { }} />
                        </EuiFlexItem>
                    </EuiFlexGroup>
                );
            default:
                return null;
        }
    };

    return (
        <EuiPage paddingSize="m">
            <EuiPageBody>
                <EuiPageHeader>
                    <EuiTitle size="l">
                        <h1>Settings</h1>
                    </EuiTitle>
                </EuiPageHeader>
                <EuiSpacer size="l" />
                <EuiTabs>
                    {tabs.map((tab) => (
                        <EuiTab
                            key={tab.id}
                            onClick={() => setSelectedTab(tab.id)}
                            isSelected={tab.id === selectedTab}
                        >
                            {tab.name}
                        </EuiTab>
                    ))}
                </EuiTabs>
                <EuiSpacer size="l" />
                <EuiPanel style={{ maxWidth: '800px' }}>
                    {renderTabContent()}
                </EuiPanel>
            </EuiPageBody>
            <EuiGlobalToastList
                toasts={toasts}
                dismissToast={(t) => setToasts(toasts.filter(toast => toast.id !== t.id))}
                toastLifeTimeMs={5000}
            />
        </EuiPage>
    );
};
