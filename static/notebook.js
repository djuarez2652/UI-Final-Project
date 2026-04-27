/**
 * Notebook: localStorage-backed list of saved instructions, with a slide-in panel UI.
 * Public API on window.Notebook: { add, remove, open, close, toggle, render, bookIconHtml }.
 */
(function ($, window) {
    var STORAGE_KEY = "oc_notebook_v1";

    function load() {
        try {
            var raw = window.localStorage.getItem(STORAGE_KEY);
            if (!raw) return [];
            var arr = JSON.parse(raw);
            return Array.isArray(arr) ? arr : [];
        } catch (e) {
            return [];
        }
    }

    function save(notes) {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
        } catch (e) {}
    }

    function escapeHtml(text) {
        return $("<div/>").text(text).html();
    }

    var BOOK_ICON_HTML =
        '<svg class="notebook-icon" viewBox="0 0 16 16" aria-hidden="true">' +
            '<rect x="2" y="2" width="12" height="12" fill="#8b5a2b"/>' +
            '<rect x="3" y="3" width="3" height="10" fill="#5a3a1a"/>' +
            '<rect x="6" y="3" width="7" height="10" fill="#fff8e7"/>' +
            '<rect x="7" y="5" width="5" height="1" fill="#5a3a1a"/>' +
            '<rect x="7" y="7" width="5" height="1" fill="#5a3a1a"/>' +
            '<rect x="7" y="9" width="4" height="1" fill="#5a3a1a"/>' +
            '<rect x="7" y="11" width="3" height="1" fill="#5a3a1a"/>' +
            '<rect x="2" y="2" width="12" height="1" fill="#000"/>' +
            '<rect x="2" y="13" width="12" height="1" fill="#000"/>' +
            '<rect x="2" y="2" width="1" height="12" fill="#000"/>' +
            '<rect x="13" y="2" width="1" height="12" fill="#000"/>' +
        '</svg>';

    function ensureUi() {
        if ($("#notebook-panel").length) return;

        var panelHtml =
            '<div id="notebook-overlay" class="notebook-overlay" hidden></div>' +
            '<aside id="notebook-panel" class="notebook-panel" hidden role="dialog" aria-label="Notebook">' +
                '<div class="notebook-header">' +
                    '<div class="notebook-title">My Notebook</div>' +
                    '<button type="button" class="notebook-close" aria-label="Close notebook">X</button>' +
                '</div>' +
                '<ul class="notebook-list"></ul>' +
                '<p class="notebook-empty" hidden>No notes yet. Click an instruction during a lesson to save it here.</p>' +
            '</aside>';
        $("body").append(panelHtml);

        $(document)
            .off(".notebook")
            .on("click.notebook", ".notebook-close, #notebook-overlay", function () {
                close();
            })
            .on("click.notebook", ".notebook-delete", function (e) {
                e.stopPropagation();
                var id = $(this).attr("data-id");
                remove(id);
            })
            .on("keydown.notebook", function (e) {
                if (e.key === "Escape" && isOpen()) close();
            });
    }

    function render() {
        ensureUi();
        var notes = load();
        var $panel = $("#notebook-panel");
        var $list = $panel.find(".notebook-list");
        var $empty = $panel.find(".notebook-empty");

        if (!notes.length) {
            $list.empty().attr("hidden", true);
            $empty.removeAttr("hidden");
            return;
        }
        $empty.attr("hidden", true);
        $list.removeAttr("hidden");

        var items = $.map(notes, function (n) {
            return (
                '<li class="notebook-item">' +
                    '<span class="notebook-text">' + escapeHtml(n.text) + '</span>' +
                    '<button type="button" class="notebook-delete" data-id="' + escapeHtml(n.id) + '" aria-label="Delete note">x</button>' +
                '</li>'
            );
        }).join("");
        $list.html(items);
    }

    function add(text) {
        text = String(text == null ? "" : text).trim();
        if (!text) return false;
        var notes = load();
        for (var i = 0; i < notes.length; i++) {
            if (notes[i].text === text) {
                return false;
            }
        }
        var id = "n_" + Date.now().toString(36) + "_" + Math.floor(Math.random() * 1e6).toString(36);
        notes.push({ id: id, text: text });
        save(notes);
        render();
        return true;
    }

    function remove(id) {
        var notes = load().filter(function (n) {
            return n.id !== id;
        });
        save(notes);
        render();
    }

    function open() {
        ensureUi();
        render();
        $("#notebook-overlay").removeAttr("hidden");
        $("#notebook-panel").removeAttr("hidden").addClass("is-open");
    }

    function close() {
        $("#notebook-overlay").attr("hidden", true);
        $("#notebook-panel").removeClass("is-open").attr("hidden", true);
    }

    function isOpen() {
        return $("#notebook-panel").hasClass("is-open");
    }

    function toggle() {
        if (isOpen()) close();
        else open();
    }

    $(function () {
        ensureUi();
        render();
    });

    window.Notebook = {
        add: add,
        remove: remove,
        open: open,
        close: close,
        toggle: toggle,
        render: render,
        bookIconHtml: BOOK_ICON_HTML
    };
})(jQuery, window);
