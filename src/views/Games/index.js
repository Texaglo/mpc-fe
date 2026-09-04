import React from 'react';
import { connect } from 'react-redux';
import Ring from '../Ring/index';
import SitnGo from '../SitnGo/index';
import Tourney from '../Tourney/index';
import Template from '../Templates/index';
import BotTests from '../BotTests';
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

    renderActiveContent = () => {
        const { activeTab } = this.state;
        const access = { role: this.props.role, permissions: this.props.permissions };
        const canViewGames = canAccess(access, 'games.view');
        const canViewBots = canAccess(access, ['bots.view', 'bots.manage']);
        switch (activeTab) {
            case 'ring':
                return canViewGames ? <Ring /> : canViewBots ? <BotTests /> : null;
            case 'sitNgo':
                return <SitnGo />;
            case 'tourney':
                return <Tourney />;
            case 'template':
                return <Template />;
            case 'botTests':
                return canViewBots ? <BotTests /> : canViewGames ? <Ring /> : null;
            default:
                return <Ring />;
        }
    }

    render() {
        const { activeTab } = this.state;
        const access = { role: this.props.role, permissions: this.props.permissions };
        const canViewGames = canAccess(access, 'games.view');
        const canViewBots = canAccess(access, ['bots.view', 'bots.manage']);
        const effectiveTab = (!canViewGames && canViewBots) ? 'botTests' : activeTab;

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
                        {canViewBots && <button
                            className={`games-tab-button ${effectiveTab === 'botTests' ? 'active' : ''}`}
                            onClick={() => this.switchTab('botTests')}
                        >
                            Test Bots
                        </button>}
                    </div>

                    {/* Active Content */}
                    <div className="games-content">
                        {effectiveTab === 'botTests' ? <BotTests /> : this.renderActiveContent()}
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
