require.paths.unshift(process.env["ZOMBIE_PATH"] || "vendor/zombie/lib");

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

    default:
      res.writeHead(200, {"Content-Type": "text/html; charset=utf-8"});

      fs.readFile("test/xd.html", function(_, data) {
        res.end(data);
      });

      break;
  }
});

var credentials = {
  username: process.env["MERCADOLIBRE_USERNAME"],
  password: process.env["MERCADOLIBRE_PASSWORD"]
}

server.listen(8080, function() {

  var browser = new zombie.Browser();

  // browser.debug = true;

  browser.visit("http://mercadolibrejs.com:8080", function(_, browser) {
    assert.equal(browser.text("#username"), "");

    browser.withOptions({runScripts: false}, function() {
      browser.clickLink("Log in", function(_, browser) {
        browser
          .fill("#user_input", credentials.username)
          .fill("input[type='password']", credentials.password)
          .pressButton("Ingresar", function(_, browser) {

            var url = browser.window.document.innerHTML.match(/href="(.*)"/)[1];

            browser.window.location = url;

            browser.wait(function() {
              browser.runScripts = true;
              browser.window.location.reload();

              browser.wait(function() {
                assert.equal(browser.text("#username", browser.windows[0].document), credentials.username);

                // Clear cookies, check silent authorization.
                browser.cookies("mercadolibrejs.com", "/").clear();

                // Make sure window.open is not called.
                browser.createWindow = function() {
                  var window = createWindow.apply(this, arguments);

                  window.open = function() {
                    throw "Didn't expect a window.open";
                  }

                  return window;
                }

                browser.window.open = function() {
                  throw "Didn't expect a window.open";
                }

                browser.window.location.reload(true);

                browser.wait(function() {
                  browser.clickLink("Log in", function(_, browser) {
                    assert.equal(browser.text("#username", browser.windows[browser.windows.length - 1].document), credentials.username);
                    server.close();
                  });
                });
              });
            });
          });
      });
    });
  });

});
