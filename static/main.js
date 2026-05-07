$(function () {
    var TIMER_START_KEY = "orangeChickenLearnTimerStart";

    $("[data-start-learn-timer]").on("click", function () {
        window.localStorage.setItem(TIMER_START_KEY, String(Date.now()));
    });

    $("[data-reset-timers]").on("click", function () {
        window.localStorage.removeItem(TIMER_START_KEY);

        $.post("/timers/reset")
            .done(function () {
                window.location.reload();
            });
    });
});
