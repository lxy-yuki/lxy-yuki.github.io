(function (global) {
    "use strict";

    var STORAGE_KEY = "maiying_password_unlocks_v1";
    var memoryFallback = {};

    function readState() {
        try {
            var stored = JSON.parse(global.localStorage.getItem(STORAGE_KEY) || "{}");
            return stored && typeof stored === "object" ? stored : {};
        } catch (error) {
            return memoryFallback;
        }
    }

    function writeState(state) {
        memoryFallback = state;
        try {
            global.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (error) {
            // localStorage 不可用时，至少在当前页面会话内继续记住解锁状态。
        }
    }

    function pageScope() {
        var customScope = document.documentElement.getAttribute("data-password-scope");
        if (customScope) return customScope;
        return String(global.location.pathname || document.title || "game-page")
            .replace(/\\/g, "/")
            .toLowerCase();
    }

    function makeKey(target) {
        return pageScope() + "::" + String(target || "default");
    }

    function isUnlocked(target) {
        return readState()[makeKey(target)] === true;
    }

    function unlock(target) {
        var state = readState();
        state[makeKey(target)] = true;
        writeState(state);
    }

    global.PasswordUnlockState = {
        isUnlocked: isUnlocked,
        unlock: unlock
    };
})(window);
