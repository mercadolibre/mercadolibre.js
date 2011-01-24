var Cookies, URL, core, serialize;
URL = require("url");
core = require("jsdom").dom.level3.core;
serialize = function(browser, domain, path, name, cookie) {
  var str;
  str = "" + name + "=" + cookie.value + "; domain=" + domain + "; path=" + path;
  if (cookie.expires) {
    str = str + ("; max-age=" + (cookie.expires - browser.clock));
  }
  if (cookie.secure) {
    str = str + "; secure";
  }
  return str;
};
Cookies = (function() {
  function Cookies(browser, cookies, hostname, pathname) {
    var dequote, domainMatch, selected;
    if (!pathname || pathname === "") {
      pathname = "/";
    }
    dequote = function(value) {
      return value.replace(/^"(.*)"$/, "$1");
    };
    domainMatch = function(domain, hostname) {
      if (domain === hostname) {
        return true;
      }
      return domain.charAt(0) === "." && domain.substring(1) === hostname.replace(/^[^.]+\./, "");
    };
    selected = function() {
      var cookie, domain, in_domain, in_path, matching, name, path;
      matching = [];
      for (domain in cookies) {
        in_domain = cookies[domain];
        if (!domainMatch(domain, hostname)) {
          continue;
        }
        for (path in in_domain) {
          in_path = in_domain[path];
          if (pathname.indexOf(path) !== 0) {
            continue;
          }
          for (name in in_path) {
            cookie = in_path[name];
            if (typeof cookie.expires === "number" && cookie.expires <= browser.clock) {
              delete in_path[name];
            } else {
              matching.push([domain, path, name, cookie]);
            }
          }
        }
      }
      return matching.sort(function(a, b) {
        return a[1].length - b[1].length;
      });
    };
    this.get = function(name) {
      var match, _i, _len, _ref;
      _ref = selected();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        match = _ref[_i];
        if (match[2] === name) {
          return match[3].value;
        }
      }
    };
    this.set = function(name, value, options) {
      var in_domain, in_path, maxage, state, _name, _name2;
      if (options == null) {
        options = {};
      }
      if (options.domain && !domainMatch(options.domain, hostname)) {
        return;
      }
      name = name.toLowerCase();
      state = {
        value: value.toString()
      };
      if (options.expires) {
        state.expires = options.expires.getTime();
      } else {
        maxage = options["max-age"];
        if (typeof maxage === "number") {
          state.expires = browser.clock + maxage;
        }
      }
      if (options.secure) {
        state.secure = true;
      }
      if (typeof state.expires === "number" && state.expires <= browser.clock) {
        return this.remove(name, options);
      } else {
        in_domain = cookies[_name = options.domain || hostname] || (cookies[_name] = {});
        in_path = in_domain[_name2 = options.path || '/'] || (in_domain[_name2] = {});
        return in_path[name] = state;
      }
    };
    this.remove = function(name, options) {
      var in_domain, in_path;
      if (options == null) {
        options = {};
      }
      if (in_domain = cookies[options.domain || hostname]) {
        if (in_path = in_domain[options.path || pathname]) {
          return delete in_path[name.toLowerCase()];
        }
      }
    };
    this.clear = function(options) {
      var in_domain;
      if (options == null) {
        options = {};
      }
      if (in_domain = cookies[hostname]) {
        return delete in_domain[pathname];
      }
    };
    this.update = function(serialized) {
      var cookie, field, fields, first, key, name, options, val, value, _i, _j, _len, _len2, _ref, _ref2, _ref3, _results;
      if (!serialized) {
        return;
      }
      if (serialized.constructor === Array) {
        serialized = serialized.join(",");
      }
      _ref = serialized.split(/,(?=[^;,]*=)|,$/);
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        cookie = _ref[_i];
        fields = cookie.split(/;+/);
        first = fields[0].trim();
        _ref2 = first.split(/\=/, 2), name = _ref2[0], value = _ref2[1];
        options = {
          value: value
        };
        for (_j = 0, _len2 = fields.length; _j < _len2; _j++) {
          field = fields[_j];
          _ref3 = field.trim().split(/\=/, 2), key = _ref3[0], val = _ref3[1];
          switch (key.toLowerCase()) {
            case "domain":
              options.domain = dequote(val);
              break;
            case "path":
              options.path = dequote(val).replace(/%[^\/]*$/, "");
              break;
            case "expires":
              options.expires = new Date(dequote(val));
              break;
            case "max-age":
              options['max-age'] = parseInt(dequote(val), 10);
              break;
            case "secure":
              options.secure = true;
          }
        }
        _results.push(this.set(name, value, options));
      }
      return _results;
    };
    this.addHeader = function(headers) {
      var header, match;
      header = ((function() {
        var _i, _len, _ref, _results;
        _ref = selected();
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          match = _ref[_i];
          _results.push("" + match[2] + "=\"" + match[3].value + "\";$Path=\"" + match[1] + "\"");
        }
        return _results;
      })()).join("; ");
      if (header.length > 0) {
        return headers.cookie = "$Version=\"1\"; " + header;
      }
    };
    this.__defineGetter__("pairs", function() {
      var match;
      return ((function() {
        var _i, _len, _ref, _results;
        _ref = selected();
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          match = _ref[_i];
          _results.push("" + match[2] + "=" + match[3].value);
        }
        return _results;
      })()).join("; ");
    });
    this.dump = function(separator) {
      var match;
      if (separator == null) {
        separator = "\n";
      }
      return ((function() {
        var _i, _len, _ref, _results;
        _ref = selected();
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          match = _ref[_i];
          _results.push(this.serialize(browser, match[0], match[1], match[2], match[3]));
        }
        return _results;
      }).call(this)).join(separator);
    };
  }
  return Cookies;
})();
core.HTMLDocument.prototype.__defineGetter__("cookie", function() {
  return this.parentWindow.cookies.pairs;
});
core.HTMLDocument.prototype.__defineSetter__("cookie", function(cookie) {
  return this.parentWindow.cookies.update(cookie);
});
exports.use = function(browser) {
  var access, cookies, dump, extend;
  cookies = {};
  access = function(hostname, pathname) {
    return new Cookies(browser, cookies, hostname, pathname);
  };
  extend = function(window) {
    return window.__defineGetter__("cookies", function() {
      return access(this.location.hostname, this.location.pathname);
    });
  };
  dump = function() {
    var cookie, domain, dump, in_domain, in_path, name, path;
    dump = [];
    for (domain in cookies) {
      in_domain = cookies[domain];
      for (path in in_domain) {
        in_path = in_domain[path];
        for (name in in_path) {
          cookie = in_path[name];
          dump.push(serialize(browser, domain, path, name, cookie));
        }
      }
    }
    return dump;
  };
  return {
    access: access,
    extend: extend,
    dump: dump
  };
};