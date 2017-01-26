import React, { Component } from 'react';
import { ChainStore, TransactionBuilder, PrivateKey } from 'graphenejs-lib';
import utils from '../../utils';

class Main extends Component {
  constructor(props) {
    super(props);
    this._makeOpenOrder = this._makeOpenOrder.bind(this);
  }

  componentWillMount() {
    // Hacky way to check if it is connected to blockchain, temporary fix
    const object = ChainStore.getObject('2.1.0');
    if (!object) this.context.router.push('/');
  }

  _getObject() {
    const object = ChainStore.getObject('2.1.0');
    console.log('ChainStore object 2.1.0:\n', object ? object.toJS() : object);
  }

  _getGlobalParameter() {
    const object = ChainStore.getObject('2.0.0');
    console.log('Blockchain Global Parameter:\n', object ? object.toJS() : object);
  }


  _processTransaction(tr) {
    console.log('BROADCAST TRANSACTION');
    // Set required fees
    tr.set_required_fees().then(() => {
      // Add signatures
      // In this case, both public key and private key is hardcoded
      // Normally tr.get_potential_signatures() followed with tr.get_required_signatures() are called to get the signatures
      // Refer to WalletDb.js process_transaction
      const publicKey = 'BTS76Ht7MbK6hDqGSdJvXnrmmUU2v9XfNZRJVaf6E4mAHUpCcfc8G';
      const privateKey = PrivateKey.fromWif('5JxYc27FySQWqacFWogGqTjuV6mhVoceao5bZFTsJ3v9kTgK8Hj');
      tr.add_signer(privateKey, publicKey);
      // Broadcast transaction
      tr.broadcast().then((res) => {
        console.log('BROADCAST SUCCESS');
        console.log(res);
      }).catch((error) => {
        console.log('BROADCAST FAIL');
        console.log(error);
      });
    });

  }

  _makeOpenOrder() {
    console.log('MAKE OPEN ORDER');
    const sellAssetAmount = 0.1;
    const sellAsset = ChainStore.getAsset('1.3.0'); // Core token
    const buyAssetAmount = 0.1;
    const buyAsset = ChainStore.getAsset('1.3.924'); // Peerplays
    const accountId = '1.2.153075'; // this is ii-5 account id
    const sellAssetSatoshiAmount = utils.get_satoshi_amount(sellAssetAmount, sellAsset);
    const buyAssetSatoshiAmount = utils.get_satoshi_amount(buyAssetAmount, buyAsset);
    const expiration = new Date();
    const fillOrKill = false; // Don't know what this one is used for, but from the wallet, "false" value is always used
    const feeId = '1.3.0'; // Just use core token to pay the fee

    const tr = new TransactionBuilder();
    tr.add_type_operation('limit_order_create', {
      fee: {
        amount: 0,
        asset_id: feeId,
      },
      seller: accountId,
      amount_to_sell: {
        amount: sellAssetSatoshiAmount,
        asset_id: sellAsset.get('id'),
      },
      min_to_receive: {
        amount: buyAssetSatoshiAmount,
        asset_id: buyAsset.get('id'),
      },
      expiration: expiration,
      fill_or_kill: fillOrKill,
      feeId,
    });
    this._processTransaction(tr);
  }

  _getFee(asset) {
    let fee = utils.estimateFee("limit_order_create", [], ChainStore.getObject("2.0.0")) || 0;

    if (!asset || asset.get("id") === "1.3.0") return fee;
    let cer = asset.getIn(["options", "core_exchange_rate"]).toJS();
    let coreAsset = ChainStore.getAsset("1.3.0");
    if (!coreAsset) return 0;
    let price = utils.convertPrice(coreAsset, cer, null, asset.get("id"));

    let eqValue = utils.convertValue(price, fee, coreAsset, asset);

    return Math.floor(eqValue + 0.5);
  }

  render() {
    return (
      <div className='Main'>
        <div>
          Welcome To Blockchain
        </div>
        <button onClick={ this._getObject }>
          {'Get Object 2.1.0 (Current Blockchain data)'}
        </button>
        <button onClick={ this._getGlobalParameter }>
          {'Get Object 2.0.0 (Blockchain Global Parameter)'}
        </button>
        <button onClick={ this._makeOpenOrder }>
          {'Make Open Order'}
        </button>
      </div>
    );
  }
}

Main.contextTypes = {
  router: React.PropTypes.object,
};

export default Main;
