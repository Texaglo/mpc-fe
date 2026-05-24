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
                                            <h2><img src={require('../../static/images/new-landing/privacy-title.png')} alt='' /></h2>
                                        </div>
                                    </div>
                                    <div className="trems-box">
                                        <div className="trems-inner">
                                            <h3>Information We Collect</h3>
                                            <p>We may collect the following types of information:</p>
                                            <ul>
                                                <li>Personal information (name, email, address, DOB, phone number).</li>
                                                <li>Account and gameplay data (logins, gameplay history, winnings, redemptions).</li>
                                                <li>Financial information (only as required for prize redemption or KYC).</li>
                                                <li>Device and usage data (IP address, cookies, browser data).</li>
                                            </ul>

                                            <h3>How We Use Information</h3>
                                            <p>We use collected data to:</p>
                                            <ul>
                                                <li>Operate and improve the MPC platform.</li>
                                                <li>Verify identity for compliance and prize redemption.</li>
                                                <li>Prevent fraud and maintain account security.</li>
                                                <li>Communicate promotions, updates, and customer support.</li>
                                            </ul>

                                            <h3>Sharing of Information</h3>
                                            <p>We may share data with:</p>
                                            <ul>
                                                <li>Service providers and legal authorities for payment processing, KYC, and security.</li>
                                                <li>Legal authorities if required by law.</li>
                                                <li>We do not sell, rent, or share player data with third parties for marketing purposes</li>
                                            </ul>
                                            
                                            <h3>Player Rights</h3>
                                            <p>Depending on your jurisdiction, you may have rights to:</p>
                                            <ul>
                                                <li>Access the data we hold on you.</li>
                                                <li>Request deletion of your data.</li>
                                                <li>Opt out of marketing communications.</li>
                                            </ul>

                                            <h3>Data Retention</h3>
                                           <p>We retain personal data only as long as necessary to comply with laws, prevent fraud, and operate the platform.</p>

                                            <h3>Security</h3>
                                            <p>We implement commercially reasonable measures to protect player data, though no system is 100% secure.</p>

                                            <h3>Updates</h3>
                                            <p>We may revise this policy periodically. Continued use of MPC constitutes acceptance of any updates.</p>
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
