import EventBus from "eventing-bus";
import { connect } from 'react-redux';
import React, { Component } from 'react';

import './index.css';
import { web3 } from '../../store/web3';
import Navbar from '../../components/navbar';
import Footer from '../../components/footer';
import Loader from '../../components/loader-bridge';



class TermsConditions extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isLoading: false

        };
    };

    render() {
        let { sticky, } = this.props;
        return (
            <div className="mp-club-page" onWheel={this.onScroll}>
                {this.state.isLoading && (<Loader />)}
                <Navbar sticky={sticky} />
                <div className="bridge-modals trems-page">
                    {/* About Section */}
                    <section className="about-sec style-two">
                        <div className="auto-container">
                            <div className="row">
                                <div className="col-12">
                                    <div className="sec-title text-center">
                                        <h2><img src={require('../../static/images/new-landing/about-title.png')} alt='' /></h2>
                                    </div>

                                    <div className="about-text-area">
                                        <div className="about-inner">
                                            <div className="left-area">
                                                <div className="img-box">
                                                    <img src={require('../../static/images/new-landing/about-img.png')} alt='' />
                                                </div>
                                                <div className="social-links">
                                                    <a href="https://x.com/ModernPokerClub" className="social-link" target="_blank"><img src={require('../../static/images/new-landing/twitter-icon.png')} alt='' /></a>
                                                    <a href="https://opensea.io/collection/modernpokerclub" className="social-link opensea-link" target="_blank"><img src={require('../../static/images/new-landing/telegram-icon.png')} alt='' /></a>
                                                    <a href="https://discord.gg/PqqdrwTxFn" className="social-link" target="_blank"><img src={require('../../static/images/new-landing/discord-icon.png')} alt='' /></a>
                                                </div>
                                            </div>
                                            <div className="right-area">
                                                <div className="text-box">
                                                    <p>ModernPokerClub (MPC) is a <b>next-generation Web3 sweepstakes poker platform</b> blending traditional poker entertainment with NFTs, tokens, and a sweepstakes-compliant model. Our mission is to create a <b>fair, transparent, and engaging poker universe</b> where both Web2 and Web3 players can participate seamlessly.</p>
                                                    <p>MPC isn’t just another poker site — it’s a <b>community-driven ecosystem</b> that rewards players not only for skill at the tables, but for active participation in the culture and growth of the platform itself.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section >
                </div>

                <div className="bridge-modals trems-page">
                    <div className="auto-container">
                        <div className="row">
                            <div className="col-12">
                                <div className='content-area bridge-content-area'>
                                    <div className="trems-box">
                                        <div className="trems-inner">
                                            <h3>Our Core Model</h3>
                                            <p>MPC operates on a <b>sweepstakes + token hybrid model</b> to ensure legal compliance while offering a unique on-ramp for all types of players:</p>
                                            <ul>
                                                <li><b>Gold Coins (GC):</b> Free-to-play coins for casual ring games and tournaments. Players can win more GC and spend them in the marketplace.</li>
                                                <li><b>Sweepstakes Coins (SC):</b> Awarded with Gold Coin purchases (or through our mail-in entry system). SC are used in sweepstakes-enabled games for the chance to win redeemable prizes.</li>
                                                <li><b>MPCE Token:</b> A fixed-supply token (100M at launch) powering utility across the ecosystem — hourly play, NFT utility, marketplace use, and future staking/rakeback. MPCE will eventually bridge <b>online play, live clubs, and community ownership.</b></li>
                                            </ul>

                                            <h3>NFT Membership & Factions</h3>
                                            <p>MPC NFTs are <b>membership passes</b> that unlock premium benefits:</p>
                                            <ul>
                                                <li>Daily Gold Coin drops and discounts on sweepstakes play.</li>
                                                <li>Access to exclusive events, drops, and rewards.</li>
                                                <li>Each NFT belongs to a <b>Faction (Shark, Whale, Donkey, Fish),</b> adding gamified identity, memes, and lore to the poker experience.</li>
                                                <li>NFTs will migrate fully to <b>Solana</b> — ERC-721s will be burned and holders will receive equivalent Solana NFTs.</li>
                                            </ul>

                                            <h3>Ecosystem Flow</h3>
                                            <ol>
                                                <li>Players sign up and create an MPC account.</li>
                                                <li>Web2 players can purchase Gold Coins via USD (Stripe, PayKings, or alternate processors).</li>
                                                <li>Each purchase includes <b>Sweepstakes Coins (SC)</b> to access sweepstakes games.</li>
                                                <li>NFT holders enjoy bonus GC and reduced sweepstakes rates.</li>
                                                <li><b>MPCE Token</b> ties it all together — hourly play, marketplace items, staking/rewards (future).</li>
                                                <li>Winnings in SC can be redeemed for real prizes after KYC verification.</li>
                                                <li>Marketplace enables trading of NFTs, card protectors, 3D miniatures, and more.</li>
                                            </ol>

                                            <h3>Why MPC is Different</h3>
                                            <ul>
                                                <li><b>Sweepstakes Legal Model:</b> Like GlobalPoker, our structure is sweepstakes-compliant across most U.S. jurisdictions.</li>
                                                <li><b>Fair & Scalable:</b> Built on <b>Solana</b> for speed, transparency, and low fees.</li>
                                                <li><b>Community First:</b> NFTs and tokens grant true player utility while <b>factions</b> create culture, identity, and entertainment value.</li>
                                            </ul>

                                            <h3>Roadmap</h3>
                                            <ul>
                                                <li><b>Launch (September 7):</b> Online platform live with sweepstakes compliance, deposits, swaps, and NFT/token integration.</li>
                                                <li><b>Live Card Rooms:</b> Expansion into Texas private clubs, using MPCE for hourly play.</li>
                                                <li><b>VaultEcho Content Arm:</b> Production studio powering streams, marketing, and storytelling for MPC’s factions.</li>
                                                <li><b>Merch & Collectibles:</b> MPC-branded resin miniatures, card protectors, and apparel linked to NFTs, letting players rep their faction in real life.</li>
                                            </ul>

                                            <h3>Our Vision</h3>
                                            <p>MPC is building a <b>poker universe</b> where:</p>
                                            <ul>
                                                <li>Web2 players enjoy safe, legal sweepstakes play.</li>
                                                <li>Web3 players flex NFTs, earn token rewards, and trade in a custom marketplace.</li>
                                                <li>Factions (Sharks, Fish, Donkeys, Whales) add culture, memes, and identity to poker.</li>
                                                <li>The community benefits from true utility and ownership — with real-world crossover into live clubs, merch, and future expansions.</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <Footer />
            </div >
        );
    }
}



export default (TermsConditions);
