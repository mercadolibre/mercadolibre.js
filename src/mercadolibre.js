;
(function(cookie, XAuth) {

    var Store = function() {
        this.map = {};

        return this;
    };

    Store.localStorageAvailable = (function() {
        try {
            return ('localStorage' in window) && window.localStorage !== null;
        } catch (e) {
            return false;
        }
    })();

    if (Store.localStorageAvailable) {
        Store.prototype.get = function(key) {
            return window.localStorage.getItem(key);
        };

        Store.prototype.set = function(key, value) {
            window.localStorage.setItem(key, value);
        };

    } else {
        Store.prototype.get = function(key) {
            return this.map[key];
        };

        Store.prototype.set = function(key, value) {
            this.map[key] = value;
        };

    }

    var Sroc = window.Sroc;

    var MercadoLibre = {
        baseURL : "https://api.mercadolibre.com",
        authorizationURL : "http://auth.mercadolibre.com/authorization",
        authorizationStateURL : "https://auth.mercadolibre.com/jms/SITE/oauth/authorization/state",
        //authorizationStateURL : "https://auth.mercadolibre.com.ar/authorization/index",
  
        AUTHORIZATION_STATE : "authorization_state",

        hash : {},
        callbacks : {},
        pendingCallbacks: [],
        store : new Store(),
        appInfo : null,
        isAuthorizationStateAvaible : false,
        authorizationState: {},
        authorizationStateAvailableCallbacks : [],
        authorizationStateCallbackInProgress : false,
        synchronizationInProgress : false,
 
        init : function(options) {
            this.options = options;

            if (this.options.sandbox) 
                this.baseURL = this.baseURL.replace(/api\./, "sandbox.");
            
            if (!this.options.xauth_domain)
              this.options.xauth_domain = "static.mercadolibre.com.ar";
              
            if (!this.options.xd_url)
              this.options.xd_url = "/xd.html";
            
            XAuth.data.n = this.options.xauth_domain;
            XAuth.data.p = this.options.xd_url;
            if (window === window.top)
              XAuth.init();
            //No credentials needed on initialization. Just on-demand retrieval
        },
        _isExpired: function(authState) {
          //credentials are expired if not present or expired
          //for Meli there is a special case when credentials are only-identification. In that case are always expired
          if (authState == null) {
            return true;
          }
          if (authState.authorization_info.onlyID)  {
            return true;
          }
          var expirationTime = authState.authorization_info.expires_in;
          if (expirationTime) {
            var dateToExpire = new Date(parseInt(expirationTime));
            var now = new Date();
            if (dateToExpire <= now) {
              return true;
            }
          }
          return false;
        },
        _synchronizeAuthorizationState:function(tryRemote){
          //Synchronizes with iFrame in static.mlstatic.com domain.

          var key = this.options.client_id + this.AUTHORIZATION_STATE;
          var obj = this;

          //retrieves data from remote localStorage
          obj._retrieveFromXStore( obj.options.client_id + obj.AUTHORIZATION_STATE, function(value) {
            var key = obj.options.client_id + obj.AUTHORIZATION_STATE;
            if (tryRemote && (value.tokens[key] == null || obj._isExpired(value.tokens[key].data)) ) {
              //no data from iFrame - call login_status api
              obj._getRemoteAuthorizationState();
            } else {
              //save authState in local variable
              var authState = value.tokens[key].data;
              authState.expiration = value.tokens[key].expire;
              obj.authorizationState[key] = authState;
              obj._onAuthorizationStateAvailable(authState);
            }
          });
        },

        _retrieveFromXStore : function(key, retrieveCallback) {
            XAuth.retrieve({
                retrieve : [ key ],
                callback : retrieveCallback
            });
        },

        _getRemoteAuthorizationState : function() {
          //gets authorization state from api (https)
          //if already in progress dismiss call and wait
          if (!this.authorizationStateCallbackInProgress) {
            this.authorizationStateCallbackInProgress = true;
            if (this.appInfo == null) {
                this._getApplicationInfo(); //this will call _internalGetRemoteAuthorizationState TODO: Should make it more error-safe
            } else {
                this._internalGetRemoteAuthorizationState();
            }
          }
        },

        _getApplicationInfo : function() {
            var self = this;
            //TODO: beware 304 status response
            this.get("/applications/" + this.options.client_id, {"no-cache":true},
              function(response) {
                self.appInfo = response[2];
                self._internalGetRemoteAuthorizationState();
            });
        },

        _isMELI: function () {
          //are we inside MELI?
          return (document.domain.match(/(.*\.)?((mercadolibre\.com(\.(ar|ve|uy|ec|pe|co|pa|do|cr))?)|(mercadolibre\.cl)|(mercadolivre\.com\.br)|(mercadolivre\.pt))/) || document.domain.match(/.*localhost.*/))&& cookie('orgapi') != null;
        },

        _internalGetRemoteAuthorizationState : function() {
          //gets authorization state with client id loaded
          var self = this;
            //TODO: change when api is ready. Uses cookies instead of real api call
            //TODO: what happens ig no orgapi present????
          if (this._isMELI()) {
            self._onAuthorizationStateLoaded(
              {
                state: 'AUTHORIZED',
                authorization_info: {
                  access_token: cookie('orgapi'),
                  expires_in: new Date(new Date().getTime() + parseInt(10800) * 1000).getTime(),
                  user_id: cookie("orguserid")
                }
              });
          } else {

          /*  self._onAuthorizationStateLoaded(
              {
                state: 'UNKNOWN',
                authorization_info: {
                  access_token: null,
                  expires_in: new Date(new Date().getTime() + parseInt(10800) * 1000).getTime(),
                  user_id: null
                }
              });*/


            
            this._authorize()
              
/*              Sroc.get('https://www.mercadolibre.com/jms/' + this.appInfo.site_id.toLowerCase() + '/auth/authorization_state',
                {'client_id' : this.options.client_id}, function(){
                    var authorizationState = response[2];
                    self._onAuthorizationStateLoaded(authorizationState);
                });*/
          }
        },

        _onAuthorizationStateLoaded : function(authorizationState) {
        //TODO: This code should be moved to xd.htm
          //save new auth state in iFrame
          XAuth.extend({
            key : this.options.client_id + this.AUTHORIZATION_STATE,
            data : JSON.stringify(authorizationState),
            expire : new Date().getTime() + 10800 * 1000 /* expira en 3 hs */,
            extend : [ "*" ]
          });
          this.authorizationState[this.options.client_id + this.AUTHORIZATION_STATE]= authorizationState;
          this.isAuthorizationStateAvaible = false;
          this._onAuthorizationStateAvailable(authorizationState);
        },

        _getIdState: function() {
           return ({
             state: 'AUTHORIZED',
             authorization_info: {
               access_token: cookie('orgid'),
               expires_in: 0,
               onlyID: true
             }
           });
        },

        _onAuthorizationStateAvailable : function(authorizationState) {
          //all callbacks waiting for authorizationState
          this.authorizationStateCallbackInProgress = false;
          this.isAuthorizationStateAvaible = true;
          this._triggerSessionChange();
          while (this.authorizationStateAvailableCallbacks.length > 0){
            var callback = this.authorizationStateAvailableCallbacks.shift();
            callback(authorizationState);
          }
        },

        _getAuthorizationState : function(callback, onlyID) {
          // credentials valid or MELI + orgid
          if (this.isAuthorizationStateAvaible || (this._isMELI() && onlyID && cookie("orgid"))) {
              var key = this.options.client_id + this.AUTHORIZATION_STATE;
              //TODO: Check expiration
              if (this.authorizationState[key] != null && !this._isExpired(this.authorizationState[key])) {
                  callback(this.authorizationState[key]);
              } else if (this._isMELI() && onlyID && cookie("orgid")) {
                this.authorizationState[key] = this._getIdState();
                callback( this._getIdState());
              } else {
                //expired credentials, resynchronuze pushing this action
                this.isAuthorizationStateAvaible = false;
                this.authorizationStateAvailableCallbacks.push(callback);
                this._synchronizeAuthorizationState(true);
              }
          }else{
              this.authorizationStateAvailableCallbacks.push(callback);
              this._synchronizeAuthorizationState(true);
          }
        },

        _partial: function (func /* , 0..n args */ ) {
          var args = Array.prototype.slice.call(arguments, 1);
          return function () {
            var allArguments = args.concat(Array.prototype.slice.call(arguments));
            return func.apply(this, allArguments);
          };
        },

        _wrap: function (callback, url, retry, method, params) {
          var key = this.options.client_id + this.AUTHORIZATION_STATE;
          var self=this;
          var wrapper = function(response) {
            //check if token is invalid
            var properCallback = self._partial(callback, response);
            var success = function() {
              //se pudo loguear, vuelvo a llamar al get
              if (method == "get")
                Sroc.get( self._url(url, params), {}, self._wrap( callback,url, false, method));
              else if (method == "post") {}
            };
            var failure = function () {
              properCallback();
            };
            //invalid token error
            if (response[0] != 200 && ((response[2].error != null && response[2].error.match(/.*(token|OAuth).*/)) ||
                                       (response[2].message != null && response[2].message.match(/.*(token|OAuth).*/)) || response[0] == 403)
            ) {
              if (!self.authorizationStateCallbackInProgress && self.isAuthorizationStateAvaible) {
                self.isAuthorizationStateAvaible = false;
                //delete token
                XAuth.expire({key:key});
              }
              //get authentication state and then resend get call
              if (retry)
                self.withLogin(success, failure, true, false);
              else
                failure();
            } else {
              properCallback();
            }
          };
          return wrapper;
        },
        get : function(url, params, callback) {
          //no cache params
          Sroc.get(this._url(url, params), params, this._wrap(callback, url, true, "get", params));
        },

        post : function(url, params, callback) {
          var self=this;
          var call = function() {
            Sroc.post(self._url(url), params, self._wrap(callback, self._url(url), false, "post", params));
          }
          this.withLogin(call, callback, true, false);
        },

        remove : function(url, params, callback) {
          if (!params) {
            params = {};
          }
          params._method = "DELETE";
          Sroc.get(this._url(url, params), params, this._wrap(callback));
        },

        getToken : function() {
	  var key = this.options.client_id + this.AUTHORIZATION_STATE;
	  var authorizationState = this.authorizationState[key];
	  if (authorizationState != null) {
	    var token = authorizationState.authorization_info.access_token;
	    var expirationTime = authorizationState.authorization_info.expires_in;
	    if (token && expirationTime) {
		var dateToExpire = new Date(parseInt(expirationTime));
		var now = new Date();
		if (dateToExpire <= now) {
		    token = null;
		}
	    }
	    return (token && token.length > 0) ? token : null;
	  } else {
            return null;
          }
        },
        getLoginStatus : function (callback) {
            this._getAuthorizationState(function(authorizationState){
              callback(authorizationState);
            });
        },
        withLogin : function(successCallback, failureCallback, forceLogin, onlyID) {
            var self = this;
            this._getAuthorizationState(function(authorizationState){
                if(authorizationState.state == 'AUTHORIZED'){
                    successCallback();
                }else if(forceLogin){
                    self.pendingCallbacks.push(successCallback);
                    self.login();
                }else{
                    if (failureCallback) {
                      failureCallback();
                    }
                }
            }, onlyID);
        },

        login : function() {
            this._popup(this._authorizationURL(true));
        },
        _iframe: function(url, id) {
          if (!id)
            id = "xauthIFrame";
          var iframe = $("#" + id);
          if (!iframe || iframe.length == 0) {
            var elem = window.document.createElement("iframe");
            var r = elem.style;
            r.position = "absolute";
            r.left = r.top = "-999px";
            elem.id = id;
            window.document.body.appendChild(elem);
            elem.src = url;
          } else
            iframe[0].src=url;
          
        },
        _authorize: function () {
          this._iframe(this._authorizationStateURL());
        },
        bind : function(event, callback) {
            if (typeof (this.callbacks[event]) == "undefined")
                this.callbacks[event] = [];
            this.callbacks[event].push(callback);
        },

        trigger : function(event, args) {
            var callbacks = this.callbacks[event];

            if (typeof (callbacks) == "undefined") {
                return;
            }
            for ( var i = 0; i < callbacks.length; i++) {
                callbacks[i].apply(null, args);
            }
        },

        logout : function() {
          //expire xauth key
          XAuth.expire({key:this._getKey()});
          this.authorizationState[this._getKey()]=null;
          //logout from meli
          this._iframe('http://www.mercadolibre.com.ar/jm/logout', "logoutFrame");
          this._triggerSessionChange();
        },

        _triggerSessionChange : function() {
            this.trigger("session.change", [ this.getToken() ? true : false ]);
        },
        getSession: function() {
          return this.authorizationState[this._getKey()];
        },
        _url : function(url, params) {
            url = this.baseURL + url;
            var urlParams = "";
            if (params) {
              for(var key in params){
                if (urlParams.length > 0) {
                  urlParams += "&";
                }
                if (key == "no-cache" && params[key])
                  params[key] = Math.random()*Math.random();
                urlParams += key + "=" + params[key];
              }
            }

            var token = this.getToken();

            if (token) {
                var append = url.indexOf("?") > -1 ? "&" : "?";

                url += append + "access_token=" + token;
            }
            if (urlParams.length > 0) {
                append = url.indexOf("?") > -1 ? "&" : "?";
                url += append + urlParams;
            }

            return url;
        },

        _parseHash : function() {
            var hash = window.location.hash.substr(1);

            if (hash.length == 0) {
                return;
            }
            var self = this;


            if (hash[0] == '%')
              self.hash=JSON.parse(unescape(hash));
            else {
              var pairs = hash.split("&");

              for ( var i = 0; i < pairs.length; i++) {
                  var pair = null;

                  if (pair = pairs[i].match(/([A-Za-z_\-]+)=(.*)$/)) {
                      self.hash[pair[1]] = pair[2];
                  }
              }
            }
        },

        // Check if we're returning from a redirect
        // after authentication inside an iframe.
        _checkPostAuthorization : function() {
            if (this.hash.state && this.hash.state == "iframe") {
              var p = window.opener || window.parent;
              if (!this.hash.error) {
                this.options = {client_id:
                  RegExp("(APP_USR\\-)(\\d+)(\\-)").exec(this.hash.access_token)[2]
                }
                var key = this.options.client_id + this.AUTHORIZATION_STATE;
                //save in local storage the hash data
                var authorizationState =  {
                    state: 'AUTHORIZED',
                    authorization_info: {
                        access_token: this.hash.access_token,
                        expires_in: new Date(new Date().getTime() + parseInt(this.hash.expires_in) * 1000).getTime(),
                        user_id: this.hash.user_id
                    }
                };
                this.store.set(key, JSON.stringify({
                  key : key,
                  data : authorizationState,
                  expire : new Date().getTime() + 10800 * 1000 /* expira en 3 hs */,
                  extend : [ "*" ]
                }));

              }
              p.postMessage(JSON.stringify({cmd:"meli::loginComplete"}), "*");
            } else if (this.hash.state) {
              var p = window.opener || window.parent;
              authorizationState = this.hash;
              var key = this.hash.client_id + this.AUTHORIZATION_STATE;
              if (!this.hash.authorization_info && this.hash.state == "UNKNOWN") {
                this.hash.authorization_info =  {
                  access_token: null,
                  expires_in: new Date(new Date().getTime() + parseInt(10800) * 1000).getTime(),
                  user_id: null
                }
              } else {
                var expiration = new Date().getTime() + (this.hash.authorization_info ? this.hash.authorization_info.expires_in* 1000 : 0);
                this.hash.authorization_info.expires_in = expiration;
              }
              this.store.set(key, JSON.stringify({
                key : key,
                data : authorizationState,
                expire : expiration /* expira en 3 hs */,
                extend : [ "*" ]
              }));
              //p.MercadoLibre._loginComplete();
              p.postMessage(JSON.stringify({cmd:"meli::authComplete"}), "*");
            }
            else  if (window === window.top) XAuth.init();
        },

        _loginComplete : function() {
            if (this._popupWindow) {
                if (this._popupWindow.type && this._popupWindow.type == "modal") {
                        this._popupWindow.hide();
                        this._popupWindow = null;
                }
                else
                        this._popupWindow.close();
            }
            //retrieve auth data
            
           //update our authorization credentials
           var self = this;
           this.authorizationStateAvailableCallbacks.push(function(authState) {
              self._triggerSessionChange();

              while (self.pendingCallbacks.length > 0)
                  (self.pendingCallbacks.shift())();
           });
           this._synchronizeAuthorizationState(false);
          
        },
        _authComplete : function() {
           //update our authorization credentials
           var self = this;
           this.authorizationStateAvailableCallbacks.push(function(authState) {
              self._triggerSessionChange();
           });
           this._synchronizeAuthorizationState(false);
        },

        _popup : function(url) {
            if (!this._popupWindow || this._popupWindow.closed) {
                var width = 830;
                var height = 510;
                var left = parseInt((screen.availWidth - width) / 2);
                var top = parseInt((screen.availHeight - height) / 2);
                if (this.options.login_function)
                  this._popupWindow = this.options.login_function(url).show();
                else
                  this._popupWindow = (window.open(url, "", "toolbar=no,status=no,location=yes,menubar=no,resizable=no,scrollbars=no,width=" + width + ",height=" + height + ",left=" + left + ",top=" + top + "screenX=" + left + ",screenY=" + top));
                this._popup.on
            } else {
              if (this._popupWindow.focus)
                this._popupWindow.focus();
/*              else
                this._popupWindow.show();*/
            }
        },
        _getKey: function() {
          var key = null;
          try {
            key = this.options.client_id + this.AUTHORIZATION_STATE;
          } catch (Error) {
            key = "";
          }
          return key;
          
        },
        _authorizationStateURL: function() {
          var xd_url = "http://" + this.options.xauth_domain + this.options.xd_url;
          return this.authorizationStateURL.replace("SITE", this.appInfo.site_id.toLowerCase()) + "?client_id=" + this.options.client_id + "&redirect_uri=" + encodeURIComponent(xd_url) + "&response_type=token";
        },
        _authorizationURL : function(interactive) {
            var xd_url = "http://" + this.options.xauth_domain + this.options.xd_url;

            return this.authorizationURL + "?redirect_uri=" + encodeURIComponent(xd_url) + "&response_type=token" + "&client_id=" + this.options.client_id + "&state=iframe" + "&display=popup" + "&interactive=" + (interactive ? 1 : 0);
        }
    };

    MercadoLibre._parseHash();

    MercadoLibre._checkPostAuthorization();

    window.MercadoLibre = MercadoLibre;

})(cookie, XAuth);
