const genres = [
  { id: "space", label: "חלל", icon: "rocket", mechanic: "איסוף כוכבים", goal: "אספו 12 כוכבים" },
  { id: "adventure", label: "הרפתקה", icon: "compass", mechanic: "פתיחת שערים", goal: "מצאו 4 מפתחות" },
  { id: "puzzle", label: "פאזל", icon: "puzzle", mechanic: "חיבור מסלולים", goal: "פתרו 6 חידות" },
  { id: "race", label: "מירוץ", icon: "gauge", mechanic: "עקיפת מכשולים", goal: "סיימו לפני הזמן" },
  { id: "platform", label: "פלטפורמה", icon: "blocks", mechanic: "קפיצות מדויקות", goal: "הגיעו לדגל" },
];

const characters = [
  { id: "mika", label: "מיקה", colors: ["#ff4fa3", "#ffd15c", "#28f3e4"] },
  { id: "noam", label: "נועם", colors: ["#79ffb0", "#28f3e4", "#a987ff"] },
  { id: "raya", label: "ריה", colors: ["#ffd15c", "#ff6c7a", "#b9f35b"] },
  { id: "ziv", label: "זיו", colors: ["#a987ff", "#28f3e4", "#ff4fa3"] },
];

const worlds = [
  {
    id: "station",
    label: "תחנת חלל",
    palette: ["#101f3d", "#233b77", "#28f3e4", "#ffd15c"],
    swatch: "linear-gradient(135deg, #101f3d, #28f3e4 60%, #ffd15c)",
  },
  {
    id: "forest",
    label: "יער קסום",
    palette: ["#0d281d", "#146b4a", "#79ffb0", "#ffdc6c"],
    swatch: "linear-gradient(135deg, #0d281d, #146b4a 55%, #79ffb0)",
  },
  {
    id: "city",
    label: "עיר עתידנית",
    palette: ["#161626", "#28335f", "#ff4fa3", "#28f3e4"],
    swatch: "linear-gradient(135deg, #161626, #ff4fa3 48%, #28f3e4)",
  },
  {
    id: "ocean",
    label: "ממלכת ים",
    palette: ["#052033", "#056b8a", "#28f3e4", "#79ffb0"],
    swatch: "linear-gradient(135deg, #052033, #056b8a 52%, #79ffb0)",
  },
  {
    id: "castle",
    label: "טירת עננים",
    palette: ["#20152e", "#614177", "#ffd15c", "#f7fbff"],
    swatch: "linear-gradient(135deg, #20152e, #614177 55%, #ffd15c)",
  },
];

const ideas = [
  "משחק חלל שבו ילדה אוספת כוכבים לפני שהזמן נגמר",
  "משחק יער שבו רובוט קטן מחזיר צבעים לעצים",
  "מירוץ רחפנים בעיר עתידנית עם שערים זוהרים",
  "פאזל בממלכת ים שבו מחברים זרמי מים כדי להציל אלמוגים",
  "משחק טירה שבו קופצים בין עננים ומוצאים מפתחות קסם",
];

const galleryItems = [
  {
    title: "מסע הכוכבים של מיקה",
    creator: "יעל, 10",
    genre: "חלל",
    bg: "linear-gradient(180deg, #101f3d 0 58%, #0c5a68 58%)",
    sprite: "linear-gradient(180deg, #ff4fa3, #ffd15c 52%, #28f3e4)",
  },
  {
    title: "יער הרובוטים",
    creator: "אורי, 9",
    genre: "הרפתקה",
    bg: "linear-gradient(180deg, #102b24 0 52%, #17744f 52%)",
    sprite: "linear-gradient(180deg, #79ffb0, #28f3e4 54%, #a987ff)",
  },
  {
    title: "מירוץ ניאון",
    creator: "דניאל, 12",
    genre: "מירוץ",
    bg: "linear-gradient(180deg, #161626 0 48%, #432153 48%, #1c7080 80%)",
    sprite: "linear-gradient(180deg, #ffd15c, #ff4fa3 52%, #28f3e4)",
  },
  {
    title: "חידת האלמוגים",
    creator: "נועה, 11",
    genre: "פאזל",
    bg: "linear-gradient(180deg, #052033 0 58%, #056b8a 58%)",
    sprite: "linear-gradient(180deg, #28f3e4, #79ffb0 58%, #f7fbff)",
  },
  {
    title: "טירת העננים",
    creator: "איתמר, 8",
    genre: "פלטפורמה",
    bg: "linear-gradient(180deg, #20152e 0 56%, #614177 56%)",
    sprite: "linear-gradient(180deg, #a987ff, #ffd15c 52%, #f7fbff)",
  },
  {
    title: "שערי הזמן",
    creator: "מאיה, 13",
    genre: "הרפתקה",
    bg: "linear-gradient(180deg, #171a32 0 45%, #60447e 45%, #2a866f 82%)",
    sprite: "linear-gradient(180deg, #ff6c7a, #ffd15c 54%, #b9f35b)",
  },
];

const difficulties = [
  { id: "easy", label: "קל", icon: "smile", note: "לראשונים" },
  { id: "normal", label: "רגיל", icon: "meh", note: "מאוזן" },
  { id: "hard", label: "קשה", icon: "flame", note: "לאלופים" },
];

const state = {
  genre: genres[0],
  character: characters[0],
  world: worlds[0],
  idea: ideas[0],
  difficulty: difficulties[1],
  building: false,
  createdCount: 0,
};

/* ---------------- localStorage: my games + stats (no backend, no PII) ---------------- */
const STORE_KEY = "gamespark.v1";
function loadStore() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    const data = raw ? JSON.parse(raw) : null;
    return data && typeof data === "object"
      ? { games: Array.isArray(data.games) ? data.games : [], stats: data.stats || {} }
      : { games: [], stats: {} };
  } catch (e) {
    return { games: [], stats: {} };
  }
}
function saveStore(store) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) { /* quota / private mode */ }
}
let store = loadStore();

function statBump(key, by = 1) {
  store.stats[key] = (store.stats[key] || 0) + by;
  saveStore(store);
  renderStats();
}

// normalize: selection.difficulty may be an id string or an object
function diffId(sel) {
  return typeof sel.difficulty === "string" ? sel.difficulty : (sel.difficulty && sel.difficulty.id) || "normal";
}

// Save a created game (dedupe by genre+character+world+idea+difficulty)
function rememberGame(sel) {
  const sig = `${sel.genre.id}|${sel.character.id}|${sel.world.id}|${diffId(sel)}|${sel.idea}`;
  if (store.games.some((g) => g.sig === sig)) return;
  store.games.unshift({
    sig,
    title: sel.title,
    idea: sel.idea,
    genreId: sel.genre.id,
    characterId: sel.character.id,
    worldId: sel.world.id,
    difficultyId: diffId(sel),
    ts: Date.now(),
  });
  store.games = store.games.slice(0, 12); // keep the latest 12
  saveStore(store);
  renderMyGames();
}

// Reconstruct a launch selection from a stored / shared record
function selectionFromRecord(rec) {
  const genre = genres.find((g) => g.id === rec.genreId) || genres[0];
  const character = characters.find((c) => c.id === rec.characterId) || characters[0];
  const world = worlds.find((w) => w.id === rec.worldId) || worlds[0];
  const difficulty = difficulties.find((d) => d.id === rec.difficultyId) || difficulties[1];
  const idea = rec.idea || rec.title || "המשחק שלי";
  return { genre, character, world, difficulty: difficulty.id, idea, title: rec.title || titleFromIdea(idea) };
}

/* ---------------- share via URL hash (#play=<base64>) ---------------- */
function encodeSelection(sel) {
  const payload = { g: sel.genre.id, c: sel.character.id, w: sel.world.id, d: diffId(sel), i: sel.idea, t: sel.title };
  try { return btoa(unescape(encodeURIComponent(JSON.stringify(payload)))); } catch (e) { return ""; }
}
function decodeSelection(code) {
  try {
    const p = JSON.parse(decodeURIComponent(escape(atob(code))));
    return selectionFromRecord({ genreId: p.g, characterId: p.c, worldId: p.w, difficultyId: p.d, idea: p.i, title: p.t });
  } catch (e) { return null; }
}

const $ = (selector) => document.querySelector(selector);

const elements = {
  ideaInput: $("#ideaInput"),
  genreOptions: $("#genreOptions"),
  difficultyOptions: $("#difficultyOptions"),
  characterOptions: $("#characterOptions"),
  worldOptions: $("#worldOptions"),
  myGames: $("#myGames"),
  myGamesEmpty: $("#myGamesEmpty"),
  statCreated: $("#statCreated"),
  statWon: $("#statWon"),
  statStars: $("#statStars"),
  shareGame: $("#shareGame"),
  previewTitle: $("#previewTitle"),
  hudGenre: $("#hudGenre"),
  hudGoal: $("#hudGoal"),
  hudTimer: $("#hudTimer"),
  hudIdea: $("#hudIdea"),
  selectedCharacter: $("#selectedCharacter"),
  selectedWorld: $("#selectedWorld"),
  selectedMechanic: $("#selectedMechanic"),
  createGame: $("#createGame"),
  buildStatus: $("#buildStatus"),
  aiThinking: $("#aiThinking"),
  randomIdea: $("#randomIdea"),
  gallery: $("#gameGallery"),
  soundToggle: $("#soundToggle"),
  menuToggle: $("#menuToggle"),
  mobileNav: $("#mobileNav"),
  canvas: $("#gameCanvas"),
};

const context = elements.canvas.getContext("2d");
let time = 0;

function icon(name) {
  return `<i data-lucide="${name}" aria-hidden="true"></i>`;
}

function renderOptions() {
  elements.genreOptions.innerHTML = genres
    .map(
      (genre) => `
        <button class="option-button ${genre.id === state.genre.id ? "is-active" : ""}" type="button" data-genre="${genre.id}">
          ${icon(genre.icon)}
          <span>${genre.label}</span>
        </button>
      `
    )
    .join("");

  elements.characterOptions.innerHTML = characters
    .map(
      (character) => `
        <button class="avatar-button ${character.id === state.character.id ? "is-active" : ""}" type="button" data-character="${character.id}">
          <span class="avatar-sprite" style="background: linear-gradient(180deg, ${character.colors[0]}, ${character.colors[1]} 52%, ${character.colors[2]});"></span>
          <span>${character.label}</span>
        </button>
      `
    )
    .join("");

  elements.worldOptions.innerHTML = worlds
    .map(
      (world) => `
        <button class="world-button ${world.id === state.world.id ? "is-active" : ""}" type="button" data-world="${world.id}">
          <span>${world.label}</span>
          <span class="world-swatch" style="background: ${world.swatch};"></span>
        </button>
      `
    )
    .join("");

  if (elements.difficultyOptions) {
    elements.difficultyOptions.innerHTML = difficulties
      .map(
        (d) => `
        <button class="option-button diff-button ${d.id === state.difficulty.id ? "is-active" : ""}" type="button" data-difficulty="${d.id}">
          ${icon(d.icon)}
          <span>${d.label}</span>
          <small>${d.note}</small>
        </button>
      `
      )
      .join("");
  }

  window.lucide?.createIcons();
}

function renderStats() {
  if (!elements.statCreated) return;
  elements.statCreated.textContent = store.stats.created || 0;
  elements.statWon.textContent = store.stats.won || 0;
  elements.statStars.textContent = store.stats.stars || 0;
}

function renderMyGames() {
  if (!elements.myGames) return;
  if (!store.games.length) {
    elements.myGames.innerHTML = "";
    if (elements.myGamesEmpty) elements.myGamesEmpty.hidden = false;
    return;
  }
  if (elements.myGamesEmpty) elements.myGamesEmpty.hidden = true;
  const labelOf = (arr, id, key = "label") => (arr.find((x) => x.id === id) || arr[0])[key];
  // The card SKELETON is markup we control; the child's own title/idea are text,
  // never markup, so they go in with textContent (same as the preview does above).
  elements.myGames.innerHTML = store.games
    .map((g, index) => {
      const world = worlds.find((w) => w.id === g.worldId) || worlds[0];
      const genreLabel = labelOf(genres, g.genreId);
      const diffLabel = labelOf(difficulties, g.difficultyId);
      return `
        <article class="game-card mine reveal" style="animation-delay:${index * 45}ms;">
          <div class="game-art" style="--art-bg:${world.swatch}; --sprite-bg:${world.swatch}; --sprite-x:${30 + (index % 3) * 20}%;"></div>
          <h3 class="mine-title"></h3>
          <p class="mine-idea"></p>
          <div class="game-tags"><span>${genreLabel}</span><span>${diffLabel}</span></div>
          <div class="mine-actions">
            <button class="primary-button wide my-play" type="button" data-my-play="${index}">${icon("play")} שחקו</button>
            <button class="icon-button my-share" type="button" data-my-share="${index}" aria-label="שתפו את המשחק">${icon("share-2")}</button>
            <button class="icon-button my-del" type="button" data-my-del="${index}" aria-label="מחקו מהרשימה">${icon("trash-2")}</button>
          </div>
        </article>`;
    })
    .join("");
  elements.myGames.querySelectorAll(".game-card.mine").forEach((card, index) => {
    const g = store.games[index];
    if (!g) return;
    card.querySelector(".mine-title").textContent = g.title;
    card.querySelector(".mine-idea").textContent = g.idea;
  });
  window.lucide?.createIcons();
}

async function shareSelection(sel, anchorBtn) {
  const code = encodeSelection(sel);
  const url = `${location.origin}${location.pathname}#play=${code}`;
  let copied = false;
  try {
    if (navigator.share) { await navigator.share({ title: sel.title, text: `שחקו במשחק שיצרתי: ${sel.title}`, url }); copied = true; }
    else if (navigator.clipboard) { await navigator.clipboard.writeText(url); copied = true; }
  } catch (e) { /* user cancelled share */ }
  if (!copied) {
    try { await navigator.clipboard.writeText(url); copied = true; } catch (e) { /* ignore */ }
  }
  if (anchorBtn) {
    const original = anchorBtn.innerHTML;
    anchorBtn.innerHTML = `${icon("check")} הקישור הועתק`;
    window.lucide?.createIcons();
    setTimeout(() => { anchorBtn.innerHTML = original; window.lucide?.createIcons(); }, 1800);
  }
  return url;
}

// Map each gallery item's Hebrew genre label back to a real genre/world/character
const genreByLabel = Object.fromEntries(genres.map((gn) => [gn.label, gn]));
const galleryConfig = [
  { genre: "חלל", world: "station", character: "mika" },
  { genre: "הרפתקה", world: "forest", character: "noam" },
  { genre: "מירוץ", world: "city", character: "ziv" },
  { genre: "פאזל", world: "ocean", character: "raya" },
  { genre: "פלטפורמה", world: "castle", character: "ziv" },
  { genre: "הרפתקה", world: "city", character: "raya" },
];

function gallerySelection(index) {
  const item = galleryItems[index];
  const map = galleryConfig[index] || galleryConfig[0];
  const genre = genreByLabel[map.genre] || genres[0];
  const world = worlds.find((w) => w.id === map.world) || worlds[0];
  const character = characters.find((c) => c.id === map.character) || characters[0];
  return { genre, world, character, idea: item.title, title: item.title };
}

function renderGallery() {
  elements.gallery.innerHTML = galleryItems
    .map(
      (item, index) => `
        <article class="game-card reveal" style="animation-delay: ${index * 55}ms;">
          <div class="game-art" style="--art-bg: ${item.bg}; --sprite-bg: ${item.sprite}; --sprite-x: ${28 + (index % 3) * 22}%;"></div>
          <h3>${item.title}</h3>
          <p>נוצר על ידי ${item.creator}</p>
          <div class="game-tags">
            <span>${item.genre}</span>
            <span>AI Prototype</span>
          </div>
          <button class="primary-button wide game-play" type="button" data-play="${index}">
            ${icon("play")} שחקו עכשיו
          </button>
        </article>
      `
    )
    .join("");

  elements.gallery.addEventListener("click", (event) => {
    const button = event.target.closest("[data-play]");
    if (!button) return;
    const index = Number(button.dataset.play);
    window.GameSpark?.launch(gallerySelection(index));
  });

  window.lucide?.createIcons();
}

function titleFromIdea(idea) {
  const cleaned = idea
    .replace(/משחק\s*/g, "")
    .replace(/שבו\s*/g, "")
    .trim();

  if (!cleaned) return "משחק חדש";

  const words = cleaned.split(/\s+/).filter(Boolean).slice(0, 3);
  return words.join(" ");
}

function updatePreview() {
  state.idea = elements.ideaInput.value.trim() || "משחק חדש שמתחיל מרעיון קטן";
  elements.previewTitle.textContent = state.createdCount ? `${titleFromIdea(state.idea)} ${state.createdCount + 1}` : titleFromIdea(state.idea);
  elements.hudGenre.textContent = state.genre.label;
  elements.hudGoal.textContent = state.genre.goal;
  elements.hudIdea.textContent = state.idea;
  elements.selectedCharacter.textContent = state.character.label;
  elements.selectedWorld.textContent = state.world.label;
  elements.selectedMechanic.textContent = state.genre.mechanic;
}

function bindOptionClicks() {
  elements.genreOptions.addEventListener("click", (event) => {
    const button = event.target.closest("[data-genre]");
    if (!button) return;
    state.genre = genres.find((genre) => genre.id === button.dataset.genre);
    renderOptions();
    updatePreview();
  });

  elements.characterOptions.addEventListener("click", (event) => {
    const button = event.target.closest("[data-character]");
    if (!button) return;
    state.character = characters.find((character) => character.id === button.dataset.character);
    renderOptions();
    updatePreview();
  });

  elements.worldOptions.addEventListener("click", (event) => {
    const button = event.target.closest("[data-world]");
    if (!button) return;
    state.world = worlds.find((world) => world.id === button.dataset.world);
    renderOptions();
    updatePreview();
  });

  if (elements.difficultyOptions) {
    elements.difficultyOptions.addEventListener("click", (event) => {
      const button = event.target.closest("[data-difficulty]");
      if (!button) return;
      state.difficulty = difficulties.find((d) => d.id === button.dataset.difficulty) || difficulties[1];
      renderOptions();
      updatePreview();
    });
  }

  if (elements.myGames) {
    elements.myGames.addEventListener("click", (event) => {
      const play = event.target.closest("[data-my-play]");
      const share = event.target.closest("[data-my-share]");
      const del = event.target.closest("[data-my-del]");
      if (play) {
        const rec = store.games[Number(play.dataset.myPlay)];
        if (rec) window.GameSpark?.launch(selectionFromRecord(rec));
      } else if (share) {
        const rec = store.games[Number(share.dataset.myShare)];
        if (rec) shareSelection(selectionFromRecord(rec), share);
      } else if (del) {
        store.games.splice(Number(del.dataset.myDel), 1);
        saveStore(store);
        renderMyGames();
      }
    });
  }

  if (elements.shareGame) {
    elements.shareGame.addEventListener("click", () => shareSelection(currentSelection(), elements.shareGame));
  }
}

function createGradient(ctx, top, bottom, width, height) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, top);
  gradient.addColorStop(0.58, top);
  gradient.addColorStop(0.59, bottom);
  gradient.addColorStop(1, "#071016");
  return gradient;
}

function drawStar(ctx, x, y, radius, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(time / 26 + x) * 0.22);
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 16;
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const angle = (Math.PI * 2 * i) / 10 - Math.PI / 2;
    const length = i % 2 === 0 ? radius : radius * 0.42;
    ctx.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawCharacter(ctx, x, y) {
  const [head, body, legs] = state.character.colors;
  const bounce = Math.sin(time / 22) * 8;
  ctx.save();
  ctx.translate(x, y + bounce);
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 14;
  ctx.fillStyle = body;
  roundRect(ctx, -28, -56, 56, 68, 14);
  ctx.fill();
  ctx.fillStyle = head;
  roundRect(ctx, -24, -76, 48, 38, 16);
  ctx.fill();
  ctx.fillStyle = legs;
  roundRect(ctx, -23, 8, 18, 30, 7);
  ctx.fill();
  roundRect(ctx, 5, 8, 18, 30, 7);
  ctx.fill();
  ctx.fillStyle = "#071016";
  ctx.beginPath();
  ctx.arc(-10, -58, 4, 0, Math.PI * 2);
  ctx.arc(10, -58, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawPlatforms(ctx, width, height) {
  const colors = [state.world.palette[2], state.world.palette[3], state.character.colors[0]];
  const platforms = [
    [width * 0.1, height * 0.74, width * 0.28],
    [width * 0.43, height * 0.58, width * 0.2],
    [width * 0.68, height * 0.78, width * 0.24],
  ];

  platforms.forEach(([x, y, platformWidth], index) => {
    const pulse = Math.sin(time / 30 + index) * 5;
    ctx.save();
    ctx.fillStyle = colors[index];
    ctx.shadowColor = colors[index];
    ctx.shadowBlur = 22;
    roundRect(ctx, x, y + pulse, platformWidth, 18, 9);
    ctx.fill();
    ctx.restore();
  });
}

function drawBackground(ctx, width, height) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = createGradient(ctx, state.world.palette[0], state.world.palette[1], width, height);
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1;
  for (let x = 0; x <= width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.restore();

  const count = state.genre.id === "puzzle" ? 7 : 13;
  for (let i = 0; i < count; i += 1) {
    const x = ((i * 137 + time * 0.35) % (width + 80)) - 40;
    const y = 58 + ((i * 73) % Math.max(120, height * 0.45));
    drawStar(ctx, x, y, 9 + (i % 3) * 3, i % 2 ? state.world.palette[2] : state.world.palette[3]);
  }

  if (state.genre.id === "race") {
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 4;
    for (let i = 0; i < 9; i += 1) {
      ctx.beginPath();
      ctx.moveTo(width * 0.15 + i * 80, height);
      ctx.lineTo(width * 0.5 + i * 12, height * 0.58);
      ctx.stroke();
    }
    ctx.restore();
  }

  if (state.genre.id === "puzzle") {
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.strokeStyle = state.world.palette[3];
    ctx.lineWidth = 5;
    for (let i = 0; i < 5; i += 1) {
      ctx.beginPath();
      ctx.arc(width * (0.22 + i * 0.13), height * (0.34 + (i % 2) * 0.11), 34, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function resizeCanvas() {
  const rect = elements.canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  elements.canvas.width = Math.max(1, Math.floor(rect.width * ratio));
  elements.canvas.height = Math.max(1, Math.floor(rect.height * ratio));
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function draw() {
  time += 1;
  const rect = elements.canvas.getBoundingClientRect();
  drawBackground(context, rect.width, rect.height);
  drawPlatforms(context, rect.width, rect.height);
  drawCharacter(context, rect.width * 0.52, rect.height * 0.72);

  if (state.building) {
    context.save();
    context.globalAlpha = 0.24 + Math.sin(time / 8) * 0.06;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, rect.width, rect.height);
    context.restore();
  }

  requestAnimationFrame(draw);
}

function currentSelection() {
  const idea = elements.ideaInput.value.trim() || "משחק חדש שמתחיל מרעיון קטן";
  return {
    genre: state.genre,
    character: state.character,
    world: state.world,
    difficulty: state.difficulty.id,
    idea,
    title: titleFromIdea(idea) || "המשחק שלי",
  };
}

function simulateCreate() {
  if (state.building) return;
  state.building = true;
  elements.createGame.disabled = true;
  elements.createGame.innerHTML = `${icon("loader-circle")} בונה משחק...`;
  elements.buildStatus.classList.add("is-building");
  elements.buildStatus.lastChild.textContent = " בבנייה";
  elements.aiThinking.classList.add("is-visible");
  window.lucide?.createIcons();

  // Short "AI is building" beat, then launch the REAL playable game.
  setTimeout(() => {
    state.createdCount += 1;
    state.building = false;
    elements.createGame.disabled = false;
    elements.createGame.innerHTML = `${icon("play")} שחקו שוב`;
    elements.buildStatus.classList.remove("is-building");
    elements.buildStatus.lastChild.textContent = " המשחק מוכן";
    elements.aiThinking.classList.remove("is-visible");
    updatePreview();
    window.lucide?.createIcons();
    const sel = currentSelection();
    rememberGame(sel);
    statBump("created");
    window.GameSpark?.launch(sel);
  }, 900);
}

function initInteractions() {
  elements.ideaInput.addEventListener("input", updatePreview);

  elements.randomIdea.addEventListener("click", () => {
    const next = ideas[Math.floor(Math.random() * ideas.length)];
    elements.ideaInput.value = next;
    updatePreview();
  });

  elements.createGame.addEventListener("click", simulateCreate);

  elements.soundToggle.addEventListener("click", () => {
    elements.soundToggle.classList.toggle("is-muted");
    const muted = elements.soundToggle.classList.contains("is-muted");
    elements.soundToggle.setAttribute("aria-label", muted ? "הפעל סאונד" : "כבה סאונד");
    elements.soundToggle.innerHTML = muted ? icon("volume-x") : icon("volume-2");
    window.lucide?.createIcons();
  });

  elements.menuToggle.addEventListener("click", () => {
    const isOpen = elements.mobileNav.classList.toggle("is-open");
    elements.menuToggle.setAttribute("aria-label", isOpen ? "סגור תפריט" : "פתח תפריט");
    elements.menuToggle.innerHTML = isOpen ? icon("x") : icon("menu");
    window.lucide?.createIcons();
  });

  elements.mobileNav.addEventListener("click", (event) => {
    if (!event.target.closest("a")) return;
    elements.mobileNav.classList.remove("is-open");
    elements.menuToggle.innerHTML = icon("menu");
    window.lucide?.createIcons();
  });

  window.addEventListener("resize", resizeCanvas);
}

function maybeLaunchShared() {
  const m = location.hash.match(/[#&]play=([^&]+)/);
  if (!m) return;
  const sel = decodeSelection(m[1]);
  if (sel) {
    // reflect the shared choices in the studio, then launch
    state.genre = genres.find((g) => g.id === sel.genre.id) || state.genre;
    state.character = characters.find((c) => c.id === sel.character.id) || state.character;
    state.world = worlds.find((w) => w.id === sel.world.id) || state.world;
    state.difficulty = difficulties.find((d) => d.id === (sel.difficulty || "normal")) || state.difficulty;
    if (elements.ideaInput && sel.idea) elements.ideaInput.value = sel.idea;
    renderOptions();
    updatePreview();
    setTimeout(() => window.GameSpark?.launch(sel), 350);
  }
  // clear the hash so refresh doesn't relaunch unexpectedly
  history.replaceState(null, "", location.pathname + location.search);
}

function init() {
  renderOptions();
  renderGallery();
  renderMyGames();
  renderStats();
  bindOptionClicks();
  initInteractions();
  updatePreview();
  resizeCanvas();
  draw();
  // record wins/losses + stars from the engine
  window.GameSpark?.setStatHook((ev) => {
    if (ev.type === "win") {
      statBump("won");
      if (ev.stars) statBump("stars", ev.stars);
    }
  });
  maybeLaunchShared();
  window.lucide?.createIcons();
}

init();
