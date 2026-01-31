import React, { useState, useEffect } from 'react';
import {
    EuiPage,
    EuiPageBody,
    EuiPageHeader,
    EuiTitle,
    EuiText,
    EuiSpacer,
    EuiFlexGroup,
    EuiFlexItem,
    EuiPanel,
    EuiAvatar,
    EuiStat,
    EuiBadge,
    EuiDescriptionList,
    EuiIcon,
    EuiHorizontalRule,
    EuiCommentList,
    EuiComment,
    EuiButton,
    EuiButtonEmpty,
    EuiHealth,
    EuiCallOut,
    EuiFlexGrid,
    EuiModal,
    EuiModalHeader,
    EuiModalHeaderTitle,
    EuiModalBody,
    EuiModalFooter,
    EuiFlyout,
    EuiFlyoutHeader,
    EuiFlyoutBody,
    EuiListGroup,
    EuiListGroupItem,
    EuiSwitch,
    EuiFilePicker,
    EuiGlobalToastList,
    EuiButtonIcon,
} from '@elastic/eui';

export const ProfileApp = () => {
    // State for interactive elements
    const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
    const [isSessionFlyoutOpen, setIsSessionFlyoutOpen] = useState(false);
    const [isNotificationFlyoutOpen, setIsNotificationFlyoutOpen] = useState(false);
    const [isApiKeyFlyoutOpen, setIsApiKeyFlyoutOpen] = useState(false);
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
    const [isEditInfoModalOpen, setIsEditInfoModalOpen] = useState(false);
    const [toasts, setToasts] = useState([]);

    // Persistence Logic
    const [userName, setUserName] = useState(() => localStorage.getItem('dp_user_name') || 'Elastic SRE Admin');
    const [userEmail, setUserEmail] = useState(() => localStorage.getItem('dp_user_email') || 'admin@datapulse.io');
    const [userImage, setUserImage] = useState(() => localStorage.getItem('dp_user_image') || null);
    const [notifications, setNotifications] = useState(() => {
        const saved = localStorage.getItem('dp_notifications');
        return saved ? JSON.parse(saved) : {
            email: true,
            slack: true,
            browser: true,
            approvals: true
        };
    });

    useEffect(() => {
        localStorage.setItem('dp_user_name', userName);
        localStorage.setItem('dp_user_email', userEmail);
        localStorage.setItem('dp_notifications', JSON.stringify(notifications));
        if (userImage) localStorage.setItem('dp_user_image', userImage);
    }, [userName, userEmail, notifications, userImage]);

    const addToast = (title, color = 'success') => {
        setToasts([...toasts, {
            id: Date.now().toString(),
            title,
            color,
            iconType: color === 'success' ? 'check' : 'alert',
        }]);
    };

    const saveProfile = () => {
        addToast('Profile changes saved successfully!');
    };

    const rotateApiKey = () => {
        addToast('Elastic API Key rotated successfully. New key is now active.');
    };

    const user = {
        name: userName,
        email: userEmail,
        role: 'Administrator',
        organization: 'Platform Operations',
        joined: 'Jan 2026',
        trustScore: 'High',
        stats: {
            resolved: 142,
            agents: 12,
            impact_incidents: 18,
            avg_resolution: '6m 12s',
            rollbacks: 4,
            false_positives: 2
        }
    };

    const roles = [
        { name: 'SRE_Admin', color: 'primary' },
        { name: 'Platform_Admin', color: 'accent' },
        { name: 'Security_Oncall', color: 'danger' }
    ];

    const recentActivity = [
        { user: 'Systems', type: 'search', title: 'Agent Interaction', description: 'Incident Investigator — RCA on INC-0132 executed successfully.', time: '2h ago', color: 'primary' },
        { user: 'Security', type: 'lock', title: 'API Key Rotated', description: 'Primary search key for prod-cluster rotated by you.', time: 'Yesterday', color: 'warning' },
        { user: 'Platform', type: 'bolt', title: 'Rollback Approved', description: 'Deployment v2.4.1 rollback approved for payment-service.', time: 'Yesterday', color: 'danger' },
        { user: 'System', type: 'check', title: 'Incident Resolved', description: 'P1 Incident INC-0132 marked as resolved.', time: 'Yesterday', color: 'success' }
    ];

    const decisions = [
        { id: 'D-842', action: 'Approved Rollback', target: 'payment-service v2.4.1', date: 'Yesterday' },
        { id: 'D-841', action: 'Rejected Auto-scale', target: 'auth-service', date: 'Yesterday' },
        { id: 'D-840', action: 'Closed Incident', target: 'INC-0128', date: '2 days ago' }
    ];

    return (
        <EuiPage paddingSize="m">
            <EuiPageBody>
                {/* --- HEADER SECTION --- */}
                <EuiPageHeader>
                    <EuiFlexGroup alignItems="center" gutterSize="xl">
                        <EuiFlexItem grow={false} style={{ position: 'relative' }}>
                            <EuiAvatar
                                name={userName}
                                size="xl"
                                color="#FEC514"
                                imageUrl={userImage}
                                style={{ height: 120, width: 120, border: '4px solid #343741' }}
                            />
                            <div style={{ position: 'absolute', bottom: -10, right: 0 }}>
                                <EuiButtonIcon
                                    iconType="pencil"
                                    display="fill"
                                    size="s"
                                    color="primary"
                                    aria-label="Change Avatar"
                                    onClick={() => setIsAvatarModalOpen(true)}
                                />
                            </div>
                        </EuiFlexItem>
                        <EuiFlexItem>
                            <EuiFlexGroup alignItems="center" gutterSize="s">
                                <EuiFlexItem grow={false}>
                                    <EuiTitle size="l">
                                        <h1>{userName}</h1>
                                    </EuiTitle>
                                </EuiFlexItem>
                                <EuiFlexItem grow={false}>
                                    <EuiButtonIcon
                                        iconType="pencil"
                                        aria-label="Edit name"
                                        onClick={() => setIsEditInfoModalOpen(true)}
                                    />
                                </EuiFlexItem>
                            </EuiFlexGroup>
                            <EuiText color="subdued">
                                <p>{user.organization} · {user.role}</p>
                            </EuiText>
                            <EuiSpacer size="s" />
                            <EuiFlexGroup gutterSize="s">
                                {roles.map(role => (
                                    <EuiFlexItem grow={false} key={role.name}>
                                        <EuiBadge color={role.color}>{role.name}</EuiBadge>
                                    </EuiFlexItem>
                                ))}
                                <EuiFlexItem grow={false}>
                                    <EuiBadge color="success">Agent Trust Score: {user.trustScore}</EuiBadge>
                                </EuiFlexItem>
                            </EuiFlexGroup>
                        </EuiFlexItem>
                        <EuiFlexItem grow={false}>
                            <EuiFlexGroup gutterSize="s">
                                <EuiFlexItem>
                                    <EuiButton iconType="bell" onClick={() => setIsNotificationFlyoutOpen(true)}>Preferences</EuiButton>
                                </EuiFlexItem>
                                <EuiFlexItem>
                                    <EuiButton fill iconType="save" onClick={saveProfile}>Save Profile</EuiButton>
                                </EuiFlexItem>
                            </EuiFlexGroup>
                        </EuiFlexItem>
                    </EuiFlexGroup>
                </EuiPageHeader>

                <EuiSpacer size="xl" />

                <EuiFlexGrid columns={3}>
                    {/* --- COLUMN 1: SECURITY & SESSIONS --- */}
                    <EuiFlexItem>
                        <EuiPanel paddingSize="l" style={{ height: '100%', borderTop: '4px solid #FEC514' }}>
                            <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
                                <EuiFlexItem>
                                    <EuiTitle size="xs"><h3>Security Posture</h3></EuiTitle>
                                </EuiFlexItem>
                                <EuiFlexItem grow={false}>
                                    <EuiIcon type="lock" color="success" />
                                </EuiFlexItem>
                            </EuiFlexGroup>
                            <EuiSpacer size="m" />
                            <EuiDescriptionList
                                listItems={[
                                    { title: 'Status', description: <EuiHealth color="success">Secure</EuiHealth> },
                                    { title: 'Active Sessions', description: '1 (This device)' },
                                    { title: 'Last Login', description: 'Today, 14:22 IST' },
                                    { title: 'MFA', description: <EuiBadge color="hollow">Enabled</EuiBadge> },
                                ]}
                            />
                            <EuiSpacer size="l" />
                            <EuiButton fullWidth size="s" iconType="users" onClick={() => setIsSessionFlyoutOpen(true)}>View Active Sessions</EuiButton>
                            <EuiSpacer size="s" />
                            <EuiButtonEmpty fullWidth size="s" color="danger">Revoke Other Sessions</EuiButtonEmpty>
                        </EuiPanel>
                    </EuiFlexItem>

                    {/* --- COLUMN 2: API KEYS & PERMISSIONS --- */}
                    <EuiFlexItem>
                        <EuiPanel paddingSize="l" style={{ height: '100%', borderTop: '4px solid #00BFB3' }}>
                            <EuiTitle size="xs"><h3>API Key Management</h3></EuiTitle>
                            <EuiSpacer size="m" />
                            <EuiFlexGrid columns={2} gutterSize="s">
                                <EuiFlexItem>
                                    <EuiStat title="3" description="Active Keys" titleSize="s" />
                                </EuiFlexItem>
                                <EuiFlexItem>
                                    <EuiStat title="0" description="Expiring" titleColor="danger" titleSize="s" />
                                </EuiFlexItem>
                            </EuiFlexGrid>
                            <EuiSpacer size="m" />
                            <EuiText size="xs" color="subdued">
                                <p>• 2 Search keys | 1 Agent key</p>
                            </EuiText>
                            <EuiSpacer size="m" />
                            <EuiFlexGroup gutterSize="s">
                                <EuiFlexItem>
                                    <EuiButton size="s" iconType="key" fill onClick={rotateApiKey}>Rotate Key</EuiButton>
                                </EuiFlexItem>
                                <EuiFlexItem>
                                    <EuiButton size="s" iconType="eye" onClick={() => setIsApiKeyFlyoutOpen(true)}>View All</EuiButton>
                                </EuiFlexItem>
                            </EuiFlexGroup>
                            <EuiSpacer size="l" />
                            <EuiHorizontalRule margin="s" />
                            <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
                                <EuiText size="s"><strong>Access: Full (Owner)</strong></EuiText>
                                <EuiButtonEmpty size="xs" onClick={() => setIsPermissionModalOpen(true)}>View Permissions</EuiButtonEmpty>
                            </EuiFlexGroup>
                        </EuiPanel>
                    </EuiFlexItem>

                    {/* --- COLUMN 3: OPERATIONAL IMPACT --- */}
                    <EuiFlexItem>
                        <EuiPanel paddingSize="l" style={{ height: '100%', borderTop: '4px solid #9254DE' }}>
                            <EuiTitle size="xs"><h3>Personal Impact (30d)</h3></EuiTitle>
                            <EuiSpacer size="m" />
                            <EuiFlexGrid columns={2} gutterSize="l">
                                <EuiFlexItem>
                                    <EuiStat title={user.stats.impact_incidents} description="Incidents" titleColor="accent" titleSize="m" />
                                </EuiFlexItem>
                                <EuiFlexItem>
                                    <EuiStat title={user.stats.avg_resolution} description="Avg Resolution" titleSize="m" />
                                </EuiFlexItem>
                                <EuiFlexItem>
                                    <EuiStat title={user.stats.rollbacks} description="Rollbacks" titleSize="m" />
                                </EuiFlexItem>
                                <EuiFlexItem>
                                    <EuiStat title={user.stats.false_positives} description="FP Rejected" titleSize="m" />
                                </EuiFlexItem>
                            </EuiFlexGrid>
                            <EuiSpacer size="m" />
                            <EuiCallOut size="s" title="Expertise: Incident Response" iconType="iInCircle" />
                            <EuiSpacer size="m" />
                            <EuiDescriptionList
                                listItems={[
                                    { title: 'Primary', description: 'Incident Response' },
                                    { title: 'Secondary', description: 'Platform Reliability' },
                                    { title: 'Skills', description: 'ES|QL, KQL, Python, Terraform' },
                                ]}
                            />
                        </EuiPanel>
                    </EuiFlexItem>
                </EuiFlexGrid>

                <EuiSpacer size="l" />

                <EuiFlexGroup>
                    {/* --- RECENT ACTIVITY --- */}
                    <EuiFlexItem grow={2}>
                        <EuiPanel paddingSize="l">
                            <EuiTitle size="xs"><h3>Interactive Activity Feed</h3></EuiTitle>
                            <EuiSpacer size="m" />
                            <EuiCommentList>
                                {recentActivity.map((activity, idx) => (
                                    <EuiComment
                                        key={idx}
                                        username={activity.user}
                                        timelineAvatar={<EuiIcon type={activity.type} color={activity.color} />}
                                        event={activity.title}
                                        timestamp={activity.time}
                                    >
                                        <EuiText size="s">{activity.description}</EuiText>
                                    </EuiComment>
                                ))}
                            </EuiCommentList>
                        </EuiPanel>
                    </EuiFlexItem>

                    {/* --- DECISIONS & ENVIRONMENTS --- */}
                    <EuiFlexItem grow={1}>
                        <EuiPanel paddingSize="l">
                            <EuiTitle size="xs"><h3>Decision Audit Log</h3></EuiTitle>
                            <EuiSpacer size="m" />
                            <EuiListGroup flush>
                                {decisions.map(d => (
                                    <EuiListGroupItem
                                        key={d.id}
                                        label={d.action}
                                        size="s"
                                        extraAction={{
                                            iconType: 'link',
                                            'aria-label': 'Go to incident'
                                        }}
                                        iconType="checkInCircleFilled"
                                        iconColor="success"
                                        helperText={`${d.target} · ${d.date}`}
                                    />
                                ))}
                            </EuiListGroup>
                            <EuiSpacer size="l" />
                            <EuiTitle size="xs"><h3>Environment Scopes</h3></EuiTitle>
                            <EuiHorizontalRule margin="s" />
                            <EuiDescriptionList
                                listItems={[
                                    { title: 'PROD', description: <EuiBadge color="danger">Full Access</EuiBadge> },
                                    { title: 'STAGING', description: <EuiBadge color="warning">Full Access</EuiBadge> },
                                    { title: 'DEV', description: <EuiBadge color="default">Read Only</EuiBadge> },
                                ]}
                            />
                        </EuiPanel>
                    </EuiFlexItem>
                </EuiFlexGroup>

                {/* --- MODALS & FLYOUTS --- */}
                {isPermissionModalOpen && (
                    <EuiModal onClose={() => setIsPermissionModalOpen(false)}>
                        <EuiModalHeader><EuiModalHeaderTitle>RBAC Permissions: {user.role}</EuiModalHeaderTitle></EuiModalHeader>
                        <EuiModalBody>
                            <EuiListGroup flush>
                                <EuiListGroupItem label="Incident Approval" iconType="check" iconColor="success" />
                                <EuiListGroupItem label="Agent Creation & Modification" iconType="check" iconColor="success" />
                                <EuiListGroupItem label="Production Rollback Execution" iconType="check" iconColor="success" />
                                <EuiListGroupItem label="API Key Generation" iconType="check" iconColor="success" />
                                <EuiListGroupItem label="User Management" iconType="cross" iconColor="danger" />
                            </EuiListGroup>
                        </EuiModalBody>
                        <EuiModalFooter><EuiButton onClick={() => setIsPermissionModalOpen(false)} fill>Close</EuiButton></EuiModalFooter>
                    </EuiModal>
                )}

                {isSessionFlyoutOpen && (
                    <EuiFlyout onClose={() => setIsSessionFlyoutOpen(false)} size="s">
                        <EuiFlyoutHeader hasBorder><EuiTitle size="m"><h2>Active Sessions</h2></EuiTitle></EuiFlyoutHeader>
                        <EuiFlyoutBody>
                            <EuiCallOut title="This session is secure" color="success" iconType="shieldCheck" />
                            <EuiSpacer size="m" />
                            <EuiPanel paddingSize="s" style={{ background: '#1D1E24' }}>
                                <EuiFlexGroup alignItems="center">
                                    <EuiFlexItem grow={false}><EuiIcon type="compute" size="l" /></EuiFlexItem>
                                    <EuiFlexItem>
                                        <EuiText size="s"><strong>Windows Laptop · Chrome</strong></EuiText>
                                        <EuiText size="xs" color="subdued">Mumbai, India · IP: 102.16.x.x</EuiText>
                                    </EuiFlexItem>
                                    <EuiFlexItem grow={false}><EuiBadge color="success">Current</EuiBadge></EuiFlexItem>
                                </EuiFlexGroup>
                            </EuiPanel>
                        </EuiFlyoutBody>
                    </EuiFlyout>
                )}

                {isNotificationFlyoutOpen && (
                    <EuiFlyout onClose={() => setIsNotificationFlyoutOpen(false)} size="s">
                        <EuiFlyoutHeader hasBorder><EuiTitle size="m"><h2>Communication Preferences</h2></EuiTitle></EuiFlyoutHeader>
                        <EuiFlyoutBody>
                            <EuiTitle size="xs"><h3>Channel Settings</h3></EuiTitle>
                            <EuiSpacer size="m" />
                            <EuiSwitch
                                label="Send notifications to your mail"
                                checked={notifications.email}
                                onChange={(e) => setNotifications({ ...notifications, email: e.target.checked })}
                            />
                            <EuiSpacer size="m" />
                            <EuiSwitch
                                label="Slack Integration Alerts"
                                checked={notifications.slack}
                                onChange={(e) => setNotifications({ ...notifications, slack: e.target.checked })}
                            />
                            <EuiSpacer size="m" />
                            <EuiSwitch
                                label="Show browser Desktop Notifications"
                                checked={notifications.browser}
                                onChange={(e) => setNotifications({ ...notifications, browser: e.target.checked })}
                            />
                            <EuiSpacer size="m" />
                            <EuiSwitch
                                label="Urgent approval requests via Mobile"
                                checked={notifications.approvals}
                                onChange={(e) => setNotifications({ ...notifications, approvals: e.target.checked })}
                            />
                            <EuiSpacer size="xl" />
                            <EuiButton fullWidth fill onClick={() => setIsNotificationFlyoutOpen(false)}>Apply Preferences</EuiButton>
                        </EuiFlyoutBody>
                    </EuiFlyout>
                )}

                {isApiKeyFlyoutOpen && (
                    <EuiFlyout onClose={() => setIsApiKeyFlyoutOpen(false)} size="m">
                        <EuiFlyoutHeader hasBorder><EuiTitle size="m"><h2>Active API Keys</h2></EuiTitle></EuiFlyoutHeader>
                        <EuiFlyoutBody>
                            <EuiCallOut title="Security Best Practice" color="warning" iconType="security">
                                <p>Rotate keys every 90 days. Avoid sharing keys across different environments.</p>
                            </EuiCallOut>
                            <EuiSpacer size="l" />
                            <EuiPanel paddingSize="s" style={{ background: '#1D1E24' }}>
                                <EuiListGroup flush>
                                    <EuiListGroupItem
                                        label="prod-search-key"
                                        iconType="key"
                                        helperText="Created: Jan 12, 2026 · Type: Search-only"
                                        extraAction={{ iconType: 'trash', color: 'danger', 'aria-label': 'Delete' }}
                                    />
                                    <EuiListGroupItem
                                        label="agent-execution-key"
                                        iconType="compute"
                                        helperText="Created: Jan 28, 2026 · Type: High-privilege"
                                        extraAction={{ iconType: 'trash', color: 'danger', 'aria-label': 'Delete' }}
                                    />
                                    <EuiListGroupItem
                                        label="slack-integration-key"
                                        iconType="logoSlack"
                                        helperText="Created: Jan 15, 2026 · Type: Webhook-only"
                                        extraAction={{ iconType: 'trash', color: 'danger', 'aria-label': 'Delete' }}
                                    />
                                </EuiListGroup>
                            </EuiPanel>
                            <EuiSpacer size="xl" />
                            <EuiButton fullWidth fill iconType="plus">Create New API Key</EuiButton>
                        </EuiFlyoutBody>
                    </EuiFlyout>
                )}

                {isAvatarModalOpen && (
                    <EuiModal onClose={() => setIsAvatarModalOpen(false)}>
                        <EuiModalHeader><EuiModalHeaderTitle>Change Profile Picture</EuiModalHeaderTitle></EuiModalHeader>
                        <EuiModalBody>
                            <EuiText size="s"><p>Upload a new image for your DataPulse identity.</p></EuiText>
                            <EuiSpacer size="m" />
                            <EuiFilePicker
                                fullWidth
                                initialPromptText="Select or drag and drop an image"
                                onChange={(files) => { if (files.length > 0) setUserImage(URL.createObjectURL(files[0])) }}
                            />
                        </EuiModalBody>
                        <EuiModalFooter>
                            <EuiButtonEmpty onClick={() => setIsAvatarModalOpen(false)}>Cancel</EuiButtonEmpty>
                            <EuiButton fill onClick={() => { setIsAvatarModalOpen(false); addToast('Avatar updated!'); }}>Upload</EuiButton>
                        </EuiModalFooter>
                    </EuiModal>
                )}

                {isEditInfoModalOpen && (
                    <EuiModal onClose={() => setIsEditInfoModalOpen(false)}>
                        <EuiModalHeader><EuiModalHeaderTitle>Edit Personal Information</EuiModalHeaderTitle></EuiModalHeader>
                        <EuiModalBody>
                            <EuiForm component="form">
                                <EuiFormRow label="Full Name">
                                    <EuiFieldText
                                        value={userName}
                                        onChange={(e) => setUserName(e.target.value)}
                                    />
                                </EuiFormRow>
                                <EuiFormRow label="Email Address">
                                    <EuiFieldText
                                        value={userEmail}
                                        onChange={(e) => setUserEmail(e.target.value)}
                                    />
                                </EuiFormRow>
                            </EuiForm>
                        </EuiModalBody>
                        <EuiModalFooter>
                            <EuiButtonEmpty onClick={() => setIsEditInfoModalOpen(false)}>Cancel</EuiButtonEmpty>
                            <EuiButton fill onClick={() => { setIsEditInfoModalOpen(false); addToast('Information updated!'); }}>Save Changes</EuiButton>
                        </EuiModalFooter>
                    </EuiModal>
                )}

                <EuiGlobalToastList
                    toasts={toasts}
                    dismissToast={(t) => setToasts(toasts.filter(toast => toast.id !== t.id))}
                    toastLifeTimeMs={5000}
                />
            </EuiPageBody>
        </EuiPage>
    );
};
