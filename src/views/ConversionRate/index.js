import EventBus from 'eventing-bus';
import { web3, BN } from '@project-serum/anchor';
import { PublicKey, clusterApiUrl } from "@solana/web3.js";
import { Modal, ModalHeader, ModalBody } from "reactstrap";
import React, { useMemo, useState, useEffect } from 'react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";

import './index.css';
import { SwapAddress } from "../../store/contract/index";
import { program, provider } from "../../store/solanaProvider";


const programID = new PublicKey(SwapAddress);

const ConversionRate = () => {

    const network = clusterApiUrl('devnet');
    const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

    const [isRate, setIsRate] = useState(false);
    const [addTokens, setAddTokens] = useState("");
    const [rateModal, toggleRateModal] = useState(false);
    const [addTokensModal, toggleAddTokensModal] = useState(false);
    const [rateGoldToMPC, setRateGoldToMPC] = useState("");

    const [mpcAmount, setMpcAmount] = useState(0);
    const [goldAmount, setGoldAmount] = useState("");
    const [currentGoldToMpcValue, setCurrentGoldToMpcValue] = useState(0);


    useEffect(() => { getRate() }, []);

    const getRate = async () => {
        try {
            const [vaultPda, _] = PublicKey.findProgramAddressSync(
                [Buffer.from('Account30')],
                programID
            );
            const data = await program.account.solAccount.fetch(vaultPda);
            const currentRate = data.rateGoldToMPC.toString();
            setCurrentGoldToMpcValue(currentRate);
        } catch (error) {
            if (error) setIsRate(true);
        }
    };

    const submitRateMPC = async () => {
        try {
            const [vaultPda, _] = PublicKey.findProgramAddressSync(
                [Buffer.from('Account30')],
                programID
            );

            if (isRate) {
                const tx = await program.rpc.globalAccount(new BN(rateGoldToMPC), {
                    accounts: {
                        vault: vaultPda,
                        admin: provider.wallet.publicKey,
                        systemProgram: web3.SystemProgram.programId
                    },
                });
                console.log("*****Set New Rate Transaction: ", tx);
            }
            else {
                const tx = await program.rpc.updateGoldValue(new BN(rateGoldToMPC), {
                    accounts: {
                        vault: vaultPda,
                        admin: provider.wallet.publicKey
                    },
                });
                console.log("*****Set Updated Rate Transaction: ", tx);
            }


            await getRate();
            setRateGoldToMPC("");
            toggleRateModal(false);
        } catch (error) { console.log("******ERROR", error) }
    };

    const handleAddTokens = async () => {
        if (addTokens == "") return EventBus.publish("error", "Please add MPC Tokens amount");
        toggleAddTokensModal(true);
    };

    const submitAddTokens = async () => {
        try {
            const MPC = new PublicKey("Fp3kdVYE7BiVjkQNtcWHEjhpL5ntpoBiBuRZtT8figTJ");
            const [vaultPda] = PublicKey.findProgramAddressSync([Buffer.from('Account30')], programID);
            const [globalAta] = PublicKey.findProgramAddressSync([Buffer.from("escrowTokenAccount20")], programID);
            const mpcAdminAta = await getAssociatedTokenAddress(MPC, provider.wallet.publicKey);

            const tx = await program.rpc.adminAddMpc(new BN(addTokens), {
                accounts: {
                    escrowAccount: vaultPda,
                    admin: provider.wallet.publicKey,
                    adminTokenAccount: mpcAdminAta,
                    escrowTokenAccount: globalAta,
                    mint: MPC,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: web3.SystemProgram.programId,
                }
            });
            console.log("*******Transaction: ", tx);
            setAddTokens("")
        } catch (error) { console.log("******ERROR", error) }
    };

    const swap = async () => {
        try {
            const MPC = new PublicKey("Fp3kdVYE7BiVjkQNtcWHEjhpL5ntpoBiBuRZtT8figTJ");
            const [vaultPda] = PublicKey.findProgramAddressSync([Buffer.from('Account30')], programID);
            const [globalAta] = PublicKey.findProgramAddressSync([Buffer.from("escrowTokenAccount20")], programID);
            const mpcAdminAta = await getAssociatedTokenAddress(MPC, provider.wallet.publicKey);

            const tx = await program.rpc.goldToMpc(new BN(goldAmount), {
                accounts: {
                    escrowAccount: vaultPda,
                    userTokenAccount: mpcAdminAta,
                    escrowTokenAccount: globalAta,
                    admin: provider.wallet.publicKey,
                    mint: MPC,
                    tokenProgram: TOKEN_PROGRAM_ID,
                }
            });
            console.log("*******Transaction: ", tx);
            setGoldAmount("")
        } catch (error) {
            console.log("******ERROR", error);
        }
    };

    const handleGoldSwap = (e) => {
        const goldInput = e.target.value;
        setGoldAmount(goldInput);
        const addTokens = goldInput / currentGoldToMpcValue;
        setMpcAmount(addTokens);
    };


    return (
        <ConnectionProvider endpoint={network}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    <div className="swap-container">
                        {/* Set & Update Conversion Rate */}
                        <div className="current-rate"> <h2>CONVERSION RATE</h2></div>
                        <div className="d-flex justify-content-around">
                            <h2>1 MPC Tokens = {currentGoldToMpcValue} GoldCoin</h2>
                            <button className="submit-button" onClick={() => toggleRateModal(true)}>Change</button>
                        </div>
                        <hr />
                        {/* Add Admin MPC Tokens */}
                        <div className="gold-to-mpc">
                            <h3>Add Admin MPC Tokens</h3>
                            <div className="d-flex justify-content-around">
                                <div className="input-group-inline w-75">
                                    <input
                                        type="number"
                                        value={addTokens}
                                        onChange={(e) => setAddTokens(e.target.value)}
                                        placeholder="Enter MPC Tokens"
                                    />
                                </div>
                                <button className="submit-button" onClick={() => handleAddTokens()}>Submit</button>
                            </div>
                        </div>
                    </div>

                    {/* CONVERSION RATE MODAL */}
                    <Modal isOpen={rateModal} toggle={() => toggleRateModal(false)} className="main-modal reward-modal">
                        <ModalHeader toggle={() => toggleRateModal(false)}>
                            <div className="reward-modal-logo">
                                <img src={require('../../assets/img/logo.png')} alt="modal-logo" />
                            </div>
                            <div className="reward-modal-title"><p>CONVERSION RATE</p></div>
                            <div className="reward-modal-line"> <hr /></div>
                        </ModalHeader>
                        <ModalBody className="modal-body reward-modal-body">
                            <div className="row justify-content-center mt-3 mb-4">
                                <div className="col-md-offset-2 col-md-8 col-sm-12">
                                    <div className="input-group">
                                        <label className='text-white'>{isRate ? 'Set ' : 'Update '} Gold to MPC Token Conversion Rate</label>
                                        <div className="input-group-inline">
                                            <input
                                                type="number"
                                                value={rateGoldToMPC}
                                                placeholder="Enter the conversion rate"
                                                onChange={(e) => setRateGoldToMPC(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="col-12 mt-2 d-flex justify-content-around">
                                    <button className="submit-button" onClick={() => submitRateMPC()}>Submit</button>
                                </div>
                            </div>
                        </ModalBody>
                    </Modal>

                    {/* ADD ADMIN TOKENS MODAL */}
                    <Modal isOpen={addTokensModal} toggle={() => { setAddTokens(""); toggleAddTokensModal(false) }} className="main-modal reward-modal">
                        <ModalHeader toggle={() => { setAddTokens(""); toggleAddTokensModal(false) }}>
                            <div className="reward-modal-logo">
                                <img src={require('../../assets/img/logo.png')} alt="modal-logo" />
                            </div>
                            <div className="reward-modal-title"><p>ADD ADMIN TOKENS</p></div>
                            <div className="reward-modal-line"> <hr /></div>
                        </ModalHeader>
                        <ModalBody className="modal-body reward-modal-body">
                            <div className="row justify-content-center mt-4 mb-4">
                                <div className="col-12">
                                    <h4 className='text-center'>Are you sure you want to add ({addTokens} Tokens) to Admin Account?</h4>
                                </div>
                                <div className="col-12 mt-2 d-flex justify-content-around mt-4">
                                    <button className="cancel-btn px-5 py-2" onClick={() => { setAddTokens(""); toggleAddTokensModal(false) }}>CLOSE</button>
                                    <button className="submit-btn px-5 py-2" onClick={() => submitAddTokens()}>ADD</button>
                                </div>
                            </div>
                        </ModalBody>
                    </Modal>

                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
}

export default ConversionRate;
