import { connect } from 'react-redux';
import ReactTable from 'react-table-6';
import React, { Fragment } from 'react';
import Loader from "../../components/Loader/index"
import { getWithdrawSwaps } from "../../store/actions/WithdrawSwap"

import './index.css';

class WithdrawSwap extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            withdrawSwapData: [],
        };
        props.getWithdrawSwaps();
    }

    componentWillReceiveProps({ allSwaps }) {
        if(allSwaps.length > 0) this.setState({ withdrawSwapData: allSwaps })
    }

    render() {
        let { isLoader } = this.props;
        let { withdrawSwapData } = this.state;

        const columns = [
            {
                accessor: 'username',
                Header: 'User Name',
            },
            {
                accessor: 'publicAddress',
                Header: 'Public Address',
            },
            {
                accessor: 'amount',
                Header: 'Amount',
            },
            {
                Cell: row => (
                    <div>
                        <button className="add-btn">Approve</button>
                    </div>
                ),
                Header: 'Actions',
            },
        ];
        return (
            <div className='content'>
                <div className="main-container player-scores">
                    <div className='main-container-head mb-3'>
                        <p className="main-container-heading">WITHDRAW SWAP</p>
                    </div>
                    <Fragment>
                        {isLoader ? <Loader /> : null}
                        <div className='main-container-head mb-3'>
                            <ReactTable
                                minRows={20}
                                className="table"
                                columns={columns}
                                filterable={true}
                                data={withdrawSwapData}
                                resolveData={data => data.map(row => row)}
                            />
                        </div>
                    </Fragment>
                </div>
               
            </div >
        );
    }
}

const mapDispatchToProps = {
    getWithdrawSwaps,
};

const mapStateToProps = ({ Auth, WithdrawSwap }) => {
    let { } = Auth;
    let { allSwaps } = WithdrawSwap;
    return { allSwaps };
};
export default connect(mapStateToProps, mapDispatchToProps)(WithdrawSwap);