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
