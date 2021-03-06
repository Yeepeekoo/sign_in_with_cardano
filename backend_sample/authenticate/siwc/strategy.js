// Load modules.
var OAuth2Strategy = require('passport-oauth2')
  , util = require('util')
  , uri = require('url')
  , crypto = require('crypto')
  , Profile = require('./profile')
  , InternalOAuthError = require('passport-oauth2').InternalOAuthError;


/**
 * `Strategy` constructor.
 *
 * The SIWC authentication strategy authenticates requests by delegating to
 * SIWC using the OAuth 2.0 protocol.
 *
 * Applications must supply a `verify` callback which accepts an `accessToken`,
 * `refreshToken` and service-specific `profile`, and then calls the `cb`
 * callback supplying a `user`, which should be set to `false` if the
 * credentials are not valid.  If an exception occurred, `err` should be set.
 *
 * Options:
 *   - `clientID`      your SIWC application's App ID
 *   - `clientSecret`  your SIWC application's App Secret
 *   - `callbackURL`   URL to which SIWC will redirect the user after granting authorization
 *
 * Examples:
 *
 *     passport.use(new SIWCStrategy({
 *         clientID: '123-456-789',
 *         clientSecret: 'shhh-its-a-secret'
 *         callbackURL: 'https://www.example.net/auth/siwc/callback'
 *       },
 *       function(accessToken, refreshToken, profile, cb) {
 *         User.findOrCreate(..., function (err, user) {
 *           cb(err, user);
 *         });
 *       }
 *     ));
 *
 * @constructor
 * @param {object} options
 * @param {function} verify
 * @access public
 */
    function Strategy(options, verify) {
        options = options || {};
        var version = options.graphAPIVersion || 'v1';

        options.authorizationURL = options.authorizationURL || 'https://siwc.com/oauth/dialog/authorize';
        options.tokenURL = options.tokenURL || 'https://siwc.com/oauth/token';
        options.scopeSeparator = options.scopeSeparator || ',';

        OAuth2Strategy.call(this, options, verify);
        this.name = 'SIWC';
        this._profileURL = options.profileURL || 'https://siwc.com/oauth/resources/profile';
        this._profileFields = options.profileFields || null;
        this._enableProof = options.enableProof;
        this._clientSecret = options.clientSecret;
    }

    // Inherit from `OAuth2Strategy`.
    util.inherits(Strategy, OAuth2Strategy);

/**
 * Authenticate request by delegating to SIWC using OAuth 2.0.
 *
 * @param {http.IncomingMessage} req
 * @param {object} options
 * @access protected
 */
    Strategy.prototype.authenticate = function(req, options) {
        if (req.query && req.query.error_code && !req.query.error) {
            return this.error({
                data: {
                    message: "Error - "+req.query.error_message,
                    code: parseInt(req.query.error_code, 10),
                    status: 500,
                    type: 0,
                    subcode: 0
                }
            });
        }

        // call SIWC to authenticate
        // this will call a POST /oauth/token in SIWC to exchange the authorization token by an access token
        OAuth2Strategy.prototype.authenticate.call(this, req, options);
    };

/**
 * Return extra SIWC-specific parameters to be included in the authorization
 * request.
 *
 * Options:
 *  - `display`  Display mode to render dialog, { `page`, `popup`, `touch` }.
 *
 * @param {object} options
 * @return {object}
 * @access protected
 */
    Strategy.prototype.authorizationParams = function (options) {
        var params = {};
        if (options.display) {
            params.display = options.display;
        }
        if (options.authType) {
            params.auth_type = options.authType;
        }
        if (options.authNonce) {
            params.auth_nonce = options.authNonce;
        }
        return params;
    };

/**
 * Retrieve user profile from SIWC.
 *
 * This function constructs a normalized profile, with the following properties:
 *
 *   - `provider`         always set to `SIWC`
 *   - `id`               the user's SIWC ID
 *   - `username`         the user's SIWC username
 *   - `displayName`      the user's full name
 *   - `name.familyName`  the user's last name
 *   - `name.givenName`   the user's first name
 *   - `emails`           the proxied or contact email address granted by the user
 *
 * @param {string} accessToken
 * @param {function} done
 */
    Strategy.prototype.userProfile = function(accessToken, done) {
        let url = uri.parse(this._profileURL);
        if (this._enableProof) {
            // Secure API call by adding proof of the app secret.  This is required when
            // the "Require AppSecret Proof for Server API calls" setting has been
            // enabled.  The proof is a SHA256 hash of the access token, using the app
            // secret as the key.
            var proof = crypto.createHmac('sha256', this._clientSecret).update(accessToken).digest('hex');
                url.search = (url.search ? url.search + '&' : '') + 'appsecret_proof=' + proof;
        }
        if (this._profileFields) {
            var fields = this._convertProfileFields(this._profileFields);
            if (fields !== '') { url.search = (url.search ? url.search + '&' : '') + 'fields=' + fields; }
        }
        url = uri.format(url);

        // Make sure we are using the auth header for the token
        this._oauth2.useAuthorizationHeaderforGET(true);
        this._oauth2.get(url, accessToken, function (err, body, res) {
            let json;

            if (err) {
                if (err.data) {
                    try {
                        json = JSON.parse(err.data);
                    } catch (_) {}
                }

                if (json) {
                    if(json.error && typeof json.error == 'object') {
                        return done(new Error(json.error.message));
                    }
                    return done(new Error(json.statusText));
                }
                return done(new InternalOAuthError("Failed to fetch user profile", err));
            }

            try {
                json = JSON.parse(body);
            } catch (ex) {
                return done(new Error('Failed to parse user profile'));
            }

            let profile = Profile.parse(json);
            profile._raw = body;
            profile._json = json;
            done(null, profile);
        });
    };

/**
 * Parse error response from SIWC OAuth 2.0 token endpoint.
 *
 * @param {string} body
 * @param {number} status
 * @return {Error}
 * @access protected
 */
    Strategy.prototype.parseErrorResponse = function(body, status) {
        var json = JSON.parse(body);
        if (json.error && typeof json.error == 'object') {
            return {
                data: {
                    message: "Error..."
                }
            };
        }
        return OAuth2Strategy.prototype.parseErrorResponse.call(this, body, status);
    };

/**
 * Convert SIWC profile to a normalized profile.
 *
 * @param {object} profileFields
 * @return {string}
 * @access protected
 */
    Strategy.prototype._convertProfileFields = function(profileFields) {
        var map = {
            'id':          'id',
            'username':    'username',
            'displayName': 'name',
            'name':        ['last_name', 'first_name', 'middle_name'],
            'gender':      'gender',
            'birthday':    'birthday',
            'profileUrl':  'link',
            'emails':      'email',
            'photos':      'picture'
        };
    
        var aFields = [];    
        profileFields.forEach(function(f) {
            // return raw SIWC profile field to support the many fields that don't map cleanly to Portable Contacts
            if (typeof map[f] === 'undefined') { return aFields.push(f); };
            if (Array.isArray(map[f])) {
                Array.prototype.push.apply(aFields, map[f]);
            } else {
                aFields.push(map[f]);
            }
        });
        return aFields.join(',');
    };


// Expose constructor.
module.exports = Strategy;
