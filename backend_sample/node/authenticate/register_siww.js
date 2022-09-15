const request = require('request');
const Q = require('q');

module.exports = {
    async_isRegisteredDomain,
    async_registerDomain
}

    // are we registered with SIWC backend?
    function async_isRegisteredDomain(configSIWC) {
        var deferred = Q.defer();
        request.get(
            configSIWC.host+"web3/domain/"+configSIWC.clientID,
            function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    deferred.resolve(JSON.parse(body));
                }
                else {
                    deferred.reject({
                        data: null,
                        status: 400,
                        statusText: "Could not check registered domain with SIWW"
                    });
                }
            }
        ); 
        return deferred.promise;
    }

    // register with SIWC backend
    function async_registerDomain(configSIWC) {
        var deferred = Q.defer();
        request.post(
            configSIWC.host+"web3/domain", { 
                json: { 
                    // who are we?
                    domain_name: gConfig.origin,

                    // display
                    display_name: "test app",
                    background: null,           // overload later...
                    logo: null,                 // overload later...

                    // callbacks
                    use_dev_uri: true,
                    redirect_uri_dev: configSIWC.callbackURL,
                    redirect_error_dev: function(){},

                    // todo : put prod here
                    redirect_uri: configSIWC.callbackURL,           
                    redirect_error: function(){},
                    
                    // token
                    token_lifespan:  3*24*60*60*1000,  // 3 day default
                    scope: [{
                        text: "Username",
                        value: "username"
                    }, {
                        text: "Wallet Address",
                        value: "wallet_address"
                    }]
                } 
            },
            function (error, response, body) {
                if (!error && response.statusCode === 201 && body.data.client_id) {
                    gConfig.siww.clientID=body.data.client_id;
                    gConfig.siww.asRegistered=body.data;
                    deferred.resolve(body);
                }
                else {
                    deferred.reject({
                        data: null,
                        status: 400,
                        statusText: "Could not register domain with SIWW"
                    });
                }
            }
        ); 
        
        return deferred.promise;
    }
