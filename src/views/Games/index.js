import React from 'react';
import { connect } from 'react-redux';
import Ring from '../Ring/index';
import SitnGo from '../SitnGo/index';
import Tourney from '../Tourney/index';
import Template from '../Templates/index';
import BotTests from '../BotTests';
import CompetitionSetup from '../CompetitionSetup';
import { canAccess } from '../../utils/adminAccess';

import './index.css';

class Games extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            activeTab: 'ring' // 'ring', 'sitNgo', 'tourney', 'template'
        };
    }

    switchTab = (tabName) => {
        this.setState({ activeTab: tabName });
    }

    renderActiveContent = (activeTab = this.state.activeTab) => {
        const access = { role: this.props.role, permissions: this.props.permissions };
        const canViewGames = canAccess(access, 'games.view');
        const canViewBots = canAccess(access, ['bots.view', 'bots.manage']);
        switch (activeTab) {
            case 'ring':
                return canViewGames ? <Ring /> : canViewBots ? <BotTests /> : null;
            case 'sitNgo':
                return <><p>Legacy Sit’n’Go records. Use Competition setup for new events; legacy operations are disabled when the new runner is enabled.</p><SitnGo /></>;
            case 'tourney':
                return <><p>Legacy tournament records. Use Competition setup for new events; reconcile existing registrations before migration.</p><Tourney /></>;
            case 'template':
                return <Template />;
            case 'botTests':
                return canViewBots ? <BotTests /> : canViewGames ? <Ring /> : null;
            case 'competitionSetup':
                return canAccess(access, 'tournaments.manage') ? <CompetitionSetup /> : null;
            default:
                return <Ring />;
        }
    }

    render() {
        const { activeTab } = this.state;
        const access = { role: this.props.role, permissions: this.props.permissions };
        const canViewGames = canAccess(access, 'games.view');
        const canViewBots = canAccess(access, ['bots.view', 'bots.manage']);
        const effectiveTab = activeTab === 'ring' && !canViewGames ? (canViewBots ? 'botTests' : 'competitionSetup') : activeTab;

        return (
            <div className='content'>
                <div className="main-container games-page">
                    {/* Tabs */}
                    <div className="games-tabs-container">
                        {canViewGames && <button
                            className={`games-tab-button ${effectiveTab === 'ring' ? 'active' : ''}`}
                            onClick={() => this.switchTab('ring')}
                        >
                            Ring
                        </button>}
                        {canViewGames && <button
                            className={`games-tab-button ${activeTab === 'sitNgo' ? 'active' : ''}`}
                            onClick={() => this.switchTab('sitNgo')}
                        >
                            SIT'N'GO
                        </button>}
                        {canViewGames && <button
                            className={`games-tab-button ${activeTab === 'tourney' ? 'active' : ''}`}
                            onClick={() => this.switchTab('tourney')}
                        >
                            Tourney
                        </button>}
                        {canViewGames && <button
                            className={`games-tab-button ${activeTab === 'template' ? 'active' : ''}`}
                            onClick={() => this.switchTab('template')}
                        >
                            Template
                        </button>}
                        {canAccess(access, 'tournaments.manage') && <button
                            className={`games-tab-button ${activeTab === 'competitionSetup' ? 'active' : ''}`}
                            onClick={() => this.switchTab('competitionSetup')}
                        >Competition setup (testing)</button>}
                        {canViewBots && <button
                            className={`games-tab-button ${effectiveTab === 'botTests' ? 'active' : ''}`}
                            onClick={() => this.switchTab('botTests')}
                        >
                            Test Bots
                        </button>}
                    </div>

                    {/* Active Content */}
                    <div className="games-content">
                        {this.renderActiveContent(effectiveTab)}
                    </div>
                </div>
            </div>
        );
    }
}

const mapDispatchToProps = {};

const mapStateToProps = ({ Auth }) => {
    return { role: Auth.role, permissions: Auth.permissions };
};

export default connect(mapStateToProps, mapDispatchToProps)(Games);
