$(function () {
    var TIMER_START_KEY = "orangeChickenLearnTimerStart";

    $("[data-start-learn-timer]").on("click", function () {
        window.localStorage.setItem(TIMER_START_KEY, String(Date.now()));
    });
});
