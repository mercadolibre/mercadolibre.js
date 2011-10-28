;(function(cookie) {

var Store = function() {
  this.map = {};

  return this;
}

Store.localStorageAvailable = (function() {
  try {
    return ('localStorage' in window) && window.localStorage !== null;
  }
  catch(e) {
    return false;
  }
})();

if (Store.localStorageAvailable) {
  Store.prototype.get = function(key) {
    return window.localStorage.getItem(key);
  }

  Store.prototype.set = function(key, value) {
    window.localStorage.setItem(key, value);
  }
  

}else {
  Store.prototype.get = function(key) {
    return this.map[key];
  }

  Store.prototype.set = function(key, value) {
    this.map[key] = value;
  }

}


var Sroc = window.Sroc;

var MercadoLibre = {
  baseURL: "https://api.mercadolibre.com",
  authorizationURL: "http://auth.mercadolibre.com/authorization",

  hash: {},
  callbacks: {},
  loginCallbacks: [],
  store: new Store(),


  init: function(options) {
    this.options = options

    if (this.options.sandbox) this.baseURL = this.baseURL.replace(/api\./, "sandbox.")
    
    _initXAuthData();
    //getLoginStatus()
  },

  /* Obtiene el status de login y llama a los 
   * callbacks correspondientes con el status obtenido
   */
  getLoginStatus: function(callback){
	  var loginStatus = this.getLocalLoginStatus();
	  if (loginStatus == null) {
		  this.loginCallbacks.push(callback);
		  if (this.fetchingLoginStatus !=  true) {
			  this.fetchingLoginStatus = true;
			  var obj=this;
			  XAuth.retrieve({
				  retrieve: ["www.mercadolibre.com.ar"],
				  callback: function(status) {obj.retrieveCallback(status)}
			  });
		  }
	  } else callback(loginStatus);

  },


  storeLoginStatus: function(status){
    //guardo en mi local storage el status
    this.store.set("login_status", status);
  },
  
  retrieveCallback: function(responseObj) {
	var results = responseObj.tokens;
	var cmd = responseObj.cmd.substr(5);
	var tokens = []
	for(var id in results) {
		tokens.push(results[id]);
	}
	if (tokens.length == 0)
		alert ('esto es un error, siempre deberia venir un status');
	else {
		this.storeLoginStatus(tokens[0]);
		this.runLoginCallbacks(tokens[0]);
	}
			    

  },
  
  runLoginCallbacks: function (status) {
	  for (var func in this.loginCallbacks)
		this.loginCallbacks[func](status);
  },

  getLocalLoginStatus: function() {
	  //obtengo la clave
	  var status = this.store.get("login_status");
	  //valido con la cookie
	  var validationCookie = cookie("orgid");
	  if (status != null && validationCookie != null && status.hash == validationCookie)
		return status;
	  else
		return null;
		
  },
	//Sroc.get(www.ml.com/jms/$site_id/auth/login_status, {}, this.storeLoginStatus())
  get: function(url, callback) {
    Sroc.get(this._url(url), {}, callback)
  },

  post: function(url, params, callback) {
    Sroc.post(this._url(url), params, callback)
  },

  getToken: function() {
    var token = this.store.getSecure("access_token")
    var expirationTime = this.store.get("expiration_time")
    if(token && expirationTime){
        var dateToExpire = new Date(parseInt(expirationTime))
        var now = new Date()
        if(dateToExpire <= now){
          token = null
        }
    }
    return (token && token.length > 0) ? token : null
  },

  requireLogin: function(callback) {
    var token = this.getToken()

    if (!token) {
      this.pendingCallback = callback
      this.login()
    }
    else {
      callback()
    }
  },

  login: function() {
    this._popup(this._authorizationURL(true));
  },

  bind: function(event, callback) {
    if (typeof(this.callbacks[event]) == "undefined") this.callbacks[event] = []
    this.callbacks[event].push(callback)
  },

  trigger: function(event, args) {
    var callbacks = this.callbacks[event]

    if (typeof(callbacks) == "undefined") return

    for (i = 0; i < callbacks.length; i++) {
      callbacks[i].apply(null, args)
    }
  },

  logout: function() {
    this.store.setSecure("access_token", "");
    this._triggerSessionChange()
  },

  _loginComplete: function(hash) {
    if (hash.access_token) {
      this.store.setSecure("access_token", hash.access_token);
      var dateToExpire = new Date( new Date().getTime() + parseInt(hash.expires_in) * 1000 )
      this.store.set("expiration_time", dateToExpire.getTime());
    }

    if (this._popupWindow) {
      this._popupWindow.close();
    }

    this._triggerSessionChange()

    if (this.pendingCallback) this.pendingCallback()
  },=

  _triggerSessionChange: function() {
    this.trigger("session.change", [this.getToken() ? true : false])
  },

  _initXAuthData: function() {
    var p = window.opener || window.parent;
    var xd_url = window.location.protocol + "//" + window.location.host + this.options.xd_url;
    if (p && window.location.href == xd_url) {
		if (this.getLocalLoginStatus() == null) {
			//le pego a la api de status
			//seteo el status y la cookie validadora
		}
  }

  // Check if we're returning from a redirect
  // after authentication inside an iframe.
  _checkPostAuthorization: function() {
	  
	
    if (this.hash.state && this.hash.state == "iframe" && !this.hash.error) {
      var p = window.opener || window.parent;

      p.MercadoLibre._loginComplete(this.hash);
    }
  },

  _url: function(url) {
    url = this.baseURL + url

    var token = this.getToken()

    if (token) {
      var append = url.indexOf("?") > -1 ? "&" : "?"

      url += append + "access_token=" + token
    }

    return url
  },

  _parseHash: function() {
    var hash = window.location.hash.substr(1)

    if (hash.length == 0) return

    var self = this

    var pairs = hash.split("&")

    for (var i = 0; i < pairs.length; i++) {
      var pair = null;

      if (pair = pairs[i].match(/([A-Za-z_\-]+)=(.*)$/)) {
        self.hash[pair[1]] = pair[2]
      }
    }
  },

  _popup: function(url) {
    if (!this._popupWindow || this._popupWindow.closed) {
      var width = 830
      var height = 510
      var left = parseInt((screen.availWidth - width) / 2);
      var top = parseInt((screen.availHeight - height) / 2);

      this._popupWindow = (window.open(url, "",
        "toolbar=no,status=no,location=yes,menubar=no,resizable=no,scrollbars=no,width=" + width + ",height=" + height + ",left=" + left + ",top=" + top + "screenX=" + left + ",screenY=" + top
      ))
    }
    else {
      this._popupWindow.focus()
    }
  },

  _silentAuthorization: function() {
    this._iframe = document.createElement("iframe");
    this._iframe.setAttribute("src", this._authorizationURL(false));
    this._iframe.style.width = "0px";
    this._iframe.style.height = "0px";
    this._iframe.style.position = "absolute";
    this._iframe.style.top = "-10px";
    document.body.appendChild(this._iframe);
  },

  _authorizationURL: function(interactive) {
    var xd_url = window.location.protocol + "//" + window.location.host + this.options.xd_url;

    return this.authorizationURL +
      "?redirect_uri=" + escape(xd_url) +
      "&response_type=token" +
      "&client_id=" + this.options.client_id +
      "&state=iframe" +
      "&display=popup" +
      "&interactive=" + (interactive ? 1 : 0);
  }
}

MercadoLibre._parseHash()

MercadoLibre._checkPostAuthorization()

window.MercadoLibre = MercadoLibre;

})(cookie);
