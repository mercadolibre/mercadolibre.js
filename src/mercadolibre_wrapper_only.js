(function(cookie) {
  var MercadoLibreW = {
    init: function() {
      var obj = this;
      if (typeof(window.MELI) === "undefined") {
        setTimeout('MercadoLibreW.init()', 50);
        return;
      }
      window.MELI.oldGetLoginStatus = window.MELI.getLoginStatus;
      window.MELI.oldExpireToken = window.MELI._expireToken;
      var self = this;
      window.MELI.getLoginStatus = function(callback) {
        var newCallback = self._partial(self.getLoginStatus, callback);
        window.MELI.oldGetLoginStatus(newCallback);
      }
      window.MELI._expireToken = function(key) {
        window.MELI.oldExpireToken(key);
        //skip subdomain
        var domain = document.domain.slice(document.domain.indexOf("."), document.domain.length);
        cookie("orgapi", null, {domain:domain, path:"/"});
        cookie("ats", null, {domain:domain, path:"/"});
        window.MELI.isAuthorizationStateAvaible = false;
      }
      window.MELI._storeSecret = function(secret) {
          //skip subdomain
          var domain = document.domain.slice(document.domain.indexOf("."), document.domain.length);
          cookie("ats", JSON.stringify(secret), {domain:domain, path:"/"});
          this.secret = secret;
      }

      window.MELI._getApplicationInfo = function(callback) {
          window.MELI.appInfo = {id: window.MELI.options.client_id, site_id: window.MELI.options.site_id};
          if (callback) callback();
      }

      window.MELI._authorizationStateURL = function() {
        return this.authorizationStateURL.replace("SITE", this.appInfo.site_id.toLowerCase()) + "?client_id=" + this.options.client_id + "&redirect_uri=" + encodeURIComponent(this._xd_url()) + "&response_type=token&hashKey=" + obj._randomString(15);
      }

        
    },

    _expireToken : function(key) {
        window.MELI.oldExpireToken(key);
        //skip subdomain
        var domain = document.domain.slice(document.domain.indexOf("."), document.domain.length);
        cookie("ats", null, {domain:domain, path:"/"});
        window.MELI.isAuthorizationStateAvaible = false;
    },

    _partial: function (func /* , 0..n args */ ) {
      var args = Array.prototype.slice.call(arguments, 1);
      var self = this;
      return function () {
        var allArguments = args.concat(Array.prototype.slice.call(arguments));
        return func.apply(self, allArguments);
      };
    },

    _randomString: function(qChars) {
      var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
      var randomstring = '';
      for (var i=0; i<qChars; i++) {
        var rnum = Math.floor(Math.random() * chars.length);
        randomstring += chars.substring(rnum,rnum+1);
      }
      return randomstring;
    },

    getLoginStatus: function(callback, status) {
      if (status && status.state == "AUTHORIZED") {
        //token circuit is OK, validate cookies
        if ((cookie("orgapi")== null || cookie("orgapi") == "0")&& (cookie("orgid") == null || cookie("orgid") == "0")) {
          window.MELI.logout();
          status=null;
        } else if (cookie("orgapi") != null && cookie("orgapi") != "0") {
          //validate user id
          if (cookie("orguseridp") != null && cookie("orguseridp") != "0") {
            if (cookie("orguseridp") != status.authorization_info.user_id) {
          if (window.MELI.refreshing) {
                window.MELI.logout();
                window.MELI.refreshing = false;
                status=null;
              } else {
                window.MELI.refreshing = true;
                this._expireToken(window.MELI._getKey());
                window.MELI.getLoginStatus(callback);
                return;
              }
            }
          }
        } else if (cookie("orgid") != null && cookie("orgid") != "0") {
          //identified user
          status.state = "IDENTIFIED";
          status.authorization_info.access_token = cookie("orgid");
          window.MELI.authorizationState[window.MELI._getKey()] = status;
        }
      } else if (status == null || status.state == "UNKNOWN" || status.state == "NOT_AUTHORIZED") {
        status = window.MELI.unknownStatus;
        //if orgapi then is indeed authorized
        if (cookie("orgapi") != null && cookie("orgapi") != "0") {
          status.state = "AUTHORIZED";
          status.authorization_info = {
            access_token: cookie("orgapi"),
            expires_in: new Date(new Date().getTime() + parseInt(10800) * 1000).getTime(),
            user_id: null
          }
          window.MELI.authorizationState[window.MELI._getKey()] = status;
        } else if (cookie("orgid") != null && cookie("orgid") != "0") {
          //identified user
          status.state = "IDENTIFIED";
          status.authorization_info = {
            access_token: cookie("orgid"),
            expires_in: new Date(new Date().getTime() + parseInt(10800) * 1000).getTime(),
            user_id: null
          }
          window.MELI.authorizationState[window.MELI._getKey()] = status;
        }
      }
      callback(status);
    }
  }
  window.MercadoLibreW = MercadoLibreW;
  MercadoLibreW.init();

})(cookie);
