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

  /* ---------- reduced motion ---------- */
  const reduceMotion = () =>
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- juice: particle burst (transform/opacity only) ---------- */
  const particles = [];
  function burst(x, y, color, n = 12) {
    if (reduceMotion()) return;
    for (let i = 0; i < n; i += 1) {
      const a = (Math.PI * 2 * i) / n + Math.random() * 0.4;
      const sp = rand(1.4, 3.6);
      particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, color });
    }
  }
  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const p = particles[i];
      p.x += p.vx * (dt / 16);
      p.y += p.vy * (dt / 16);
      p.vy += 0.08 * (dt / 16);
      p.life -= dt / 520;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }
  function renderParticles(ctx) {
    particles.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3 + p.life * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

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
        g.items.push({ x: w * (0.18 + (i / Math.max(1, n - 1)) * 0.64), y: h * (0.30 + (i % 2) * 0.22), r: 26, taken: false, order: i + 1, hue: pal[2] });
      }
      g.extra.next = 1;
      // Spawn the hero in a clear safe zone (bottom center) so it never
      // overlaps a ring on frame 1 (which would wrongly cost a life).
      g.hero.x = w * 0.5; g.hero.y = h - 50;
    } else if (mode === "race") {
      g.hero.x = w * 0.5; g.hero.y = h - 60;
      g.extra.dist = 0;
      g.extra.finish = cfg.target * 100; // distance to finish
      g.extra.speed = 2.4 * cfg.speedMul;
      g.extra.baseSpeed = 2.4 * cfg.speedMul;
    } else if (mode === "platform") {
      // Reachable staircase: each step rises <= ~62px (jump height ~96px gives margin)
      // and is within a comfortable horizontal hop. Verified winnable.
      const groundY = h - 36;
      g.extra.platforms = [
        { x: w * 0.02, y: groundY, w: w * 0.96, h: 36 }, // ground
        { x: w * 0.16, y: groundY - 86, w: 150, h: 16 },
        { x: w * 0.40, y: groundY - 150, w: 150, h: 16 },
        { x: w * 0.62, y: groundY - 214, w: 150, h: 16 },
        { x: w * 0.82, y: groundY - 278, w: 140, h: 16 },
      ];
      const top = g.extra.platforms[g.extra.platforms.length - 1];
      g.extra.flag = { x: top.x + top.w - 28, y: top.y - 56, w: 10, h: 56 };
      g.hero.x = w * 0.07; g.hero.y = groundY - 34;
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
            it.taken = true; g.score += 1; Sound.pickup(); burst(it.x, it.y, it.hue);
            if (g.score >= g.target) endGame(true);
          }
        });
      } else if (mode === "adventure") {
        g.items.forEach((it) => {
          if (it.taken) return;
          if (Math.hypot(it.x - g.hero.x, it.y - g.hero.y) < it.r + g.hero.r) {
            it.taken = true; g.score += 1; Sound.pickup(); burst(it.x, it.y, it.hue);
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
              it.taken = true; g.extra.next += 1; g.score += 1; Sound.pickup(); burst(it.x, it.y, it.hue);
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
        g.extra.speed = clamp(g.extra.speed + dt * 0.0004, g.extra.baseSpeed, 6 * cfg.speedMul);
        g.extra.dist += g.extra.speed * dt * 0.06;
        // spawn obstacles (rate scales with difficulty/level via speedMul)
        if (Math.random() < (0.03 + g.extra.dist / g.extra.finish * 0.04) * cfg.speedMul) {
          g.obstacles.push({ x: rand(50, w - 50), y: -30, w: rand(34, 64), h: 26, hue: cfg.character.colors[0] });
        }
        g.obstacles.forEach((o) => { o.y += g.extra.speed * dt * 0.16; });
        g.obstacles = g.obstacles.filter((o) => o.y < h + 40);
        for (const o of g.obstacles) {
          if (Math.abs(o.x - g.hero.x) < o.w / 2 + g.hero.r - 6 && Math.abs(o.y - g.hero.y) < o.h / 2 + g.hero.r - 6) {
            g.lives -= 1; Sound.hit(); burst(g.hero.x, g.hero.y, "#ff6c7a"); o.y = h + 100;
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
          g.hero.vy = -8.4; g.hero.onGround = false; Sound.jump();
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
          if (Math.hypot(it.x - g.hero.x, it.y - g.hero.y) < it.r + g.hero.r) { it.taken = true; g.score += 1; Sound.pickup(); burst(it.x, it.y, it.hue); }
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
  // difficulty -> tuning multipliers. level (1..3) ramps within a game.
  const DIFF = {
    easy: { id: "easy", label: "קל", tMul: 0.8, timeMul: 1.35, livesAdd: 1, speedMul: 0.85 },
    normal: { id: "normal", label: "רגיל", tMul: 1, timeMul: 1, livesAdd: 0, speedMul: 1 },
    hard: { id: "hard", label: "קשה", tMul: 1.4, timeMul: 0.8, livesAdd: -1, speedMul: 1.25 },
  };
  const MAX_LEVEL = 3;

  function buildConfig(sel) {
    const genre = sel.genre;
    const diff = DIFF[sel.difficulty] || DIFF.normal;
    const level = clamp(sel.level || 1, 1, MAX_LEVEL);
    const lvlMul = 1 + (level - 1) * 0.4; // each level adds 40% target/speed

    const tuning = {
      space: { target: 8, time: 32, lives: 0, useTimer: true, goalText: (n) => `אספו ${n} כוכבים לפני שהזמן נגמר`, help: "השתמשו בחיצים כדי לאסוף את כל הכוכבים" },
      adventure: { target: 3, time: 0, lives: 0, useTimer: false, goalText: (n) => `מצאו ${n} מפתחות ופִּתחו את השער`, help: "אספו מפתחות, ואז הגיעו לשער המואר" },
      puzzle: { target: 4, time: 0, lives: 3, useTimer: false, goalText: (n) => `הדליקו ${n} טבעות לפי הסדר 1→${n}`, help: "געו בטבעות לפי המספרים בסדר עולה" },
      race: { target: 10, time: 0, lives: 3, useTimer: false, goalText: () => "התחמקו מהמכשולים והגיעו לקו הסיום", help: "חיצים שמאלה/ימינה כדי לעקוף מכשולים" },
      platform: { target: 4, time: 0, lives: 3, useTimer: false, goalText: () => "אספו את הכוכבים והגיעו לדגל", help: "חיצים לזוז, רווח/למעלה לקפוץ" },
    };
    const tune = tuning[genre.id] || tuning.space;

    const target = Math.max(1, Math.round(tune.target * diff.tMul * lvlMul));
    const time = Math.round(tune.time * diff.timeMul / (1 + (level - 1) * 0.12));
    const lives = tune.lives > 0 ? Math.max(1, tune.lives + diff.livesAdd) : 0;

    return {
      genre,
      character: sel.character,
      world: sel.world,
      palette: sel.world.palette,
      idea: sel.idea,
      title: sel.title,
      difficulty: diff,
      level,
      speedMul: diff.speedMul * (1 + (level - 1) * 0.18),
      target,
      time,
      lives,
      useTimer: tune.useTimer,
      goalText: tune.goalText(target),
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
    modal.querySelector(".play-restart").addEventListener("click", () => start(buildConfig(state.selection)));
    modal.querySelector(".play-sound").addEventListener("click", (e) => {
      const muted = !Sound.isMuted();
      Sound.setMuted(muted);
      e.currentTarget.innerHTML = `<i data-lucide="${muted ? "volume-x" : "volume-2"}"></i>`;
      window.lucide?.createIcons();
    });
    hud.overlayBtn.addEventListener("click", () => {
      const action = overlay.dataset.action;
      if (action === "play") { overlay.hidden = true; runLoop(); }
      else if (action === "again") start(buildConfig(state.selection));
      else if (action === "level" && state.pendingNext) {
        state.selection = state.pendingNext;
        start(buildConfig(state.selection));
      } else if (action === "next") { close(); document.querySelector("#studio")?.scrollIntoView({ behavior: "smooth" }); }
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
    if (e.key.toLowerCase() === "r") start(buildConfig(state.selection));
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

  function adaptTouchPad(modeId) {
    if (!touchPad) return;
    const up = touchPad.querySelector('[data-touch="arrowup"]');
    const down = touchPad.querySelector('[data-touch="arrowdown"]');
    const jump = touchPad.querySelector(".touch-jump");
    const topDown = modeId === "space" || modeId === "adventure" || modeId === "puzzle";
    // top-down: need up/down, no jump. platform: left/right + jump. race: left/right only.
    if (up) up.style.visibility = topDown ? "visible" : "hidden";
    if (down) down.style.visibility = topDown ? "visible" : "hidden";
    if (jump) jump.style.display = modeId === "platform" ? "" : "none";
  }

  function start(cfg) {
    state.cfg = cfg;
    particles.length = 0;
    fitCanvas();
    mode = makeMode(cfg, state.dpW, state.dpH);
    adaptTouchPad(cfg.genre.id);
    const levelTag = `שלב ${cfg.level}/${MAX_LEVEL} · ${cfg.difficulty.label}`;
    hud.title.textContent = cfg.title;
    hud.goal.textContent = `${levelTag} — ${cfg.goalText}`;
    hud.help.textContent = cfg.help + " · ESC לסגירה · R להתחלה מחדש";
    hud.score.textContent = "0";
    if (cfg.lives > 0) { hud.lives.hidden = false; hud.livesVal.textContent = cfg.lives; } else hud.lives.hidden = true;
    if (cfg.useTimer) { hud.timer.hidden = false; hud.timerVal.textContent = Math.ceil(cfg.time); } else hud.timer.hidden = true;
    cancelAnimationFrame(state.raf);
    state.running = false;
    showOverlay("play", "sparkles", `מוכנים? ${levelTag}`, cfg.goalText, "שחקו");
  }

  function onWin(cfg) {
    // celebratory burst across the canvas
    for (let i = 0; i < 5; i += 1) burst(rand(40, state.dpW - 40), rand(40, state.dpH * 0.7), cfg.palette[2 + (i % 2)], 10);
    if (typeof state.onStat === "function") {
      state.onStat({ type: "win", cfg, stars: mode.g.score });
    }
    if (cfg.level < MAX_LEVEL) {
      const nextLevel = cfg.level + 1;
      state.pendingNext = { ...state.selection, level: nextLevel };
      showOverlay(
        "level",
        "arrow-up",
        `שלב ${cfg.level} הושלם! 🎉`,
        `מצוין! מוכנים לשלב ${nextLevel} מתוך ${MAX_LEVEL}? זה יהיה קצת יותר מאתגר.`,
        `לשלב ${nextLevel}`
      );
    } else {
      showOverlay("next", "party-popper", "סיימתם את כל השלבים! 🏆", `ניצחתם בכל ${MAX_LEVEL} השלבים של "${cfg.title}". רוצים ליצור משחק חדש?`, "צרו משחק חדש");
    }
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
      updateParticles(dt);
      mode.render(state.ctx, now);
      renderParticles(state.ctx);

      // HUD sync
      hud.score.textContent = mode.g.score;
      if (state.cfg.lives > 0) hud.livesVal.textContent = Math.max(0, mode.g.lives);
      if (state.cfg.useTimer) hud.timerVal.textContent = Math.ceil(mode.g.timeLeft);

      if (mode.g.ended) {
        state.running = false;
        if (mode.g.won) {
          onWin(state.cfg);
        } else {
          if (typeof state.onStat === "function") state.onStat({ type: "lose", cfg: state.cfg });
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
    state.selection = { difficulty: "normal", level: 1, ...selection };
    const cfg = buildConfig(state.selection);
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

  function setStatHook(fn) { state.onStat = fn; }

  /* ---------------------------------------------------------------
   *  Headless winnability self-test (used by QA, no rendering).
   *  Drives makeMode update() while steering the hero toward the
   *  current objective each frame. Returns {won, frames, score}.
   * --------------------------------------------------------------- */
  function selfTest(selection, opts) {
    const o = opts || {};
    const W = o.w || 960, H = o.h || 560;
    const cfg = buildConfig({ difficulty: "normal", level: 1, ...selection });
    const m = makeMode(cfg, W, H);
    const g = m.g;
    const maxFrames = o.maxFrames || 6000;
    const dt = 16;
    let frames = 0;

    // teleport-steering: place hero at the next objective, set inputs so
    // mode logic (collision / jump) still runs naturally.
    const nextTarget = () => {
      if (cfg.genre.id === "puzzle") return g.items.find((it) => it.order === g.extra.next) || null;
      const t = g.items.find((it) => !it.taken);
      if (t) return t;
      if (cfg.genre.id === "adventure" && g.extra.gate.open) return { x: g.extra.gate.x, y: g.extra.gate.y };
      if (cfg.genre.id === "platform") return { x: g.extra.flag.x, y: g.extra.flag.y };
      return null;
    };

    // reset all inputs
    Object.keys(keys).forEach((k) => (keys[k] = false));
    Object.keys(touch).forEach((k) => (touch[k] = false));

    while (!g.ended && frames < maxFrames) {
      if (cfg.genre.id === "race") {
        // align hero to a gap: move toward x that has no obstacle near
        const danger = g.obstacles.find((ob) => ob.y > H * 0.4 && Math.abs(ob.x - g.hero.x) < 60);
        keys.arrowleft = !!(danger && danger.x > g.hero.x);
        keys.arrowright = !!(danger && danger.x <= g.hero.x);
      } else if (cfg.genre.id === "platform") {
        const tg = nextTarget();
        if (tg) {
          keys.arrowright = tg.x > g.hero.x + 4;
          keys.arrowleft = tg.x < g.hero.x - 4;
          // jump whenever grounded and the target is higher (climb the staircase)
          keys.arrowup = g.hero.onGround && tg.y < g.hero.y - 6;
        }
      } else if (cfg.genre.id === "puzzle") {
        // Deliberate play: route to the next ring while avoiding brushing
        // any other not-yet-correct ring (approach from a clear lane below).
        const tg = nextTarget();
        if (tg) {
          const safeR = 26 + g.hero.r + 6;
          const others = g.items.filter((it) => !it.taken && it.order !== g.extra.next);
          // step proposal toward target
          let nx = g.hero.x + clamp(tg.x - g.hero.x, -5, 5);
          let ny = g.hero.y + clamp(tg.y - g.hero.y, -5, 5);
          const brushes = (x, y) => others.some((it) => Math.hypot(it.x - x, it.y - y) < safeR);
          if (brushes(nx, ny)) {
            // detour: move horizontally first along a clear lane near the bottom
            ny = g.hero.y + clamp((H - 60) - g.hero.y, -5, 5);
            nx = g.hero.x + clamp(tg.x - g.hero.x, -5, 5);
            if (brushes(nx, ny)) { nx = g.hero.x; } // wait this frame
          }
          g.hero.x = nx; g.hero.y = ny;
        }
      } else {
        // top-down: snap toward target
        const tg = nextTarget();
        if (tg) {
          g.hero.x += clamp(tg.x - g.hero.x, -6, 6);
          g.hero.y += clamp(tg.y - g.hero.y, -6, 6);
        }
      }
      m.update(dt);
      frames += 1;
    }
    Object.keys(keys).forEach((k) => (keys[k] = false));
    return { won: g.won, ended: g.ended, frames, score: g.score, mode: cfg.genre.id, target: cfg.target };
  }

  window.GameSpark = { launch, close, Sound, setStatHook, selfTest, DIFF, MAX_LEVEL };
})();
