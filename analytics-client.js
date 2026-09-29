(function (global) {
    "use strict";

    var DEVICE_KEY = "maiying.creatorStats.deviceId.v1";
    var QUALIFIED_KEY = "maiying.creatorStats.qualified.v1";

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
            return randomId();
        }
    }

    function alreadyRecorded() {
        try {
            return localStorage.getItem(QUALIFIED_KEY) === "1";
        } catch (error) {
            return false;
        }
    }

    function rememberRecorded() {
        try {
            localStorage.setItem(QUALIFIED_KEY, "1");
        } catch (error) {
            // 服务端仍会去重；本地存储不可用时只会增加少量重复请求。
        }
    }

    function markQualified(keyword) {
        if (alreadyRecorded() || location.protocol === "file:") return Promise.resolve(false);

        return fetch("/api/plays/qualify", {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ deviceId: getDeviceId(), keyword: String(keyword || "") }),
            keepalive: true
        }).then(function (response) {
            if (!response.ok) throw new Error("counter unavailable");
            rememberRecorded();
            return true;
        }).catch(function () {
            // 统计故障不能打断游戏，也不向玩家显示任何提示。
            return false;
        });
    }

    global.CreatorPlayCounter = Object.freeze({ markQualified: markQualified });
})(window);
