import React from 'react';
import { connect } from 'react-redux';

import './index.css';
import { css } from "@emotion/core";
import BounceLoader from "react-spinners/BounceLoader";

const override = css`
  display: block;
  margin: 0 auto;
  border-color: red;
`;

class AppLoader extends React.Component {

  render() {
    let { message } = this.props;
    return (
      <div className='app-loader'>
        <div className="loader-container">
          <BounceLoader
            css={override}
            size={50}
            color={'#6B1A10'}
            loading={true}
          />
        </div>
        {message && <div className="loader-container"> <span className="loading-text">{message}</span></div>}
      </div>
    );
  }
}

const mapDispatchToProps = {};

const mapStateToProps = ({ }) => {
  // let {  } = Auth;
  return {};
};

export default connect(mapStateToProps, mapDispatchToProps)(AppLoader);
