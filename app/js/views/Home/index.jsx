import React, { Component } from 'react';
import { Apis } from 'graphenejs-ws';
import { ChainStore } from 'graphenejs-lib';

class Home extends Component {
  constructor(props) {
    super(props);
    this.connectToBlockchain = this.connectToBlockchain.bind(this);
    this.state = {
      connectingToBlockchain: false,
      connectedToBlockchain: false,
    };
  }

  connectToBlockchain() {
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
        <button onClick={this.connectToBlockchain} disabled={this.state.connectingToBlockchain}>
            Connect to Blockchain hehehe
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

Home.contextTypes = {
  router: React.PropTypes.object,
};

export default Home;
