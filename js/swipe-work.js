/* Selected work swipe rail: mouse drag, arrow buttons, keyboard. Touch uses native scroll. */
(function () {
  if (!document.documentElement.classList.contains("is-swipe-work")) return;
  function init() {
    var vp = document.querySelector("#work .rail-viewport");
    if (!vp) return setTimeout(init, 120);
    if (vp.dataset.swipe) return;
    vp.dataset.swipe = "1";
    var cards = function () { return Array.prototype.slice.call(vp.querySelectorAll(".rail-track > .project")); };
    var head = document.getElementById("work-heading");
    vp.setAttribute("role", "region");
    vp.setAttribute("aria-roledescription", "carousel");
    vp.setAttribute("aria-label", head ? head.textContent.trim() : "Selected work");
    vp.tabIndex = 0;
    function index() {
      var left = vp.scrollLeft, list = cards(), best = 0, d = Infinity;
      list.forEach(function (c, i) { var x = Math.abs(c.offsetLeft - list[0].offsetLeft - left); if (x < d) { d = x; best = i; } });
      return best;
    }
    function go(card) {
      var list = cards(); if (!card) return;
      vp.scrollTo({ left: card.offsetLeft - list[0].offsetLeft, behavior: "smooth" });
    }
    window.swipeWorkTo = function (card) {
      var sec = document.getElementById("work");
      if (window.deskLenis) window.deskLenis.scrollTo(sec, { offset: 0 }); else sec.scrollIntoView({ behavior: "smooth" });
      go(card);
    };
    function step(n) { var list = cards(); go(list[Math.max(0, Math.min(list.length - 1, index() + n))]); }
    var arrow = function (d) { return '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="' + d + '" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'; };
    var nav = document.createElement("div");
    nav.className = "swipe-nav";
    nav.innerHTML = '<button type="button" aria-label="Previous project">' + arrow("M13 8H3M7 4 3 8l4 4") + '</button><button type="button" aria-label="Next project">' + arrow("M3 8h10M9 4l4 4-4 4") + "</button>";
    vp.insertAdjacentElement("afterend", nav);
    var prev = nav.children[0], next = nav.children[1];
    prev.addEventListener("click", function () { step(-1); });
    next.addEventListener("click", function () { step(1); });
    function sync() { prev.disabled = vp.scrollLeft < 4; next.disabled = vp.scrollLeft > vp.scrollWidth - vp.clientWidth - 4; }
    vp.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    sync();
    vp.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
    });
    var drag = null, moved = false;
    vp.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      drag = { x: e.clientX, left: vp.scrollLeft, id: e.pointerId }; moved = false;
    });
    vp.addEventListener("pointermove", function (e) {
      if (!drag) return;
      var dx = e.clientX - drag.x;
      if (!moved && Math.abs(dx) < 6) return;
      if (!moved) { moved = true; vp.classList.add("is-grabbing"); vp.setPointerCapture(drag.id); }
      vp.scrollLeft = drag.left - dx;
    });
    function end() {
      if (!drag) return;
      var was = moved, start = drag.left; drag = null;
      vp.classList.remove("is-grabbing");
      if (was) { var dir = vp.scrollLeft > start ? 1 : -1, i = index(), list = cards();
        var c = list[i]; var off = c.offsetLeft - list[0].offsetLeft;
        if ((dir > 0 && off < vp.scrollLeft) || (dir < 0 && off > vp.scrollLeft)) c = list[Math.max(0, Math.min(list.length - 1, i + dir))];
        go(c); }
    }
    vp.addEventListener("pointerup", end);
    vp.addEventListener("pointercancel", end);
    vp.addEventListener("click", function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    vp.addEventListener("dragstart", function (e) { e.preventDefault(); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
