import React, { Component } from 'react';
import { Apis } from 'graphenejs-ws';
import { ChainStore } from 'graphenejs-lib';

class Welcome extends Component {
  constructor(props) {
    super(props);
    this._connectToBlockchain = this._connectToBlockchain.bind(this);
    this.state = {
      connectingToBlockchain: false,
      connectedToBlockchain: false,
    };
  }

  _connectToBlockchain() {
    // Mark connecting to blockchain
    this.setState({ connectingToBlockchain: true });
    // Open websocket connection
    Apis.instance('wss://bitshares.openledger.info/ws', true).init_promise.then((res) => {
      console.log('Connected to:', res[0].network);
      // Init chainstore
      ChainStore.init().then(() => {
        // Mark connected to blockchain
        this.setState({ connectingToBlockchain: false, connectedToBlockchain: true });
        console.log('Chainstore init success');
        this.context.router.push('/main');
        return null;
      }).catch((error) => {
        console.log('Fail to init ChainStore');
        console.error(error);
        this.setState({ connectingToBlockchain: false });
      });
      return null;
    }).catch((error) => {
      console.log('Fail to connect to blockchain');
      console.error(error);
      this.setState({ connectingToBlockchain: false });
    });
  }

  render() {
    return (
      <div className='Home'>
        <button onClick={ this._connectToBlockchain } disabled={ this.state.connectingToBlockchain }>
          {'Connect to Blockchain'}
        </button>
        {
          this.state.connectingToBlockchain ?
            <div>{'Connecting to Blockchain..... Please wait....'}</div>
            : null
        }
      </div>
    );
  }
}

Welcome.contextTypes = {
  router: React.PropTypes.object,
};

export default Welcome;
