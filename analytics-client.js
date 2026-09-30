(function (global) {
    "use strict";

    var DEVICE_KEY = "maiying.creatorStats.deviceId.v1";
    var QUALIFIED_KEY = "maiying.creatorStats.qualified.v2";
    var PENDING_KEY = "maiying.creatorStats.pending.v2";
    var fallbackDevice = randomId();
    var confirmed = false;
    var inFlight = null;
    var retryTimer = null;
    var retryAttempt = 0;
    var pendingKeyword = "";
    var retryDelays = [1000, 3000, 10000, 30000, 60000];

    function apiUrl(path) {
        var base = String(global.MAIYING_STATS_API_BASE || "").replace(/\/+$/, "");
        return base + path;
    }

    function randomId() {
        if (global.crypto && typeof global.crypto.randomUUID === "function") {
            return global.crypto.randomUUID();
        }
        var bytes = new Uint8Array(24);
        if (global.crypto && typeof global.crypto.getRandomValues === "function") {
            global.crypto.getRandomValues(bytes);
            return Array.from(bytes, function (byte) {
                return byte.toString(16).padStart(2, "0");
            }).join("");
        }
        return "device-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
    }

    function getDeviceId() {
        try {
            var saved = localStorage.getItem(DEVICE_KEY);
            if (saved && /^[a-zA-Z0-9-]{16,100}$/.test(saved)) return saved;
            var created = randomId();
            localStorage.setItem(DEVICE_KEY, created);
            return created;
        } catch (error) {
            return fallbackDevice;
        }
    }

    function alreadyRecorded() {
        try {
            return confirmed || localStorage.getItem(QUALIFIED_KEY) === apiUrl("/api/plays/qualify");
        } catch (error) {
            return confirmed;
        }
    }

    function rememberRecorded() {
        confirmed = true;
        pendingKeyword = "";
        if (retryTimer) global.clearTimeout(retryTimer);
        try {
            localStorage.setItem(QUALIFIED_KEY, apiUrl("/api/plays/qualify"));
            localStorage.removeItem(PENDING_KEY);
        } catch (error) {
            // 服务端仍会去重；本地存储不可用时只会增加少量重复请求。
        }
    }

    function markQualified(keyword) {
        if (alreadyRecorded() || location.protocol === "file:") return Promise.resolve(false);
        pendingKeyword = String(keyword || pendingKeyword || "");
        if (!pendingKeyword) return Promise.resolve(false);
        try { localStorage.setItem(PENDING_KEY, pendingKeyword); } catch (error) { /* 使用内存重试 */ }
        if (inFlight) return inFlight;
        var controller = new AbortController();
        var timeout = global.setTimeout(function () { controller.abort(); }, 15000);

        inFlight = fetch(apiUrl("/api/plays/qualify"), {
            method: "POST",
            credentials: "omit",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ deviceId: getDeviceId(), keyword: pendingKeyword }),
            keepalive: true,
            signal: controller.signal
        }).then(function (response) {
            if (!response.ok) throw new Error("counter unavailable");
            return response.json();
        }).then(function (result) {
            if (result.ok !== true) throw new Error("counter not confirmed");
            rememberRecorded();
            return true;
        }).catch(function () {
            if (!retryTimer && retryAttempt < retryDelays.length) {
                retryTimer = global.setTimeout(function () {
                    retryTimer = null;
                    markQualified(pendingKeyword);
                }, retryDelays[retryAttempt++]);
            }
            return false;
        }).finally(function () {
            global.clearTimeout(timeout);
            inFlight = null;
        });
        return inFlight;
    }

    function resumePending() {
        if (alreadyRecorded()) return;
        try { pendingKeyword = localStorage.getItem(PENDING_KEY) || pendingKeyword; } catch (error) { /* 使用内存 */ }
        if (pendingKeyword) markQualified(pendingKeyword);
    }
    global.addEventListener("online", function () { retryAttempt = 0; resumePending(); });
    document.addEventListener("visibilitychange", function () {
        if (document.visibilityState === "visible") resumePending();
    });
    global.CreatorPlayCounter = Object.freeze({ markQualified: markQualified });
    resumePending();
})(window);
