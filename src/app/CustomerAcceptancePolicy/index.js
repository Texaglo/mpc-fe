import React from 'react';

import LegalPage from '../LegalPage';

const CustomerAcceptancePolicy = (props) => (
  <LegalPage title="Customer Acceptance Policy" sticky={props.sticky}>
    <p>To use MPC, players must:</p>
    <ul>
      <li>Be at least 21 years old</li>
      <li>Reside in permitted jurisdictions</li>
      <li>Complete identity verification (KYC) if requested</li>
      <li>Use payment methods they legally own</li>
      <li>Agree to MPC’s Terms and Privacy Policy</li>
    </ul>

    <h3>Account Restrictions</h3>
    <p>MPC may restrict or terminate accounts for:</p>
    <ul>
      <li>Fraud or suspicious activity</li>
      <li>AML/KYC compliance concerns</li>
      <li>Account sharing or abuse</li>
      <li>Violations of platform rules or applicable laws</li>
    </ul>

    <h3>Monitoring</h3>
    <p>MPC continuously monitors activity to maintain platform security, compliance, and fair play.</p>
  </LegalPage>
);

export default CustomerAcceptancePolicy;
