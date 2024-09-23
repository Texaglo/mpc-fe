import { connect } from 'react-redux';
import React from 'react';

import './index.css';
import { css } from "@emotion/react";
import BounceLoader from "react-spinners/BounceLoader";

const override = css`
  display: block;
  margin: 0 auto;
  border-color: red;
`;

class Loader extends React.Component {

  render() {
    const { isLoader } = this.props
    return (
      <>
        {
          <div className='loader'>
            <div className="loader-area">
              <BounceLoader
                css={override}
                size={50}
                color={'#d0a535'}
                loading={true}
              />
              <span className="loading-text">
                <p className="mt-4 text-white">{isLoader['message']}</p>
              </span>
            </div>
          </div>
        }
      </>
    );
  }
}

const mapDispatchToProps = {};

const mapStateToProps = ({ Auth }) => {
  let { isLoader } = Auth;
  return { isLoader };
};

export default connect(mapStateToProps, mapDispatchToProps)(Loader);
