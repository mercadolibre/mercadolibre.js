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
        var newCallback = function(status){
          self.getLoginStatus(callback, status);
        };
        window.MELI.oldGetLoginStatus(newCallback);
      }
      window.MELI._expireToken = function(key) {
        window.MELI.oldExpireToken(key);
        //skip subdomain
        var domain = document.domain.slice(document.domain.indexOf("."), document.domain.length);
        cookie("ats", null, {domain:domain, path:"/"});
        window.MELI.isAuthorizationStateAvaible = false;
      }; 
      window.MELI._storeSecret = function(secret) {
          //skip subdomain
          var domain = document.domain.slice(document.domain.indexOf("."), document.domain.length);
          cookie("ats", JSON.stringify(secret), {domain:domain, path:"/"});
          this.secret = secret;
      };

      window.MELI._getApplicationInfo = function(callback) {
          window.MELI.appInfo = {id: window.MELI.options.client_id, site_id: window.MELI.options.site_id};
          if (callback) callback();
      };

      window.MELI._authorizationStateURL = function() {
        return this.authorizationStateURL.replace("SITE", this.appInfo.site_id.toLowerCase()) + "?client_id=" + this.options.client_id + "&redirect_uri=" + encodeURIComponent(this._xd_url()) + "&response_type=token&hashKey=" + obj._randomString(15);
      };

        
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

    _isLoggedIn: function(){
      var orgapi= cookie("orgapi");
      return orgapi != null && orgapi != "0";
    },

    _isOwner: function(status){
      var owner = cookie("orguseridp")
      return owner && owner == status.authorization_info.user_id
    },

    _isIdentified: function(){
      var orgidValue = cookie("orgid");
      return orgidValue != null && orgidValue != "0";
    },

    _refreshAuthorizationState: function(callback){
      if( window.MELI.refreshing ){
        window.MELI.refreshing = false;
        callback(window.MELI.unknownStatus);
      }else{
        window.MELI.refreshing = true;
        window.MELI._expireToken(window.MELI._getKey());
        window.MELI.getLoginStatus(callback);
      }
    },

    _buildIdentifiedStatus: function(status){
      var identifiedUserId = -1;
      try {
        identifiedUserId = parseInt(cookie("orguseridp")) 
      }catch(e){ /*Ignore error*/}

      status.state = "IDENTIFIED";
      status.authorization_info = {
        access_token: cookie("orgid"),
        expires_in: new Date(new Date().getTime() + parseInt(10800) * 1000).getTime(),
        user_id: parseInt(cookie("orguseridp"))
      };
      return status;
    },

    getLoginStatus: function(callback, status) {
      if( status.state == "AUTHORIZED") {
        if ( !MercadoLibreW._isLoggedIn() || !MercadoLibreW._isOwner(status) ){
          MercadoLibreW._refreshAuthorizationState(callback);
          return;       
        }
      }

      if( status.state == "UNKNOWN") {
        if ( MercadoLibreW._isLoggedIn() ){
          //como el usuario esta logueado y nosotros tenemos una copia desactualizada ==> refresh
          MercadoLibreW._refreshAuthorizationState(callback);
          return;
        }

        if( MercadoLibreW._isIdentified() ){
          //identified user
          status = MercadoLibreW._buildIdentifiedStatus(status);
          window.MELI.authorizationState[window.MELI._getKey()] = status;
        }
      }
      callback(status);
    }

  }
  window.MercadoLibreW = MercadoLibreW;
  MercadoLibreW.init();

})(cookie);
