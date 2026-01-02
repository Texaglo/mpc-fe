import './index.css';
import { connect } from 'react-redux';
import ReactTable from 'react-table-6';
import React, { Fragment } from 'react';
import { setLoader } from '../../store/actions/Auth';
import { getPlayersLeaderboard } from "../../store/actions/Leaderboard";


class Leaderboard extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            leaderboardArray: [],
            selectedPeriod: 'all'
        };
        props.getPlayersLeaderboard({ period: 'all' });
        props.setLoader(true);
    };

    componentWillReceiveProps({ playersLeaderboard }) {
        if(playersLeaderboard.length > 0) this.setState({ leaderboardArray: playersLeaderboard })
        else this.setState({ leaderboardArray: [] })
    }

    handlePeriodChange = (e) => {
        const period = e.target.value;
        this.setState({ selectedPeriod: period });
        this.props.setLoader(true);
        this.props.getPlayersLeaderboard({ period });
    }

    render() {
        let { leaderboardArray, selectedPeriod } = this.state;

        const columns = [
            {
                Header: '#',
                Cell: ({ index }) => index + 1,
                width: 100,
                filterable: false
            },
            {
                accessor: 'username',
                Header: 'Username',
                filterMethod: (filter, row) => {
                    return row[filter.id].toLowerCase().includes(filter.value.toLowerCase());
                },
            },
            {
                accessor: 'score',
                Header: 'Gold Coins',
            },
            {
                accessor: 'faction',
                Header: 'Faction',
                filterMethod: (filter, row) => {
                    return row[filter.id].toLowerCase().includes(filter.value.toLowerCase());
                },
            },
        ];

        return (
            <div className='content'>
                <div className="main-container player-scores">
                    <div className='main-container-head mb-3'>
                        <p className="main-container-heading">Players Leaderboard</p>
                        <div className="period-filter">
                            <label>Period:</label>
                            <select value={selectedPeriod} onChange={this.handlePeriodChange}>
                                <option value="all">All Time</option>
                                <option value="month">This Month</option>
                                <option value="week">This Week</option>
                            </select>
                        </div>
                    </div>
                    <Fragment>
                        <div className='main-container-head mb-3'>
                            <ReactTable
                                minRows={20}
                                className="table"
                                data={leaderboardArray}
                                resolveData={data => data.map(row => row)}
                                columns={columns}
                                filterable={true}
                            />
                        </div>
                    </Fragment>
                </div>
            </div>
        );
    }
}

const mapDispatchToProps = {
    getPlayersLeaderboard, setLoader
};
const mapStateToProps = ({ Leaderboard }) => {
    let { playersLeaderboard } = Leaderboard;

    return { playersLeaderboard };
};
export default connect(mapStateToProps, mapDispatchToProps)(Leaderboard);
