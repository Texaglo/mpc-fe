import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/navbar';
import Footer from '../../components/footer';
import { ApiUrl } from '../../store/config';
import './index.css';

const storageKey = 'mpc-native-mint-request-v1';
export async function mintApi(path, body) {
  const response = await fetch(`${ApiUrl}/mint/${path}`, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : undefined);
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'The mint service is unavailable.');
  return data;
}
export default function Mint() {
  const [config, setConfig] = useState(null), [wallet, setWallet] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [receipt, setReceipt] = useState(null);
  const [pending, setPending] = useState(() => { try { return JSON.parse(sessionStorage.getItem(storageKey)); } catch (e) { return null; } });
  useEffect(() => { mintApi('config').then(setConfig).catch(e => setError(e.message)); }, []);
  async function mint() {
    setBusy(true); setError('');
    try {
      const provider = window.phantom?.solana || window.solana;
      if (!provider?.connect || !provider?.signMessage) throw new Error('Open this page with a Solana wallet such as Phantom installed.');
      const connected = await provider.connect(), address = connected.publicKey.toString();
      setWallet(address);
      let signed = pending;
      if (signed && signed.wallet !== address) throw new Error('Reconnect the wallet that started the pending mint, or finish it before changing wallets.');
      if (!signed) {
        const challenge = await mintApi('challenge', { wallet: address });
        const result = await provider.signMessage(new TextEncoder().encode(challenge.message), 'utf8');
        signed = { wallet: address, requestId: challenge.requestId, signature: btoa(String.fromCharCode(...result.signature)) };
        sessionStorage.setItem(storageKey, JSON.stringify(signed)); setPending(signed);
      }
      const result = await mintApi('submit', signed);
      setReceipt(result);
      sessionStorage.removeItem(storageKey); setPending(null);
    } catch (e) {
      setError(e.message);
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        try {
          const current = await mintApi(`requests/${JSON.parse(saved).requestId}`);
          if (current.status === 'issued' && new Date(current.expiresAt) < new Date()) {
            sessionStorage.removeItem(storageKey); setPending(null);
          }
        } catch (ignored) { /* Keep pending authorization if status cannot be verified. */ }
      }
    }
    finally { setBusy(false); }
  }
  return <div className="native-mint-page"><Navbar sticky hideWallet />
    <main className="native-mint-content">
      <span className="native-mint-label">MODERN POKER CLUB · NFT COLLECTION</span>
      <h1>Mint an MPC NFT.</h1>
      <p>Receive a randomly selected NFT directly on Solana. Already own an eligible Ethereum NFT? <Link to="/bridge">Migrate your NFT</Link>.</p>
      <section className="native-mint-card" aria-label="Mint details">
        <span className="native-mint-badge">{config?.enabled ? 'DEVNET TESTING' : 'MINTING UNAVAILABLE'}</span>
        <h2>Random mint on Solana.</h2>
        {config?.enabled ? <>
          <p>Test pool: #{config.firstTokenId}–#{config.lastTokenId}. Your NFT is chosen randomly from the remaining IDs.</p>
          <dl><div><dt>Mint price</dt><dd>Free on devnet</dd></div><div><dt>Network costs</dt><dd>Sponsored for testing</dd></div><div><dt>Wallet allowance</dt><dd>{config.perWalletLimit} test NFTs</dd></div></dl>
          <p className="native-mint-note">These are test NFTs on Solana devnet. They are not mainnet NFTs. Signing the mint message authorizes one mint and does not transfer funds from your wallet.</p>
          <button disabled={busy} onClick={mint}>{busy ? 'Confirming your mint…' : pending ? 'Retry pending mint' : 'Connect wallet & mint'}</button>
        </> : <p>{config?.message || 'Checking mint availability…'}</p>}
        {wallet && <p className="native-mint-wallet">Wallet: {wallet}</p>}
        {error && <p role="alert" className="native-mint-error">{error}</p>}
        {receipt && <div role="status" className="native-mint-receipt"><h3>Your NFT: #{receipt.tokenId}</h3><p>Mint confirmed on devnet.</p><a href={`https://explorer.solana.com/address/${receipt.assetAddress}?cluster=devnet`} target="_blank" rel="noopener noreferrer">View NFT on Solana Explorer</a>{receipt.transactionHash && <p><a href={`https://explorer.solana.com/tx/${receipt.transactionHash}?cluster=devnet`} target="_blank" rel="noopener noreferrer">View transaction</a></p>}</div>}
      </section>
      {config?.migration && <aside className="native-mint-policy"><h2>Existing holders are protected.</h2><p>Ethereum IDs #{config.migration.firstEligibleTokenId}–#{config.migration.lastEligibleTokenId} remain eligible for migration. Ethereum mints above that locked cutoff cannot migrate. New Solana mint identities start at #{config.migration.firstNativeTokenId}.</p><p>Mainnet minting is not open yet. Devnet testing never requires burning an Ethereum NFT.</p></aside>}
    </main><Footer /></div>;
}
