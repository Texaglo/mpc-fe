import React from 'react';
import { connect } from 'react-redux';
import Leaderboard from '../Leaderboard/index';
import FactionalLeaderboard from '../Factional Leaderboard/index';

import './index.css';

class Leaderboards extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            activeTab: 'leaderboard' // 'leaderboard', 'factional'
        };
    }

    switchTab = (tabName) => {
        this.setState({ activeTab: tabName });
    }

    renderActiveContent = () => {
        const { activeTab } = this.state;
        switch (activeTab) {
            case 'leaderboard':
                return <Leaderboard />;
            case 'factional':
                return <FactionalLeaderboard />;
            default:
                return <Leaderboard />;
        }
    }

    render() {
        const { activeTab } = this.state;

        return (
            <div className='content'>
                <div className="main-container leaderboards-page">
                    {/* Tabs */}
                    <div className="leaderboards-tabs-container">
                        <button
                            className={`leaderboards-tab-button ${activeTab === 'leaderboard' ? 'active' : ''}`}
                            onClick={() => this.switchTab('leaderboard')}
                        >
                            Leaderboard
                        </button>
                        <button
                            className={`leaderboards-tab-button ${activeTab === 'factional' ? 'active' : ''}`}
                            onClick={() => this.switchTab('factional')}
                        >
                            Factional Leaderboard
                        </button>
                    </div>

                    {/* Active Content */}
                    <div className="leaderboards-content">
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

export default connect(mapStateToProps, mapDispatchToProps)(Leaderboards);
