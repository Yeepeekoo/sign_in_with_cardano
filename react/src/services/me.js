import {getCache, setCache, removeCache} from './cache'

// structure of info
//
//  - username: ...
//  - wallet_address: ...
//  - wallet_id: ...
//  - wallet_logo: ...
//  - provider
//  - webapp: [{ 
//    app_id: ...
//    aScope: [{label: ... , property: ...}]
//    didGrant : true/false
//  }]
//

const CACHE_ME="me"

const getMyIdentities = () => {
    let objMe=getCache(CACHE_ME);
    return objMe? objMe.identities : [];
}

const _findIdentityFromWallet = (_wallet_id, _provider) => {
  let aId=getMyIdentities();
  if(_wallet_id && _provider && aId && aId.length>0) {
    for (var i=0; i<aId.length; i++) {
      if (aId[i].wallet_id===_wallet_id && aId[i].provider === _provider) {
        return aId[i];
      }
    }
  }
  return null;
}

const _findIdentityFromUsername = (_id) => {
  let aId=getMyIdentities();
  if(_id && aId && aId.length>0) {
    for (var i=0; i<aId.length; i++) {
      if (aId[i].username===_id) {
        return aId[i];
      }
    }
  }
  return null;
}

const getIdentityFromUsername = (_username) => {
  return _findIdentityFromUsername(_username);
}

const getIdentityFromWallet = (_walletId, _provider) => {
  return _findIdentityFromWallet(_walletId, _provider);
}

const createPartialIdentity = (_objIdentity) => {
  let objMe=getCache(CACHE_ME);
  if(!objMe) {
    objMe={
      identities: []
    };
  }
  if(_findIdentityFromWallet(_objIdentity.wallet_id, _objIdentity.provider)===null) {
    objMe.identities.push(_objIdentity);
    setCache(CACHE_ME, objMe);
  }
  return objMe;
}

const updatePartialIdentity = (_wallet_id, _provider, _objUpdate) => {
  let objIdentity=_findIdentityFromWallet(_wallet_id, _provider)
  if(objIdentity) {
    for (const key in _objUpdate) {
      objIdentity[key]=_objUpdate[key];
    }
    let aId=getMyIdentities();
    for (var i=0; i<aId.length; i++) {
      if(aId[i].wallet_id===_wallet_id && aId[i].provider===_provider) {
        aId[i]=objIdentity;
      }
    }
    setCache(CACHE_ME, {identities: aId});
    return true;
  }
  return false;
}

const updateIdentity = (_username, _objUpdate) => {
  let objIdentity=_findIdentityFromUsername(_username);
  if(objIdentity) {
    for (const key in _objUpdate) {
      objIdentity[key]=_objUpdate[key];
    }
    let aId=getMyIdentities();
    for (var i=0; i<aId.length; i++) {
      if(aId[i].username===_username) {
        aId[i]=objIdentity;
      }
    }
    setCache(CACHE_ME, {identities: aId});
    return true;
  }
  return false;
}

const registerWebAppWithIdentity = (_username, _objWebApp) => {
  let objIdentity=_findIdentityFromUsername(_username);
  if(!objIdentity) {
    return null;
  }
  
  // update this identity with WebApp
  if(!objIdentity.aWebApp) {objIdentity.aWebApp=[]}
  if(_objWebApp && _objWebApp.app_id) {
    let i=objIdentity.aWebApp.findIndex(function (x) {return x.app_id===_objWebApp.app_id});
    let aNewScope=_objWebApp.aScope? _objWebApp.aScope : [];
    if(i===-1) {
      objIdentity.aWebApp.push({
        app_id: _objWebApp.app_id,
        aScope: aNewScope,
        didGrant: false
      })
    }
    else {
      // changed scope?
      let _new=JSON.stringify(aNewScope);
      let _old=JSON.stringify(objIdentity.aWebApp[i].aScope);
      if(_new!==_old) {
        objIdentity.aWebApp[i].aScope=aNewScope;
        objIdentity.aWebApp[i].didGrant= false;
      }
    }

    updateIdentity(objIdentity.username, {
      aWebApp: objIdentity.aWebApp
    });

    return objIdentity;
  }
  return null;
}

const grantAccessToWebApp = (_username, _client_id) => {
  let objIdentity=_findIdentityFromUsername(_username);
  if(!objIdentity || !objIdentity.aWebApp || objIdentity.aWebApp.length===0) {
    return null;
  }

  let i=objIdentity.aWebApp.findIndex(function (x) {return x.app_id===_client_id});
  if(i===-1) {
    return null;
  }

  if(!objIdentity.aWebApp[i].didGrant) {
    objIdentity.aWebApp[i].didGrant=true;
    updateIdentity(_username, {
      aWebApp: objIdentity.aWebApp
    });  
  }
}

const isGrantedAccessToWebApp = (_username, _client_id) => {
  let objIdentity=_findIdentityFromUsername(_username);
  if(!objIdentity || !objIdentity.aWebApp || objIdentity.aWebApp.length===0) {
    return false;
  }
  let i=objIdentity.aWebApp.findIndex(function (x) {return x.app_id===_client_id});
  if(i===-1) {
    return false;
  }
  return objIdentity.aWebApp[i].didGrant===true;
}

const deleteMe = () => {
  removeCache(CACHE_ME);
}

export {
  CACHE_ME,
  getMyIdentities,
  getIdentityFromUsername,
  getIdentityFromWallet,
  createPartialIdentity,
  updatePartialIdentity,
  updateIdentity,
  registerWebAppWithIdentity,
  grantAccessToWebApp,
  isGrantedAccessToWebApp,
  deleteMe
};
