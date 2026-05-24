import { connect } from 'react-redux';

import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import './index.css';
import '../../static/css/animate.css';
import 'owl.carousel/dist/assets/owl.carousel.css';

import Navbar from '../../components/navbar';
import Footer from '../../components/footer';
import { toggleLoader } from "../../store/actions/Auth";

const workflowSteps = [
    {
        title: 'Connect wallet',
        copy: 'Link your wallet to bring your MPC identity into the platform.',
        image: require('../../static/images/new-landing/how-it-works/connect-wallet.png'),
    },
    {
        title: 'Deposit crypto',
        copy: 'Fund your account so your balance is ready before you sit down.',
        image: require('../../static/images/new-landing/how-it-works/deposit-crypto.png'),
    },
    {
        title: 'Buy MPCE time',
        copy: 'Convert balance into table time instead of paying rake hand by hand.',
        image: require('../../static/images/new-landing/how-it-works/buy-mpce-time.png'),
    },
    {
        title: 'Join a table',
        copy: 'Choose a seat, load in, and play inside the MPC poker room.',
        image: require('../../static/images/new-landing/how-it-works/join-table.png'),
    },
    {
        title: 'Play poker',
        copy: 'Compete against other players while your session time runs.',
        image: require('../../static/images/new-landing/how-it-works/play-poker.png'),
    },
    {
        title: 'Withdraw balance',
        copy: 'Keep what you win and withdraw your available balance when finished.',
        image: require('../../static/images/new-landing/how-it-works/withdraw-balance.png'),
    },
];

const sectionArtwork = {
    migration: require('../../static/images/new-landing/section-art/nft-migration.png'),
    buyTime: require('../../static/images/new-landing/section-art/buy-time-mpce.png'),
    marketplace: require('../../static/images/new-landing/section-art/marketplace-preview.png'),
};

const marketplaceItems = [
    {
        title: 'Buy MPCE time',
        copy: 'Access tables through time-based play.',
    },
    {
        title: 'Cosmetics',
        copy: 'Personalize your look, gear, and table presence.',
    },
    {
        title: 'Avatars',
        copy: 'Bring MPC identity into the game.',
    },
    {
        title: 'Table skins',
        copy: 'Unlock branded poker rooms and custom table styles.',
    },
];

class MPokerClub extends Component {

    constructor(props) {
        super(props);
        this.state = {
            stage: 0,
            sticky: false,
            isNetwork: true,
            isPreSale: false,
            rate: '',
            nftPrice: '',
            quantity: 0,
            max: '',
            min: 0,
            mintItems: '',
            availableItems: '',
            contributions: '',
            openingTime: '',
            closingTime: '',
            address: localStorage.getItem('publicAddress'),
        };
    };



    componentWillReceiveProps({ publicAddress }) {
        this.setState({ address: publicAddress });
    };


    onScroll = () => {
        const { pageYOffset } = window;
        if (pageYOffset > 20) this.setState({ sticky: true });
        if (pageYOffset < 20) this.setState({ sticky: false });
    };

    render() {



        let { sticky } = this.state;

        return (
            <div className="mp-club-page" onWheel={this.onScroll}>
                <Navbar sticky={sticky} />
                {/* Banner Section */}
                <section id="home" className="banner-sec" style={{ backgroundImage: `url(${require("../../static/images/new-landing/banner-bg.png")})` }}>
                    <div className="container-fluid">
                        <div className="row">
                            <div className="banner-text col-lg-6 col-md-12">
                                <div className="banner-inner">
                                    <div className="title-icon">
                                        <div className="img-box">
                                            <img className="left-img" src={require('../../static/images/new-landing/logo-banner.png')} alt='' />
                                        </div>
                                    </div>

                                    <p className="hero-kicker">Time-based Web3 poker</p>
                                    <h1>Play Poker. Pay for Time. Keep What You Win.</h1>
                                    <p className="hero-copy">Deposit crypto, buy MPCE time, join a table, and withdraw your balance when you are done.</p>

                                    <div className="btn-group hero-actions">
                                        <a className='banner-btn' target="_blank" rel="noopener noreferrer" href='https://webgl.modernpokerclub.com/'>
                                            <i className="play-icon"><img src={require('../../static/images/new-landing/play-icon.png')} alt='' /></i>
                                            <span>Start Playing</span>
                                            <i className="poker-icon"><img src={require('../../static/images/new-landing/poker-icon.png')} alt='' /></i>
                                        </a>
                                    </div>

                                </div>
                            </div>
                            <div className="banner-img col-lg-6 col-md-12">
                                <div className="img-inner">
                                    <img src={require('../../static/images/new-landing/banner-left-img.png')} alt='' />

                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* About Section */}
                <section id="about" className="about-sec" style={{ backgroundImage: `url(${require("../../static/images/new-landing/about-bg.png")})` }}>
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
                                                <a href="https://x.com/ModernPokerClub" className="social-link" target="_blank" rel="noopener noreferrer"><img src={require('../../static/images/new-landing/twitter-icon.png')} alt='' /></a>
                                                <a href="https://t.me/ModernPokerClub" className="social-link opensea-link" target="_blank" rel="noopener noreferrer"><img src={require('../../static/images/new-landing/telegram-icon.png')} alt='' /></a>
                                                <a href="https://discord.gg/PqqdrwTxFn" className="social-link" target="_blank" rel="noopener noreferrer"><img src={require('../../static/images/new-landing/discord-icon.png')} alt='' /></a>
                                            </div>
                                        </div>
                                        <div className="right-area">
                                            <div className="text-box">
                                                <p>Modern Poker Club is a next-generation online poker platform built around a simple idea: players compete against each other, while the platform charges for time, not rake.</p>
                                                <p>Players deposit crypto, buy MPCE time, join games, and play in a social poker ecosystem powered by avatars, NFTs, rankings, and community-driven features.</p>
                                                <p>MPC is designed to blend poker, gaming, and Web3 into one seamless experience where your identity, assets, and play history can grow with you over time.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section >

                {/* How It Works Section */}
                <section id="how-it-works" className="how-it-works-sec become-sec" style={{ backgroundImage: `url(${require("../../static/images/new-landing/become-bg.png")})` }}>
                    <div className="auto-container">
                        <div className="row">
                            <div className="col-12">
                                <div className="sec-title text-center">
                                    <h2>How It Works</h2>
                                </div>

                                <div className="flow-grid">
                                    {workflowSteps.map((step, index) => (
                                        <div className={`flow-step flow-step-${index + 1}`} key={step.title}>
                                            <div className="flow-visual">
                                                <img className="flow-scene" src={step.image} alt='' />
                                            </div>
                                            <div className="flow-copy">
                                                <h3>{step.title}</h3>
                                                <p>{step.copy}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section >

                {/* NFT Migration Section */}
                <section id="nft-migration" className="migration-preview-sec">
                    <div className="auto-container">
                        <div className="feature-shell feature-shell-migration">
                            <div className="feature-art-wide">
                                <img src={sectionArtwork.migration} alt='' />
                            </div>
                            <div className="feature-copy-grid">
                                <div className="section-copy">
                                    <span className="section-kicker">NFT Migration</span>
                                    <h2>Move your legacy NFTs to Solana</h2>
                                </div>
                                <div className="section-copy">
                                    <ul>
                                        <li>Keep your artwork, traits, and rarity</li>
                                        <li>Equip NFTs as avatars in-game</li>
                                        <li>Bring legacy MPC identity into the new player ecosystem</li>
                                    </ul>
                                    <Link className="copy-cta" to="/bridge">NFT Migration</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Buy Time Section */}
                <section id="buy-time" className="buy-time-sec">
                    <div className="auto-container">
                        <div className="feature-shell feature-shell-time">
                            <div className="feature-art-wide">
                                <img src={sectionArtwork.buyTime} alt='' />
                            </div>
                            <div className="feature-copy-grid">
                                <div className="section-copy">
                                    <span className="section-kicker">Time-based poker</span>
                                    <h2>Buy Time / MPCE</h2>
                                </div>
                                <div className="section-copy">
                                    <p>MPCE time powers access to tables. Players buy time in game, play hands against each other, and keep their remaining balance available for withdrawal.</p>
                                    <a className="copy-cta" href="https://tony-update.d3fd413nat6wcy.amplifyapp.com/" target="_blank" rel="noopener noreferrer">Start Playing</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Marketplace Preview Section */}
                <section id="marketplace" className="marketplace-preview-sec">
                    <div className="auto-container">
                        <div className="feature-shell feature-shell-market">
                            <div className="feature-art-wide">
                                <img src={sectionArtwork.marketplace} alt='' />
                            </div>
                            <div className="section-copy text-center market-heading">
                                <span className="section-kicker">Coming soon</span>
                                <h2>Marketplace Preview</h2>
                            </div>
                            <div className="market-grid">
                                {marketplaceItems.map((item) => (
                                    <div className="market-item" key={item.title}>
                                        <span className="market-marker"></span>
                                        <h3>{item.title}</h3>
                                        <p>{item.copy}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* FAQ Section */}
                <section id="faq" className="homepage-faq-sec">
                    <div className="auto-container">
                        <div className="row">
                            <div className="col-12">
                                <div className="section-copy text-center">
                                    <h2>FAQ</h2>
                                </div>
                                <div className="faq-grid">
                                    <div className="faq-item">
                                        <h3>How does MPC charge players?</h3>
                                        <p>MPC is built around time-based play. Players buy MPCE time instead of paying rake on each hand.</p>
                                    </div>
                                    <div className="faq-item">
                                        <h3>What happens after I deposit?</h3>
                                        <p>You can buy MPCE time, join a table, play poker, and withdraw your available balance.</p>
                                    </div>
                                    <div className="faq-item">
                                        <h3>What is NFT Migration?</h3>
                                        <p>Legacy MPC NFTs can move to Solana while keeping their artwork, traits, and rarity.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Risk Disclaimer */}
                <section id="risk-disclaimer" className="risk-disclaimer-sec">
                    <div className="auto-container">
                        <div className="row">
                            <div className="col-12">
                                <div className="section-copy text-center">
                                    <h2>Risk Disclaimer</h2>
                                    <p>MPC is a skill-based, time-access entertainment platform. Digital assets, cryptocurrencies, NFTs, and blockchain transactions involve financial and technical risk.</p>
                                    <Link className="copy-cta" to="/risk-disclaimer">Read Risk Disclaimer</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Community Section */}
                <section id="community" className="buy-sec" style={{ backgroundImage: `url(${require("../../static/images/new-landing/buy-sec.png")})` }}>
                    <div id="joinsec" className="join-sec">
                        <div className="auto-container">
                            <div className="row">
                                <div className="col-12">
                                    <div className="sec-title text-center">
                                        <h2><img src={require('../../static/images/new-landing/join-title.png')} alt='' /></h2>
                                    </div>

                                    <div className="join-box-area">
                                        <div className="img-box">
                                            <img src={require('../../static/images/new-landing/join-img.png')} alt='' />
                                            <div className="social-links">
                                                <a href="https://x.com/ModernPokerClub" className="social-link" target="_blank" rel="noopener noreferrer"><img src={require('../../static/images/new-landing/twitter-icon.png')} alt='' /></a>
                                                <a href="https://t.me/ModernPokerClub" className="social-link opensea-link" target="_blank" rel="noopener noreferrer"><img src={require('../../static/images/new-landing/telegram-icon.png')} alt='' /></a>
                                                <a href="https://discord.gg/PqqdrwTxFn" className="social-link" target="_blank" rel="noopener noreferrer"><img src={require('../../static/images/new-landing/discord-icon.png')} alt='' /></a>
                                                <a href="https://www.youtube.com/@modernpokerclub7637" className="social-link" target="_blank" rel="noopener noreferrer"><img src={require('../../static/images/new-landing/youtube-icon.png')} alt='' /></a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section >

                <Footer />
            </div >
        );
    }
}

const mapDispatchToProps = { toggleLoader };

const mapStateToProps = ({ Auth }) => {
    let { publicAddress } = Auth;
    return { publicAddress }
};

export default connect(mapStateToProps, mapDispatchToProps)(MPokerClub);
