var zombie = require("zombie");
var assert = require("assert");
var http = require("http");
var https = require("https");
var fs = require("fs");
var util = require("util");
var localHose = require("localhose");
var crypto = require('crypto');

/**
 * cookies para definir circuito
 * authstate = el valor de auth state para devolver al xd
 * logged_user = true/false indica si el usuario esta logueado
 * loginuser = indica si desplegar la pantalla de login
 * authorized = true/false indica el resultado de la pantalla de autorizacion
 * */
var authstate = null, 
  logged_user = null,
  loginuser = null,
  authorized = null,
  hashtag = null;
//handle https requests to auth
var options = {
  key: fs.readFileSync('test/privatekey.pem'),
  cert: fs.readFileSync('test/certificate.pem')
};
  
localHose.set( "www.mercadolibre.com.ar", "static.mlstatic.com", "api.mercadolibre.com", "www.mercadolibre.com", "auth.mercadolibre.com.ar");


var secureServer = https.createServer(options, function(req, res) {
  console.log(req.url);
  var cookies = {};
  req.headers.cookie && req.headers.cookie.split(';').forEach(function( cookie ) {
    var parts = cookie.split('=');
    cookies[ parts[ 0 ].trim() ] = ( parts[ 1 ] || '' ).trim();
  });

  switch (true) {
    case /^\/sites\/...\/search.*callback\=([a-z0-9]+).*/.test(req.url):
      res.writeHead(200, {"Content-Type": "text/javascript; charset=utf-8"});
      
      
      fs.readFile("test/searchResult.json", function(_, data) {
        res.end(/^\/sites\/...\/search.*callback\=([a-z0-9]+).*/.exec(req.url)[1] + "([200,[]," + data + "]);");
      });

      break;

    case /^\/users\/me.*/.test(req.url):
      res.writeHead(200, {"Content-Type": "text/javascript; charset=utf-8"});
      var callback = /^\/users\/me.*callback\=([a-z0-9]+).*/.exec(req.url)[1];
      var ret = callback + "([";
      if (/.*access_token.*/.test(req.url)){
        fs.readFile("test/searchResult.json", function(_, data) {
          res.end(/.*callback\=([a-z0-9]+).*/.exec(req.url)[1] + "([200,[]," + data + "]);");
        });
      } else {
        ret += "403,{\"X-MLAPI-Version\": \"1.8.5\",\"Vary\": \"Accept,Accept-Encoding\",\"Content-Type\": \"application/json;charset=UTF-8\",\"Cache-Control\": \"max-age=0\"},{\"message\": \"The User ID must match the consultant's\",\"error\": \"forbidden\",\"status\": 403,\"cause\": [ ]}";
      }
      ret += "]);"
      res.end(ret);
      break;
    
    case /.*\/jms\/mla\/oauth\/authorization\/state.*/.test(req.url):
      //auth request, redirect 
      //HANDLE DIRECTLY WITH COOKIES 
      var redirect = decodeURIComponent(/.*redirect\_uri\=([^\&]+).*/.exec(req.url)[1]);
      
      var response = '#' + cookies.authstate;
      if (authstate == null )
        response = "#%7B%22client_id%22%3A3096%2C%22state%22%3A%22UNKNOWN%22%7D"
      hashtag = cookies.authstate;
      console.log ("redirigiendo a " + redirect  + response);
      res.writeHead(302, {"Location":redirect + response});
      res.end();
      break;

    case /^\/authorization.*/.test(req.url):
      //request/validation for app autorization
      var redirect = decodeURIComponent(/.*redirect\_uri\=([^\&]+).*/.exec(req.url)[1]);
      console.log("ahhhh ");
      if (cookies.logged_user == null || cookies.logged_user != true) {
        console.log("uno");
        if (loginuser == true) 
          redirect += "#access_token=APP_USR-VALID_TOKEN&expires_in=10800&state=iframe";
        else redirect += "#state=iframe&error=not_logged";
      } else {
        console.log("dos");
        if (authorized == true) {
          redirect += "#access_token=APP_USR-VALID_TOKEN&expires_in=10800&state=iframe";
        } else {
          redirect += "#%7B%22client_id%22%3A3096%2C%22state%22%3A%22UNKNOWN%22%7D";
        }
      }
      res.writeHead(302, {"Location":redirect});
      res.end();
      break;
      
    case /^\/applications.*/.test(req.url):
      res.writeHead(200, {"Content-Type": "text/javascript; charset=utf-8"});
      var callback = /.*callback\=([a-z0-9]+).*/.exec(req.url)[1];
      fs.readFile("test/application.json", function(_, data) {
        res.end(callback + data);
      });
      break;

    case /^\/mercadolibre\.js/.test(req.url):
      res.writeHead(200, {"Content-Type": "text/javascript; charset=utf-8"});

      fs.readFile("pkg/mercadolibre.js", function(_, data) {
        res.end(data);
      });

      break;


    default:
      res.writeHead(200, {"Content-Type": "text/html; charset=utf-8"});
      var file = req.url.split('#?')[0];
      console.log("getting file " + "test" + file);
      fs.readFile("test" + file, function(_, data) {
        res.end(data);
      });

      break;
    }
});

var server = http.createServer(function(req, res) {
  console.log("request: " + req.url);
  switch (req.url) {
    
    case "/":
      res.writeHead(200, {"Content-Type": "text/html; charset=utf-8"});

      fs.readFile("test/index.html", function(_, data) {
        console.log(data);
        res.end(data);
      });

      break;

    case "/mercadolibre.js":
      res.writeHead(200, {"Content-Type": "text/javascript; charset=utf-8"});

      fs.readFile("pkg/mercadolibre.js", function(_, data) {
        res.end(data);
      });

      break;

    case "/jquery.js":
      res.writeHead(200, {"Content-Type": "text/javascript; charset=utf-8"});

      fs.readFile("test/jquery.js", function(_, data) {
        res.end(data);
      });

      break;
    case "/public":
      res.writeHead(200, {"Content-Type": "text/html; charset=utf-8"});
      fs.readFile("test/public.html", function(_, data) {
        res.end(data);
      });
      break;
    case "/private":
      res.writeHead(200, {"Content-Type": "text/html; charset=utf-8"});
      fs.readFile("test/private.html", function(_, data) {
        res.end(data);
      });
      break;
    default:
      res.writeHead(200, {"Content-Type": "text/html; charset=utf-8"});
      var file = req.url.split('#?')[0];
      fs.readFile("test" + file, function(_, data) {
        res.end(data);
      });

      break;
  }
});
secureServer.listen(443)
server.listen(8080)

console.log('Starting tests');
secureServer.listen(443, function() {
  server.listen(8080, function() {

    var browser = new zombie.Browser();

    browser.debug = true;

    ////test 1: Usuario no logueado accede a datos publicos
    //browser.wait( function() {
      //browser.cookies("mercadolibre.com", "/").clear();
      //browser.visit("http://www.mercadolibre.com.ar:8080/public", function(_, browser) {
        //while (browser.text("#status") == "") {
            //console.log(browser.text("#status"));
          //};
        //console.log('hola');
        //assert.equal(browser.text("#status"), "200");
        //assert (parseInt(browser.text("#results")) > 10);
        //console.log(parseInt(browser.text("#results")));
        
      //});
    //});

    
    //test 2:Usuario no logueado accede a datos privados y se le muestra login, no se loguea    
    browser = new zombie.Browser();
    browser.onalert(function(data){console.log("alert->"+data);});
    browser.debug = true;
   
    browser.wait( function() {
      browser.cookies("mercadolibre.com", "/").clear();
      browser.localStorage("static.mlstatic.com:8080").clear();
      //return unknown state (not logged)
      browser.cookies("mercadolibre.com", "/").set("authstate", "%7B%22client_id%22%3A3096%2C%22state%22%3A%22UNKNOWN%22%7D");
      browser.visit("http://www.mercadolibre.com.ar:8080/private", function(_, browser) {
        //browser.resume();
        //assert.equal(browser.text("#status"), "200");
        //assert (parseInt(browser.text("#results")) > 10);
        console.log(browser.text("#status"));
        console.log(broser.fork
        
        
      });
    });
    

  });
});

