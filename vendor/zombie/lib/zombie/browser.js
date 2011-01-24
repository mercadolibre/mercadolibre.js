var Browser, html, jsdom;
var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
  for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
  function ctor() { this.constructor = child; }
  ctor.prototype = parent.prototype;
  child.prototype = new ctor;
  child.__super__ = parent.prototype;
  return child;
}, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __indexOf = Array.prototype.indexOf || function(item) {
  for (var i = 0, l = this.length; i < l; i++) {
    if (this[i] === item) return i;
  }
  return -1;
};
jsdom = require("jsdom");
html = jsdom.dom.level3.html;
require("./jsdom_patches");
require("./forms");
require("./xpath");
Browser = (function() {
  __extends(Browser, require("events").EventEmitter);
  function Browser(options) {
    var Screen, TEXT_TYPES, browser, cookies, eventloop, findOption, history, interact, k, mouseEventNames, setCheckbox, storage, trail, v, window, windows, xhr;
    cookies = require("./cookies").use(this);
    storage = require("./storage").use(this);
    eventloop = require("./eventloop").use(this);
    history = require("./history");
    interact = require("./interact").use(this);
    xhr = require("./xhr").use(this);
    this.OPTIONS = ["debug", "runScripts", "userAgent"];
    this.debug = false;
    this.runScripts = true;
    this.userAgent = "Mozilla/5.0 Chrome/10.0.613.0 Safari/534.15 Zombie.js/" + exports.version;
    this.withOptions = function(options, fn) {
      var k, restore, v, _ref;
      if (options) {
        restore = {};
        for (k in options) {
          v = options[k];
          _ref = [this[k], v], restore[k] = _ref[0], this[k] = _ref[1];
        }
      }
      return fn(__bind(function() {
        var k, v, _results;
        if (restore) {
          _results = [];
          for (k in restore) {
            v = restore[k];
            _results.push(this[k] = v);
          }
          return _results;
        }
      }, this));
    };
    if (options) {
      for (k in options) {
        v = options[k];
        if (this.OPTIONS.indexOf(k) >= 0) {
          this[k] = v;
        } else {
          throw "I don't recognize the option " + k;
        }
      }
    }
    window = null;
    windows = [];
    browser = this;
    this.createWindow = function(name) {
      window = jsdom.createWindow(html);
      window.__defineGetter__("browser", __bind(function() {
        return this;
      }, this));
      window.__defineGetter__("title", __bind(function() {
        var _ref, _ref2;
        return (_ref = this.window) != null ? (_ref2 = _ref.document) != null ? _ref2.title : void 0 : void 0;
      }, this));
      window.__defineSetter__("title", __bind(function(title) {
        var _ref, _ref2;
        return (_ref = this.window) != null ? (_ref2 = _ref.document) != null ? _ref2.title = title : void 0 : void 0;
      }, this));
      window.navigator.userAgent = this.userAgent;
      history.use(window);
      cookies.extend(window);
      storage.extend(window);
      eventloop.extend(window);
      interact.extend(window);
      xhr.extend(window);
      window.screen = new Screen();
      window.JSON = JSON;
      window.onerror = __bind(function(event) {
        return this.emit("error", event.error || new Error("Error loading script"));
      }, this);
      window.Image = function() {};
      if (name != null) {
        windows[name] = window;
      } else {
        windows.push(window);
      }
      return window;
    };
    this.open = function() {
      return this.createWindow();
    };
    this.closeWindow = function(w) {
      var key, _results;
      if (w.opener) {
        window = w.opener;
      }
      _results = [];
      for (key in windows) {
        _results.push(windows[key] === w ? key.constructor === String ? delete windows[key] : windows.splice(key, 1) : void 0);
      }
      return _results;
    };
    this.wait = function(terminate, callback) {
      var ondone, onerror, _ref;
      if (!callback) {
        _ref = [terminate, null], callback = _ref[0], terminate = _ref[1];
      }
      if (callback) {
        onerror = __bind(function(error) {
          this.removeListener("error", onerror);
          this.removeListener("done", ondone);
          return callback(error);
        }, this);
        ondone = __bind(function(error) {
          this.removeListener("error", onerror);
          this.removeListener("done", ondone);
          return callback(null, this);
        }, this);
        this.on("error", onerror);
        this.on("done", ondone);
      }
      eventloop.wait(window, terminate);
      return;
    };
    this.fire = function(name, target, options, callback) {
      var bubbles, cancelable, event, key, klass, value, _ref, _ref2, _ref3, _ref4;
      if (typeof options === 'function') {
        _ref = [options, null], callback = _ref[0], options = _ref[1];
      }
      options != null ? options : options = {};
      klass = options.klass || ((__indexOf.call(mouseEventNames, name) >= 0) ? "MouseEvents" : "HTMLEvents");
      bubbles = (_ref2 = options.bubbles) != null ? _ref2 : true;
      cancelable = (_ref3 = options.cancelable) != null ? _ref3 : true;
      event = window.document.createEvent(klass);
      event.initEvent(name, bubbles, cancelable);
      if (options.attributes != null) {
        _ref4 = options.attributes;
        for (key in _ref4) {
          value = _ref4[key];
          event[key] = value;
        }
      }
      target.dispatchEvent(event);
      if (callback) {
        return this.wait(callback);
      }
    };
    mouseEventNames = ['mousedown', 'mousemove', 'mouseup'];
    this.clock = new Date().getTime();
    this.__defineGetter__("now", function() {
      return new Date(this.clock);
    });
    this.querySelector = function(selector) {
      var _ref;
      return (_ref = window.document) != null ? _ref.querySelector(selector) : void 0;
    };
    this.querySelectorAll = function(selector) {
      var _ref;
      return (_ref = window.document) != null ? _ref.querySelectorAll(selector) : void 0;
    };
    this.text = function(selector, context) {
      if (!this.document.documentElement) {
        return "";
      }
      return this.css(selector, context).map(function(e) {
        return e.textContent;
      }).join("");
    };
    this.html = function(selector, context) {
      if (!this.document.documentElement) {
        return "";
      }
      return this.css(selector, context).map(function(e) {
        return e.outerHTML.trim();
      }).join("");
    };
    this.css = function(selector, context) {
      if (selector) {
        return (context || this.document).querySelectorAll(selector).toArray();
      } else {
        return [this.document];
      }
    };
    this.xpath = function(expression, context) {
      return this.document.evaluate(expression, context || this.document);
    };
    this.__defineGetter__("window", function() {
      return window;
    });
    this.__defineGetter__("windows", function() {
      return windows;
    });
    this.__defineGetter__("document", function() {
      return window != null ? window.document : void 0;
    });
    this.__defineGetter__("body", function() {
      var _ref;
      return (_ref = window.document) != null ? _ref.querySelector("body") : void 0;
    });
    this.__defineGetter__("statusCode", function() {
      var response;
      if (response = this.lastResponse) {
        return response.status;
      }
    });
    this.__defineGetter__("redirected", function() {
      var response;
      if (response = this.lastResponse) {
        return response.redirected;
      }
    });
    this.visit = function(url, options, callback) {
      var _ref;
      if (typeof options === "function") {
        _ref = [options, null], callback = _ref[0], options = _ref[1];
      }
      this.withOptions(options, __bind(function(reset) {
        window.history._assign(url);
        return this.wait(function(error, browser) {
          reset();
          if (callback && error) {
            return callback(error);
          } else if (callback) {
            return callback(null, browser, browser.statusCode);
          }
        });
      }, this));
      return;
    };
    this.__defineGetter__("location", function() {
      return window.location;
    });
    this.__defineSetter__("location", function(url) {
      return window.location = url;
    });
    this.link = function(selector) {
      var link, _i, _len, _ref;
      if (link = this.querySelector(selector)) {
        if (link.tagName === "A") {
          return link;
        }
      }
      _ref = this.querySelectorAll("body a");
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        link = _ref[_i];
        if (link.textContent.trim() === selector) {
          return link;
        }
      }
      return;
    };
    this.clickLink = function(selector, callback) {
      var link;
      if (link = this.link(selector)) {
        return this.fire("click", link, __bind(function() {
          return callback(null, this, this.statusCode);
        }, this));
      } else {
        return callback(new Error("No link matching '" + selector + "'"));
      }
    };
    this.field = function(selector) {
      var field, for_attr, label, _i, _len, _ref;
      if (selector instanceof html.Element) {
        return selector;
      }
      if (field = this.querySelector(selector)) {
        if (field.tagName === "INPUT" || field.tagName === "TEXTAREA" || field.tagName === "SELECT") {
          return field;
        }
      }
      if (field = this.querySelector(":input[name='" + selector + "']")) {
        return field;
      }
      _ref = this.querySelectorAll("label");
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        label = _ref[_i];
        if (label.textContent.trim() === selector) {
          if (for_attr = label.getAttribute("for")) {
            return this.document.getElementById(for_attr);
          } else {
            return label.querySelector(":input");
          }
        }
      }
      return;
    };
    TEXT_TYPES = "email number password range search text url".split(" ");
    this.fill = function(selector, value) {
      var field;
      field = this.field(selector);
      if (field && (field.tagName === "TEXTAREA" || (field.tagName === "INPUT"))) {
        if (field.getAttribute("input")) {
          throw new Error("This INPUT field is disabled");
        }
        if (field.getAttribute("readonly")) {
          throw new Error("This INPUT field is readonly");
        }
        field.value = value;
        this.fire("change", field);
        return this;
      }
      throw new Error("No INPUT matching '" + selector + "'");
    };
    setCheckbox = __bind(function(selector, value) {
      var field;
      field = this.field(selector);
      if (field && field.tagName === "INPUT" && field.type === "checkbox") {
        if (field.getAttribute("input")) {
          throw new Error("This INPUT field is disabled");
        }
        if (field.getAttribute("readonly")) {
          throw new Error("This INPUT field is readonly");
        }
        if (field.checked ^ value) {
          field.checked = value;
          this.fire("change", field);
        }
        return this;
      } else {
        throw new Error("No checkbox INPUT matching '" + selector + "'");
      }
    }, this);
    this.check = function(selector) {
      return setCheckbox(selector, true);
    };
    this.uncheck = function(selector) {
      return setCheckbox(selector, false);
    };
    this.choose = function(selector) {
      var field, radio, radios, _i, _len;
      field = this.field(selector);
      if (field.tagName === "INPUT" && field.type === "radio" && field.form) {
        if (!field.checked) {
          radios = this.querySelectorAll(":radio[name='" + (field.getAttribute("name")) + "']", field.form);
          for (_i = 0, _len = radios.length; _i < _len; _i++) {
            radio = radios[_i];
            if (!(radio.getAttribute("disabled") || radio.getAttribute("readonly"))) {
              radio.checked = false;
            }
          }
          field.checked = true;
          this.fire("change", field);
        }
        this.fire("click", field);
        return this;
      }
      throw new Error("No radio INPUT matching '" + selector + "'");
    };
    findOption = __bind(function(selector, value) {
      var field, option, _i, _j, _len, _len2, _ref, _ref2;
      field = this.field(selector);
      if (field && field.tagName === "SELECT") {
        if (field.getAttribute("disabled")) {
          throw new Error("This SELECT field is disabled");
        }
        if (field.getAttribute("readonly")) {
          throw new Error("This SELECT field is readonly");
        }
        _ref = field.options;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          option = _ref[_i];
          if (option.value === value) {
            return option;
          }
        }
        _ref2 = field.options;
        for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
          option = _ref2[_j];
          if (option.label === value) {
            return option;
          }
        }
        throw new Error("No OPTION '" + value + "'");
      } else {
        throw new Error("No SELECT matching '" + selector + "'");
      }
    }, this);
    this.attach = function(selector, filename) {
      var field;
      field = this.field(selector);
      if (field && field.tagName === "INPUT" && field.type === "file") {
        field.value = filename;
        this.fire("change", field);
        return this;
      } else {
        throw new Error("No file INPUT matching '" + selector + "'");
      }
    };
    this.select = function(selector, value) {
      var option;
      option = findOption(selector, value);
      this.selectOption(option);
      return this;
    };
    this.selectOption = function(option) {
      var select;
      if (option && !option.selected) {
        select = this.xpath("./ancestor::select", option).value[0];
        option.selected = true;
        this.fire("change", select);
      }
      return this;
    };
    this.unselect = function(selector, value) {
      var option;
      option = findOption(selector, value);
      this.unselectOption(option);
      return this;
    };
    this.unselectOption = function(option) {
      var select;
      if (option && option.selected) {
        select = this.xpath("./ancestor::select", option).value[0];
        if (!select.multiple) {
          throw new Error("Cannot unselect in single select");
        }
        option.removeAttribute('selected');
        this.fire("change", select);
      }
      return this;
    };
    this.button = function(selector) {
      var button, input, inputs, _i, _j, _k, _len, _len2, _len3, _ref;
      if (button = this.querySelector(selector)) {
        if (button.tagName === "BUTTON" || button.tagName === "INPUT") {
          return button;
        }
      }
      _ref = this.querySelectorAll("form button");
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        button = _ref[_i];
        if (button.textContent.trim() === selector) {
          return button;
        }
      }
      inputs = this.querySelectorAll("form :submit, form :reset, form :button");
      for (_j = 0, _len2 = inputs.length; _j < _len2; _j++) {
        input = inputs[_j];
        if (input.name === selector) {
          return input;
        }
      }
      for (_k = 0, _len3 = inputs.length; _k < _len3; _k++) {
        input = inputs[_k];
        if (input.value === selector) {
          return input;
        }
      }
      return;
    };
    this.pressButton = function(selector, callback) {
      var button;
      if (button = this.button(selector)) {
        if (button.getAttribute("disabled")) {
          return callback(new Error("This button is disabled"));
        } else {
          return this.fire("click", button, __bind(function() {
            return callback(null, this, this.statusCode);
          }, this));
        }
      } else {
        return callback(new Error("No BUTTON '" + selector + "'"));
      }
    };
    this.cookies = function(domain, path) {
      return cookies.access(domain, path);
    };
    this.localStorage = function(host) {
      return storage.local(host);
    };
    this.sessionStorage = function(host) {
      return storage.session(host);
    };
    this.evaluate = function(code, filename) {
      return window.__evaluate(code, filename);
    };
    this.onalert = function(fn) {
      return interact.onalert(fn);
    };
    this.onconfirm = function(question, response) {
      return interact.onconfirm(question, response);
    };
    this.onprompt = function(message, response) {
      return interact.onprompt(message, response);
    };
    this.prompted = function(message) {
      return interact.prompted(message);
    };
    this.viewInBrowser = function(browser) {
      return require("./bcat").bcat(this.html());
    };
    trail = [];
    this.record = function(request) {
      var pending;
      trail.push(pending = {
        request: request
      });
      return pending;
    };
    this.__defineGetter__("lastRequest", function() {
      var _ref;
      return (_ref = trail[trail.length - 1]) != null ? _ref.request : void 0;
    });
    this.__defineGetter__("lastResponse", function() {
      var _ref;
      return (_ref = trail[trail.length - 1]) != null ? _ref.response : void 0;
    });
    this.__defineGetter__("lastError", function() {
      var _ref;
      return (_ref = trail[trail.length - 1]) != null ? _ref.error : void 0;
    });
    this.log = function() {
      var arg, values, _i, _len;
      if (this.debug) {
        values = ["Zombie:"];
        if (typeof arguments[0] === "function") {
          try {
            values.push(arguments[0]());
          } catch (ex) {
            values.push(ex);
          }
        } else {
          for (_i = 0, _len = arguments.length; _i < _len; _i++) {
            arg = arguments[_i];
            values.push(arg);
          }
        }
        return console.log.apply(null, values);
      }
    };
    this.dump = function() {
      var indent;
      indent = function(lines) {
        return lines.map(function(l) {
          return "  " + l + "\n";
        }).join("");
      };
      console.log("Zombie: " + exports.version + "\n");
      console.log("URL: " + this.window.location.href);
      console.log("History:\n" + (indent(history.dump())));
      console.log("Cookies:\n" + (indent(cookies.dump())));
      console.log("Storage:\n" + (indent(storage.dump())));
      console.log("Eventloop:\n" + (indent(eventloop.dump())));
      if (this.document) {
        html = this.document.outerHTML;
        if (html.length > 497) {
          html = html.slice(0, 497) + "...";
        }
        return console.log("Document:\n" + (indent(html.split("\n"))));
      } else {
        if (!this.document) {
          return console.log("No document");
        }
      }
    };
    Screen = (function() {
      function Screen() {
        this.width = 1280;
        this.height = 800;
        this.left = 0;
        this.top = 0;
        this.__defineGetter__("availLeft", function() {
          return 0;
        });
        this.__defineGetter__("availTop", function() {
          return 0;
        });
        this.__defineGetter__("availWidth", function() {
          return this.width;
        });
        this.__defineGetter__("availHeight", function() {
          return this.height;
        });
        this.__defineGetter__("colorDepth", function() {
          return 24;
        });
        this.__defineGetter__("pixelDepth", function() {
          return 24;
        });
      }
      return Screen;
    })();
    this.open();
  }
  return Browser;
})();
exports.Browser = Browser;
try {
  exports.package = JSON.parse(require("fs").readFileSync(__dirname + "/../../package.json"));
  exports.version = exports.package.version;
} catch (err) {
  console.log(err);
}