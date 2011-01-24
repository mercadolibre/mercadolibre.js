require.paths.unshift("vendor/zombie");

var zombie = require("index");
var assert = require("assert");
var http = require("http");
var fs = require("fs");
var sys = require("sys");

var server = http.createServer(function(req, res) {
  switch (req.url) {
    case "/":
      res.writeHead(200, {"Content-Type": "text/html; charset=utf-8"});

      fs.readFile("test/index.html", function(_, data) {
        res.end(data);
      });

      break;

    case "/xd.html":
      res.writeHead(200, {"Content-Type": "text/html; charset=utf-8"});

      fs.readFile("test/xd.html", function(_, data) {
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
  }
});

server.listen(8080, function() {

  var browser = new zombie.Browser({debug: false});

  browser.visit("http://mercadolibrejs.com:8080", function(_, browser) {
    assert.equal(browser.text("#username"), "");

    browser.withOptions({runScripts: false}, function() {
      browser.clickLink("Log in", function(_, browser) {
        browser
          .fill("#user_input", "TEST_GABY_ARGENTINA")
          .fill("input[type='password']", "qatest")
          .pressButton("Ingresar", function(_, browser) {

            var url = browser.window.document.innerHTML.match(/href="(.*)"/)[1];

            browser.window.location = url;

            browser.wait(function(err, browser) {
              browser.runScripts = true;
              browser.window.location.reload();

              browser.wait(function(err, browser) {
                assert.equal(browser.text("#username", browser.windows[0].document), "TEST_GABY_ARGENTINA");
                server.close();
              });
            });
          });
      });
    });
  });

});
