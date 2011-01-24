var BULK, ERROR, INTEGER, MULTI, Protocol, SINGLE, net;
net = require("net");
ERROR = -1;
SINGLE = 0;
INTEGER = 1;
BULK = 2;
MULTI = 3;
Protocol = (function() {
  function Protocol(port) {
    var active, argc, argl, argv, browsers, commands, debug, last, process, queue, respond, server;
    port || (port = 8091);
    active = false;
    commands = {};
    debug = false;
    server = net.createServer(function(stream) {
      var input;
      stream.setNoDelay(true);
      input = "";
      stream.on("data", function(chunk) {
        return input = process(stream, input + chunk);
      });
      return stream.on("end", function() {
        return process(stream, input);
      });
    });
    argc = 0;
    argl = 0;
    argv = [];
    process = function(stream, input) {
      if (argc) {
        if (argl) {
          if (input.length >= argl) {
            argv.push(input.slice(0, argl));
            input = input.slice(argl);
            argl = 0;
            if (argv.length === argc) {
              queue(stream, argv);
              argc = 0;
              argv = [];
            }
            if (input.length > 0) {
              return process(stream, input);
            }
          }
        } else {
          input = input.replace(/^\$(\d+)\r\n/, function(_, value) {
            argl = parseInt(value, 10);
            if (debug) {
              console.log("Expecting argument of size " + argl);
            }
            return "";
          });
          if (argl) {
            return process(stream, input);
          } else {
            if (input.length > 0 && input[0] !== "$") {
              throw new Error("Expecting $<argc>CRLF");
            }
          }
        }
      } else {
        input = input.replace(/^\*(\d+)\r\n/, function(_, value) {
          argc = parseInt(value, 10);
          if (debug) {
            console.log("Expecting " + argc + " arguments");
          }
          return "";
        });
        if (argc) {
          return process(stream, input);
        } else {
          console.log(input.length);
          if (input.length > 0 && input[0] !== "*") {
            throw new Error("Expecting *<argc>CRLF");
          }
        }
      }
      return input;
    };
    last = null;
    queue = function(stream, argv) {
      var command;
      command = {};
      command.invoke = function() {
        var fn;
        if (fn = commands[argv[0]]) {
          if (debug) {
            console.log("Executing " + (argv.join(" ")));
          }
          argv[0] = command.reply;
          return fn.apply({}, argv);
        } else {
          return command.reply(ERROR, "Unknown command " + argv[0]);
        }
      };
      command.reply = function(type, value) {
        respond(stream, type, value);
        if (last === command) {
          last = command.next;
        }
        if (command.next) {
          return process.nextTick(function() {
            return command.next.invoke;
          });
        }
      };
      if (last) {
        last.next = command;
        return last = command;
      } else {
        last = command;
        return command.invoke();
      }
    };
    respond = function(stream, type, value) {
      var item, _i, _len, _results;
      switch (type) {
        case ERROR:
          return stream.write("-" + value.message + "\r\n");
        case SINGLE:
          return stream.write("+" + value + "\r\n");
        case INTEGER:
          return stream.write(":" + value + "\r\n");
        case BULK:
          if (value) {
            stream.write("$" + value.length + "\r\n");
            stream.write(value);
            return stream.write("\r\n");
          } else {
            return stream.write("$-1\r\n");
          }
        case MULTI:
          if (value) {
            stream.write("*" + value.length + "\r\n");
            _results = [];
            for (_i = 0, _len = value.length; _i < _len; _i++) {
              item = value[_i];
              _results.push(item ? (stream.write("$" + item.length + "\r\n"), stream.write(item), stream.write("\r\n")) : stream.write("$-1\r\n"));
            }
            return _results;
          } else {
            return stream.write("*-1\r\n");
          }
      }
    };
    this.listen = function(callback) {
      var listener;
      listener = function(err) {
        if (!err) {
          active = true;
        }
        if (callback) {
          return callback(err);
        }
      };
      if (typeof port === "number") {
        return server.listen(port, "127.0.0.1", listener);
      } else {
        return server.listen(port, listener);
      }
    };
    this.close = function() {
      if (active) {
        server.close();
        return active = false;
      }
    };
    this.__defineGetter__("active", function() {
      return active;
    });
    commands.ECHO = function(reply, text) {
      return reply(SINGLE, text);
    };
    browsers = [];
    commands.BROWSER = function(reply) {
      browsers.push(new module.parent.exports.Browser({
        debug: debug
      }));
      return reply(INTEGER, browsers.length - 1);
    };
    commands.VISIT = function(reply, browser, url) {
      browsers[browser].visit(url);
      return reply(SINGLE, "OK");
    };
    commands.WAIT = function(reply, browser) {
      return browsers[browser].wait(function(err) {
        if (err) {
          return reply(ERROR, err.message);
        } else {
          return reply(SINGLE, "OK");
        }
      });
    };
  }
  return Protocol;
})();
exports.Protocol = Protocol;
exports.listen = function(port, callback) {
  var protocol;
  protocol = new Protocol(port);
  return protocol.listen(callback);
};