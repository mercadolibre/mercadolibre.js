var Entry, History, Location, URL, html, http, jsdom, qs, util;
var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
http = require("http");
jsdom = require("jsdom");
html = jsdom.dom.level3.html;
qs = require("querystring");
URL = require("url");
util = require("util");
Entry = (function() {
  function Entry(history, url, options) {
    this.url = URL.parse(URL.format(url));
    this.location = new Location(history, this.url);
    if (options) {
      this.state = options.state;
      this.title = options.title;
      this.pop = !!options.pop;
    }
  }
  return Entry;
})();
History = (function() {
  function History(window) {
    var browser, index, pageChanged, resource, stack, stringify, stringifyPrimitive;
    stack = [];
    index = -1;
    browser = window.browser;
    window.__defineGetter__("history", __bind(function() {
      return this;
    }, this));
    window.__defineGetter__("location", __bind(function() {
      var _ref;
      return ((_ref = stack[index]) != null ? _ref.location : void 0) || new Location(this, {});
    }, this));
    window.__defineSetter__("location", __bind(function(url) {
      var _ref;
      return this._assign(URL.resolve((_ref = stack[index]) != null ? _ref.url : void 0, url));
    }, this));
    stringifyPrimitive = __bind(function(v) {
      var _ref;
      switch (Object.prototype.toString.call(v)) {
        case '[object Boolean]':
          return v != null ? v : {
            'true': 'false'
          };
        case '[object Number]':
          return (_ref = isFinite(v)) != null ? _ref : {
            v: ''
          };
        case '[object String]':
          return v;
        default:
          return '';
      }
    }, this);
    stringify = __bind(function(obj) {
      var eq, sep;
      sep = '&';
      eq = '=';
      return obj.map(function(k) {
        if (Array.isArray(k[1])) {
          return k[1].map(function(v) {
            return qs.escape(stringifyPrimitive(k[0])) + eq + qs.escape(stringifyPrimitive(v));
          }).join(sep);
        } else {
          return qs.escape(stringifyPrimitive(k[0])) + eq + qs.escape(stringifyPrimitive(k[1]));
        }
      }).join(sep);
    }, this);
    pageChanged = __bind(function(was) {
      var evt, url, _ref;
      url = (_ref = stack[index]) != null ? _ref.url : void 0;
      if (!was || was.host !== url.host || was.pathname !== url.pathname || was.query !== url.query) {
        return resource(url);
      } else if (was.hash !== url.hash) {
        evt = window.document.createEvent("HTMLEvents");
        evt.initEvent("hashchange", true, false);
        return window.dispatchEvent(evt);
      } else {
        return resource(url);
      }
    }, this);
    resource = __bind(function(url, method, data, enctype) {
      var document, makeRequest, options;
      method = (method || "GET").toUpperCase();
      if (!(url.protocol && url.hostname)) {
        throw new Error("Cannot load resource: " + (URL.format(url)));
      }
      options = {
        url: URL.format(url),
        deferClose: false,
        parser: require("html5").HTML5,
        features: {
          QuerySelector: true,
          ProcessExternalResources: [],
          FetchExternalResources: []
        }
      };
      if (browser.runScripts) {
        options.features.ProcessExternalResources.push("script");
        options.features.FetchExternalResources.push("script");
      }
      document = jsdom.jsdom(false, jsdom.level3, options);
      document.fixQueue();
      window.document = document;
      makeRequest = __bind(function(url, method, data, redirected) {
        var boundary, headers, lines;
        headers = {
          "user-agent": browser.userAgent
        };
        browser.cookies(url.hostname, url.pathname).addHeader(headers);
        if (method === "GET" || method === "HEAD") {
          if (data) {
            url.search = "?" + stringify(data);
          }
          data = null;
          headers["content-length"] = 0;
        } else {
          headers["content-type"] = enctype || "application/x-www-form-urlencoded";
          switch (headers["content-type"]) {
            case "application/x-www-form-urlencoded":
              data = stringify(data);
              break;
            case "multipart/form-data":
              boundary = "" + (new Date().getTime()) + (Math.random());
              lines = ["--" + boundary];
              data.map(function(item) {
                var content, disp, encoding, mime, name, value, values, _i, _len, _results;
                name = item[0];
                values = item[1];
                if (typeof values !== "array") {
                  values = [values];
                }
                _results = [];
                for (_i = 0, _len = values.length; _i < _len; _i++) {
                  value = values[_i];
                  disp = "Content-Disposition: form-data; name=\"" + name + "\"";
                  if (value.contents) {
                    disp += "; filename=\"" + value + "\"";
                    content = value.contents();
                    mime = value.mime();
                    encoding = value.encoding();
                  } else {
                    content = value;
                    mime = "text/plain";
                  }
                  lines.push(disp);
                  lines.push("Content-Type: " + mime);
                  lines.push("Content-Length: " + content.length);
                  if (encoding) {
                    lines.push("Content-Transfer-Encoding: base64");
                  }
                  lines.push("");
                  lines.push(content);
                  _results.push(lines.push("--" + boundary));
                }
                return _results;
              });
              data = lines.join("\r\n") + "--\r\n";
              headers["content-type"] += "; boundary=" + boundary;
              break;
            default:
              data = data.toString();
          }
          headers["content-length"] = data.length;
        }
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
          request.on("response", __bind(function(response) {
            var body;
            response.setEncoding("utf8");
            body = "";
            response.on("data", function(chunk) {
              return body += chunk;
            });
            return response.on("end", __bind(function() {
              var error, event, redirect;
              browser.response = [response.statusCode, response.headers, body];
              done(null, {
                status: response.statusCode,
                headers: response.headers,
                body: body,
                redirected: !!redirected
              });
              switch (response.statusCode) {
                case 200:
                  browser.cookies(url.hostname, url.pathname).update(response.headers["set-cookie"]);
                  if (body.trim() === "") {
                    body = "<html></html>";
                  }
                  document.open();
                  document.write(body);
                  document.close();
                  if (document.documentElement) {
                    browser.emit("loaded", browser);
                  } else {
                    error = "Could not parse document at " + (URL.format(url));
                  }
                  break;
                case 301:
                case 302:
                case 303:
                case 307:
                  browser.cookies(url.hostname, url.pathname).update(response.headers["set-cookie"]);
                  redirect = URL.parse(URL.resolve(url, response.headers["location"]));
                  stack[index] = new Entry(this, redirect);
                  browser.emit("redirected", redirect);
                  process.nextTick(function() {
                    return makeRequest(redirect, "GET", null, true);
                  });
                  break;
                default:
                  error = "Could not load document at " + (URL.format(url)) + ", got " + response.statusCode;
                  document.open();
                  document.write(error);
                  document.close();
              }
              if (error) {
                event = document.createEvent("HTMLEvents");
                event.initEvent("error", true, false);
                document.dispatchEvent(event);
                error = new Error(error);
                error.statusCode = response.statusCode;
                return browser.emit("error", error);
              }
            }, this));
          }, this));
          client.on("error", function(error) {
            var event;
            event = document.createEvent("HTMLEvents");
            event.initEvent("error", true, false);
            document.dispatchEvent(event);
            browser.emit("error", new Error(error));
            return done(error);
          });
          return request.end(data, "utf8");
        }, this));
      }, this);
      return makeRequest(url, method, data);
    }, this);
    this.forward = function() {
      return this.go(1);
    };
    this.back = function() {
      return this.go(-1);
    };
    this.go = function(amount) {
      var entry, evt, new_index, was, _ref;
      was = (_ref = stack[index]) != null ? _ref.url : void 0;
      new_index = index + amount;
      if (new_index < 0) {
        new_index = 0;
      }
      if (stack.length > 0 && new_index >= stack.length) {
        new_index = stack.length - 1;
      }
      if (new_index !== index && (entry = stack[new_index])) {
        index = new_index;
        if (entry.pop) {
          if (window.document) {
            evt = window.document.createEvent("HTMLEvents");
            evt.initEvent("popstate", false, false);
            evt.state = entry.state;
            window.dispatchEvent(evt);
          }
          if (was.host !== stack[index].host) {
            resource(stack[index]);
          }
        } else {
          pageChanged(was);
        }
      }
      return;
    };
    this.__defineGetter__("length", function() {
      return stack.length;
    });
    this.pushState = function(state, title, url) {
      return stack[++index] = new Entry(this, url, {
        state: state,
        title: title,
        pop: true
      });
    };
    this.replaceState = function(state, title, url) {
      if (index < 0) {
        index = 0;
      }
      return stack[index] = new Entry(this, url, {
        state: state,
        title: title,
        pop: true
      });
    };
    this._assign = function(url) {
      var was, _ref;
      was = (_ref = stack[index]) != null ? _ref.url : void 0;
      stack = stack.slice(0, (index + 1) || 9e9);
      stack[++index] = new Entry(this, url);
      return pageChanged(was);
    };
    this._replace = function(url) {
      var was, _ref;
      was = (_ref = stack[index]) != null ? _ref.url : void 0;
      if (index < 0) {
        index = 0;
      }
      stack[index] = new Entry(this, url);
      return pageChanged(was);
    };
    this._loadPage = function(force) {
      if (stack[index]) {
        return resource(stack[index].url);
      }
    };
    this._submit = function(url, method, data, enctype) {
      var _ref;
      stack = stack.slice(0, (index + 1) || 9e9);
      url = URL.resolve((_ref = stack[index]) != null ? _ref.url : void 0, url);
      stack[++index] = new Entry(this, url);
      return resource(stack[index].url, method, data, enctype);
    };
    this.dump = function() {
      var dump, entry, i, line;
      dump = [];
      for (i in stack) {
        entry = stack[i];
        i = Number(i);
        line = i === index ? "" + (i + 1) + ": " : "" + (i + 1) + ". ";
        line += URL.format(entry.url);
        if (entry.state) {
          line += " state: " + util.inspect(entry.state);
        }
        dump.push(line);
      }
      return dump;
    };
  }
  return History;
})();
Location = (function() {
  function Location(history, url) {
    var prop, _fn, _i, _len, _ref;
    this.assign = function(newUrl) {
      return history._assign(newUrl);
    };
    this.replace = function(newUrl) {
      return history._replace(newUrl);
    };
    this.reload = function(force) {
      return history._loadPage(force);
    };
    this.toString = function() {
      return URL.format(url);
    };
    this.__defineGetter__("href", function() {
      return url != null ? url.href : void 0;
    });
    this.__defineSetter__("href", function(url) {
      return history._assign(url);
    });
    _ref = ["hash", "host", "hostname", "pathname", "port", "protocol", "search"];
    _fn = __bind(function(prop) {
      this.__defineGetter__(prop, function() {
        return (url != null ? url[prop] : void 0) || "";
      });
      return this.__defineSetter__(prop, function(value) {
        var newUrl;
        newUrl = URL.parse(url != null ? url.href : void 0);
        newUrl[prop] = value;
        return history._assign(URL.format(newUrl));
      });
    }, this);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      prop = _ref[_i];
      _fn(prop);
    }
  }
  return Location;
})();
html.HTMLDocument.prototype.__defineGetter__("location", function() {
  return this.parentWindow.location;
});
exports.use = function(window) {
  return new History(window);
};