import React, { useMemo, useState, useEffect } from 'react';
import './index.css';
import { ConnectionProvider, WalletProvider, useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { Program, web3, AnchorProvider, BN } from '@project-serum/anchor';
import marketplaceABI from '../../store/contract/development/newSwap.json'; // Path to your IDL file
import { PublicKey, Connection } from "@solana/web3.js";

const { SystemProgram } = web3;
const programID = new PublicKey("CdEKZxHntobPE1VjfiqXgp2Av2rDmhGWV6JxGh5bQdx");
const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
const Marketplace = () => {

    // Create a network connection
    const network = clusterApiUrl('devnet');
    const wallets = useMemo(() => [new PhantomWalletAdapter()], []);
    const [goldToMpcValue, setGoldToMpcValue] = useState(0);

    const global = async () => {

        const provider = await getProvider()
        const program = new Program(marketplaceABI, programID, provider);
        const [vaultPda, _] = await PublicKey.findProgramAddressSync(
            [Buffer.from('Account20')],
            programID
        );
        const tx = await program.rpc.globalAccount(new BN(goldToMpcValue), {
            accounts: {
                vault: vaultPda,
                admin: provider.wallet.publicKey,
                systemProgram: SystemProgram.programId
            },
        });
        console.log("********TX", tx);
    }

    const getRate = async () => {
        const provider = await getProvider()
        const program = new Program(marketplaceABI, programID, provider);
        const [vaultPda, _] = await PublicKey.findProgramAddressSync(
            [Buffer.from('Account20')],
            programID
        );
        const data = await program.account.solAccount.fetch(vaultPda);
        console.log("********data", data.goldToMpcValue.toString());
    };

    const getProvider = () => {
        const provider = new AnchorProvider(connection, window.solana, AnchorProvider.defaultOptions());
        return provider;
    };

    return (
        <ConnectionProvider endpoint={network}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    <div className="swap-container">
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
                                    <button className="swap-button" onClick={getRate}>
                                        Current Rate
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>

    );
}

export default Marketplace;
