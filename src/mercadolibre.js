;
(function(cookie) {

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
        loginCallbacks : [],
        store : new Store(),
        xStoreInitInProgress : null,
        xStoreCallbacks : [],
        authorizationStateCallbackInProgress : null,
        authorizationStateCallbacks : [],
        appInfo: null,
        initialized: false,
        initializationCompleteCallbacks : [],
        authorizationStateLoaded : false,
        authorizationStateLoadedCallbacks : [],
        
        init : function(options) {
            this.options = options;

            if (this.options.sandbox)
                this.baseURL = this.baseURL.replace(/api\./, "sandbox.");

            var authorizationState = this.store.get(AUTHORIZATION_STATE);
            var obj = this;
            // ( local storage is initialized, but it is not synchronized ) or
            // ( local storage isn't initialized, but synchronization cookie exists => we had already requested the authorizationState )
            if ((authorizationState != null && authorizationState.hash != cookie("ath")) || (authorizationState == null && cookie("ath"))) {
                // synchronize it!
                var onXStoreLoadedCallback = function() {
                    obj._retrieveFromXStore(obj.AUTHORIZATION_STATE, function(value) {
                        obj.store(obj.AUTHORIZATION_STATE, value);
                        obj.onAuthorizationStateLoaded(value);
                    });
                };
                this._loadXStore(onXStoreLoadedCallback);
            } else if (authorizationState == null && !cookie("ath")) {
                // local storage isn't initialized and synchronization cookie doesn't exists => initialize cross storage
                var onXStoreLoadedCallback = function() {
                    obj._getRemoteAuthorizationState(obj._onAuthorizationStateLoaded);
                };
                this._loadXStore(onXStoreLoadedCallback);
            }
            this.initialized = true;
            var size = this.initializationCompleteCallbacks.length;
            for ( var i = 0; i < size; i++) {
                this.initializationCompleteCallbacks[i]();
            }           
        },

        _loadXStore : function(onLoadFinishedCallback) {
            this.xStoreCallbacks.push(onLoadFinishedCallback);
            if (!this.xStoreInitInProgress) {
                this.xStoreInitInProgress = true;
                var iframe = document.createElement("iframe");
                var url = "http://static.mlstatic.com/org-img/xAuthServer.js";
                if (location.protocol == "https") {
                    url = "https://secure.mlstatic.com/org-img/xAuthServer.js";
                }
                iframe.setAttribute("src", url);
                iframe.style.width = "0px";
                iframe.style.height = "0px";
                iframe.style.display = "none";
                iframe.onload = this._onXStoreLoadedCallback();
                document.body.appendChild(iframe);
            }
        },

        _onXStoreLoadedCallback : function() {
            var size = this.xStoreCallbacks.length;
            for ( var i = 0; i < size; i++) {
                this.xStoreCallbacks[i]();
            }
            this.xStoreInitInProgress = false;
        },

        _retrieveFromXStore : function(key, retrieveCallback) {
            this.xStore.retrieve({
                retrieve : [ key ],
                callback : retrieveCallback
            });
        },

        _getRemoteAuthorizationState : function(callback) {
            if(!this.authorizationStateCallbackInProgress){
                this.authorizationStateCallbackInProgress = true;
                this.authorizationStateCallbacks.push(callback);
                if( this.appInfo == null){
                    this._getApplicationInfo(this._internalGetRemoteAuthorizationState);
                }else{
                    this._internalGetRemoteAuthorizationState();
                }
            }
        },
        
        _getApplicationInfo: function(callback){
            this.get("/applications/"+this.options.client_id, function(response, callback){
                this.appInfo = response[2];
                callback();
            });
        },
        
        _internalGetRemoteAuthorizationState : function(){
             Sroc.get('https://www.mercadolibre.com/jms/'+this.appInfo.site_id.toLowerCase()+'/auth/authorization_state', 
                    { 'client_id' : this.options.client_id }, this._onAuthorizationStateLoaded);
        },

        _onAuthorizationStateLoaded : function(response) {
            XAuth.extend({
                key : this.options.client_id + AUTHORIZATION_STATE,
                data : response[2],
                expire : new Date().getMilliseconds() + 10800 * 1000 /* expira en 3 hs */,
                extend : [ "/.*/" ],
                callback : function() {
                }
            });
            this._store(obj.AUTHORIZATION_STATE, response[2]);
            cookie("ath", response[2].hash);
            //execute pending callbacks
            var size = this.authorizationStateCallbackInProgress.length;
            for ( var i = 0; i < size; i++) {
                this.authorizationStateCallbacks[i](response[2]);
            }
            this.authorizationStateCallbackInProgress = false;
        },
        
        _getAuthorizationState: function(callback){
            if(this.initialized){
                var obj = this;
                var aux = function(){
                    obj._getAuthorizationState(callback);
                };
                this.initializationCompleteCallbacks.push(aux);
            }else{
                //Se cargo el xStore
                if(this.xStoreInitInProgress != null && !this.xStoreInitInProgress){
                    //hay authorization_state?
                    var authorizationState = this._retrieveFromXStore
                    if( cookie("ath") ==  )
                    //si existe la cookie y es la misma, hago el retrieve
                    
                    else{
                        _getRemote
                    }
                    
                    
                }else{
                    //
                    
                }
            }
        },

        runLoginCallbacks : function(status) {
            for ( var func in this.loginCallbacks)
                this.loginCallbacks[func](status);
        },

        getLocalLoginStatus : function() {
            // obtengo la clave
            var status = this.store.get("login_status");
            // valido con la cookie
            var validationCookie = cookie("orgid");
            if (status != null && validationCookie != null && status.hash == validationCookie)
                return status;
            else
                return null;

        },

        get : function(url, callback) {
            Sroc.get(this._url(url), {}, callback);
        },

        post : function(url, params, callback) {
            Sroc.post(this._url(url), params, callback);
        },

        getToken : function() {
            var token = this.store.getSecure("access_token");
            var expirationTime = this.store.get("expiration_time");
            if (token && expirationTime) {
                var dateToExpire = new Date(parseInt(expirationTime));
                var now = new Date();
                if (dateToExpire <= now) {
                    token = null;
                }
            }
            return (token && token.length > 0) ? token : null;
        },

        withLogin : function(successCallback, failureCallback, forceLogin) {
            _getLoginStatus(callback);

            // if (!token) {
            // this.pendingCallback = callback
            // this.login()
            // }
            // else {
            // callback()
            // }
        },

        funcionTrola : function(loginStatus, successCallback, failureCallback, forceLogin) {
            if (loginStatus.status = ACTIVE)
                successCallback();
            else if (forceLogin) {
                showLogin(successCallback, failureCallback);
            } else {

            }
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

        _initializeXAuthStore : function() {
            var p = window.opener || window.parent;
            var xd_url = window.location.protocol + "//" + window.location.host + this.options.xd_url;
            if (p && window.location.href == xd_url) {
                if (this.getLocalLoginStatus() == null) {
                    // le pego a la api de status
                    // seteo el status y la cookie validadora
                }
            }
            ;
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
            if (hash.access_token) {
                this.store.setSecure("access_token", hash.access_token);
                var dateToExpire = new Date(new Date().getTime() + parseInt(hash.expires_in) * 1000);
                this.store.set("expiration_time", dateToExpire.getTime());

                // aca guardar access_token usando orgapi
            }

            if (this._popupWindow) {
                this._popupWindow.close();
            }

            this._triggerSessionChange();

            if (this.pendingCallback)
                this.pendingCallback();
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

})(cookie);
