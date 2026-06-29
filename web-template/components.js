/* ============================================================
   components.js — progressive-enhancement behavior for the
   interactive parts of the theme template.

   Adds full WAI-ARIA roles/state and keyboard navigation to any
   .tabs and .dropdown markup. Self-initializes on load; call
   ThemeComponents.init(root) again after injecting new markup.

   Patterns implemented:
     • Tabs        — WAI-ARIA Tabs (automatic activation)
     • Dropdown    — WAI-ARIA Menu Button

   Keyboard
     Tabs:      ←/→ (or ↑/↓) move + activate · Home/End first/last
     Dropdown:  on button  Enter/Space/↓ open (focus first), ↑ open (focus last)
                in menu     ↑/↓ move · Home/End first/last · Esc close
                            (returns focus to button) · Tab closes
   ============================================================ */
(function () {
    "use strict";

    var toArray = function (list) { return Array.prototype.slice.call(list); };

    /* ── Tabs ─────────────────────────────────────────────── */
    function initTabs(tablist) {
        if (tablist.dataset.tabsReady) return;
        var tabs = toArray(tablist.querySelectorAll(".tab"));
        if (!tabs.length) return;
        tablist.dataset.tabsReady = "1";
        tablist.setAttribute("role", "tablist");

        var panelOf = function (tab) {
            return document.getElementById(tab.getAttribute("data-tab"));
        };

        tabs.forEach(function (tab) {
            var panel = panelOf(tab);
            if (!tab.id) tab.id = (panel ? panel.id : "tab") + "-tab";
            tab.setAttribute("role", "tab");
            if (panel) {
                tab.setAttribute("aria-controls", panel.id);
                panel.setAttribute("role", "tabpanel");
                panel.setAttribute("aria-labelledby", tab.id);
                panel.setAttribute("tabindex", "0");
            }
            var on = tab.classList.contains("active");
            tab.setAttribute("aria-selected", on ? "true" : "false");
            tab.setAttribute("tabindex", on ? "0" : "-1");
            if (panel) panel.hidden = !on;
        });

        function select(tab, focus) {
            tabs.forEach(function (t) {
                var on = t === tab;
                t.classList.toggle("active", on);
                t.setAttribute("aria-selected", on ? "true" : "false");
                t.setAttribute("tabindex", on ? "0" : "-1");
                var p = panelOf(t);
                if (p) p.hidden = !on;
            });
            if (focus) tab.focus();
        }

        tablist.addEventListener("click", function (e) {
            var tab = e.target.closest(".tab");
            if (tab) select(tab, false);
        });

        tablist.addEventListener("keydown", function (e) {
            var i = tabs.indexOf(document.activeElement);
            if (i < 0) return;
            var n = tabs.length, next;
            switch (e.key) {
                case "ArrowRight":
                case "ArrowDown": next = (i + 1) % n; break;
                case "ArrowLeft":
                case "ArrowUp":   next = (i - 1 + n) % n; break;
                case "Home": next = 0; break;
                case "End":  next = n - 1; break;
                default: return;
            }
            e.preventDefault();
            select(tabs[next], true);
        });
    }

    /* ── Dropdown menu ────────────────────────────────────── */
    function initDropdown(dd) {
        if (dd.dataset.dropdownReady) return;
        var btn = dd.querySelector("[data-dropdown-toggle]");
        var menu = dd.querySelector(".dropdown-menu");
        if (!btn || !menu) return;
        var items = toArray(menu.querySelectorAll(".dropdown-item"));
        dd.dataset.dropdownReady = "1";

        if (!menu.id) menu.id = (btn.id || "dropdown-" + (initDropdown._n = (initDropdown._n || 0) + 1)) + "-menu";
        if (!btn.id) btn.id = menu.id + "-btn";
        btn.setAttribute("aria-haspopup", "true");
        btn.setAttribute("aria-expanded", "false");
        btn.setAttribute("aria-controls", menu.id);
        menu.setAttribute("role", "menu");
        menu.setAttribute("aria-labelledby", btn.id);
        items.forEach(function (it) {
            it.setAttribute("role", "menuitem");
            it.setAttribute("tabindex", "-1");
        });

        var isOpen = function () { return dd.classList.contains("open"); };

        function open(focusIndex) {
            closeAllDropdowns();
            dd.classList.add("open");
            btn.setAttribute("aria-expanded", "true");
            if (focusIndex != null && items[focusIndex]) items[focusIndex].focus();
        }
        function close(focusBtn) {
            dd.classList.remove("open");
            btn.setAttribute("aria-expanded", "false");
            if (focusBtn) btn.focus();
        }
        dd._close = function (focusBtn) { if (isOpen()) close(!!focusBtn); };

        btn.addEventListener("click", function (e) {
            e.stopPropagation();
            isOpen() ? close(false) : open(null);
        });
        btn.addEventListener("keydown", function (e) {
            if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                open(0);
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                open(items.length - 1);
            }
        });

        // Clicks inside the menu shouldn't bubble to the document close handler;
        // item activation closes explicitly below.
        menu.addEventListener("click", function (e) { e.stopPropagation(); });
        items.forEach(function (it) {
            it.addEventListener("click", function () { close(true); });
        });

        menu.addEventListener("keydown", function (e) {
            var i = items.indexOf(document.activeElement);
            switch (e.key) {
                case "ArrowDown": e.preventDefault(); items[(i + 1) % items.length].focus(); break;
                case "ArrowUp":   e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); break;
                case "Home": e.preventDefault(); items[0].focus(); break;
                case "End":  e.preventDefault(); items[items.length - 1].focus(); break;
                case "Escape": e.preventDefault(); close(true); break;
                case "Tab": close(false); break;
            }
        });
    }

    function closeAllDropdowns(except, focusBtn) {
        toArray(document.querySelectorAll(".dropdown.open")).forEach(function (o) {
            if (o === except) return;
            if (o._close) o._close(focusBtn); else o.classList.remove("open");
        });
    }

    /* ── Wiring ───────────────────────────────────────────── */
    document.addEventListener("click", function () { closeAllDropdowns(); });
    document.addEventListener("keydown", function (e) {
        // Esc closes an open menu even when focus is still on its trigger button.
        if (e.key === "Escape") closeAllDropdowns(null, true);
    });

    function init(root) {
        root = root || document;
        toArray(root.querySelectorAll(".tabs")).forEach(initTabs);
        toArray(root.querySelectorAll(".dropdown")).forEach(initDropdown);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function () { init(); });
    } else {
        init();
    }

    window.ThemeComponents = { init: init };
})();
