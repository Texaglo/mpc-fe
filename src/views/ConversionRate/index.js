import EventBus from 'eventing-bus';
import { web3, BN } from '@project-serum/anchor';
import { PublicKey, clusterApiUrl } from "@solana/web3.js";
import { Modal, ModalHeader, ModalBody } from "reactstrap";
import React, { useMemo, useState, useEffect } from 'react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import Box from '@mui/material/Box';
import { ThemeProvider } from '@mui/material/styles';
import Loader from "../../components/Loader/index"

import './index.css';
import { SwapAddress } from "../../store/contract/index";
import { program, provider } from "../../store/solanaProvider";

import { useDispatch, useSelector } from 'react-redux';
import { setLoader } from "../../store/actions/Auth";

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
    const [hardWalletTokens, sethardWalletTokens] = useState(0);
    const [currentGoldToMpcValue, setCurrentGoldToMpcValue] = useState(0);
    const [currentTimeToMpcValue, setCurrentTimeToMpcValue] = useState(0);
    const [value, setValue] = React.useState('mpc-to-gold');

    const dispatch = useDispatch();
    const { isLoader } = useSelector(({ Auth }) => ({
        isLoader: Auth.isLoader
    }))

    const handleChange = (e, newValue) => {
        setValue(newValue);
    };

    useEffect(() => {
        getGoldRate();
        getTimeRate();
        getMPCTokens();
    }, []);

    const getGoldRate = async () => {
        try {
            const [vaultPda, _] = PublicKey.findProgramAddressSync(
                [Buffer.from('Account50')],
                programID
            );
            const data = await program.account.solAccount.fetch(vaultPda);
            const currentRate = data.goldToMpcValue.toString();
            setCurrentGoldToMpcValue(currentRate);
        } catch (error) {
            if (error) setIsGoldRate(true);
        }
    };
    const getMPCTokens = async () => {
        try {
            const [vaultPda, _] = PublicKey.findProgramAddressSync(
                [Buffer.from('Account50')],
                programID
            );
            const data = await program.account.solAccount.fetch(vaultPda);
            const currentTokens = data.mpcCoins.toString();
            sethardWalletTokens(currentTokens);
        } catch (error) {
            if (error) setIsGoldRate(true);
        }
    };

    const getTimeRate = async () => {
        try {
            const [vaultPda, _] = PublicKey.findProgramAddressSync(
                [Buffer.from('vault02')],
                programID
            );
            const data = await program.account.coins.fetch(vaultPda);
            const currentRate = data.timeCoins.toString();
            setCurrentTimeToMpcValue(currentRate);
        } catch (error) {
            if (error) setIsTimeRate(true);
        }
    };

    const submitGoldRateMPC = async () => {
        try {
            dispatch(setLoader(true));
            const [vaultPda, _] = PublicKey.findProgramAddressSync(
                [Buffer.from('Account50')],
                programID
            );
            if (isGoldRate) {
                const tx = await program.rpc.globalAccount(new BN(rateGoldToMPC), {
                    accounts: {
                        vault: vaultPda,
                        admin: provider.wallet.publicKey,
                        systemProgram: web3.SystemProgram.programId
                    },
                });
                console.log("*****Set Rate Transaction: ", tx);
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
            setRateTimeToMPC("");
            toggleGoldRateModal(false);
            dispatch(setLoader(false));
        } catch (error) { console.log("******ERROR", error); dispatch(setLoader(false)); }
    };

    const submitTimeRateMPC = async () => {
        try {
            dispatch(setLoader(true));
            const [valuesPDA] = PublicKey.findProgramAddressSync(
                [Buffer.from('vault02')],
                programID
            );
            if (isTimeRate) {
                const tx = await program.rpc.setCoinsValues(new BN(rateTimeToMPC), {
                    accounts: {
                        values: valuesPDA,
                        admin: provider.wallet.publicKey,
                        systemProgram: web3.SystemProgram.programId
                    },
                });
                console.log("*****Set Rate Transaction: ", tx);
            }
            else {
                const tx = await program.rpc.updateCoinsValues(new BN(rateTimeToMPC), {
                    accounts: {
                        values: valuesPDA,
                        admin: provider.wallet.publicKey,
                        systemProgram: web3.SystemProgram.programId
                    },
                });
                console.log("*****Set Updated Rate Transaction: ", tx);
            }

            await getTimeRate();
            setRateGoldToMPC("");
            toggleTimeRateModal(false);
            dispatch(setLoader(false));
        } catch (error) { console.log("******ERROR", error); dispatch(setLoader(false)); }
    };

    const handleAddTokens = async () => {
        toggleAddTokensModal(true);
    };

    const submitAddTokens = async () => {
        try {
            dispatch(setLoader(true));
            const MPC = new PublicKey("Fp3kdVYE7BiVjkQNtcWHEjhpL5ntpoBiBuRZtT8figTJ");
            const [vaultPda] = PublicKey.findProgramAddressSync([Buffer.from('Account50')], programID);
            const [globalAta] = PublicKey.findProgramAddressSync([Buffer.from("escrowTokenAccount50")], programID);
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
            console.log("*****Set Updated Rate Transaction: ", tx);
            await getMPCTokens()
            setAddTokens("")
            dispatch(setLoader(false));
        } catch (error) { console.log("******ERROR", error); dispatch(setLoader(false)); }
    };

    return (
        <ConnectionProvider endpoint={network}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    {isLoader ? <Loader /> : null}
                    <ThemeProvider
                        theme={{
                            palette: {
                                primary: {
                                    main: '#A9A9A9',
                                    dark: '#A0A0A0',
                                },
                            },
                        }}
                    >
                        <Box className="swap-container mt-5"
                            sx={{
                                width: 750,
                                borderRadius: 1,
                                bgcolor: 'primary.main',
                                '&:hover': {
                                    bgcolor: 'primary.dark',
                                },
                            }}
                        >
                            <div className="current-rate"> <h2>MPC TO GOLD COIN CONVERSION RATE</h2></div>
                            <div className="d-flex justify-content-around align-items-end">
                                <h4 style={{ marginBottom: '0px' }}>1 MPC Tokens = {currentGoldToMpcValue} Gold Coin</h4>
                                <button className="submit-button" onClick={() => toggleGoldRateModal(true)}>Change</button>
                            </div>
                        </Box>
                        <Box className="swap-container mt-5"
                            sx={{
                                width: 750,
                                borderRadius: 1,
                                bgcolor: 'primary.main',
                                '&:hover': {
                                    bgcolor: 'primary.dark',
                                },
                            }}
                        >
                            <div className="current-rate"> <h2>MPC TO TIME COIN CONVERSION RATE</h2></div>
                            <div className="d-flex justify-content-around align-items-end">
                                <h4 style={{ marginBottom: '0px' }}>1 MPC Tokens = {currentTimeToMpcValue} Time Coin</h4>
                                <button className="submit-button" onClick={() => toggleTimeRateModal(true)}>Change</button>
                            </div>
                        </Box>
                        <Box className="swap-container mt-5"
                            sx={{
                                width: 750,
                                borderRadius: 1,
                                bgcolor: 'primary.main',
                                '&:hover': {
                                    bgcolor: 'primary.dark',
                                },
                            }}
                        >
                            <div className="current-rate"> <h2>ADD MPC TO HOT WALLETS</h2></div>
                            <div className="d-flex justify-content-around align-items-end">
                                <h4 style={{ marginBottom: '0px' }}>Admin MPC Tokens = {hardWalletTokens} MPC Tokens</h4>
                                <button className="submit-button" onClick={() => handleAddTokens()}>Add</button>
                            </div>
                        </Box>
                    </ThemeProvider>
                    {/* CONVERSION GOLD RATE MODAL */}
                    <Modal isOpen={goldRateModal} toggle={() => { toggleGoldRateModal(false); dispatch(setLoader(false)); }} className="main-modal reward-modal">
                        <ThemeProvider
                            theme={{
                                palette: {
                                    primary: {
                                        main: '#A9A9A9',
                                        dark: '#A0A0A0',
                                    },
                                },
                            }}
                        >
                            <Box sx={{
                                width: 750,
                                borderRadius: 1,
                                bgcolor: 'primary.main',
                                '&:hover': {
                                    bgcolor: 'primary.dark',
                                },
                            }}
                            >
                                <ModalHeader toggle={() => { toggleGoldRateModal(false); dispatch(setLoader(false)); }} >
                                    <div className="reward-modal-logo">
                                        <img src={require('../../assets/img/logo.png')} alt="modal-logo" />
                                    </div>
                                    <div className="reward-modal-title"><p>MPC TO GOLD COIN CONVERSION RATE</p></div>
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
                                                <span style={{ color: '#4d4dff' }}>1 MPC Tokens = {currentGoldToMpcValue} Gold Coin</span>
                                            </div>
                                        </div>
                                        <div className="col-12 mt-2 d-flex justify-content-around">
                                            <button className="submit-button" onClick={() => submitGoldRateMPC()}>Submit</button>
                                        </div>
                                    </div>
                                </ModalBody>
                            </Box>
                        </ThemeProvider>
                    </Modal>

                    {/* CONVERSION TIME RATE MODAL */}
                    <Modal isOpen={timeRateModal} toggle={() => { toggleTimeRateModal(false); dispatch(setLoader(false)); }} className="main-modal reward-modal">
                        <ThemeProvider
                            theme={{
                                palette: {
                                    primary: {
                                        main: '#A9A9A9',
                                        dark: '#A0A0A0',
                                    },
                                },
                            }}
                        >
                            <Box sx={{
                                width: 750,
                                borderRadius: 1,
                                bgcolor: 'primary.main',
                                '&:hover': {
                                    bgcolor: 'primary.dark',
                                },
                            }}
                            >
                                <ModalHeader toggle={() => { toggleTimeRateModal(false); dispatch(setLoader(false)); }}>
                                    <div className="reward-modal-logo">
                                        <img src={require('../../assets/img/logo.png')} alt="modal-logo" />
                                    </div>
                                    <div className="reward-modal-title"><p>MPC TO TIME COIN CONVERSION RATE</p></div>
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
                                                <span style={{ color: '#4d4dff' }}>1 MPC Tokens = {currentTimeToMpcValue} Time Coin</span>
                                            </div>
                                        </div>
                                        <div className="col-12 mt-2 d-flex justify-content-around">
                                            <button className="submit-button" onClick={() => submitTimeRateMPC()}>Submit</button>
                                        </div>
                                    </div>
                                </ModalBody>
                            </Box>
                        </ThemeProvider>
                    </Modal>

                    {/* ADD ADMIN TOKENS MODAL */}
                    <Modal isOpen={addTokensModal} toggle={() => { setAddTokens(""); toggleAddTokensModal(false); dispatch(setLoader(false)); }} className="main-modal reward-modal">
                        <ThemeProvider
                            theme={{
                                palette: {
                                    primary: {
                                        main: '#A9A9A9',
                                        dark: '#A0A0A0',
                                    },
                                },
                            }}
                        >
                            <Box sx={{
                                width: 750,
                                borderRadius: 1,
                                bgcolor: 'primary.main',
                                '&:hover': {
                                    bgcolor: 'primary.dark',
                                },
                            }}
                            >
                                <ModalHeader toggle={() => { setAddTokens(""); toggleAddTokensModal(false); dispatch(setLoader(false)); }}>
                                    <div className="reward-modal-logo">
                                        <img src={require('../../assets/img/logo.png')} alt="modal-logo" />
                                    </div>
                                    <div className="reward-modal-title"><p>ADD MPC TO HOT WALLETS</p></div>
                                    <div className="reward-modal-line"> <hr /></div>
                                </ModalHeader>
                                <ModalBody className="modal-body reward-modal-body" style={{ paddingBottom: '0px' }}>
                                    <div className="row justify-content-center mt-4 mb-4">
                                        <div className="col-12">
                                            <div className="input-group">
                                                <div className="input-group-inline w-75">
                                                    <input
                                                        type="number"
                                                        value={addTokens}
                                                        onChange={(e) => setAddTokens(e.target.value)}
                                                        placeholder="Enter MPC Tokens"
                                                    />
                                                </div>
                                                <span style={{ color: '#4d4dff' }}>Admin MPC Tokens = {hardWalletTokens} MPC Tokens</span>
                                            </div>
                                            <div className="col-12 mt-2 d-flex justify-content-around">
                                                <button className="submit-button" onClick={() => submitAddTokens()}>Submit</button>
                                            </div>
                                        </div>
                                    </div>
                                </ModalBody>
                            </Box>
                        </ThemeProvider>
                    </Modal>
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
}

export default ConversionRate;
