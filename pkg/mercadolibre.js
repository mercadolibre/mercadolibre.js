;(function() {


/*
    http://www.JSON.org/json2.js
    2011-10-19

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html


    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.


    This file creates a global JSON object containing two methods: stringify
    and parse.

        JSON.stringify(value, replacer, space)
            value       any JavaScript value, usually an object or array.

            replacer    an optional parameter that determines how object
                        values are stringified for objects. It can be a
                        function or an array of strings.

            space       an optional parameter that specifies the indentation
                        of nested structures. If it is omitted, the text will
                        be packed without extra whitespace. If it is a number,
                        it will specify the number of spaces to indent at each
                        level. If it is a string (such as '\t' or '&nbsp;'),
                        it contains the characters used to indent at each level.

            This method produces a JSON text from a JavaScript value.

            When an object value is found, if the object contains a toJSON
            method, its toJSON method will be called and the result will be
            stringified. A toJSON method does not serialize: it returns the
            value represented by the name/value pair that should be serialized,
            or undefined if nothing should be serialized. The toJSON method
            will be passed the key associated with the value, and this will be
            bound to the value

            For example, this would serialize Dates as ISO strings.

                Date.prototype.toJSON = function (key) {
                    function f(n) {
                        // Format integers to have at least two digits.
                        return n < 10 ? '0' + n : n;
                    }

                    return this.getUTCFullYear()   + '-' +
                         f(this.getUTCMonth() + 1) + '-' +
                         f(this.getUTCDate())      + 'T' +
                         f(this.getUTCHours())     + ':' +
                         f(this.getUTCMinutes())   + ':' +
                         f(this.getUTCSeconds())   + 'Z';
                };

            You can provide an optional replacer method. It will be passed the
            key and value of each member, with this bound to the containing
            object. The value that is returned from your method will be
            serialized. If your method returns undefined, then the member will
            be excluded from the serialization.

            If the replacer parameter is an array of strings, then it will be
            used to select the members to be serialized. It filters the results
            such that only members with keys listed in the replacer array are
            stringified.

            Values that do not have JSON representations, such as undefined or
            functions, will not be serialized. Such values in objects will be
            dropped; in arrays they will be replaced with null. You can use
            a replacer function to replace those with JSON values.
            JSON.stringify(undefined) returns undefined.

            The optional space parameter produces a stringification of the
            value that is filled with line breaks and indentation to make it
            easier to read.

            If the space parameter is a non-empty string, then that string will
            be used for indentation. If the space parameter is a number, then
            the indentation will be that many spaces.

            Example:

            text = JSON.stringify(['e', {pluribus: 'unum'}]);
            // text is '["e",{"pluribus":"unum"}]'


            text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
            // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

            text = JSON.stringify([new Date()], function (key, value) {
                return this[key] instanceof Date ?
                    'Date(' + this[key] + ')' : value;
            });
            // text is '["Date(---current time---)"]'


        JSON.parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.

            Example:

            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.

            myData = JSON.parse(text, function (key, value) {
                var a;
                if (typeof value === 'string') {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });

            myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
                var d;
                if (typeof value === 'string' &&
                        value.slice(0, 5) === 'Date(' &&
                        value.slice(-1) === ')') {
                    d = new Date(value.slice(5, -1));
                    if (d) {
                        return d;
                    }
                }
                return value;
            });


    This is a reference implementation. You are free to copy, modify, or
    redistribute.
*/

/*jslint evil: true, regexp: true */

/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
    call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/


// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

var JSON;
if (!JSON) {
    JSON = {};
}

(function () {
    'use strict';

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }

    if (typeof Date.prototype.toJSON !== 'function') {

        Date.prototype.toJSON = function (key) {

            return isFinite(this.valueOf())
                ? this.getUTCFullYear()     + '-' +
                    f(this.getUTCMonth() + 1) + '-' +
                    f(this.getUTCDate())      + 'T' +
                    f(this.getUTCHours())     + ':' +
                    f(this.getUTCMinutes())   + ':' +
                    f(this.getUTCSeconds())   + 'Z'
                : null;
        };

        String.prototype.toJSON      =
            Number.prototype.toJSON  =
            Boolean.prototype.toJSON = function (key) {
                return this.valueOf();
            };
    }

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        escapable.lastIndex = 0;
        return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
            var c = meta[a];
            return typeof c === 'string'
                ? c
                : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"' : '"' + string + '"';
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case 'string':
            return quote(value);

        case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

        case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

            if (!value) {
                return 'null';
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0
                    ? '[]'
                    : gap
                    ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']'
                    : '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    if (typeof rep[i] === 'string') {
                        k = rep[i];
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0
                ? '{}'
                : gap
                ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}'
                : '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== 'function') {
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                    typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

            return str('', {'': value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== 'function') {
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.prototype.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            text = String(text);
            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function (a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

            if (/^[\],:{}\s]*$/
                    .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                        .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                        .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval('(' + text + ')');

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return typeof reviver === 'function'
                    ? walk({'': j}, '')
                    : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError('JSON.parse');
        };
    }
}());

/**
 * A modified version of the jQuery cookie plugin
 * that doesn't rely on jQuery.
 *
 */

/**
 * Cookie plugin
 *
 * Copyright (c) 2006 Klaus Hartl (stilbuero.de)
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 *
 */

/**
 * Create a cookie with the given name and value and other optional parameters.
 *
 * @example $.cookie('the_cookie', 'the_value');
 * @desc Set the value of a cookie.
 * @example $.cookie('the_cookie', 'the_value', { expires: 7, path: '/', domain: 'jquery.com', secure: true });
 * @desc Create a cookie with all available options.
 * @example $.cookie('the_cookie', 'the_value');
 * @desc Create a session cookie.
 * @example $.cookie('the_cookie', null);
 * @desc Delete a cookie by passing null as value. Keep in mind that you have to use the same path and domain
 *       used when the cookie was set.
 *
 * @param String name The name of the cookie.
 * @param String value The value of the cookie.
 * @param Object options An object literal containing key/value pairs to provide optional cookie attributes.
 * @option Number|Date expires Either an integer specifying the expiration date from now on in days or a Date object.
 *                             If a negative value is specified (e.g. a date in the past), the cookie will be deleted.
 *                             If set to null or omitted, the cookie will be a session cookie and will not be retained
 *                             when the the browser exits.
 * @option String path The value of the path atribute of the cookie (default: path of page that created the cookie).
 * @option String domain The value of the domain attribute of the cookie (default: domain of page that created the cookie).
 * @option Boolean secure If true, the secure attribute of the cookie will be set and the cookie transmission will
 *                        require a secure protocol (like HTTPS).
 * @type undefined
 *
 * @name $.cookie
 * @cat Plugins/Cookie
 * @author Klaus Hartl/klaus.hartl@stilbuero.de
 */

/**
 * Get the value of a cookie with the given name.
 *
 * @example $.cookie('the_cookie');
 * @desc Get the value of a cookie.
 *
 * @param String name The name of the cookie.
 * @return The value of the cookie.
 * @type String
 *
 * @name $.cookie
 * @cat Plugins/Cookie
 * @author Klaus Hartl/klaus.hartl@stilbuero.de
 */
var cookie = function(name, value, options) {
    if (typeof value != 'undefined') { // name and value given, set cookie
        options = options || {};
        if (value === null) {
            value = '';
            options.expires = -1;
        }
        var expires = '';
        if (options.expires && (typeof options.expires == 'number' || options.expires.toUTCString)) {
            var date;
            if (typeof options.expires == 'number') {
                date = new Date();
                date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
            } else {
                date = options.expires;
            }
            expires = '; expires=' + date.toUTCString(); // use expires attribute, max-age is not supported by IE
        }
        // CAUTION: Needed to parenthesize options.path and options.domain
        // in the following expressions, otherwise they evaluate to undefined
        // in the packed version for some reason...
        var path = options.path ? '; path=' + (options.path) : '';
        var domain = options.domain ? '; domain=' + (options.domain) : '';
        var secure = options.secure ? '; secure' : '';
        document.cookie = [name, '=', encodeURIComponent(value), expires, path, domain, secure].join('');
    } else { // only name given, get cookie
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(/; ?/);
            for (var i = 0; i < cookies.length; i++) {
                // var cookie = jQuery.trim(cookies[i]);
                var cookie = cookies[i];
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
};


var DESCipher = {
    //Paul Tero, July 2001
    //http://www.tero.co.uk/des/
    des:function (key, message, encrypt, mode, iv, padding) {
      //declaring this locally speeds things up a bit
      var spfunction1 = new Array (0x1010400,0,0x10000,0x1010404,0x1010004,0x10404,0x4,0x10000,0x400,0x1010400,0x1010404,0x400,0x1000404,0x1010004,0x1000000,0x4,0x404,0x1000400,0x1000400,0x10400,0x10400,0x1010000,0x1010000,0x1000404,0x10004,0x1000004,0x1000004,0x10004,0,0x404,0x10404,0x1000000,0x10000,0x1010404,0x4,0x1010000,0x1010400,0x1000000,0x1000000,0x400,0x1010004,0x10000,0x10400,0x1000004,0x400,0x4,0x1000404,0x10404,0x1010404,0x10004,0x1010000,0x1000404,0x1000004,0x404,0x10404,0x1010400,0x404,0x1000400,0x1000400,0,0x10004,0x10400,0,0x1010004);
      var spfunction2 = new Array (-0x7fef7fe0,-0x7fff8000,0x8000,0x108020,0x100000,0x20,-0x7fefffe0,-0x7fff7fe0,-0x7fffffe0,-0x7fef7fe0,-0x7fef8000,-0x80000000,-0x7fff8000,0x100000,0x20,-0x7fefffe0,0x108000,0x100020,-0x7fff7fe0,0,-0x80000000,0x8000,0x108020,-0x7ff00000,0x100020,-0x7fffffe0,0,0x108000,0x8020,-0x7fef8000,-0x7ff00000,0x8020,0,0x108020,-0x7fefffe0,0x100000,-0x7fff7fe0,-0x7ff00000,-0x7fef8000,0x8000,-0x7ff00000,-0x7fff8000,0x20,-0x7fef7fe0,0x108020,0x20,0x8000,-0x80000000,0x8020,-0x7fef8000,0x100000,-0x7fffffe0,0x100020,-0x7fff7fe0,-0x7fffffe0,0x100020,0x108000,0,-0x7fff8000,0x8020,-0x80000000,-0x7fefffe0,-0x7fef7fe0,0x108000);
      var spfunction3 = new Array (0x208,0x8020200,0,0x8020008,0x8000200,0,0x20208,0x8000200,0x20008,0x8000008,0x8000008,0x20000,0x8020208,0x20008,0x8020000,0x208,0x8000000,0x8,0x8020200,0x200,0x20200,0x8020000,0x8020008,0x20208,0x8000208,0x20200,0x20000,0x8000208,0x8,0x8020208,0x200,0x8000000,0x8020200,0x8000000,0x20008,0x208,0x20000,0x8020200,0x8000200,0,0x200,0x20008,0x8020208,0x8000200,0x8000008,0x200,0,0x8020008,0x8000208,0x20000,0x8000000,0x8020208,0x8,0x20208,0x20200,0x8000008,0x8020000,0x8000208,0x208,0x8020000,0x20208,0x8,0x8020008,0x20200);
      var spfunction4 = new Array (0x802001,0x2081,0x2081,0x80,0x802080,0x800081,0x800001,0x2001,0,0x802000,0x802000,0x802081,0x81,0,0x800080,0x800001,0x1,0x2000,0x800000,0x802001,0x80,0x800000,0x2001,0x2080,0x800081,0x1,0x2080,0x800080,0x2000,0x802080,0x802081,0x81,0x800080,0x800001,0x802000,0x802081,0x81,0,0,0x802000,0x2080,0x800080,0x800081,0x1,0x802001,0x2081,0x2081,0x80,0x802081,0x81,0x1,0x2000,0x800001,0x2001,0x802080,0x800081,0x2001,0x2080,0x800000,0x802001,0x80,0x800000,0x2000,0x802080);
      var spfunction5 = new Array (0x100,0x2080100,0x2080000,0x42000100,0x80000,0x100,0x40000000,0x2080000,0x40080100,0x80000,0x2000100,0x40080100,0x42000100,0x42080000,0x80100,0x40000000,0x2000000,0x40080000,0x40080000,0,0x40000100,0x42080100,0x42080100,0x2000100,0x42080000,0x40000100,0,0x42000000,0x2080100,0x2000000,0x42000000,0x80100,0x80000,0x42000100,0x100,0x2000000,0x40000000,0x2080000,0x42000100,0x40080100,0x2000100,0x40000000,0x42080000,0x2080100,0x40080100,0x100,0x2000000,0x42080000,0x42080100,0x80100,0x42000000,0x42080100,0x2080000,0,0x40080000,0x42000000,0x80100,0x2000100,0x40000100,0x80000,0,0x40080000,0x2080100,0x40000100);
      var spfunction6 = new Array (0x20000010,0x20400000,0x4000,0x20404010,0x20400000,0x10,0x20404010,0x400000,0x20004000,0x404010,0x400000,0x20000010,0x400010,0x20004000,0x20000000,0x4010,0,0x400010,0x20004010,0x4000,0x404000,0x20004010,0x10,0x20400010,0x20400010,0,0x404010,0x20404000,0x4010,0x404000,0x20404000,0x20000000,0x20004000,0x10,0x20400010,0x404000,0x20404010,0x400000,0x4010,0x20000010,0x400000,0x20004000,0x20000000,0x4010,0x20000010,0x20404010,0x404000,0x20400000,0x404010,0x20404000,0,0x20400010,0x10,0x4000,0x20400000,0x404010,0x4000,0x400010,0x20004010,0,0x20404000,0x20000000,0x400010,0x20004010);
      var spfunction7 = new Array (0x200000,0x4200002,0x4000802,0,0x800,0x4000802,0x200802,0x4200800,0x4200802,0x200000,0,0x4000002,0x2,0x4000000,0x4200002,0x802,0x4000800,0x200802,0x200002,0x4000800,0x4000002,0x4200000,0x4200800,0x200002,0x4200000,0x800,0x802,0x4200802,0x200800,0x2,0x4000000,0x200800,0x4000000,0x200800,0x200000,0x4000802,0x4000802,0x4200002,0x4200002,0x2,0x200002,0x4000000,0x4000800,0x200000,0x4200800,0x802,0x200802,0x4200800,0x802,0x4000002,0x4200802,0x4200000,0x200800,0,0x2,0x4200802,0,0x200802,0x4200000,0x800,0x4000002,0x4000800,0x800,0x200002);
      var spfunction8 = new Array (0x10001040,0x1000,0x40000,0x10041040,0x10000000,0x10001040,0x40,0x10000000,0x40040,0x10040000,0x10041040,0x41000,0x10041000,0x41040,0x1000,0x40,0x10040000,0x10000040,0x10001000,0x1040,0x41000,0x40040,0x10040040,0x10041000,0x1040,0,0,0x10040040,0x10000040,0x10001000,0x41040,0x40000,0x41040,0x40000,0x10041000,0x1000,0x40,0x10040040,0x1000,0x41040,0x10001000,0x40,0x10000040,0x10040000,0x10040040,0x10000000,0x40000,0x10001040,0,0x10041040,0x40040,0x10000040,0x10040000,0x10001000,0x10001040,0,0x10041040,0x41000,0x41000,0x1040,0x1040,0x40040,0x10000000,0x10041000);

      //create the 16 or 48 subkeys we will need
      var keys = this.des_createKeys(key);
      var m=0, i, j, temp, temp2, right1, right2, left, right, looping;
      var cbcleft, cbcleft2, cbcright, cbcright2
      var endloop, loopinc;
      var len = message.length;
      var chunk = 0;
      //set up the loops for single and triple des
      var iterations = keys.length == 32 ? 3 : 9; //single or triple des
      if (iterations == 3) {looping = encrypt ? new Array (0, 32, 2) : new Array (30, -2, -2);}
      else {looping = encrypt ? new Array (0, 32, 2, 62, 30, -2, 64, 96, 2) : new Array (94, 62, -2, 32, 64, 2, 30, -2, -2);}

      //pad the message depending on the padding parameter
      if (padding == 2) message += "        "; //pad the message with spaces
      else if (padding == 1) {temp = 8-(len%8); message += String.fromCharCode (temp,temp,temp,temp,temp,temp,temp,temp); if (temp==8) len+=8;} //PKCS7 padding
      else if (!padding) message += "\0\0\0\0\0\0\0\0"; //pad the message out with null bytes

      //store the result here
      var result = "";
      var tempresult = "";

      if (mode == 1) { //CBC mode
        cbcleft = (iv.charCodeAt(m++) << 24) | (iv.charCodeAt(m++) << 16) | (iv.charCodeAt(m++) << 8) | iv.charCodeAt(m++);
        cbcright = (iv.charCodeAt(m++) << 24) | (iv.charCodeAt(m++) << 16) | (iv.charCodeAt(m++) << 8) | iv.charCodeAt(m++);
        m=0;
      }

      //loop through each 64 bit chunk of the message
      while (m < len) {
        left = (message.charCodeAt(m++) << 24) | (message.charCodeAt(m++) << 16) | (message.charCodeAt(m++) << 8) | message.charCodeAt(m++);
        right = (message.charCodeAt(m++) << 24) | (message.charCodeAt(m++) << 16) | (message.charCodeAt(m++) << 8) | message.charCodeAt(m++);

        //for Cipher Block Chaining mode, xor the message with the previous result
        if (mode == 1) {if (encrypt) {left ^= cbcleft; right ^= cbcright;} else {cbcleft2 = cbcleft; cbcright2 = cbcright; cbcleft = left; cbcright = right;}}

        //first each 64 but chunk of the message must be permuted according to IP
        temp = ((left >>> 4) ^ right) & 0x0f0f0f0f; right ^= temp; left ^= (temp << 4);
        temp = ((left >>> 16) ^ right) & 0x0000ffff; right ^= temp; left ^= (temp << 16);
        temp = ((right >>> 2) ^ left) & 0x33333333; left ^= temp; right ^= (temp << 2);
        temp = ((right >>> 8) ^ left) & 0x00ff00ff; left ^= temp; right ^= (temp << 8);
        temp = ((left >>> 1) ^ right) & 0x55555555; right ^= temp; left ^= (temp << 1);

        left = ((left << 1) | (left >>> 31));
        right = ((right << 1) | (right >>> 31));

        //do this either 1 or 3 times for each chunk of the message
        for (j=0; j<iterations; j+=3) {
          endloop = looping[j+1];
          loopinc = looping[j+2];
          //now go through and perform the encryption or decryption
          for (i=looping[j]; i!=endloop; i+=loopinc) { //for efficiency
            right1 = right ^ keys[i];
            right2 = ((right >>> 4) | (right << 28)) ^ keys[i+1];
            //the result is attained by passing these bytes through the S selection functions
            temp = left;
            left = right;
            right = temp ^ (spfunction2[(right1 >>> 24) & 0x3f] | spfunction4[(right1 >>> 16) & 0x3f]
                  | spfunction6[(right1 >>>  8) & 0x3f] | spfunction8[right1 & 0x3f]
                  | spfunction1[(right2 >>> 24) & 0x3f] | spfunction3[(right2 >>> 16) & 0x3f]
                  | spfunction5[(right2 >>>  8) & 0x3f] | spfunction7[right2 & 0x3f]);
          }
          temp = left; left = right; right = temp; //unreverse left and right
        } //for either 1 or 3 iterations

        //move then each one bit to the right
        left = ((left >>> 1) | (left << 31));
        right = ((right >>> 1) | (right << 31));

        //now perform IP-1, which is IP in the opposite direction
        temp = ((left >>> 1) ^ right) & 0x55555555; right ^= temp; left ^= (temp << 1);
        temp = ((right >>> 8) ^ left) & 0x00ff00ff; left ^= temp; right ^= (temp << 8);
        temp = ((right >>> 2) ^ left) & 0x33333333; left ^= temp; right ^= (temp << 2);
        temp = ((left >>> 16) ^ right) & 0x0000ffff; right ^= temp; left ^= (temp << 16);
        temp = ((left >>> 4) ^ right) & 0x0f0f0f0f; right ^= temp; left ^= (temp << 4);

        //for Cipher Block Chaining mode, xor the message with the previous result
        if (mode == 1) {if (encrypt) {cbcleft = left; cbcright = right;} else {left ^= cbcleft2; right ^= cbcright2;}}
        tempresult += String.fromCharCode ((left>>>24), ((left>>>16) & 0xff), ((left>>>8) & 0xff), (left & 0xff), (right>>>24), ((right>>>16) & 0xff), ((right>>>8) & 0xff), (right & 0xff));

        chunk += 8;
        if (chunk == 512) {result += tempresult; tempresult = ""; chunk = 0;}
      } //for every 8 characters, or 64 bits in the message

      //return the result as an array
      return result + tempresult;
    }, //end of des

    //des_createKeys
    //this takes as input a 64 bit key (even though only 56 bits are used)
    //as an array of 2 integers, and returns 16 48 bit keys
    des_createKeys:function(key) {
      //declaring this locally speeds things up a bit
      var pc2bytes0  = new Array (0,0x4,0x20000000,0x20000004,0x10000,0x10004,0x20010000,0x20010004,0x200,0x204,0x20000200,0x20000204,0x10200,0x10204,0x20010200,0x20010204);
      var pc2bytes1  = new Array (0,0x1,0x100000,0x100001,0x4000000,0x4000001,0x4100000,0x4100001,0x100,0x101,0x100100,0x100101,0x4000100,0x4000101,0x4100100,0x4100101);
      var pc2bytes2  = new Array (0,0x8,0x800,0x808,0x1000000,0x1000008,0x1000800,0x1000808,0,0x8,0x800,0x808,0x1000000,0x1000008,0x1000800,0x1000808);
      var pc2bytes3  = new Array (0,0x200000,0x8000000,0x8200000,0x2000,0x202000,0x8002000,0x8202000,0x20000,0x220000,0x8020000,0x8220000,0x22000,0x222000,0x8022000,0x8222000);
      var pc2bytes4  = new Array (0,0x40000,0x10,0x40010,0,0x40000,0x10,0x40010,0x1000,0x41000,0x1010,0x41010,0x1000,0x41000,0x1010,0x41010);
      var pc2bytes5  = new Array (0,0x400,0x20,0x420,0,0x400,0x20,0x420,0x2000000,0x2000400,0x2000020,0x2000420,0x2000000,0x2000400,0x2000020,0x2000420);
      var pc2bytes6  = new Array (0,0x10000000,0x80000,0x10080000,0x2,0x10000002,0x80002,0x10080002,0,0x10000000,0x80000,0x10080000,0x2,0x10000002,0x80002,0x10080002);
      var pc2bytes7  = new Array (0,0x10000,0x800,0x10800,0x20000000,0x20010000,0x20000800,0x20010800,0x20000,0x30000,0x20800,0x30800,0x20020000,0x20030000,0x20020800,0x20030800);
      var pc2bytes8  = new Array (0,0x40000,0,0x40000,0x2,0x40002,0x2,0x40002,0x2000000,0x2040000,0x2000000,0x2040000,0x2000002,0x2040002,0x2000002,0x2040002);
      var pc2bytes9  = new Array (0,0x10000000,0x8,0x10000008,0,0x10000000,0x8,0x10000008,0x400,0x10000400,0x408,0x10000408,0x400,0x10000400,0x408,0x10000408);
      var pc2bytes10 = new Array (0,0x20,0,0x20,0x100000,0x100020,0x100000,0x100020,0x2000,0x2020,0x2000,0x2020,0x102000,0x102020,0x102000,0x102020);
      var pc2bytes11 = new Array (0,0x1000000,0x200,0x1000200,0x200000,0x1200000,0x200200,0x1200200,0x4000000,0x5000000,0x4000200,0x5000200,0x4200000,0x5200000,0x4200200,0x5200200);
      var pc2bytes12 = new Array (0,0x1000,0x8000000,0x8001000,0x80000,0x81000,0x8080000,0x8081000,0x10,0x1010,0x8000010,0x8001010,0x80010,0x81010,0x8080010,0x8081010);
      var pc2bytes13 = new Array (0,0x4,0x100,0x104,0,0x4,0x100,0x104,0x1,0x5,0x101,0x105,0x1,0x5,0x101,0x105);

      //how many iterations (1 for des, 3 for triple des)
      var iterations = key.length > 8 ? 3 : 1; //changed by Paul 16/6/2007 to use Triple DES for 9+ byte keys
      //stores the return keys
      var keys = new Array (32 * iterations);
      //now define the left shifts which need to be done
      var shifts = new Array (0, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0);
      //other variables
      var lefttemp, righttemp, m=0, n=0, temp;

      for (var j=0; j<iterations; j++) { //either 1 or 3 iterations
        var left = (key.charCodeAt(m++) << 24) | (key.charCodeAt(m++) << 16) | (key.charCodeAt(m++) << 8) | key.charCodeAt(m++);
        var right = (key.charCodeAt(m++) << 24) | (key.charCodeAt(m++) << 16) | (key.charCodeAt(m++) << 8) | key.charCodeAt(m++);

        temp = ((left >>> 4) ^ right) & 0x0f0f0f0f; right ^= temp; left ^= (temp << 4);
        temp = ((right >>> -16) ^ left) & 0x0000ffff; left ^= temp; right ^= (temp << -16);
        temp = ((left >>> 2) ^ right) & 0x33333333; right ^= temp; left ^= (temp << 2);
        temp = ((right >>> -16) ^ left) & 0x0000ffff; left ^= temp; right ^= (temp << -16);
        temp = ((left >>> 1) ^ right) & 0x55555555; right ^= temp; left ^= (temp << 1);
        temp = ((right >>> 8) ^ left) & 0x00ff00ff; left ^= temp; right ^= (temp << 8);
        temp = ((left >>> 1) ^ right) & 0x55555555; right ^= temp; left ^= (temp << 1);

        //the right side needs to be shifted and to get the last four bits of the left side
        temp = (left << 8) | ((right >>> 20) & 0x000000f0);
        //left needs to be put upside down
        left = (right << 24) | ((right << 8) & 0xff0000) | ((right >>> 8) & 0xff00) | ((right >>> 24) & 0xf0);
        right = temp;

        //now go through and perform these shifts on the left and right keys
        for (var i=0; i < shifts.length; i++) {
          //shift the keys either one or two bits to the left
          if (shifts[i]) {left = (left << 2) | (left >>> 26); right = (right << 2) | (right >>> 26);}
          else {left = (left << 1) | (left >>> 27); right = (right << 1) | (right >>> 27);}
          left &= -0xf; right &= -0xf;

          //now apply PC-2, in such a way that E is easier when encrypting or decrypting
          //this conversion will look like PC-2 except only the last 6 bits of each byte are used
          //rather than 48 consecutive bits and the order of lines will be according to
          //how the S selection functions will be applied: S2, S4, S6, S8, S1, S3, S5, S7
          lefttemp = pc2bytes0[left >>> 28] | pc2bytes1[(left >>> 24) & 0xf]
                  | pc2bytes2[(left >>> 20) & 0xf] | pc2bytes3[(left >>> 16) & 0xf]
                  | pc2bytes4[(left >>> 12) & 0xf] | pc2bytes5[(left >>> 8) & 0xf]
                  | pc2bytes6[(left >>> 4) & 0xf];
          righttemp = pc2bytes7[right >>> 28] | pc2bytes8[(right >>> 24) & 0xf]
                    | pc2bytes9[(right >>> 20) & 0xf] | pc2bytes10[(right >>> 16) & 0xf]
                    | pc2bytes11[(right >>> 12) & 0xf] | pc2bytes12[(right >>> 8) & 0xf]
                    | pc2bytes13[(right >>> 4) & 0xf];
          temp = ((righttemp >>> 16) ^ lefttemp) & 0x0000ffff;
          keys[n++] = lefttemp ^ temp; keys[n++] = righttemp ^ (temp << 16);
        }
      } //for each iterations
      //return the keys we've created
      return keys;
    } //end of des_createKeys
 };//end of DESCipher

var DESExtras = {
//the base 64 characters
    BASE64: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','0','1','2','3','4','5','6','7','8','9','+','/'],

    //Convert a string into base64
    stringToBase64:function(s){
      var r = "", c1, c2, c3; //remember the original length of the string
      for (var i=0; i<s.length; i+=3) { //3 input characters at a time, converted to 4 base 64 characters
        c1 = s.charCodeAt(i); //1st input character
        c2 = i+1 >= s.length ? 0 : s.charCodeAt(i+1); //2nd input or 0
        c3 = i+2 >= s.length ? 0 : s.charCodeAt(i+2); //3rd input or 0
        r += this.BASE64[c1>>2]; //the 1st base64 characters comes from the 1st 6 bits of the 1st character
        r += this.BASE64[((c1&0x3)<<4) | (c2>>4)]; //the next one comes from 2 bits of the 1st and 4 of the 2nd
        r += c2 ? this.BASE64[((c2&0xf)<<2) | (c3>>6)] : "="; //then 4 of the 2nd and 2 of the 3rd or put = at the end of the string
        r += c3 ? this.BASE64[c3&0x3f] : "="; //then 6 of the 3rd character, or output an equals
      } //for every 3 input charachters
      return r; //return the result
    },

    //Convert a base64 string into a normal string
    base64ToString:function(s) {
      var decode = new Object();
      for (var i=0; i<this.BASE64.length; i++) {decode[this.BASE64[i]] = i;} //inverse of the array
      decode['='] = 0; //add the equals sign as well
      var r = "", c1, c2, c3, c4, len=s.length; //define variables
      s += "===="; //just to make sure it is padded correctly
      for (var i=0; i<len; i+=4) { //4 input characters at a time
        c1 = s.charAt(i); //the 1st base64 input characther
        c2 = s.charAt(i+1);
        c3 = s.charAt(i+2);
        c4 = s.charAt(i+3);
        r += String.fromCharCode(((decode[c1] << 2) & 0xff) | (decode[c2] >> 4)); //reform the string
        if (c3 != '=') r += String.fromCharCode(((decode[c2] << 4) & 0xff) | (decode[c3] >> 2));
        if (c4 != '=') r += String.fromCharCode(((decode[c3] << 6) & 0xff) | decode[c4]);
      }
      return r;
    },

    stringToHex:function(s) {
      var r = "0x";
      var hexes = new Array ("0","1","2","3","4","5","6","7","8","9","a","b","c","d","e","f");
      for (var i=0; i<s.length; i++) {r += hexes [s.charCodeAt(i) >> 4] + hexes [s.charCodeAt(i) & 0xf];}
      return r;
    },

    hexToString:function(h) {
      var r = "";
      for (var i= (h.substr(0, 2)=="0x")?2:0; i<h.length; i+=2) {r += String.fromCharCode (parseInt (h.substr (i, 2), 16));}
      return r;
    }
};


;(function() {


/*
    http://www.JSON.org/json2.js
    2010-08-25

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html


    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.


    This file creates a global JSON object containing two methods: stringify
    and parse.

        JSON.stringify(value, replacer, space)
            value       any JavaScript value, usually an object or array.

            replacer    an optional parameter that determines how object
                        values are stringified for objects. It can be a
                        function or an array of strings.

            space       an optional parameter that specifies the indentation
                        of nested structures. If it is omitted, the text will
                        be packed without extra whitespace. If it is a number,
                        it will specify the number of spaces to indent at each
                        level. If it is a string (such as '\t' or '&nbsp;'),
                        it contains the characters used to indent at each level.

            This method produces a JSON text from a JavaScript value.

            When an object value is found, if the object contains a toJSON
            method, its toJSON method will be called and the result will be
            stringified. A toJSON method does not serialize: it returns the
            value represented by the name/value pair that should be serialized,
            or undefined if nothing should be serialized. The toJSON method
            will be passed the key associated with the value, and this will be
            bound to the value

            For example, this would serialize Dates as ISO strings.

                Date.prototype.toJSON = function (key) {
                    function f(n) {
                        // Format integers to have at least two digits.
                        return n < 10 ? '0' + n : n;
                    }

                    return this.getUTCFullYear()   + '-' +
                         f(this.getUTCMonth() + 1) + '-' +
                         f(this.getUTCDate())      + 'T' +
                         f(this.getUTCHours())     + ':' +
                         f(this.getUTCMinutes())   + ':' +
                         f(this.getUTCSeconds())   + 'Z';
                };

            You can provide an optional replacer method. It will be passed the
            key and value of each member, with this bound to the containing
            object. The value that is returned from your method will be
            serialized. If your method returns undefined, then the member will
            be excluded from the serialization.

            If the replacer parameter is an array of strings, then it will be
            used to select the members to be serialized. It filters the results
            such that only members with keys listed in the replacer array are
            stringified.

            Values that do not have JSON representations, such as undefined or
            functions, will not be serialized. Such values in objects will be
            dropped; in arrays they will be replaced with null. You can use
            a replacer function to replace those with JSON values.
            JSON.stringify(undefined) returns undefined.

            The optional space parameter produces a stringification of the
            value that is filled with line breaks and indentation to make it
            easier to read.

            If the space parameter is a non-empty string, then that string will
            be used for indentation. If the space parameter is a number, then
            the indentation will be that many spaces.

            Example:

            text = JSON.stringify(['e', {pluribus: 'unum'}]);
            // text is '["e",{"pluribus":"unum"}]'


            text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
            // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

            text = JSON.stringify([new Date()], function (key, value) {
                return this[key] instanceof Date ?
                    'Date(' + this[key] + ')' : value;
            });
            // text is '["Date(---current time---)"]'


        JSON.parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.

            Example:

            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.

            myData = JSON.parse(text, function (key, value) {
                var a;
                if (typeof value === 'string') {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });

            myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
                var d;
                if (typeof value === 'string' &&
                        value.slice(0, 5) === 'Date(' &&
                        value.slice(-1) === ')') {
                    d = new Date(value.slice(5, -1));
                    if (d) {
                        return d;
                    }
                }
                return value;
            });


    This is a reference implementation. You are free to copy, modify, or
    redistribute.
*/

/*jslint evil: true, strict: false */

/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
    call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/


// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

if (!this.JSON) {
    this.JSON = {};
}

(function () {

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }

    if (typeof Date.prototype.toJSON !== 'function') {

        Date.prototype.toJSON = function (key) {

            return isFinite(this.valueOf()) ?
                   this.getUTCFullYear()   + '-' +
                 f(this.getUTCMonth() + 1) + '-' +
                 f(this.getUTCDate())      + 'T' +
                 f(this.getUTCHours())     + ':' +
                 f(this.getUTCMinutes())   + ':' +
                 f(this.getUTCSeconds())   + 'Z' : null;
        };

        String.prototype.toJSON =
        Number.prototype.toJSON =
        Boolean.prototype.toJSON = function (key) {
            return this.valueOf();
        };
    }

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        escapable.lastIndex = 0;
        return escapable.test(string) ?
            '"' + string.replace(escapable, function (a) {
                var c = meta[a];
                return typeof c === 'string' ? c :
                    '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
            }) + '"' :
            '"' + string + '"';
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case 'string':
            return quote(value);

        case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

        case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

            if (!value) {
                return 'null';
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0 ? '[]' :
                    gap ? '[\n' + gap +
                            partial.join(',\n' + gap) + '\n' +
                                mind + ']' :
                          '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    k = rep[i];
                    if (typeof k === 'string') {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0 ? '{}' :
                gap ? '{\n' + gap + partial.join(',\n' + gap) + '\n' +
                        mind + '}' : '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== 'function') {
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                     typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

            return str('', {'': value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== 'function') {
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            text = String(text);
            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function (a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

            if (/^[\],:{}\s]*$/
.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
.replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
.replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval('(' + text + ')');

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return typeof reviver === 'function' ?
                    walk({'': j}, '') : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError('JSON.parse');
        };
    }
}());


var Sroc = (function() {
  return {
    counter: 1,

    get: function(url, params, callback) {
      this.request("GET", url, params, callback)
    },

    post: function(url, params, callback) {
      this.request("POST", url, params, callback)
    },
    put: function(url, params, callback) {
      this.request("PUT", url, params, callback)
    },
    remove: function(url, params, callback) {
		this.request("DELETE", url, params, callback)
	},

    request: function(method, url, params, callback) {
      var name = this._callbackName();

      window[name] = function(status, headers, body) {
        callback.call(null, status, headers, body);

        window[name] = null;

        try {
          delete window[name];
        }
        catch (e) { }
      }

      this.load(this.url(method, url, params, name));
    },

    load: function(url) {
      var done = false;
      var script = document.createElement("script");

      script.src = url + (url.indexOf("?") > -1 ? "&" : "?") + "_MELI_SDK_RANDOM=" + Math.random()*Math.random();
      script.async = true;

      script.onload = script.onreadystatechange = function() {
        if (!done && (!this.readyState || this.readyState === "loaded" || this.readyState === "complete")) {
          done = true;
          script.onload = script.onreadystatechange = null;
          if (script && script.parentNode) {
            script.parentNode.removeChild(script)
          }
        }
      }

      document.getElementsByTagName("head")[0].appendChild(script)
    },

    url: function(method, url, params, callbackName) {
      var key;

      url += url.indexOf("?") > -1 ? "&" : "?";

      url += "callback=" + callbackName;

      if (method == "GET") {
        for (key in params) {
          if (params.hasOwnProperty(key)) {
            url += "&" + key + "=" + encodeURIComponent(params[key])
          }
        }
      }
      else {
        url += "&_method=" + method + "&_body=" + encodeURIComponent(JSON.stringify(params))
      }

      return url
    },

    _callbackName: function() {
      return "jsonp" + (this.counter++)
    }
  }
})();

window.Sroc = Sroc;



})();


(function() {

if (!this.JSON) {
    this.JSON = {};
}

(function () {

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }

    if (typeof Date.prototype.toJSON !== 'function') {

        Date.prototype.toJSON = function (key) {

            return isFinite(this.valueOf()) ?
                   this.getUTCFullYear()   + '-' +
                 f(this.getUTCMonth() + 1) + '-' +
                 f(this.getUTCDate())      + 'T' +
                 f(this.getUTCHours())     + ':' +
                 f(this.getUTCMinutes())   + ':' +
                 f(this.getUTCSeconds())   + 'Z' : null;
        };

        String.prototype.toJSON =
        Number.prototype.toJSON =
        Boolean.prototype.toJSON = function (key) {
            return this.valueOf();
        };
    }

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        escapable.lastIndex = 0;
        return escapable.test(string) ?
            '"' + string.replace(escapable, function (a) {
                var c = meta[a];
                return typeof c === 'string' ? c :
                    '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
            }) + '"' :
            '"' + string + '"';
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case 'string':
            return quote(value);

        case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

        case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

            if (!value) {
                return 'null';
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0 ? '[]' :
                    gap ? '[\n' + gap +
                            partial.join(',\n' + gap) + '\n' +
                                mind + ']' :
                          '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    k = rep[i];
                    if (typeof k === 'string') {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0 ? '{}' :
                gap ? '{\n' + gap + partial.join(',\n' + gap) + '\n' +
                        mind + '}' : '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== 'function') {
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                     typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

            return str('', {'': value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== 'function') {
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            text = String(text);
            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function (a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

            if (/^[\],:{}\s]*$/
.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
.replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
.replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval('(' + text + ')');

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return typeof reviver === 'function' ?
                    walk({'': j}, '') : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError('JSON.parse');
        };
    }
}())})();

(function () {
    var g = window;
    if (g.top == g) {
        return
    }
    if (!g.postMessage || !g.localStorage || !g.JSON) {
        return
    }
    var d = g.localStorage;
    var a = null;
    var f = document.cookie.match(/(?:^|;)\s*session=(\d+)(?:;|$)/);
    if (f && f.length) {
        a = f[1]
    }
    if (!a) {
        a = new Date().getTime();
        document.cookie = ("session=" + a + "; ")
    }
    var b = {
        "xauth::retrieve": function (t, l, origin) {
            if (!l.retrieve || !l.retrieve.length) {
                i(l, "No Retrieve List Requested", origin);
                return null
            }
            var q = {};
            var k = false;
            for (var p = 0; p < l.retrieve.length; p++) {
                var s = l.retrieve[p];
                var n = d.getItem(s);
                var r = null;
                try {
                  r = n ? JSON.parse(n) : null;
                  if (r && !r.block) {
                    var u = t.match(/(.*\.)?((mercadolibre\.co((m(\.(ar|ve|uy|ec|pe|co|pa|do|mx))?)|\.cr))$|(mercadolibre\.cl$)|(mercadolivre\.com\.br$)|(mercadolivre\.pt$))/);
                    if (!u) {
                      for (var o = 0; o < r.extend.length; o++) {
                        if (t == r.extend[o]) {
                          u = true;
                          break
                          }
                        }
                      }

                      if (u) {
                          var m = new Date(r.expire);
                          if (m < new Date()) {
                              d.removeItem(s);
                              continue
                          }
                          if (r.session && r.session != a) {
                              d.removeItem(s);
                              continue
                          }
                          q[s] = {
                              data: r.data,
                              expire: r.expire
                          }
                      }
                  }
                } catch (e) {
                  d.removeItem(s);
                  q = [];
                }
            }
            return {
                cmd: l.cmd,
                id: l.id,
                tokens: q
            }
        },
        "xauth::expire": function (j, k) {
            d.removeItem(k.key);
            return {
                cmd: k.cmd,
                id: k.id
            }
        },
        "meli::logout": function (j, k) {
            d.removeItem(j);
            return {
                cmd: k.cmd,
                id: k.id
            }
        },
        "meli::close": function (j, k) {
          window.close();
        }
        
    };

    function i(l, k, j) {
        if (!l || (typeof l.id != "number")) {
            return
        }
        if (g.console && g.console.log) {
            g.console.log(l.cmd + " Error: " + k)
        }
    }
    function c(j, k) {
        if (!j || (typeof j.id != "number") || typeof(g.parent.postMessage) == undefined) {
            return
        }
        g.parent.postMessage(JSON.stringify(j), k)
    }
    function e() {
        return (d.getItem("disabled.xauth.org") == "1")
    }
    function h(j) {
        var k = j.origin.split("://")[1];
        if (typeof(k) != "undefined") k = k.split(":")[0]
        else k = "null";
        var l = JSON.parse(j.data);
        if (!l || typeof l != "object" || !l.cmd || l.id == undefined || e()) {
            return
        }
        if (b[l.cmd]) {
            c(b[l.cmd](k, l, j.origin), j.origin)
        }
    }
    if (g.addEventListener) {
        g.addEventListener("message", h, false)
    } else {
        if (g.attachEvent) {
            g.attachEvent("onmessage", h)
        }
    }
    if (typeof(g.parent.postMessage) != "undefined")
      g.parent.postMessage(JSON.stringify({
          cmd: "xauth::ready"
      }), "*")
})(); 


var XAuth = (function () {
    var j = window;
    var q = !(j.postMessage && j.localStorage && j.JSON);
    var data = {
      n: "static.mlstatic.com",
      xdp: "/xd.html",
      port: "",
      protocol: "http://"
    }
    
    data.e = data.protocol + data.n + (data.port?":"+data.port:"") + data.xdp;
    var g = null;
    var a = null;
    var p = {};
    var d = 0;
    var m = [];
    var listeners = null;
    function init() {
      if (data) data.e = data.protocol + data.n + (data.port?":"+data.port:"") + data.xdp;
      if (listeners) return;
      else {
        if (j.addEventListener) {
            j.addEventListener("message", o, false)
        } else {
            if (j.attachEvent) {
                j.attachEvent("onmessage", o)
            }
        }
        listeners = true;
      }
    }
    function o(s) {
      //as xauth is not always initialized try/catch this
      try {
        var u = s.origin.split("://")[1].split(":")[0];
        var n = data.n;
        if (u != n) {
            return
        }
        var t = JSON.parse(s.data);
        if (!t) {
            return
        }
        if (t.cmd == "xauth::ready") {
            a = g.contentWindow;
            setTimeout(f, 0);
            return
        } else if (t.cmd == "meli::loginComplete") {
          window.MELI._loginComplete(t.data);
          return;
        } else if (t.cmd == "meli::authComplete") {
          window.MELI._authComplete(t.data);
          return;
        } else if (t.cmd == "meli::logout") {
          window.MELI._logoutComplete();
        } else if (t.cmd == "meli::close") {
          window.close();
        }
        var r = p[t.id];
        if (r) {
            if (r.callback) {
                r.callback(t)
            }
            delete p[t.id]
        }
      } catch (error) {
      }
    }
    function i() {
        if (g || a) {
            g.src = data.e;
            return
        }
        var s = j.document;
        g = s.createElement("iframe");
        g.id = "xauthIFrame";
        var r = g.style;
        r.position = "absolute";
        r.left = r.top = "-999px";
        s.body.appendChild(g);
        init();
        g.src = data.e;
    }
    function f() {
        for (var r = 0; r < m.length; r++) {
            c(p[m.shift()])
        }
    }
    function c(r) {
        a.postMessage(JSON.stringify(r), data.e)
    }
    function h(r) {
        if (q) {
          //postMessage not supported
            return
        }
        r.id = d;
        p[d++] = r;
        if (!g || !a) {
            m.push(r.id);
            i()
        } else {
            c(r)
        }
    }
    function l(r) {
        if (!r) {
            r = {}
        }
        var s = {
            cmd: "xauth::retrieve",
            retrieve: r.retrieve || [],
            callback: r.callback || null
        };
        h(s)
    }
    function k(r) {
        if (!r) {
            r = {}
        }
        var s = {
            cmd: "xauth::extend",
            data: r.data|| "",
	    key: r.key || "",
            expire: r.expire || 0,
            extend: r.extend || [],
            session: r.session || false,
            callback: r.callback || null
        };
        h(s)
    }
    function b(r) {
        if (!r) {
            r = {}
        }
        var s = {
            cmd: "xauth::expire",
            key: r.key || null,
            callback: r.callback || null
        };
        h(s)
    }
    return {
        init: init,
        data: data,
        extend: k,
        retrieve: l,
        expire: b,
        disabled: q
    }
})();


(function(cookie, XAuth) {

	var Store = function() {
		this.map = {};

		return this;
	};

	Store.localStorageAvailable = (function() {
		try {
			return ('localStorage' in window) && window.localStorage !== null;
		} catch (e) {
			return false;
		}
	})();

	if(Store.localStorageAvailable) {
		Store.prototype.get = function(key) {
			return window.localStorage.getItem(key);
		};

		Store.prototype.set = function(key, value) {
			window.localStorage.setItem(key, value);
		};
		/**
		 * Crypted storage
		 * */
		Store.prototype.getSecure = function(key, secret) {
			var crypto = this.get(key);

			if(secret && secret != "" && crypto) {
				var value = this._decrypt(secret, crypto);
				var length = parseInt(this.get(key + ".length"));

				return value.substring(0, length);
			}

			return undefined;
		}

		Store.prototype.setSecure = function(key, value, options) {
			options = options || {};

			var secret = this._generateSecret();

			var data = JSON.stringify(value.data);

			var crypto = this._encrypt(secret, data);

			value.data = crypto;
			this.set(key, JSON.stringify(value));

			return {
				s : secret,
				l : data.length
			};

		};

		Store.prototype._encrypt = function(secret, message) {
			var crypto = DESCipher.des(secret, message, 1/*encrypt=true*/, 0/*vector ? 1 : 0*/, null/*vector*/);
			crypto = DESExtras.stringToHex(crypto);
			return crypto;
		};

		Store.prototype._decrypt = function(secret, crypto) {
			var message = DESExtras.hexToString(crypto);
			message = DESCipher.des(secret, message, 0/*encrypt=false*/, 0/*vector=false*/, null/*vector*/);
			return message;
		};

		Store.prototype._generateSecret = function() {
			var v = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

			for(var j, x, i = v.length; i; j = parseInt(Math.random() * i), x = v[--i], v[i] = v[j], v[j] = x)
			;

			var secret = v.slice(0, 8).join("");

			return secret;
		};
	} else {
		Store.prototype.get = function(key) {
			return this.map[key];
		};

		Store.prototype.set = function(key, value) {
			this.map[key] = value;
		};
	}

	var Sroc = window.Sroc;

	var MELI = {
		baseURL : "https://api.mercadolibre.com",
		authorizationURL : "http://auth.mercadolibre.com/authorization",
		authorizationStateURL : "https://www.mercadolibre.com/jms/SITE/oauth/authorization/state",
		logoutURL : "http://DOMAIN/jm/logout?urlTo=",
		AUTHORIZATION_STATE : "authorization_state",
		mlSites : {
			MLA : "com.ar",
			MLB : "com.br",
			MLU : "com.uy",
			MLC : "cl",
			MEC : "com.ec",
			MPE : "com.pe",
			MPT : "pt",
			MLV : "com.ve",
			MCO : "com.co",
			MCR : "co.cr",
			MPA : "com.pa",
			MRD : "com.do",
			MLM : "com.mx"
		},

		options : {},
		hash : {},
		callbacks : {},
		pendingCallbacks : [],
		store : new Store(),
		appInfo : null,
		isAuthorizationStateAvaible : false,
		authorizationState : {},
		authorizationStateAvailableCallbacks : [],
		authorizationStateCallbackInProgress : false,
		authorizationStateCallbackTimer : null,
		synchronizationInProgress : false,
    postLoginCallback: null,
		unknownStatus : {
			state : "UNKNOWN",
			authorization_info : {
				access_token : "",
				expires_in : 0,
				user_id : null
			}
		},
		refreshing : false,
		showLogin : true,
		messages : true,
		initialized : false,
		initCallbacks : [],
		_partial : function(func /* , 0..n args */) {
			var args = Array.prototype.slice.call(arguments, 1);
			var self = this;
			return function() {
				var allArguments = args.concat(Array.prototype.slice.call(arguments));
				return func.apply(self, allArguments);
			};
		},
		//initialization: set base domains an url. Initialize XAuth on base window
		init : function(options) {
			this.options = options;

      if (typeof(this.options.site_id) == "undefined")
        this.options.site_id = "MLA";

			this.messages = (window.postMessage && window.localStorage && window.JSON);

			if(this.options.test) {
				this._setUpMocks();
			}

			this._setUpURLsBySiteId();
			if( typeof (this.options.show_login) != "undefined")
				this.showLogin = this.options.show_login;
				
			this._initXAuthClient();
			this.initialized = true;
			while(this.initCallbacks.length > 0) {
				var callback = this.initCallbacks.shift();
				try { callback(); } catch (e) { };
			}
		},
		_setUpURLsBySiteId:function(){
			if(this.options.site_id == "MLB" || this.options.site_id == "MPT") {
				this.authorizationURL = this.authorizationURL.replace("mercadolibre", "mercadolivre");
				this.authorizationStateURL = this.authorizationStateURL.replace("mercadolibre", "mercadolivre");
			}
			this.logoutURL = this.logoutURL.replace("DOMAIN", this._getDomain());
		},
		_setUpMocks:function(){
			this.baseURL = this.options.test;
			this.isAuthorizationStateAvaible = true;
			var status = {
				state : "AUTHORIZED",
				authorization_info : {
					access_token : "faketoken",
					expires_in : new Date(new Date().getTime() + parseInt(10800) * 1000).getTime(),
					user_id : null
				}
			};
			this.authorizationState[this._getKey()] = status;
      var obj = this;
      this._synchronizeAuthorizationState = function () {
        obj.authorizationState[obj._getKey()] = status;
        this._onAuthorizationStateAvailable(status);
      }
		},
		_initXAuthClient: function() {
                        this.options.xauth_domain = this.options.xauth_domain || "static.mlstatic.com";
                        this.options.auth_timeout = this.options.auth_timeout || 3000;
                        this.options.xd_url = this.options.xd_url || "/org-img/sdk/xd-1.0.2.html";
                        this.options.xauth_protocol = this.options.xauth_protocol || "http://";

			if(this.options.xauth_domain_fallback && !this.messages)
				this.options.xauth_domain = this.options.xauth_domain_fallback;

			XAuth.data.protocol = this.options.xauth_protocol;
			XAuth.data.n = this.options.xauth_domain;
			XAuth.data.xdp = this.options.xd_url;
			XAuth.data.port = this.options.xauth_port;
			if(window.self == window.top)
				XAuth.init();
		},
		_getDomain : function() {
			if(this.mlSites[this.options.site_id] == null)
				return null;
			var domain = "www.mercadoli";
			if(this.options.site_id == "MLB" || this.options.site_id == "MPT")
				domain += "vre.";
			else
				domain += "bre.";
			domain += this.mlSites[this.options.site_id];
			return domain;
		},
		//Is the authState still valid?
		_isExpired : function(authState) {
			//credentials are expired if not present or expired
			if(authState == null) {
				return true;
			}
			if( typeof (authState.authorization_info) == "undefined")
				return true;

			var expirationTime = authState.authorization_info.expires_in;
			if(expirationTime) {
				var dateToExpire = new Date(parseInt(expirationTime));
				var now = new Date();
				if(dateToExpire <= now) {
					return true;
				}
			}
			return false;
		},
		_decryptAuthorizationState : function(state) {
			var retVal = this.store._decrypt(this.secret.s, state);
			var length = parseInt(this.secret.l);
			retVal = retVal.substring(0, length);
			retVal = JSON.parse(retVal);
			return retVal;
		},
		//Synchronizes auth state with localStorage in iFrame or auth FE
		_synchronizeAuthorizationState : function(tryRemote) {
			if(!this.initialized) {
				this.initCallbacks.push(this._partial(this._synchronizeAuthorizationState, tryRemote));
				return;
			}

			var key = this._getKey();
			var obj = this;
			if(this.messages) {
				//retrieves data from remote localStorage
				XAuth.retrieve({
					retrieve : [key],
					callback : function(value){ obj._onAuthorizationStateRetrieved(tryRemote, value); }
				});
			} else {
				//open xd iframe
				obj._getRemoteAuthorizationState();
			}
		},
		_onAuthorizationStateRetrieved:function(tryRemote, value) {
			this._updateSecret();
			var notify = true;
			var key = this._getKey();
			if(tryRemote && (value.tokens[key] == null || ((this.secret == null || this.secret == "") && 
			   (cookie("ats") == null || cookie("ats") == "") )) ) {
				//no data from iFrame - call login_status api
				this._getRemoteAuthorizationState();
			} else {
				//save authState in local variable
				var authState = this.unknownStatus;
				if( typeof (value.tokens[key]) != "undefined") {
					//decrypt
					authState = null;
					try {
						authState = value.tokens[key].data;
						authState = this._decryptAuthorizationState(authState);
						authState.expiration = authState.expire;
					} catch (e) {
						authState = null;
					}
					if(this._isExpired(authState) && tryRemote) {
						this._getRemoteAuthorizationState();
						notify = false;
					}
				}
				if(notify) {
					this.authorizationState[key] = authState;
					this._onAuthorizationStateAvailable(authState);
				}
			}
		},
		/**
		 * gets authorization state from auth FE
		 */
		_getRemoteAuthorizationState : function() {
			if(!this.initialized) {
				this.initCallbacks.push(this._getRemoteAutorizationState);
				return;
			}

			//if already in progress dismiss call and wait
			if(!this.authorizationStateCallbackInProgress) {
				this.authorizationStateCallbackInProgress = true;
				//launch timer to catch timeout
				this.authorizationStateCallbackTimer = setTimeout('MELI._authFail();', this.options.auth_timeout);
				if(this.appInfo == null) {
					this._getApplicationInfo(this._authorize);
				} else {
					this._authorize();
				}
			}
		},
		_getApplicationInfo : function(callback) {
			if(!this.initialized) {
				this.initCallbacks.push(this._partial(this._getApplicationInfo, callback));
				return;
			}

			var self = this;
			this.get("/applications/" + this.options.client_id, {}, function(response) {
				self.appInfo = response[2];
				if(callback)
					callback();
			});
		},
		_onAuthorizationStateAvailable : function(authorizationState) {
			//all callbacks waiting for authorizationState
			this.authorizationStateCallbackInProgress = false;
			this.isAuthorizationStateAvaible = true;
			//there is a new auth state, session changed
			this._triggerSessionChange();

			var localCallbacks = this.authorizationStateAvailableCallbacks.splice(0, this.authorizationStateAvailableCallbacks.length);
			while(localCallbacks.length > 0) {
				var callback = localCallbacks.shift();
				callback(authorizationState);
			}
		},
		getLoginStatus : function(callback) {
			if(!this.initialized) {
				this.initCallbacks.push(this._partial(this.getLoginStatus, callback));
				return;
			}

			if(this.isAuthorizationStateAvaible) {
				var key = this._getKey();
				if( this.authorizationState[key] != null && !this._isExpired(this.authorizationState[key])) {
					callback(this.authorizationState[key]);
				} else {
					//expired credentials, resynchronyze pushing this action
					this.isAuthorizationStateAvaible = false;
					this.authorizationStateAvailableCallbacks.push(callback);
					this._synchronizeAuthorizationState(true);
				}
			} else {
				this.authorizationStateAvailableCallbacks.push(callback);
				this._synchronizeAuthorizationState(true);
			}

		},
		_expireToken : function(key) {
			if(!this.initialized) {
				this.initCallbacks.push(this._partial(this._expireToken, key));
				return;
			}
			XAuth.expire({
				key : key
			});
			this.authorizationState[key] = null;
			cookie("ats", null, {
				domain : this.options.domain ? this.options.domain : document.domain,
				path : "/"
			});
			this.secret = null;
		},
		tokenIssue : function(response) {
			return response[0] != 200 && 
			((response[2].error != null && 
				((Object.prototype.toString.call(response[2].error) === '[object Array]' && 
				 response[2].error[0].match(/.*(token|OAuth).*/)) || 
				 ( typeof (response[2].error) === 'string' && response[2].error.match(/.*(token|OAuth).*/)))) 
				 || (response[2].message != null && response[2].message.match(/.*(token|OAuth).*/)) || response[0] == 403);
		},
		get : function(url, params, callback) {
			if(!this.initialized) {
				this.initCallbacks.push(this._partial(this.get, url, params, callback));
				return;
			}

			Sroc.get(this._url(url), params, callback);
		},
		post : function(url, params, callback) {
			if(!this.initialized) {
				this.initCallbacks.push(this._partial(this.post, url, params, callback));
				return;
			}

			var self = this;
			var call = function() {
				Sroc.post(self._url(url), params, callback);
			};
			this.withLogin(call, callback, self.showLogin);
		},
		put : function(url, params, callback) {
			if(!this.initialized) {
				this.initCallbacks.push(this._partial(this.put, url, params, callback));
				return;
			}

			var self = this;
			var call = function() {
				Sroc.put(self._url(url), params, callback);
			};
			this.withLogin(call, callback, self.showLogin);
		},
		remove : function(url, params, callback) {
			if(!this.initialized) {
				this.initCallbacks.push(this._partial(this.remove, url, params, callback));
				return;
			}

			if(!params) {
				params = {};
			}
			Sroc.remove(this._url(url), params, callback);
		},
		getToken : function() {
      //TODO: revisar el caso de authorizationState null)
			var key = this._getKey();
			var authorizationState = this.authorizationState[key];
			if( !this._isExpired(authorizationState) ) {
				var token = authorizationState.authorization_info.access_token;
				return (token && token.length > 0) ? token : null;
			} else {
				return null;
			}
		},
		withLogin : function(successCallback, failureCallback, forceLogin) {
			if(!this.initialized) {
				this.initCallbacks.push(this._partial(this.withLogin, successCallback, failureCallback, forceLogin));
				return;
			}

			var self = this;
			this.getLoginStatus(function(authorizationState) {
				if(authorizationState.state == 'AUTHORIZED') {
					successCallback();
				} else if(forceLogin) {
					self.pendingCallbacks.push(successCallback);
					self.login();
				} else {
					if(failureCallback) {
						failureCallback();
					}
				}
			});
		},
		login : function(callback) {
			if(!this.initialized) {
				this.initCallbacks.push(this.login);
				return;
			}
      //enqueue callback in session change
      if (callback) this.postLoginCallback = callback;

			this._popup(this._authorizationURL(true));
		},
		_iframe : function(url, id) {
			if(!id)
				id = "xauthIFrame";
			var iframe = document.getElementById(id);
			if(!iframe || iframe.length == 0) {
				var elem = window.document.createElement("iframe");
				var r = elem.style;
				r.position = "absolute";
				r.left = r.top = "-999px";
				elem.id = id;
				window.document.body.appendChild(elem);
				elem.src = url;
			} else
				iframe.src = url;

		},
		_authorize : function() {
			MELI._iframe(MELI._authorizationStateURL());
		},
		bind : function(event, callback) {
			if( typeof (this.callbacks[event]) == "undefined")
				this.callbacks[event] = [];
			this.callbacks[event].push(callback);
		},
		trigger : function(event, args) {
			var callbacks = this.callbacks[event];

			if( typeof (callbacks) == "undefined") {
				return;
			}
			for(var i = 0; i < callbacks.length; i++) {
				callbacks[i].apply(null, args);
			}
		},
		refreshToken : function() {
			//expire xauth key
			XAuth.expire({
				key : this._getKey()
			});
			this.authorizationState[this._getKey()] = null;
			this._synchronizeAuthorizationState(true);
		},
		logout : function() {
			if(!this.initialized) {
				this.initCallbacks.push(this._partial(this.logout));
				return;
			}
			//expire xauth key
			this._expireToken(this._getKey());
			//logout from meli
			if(this.appInfo == null) 
					this._getApplicationInfo(this._logout);
      else
        this._logout();
    },
    _logout: function() {
      MELI._iframe(MELI._logoutURL(), "logoutFrame");
    },
		_triggerSessionChange : function() {
      if (this.postLoginCallback) {
        var local = this.postLoginCallback;
        this.postLoginCallback = null;
        local();
      }

			this.trigger("session.change", [this.getToken() ? true : false]);
		},
		getSession : function() {
			return this.authorizationState[this._getKey()];
		},
		_url : function(url) {
			url = this.baseURL + url;
			var urlParams = "";

			var token = this.getToken();

			if(token) {
				var append = url.indexOf("?") > -1 ? "&" : "?";
				url += append + "access_token=" + token;
			}
			if(urlParams.length > 0) {
				append = url.indexOf("?") > -1 ? "&" : "?";
				url += append + urlParams;
			}

			return url;
		},
		_parseHash : function() {
			var localHash = window.location.hash;

			if(localHash.length == 0) {
				return;
			}
			localHash = localHash.substr(1);
			if(localHash.length == 0) {
				return;
			}
			var self = this;

			if(localHash[0] == '%' || localHash[0] == '{')
				self.hash = JSON.parse(unescape(localHash));
			else {
				var pairs = localHash.split("&");

				for(var i = 0; i < pairs.length; i++) {
					var pair = null;

					if( pair = pairs[i].match(/([A-Za-z_\-]+)=(.*)$/)) {
						self.hash[pair[1]] = pair[2];
					}
				}
			}
		},
		_notifyParent : function(message) {
			var p = window.opener || window.parent;
			if( typeof (p) == "undefined")
				return;
			if(!this.messages) {

				if(message.methodName == "meli::loginComplete")
					p.MELI._loginComplete(message.secret);
				else if(message.methodName == "meli::authComplete")
					p.MELI._authComplete(message.secret);
				else if(message.methodName == "meli::logout")
					p.MELI._logoutComplete();
				else if(message.methodName == "meli::close")
					p.MELI._logoutComplete();

			} else {
				var ie8Jump = window.top == self;
				if (ie8Jump) {
					p.frames["xauthIFrame"].MELI._notifyParent(message);
				} else {
					p.postMessage(JSON.stringify({
						cmd : message.methodName,
						data : message.secret
					}), "*");
				}

			}
		},
		// Check if we're returning from a redirect
		// after authentication inside an iframe.}
		_checkPostAuthorization : function() {
			if(this.hash.state) {
				var authorizationState = null;
				var parentMethod = null;
				if(this.hash.state == "iframe") {
					//parse OAuth response format
					authorizationState = this._parseImplicitGrantHash();
					parentMethod = "meli::loginComplete";
				} else {
					//parse ML's custom response format
					authorizationState = this._parseAuthorizationStateHash();
					parentMethod = "meli::authComplete";
				}
				if(authorizationState != null) {
					var secret = this._storeAuthorizationState(authorizationState);
					this._notifyParent({ methodName : parentMethod, secret : secret });
          			window.close();
				}
			} else if(this.hash.action == "logout") {
				this._notifyParent({
					methodName : "meli::logout"
				});
			}
		},
		_parseAuthorizationStateHash:function(){
			//from Authorization State
			var authorizationState = this.hash;
			this.options.client_id = this.hash.client_id;
			if(!this.hash.authorization_info && (this.hash.state == "UNKNOWN" || this.hash.state == "NOT_AUTHORIZED")) {
				this.hash.authorization_info = {
					access_token : null,
					expires_in : new Date(new Date().getTime() + parseInt(10800) * 1000).getTime(),
					user_id : null
				};
			} else if(this.hash.authorization_info) {
				var expiration = new Date().getTime() + (this.hash.authorization_info ? this.hash.authorization_info.expires_in * 1000 : 0);
				this.hash.authorization_info.expires_in = expiration;
			}
			return authorizationState;
		},
		_parseImplicitGrantHash:function(){
			//returning from authorization (login)
			var authorizationState = null;
			if(!this.hash.error) {
				//TODO: Should remove this parsing
				this.options = {
					client_id : RegExp("(APP_USR\\-)(\\d+)(\\-)").exec(this.hash.access_token)[2]
				};
				//save in local storage the hash data
				authorizationState = {
					state : 'AUTHORIZED',
					authorization_info : {
						access_token : this.hash.access_token,
						expires_in : new Date(new Date().getTime() + parseInt(this.hash.expires_in) * 1000).getTime(),
						user_id : this.hash.user_id
					},
          extend_domains: this.hash.domains.split(",")
				};
			}
			return authorizationState;
		},
		_storeAuthorizationState:function(authorizationState){
			//var extendDomains = (this.options.domain ? [this.options.domain] : ["*"]);
			var key = this._getKey();
			var secret = this.store.setSecure(key, {
				key : key,
				data : authorizationState,
				expire : authorizationState.authorization_info.expires_in,
				extend : authorizationState.extend_domains
			});
			return secret;
		},
		_loginComplete : function(secret) {
			if(this._popupWindow) {
				var isModal = false;
				try {
					isModal = this._popupWindow.type && this._popupWindow.type == "modal";
				} catch (e) {}
				if(isModal) {
					this._popupWindow.hide();
					this._popupWindow = null;
				} else{
					this._popupWindow.close();
				}
			}
			//update our authorization credentials
			var self = this;
			this.authorizationStateAvailableCallbacks.push(function(authState) {
				while(self.pendingCallbacks.length > 0)(self.pendingCallbacks.shift())();
			});
			this._authComplete(secret);
		},
		_logoutComplete : function() {
			this._storeSecret(null);
			document.getElementById('logoutFrame').remove();
			this._triggerSessionChange();
		},
		_authFail : function(secret) {
			//update our authorization credentials
			this._iframe(this._xd_url());
			this._authComplete(null);
		},
		_authComplete : function(secret) {
			//update our authorization credentials
			if(this.authorizationStateCallbackTimer) {
				clearTimeout(this.authorizationStateCallbackTimer);
				this.authorizationStateCallbackTimer = null;
			}
			this._storeSecret(secret);
			this._synchronizeAuthorizationState(false);
		},
		_storeSecret : function(secret) {
			//set cookie
			cookie("ats", JSON.stringify(secret), {
				domain : this.options.domain ? this.options.domain : document.domain,
				path : "/"
			});
			this.secret = secret;
		},
		_popup : function(url) {
			if(!this._popupWindow || this._popupWindow.closed) {
				var width = 830;
				var height = 510;
				var left = parseInt((screen.availWidth - width) / 2);
				var top = parseInt((screen.availHeight - height) / 2);
				if(this.options.login_function)
					this._popupWindow = this.options.login_function(url).show();
				else
					this._popupWindow = (window.open(url, "", "toolbar=no,status=no,location=yes,menubar=no,resizable=no,scrollbars=no,width=" + width + ",height=" + height + ",left=" + left + ",top=" + top + "screenX=" + left + ",screenY=" + top));
				this._popup.on;
			} else {
				if(this._popupWindow.focus)
					this._popupWindow.focus();
			}
		},
		_getKey : function() {
			var key = null;
			try {
				key = this.options.client_id + this.AUTHORIZATION_STATE;
			} catch (Error) {
				key = "";
			}
			return key;
		},
		_updateSecret : function() {
			try {
				this.secret = JSON.parse(unescape(cookie("ats")));
			} catch (e) {
				this.secret = null;
			};
		},
		_authorizationStateURL : function() {
			return this.authorizationStateURL.replace("SITE", this.appInfo.site_id.toLowerCase()) + "?client_id=" + this.options.client_id + "&redirect_uri=" + encodeURIComponent(this._xd_url()) + "&response_type=token";
		},
		_authorizationURL : function(interactive) {
			return this.authorizationURL + "?redirect_uri=" + encodeURIComponent(this._xd_url()) + "&response_type=token" + "&client_id=" + this.options.client_id + "&state=iframe" + "&display=popup" + "&interactive=" + ( interactive ? 1 : 0);
		},
		_logoutURL : function() {
			return this.logoutURL + encodeURIComponent(this._authorizationStateURL() + "#action=logout");
		},
		_xd_url : function() {
			return this.options.xauth_protocol + this.options.xauth_domain + (this.options.xauth_port ? ":" + this.options.xauth_port : "") + this.options.xd_url;
		}
	};

	MELI._parseHash();

	MELI._checkPostAuthorization();

	window.MELI = MELI;
  if (typeof(window.mlAsyncInit) == "function")
    window.mlAsyncInit();



})(cookie, XAuth);



})();
