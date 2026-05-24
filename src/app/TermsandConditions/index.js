import EventBus from "eventing-bus";
import { connect } from 'react-redux';
import React, { Component } from 'react';

import './index.css';
import { web3 } from '../../store/web3';
import Footer from '../../components/footer';
import Navbar from '../../components/navbar';
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
                    <div className="auto-container">
                        <div className="row">
                            <div className="col-12">
                                <div className='content-area bridge-content-area'>
                                    <div className="top-area">
                                        <div className="logo-area">
                                        </div>
                                        <div className="sec-title text-center">
                                            <h2><img src={require('../../static/images/new-landing/trems-title.png')} alt='' /></h2>
                                        </div>
                                    </div>
                                    <div className="trems-box">
                                        <div className="trems-inner">
                                            <h3>Introduction</h3>
                                            <p>These Terms and Conditions (“Terms”) form a binding legal agreement between you (“Player,” “you,” or “your”) and VaultEcho LLC d/b/a ModernPokerClub (“MPC,” “we,” “our,” or “us”). By creating an account or participating in any games on the MPC platform MPC Platform are sponsored by VaultEcho LLC d/b/a ModernPokerClub, you agree to be bound by these Terms and all associated rules, policies, and sweepstakes conditions.</p>
                                            <p>MPC is an online entertainment platform offering players the ability to participate in social games of skill using <b>Gold Coins</b> (for fun play) and Sweepstakes Coins (for sweepstakes entry), in accordance with applicable laws. <b>MPC does not offer real-money gambling.</b></p>

                                            <h3>Gold Coins & Sweepstakes Coins</h3>
                                            <ul>
                                                <li><b>Gold Coins:</b> Free-play coins with no cash value. Gold Coins are provided for entertainment only and cannot be redeemed for cash or prizes.</li>
                                                <li><b>Sweepstakes Coins:</b> Promotional tokens awarded in connection with purchases, promotions, or via free entry methods. Sweepstakes Coins may be used to enter games for the chance to win additional Sweepstakes Coins, which can be redeemed for prizes.</li>
                                                <li><b>No Purchase Necessary:</b> A purchase or payment of any kind will not increase your chances of winning.</li>
                                            </ul>

                                            {/* <h3>Free Entry (Alternate Method of Entry – AMOE)</h3>
                                            <p>Players may obtain Sweepstakes Coins without purchase by mailing a legibly handwritten request including:</p>
                                            <ul>
                                                <li>Full name</li>
                                                <li>Mailing address</li>
                                                <li>Email address associated with your MPC account <br />to: <b>ModernPokerClub Sweepstakes Entry</b> 5900 balcones dr ste 100, Austin, tx, 78731</li>
                                            </ul>
                                            <p>Limit: [1 entry per request / per day]. Requests that are mechanically reproduced, incomplete, or illegible will not be honored.</p>
                                            <p>What To Do With AMOE</p>
                                            <ul>
                                                <li>Players may obtain Sweepstakes Coins for free via our Alternate Method of Entry (AMOE) as described in the Sweepstakes Rules.</li>
                                            </ul> */}

                                            {/* <h3>What To Do With AMOE</h3>
                                            <ul>
                                                <li>Players may obtain Sweepstakes Coins for free via our Alternate Method of Entry (AMOE) as described in the Sweepstakes Rules.</li>
                                            </ul> */}

                                            <h3>Eligibility</h3>
                                            <ul>
                                                <li>Must be <b>21 years or older</b> at the time of participation.</li>
                                                <li>Must reside in the <b>United States or Canada (excluding Quebec).</b></li>
                                                <li><b>Excluded States:</b> Residents of Connecticut, Delaware, Idaho, Louisiana, Michigan, Montana, Nevada, New Jersey, New York, and Washington are not eligible to participate.</li>
                                                <li>Void where prohibited by law.</li>
                                            </ul>

                                            <h3>Account Rules</h3>
                                            <ul>
                                                <li>Only one account per natural person.</li>
                                                <li>Accounts may not be transferred, sold, or shared.</li>
                                                <li>MPC reserves the right to suspend or terminate accounts for fraud, abuse, or violation of these Terms.</li>
                                            </ul>

                                            <h3>Redemption of Sweepstakes Coins</h3>
                                            <ul>
                                                <li>Sweepstakes Coins may be redeemed for prizes once a minimum redemption threshold of <b>$5.00 USD </b>is reached.</li>
                                                <li>Redemption requests may require identity verification (KYC) to confirm age and eligibility.</li>
                                                {/* <li>Redemption requests may require identity verification (KYC).</li> */}
                                            </ul>

                                            <h3>Responsible Gameplay</h3>
                                            <p>MPC supports responsible social gameplay. We encourage all players to use moderation and will provide self-limiting tools (such as deposit caps or play-time reminders). MPC may suspend accounts showing excessive or harmful gameplay patterns.</p>

                                            <h3>Privacy & Data Collection</h3>
                                            <p>Your use of the Platform is subject to our <b>Privacy Policy</b>, which describes how we collect, store, and use your information. By using the Platform, you consent to such collection and use.</p>

                                            <h3>Dispute Resolution & Arbitration</h3>
                                            <p>You agree that any disputes arising from your use of MPC will be resolved through <b>binding individual arbitration</b>. You waive the right to pursue class-action or group claims.</p>

                                            <h3>General Terms</h3>
                                            <ul>
                                                <li>MPC reserves the right to update these Terms at any time.</li>
                                                <li>Continued use of the Platform constitutes acceptance of revised Terms.</li>
                                                <li>These Terms are governed by the laws of Texas. Any disputes will be resolved through binding individual arbitration in Travis County, Texas.</li>
                                                <li>MPC may modify, suspend, or terminate promotions or the platform at any time if necessary to comply with applicable laws or regulatory requirements.</li>
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
