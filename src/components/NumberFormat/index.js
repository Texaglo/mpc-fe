import React, { Fragment } from 'react';
import { connect } from 'react-redux';

class NumberFormat extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      coins: {
        BTC: 8,
        BCH: 6,
        ETH: 8,
        DASH: 8,
        LTC: 6,
        USDT: 2
      },
      defaultDecimals: 8
    }
  }

  render() {
    let { value, decimals, coin } = this.props;
    let { defaultDecimals, coins } = this.state;
    decimals = coins[coin] || decimals || defaultDecimals;
    return (
      <Fragment>
        {parseFloat(value).toFixed(decimals)}
      </Fragment>
    )
  }
}

export default connect(null, null)(NumberFormat);