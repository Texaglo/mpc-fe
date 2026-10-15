import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MembershipShell from '../ClubHomepage/MembershipShell';
import mystery from './genesis-mystery.png';
import { ApiUrl } from '../../store/config';
import './index.css';
import '../ClubHomepage/desktop.css';

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
  return <MembershipShell>
    <main id="mint-main" className="genesis-mint">
      <section className="genesis-introduction">
        <p className="club-eyebrow">Genesis mint / Solana</p>
        <h1><span className="mint-mobile-heading">Mint the latest <em>MPC Genesis</em> drop.</span><span className="mint-desktop-heading">Mint a random Genesis <em>identity.</em></span></h1>
        <div className="genesis-copy">
          <p>ModernPokerClub Genesis NFTs are capped at 10,000 unique 1-of-1 PFP collectibles.</p>
          <p>Genesis NFTs will be released through limited mint drops on announced dates. Follow the MPC Discord for drop announcements, mint times, pricing, and availability.</p>
          <p>Before a drop goes live, make sure you have a compatible Solana wallet funded and ready. Each mint is randomly assigned from the available drop pool, and quantities may be limited.</p>
          <p>Genesis holders receive the MPC Genesis holder role in Discord, access to holder-only perks and benefits as announced, and a persistent MPC identity that can carry season history and progression across the club.</p>
          <p>As MPC seasons evolve, your Genesis identity can record things like faction affiliation, season participation, rank snapshots, and notable competitive milestones.</p>
        </div>
        <section className="genesis-card" aria-label="Mint details">
          <img src={mystery} alt="Unrevealed Genesis poker character against a blue illuminated background" width="525" height="329"/>
          <dl className="genesis-facts">
            <div><dt>Total supply</dt><dd>10,000</dd></div>
            <div><dt>New mint begins</dt><dd>{config?.migration?.firstNativeTokenId != null ? `#${config.migration.firstNativeTokenId.toLocaleString()}` : 'TBA'}</dd></div>
            <div><dt>Current drop</dt><dd>{config?.enabled ? 'Devnet testing' : 'TBA'}</dd></div>
            <div><dt>Wallet limit</dt><dd>{config?.enabled ? `${config.perWalletLimit} test NFTs` : 'TBA'}</dd></div>
            <div><dt>Mint type</dt><dd>Random reveal</dd></div>
            <div><dt>Price</dt><dd>{config?.enabled ? 'Free on devnet' : 'TBA'}</dd></div>
          </dl>
        </section>
        <div className="genesis-mint-action" aria-live="polite">
          {config?.enabled ? <>
            <span className="genesis-status">DEVNET TESTING</span>
            <p>Test pool: #{config.firstTokenId}–#{config.lastTokenId}. Your NFT is chosen randomly from the remaining IDs.</p>
            <p className="genesis-test-note">These are test NFTs on Solana devnet, not mainnet NFTs. Network costs are sponsored for testing. Signing authorizes one mint and does not transfer funds from your wallet.</p>
            <button className="genesis-button" disabled title="NFT minting coming soon" onClick={mint}>Coming soon</button>
          </> : <>
            <button className="genesis-button" disabled title="NFT minting coming soon">Coming soon</button>
            <p>{config?.message || (error ? 'Mint availability could not be loaded. Please try again later.' : 'Checking mint availability…')}</p>
          </>}
          {wallet && <p className="genesis-wallet">Wallet: {wallet}</p>}
          {error && <p role="alert" className="genesis-error">{error}</p>}
          {receipt && <div role="status" className="genesis-receipt"><h3>Your NFT: #{receipt.tokenId}</h3><p>Mint confirmed on devnet.</p><a href={`https://explorer.solana.com/address/${receipt.assetAddress}?cluster=devnet`} target="_blank" rel="noopener noreferrer">View NFT on Solana Explorer</a>{receipt.transactionHash && <p><a href={`https://explorer.solana.com/tx/${receipt.transactionHash}?cluster=devnet`} target="_blank" rel="noopener noreferrer">View transaction</a></p>}</div>}
        </div>
      </section>
      <section className="club-section genesis-market">
        <p className="club-eyebrow">Magic Eden</p>
        <h2>View on <em>Magic Eden</em></h2>
        <p className="genesis-copy">Browse existing MPC Genesis collectibles listed by current holders.</p>
        <a className="genesis-button genesis-market-button" href="https://magiceden.io" target="_blank" rel="noopener noreferrer">View on Magic Eden</a>
      </section>
      <section className="club-section genesis-migration">
        <p className="club-eyebrow">Ethereum</p>
        <h2>Original Ethereum <em>holders?</em></h2>
        <div className="genesis-migration-card">
          <h3>Complete your Genesis migration</h3>
          <p>If you previously held an MPC Genesis NFT on Ethereum, use the migration flow to verify the original asset and receive the corresponding Solana Genesis NFT.</p>
          <Link to="/bridge" className="genesis-button">Migrate NFT</Link>
          {config?.migration && <div className="genesis-migration-policy"><p>Ethereum IDs #{config.migration.firstEligibleTokenId}–#{config.migration.lastEligibleTokenId} remain eligible for migration. Ethereum mints above that locked cutoff cannot migrate. New Solana mint identities start at #{config.migration.firstNativeTokenId}.</p><p>Mainnet minting is not open yet. Devnet testing never requires burning an Ethereum NFT.</p></div>}
        </div>
      </section>
    </main>
  </MembershipShell>;
}
