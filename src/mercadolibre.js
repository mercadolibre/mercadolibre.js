;(function($) {

window.MercadoLibre = {
  baseURL: "https://api.mercadolibre.com",
  authorizationURL: "http://evening-earth-50.heroku.com/oauth/login",

  hash: {},
  callbacks: {},

  init: function(options) {
    this.options = options

    if (this.options.sandbox) this.baseURL = this.baseURL.replace(/api\./, "sandbox.")

    this._parseHash()

    this._checkPostAuthorization()

    this._triggerSessionChange()
  },

  get: function(url, callback) {
    $.getJSON(this._url(url), callback)
  },

  post: function(url, params, callback) {
    $.getJSON(this._url(url) + "&_method=POST&_body=" + JSON.stringify(params), callback)
  },

  getToken: function() {
    var token = $.cookie("access_token")
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
    var xd_url = window.location.protocol + "//" + window.location.host + this.options.xd_url
    var url = this.authorizationURL + "?redirect_uri=" + escape(xd_url) + "&type=user_agent&client_id=1&state=iframe"
    this._popup(url)
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
    $.cookie("access_token", null)
    this._triggerSessionChange()
  },

  _loginComplete: function() {
    this._popupWindow.close()
    this._triggerSessionChange()
    if (this.pendingCallback) this.pendingCallback()
  },

  _triggerSessionChange: function() {
    this.trigger("session.change", [this.getToken() ? true : false])
  },

  // Check if we're returning from a redirect
  // after authentication inside an iframe.
  _checkPostAuthorization: function() {
    if (this.hash.state && this.hash.state == "iframe") {
      window.opener.MercadoLibre.loginComplete()
    }
  },

  _url: function(url) {
    var append = url.indexOf("?") > -1 ? "&" : "?"

    url = this.baseURL + url + append + "callback=?"

    var token = this.getToken()

    if (token) {
      url += "&access_token=" + token
    }

    return url
  },

  _parseHash: function() {
    var hash = window.location.hash.substr(1)

    if (hash.length == 0) return

    var self = this

    $.each(hash.split("&"), function(_, fragment) {
      var parts = fragment.match(/([A-Za-z_\-]+)=(.*)$/)

      self.hash[parts[1]] = parts[2]
    })

    $.cookie("access_token", this.hash.access_token)

    window.location.hash = ""
  },

  _popup: function(url) {
    if (!this._popupWindow || this._popupWindow.closed) {
      var width = 400
      var height = 200
      var left = parseInt((screen.availWidth - width) / 2);
      var top = parseInt((screen.availHeight - height) / 2);

      this._popupWindow = window.open(url, "mercadolibre-login",
        "toolbar=no,dependent=yes,dialog=yes,status=no,location=yes,menubar=no,resizable=no,scrollbars=no,width=" + width + ",height=" + height + ",left=" + left + ",top=" + top + "screenX=" + left + ",screenY=" + top
      )
    }
    else {
      this._popupWindow.focus()
    }
  }
}

MercadoLibre._parseHash()

MercadoLibre._checkPostAuthorization()

})(jQuery);
