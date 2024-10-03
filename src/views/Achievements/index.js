import './index.css';
import { connect } from 'react-redux';
import ReactTable from 'react-table-6';
import React, { Fragment } from 'react';
import Loader from "../../components/Loader/index";
import { setLoader } from '../../store/actions/Auth';
import { getAchievements } from "../../store/actions/Achievement";

class Achievement extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
        props.getAchievements();
        props.setLoader(true);
    }

    render() {
        let { isLoader, allAchievemets } = this.props;

        const columns = [
            {
                Header: '#',
                Cell: ({ index }) => index + 1,
                width: 100
            },
            {
                accessor: 'name',
                Header: 'Name',
                width: 350,
            },
            {
                accessor: 'description',
                Header: 'description',
            },
            {
                accessor: 'reward',
                Header: 'Gold Coin',
                width: 200,
            }
        ]

        return (
            <div className='content'>
                <div className="main-container player-scores">
                    <div className='main-container-head mb-3'>
                        <p className="main-container-heading">ACHIEVEMENTS</p>
                    </div>
                    <Fragment>
                        {isLoader ? <Loader /> : null}
                        <div className='main-container-head mb-3'>
                            <ReactTable
                                minRows={20}
                                className="table"
                                data={allAchievemets}
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
    getAchievements, setLoader
};

const mapStateToProps = ({ Auth, Achievement }) => {
    let { allAchievemets } = Achievement;
    let { isLoader } = Auth;
    return { allAchievemets, isLoader };
};
export default connect(mapStateToProps, mapDispatchToProps)(Achievement);    