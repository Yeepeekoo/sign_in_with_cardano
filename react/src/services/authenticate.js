
import {API_HOST, API_WEB3ROUTE, API_OAUTHROUTE, srv_postRoute} from "./base";

// call this to request an Authentication cookie to SIWW
const srv_prepare = async(obj) => {
  return await srv_postRoute(API_HOST+API_WEB3ROUTE+'prepare', {
    provider: obj.provider,
    wallet_id: obj.wallet_id,
    wallet_addr: obj.wallet_addr,
    socket_id: obj.socket_id,
    app_id: obj.app_id
  });
}

// call this to authenticate into SIWW
const srv_authenticate = async(obj) => {
  try {
    let jsonStr=JSON.stringify({
      username: obj.username
    });

    const response = await fetch(API_HOST+API_OAUTHROUTE+'login', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: jsonStr,
    });

    if(response.redirected) {
      if(response.status===404) {
        window.location.replace("/");
      }
      else {
        window.location.replace(response.url);
      }
    }
    return;
  } catch(error) {
    console.log(error);
    return {data: null};
  }
}

export { 
  srv_prepare,
  srv_authenticate
}