/**
 * Remaining catalog effects: about portrait, facts, stacking toy,
 * hidden kudos, contact sky, stars, slingshot, and the hire dialog.
 * Skill names come from the CV. Quotes render only from data/kudos.json.
 */
(function () {
  const SKILLS = [
    "Journey Mapping",
    "Service Blueprinting",
    "Design Systems",
    "Accessibility (WCAG)",
    "Usability Testing",
    "User Research",
    "Figma",
    "Cursor",
    "Claude",
    "Lovable",
    "AI Workflow Automation",
    "Agent-Driven Prototyping",
    "HTML/CSS",
    "Stakeholder Management",
  ];
  const root = document.documentElement;
  const motion = root.classList.contains("has-motion");
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function whenNear(element, margin, onChange) {
    if (!element) return;
    if (!("IntersectionObserver" in window)) {
      onChange(true);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      onChange(entries.some((entry) => entry.isIntersecting));
    }, { rootMargin: margin });
    observer.observe(element);
  }

  function initLazyImages() {
    document.querySelectorAll("img").forEach((img) => {
      if (img.closest(".hero-stage") || img.getAttribute("fetchpriority") === "high") return;
      if (!img.hasAttribute("loading")) img.loading = "lazy";
      img.decoding = "async";
    });
    const pending = [...document.querySelectorAll("img[data-src]")];
    if (!pending.length) return;
    const reveal = (img) => {
      if (!img.dataset.src) return;
      img.src = img.dataset.src;
      img.removeAttribute("data-src");
      img.decoding = "async";
    };
    if (!("IntersectionObserver" in window)) {
      pending.forEach(reveal);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        reveal(entry.target);
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "150% 0px" });
    pending.forEach((img) => observer.observe(img));
  }

  function initCaseOpen() {
    document.addEventListener("click", (event) => {
      const node = event.target;
      if (!node || !node.closest) return;
      const link = node.closest("a.case-link");
      if (!link || !motion) return;
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (event.button !== 0) return;
      const card = link.closest(".project");
      if (!card) return;
      card.classList.add("is-opening");
      window.setTimeout(() => card.classList.remove("is-opening"), 480);
    });
  }

  function initCursorIcons() {
    if (!root.classList.contains("has-fine-cursor")) return;
    const cursor = document.getElementById("cursor");
    if (!cursor) return;
    let current = "";
    document.addEventListener("pointermove", (event) => {
      if (event.pointerType && event.pointerType !== "mouse") return;
      const node = event.target;
      if (!node || !node.closest) return;
      const card = node.closest(".rail-track .project[data-cursor-icon]");
      const icon = card ? card.getAttribute("data-cursor-icon") || "" : "";
      if (icon === current) return;
      current = icon;
      if (icon) cursor.setAttribute("data-icon", icon);
      else cursor.removeAttribute("data-icon");
      cursor.classList.remove("is-spin");
      if (icon) {
        void cursor.offsetWidth;
        cursor.classList.add("is-spin");
      }
    });
  }

  function initPortrait() {
    const about = document.getElementById("about");
    const portrait = document.querySelector(".portrait");
    if (!about || !portrait) return;

    let aboutNear = false;
    whenNear(about, "120px", (near) => {
      aboutNear = near;
      about.classList.toggle("is-live", near);
    });

    if (motion && fine) {
      document.addEventListener("pointermove", (event) => {
        if (!aboutNear || (event.pointerType && event.pointerType !== "mouse")) return;
        const mx = event.clientX / window.innerWidth - 0.5;
        const my = event.clientY / window.innerHeight - 0.5;
        portrait.style.setProperty("--mx", mx.toFixed(3));
        portrait.style.setProperty("--my", my.toFixed(3));
      }, { passive: true });
    }
  }

  function initFacts() {
    const cards = [...document.querySelectorAll(".fact-card")];
    if (!cards.length) return;

    function paint(card, value) {
      const node = card.querySelector(".fact-num");
      if (!node) return;
      node.textContent = `${value}${card.dataset.suffix || ""}`;
    }

    function animate(card) {
      const target = Number(card.dataset.count);
      if (!Number.isFinite(target)) return;
      const start = performance.now();
      function tick(now) {
        const t = Math.min(1, (now - start) / 680);
        const eased = 1 - Math.pow(1 - t, 3);
        paint(card, Math.round(target * eased));
        if (t < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }

    cards.forEach((card) => {
      card.addEventListener("click", () => {
        if (motion) animate(card);
      });
      if (motion && fine) {
        card.addEventListener("pointermove", (event) => {
          if (event.pointerType && event.pointerType !== "mouse") return;
          const rect = card.getBoundingClientRect();
          const px = (event.clientX - rect.left) / rect.width - 0.5;
          const py = (event.clientY - rect.top) / rect.height - 0.5;
          card.style.setProperty("--tilt-y", `${(px * 7).toFixed(2)}deg`);
          card.style.setProperty("--tilt-x", `${(-py * 7).toFixed(2)}deg`);
        });
        card.addEventListener("pointerleave", () => {
          card.style.setProperty("--tilt-y", "0deg");
          card.style.setProperty("--tilt-x", "0deg");
        });
      }
    });

    if (!motion || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animate(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.55 });
    cards.forEach((card) => observer.observe(card));
  }

  function initChips() {
    document.querySelectorAll(".chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        const pressed = chip.getAttribute("aria-pressed") === "true";
        chip.setAttribute("aria-pressed", pressed ? "false" : "true");
      });
    });
  }

  function initAlsoMore() {
    const button = document.querySelector(".view-more");
    const panel = document.getElementById("also-more");
    const grid = document.querySelector("#also .desk-grid");
    if (!button || !panel || !grid) return;

    function fitCards() {
      const cards = [...grid.querySelectorAll(".desk-card")];
      cards.forEach((card) => {
        card.style.minHeight = "";
        card.classList.add("is-visible");
        card.style.setProperty("--rise", "0px");
      });
      const visible = cards.filter((card) => card.getBoundingClientRect().height > 0);
      if (visible.length < 2) return;
      const max = Math.max(...visible.map((card) => card.getBoundingClientRect().height));
      visible.forEach((card) => {
        card.style.minHeight = `${Math.ceil(max)}px`;
      });
    }

    button.addEventListener("click", () => {
      const open = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", open ? "false" : "true");
      panel.hidden = open;
      button.textContent = open ? "View more" : "View less";
      requestAnimationFrame(fitCards);
    });

    window.addEventListener("resize", () => {
      if (!panel.hidden) fitCards();
    });
    fitCards();
  }

  function initKudos() {
    const portrait = document.querySelector("#about .portrait");
    const about = document.getElementById("about");
    if (!portrait || !about) return;
    const reduce = !motion;
    const colors = ["#e07a45", "#c46f7c", "#5f8f88", "#8a6f86"];
    let started = false;

    function quotesFrom(data) {
      if (!Array.isArray(data)) return [];
      return data.filter((item) => item && typeof item.quote === "string" && item.quote.trim()).map((item) => ({
        quote: item.quote.trim(),
        by: typeof item.by === "string" ? item.by.trim() : "",
      }));
    }

    function bubbleSvg(color) {
      return `<svg viewBox="0 0 80 64" aria-hidden="true"><path d="M18 16h40a8 8 0 0 1 8 8v16a8 8 0 0 1-8 8H36l-10 10V48H18a8 8 0 0 1-8-8V24a8 8 0 0 1 8-8z" fill="#e8c2a6"/><path d="M18 10h40a8 8 0 0 1 8 8v16a8 8 0 0 1-8 8H36l-10 10V42H18a8 8 0 0 1-8-8V18a8 8 0 0 1 8-8z" fill="#fffaf3" stroke="#2b3236" stroke-width="1.7" stroke-linejoin="round"/><path d="M22 14h32a5 5 0 0 1 4 3H18a5 5 0 0 1 4-3z" fill="#fff" opacity=".78"/><circle cx="32" cy="28" r="3.2" fill="${color}"/><circle cx="44" cy="28" r="3.2" fill="${color}"/><circle cx="56" cy="28" r="3.2" fill="${color}"/></svg>`;
    }

    function render(quotes) {
      if (!quotes.length || portrait.querySelector(".kudo-field")) return;
      const field = document.createElement("div");
      field.className = "kudo-field";
      const canvas = document.createElement("canvas");
      canvas.className = "kudo-trail";
      canvas.setAttribute("aria-hidden", "true");
      const count = document.createElement("p");
      count.className = "kudo-count";
      const label = document.createElement("span");
      label.className = "kudo-count-label";
      label.textContent = "Catch a kudos";
      const pips = document.createElement("span");
      pips.className = "kudo-pips";
      quotes.forEach(() => pips.appendChild(document.createElement("i")));
      count.append(label, pips);
      const note = document.createElement("div");
      note.className = "kudo-note";
      note.setAttribute("role", "dialog");
      note.setAttribute("aria-modal", "true");
      note.setAttribute("aria-label", "Kudos");
      note.hidden = true;
      const closeBtn = document.createElement("button");
      closeBtn.type = "button";
      closeBtn.className = "kudo-close";
      closeBtn.setAttribute("aria-label", "Close");
      closeBtn.textContent = "×";
      const quoteEl = document.createElement("blockquote");
      const foot = document.createElement("footer");
      const mark = document.createElement("span");
      mark.className = "kudo-mark";
      mark.setAttribute("aria-hidden", "true");
      const roleEl = document.createElement("p");
      roleEl.className = "kudo-role";
      const source = document.createElement("a");
      source.className = "kudo-source";
      source.href = "https://www.linkedin.com/in/suvarnamyneni/";
      source.target = "_blank";
      source.rel = "noopener";
      source.textContent = "LinkedIn";
      foot.append(mark, roleEl, source);
      note.append(closeBtn, quoteEl, foot);
      const done = document.createElement("div");
      done.className = "kudo-done";
      done.hidden = true;
      const doneTitle = document.createElement("p");
      doneTitle.textContent = `All ${quotes.length} caught.`;
      const again = document.createElement("button");
      again.type = "button";
      again.textContent = "Throw them back";
      done.append(doneTitle, again);
      field.append(canvas, count, note, done);
      const seen = new Set();
      let reading = -1;
      let visible = true;
      const context = canvas.getContext("2d");
      const flyers = quotes.map((item, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "kudo-bubble";
        button.innerHTML = bubbleSvg(colors[index % colors.length]);
        button.setAttribute("aria-label", `Catch the kudos, ${item.by}`);
        field.appendChild(button);
        return {
          button,
          quote: item.quote,
          by: item.by,
          color: colors[index % colors.length],
          angle: index * 1.45 + 0.4,
          speed: 0.2 + (index % 3) * 0.03,
          rx: 0.46 - (index % 2) * 0.04,
          ry: 0.36 + (index % 2) * 0.06,
          bob: index * 1.4,
          slow: 1,
          state: "fly",
          trail: [],
          x: 0,
          y: 0,
          from: [0, 0],
          startedAt: 0,
        };
      });
      portrait.appendChild(field);

      function paintCount() {
        label.textContent = seen.size ? `${seen.size} of ${quotes.length} kudos` : "Catch a kudos";
        [...pips.children].forEach((pip, index) => pip.classList.toggle("is-on", seen.has(index)));
      }

      function place(item, x, y, rot, scale) {
        item.x = x;
        item.y = y;
        item.button.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${rot.toFixed(1)}deg) scale(${scale})`;
      }

      function stillPoint(index, width, height) {
        const spots = [
          [0.16, 0.2],
          [0.74, 0.16],
          [0.12, 0.7],
          [0.76, 0.68],
        ];
        const spot = spots[index % spots.length];
        return [width * spot[0], height * spot[1]];
      }

      function openNote(index) {
        const item = flyers[index];
        reading = index;
        quoteEl.textContent = item.quote;
        roleEl.textContent = item.by;
        mark.style.background = item.color;
        note.hidden = false;
        requestAnimationFrame(() => note.classList.add("is-open"));
        seen.add(index);
        paintCount();
        closeBtn.focus();
      }

      function finishCatch(index) {
        const item = flyers[index];
        item.state = "read";
        item.button.classList.add("is-away");
        item.button.disabled = true;
        openNote(index);
      }

      function catchBubble(index) {
        const item = flyers[index];
        if (item.state !== "fly") return;
        if (reading >= 0) closeNote(false);
        item.state = "catch";
        item.startedAt = performance.now();
        item.from = [item.x, item.y];
        item.button.disabled = true;
        if (reduce) finishCatch(index);
      }

      function closeNote(returnFocus) {
        if (reading < 0) return;
        const index = reading;
        reading = -1;
        note.classList.remove("is-open");
        note.hidden = true;
        const item = flyers[index];
        if (item.state === "read" || item.state === "catch") {
          item.state = reduce ? "parked" : "home";
          item.startedAt = performance.now();
          if (reduce) park(item, index);
        }
        if (returnFocus) item.button.focus();
        if (seen.size === quotes.length) {
          done.hidden = false;
          requestAnimationFrame(() => done.classList.add("is-open"));
        }
      }

      function park(item, index) {
        const order = [...seen];
        const slot = Math.max(0, order.indexOf(index));
        const width = portrait.clientWidth;
        const half = item.button.offsetWidth / 2 || 34;
        item.state = "parked";
        item.button.classList.remove("is-away");
        item.button.classList.add("is-parked");
        item.button.disabled = false;
        item.button.style.opacity = "";
        item.button.setAttribute("aria-label", `Read again, ${item.by}`);
        const x = width * 0.5 + (slot - (quotes.length - 1) / 2) * 28 - half;
        place(item, x, 2, 0, 0.62);
      }

      function restore() {
        done.classList.remove("is-open");
        done.hidden = true;
        seen.clear();
        paintCount();
        flyers.forEach((item) => {
          item.state = "fly";
          item.slow = 1;
          item.trail = [];
          item.button.classList.remove("is-away", "is-parked");
          item.button.disabled = false;
          item.button.style.opacity = "";
          item.button.setAttribute("aria-label", `Catch the kudos, ${item.by}`);
        });
        if (reduce) layoutStill();
      }

      function layoutStill() {
        const width = portrait.clientWidth;
        const height = portrait.clientHeight;
        flyers.forEach((item, index) => {
          if (item.state !== "fly") return;
          const [x, y] = stillPoint(index, width, height);
          place(item, x, y, 0, 1);
        });
      }

      closeBtn.addEventListener("click", () => closeNote(true));
      again.addEventListener("click", restore);
      note.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          closeNote(true);
          return;
        }
        if (event.key !== "Tab") return;
        const stops = [closeBtn, source];
        const first = stops[0];
        const last = stops[stops.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      });
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && reading >= 0 && !event.target.closest(".kudo-note")) closeNote(true);
      });
      document.addEventListener("pointerdown", (event) => {
        if (reading < 0) return;
        if (event.target.closest(".kudo-note, .kudo-bubble")) return;
        closeNote(false);
      });

      flyers.forEach((item, index) => {
        item.button.addEventListener("pointerenter", () => { item.slow = 0.2; });
        item.button.addEventListener("pointerleave", () => { if (document.activeElement !== item.button) item.slow = 1; });
        item.button.addEventListener("focus", () => { item.slow = 0; });
        item.button.addEventListener("blur", () => { item.slow = 1; });
        item.button.addEventListener("pointerdown", () => { item.slow = 0; });
        item.button.addEventListener("pointerup", () => {
          if (document.activeElement !== item.button) item.slow = 1;
        });
        item.button.addEventListener("click", () => {
          if (item.state === "parked") {
            if (reading >= 0) closeNote(false);
            openNote(index);
            return;
          }
          catchBubble(index);
        });
      });

      function resizeCanvas() {
        const width = portrait.clientWidth;
        const height = portrait.clientHeight;
        const ratio = Math.min(2, window.devicePixelRatio || 1);
        canvas.width = Math.max(1, width) * ratio;
        canvas.height = Math.max(1, height) * ratio;
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
      }
      resizeCanvas();
      window.addEventListener("resize", resizeCanvas);
      if ("IntersectionObserver" in window) {
        const watch = new IntersectionObserver((entries) => {
          visible = entries.some((entry) => entry.isIntersecting);
          if (visible) startFrame();
        }, { rootMargin: "120px" });
        watch.observe(portrait);
      }

      const ease = (t) => 1 - (1 - t) ** 3;
      let last = performance.now();
      let rafOn = false;
      function frame(now) {
        if (!visible) {
          rafOn = false;
          return;
        }
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        const width = portrait.clientWidth;
        const height = portrait.clientHeight;
        if (width) {
          context.clearRect(0, 0, width, height);
          flyers.forEach((item, index) => {
            let x = item.x;
            let y = item.y;
            let rot = 0;
            let scale = 1;
            if (item.state === "fly") {
              if (!reduce) item.angle += dt * item.speed * item.slow;
              const rx = width < 520 ? Math.min(item.rx, 0.4) : item.rx;
              const ry = width < 520 ? Math.min(item.ry, 0.34) : item.ry;
              const halfW = item.button.offsetWidth / 2 || 34;
              const halfH = item.button.offsetHeight / 2 || 26;
              if (reduce) {
                [x, y] = stillPoint(index, width, height);
              } else {
                x = width * (0.5 + Math.cos(item.angle) * rx) - halfW;
                y = height * (0.48 + Math.sin(item.angle) * ry) - halfH + Math.sin(now / 650 + item.bob) * 6;
                const vx = -Math.sin(item.angle) * rx * width;
                const vy = Math.cos(item.angle) * ry * height;
                rot = Math.max(-16, Math.min(16, Math.atan2(vy, Math.abs(vx) + 40) * 30)) + Math.sin(now / 420 + item.bob) * 5;
                item.trail.push([x + halfW, y + halfH]);
                if (item.trail.length > 18) item.trail.shift();
                context.beginPath();
                item.trail.forEach((point, pointIndex) => {
                  if (pointIndex) context.lineTo(point[0], point[1]);
                  else context.moveTo(point[0], point[1]);
                });
                context.strokeStyle = "rgba(224, 119, 79, 0.32)";
                context.setLineDash([2, 5]);
                context.lineWidth = 1.3;
                context.stroke();
              }
            } else if (item.state === "catch") {
              const t = Math.min(1, (now - item.startedAt) / 560);
              const e = ease(t);
              const halfW = item.button.offsetWidth / 2 || 34;
              x = item.from[0] + (width * 0.5 - halfW - item.from[0]) * e;
              y = item.from[1] + (height * 0.16 - item.from[1]) * e - Math.sin(t * Math.PI) * 28;
              rot = t * 18;
              scale = 1 + t * 0.4;
              item.button.style.opacity = String(1 - t * 0.85);
              if (t >= 1) finishCatch(index);
            } else if (item.state === "home") {
              item.button.style.opacity = "0";
              if (now - item.startedAt >= 280) park(item, index);
              return;
            } else if (item.state === "parked") {
              park(item, index);
              return;
            } else {
              x = item.x;
              y = item.y;
              scale = 0.7;
              item.button.style.opacity = "0";
            }
            place(item, x, y, rot, scale);
          });
        }
        if (!reduce && visible) requestAnimationFrame(frame);
        else rafOn = false;
      }
      function startFrame() {
        if (reduce || rafOn || !visible) return;
        rafOn = true;
        last = performance.now();
        requestAnimationFrame(frame);
      }
      if (reduce) layoutStill();
      else startFrame();
      paintCount();
    }

    function load() {
      if (started) return;
      started = true;
      fetch("data/kudos.json")
        .then((response) => (response.ok ? response.json() : []))
        .then((data) => render(quotesFrom(data)))
        .catch(() => {});
    }

    whenNear(about, "200px", (near) => {
      if (near) load();
    });
  }

  function beginContact() {
    if (beginContact.started) return;
    const band = document.getElementById("night-band");
    const section = document.getElementById("contact");
    const canvas = document.getElementById("plane-canvas");
    const starCanvas = document.getElementById("star-field");
    const drift = band.querySelector(".cloud-drift");
    const sprites = { fork: new Image(), pouch: new Image(), plane: new Image(), mail: new Image() };
    let spritesStarted = false;

    function loadSprites() {
      if (spritesStarted) return;
      spritesStarted = true;
      const files = {
        fork: "assets/art/sling-fork.png",
        pouch: "assets/art/sling-pouch.png",
        plane: "assets/art/paper-plane.png",
        mail: "assets/art/mailbox.png",
      };
      Object.keys(files).forEach((key) => {
        sprites[key].onload = () => {
          if (sized) draw(performance.now());
        };
        sprites[key].src = files[key];
      });
    }

    function spriteReady(img) {
      return Boolean(img && img.complete && img.naturalWidth);
    }

    function placeDrift() {
      if (!drift) return;
      if (!motion) {
        drift.style.transform = "none";
        return;
      }
      const nx = pointer.x < 0 ? 0.5 : pointer.x / Math.max(1, W);
      const ny = pointer.y < 0 ? 0.5 : pointer.y / Math.max(1, H);
      const x = (nx - 0.5) * 18;
      const y = (ny - 0.5) * 8;
      drift.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    }
    const grab = document.getElementById("plane-grab");
    const ring = document.getElementById("mail-ring");
    const tag = document.getElementById("mail-tag");
    const hint = document.getElementById("pull-hint");
    const done = document.getElementById("plane-done");
    const nudge = document.getElementById("plane-nudge");
    const status = document.getElementById("plane-status");
    const help = document.getElementById("plane-help");
    const throwCount = document.getElementById("throw-count");
    const throwNum = document.getElementById("throw-num");
    const title = document.getElementById("plane-done-title");
    const message = document.getElementById("plane-done-msg");
    const again = document.getElementById("plane-again");
    const nudgeCopy = document.getElementById("nudge-copy");
    const nudgeKeep = document.getElementById("nudge-keep");
    const steps = section ? [...section.querySelectorAll("#plane-steps li")] : [];
    if (!band || !section || !canvas || !grab || !ring || !tag || !hint || !done) return;
    beginContact.started = true;
    if (!motion && help) help.textContent = "Press the plane, or Enter, to copy the email address.";

    const ctx = canvas.getContext("2d");
    const starCtx = starCanvas ? starCanvas.getContext("2d") : null;
    const SKY_W = 1600;
    const SKY_H = 900;
    const BOX = { x: 1236, y: 508, w: 118, h: 86 };
    const EMAIL = "suvarnamyneni@gmail.com";
    let W = 1;
    let H = 1;
    let gravity = 1000;
    let pullMax = 120;
    let springK = 6;
    let skyAlpha = 0;
    const anchor = { x: 0, y: 0 };
    let mb = { x1: 0, y1: 0, x2: 1, y2: 1, cx: 0, cy: 0 };
    const plane = { x: 0, y: 0, vx: 0, vy: 0, angle: -0.35, scale: 1, mode: "rest" };
    const pouch = { x: 0, y: 0, vx: 0, vy: 0 };
    let rock = 0;
    let rockV = 0;
    let drag = false;
    let throws = 0;
    let misses = 0;
    let firstDrag = false;
    let celebrating = false;
    let hintTravel = 0;
    let running = false;
    let lastTime = 0;
    const parts = [];
    const stars = [];
    const flies = [];
    const streaks = [];
    let pointer = { x: -999, y: -999 };

    function smooth(edge0, edge1, value) {
      const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
      return t * t * (3 - 2 * t);
    }

    function paintSky() {
      const rect = band.getBoundingClientRect();
      const progress = clamp(1 - rect.top / window.innerHeight, 0, 1);
      const dusk = smooth(0.15, 0.55, progress);
      const night = smooth(0.5, 0.95, progress);
      band.style.setProperty("--dusk", (dusk * (1 - night)).toFixed(3));
      band.style.setProperty("--night", night.toFixed(3));
      const nightOn = night > 0.55;
      band.classList.toggle("is-dusk", dusk > 0.35 && !nightOn);
      band.classList.toggle("is-night", nightOn);
      root.classList.toggle("is-night", nightOn);
      skyAlpha = night;
      if (!motion) drawStars(0, false);
    }

    function planeWidth() {
      return Math.min(96, Math.max(70, W * 0.058));
    }

    function markStep(index) {
      steps.forEach((item, i) => {
        item.classList.toggle("is-on", i === index);
        item.classList.toggle("is-ok", i < index);
      });
    }

    function park() {
      celebrating = false;
      plane.x = anchor.x;
      plane.y = anchor.y;
      plane.vx = 0;
      plane.vy = 0;
      plane.angle = -0.35;
      plane.scale = 1;
      plane.mode = "rest";
      markStep(0);
    }

    function placeChrome() {
      grab.style.left = `${anchor.x}px`;
      grab.style.top = `${anchor.y}px`;
      const ringSize = Math.max(70, (mb.x2 - mb.x1) * 1.5);
      ring.style.left = `${mb.cx}px`;
      ring.style.top = `${mb.cy}px`;
      ring.style.width = `${ringSize}px`;
      ring.style.height = `${ringSize}px`;
      tag.style.left = `${mb.cx}px`;
      tag.style.top = `${mb.y1 - ringSize * 0.35}px`;
      const fork = forkMetrics();
      hint.style.left = `${anchor.x}px`;
      hint.style.top = `${fork.y - 28}px`;
    }

    function resizeStars() {
      if (!starCanvas || !starCtx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(W * dpr));
      const height = Math.max(1, Math.round(H * dpr));
      if (starCanvas.width !== width || starCanvas.height !== height || !stars.length) {
        starCanvas.width = width;
        starCanvas.height = height;
        stars.length = 0;
        flies.length = 0;
        const count = Math.round((W * H) / 5200);
        for (let i = 0; i < count; i += 1) {
          stars.push({
            x: Math.random() * W,
            y: Math.pow(Math.random(), 1.6) * H * 0.62,
            r: 0.4 + Math.random() * 1.3,
            phase: Math.random() * 7,
            speed: 0.6 + Math.random() * 1.6,
          });
        }
        for (let i = 0; i < 8; i += 1) {
          flies.push({
            a: Math.random() * 7,
            b: Math.random() * 7,
            r: 28 + Math.random() * 70,
            spin: 0.2 + Math.random() * 0.5,
          });
        }
      }
      starCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // Phones under 390px: give the slingshot and mailbox their own band between
    // the copy (with its steps) and the email bar, growing the scene if needed.
    const FIT_BAND = 236;
    let fitBottom = null;
    function fitNarrow() {
      fitBottom = null;
      if (band.style.minHeight) band.style.minHeight = "";
      const rect = section.getBoundingClientRect();
      if (rect.width >= 390) return null;
      const copy = section.querySelector(".contact-copy");
      const bar = section.querySelector(".email-bar");
      if (!copy || !bar) return null;
      const top = copy.getBoundingClientRect().bottom - rect.top + 10;
      const room = bar.getBoundingClientRect().top - rect.top - 8 - top;
      if (room < FIT_BAND) {
        band.style.minHeight = `${Math.ceil(band.getBoundingClientRect().height + FIT_BAND - room)}px`;
      }
      const r2 = section.getBoundingClientRect();
      fitBottom = bar.getBoundingClientRect().top - r2.top - 8;
      return { top, bottom: fitBottom };
    }

    function measure() {
      const fit = fitNarrow();
      const rect = section.getBoundingClientRect();
      W = Math.max(1, rect.width);
      H = Math.max(1, rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(W * dpr));
      canvas.height = Math.max(1, Math.round(H * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const narrow = W < 700;
      const mailW = Math.min(230, Math.max(128, W * (narrow ? 0.34 : 0.16)));
      const mailH = mailW * (720 / 514);
      let mailLeft = narrow ? W * 0.58 : W * 0.74;
      let mailTop = (narrow ? H * 0.86 : H * 0.82) - mailH;
      if (fit) {
        mailLeft = Math.min(mailLeft, W - mailW - 6);
        mailTop = fit.bottom - mailH;
      }
      mb = {
        x1: mailLeft + mailW * 0.22,
        y1: mailTop + mailH * 0.18,
        x2: mailLeft + mailW * 0.78,
        y2: mailTop + mailH * 0.5,
        spriteX: mailLeft,
        spriteY: mailTop,
        spriteW: mailW,
        spriteH: mailH,
      };
      mb.cx = (mb.x1 + mb.x2) / 2;
      mb.cy = (mb.y1 + mb.y2) / 2;
      anchor.x = narrow ? W * 0.3 : W * 0.17;
      anchor.y = narrow ? H * 0.72 : H * 0.7;
      if (fit) {
        const pw = planeWidth();
        const fork = sprites.fork;
        const ratio = spriteReady(fork) ? fork.naturalHeight / fork.naturalWidth : 1022 / 607;
        const forkTop = fit.top + 34;
        const forkH = Math.max(60, Math.min(pw * 2.35 * ratio, fit.bottom - forkTop));
        anchor.y = forkTop + FORK_POCKET.y * forkH - Math.sin(0.35) * pw * 0.18;
      }
      gravity = 1000 * (H / 900);
      pullMax = Math.min(150, Math.max(90, W * 0.1));
      const reach = Math.max(200, mb.cx - anchor.x);
      springK = Math.sqrt(1.25 * (reach + pullMax) * gravity) / pullMax;
      if (plane.mode === "rest" && !drag) park();
      placeChrome();
      resizeStars();
      if (!running) {
        draw(performance.now());
        if (!motion) drawStars(0, false);
      }
    }

    function inMailbox(x, y) {
      return x > mb.x1 - 30 && x < mb.x2 + 22 && y > mb.y1 - 34 && y < mb.y2 + 26;
    }

    function pauseScroll(stop) {
      const lenis = window.deskLenis;
      if (!lenis) return;
      if (stop && lenis.stop) lenis.stop();
      else if (!stop && lenis.start) lenis.start();
    }

    function noteThrow() {
      throws += 1;
      if (throwNum) throwNum.textContent = String(throws);
      if (throwCount) {
        throwCount.classList.add("is-on");
        throwCount.removeAttribute("aria-hidden");
      }
    }

    async function copyAddress() {
      let ok = false;
      if (window.deskCopy) ok = await window.deskCopy();
      if (message) {
        message.textContent = ok
          ? `${EMAIL} is on your clipboard.`
          : `Write to me at ${EMAIL}.`;
      }
    }

    function burstStars() {
      if (!motion) return;
      for (let i = 0; i < 7; i += 1) {
        streaks.push({
          x: W * (0.35 + Math.random() * 0.6),
          y: H * Math.random() * 0.3,
          life: 1 + i * 0.12,
        });
      }
    }

    function confetti() {
      const colors = ["#fffaf3", "#f6c7b4", "#e0774f", "#f3c26b", "#fff"];
      for (let i = 0; i < 54; i += 1) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 160 + Math.random() * 380;
        const life = 1.4 + Math.random() * 0.6;
        parts.push({
          x: mb.cx,
          y: mb.cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 240,
          life,
          span: life,
          kind: "bit",
          spin: 0,
          spinV: (Math.random() - 0.5) * 14,
          color: colors[i % colors.length],
        });
      }
    }

    function showDone() {
      done.hidden = false;
      grab.tabIndex = -1;
      window.requestAnimationFrame(() => {
        done.classList.add("is-on");
        const link = done.querySelector("a");
        if (link) link.focus({ preventScroll: true });
      });
    }

    function hideDone() {
      done.classList.remove("is-on");
      done.hidden = true;
      grab.tabIndex = 0;
      section.classList.remove("is-landed");
      park();
      if (!running) draw(performance.now());
    }

    function land() {
      if (celebrating) return;
      celebrating = true;
      plane.mode = "in";
      plane.scale = 1;
      section.classList.add("is-landed");
      if (title) title.textContent = band.classList.contains("is-night") ? "It landed under the stars." : "It landed.";
      if (status) status.textContent = "Delivered.";
      confetti();
      burstStars();
      copyAddress();
      window.setTimeout(showDone, motion ? 520 : 0);
    }

    function puff() {
      for (let i = 0; i < 14; i += 1) {
        const angle = Math.random() * Math.PI * 2;
        parts.push({
          x: clamp(plane.x, 10, W - 10),
          y: clamp(plane.y, 10, H * 0.93),
          vx: Math.cos(angle) * 70,
          vy: Math.sin(angle) * 40 - 30,
          life: 0.9,
          span: 0.9,
          kind: "puff",
        });
      }
    }

    function miss() {
      misses += 1;
      plane.mode = "gone";
      section.classList.add("is-miss");
      if (status) status.textContent = "The plane missed the mailbox.";
      puff();
      if (misses === 1) {
        tag.textContent = "A little higher.";
        window.setTimeout(() => {
          if (tag.textContent === "A little higher.") tag.textContent = "The mailbox";
        }, 2400);
      }
      if ((misses === 2 || misses === 5) && nudge) {
        window.setTimeout(() => {
          nudge.hidden = false;
          nudge.classList.add("is-on");
        }, 700);
      }
      window.setTimeout(() => {
        section.classList.remove("is-miss");
        park();
        plane.y += 40;
        plane.mode = "return";
        if (!motion) {
          plane.mode = "rest";
          draw(0);
        }
      }, motion ? 650 : 0);
    }

    function launch(dx, dy) {
      pouch.x = plane.x;
      pouch.y = plane.y;
      pouch.vx = dx * springK * 0.6;
      pouch.vy = dy * springK * 0.6;
      rockV = -(Math.hypot(dx, dy) / pullMax) * 1.6;
      plane.vx = dx * springK;
      plane.vy = dy * springK;
      plane.mode = "fly";
      markStep(3);
    }

    function release() {
      if (!drag) return;
      drag = false;
      section.classList.remove("is-dragging", "is-aim");
      pauseScroll(false);
      const dx = anchor.x - plane.x;
      const dy = anchor.y - plane.y;
      if (Math.hypot(dx, dy) < 14) {
        if (!motion) {
          noteThrow();
          land();
          draw(0);
        } else park();
        return;
      }
      noteThrow();
      if (!motion) {
        land();
        draw(0);
        return;
      }
      launch(dx, dy);
    }

    function pointOf(event) {
      const rect = section.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }

    grab.addEventListener("pointerdown", (event) => {
      if (plane.mode !== "rest" || event.button !== 0) return;
      event.preventDefault();
      try { grab.setPointerCapture(event.pointerId); } catch (error) { /* pointer already released */ }
      drag = true;
      firstDrag = true;
      section.classList.add("is-dragging");
      pauseScroll(true);
    });

    grab.addEventListener("pointermove", (event) => {
      if (!drag) return;
      const point = pointOf(event);
      let dx = point.x - anchor.x;
      let dy = point.y - anchor.y;
      const dist = Math.hypot(dx, dy);
      if (dist > pullMax) {
        dx = (dx / dist) * pullMax;
        dy = (dy / dist) * pullMax;
      }
      plane.x = anchor.x + dx;
      plane.y = anchor.y + dy;
      plane.angle = Math.atan2(-dy, -dx);
    });

    grab.addEventListener("pointerup", release);
    grab.addEventListener("pointercancel", release);
    grab.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      if (plane.mode !== "rest" || drag) return;
      firstDrag = true;
      noteThrow();
      if (!motion) {
        land();
        draw(0);
        return;
      }
      plane.x = anchor.x - pullMax * 0.92;
      plane.y = anchor.y + pullMax * 0.34;
      plane.angle = Math.atan2(-(plane.y - anchor.y), -(plane.x - anchor.x));
      launch(anchor.x - plane.x, anchor.y - plane.y);
    });

    if (again) again.addEventListener("click", hideDone);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !done.hidden) hideDone();
    });
    done.addEventListener("keydown", (event) => {
      if (event.key !== "Tab") return;
      const items = [...done.querySelectorAll("a, button")];
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    if (nudgeCopy) {
      nudgeCopy.addEventListener("click", async () => {
        let ok = false;
        if (window.deskCopy) ok = await window.deskCopy();
        nudgeCopy.textContent = ok ? "Copied" : "Copy";
        window.setTimeout(() => {
          nudgeCopy.textContent = "Copy";
        }, 1600);
      });
    }
    if (nudgeKeep && nudge) {
      nudgeKeep.addEventListener("click", () => {
        nudge.classList.remove("is-on");
        nudge.hidden = true;
      });
    }

    const FORK_LEFT = { x: 0.086, y: 0.012 };
    const FORK_RIGHT = { x: 0.871, y: 0.014 };
    const FORK_POCKET = { x: 0.5, y: 0.2 };

    function forkMetrics() {
      const width = planeWidth();
      const fork = sprites.fork;
      const ratio = spriteReady(fork) ? fork.naturalHeight / fork.naturalWidth : 1022 / 607;
      let drawW = width * 2.35;
      let drawH = drawW * ratio;
      const pocket = restPocket();
      const maxBottom = fitBottom != null ? fitBottom : H - 6;
      if (pocket.y + drawH * (1 - FORK_POCKET.y) > maxBottom) {
        drawH = (maxBottom - pocket.y) / (1 - FORK_POCKET.y);
        drawW = drawH / ratio;
      }
      const x = pocket.x - FORK_POCKET.x * drawW;
      const y = pocket.y - FORK_POCKET.y * drawH;
      return {
        drawW,
        drawH,
        x,
        y,
        pivot: { x: x + drawW * 0.5, y: y + drawH * 0.4 },
        left: { x: x + FORK_LEFT.x * drawW, y: y + FORK_LEFT.y * drawH },
        right: { x: x + FORK_RIGHT.x * drawW, y: y + FORK_RIGHT.y * drawH },
      };
    }

    function spinAbout(point, pivot, angle) {
      const c = Math.cos(angle);
      const s = Math.sin(angle);
      const dx = point.x - pivot.x;
      const dy = point.y - pivot.y;
      return { x: pivot.x + dx * c - dy * s, y: pivot.y + dx * s + dy * c };
    }

    function restPocket() {
      const width = planeWidth();
      const angle = -0.35;
      return {
        x: anchor.x - Math.cos(angle) * width * 0.18,
        y: anchor.y - Math.sin(angle) * width * 0.18,
      };
    }

    function pouchPoint() {
      const width = planeWidth();
      if (plane.mode === "rest" || drag || plane.mode === "return") {
        return {
          x: plane.x - Math.cos(plane.angle) * width * 0.18,
          y: plane.y - Math.sin(plane.angle) * width * 0.18,
        };
      }
      return pouch;
    }

    function pouchSides(hold) {
      const pulling = drag || (plane.mode !== "rest" && plane.mode !== "return");
      const ang = pulling ? Math.atan2(hold.y - anchor.y, hold.x - anchor.x) : plane.angle;
      const half = planeWidth() * 0.42;
      const px = Math.cos(ang + Math.PI / 2);
      const py = Math.sin(ang + Math.PI / 2);
      return {
        ang,
        a: { x: hold.x + px * half, y: hold.y + py * half },
        b: { x: hold.x - px * half, y: hold.y - py * half },
      };
    }

    function drawBand(from, to, width, stretch) {
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const len = Math.hypot(dx, dy) || 1;
      const sag = (1 - stretch) * 14;
      const cx = (from.x + to.x) / 2 + (-dy / len) * sag;
      const cy = (from.y + to.y) / 2 + (dx / len) * sag;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.quadraticCurveTo(cx, cy, to.x, to.y);
      ctx.strokeStyle = "#8d3424";
      ctx.lineWidth = width + 2.2;
      ctx.stroke();
      ctx.strokeStyle = "#d46545";
      ctx.lineWidth = width;
      ctx.stroke();
      ctx.strokeStyle = "rgba(255, 214, 190, 0.85)";
      ctx.lineWidth = Math.max(1.1, width * 0.28);
      ctx.stroke();
    }

    function forkPose() {
      const frame = forkMetrics();
      frame.left = spinAbout(frame.left, frame.pivot, rock);
      frame.right = spinAbout(frame.right, frame.pivot, rock);
      return frame;
    }

    function drawFork(frame) {
      const fork = sprites.fork;
      ctx.save();
      ctx.translate(frame.pivot.x, frame.pivot.y);
      ctx.rotate(rock);
      ctx.translate(-frame.pivot.x, -frame.pivot.y);
      if (spriteReady(fork)) {
        ctx.drawImage(fork, frame.x, frame.y, frame.drawW, frame.drawH);
      } else {
        ctx.lineCap = "round";
        ctx.strokeStyle = "#c4844a";
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.moveTo(frame.left.x, frame.left.y);
        ctx.quadraticCurveTo(anchor.x, frame.pivot.y, frame.pivot.x, frame.pivot.y + 80);
        ctx.moveTo(frame.right.x, frame.right.y);
        ctx.quadraticCurveTo(anchor.x, frame.pivot.y, frame.pivot.x, frame.pivot.y + 80);
        ctx.stroke();
      }
      ctx.restore();
    }

    function nearer(tip, sideA, sideB) {
      const da = Math.hypot(tip.x - sideA.x, tip.y - sideA.y);
      const db = Math.hypot(tip.x - sideB.x, tip.y - sideB.y);
      return da <= db ? sideA : sideB;
    }

    function drawSling(stage) {
      const frame = forkPose();
      const hold = pouchPoint();
      const stretch = Math.min(1, Math.hypot(hold.x - anchor.x, hold.y - anchor.y) / pullMax);
      const width = 7.2 - stretch * 3.4;
      const sides = pouchSides(hold);
      const leftEnd = nearer(frame.left, sides.a, sides.b);
      const rightEnd = leftEnd === sides.a ? sides.b : sides.a;
      if (stage === "back") {
        drawFork(frame);
        drawBand(frame.right, rightEnd, width, stretch);
        return;
      }
      if (stage === "pouch") {
        ctx.save();
        ctx.translate(hold.x, hold.y);
        ctx.rotate(sides.ang);
        const pouchImg = sprites.pouch;
        if (spriteReady(pouchImg)) {
          const pouchW = planeWidth() * 0.92;
          const pouchH = pouchW * (pouchImg.naturalHeight / pouchImg.naturalWidth);
          ctx.drawImage(pouchImg, -pouchW / 2, -pouchH * 0.42, pouchW, pouchH);
        } else {
          ctx.fillStyle = "#8a5a3c";
          ctx.beginPath();
          ctx.ellipse(0, 0, 16, 10, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        return;
      }
      drawBand(frame.left, leftEnd, width, stretch);
    }

    function drawPlane(x, y, angle, scale) {
      const width = planeWidth();
      const planeImg = sprites.plane;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.scale(scale, scale);
      ctx.shadowColor = "rgba(110, 55, 30, 0.28)";
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 8;
      if (spriteReady(planeImg)) {
        const height = width * (planeImg.naturalHeight / planeImg.naturalWidth);
        ctx.drawImage(planeImg, -width * 0.42, -height / 2, width, height);
      } else {
        ctx.beginPath();
        ctx.moveTo(width * 0.48, 0);
        ctx.lineTo(-width * 0.42, -width * 0.16);
        ctx.lineTo(-width * 0.2, 0);
        ctx.lineTo(-width * 0.42, width * 0.14);
        ctx.closePath();
        ctx.fillStyle = "#fffaf3";
        ctx.fill();
      }
      ctx.restore();
    }

    function roundedBox(x, y, w, h, radius) {
      const r = Math.min(radius, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    function drawMailbox() {
      const mail = sprites.mail;
      const glowX = mb.spriteX + mb.spriteW * 0.27;
      const glowY = mb.spriteY + mb.spriteH * 0.34;
      const glow = ctx.createRadialGradient(glowX, glowY, 4, glowX, glowY, 90);
      glow.addColorStop(0, `rgba(255, 196, 110, ${0.45 + skyAlpha * 0.35})`);
      glow.addColorStop(1, "rgba(255, 196, 110, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(glowX, glowY, 90, 0, Math.PI * 2);
      ctx.fill();
      if (spriteReady(mail) && mb.spriteW) {
        ctx.drawImage(mail, mb.spriteX, mb.spriteY, mb.spriteW, mb.spriteH);
        return;
      }
      ctx.fillStyle = "#f7f1e8";
      ctx.fillRect(mb.x1, mb.y1, mb.x2 - mb.x1, mb.y2 - mb.y1);
    }

    function drawPreview() {
      let x = plane.x;
      let y = plane.y;
      let vx = (anchor.x - plane.x) * springK;
      let vy = (anchor.y - plane.y) * springK;
      const step = 1 / 30;
      let aimed = false;
      for (let i = 0; i < 48; i += 1) {
        const falling = vy > 0;
        vy += gravity * (falling ? 0.72 : 1) * step;
        vx *= 1 - 0.12 * step;
        vy *= 1 - 0.05 * step;
        x += vx * step;
        y += vy * step;
        if (inMailbox(x, y)) aimed = true;
        if (i % 2) continue;
        ctx.beginPath();
        ctx.arc(x, y, Math.max(1.2, 3.6 - i * 0.05), 0, Math.PI * 2);
        const fade = Math.max(0, (aimed ? 0.95 - i * 0.016 : 0.95 - i * 0.018));
        ctx.fillStyle = aimed ? `rgba(224, 119, 79, ${fade})` : `rgba(255, 255, 255, ${fade})`;
        ctx.fill();
      }
      section.classList.toggle("is-aim", aimed);
      markStep(aimed ? 2 : 1);
    }

    function drawGuide(dt) {
      hintTravel += dt;
      ctx.save();
      ctx.setLineDash([2, 10]);
      ctx.lineDashOffset = motion ? -hintTravel * 40 : 0;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
      ctx.lineWidth = 2.4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(anchor.x + 28, anchor.y - 18);
      ctx.quadraticCurveTo(
        (anchor.x + mb.cx) / 2,
        Math.min(anchor.y, mb.y1) - H * 0.22,
        mb.x1 + 8,
        mb.cy
      );
      ctx.stroke();
      ctx.restore();
    }

    function drawBits() {
      parts.forEach((bit) => {
        const fade = clamp(bit.life / (bit.span || 1), 0, 1);
        ctx.save();
        ctx.globalAlpha = fade;
        if (bit.kind === "trail") {
          ctx.beginPath();
          ctx.arc(bit.x, bit.y, 2.2, 0, Math.PI * 2);
          ctx.fillStyle = "#fff";
          ctx.fill();
        } else if (bit.kind === "puff") {
          ctx.beginPath();
          ctx.arc(bit.x, bit.y, 10 + (1 - fade) * 22, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
          ctx.fill();
        } else {
          ctx.translate(bit.x, bit.y);
          ctx.rotate(bit.spin || 0);
          ctx.fillStyle = bit.color;
          ctx.fillRect(-4, -2.5, 8, 5);
        }
        ctx.restore();
      });
    }

    function drawFlies(now) {
      if (skyAlpha < 0.02) return;
      const seconds = motion ? now / 1000 : 0;
      flies.forEach((fly) => {
        if (motion) {
          fly.a += fly.spin * 0.016;
          fly.b += fly.spin * 0.011;
        }
        const x = mb.cx + Math.cos(fly.a) * fly.r;
        const y = mb.y2 + 16 + Math.sin(fly.b) * fly.r * 0.45;
        const blink = motion ? 0.5 + 0.5 * Math.sin(seconds * 3 + fly.r) : 0.8;
        ctx.save();
        ctx.globalAlpha = skyAlpha * blink;
        ctx.fillStyle = "#ffe2a6";
        ctx.shadowColor = "rgba(255, 210, 140, 0.9)";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(x, y, 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }

    function advance(dt) {
      if (plane.mode !== "rest" && !drag) {
        pouch.vx += (-900 * (pouch.x - anchor.x) - 16 * pouch.vx) * dt;
        pouch.vy += (-900 * (pouch.y - anchor.y) - 16 * pouch.vy) * dt;
        pouch.x += pouch.vx * dt;
        pouch.y += pouch.vy * dt;
      } else {
        const hold = pouchPoint();
        pouch.x = hold.x;
        pouch.y = hold.y;
        pouch.vx = 0;
        pouch.vy = 0;
      }
      rockV += (-160 * rock - 6 * rockV) * dt;
      rock += rockV * dt;

      if (plane.mode === "fly") {
        const falling = plane.vy > 0;
        plane.vy += gravity * (falling ? 0.72 : 1) * dt;
        plane.vx *= 1 - 0.12 * dt;
        plane.vy *= 1 - 0.05 * dt;
        plane.x += plane.vx * dt;
        plane.y += plane.vy * dt;
        plane.angle = Math.atan2(plane.vy, plane.vx);
        if (Math.random() < 0.5) {
          parts.push({ x: plane.x, y: plane.y, vx: 0, vy: 0, life: 0.5, span: 0.5, kind: "trail" });
        }
        if (inMailbox(plane.x, plane.y)) land();
        else if (plane.x > W + 60 || plane.y > H * 0.95 || plane.x < -60) miss();
      } else if (plane.mode === "in") {
        const slot = mb.x1 + (mb.x2 - mb.x1) * 0.3;
        const glide = Math.min(1, dt * 12);
        plane.x += (slot - plane.x) * glide;
        plane.y += (mb.cy - plane.y) * glide;
        plane.scale *= Math.pow(0.9, dt * 60);
      } else if (plane.mode === "return") {
        plane.y += (anchor.y - plane.y) * Math.min(1, dt * 7.2);
        if (Math.abs(plane.y - anchor.y) < 0.6) plane.mode = "rest";
      }

      for (let i = parts.length - 1; i >= 0; i -= 1) {
        const bit = parts[i];
        bit.life -= dt;
        if (bit.life <= 0) {
          parts.splice(i, 1);
          continue;
        }
        if (bit.kind === "bit") bit.vy += 600 * dt;
        bit.x += bit.vx * dt;
        bit.y += bit.vy * dt;
        bit.spin = (bit.spin || 0) + (bit.spinV || 0) * dt;
      }
    }

    function draw(now) {
      ctx.clearRect(0, 0, W, H);
      drawMailbox();
      drawFlies(now);
      if (drag) drawPreview();
      else if (!firstDrag && plane.mode === "rest") drawGuide(1 / 60);
      drawSling("back");
      drawBits();
      drawSling("pouch");
      if (plane.mode !== "gone") {
        const bob = plane.mode === "rest" && !drag && motion ? Math.sin(now / 380) * 2.5 : 0;
        drawPlane(plane.x, plane.y + bob, plane.angle, plane.mode === "in" ? plane.scale : 1);
      }
      drawSling("front");
      hint.style.opacity = !firstDrag && plane.mode === "rest" ? "1" : "0";
      placeDrift();
    }

    function drawStars(now, animate) {
      if (!starCtx) return;
      starCtx.clearRect(0, 0, W, H);
      if (skyAlpha <= 0.02) return;
      const seconds = animate ? now / 1000 : 0;
      const near = [];
      stars.forEach((star) => {
        const dist = Math.hypot(star.x - pointer.x, star.y - pointer.y);
        const boost = dist < 150 ? 1 - dist / 150 : 0;
        const twinkle = animate ? 0.55 + 0.45 * Math.sin(seconds * star.speed + star.phase) : 0.85;
        starCtx.globalAlpha = skyAlpha * clamp(twinkle * 0.8 + boost, 0, 1);
        starCtx.fillStyle = "#fff8e6";
        starCtx.beginPath();
        starCtx.arc(star.x, star.y, star.r * (1 + boost * 1.4), 0, Math.PI * 2);
        starCtx.fill();
        if (boost > 0) near.push({ dist, star });
      });
      near.sort((a, b) => a.dist - b.dist);
      const linked = near.slice(0, 5).map((item) => item.star);
      if (linked.length > 1) {
        starCtx.globalAlpha = skyAlpha * 0.5;
        starCtx.strokeStyle = "#ffe2b0";
        starCtx.lineWidth = 0.8;
        starCtx.beginPath();
        starCtx.moveTo(linked[0].x, linked[0].y);
        linked.slice(1).forEach((star) => starCtx.lineTo(star.x, star.y));
        starCtx.stroke();
      }
      if (animate && Math.random() < 0.004 * skyAlpha) {
        streaks.push({ x: Math.random() * W * 0.7 + W * 0.2, y: Math.random() * H * 0.25, life: 1 });
      }
      for (let i = streaks.length - 1; i >= 0; i -= 1) {
        const streak = streaks[i];
        streak.life -= animate ? 0.012 : 1;
        if (streak.life <= 0 || streak.life > 1) {
          if (streak.life <= 0) streaks.splice(i, 1);
          continue;
        }
        const travel = 1 - streak.life;
        const x = streak.x - travel * 260;
        const y = streak.y + travel * 120;
        const fade = Math.max(skyAlpha, 0.6) * Math.sin(Math.min(1, streak.life) * Math.PI);
        const gradient = starCtx.createLinearGradient(x, y, x + 90, y - 42);
        gradient.addColorStop(0, "rgba(255, 248, 230, 0.95)");
        gradient.addColorStop(1, "rgba(255, 248, 230, 0)");
        starCtx.globalAlpha = fade;
        starCtx.strokeStyle = gradient;
        starCtx.lineWidth = 1.6;
        starCtx.beginPath();
        starCtx.moveTo(x, y);
        starCtx.lineTo(x + 90, y - 42);
        starCtx.stroke();
      }
      starCtx.globalAlpha = 1;
    }

    function frame(now) {
      if (!running) return;
      const dt = Math.min(0.033, (now - (lastTime || now)) / 1000);
      lastTime = now;
      advance(dt);
      draw(now);
      drawStars(now, true);
      requestAnimationFrame(frame);
    }

    let sized = false;

    function ensureSize() {
      if (sized) return;
      sized = true;
      loadSprites();
      measure();
    }

    function watch(entries) {
      const visible = entries.some((entry) => entry.isIntersecting);
      if (!visible) {
        running = false;
        return;
      }
      ensureSize();
      if (motion && !running) {
        running = true;
        lastTime = 0;
        requestAnimationFrame(frame);
      }
    }

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(watch, { rootMargin: "180px", threshold: 0.05 });
      observer.observe(section);
    } else {
      ensureSize();
      if (motion) {
        running = true;
        requestAnimationFrame(frame);
      }
    }

    section.addEventListener("pointermove", (event) => {
      const rect = section.getBoundingClientRect();
      pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }, { passive: true });
    section.addEventListener("pointerleave", () => {
      pointer = { x: -999, y: -999 };
    });

    paintSky();
    window.addEventListener("scroll", paintSky, { passive: true });
    window.addEventListener("resize", () => {
      if (sized) measure();
      paintSky();
    });
    if (window.deskLenis && window.deskLenis.on) window.deskLenis.on("scroll", paintSky);
  }

  function initSky() {
    beginContact();
  }

  function initSling() {
    beginContact();
  }

  function initHire() {
    const dialog = document.getElementById("hire-dialog");
    if (!dialog) return;
    const close = dialog.querySelector(".hire-close");
    if (close) close.addEventListener("click", () => dialog.close());
    let buffer = "";

    function inField(event) {
      const node = event.target;
      if (!node || node.nodeType !== 1 || !node.closest) return false;
      return Boolean(node.closest("input, textarea, select, [contenteditable]"));
    }

    document.addEventListener("keydown", (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return;
      if (dialog.open || inField(event)) return;
      if (!event.key || event.key.length !== 1) return;
      buffer = (buffer + event.key.toLowerCase()).slice(-4);
      if (buffer === "hire") {
        buffer = "";
        dialog.showModal();
      }
    });
  }

  function initSkills() {
    if (window.deskSeeds && window.deskSeeds.setSkills) window.deskSeeds.setSkills(SKILLS);
  }

  function initDeskMetrics() {
    const nums = [...document.querySelectorAll(".desk-card .metric-num")];
    if (!nums.length || !motion || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = Number(el.dataset.value);
        if (!Number.isFinite(target)) return;
        const prefix = el.dataset.prefix || "";
        const suffix = el.dataset.suffix || "";
        const started = performance.now();
        const step = (now) => {
          const t = Math.min(1, (now - started) / 680);
          const eased = 1 - (1 - t) ** 3;
          el.textContent = `${prefix}${Math.round(eased * target)}${suffix}`;
          if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        observer.unobserve(el);
      });
    }, { threshold: 0.5 });
    nums.forEach((el) => observer.observe(el));
  }

  [
    initSkills,
    initDeskMetrics,
    initLazyImages,
    initCaseOpen,
    initCursorIcons,
    initPortrait,
    initFacts,
    initChips,
    initAlsoMore,
    initKudos,
    initSky,
    initSling,
    initHire,
  ].forEach((start) => {
    try {
      start();
    } catch (error) {
      console.error(error);
    }
  });
})();
