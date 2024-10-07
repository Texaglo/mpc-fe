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
        };
        props.getPlayersLeaderboard();
        props.setLoader(true);
    };

    componentWillReceiveProps({ playersLeaderboard }) {
        if(playersLeaderboard.length > 0) this.setState({ leaderboardArray: playersLeaderboard })
    }

    render() {
        let { leaderboardArray } = this.state;

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
