(function () {
    "use strict";

    var PROGRESS_KEY = "maiying.game.progress.v1";
    var ENDING_KEY = "maiying.game.ending.v1";

    var REQUIRED_CLUES = [
        "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11",
        "12", "13", "14", "15", "16", "17", "19", "20", "21", "22"
    ];
    var REQUIRED_ACCOUNTS = [
        "chenshu", "liyuan", "liuzhen", "zhaoyuhong", "zhangzhi", "qianweidong", "zhouwei"
    ];

    function parse(key, fallback) {
        try {
            var value = JSON.parse(localStorage.getItem(key) || "null");
            return value && typeof value === "object" ? value : fallback;
        } catch (error) {
            return fallback;
        }
    }

    function unique(values) {
        return Array.from(new Set((values || []).map(String)));
    }

    function getProgress() {
        var data = parse(PROGRESS_KEY, {});
        return {
            clues: unique(data.clues),
            accounts: unique(data.accounts)
        };
    }

    function saveProgress(data) {
        localStorage.setItem(PROGRESS_KEY, JSON.stringify({
            clues: unique(data.clues),
            accounts: unique(data.accounts)
        }));
    }

    function markClue(id) {
        if (!id) return;
        var data = getProgress();
        if (!data.clues.includes(String(id))) {
            data.clues.push(String(id));
            saveProgress(data);
        }
    }

    function markAccount(id) {
        if (!id) return;
        var data = getProgress();
        if (!data.accounts.includes(String(id))) {
            data.accounts.push(String(id));
            saveProgress(data);
        }
    }

    function defaultEnding() {
        return {
            endingStarted: false,
            chenLatestUnlocked: false,
            chenUpdateUnread: false,
            choiceABSelected: "",
            zhouChatUnlocked: false,
            zhouChatComplete: false,
            optionCSeen: false,
            optionDSeen: false,
            endingChatPhase: "initial",
            initialChatIndex: 0,
            initialQuizPassed: false,
            aChatIndex: 0,
            cReturnChatIndex: 0,
            abMonologueIndex: 0,
            thoughtIndex: 0,
            finalDialogueComplete: false
        };
    }

    function getEnding() {
        var data = parse(ENDING_KEY, {});
        return Object.assign(defaultEnding(), data);
    }

    function saveEnding(data) {
        localStorage.setItem(ENDING_KEY, JSON.stringify(data));
        return data;
    }

    function updateEnding(patch) {
        return saveEnding(Object.assign(getEnding(), patch || {}));
    }

    function resetEnding() {
        return saveEnding(Object.assign(defaultEnding(), { endingStarted: true }));
    }

    function hasEndingAccess() {
        var data = getProgress();
        return REQUIRED_CLUES.every(function (id) { return data.clues.includes(id); }) &&
            REQUIRED_ACCOUNTS.every(function (id) { return data.accounts.includes(id); });
    }

    window.EndingState = {
        PROGRESS_KEY: PROGRESS_KEY,
        ENDING_KEY: ENDING_KEY,
        REQUIRED_CLUES: REQUIRED_CLUES.slice(),
        REQUIRED_ACCOUNTS: REQUIRED_ACCOUNTS.slice(),
        getProgress: getProgress,
        markClue: markClue,
        markAccount: markAccount,
        getEnding: getEnding,
        saveEnding: saveEnding,
        updateEnding: updateEnding,
        resetEnding: resetEnding,
        hasEndingAccess: hasEndingAccess
    };

    var script = document.currentScript;
    if (script) {
        if (script.dataset.clue) markClue(script.dataset.clue);
        if (script.dataset.account) markAccount(script.dataset.account);
    }
})();
