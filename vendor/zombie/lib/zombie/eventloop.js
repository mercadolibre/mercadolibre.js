var EventLoop, URL;
var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
URL = require("url");
EventLoop = (function() {
  function EventLoop(browser) {
    var lastHandle, processing, timers, waiting, wakeUp;
    timers = {};
    lastHandle = 0;
    this.setTimeout = function(fn, delay) {
      var handle, timer;
      timer = {
        when: browser.clock + delay,
        timeout: true,
        fire: __bind(function() {
          try {
            return browser.evaluate(fn);
          } finally {
            delete timers[handle];
          }
        }, this)
      };
      handle = ++lastHandle;
      timers[handle] = timer;
      return handle;
    };
    this.setInterval = function(fn, delay) {
      var handle, timer;
      timer = {
        when: browser.clock + delay,
        interval: true,
        fire: __bind(function() {
          try {
            return browser.evaluate(fn);
          } finally {
            timer.when = browser.clock + delay;
          }
        }, this)
      };
      handle = ++lastHandle;
      timers[handle] = timer;
      return handle;
    };
    this.clearTimeout = function(handle) {
      var _ref;
      if ((_ref = timers[handle]) != null ? _ref.timeout : void 0) {
        return delete timers[handle];
      }
    };
    this.clearInterval = function(handle) {
      var _ref;
      if ((_ref = timers[handle]) != null ? _ref.interval : void 0) {
        return delete timers[handle];
      }
    };
    processing = 0;
    waiting = [];
    wakeUp = function() {
      var waiter, _results;
      if (--processing === 0) {
        _results = [];
        while (waiter = waiting.pop()) {
          _results.push(process.nextTick(waiter));
        }
        return _results;
      }
    };
    this.perform = function(fn) {
      ++processing;
      fn(wakeUp);
      return;
    };
    this.wait = function(window, terminate, callback, intervals) {
      return process.nextTick(__bind(function() {
        var done, earliest, event, handle, timer;
        earliest = null;
        for (handle in timers) {
          timer = timers[handle];
          if (timer.interval && intervals === false) {
            continue;
          }
          if (!earliest || timer.when < earliest.when) {
            earliest = timer;
          }
        }
        if (earliest) {
          intervals = false;
          event = function() {
            if (browser.clock < earliest.when) {
              browser.clock = earliest.when;
            }
            return earliest.fire();
          };
        }
        if (event) {
          try {
            event();
            done = false;
            if (typeof terminate === "number") {
              --terminate;
              if (terminate <= 0) {
                done = true;
              }
            } else if (typeof terminate === "function") {
              if (terminate.call(window) === false) {
                done = true;
              }
            }
            if (done) {
              return process.nextTick(function() {
                browser.emit("done", browser);
                if (callback) {
                  return callback(null, window);
                }
              });
            } else {
              return this.wait(window, terminate, callback, intervals);
            }
          } catch (err) {
            browser.emit("error", err);
            if (callback) {
              return callback(err, window);
            }
          }
        } else if (processing > 0) {
          return waiting.push(__bind(function() {
            return this.wait(window, terminate, callback, intervals);
          }, this));
        } else {
          browser.emit("done", browser);
          if (callback) {
            return callback(null, window);
          }
        }
      }, this));
    };
    this.request = function(request, fn) {
      var pending, url;
      url = request.url.toString();
      browser.log(function() {
        return "" + request.method + " " + url;
      });
      pending = browser.record(request);
      ++processing;
      return fn(function(err, response) {
        if (err) {
          browser.log(function() {
            return "Error loading " + url + ": " + err;
          });
          pending.error = err;
        } else {
          browser.log(function() {
            return "" + request.method + " " + url + " => " + response.status;
          });
          pending.response = response;
        }
        return wakeUp();
      });
    };
    this.extend = __bind(function(window) {
      var fn, _i, _len, _ref;
      _ref = ["setTimeout", "setInterval", "clearTimeout", "clearInterval"];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        fn = _ref[_i];
        window[fn] = this[fn];
      }
      window.perform = this.perform;
      window.wait = __bind(function(terminate, callback) {
        return this.wait(window, terminate, callback);
      }, this);
      return window.request = this.request;
    }, this);
    this.dump = function() {
      return ["The time:   " + browser.clock, "Timers:     " + timers.length, "Processing: " + processing, "Waiting:    " + waiting.length];
    };
  }
  return EventLoop;
})();
exports.use = function(browser) {
  return new EventLoop(browser);
};