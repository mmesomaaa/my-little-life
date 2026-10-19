
"use strict";

const SAVE_KEY = "myLittleLifeSave";

const defaults = {
  name: "Mia",
  skinTone: "#c98760",
  hairStyle: "curly",
  hairColor: "#30201d",
  outfitColor: "#e99ab5",
  outfitStyle: "casual",
  money: 120,
  lifetimeEarnings: 0,
  day: 1,
  needs: { energy: 85, hunger: 75, hygiene: 80, fun: 70 },
  inventory: [],
  journal: ["A new day, a new beginning. What will happen today?"],
  position: { x: 52, y: 55 }
};

const activityInfo = {
  eat: {
    name: "Getting a snack",
    thought: "Mmm, yummy! 🍓",
    description: "A little food makes everything better.",
    changes: { hunger: 32, fun: 3, energy: 2 },
    animation: "happy"
  },
  sleep: {
    name: "Taking a nap",
    thought: "Five more minutes... 💤",
    description: "Your Sim is getting some much-needed rest.",
    changes: { energy: 42, hunger: -8, hygiene: -4 },
    animation: "sleeping"
  },
  shower: {
    name: "Freshening up",
    thought: "Feeling so fresh! 🫧",
    description: "A warm shower can reset the whole day.",
    changes: { hygiene: 38, fun: 3, energy: -3 },
    animation: "showering"
  },
  phone: {
    name: "Scrolling on the phone",
    thought: "Wait, one more video... 📱",
    description: "A little entertainment lifts the mood.",
    changes: { fun: 28, energy: -4, hunger: -3 },
    animation: "happy"
  },
  work: {
    name: "Working hard",
    thought: "Getting that money! 💸",
    description: "Your Sim put in some work and earned $40.",
    changes: { energy: -13, fun: -7, hunger: -8 },
    animation: "working"
  },
  plant: {
    name: "Taking care of the plant",
    thought: "Look at you growing! 🌱",
    description: "A little care goes a long way.",
    changes: { fun: 12, hygiene: -2 },
    animation: "happy"
  }
};

let game = loadGame();
let actionBusy = false;
let toastTimeout;
let thoughtTimeout;
let journalIndex = 0;

const $ = (id) => document.getElementById(id);

function cloneDefaults() {
  return JSON.parse(JSON.stringify(defaults));
}

function loadGame() {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (!saved) return cloneDefaults();

    const data = JSON.parse(saved);
    const base = cloneDefaults();

    return {
      ...base,
      ...data,
      needs: { ...base.needs, ...(data.needs || {}) },
      inventory: Array.isArray(data.inventory) ? data.inventory : [],
      journal: Array.isArray(data.journal) ? data.journal : base.journal,
      position: { ...base.position, ...(data.position || {}) }
    };
  } catch (error) {
    console.warn("Could not load saved game:", error);
    return cloneDefaults();
  }
}

function saveGame() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(game));
  } catch (error) {
    console.warn("Could not save game:", error);
    showToast("Your browser couldn't save the game.");
  }
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function safeColor(value, fallback) {
  return /^#[0-9a-f]{6}$/i.test(value || "") ? value : fallback;
}

function getHairShape(style, color) {
  const shapes = {
    curly: `
      <g fill="${color}">
        <circle cx="34" cy="26" r="11"/>
        <circle cx="41" cy="17" r="10"/>
        <circle cx="52" cy="15" r="11"/>
        <circle cx="63" cy="19" r="10"/>
        <circle cx="69" cy="29" r="10"/>
        <path d="M31 26 Q29 48 36 56 L40 47 L39 32 Z"/>
        <path d="M66 26 Q74 39 66 54 L62 46 L64 31 Z"/>
        <path d="M34 25 Q37 8 51 10 Q68 8 70 27 L63 25 L58 17 L48 23 L39 21 Z"/>
      </g>
      <g fill="#ffffff" opacity=".10">
        <circle cx="43" cy="17" r="3"/>
        <circle cx="57" cy="14" r="3"/>
      </g>`,
    afro: `
      <g fill="${color}">
        <circle cx="31" cy="28" r="12"/>
        <circle cx="35" cy="18" r="11"/>
        <circle cx="45" cy="12" r="11"/>
        <circle cx="57" cy="12" r="11"/>
        <circle cx="67" cy="19" r="11"/>
        <circle cx="71" cy="29" r="12"/>
        <circle cx="34" cy="38" r="10"/>
        <circle cx="68" cy="39" r="10"/>
        <path d="M34 29 Q31 44 38 54 L42 43 L40 30 Z"/>
        <path d="M66 29 Q72 44 64 54 L60 43 L63 30 Z"/>
      </g>
      <g fill="#ffffff" opacity=".10">
        <circle cx="42" cy="15" r="3"/>
        <circle cx="56" cy="11" r="3"/>
      </g>`,
    long: `
      <path fill="${color}" d="M31 25 Q30 8 50 8 Q72 7 71 28 L73 80 L62 88 L62 48 L39 48 L38 86 L28 79 Z"/>
      <path fill="${color}" d="M31 28 Q29 17 40 11 Q56 4 68 17 L69 29 L61 23 L54 17 L43 23 L35 22 Z"/>
      <path fill="#ffffff" opacity=".09" d="M35 30 L36 71 L40 70 L40 30 Z"/>`,
    bob: `
      <path fill="${color}" d="M31 26 Q29 7 50 8 Q73 8 71 30 L71 57 L62 64 L62 42 L39 42 L39 63 L29 57 Z"/>
      <path fill="${color}" d="M31 27 Q31 13 45 10 L43 25 L35 29 Z"/>
      <path fill="${color}" d="M48 10 Q64 7 70 23 L64 29 L55 19 Z"/>`,
    bun: `
      <circle cx="63" cy="10" r="10" fill="${color}"/>
      <path fill="${color}" d="M31 27 Q30 8 50 8 Q71 8 70 28 L67 51 L61 43 L61 26 L41 24 L39 47 L32 53 Z"/>
      <path fill="${color}" d="M31 24 Q40 5 53 12 L62 18 L57 23 L45 19 L37 29 Z"/>`,
    locs: `
      <g fill="${color}" stroke="${color}" stroke-width="5" stroke-linecap="round">
        <path d="M34 22 L30 48 L32 67"/>
        <path d="M41 15 L39 44 L42 60"/>
        <path d="M49 13 L50 44 L48 65"/>
        <path d="M58 15 L60 43 L58 62"/>
        <path d="M66 23 L70 48 L66 67"/>
      </g>
      <path fill="${color}" d="M31 26 Q30 7 50 8 Q71 8 70 28 L63 26 L57 17 L47 23 L37 20 Z"/>`,
    short: `
      <path fill="${color}" d="M31 27 Q29 8 50 8 Q71 8 70 28 L65 40 L62 25 L53 18 L43 23 L37 29 L36 42 Z"/>
      <path fill="#ffffff" opacity=".10" d="M40 15 Q52 8 61 16 L54 18 L45 21 Z"/>`
  };

  return shapes[style] || shapes.curly;
}

function makeCharacterSVG(options = {}) {
  const skin = safeColor(options.skinTone, defaults.skinTone);
  const hair = safeColor(options.hairColor, defaults.hairColor);
  const outfit = safeColor(options.outfitColor, defaults.outfitColor);
  const style = options.hairStyle || defaults.hairStyle;
  const clothes = options.outfitStyle || defaults.outfitStyle;

  let clothing = "";

  if (clothes === "dress") {
    clothing = `
      <path d="M40 62 Q50 58 60 62 L67 105 L33 105 Z"
        fill="${outfit}" stroke="#5c4050" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M40 63 L35 73 L44 75 L50 70 L57 75 L65 73 L60 63"
        fill="${outfit}" stroke="#5c4050" stroke-width="1.5"/>
      <path d="M38 88 L62 88" stroke="#ffffff" stroke-width="2" opacity=".45"/>
      <path d="M50 64 L50 103" stroke="#ffffff" stroke-width="1.4" opacity=".35"/>`;
  } else if (clothes === "hoodie") {
    clothing = `
      <path d="M38 63 Q50 54 62 63 L69 98 L31 98 Z"
        fill="${outfit}" stroke="#5c4050" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M39 62 Q50 76 61 62 L58 71 Q50 80 42 71 Z"
        fill="#ffffff" opacity=".18"/>
      <path d="M43 76 L57 76 L56 88 L44 88 Z" fill="#ffffff" opacity=".14"/>
      <path d="M50 77 L50 86" stroke="#ffffff" stroke-width="1.5" opacity=".55"/>`;
  } else if (clothes === "overalls") {
    clothing = `
      <path d="M39 62 Q50 58 61 62 L64 83 L36 83 Z"
        fill="#f3e8db" stroke="#5c4050" stroke-width="1.5"/>
      <path d="M38 64 L33 97 L67 97 L62 64 Z"
        fill="${outfit}" stroke="#5c4050" stroke-width="1.5"/>
      <path d="M40 63 L44 83 M60 63 L56 83" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>
      <circle cx="44" cy="84" r="1.8" fill="#7d626c"/>
      <circle cx="56" cy="84" r="1.8" fill="#7d626c"/>`;
  } else {
    clothing = `
      <path d="M39 62 Q50 57 61 62 L68 98 L32 98 Z"
        fill="${outfit}" stroke="#5c4050" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M40 62 Q50 72 60 62 L57 70 Q50 77 43 70 Z"
        fill="#ffffff" opacity=".22"/>
      <path d="M44 82 L56 82" stroke="#ffffff" stroke-width="1.4" opacity=".5"/>`;
  }

  return `
    <svg class="sim-svg" xmlns="http://www.w3.org/2000/svg"
         viewBox="0 0 100 155" role="img" aria-label="Your custom Sim">
      <defs>
        <linearGradient id="skinShade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#000000" stop-opacity=".09"/>
          <stop offset=".45" stop-color="#ffffff" stop-opacity=".05"/>
          <stop offset="1" stop-color="#000000" stop-opacity=".09"/>
        </linearGradient>
        <linearGradient id="clothShade" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#ffffff" stop-opacity=".14"/>
          <stop offset="1" stop-color="#000000" stop-opacity=".09"/>
        </linearGradient>
      </defs>

      <!-- Legs -->
      <g class="left-leg">
        <path d="M38 94 L47 95 L45 125 Q43 130 38 127 L35 124 Z"
          fill="${skin}" stroke="#5c4050" stroke-width="1.2"/>
        <path d="M36 122 Q40 126 45 123 L46 130 Q43 135 34 131 L31 128 Z"
          fill="#f7eee8" stroke="#5c4050" stroke-width="1.5"/>
      </g>
      <g class="right-leg">
        <path d="M53 95 L62 94 L65 124 Q62 130 57 127 L53 124 Z"
          fill="${skin}" stroke="#5c4050" stroke-width="1.2"/>
        <path d="M54 123 Q60 126 65 122 L68 128 Q67 133 57 132 L52 129 Z"
          fill="#f7eee8" stroke="#5c4050" stroke-width="1.5"/>
      </g>

      <!-- Arms behind the body -->
      <g class="left-arm">
        <path d="M39 66 Q34 67 32 74 L25 91 Q24 96 29 97 Q33 97 35 91 L44 77 Z"
          fill="${skin}" stroke="#5c4050" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M25 90 Q22 95 27 98 Q31 99 33 94 L31 91 Z"
          fill="${skin}" stroke="#5c4050" stroke-width="1.2"/>
      </g>
      <g class="right-arm">
        <path d="M61 66 Q66 67 68 74 L75 91 Q76 96 71 97 Q67 97 65 91 L56 77 Z"
          fill="${skin}" stroke="#5c4050" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M75 90 Q78 95 73 98 Q69 99 67 94 L69 91 Z"
          fill="${skin}" stroke="#5c4050" stroke-width="1.2"/>
      </g>

      <!-- Neck -->
      <path d="M44 51 L44 65 Q50 71 56 65 L56 51 Z"
        fill="${skin}" stroke="#5c4050" stroke-width="1.3"/>

      <!-- Torso and outfit -->
      <path d="M39 62 Q50 57 61 62 L68 98 L32 98 Z"
        fill="${outfit}" stroke="#5c4050" stroke-width="1.5" stroke-linejoin="round"/>
      ${clothing}
      <path d="M33 96 L67 96 L67 100 L33 100 Z" fill="url(#clothShade)"/>

      <!-- Hands -->
      <path d="M24 93 Q22 96 26 99 Q30 100 32 96 L30 92 Z"
        fill="${skin}" stroke="#5c4050" stroke-width="1.2"/>
      <path d="M76 93 Q78 96 74 99 Q70 100 68 96 L70 92 Z"
        fill="${skin}" stroke="#5c4050" stroke-width="1.2"/>

      <!-- Ears and head -->
      <ellipse cx="31" cy="36" rx="5" ry="7" fill="${skin}" stroke="#5c4050" stroke-width="1.2"/>
      <ellipse cx="69" cy="36" rx="5" ry="7" fill="${skin}" stroke="#5c4050" stroke-width="1.2"/>
      <path d="M31 28 Q32 12 50 12 Q68 12 69 28 L66 44 Q62 57 50 59 Q38 57 34 44 Z"
        fill="${skin}" stroke="#5c4050" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M31 28 Q32 12 50 12 Q68 12 69 28 L66 44 Q62 57 50 59 Q38 57 34 44 Z"
        fill="url(#skinShade)"/>

      <!-- Hair behind and on top of the face -->
      ${getHairShape(style, hair)}

      <!-- Face -->
      <g class="face">
        <ellipse cx="42" cy="36" rx="2.7" ry="3.6" fill="#44313a" class="eye-pupil"/>
        <ellipse cx="58" cy="36" rx="2.7" ry="3.6" fill="#44313a" class="eye-pupil"/>
        <circle cx="43" cy="35" r=".9" fill="#fff"/>
        <circle cx="59" cy="35" r=".9" fill="#fff"/>
        <path d="M38 30 Q42 28 46 30" fill="none" stroke="${hair}" stroke-width="1.7" stroke-linecap="round"/>
        <path d="M54 30 Q58 28 62 30" fill="none" stroke="${hair}" stroke-width="1.7" stroke-linecap="round"/>
        <ellipse cx="38" cy="43" rx="4.1" ry="2.1" fill="#e995a7" opacity=".48"/>
        <ellipse cx="62" cy="43" rx="4.1" ry="2.1" fill="#e995a7" opacity=".48"/>
        <path d="M47 42 Q50 44 51 42" fill="none" stroke="#b77766" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M45 48 Q50 52 55 48" fill="none" stroke="#9d596b" stroke-width="1.7" stroke-linecap="round"/>
      </g>

      <!-- Small outfit detail -->
      <circle cx="50" cy="75" r="2" fill="#fff8f2" opacity=".9"/>
      <circle cx="50" cy="83" r="1.5" fill="#fff8f2" opacity=".7"/>
    </svg>`;
}

function updateCharacterAppearance() {
  const svg = makeCharacterSVG(game);

  $("simArt").innerHTML = svg;
  $("portrait").innerHTML = svg;
  $("creatorPreview").innerHTML = makeCharacterSVG(readCreatorValues());

  document.documentElement.style.setProperty("--skin", game.skinTone);
  document.documentElement.style.setProperty("--hair", game.hairColor);
  document.documentElement.style.setProperty("--outfit", game.outfitColor);
}

function readCreatorValues() {
  return {
    name: $("simName").value.trim() || game.name,
    skinTone: $("skinTone").value,
    hairStyle: $("hairStyle").value,
    hairColor: $("hairColor").value,
    outfitColor: $("outfitColor").value,
    outfitStyle: $("outfitStyle").value
  };
}

function getMood() {
  const values = Object.values(game.needs);
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  const lowest = Math.min(...values);

  if (lowest <= 15) return { label: "Needs some love", score: average };
  if (average >= 85) return { label: "On top of the world", score: average };
  if (average >= 70) return { label: "Feeling good", score: average };
  if (average >= 50) return { label: "Feeling okay", score: average };
  if (average >= 30) return { label: "A little off", score: average };
  return { label: "Having a rough day", score: average };
}

function updateNeeds() {
  for (const [need, value] of Object.entries(game.needs)) {
    const safeValue = clamp(Number(value) || 0);
    game.needs[need] = safeValue;

    const bar = $(need + "Bar");
    const label = $(need + "Value");

    if (bar) bar.style.width = safeValue + "%";
    if (label) label.textContent = Math.round(safeValue) + "%";

    if (bar) {
      bar.style.filter = safeValue < 20 ? "saturate(.75)" : "none";
    }
  }

  const mood = getMood();
  $("moodBadge").textContent = mood.label;

  if (mood.score >= 70) {
    $("moodBadge").style.background = "#eaf7ed";
    $("moodBadge").style.color = "#619573";
  } else if (mood.score < 35) {
    $("moodBadge").style.background = "#fff0ed";
    $("moodBadge").style.color = "#bc7567";
  } else {
    $("moodBadge").style.background = "#f4f1ff";
    $("moodBadge").style.color = "#8b7bb0";
  }
}

function updateProfile() {
  $("profileName").textContent = game.name;
  $("daysLived").textContent = game.day;
  $("moneyLabel").textContent = "$" + game.money;
  $("lifetimeEarnings").textContent = "$" + game.lifetimeEarnings;
  $("dayLabel").textContent = getDayName(game.day) + " · Day " + game.day;

  const tags = {
    curly: "Little dreamer",
    afro: "Confident soul",
    long: "Soft-hearted",
    bob: "Creative spirit",
    bun: "Cosy at heart",
    locs: "Free spirit",
    short: "Easy-going"
  };

  $("personalityTag").textContent = tags[game.hairStyle] || "Little dreamer";
  $("profileDescription").textContent =
    game.needs.fun >= 75
      ? "Finding joy in the little things and making lovely memories."
      : game.needs.energy < 25
        ? "Could use a little rest, a cosy blanket, and some quiet time."
        : game.needs.hunger < 25
          ? "Dreaming about the next delicious snack."
          : "Taking life one little moment at a time.";
}

function getDayName(day) {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  return days[(day - 1) % days.length];
}

function renderJournal() {
  const latest = game.journal[0] || "A new day, a new beginning.";
  $("journalText").textContent = latest;

  $("journalEntries").innerHTML = game.journal.slice(1, 4).map((entry) => `
    <div class="journal-entry">${escapeHTML(entry)}</div>
  `).join("");
}

function renderDecorations() {
  const decorations = {
    flowers: { emoji: "🌷", className: "flowers" },
    teddy: { emoji: "🧸", className: "teddy" },
    sofa: { emoji: "", className: "sofa" }
  };

  $("decorations").innerHTML = game.inventory.map((item) => {
    const decoration = decorations[item];
    if (!decoration) return "";
    return `<div class="room-decoration ${decoration.className}">${decoration.emoji}</div>`;
  }).join("");
}

function render() {
  updateCharacterAppearance();
  updateNeeds();
  updateProfile();
  renderJournal();
  renderDecorations();
  saveGame();
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("visible");

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("visible"), 2400);
}

function showThought(message, duration = 2100) {
  const bubble = $("thoughtBubble");
  bubble.textContent = message;
  bubble.classList.add("visible");

  clearTimeout(thoughtTimeout);
  thoughtTimeout = setTimeout(() => bubble.classList.remove("visible"), duration);
}

function setStatus(title, description) {
  $("statusTitle").textContent = title;
  $("statusText").textContent = description;
}

function setAnimation(animation) {
  const character = $("simCharacter");
  character.classList.remove("sleeping", "working", "happy", "showering");
  if (animation) character.classList.add(animation);
}

function getRoomPosition(xPercent, yPercent) {
  const room = $("room");
  const rect = room.getBoundingClientRect();

  return {
    x: clamp(xPercent, 5, 95) / 100 * rect.width,
    y: clamp(yPercent, 17, 85) / 100 * rect.height
  };
}

function moveCharacter(x, y, callback) {
  const room = $("room");
  const character = $("simCharacter");
  const roomRect = room.getBoundingClientRect();

  const safeX = clamp(x, 35, roomRect.width - 35);
  const safeY = clamp(y, roomRect.height * 0.18, roomRect.height * 0.82);

  const currentX = parseFloat(character.style.left) || roomRect.width * (game.position.x / 100);
  const movingLeft = safeX < currentX;

  character.classList.toggle("facing-left", movingLeft);
  character.classList.add("walking");
  setAnimation("");

  character.style.left = safeX + "px";
  character.style.top = safeY + "px";

  game.position = {
    x: safeX / roomRect.width * 100,
    y: safeY / roomRect.height * 100
  };

  const distance = Math.hypot(safeX - currentX, safeY - (parseFloat(character.style.top) || safeY));
  const duration = Math.min(1100, Math.max(450, distance * 2.1));

  setTimeout(() => {
    character.classList.remove("walking");
    if (typeof callback === "function") callback();
  }, duration);

  saveGame();
}

function moveToPoint(x, y, callback) {
  const character = $("simCharacter");
  const roomRect = $("room").getBoundingClientRect();

  const currentX = parseFloat(character.style.left) || roomRect.width * 0.52;
  const currentY = parseFloat(character.style.top) || roomRect.height * 0.55;
  const distance = Math.hypot(x - currentX, y - currentY);
  const duration = Math.min(1150, Math.max(450, distance * 2));

  character.classList.toggle("facing-left", x < currentX);
  character.classList.add("walking");
  setAnimation("");

  character.style.left = x + "px";
  character.style.top = y + "px";

  game.position = {
    x: x / roomRect.width * 100,
    y: y / roomRect.height * 100
  };
  saveGame();

  setTimeout(() => {
    character.classList.remove("walking");
    if (typeof callback === "function") callback();
  }, duration);
}

function walkToFurniture(action, callback) {
  const room = $("room");
  const item = room.querySelector(`[data-action="${action}"].furniture`);
  const rect = room.getBoundingClientRect();

  if (!item) {
    callback();
    return;
  }

  const itemRect = item.getBoundingClientRect();
  let x = itemRect.left - rect.left + itemRect.width / 2;
  let y = itemRect.top - rect.top + itemRect.height * 0.88;

  if (action === "sleep") {
    x = itemRect.left - rect.left + itemRect.width * 0.72;
    y = itemRect.top - rect.top + itemRect.height * 0.7;
  } else if (action === "work") {
    x = itemRect.left - rect.left + itemRect.width * 0.45;
    y = itemRect.top - rect.top + itemRect.height * 1.2;
  } else if (action === "shower") {
    x = itemRect.left - rect.left - 22;
    y = itemRect.top - rect.top + itemRect.height * 0.9;
  } else if (action === "plant") {
    x = itemRect.left - rect.left + itemRect.width * 1.15;
    y = itemRect.top - rect.top + itemRect.height * 0.95;
  } else if (action === "eat") {
    x = itemRect.left - rect.left + itemRect.width * 1.15;
    y = itemRect.top - rect.top + itemRect.height * 0.85;
  } else if (action === "phone") {
    x = itemRect.left - rect.left - 20;
    y = itemRect.top - rect.top + itemRect.height * 0.7;
  }

  x = clamp(x, 35, rect.width - 35);
  y = clamp(y, rect.height * 0.2, rect.height * 0.83);

  moveToPoint(x, y, callback);
}

function doActivity(action) {
  if (actionBusy) {
    showToast("Your Sim is busy right now. One moment! ♡");
    return;
  }

  const activity = activityInfo[action];
  if (!activity) return;

  actionBusy = true;

  const character = $("simCharacter");
  const title = activity.name;
  setStatus("Walking over...", game.name + " is heading to the " + action + " spot.");
  showThought("On my way! ♡", 1000);

  walkToFurniture(action, () => {
    setStatus(title, activity.description);
    showThought(activity.thought, 2600);
    setAnimation(activity.animation);

    if (action === "sleep") {
      character.classList.add("sleeping");
    }

    if (action === "work") {
      game.money += 40;
      game.lifetimeEarnings += 40;
    }

    for (const [need, change] of Object.entries(activity.changes)) {
      game.needs[need] = clamp(game.needs[need] + change);
    }

    render();
    actionBusy = true;

    const actionDuration = action === "sleep" ? 2100 : 1450;

    setTimeout(() => {
      setAnimation("");
      character.classList.remove("sleeping", "working", "happy", "showering");
      actionBusy = false;

      const followup = {
        eat: "That hit the spot. Feeling a little better!",
        sleep: "Much better. A bit more energy for the day.",
        shower: "Clean, refreshed, and ready for anything.",
        phone: "That was fun. Maybe time to do something else?",
        work: "Another step toward those goals. +$40!",
        plant: "A little kindness makes this room feel like home."
      };

      setStatus("Just chilling", followup[action]);
      saveGame();
    }, actionDuration);
  });
}

function addJournalEntry(message) {
  game.journal.unshift("Day " + game.day + " — " + message);
  game.journal = game.journal.slice(0, 10);
  renderJournal();
  saveGame();
}

function advanceDay() {
  if (actionBusy) {
    showToast("Let your Sim finish what they're doing first. ♡");
    return;
  }

  game.day += 1;

  game.needs.energy = clamp(game.needs.energy + 18);
  game.needs.hunger = clamp(game.needs.hunger - 12);
  game.needs.hygiene = clamp(game.needs.hygiene - 7);
  game.needs.fun = clamp(game.needs.fun - 5);

  const messages = [
    "The sunlight feels a little different today. A fresh start.",
    "Today is full of little possibilities.",
    "A quiet morning, a warm room, and time to grow.",
    "Your Sim is learning to take life one day at a time.",
    "Something lovely might happen today. Stay curious."
  ];

  const entry = messages[Math.floor(Math.random() * messages.length)];
  addJournalEntry(entry);
  render();

  setStatus("A new day begins", "Good morning, " + game.name + ". What will you do today?");
  showThought("Good morning! ☀️", 2200);
  showToast("Day " + game.day + " has begun. ♡");
}

function buyItem(item, price) {
  if (actionBusy) {
    showToast("Wait until your Sim is finished first. ♡");
    return;
  }

  if (game.inventory.includes(item)) {
    $("shopMessage").textContent = "You already have this little treasure. ♡";
    showToast("Already in your room!");
    return;
  }

  if (game.money < price) {
    $("shopMessage").textContent = "Save a little more money and come back.";
    showToast("Not enough money just yet. 💗");
    return;
  }

  game.money -= price;
  game.inventory.push(item);

  const names = {
    flowers: "Pink flowers",
    teddy: "Teddy bear",
    sofa: "Cosy sofa"
  };

  $("shopMessage").textContent = names[item] + " added to your room!";
  addJournalEntry("Bought " + names[item].toLowerCase() + " for $" + price + ".");
  render();
  showToast(names[item] + " is yours! ✨");
  showThought("It's so cute! ♡", 1800);
}

function openCreator() {
  $("simName").value = game.name;
  $("skinTone").value = game.skinTone;
  $("hairStyle").value = game.hairStyle;
  $("hairColor").value = game.hairColor;
  $("outfitColor").value = game.outfitColor;
  $("outfitStyle").value = game.outfitStyle;
  updateCharacterAppearance();
  $("creatorModal").classList.remove("hidden");
}

function closeCreator() {
  $("creatorModal").classList.add("hidden");
}

function resetGame() {
  if (!confirm("Start a brand-new life? This will erase your current saved game.")) {
    return;
  }

  game = cloneDefaults();
  actionBusy = false;
  $("simCharacter").className = "sim-character";
  $("simCharacter").style.left = "52%";
  $("simCharacter").style.top = "55%";

  render();
  setStatus("Just chilling", "Your story is just beginning.");
  showToast("A brand-new life begins. ♡");
}

function setupCreator() {
  const form = $("creatorForm");

  form.addEventListener("input", () => {
    const preview = $("creatorPreview");
    preview.innerHTML = makeCharacterSVG(readCreatorValues());
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const values = readCreatorValues();
    game.name = values.name;
    game.skinTone = values.skinTone;
    game.hairStyle = values.hairStyle;
    game.hairColor = values.hairColor;
    game.outfitColor = values.outfitColor;
    game.outfitStyle = values.outfitStyle;

    closeCreator();
    render();
    addJournalEntry("Created a new look and made the room feel more like home.");
    setStatus("Looking good!", game.name + " is ready to start the day.");
    showThought("This is so me! ♡", 2200);
    showToast("Your Sim's new look is saved!");
  });

  document.querySelectorAll("[data-close-modal]").forEach((element) => {
    element.addEventListener("click", closeCreator);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeCreator();
  });
}

function setupControls() {
  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      doActivity(button.dataset.action);
    });
  });

  document.querySelectorAll("[data-buy]").forEach((button) => {
    button.addEventListener("click", () => {
      buyItem(button.dataset.buy, Number(button.dataset.price));
    });
  });

  $("nextDayBtn").addEventListener("click", advanceDay);
  $("editSimBtn").addEventListener("click", openCreator);
  $("resetBtn").addEventListener("click", resetGame);

  $("room").addEventListener("click", (event) => {
    if (event.target.closest(".furniture")) return;
    if (actionBusy) return;

    const rect = $("room").getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (y < rect.height * 0.17 || y > rect.height * 0.88) return;

    actionBusy = true;
    setStatus("Going for a little walk", game.name + " is wandering around the room.");
    moveToPoint(x, y, () => {
      actionBusy = false;
      setStatus("Just chilling", "It's nice to have a moment to yourself.");
      showThought("Just vibing ♡", 1500);
    });
  });
}

function placeCharacter() {
  const room = $("room");
  const character = $("simCharacter");
  const rect = room.getBoundingClientRect();

  const x = rect.width * clamp(game.position.x, 5, 95) / 100;
  const y = rect.height * clamp(game.position.y, 17, 85) / 100;

  character.style.left = x + "px";
  character.style.top = y + "px";
}

function init() {
  render();
  setupControls();
  setupCreator();

  requestAnimationFrame(() => {
    placeCharacter();
  });

  window.addEventListener("resize", placeCharacter);

  setStatus("Just chilling", "Your story is just beginning.");
}

init();
