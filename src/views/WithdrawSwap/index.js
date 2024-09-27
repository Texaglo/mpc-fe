import { connect } from 'react-redux';
import ReactTable from 'react-table-6';
import { web3, BN } from '@project-serum/anchor';
import React, { Fragment } from 'react';
import Loader from "../../components/Loader/index"
import { getWithdrawSwaps, updateWithdrawSwaps } from "../../store/actions/WithdrawSwap"
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey, clusterApiUrl } from "@solana/web3.js";
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';

import './index.css';
import { SwapAddress } from "../../store/contract/index";
import { program, provider } from "../../store/solanaProvider";

const programID = new PublicKey(SwapAddress);

class WithdrawSwap extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            withdrawSwapData: []
        };
        props.getWithdrawSwaps();
    }

    componentWillReceiveProps({ allSwaps }) {
        if(allSwaps.length > 0) this.setState({ withdrawSwapData: allSwaps })
    }

    approveSwap = async (swap) => {
        try {
            const MPC = new PublicKey("Fp3kdVYE7BiVjkQNtcWHEjhpL5ntpoBiBuRZtT8figTJ");
            const user = new PublicKey(swap['publicAddress'])
            const [vaultPda] = PublicKey.findProgramAddressSync([Buffer.from('Account45')], programID);
            const [globalAta] = PublicKey.findProgramAddressSync([Buffer.from("escrowTokenAccount45")], programID);
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
            if(tx) {
                this.props.updateWithdrawSwaps({payload: swap['publicAddress']});
            }
        } catch (error) {
            console.log("******ERROR", error);
        }
    }

    render() {
        let { isLoader } = this.props;
        let { withdrawSwapData } = this.state;

        const columns = [
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
                        {isLoader ? <Loader /> : null}
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
    getWithdrawSwaps, updateWithdrawSwaps,
};

const mapStateToProps = ({ Auth, WithdrawSwap }) => {
    let { } = Auth;
    let { allSwaps } = WithdrawSwap;
    return { allSwaps };
};
export default connect(mapStateToProps, mapDispatchToProps)(WithdrawSwap);