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
    EuiButtonEmpty,
    EuiButtonIcon,
    EuiSpacer,
    EuiText,
    EuiTitle,
    EuiIcon,
    EuiAvatar,
    EuiCard,
    EuiDescriptionList,
    EuiHealth,
    EuiCode,
    EuiCallOut,
    EuiModal,
    EuiModalHeader,
    EuiModalHeaderTitle,
    EuiModalBody,
    EuiModalFooter,
    EuiForm,
    EuiFormRow,
    EuiFieldText,
    EuiTextArea,
    EuiSelect,
    EuiCheckboxGroup,
    EuiRange,
    EuiHorizontalRule,
    EuiStep,
    EuiSteps,
    EuiFieldSearch,
    EuiListGroup,
    EuiListGroupItem,
    EuiIconTip,
    EuiGlobalToastList,
    EuiFlyout,
    EuiFlyoutHeader,
    EuiFlyoutBody,
    EuiFlyoutFooter,
    EuiTabs,
    EuiTab,
} from '@elastic/eui';

export const AgentsApp = () => {
    const agents = [
        {
            id: 'incident-investigator',
            name: 'Incident Investigator',
            type: 'Observability',
            description: 'Specialized agent for incident root cause analysis, log correlation, and automated remediation',
            avatar_color: '#FF6B9D',
            avatar_icon: 'search',
            tools: ['ES|QL Query', 'Log Search', 'Metric Analysis', 'Trace Correlation', 'Deployment History'],
            status: 'active',
            stats: {
                conversations: 47,
                incidents_analyzed: 23,
                avg_resolution_time: '8.2 min',
                success_rate: '94%',
            },
        },
        {
            id: 'slo-advisor',
            name: 'SLO Advisor',
            type: 'Reliability',
            description: 'Monitors SLO burn rates, predicts budget exhaustion, and recommends optimization strategies',
            avatar_color: '#00BFB3',
            avatar_icon: 'visBarVerticalStacked',
            tools: ['SLO Calculator', 'Burn Rate Analysis', 'Budget Forecasting'],
            status: 'active',
            stats: {
                conversations: 12,
                slos_monitored: 8,
                avg_session: '5.1 min',
                success_rate: '98%',
            },
        },
        {
            id: 'deployment-sentinel',
            name: 'Deployment Sentinel',
            type: 'Change Management',
            description: 'Tracks deployments, correlates changes with incidents, and automates rollback decisions',
            avatar_color: '#FEC514',
            avatar_icon: 'launch',
            tools: ['Deployment API', 'Diff Analysis', 'Rollback Automation', 'Change Impact'],
            status: 'active',
            stats: {
                conversations: 31,
                deployments_tracked: 89,
                rollbacks_automated: '4',
                success_rate: '91%',
            },
        },
        {
            id: 'elastic-ai-agent',
            name: 'Elastic AI Agent',
            type: 'General Purpose',
            description: 'Default agent with access to all core platform tools for data exploration and analysis',
            avatar_color: '#BFDBFF',
            avatar_icon: 'bolt',
            tools: ['Search', 'List Indices', 'Get Mapping', 'Get Document'],
            status: 'builtin',
            stats: {
                conversations: 156,
                queries_executed: 1247,
                avg_session: '3.8 min',
                success_rate: '89%',
            },
        },
    ];

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        id: '',
        type: 'Observability',
        description: '',
        instructions: '',
        confidenceThreshold: 70,
        selectedTools: [],
        avatarIcon: 'search',
        avatarColor: '#FF6B9D',
        allowedIndices: ['logs-*', 'metrics-*'],
        canRollback: false,
    });
    const [selectedAgent, setSelectedAgent] = useState(null);
    const [activeTab, setActiveTab] = useState('config');
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [toasts, setToasts] = useState([]);

    const addToast = (title, color = 'success', iconType = 'check') => {
        setToasts([...toasts, {
            id: Date.now().toString(),
            title,
            color,
            iconType,
        }]);
    };

    const openChat = (agent) => {
        setSelectedAgent(null); // Close detail flyout if open
        setChatAgent(agent);
        setIsChatOpen(true);
        if (chatMessages.length === 0) {
            setChatMessages([{
                id: '1',
                sender: 'agent',
                text: `Hello! I am ${agent.name}. How can I help you investigate incidents today?`,
                timestamp: new Date().toLocaleTimeString(),
            }]);
        }
    };

    const handleSendMessage = () => {
        if (!chatInput.trim()) return;

        const newUserMessage = {
            id: Date.now().toString(),
            sender: 'user',
            text: chatInput,
            timestamp: new Date().toLocaleTimeString(),
        };

        setChatMessages(prev => [...prev, newUserMessage]);
        setChatInput('');
        setIsTyping(true);

        // Simulate agent response
        setTimeout(() => {
            const agentResponse = {
                id: (Date.now() + 1).toString(),
                sender: 'agent',
                text: `I've analyzed your request. Based on the logs for ${chatAgent?.name || 'the service'}, I recommend checking the recent deployment correlation.`,
                timestamp: new Date().toLocaleTimeString(),
                thought: "Querying Elasticsearch for recent errors and deployment events...",
            };
            setChatMessages(prev => [...prev, agentResponse]);
            setIsTyping(false);
        }, 1500);
    };

    const [chatAgent, setChatAgent] = useState(null);

    const availableTools = [
        { id: 'custom.detect_anomalies', label: 'Detect Anomalies', description: 'Metric anomaly detection using ES|QL' },
        { id: 'custom.correlate_deployment', label: 'Correlate Deployment', description: 'Find deployments near incident time' },
        { id: 'custom.search_error_logs', label: 'Search Error Logs', description: 'Aggregate error logs' },
        { id: 'custom.check_recent_incidents', label: 'Check Recent Incidents', description: 'Identify patterns in history' },
        { id: 'custom.analyze_metric_trends', label: 'Analyze Metric Trends', description: 'Baseline analysis' },
        { id: 'elasticsearch.query', label: 'Elasticsearch Query', description: 'Raw index search' },
    ];

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentStep(1);
    };

    const onCreateAgent = () => {
        addToast(`Agent "${formData.name || 'Custom Agent'}" created successfully!`);
        closeModal();
    };

    const nextStep = () => setCurrentStep(currentStep + 1);
    const prevStep = () => setCurrentStep(currentStep - 1);

    const onToolChange = (optionId) => {
        const newSelectedTools = formData.selectedTools.includes(optionId)
            ? formData.selectedTools.filter((id) => id !== optionId)
            : [...formData.selectedTools, optionId];
        setFormData({ ...formData, selectedTools: newSelectedTools });
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <EuiForm component="form">
                        <EuiFormRow label="Agent Name" helpText="Human readable name for the agent">
                            <EuiFieldText
                                placeholder="e.g. Database Auditor"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </EuiFormRow>
                        <EuiFormRow label="Agent ID" helpText="Unique internal identifier">
                            <EuiFieldText
                                placeholder="e.g. database-auditor"
                                value={formData.id}
                                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                            />
                        </EuiFormRow>
                        <EuiFormRow label="Type">
                            <EuiSelect
                                options={[
                                    { value: 'Observability', text: 'Observability' },
                                    { value: 'Reliability', text: 'Reliability' },
                                    { value: 'Security', text: 'Security' },
                                    { value: 'Change Management', text: 'Change Management' },
                                ]}
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            />
                        </EuiFormRow>
                        <EuiFormRow label="Description">
                            <EuiTextArea
                                placeholder="What does this agent do?"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </EuiFormRow>
                    </EuiForm>
                );
            case 2:
                return (
                    <EuiForm component="form">
                        <EuiFormRow label="System Instructions" helpText="Define the agent's persona and logic">
                            <EuiTextArea
                                style={{ minHeight: '200px' }}
                                placeholder="You are an expert SRE advisor..."
                                value={formData.instructions}
                                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                            />
                        </EuiFormRow>
                        <EuiSpacer size="m" />
                        <EuiFormRow label={`Confidence Threshold: ${formData.confidenceThreshold}% `}>
                            <EuiRange
                                min={0}
                                max={100}
                                value={formData.confidenceThreshold}
                                onChange={(e) => setFormData({ ...formData, confidenceThreshold: e.target.value })}
                            />
                        </EuiFormRow>
                    </EuiForm>
                );
            case 3:
                return (
                    <EuiCheckboxGroup
                        options={availableTools.map(t => ({ id: t.id, label: `${t.label} - ${t.description}` }))}
                        idToSelectedMap={formData.selectedTools.reduce((acc, id) => ({ ...acc, [id]: true }), {})}
                        onChange={onToolChange}
                    />
                );
            case 4:
                return (
                    <EuiForm component="form">
                        <EuiFlexGroup gutterSize="xl" alignItems="center">
                            <EuiFlexItem grow={false}>
                                <EuiAvatar
                                    name={formData.name || 'Agent'}
                                    size="xl"
                                    color={formData.avatarColor}
                                    iconType={formData.avatarIcon}
                                />
                            </EuiFlexItem>
                            <EuiFlexItem>
                                <EuiFormRow label="Avatar Icon">
                                    <EuiSelect
                                        options={[
                                            { value: 'search', text: 'Search' },
                                            { value: 'visBarVerticalStacked', text: 'Chart' },
                                            { value: 'launch', text: 'Rocket' },
                                            { value: 'bolt', text: 'Lightning' },
                                            { value: 'bug', text: 'Bug' },
                                            { value: 'lock', text: 'Shield' },
                                        ]}
                                        value={formData.avatarIcon}
                                        onChange={(e) => setFormData({ ...formData, avatarIcon: e.target.value })}
                                    />
                                </EuiFormRow>
                                <EuiFormRow label="Avatar Color">
                                    <EuiSelect
                                        options={[
                                            { value: '#FF6B9D', text: 'Pink' },
                                            { value: '#00BFB3', text: 'Teal' },
                                            { value: '#FEC514', text: 'Yellow' },
                                            { value: '#BFDBFF', text: 'Blue' },
                                            { value: '#9254DE', text: 'Purple' },
                                        ]}
                                        value={formData.avatarColor}
                                        onChange={(e) => setFormData({ ...formData, avatarColor: e.target.value })}
                                    />
                                </EuiFormRow>
                            </EuiFlexItem>
                        </EuiFlexGroup>
                    </EuiForm>
                );
            case 5:
                return (
                    <EuiForm component="form">
                        <EuiFormRow label="Allowed Indices" helpText="Select indices the agent can query">
                            <EuiCheckboxGroup
                                options={[
                                    { id: 'logs-*', label: 'Logs (logs-*)' },
                                    { id: 'metrics-*', label: 'Metrics (metrics-*)' },
                                    { id: 'traces-*', label: 'Traces (traces-*)' },
                                    { id: 'deployments-*', label: 'Deployments (deployments-*)' },
                                ]}
                                idToSelectedMap={formData.allowedIndices.reduce((acc, id) => ({ ...acc, [id]: true }), {})}
                                onChange={(id) => {
                                    const newIndices = formData.allowedIndices.includes(id)
                                        ? formData.allowedIndices.filter((i) => i !== id)
                                        : [...formData.allowedIndices, id];
                                    setFormData({ ...formData, allowedIndices: newIndices });
                                }}
                            />
                        </EuiFormRow>
                        <EuiHorizontalRule />
                        <EuiFormRow label="Actions" helpText="High-privilege actions">
                            <EuiFlexGroup direction="column" gutterSize="s">
                                <EuiFlexItem>
                                    <EuiCheckboxGroup
                                        options={[
                                            { id: 'rollback', label: 'Execute Rollbacks (Requires human approval)' },
                                        ]}
                                        idToSelectedMap={{ rollback: formData.canRollback }}
                                        onChange={() => setFormData({ ...formData, canRollback: !formData.canRollback })}
                                    />
                                </EuiFlexItem>
                            </EuiFlexGroup>
                        </EuiFormRow>
                    </EuiForm>
                );
            case 6:
                return (
                    <EuiPanel paddingSize="m" style={{ background: '#141519' }}>
                        <EuiDescriptionList
                            listItems={[
                                { title: 'Name', description: formData.name || 'Unnamed Agent' },
                                { title: 'Type', description: formData.type },
                                { title: 'Tools', description: `${formData.selectedTools.length} tools selected` },
                                { title: 'Data Access', description: formData.allowedIndices.join(', ') },
                                { title: 'Instructions', description: (formData.instructions || '').substring(0, 100) + '...' },
                            ]}
                        />
                        <EuiSpacer size="l" />
                        <EuiCallOut title="Ready to Activate" color="success" iconType="check">
                            <p>This agent will be registered in the Elastic Agent Builder with <strong>{formData.selectedTools.length} tools</strong>.</p>
                        </EuiCallOut>
                    </EuiPanel>
                );
            default:
                return null;
        }
    };

    return (
        <>
            <div style={{ background: '#25262E', padding: '12px 16px', borderBottom: '1px solid #343741' }}>
                <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
                    <EuiFlexItem>
                        <EuiTitle size="s">
                            <h1>AI Agents</h1>
                        </EuiTitle>
                        <EuiSpacer size="xs" />
                        <EuiText size="s" color="subdued">
                            Specialized AI assistants for observability, incident response, and automation
                        </EuiText>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                        <EuiButton fill iconType="plusInCircle" onClick={() => setIsModalOpen(true)}>
                            Create Agent
                        </EuiButton>
                    </EuiFlexItem>
                </EuiFlexGroup>
            </div>

            <EuiPage paddingSize="m" style={{ background: '#141519' }}>
                <EuiPageBody>
                    <EuiCallOut
                        title="Agent Builder is enabled"
                        color="success"
                        iconType="check"
                    >
                        <p>
                            Your agents can now analyze incidents, query data, and take automated actions. All
                            tool calls and reasoning steps are logged for transparency and compliance.
                        </p>
                    </EuiCallOut>

                    <EuiSpacer size="l" />

                    <EuiFlexGroup direction="column" gutterSize="m">
                        {agents.map((agent) => (
                            <EuiFlexItem key={agent.id}>
                                <EuiPanel hasShadow={false} style={{ background: '#1D1E24', border: '1px solid #343741' }}>
                                    <EuiFlexGroup gutterSize="m">
                                        <EuiFlexItem grow={false}>
                                            <EuiAvatar
                                                name={agent.name}
                                                size="xl"
                                                color={agent.avatar_color}
                                                iconType={agent.avatar_icon}
                                            />
                                        </EuiFlexItem>
                                        <EuiFlexItem>
                                            <EuiFlexGroup justifyContent="spaceBetween" alignItems="flexStart">
                                                <EuiFlexItem>
                                                    <EuiFlexGroup gutterSize="s" alignItems="center">
                                                        <EuiFlexItem grow={false}>
                                                            <EuiTitle size="xs">
                                                                <h3>{agent.name}</h3>
                                                            </EuiTitle>
                                                        </EuiFlexItem>
                                                        <EuiFlexItem grow={false}>
                                                            {agent.status === 'builtin' ? (
                                                                <EuiBadge color="hollow">Built-in</EuiBadge>
                                                            ) : (
                                                                <EuiHealth color="success">Active</EuiHealth>
                                                            )}
                                                        </EuiFlexItem>
                                                        <EuiFlexItem grow={false}>
                                                            <EuiBadge color="default">{agent.type}</EuiBadge>
                                                        </EuiFlexItem>
                                                    </EuiFlexGroup>
                                                    <EuiSpacer size="xs" />
                                                    <EuiText size="s" color="subdued">
                                                        {agent.description}
                                                    </EuiText>
                                                    <EuiSpacer size="s" />
                                                    <EuiFlexGroup gutterSize="xs" wrap>
                                                        <EuiFlexItem grow={false}>
                                                            <EuiText size="xs" color="subdued">
                                                                <strong>Tools:</strong>
                                                            </EuiText>
                                                        </EuiFlexItem>
                                                        {agent.tools.map((tool, idx) => (
                                                            <EuiFlexItem grow={false} key={idx}>
                                                                <EuiBadge color="hollow">
                                                                    <EuiCode transparentBackground>{tool}</EuiCode>
                                                                </EuiBadge>
                                                            </EuiFlexItem>
                                                        ))}
                                                    </EuiFlexGroup>
                                                </EuiFlexItem>
                                                <EuiFlexItem grow={false}>
                                                    <EuiFlexGroup gutterSize="s">
                                                        <EuiFlexItem>
                                                            <EuiButton
                                                                size="s"
                                                                iconType="discuss"
                                                                onClick={() => openChat(agent)}
                                                            >
                                                                Chat
                                                            </EuiButton>
                                                        </EuiFlexItem>
                                                        {agent.status !== 'builtin' && (
                                                            <>
                                                                <EuiFlexItem>
                                                                    <EuiButton
                                                                        size="s"
                                                                        iconType="inspect"
                                                                        onClick={() => {
                                                                            setSelectedAgent(agent);
                                                                            setActiveTab('config');
                                                                        }}
                                                                    >
                                                                        View Details
                                                                    </EuiButton>
                                                                </EuiFlexItem>
                                                                <EuiFlexItem>
                                                                    <EuiButtonIcon
                                                                        iconType="boxesHorizontal"
                                                                        aria-label="More actions"
                                                                        color="text"
                                                                    />
                                                                </EuiFlexItem>
                                                            </>
                                                        )}
                                                    </EuiFlexGroup>
                                                </EuiFlexItem>
                                            </EuiFlexGroup>

                                            <EuiSpacer size="m" />

                                            <EuiFlexGroup gutterSize="l">
                                                <EuiFlexItem>
                                                    <EuiText size="xs" color="subdued">
                                                        Conversations
                                                    </EuiText>
                                                    <EuiText size="s">
                                                        <strong>{agent.stats.conversations}</strong>
                                                    </EuiText>
                                                </EuiFlexItem>
                                                <EuiFlexItem>
                                                    <EuiText size="xs" color="subdued">
                                                        {agent.id === 'incident-investigator'
                                                            ? 'Incidents Analyzed'
                                                            : agent.id === 'slo-advisor'
                                                                ? 'SLOs Monitored'
                                                                : agent.id === 'deployment-sentinel'
                                                                    ? 'Deployments Tracked'
                                                                    : 'Queries Executed'}
                                                    </EuiText>
                                                    <EuiText size="s">
                                                        <strong>
                                                            {agent.id === 'incident-investigator'
                                                                ? agent.stats.incidents_analyzed
                                                                : agent.id === 'slo-advisor'
                                                                    ? agent.stats.slos_monitored
                                                                    : agent.id === 'deployment-sentinel'
                                                                        ? agent.stats.deployments_tracked
                                                                        : agent.stats.queries_executed}
                                                        </strong>
                                                    </EuiText>
                                                </EuiFlexItem>
                                                <EuiFlexItem>
                                                    <EuiText size="xs" color="subdued">
                                                        {agent.id === 'incident-investigator'
                                                            ? 'Avg Resolution'
                                                            : 'Avg Session'}
                                                    </EuiText>
                                                    <EuiText size="s">
                                                        <strong>
                                                            {agent.id === 'incident-investigator'
                                                                ? agent.stats.avg_resolution_time
                                                                : agent.stats.avg_session}
                                                        </strong>
                                                    </EuiText>
                                                </EuiFlexItem>
                                                <EuiFlexItem>
                                                    <EuiText size="xs" color="subdued">
                                                        Success Rate
                                                    </EuiText>
                                                    <EuiText size="s">
                                                        <strong style={{ color: '#00BFB3' }}>
                                                            {agent.stats.success_rate}
                                                        </strong>
                                                    </EuiText>
                                                </EuiFlexItem>
                                            </EuiFlexGroup>
                                        </EuiFlexItem>
                                    </EuiFlexGroup>
                                </EuiPanel>
                            </EuiFlexItem>
                        ))}
                    </EuiFlexGroup>

                    <EuiSpacer size="l" />

                    <EuiPanel hasShadow={false} style={{ background: '#1D1E24', border: '1px solid #343741' }}>
                        <EuiTitle size="xs">
                            <h3>Agent Capabilities</h3>
                        </EuiTitle>
                        <EuiSpacer size="m" />
                        <EuiFlexGroup>
                            <EuiFlexItem>
                                <EuiIcon type="search" size="l" />
                                <EuiSpacer size="s" />
                                <EuiText size="s">
                                    <strong>Data Retrieval</strong>
                                </EuiText>
                                <EuiText size="xs" color="subdued">
                                    Search logs, metrics, traces with natural language
                                </EuiText>
                            </EuiFlexItem>
                            <EuiFlexItem>
                                <EuiIcon type="brain" size="l" />
                                <EuiSpacer size="s" />
                                <EuiText size="s">
                                    <strong>Root Cause Analysis</strong>
                                </EuiText>
                                <EuiText size="xs" color="subdued">
                                    Correlate incidents across time and services
                                </EuiText>
                            </EuiFlexItem>
                            <EuiFlexItem>
                                <EuiIcon type="bolt" size="l" />
                                <EuiSpacer size="s" />
                                <EuiText size="s">
                                    <strong>Automated Actions</strong>
                                </EuiText>
                                <EuiText size="xs" color="subdued">
                                    Rollback deployments, scale services, mitigate issues
                                </EuiText>
                            </EuiFlexItem>
                            <EuiFlexItem>
                                <EuiIcon type="discuss" size="l" />
                                <EuiSpacer size="s" />
                                <EuiText size="s">
                                    <strong>Interactive Chat</strong>
                                </EuiText>
                                <EuiText size="xs" color="subdued">
                                    Ask questions, get insights, iterate on solutions
                                </EuiText>
                                <EuiSpacer size="s" />
                                <EuiButtonEmpty size="xs" iconType="discuss" onClick={() => openChat(agents[0])}>Start Chatting</EuiButtonEmpty>
                            </EuiFlexItem>
                        </EuiFlexGroup>
                    </EuiPanel>

                    <EuiSpacer size="l" />

                    <EuiText size="xs" textAlign="right" color="subdued">
                        Powered by Elastic Agent Builder · Last updated: Saturday, 31 January 2026 - 5:45 PM IST
                    </EuiText>
                </EuiPageBody>
            </EuiPage>
            {isModalOpen && (
                <EuiModal onClose={closeModal} style={{ width: '800px' }}>
                    <EuiModalHeader>
                        <EuiModalHeaderTitle>Create New AI Agent</EuiModalHeaderTitle>
                    </EuiModalHeader>

                    <EuiModalBody>
                        <EuiSteps
                            steps={[
                                { title: <><EuiIcon type="iInCircle" style={{ marginRight: 8 }} />Info</>, status: currentStep === 1 ? 'current' : currentStep > 1 ? 'complete' : 'incomplete' },
                                { title: <><EuiIcon type="bolt" style={{ marginRight: 8 }} />Logic</>, status: currentStep === 2 ? 'current' : currentStep > 2 ? 'complete' : 'incomplete' },
                                { title: <><EuiIcon type="wrench" style={{ marginRight: 8 }} />Tools</>, status: currentStep === 3 ? 'current' : currentStep > 3 ? 'complete' : 'incomplete' },
                                { title: <><EuiIcon type="brush" style={{ marginRight: 8 }} />Appearance</>, status: currentStep === 4 ? 'current' : currentStep > 4 ? 'complete' : 'incomplete' },
                                { title: <><EuiIcon type="lock" style={{ marginRight: 8 }} />Permissions</>, status: currentStep === 5 ? 'current' : currentStep > 5 ? 'complete' : 'incomplete' },
                                { title: <><EuiIcon type="check" style={{ marginRight: 8 }} />Review</>, status: currentStep === 6 ? 'current' : 'incomplete' },
                            ]}
                        />
                        <EuiSpacer size="l" />
                        {renderStep()}
                    </EuiModalBody>

                    <EuiModalFooter>
                        <EuiButtonEmpty onClick={closeModal}>Cancel</EuiButtonEmpty>
                        {currentStep > 1 && <EuiButtonEmpty onClick={prevStep}>Back</EuiButtonEmpty>}
                        {currentStep < 6 ? (
                            <EuiButton onClick={nextStep} fill>Continue</EuiButton>
                        ) : (
                            <EuiButton onClick={onCreateAgent} fill color="success">Create & Activate</EuiButton>
                        )}
                    </EuiModalFooter>
                </EuiModal>
            )}
            {selectedAgent && (
                <EuiFlyout onClose={() => setSelectedAgent(null)} size="m">
                    <EuiFlyoutHeader hasBorder>
                        <EuiFlexGroup alignItems="center">
                            <EuiFlexItem grow={false}>
                                <EuiAvatar
                                    size="l"
                                    name={selectedAgent.name}
                                    color={selectedAgent.avatar_color}
                                    iconType={selectedAgent.avatar_icon}
                                />
                            </EuiFlexItem>
                            <EuiFlexItem>
                                <EuiTitle size="m">
                                    <h2>{selectedAgent.name}</h2>
                                </EuiTitle>
                            </EuiFlexItem>
                        </EuiFlexGroup>
                        <EuiSpacer size="m" />
                        <EuiTabs>
                            <EuiTab isSelected={activeTab === 'config'} onClick={() => setActiveTab('config')}>Configuration</EuiTab>
                            <EuiTab isSelected={activeTab === 'stats'} onClick={() => setActiveTab('stats')}>Activity</EuiTab>
                        </EuiTabs>
                    </EuiFlyoutHeader>
                    <EuiFlyoutBody>
                        {activeTab === 'config' ? (
                            <>
                                <EuiTitle size="xs"><h3>Description</h3></EuiTitle>
                                <EuiText><p>{selectedAgent.description}</p></EuiText>
                                <EuiSpacer size="l" />
                                <EuiTitle size="xs"><h3>Enabled Tools</h3></EuiTitle>
                                <EuiSpacer size="s" />
                                <EuiListGroup flush>
                                    {(selectedAgent.tools || []).map(tool => (
                                        <EuiListGroupItem key={tool} label={tool} iconType="wrench" />
                                    ))}
                                </EuiListGroup>
                                <EuiSpacer size="l" />
                                <EuiTitle size="xs"><h3>Security & Permissions</h3></EuiTitle>
                                <EuiHorizontalRule margin="s" />
                                <EuiDescriptionList
                                    listItems={[
                                        { title: 'Type', description: selectedAgent.type },
                                        { title: 'Status', description: <EuiHealth color="success">{selectedAgent.status}</EuiHealth> },
                                    ]}
                                />
                                <EuiSpacer size="l" />
                                <EuiButton fill color="danger" iconType="trash" size="s">Delete Agent</EuiButton>
                            </>
                        ) : (
                            <>
                                <EuiFlexGrid columns={2}>
                                    <EuiFlexItem>
                                        <EuiStat title={selectedAgent.stats?.conversations || 0} description="Conversations" titleColor="accent" />
                                    </EuiFlexItem>
                                    <EuiFlexItem>
                                        <EuiStat title={selectedAgent.stats?.success_rate || '0%'} description="Success Rate" titleColor="success" />
                                    </EuiFlexItem>
                                </EuiFlexGrid>
                                <EuiSpacer size="xl" />
                                <EuiTitle size="xs"><h3>Live Reasoning Log</h3></EuiTitle>
                                <EuiSpacer size="s" />
                                <EuiCallOut title="Active Session" iconType="console" color="warning">
                                    <EuiCode block style={{ background: '#000', color: '#00FF00', padding: 12 }}>
                                        [19:14:02] Analyzing incident INC-2026-0132...<br />
                                        [19:14:15] Tool call: ES|QL query on logs-*<br />
                                        [19:14:28] Anomaly detected: Deployment v2.4.1<br />
                                        [19:14:35] Confidence: 92% - Awaiting instructions...
                                    </EuiCode>
                                </EuiCallOut>
                                <EuiSpacer size="m" />
                                <EuiButton fullWidth onClick={() => openChat(selectedAgent)}>Open Playground</EuiButton>
                            </>
                        )}
                    </EuiFlyoutBody>
                </EuiFlyout>
            )}

            {isChatOpen && chatAgent && (
                <EuiFlyout onClose={() => setIsChatOpen(false)} size="s" ownFocus={false}>
                    <EuiFlyoutHeader hasBorder>
                        <EuiFlexGroup alignItems="center">
                            <EuiFlexItem grow={false}>
                                <EuiAvatar
                                    size="m"
                                    name={chatAgent.name}
                                    color={chatAgent.avatar_color}
                                    iconType={chatAgent.avatar_icon}
                                />
                            </EuiFlexItem>
                            <EuiFlexItem>
                                <EuiTitle size="s">
                                    <h2>Chat: {chatAgent.name}</h2>
                                </EuiTitle>
                            </EuiFlexItem>
                        </EuiFlexGroup>
                    </EuiFlyoutHeader>
                    <EuiFlyoutBody style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
                            {chatMessages.map(msg => (
                                <div
                                    key={msg.id}
                                    style={{
                                        marginBottom: 16,
                                        textAlign: msg.sender === 'user' ? 'right' : 'left'
                                    }}
                                >
                                    <EuiPanel
                                        paddingSize="s"
                                        style={{
                                            display: 'inline-block',
                                            maxWidth: '85%',
                                            background: msg.sender === 'user' ? '#343741' : '#1D1E24',
                                            borderColor: msg.sender === 'user' ? '#4A4D57' : '#343741'
                                        }}
                                    >
                                        {msg.thought && (
                                            <EuiText size="xs" color="subdued" style={{ fontStyle: 'italic', marginBottom: 4 }}>
                                                Thinking: {msg.thought}
                                            </EuiText>
                                        )}
                                        <EuiText size="s">{msg.text}</EuiText>
                                        <EuiText size="xs" color="subdued" style={{ marginTop: 4 }}>
                                            {msg.timestamp}
                                        </EuiText>
                                    </EuiPanel>
                                </div>
                            ))}
                            {isTyping && (
                                <EuiText size="xs" color="subdued">Agent is thinking...</EuiText>
                            )}
                        </div>
                    </EuiFlyoutBody>
                    <EuiFlyoutFooter>
                        <div style={{ background: '#25262E', padding: 12, borderRadius: 8, border: '1px solid #343741' }}>
                            <EuiFlexGroup gutterSize="s" alignItems="center">
                                <EuiFlexItem>
                                    <EuiFieldText
                                        placeholder="Ask a question..."
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                        fullWidth
                                    />
                                </EuiFlexItem>
                                <EuiFlexItem grow={false}>
                                    <EuiButtonIcon
                                        iconType="push"
                                        aria-label="Send"
                                        onClick={handleSendMessage}
                                        color="primary"
                                        display="fill"
                                        size="m"
                                    />
                                </EuiFlexItem>
                            </EuiFlexGroup>
                        </div>
                    </EuiFlyoutFooter>
                </EuiFlyout>
            )}

            <EuiGlobalToastList
                toasts={toasts}
                dismissToast={(t) => setToasts(toasts.filter(toast => toast.id !== t.id))}
                toastLifeTimeMs={6000}
            />
        </>
    );
};
