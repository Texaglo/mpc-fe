// src/components/CustomToast.jsx
import React, { Component } from "react";
import { solanaExplorer, solanaExplorerClusterQuery } from "../../store/config";

class CustomToast extends Component {
  render() {
    const { txId, name } = this.props;

    return (
      <span>
        {name} NFT transferred successfully on Solana. <br />
        <a
          href={`${solanaExplorer}/address/${txId}?${solanaExplorerClusterQuery}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#00f", textDecoration: "underline" }}
        >
          View NFT
        </a>
      </span>
    );
  }
}

export default CustomToast;
