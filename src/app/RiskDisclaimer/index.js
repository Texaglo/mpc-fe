import React from 'react';

import LegalPage from '../LegalPage';

const RiskDisclaimer = (props) => (
  <LegalPage title="Risk Disclaimer" sticky={props.sticky}>
    <p>ModernPokerClub (“MPC”) is a skill-based, time-access entertainment platform. Players pay for access time and compete against other players. MPC does not guarantee winnings or profits.</p>
    <p>Digital assets, cryptocurrencies, NFTs, and blockchain transactions involve financial and technical risk, including volatility, loss of access, and market fluctuations.</p>

    <h3>Acknowledgement</h3>
    <p>By using MPC, you acknowledge that:</p>
    <ul>
      <li>You participate at your own risk</li>
      <li>You are responsible for complying with your local laws</li>
      <li>MPC is not responsible for losses caused by user error, wallet issues, third-party services, or market conditions</li>
    </ul>

    <h3>Participation</h3>
    <p>Only participate using time and assets you can afford to lose. Review all platform terms before using MPC.</p>
  </LegalPage>
);

export default RiskDisclaimer;
