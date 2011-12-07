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
        authorizationStateURL : "https://www.mercadolibre.com/jms/SITE/oauth/authorization/state",
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

        //initialization: set base domains an url. Initialize XAuth on base window
        init : function(options) {
            this.options = options;

            if (this.options.sandbox) 
                this.baseURL = this.baseURL.replace(/api\./, "sandbox.");
            
            if (this.options.test) 
                this.baseURL = this.baseURL.replace(/https\./, "http.");
            
            if (!this.options.xauth_domain)
              this.options.xauth_domain = "static.mlstatic.com";

            if (this.options.xauth_domain_fallback && typeof(postMessage) == "undefined") 
              this.options.xauth_domain = this.options.xauth_domain_fallback;
              
            if (!this.options.xd_url)
              this.options.xd_url = "/xd.html";
            
            XAuth.data.n = this.options.xauth_domain;
            XAuth.data.p = this.options.xd_url;
            XAuth.data.port = this.options.xauth_port;
            if (window === window.top)
              XAuth.init();
        },
 
        //Is the authState still valid?
        _isExpired: function(authState) {
          //credentials are expired if not present or expired
          if (authState == null) {
            return true;
          }
          if (typeof(authState.authorization_info) == "undefined")
			return true;
			
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

        //Synchronizes auth state with localStorage in iFrame or auth FE
        _synchronizeAuthorizationState:function(tryRemote){
          var key = this._getKey();
          var obj = this;

          //retrieves data from remote localStorage
          XAuth.retrieve({
            retrieve: [ key ],
            callback: function(value) {
				if (tryRemote && (value.tokens[key] == null || obj._isExpired(value.tokens[key].data)) ) {
				  //no data from iFrame - call login_status api
				  obj._getRemoteAuthorizationState();
				} else {
				  //save authState in local variable
				  var authState = null
				  if (typeof(value.tokens[key]) != "undefined") {
					var authState = value.tokens[key].data;
					authState.expiration = value.tokens[key].expire;
				  }
				  obj.authorizationState[key] = authState;
				  obj._onAuthorizationStateAvailable(authState);
				}
			  }
          });
        },

        /**
         * gets authorization state from auth FE
         */
        _getRemoteAuthorizationState : function() {
          //if already in progress dismiss call and wait
          if (!this.authorizationStateCallbackInProgress) {
            this.authorizationStateCallbackInProgress = true;
            if (this.appInfo == null) {
                this._getApplicationInfo(this._authorize);
            } else {
                this._authorize();
            }
          }
        },

        _getApplicationInfo : function(callback) {
            var self = this;
            this.get("/applications/" + this.options.client_id, {},
              function(response) {
                self.appInfo = response[2];
                if (callback) callback();
            });
        },

        _onAuthorizationStateAvailable : function(authorizationState) {
          //all callbacks waiting for authorizationState
          this.authorizationStateCallbackInProgress = false;
          this.isAuthorizationStateAvaible = true;
          //there is a new auth state, session changed
          this._triggerSessionChange();
          while (this.authorizationStateAvailableCallbacks.length > 0){
            var callback = this.authorizationStateAvailableCallbacks.shift();
            callback(authorizationState);
          }
        },

        getLoginStatus : function(callback) {
          if (this.isAuthorizationStateAvaible)
          {
              var key = this._getKey();
              if (this.authorizationState[key] != null && !this._isExpired(this.authorizationState[key]))
              {
                  callback(this.authorizationState[key])
              }
              else
              {
                //expired credentials, resynchronyze pushing this action
                this.isAuthorizationStateAvaible = false;
                this.authorizationStateAvailableCallbacks.push(callback);
                this._synchronizeAuthorizationState(true);
              }
          }
          else
          {
              this.authorizationStateAvailableCallbacks.push(callback);
              this._synchronizeAuthorizationState(true);
          }

        },

        //partial application of a function
        _partial: function (func /* , 0..n args */ ) {
          var args = Array.prototype.slice.call(arguments, 1);
          return function () {
            var allArguments = args.concat(Array.prototype.slice.call(arguments));
            return func.apply(this, allArguments);
          };
        },

		//wraps a request to intercept the response
        _wrap: function (url, method, params, options, callback) {
          var key = this._getKey();
          var self=this;
          var wrapper = function(response) {
            //check if token is invalid
            var properCallback = self._partial(callback, response);
            var success = function() {
              //se pudo loguear, vuelvo a llamar al get
              if (method == "get")
                Sroc.get( self._url(url), params, self._wrap( url, method, params, {}, callback));
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
              if (options.retry)
                self.withLogin(success, failure, true, false);
              else
                failure();
            } else {
              properCallback();
            }
          };
          return wrapper;
        },
 
        get : function(url, params, callback, next) {
          //no cache params
          if (!next)
            next = this._wrap(url,"get", params, {retry:true}, callback);

          Sroc.get(this._url(url), params, next);
        },

        post : function(url, params, callback) {
          var self=this;
          var call = function() {
            Sroc.post(self._url(url), params, self._wrap(url, "post", params, {}, callback));
          }
          this.withLogin(call, callback, true, false);
        },

        remove : function(url, params, callback) {
          if (!params) {
            params = {};
          }
          Sroc.remove(this._url(url), params, this._wrap(url, "delete", params, {}, callback));
        },

        getToken : function() {
          var key = this._getKey();
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
        withLogin : function(successCallback, failureCallback, forceLogin) {
            var self = this;
            this.getLoginStatus(function(authorizationState){
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
            });
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
          MercadoLibre._iframe(MercadoLibre._authorizationStateURL());
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
          this._iframe(this._logoutURL(), "logoutFrame");
          this._triggerSessionChange();
        },

        _triggerSessionChange : function() {
            this.trigger("session.change", [ this.getToken() ? true : false ]);
        },
        getSession: function() {
          return this.authorizationState[this._getKey()];
        },
        
        _url : function(url) {
            url = this.baseURL + url;
            var urlParams = "";

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
		_notifyParent: function(message) {
			var p = window.opener || window.parent;
			if (typeof(p) == "undefined") return;
			if (typeof(postMessage) == "undefined") {
				
				if (message == "meli::loginComplete") 
					p._loginComplete();
				else if (message == "meli::authComplete") 
					p._authComplete();
				else if (message == "meli::logout") 
					p._logoutComplete();
				
			} else p.postMessage(JSON.stringify({cmd:message}), "*");
		},
        // Check if we're returning from a redirect
        // after authentication inside an iframe.
        _checkPostAuthorization : function() {
			var p = window.opener || window.parent;
			
            if (this.hash.state && this.hash.state == "iframe") {
			  //returning from authorization (login)
              if (!this.hash.error) {	
				//TODO: Should remove this parsing
				this.options = {client_id:
                  RegExp("(APP_USR\\-)(\\d+)(\\-)").exec(this.hash.access_token)[2]
                }
                var key = this._getKey();
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
                  expire : authorizationState.authorization_info.expires_in,
                  extend : [ "*" ]
                }));

              }
              this._notifyParent("meli::loginComplete");
            } else if (this.hash.state) {
			  //from Authorization State
              authorizationState = this.hash;
              var key = this.hash.client_id + this.AUTHORIZATION_STATE;
              if (!this.hash.authorization_info && (this.hash.state == "UNKNOWN" || this.hash.state=="NOT_AUTHORIZED")) {
                this.hash.authorization_info =  {
                  access_token: null,
                  expires_in: new Date(new Date().getTime() + parseInt(10800) * 1000).getTime(),
                  user_id: null
                }
              } else if (this.hash.autorization_info) {
                var expiration = new Date().getTime() + (this.hash.authorization_info ? this.hash.authorization_info.expires_in* 1000 : 0);
                this.hash.authorization_info.expires_in = expiration;
              }
              this.store.set(key, JSON.stringify({
                key : key,
                data : authorizationState,
                expire : expiration ,
                extend : [ "*" ]
              }));
              this._notifyParent("meli::authComplete");

            } else if (this.hash.action == "logout") {
              this._notifyParent("meli::logout");
              
            }
            //else  if (window === window.top) XAuth.init();
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
           //update our authorization credentials
           var self = this;
           this.authorizationStateAvailableCallbacks.push(function(authState) {
              self._triggerSessionChange();

              while (self.pendingCallbacks.length > 0)
                  (self.pendingCallbacks.shift())();
           });
           this._synchronizeAuthorizationState(false);
          
        },
        _logoutComplete : function () {
          $('#logoutFrame').remove();
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
          return this.authorizationStateURL.replace("SITE", this.appInfo.site_id.toLowerCase()) + "?client_id=" + this.options.client_id + "&redirect_uri=" + encodeURIComponent(this._xd_url()) + "&response_type=token";
        },
        _authorizationURL : function(interactive) {
            return this.authorizationURL + "?redirect_uri=" + encodeURIComponent(this._xd_url()) + "&response_type=token" + "&client_id=" + this.options.client_id + "&state=iframe" + "&display=popup" + "&interactive=" + (interactive ? 1 : 0);
        },
        _logoutURL: function() {
            return "http://www.mercadolibre.com.ar/jm/logout?urlTo=" + encodeURIComponent(this._xd_url()+"#action=logout");
        },
        _xd_url: function() {
			return "http://" + this.options.xauth_domain + (this.options.xauth_port ? ":" + this.options.xauth_port : "") + this.options.xd_url;
		}
        
    };

    MercadoLibre._parseHash();

    MercadoLibre._checkPostAuthorization();

    window.MercadoLibre = MercadoLibre;

})(cookie, XAuth);
