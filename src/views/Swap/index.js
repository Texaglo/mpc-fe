import { connect } from 'react-redux';
import ReactTable from 'react-table-6';
import { web3, BN } from '@project-serum/anchor';
import React, { Fragment } from 'react';
import Loader from "../../components/Loader/index"
import { getWithdrawSwaps, updateWithdrawSwap } from "../../store/actions/WithdrawSwap"
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";

import './index.css';
import { SwapAddress } from "../../store/contract/index";
import { program, provider } from "../../store/solanaProvider";

import { setLoader } from "../../store/actions/Auth";

const programID = new PublicKey(SwapAddress);

class Swap extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            withdrawSwapData: []
        };
        props.getWithdrawSwaps();
    }

    componentWillReceiveProps({ allSwaps }) {
        if (allSwaps.length > 0) this.setState({ withdrawSwapData: allSwaps })
    }

    approveSwap = async (swap) => {
        this.props.setLoader(true);
        try {
            const MPC = new PublicKey("Fp3kdVYE7BiVjkQNtcWHEjhpL5ntpoBiBuRZtT8figTJ");
            const user = new PublicKey(swap['publicAddress'])
            const [vaultPda] = PublicKey.findProgramAddressSync([Buffer.from('Account55')], programID);
            const [globalAta] = PublicKey.findProgramAddressSync([Buffer.from("escrowTokenAccount55")], programID);
            const mpcUserAta = await getAssociatedTokenAddress(MPC, user);

            const tx = await program.rpc.goldToMpc(new BN(swap['amount']), {
                accounts: {
                    escrowAccount: vaultPda,
                    userTokenAccount: mpcUserAta,
                    escrowTokenAccount: globalAta,
                    admin: provider.wallet.publicKey,
                    user: user,
                    mint: MPC,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: web3.SystemProgram.programId,
                    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID
                }
            });
            const transactionDetails = await provider.connection.getTransaction(tx, {
                commitment: "confirmed",
                maxSupportedTransactionVersion: 0,
            });
            if (transactionDetails) {
                this.props.updateWithdrawSwap({ payload: { publicAddress: swap['publicAddress'], txTime: transactionDetails.blockTime } });
                this.props.setLoader(false);
            } else {
                this.props.setLoader(false);
            }
        } catch (error) {
            console.log("******ERROR", error);
            this.props.setLoader(false);
        }
    }

    render() {
        let { withdrawSwapData } = this.state;

        const columns = [
            {
                Header: '#',
                Cell: ({ index }) => index + 1,
                width: 100
            },
            {
                accessor: 'username',
                Header: 'User Name',
                width: 400
            },
            {
                accessor: 'publicAddress',
                Header: 'Public Address'
            },
            {
                accessor: 'amount',
                Header: 'Gold Coin Amount',
                width: 150
            },
            {
                Cell: item => (
                    <div>
                        {
                            item['original']['status'] === "Running" ? <button onClick={() => this.approveSwap(item['original'])} className="add-btn">Approve</button>
                                : <h4 className="remove-btn">Approved</h4>
                        }
                    </div>
                ),
                Header: 'Actions',
                width: 200
            },
        ];
        return (
            <div className='content'>
                <div className="main-container player-scores">
                    <div className='main-container-head mb-3'>
                        <p className="main-container-heading">WITHDRAW SWAP</p>
                    </div>
                    <Fragment>
                        <div className='main-container-head mb-3'>
                            <ReactTable
                                minRows={20}
                                className="table"
                                columns={columns}
                                filterable={true}
                                data={withdrawSwapData}
                                resolveData={data => data.map(item => item)}
                            />
                        </div>
                    </Fragment>
                </div>

            </div >
        );
    }
}

const mapDispatchToProps = {
    getWithdrawSwaps, updateWithdrawSwap, setLoader
};

const mapStateToProps = ({ WithdrawSwap }) => {
    let { allSwaps } = WithdrawSwap;
    return { allSwaps };
};
export default connect(mapStateToProps, mapDispatchToProps)(Swap);