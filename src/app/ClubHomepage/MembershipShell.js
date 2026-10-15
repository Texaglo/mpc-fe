import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './index.css';
import logo from './assets/logo.png';
import chip from './assets/chip.png';
const discordUrl='https://discord.gg/PqqdrwTxFn';
const External=({children,...props})=><a target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
const Play=({className})=><External href="https://main.du6evc0snv7lm.amplifyapp.com/" className={`club-play ${className}`}>Play Free</External>;
export default function MembershipShell({children, active="mint", mainId="mint-main"}) {
 const [menuOpen,setMenuOpen]=useState(false);
 return <div className="club-site membership-site"><a className="club-skip" href={`#${mainId}`}>Skip to content</a>
    <header className="club-header">
      <a className="club-brand" href="/" aria-label="Modern Poker Club home"><img src={logo} alt="Modern Poker Club"/><img src={chip} alt=""/></a>
      <button className="club-menu-toggle" aria-expanded={menuOpen} aria-controls="club-navigation" onClick={()=>setMenuOpen(!menuOpen)}>{menuOpen?'Close':'Menu'} <span aria-hidden="true">☰</span></button>
      <nav id="club-navigation" aria-label="Main navigation" className={menuOpen?'is-open':''}>
        <div className="club-nav-group"><Link to="/">The Club</Link><Link to="/mint" title="Coming soon" data-coming-soon="Coming soon" className={active === "mint" ? "is-active" : undefined} aria-current={active === "mint" ? "page" : undefined}>NFT Membership</Link><Link to="/legal" className={active === "legal" ? "is-active" : undefined} aria-current={active === "legal" ? "page" : undefined} onClick={()=>setMenuOpen(false)}>Rules &amp; Legal</Link></div>
        <External href={discordUrl} className="club-discord">Discord</External>
      </nav>
      <Play className="club-header-play"/>
    </header>
{children}
    <footer className="club-footer" id="club-legal"><nav aria-label="Footer navigation"><a href="/">The Club</a><Link to="/mint" title="Coming soon" data-coming-soon="Coming soon">Genesis NFTs</Link><Link to="/legal">Rules &amp; Legal</Link><External href={discordUrl}>Discord</External></nav><p>Free-play chips have no cash value. Free play is limited to supported jurisdictions. Texas cash games are available only to eligible verified MPC members. © Modern Poker Club</p><nav className="club-policy-links" aria-label="Legal policies"><Link to="/legal?document=privacy-policy">Privacy</Link><Link to="/legal?document=responsible-social-gameplay-policy">Responsible Play</Link><Link to="/legal?document=customer-acceptance-policy">Member eligibility</Link></nav></footer>
</div>;
}
