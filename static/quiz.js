/**
 * Quiz controller: intro splash, three scored mini-games, scoring report.
 */
(function ($) {
    var STATIC_BASE = "/static/";
    var SPRITES = STATIC_BASE + "imgs/sprites/";

    var TARGET_TEMP = 350;
    var TARGET_FRY_SECONDS = 210;
    var FRY_GOOD_LOW = 180;
    var FRY_GOOD_HIGH = 240;
    var FRY_VIRTUAL_TOTAL = 360;
    var FRY_VIRTUAL_PER_REAL_SEC = 30;
    var SAUCE_TARGETS = { soy: 3, vinegar: 3, sugar: 3, orange: 2, sesame: 1 };

    var scores = { temp: null, fry: null, sauce: null };

    function escapeHtml(text) {
        return $("<div/>").text(text).html();
    }

    function rectsOverlap(a, b) {
        return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
    }

    function clearRoot() {
        $("#quiz-root").empty();
    }

    function exitButton() {
        return '<a href="/" class="quiz-exit" aria-label="Exit quiz">X</a>';
    }

    /* ---------- Intro ---------- */

    function renderIntro() {
        clearRoot();
        var html =
            '<section class="quiz-intro">' +
            exitButton() +
            '<div class="quiz-intro-inner">' +
            '<h1 class="quiz-intro-title">Quiz</h1>' +
            '<div class="quiz-intro-rule"></div>' +
            '<p class="quiz-intro-sub">Ready for some cooking?</p>' +
            '<button type="button" class="quiz-btn quiz-start-btn">Start</button>' +
            '</div>' +
            '</section>';
        $("#quiz-root").html(html);
        $(".quiz-start-btn").on("click", renderQuiz1);
    }

    /* ---------- Quiz 1: Oil Temperature ---------- */

    function renderQuiz1() {
        clearRoot();
        var html =
            '<section class="quiz-stage">' +
            exitButton() +
            '<div class="quiz-step-tag">Quiz 1 / 3 &middot; Oil Temperature</div>' +
            '<div class="quiz-frame">' +
            '<div class="quiz-scene quiz-scene-stove">' +
            '<img class="quiz-pan" alt="wok with oil" src="' + SPRITES + 'bubbling-oil-pan.png">' +
            '</div>' +
            '<div class="quiz-control-panel">' +
            '<div class="quiz-control-label">Set the oil temperature</div>' +
            '<div class="temp-slider-wrap">' +
            '<div class="temp-track">' +
            '<div class="temp-blocks">' +
            '<span class="temp-block"></span>' +
            '<span class="temp-block"></span>' +
            '<span class="temp-block"></span>' +
            '<span class="temp-block"></span>' +
            '</div>' +
            '<div class="temp-pin" tabindex="0"><div class="temp-pin-readout">300&deg;F</div></div>' +
            '</div>' +
            '<div class="temp-ticks">' +
            '<span>200</span><span>250</span><span>300</span><span>350</span><span>400</span>' +
            '</div>' +
            '</div>' +
            '<button type="button" class="quiz-btn quiz-confirm-btn">Confirm</button>' +
            '</div>' +
            '</div>' +
            '</section>';
        $("#quiz-root").html(html);
        initTempSlider();
    }

    function initTempSlider() {
        var $track = $(".temp-track");
        var $pin = $(".temp-pin");
        var $readout = $pin.find(".temp-pin-readout");

        var currentTemp = 300;

        function setTempByPercent(pct) {
            pct = Math.max(0, Math.min(100, pct));
            currentTemp = Math.round(200 + (pct / 100) * 200);
            $pin.css("left", pct + "%");
            $readout.text(currentTemp + "\u00B0F");
        }

        function pageXFromEvent(e) {
            if (e.pageX != null) return e.pageX;
            var oe = e.originalEvent || e;
            if (oe.touches && oe.touches.length) return oe.touches[0].pageX;
            if (oe.changedTouches && oe.changedTouches.length) return oe.changedTouches[0].pageX;
            return null;
        }

        function setTempFromPageX(pageX) {
            var offset = $track.offset();
            if (!offset) return;
            var pct = ((pageX - offset.left) / $track.width()) * 100;
            setTempByPercent(pct);
        }

        setTempByPercent(((currentTemp - 200) / 200) * 100);

        var dragging = false;

        $pin.on("mousedown touchstart", function (e) {
            dragging = true;
            var px = pageXFromEvent(e);
            if (px != null) setTempFromPageX(px);
            e.preventDefault();
        });

        $track.on("mousedown touchstart", function (e) {
            if ($(e.target).closest(".temp-pin").length) return;
            dragging = true;
            var px = pageXFromEvent(e);
            if (px != null) setTempFromPageX(px);
            e.preventDefault();
        });

        $(document).on("mousemove.tempslider touchmove.tempslider", function (e) {
            if (!dragging) return;
            var px = pageXFromEvent(e);
            if (px != null) setTempFromPageX(px);
            e.preventDefault();
        });

        $(document).on("mouseup.tempslider touchend.tempslider touchcancel.tempslider", function () {
            dragging = false;
        });

        $(".quiz-confirm-btn").on("click", function () {
            $(document).off(".tempslider");
            scores.temp = computeTempScore(currentTemp);
            renderQuiz2();
        });
    }

    function computeTempScore(temp) {
        var diff = Math.abs(temp - TARGET_TEMP);
        var score = 10 - (diff / 15);
        if (score < 0) score = 0;
        return Math.round(score * 10) / 10;
    }

    /* ---------- Quiz 2: Frying Time ---------- */

    function renderQuiz2() {
        clearRoot();
        var html =
            '<section class="quiz-stage">' +
            exitButton() +
            '<div class="quiz-step-tag">Quiz 2 / 3 &middot; Frying Time</div>' +
            '<div class="quiz-frame">' +
            '<div class="quiz-scene quiz-scene-stove">' +
            '<img class="quiz-pan" alt="wok with oil" src="' + SPRITES + 'bubbling-oil-pan.png">' +
            '<img class="quiz-coated-bowl" alt="coated chicken" src="' + SPRITES + 'cornstarch-chicken-bowl.png">' +
            '<div class="quiz-hold quiz-hold-pan"><div class="quiz-hold-label">In Wok</div><div class="quiz-hold-bar"></div></div>' +
            '<div class="quiz-hold quiz-hold-plate"><div class="quiz-hold-label">To Plate</div><div class="quiz-hold-bar"></div></div>' +
            '<img class="quiz-fried-spoon" alt="fried chicken on spoon" hidden src="' + SPRITES + 'fried-chicken-slotted-spoon.png">' +
            '<img class="quiz-serve-plate" alt="serving plate" src="' + SPRITES + 'plain-plate.png">' +
            '</div>' +
            '<div class="quiz-control-panel quiz-fry-panel">' +
            '<div class="quiz-control-label">Frying timer</div>' +
            '<div class="fry-bar-wrap">' +
            '<div class="fry-bar"><div class="fry-bar-fill"></div></div>' +
            '<div class="fry-ticks"><span>0</span><span>2</span><span>4</span><span>6 min</span></div>' +
            '</div>' +
            '<div class="fry-instruction">Drag the chicken to the wok and hold to drop it in.</div>' +
            '<div class="fry-actions">' +
            '<button type="button" class="quiz-btn out-now-btn" hidden>Out Now !</button>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</section>';
        $("#quiz-root").html(html);
        initFryQuiz();
    }

    function initFryQuiz() {
        var $scene = $(".quiz-scene-stove");
        var $pan = $scene.find(".quiz-pan");
        var $coated = $scene.find(".quiz-coated-bowl");
        var $holdPan = $scene.find(".quiz-hold-pan");
        var $holdPlate = $scene.find(".quiz-hold-plate");
        var $friedSpoon = $scene.find(".quiz-fried-spoon");
        var $plate = $scene.find(".quiz-serve-plate");
        var $fill = $(".fry-bar-fill");
        var $outBtn = $(".out-now-btn");
        var $instr = $(".fry-instruction");

        var HOLD_MS = 2000;
        var virtualSec = 0;
        var inWok = false;
        var maxedOut = false;
        var plated = false;
        var baseSec = 0;
        var startMs = 0;
        var fryRaf = null;
        var holding = false;
        var holdStart = 0;
        var holdRaf = null;
        var holdOnComplete = null;
        var $activeHold = null;

        function updateBar() {
            var pct = Math.min(100, (virtualSec / FRY_VIRTUAL_TOTAL) * 100);
            $fill.css("width", pct + "%");
        }

        function fryTick(now) {
            if (!inWok) return;
            var dtSec = (now - startMs) / 1000;
            virtualSec = baseSec + dtSec * FRY_VIRTUAL_PER_REAL_SEC;
            if (virtualSec >= FRY_VIRTUAL_TOTAL) {
                virtualSec = FRY_VIRTUAL_TOTAL;
                updateBar();
                outOfWok(true);
                return;
            }
            updateBar();
            fryRaf = requestAnimationFrame(fryTick);
        }

        function startFrying() {
            inWok = true;
            baseSec = virtualSec;
            startMs = performance.now();
            $pan.attr("src", SPRITES + "raw-chicken-oil-pan.png").addClass("cooking");
            setTimeout(function () {
                if (inWok) {
                    $pan.attr("src", SPRITES + "cooked-chicken-oil-pan.png");
                }
            }, 1500);
            $friedSpoon.attr("hidden", true);
            $outBtn.removeAttr("hidden");
            $instr.text("Click 'Out Now !' to lift the chicken out.");
            fryRaf = requestAnimationFrame(fryTick);
        }

        function outOfWok(forced) {
            if (!inWok && !forced) return;
            inWok = false;
            if (fryRaf) cancelAnimationFrame(fryRaf);
            $pan.attr("src", SPRITES + "bubbling-oil-pan.png").removeClass("cooking");
            $friedSpoon.removeAttr("hidden").css({ left: "4%", top: "48%" });
            $outBtn.attr("hidden", true);
            if (forced) {
                maxedOut = true;
                $instr.text("Burnt! Max time hit. Drag the spoon onto the plate.");
            } else {
                $instr.text("Drag the spoon onto the plate, or back to the wok.");
            }
            initSpoonDrag();
        }

        function holdTick(now) {
            if (!holding || !$activeHold) return;
            var elapsed = now - holdStart;
            var pct = Math.min(100, (elapsed / HOLD_MS) * 100);
            $activeHold.find(".quiz-hold-bar").css("width", pct + "%");
            if (elapsed >= HOLD_MS) {
                var cb = holdOnComplete;
                stopHold(true);
                if (typeof cb === "function") cb();
                return;
            }
            holdRaf = requestAnimationFrame(holdTick);
        }

        function startHold(target, onComplete) {
            var $next = target === "plate" ? $holdPlate : $holdPan;
            if (holding && $activeHold && $activeHold[0] !== $next[0]) {
                stopHold(false);
            }
            if (holding) return;
            holding = true;
            holdStart = performance.now();
            holdOnComplete = onComplete;
            $activeHold = $next;
            $activeHold.addClass("visible").find(".quiz-hold-bar").css("width", "0%");
            holdRaf = requestAnimationFrame(holdTick);
        }

        function stopHold(complete) {
            if (!holding) return;
            holding = false;
            if (holdRaf) cancelAnimationFrame(holdRaf);
            if ($activeHold) {
                $activeHold.removeClass("visible");
                if (!complete) $activeHold.find(".quiz-hold-bar").css("width", "0%");
            }
            $activeHold = null;
            holdOnComplete = null;
        }

        $coated.draggable({
            containment: ".quiz-scene-stove",
            drag: function () {
                if (inWok || plated) return;
                var c = $coated.get(0).getBoundingClientRect();
                var p = $pan.get(0).getBoundingClientRect();
                if (rectsOverlap(c, p)) {
                    if (!holding) {
                        startHold("pan", function () {
                            try { $coated.draggable("disable"); } catch (e) {}
                            $coated.fadeOut(200, function () { $(this).remove(); });
                            startFrying();
                        });
                    }
                } else if (holding) {
                    stopHold(false);
                }
            },
            stop: function () { stopHold(false); }
        });

        function spoonHeadRect() {
            var r = $friedSpoon.get(0).getBoundingClientRect();
            var headWidth = r.width * 0.38;
            var headHeight = r.height * 0.7;
            return {
                left: r.left,
                right: r.left + headWidth,
                top: r.bottom - headHeight,
                bottom: r.bottom
            };
        }

        function initSpoonDrag() {
            try { $friedSpoon.draggable("destroy"); } catch (e) {}
            $friedSpoon.draggable({
                containment: ".quiz-scene-stove",
                drag: function () {
                    if (plated || inWok) return;
                    var sRect = spoonHeadRect();
                    var panRect = $pan.get(0).getBoundingClientRect();
                    var plRect = $plate.get(0).getBoundingClientRect();
                    var overPan = !maxedOut && rectsOverlap(sRect, panRect);
                    var overPlate = rectsOverlap(sRect, plRect);

                    if (overPlate) {
                        if (!holding || ($activeHold && !$activeHold.hasClass("quiz-hold-plate"))) {
                            startHold("plate", function () {
                                plated = true;
                                try { $friedSpoon.draggable("disable"); } catch (e) {}
                                $friedSpoon.fadeOut(200, function () { $(this).remove(); });
                                $plate.attr("src", SPRITES + "plain-plated-chicken.png");
                                $instr.text("Plated!");
                                scores.fry = computeFryScore(virtualSec);
                                setTimeout(renderQuiz3, 900);
                            });
                        }
                    } else if (overPan) {
                        if (!holding || ($activeHold && !$activeHold.hasClass("quiz-hold-pan"))) {
                            startHold("pan", function () {
                                try { $friedSpoon.draggable("disable"); } catch (e) {}
                                $friedSpoon.attr("hidden", true);
                                startFrying();
                            });
                        }
                    } else if (holding) {
                        stopHold(false);
                    }
                },
                stop: function () { if (!plated && !inWok) stopHold(false); }
            });
        }

        $outBtn.on("click", function () {
            if (!inWok) return;
            outOfWok(false);
        });
    }

    function computeFryScore(virtualSec) {
        if (virtualSec >= FRY_GOOD_LOW && virtualSec <= FRY_GOOD_HIGH) {
            return 10;
        }
        if (virtualSec < FRY_GOOD_LOW) {
            // undercooked
            var deficit = FRY_GOOD_LOW - virtualSec;
            return Math.max(0, Math.round(10 - (deficit / FRY_GOOD_LOW) * 10));
        }
        // overcooked
        var excess = virtualSec - FRY_GOOD_HIGH;
        var maxExcess = FRY_VIRTUAL_TOTAL - FRY_GOOD_HIGH;
        return Math.max(0, Math.round(10 - (excess / maxExcess) * 10));
    }

    /* ---------- Quiz 3: Sauce Ratios ---------- */

    function renderQuiz3() {
        clearRoot();
        var ingredients = [
            { id: "soy", label: "Soy", still: "still-soy-sauce.png" },
            { id: "vinegar", label: "Vinegar", still: "still-rice-vinegar.png" },
            { id: "sugar", label: "Sugar", still: "sugar-bowl.png" },
            { id: "orange", label: "Orange", still: "orange-slices.png" },
            { id: "sesame", label: "Sesame", still: "still-sesame-oil.png" }
        ];

        var ingHtml = $.map(ingredients, function (ing) {
            return (
                '<div class="quiz-ing" data-id="' + ing.id + '" tabindex="0" role="button" aria-label="Add ' + ing.label + '">' +
                '<div class="quiz-ing-art"><img src="' + SPRITES + ing.still + '" alt="' + ing.label + '"></div>' +
                '<div class="quiz-ing-card">' +
                '<div class="quiz-ing-label">' + ing.label + '</div>' +
                '<div class="quiz-ing-count">0</div>' +
                '</div>' +
                '</div>'
            );
        }).join("");

        var html =
            '<section class="quiz-stage">' +
            exitButton() +
            '<div class="quiz-step-tag">Quiz 3 / 3 &middot; Sauce Ratios</div>' +
            '<div class="quiz-frame">' +
            '<div class="quiz-scene quiz-scene-sauce">' +
            '<div class="quiz-ing-row">' + ingHtml + '</div>' +
            '<img class="quiz-mix-bowl" alt="mixing bowl" src="' + SPRITES + 'empty-bowl.png">' +
            '</div>' +
            '<div class="quiz-control-panel quiz-sauce-panel">' +
            '<div class="quiz-control-label">Tap each ingredient to add 1 portion</div>' +
            '<div class="quiz-btn-row">' +
            '<button type="button" class="quiz-btn quiz-btn-secondary quiz-restart-btn">Restart</button>' +
            '<button type="button" class="quiz-btn quiz-confirm-btn">Confirm</button>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</section>';

        $("#quiz-root").html(html);

        var counts = { soy: 0, vinegar: 0, sugar: 0, orange: 0, sesame: 0 };

        function refreshBowl() {
            $(".quiz-mix-bowl").attr(
                "src",
                SPRITES + (sumCounts(counts) > 0 ? "still-sauce-bowl.png" : "empty-bowl.png")
            );
        }

        $(".quiz-ing").on("click keydown", function (e) {
            if (e.type === "keydown" && e.key !== "Enter" && e.key !== " ") return;
            var id = $(this).data("id");
            counts[id] = (counts[id] || 0) + 1;
            $(this).find(".quiz-ing-count").text(counts[id]);
            $(this).addClass("pulse");
            var $el = $(this);
            setTimeout(function () { $el.removeClass("pulse"); }, 200);
            refreshBowl();
        });

        $(".quiz-restart-btn").on("click", function () {
            $.each(counts, function (k) { counts[k] = 0; });
            $(".quiz-ing-count").text("0");
            refreshBowl();
        });

        $(".quiz-confirm-btn").on("click", function () {
            scores.sauce = computeSauceScore(counts);
            renderReport();
        });
    }

    function sumCounts(counts) {
        var t = 0;
        $.each(counts, function (_, v) { t += v; });
        return t;
    }

    function computeSauceScore(counts) {
        var userTotal = sumCounts(counts);
        if (userTotal === 0) return 0;
        var targetTotal = 0;
        $.each(SAUCE_TARGETS, function (_, v) { targetTotal += v; });

        var deviation = 0;
        $.each(SAUCE_TARGETS, function (id, target) {
            var targetRatio = target / targetTotal;
            var userRatio = (counts[id] || 0) / userTotal;
            deviation += Math.abs(userRatio - targetRatio);
        });
        // deviation 0 → 10, deviation 2 (max) → 0
        var score = Math.max(0, 10 - deviation * 5);
        return Math.round(score * 10) / 10;
    }

    /* ---------- Scoring Report ---------- */

    function renderReport() {
        clearRoot();
        $("body").addClass("is-quiz");
        var t = scores.temp != null ? scores.temp : 0;
        var f = scores.fry != null ? scores.fry : 0;
        var s = scores.sauce != null ? scores.sauce : 0;
        var total = Math.round(((t + f + s) / 3) * 10) / 10;

        var stars = Math.round(total / 2);
        var starHtml = "";
        for (var i = 0; i < 5; i++) {
            starHtml += '<span class="report-star ' + (i < stars ? "filled" : "empty") + '">&#9733;</span>';
        }

        var rows = [
            { icon: "&#127869;", label: "Oil Temperature", score: t },
            { icon: "&#9201;", label: "Frying Duration", score: f },
            { icon: "&#127858;", label: "Sauce Ratios", score: s }
        ];
        var rowHtml = $.map(rows, function (r) {
            return (
                '<li class="report-row">' +
                '<span class="report-icon">' + r.icon + '</span>' +
                '<span class="report-label">' + r.label + '</span>' +
                '<span class="report-score">' + r.score + '/10</span>' +
                '</li>'
            );
        }).join("");

        var html =
            '<section class="quiz-stage quiz-report-stage">' +
            exitButton() +
            '<div class="quiz-frame">' +
            '<div class="report-card">' +
            '<div class="report-header">SCORING REPORT</div>' +
            '<ul class="report-list">' + rowHtml + '</ul>' +
            '<div class="report-total">TOTAL SCORE: ' + total + ' / 10</div>' +
            '<div class="report-stars">' + starHtml + '</div>' +
            '<div class="report-rated">RATED BY: "MASTER CHEF BOT"</div>' +
            '<div class="report-actions">' +
            '<button type="button" class="quiz-btn report-retry">Try Again</button>' +
            '<a class="quiz-btn report-home" href="/">Home</a>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</section>';
        $("#quiz-root").html(html);

        $(".report-retry").on("click", function () {
            scores = { temp: null, fry: null, sauce: null };
            renderIntro();
        });
    }

    /* ---------- Boot ---------- */

    $(function () {
        $("body").addClass("is-quiz");
        renderIntro();
    });
})(jQuery);
