import './index.css';
import { connect } from 'react-redux';
import ReactTable from 'react-table-6';
import React, { Fragment } from 'react';
import Loader from "../../components/Loader/index";
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
        let { isLoader } = this.props;
        let { leaderboardArray } = this.state;

        const columns = [
            {
                Header: 'Rank',
                Cell: ({ index }) => index + 1,
                width: 150,
            },
            {
                accessor: 'username',
                Header: 'Username',
            },
            {
                accessor: 'score',
                Header: 'Gold Coins',
            },
            {
                accessor: 'faction',
                Header: 'Faction',
            },
        ];

        return (
            <div className='content'>
                <div className="main-container player-scores">
                    <div className='main-container-head mb-3'>
                        <p className="main-container-heading">Players Leaderboard</p>
                    </div>
                    <Fragment>
                        {isLoader ? <Loader /> : null}
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
const mapStateToProps = ({ Auth, Leaderboard }) => {
    let { playersLeaderboard } = Leaderboard;
    let { isLoader } = Auth;

    return { playersLeaderboard, isLoader };
};
export default connect(mapStateToProps, mapDispatchToProps)(Leaderboard);
