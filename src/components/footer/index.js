import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';

import './index.css';
import '../../app/MPokerClub/index.css';

class Footer extends Component {
    constructor(props) {
        super(props);
        this.state = {};
    };

    render() {
        return (
            <div className='footer-mp-club'>
                <div className="auto-container">
                    <div className="row">
                        <div className="col-lg-3 col-md-6 col-sm-12">
                            <div className="footer-widget ">
                                <h4>Company</h4>
                                <ul>
                                    <li><HashLink smooth to="/#about">About</HashLink></li>
                                    <li><HashLink smooth to="/#faq">FAQ</HashLink></li>
                                    <li><a href="mailto:support@modernpokerclub.com">Contact / Support</a></li>
                                </ul>
                            </div>
                        </div>
                        <div className="col-lg-2 col-md-6 col-sm-12">
                            <div className="footer-widget ">
                                <h4>Platform</h4>
                                <ul>
                                    <li><a href="https://tony-update.d3fd413nat6wcy.amplifyapp.com/" target="_blank" rel="noopener noreferrer">Start Playing</a></li>
                                    <li><HashLink smooth to="/#buy-time">Buy Time / MPCE</HashLink></li>
                                    <li><Link to="/bridge">NFT Migration</Link></li>
                                    <li><HashLink smooth to="/#marketplace">Marketplace</HashLink></li>
                                </ul>
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6 col-sm-12">
                            <div className="footer-widget ">
                                <h4>Legal</h4>
                                <ul>
                                    <li><Link to="/terms-and-conditions">Terms of Service</Link></li>
                                    <li><Link to="/privacy-policy">Privacy Policy</Link></li>
                                    <li><Link to="/responsible-social-gameplay-policy">Responsible Play</Link></li>
                                    <li><Link to="/customer-acceptance-policy">Customer Acceptance</Link></li>
                                    <li><Link to="/risk-disclaimer">Risk Disclaimer</Link></li>
                                </ul>
                            </div>
                        </div>
                        <div className="col-lg-4 col-md-6 col-sm-12">
                            <div className="footer-widget ">
                                <h4>Community</h4>
                                <div className="join-box-area">
                                    <div className="img-box">
                                        <div className="social-links">
                                            <a href="https://discord.gg/PqqdrwTxFn" className="social-link" target="_blank" rel="noopener noreferrer" aria-label="Discord"><img src={require('../../static/images/new-landing/discord-icon.png')} alt='' /></a>
                                            <a href="https://x.com/ModernPokerClub" className="social-link" target="_blank" rel="noopener noreferrer" aria-label="X/Twitter"><img src={require('../../static/images/new-landing/twitter-icon.png')} alt='' /></a>
                                            <a href="https://www.youtube.com/@modernpokerclub7637" className="social-link" target="_blank" rel="noopener noreferrer" aria-label="YouTube"><img src={require('../../static/images/new-landing/youtube-icon.png')} alt='' /></a>
                                            <a href="https://t.me/ModernPokerClub" className="social-link opensea-link" target="_blank" rel="noopener noreferrer" aria-label="Telegram"><img src={require('../../static/images/new-landing/telegram-icon.png')} alt='' /></a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-12">
                            <div className="footer-widget copyright-widget text-center">

                                <p>© 2025 Modern Poker Club</p>

                            </div>
                        </div>
                    </div>
                </div>
            </div >
        );
    }
}

export default Footer;
