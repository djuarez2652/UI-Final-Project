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
                '<li class="lesson-task" tabindex="0" role="button"' +
                ' aria-label="Save instruction to notebook"' +
                ' data-note-text="' + escapeHtml(task.text) + '">' +
                '<input type="checkbox" class="lesson-checkbox"' +
                disabledAttr +
                ' id="' + domId + '"' +
                ' data-task-id="' + escapeHtml(task.id) + '"' +
                ' data-auto="' + (task.auto ? "true" : "false") + '">' +
                '<label class="' + labelClass + '" for="' + domId + '">' +
                escapeHtml(task.text) +
                "</label>" +
                '<span class="lesson-task-hint" aria-hidden="true">+ note</span>' +
                "</li>"
            );
        }).join("");

        return '<ul class="list-unstyled lesson-task-list mb-0">' + items + "</ul>";
    }

    function buildNotebookTrigger() {
        var icon = (window.Notebook && window.Notebook.bookIconHtml) || "";
        return (
            '<button type="button" class="notebook-trigger" aria-label="Open notebook">' +
                icon +
            "</button>"
        );
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
            '<img class="coated-bowl" alt="coated chicken bowl" hidden' +
            ' src="' + SPRITES + 'cornstarch-chicken-bowl.png">' +
            '<img class="spoon" data-state="empty" alt="slotted spoon" hidden' +
            ' src="' + SPRITES + 'slotted-spoon-empty.png">' +
            '<img class="serve-bowl" data-state="empty" alt="serving bowl" hidden' +
            ' src="' + SPRITES + 'empty-bowl.png">' +
            "</div>"
        );
    }

    function buildSauceMixStage() {
        return (
            '<div id="sauce-mix-stage" class="sauce-mix-stage">' +
            '<img class="mix-bowl" data-state="empty" alt="mixing bowl" src="' +
            SPRITES + 'empty-bowl.png">' +
            '<div id="heat-progress"><div class="bar"></div></div>' +
            '<img class="ingredient ing-soy" data-id="soy"' +
            ' data-still="still-soy-sauce.png" data-pouring="pouring-soy-sauce.png"' +
            ' alt="soy sauce" src="' + SPRITES + 'still-soy-sauce.png">' +
            '<img class="ingredient ing-vinegar" data-id="vinegar"' +
            ' data-still="still-rice-vinegar.png" data-pouring="pouring-rice-vinegar.png"' +
            ' alt="rice vinegar" src="' + SPRITES + 'still-rice-vinegar.png">' +
            '<img class="ingredient ing-sugar" data-id="sugar"' +
            ' data-still="sugar-bowl.png" data-pouring="pouring-sugar-bowl.png"' +
            ' alt="sugar" src="' + SPRITES + 'sugar-bowl.png">' +
            '<img class="ingredient ing-orange" data-id="orange"' +
            ' data-still="orange-slices.png" data-pouring="orange-slices.png"' +
            ' alt="orange slices" src="' + SPRITES + 'orange-slices.png">' +
            '<img class="ingredient ing-sesame" data-id="sesame"' +
            ' data-still="still-sesame-oil.png" data-pouring="pouring-sesame-oil.png"' +
            ' alt="sesame oil" src="' + SPRITES + 'still-sesame-oil.png">' +
            "</div>"
        );
    }

    function buildSaucePourStage() {
        return (
            '<div id="sauce-pour-stage" class="stove-stage sauce-pour-stage">' +
            '<img class="pan" data-state="spiced" alt="wok" src="' +
            SPRITES + 'aromatic-spices-oil-pan.png">' +
            '<div id="heat-progress"><div class="bar"></div></div>' +
            '<img class="sauce-bowl" data-state="still" alt="sauce bowl" src="' +
            SPRITES + 'still-sauce-bowl.png">' +
            '<img class="chicken-bowl" alt="fried chicken bowl" src="' +
            SPRITES + 'little-fried-chicken-bowl.png">' +
            "</div>"
        );
    }

    function buildPlateStoveStage() {
        return (
            '<div id="plate-stove-stage" class="stove-stage plate-stove-stage">' +
            '<img class="pan" data-state="full" alt="wok" src="' +
            SPRITES + 'full-pan.png">' +
            '<div id="heat-progress"><div class="bar"></div></div>' +
            '<img class="target-plate" alt="serving plate" src="' +
            SPRITES + 'plain-plate.png">' +
            "</div>"
        );
    }

    function buildPlateGarnishStage() {
        return (
            '<div id="plate-garnish-stage" class="sauce-mix-stage plate-garnish-stage">' +
            '<img class="dish" data-state="plain" alt="plated chicken" src="' +
            SPRITES + 'plain-plated-chicken.png">' +
            '<div id="heat-progress"><div class="bar"></div></div>' +
            '<img class="garnish-bowl" alt="green onion and sesame seeds" src="' +
            SPRITES + 'green-onion-sesame-seed-bowl.png">' +
            '<button type="button" class="serve-btn" hidden>Serve</button>' +
            "</div>"
        );
    }

    function buildAromaticsStage() {
        return (
            '<div id="aromatics-stage" class="stove-stage aromatics-stage">' +
            '<img class="pan" data-state="cooked" alt="wok" src="' +
            SPRITES + 'cooked-chicken-oil-pan.png">' +
            '<div id="heat-progress"><div class="bar"></div></div>' +
            '<img class="spices-plate" alt="aromatic spices plate" hidden' +
            ' src="' + SPRITES + 'aromatic-spices-plate.png">' +
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
        var holdMs = (opts && opts.holdMs) || HOLD_MS;
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
            var pct = Math.min(100, (elapsed / holdMs) * 100);
            $bar.css("width", pct + "%");
            if (elapsed >= holdMs) {
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
                initDropCoatedPhase();
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

    function initDropCoatedPhase() {
        var $stage = $("#stove-stage");
        var $pan = $stage.find(".pan");
        var $coated = $stage.find(".coated-bowl");

        if (!$coated.length || !$pan.length) {
            return;
        }

        $coated.removeAttr("hidden").hide().fadeIn(250);

        var dropCompleted = false;

        var holdTimer = createHoldTimer({
            progressSelector: "#heat-progress",
            onComplete: function () {
                dropCompleted = true;
                $pan
                    .attr("src", SPRITES + "raw-chicken-oil-pan.png")
                    .attr("data-state", "raw")
                    .removeClass("cooking");
                try {
                    $coated.draggable("disable");
                } catch (e) {}
                $coated.fadeOut(200, function () {
                    $(this).remove();
                });
                $('.lesson-checkbox[data-task-id="fry-drop"]')
                    .prop("checked", true)
                    .addClass("done")
                    .trigger("change");
                initCookPhase();
            }
        });

        function checkOverlap() {
            if (dropCompleted) {
                return;
            }
            var cEl = $coated.get(0);
            var pEl = $pan.get(0);
            if (!cEl || !pEl) {
                return;
            }
            if (rectsOverlap(cEl.getBoundingClientRect(), pEl.getBoundingClientRect())) {
                if (!holdTimer.isActive()) {
                    $pan.addClass("cooking");
                    holdTimer.start();
                }
            } else if (holdTimer.isActive()) {
                $pan.removeClass("cooking");
                holdTimer.stop();
            }
        }

        $coated.draggable({
            containment: "#stove-stage",
            drag: checkOverlap,
            stop: function () {
                if (!dropCompleted) {
                    $pan.removeClass("cooking");
                    holdTimer.stop();
                }
            }
        });
    }

    function initCookPhase() {
        var $stage = $("#stove-stage");
        var $pan = $stage.find(".pan");

        if (!$pan.length) {
            return;
        }

        $pan.addClass("cooking");

        var cookTimer = createHoldTimer({
            progressSelector: "#heat-progress",
            holdMs: 6000,
            onComplete: function () {
                $pan
                    .attr("src", SPRITES + "cooked-chicken-oil-pan.png")
                    .attr("data-state", "cooked")
                    .removeClass("cooking");
                $('.lesson-checkbox[data-task-id="fry-cook"]')
                    .prop("checked", true)
                    .addClass("done")
                    .trigger("change");
                initTransferPhase();
            }
        });

        cookTimer.start();
    }

    function initTransferPhase() {
        var $stage = $("#stove-stage");
        var $pan = $stage.find(".pan");
        var $spoon = $stage.find(".spoon");
        var $serveBowl = $stage.find(".serve-bowl");

        if (!$spoon.length || !$serveBowl.length) {
            return;
        }

        $spoon.removeAttr("hidden").hide().fadeIn(250);
        $serveBowl.removeAttr("hidden").hide().fadeIn(250);

        var pickedUp = false;
        var delivered = false;

        var pickupTimer = createHoldTimer({
            progressSelector: "#heat-progress",
            holdMs: 1000,
            onComplete: function () {
                pickedUp = true;
                $spoon
                    .attr("src", SPRITES + "fried-chicken-slotted-spoon.png")
                    .attr("data-state", "loaded");
                $pan
                    .attr("src", SPRITES + "bubbling-oil-pan.png")
                    .attr("data-state", "hot");
            }
        });

        var dropTimer = createHoldTimer({
            progressSelector: "#heat-progress",
            holdMs: 1000,
            onComplete: function () {
                delivered = true;
                $serveBowl
                    .attr("src", SPRITES + "little-fried-chicken-bowl.png")
                    .attr("data-state", "full");
                try {
                    $spoon.draggable("disable");
                } catch (e) {}
                $spoon.fadeOut(200, function () {
                    $(this).remove();
                });
                $('.lesson-checkbox[data-task-id="fry-transfer"]')
                    .prop("checked", true)
                    .addClass("done")
                    .trigger("change");
            }
        });

        function checkOverlap() {
            if (delivered) {
                return;
            }
            var spoonEl = $spoon.get(0);
            if (!spoonEl) {
                return;
            }
            var spoonRect = spoonEl.getBoundingClientRect();

            if (!pickedUp) {
                var panEl = $pan.get(0);
                if (!panEl) {
                    return;
                }
                if (rectsOverlap(spoonRect, panEl.getBoundingClientRect())) {
                    if (!pickupTimer.isActive()) {
                        pickupTimer.start();
                    }
                } else if (pickupTimer.isActive()) {
                    pickupTimer.stop();
                }
                return;
            }

            var bowlEl = $serveBowl.get(0);
            if (!bowlEl) {
                return;
            }
            if (rectsOverlap(spoonRect, bowlEl.getBoundingClientRect())) {
                if (!dropTimer.isActive()) {
                    dropTimer.start();
                }
            } else if (dropTimer.isActive()) {
                dropTimer.stop();
            }
        }

        $spoon.draggable({
            containment: "#stove-stage",
            drag: checkOverlap,
            stop: function () {
                if (!pickedUp) {
                    pickupTimer.stop();
                } else if (!delivered) {
                    dropTimer.stop();
                }
            }
        });
    }

    function initCookAromaticsLesson() {
        var $stage = $("#aromatics-stage");
        if (!$stage.length) {
            return;
        }
        initDrainOilPhase();
    }

    function initDrainOilPhase() {
        var $pan = $("#aromatics-stage").find(".pan");
        if (!$pan.length) {
            return;
        }
        setTimeout(function () {
            $pan
                .attr("src", SPRITES + "less-oil-pan.png")
                .attr("data-state", "drained");
            $('.lesson-checkbox[data-task-id="drain-oil"]')
                .prop("checked", true)
                .addClass("done")
                .trigger("change");
            initAddSpicesPhase();
        }, 400);
    }

    function initAddSpicesPhase() {
        var $stage = $("#aromatics-stage");
        var $pan = $stage.find(".pan");
        var $plate = $stage.find(".spices-plate");

        if (!$pan.length || !$plate.length) {
            return;
        }

        $plate.removeAttr("hidden").hide().fadeIn(250);

        var addCompleted = false;

        var holdTimer = createHoldTimer({
            progressSelector: "#heat-progress",
            onComplete: function () {
                addCompleted = true;
                $pan
                    .attr("src", SPRITES + "aromatic-spices-oil-pan.png")
                    .attr("data-state", "spiced")
                    .removeClass("cooking");
                try {
                    $plate.draggable("disable");
                } catch (e) {}
                $plate.fadeOut(200, function () {
                    $(this).remove();
                });
                $('.lesson-checkbox[data-task-id="add-spices"]')
                    .prop("checked", true)
                    .addClass("done")
                    .trigger("change");
                initStirFryPhase();
            }
        });

        function checkOverlap() {
            if (addCompleted) {
                return;
            }
            var plateEl = $plate.get(0);
            var panEl = $pan.get(0);
            if (!plateEl || !panEl) {
                return;
            }
            if (rectsOverlap(plateEl.getBoundingClientRect(), panEl.getBoundingClientRect())) {
                if (!holdTimer.isActive()) {
                    $pan.addClass("cooking");
                    holdTimer.start();
                }
            } else if (holdTimer.isActive()) {
                $pan.removeClass("cooking");
                holdTimer.stop();
            }
        }

        $plate.draggable({
            containment: "#aromatics-stage",
            drag: checkOverlap,
            stop: function () {
                if (!addCompleted) {
                    $pan.removeClass("cooking");
                    holdTimer.stop();
                }
            }
        });
    }

    function initStirFryPhase() {
        var $stage = $("#aromatics-stage");
        var $pan = $stage.find(".pan");
        var $progress = $("#heat-progress");
        var $bar = $progress.find(".bar");

        if (!$pan.length) {
            return;
        }

        var STIR_TARGET_MS = 6000;
        var MIN_DISTANCE = 5;
        var MAX_DT = 150;
        var IDLE_HIDE_MS = 200;

        var stirMs = 0;
        var lastX = null;
        var lastY = null;
        var lastT = 0;
        var idleTimeoutId = null;
        var stirCompleted = false;

        function updateBar() {
            var pct = Math.min(100, (stirMs / STIR_TARGET_MS) * 100);
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
                $pan.removeClass("stirring");
            }, IDLE_HIDE_MS);
        }

        function completeStir() {
            stirCompleted = true;
            clearIdleTimeout();
            $pan.removeClass("stirring");
            try {
                $pan.draggable("disable");
            } catch (e) {}
            $progress.removeClass("visible");
            $bar.css("width", "0%");
            $('.lesson-checkbox[data-task-id="stir-fry"]')
                .prop("checked", true)
                .addClass("done")
                .trigger("change");
        }

        $pan.draggable({
            containment: "#aromatics-stage",
            start: function (event) {
                if (stirCompleted) {
                    return;
                }
                lastX = event.pageX;
                lastY = event.pageY;
                lastT = performance.now();
                $progress.addClass("visible");
                $pan.addClass("stirring");
                updateBar();
            },
            drag: function (event) {
                if (stirCompleted) {
                    return;
                }
                var now = performance.now();
                var dt = now - lastT;
                var dx = event.pageX - lastX;
                var dy = event.pageY - lastY;
                var dist = Math.sqrt(dx * dx + dy * dy);

                if (dist >= MIN_DISTANCE && dt > 0 && dt <= MAX_DT) {
                    stirMs += dt;
                    $pan.addClass("stirring");
                    scheduleIdle();
                    updateBar();
                    if (stirMs >= STIR_TARGET_MS) {
                        completeStir();
                    }
                }

                lastX = event.pageX;
                lastY = event.pageY;
                lastT = now;
            },
            stop: function () {
                clearIdleTimeout();
                if (!stirCompleted) {
                    $pan.removeClass("stirring");
                }
            }
        });
    }

    function initMakeSauceLesson() {
        var $stage = $("#sauce-mix-stage");
        if (!$stage.length) {
            return;
        }
        initMixSaucePhase();
    }

    function initMixSaucePhase() {
        var $stage = $("#sauce-mix-stage");
        var $bowl = $stage.find(".mix-bowl");
        if (!$bowl.length) {
            return;
        }

        var completed = {};
        var total = $stage.find(".ingredient").length;

        $stage.find(".ingredient").each(function () {
            var $ing = $(this);
            var id = $ing.attr("data-id");
            var stillSrc = SPRITES + $ing.attr("data-still");
            var pouringSrc = SPRITES + $ing.attr("data-pouring");
            var doneThis = false;
            var overlapping = false;

            var holdTimer = createHoldTimer({
                progressSelector: "#heat-progress",
                onComplete: function () {
                    doneThis = true;
                    $ing.attr("src", stillSrc);
                    try {
                        $ing.draggable("disable");
                    } catch (e) {}
                    $ing.fadeOut(200, function () {
                        $(this).remove();
                    });
                    completed[id] = true;
                    if (Object.keys(completed).length === total) {
                        finishMixPhase();
                    }
                }
            });

            function checkOverlap() {
                if (doneThis) {
                    return;
                }
                var iEl = $ing.get(0);
                var bEl = $bowl.get(0);
                if (!iEl || !bEl) {
                    return;
                }
                var nowOver = rectsOverlap(
                    iEl.getBoundingClientRect(),
                    bEl.getBoundingClientRect()
                );
                if (nowOver && !overlapping) {
                    overlapping = true;
                    $ing.attr("src", pouringSrc);
                    holdTimer.start();
                } else if (!nowOver && overlapping) {
                    overlapping = false;
                    $ing.attr("src", stillSrc);
                    holdTimer.stop();
                }
            }

            $ing.draggable({
                containment: "#sauce-mix-stage",
                drag: checkOverlap,
                stop: function () {
                    if (!doneThis && overlapping) {
                        overlapping = false;
                        $ing.attr("src", stillSrc);
                        holdTimer.stop();
                    }
                }
            });
        });

        function finishMixPhase() {
            $bowl
                .attr("src", SPRITES + "still-sauce-bowl.png")
                .attr("data-state", "full");
            $('.lesson-checkbox[data-task-id="mix-sauce"]')
                .prop("checked", true)
                .addClass("done")
                .trigger("change");
            setTimeout(function () {
                var $section = $("#sauce-mix-stage").closest(".lesson-game");
                $section.fadeOut(250, function () {
                    $section.html(buildSaucePourStage()).fadeIn(250, function () {
                        initPourSaucePhase();
                    });
                });
            }, 600);
        }
    }

    function initPourSaucePhase() {
        var $stage = $("#sauce-pour-stage");
        var $pan = $stage.find(".pan");
        var $sauce = $stage.find(".sauce-bowl");
        var $chicken = $stage.find(".chicken-bowl");

        if (!$pan.length || !$sauce.length || !$chicken.length) {
            return;
        }

        var sauceDone = false;
        var chickenDone = false;

        function maybeSwapPan() {
            if (sauceDone && chickenDone) {
                $pan
                    .attr("src", SPRITES + "full-pan.png")
                    .attr("data-state", "full")
                    .removeClass("cooking");
                initTossSaucePhase();
            }
        }

        var sauceOverlapping = false;
        var sauceTimer = createHoldTimer({
            progressSelector: "#heat-progress",
            onComplete: function () {
                sauceDone = true;
                $sauce.attr("src", SPRITES + "still-sauce-bowl.png");
                try {
                    $sauce.draggable("disable");
                } catch (e) {}
                $sauce.fadeOut(200, function () {
                    $(this).remove();
                });
                if (!chickenDone) {
                    $pan.removeClass("cooking");
                }
                $('.lesson-checkbox[data-task-id="pour-sauce"]')
                    .prop("checked", true)
                    .addClass("done")
                    .trigger("change");
                maybeSwapPan();
            }
        });

        function checkSauceOverlap() {
            if (sauceDone) {
                return;
            }
            var sEl = $sauce.get(0);
            var pEl = $pan.get(0);
            if (!sEl || !pEl) {
                return;
            }
            var nowOver = rectsOverlap(
                sEl.getBoundingClientRect(),
                pEl.getBoundingClientRect()
            );
            if (nowOver && !sauceOverlapping) {
                sauceOverlapping = true;
                $sauce.attr("src", SPRITES + "pouring-sauce-bowl.png");
                $pan.addClass("cooking");
                sauceTimer.start();
            } else if (!nowOver && sauceOverlapping) {
                sauceOverlapping = false;
                $sauce.attr("src", SPRITES + "still-sauce-bowl.png");
                if (!chickenOverlapping) {
                    $pan.removeClass("cooking");
                }
                sauceTimer.stop();
            }
        }

        $sauce.draggable({
            containment: "#sauce-pour-stage",
            drag: checkSauceOverlap,
            stop: function () {
                if (!sauceDone && sauceOverlapping) {
                    sauceOverlapping = false;
                    $sauce.attr("src", SPRITES + "still-sauce-bowl.png");
                    if (!chickenOverlapping) {
                        $pan.removeClass("cooking");
                    }
                    sauceTimer.stop();
                }
            }
        });

        var chickenOverlapping = false;
        var chickenTimer = createHoldTimer({
            progressSelector: "#heat-progress",
            onComplete: function () {
                chickenDone = true;
                try {
                    $chicken.draggable("disable");
                } catch (e) {}
                $chicken.fadeOut(200, function () {
                    $(this).remove();
                });
                if (!sauceDone) {
                    $pan.removeClass("cooking");
                }
                maybeSwapPan();
            }
        });

        function checkChickenOverlap() {
            if (chickenDone) {
                return;
            }
            var cEl = $chicken.get(0);
            var pEl = $pan.get(0);
            if (!cEl || !pEl) {
                return;
            }
            var nowOver = rectsOverlap(
                cEl.getBoundingClientRect(),
                pEl.getBoundingClientRect()
            );
            if (nowOver && !chickenOverlapping) {
                chickenOverlapping = true;
                $pan.addClass("cooking");
                chickenTimer.start();
            } else if (!nowOver && chickenOverlapping) {
                chickenOverlapping = false;
                if (!sauceOverlapping) {
                    $pan.removeClass("cooking");
                }
                chickenTimer.stop();
            }
        }

        $chicken.draggable({
            containment: "#sauce-pour-stage",
            drag: checkChickenOverlap,
            stop: function () {
                if (!chickenDone && chickenOverlapping) {
                    chickenOverlapping = false;
                    if (!sauceOverlapping) {
                        $pan.removeClass("cooking");
                    }
                    chickenTimer.stop();
                }
            }
        });
    }

    function initTossSaucePhase() {
        var $stage = $("#sauce-pour-stage");
        var $pan = $stage.find(".pan");
        var $progress = $("#heat-progress");
        var $bar = $progress.find(".bar");

        if (!$pan.length) {
            return;
        }

        var STIR_TARGET_MS = 6000;
        var MIN_DISTANCE = 5;
        var MAX_DT = 150;
        var IDLE_HIDE_MS = 200;

        var stirMs = 0;
        var lastX = null;
        var lastY = null;
        var lastT = 0;
        var idleTimeoutId = null;
        var stirCompleted = false;

        function updateBar() {
            var pct = Math.min(100, (stirMs / STIR_TARGET_MS) * 100);
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
                $pan.removeClass("stirring");
            }, IDLE_HIDE_MS);
        }

        function completeStir() {
            stirCompleted = true;
            clearIdleTimeout();
            $pan.removeClass("stirring");
            try {
                $pan.draggable("disable");
            } catch (e) {}
            $progress.removeClass("visible");
            $bar.css("width", "0%");
            $('.lesson-checkbox[data-task-id="toss-sauce"]')
                .prop("checked", true)
                .addClass("done")
                .trigger("change");
        }

        $pan.draggable({
            containment: "#sauce-pour-stage",
            start: function (event) {
                if (stirCompleted) {
                    return;
                }
                lastX = event.pageX;
                lastY = event.pageY;
                lastT = performance.now();
                $progress.addClass("visible");
                $pan.addClass("stirring");
                updateBar();
            },
            drag: function (event) {
                if (stirCompleted) {
                    return;
                }
                var now = performance.now();
                var dt = now - lastT;
                var dx = event.pageX - lastX;
                var dy = event.pageY - lastY;
                var dist = Math.sqrt(dx * dx + dy * dy);

                if (dist >= MIN_DISTANCE && dt > 0 && dt <= MAX_DT) {
                    stirMs += dt;
                    $pan.addClass("stirring");
                    scheduleIdle();
                    updateBar();
                    if (stirMs >= STIR_TARGET_MS) {
                        completeStir();
                    }
                }

                lastX = event.pageX;
                lastY = event.pageY;
                lastT = now;
            },
            stop: function () {
                clearIdleTimeout();
                if (!stirCompleted) {
                    $pan.removeClass("stirring");
                }
            }
        });
    }

    function initPlateGarnishLesson() {
        var $stage = $("#plate-stove-stage");
        if (!$stage.length) {
            return;
        }
        initPlatePhase();
    }

    function initPlatePhase() {
        var $stage = $("#plate-stove-stage");
        var $pan = $stage.find(".pan");
        var $plate = $stage.find(".target-plate");

        if (!$pan.length || !$plate.length) {
            return;
        }

        var plateCompleted = false;

        var holdTimer = createHoldTimer({
            progressSelector: "#heat-progress",
            onComplete: function () {
                plateCompleted = true;
                $pan.removeClass("cooking");
                try {
                    $pan.draggable("disable");
                } catch (e) {}
                $('.lesson-checkbox[data-task-id="plate"]')
                    .prop("checked", true)
                    .addClass("done")
                    .trigger("change");
                setTimeout(function () {
                    var $section = $("#plate-stove-stage").closest(".lesson-game");
                    $section.fadeOut(250, function () {
                        $section.html(buildPlateGarnishStage()).fadeIn(250, function () {
                            initGarnishPhase();
                        });
                    });
                }, 400);
            }
        });

        function checkOverlap() {
            if (plateCompleted) {
                return;
            }
            var panEl = $pan.get(0);
            var plateEl = $plate.get(0);
            if (!panEl || !plateEl) {
                return;
            }
            if (rectsOverlap(panEl.getBoundingClientRect(), plateEl.getBoundingClientRect())) {
                if (!holdTimer.isActive()) {
                    $pan.addClass("cooking");
                    holdTimer.start();
                }
            } else if (holdTimer.isActive()) {
                $pan.removeClass("cooking");
                holdTimer.stop();
            }
        }

        $pan.draggable({
            containment: "#plate-stove-stage",
            drag: checkOverlap,
            stop: function () {
                if (!plateCompleted) {
                    $pan.removeClass("cooking");
                    holdTimer.stop();
                }
            }
        });
    }

    function initGarnishPhase() {
        var $stage = $("#plate-garnish-stage");
        var $dish = $stage.find(".dish");
        var $bowl = $stage.find(".garnish-bowl");
        var $serveBtn = $stage.find(".serve-btn");

        if (!$dish.length || !$bowl.length) {
            return;
        }

        var garnishCompleted = false;
        var overlapping = false;

        var holdTimer = createHoldTimer({
            progressSelector: "#heat-progress",
            onComplete: function () {
                garnishCompleted = true;
                overlapping = false;
                $bowl.removeClass("pouring");
                $dish
                    .attr("src", SPRITES + "seasoned-plated-chicken.png")
                    .attr("data-state", "seasoned");
                try {
                    $bowl.draggable("disable");
                } catch (e) {}
                $bowl.fadeOut(200, function () {
                    $(this).remove();
                });
                $('.lesson-checkbox[data-task-id="garnish"]')
                    .prop("checked", true)
                    .addClass("done")
                    .trigger("change");
                $serveBtn.removeAttr("hidden").hide().fadeIn(250);
            }
        });

        function checkOverlap() {
            if (garnishCompleted) {
                return;
            }
            var bEl = $bowl.get(0);
            var dEl = $dish.get(0);
            if (!bEl || !dEl) {
                return;
            }
            var nowOver = rectsOverlap(
                bEl.getBoundingClientRect(),
                dEl.getBoundingClientRect()
            );
            if (nowOver && !overlapping) {
                overlapping = true;
                $bowl.addClass("pouring");
                holdTimer.start();
            } else if (!nowOver && overlapping) {
                overlapping = false;
                $bowl.removeClass("pouring");
                holdTimer.stop();
            }
        }

        $bowl.draggable({
            containment: "#plate-garnish-stage",
            drag: checkOverlap,
            stop: function () {
                if (!garnishCompleted && overlapping) {
                    overlapping = false;
                    $bowl.removeClass("pouring");
                    holdTimer.stop();
                }
            }
        });

        $serveBtn.on("click", function () {
            if ($serveBtn.prop("disabled")) {
                return;
            }
            $serveBtn.prop("disabled", true);
            $('.lesson-checkbox[data-task-id="serve"]')
                .prop("checked", true)
                .addClass("done")
                .trigger("change");
            window.location.href = "/quiz";
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

        var nextHref = Number(lessonId) >= 5
            ? "/quiz"
            : "/learn/" + (Number(lessonId) + 1);
        var nextLabel = Number(lessonId) >= 5 ? "Take the Quiz" : "Continue";

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
            '<a class="btn btn-continue" href="' + nextHref + '">' +
            nextLabel +
            '</a>' +
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
        } else if (lesson.minigame === "cook-aromatics") {
            gameHtml =
                '<section class="lesson-game">' +
                buildAromaticsStage() +
                "</section>";
        } else if (lesson.minigame === "make-sauce") {
            gameHtml =
                '<section class="lesson-game">' +
                buildSauceMixStage() +
                "</section>";
        } else if (lesson.minigame === "plate-garnish") {
            gameHtml =
                '<section class="lesson-game">' +
                buildPlateStoveStage() +
                "</section>";
        }

        var html =
            '<div class="lesson-layout">' + gameHtml + sideHtml + "</div>";

        $("#lesson-root").html(html);

        if (!$(".notebook-trigger").length) {
            $("body").append(buildNotebookTrigger());
        }
        if (window.Notebook) {
            window.Notebook.render();
        }

        $("#lesson-root")
            .off("change.lesson click.notebook")
            .on("change.lesson", ".lesson-checkbox", updateContinueVisibility)
            .on("click.notebook", ".lesson-task-label", function (e) {
                e.preventDefault();
                var $task = $(this).closest(".lesson-task");
                var text = $task.attr("data-note-text") || $task.find(".lesson-task-label").text();
                if (!window.Notebook) return;
                var added = window.Notebook.add(text);
                $task
                    .removeClass("just-saved already-saved")
                    .addClass(added ? "just-saved" : "already-saved");
                setTimeout(function () {
                    $task.removeClass("just-saved already-saved");
                }, 700);
            })
            .on("keydown.notebook", ".lesson-task", function (e) {
                if (e.key !== "Enter" && e.key !== " ") return;
                e.preventDefault();
                $(this).find(".lesson-task-label").trigger("click");
            });

        $(document)
            .off("click.notebooktrigger")
            .on("click.notebooktrigger", ".notebook-trigger", function () {
                if (window.Notebook) window.Notebook.toggle();
            });

        updateContinueVisibility();

        if (lesson.minigame === "cut-chicken") {
            initCutChickenLesson();
        } else if (lesson.minigame === "heat-oil") {
            initHeatOilLesson();
        } else if (lesson.minigame === "cook-aromatics") {
            initCookAromaticsLesson();
        } else if (lesson.minigame === "make-sauce") {
            initMakeSauceLesson();
        } else if (lesson.minigame === "plate-garnish") {
            initPlateGarnishLesson();
        }
    }

    $(renderLesson);
})(jQuery);
