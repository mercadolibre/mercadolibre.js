var browser;
browser = require("./zombie/browser");
exports.Browser = browser.Browser;
exports.package = browser.package;
exports.version = browser.version;
exports.visit = function(url, options, callback) {
  var _ref;
  if (typeof options === "function") {
    _ref = [options, null], callback = _ref[0], options = _ref[1];
  }
  browser = new exports.Browser(options);
  browser.visit(url, callback);
  return;
};
exports.listen = require("./zombie/protocol").listen;