var UploadedFile, base64, core, fs, mime, path;
var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
core = require("jsdom").dom.level3.core;
path = require("path");
fs = require("fs");
mime = require("mime");
base64 = require("base64");
UploadedFile = function(filename) {
  var file;
  file = new String(path.basename(filename));
  file.mime = function() {
    return mime.lookup(filename);
  };
  file.encoding = function() {
    if (this.mime().match(/^text/)) {
      return null;
    } else {
      return "base64";
    }
  };
  file.contents = function() {
    var result;
    result = fs.readFileSync(filename);
    if (this.encoding() === "base64") {
      result = base64.encode(result).replace(/(.{76})/g, "$1\r\n");
    }
    return result;
  };
  return file;
};
core.HTMLFormElement.prototype.submit = function(button) {
  var document, params, process;
  document = this.ownerDocument;
  params = [];
  process = __bind(function(index) {
    var field, history, name, option, selected, value, _i, _len, _ref;
    if (field = this.elements.item(index)) {
      value = null;
      if (!field.getAttribute("disabled") && (name = field.getAttribute("name"))) {
        if (field.nodeName === "SELECT") {
          selected = [];
          _ref = field.options;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            option = _ref[_i];
            if (option.selected) {
              selected.push(option.value);
            }
          }
          if (field.multiple) {
            value = selected;
          } else {
            value = selected.shift();
            if (!(value != null) && (option = field.options[0])) {
              value = option.value;
            }
          }
        } else if (field.nodeName === "INPUT" && (field.type === "checkbox" || field.type === "radio")) {
          if (field.checked) {
            value = field.value;
          }
        } else if (field.nodeName === "INPUT" && field.type === "file") {
          if (field.value) {
            value = new UploadedFile(field.value);
          }
        } else if (field.nodeName === "TEXTAREA" || field.nodeName === "INPUT") {
          if (field.value && field.type !== "submit" && field.type !== "image") {
            value = field.value;
          }
        }
      }
      if (value != null) {
        params.push([name, value]);
      }
      return process(index + 1);
    } else {
      if (button && button.name) {
        params.push([button.name, button.value]);
      }
      history = document.parentWindow.history;
      return history._submit(this.getAttribute("action"), this.getAttribute("method"), params, this.getAttribute("enctype"));
    }
  }, this);
  return process(0);
};
core.HTMLFormElement.prototype.reset = function() {
  var field, option, _i, _len, _ref, _results;
  _ref = this.elements;
  _results = [];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    field = _ref[_i];
    _results.push((function() {
      var _i, _len, _ref, _results;
      if (field.nodeName === "SELECT") {
        _ref = field.options;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          option = _ref[_i];
          _results.push(option.selected = option._defaultSelected);
        }
        return _results;
      } else if (field.nodeName === "INPUT" && field.type === "check" || field.type === "radio") {
        return field.checked = field._defaultChecked;
      } else if (field.nodeName === "INPUT" || field.nodeName === "TEXTAREA") {
        return field.value = field._defaultValue;
      }
    })());
  }
  return _results;
};
core.HTMLFormElement.prototype._dispatchSubmitEvent = function(button) {
  var event;
  event = this.ownerDocument.createEvent("HTMLEvents");
  event.initEvent("submit", true, true);
  event._button = button;
  return this.dispatchEvent(event);
};
core.HTMLFormElement.prototype._eventDefaults["submit"] = function(event) {
  return event.target.submit(event._button);
};
core.HTMLInputElement.prototype._eventDefaults = {
  click: function(event) {
    var change, form, input;
    input = event.target;
    change = function() {
      event = input.ownerDocument.createEvent("HTMLEvents");
      event.initEvent("change", true, true);
      return input.ownerDocument.dispatchEvent(event);
    };
    switch (input.type) {
      case "reset":
        if (form = input.form) {
          return form.reset();
        }
      case "submit":
      case "image":
        if (form = input.form) {
          return form._dispatchSubmitEvent(input);
        }
      case "checkbox":
        if (!input.getAttribute("readonly")) {
          input.checked = !input.checked;
          return change();
        }
      case "radio":
        if (!input.getAttribute("readonly")) {
          input.checked = true;
          return change();
        }
    }
  }
};
core.HTMLInputElement.prototype.click = function() {
  var event;
  event = this.ownerDocument.createEvent("HTMLEvents");
  event.initEvent("click", true, true);
  return this.dispatchEvent(event);
};
core.HTMLButtonElement.prototype._eventDefaults = {
  click: function(event) {
    var button, form;
    button = event.target;
    if (button.getAttribute("disabled")) {
      return;
    }
    if (form = button.form) {
      return form._dispatchSubmitEvent(button);
    }
  }
};
core.Document.prototype._elementBuilders["button"] = function(doc, s) {
  var button;
  button = new core.HTMLButtonElement(doc, s);
  button.type || (button.type = "submit");
  return button;
};