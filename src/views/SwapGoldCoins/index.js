import './index.css';
import { web3, BN } from '@project-serum/anchor';
import { SwapAddress } from "../../store/contract/index";
import { PublicKey, clusterApiUrl } from "@solana/web3.js";
import React, { useMemo, useState, useEffect } from 'react';
import { program, provider } from "../../store/solanaProvider";
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";


// const { SystemProgram } = web3;
const programID = new PublicKey(SwapAddress);

const Swap = () => {

    const network = clusterApiUrl('devnet');
    const wallets = useMemo(() => [new PhantomWalletAdapter()], []);
    const [goldToMpcValue, setGoldToMpcValue] = useState("");
    const [newGoldToMpcValue, setNewGoldToMpcValue] = useState("");
    const [currentGoldToMpcValue, setCurrentGoldToMpcValue] = useState(0);
    const [goldAmount, setGoldAmount] = useState(0);
    const [mpcAmount, setMpcAmount] = useState(0);
    const [mpc, setMpc] = useState("");


    useEffect(() => {
        getRate()
    }, []);

    const global = async () => {
        try {
            const [vaultPda, _] = PublicKey.findProgramAddressSync(
                [Buffer.from('Account20')],
                programID
            );
            const tx = await program.rpc.globalAccount(new BN(goldToMpcValue), {
                accounts: {
                    vault: vaultPda,
                    admin: provider.wallet.publicKey,
                    systemProgram: web3.SystemProgram.programId
                },
            });
            console.log("Transaction: ", tx);
            setGoldToMpcValue("")
            getRate()
        } catch (error) {
            console.log("******ERROR", error);
        }
    };

    const UpdateGoldValue = async () => {
        try {
            const [vaultPda, _] = PublicKey.findProgramAddressSync(
                [Buffer.from('Account20')],
                programID
            );
            const tx = await program.rpc.updateGoldValue(new BN(newGoldToMpcValue), {
                accounts: {
                    vault: vaultPda,
                    admin: provider.wallet.publicKey
                },
            });
            console.log("Transaction: ", tx);
            setNewGoldToMpcValue("")
            getRate()
        } catch (error) {
            console.log("******ERROR", error);
        }
    };

    const getRate = async () => {
        const [vaultPda, _] = PublicKey.findProgramAddressSync(
            [Buffer.from('Account20')],
            programID
        );
        const data = await program.account.solAccount.fetch(vaultPda);
        const currentRate = data.goldToMpcValue.toString();
        setCurrentGoldToMpcValue(currentRate);
    };

    const adminAddMpc = async () => {
        try {
            const MPC = new PublicKey("Fp3kdVYE7BiVjkQNtcWHEjhpL5ntpoBiBuRZtT8figTJ");
            const [vaultPda] = PublicKey.findProgramAddressSync([Buffer.from('Account20')], programID);
            const [globalAta] = PublicKey.findProgramAddressSync([Buffer.from("escrowTokenAccount20")], programID);
            const mpcAdminAta = await getAssociatedTokenAddress(MPC, provider.wallet.publicKey);

            const tx = await program.rpc.adminAddMpc(new BN(mpc), {
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
            setMpc("")
        } catch (error) {
            console.log("******ERROR", error);
        }
    };

    const handleGoldSwap = (e) => {
        const goldInput = e.target.value;
        setGoldAmount(goldInput);
        const mpc = goldInput / currentGoldToMpcValue;
        setMpcAmount(mpc);
    };

    return (
        <ConnectionProvider endpoint={network}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    <div className="swap-container">
                        <div className="current-rate">
                            <h2>Current Rate: {currentGoldToMpcValue}</h2>
                        </div>
                        <div className="swap-box">
                            <div className="rate-controls">
                                <div className="input-group">
                                    <label>Set Conversion Rate:</label>
                                    <input
                                        type="number"
                                        value={goldToMpcValue}
                                        onChange={(e) => setGoldToMpcValue(e.target.value)}
                                        placeholder="Enter new rate"
                                    />
                                    <button className="swap-button" onClick={global}>
                                        Set Rate
                                    </button>

                                    <input
                                        type="number"
                                        value={newGoldToMpcValue}
                                        onChange={(e) => setNewGoldToMpcValue(e.target.value)}
                                        placeholder="Enter new rate"
                                    />
                                    <button className="swap-button" onClick={UpdateGoldValue}>
                                        Update Rate
                                    </button>
                                </div>
                            </div>
                        </div>
                        {/* New section for admin add mpc */}
                        <div className="gold-to-mpc">
                            <h3>Admin Add MPC Token</h3>
                            <div className="input-group">
                                <label>MPC Amount:</label>
                                <input
                                    type="number"
                                    value={mpc}
                                    onChange={(e) => setMpc(e.target.value)}
                                    placeholder="Enter MPC Amount"
                                />
                                <div className="current-rate">
                                    <button className="swap-button" onClick={adminAddMpc}>
                                        Submit
                                    </button>
                                </div>
                            </div>
                        </div>
                        {/* New section for swapping Gold to MPC */}
                        <div className="gold-to-mpc">
                            <h3>Swap Gold to MPC</h3>
                            <div className="input-group">
                                <label>Gold Amount:</label>
                                <input
                                    type="number"
                                    value={goldAmount}
                                    onChange={handleGoldSwap}
                                    placeholder="Enter Gold amount"
                                />
                                <div className="current-rate">
                                    <button className="swap-button" onClick={global}>
                                        Swap
                                    </button>
                                </div>
                                {/* <div className="current-rate">
                                    <h3>MPC You Will Receive: {mpcAmount.toFixed(2)}</h3>
                                </div> */}
                            </div>
                        </div>
                    </div>
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
}

export default Swap;
