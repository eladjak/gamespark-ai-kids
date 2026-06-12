/*
 * GameSpark AI — real, playable arcade engine.
 * Builds a genuinely playable mini-game from the kid's selections
 * (genre + character + world + idea) with NO paid API: the "AI" is a
 * deterministic generator that turns choices into a real game config.
 *
 * Five game modes, all sharing one canvas loop:
 *   space     -> collect floating stars before the timer ends
 *   adventure -> find keys and reach the glowing gate
 *   puzzle    -> light up rings in the right order
 *   race      -> dodge obstacles and reach the finish line
 *   platform  -> jump across platforms to the flag
 *
 * Controls: arrows / WASD + space, plus on-screen touch buttons.
 * Exposes window.GameSpark.launch(config) and .close().
 */
(function () {
  "use strict";

  /* ---------- tiny Web Audio sound kit (free, no assets) ---------- */
  const Sound = (() => {
    let ctx = null;
    let muted = false;
    const ensure = () => {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) ctx = new AC();
      }
      if (ctx && ctx.state === "suspended") ctx.resume();
      return ctx;
    };
    const blip = (freq, dur, type = "sine", gain = 0.18) => {
      if (muted) return;
      const ac = ensure();
      if (!ac) return;
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ac.currentTime);
      g.gain.setValueAtTime(gain, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
      osc.connect(g).connect(ac.destination);
      osc.start();
      osc.stop(ac.currentTime + dur);
    };
    return {
      setMuted: (v) => { muted = v; },
      isMuted: () => muted,
      pickup: () => blip(660 + Math.random() * 120, 0.14, "triangle", 0.16),
      jump: () => blip(380, 0.12, "square", 0.12),
      hit: () => blip(120, 0.28, "sawtooth", 0.2),
      win: () => { blip(523, 0.14, "triangle", 0.2); setTimeout(() => blip(659, 0.14, "triangle", 0.2), 130); setTimeout(() => blip(784, 0.26, "triangle", 0.22), 270); },
      lose: () => { blip(300, 0.2, "sawtooth", 0.18); setTimeout(() => blip(200, 0.32, "sawtooth", 0.18), 180); },
      step: () => blip(520, 0.08, "sine", 0.07),
    };
  })();

  /* ---------- input ---------- */
  const keys = Object.create(null);
  const touch = Object.create(null);
  const isDown = (...names) => names.some((n) => keys[n] || touch[n]);

  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    keys[k] = true;
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) {
      if (state.running) e.preventDefault();
    }
  });
  window.addEventListener("keyup", (e) => { keys[e.key.toLowerCase()] = false; });

  /* ---------- engine state ---------- */
  const state = {
    running: false,
    raf: 0,
    canvas: null,
    ctx: null,
    cfg: null,
    t: 0,
    last: 0,
    onEnd: null,
  };

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);

  function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function drawHero(ctx, x, y, colors, t) {
    const [head, body, legs] = colors;
    const bounce = Math.sin(t / 120) * 3;
    ctx.save();
    ctx.translate(x, y + bounce);
    ctx.shadowColor = "rgba(0,0,0,0.4)";
    ctx.shadowBlur = 12;
    ctx.fillStyle = body; roundRect(ctx, -16, -32, 32, 38, 9); ctx.fill();
    ctx.fillStyle = head; roundRect(ctx, -14, -44, 28, 22, 9); ctx.fill();
    ctx.fillStyle = legs; roundRect(ctx, -13, 4, 10, 16, 4); ctx.fill();
    roundRect(ctx, 3, 4, 10, 16, 4); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#071016";
    ctx.beginPath();
    ctx.arc(-6, -33, 2.4, 0, Math.PI * 2);
    ctx.arc(6, -33, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function paintBackground(ctx, w, h, pal, t) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, pal[0]);
    g.addColorStop(0.6, pal[1]);
    g.addColorStop(1, "#071016");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    const off = (t * 0.02) % 40;
    for (let x = -off; x <= w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y <= h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    ctx.restore();
  }

  /* =====================================================================
   *  GAME MODES — each returns { setup, update, render } over a world `g`
   * ===================================================================== */
  function makeMode(cfg, w, h) {
    const pal = cfg.palette;
    const heroColors = cfg.character.colors;
    const mode = cfg.genre.id;

    const g = {
      hero: { x: w * 0.5, y: h * 0.7, vx: 0, vy: 0, r: 18, onGround: false },
      score: 0,
      target: cfg.target,
      lives: cfg.lives,
      timeLeft: cfg.time,
      ended: false,
      won: false,
      items: [],
      obstacles: [],
      extra: {},
    };

    /* ----- per-mode setup ----- */
    if (mode === "space") {
      for (let i = 0; i < cfg.target + 4; i += 1) {
        g.items.push({ x: rand(40, w - 40), y: rand(40, h - 120), r: 13, taken: false, hue: i % 2 ? pal[2] : pal[3], ph: rand(0, 6) });
      }
    } else if (mode === "adventure") {
      for (let i = 0; i < cfg.target; i += 1) {
        g.items.push({ x: rand(50, w - 50), y: rand(60, h - 120), r: 13, taken: false, hue: pal[3], ph: rand(0, 6) });
      }
      g.extra.gate = { x: w - 70, y: h * 0.5, w: 44, h: 88, open: false };
    } else if (mode === "puzzle") {
      const n = cfg.target;
      for (let i = 0; i < n; i += 1) {
        g.items.push({ x: w * (0.18 + (i / Math.max(1, n - 1)) * 0.64), y: h * (0.35 + (i % 2) * 0.28), r: 26, taken: false, order: i + 1, hue: pal[2] });
      }
      g.extra.next = 1;
    } else if (mode === "race") {
      g.hero.x = w * 0.5; g.hero.y = h - 60;
      g.extra.dist = 0;
      g.extra.finish = cfg.target * 100; // distance to finish
      g.extra.speed = 2.4;
    } else if (mode === "platform") {
      g.extra.platforms = [
        { x: w * 0.05, y: h - 36, w: w * 0.9, h: 36 }, // ground
        { x: w * 0.15, y: h * 0.7, w: 120, h: 16 },
        { x: w * 0.42, y: h * 0.55, w: 120, h: 16 },
        { x: w * 0.66, y: h * 0.4, w: 130, h: 16 },
        { x: w * 0.84, y: h * 0.26, w: 110, h: 16 },
      ];
      g.extra.flag = { x: w * 0.88, y: h * 0.26 - 60, w: 10, h: 56 };
      g.hero.x = w * 0.1; g.hero.y = h - 70;
      for (let i = 1; i < g.extra.platforms.length; i += 1) {
        const p = g.extra.platforms[i];
        g.items.push({ x: p.x + p.w / 2, y: p.y - 26, r: 12, taken: false, hue: pal[3], ph: rand(0, 6) });
      }
      g.target = g.items.length;
    }

    /* ----- shared movement for top-down modes ----- */
    function topDownMove(dt) {
      const sp = 0.34 * dt;
      if (isDown("arrowleft", "a")) g.hero.x -= sp;
      if (isDown("arrowright", "d")) g.hero.x += sp;
      if (isDown("arrowup", "w")) g.hero.y -= sp;
      if (isDown("arrowdown", "s")) g.hero.y += sp;
      g.hero.x = clamp(g.hero.x, 24, w - 24);
      g.hero.y = clamp(g.hero.y, 40, h - 30);
    }

    function endGame(won) {
      if (g.ended) return;
      g.ended = true;
      g.won = won;
      won ? Sound.win() : Sound.lose();
    }

    /* ----- update ----- */
    function update(dt) {
      if (g.ended) return;
      if (cfg.useTimer) {
        g.timeLeft -= dt / 1000;
        if (g.timeLeft <= 0) { g.timeLeft = 0; endGame(g.score >= g.target && mode === "space" ? true : false); if (mode !== "space") endGame(false); }
      }

      if (mode === "space" || mode === "adventure" || mode === "puzzle") {
        topDownMove(dt);
      }

      if (mode === "space") {
        g.items.forEach((it) => {
          if (it.taken) return;
          if (Math.hypot(it.x - g.hero.x, it.y - g.hero.y) < it.r + g.hero.r) {
            it.taken = true; g.score += 1; Sound.pickup();
            if (g.score >= g.target) endGame(true);
          }
        });
      } else if (mode === "adventure") {
        g.items.forEach((it) => {
          if (it.taken) return;
          if (Math.hypot(it.x - g.hero.x, it.y - g.hero.y) < it.r + g.hero.r) {
            it.taken = true; g.score += 1; Sound.pickup();
            if (g.score >= g.target) { g.extra.gate.open = true; }
          }
        });
        const gt = g.extra.gate;
        if (g.extra.gate.open && g.hero.x > gt.x - 30 && Math.abs(g.hero.y - gt.y) < gt.h / 2 + 20) {
          endGame(true);
        }
      } else if (mode === "puzzle") {
        g.items.forEach((it) => {
          if (it.taken) return;
          if (Math.hypot(it.x - g.hero.x, it.y - g.hero.y) < it.r + g.hero.r) {
            if (it.order === g.extra.next) {
              it.taken = true; g.extra.next += 1; g.score += 1; Sound.pickup();
              if (g.score >= g.target) endGame(true);
            } else {
              // wrong order: lose a life, reset sequence
              g.lives -= 1; Sound.hit();
              g.items.forEach((r) => { r.taken = false; });
              g.extra.next = 1; g.score = 0;
              if (g.lives <= 0) endGame(false);
            }
          }
        });
      } else if (mode === "race") {
        // hero steers left/right; world scrolls; dodge obstacles
        const sp = 0.4 * dt;
        if (isDown("arrowleft", "a")) g.hero.x -= sp;
        if (isDown("arrowright", "d")) g.hero.x += sp;
        g.hero.x = clamp(g.hero.x, 40, w - 40);
        g.extra.speed = clamp(g.extra.speed + dt * 0.0004, 2.4, 6);
        g.extra.dist += g.extra.speed * dt * 0.06;
        // spawn obstacles
        if (Math.random() < 0.03 + g.extra.dist / g.extra.finish * 0.04) {
          g.obstacles.push({ x: rand(50, w - 50), y: -30, w: rand(34, 64), h: 26, hue: cfg.character.colors[0] });
        }
        g.obstacles.forEach((o) => { o.y += g.extra.speed * dt * 0.16; });
        g.obstacles = g.obstacles.filter((o) => o.y < h + 40);
        for (const o of g.obstacles) {
          if (Math.abs(o.x - g.hero.x) < o.w / 2 + g.hero.r - 6 && Math.abs(o.y - g.hero.y) < o.h / 2 + g.hero.r - 6) {
            g.lives -= 1; Sound.hit(); o.y = h + 100;
            if (g.lives <= 0) { endGame(false); break; }
          }
        }
        g.score = Math.floor(g.extra.dist);
        if (g.extra.dist >= g.extra.finish) endGame(true);
      } else if (mode === "platform") {
        const sp = 0.3 * dt;
        if (isDown("arrowleft", "a")) g.hero.vx = -sp;
        else if (isDown("arrowright", "d")) g.hero.vx = sp;
        else g.hero.vx *= 0.7;
        if (isDown("arrowup", "w", " ") && g.hero.onGround) {
          g.hero.vy = -7.4; g.hero.onGround = false; Sound.jump();
        }
        g.hero.vy += 0.32 * (dt / 16);
        g.hero.x = clamp(g.hero.x + g.hero.vx, 20, w - 20);
        g.hero.y += g.hero.vy * (dt / 16);
        g.hero.onGround = false;
        for (const p of g.extra.platforms) {
          if (g.hero.x > p.x - 16 && g.hero.x < p.x + p.w + 16 &&
              g.hero.y >= p.y - 4 && g.hero.y <= p.y + 24 && g.hero.vy >= 0) {
            g.hero.y = p.y; g.hero.vy = 0; g.hero.onGround = true;
          }
        }
        if (g.hero.y > h + 60) { g.lives -= 1; Sound.hit(); g.hero.x = w * 0.1; g.hero.y = h - 70; g.hero.vy = 0; if (g.lives <= 0) endGame(false); }
        g.items.forEach((it) => {
          if (it.taken) return;
          if (Math.hypot(it.x - g.hero.x, it.y - g.hero.y) < it.r + g.hero.r) { it.taken = true; g.score += 1; Sound.pickup(); }
        });
        const f = g.extra.flag;
        if (g.score >= g.target && g.hero.x > f.x - 24 && g.hero.y < f.y + f.h + 20) endGame(true);
      }
    }

    /* ----- render ----- */
    function render(ctx, t) {
      paintBackground(ctx, w, h, pal, t);

      if (mode === "space" || mode === "adventure") {
        g.items.forEach((it) => {
          if (it.taken) return;
          const pulse = 1 + Math.sin(t / 200 + it.ph) * 0.12;
          ctx.save();
          ctx.translate(it.x, it.y);
          ctx.scale(pulse, pulse);
          ctx.fillStyle = it.hue;
          ctx.shadowColor = it.hue; ctx.shadowBlur = 14;
          ctx.beginPath();
          for (let i = 0; i < 10; i += 1) {
            const a = (Math.PI * 2 * i) / 10 - Math.PI / 2;
            const len = i % 2 === 0 ? it.r : it.r * 0.42;
            ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len);
          }
          ctx.closePath(); ctx.fill();
          ctx.restore();
        });
        if (mode === "adventure") {
          const gt = g.extra.gate;
          ctx.save();
          ctx.fillStyle = gt.open ? pal[2] : "rgba(255,255,255,0.18)";
          ctx.shadowColor = gt.open ? pal[2] : "transparent";
          ctx.shadowBlur = gt.open ? 24 : 0;
          roundRect(ctx, gt.x - gt.w / 2, gt.y - gt.h / 2, gt.w, gt.h, 10); ctx.fill();
          ctx.restore();
        }
      } else if (mode === "puzzle") {
        g.items.forEach((it) => {
          ctx.save();
          ctx.lineWidth = 6;
          ctx.strokeStyle = it.taken ? pal[3] : it.hue;
          ctx.globalAlpha = it.taken ? 1 : 0.6;
          if (it.taken) { ctx.shadowColor = pal[3]; ctx.shadowBlur = 18; }
          ctx.beginPath();
          ctx.arc(it.x, it.y, it.r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.shadowBlur = 0;
          ctx.fillStyle = "#f7fbff"; ctx.font = "bold 18px Rubik, sans-serif";
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText(String(it.order), it.x, it.y);
          ctx.restore();
        });
      } else if (mode === "race") {
        // road lines scroll
        ctx.save();
        ctx.strokeStyle = "rgba(255,255,255,0.4)";
        ctx.lineWidth = 5;
        ctx.setLineDash([26, 22]);
        ctx.lineDashOffset = -(g.extra.dist * 6) % 48;
        ctx.beginPath(); ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h); ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
        g.obstacles.forEach((o) => {
          ctx.save();
          ctx.fillStyle = o.hue;
          ctx.shadowColor = o.hue; ctx.shadowBlur = 14;
          roundRect(ctx, o.x - o.w / 2, o.y - o.h / 2, o.w, o.h, 7); ctx.fill();
          ctx.restore();
        });
      } else if (mode === "platform") {
        g.extra.platforms.forEach((p, i) => {
          ctx.save();
          ctx.fillStyle = i === 0 ? pal[1] : pal[2];
          ctx.shadowColor = pal[2]; ctx.shadowBlur = i === 0 ? 0 : 16;
          roundRect(ctx, p.x, p.y, p.w, p.h, 8); ctx.fill();
          ctx.restore();
        });
        g.items.forEach((it) => {
          if (it.taken) return;
          const pulse = 1 + Math.sin(t / 200 + it.ph) * 0.12;
          ctx.save(); ctx.translate(it.x, it.y); ctx.scale(pulse, pulse);
          ctx.fillStyle = it.hue; ctx.shadowColor = it.hue; ctx.shadowBlur = 14;
          ctx.beginPath();
          for (let i = 0; i < 10; i += 1) {
            const a = (Math.PI * 2 * i) / 10 - Math.PI / 2;
            const len = i % 2 === 0 ? it.r : it.r * 0.42;
            ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len);
          }
          ctx.closePath(); ctx.fill(); ctx.restore();
        });
        const f = g.extra.flag;
        ctx.save();
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.fillRect(f.x, f.y, 4, f.h);
        ctx.fillStyle = g.score >= g.target ? pal[3] : "rgba(255,255,255,0.4)";
        ctx.beginPath(); ctx.moveTo(f.x + 4, f.y); ctx.lineTo(f.x + 30, f.y + 12); ctx.lineTo(f.x + 4, f.y + 24); ctx.closePath(); ctx.fill();
        ctx.restore();
      }

      drawHero(ctx, g.hero.x, g.hero.y, heroColors, t);
    }

    return { g, update, render };
  }

  /* =====================================================================
   *  DETERMINISTIC "AI" GENERATOR — choices -> real game config
   * ===================================================================== */
  function buildConfig(sel) {
    const genre = sel.genre;
    const tuning = {
      space: { target: 10, time: 35, lives: 0, useTimer: true, goalText: (n) => `אספו ${n} כוכבים לפני שהזמן נגמר`, help: "השתמשו בחיצים כדי לאסוף את כל הכוכבים" },
      adventure: { target: 4, time: 0, lives: 0, useTimer: false, goalText: (n) => `מצאו ${n} מפתחות ופִּתחו את השער`, help: "אספו מפתחות, ואז הגיעו לשער המואר" },
      puzzle: { target: 5, time: 0, lives: 3, useTimer: false, goalText: (n) => `הדליקו ${n} טבעות לפי הסדר 1→${n}`, help: "געו בטבעות לפי המספרים בסדר עולה" },
      race: { target: 12, time: 0, lives: 3, useTimer: false, goalText: () => "התחמקו מהמכשולים והגיעו לקו הסיום", help: "חיצים שמאלה/ימינה כדי לעקוף מכשולים" },
      platform: { target: 4, time: 0, lives: 3, useTimer: false, goalText: () => "אספו את הכוכבים והגיעו לדגל", help: "חיצים לזוז, רווח/למעלה לקפוץ" },
    };
    const tune = tuning[genre.id] || tuning.space;
    return {
      genre,
      character: sel.character,
      world: sel.world,
      palette: sel.world.palette,
      idea: sel.idea,
      title: sel.title,
      target: tune.target,
      time: tune.time,
      lives: tune.lives,
      useTimer: tune.useTimer,
      goalText: tune.goalText(tune.target),
      help: tune.help,
    };
  }

  /* =====================================================================
   *  MODAL + LOOP
   * ===================================================================== */
  let modal, hud, overlay, mode, touchPad;

  function buildModal() {
    if (modal) return;
    modal = document.createElement("div");
    modal.className = "play-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", "משחק GameSpark");
    modal.hidden = true;
    modal.innerHTML = `
      <div class="play-backdrop" data-close></div>
      <div class="play-window">
        <div class="play-bar">
          <div class="play-info">
            <strong class="play-title">משחק</strong>
            <span class="play-goal"></span>
          </div>
          <div class="play-stats">
            <span class="play-stat play-score"><b>0</b><small>ניקוד</small></span>
            <span class="play-stat play-lives" hidden><b>3</b><small>חיים</small></span>
            <span class="play-stat play-timer" hidden><b>0</b><small>זמן</small></span>
          </div>
          <div class="play-actions">
            <button class="icon-button play-sound" type="button" aria-label="כבה או הפעל סאונד"><i data-lucide="volume-2"></i></button>
            <button class="icon-button play-restart" type="button" aria-label="התחל מחדש"><i data-lucide="rotate-ccw"></i></button>
            <button class="icon-button play-close" type="button" data-close aria-label="סגור משחק"><i data-lucide="x"></i></button>
          </div>
        </div>
        <div class="play-stage">
          <canvas class="play-canvas" width="960" height="560" aria-label="אזור המשחק"></canvas>
          <div class="play-overlay" hidden>
            <div class="play-overlay-card">
              <i class="play-overlay-icon" data-lucide="sparkles"></i>
              <h3 class="play-overlay-title">מוכנים?</h3>
              <p class="play-overlay-text"></p>
              <button class="primary-button play-overlay-btn" type="button"><i data-lucide="play"></i> שחקו</button>
            </div>
          </div>
          <div class="touch-pad" aria-hidden="true">
            <div class="touch-cluster">
              <button class="touch-btn" data-touch="arrowup" aria-label="למעלה"><i data-lucide="chevron-up"></i></button>
              <div class="touch-row">
                <button class="touch-btn" data-touch="arrowleft" aria-label="שמאלה"><i data-lucide="chevron-right"></i></button>
                <button class="touch-btn" data-touch="arrowdown" aria-label="למטה"><i data-lucide="chevron-down"></i></button>
                <button class="touch-btn" data-touch="arrowright" aria-label="ימינה"><i data-lucide="chevron-left"></i></button>
              </div>
            </div>
            <button class="touch-btn touch-jump" data-touch=" " aria-label="קפיצה / פעולה"><i data-lucide="rocket"></i></button>
          </div>
        </div>
        <p class="play-help"></p>
      </div>`;
    document.body.appendChild(modal);

    overlay = modal.querySelector(".play-overlay");
    touchPad = modal.querySelector(".touch-pad");
    hud = {
      title: modal.querySelector(".play-title"),
      goal: modal.querySelector(".play-goal"),
      score: modal.querySelector(".play-score b"),
      lives: modal.querySelector(".play-lives"),
      livesVal: modal.querySelector(".play-lives b"),
      timer: modal.querySelector(".play-timer"),
      timerVal: modal.querySelector(".play-timer b"),
      help: modal.querySelector(".play-help"),
      overlayTitle: modal.querySelector(".play-overlay-title"),
      overlayText: modal.querySelector(".play-overlay-text"),
      overlayIcon: modal.querySelector(".play-overlay-icon"),
      overlayBtn: modal.querySelector(".play-overlay-btn"),
    };
    state.canvas = modal.querySelector(".play-canvas");
    state.ctx = state.canvas.getContext("2d");

    modal.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", close));
    modal.querySelector(".play-restart").addEventListener("click", () => start(state.cfg));
    modal.querySelector(".play-sound").addEventListener("click", (e) => {
      const muted = !Sound.isMuted();
      Sound.setMuted(muted);
      e.currentTarget.innerHTML = `<i data-lucide="${muted ? "volume-x" : "volume-2"}"></i>`;
      window.lucide?.createIcons();
    });
    hud.overlayBtn.addEventListener("click", () => {
      if (overlay.dataset.action === "play") { overlay.hidden = true; runLoop(); }
      else if (overlay.dataset.action === "again") start(state.cfg);
      else if (overlay.dataset.action === "next") { close(); document.querySelector("#studio")?.scrollIntoView({ behavior: "smooth" }); }
    });

    // touch buttons
    touchPad.querySelectorAll("[data-touch]").forEach((btn) => {
      const name = btn.dataset.touch;
      const on = (e) => { e.preventDefault(); touch[name] = true; };
      const off = (e) => { e.preventDefault(); touch[name] = false; };
      btn.addEventListener("touchstart", on, { passive: false });
      btn.addEventListener("touchend", off, { passive: false });
      btn.addEventListener("touchcancel", off, { passive: false });
      btn.addEventListener("mousedown", on);
      btn.addEventListener("mouseup", off);
      btn.addEventListener("mouseleave", off);
    });

    window.addEventListener("keydown", onModalKeys);
  }

  function onModalKeys(e) {
    if (modal.hidden) return;
    if (e.key === "Escape") close();
    if (e.key.toLowerCase() === "r") start(state.cfg);
  }

  function fitCanvas() {
    const rect = state.canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    state.canvas.width = Math.max(1, Math.floor(rect.width * ratio));
    state.canvas.height = Math.max(1, Math.floor(rect.height * ratio));
    state.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    state.dpW = rect.width;
    state.dpH = rect.height;
  }

  function showOverlay(action, icon, title, text, btnLabel) {
    overlay.dataset.action = action;
    hud.overlayIcon.setAttribute("data-lucide", icon);
    hud.overlayTitle.textContent = title;
    hud.overlayText.textContent = text;
    hud.overlayBtn.innerHTML = `<i data-lucide="${action === "next" ? "arrow-left" : "play"}"></i> ${btnLabel}`;
    overlay.hidden = false;
    window.lucide?.createIcons();
  }

  function start(cfg) {
    state.cfg = cfg;
    fitCanvas();
    mode = makeMode(cfg, state.dpW, state.dpH);
    hud.title.textContent = cfg.title;
    hud.goal.textContent = cfg.goalText;
    hud.help.textContent = cfg.help + " · ESC לסגירה · R להתחלה מחדש";
    hud.score.textContent = "0";
    if (cfg.lives > 0) { hud.lives.hidden = false; hud.livesVal.textContent = cfg.lives; } else hud.lives.hidden = true;
    if (cfg.useTimer) { hud.timer.hidden = false; hud.timerVal.textContent = Math.ceil(cfg.time); } else hud.timer.hidden = true;
    cancelAnimationFrame(state.raf);
    state.running = false;
    showOverlay("play", "sparkles", "מוכנים לשחק?", cfg.goalText, "שחקו");
  }

  function runLoop() {
    state.running = true;
    state.last = performance.now();
    const loop = (now) => {
      if (!state.running) return;
      let dt = now - state.last;
      state.last = now;
      dt = clamp(dt, 0, 50);
      state.t = now;
      mode.update(dt);
      mode.render(state.ctx, now);

      // HUD sync
      hud.score.textContent = mode.g.score;
      if (state.cfg.lives > 0) hud.livesVal.textContent = Math.max(0, mode.g.lives);
      if (state.cfg.useTimer) hud.timerVal.textContent = Math.ceil(mode.g.timeLeft);

      if (mode.g.ended) {
        state.running = false;
        if (mode.g.won) {
          showOverlay("next", "party-popper", "כל הכבוד! ניצחתם 🎉", `סיימתם את "${state.cfg.title}". רוצים ליצור משחק חדש?`, "צרו משחק חדש");
        } else {
          showOverlay("again", "rotate-ccw", "כמעט! נסו שוב", "התקרבתם למטרה. עוד ניסיון אחד ותצליחו!", "שחקו שוב");
        }
        return;
      }
      state.raf = requestAnimationFrame(loop);
    };
    state.raf = requestAnimationFrame(loop);
  }

  function launch(selection) {
    buildModal();
    const cfg = buildConfig(selection);
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => { window.lucide?.createIcons(); start(cfg); });
  }

  function close() {
    state.running = false;
    cancelAnimationFrame(state.raf);
    if (modal) modal.hidden = true;
    document.body.style.overflow = "";
  }

  window.addEventListener("resize", () => {
    if (modal && !modal.hidden && state.cfg) { fitCanvas(); }
  });

  window.GameSpark = { launch, close, Sound };
})();
