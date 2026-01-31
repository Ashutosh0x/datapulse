import React, { useState } from 'react';
import { DataPulseApp } from './app';
import { IntegrationsApp } from './integrations';
import { AgentsApp } from './agents';
import { SettingsApp } from './settings';
import { ProfileApp } from './profile';
import {
    EuiProvider,
    EuiHeader,
    EuiHeaderSection,
    EuiHeaderLogo,
    EuiHeaderLinks,
    EuiHeaderLink,
    EuiButtonIcon,
    EuiAvatar,
    EuiFlexGroup,
    EuiFlexItem,
    EuiIcon,
} from '@elastic/eui';

export const Router = () => {
    const [currentView, setCurrentView] = useState('incidents');

    const renderView = () => {
        switch (currentView) {
            case 'incidents':
                return <DataPulseApp />;
            case 'integrations':
                return <IntegrationsApp />;
            case 'agents':
                return <AgentsApp />;
            case 'settings':
                return <SettingsApp />;
            case 'profile':
                return <ProfileApp />;
            default:
                return <DataPulseApp />;
        }
    };

    return (
        <EuiProvider colorMode="dark">
            <EuiHeader style={{ background: '#1D1E24', borderBottom: '1px solid #343741' }}>
                <EuiHeaderSection grow={false}>
                    <EuiHeaderLogo
                        iconType="logoElastic"
                        onClick={() => setCurrentView('incidents')}
                        style={{ cursor: 'pointer' }}
                    >
                        Elastic
                    </EuiHeaderLogo>
                </EuiHeaderSection>
                <EuiHeaderSection>
                    <EuiHeaderLinks>
                        <EuiHeaderLink
                            isActive={currentView === 'incidents'}
                            onClick={() => setCurrentView('incidents')}
                        >
                            <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
                                <EuiFlexItem grow={false}>
                                    <EuiIcon type="bell" size="m" />
                                </EuiFlexItem>
                                <EuiFlexItem grow={false}>
                                    <span>Incidents</span>
                                </EuiFlexItem>
                            </EuiFlexGroup>
                        </EuiHeaderLink>
                        <EuiHeaderLink
                            isActive={currentView === 'integrations'}
                            onClick={() => setCurrentView('integrations')}
                        >
                            <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
                                <EuiFlexItem grow={false}>
                                    <EuiIcon type="apps" size="m" />
                                </EuiFlexItem>
                                <EuiFlexItem grow={false}>
                                    <span>Integrations</span>
                                </EuiFlexItem>
                            </EuiFlexGroup>
                        </EuiHeaderLink>
                        <EuiHeaderLink
                            isActive={currentView === 'agents'}
                            onClick={() => setCurrentView('agents')}
                        >
                            <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
                                <EuiFlexItem grow={false}>
                                    <EuiIcon type="compute" size="m" />
                                </EuiFlexItem>
                                <EuiFlexItem grow={false}>
                                    <span>Agents</span>
                                </EuiFlexItem>
                            </EuiFlexGroup>
                        </EuiHeaderLink>
                    </EuiHeaderLinks>
                </EuiHeaderSection>
                <EuiHeaderSection side="right">
                    <EuiFlexGroup gutterSize="s" alignItems="center" style={{ marginRight: 12 }}>
                        <EuiFlexItem grow={false}>
                            <EuiButtonIcon
                                iconType="gear"
                                aria-label="Settings"
                                color="text"
                                onClick={() => setCurrentView('settings')}
                            />
                        </EuiFlexItem>
                        <EuiFlexItem grow={false}>
                            <EuiAvatar
                                name={localStorage.getItem('dp_user_name') || 'User'}
                                imageUrl={localStorage.getItem('dp_user_image')}
                                size="s"
                                color="#FEC514"
                                onClick={() => setCurrentView('profile')}
                                style={{ cursor: 'pointer' }}
                            />
                        </EuiFlexItem>
                    </EuiFlexGroup>
                </EuiHeaderSection>
            </EuiHeader>

            {renderView()}
        </EuiProvider>
    );
};
