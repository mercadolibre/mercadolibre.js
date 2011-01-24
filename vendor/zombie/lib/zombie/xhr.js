var URL, XMLHttpRequest, core, http;
var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
core = require("jsdom").dom.level3.core;
http = require("http");
URL = require("url");
core.SECURITY_ERR = 18;
core.NETWORK_ERR = 19;
core.ABORT_ERR = 20;
XMLHttpRequest = function(browser, window) {
  var reset, stateChanged;
  stateChanged = __bind(function(state) {
    this.__defineGetter__("readyState", function() {
      return state;
    });
    if (this.onreadystatechange) {
      return window.perform(__bind(function(done) {
        return process.nextTick(__bind(function() {
          this.onreadystatechange.call(this);
          return done();
        }, this));
      }, this));
    }
  }, this);
  reset = __bind(function() {
    this.__defineGetter__("readyState", function() {
      return 0;
    });
    this.__defineGetter__("status", function() {
      return 0;
    });
    this.__defineGetter__("statusText", function() {});
    this.abort = function() {};
    this.setRequestHeader = this.send = function() {
      throw new core.DOMException(core.INVALID_STATE_ERR, "Invalid state");
    };
    this.getResponseHeader = this.getAllResponseHeader = function() {};
    return this.open = function(method, url, async, user, password) {
      var aborted, headers, _ref;
      method = method.toUpperCase();
      if (/^(CONNECT|TRACE|TRACK)$/.test(method)) {
        throw new core.DOMException(core.SECURITY_ERR, "Unsupported HTTP method");
      }
      if (!/^(DELETE|GET|HEAD|OPTIONS|POST|PUT)$/.test(method)) {
        throw new core.DOMException(core.SYNTAX_ERR, "Unsupported HTTP method");
      }
      url = URL.parse(URL.resolve(window.location, url));
      url.hash = null;
      if (url.host !== window.location.host) {
        throw new core.DOMException(core.SECURITY_ERR, "Cannot make request to different domain");
      }
      if (url.protocol !== "http:") {
        throw new core.DOMException(core.NOT_SUPPORTED_ERR, "Only HTTP protocol supported");
      }
      if (url.auth) {
        _ref = url.auth.split(":"), user = _ref[0], password = _ref[1];
      }
      this._error = null;
      aborted = false;
      this.abort = function() {
        aborted = true;
        return reset();
      };
      headers = {
        "user-agent": browser.userAgent
      };
      this.setRequestHeader = function(header, value) {
        return headers[header.toString().toLowerCase()] = value.toString();
      };
      this.send = function(data) {
        var makeRequest;
        this.abort = function() {
          aborted = true;
          this._error = new core.DOMException(core.ABORT_ERR, "Request aborted");
          stateChanged(4);
          return reset();
        };
        makeRequest = __bind(function(url, method, headers, data) {
          if (method === "GET" || method === "HEAD") {
            data = null;
            headers["content-length"] = 0;
          } else {
            headers["content-type"] || (headers["content-type"] = "text/plain;charset=UTF-8");
            headers["content-length"] = data.length;
          }
          browser.cookies(url.hostname, url.pathname).addHeader(headers);
          return window.request({
            url: URL.format(url),
            method: method,
            headers: headers,
            body: data
          }, __bind(function(done) {
            var client, path, port, request, secure;
            secure = url.protocol === "https:";
            port = url.port || (secure ? 443 : 80);
            client = http.createClient(port, url.hostname, secure);
            path = "" + (url.pathname || "") + (url.search || "");
            if (path[0] !== "/") {
              path = "/" + path;
            }
            headers.host = url.host;
            request = client.request(method, path, headers);
            request.end(data, "utf8");
            request.on("response", __bind(function(response) {
              var body;
              response.setEncoding("utf8");
              this.getResponseHeader = function(header) {
                return response.headers[header.toLowerCase()];
              };
              this.getAllResponseHeader = function() {
                return response.headers;
              };
              this.__defineGetter__("status", function() {
                return response.statusCode;
              });
              this.__defineGetter__("statusText", function() {
                return XMLHttpRequest.STATUS[response.statusCode];
              });
              stateChanged(2);
              body = "";
              response.on("data", __bind(function(chunk) {
                if (aborted) {
                  return response.destroy();
                }
                body += chunk;
                return stateChanged(3);
              }, this));
              return response.on("end", __bind(function(chunk) {
                var redirect;
                if (aborted) {
                  return response.destroy();
                }
                browser.cookies(url.hostname, url.pathname).update(response.headers["set-cookie"]);
                done(null, {
                  status: response.statusCode,
                  headers: response.headers,
                  body: body
                });
                switch (response.statusCode) {
                  case 301:
                  case 302:
                  case 303:
                  case 307:
                    redirect = URL.parse(URL.resolve(url, response.headers["location"]));
                    return makeRequest(redirect, "GET", {});
                  default:
                    this.__defineGetter__("responseText", function() {
                      return body;
                    });
                    this.__defineGetter__("responseXML", function() {});
                    return stateChanged(4);
                }
              }, this));
            }, this));
            return client.on("error", __bind(function(error) {
              console.error("XHR error", error);
              done(error);
              this._error = new core.DOMException(core.NETWORK_ERR, error.message);
              stateChanged(4);
              return reset();
            }, this));
          }, this));
        }, this);
        return makeRequest(url, method, headers, data);
      };
      this.open = function(method, url, async, user, password) {
        this.abort();
        return this.open(method, url, async, user, password);
      };
      return stateChanged(1);
    };
  }, this);
  reset();
  return;
};
XMLHttpRequest.UNSENT = 0;
XMLHttpRequest.OPENED = 1;
XMLHttpRequest.HEADERS_RECEIVED = 2;
XMLHttpRequest.LOADING = 3;
XMLHttpRequest.DONE = 4;
XMLHttpRequest.STATUS = {
  200: "OK",
  404: "Not Found",
  500: "Internal Server Error"
};
exports.use = function(browser) {
  var extend;
  extend = function(window) {
    return window.XMLHttpRequest = function() {
      return XMLHttpRequest.call(this, browser, window);
    };
  };
  return {
    extend: extend
  };
};