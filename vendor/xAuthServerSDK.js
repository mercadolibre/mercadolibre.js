var XAuthServer = function () {
    var g = window;
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
        "xauth::login_complete": function (j, k) {
            MercadoLibre._loginComplete();
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
        if (!j || (typeof j.id != "number")) {
            return
        }
        g.parent.postMessage(JSON.stringify(j), k)
    }
    function e() {
        return (d.getItem("disabled.xauth.org") == "1")
    }
    function h(j) {
      alert(j);
        var k = j.origin.split("://")[1].split(":")[0],
            l = JSON.parse(j.data);
        if (!l || typeof l != "object" || !l.cmd || l.id == undefined || e()) {
            return
        }
        if (b[l.cmd]) {
            c(b[l.cmd](k, l), j.origin)
        }
    }
    
    if (g.addEventListener) {
        g.addEventListener("message", h, false)
    } else {
        if (g.attachEvent) {
            g.attachEvent("onmessage", h)
        }
    }
};
