import React from 'react';

import LegalPage from '../LegalPage';

const ResponsibleSocialGameplayPolicy = (props) => (
  <LegalPage title="Responsible Social Gameplay Policy" sticky={props.sticky}>
    <p>ModernPokerClub (“MPC”) promotes responsible gameplay and player safety.</p>

    <h3>Player Guidance</h3>
    <p>Players are encouraged to:</p>
    <ul>
      <li>Play for entertainment purposes only</li>
      <li>Use time and funds responsibly</li>
      <li>Take breaks during extended sessions</li>
      <li>Seek support if gameplay becomes unhealthy</li>
    </ul>

    <h3>Platform Tools</h3>
    <p>MPC may provide:</p>
    <ul>
      <li>Session reminders</li>
      <li>Account limitations</li>
      <li>Temporary self-exclusion options</li>
      <li>Fraud and fair-play monitoring</li>
    </ul>

    <h3>Enforcement</h3>
    <p>MPC reserves the right to suspend or restrict accounts involved in abuse, fraud, collusion, or harmful behavior.</p>

    <h3>Age Requirement</h3>
    <p>MPC is intended for users 21+ only.</p>
  </LegalPage>
);

export default ResponsibleSocialGameplayPolicy;
