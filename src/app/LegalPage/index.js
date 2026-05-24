import React from 'react';

import './index.css';
import Navbar from '../../components/navbar';
import Footer from '../../components/footer';

const LegalPage = ({ title, children, sticky }) => (
  <div className="mp-club-page">
    <Navbar sticky={sticky} />
    <div className="bridge-modals trems-page legal-page">
      <div className="auto-container">
        <div className="row">
          <div className="col-12">
            <div className="content-area bridge-content-area">
              <div className="top-area">
                <div className="sec-title legal-title text-center">
                  <h1>{title}</h1>
                </div>
              </div>
              <div className="trems-box">
                <div className="trems-inner">
                  {children}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Footer />
  </div>
);

export default LegalPage;
