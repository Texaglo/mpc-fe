import EventBus from 'eventing-bus';
import { web3, BN } from '@project-serum/anchor';
import { PublicKey, clusterApiUrl } from "@solana/web3.js";
import { Modal, ModalHeader, ModalBody } from "reactstrap";
import React, { useMemo, useState, useEffect } from 'react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel'

import './index.css';
import { SwapAddress } from "../../store/contract/index";
import { program, provider } from "../../store/solanaProvider";


const programID = new PublicKey(SwapAddress);

const ConversionRate = () => {

    const network = clusterApiUrl('devnet');
    const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

    const [isGoldRate, setIsGoldRate] = useState(false);
    const [isTimeRate, setIsTimeRate] = useState(false);
    const [addTokens, setAddTokens] = useState("");
    const [goldRateModal, toggleGoldRateModal] = useState(false);
    const [timeRateModal, toggleTimeRateModal] = useState(false);
    const [addTokensModal, toggleAddTokensModal] = useState(false);
    const [rateGoldToMPC, setRateGoldToMPC] = useState("");
    const [rateTimeToMPC, setRateTimeToMPC] = useState("");

    const [mpcAmount, setMpcAmount] = useState(0);
    const [goldAmount, setGoldAmount] = useState("");
    const [currentGoldToMpcValue, setCurrentGoldToMpcValue] = useState(0);
    const [currentTimeToMpcValue, setCurrentTimeToMpcValue] = useState(0);
    const [value, setValue] = React.useState('mpc-to-gold');

    const handleChange = (e, newValue) => {
      setValue(newValue);
    };

    useEffect(() => { 
        getGoldRate();
        getTimeRate();
     }, []);

    const getGoldRate = async () => {
        try {
            const [vaultPda, _] = PublicKey.findProgramAddressSync(
                [Buffer.from('Account30')],
                programID
            );
            const data = await program.account.solAccount.fetch(vaultPda);
            const currentRate = data.goldToMpcValue.toString();
            setCurrentGoldToMpcValue(currentRate);
        } catch (error) {
            if (error) setIsGoldRate(true);
        }
    };

    const getTimeRate = async () => {
        try {
            const [vaultPda, _] = PublicKey.findProgramAddressSync(
                [Buffer.from('Account30')],
                programID
            );
            const data = await program.account.solAccount.fetch(vaultPda);
            const currentRate = data.goldToMpcValue.toString();
            setCurrentTimeToMpcValue(currentRate);
        } catch (error) {
            if (error) setIsTimeRate(true);
        }
    };

    const submitRateMPC = async () => {
        try {
            const [vaultPda, _] = PublicKey.findProgramAddressSync(
                [Buffer.from('Account30')],
                programID
            );

            if (isGoldRate || isTimeRate) {
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

            await getGoldRate();
            await getTimeRate()
            setRateGoldToMPC("");
            toggleGoldRateModal(false);
            toggleTimeRateModal(false);
        } catch (error) { console.log("******ERROR", error) }
    };

    const handleAddTokens = async () => {
        toggleAddTokensModal(true);
    };

    const submitAddTokens = async () => {
        try {
            const MPC = new PublicKey("Fp3kdVYE7BiVjkQNtcWHEjhpL5ntpoBiBuRZtT8figTJ");
            const [vaultPda] = PublicKey.findProgramAddressSync([Buffer.from('Account30')], programID);
            const [globalAta] = PublicKey.findProgramAddressSync([Buffer.from("escrowTokenAccount30")], programID);
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
            setAddTokens("")
        } catch (error) { console.log("******ERROR", error) }
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
                        <TabContext value={value}>
                                <TabList onChange={handleChange} aria-label="lab API tabs example">
                                    <Tab label="MPC To Gold Coin" value="mpc-to-gold" />
                                    <Tab label="MPC To Time Coin" value="mpc-to-time" />
                                    <Tab label="Add Tokens To Wallet" value="token-to-wallet" />
                                </TabList>
                            <TabPanel value="mpc-to-gold">
                                <div className="current-rate"> <h2>CONVERSION RATE</h2></div>
                                <div className="d-flex justify-content-around align-items-end">
                                    <h4 style={{ marginBottom: '0px' }}>1 MPC Tokens = {currentGoldToMpcValue} Gold Coin</h4>
                                    <button className="submit-button" onClick={() => toggleGoldRateModal(true)}>Change</button>
                                </div>
                            </TabPanel>
                            <TabPanel value="mpc-to-time">
                                <div className="current-rate"> <h2>CONVERSION RATE</h2></div>
                                <div className="d-flex justify-content-around align-items-end">
                                    <h4 style={{ marginBottom: '0px' }}>1 MPC Tokens = {currentTimeToMpcValue} Time Coin</h4>
                                    <button className="submit-button" onClick={() => toggleTimeRateModal(true)}>Change</button>
                                </div>
                            </TabPanel>
                            <TabPanel value="token-to-wallet">
                                <div className="d-flex justify-content-around align-items-end">
                                    <h4 style={{ marginBottom: '0px' }}>Admin MPC Tokens = 0 MPC Tokens</h4>
                                    <button className="submit-button" onClick={() => handleAddTokens()}>Add</button>
                                </div>
                            </TabPanel>
                        </TabContext>
                    </div>

                    {/* CONVERSION GOLD RATE MODAL */}
                    <Modal isOpen={goldRateModal} toggle={() => toggleGoldRateModal(false)} className="main-modal reward-modal">
                        <ModalHeader toggle={() => toggleGoldRateModal(false)}>
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
                                        <label className='text-white'>{isGoldRate ? 'Set ' : 'Update '} Gold to MPC Token Conversion Rate</label>
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

                    {/* CONVERSION TIME RATE MODAL */}
                    <Modal isOpen={timeRateModal} toggle={() => toggleTimeRateModal(false)} className="main-modal reward-modal">
                        <ModalHeader toggle={() => toggleTimeRateModal(false)}>
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
                                        <label className='text-white'>{isTimeRate ? 'Set ' : 'Update '} Time to MPC Token Conversion Rate</label>
                                        <div className="input-group-inline">
                                            <input
                                                type="number"
                                                value={rateTimeToMPC}
                                                placeholder="Enter the conversion rate"
                                                onChange={(e) => setRateTimeToMPC(e.target.value)}
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
                        <ModalBody className="modal-body reward-modal-body" style={{ paddingBottom: '0px' }}>
                            <div className="row justify-content-center mt-4 mb-4">
                                <div className="col-12 d-flex align-items-center justify-content-between">
                                    <div className="input-group-inline w-75">
                                        <input
                                            type="number"
                                            value={addTokens}
                                            onChange={(e) => setAddTokens(e.target.value)}
                                            placeholder="Enter MPC Tokens"
                                        />
                                    </div>
                                    <button className="submit-btn px-5 py-2" onClick={() => submitAddTokens()}>Submit</button>
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
