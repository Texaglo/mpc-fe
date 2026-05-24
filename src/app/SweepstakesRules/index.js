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
                                            <h2><img src={require('../../static/images/new-landing/sweeps-title.png')} alt='' /></h2>
                                        </div>
                                    </div>
                                    <div className="trems-box">
                                        <div className="trems-inner">
                                            <h3>No Purchase Necessary</h3>
                                            <p>No purchase or payment of any kind is necessary to participate. A purchase or payment will not increase your chances of winning.</p>

                                            <h3>Sweepstakes Coins</h3>
                                            <ul>
                                                <li><b>Sweepstakes Coins (“SC”)</b> are promotional tokens with no direct monetary value.</li>
                                                <li>SC may be obtained through:
                                                    <ul>
                                                        <li>Free promotional offers, giveaways, or bonuses.</li>
                                                        <li>Associated with Gold Coin purchases.</li>
                                                        <li>Free entry via Alternate Method of Entry (AMOE).</li>
                                                    </ul>
                                                </li>
                                                <li>SC can be used to play in sweepstakes-enabled games for the chance to win additional SC.</li>
                                                <li>SC are redeemable for prizes subject to redemption thresholds.</li>
                                            </ul>
                                            <h3>What To Do With AMOE</h3>
                                            <ul>
                                                <li>Keep only one authoritative AMOE section in the Sweepstakes Rules page (that's where reviewers expect to find it).</li>
                                            </ul>
                                            <p>Alternate Method of Entry (AMOE)</p>
                                            <p>No purchase is necessary to participate in ModernPokerClub sweepstakes. A purchase or payment of any kind will not increase your chances of winning.:</p>
                                            <p>To receive Sweepstakes Coins (SC) without making a purchase, eligible participants may enter by mailing a legibly handwritten request on a 3x5 index card that includes:</p>
                                            <ul>
                                                <li>Your full name</li>
                                                <li>Complete mailing address (no P.O. boxes)</li>
                                                <li>Email address associated with your MPC account</li>
                                                <li>Date of birth (must be 21 years or older)</li>
                                                <li>The words: “ModernPokerClub Sweepstakes Entry”</li>
                                                <li>Mail your completed card in a stamped #10 business envelope to: <br /> <b>VaultEcho LLC – Sweepstakes Entry</b><br />5900 Balcones Drive STE 100<br />Austin, TX 78731</li>
                                            </ul>
                                            <p>Limit one (1) request per envelope. Each valid request will receive a specified number of Sweepstakes Coins (SC) credited to the MPC account listed in the request. Mechanical reproductions, illegible, incomplete, or mass entries will be void.</p>

                                            {/* <h3>Alternate Method of Entry (AMOE)</h3> */}
                                            {/* <p>No purchase is necessary to participate in ModernPokerClub sweepstakes. A purchase or payment of any kind will not increase your chances of winning.:</p>
                                            <p>To receive Sweepstakes Coins (SC) without making a purchase, eligible participants may enter by mailing a legibly handwritten request on a 3x5 index card that includes:</p>
                                            <ul>
                                                <li>Your full name</li>
                                                <li>Complete mailing address (no P.O. boxes)</li>
                                                <li>Email address associated with your MPC account</li>
                                                <li>Date of birth (must be 21 years or older)</li>
                                                <li>The words: “ModernPokerClub Sweepstakes Entry”</li>
                                                <li>Mail your completed card in a stamped #10 business envelope to: <br /> <b>VaultEcho LLC – Sweepstakes Entry</b><br />5900 Balcones Drive STE 100<br />Austin, TX 78731</li>
                                            </ul>
                                            <p>Limit one (1) request per envelope. Each valid request will receive a specified number of Sweepstakes Coins (SC) credited to the MPC account listed in the request. Mechanical reproductions, illegible, incomplete, or mass entries will be void.</p> */}
                                            <h3>State & Province Exclusions</h3>
                                            <p>Participation in ModernPokerClub sweepstakes is void where prohibited and not available in the following jurisdictions:</p>
                                            <ul>
                                                <li><b>United States:</b> Connecticut, Delaware, Idaho, Louisiana, Michigan, Montana, Nevada, New Jersey, New York, Washington.</li>
                                                <li><b>Canada:</b> Quebec.</li>
                                                <li>Any U.S. territories (including Puerto Rico, Guam, U.S. Virgin Islands, American Samoa, Northern Mariana Islands).</li>
                                                <li>Any jurisdictions where sweepstakes are prohibited by law.</li>
                                            </ul>
                                            <p>Players must be at least  <b>21 years of age</b>  or the age of majority in their jurisdiction, whichever is higher, to participate.</p>
                                            <h3>Eligibility</h3>
                                            <ul>
                                                <li>Right now it says: "Open to residents of the United States (excluding CT, DE, ID, LA, MI, MT, NV, NJ, NY, WA) and Canada (excluding Quebec).</li>
                                                <li>Must be <b>21+ years of age.</b></li>
                                                <li>Void where prohibited by law.</li>
                                                <li>It's standard sweepstakes legal phrasing (processors look for it as a keyword)</li>
                                            </ul>

                                            <h3>Prizes & Redemption</h3>
                                            <ul>
                                                <li>Minimum redemption threshold: <b>$5.00 USD</b> (or equivalent).</li>
                                                <li>Redemption requests may require identity verification (KYC) to confirm age and eligibility.</li>
                                                <li>Prizes cannot be substituted, transferred, or exchanged for cash except as stated.</li>
                                            </ul>

                                            <h3>Promotional Play</h3>
                                            <p>Sweepstakes Coins have no cash value, are not for sale, and cannot be purchased directly. Any attempt to sell, trade, or transfer SC is prohibited.</p>

                                            <h3>Sponsor/Promoter</h3>
                                            <p>Sweepstakes are sponsored by:</p>
                                            <p><b>VaultEcho LLC d/b/a ModernPokerClub</b></p>
                                            <p>5900 balcones dr ste 100, Austin, tx, 78731</p>
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
