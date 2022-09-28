/*
 *      Sign-In With Cardano / wallet connect
 */

import {siww_connect} from "./siww_connect"

// import cbor from 'cbor'
import {
  Address,
  Value,
  /*
  BaseAddress,
  MultiAsset,
  Assets,
  ScriptHash,
  Costmdls,
  Language,
  CostModel,
  AssetName,
  TransactionUnspentOutput,
  TransactionUnspentOutputs,
  TransactionOutput,
  TransactionBuilder,
  TransactionBuilderConfigBuilder,
  TransactionOutputBuilder,
  LinearFee,
  BigNum,
  BigInt,
  TransactionHash,
  TransactionInputs,
  TransactionInput,
  TransactionWitnessSet,
  Transaction,
  PlutusData,
  PlutusScripts,
  PlutusScript,
  PlutusList,
  Redeemers,
  Redeemer,
  RedeemerTag,
  Ed25519KeyHashes,
  ConstrPlutusData,
  ExUnits,
  Int,
  NetworkInfo,
  EnterpriseAddress,
  TransactionOutputs,
  hash_transaction,
  hash_script_data,
  hash_plutus_data,
  ScriptDataHash, Ed25519KeyHash, NativeScript, StakeCredential
  */
} from "@emurgo/cardano-serialization-lib-asmjs"

export class siwc_connect  extends siww_connect {

//
//      helpers
//

    createDefaultWallet(_idWallet) {
        return {
            chain: "Cardano",
            provider: "SIWC",
            id: _idWallet,                                            // id of wallet
            api: null,
            apiVersion: window?.cardano?.[_idWallet].apiVersion,      // get API version of wallet,
            name: window?.cardano?.[_idWallet].name,                  // get name of wallet
            logo: window?.cardano?.[_idWallet].icon,                  // get wallet logo
            isEnabled: false,
            hasReplied: false,
            networkId: 0,
            address: null
        }
    }

//
//      Initialization
//

    async async_initialize(objParam) {
        await super.async_initialize(objParam);        
    }

    async async_onListAccessibleWallets() {
        try {
            let _aWallet=[];
            if(window.cardano) {
                for (const key in window.cardano) {
                    if(window.cardano[key].hasOwnProperty("apiVersion")) {
                        let objWallet = await this.async_getDefaultWalletInfo(key);

                        // push info for connection
                        _aWallet.push(this.getSanitizedWallet(objWallet));
                    }
                }
            }
            return _aWallet;
        }
        catch(err) {
            throw err;
        }
    }
    
//
//      Connect with wallet
//

    async async_enableWallet(idWallet) {
        let _api=null;
        try {
            _api = await window.cardano[idWallet].enable();
        }
        catch(err) {
            console.log ("Wallet connection refused ")
        }
        return _api;
    }

    async async_isWalletEnabled(idWallet) {
        let _isEnabled=false;
        try {
            _isEnabled=await window.cardano[idWallet].isEnabled();
        } catch (err) {
            console.log ("Could not ask if wallet is enabled")
        }
        return _isEnabled;
    }

    async async_getConnectedWalletExtendedInfo(_objWallet){
        try {
            if(!_objWallet.api && _objWallet.id!==null) {
                _objWallet.api = await this.async_enableWallet(_objWallet.id);
            }

            if(!_objWallet.api) {
                throw new Error("Bad params");
            }

            _objWallet.networkId = await _objWallet.api.getNetworkId();
            _objWallet.address=await this._async_getFirstAddress(_objWallet.api);
            _objWallet.chain= _objWallet.networkId === 0 ? "Cardano testnet" : "Cardano mainnet";
            _objWallet.isEnabled=true;
            return _objWallet;
        }
        catch(err) {
            _objWallet.isEnabled=false;
            return _objWallet;
        }
    }

//
//      Misc access to wallet public info
//

    async _async_getFirstAddress(_api) {
        try {
            const aRaw = await _api.getUsedAddresses();
            if(aRaw && aRaw.length>0) {
                const _firstAddress = Address.from_bytes(Buffer.from(aRaw[0], "hex")).to_bech32()
                return _firstAddress    
            }
            else {
                let _err = {
                    code: 400
                }
                throw _err;
            }
        } catch (err) {
            console.log ("Could not access first address of wallet")
        }
        return null;
    }

    async _async_getUnusedAddress(_api) {
        try {
            const aRaw = await _api.getUnusedAddresses();
            if(aRaw && aRaw.length>0) {
                const _firstAddress = Address.from_bytes(Buffer.from(aRaw[0], "hex")).to_bech32()
                return _firstAddress
            }
            else {
                let _err = {
                    code: 400
                }
                throw _err;
            }
        } catch (err) {
            console.log ("Could not access any unused addresses of wallet")
        }
        return null;
    }

    async _async_getUtxo(_api) {
        try {
            let aUnspent = await _api.getUtxos();
            return aUnspent;
        } catch (err) {
            console.log ("Could not get UTxO");
        }
        return null;
    }

    async _async_getBalance(_api) {
        try {
            let cborBal = await _api.getBalance();
//          let amount=cbor.decodeFirstSync(cborBal);  // other alternative to decode the cbor
            let amount=Value.from_bytes(Buffer.from(cborBal, "hex")).coin();        
            return amount;
        } catch (err) {
            console.log ("Could not get Balance");
        }
        return null;        
    }


}

export default siwc_connect;