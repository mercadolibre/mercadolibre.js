var mockCookie = {
	orgapi:"CS-ORGAPI-BLA",
	orguseridp:"20",
	orgid:"CS-ORGID-BLA",

	cookie: function(name){
		return mockCookie[name];
	}
};
global.cookie = mockCookie.cookie;
global.window = {};
global.document = {
	domain:"www.mercadolibre.com.ar"
};
window.MELI = {
	authorizationState: {},
	unknownStatus: {  state:"UNKNOWN" },
	callbacks: {},
	getLoginStatus: function(callback){
		window.MELI.callbacks["getLoginStatus"] -= 1; 
		return callback(this.authorizationState);
	},
	_expireToken: function(){
		window.MELI.callbacks["_expireToken"] -= 1; 
	},
	_storeSecret: function(){
		
	},
	_getApplicationInfo: function(callback) {
          window.MELI.appInfo = {'id': 3096, 'site_id':'MLA'};
          if (callback) callback();
     },
     _authorizationStateURL: function() {
        return 'https://www.mercadolibre.com/jms/mla/autorization/state';
     },
     _getKey: function(){
     	return 'BLA';
     },
     assertCallbacks: function(){
     	window.MELI.callbacks["getLoginStatus"].should.equal(0);
     	window.MELI.callbacks["_expireToken"].should.equal(0);
     }
};
var mlw = require('../src/mercadolibre_wrapper_only.js');
var should = require('should');
describe('MercadoLibre Wrapper', function(){
	beforeEach(function(done){
	    mockCookie.orgapi = "CS-ORGAPI-BLA";
		mockCookie.orguseridp = "20";
		mockCookie.orgid = "CS-ORGID-BLA";
		window.MELI.unknownStatus = {  state:"UNKNOWN" };
		done();
	});
	//success response
	it('on authorized user should execute callback', function(done){
		window.MELI.authorizationState = {
		  state:"AUTHORIZED",
	      authorization_info:{
	        access_token: cookie("orgid"),
	        expires_in: new Date(new Date().getTime() + parseInt(10800) * 1000).getTime(),
	        user_id: 20
	      }
	    };
	    window.MELI.getLoginStatus(function(status){
	    	done();
	    });
	});


	it('on unknown state if user is identified should return orgid access_token', function(done){
		window.MELI.authorizationState = window.MELI.unknownStatus;
	    mockCookie.orgapi = null;
	    window.MELI.getLoginStatus(function(status){
	    	status.state.should.equal('IDENTIFIED');
	    	done();
	    });
	});


	it('on authorized state if user is not logged access_token must be refreshed', function(done){
		window.MELI.authorizationState = {
		  state:"AUTHORIZED",
	      authorization_info:{
	        access_token: cookie("orgid"),
	        expires_in: new Date(new Date().getTime() + parseInt(10800) * 1000).getTime(),
	        user_id: 20
	      }
	    };
	   	mockCookie.orgapi = null;
		window.MELI.callbacks["_expireToken"]= 1;
		window.MELI.callbacks["getLoginStatus"]= 2;
	    window.MELI.getLoginStatus(function(status){
	    	window.MELI.assertCallbacks();
	    	done();
	    });
	});

	it('on authorized state cleanup failed the sdk should return UNKNOWN state', function(done){
		window.MELI.authorizationState = {
		  state:"AUTHORIZED",
	      authorization_info:{
	        access_token: cookie("orgid"),
	        expires_in: new Date(new Date().getTime() + parseInt(10800) * 1000).getTime(),
	        user_id: 20
	      }
	    };
	   	mockCookie.orgapi = null;
	   	window.MELI.refreshing = true;
	    window.MELI.getLoginStatus(function(status){
	    	status.state.should.equal('UNKNOWN');
	    	done();
	    });
	});
});