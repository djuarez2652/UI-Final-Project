/**
 * Controller: reads lesson payload, builds HTML, injects into the view with jQuery.
 * Also wires up per-lesson mini-games (currently: cut-chicken).
 */
(function ($) {
    var STATIC_BASE = "/static/";
    var SPRITES = STATIC_BASE + "imgs/sprites/";

    var CUT_HOLD_MS = 2000;

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
            return (
                '<li class="lesson-task">' +
                '<input type="checkbox" class="lesson-checkbox" disabled' +
                ' id="' + domId + '"' +
                ' data-task-id="' + escapeHtml(task.id) + '"' +
                ' data-auto="' + (task.auto ? "true" : "false") + '">' +
                '<label class="lesson-task-label disabled" for="' + domId + '">' +
                escapeHtml(task.text) +
                "</label>" +
                "</li>"
            );
        }).join("");

        return '<ul class="list-unstyled lesson-task-list mb-0">' + items + "</ul>";
    }

    function buildCuttingStage() {
        return (
            '<div id="cutting-stage" class="cutting-stage">' +
            '<img class="chicken" data-state="precut" alt="chicken" src="' +
            SPRITES + 'chicken-precut.png">' +
            '<div id="cut-progress"><div class="bar"></div></div>' +
            '<img class="knife" alt="knife" src="' + SPRITES + 'knife.png">' +
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

    function initCutChickenGame() {
        var $stage = $("#cutting-stage");
        var $knife = $stage.find(".knife");
        var $chicken = $stage.find(".chicken");
        var $progress = $("#cut-progress");
        var $bar = $progress.find(".bar");

        if (!$stage.length || !$knife.length || !$chicken.length) {
            return;
        }

        var rafId = null;
        var holdStart = 0;
        var overlapping = false;
        var completed = false;

        function stopHolding() {
            overlapping = false;
            holdStart = 0;
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
            $bar.css("width", "0%");
            $progress.removeClass("visible");
            $chicken.removeClass("chopping");
        }

        function tick(now) {
            if (!overlapping || completed) {
                return;
            }
            var elapsed = now - holdStart;
            var pct = Math.min(100, (elapsed / CUT_HOLD_MS) * 100);
            $bar.css("width", pct + "%");

            if (elapsed >= CUT_HOLD_MS) {
                completeCut();
                return;
            }
            rafId = requestAnimationFrame(tick);
        }

        function startHolding() {
            if (overlapping || completed) {
                return;
            }
            overlapping = true;
            holdStart = performance.now();
            $progress.addClass("visible");
            $chicken.addClass("chopping");
            $bar.css("width", "0%");
            rafId = requestAnimationFrame(tick);
        }

        function completeCut() {
            completed = true;
            stopHolding();
            $chicken
                .attr("src", SPRITES + "chicken-cut.png")
                .attr("data-state", "cut");
            try {
                $knife.draggable("disable");
            } catch (e) {}
            $('.lesson-checkbox[data-task-id="cut"]')
                .prop("checked", true)
                .addClass("done");
        }

        function checkOverlap() {
            if (completed) {
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
                if (!overlapping) {
                    startHolding();
                }
            } else if (overlapping) {
                stopHolding();
            }
        }

        $knife.draggable({
            containment: "#cutting-stage",
            start: function () {
                $knife.addClass("dragging");
            },
            drag: function () {
                checkOverlap();
            },
            stop: function () {
                $knife.removeClass("dragging");
                if (!completed) {
                    stopHolding();
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
            "</aside>";

        var gameHtml = "";
        if (lesson.minigame === "cut-chicken") {
            gameHtml =
                '<section class="lesson-game">' +
                buildCuttingStage() +
                "</section>";
        }

        var html =
            '<div class="lesson-layout">' + gameHtml + sideHtml + "</div>";

        $("#lesson-root").html(html);

        if (lesson.minigame === "cut-chicken") {
            initCutChickenGame();
        }
    }

    $(renderLesson);
})(jQuery);
