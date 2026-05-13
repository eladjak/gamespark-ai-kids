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

const state = {
  genre: genres[0],
  character: characters[0],
  world: worlds[0],
  idea: ideas[0],
  building: false,
  createdCount: 0,
};

const $ = (selector) => document.querySelector(selector);

const elements = {
  ideaInput: $("#ideaInput"),
  genreOptions: $("#genreOptions"),
  characterOptions: $("#characterOptions"),
  worldOptions: $("#worldOptions"),
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

  window.lucide?.createIcons();
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
        </article>
      `
    )
    .join("");
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

function simulateCreate() {
  if (state.building) return;
  state.building = true;
  elements.createGame.disabled = true;
  elements.createGame.innerHTML = `${icon("loader-circle")} יוצר משחק...`;
  elements.buildStatus.classList.add("is-building");
  elements.buildStatus.lastChild.textContent = " בבנייה";
  elements.aiThinking.classList.add("is-visible");
  window.lucide?.createIcons();

  setTimeout(() => {
    state.createdCount += 1;
    state.building = false;
    elements.createGame.disabled = false;
    elements.createGame.innerHTML = `${icon("play")} צור עוד גרסה`;
    elements.buildStatus.classList.remove("is-building");
    elements.buildStatus.lastChild.textContent = " פרוטוטייפ מוכן";
    elements.aiThinking.classList.remove("is-visible");
    updatePreview();
    window.lucide?.createIcons();
  }, 1350);
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

function init() {
  renderOptions();
  renderGallery();
  bindOptionClicks();
  initInteractions();
  updatePreview();
  resizeCanvas();
  draw();
  window.lucide?.createIcons();
}

init();
