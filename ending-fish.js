(function () {
    "use strict";
    var mode = document.body.dataset.endingFish;
    if (!mode) return;

    var palettes = {
        A: ["#050505", "#151515", "#2c2c2c", "#4a4a4a", "#727272", "#a3a3a3"],
        C: ["#ff2f2f", "#ff7a18", "#ffd52f", "#49df62", "#23e7df", "#2487ff", "#713cff", "#c936ff", "#ff55b7", "#ffffff"],
        D: ["#ffffff", "#e3f8ff", "#b9ecff", "#71d5ff", "#2eb8ff", "#317eff", "#1649c9"]
    };
    var palette = palettes[mode] || palettes.D;
    var overlay = document.createElement("div");
    overlay.className = "fish-intro";
    overlay.setAttribute("aria-hidden", "true");
    document.body.classList.add("fish-intro-active");
    document.body.prepend(overlay);

    function between(min, max) { return min + Math.random() * (max - min); }
    var swimmers = [];
    for (var i = 0; i < 100; i += 1) {
        var fish = document.createElement("span");
        fish.className = "school-fish";
        var size = Math.round(between(20, 105));
        fish.style.setProperty("--fish-size", size + "px");
        fish.style.setProperty("--fish-color", palette[Math.floor(Math.random() * palette.length)]);
        overlay.appendChild(fish);
        swimmers.push({
            element: fish,
            size: size,
            delay: between(0, 1500),
            duration: between(4700, 7200),
            lane: between(-.16, .22),
            amplitude: between(12, 68),
            waves: between(1.4, 3.4),
            phase: between(0, Math.PI * 2),
            opacity: between(.58, 1),
            tilt: between(-34, -20)
        });
    }

    var startedAt = null;
    function animate(now) {
        if (startedAt === null) startedAt = now;
        var elapsed = now - startedAt;
        var width = window.innerWidth;
        var height = window.innerHeight;
        var active = false;

        swimmers.forEach(function (fish) {
            var local = elapsed - fish.delay;
            if (local < 0) {
                fish.element.style.opacity = "0";
                active = true;
                return;
            }
            var progress = local / fish.duration;
            if (progress >= 1) {
                fish.element.style.opacity = "0";
                return;
            }
            active = true;
            var x = -width * .23 - fish.size + progress * (width * 1.55 + fish.size * 2);
            var baseY = height * (1.13 + fish.lane) - progress * height * 1.43;
            var waveY = Math.sin(progress * Math.PI * 2 * fish.waves + fish.phase) * fish.amplitude;
            var waveX = Math.cos(progress * Math.PI * 2.2 + fish.phase) * fish.amplitude * .18;
            var fade = Math.min(1, progress / .09, (1 - progress) / .13);
            var rotation = fish.tilt + Math.cos(progress * Math.PI * 2 * fish.waves + fish.phase) * 6;
            fish.element.style.opacity = String(Math.max(0, fade) * fish.opacity);
            fish.element.style.transform = "translate3d(" + (x + waveX).toFixed(1) + "px," + (baseY + waveY).toFixed(1) + "px,0) rotate(" + rotation.toFixed(1) + "deg)";
        });

        if (active || elapsed < 8800) {
            window.requestAnimationFrame(animate);
            return;
        }
        overlay.classList.add("leaving");
        window.setTimeout(function () {
            overlay.remove();
            document.body.classList.remove("fish-intro-active");
            window.dispatchEvent(new CustomEvent("fishIntroComplete"));
        }, 950);
    }
    window.requestAnimationFrame(animate);
})();
