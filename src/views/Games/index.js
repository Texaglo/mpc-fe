import React from 'react';
import { connect } from 'react-redux';
import Ring from '../Ring/index';
import SitnGo from '../SitnGo/index';
import Tourney from '../Tourney/index';
import Template from '../Templates/index';
import BotTests from '../BotTests';

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
        switch (activeTab) {
            case 'ring':
                return <Ring />;
            case 'sitNgo':
                return <SitnGo />;
            case 'tourney':
                return <Tourney />;
            case 'template':
                return <Template />;
            case 'botTests':
                return <BotTests />;
            default:
                return <Ring />;
        }
    }

    render() {
        const { activeTab } = this.state;

        return (
            <div className='content'>
                <div className="main-container games-page">
                    {/* Tabs */}
                    <div className="games-tabs-container">
                        <button
                            className={`games-tab-button ${activeTab === 'ring' ? 'active' : ''}`}
                            onClick={() => this.switchTab('ring')}
                        >
                            Ring
                        </button>
                        <button
                            className={`games-tab-button ${activeTab === 'sitNgo' ? 'active' : ''}`}
                            onClick={() => this.switchTab('sitNgo')}
                        >
                            SIT'N'GO
                        </button>
                        <button
                            className={`games-tab-button ${activeTab === 'tourney' ? 'active' : ''}`}
                            onClick={() => this.switchTab('tourney')}
                        >
                            Tourney
                        </button>
                        <button
                            className={`games-tab-button ${activeTab === 'template' ? 'active' : ''}`}
                            onClick={() => this.switchTab('template')}
                        >
                            Template
                        </button>
                        <button
                            className={`games-tab-button ${activeTab === 'botTests' ? 'active' : ''}`}
                            onClick={() => this.switchTab('botTests')}
                        >
                            Test Bots
                        </button>
                    </div>

                    {/* Active Content */}
                    <div className="games-content">
                        {this.renderActiveContent()}
                    </div>
                </div>
            </div>
        );
    }
}

const mapDispatchToProps = {};

const mapStateToProps = () => {
    return {};
};

export default connect(mapStateToProps, mapDispatchToProps)(Games);
