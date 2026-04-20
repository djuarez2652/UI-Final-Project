/**
 * Controller: reads lesson payload, builds HTML, injects into the view with jQuery.
 * Also wires up per-lesson mini-games (currently: cut-chicken with cut + season phases).
 */
(function ($) {
    var STATIC_BASE = "/static/";
    var SPRITES = STATIC_BASE + "imgs/sprites/";

    var HOLD_MS = 2000;

    function escapeHtml(text) {
        return $("<div/>").text(text).html();
    }

    function normalizeTask(rawTask, index) {
        if (typeof rawTask === "string") {
            return { text: rawTask, auto: false, id: "task-" + (index + 1) };
        }
        return {
            text: rawTask.text || "",
            auto: rawTask.auto === true,
            id: rawTask.id || "task-" + (index + 1)
        };
    }

    function buildTaskList(tasks, lessonId) {
        var items = $.map(tasks, function (task, index) {
            var domId = "lesson-" + lessonId + "-task-" + (index + 1);
            var disabledAttr = task.auto ? " disabled" : "";
            var labelClass = "lesson-task-label" + (task.auto ? " disabled" : "");
            return (
                '<li class="lesson-task">' +
                '<input type="checkbox" class="lesson-checkbox"' +
                disabledAttr +
                ' id="' + domId + '"' +
                ' data-task-id="' + escapeHtml(task.id) + '"' +
                ' data-auto="' + (task.auto ? "true" : "false") + '">' +
                '<label class="' + labelClass + '" for="' + domId + '">' +
                escapeHtml(task.text) +
                "</label>" +
                "</li>"
            );
        }).join("");

        return '<ul class="list-unstyled lesson-task-list mb-0">' + items + "</ul>";
    }

    function updateContinueVisibility() {
        var $wrap = $(".lesson-continue-wrap");
        if (!$wrap.length) {
            return;
        }

        var $boxes = $(".lesson-side .lesson-checkbox");
        if (!$boxes.length) {
            $wrap.addClass("is-hidden");
            return;
        }

        var allChecked = true;
        $boxes.each(function () {
            if (!this.checked) {
                allChecked = false;
                return false;
            }
        });

        $wrap.toggleClass("is-hidden", !allChecked);
    }

    function buildCuttingStage() {
        return (
            '<div id="cutting-stage" class="cutting-stage">' +
            '<img class="chicken" data-state="precut" alt="chicken" src="' +
            SPRITES + 'chicken-precut.png">' +
            '<div id="cut-progress"><div class="bar"></div></div>' +
            '<img class="knife" alt="knife" src="' + SPRITES + 'knife.png">' +
            '<img class="shaker salt" data-shaker="salt" data-state="still" alt="salt shaker" hidden' +
            ' src="' + SPRITES + 'still-salt-shaker.png">' +
            '<img class="shaker pepper" data-shaker="pepper" data-state="still" alt="white pepper shaker" hidden' +
            ' src="' + SPRITES + 'still-white-pepper-shaker.png">' +
            '<img class="bowl" data-state="plain" alt="bowl of chicken" hidden' +
            ' src="' + SPRITES + 'plain-chicken-bowl.png">' +
            '<img class="cornstarch" alt="cornstarch" hidden' +
            ' src="' + SPRITES + 'cornstarch.png">' +
            "</div>"
        );
    }

    function buildStoveStage() {
        return (
            '<div id="stove-stage" class="stove-stage">' +
            '<img class="pan" data-state="empty" alt="wok" src="' +
            SPRITES + 'plain-pan.png">' +
            '<div id="heat-progress"><div class="bar"></div></div>' +
            '<img class="oil-bottle" data-state="still" alt="vegetable oil"' +
            ' src="' + SPRITES + 'still-vegetable-oil.png">' +
            "</div>"
        );
    }

    function rectsOverlap(a, b) {
        return !(
            a.right < b.left ||
            a.left > b.right ||
            a.bottom < b.top ||
            a.top > b.bottom
        );
    }

    /**
     * Generic 2s hold timer with progress-bar feedback. Reused by every phase.
     * Returns { start, stop, isActive } controllers.
     */
    function createHoldTimer(opts) {
        var progressSelector = (opts && opts.progressSelector) || "#cut-progress";
        var $progress = $(progressSelector);
        var $bar = $progress.find(".bar");
        var rafId = null;
        var holdStart = 0;
        var active = false;

        function reset() {
            active = false;
            holdStart = 0;
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
            $bar.css("width", "0%");
            $progress.removeClass("visible");
        }

        function tick(now) {
            if (!active) {
                return;
            }
            var elapsed = now - holdStart;
            var pct = Math.min(100, (elapsed / HOLD_MS) * 100);
            $bar.css("width", pct + "%");
            if (elapsed >= HOLD_MS) {
                var done = opts.onComplete;
                reset();
                if (typeof done === "function") {
                    done();
                }
                return;
            }
            rafId = requestAnimationFrame(tick);
        }

        return {
            start: function () {
                if (active) {
                    return;
                }
                active = true;
                holdStart = performance.now();
                $progress.addClass("visible");
                $bar.css("width", "0%");
                rafId = requestAnimationFrame(tick);
            },
            stop: reset,
            isActive: function () {
                return active;
            }
        };
    }

    function initCutChickenLesson() {
        var $stage = $("#cutting-stage");
        var $knife = $stage.find(".knife");
        var $chicken = $stage.find(".chicken");

        if (!$stage.length || !$knife.length || !$chicken.length) {
            return;
        }

        var cutCompleted = false;

        var holdTimer = createHoldTimer({
            onComplete: function () {
                cutCompleted = true;
                $chicken
                    .attr("src", SPRITES + "chicken-cut.png")
                    .attr("data-state", "cut")
                    .removeClass("chopping");
                try {
                    $knife.draggable("disable");
                } catch (e) {}
                $knife.fadeOut(200, function () {
                    $(this).remove();
                });
                $('.lesson-checkbox[data-task-id="cut"]')
                    .prop("checked", true)
                    .addClass("done")
                    .trigger("change");

                initSeasoningPhase();
            }
        });

        function checkOverlap() {
            if (cutCompleted) {
                return;
            }
            var knifeEl = $knife.get(0);
            var chickenEl = $chicken.get(0);
            if (!knifeEl || !chickenEl) {
                return;
            }
            var knifeRect = knifeEl.getBoundingClientRect();
            var chickenRect = chickenEl.getBoundingClientRect();

            if (rectsOverlap(knifeRect, chickenRect)) {
                if (!holdTimer.isActive()) {
                    $chicken.addClass("chopping");
                    holdTimer.start();
                }
            } else if (holdTimer.isActive()) {
                $chicken.removeClass("chopping");
                holdTimer.stop();
            }
        }

        $knife.draggable({
            containment: "#cutting-stage",
            drag: checkOverlap,
            stop: function () {
                if (!cutCompleted) {
                    $chicken.removeClass("chopping");
                    holdTimer.stop();
                }
            }
        });
    }

    function initSeasoningPhase() {
        var $stage = $("#cutting-stage");
        var $chicken = $stage.find(".chicken");
        var $shakers = $stage.find(".shaker");

        if (!$shakers.length) {
            return;
        }

        $shakers.removeAttr("hidden");

        var done = { salt: false, pepper: false };

        function checkAllSeasoned() {
            if (done.salt && done.pepper) {
                $('.lesson-checkbox[data-task-id="season"]')
                    .prop("checked", true)
                    .addClass("done")
                    .trigger("change");
                $shakers.each(function () {
                    var $s = $(this);
                    $s.fadeOut(200, function () {
                        $(this).remove();
                    });
                });
                initTossPhase();
            }
        }

        $shakers.each(function () {
            var $shaker = $(this);
            var kind = $shaker.data("shaker");
            var stillSrc =
                kind === "salt"
                    ? SPRITES + "still-salt-shaker.png"
                    : SPRITES + "still-white-pepper-shaker.png";
            var shakingSrc =
                kind === "salt"
                    ? SPRITES + "shaking-salt-shaker.png"
                    : SPRITES + "shaking-white-pepper-shaker.png";

            var holdTimer = createHoldTimer({
                onComplete: function () {
                    done[kind] = true;
                    $chicken.removeClass("seasoning");
                    $shaker.attr("src", stillSrc).attr("data-state", "still");
                    try {
                        $shaker.draggable("disable");
                    } catch (e) {}
                    checkAllSeasoned();
                }
            });

            function checkOverlap() {
                if (done[kind]) {
                    return;
                }
                var shakerEl = $shaker.get(0);
                var chickenEl = $chicken.get(0);
                if (!shakerEl || !chickenEl) {
                    return;
                }
                var sRect = shakerEl.getBoundingClientRect();
                var cRect = chickenEl.getBoundingClientRect();

                if (rectsOverlap(sRect, cRect)) {
                    if (!holdTimer.isActive()) {
                        $chicken.addClass("seasoning");
                        holdTimer.start();
                    }
                } else if (holdTimer.isActive()) {
                    $chicken.removeClass("seasoning");
                    holdTimer.stop();
                }
            }

            $shaker.draggable({
                containment: "#cutting-stage",
                start: function () {
                    $shaker
                        .attr("src", shakingSrc)
                        .attr("data-state", "shaking");
                },
                drag: checkOverlap,
                stop: function () {
                    $chicken.removeClass("seasoning");
                    holdTimer.stop();
                    if (!done[kind]) {
                        $shaker
                            .attr("src", stillSrc)
                            .attr("data-state", "still");
                    }
                }
            });
        });
    }

    function initTossPhase() {
        var $stage = $("#cutting-stage");
        var $chicken = $stage.find(".chicken");
        var $bowl = $stage.find(".bowl");
        var $cornstarch = $stage.find(".cornstarch");
        var $progress = $("#cut-progress");
        var $bar = $progress.find(".bar");

        if (!$bowl.length || !$cornstarch.length) {
            return;
        }

        $chicken.fadeOut(250, function () {
            $(this).remove();
        });
        $bowl.removeAttr("hidden").hide().fadeIn(250);
        $cornstarch.removeAttr("hidden").hide().fadeIn(250);

        var pourCompleted = false;
        var tossCompleted = false;

        var pourTimer = createHoldTimer({
            onComplete: function () {
                pourCompleted = true;
                $bowl.removeClass("tossing");
                try {
                    $cornstarch.draggable("disable");
                } catch (e) {}
                $cornstarch.fadeOut(200, function () {
                    $(this).remove();
                });
                startTossStep();
            }
        });

        function pourOverlap() {
            if (pourCompleted) {
                return;
            }
            var cEl = $cornstarch.get(0);
            var bEl = $bowl.get(0);
            if (!cEl || !bEl) {
                return;
            }
            if (rectsOverlap(cEl.getBoundingClientRect(), bEl.getBoundingClientRect())) {
                if (!pourTimer.isActive()) {
                    $bowl.addClass("tossing");
                    pourTimer.start();
                }
            } else if (pourTimer.isActive()) {
                $bowl.removeClass("tossing");
                pourTimer.stop();
            }
        }

        $cornstarch.draggable({
            containment: "#cutting-stage",
            drag: pourOverlap,
            stop: function () {
                if (!pourCompleted) {
                    $bowl.removeClass("tossing");
                    pourTimer.stop();
                }
            }
        });

        function startTossStep() {
            var TOSS_TARGET_MS = 4000;
            var MIN_DISTANCE = 5;
            var MAX_DT = 150;
            var IDLE_HIDE_MS = 200;

            var tossMs = 0;
            var lastX = null;
            var lastY = null;
            var lastT = 0;
            var idleTimeoutId = null;

            function updateBar() {
                var pct = Math.min(100, (tossMs / TOSS_TARGET_MS) * 100);
                $bar.css("width", pct + "%");
            }

            function clearIdleTimeout() {
                if (idleTimeoutId !== null) {
                    clearTimeout(idleTimeoutId);
                    idleTimeoutId = null;
                }
            }

            function scheduleIdle() {
                clearIdleTimeout();
                idleTimeoutId = setTimeout(function () {
                    $bowl.removeClass("tossing");
                }, IDLE_HIDE_MS);
            }

            function completeToss() {
                tossCompleted = true;
                clearIdleTimeout();
                $bowl
                    .removeClass("tossing")
                    .attr("src", SPRITES + "cornstarch-chicken-bowl.png")
                    .attr("data-state", "coated");
                try {
                    $bowl.draggable("disable");
                } catch (e) {}
                $progress.removeClass("visible");
                $bar.css("width", "0%");
                $('.lesson-checkbox[data-task-id="toss"]')
                    .prop("checked", true)
                    .addClass("done")
                    .trigger("change");
            }

            $bowl.draggable({
                containment: "#cutting-stage",
                start: function (event) {
                    if (tossCompleted) {
                        return;
                    }
                    lastX = event.pageX;
                    lastY = event.pageY;
                    lastT = performance.now();
                    $progress.addClass("visible");
                    $bowl.addClass("tossing");
                    updateBar();
                },
                drag: function (event) {
                    if (tossCompleted) {
                        return;
                    }
                    var now = performance.now();
                    var dt = now - lastT;
                    var dx = event.pageX - lastX;
                    var dy = event.pageY - lastY;
                    var dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist >= MIN_DISTANCE && dt > 0 && dt <= MAX_DT) {
                        tossMs += dt;
                        $bowl.addClass("tossing");
                        scheduleIdle();
                        updateBar();
                        if (tossMs >= TOSS_TARGET_MS) {
                            completeToss();
                        }
                    }

                    lastX = event.pageX;
                    lastY = event.pageY;
                    lastT = now;
                },
                stop: function () {
                    clearIdleTimeout();
                    if (!tossCompleted) {
                        $bowl.removeClass("tossing");
                    }
                }
            });
        }
    }

    function initHeatOilLesson() {
        var $stage = $("#stove-stage");
        var $pan = $stage.find(".pan");
        var $oil = $stage.find(".oil-bottle");

        if (!$stage.length || !$pan.length || !$oil.length) {
            return;
        }

        var STILL_OIL_SRC = SPRITES + "still-vegetable-oil.png";
        var POUR_OIL_SRC = SPRITES + "pour-vegetable-oil.png";

        function setOilState(state) {
            if ($oil.attr("data-state") === state) {
                return;
            }
            $oil.attr("data-state", state);
            $oil.attr(
                "src",
                state === "pouring" ? POUR_OIL_SRC : STILL_OIL_SRC
            );
        }

        var heatCompleted = false;

        var holdTimer = createHoldTimer({
            progressSelector: "#heat-progress",
            onComplete: function () {
                heatCompleted = true;
                $pan
                    .attr("src", SPRITES + "bubbling-oil-pan.png")
                    .attr("data-state", "hot")
                    .removeClass("heating");
                try {
                    $oil.draggable("disable");
                } catch (e) {}
                $oil.fadeOut(200, function () {
                    $(this).remove();
                });
                $('.lesson-checkbox[data-task-id="heat-oil"]')
                    .prop("checked", true)
                    .addClass("done")
                    .trigger("change");
            }
        });

        function checkOverlap() {
            if (heatCompleted) {
                return;
            }
            var oilEl = $oil.get(0);
            var panEl = $pan.get(0);
            if (!oilEl || !panEl) {
                return;
            }
            var oilRect = oilEl.getBoundingClientRect();
            var panRect = panEl.getBoundingClientRect();

            if (rectsOverlap(oilRect, panRect)) {
                if (!holdTimer.isActive()) {
                    setOilState("pouring");
                    $pan.addClass("heating");
                    holdTimer.start();
                }
            } else if (holdTimer.isActive()) {
                setOilState("still");
                $pan.removeClass("heating");
                holdTimer.stop();
            }
        }

        $oil.draggable({
            containment: "#stove-stage",
            start: function () {
                setOilState("pouring");
            },
            drag: checkOverlap,
            stop: function () {
                if (!heatCompleted) {
                    setOilState("still");
                    $pan.removeClass("heating");
                    holdTimer.stop();
                }
            }
        });
    }

    function renderLesson() {
        var $payload = $("#lesson-data");
        if (!$payload.length) {
            return;
        }

        var lesson;
        try {
            lesson = JSON.parse($payload.text());
        } catch (e) {
            return;
        }

        var lessonId = $("#lesson-root").data("lesson-id");
        if (lessonId === undefined || lessonId === null) {
            return;
        }

        var rawTasks = lesson.tasks || [];
        var tasks = $.map(rawTasks, normalizeTask);

        var sideHtml =
            '<aside class="lesson-side">' +
            '<h1 class="lesson-step-title">' +
            escapeHtml(lesson.step_heading) +
            "</h1>" +
            '<h2 class="lesson-instructions-heading">' +
            escapeHtml(lesson.instructions_label) +
            "</h2>" +
            buildTaskList(tasks, lessonId) +
            '<div class="lesson-continue-wrap is-hidden">' +
            '<a class="btn btn-continue" href="/learn/' +
            (Number(lessonId) + 1) +
            '">Continue</a>' +
            "</div>" +
            "</aside>";

        var gameHtml = "";
        if (lesson.minigame === "cut-chicken") {
            gameHtml =
                '<section class="lesson-game">' +
                buildCuttingStage() +
                "</section>";
        } else if (lesson.minigame === "heat-oil") {
            gameHtml =
                '<section class="lesson-game">' +
                buildStoveStage() +
                "</section>";
        }

        var html =
            '<div class="lesson-layout">' + gameHtml + sideHtml + "</div>";

        $("#lesson-root").html(html);

        $("#lesson-root")
            .off("change.lesson")
            .on("change.lesson", ".lesson-checkbox", updateContinueVisibility);
        updateContinueVisibility();

        if (lesson.minigame === "cut-chicken") {
            initCutChickenLesson();
        } else if (lesson.minigame === "heat-oil") {
            initHeatOilLesson();
        }
    }

    $(renderLesson);
})(jQuery);
