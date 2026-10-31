/**
 * Round 2: pinned work rail and path timeline.
 * The work rail stays vertical on phone, tablet, and coarse pointers.
 * The path stays horizontal. Desktop pins with the vertical scroll and eases
 * to a stage only after the wheel stops, always in the direction of travel.
 * Touch, narrow screens, and reduced motion use a native scroll-snap row.
 */
(function () {
  const STACK_QUERY = "(max-width: 900px), (pointer: coarse)";
  const ANIMS = ["sway", "hop", "swipe", "snap"];
  const PLANE = `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M6 34 L58 8 L36 58 L28 36 Z" fill="#FFFDFB" stroke="#2B3236" stroke-width="2.5" stroke-linejoin="round"/><path d="M28 36 L58 8" fill="none" stroke="#A34728" stroke-width="2"/></svg>`;
  const ICONS = [
    `<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="8" y="16" width="48" height="30" rx="4" fill="none" stroke="#0B1F3A" stroke-width="2.4"/><path d="M22 46 h20 M32 46 v8" stroke="#2F6FED" stroke-width="2.4" stroke-linecap="round"/></svg>`,
    `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M10 24 32 14 54 24 32 34 Z" fill="none" stroke="#0B1F3A" stroke-width="2.4"/><path d="M10 24 v16 l22 10 22-10 V24" fill="none" stroke="#0B1F3A" stroke-width="2.4"/><path d="M32 34 v16" stroke="#2F6FED" stroke-width="2.4"/></svg>`,
    `<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="10" y="18" width="44" height="28" rx="4" fill="none" stroke="#0B1F3A" stroke-width="2.4"/><path d="M10 28 h44" stroke="#2F6FED" stroke-width="2.4"/></svg>`,
    `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M18 14 h14 v36 H18 a8 8 0 0 1-8-8 V22 a8 8 0 0 1 8-8z" fill="none" stroke="#0B1F3A" stroke-width="2.4"/><path d="M46 14 H32 v36 h14 a8 8 0 0 0 8-8 V22 a8 8 0 0 0-8-8z" fill="none" stroke="#0B1F3A" stroke-width="2.4"/></svg>`,
    `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M6 28 32 14 58 28 32 42 Z" fill="none" stroke="#0B1F3A" stroke-width="2.4" stroke-linejoin="round"/><path d="M18 34 v8 c0 8 28 8 28 0 v-8" fill="none" stroke="#0B1F3A" stroke-width="2.4"/><path d="M58 28 v16" stroke="#2F6FED" stroke-width="2.4" stroke-linecap="round"/></svg>`,
  ];
  const PATH_STOPS = [
    { year: "2023", rail: "2023", label: "eXp Realty, February 2023 to present" },
    { year: "2020", rail: "2020", label: "Amazon, Aug 2020 – Feb 2023" },
    { year: "2018", rail: "ICICI", label: "ICICI Bank, Oct 2018 – Aug 2020" },
    { year: "2018", rail: "Manipal", label: "Manipal Academy of Higher Education, PG Diploma in Design, 2018" },
    { year: "2017", rail: "2017", label: "Osmania University, M.C.A., 2017" },
    { year: "2014", rail: "2014", label: "Andhra University, B.Sc Computers, 2014" },
  ];

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const motion = document.documentElement.classList.contains("has-motion");

  function clamp01(t) {
    return t < 0 ? 0 : t > 1 ? 1 : t;
  }

  function smootherstep(t) {
    const x = clamp01(t);
    return x * x * x * (x * (x * 6 - 15) + 10);
  }

  function isStack() {
    return reduceMotion || window.matchMedia(STACK_QUERY).matches;
  }

  function pathIsSnap() {
    return isStack();
  }

  function yearFor(card) {
    return card.dataset.stamp || "";
  }

  function smoothPath(points) {
    if (!points.length) return "";
    let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i += 1) {
      const a = points[i];
      const b = points[i + 1];
      const mx = (a.x + b.x) / 2;
      d += ` C ${mx.toFixed(1)} ${a.y.toFixed(1)}, ${mx.toFixed(1)} ${b.y.toFixed(1)}, ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
    }
    return d;
  }

  // Sample the same cubics as smoothPath in JS. getPointAtLength on the live
  // SVG flushes layout, and walking the whole length of it blocked the load.
  function curveFromPoints(points) {
    const samples = [];
    let length = 0;
    const push = (pt) => {
      if (samples.length) {
        const prev = samples[samples.length - 1];
        length += Math.hypot(pt.x - prev.x, pt.y - prev.y);
      }
      samples.push({ d: length, x: pt.x, y: pt.y });
    };
    if (!points.length) return { length: 1, samples: [{ d: 0, x: 0, y: 0 }] };
    push(points[0]);
    for (let i = 0; i < points.length - 1; i += 1) {
      const a = points[i];
      const b = points[i + 1];
      const c1x = (a.x + b.x) / 2;
      const c2x = c1x;
      const c1y = a.y;
      const c2y = b.y;
      for (let step = 1; step <= 8; step += 1) {
        const t = step / 8;
        const u = 1 - t;
        push({
          x: u * u * u * a.x + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * b.x,
          y: u * u * u * a.y + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * b.y,
        });
      }
    }
    return { length: Math.max(1, length), samples };
  }

  function pointOnCurve(curve, distance) {
    const samples = curve.samples;
    const dist = Math.max(0, Math.min(curve.length, distance));
    let lo = 0;
    let hi = samples.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (samples[mid].d < dist) lo = mid + 1;
      else hi = mid;
    }
    const next = samples[lo];
    const prev = samples[Math.max(0, lo - 1)];
    const span = next.d - prev.d || 1;
    const t = lo === 0 ? 0 : (dist - prev.d) / span;
    return {
      x: prev.x + (next.x - prev.x) * t,
      y: prev.y + (next.y - prev.y) * t,
    };
  }

  function routeSvg() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("preserveAspectRatio", "none");
    const ghost = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const hot = document.createElementNS("http://www.w3.org/2000/svg", "path");
    ghost.setAttribute("class", "route-ghost");
    hot.setAttribute("class", "route-hot");
    svg.append(ghost, hot);
    return { svg, ghost, hot };
  }

  function planeEl(className) {
    const el = document.createElement("div");
    el.className = className;
    el.setAttribute("aria-hidden", "true");
    el.innerHTML = PLANE;
    return el;
  }

  let cards = [];
  let rail = null;
  let pathUI = null;
  let pathBoard = null;
  let railTrigger = null;
  let pathTrigger = null;
  let cardObserver = null;

  function mountRound2() {
    mountRail();
    mountPath();
    mountPathBoard();
  }

  function setPathActive(index, progress) {
    if (!pathBoard) return;
    pathBoard.buttons.forEach((button, buttonIndex) => {
      const on = buttonIndex === index;
      button.classList.toggle("is-passed", buttonIndex <= index);
      button.classList.toggle("is-on", on);
      if (on) button.setAttribute("aria-current", "true");
      else button.removeAttribute("aria-current");
    });
    if (pathBoard.fill) pathBoard.fill.style.width = `${clamp01(progress) * 100}%`;
  }

  function paintWeave(route, points) {
    const d = smoothPath(points);
    route.ghost.setAttribute("d", d);
    route.hot.setAttribute("d", d);
    route.curve = curveFromPoints(points);
    route.length = route.curve.length;
  }

  function layoutPath() {
    if (!pathBoard) return;
    const { track, episodes, stick, route, pin } = pathBoard;
    if (!episodes[0] || episodes[0].offsetWidth < 40) {
      pathBoard.maxShift = 0;
      pathBoard.travel = 1;
      return;
    }
    const step = episodes.length > 1
      ? episodes[1].offsetLeft - episodes[0].offsetLeft
      : episodes[0].offsetWidth;
    const steps = Math.max(1, episodes.length - 1);
    pathBoard.maxShift = Math.max(1, steps * step);
    pathBoard.travel = Math.round(steps * (window.innerHeight || 1));
    const stageShift = (index) => {
      const episode = episodes[index];
      return (stick.clientWidth / 2) - (episode.offsetLeft + episode.offsetWidth / 2);
    };
    pathBoard.shift0 = stageShift(0);
    pathBoard.shift1 = stageShift(episodes.length - 1);
    if (pin) pin.style.setProperty("--path-travel", `${pathBoard.travel}px`);
    if (pathIsSnap()) track.style.transform = "none";
    const width = episodes[0].offsetWidth;
    const height = stick.clientHeight || window.innerHeight;
    const snap = pathIsSnap();
    const boardHeight = snap ? Math.max(1, track.clientHeight) : height;
    const boardWidth = Math.max(track.scrollWidth, pathBoard.maxShift + width);
    const trackBox = track.getBoundingClientRect();
    const laneFor = (episode) => {
      const art = episode.querySelector(".path-art");
      const title = episode.querySelector("h3");
      const artBox = art ? art.getBoundingClientRect() : null;
      if (!artBox || artBox.height < 20) {
        return { high: boardHeight * 0.46, low: boardHeight * 0.58 };
      }
      const artTop = artBox.top - trackBox.top;
      const titleTop = title ? title.getBoundingClientRect().top - trackBox.top : artBox.bottom - trackBox.top + 36;
      // Keep the 36px plane, including a rotated corner, above the role title.
      const maxCenter = titleTop - 30;
      const low = Math.min(artTop + artBox.height * 0.78, maxCenter);
      const high = Math.min(artTop + artBox.height * 0.52, maxCenter - 12);
      const floor = artTop + 18;
      return { high: Math.max(floor, high), low: Math.max(floor, low) };
    };
    route.svg.setAttribute("viewBox", `0 0 ${boardWidth} ${boardHeight}`);
    route.svg.style.width = `${boardWidth}px`;
    route.svg.style.height = `${boardHeight}px`;
    route.rect.setAttribute("height", String(boardHeight));
    const points = [];
    episodes.forEach((episode, index) => {
      const x = episode.offsetLeft;
      const episodeWidth = episode.offsetWidth;
      const lane = snap ? laneFor(episode) : null;
      const yStart = lane ? lane.high : boardHeight * 0.68;
      const yLow = lane ? lane.low : boardHeight * 0.79;
      const yHigh = lane ? lane.high : boardHeight * 0.4;
      const yEnd = lane ? lane.low : boardHeight * 0.74;
      if (index === 0) points.push({ x: Math.max(0, x - 36), y: yStart });
      points.push({ x: x + episodeWidth * 0.15, y: yLow });
      points.push({ x: x + episodeWidth * 0.5, y: yHigh });
      points.push({ x: x + episodeWidth * 0.88, y: yEnd });
    });
    paintWeave(route, points);
    const curve = route.curve;
    pathBoard.stationFrac = episodes.map((episode) => {
      const target = episode.offsetLeft + episode.offsetWidth * 0.5;
      let best = 0;
      let bestDist = Infinity;
      curve.samples.forEach((sample) => {
        const dist = Math.abs(sample.x - target);
        if (dist < bestDist) {
          bestDist = dist;
          best = sample.d / curve.length;
        }
      });
      return best;
    });
  }

  function applyPathBoard(progress) {
    if (!pathBoard) return;
    const p = clamp01(progress);
    const count = pathBoard.episodes.length;
    if (!pathIsSnap()) {
      const shift = pathBoard.shift0 + p * (pathBoard.shift1 - pathBoard.shift0);
      pathBoard.track.style.transform = `translate3d(${shift.toFixed(2)}px, 0, 0)`;
    }
    const index = Math.round(p * Math.max(1, count - 1));
    setPathActive(Math.max(0, Math.min(count - 1, index)), p);
    const fractions = pathBoard.stationFrac || [];
    const route = pathBoard.route;
    const length = route.length || 0;
    if (!length || fractions.length < 2) return;
    const t = fractions[0] + (fractions[fractions.length - 1] - fractions[0]) * p;
    const dist = length * t;
    const point = pointOnCurve(route.curve, dist);
    const ahead = pointOnCurve(route.curve, Math.min(length, dist + 18));
    route.rect.setAttribute("width", String(Math.max(0, point.x + 10)));
    const angle = Math.atan2(ahead.y - point.y, ahead.x - point.x) * (180 / Math.PI);
    if (pathBoard.plane) {
      pathBoard.plane.style.transform = `translate(${(point.x - 18).toFixed(1)}px, ${(point.y - 18).toFixed(1)}px) rotate(${angle.toFixed(1)}deg)`;
    }
  }

  function currentScroll() {
    return window.deskLenis ? window.deskLenis.scroll : window.scrollY;
  }

  function pathEngaged() {
    if (!pathBoard || reduceMotion) return false;
    if (pathTrigger) {
      const y = currentScroll();
      return y >= pathTrigger.start - 2 && y <= pathTrigger.end + 2;
    }
    const rect = pathBoard.pin.getBoundingClientRect();
    return rect.top <= 1 && rect.bottom >= window.innerHeight - 1;
  }

  function applyStickyPath() {
    return;
  }

  function syncSnapPath() {
    if (!pathBoard || !pathIsSnap()) return;
    const scroller = pathBoard.track;
    const max = scroller.scrollWidth - scroller.clientWidth;
    const progress = max > 0 ? scroller.scrollLeft / max : 0;
    const viewMid = scroller.scrollLeft + scroller.clientWidth / 2;
    let nearest = 0;
    let nearestDist = Infinity;
    pathBoard.episodes.forEach((episode, index) => {
      const mid = episode.offsetLeft + episode.offsetWidth / 2;
      const dist = Math.abs(mid - viewMid);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = index;
      }
    });
    applyPathBoard(progress);
    setPathActive(nearest, pathBoard.episodes.length === 1 ? 0 : nearest / (pathBoard.episodes.length - 1));
  }

  function syncStackPath() {
    applyStickyPath();
  }

  function pathIsGrouped() {
    const section = document.getElementById("path");
    return !!(section && section.classList.contains("path-grouped"));
  }

  function scrollToPathIndex(index) {
    if (!pathBoard) return;
    if (pathIsGrouped()) {
      const episode = pathBoard.episodes[index];
      if (!episode) return;
      const count = pathBoard.episodes.length;
      setPathActive(index, count === 1 ? 0 : index / Math.max(1, count - 1));
      scrollTo(episode, { offset: -140, duration: reduceMotion ? 0 : 0.8 });
      return;
    }
    const count = pathBoard.episodes.length;
    const next = Math.max(0, Math.min(count - 1, index));
    const progress = count === 1 ? 0 : next / (count - 1);
    if (pathIsSnap()) {
      const episode = pathBoard.episodes[next];
      if (!episode) return;
      const left = episode.offsetLeft - (pathBoard.track.clientWidth - episode.offsetWidth) / 2;
      pathBoard.track.scrollTo({
        left: Math.max(0, left),
        behavior: reduceMotion ? "auto" : "smooth",
      });
      return;
    }
    if (pathTrigger) {
      pathAim = next;
      const y = pathTrigger.start + (pathTrigger.end - pathTrigger.start) * progress;
      scrollTo(y, { duration: 0.95, easing: smootherstep });
      return;
    }
    const pinTop = pathBoard.pin.getBoundingClientRect().top + window.scrollY;
    scrollTo(pinTop + pathBoard.travel * progress, { duration: 0.7, easing: smootherstep });
  }

  function mountPathBoard() {
    const section = document.getElementById("path");
    const track = section && section.querySelector(".path-track");
    if (!track || track.dataset.ready === "true") return;
    const episodes = [...track.querySelectorAll(".path-ep")];
    const buttons = [...section.querySelectorAll(".path-scrub button")];
    const pin = section.querySelector(".path-pin");
    const stick = section.querySelector(".path-stick");
    const svg = section.querySelector(".path-weave");
    if (!episodes.length || !pin || !stick || !svg) return;
    track.dataset.ready = "true";
    const ns = "http://www.w3.org/2000/svg";
    const ghost = document.createElementNS(ns, "path");
    const hot = document.createElementNS(ns, "path");
    const defs = document.createElementNS(ns, "defs");
    const clip = document.createElementNS(ns, "clipPath");
    const rect = document.createElementNS(ns, "rect");
    ghost.setAttribute("class", "route-ghost");
    hot.setAttribute("class", "route-hot");
    clip.id = "path-weave-clip";
    rect.setAttribute("x", "0");
    rect.setAttribute("y", "0");
    rect.setAttribute("width", "0");
    rect.setAttribute("height", "100");
    clip.appendChild(rect);
    defs.appendChild(clip);
    hot.setAttribute("clip-path", "url(#path-weave-clip)");
    svg.append(defs, ghost, hot);
    pathBoard = {
      pin,
      stick,
      track,
      episodes,
      buttons,
      fill: section.querySelector(".path-scrub-fill"),
      plane: section.querySelector(".path-plane"),
      route: { svg, ghost, hot, rect, length: 0 },
      maxShift: 1,
      travel: 1,
      stationFrac: [],
    };
    episodes.forEach((episode) => {
      const img = episode.querySelector("img");
      if (!img || img.complete) return;
      img.addEventListener("load", () => {
        layoutPath();
        if (pathIsSnap()) syncSnapPath();
      }, { once: true });
    });
    buttons.forEach((button, index) => {
      button.addEventListener("click", () => scrollToPathIndex(index));
    });
    document.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      if (event.altKey || event.metaKey || event.ctrlKey) return;
      const active = document.activeElement;
      if (active && active.closest("input, textarea, select, [contenteditable='true']")) return;
      const inPath = active && section.contains(active);
      const box = section.getBoundingClientRect();
      const snapVisible = pathIsSnap() && box.top < window.innerHeight * 0.85 && box.bottom > 80;
      if (!inPath && !pathEngaged() && !snapVisible) return;
      if (!inPath && active && active !== document.body && (active.tagName === "A" || active.tagName === "BUTTON")) return;
      event.preventDefault();
      const current = buttons.findIndex((button) => button.getAttribute("aria-current") === "true");
      const base = current < 0 ? 0 : current;
      const next = event.key === "ArrowRight"
        ? Math.min(buttons.length - 1, current < 0 ? 0 : base + 1)
        : Math.max(0, base - 1);
      scrollToPathIndex(next);
      if (inPath) buttons[next].focus();
    });
    window.addEventListener("wheel", (event) => {
      if (pathIsSnap()) return;
      if (event.ctrlKey || event.altKey || event.metaKey) return;
      if (!pathEngaged()) return;
      const horizontal = event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY);
      if (!horizontal) return;
      if (!event.shiftKey && Math.abs(event.deltaX) < 0.5) return;
      event.preventDefault();
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      const next = currentScroll() + delta;
      if (window.deskLenis) window.deskLenis.scrollTo(next, { immediate: true });
      else window.scrollTo(0, next);
    }, { passive: false, capture: true });
    let drag = null;
    stick.addEventListener("touchstart", (event) => {
      if (pathIsSnap() || !event.touches[0]) return;
      drag = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
        scroll: currentScroll(),
        lock: "",
      };
    }, { passive: true });
    stick.addEventListener("touchmove", (event) => {
      if (!drag || pathIsSnap() || !event.touches[0]) return;
      const dx = event.touches[0].clientX - drag.x;
      const dy = event.touches[0].clientY - drag.y;
      if (!drag.lock) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        drag.lock = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      }
      if (drag.lock !== "x" || !pathEngaged()) return;
      event.preventDefault();
      const scale = pathBoard.maxShift ? pathBoard.travel / pathBoard.maxShift : 1;
      const next = drag.scroll - dx * scale;
      if (window.deskLenis) window.deskLenis.scrollTo(next, { immediate: true });
      else window.scrollTo(0, next);
    }, { passive: false });
    stick.addEventListener("touchend", () => { drag = null; });
    stick.addEventListener("touchcancel", () => { drag = null; });
    track.addEventListener("scroll", syncSnapPath, { passive: true });
    setPathActive(0, 0);
    window.addEventListener("scroll", syncStackPath, { passive: true });
  }

  function mountRail() {
    const work = document.getElementById("work");
    if (!work || work.querySelector(".rail-stage")) return;
    const head = work.querySelector(".section-head");
    cards = [...work.querySelectorAll(".project")];
    const stage = document.createElement("div");
    stage.className = "rail-stage";
    const sticky = document.createElement("div");
    sticky.className = "rail-sticky";
    const headWrap = document.createElement("div");
    headWrap.className = "wrap";
    if (head) headWrap.appendChild(head);
    const viewport = document.createElement("div");
    viewport.className = "rail-viewport";
    const track = document.createElement("div");
    track.className = "rail-track";
    const route = routeSvg();
    route.svg.classList.add("rail-route");
    const plane = planeEl("rail-plane");

    cards.forEach((card, index) => {
      card.style.setProperty("--i", String(index));
      const featured = card.classList.contains("feature") || card.classList.contains("feature-lead") || card.classList.contains("rail-end");
      if (!featured) {
        card.classList.add("rail-more");
        card.dataset.anim = ANIMS[index % ANIMS.length];
        const thumb = card.querySelector(".thumb");
        if (thumb) {
          [18, 62, 78].forEach((left, dot) => {
            const spark = document.createElement("i");
            spark.className = "twinkle";
            spark.setAttribute("aria-hidden", "true");
            spark.style.left = `${left}%`;
            spark.style.top = `${20 + dot * 18}%`;
            spark.style.animationDelay = `${dot * 0.2}s`;
            thumb.appendChild(spark);
          });
        }
      }
      const year = yearFor(card);
      const thumb = card.querySelector(".thumb");
      const stamp = document.createElement("span");
      stamp.className = "year-stamp";
      stamp.setAttribute("aria-hidden", "true");
      if (year) stamp.textContent = year;
      else stamp.hidden = true;
      if (thumb) thumb.appendChild(stamp);
      const numeral = card.querySelector(".thumb-index");
      if (numeral) numeral.dataset.value = String(index + 1);
      track.appendChild(card);
    });

    track.append(route.svg, plane);
    viewport.appendChild(track);
    sticky.append(headWrap, viewport);
    stage.appendChild(sticky);
    work.replaceChildren(stage);
    rail = { stage, sticky, viewport, track, route, plane, distance: 1 };
  }

  function mountPath() {
    const section = document.getElementById("path");
    if (!section || section.querySelector(".tl-stage")) return;
    const heading = section.querySelector("h2");
    const sub = section.querySelector(".section-sub");
    const list = section.querySelector(".timeline");
    if (!list) return;
    const items = [...list.children];
    items.forEach((item, index) => {
      item.style.position = "relative";
      const year = document.createElement("span");
      year.className = "tl-year";
      year.setAttribute("aria-hidden", "true");
      year.textContent = PATH_STOPS[index].year;
      const when = item.querySelector(".when");
      const body = item.querySelector(":scope > div:not(.marker)");
      const copy = document.createElement("div");
      copy.className = "tl-copy";
      if (when) copy.appendChild(when);
      if (body) copy.appendChild(body);
      item.append(year, copy);
      const art = item.querySelector(".tl-art");
      if (art) {
        art.classList.add("tl-icon");
        item.insertBefore(art, copy);
      } else {
        const icon = document.createElement("div");
        icon.className = "tl-icon";
        icon.setAttribute("aria-hidden", "true");
        icon.innerHTML = ICONS[index] || ICONS[0];
        (body || copy).appendChild(icon);
      }
    });

    const stage = document.createElement("div");
    stage.className = "tl-stage";
    const sticky = document.createElement("div");
    sticky.className = "tl-sticky";
    const headWrap = document.createElement("div");
    headWrap.className = "wrap";
    if (heading) headWrap.appendChild(heading);
    if (sub) headWrap.appendChild(sub);
    const viewport = document.createElement("div");
    viewport.className = "tl-viewport";
    const track = document.createElement("div");
    track.className = "tl-track";
    const route = routeSvg();
    route.svg.classList.add("tl-route");
    const plane = planeEl("tl-plane");
    track.append(route.svg, list, plane);
    viewport.appendChild(track);

    const nav = document.createElement("nav");
    nav.className = "tl-rail";
    nav.setAttribute("aria-label", "Path years");
    const line = document.createElement("div");
    line.className = "tl-rail-line";
    line.setAttribute("aria-hidden", "true");
    const fill = document.createElement("span");
    line.appendChild(fill);
    nav.appendChild(line);
    const buttons = PATH_STOPS.map((stop, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = stop.rail || stop.year;
      button.setAttribute("aria-label", stop.label);
      button.addEventListener("click", () => scrollToStop(index));
      nav.appendChild(button);
      return button;
    });

    sticky.append(headWrap, viewport, nav);
    stage.appendChild(sticky);
    section.replaceChildren(stage);
    pathUI = { stage, sticky, viewport, track, list, items, route, plane, nav, fill, buttons, marks: [] };
  }

  function scrollTo(target, options) {
    if (window.deskLenis) window.deskLenis.scrollTo(target, options);
    else if (typeof target === "number") window.scrollTo(0, target);
    else target.scrollIntoView();
  }

  function holdMap(progress, count) {
    const holdShare = 0.46;
    const hold = holdShare / count;
    const glide = count === 1 ? 0 : (1 - holdShare) / (count - 1);
    let cursor = 0;
    for (let i = 0; i < count; i += 1) {
      const holdEnd = cursor + hold;
      if (progress <= holdEnd || i === count - 1) return i;
      cursor = holdEnd;
      const glideEnd = cursor + glide;
      if (progress <= glideEnd) {
        const t = glide === 0 ? 0 : (progress - cursor) / glide;
        const s = t * t * (3 - 2 * t);
        return i + s;
      }
      cursor = glideEnd;
    }
    return count - 1;
  }

  function stopProgress(index, count) {
    const holdShare = 0.46;
    const hold = holdShare / count;
    const glide = count === 1 ? 0 : (1 - holdShare) / (count - 1);
    return index * (hold + glide) + hold * 0.5;
  }

  function scrollToStop(index) {
    if (!pathUI) return;
    if (document.documentElement.classList.contains("has-rail") && pathTrigger) {
      const progress = stopProgress(index, pathUI.items.length);
      const y = pathTrigger.start + (pathTrigger.end - pathTrigger.start) * progress;
      scrollTo(y, { duration: 1.6, easing: smootherstep });
      return;
    }
    const item = pathUI.items[index];
    if (item) scrollTo(item, { offset: -96, duration: reduceMotion ? 0 : 1.1, easing: smootherstep });
  }

  function runCount(el, target) {
    const token = String(Number(el.dataset.token || "0") + 1);
    el.dataset.token = token;
    const started = performance.now();
    const step = (now) => {
      if (el.dataset.token !== token) return;
      const t = Math.min(1, (now - started) / 680);
      const eased = 1 - (1 - t) ** 3;
      el.textContent = String(Math.round(eased * target)).padStart(2, "0");
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function setLit(card, on) {
    const was = card.classList.contains("is-lit");
    card.classList.toggle("is-lit", on);
    if (on) card.style.setProperty("--lift", "-8px");
    else card.style.removeProperty("--lift");
    if (on && !was) animateMetrics(card);
  }

  function animateMetrics(card) {
    if (!motion) return;
    card.querySelectorAll(".metric-num").forEach((el) => {
      const target = Number(el.dataset.value);
      if (!Number.isFinite(target)) return;
      const prefix = el.dataset.prefix || "";
      const suffix = el.dataset.suffix || "";
      const token = String(Number(el.dataset.token || "0") + 1);
      el.dataset.token = token;
      const started = performance.now();
      const step = (now) => {
        if (el.dataset.token !== token) return;
        const t = Math.min(1, (now - started) / 680);
        const eased = 1 - (1 - t) ** 3;
        el.textContent = `${prefix}${Math.round(eased * target)}${suffix}`;
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  function sizeRoute(route, width, height) {
    const w = Math.max(1, Math.round(width));
    const h = Math.max(1, Math.round(height));
    const svg = route.svg;
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    svg.style.left = "0";
    svg.style.top = "0";
    svg.style.right = "auto";
    svg.style.bottom = "auto";
    svg.style.width = `${w}px`;
    svg.style.height = `${h}px`;
  }

  function paintRoute(route, points) {
    const d = smoothPath(points);
    route.ghost.setAttribute("d", d);
    route.hot.setAttribute("d", d);
    route.curve = curveFromPoints(points);
    route.length = route.curve.length;
    route.hot.style.strokeDasharray = "1.6 7.4";
    route.hot.style.strokeDashoffset = String(route.length);
    return route.length;
  }

  function placePlane(el, x, y, angle) {
    el.style.transform = `translate3d(${x - 18}px, ${y - 18}px, 0) rotate(${angle}deg)`;
  }

  function buildRailPath() {
    if (!rail) return;
    const height = rail.viewport.clientHeight || rail.track.clientHeight || 400;
    const points = cards.map((card, index) => ({
      x: card.offsetLeft + card.offsetWidth * 0.55,
      y: index % 2 === 0 ? height * 0.1 : height * 0.9,
    }));
    if (cards.length) {
      const first = cards[0];
      const last = cards[cards.length - 1];
      points.unshift({
        x: Math.max(8, first.offsetLeft - 36),
        y: height * 0.46,
      });
      points.push({
        x: last.offsetLeft + last.offsetWidth + 28,
        y: height * 0.4,
      });
    }
    sizeRoute(rail.route, rail.track.scrollWidth, height);
    paintRoute(rail.route, points);
    rail.points = points;
    rail.distance = Math.max(1, rail.track.scrollWidth - rail.viewport.clientWidth);
  }

  function applyRail(progress) {
    if (!rail) return;
    const shift = -progress * rail.distance;
    rail.track.style.transform = `translate3d(${shift.toFixed(2)}px, 0, 0)`;
    const length = rail.route.length || 0;
    const hot = rail.route.hot;
    if (length && rail.route.curve) {
      hot.style.strokeDashoffset = String(length * (1 - progress));
      const current = pointOnCurve(rail.route.curve, length * progress);
      const next = pointOnCurve(rail.route.curve, Math.min(length, length * progress + 12));
      const angle = Math.atan2(next.y - current.y, next.x - current.x) * (180 / Math.PI);
      placePlane(rail.plane, current.x, current.y, angle);
      cards.forEach((card) => {
        const gate = card.offsetLeft + card.offsetWidth * 0.42;
        setLit(card, current.x >= gate);
      });
    }
  }

  function buildPathCurve() {
    if (!pathUI) return;
    const items = pathUI.items;
    const points = items.map((item, index) => {
      const year = item.querySelector(".tl-year");
      const copy = item.querySelector(".tl-copy");
      const gapTop = item.offsetTop + (year ? year.offsetTop + year.offsetHeight : 0) + 8;
      const gapBottom = item.offsetTop + (copy ? copy.offsetTop : item.offsetHeight * 0.7) - 16;
      const span = Math.max(12, gapBottom - gapTop);
      const along = index % 2 === 0 ? 0.28 : 0.72;
      return {
        x: item.offsetLeft + item.offsetWidth * 0.42,
        y: Math.min(gapBottom, gapTop + span * along),
      };
    });
    const height = pathUI.viewport.clientHeight || pathUI.track.clientHeight || 420;
    sizeRoute(pathUI.route, pathUI.track.scrollWidth, height);
    paintRoute(pathUI.route, points);
    pathUI.points = points;
    const total = pathUI.route.length || 1;
    const marks = [];
    let cursor = 0;
    points.forEach((point) => {
      let best = cursor;
      let bestDist = Infinity;
      for (let step = cursor; step <= total; step += 6) {
        const sample = pathUI.route.hot.getPointAtLength(step);
        const dist = (sample.x - point.x) ** 2 + (sample.y - point.y) ** 2;
        if (dist < bestDist) {
          bestDist = dist;
          best = step;
        }
      }
      marks.push(best / total);
      cursor = best;
    });
    pathUI.marks = marks;
  }

  function applyPath(progress) {
    if (!pathUI) return;
    const count = pathUI.items.length;
    const pos = holdMap(progress, count);
    const centers = pathUI.items.map((item) => item.offsetLeft + item.offsetWidth / 2);
    const index = Math.max(0, Math.min(count - 1, Math.floor(pos)));
    const frac = pos - index;
    const next = Math.min(count - 1, index + 1);
    const center = centers[index] + (centers[next] - centers[index]) * frac;
    const shift = pathUI.viewport.clientWidth / 2 - center;
    pathUI.track.style.transform = `translate3d(${shift.toFixed(2)}px, 0, 0)`;
    const marks = pathUI.marks;
    const t = marks.length
      ? marks[index] + ((marks[next] ?? marks[index]) - marks[index]) * frac
      : pos / Math.max(1, count - 1);
    const length = pathUI.route.length || 0;
    if (length) {
      pathUI.route.hot.style.strokeDashoffset = String(length * (1 - t));
      const current = pathUI.route.hot.getPointAtLength(length * t);
      const ahead = pathUI.route.hot.getPointAtLength(Math.min(length, length * t + 14));
      const angle = Math.atan2(ahead.y - current.y, ahead.x - current.x) * (180 / Math.PI);
      placePlane(pathUI.plane, current.x, current.y, angle);
    }
    pathUI.items.forEach((item, itemIndex) => {
      const rect = item.getBoundingClientRect();
      const passed = pos > itemIndex + 0.15;
      const icon = item.querySelector(".tl-icon");
      if (icon) {
        const dx = (rect.left + rect.width / 2 - window.innerWidth / 2) / window.innerWidth;
        const scale = 1 - Math.min(0.18, Math.abs(dx) * 0.36);
        icon.style.transform = `translate3d(${(-dx * 56).toFixed(1)}px, 0, 0) rotate(${(dx * 10).toFixed(2)}deg) scale(${scale.toFixed(3)})`;
      }
      const fade = pos > itemIndex + 0.85 ? Math.max(0.38, 1 - (pos - itemIndex - 0.85)) : 1;
      item.style.opacity = String(fade);
      item.classList.toggle("is-passed", passed);
    });
    pathUI.fill.style.width = `${clamp01(pos / Math.max(1, count - 1)) * 100}%`;
    pathUI.buttons.forEach((button, buttonIndex) => {
      const on = Math.round(pos) === buttonIndex;
      button.classList.toggle("is-on", on);
      button.classList.toggle("is-passed", pos >= buttonIndex);
      if (on) button.setAttribute("aria-current", "true");
      else button.removeAttribute("aria-current");
    });
  }

  function applyStackPath() {
    if (!pathUI) return;
    pathUI.track.style.transform = "";
    pathUI.items.forEach((item) => {
      item.style.opacity = "";
    });
    let active = 0;
    pathUI.items.forEach((item, index) => {
      const rect = item.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.62) active = index;
      const icon = item.querySelector(".tl-icon");
      if (!icon || !motion) return;
      const dx = (rect.left + rect.width / 2 - window.innerWidth / 2) / window.innerWidth;
      const dy = (rect.top + rect.height / 2 - window.innerHeight / 2) / window.innerHeight;
      const scale = 1 - Math.min(0.16, Math.abs(dy) * 0.22);
      icon.style.transform = `translate3d(${(-dx * 18).toFixed(1)}px, 0, 0) rotate(${(dy * 8).toFixed(2)}deg) scale(${scale.toFixed(3)})`;
    });
    const count = pathUI.items.length;
    pathUI.fill.style.width = `${clamp01(active / Math.max(1, count - 1)) * 100}%`;
    pathUI.buttons.forEach((button, index) => {
      const on = index === active;
      button.classList.toggle("is-on", on);
      button.classList.toggle("is-passed", index <= active);
      if (on) button.setAttribute("aria-current", "true");
      else button.removeAttribute("aria-current");
    });
  }

  function fitCards() {
    if (!cards.length) return;
    const stack = document.documentElement.classList.contains("is-stack");
    const limit = stack
      ? window.innerHeight - 32
      : (rail && rail.viewport.clientHeight) || window.innerHeight;
    const levels = ["f1", "f2", "f3", "f4"];
    cards.forEach((card) => card.classList.remove("f1", "f2", "f3", "f4"));
    const tooTall = () => cards.some((card) => card.scrollHeight > limit + 2);
    if (!tooTall()) return;
    levels.forEach((level) => {
      if (!tooTall()) return;
      cards.forEach((card) => card.classList.add(level));
    });
  }

  function armStackObserver() {
    if (cardObserver) cardObserver.disconnect();
    cardObserver = null;
    if (!document.documentElement.classList.contains("is-stack")) return;
    if (!("IntersectionObserver" in window)) {
      cards.forEach((card) => setLit(card, true));
      return;
    }
    cardObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => setLit(entry.target, entry.isIntersecting));
      },
      { threshold: 0.42 }
    );
    cards.forEach((card) => cardObserver.observe(card));
  }

  function zeroNumerals() {
    if (!motion) return;
    cards.forEach((card) => {
      const numeral = card.querySelector(".thumb-index");
      if (!numeral) return;
      numeral.dataset.token = String(Number(numeral.dataset.token || "0") + 1);
      numeral.textContent = String(numeral.dataset.value || "").padStart(2, "0");
      card.classList.remove("is-lit");
      card.style.removeProperty("--lift");
    });
  }

  function bindDrag() {
    if (!rail || rail.dragReady) return;
    rail.dragReady = true;
    let active = false;
    let startX = 0;
    let startScroll = 0;
    let suppress = false;
    let fromPointer = false;
    rail.viewport.addEventListener("pointerdown", (event) => {
      fromPointer = true;
      if (!document.documentElement.classList.contains("has-rail")) return;
      if (event.pointerType && event.pointerType !== "mouse") return;
      if (event.button !== 0) return;
      active = true;
      suppress = false;
      startX = event.clientX;
      startScroll = window.deskLenis ? window.deskLenis.scroll : window.scrollY;
    });
    rail.viewport.addEventListener("pointermove", (event) => {
      if (!active) return;
      const delta = event.clientX - startX;
      if (Math.abs(delta) < 8) return;
      if (!suppress) {
        suppress = true;
        rail.viewport.classList.add("is-grabbing");
        rail.viewport.setPointerCapture(event.pointerId);
      }
      const next = startScroll - delta * 1.4;
      scrollTo(next, { immediate: true });
    });
    const end = () => {
      active = false;
      rail.viewport.classList.remove("is-grabbing");
    };
    rail.viewport.addEventListener("pointerup", end);
    rail.viewport.addEventListener("pointercancel", end);
    rail.viewport.addEventListener("click", (event) => {
      if (!suppress) return;
      event.preventDefault();
      event.stopPropagation();
      suppress = false;
    }, true);
    rail.track.addEventListener("focusin", (event) => {
      if (!document.documentElement.classList.contains("has-rail") || !railTrigger) return;
      if (fromPointer) {
        fromPointer = false;
        return;
      }
      const card = event.target.closest(".project");
      if (!card) return;
      const center = card.offsetLeft + card.offsetWidth / 2 - rail.viewport.clientWidth * 0.5;
      const progress = clamp01(center / rail.distance);
      const y = railTrigger.start + (railTrigger.end - railTrigger.start) * progress;
      const place = () => {
        rail.viewport.scrollLeft = 0;
        scrollTo(y, { immediate: true, force: true });
      };
      place();
      requestAnimationFrame(place);
    });
  }

  function onScroll() {
    if (document.documentElement.classList.contains("is-stack")) applyStackPath();
  }

  let pathSettleTimer = 0;
  let pathGestureActive = false;
  let pathGestureDelta = 0;
  let pathGestureOrigin = 0;
  let pathAim = null;

  function pathSteps() {
    return Math.max(1, (pathBoard && pathBoard.episodes.length - 1) || 1);
  }

  function pathIndexAt(y) {
    if (!pathTrigger) return 0;
    const start = pathTrigger.start;
    const end = pathTrigger.end;
    const span = end - start;
    const steps = pathSteps();
    if (!(span > 1)) return 0;
    if (y < start - 2) return -1;
    if (y > end + 2) return steps + 1;
    return Math.round(clamp01((y - start) / span) * steps);
  }

  function pathWheelDelta(event) {
    if (event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
      return Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    }
    return event.deltaY;
  }

  function originForGesture(yNow) {
    const seen = pathIndexAt(yNow);
    const lenis = window.deskLenis;
    if (pathAim == null || !lenis || !lenis.isScrolling) return seen;
    const steps = pathSteps();
    if (pathAim === seen) return pathAim;
    if (pathAim >= 0 && pathAim <= steps && Math.abs(pathAim - seen) <= 1) return pathAim;
    if (pathAim === steps + 1 && seen >= steps) return pathAim;
    if (pathAim < 0 && seen <= 0) return pathAim;
    return seen;
  }

  // The wheel updates Lenis immediately. This runs only after the ticks pause,
  // and it eases toward the stage in the direction of travel. A short gesture
  // that never crosses halfway still advances one stage. A position outside
  // the pin is left alone so the page can enter About or scroll back up.
  function settlePathSnap() {
    pathGestureActive = false;
    if (!pathTrigger || !pathBoard || pathIsSnap()) return;
    const start = pathTrigger.start;
    const end = pathTrigger.end;
    const span = end - start;
    if (!(span > 1)) return;
    const lenis = window.deskLenis;
    const yTarget = lenis ? lenis.targetScroll : currentScroll();
    const dir = pathGestureDelta > 0 ? 1 : pathGestureDelta < 0 ? -1 : 0;
    const origin = pathGestureOrigin;
    const deliberate = Math.abs(pathGestureDelta) >= 40;
    pathGestureDelta = 0;
    const steps = pathSteps();
    const beganInside = origin >= 0 && origin <= steps;

    if (yTarget < start - 2 || yTarget > end + 2) {
      pathAim = yTarget > end ? steps + 1 : -1;
      return;
    }

    let nearest = Math.round(clamp01((yTarget - start) / span) * steps);
    if (deliberate && beganInside) {
      if (dir > 0 && nearest <= origin) nearest = origin + 1;
      else if (dir < 0 && nearest >= origin) nearest = origin - 1;
    }
    if (nearest > steps || nearest < 0) {
      pathAim = nearest > steps ? steps + 1 : -1;
      return;
    }

    pathAim = nearest;
    const target = start + (span * nearest) / steps;
    if (Math.abs(target - yTarget) < 2 && Math.abs(target - currentScroll()) < 2) return;
    scrollTo(target, {
      duration: 0.42,
      easing: smootherstep,
      programmatic: false,
      force: true,
    });
  }

  function notePathWheel(event) {
    if (pathIsSnap() || !pathTrigger || !pathBoard) return;
    if (event.ctrlKey || event.altKey || event.metaKey) return;
    const delta = pathWheelDelta(event);
    if (!delta || Math.abs(delta) < 0.5) return;
    const lenis = window.deskLenis;
    if (!pathGestureActive) {
      const yNow = lenis ? lenis.animatedScroll : currentScroll();
      pathGestureOrigin = originForGesture(yNow);
      pathGestureDelta = 0;
      pathGestureActive = true;
    }
    pathGestureDelta += delta;
    window.clearTimeout(pathSettleTimer);
    pathSettleTimer = window.setTimeout(settlePathSnap, 320);
  }

  let pathSettleBound = false;

  function bindRound2() {
    const root = document.documentElement;
    const stack = isStack();
    root.classList.toggle("is-stack", stack);
    root.classList.toggle("has-rail", !stack);
    root.classList.toggle("is-path-snap", stack);
    if (railTrigger) {
      railTrigger.kill(true);
      railTrigger = null;
    }
    if (pathTrigger) {
      pathTrigger.kill(true);
      pathTrigger = null;
    }
    fitCards();
    zeroNumerals();
    armStackObserver();
    bindDrag();

    if (!stack && window.ScrollTrigger && rail) {
      buildRailPath();
      railTrigger = window.ScrollTrigger.create({
        trigger: rail.stage,
        pin: rail.sticky,
        start: "top top",
        end: () => `+=${Math.max(rail.distance, 1)}`,
        scrub: true,
        invalidateOnRefresh: true,
        anticipatePin: 1,
        onRefresh: () => {
          buildRailPath();
        },
        onUpdate: (self) => applyRail(self.progress),
      });
      applyRail(0);
      if (pathUI) {
        buildPathCurve();
        const travel = Math.round(window.innerHeight * pathUI.items.length * 0.9);
        pathTrigger = window.ScrollTrigger.create({
          trigger: pathUI.stage,
          pin: pathUI.sticky,
          start: "top top",
          end: () => `+=${travel}`,
          scrub: true,
          invalidateOnRefresh: true,
          anticipatePin: 1,
          onRefresh: () => buildPathCurve(),
          onUpdate: (self) => applyPath(self.progress),
        });
        applyPath(0);
      }
    } else {
      if (rail) rail.track.style.transform = "";
      applyStackPath();
    }

    if (!stack && window.ScrollTrigger && pathBoard && !pathIsGrouped()) {
      layoutPath();
      const steps = Math.max(1, pathBoard.episodes.length - 1);
      pathTrigger = window.ScrollTrigger.create({
        trigger: pathBoard.pin,
        pin: pathBoard.stick,
        start: "top top",
        end: () => `+=${Math.max(1, steps * window.innerHeight)}`,
        scrub: 0,
        invalidateOnRefresh: true,
        anticipatePin: 1,
        onRefresh: () => layoutPath(),
        onUpdate: (self) => applyPathBoard(self.progress),
      });
      applyPathBoard(0);
      if (!pathSettleBound) {
        pathSettleBound = true;
        window.addEventListener("wheel", notePathWheel, { passive: true });
      }
    } else if (pathBoard) {
      pathBoard.track.style.transform = "none";
      if (!pathIsGrouped()) {
        layoutPath();
        syncSnapPath();
      }
    }

    window.ScrollTrigger && window.ScrollTrigger.refresh();
  }

  let resizeTick = 0;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTick);
    resizeTick = window.setTimeout(() => {
      if (window.bindRound2) window.bindRound2();
    }, 150);
  });
  window.addEventListener("scroll", onScroll, { passive: true });

  function scrollToCard(id) {
    const card = document.getElementById(id);
    if (!card) return;
    const stack = document.documentElement.classList.contains("is-stack");
    if (!stack && railTrigger && rail && cards.includes(card)) {
      const progress = clamp01((card.offsetLeft - 28) / Math.max(1, rail.distance));
      const y = railTrigger.start + (railTrigger.end - railTrigger.start) * progress;
      scrollTo(y, { duration: reduceMotion ? 0 : 1.15, easing: smootherstep });
      return;
    }
    scrollTo(card, { offset: -88, duration: reduceMotion ? 0 : 0.9 });
  }

  function openPathStop(id) {
    const stop = document.getElementById(id);
    if (!pathBoard || !stop) return;
    const index = pathBoard.episodes.indexOf(stop);
    if (index >= 0) scrollToPathIndex(index);
  }

  window.mountRound2 = mountRound2;
  window.bindRound2 = bindRound2;
  window.scrollToCard = scrollToCard;
  window.openPathStop = openPathStop;
})();
