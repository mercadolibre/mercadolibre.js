var DOMWindow, URL, core, html5, http, jsdom, vm;
var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
jsdom = require("jsdom");
core = jsdom.dom.level3.core;
URL = require("url");
http = require("http");
html5 = require("html5").HTML5;
vm = process.binding("evals");
core.HTMLAnchorElement.prototype._eventDefaults = {
  click: function(event) {
    var anchor;
    anchor = event.target;
    if (anchor.href) {
      return anchor.ownerDocument.parentWindow.location = anchor.href;
    }
  }
};
core.resourceLoader.load = function(element, href, callback) {
  var document, ownerImplementation, window;
  document = element.ownerDocument;
  window = document.parentWindow;
  ownerImplementation = document.implementation;
  if (ownerImplementation.hasFeature('FetchExternalResources', element.tagName.toLowerCase())) {
    return window.request({
      url: href,
      method: "GET",
      headers: {}
    }, __bind(function(done) {
      var file, loaded, url;
      url = URL.parse(this.resolve(document, href));
      loaded = function(data, filename) {
        done(null, {
          status: 200,
          headers: {},
          body: data.slice(0, 100)
        });
        return callback.call(this, data, filename);
      };
      if (url.hostname) {
        return this.download(url, this.enqueue(element, loaded, url.pathname));
      } else {
        file = this.resolve(document, url.pathname);
        return this.readFile(file, this.enqueue(element, loaded, file));
      }
    }, this));
  }
};
core.resourceLoader.download = function(url, callback) {
  var client, path, port, request, secure;
  path = url.pathname + (url.search || "");
  secure = url.protocol === "https:";
  port = url.port || (secure ? 443 : 80);
  client = http.createClient(port, url.hostname, secure);
  request = client.request("GET", path, {
    "host": url.hostname
  });
  request.on("response", function(response) {
    var data;
    response.setEncoding("utf8");
    data = "";
    response.on("data", function(chunk) {
      return data += chunk;
    });
    return response.on("end", function() {
      var redirect;
      switch (response.statusCode) {
        case 301:
        case 302:
        case 303:
        case 307:
          redirect = URL.resolve(url, response.headers["location"]);
          return download(redirect, callback);
        default:
          return callback(null, data);
      }
    });
  });
  request.on("error", function(error) {
    return callback(error);
  });
  return request.end();
};
core.languageProcessors = {
  javascript: function(element, code, filename) {
    var document, event, window;
    document = element.ownerDocument;
    window = document.parentWindow;
    window.browser.log(function() {
      if (filename) {
        return "Running script from " + filename;
      }
    });
    try {
      return window.__evaluate(code, filename);
    } catch (error) {
      event = document.createEvent("HTMLEvents");
      event.initEvent("error", true, false);
      event.error = error;
      return window.dispatchEvent(event);
    }
  }
};
DOMWindow = jsdom.createWindow().constructor;
DOMWindow.prototype.__evaluate = function(code, filename) {
  var context, n, script, v, window, _i, _len, _ref;
  window = this;
  if (typeof code === "function") {
    return code.apply(window);
  } else {
    context = vm.Script.createContext(window);
    if (window._vars) {
      _ref = this.window._vars;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        v = _ref[_i];
        context[v[0]] = v[1];
      }
    }
    script = new vm.Script(code, filename || "eval");
    try {
      return script.runInContext(context);
    } catch (ex) {
      window.browser.log(ex.stack.split("\n").slice(0, 2));
      throw ex;
    } finally {
      window._vars = ((function() {
        var _results;
        _results = [];
        for (n in context) {
          v = context[n];
          _results.push([n, v]);
        }
        return _results;
      })()).filter(function(v) {
        return !window[v[0]];
      });
    }
  }
};
DOMWindow.prototype.open = function(url, name) {
  var window;
  window = this.browser.createWindow(name);
  window.location = url;
  window.opener = this;
  return window;
};
DOMWindow.prototype.close = function() {
  return this.browser.closeWindow(this);
};
core.CharacterData.prototype.__defineSetter__("_nodeValue", function(newValue) {
  var ev, oldValue;
  oldValue = this._text || "";
  this._text = newValue;
  if (this.ownerDocument && this.parentNode) {
    ev = this.ownerDocument.createEvent("MutationEvents");
    ev.initMutationEvent("DOMCharacterDataModified", true, false, this, oldValue, newValue, null, null);
    return this.dispatchEvent(ev);
  }
});
core.CharacterData.prototype.__defineGetter__("_nodeValue", function() {
  return this._text;
});
core.Document.prototype._elementBuilders["script"] = function(doc, s) {
  var script;
  script = new core.HTMLScriptElement(doc, s);
  script.sourceLocation || (script.sourceLocation = {
    line: 0,
    col: 0
  });
  if (doc.implementation.hasFeature("ProcessExternalResources", "script")) {
    script.addEventListener("DOMCharacterDataModified", function(event) {
      var code, filename;
      code = event.target.nodeValue;
      if (code.trim().length > 0) {
        filename = this.ownerDocument.URL;
        return this.ownerDocument.parentWindow.perform(__bind(function(done) {
          var loaded;
          loaded = __bind(function(code, filename) {
            if (code === this.text) {
              core.languageProcessors[this.language](this, code, filename);
            }
            return done();
          }, this);
          return core.resourceLoader.enqueue(this, loaded, filename)(null, code);
        }, this));
      }
    });
  }
  return script;
};
core.HTMLDocument.prototype.fixQueue = function() {
  return this._queue.push = function(callback) {
    var item, q;
    q = this;
    item = {
      prev: q.tail,
      check: function() {
        if (!q.paused && (this.data !== void 0 || this.err) && !this.prev) {
          callback(this.err, this.data);
          if (q.tail === this) {
            q.tail = null;
          }
          if (this.next) {
            this.next.prev = null;
            return this.next.check();
          }
        }
      }
    };
    if (q.tail) {
      q.tail.next = item;
    }
    q.tail = item;
    return function(err, data) {
      item.err = err;
      item.data = data;
      return item.check();
    };
  };
};