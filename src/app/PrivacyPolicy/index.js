import React from 'react';

import LegalPage from '../LegalPage';

const PrivacyPolicy = (props) => (
  <LegalPage title="Privacy Policy" sticky={props.sticky}>
    <p>ModernPokerClub (“MPC,” “we,” “our,” or “us”) may collect information including:</p>
    <ul>
      <li>Name, email, DOB, and account details</li>
      <li>Wallet addresses and transaction activity</li>
      <li>Gameplay, rankings, and session history</li>
      <li>Device, browser, IP address, and usage data</li>
    </ul>

    <h3>How We Use Information</h3>
    <p>We use this information to:</p>
    <ul>
      <li>Operate and improve the platform</li>
      <li>Maintain security and fair play</li>
      <li>Prevent fraud and abuse</li>
      <li>Process transactions and support users</li>
      <li>Comply with legal obligations</li>
    </ul>

    <h3>Sharing Of Information</h3>
    <p>We may share information with:</p>
    <ul>
      <li>Payment processors</li>
      <li>KYC/compliance providers</li>
      <li>Security and fraud prevention services</li>
      <li>Legal authorities where required by law</li>
    </ul>
    <p>MPC does not sell personal information to third parties.</p>

    <h3>Blockchain Visibility</h3>
    <p>Blockchain transactions, wallet addresses, and NFT activity may be publicly visible on-chain.</p>

    <h3>User Rights</h3>
    <p>Users may request access, correction, or deletion of personal information where permitted by law.</p>

    <h3>Security</h3>
    <p>MPC uses commercially reasonable security measures, but no system is completely secure.</p>

    <h3>Age Requirement</h3>
    <p>MPC is intended for users 21+ only.</p>

    <h3>Updates</h3>
    <p>MPC may update this Privacy Policy at any time. Continued use of the platform constitutes acceptance of updates.</p>
  </LegalPage>
);

export default PrivacyPolicy;
