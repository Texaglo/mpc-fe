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
                    <div className="auto-container">
                        <div className="row">
                            <div className="col-12">
                                <div className='content-area bridge-content-area'>
                                    <div className="top-area">
                                        <div className="logo-area">
                                        </div>
                                        <div className="sec-title text-center">
                                            <h2><img src={require('../../static/images/new-landing/social-title.png')} alt='' /></h2>
                                        </div>
                                    </div>
                                    <div className="trems-box">
                                        <div className="trems-inner">
                                            <h3>Commitment to Player Protection</h3>
                                            <p>ModernPokerClub (MPC) is committed to the protection of our players and to promoting responsible social gameplay as a core principle of player care and responsibility.</p>
                                            <p>We recognize the importance of ensuring that play remains fun and safe. We provide tools and guidelines to help players maintain control of their gameplay and avoid problematic use of the platform.</p>

                                            <h3>Guiding Principles</h3>
                                            <p>The MPC Responsible Social Gameplay Program (RSG Program) is designed to:</p>
                                            <ul>
                                                <li>Help players make informed choices in their gameplay.</li>
                                                <li>Prevent harmful or irresponsible gameplay patterns.</li>
                                                <li>Provide education and access to support resources.</li>
                                            </ul>

                                            <h3>Player Tools and Resources</h3>
                                            <ul>
                                                <li><b>Session Limits: </b>Set daily/weekly play limits.</li>
                                                <li><b>Time Reminders: </b>Notifications during extended play.</li>
                                                <li><b>Self-Exclusion: </b>Players may suspend their account for a set period.</li>
                                                <li><b>Support Resources: </b>Links to problem gaming hotlines and organizations.</li>
                                            </ul>

                                            <h3>Player Responsibility</h3>
                                            <p>Players are encouraged to:</p>
                                            <ul>
                                                <li>Play for entertainment, not as a source of income.</li>
                                                <li>Stay within personal and financial limits.</li>
                                                <li>Seek support if gameplay no longer feels in control.</li>
                                            </ul>

                                            <h3>Enforcement</h3>
                                            <p>MPC reserves the right to enforce limits, suspend accounts, or restrict access if responsible play guidelines are violated.</p>
                                        </div>
                                    </div>

                                     <div className="top-area style-two">
                                        <div className="logo-area">
                                        </div>
                                        <div className="sec-title text-center">
                                            <h2><img src={require('../../static/images/new-landing/customer-title.png')} alt='' /></h2>
                                        </div>
                                    </div>

                                    <div className="trems-box">
                                        <div className="trems-inner">
                                            <h3>Eligibility</h3>
                                            <p>MPC will do business with customers only if they:</p>
                                            <ul>
                                                <li>Are natural persons (not companies or organizations).</li>
                                                <li>Are at least 21 years of age.</li>
                                                <li>Reside in the United States (excluding Connecticut, Delaware, Idaho, Louisiana, Michigan, Montana, Nevada, New Jersey, New York, Washington) or in Canada (excluding Quebec).</li>
                                                <li>Agree to the MPC Terms & Conditions, Privacy Policy, and Sweepstakes Rules.</li>
                                                <li>Use only payment methods where they are the legal and beneficial owner.</li>
                                                <li>Pass identity verification (KYC) and anti-fraud checks as required.</li>
                                            </ul>

                                            <h3>Prohibited Customers</h3>
                                            <p>MPC does not accept customers who are:</p>
                                            <ul>
                                                <li>Politically Exposed Persons (PEPs) or their close associates.</li>
                                                <li>On sanctions lists issued by the United States, Canada, EU, UK, or other jurisdictions.</li>
                                                <li>Engaged in fraudulent, abusive, or unlawful activity.</li>
                                                <li>MPC conducts periodic checks to ensure compliance with AML (Anti-Money Laundering) and KYC requirements.</li>
                                                <li>Sharing accounts with others or otherwise misusing the platform.</li>
                                            </ul>

                                            <h3>High-Risk Customers</h3>
                                            <p>MPC may classify a customer as high risk if:</p>
                                            <ul>
                                                <li>Unusual activity is detected (suspicious transactions, excessive requests, abuse of promotions).</li>
                                                <li>The customer fails additional due diligence checks.</li>
                                                <li>There are indications of attempted fraud or money laundering.</li>
                                            </ul>
                                            <p>MPC reserves the right to suspend, terminate, or request additional information from such accounts.</p>

                                            <h3>Ongoing Monitoring</h3>
                                            <p>We continuously monitor customer activity to ensure compliance with applicable laws, prevent fraud, and maintain the integrity of the sweepstakes model.</p>
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
