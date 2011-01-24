var DOCUMENT_POSITION_CONTAINED_BY, DOCUMENT_POSITION_CONTAINS, DOCUMENT_POSITION_DISCONNECTED, DOCUMENT_POSITION_FOLLOWING, DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC, DOCUMENT_POSITION_PRECEDING, core, engine, fs, vm, xpath;
vm = process.binding("evals");
fs = require("fs");
core = require("jsdom").dom.level3.core;
engine = null;
xpath = function() {
  if (!engine) {
    engine = vm.Script.createContext();
    engine.navigator = {
      appVersion: "Zombie.js"
    };
    new vm.Script(fs.readFileSync(__dirname + "/../../dep/util.js")).runInContext(engine);
    new vm.Script(fs.readFileSync(__dirname + "/../../dep/xmltoken.js")).runInContext(engine);
    new vm.Script(fs.readFileSync(__dirname + "/../../dep/xpath.js")).runInContext(engine);
  }
  return engine;
};
core.HTMLDocument.prototype.evaluate = function(expr, node, nsResolver, type, result) {
  var context;
  engine = xpath();
  context = new engine.ExprContext(node || this);
  context.setCaseInsensitive(true);
  result = engine.xpathParse(expr).evaluate(context);
  result.value = result.value.sort(function(a, b) {
    var value, _ref;
    value = a.compareDocumentPosition(b);
    return (_ref = value === 2 || value === 8 || value === 10) != null ? _ref : -{
      1: 1
    };
  });
  return result;
};
DOCUMENT_POSITION_DISCONNECTED = core.Node.prototype.DOCUMENT_POSITION_DISCONNECTED = 0x01;
DOCUMENT_POSITION_PRECEDING = core.Node.prototype.DOCUMENT_POSITION_PRECEDING = 0x02;
DOCUMENT_POSITION_FOLLOWING = core.Node.prototype.DOCUMENT_POSITION_FOLLOWING = 0x04;
DOCUMENT_POSITION_CONTAINS = core.Node.prototype.DOCUMENT_POSITION_CONTAINS = 0x08;
DOCUMENT_POSITION_CONTAINED_BY = core.Node.prototype.DOCUMENT_POSITION_CONTAINED_BY = 0x10;
DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC = core.Node.prototype.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC = 0x20;
core.Node.prototype.compareDocumentPosition = function(otherNode) {
  var location_index, otherOwner, other_index, parents, point, previous, smallest_common_ancestor, thisOwner, this_index;
  if (!(otherNode instanceof core.Node)) {
    throw Error("Comparing position against non-Node values is not allowed");
  }
  if (this.nodeType === this.DOCUMENT_NODE) {
    thisOwner = this;
  } else {
    thisOwner = this.ownerDocument;
  }
  if (otherNode.nodeType === this.DOCUMENT_NODE) {
    otherOwner = otherNode;
  } else {
    otherOwner = otherNode.ownerDocument;
  }
  if (this === otherNode) {
    return 0;
  }
  if (this === otherNode.ownerDocument) {
    return DOCUMENT_POSITION_FOLLOWING + DOCUMENT_POSITION_CONTAINED_BY;
  }
  if (this.ownerDocument === otherNode) {
    return DOCUMENT_POSITION_PRECEDING + DOCUMENT_POSITION_CONTAINS;
  }
  if (thisOwner !== otherOwner) {
    return DOCUMENT_POSITION_DISCONNECTED;
  }
  if (this.nodeType === this.ATTRIBUTE_NODE && this._childNodes && this._childNodes.indexOf(otherNode) !== -1) {
    return DOCUMENT_POSITION_FOLLOWING + DOCUMENT_POSITION_CONTAINED_BY;
  }
  if (otherNode.nodeType === this.ATTRIBUTE_NODE && otherNode._childNodes && otherNode._childNodes.indexOf(this) !== -1) {
    return DOCUMENT_POSITION_PRECEDING + DOCUMENT_POSITION_CONTAINS;
  }
  point = this;
  parents = [];
  previous = null;
  while (point) {
    if (point === otherNode) {
      return DOCUMENT_POSITION_PRECEDING + DOCUMENT_POSITION_CONTAINS;
    }
    parents.push(point);
    point = point._parentNode;
  }
  point = otherNode;
  previous = null;
  while (point) {
    if (point === this) {
      return DOCUMENT_POSITION_FOLLOWING + DOCUMENT_POSITION_CONTAINED_BY;
    }
    location_index = parents.indexOf(point);
    if (location_index !== -1) {
      smallest_common_ancestor = parents[location_index];
      this_index = smallest_common_ancestor._childNodes.indexOf(parents[location_index - 1]);
      other_index = smallest_common_ancestor._childNodes.indexOf(previous);
      if (this_index > other_index) {
        return DOCUMENT_POSITION_PRECEDING;
      } else {
        return DOCUMENT_POSITION_FOLLOWING;
      }
    }
    previous = point;
    point = point._parentNode;
  }
  return DOCUMENT_POSITION_DISCONNECTED;
};