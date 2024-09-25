import React, { Component } from 'react';
import { connect } from 'react-redux';
import './index.css';
import { login } from "../../store/actions/Auth";
// import idl from '../../store/idl.json';
import { Connection, PublicKey, clusterApiUrl, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
// import { Program, AnchorProvider, web3 } from '@project-serum/anchor';


// const PROGRAM_ID = new PublicKey('94Lp376dDFeyt5wMXAEmwpQ8w6qTzb5YCyHA4heUtkQy');
const { SystemProgram } = web3;

class SwapComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            provider: null,
            goldToMpcValue: 0,
            goldAmount: '',
            mpcAmount: '',
            isSwappingToMPC: true,
            conversionRate: 0.1, // Default conversion rate
            newRate: '',
        };
    }

    componentDidMount() {
        const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
        // const provider = new AnchorProvider(connection, window.solana, AnchorProvider.defaultOptions());
        // this.setState({ provider });
    }

    handleGoldInputChange = (e) => {
        const goldValue = e.target.value;
        this.setState({
            goldAmount: goldValue,
            mpcAmount: (goldValue * this.state.conversionRate).toFixed(2),
        });
    };

    handleMPCInputChange = (e) => {
        const mpcValue = e.target.value;
        this.setState({
            mpcAmount: mpcValue,
            goldAmount: (mpcValue / this.state.conversionRate).toFixed(2),
        });
    };

    handleSwapDirection = () => {
        this.setState((prevState) => ({
            isSwappingToMPC: !prevState.isSwappingToMPC,
            goldAmount: '',
            mpcAmount: '',
        }));
    };

    // callEscrow = async () => {

    //     const { provider, goldToMpcValue } = this.state;

    //     if (!provider) return;

    //     console.log("***Here");

    //     const program = new Program(idl, PROGRAM_ID, provider);

    //     try {
    //         const tx = await program.rpc.escrow(new web3.BN(goldToMpcValue), {
    //             accounts: {
    //                 vault: "",
    //                 admin: provider.wallet.publicKey,
    //                 systemProgram: SystemProgram.programId,
    //             },
    //         });
    //         console.log("Transaction successful with signature:", tx);
    //     } catch (error) {
    //         console.error("Transaction failed:", error);
    //     }
    // };

    setRate = () => {
        const { goldToMpcValue } = this.state;
        if (goldToMpcValue > 0) {
            this.setState({
                conversionRate: parseFloat(goldToMpcValue),
                goldToMpcValue: '',
            });
        } else {
            alert("Please enter a valid rate greater than 0.");
        }
    };

    getRate = () => {
        alert(`Current conversion rate: 1 Gold Coin = ${this.state.conversionRate} MPC Token`);
    };

    render() {
        const { goldAmount, mpcAmount, isSwappingToMPC, goldToMpcValue } = this.state;
        // const { publicAddress } = this.props;

        return (
            <div className="swap-container">
                <h2>Swap {isSwappingToMPC ? 'Gold Coin to MPC Token' : 'MPC Token to Gold Coin'}</h2>
                <div className="swap-box">
                    <div className="input-group">
                        <label>{isSwappingToMPC ? 'Gold Coin:' : 'MPC Token:'}</label>
                        <input
                            type="number"
                            value={isSwappingToMPC ? goldAmount : mpcAmount}
                            onChange={isSwappingToMPC ? this.handleGoldInputChange : this.handleMPCInputChange}
                            placeholder={isSwappingToMPC ? 'Enter gold amount' : 'Enter MPC amount'}
                        />
                    </div>
                    <button className="submit-button" onClick={this.handleSwapDirection}>
                        Swap Direction
                    </button>
                    <div className="input-group">
                        <label>{isSwappingToMPC ? 'MPC Token:' : 'Gold Coin:'}</label>
                        <input
                            type="number"
                            value={isSwappingToMPC ? mpcAmount : goldAmount}
                            onChange={isSwappingToMPC ? this.handleMPCInputChange : this.handleGoldInputChange}
                            placeholder={isSwappingToMPC ? 'MPC amount' : 'Gold amount'}
                            readOnly
                        />
                    </div>
                    <div className="rate-controls">
                        <div className="input-group">
                            <label>Set Conversion Rate:</label>
                            <input
                                type="number"
                                value={goldToMpcValue}
                                onChange={(e) => this.setState({ goldToMpcValue: e.target.value })}
                                placeholder="Enter new rate"
                            />
                            <button className="submit-button" onClick={this.callEscrow}>
                                Set Rate
                            </button>
                        </div>
                        <button className="submit-button" onClick={this.getRate}>
                            Get Current Rate
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}


const mapDispatchToProps = {
    login
};

const mapStateToProps = ({ Auth }) => {
    // let { publicAddress } = Auth;
    // return { publicAddress };
};
export default connect(mapStateToProps, mapDispatchToProps)(SwapComponent);
// export default SwapComponent(mapStateToProps, mapDispatchToProps);

