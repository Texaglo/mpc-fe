import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './index.css';
import '../ClubHomepage/desktop.css';
import hero from './assets/hero.png';
import logo3d from './assets/logo-3d.png';
import logo from './assets/logo.png';
import chip from './assets/chip.png';
import fish from './assets/fish.png';
import donkey from './assets/donkey.png';
import whale from './assets/whale.png';
import shark from './assets/shark.png';

const playUrl = 'https://main.du6evc0snv7lm.amplifyapp.com/';
const discordUrl = 'https://discord.gg/PqqdrwTxFn';
const youtubeUrl = 'https://www.youtube.com/@modernpokerclub7637';
const personalities = [
  {name:'Fish', image:fish, copy:'The noob beginner. Learning the ropes, asking questions, and chasing that first great hand.', rate:3, stakes:'$0.05 / $0.10'},
  {name:'Donkey', image:donkey, copy:'The risk taker. Wild instincts, fearless calls, and one more hand—always.', rate:6, stakes:'$0.25 / $0.50'},
  {name:'Whale', image:whale, copy:'The rich poker player. Splashing pots, bringing the action, and making every table bigger.', rate:10, stakes:'$1 / $2'},
  {name:'Shark', image:shark, copy:'The calculated pro. Studies the game, tracks the details, and makes every decision count.', rate:18, stakes:'$5 / $10'},
];
const External = ({href, children, ...props}) => <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
const Play = ({className=''}) => <External href={playUrl} className={`club-play ${className}`}>Play Free</External>;
export default function ClubHomepage() {
  const [menuOpen,setMenuOpen]=useState(false);
  useEffect(()=>{ const previous=document.title; document.title='Modern Poker Club — Play. Collect. Belong.'; return ()=>{document.title=previous;}; },[]);
  return <div className="club-site">
    <a className="club-skip" href="#club-main">Skip to content</a>
    <header className="club-header">
      <a className="club-brand" href="#club-main" aria-label="Modern Poker Club home"><img src={logo} alt="Modern Poker Club"/><img src={chip} alt=""/></a>
      <button className="club-menu-toggle" aria-expanded={menuOpen} aria-controls="club-navigation" onClick={()=>setMenuOpen(!menuOpen)}>{menuOpen?'Close':'Menu'} <span aria-hidden="true">☰</span></button>
      <nav id="club-navigation" aria-label="Main navigation" className={menuOpen?'is-open':''}>
        <div className="club-nav-group"><a href="#club-main" className="is-active" onClick={()=>setMenuOpen(false)}>The Club</a><Link to="/mint" title="Coming soon" data-coming-soon="Coming soon">NFT Membership</Link><Link to="/legal">Rules &amp; Legal</Link></div>
        <External href={discordUrl} className="club-discord">Discord</External>
      </nav>
      <Play className="club-header-play"/>
    </header>
    <main id="club-main">
      <section className="club-hero">
        <p className="club-eyebrow">Play. Collect. Belong</p>
        <h1><span className="club-sr-only">Modern Poker Club</span><img className="club-hero-logo" src={logo3d} alt=""/></h1>
        <img className="club-hero-art" src={hero} alt="Fish, Whale, Donkey and Shark playing poker together" fetchpriority="high"/>
        <h2>Every poker hand has a <em>story.</em></h2>
        <p className="club-intro">Play free poker. Rank up, improve. Compete for your faction.<br/>Optional ModernPokerClub NFTs bring personality and in-game goodies.</p>
        <div className="club-hero-actions"><Play/><Link className="club-button" to="/mint" title="Coming soon" data-coming-soon="Coming soon">Explore Genesis</Link></div>
      </section>
      <section className="club-section club-membership" id="membership">
        <p className="club-eyebrow">Enter Modern Poker Club</p><h2>Play. Compete. <em>Own.</em></h2>
        <div className="club-steps">
          <article className="club-step"><span className="club-step-number">01</span><h3>Play poker</h3><p>Free Play is the easiest way into ModernPokerClub. Play Poker. Rank up, track stats, review hands, and improve.</p><External href={playUrl}>Play now →</External></article>
          <article className="club-step"><span className="club-step-number">02</span><h3>Compete &amp; represent</h3><p>Declare your loyalty to a faction. Compete in Faction Wars. Earn personal progress and Faction Points for your team.</p><Link to="/mint" title="Coming soon" data-coming-soon="Coming soon">Explore Genesis →</Link></article>
          <article className="club-step"><span className="club-step-number">03</span><h3>Own your identity</h3><p>Collect a Genesis NFT. Qualifying Genesis NFTs can serve as MPC membership credentials and unlock holder benefits, identity features, and future club perks.</p></article>
        </div>
      </section>
      <section className="club-section club-personalities">
        <p className="club-eyebrow">Four characters / one table</p><h2>Which regular are <em>you?</em></h2><p className="club-intro">Four poker personalities. Find the character that feels like you.</p>
        <div className="club-personality-grid">{personalities.map(p=><article key={p.name}><img src={p.image} alt={`${p.name} faction emblem`} loading="lazy"/><h3>{p.name}</h3><p>{p.copy}</p></article>)}</div>
      </section>
      <section className="club-section club-cash">
        <p className="club-eyebrow">Texas member cash poker</p><h2>Time-based. <em>No rake.</em></h2><p className="club-intro">The cash-game UI stays hidden until the member<br/>satisfies every required access check.</p>
        <ol className="club-access-steps">{['Membership agreement','Qualifying NFT','KYC','Texas geolocation','Cash lobby visible'].map((s,i)=><li key={s}>{i>0&&<span aria-hidden="true">{i===4?'→':'+'}</span>}<strong>{s}</strong></li>)}</ol>
        <div className="club-pricing club-panel"><p className="club-eyebrow">Table-time pricing</p><h3>Choose a table. Pay for time.</h3><p>MPC does not take a percentage of pots or player winnings. Table-time is fixed by table and independent of hand outcomes.</p>
          <div className="club-price-grid">{personalities.map(p=><article key={p.name}><img src={p.image} alt=""/><h4>{p.name}</h4><div><strong>${p.rate}<small>/hr</small></strong><span>{p.stakes}</span></div></article>)}</div>
        </div>
        <div className="club-verification club-panel"><p className="club-eyebrow">Verified play</p><h3>Identity, location &amp; integrity.</h3><p>We use GeoComply’s geolocation, device, fraud, and poker-integrity tooling as part of the access and anti-cheat stack.</p>
          <div className="club-verification-list">{[['Agreement + KYC','ModernPokerClub membership agreement acceptance + Verify the member behind the account.'],['GeoComply','Texas location, spoofing prevention, device intelligence, fraud signals.'],['Poker integrity','Bots, RTA, prohibited tools, collusion, multi-accounting, and account abuse.']].map(([title,copy])=><article key={title}><h4>{title}</h4><p>{copy}</p></article>)}</div>
        </div>
      </section>
      <section className="club-section club-founder"><p className="club-eyebrow">Founder / StickyRice</p><h2>The stories behind the <em>club.</em></h2><p className="club-intro">Watch the poker journey with StickyRice, founder of MPC.<br/>Follow the hands on YouTube and join the community on Discord.</p><div className="club-founder-actions"><External href={youtubeUrl} className="club-button club-button-gold">Subscribe to StickyRice</External><External href={discordUrl} className="club-button">Join the MPC Discord</External></div></section>
    </main>
    <footer className="club-footer" id="club-legal"><nav aria-label="Footer navigation"><a href="#club-main">The Club</a><Link to="/mint" title="Coming soon" data-coming-soon="Coming soon">Genesis NFTs</Link><Link to="/legal">Rules &amp; Legal</Link><External href={discordUrl}>Discord</External></nav><p>Free-play chips have no cash value. Free play is limited to supported jurisdictions. Texas cash games are available only to eligible verified MPC members. © Modern Poker Club</p><nav className="club-policy-links" aria-label="Legal policies"><Link to="/legal?document=privacy-policy">Privacy</Link><Link to="/legal?document=responsible-social-gameplay-policy">Responsible Play</Link><Link to="/legal?document=customer-acceptance-policy">Member eligibility</Link></nav></footer>
  </div>;
}
