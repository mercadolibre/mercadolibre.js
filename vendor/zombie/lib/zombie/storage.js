var Storage, StorageArea, StorageEvent, Storages, core, events;
core = require("jsdom").dom.level3.core;
events = require("jsdom").dom.level3.events;
StorageArea = (function() {
  function StorageArea() {
    var fire, items, storages;
    items = [];
    storages = [];
    fire = function(source, key, oldValue, newValue) {
      var event, storage, window, _i, _len, _ref, _results;
      _results = [];
      for (_i = 0, _len = storages.length; _i < _len; _i++) {
        _ref = storages[_i], storage = _ref[0], window = _ref[1];
        if (storage === source) {
          continue;
        }
        _results.push(event = new StorageEvent(storage, window.location.href, key, oldValue, newValue));
      }
      return _results;
    };
    this.__defineGetter__("length", function() {
      var i, k;
      i = 0;
      for (k in items) {
        ++i;
      }
      return i;
    });
    this.key = function(index) {
      var i, k;
      i = 0;
      for (k in items) {
        if (i === index) {
          return k;
        }
        ++i;
      }
      return;
    };
    this.get = function(key) {
      return items[key];
    };
    this.set = function(source, key, value) {
      var oldValue;
      oldValue = items[key];
      items[key] = value;
      return fire(source, key, oldValue, value);
    };
    this.remove = function(source, key) {
      var oldValue;
      oldValue = items[key];
      delete items[key];
      return fire(source, key, oldValue);
    };
    this.clear = function(source) {
      items = [];
      return fire(source);
    };
    this.associate = function(storage, window) {
      return storages.push([storage, window]);
    };
    this.__defineGetter__("pairs", function() {
      var k, v, _results;
      _results = [];
      for (k in items) {
        v = items[k];
        _results.push([k, v]);
      }
      return _results;
    });
    this.toString = function() {
      var k, v;
      return ((function() {
        var _results;
        _results = [];
        for (k in items) {
          v = items[k];
          _results.push("" + k + " = " + v);
        }
        return _results;
      })()).join("\n");
    };
  }
  return StorageArea;
})();
Storage = (function() {
  function Storage(area, window) {
    if (window) {
      area.associate(this, window);
    }
    this.__defineGetter__("length", function() {
      return area.length;
    });
    this.key = function(index) {
      return area.key(index);
    };
    this.getItem = function(key) {
      return area.get(key.toString());
    };
    this.setItem = function(key, value) {
      return area.set(this, key.toString(), value);
    };
    this.removeItem = function(key) {
      return area.remove(this, key.toString());
    };
    this.clear = function() {
      return area.clear(this);
    };
    this.dump = function() {
      return area.dump();
    };
  }
  return Storage;
})();
StorageEvent = function(storage, url, key, oldValue, newValue) {
  events.Event.call(this, "storage");
  this.__defineGetter__("url", function() {
    return url;
  });
  this.__defineGetter__("storageArea", function() {
    return storage;
  });
  this.__defineGetter__("key", function() {
    return key;
  });
  this.__defineGetter__("oldValue", function() {
    return oldValue;
  });
  return this.__defineGetter__("newValue", function() {
    return newValue;
  });
};
Storage.prototype.__proto__ = events.Event.prototype;
core.SECURITY_ERR = 18;
Storages = (function() {
  function Storages(browser) {
    var localAreas, sessionAreas;
    localAreas = {};
    sessionAreas = {};
    this.local = function(host) {
      var area, _ref;
      area = (_ref = localAreas[host]) != null ? _ref : localAreas[host] = new StorageArea();
      return new Storage(area);
    };
    this.session = function(host) {
      var area, _ref;
      area = (_ref = sessionAreas[host]) != null ? _ref : sessionAreas[host] = new StorageArea();
      return new Storage(area);
    };
    this.extend = function(window) {
      window.__defineGetter__("sessionStorage", function() {
        var _base;
        return (_base = this.document)._sessionStorage || (_base._sessionStorage = browser.sessionStorage(this.location.host));
      });
      return window.__defineGetter__("localStorage", function() {
        var _base;
        return (_base = this.document)._localStorage || (_base._localStorage = browser.localStorage(this.location.host));
      });
    };
    this.dump = function() {
      var area, domain, dump, pair, pairs, _i, _j, _len, _len2;
      dump = [];
      for (domain in localAreas) {
        area = localAreas[domain];
        pairs = area.pairs;
        if (pairs.length > 0) {
          dump.push("" + domain + " local:");
          for (_i = 0, _len = pairs.length; _i < _len; _i++) {
            pair = pairs[_i];
            dump.push("  " + pair[0] + " = " + pair[1]);
          }
        }
      }
      for (domain in sessionAreas) {
        area = sessionAreas[domain];
        pairs = area.pairs;
        if (pairs.length > 0) {
          dump.push("" + domain + " session:");
          for (_j = 0, _len2 = pairs.length; _j < _len2; _j++) {
            pair = pairs[_j];
            dump.push("  " + pair[0] + " = " + pair[1]);
          }
        }
      }
      return dump;
    };
  }
  return Storages;
})();
exports.use = function(browser) {
  return new Storages(browser);
};