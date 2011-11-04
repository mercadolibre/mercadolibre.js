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
        AUTHORIZATION_STATE : "authorization_state",

        hash : {},
        callbacks : {},
        store : new Store(),
        appInfo : null,
        isAuthorizationStateAvaible : false,
        authorizationStateAvailableCallbacks : [],
        authorizationStateCallbackInProgress : false,
 
        init : function(options) {
            this.options = options;

            if (this.options.sandbox)
                this.baseURL = this.baseURL.replace(/api\./, "sandbox.");

            this._synchronizeAuthorizationState();
        },
        
	_isValidLocalAuthState: function(authState) {
	  //there is ath and stats
	  if (!this._hasHash()) return true;//no hash, local value i
	  else if (authState == false) return false; //hash but not initialized
	  else { //hash and initialized, validate
	    var value = cookie("ath");
	    //tiene que estar el client id en la cookie
	    var matched = value.match(eval("/\\|" + this.options.client_id + "\\=[^\\|]*\\|/"));
	    if (matched == null || matched.length == 0) return true;
	    //validate value against state
	    var hashValue = matched[0].split("=")[1];
	    return hashValue == authState.hash+"|";
	  }
	},
	_hasHash: function() {
	  var value = cookie("ath");
	  if (value == null) return false;
	  var matched = value.match(eval("/\\|" + this.options.client_id + "\\=[^\\|]*\\|/"));
	  if (matched == null || matched.length == 0) return false;
	  else return true;
	},
        _synchronizeAuthorizationState:function(){
	    var key = this.options.client_id + this.AUTHORIZATION_STATE;
            var authorizationState = JSON.parse(this.store.get( key));
            var obj = this;
            // ( local storage is initialized, but it is not synchronized ) or
            // ( local storage isn't initialized, but synchronization cookie exists => we had already requested the authorizationState )
            if (!this._isValidLocalAuthState(authorizationState)) {
                // synchronize it!
                var onXStoreLoadedCallback = function() {
                    obj._retrieveFromXStore( obj.options.client_id + obj.AUTHORIZATION_STATE, function(value) {
			var key = obj.options.client_id + obj.AUTHORIZATION_STATE;
			if (value.tokens[key] == null) {
			  //hay un error, borro la cookie de ath
			  cookie("ath", null);
			  obj._loadXStore(function(){obj._getRemoteAuthorizationState(obj._onAuthorizationStateLoaded)});
			} else {
			  var authorizationState = value.tokens[key].data;
			  authorizationState.expiration = value.tokens[key].expire;
			  obj.store.set(key, JSON.stringify(authorizationState));
			  obj._onAuthorizationStateAvailable(authorizationState);
			}
                    });
                };
                this._loadXStore(onXStoreLoadedCallback);
            } else if (authorizationState == null || !this._hasHash()) {
                // local storage isn't initialized and synchronization cookie doesn't exists => initialize cross storage
                var onXStoreLoadedCallback = function() {
                    obj._getRemoteAuthorizationState();
                };
                this._loadXStore(onXStoreLoadedCallback);
            } else this._onAuthorizationStateAvailable(authorizationState);
        },

        _loadXStore : function(onLoadFinishedCallback) {
            var iframe = document.createElement("iframe");
            var url = "http://static.localhost.gz:8080/files/xAuthServer.htm";
            if (location.protocol == "https") {
                url = "https://secure.mlstatic.com/org-img/xAuthServer.htm";
            }
            iframe.setAttribute("src", url);
            iframe.style.width = "0px";
            iframe.style.height = "0px";
            iframe.style.display = "none";
            iframe.onload = onLoadFinishedCallback;
            document.body.appendChild(iframe);
        },

        _retrieveFromXStore : function(key, retrieveCallback) {
            XAuth.retrieve({
                retrieve : [ key ],
                callback : retrieveCallback
            });
        },

        _getRemoteAuthorizationState : function(callback) {
            if (!this.authorizationStateCallbackInProgress) {
                this.authorizationStateCallbackInProgress = true;
                this.authorizationStateAvailableCallbacks.push(callback);
// 		var obj = this;
                if (this.appInfo == null) {
                    this._getApplicationInfo();
                } else {
                    this._internalGetRemoteAuthorizationState();
                }
            }
        },

        _getApplicationInfo : function() {
	    var self = this;
            this.get("/applications/" + this.options.client_id, function(response) {
                self.appInfo = response[2];
                self._internalGetRemoteAuthorizationState();
            });
        },
	_isMELI: function () {
	  return (document.domain.match(/(.*\.)?((mercadolibre\.com(\.(ar|ve|uy|ec|pe|co|pa|do|cr))?)|(mercadolibre\.cl)|(mercadolivre\.com\.br)|(mercadolivre\.pt))/) || document.domain.match(/.*localhost.*/))&& cookie('orgapi') != null
	},
        _internalGetRemoteAuthorizationState : function() {
            var self = this;
	    if (this._isMELI())
	      self._onAuthorizationStateLoaded(
		{
		  status: 'AUTHORIZED',
		  authorization_credential: {
		    access_token: cookie('orgapi'),
		    expires_in: new Date(new Date().getTime() + parseInt(10800) * 1000).getTime(),
		    user_id: cookie("orguserid")
		}
	      });
		
	    else {
	      Sroc.get('https://www.mercadolibre.com/jms/' + this.appInfo.site_id.toLowerCase() + '/auth/authorization_state', 
                    {'client_id' : this.options.client_id}, function(){
                        var authorizationState = response[2];
                        self._onAuthorizationStateLoaded(authorizationState);
                    });
	    }
        },
	_updateATH: function () {
	  //update ath value for the current client_id
	  var actualValue = cookie("ath");
	  var newHash = this._makeId(5);
	  if (actualValue == null) actualValue = "|";
	  //already hashed?
	  var matcher = "/\\|" + this.options.client_id + "\\=[^\\|]*\\|/";
	  if (actualValue.match(eval(matcher))) {
	    //replace it with new hash
	    actualValue.replace(eval(matcher), "|" + this.options.client_id + "=" + newHash + "|");
	  } else {
	    //add new hash
	    actualValue = actualValue +this.options.client_id + "="+ newHash + "|";
	  }
	  cookie("ath", actualValue);
	  return newHash;
	  
	},
        _onAuthorizationStateLoaded : function(authorizationState) {
	    //generate a new hash for the authorization status
	    authorizationState.hash = this._updateATH();
            XAuth.extend({
                key : this.options.client_id + this.AUTHORIZATION_STATE,
                data : JSON.stringify(authorizationState),
                expire : new Date().getTime() + 10800 * 1000 /* expira en 3 hs */,
                extend : [ "*" ],
                callback : function() {
                }
            });
            this.store.set(this.options.client_id + this.AUTHORIZATION_STATE, JSON.stringify(authorizationState));
            this._onAuthorizationStateAvailable(authorizationState);
        },

        _onAuthorizationStateAvailable : function(authorizationState) {
            this.isAuthorizationStateAvaible = true;
	    var size = this.authorizationStateAvailableCallbacks.length;
            for ( var i = 0; i < size; i++) {
                this.authorizationStateAvailableCallbacks[i](authorizationState);
            }
        },

        _getAuthorizationState : function(callback) {
            // Se cargo el xStore
            if (this.isAuthorizationStateAvaible) {
		var key = this.options.client_id + this.AUTHORIZATION_STATE;
                // hay authorization_state
                var authorizationState = JSON.parse(this.store.get(key));
                // Estoy actualizado?
                if (this._isValidLocalAuthState(authorizationState)) {
                    callback(authorizationState);
                } else {
                    this.isAuthorizationStateAvaible = false;
                    this.authorizationStateAvailableCallbacks.push(callback);
                    this._synchronizeAuthorizationState();
                }
            }else{
                this.authorizationStateAvailableCallbacks.push(callback);
            }
        },

        get : function(url, callback) {
	    var wrapper = function(response) {
	      
	    }
            Sroc.get(this._url(url), {}, callback);
        },

        post : function(url, params, callback) {
            Sroc.post(this._url(url), params, callback);
        },

        getToken : function() {
	  var key = this.options.client_id + this.AUTHORIZATION_STATE;
	  var authorizationState = JSON.parse(this.store.get(key));
	  if (authorizationState != null && authorizationState.hash != null) {
	    var token = authorizationState.authorization_credential.access_token;
	    var expirationTime = authorizationState.authorization_credential.expires_in;
	    if (token && expirationTime) {
		var dateToExpire = new Date(parseInt(expirationTime));
		var now = new Date();
		if (dateToExpire <= now) {
		    token = null;
		}
	    }
	    return (token && token.length > 0) ? token : null;
	  } else return null;
        },

        withLogin : function(successCallback, failureCallback, forceLogin) {
            var self = this;
            this._getAuthorizationState(function(authorizationState){
                if(authorizationState.status == 'AUTHORIZED'){
                    successCallback();
                }else if(forceLogin){
                    self.pendingCallback = successCallback;
                    self.login();
                }else{
                    failureCallback();
                }
            });
        },

        login : function() {
            this._popup(this._authorizationURL(true));
        },

        bind : function(event, callback) {
            if (typeof (this.callbacks[event]) == "undefined")
                this.callbacks[event] = [];
            this.callbacks[event].push(callback);
        },

        trigger : function(event, args) {
            var callbacks = this.callbacks[event];

            if (typeof (callbacks) == "undefined")
                return
                
            for ( var i = 0; i < callbacks.length; i++) {
                callbacks[i].apply(null, args);
            }
        },

        logout : function() {
            this.store.setSecure("access_token", "");
            this._triggerSessionChange();
        },

        _triggerSessionChange : function() {
            this.trigger("session.change", [ this.getToken() ? true : false ]);
        },

        _url : function(url) {
            url = this.baseURL + url;

            var token = this.getToken();

            if (token) {
                var append = url.indexOf("?") > -1 ? "&" : "?";

                url += append + "access_token=" + token;
            }

            return url;
        },

        _parseHash : function() {
            var hash = window.location.hash.substr(1);

            if (hash.length == 0)
                return;

            var self = this;

            var pairs = hash.split("&");

            for ( var i = 0; i < pairs.length; i++) {
                var pair = null;

                if (pair = pairs[i].match(/([A-Za-z_\-]+)=(.*)$/)) {
                    self.hash[pair[1]] = pair[2];
                }
            }
        },

        // Check if we're returning from a redirect
        // after authentication inside an iframe.
        _checkPostAuthorization : function() {
            if (this.hash.state && this.hash.state == "iframe" && !this.hash.error) {
                var p = window.opener || window.parent;

                p.MercadoLibre._loginComplete(this.hash);
            }
        },

        _loginComplete : function(hash) {
            if (this._popupWindow) {
                this._popupWindow.close();
            }
            
            if(!hash.access_token){
                //If the user denies authorization exit 
                return
            }
            
           //build authorizationState object
           var authorizationState = {
               status: 'AUTHORIZED',
               authorization_credential: {
                   accessToken: hash.access_token,
                   expiresIn: new Date(new Date().getTime() + parseInt(hash.expires_in) * 1000).getTime(),
                   userID: hash.user_id
               },
               hash: hash.hash 
           };
           //update our authorization credentials
           this._onAuthorizationStateLoaded(authorizationState);
          
           this._triggerSessionChange();
    
           if (this.pendingCallback)
                this.pendingCallback();
        },

	_makeId: function(chars) {
	    var text = "";
	    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	    for( var i=0; i < chars; i++ )
		text += possible.charAt(Math.floor(Math.random() * possible.length));

	    return text;
	},
        _popup : function(url) {
            if (!this._popupWindow || this._popupWindow.closed) {
                var width = 830;
                var height = 510;
                var left = parseInt((screen.availWidth - width) / 2);
                var top = parseInt((screen.availHeight - height) / 2);

                this._popupWindow = (window.open(url, "", "toolbar=no,status=no,location=yes,menubar=no,resizable=no,scrollbars=no,width=" + width + ",height=" + height + ",left=" + left + ",top=" + top + "screenX=" + left + ",screenY=" + top));
            } else {
                this._popupWindow.focus();
            }
        },

        _authorizationURL : function(interactive) {
            var xd_url = window.location.protocol + "//" + window.location.host + this.options.xd_url;

            return this.authorizationURL + "?redirect_uri=" + escape(xd_url) + "&response_type=token" + "&client_id=" + this.options.client_id + "&state=iframe" + "&display=popup" + "&interactive=" + (interactive ? 1 : 0);
        }
    };

    MercadoLibre._parseHash();

    MercadoLibre._checkPostAuthorization();

    window.MercadoLibre = MercadoLibre;

})(cookie, XAuth);
