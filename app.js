// ==========================================
// ASCEND RPG  — THE UNBREAKABLE REWRITE (PATCHED)
// ==========================================

window.switchTab = function (name) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  const targetTab = document.getElementById("tab-" + name);
  const targetNav = document.getElementById("nav-" + name);
  if (targetTab) targetTab.classList.add("active");
  if (targetNav) targetNav.classList.add("active");
};

document.addEventListener("DOMContentLoaded", () => {

  // ── 1. SAFE DATA MANAGEMENT ──
  function getNum(key, defaultVal) {
    const raw = localStorage.getItem(key);
    if (raw === null || raw === "") return defaultVal;
    const val = Number(raw);
    return isNaN(val) ? defaultVal : val;
  }

  function getObj(key, defaultVal) {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : defaultVal;
    } catch (e) {
      console.error(`Corrupt data in ${key}. Resetting.`);
      return defaultVal;
    }
  }

  // ── 2. STATE VARIABLES ──
  let xp = getNum("xp", 0);
  let level = getNum("level", 1);
  let totalXP = getNum("totalXP", 0);
  let totalDays = getNum("totalDays", 1);
  let streak = getNum("streak", 1);
  
  // Health Score (Continuous Pool) & Daily Log
  let healthScore = getNum("healthScore", 100);
  let dailyWater = getNum("dailyWater", 0);
  let dailySleep = getNum("dailySleep", 0);
  let workedOutToday = getNum("workedOutToday", 0); // Daily frequency checker

  // Lifetime Stats
  let water = getNum("water", 0);
  let reading = getNum("reading", 0);
  let workouts = getNum("workouts", 0);

  // Weekly Stats (Tracks unique workout days)
  let wkWater = getNum("wkWater", 0);
  let wkReading = getNum("wkReading", 0);
  let wkWorkouts = getNum("wkWorkouts", 0);
  let wkXP = getNum("wkXP", 0);

  // Monthly Stats (Tracks unique workout days)
  let moWater = getNum("moWater", 0);
  let moReading = getNum("moReading", 0);
  let moWorkouts = getNum("moWorkouts", 0);
  let moXP = getNum("moXP", 0);

  // Ability Points
  let strength = getNum("strength", 1);
  let knowledgeGen = getNum("knowledgeGen", 1);
  let knowledgeFin = getNum("knowledgeFin", 1);
  let vitality = getNum("vitality", 1);
  let stamina = getNum("stamina", 1);

  let questState = getObj("questState", {});
  let actionCounts = getObj("actionCounts", {});
  let achievements = getObj("achievements", ["First Steps"]);
  let undoStack = getObj("undoStack", []);

  let playerClass = getObj("playerClass", {
    name: "Novice", icon: "⚔️", color: "#f0b429", pathName: "The Blank Slate"
  });

  if (!playerClass || typeof playerClass !== "object" || !playerClass.name) {
    playerClass = { name: "Novice", icon: "⚔️", color: "#f0b429", pathName: "The Blank Slate" };
  }

  const savedWeekly = getObj("weeklyProgress", {});
  let weeklyProgress = {
    pushups: savedWeekly.pushups || 0,
    curls:   savedWeekly.curls   || 0,
    squats:  savedWeekly.squats  || 0,
    walk:    savedWeekly.walk    || 0,
    skips:   savedWeekly.skips   || 0,
    readGen: savedWeekly.readGen || 0,
    readFin: savedWeekly.readFin || 0,
    water:   savedWeekly.water   || 0,
    sleep:   savedWeekly.sleep   || 0
  };

  // ── 3. EVOLUTION DICTIONARY ──
  const MILESTONES = [5, 10, 20, 35, 50, 70, 90, 120, 150, 180, 220, 260];
  const EVOLUTION_PATHS = {
    "M":    { color: "#f04040", icon: "⚔️",  pathName: "Path of Might",        tiers: ["Brawler", "Warrior", "Gladiator", "Juggernaut", "Champion", "Warlord", "Titan", "Colossus", "Behemoth", "Leviathan", "Asura", "God of War"] },
    "E":    { color: "#22d06e", icon: "🛡️",  pathName: "Path of Endurance",    tiers: ["Scout", "Ranger", "Vanguard", "Sentinel", "Warden", "Windwalker", "Apex", "Aegis", "Ironbark", "Phoenix", "Zephyr", "The Unbreakable"] },
    "W":    { color: "#3b8ef5", icon: "🔮",  pathName: "Path of Wisdom",       tiers: ["Scholar", "Sage", "Prodigy", "Polymath", "Philosopher", "Luminary", "Oracle", "Seer", "Omniscient", "Archmage", "Enlightened", "The All-Seeing"] },
    "C":    { color: "#f0b429", icon: "🪙",  pathName: "Path of Cunning",      tiers: ["Coin-Seeker", "Rogue", "Master of Coin", "Guild Master", "Trade Baron", "Market Sovereign", "High Tycoon", "Gold Weaver", "The Midas", "Dragon of the Vault", "Vault Lord", "Lord of Aurum"] },
    "EM":   { color: "#ff6b35", icon: "🔥",  pathName: "The Immortal Path",    tiers: ["Striker", "Spartan", "Berserker", "Myrmidon", "Ironclad", "Dreadnought", "Conqueror", "Warmaster", "Imperator", "Overlord", "Goliath", "Hercules"] },
    "MW":   { color: "#9b59f5", icon: "⚡",  pathName: "The Spellsword Path",  tiers: ["Initiate", "Spellsword", "Battlemage", "Magus", "Rune-Knight", "Arcanist", "Mystic Warrior", "Eldritch Knight", "Grand-Magus", "Spellbreaker", "Weaver of Blades", "Odin's Heir"] },
    "CM":   { color: "#e67e22", icon: "🗡️",  pathName: "The Mercenary Path",   tiers: ["Sellsword", "Mercenary", "Bounty Hunter", "Corsair", "Privateer", "Warlord of Coin", "Golden Knight", "Treasure Hunter", "Dragon Slayer", "Hoard Master", "Emperor of Swords", "The Golden Warlord"] },
    "EW":   { color: "#00e5ff", icon: "⛩️",  pathName: "The Awakened Path",    tiers: ["Novitiate", "Ascetic", "Monk", "Mystic", "Zen Master", "Grandmaster", "Spirit Walker", "Astral Traveler", "Chronomancer", "Void Walker", "Transcendent", "The Awakened"] },
    "CE":   { color: "#2ecc71", icon: "🧭",  pathName: "The Pioneer Path",     tiers: ["Explorer", "Pioneer", "Voyager", "Navigator", "Trailblazer", "Prospector", "Silk Rider", "Horizon Walker", "World Trader", "Realm Walker", "Star Farer", "The Celestial"] },
    "CW":   { color: "#1abc9c", icon: "♟️",  pathName: "The Mastermind Path",  tiers: ["Scribe", "Strategist", "Mastermind", "Illusionist", "Emissary", "Diplomat", "Chancellor", "Vizier", "Puppeteer", "Shadow Broker", "The Architect", "Weaver of Fates"] },
    "EMW":  { color: "#e056fd", icon: "⚜️",  pathName: "The Paladin Path",     tiers: ["Squire", "Knight", "Paladin", "Templar", "Inquisitor", "Crusader", "Lightbringer", "Justiciar", "Seraph", "Archangel", "Virtuoso", "The Radiant"] },
    "CEM":  { color: "#f39c12", icon: "👑",  pathName: "The Imperial Path",    tiers: ["Captain", "General", "Conqueror", "Sovereign", "Monarch", "Emperor", "Tsar", "Pharaoh", "High-King", "Dynast", "World-Ender", "The Supreme"] },
    "CMW":  { color: "#d35400", icon: "⚒️",  pathName: "The Forge Path",       tiers: ["Apprentice", "Artificer", "Runesmith", "Inventor", "Forge Master", "Technomancer", "Maker", "World Builder", "Reality Shaper", "Demiurge", "Prime Creator", "The Genesis"] },
    "CEW":  { color: "#3498db", icon: "⏳",  pathName: "The Fate Path",        tiers: ["Envoy", "Herald", "Bard", "Lorekeeper", "Chronicler", "Time Weaver", "Fate Spinner", "Destiny Child", "Oracle King", "Myth Maker", "Eternity Walker", "The Infinite"] },
    "CEMW": { color: "#ffffff", icon: "🌟",  pathName: "The Paragon Path",     tiers: ["Adventurer", "Hero", "Champion", "Paragon", "Legend", "Mythic", "Chosen One", "Nephalem", "Demigod", "Ascendant", "Immortal", "The Avatar"] }
  };

  // ── 4. TIME & RESET LOGIC ──
  const today = new Date().toDateString();
  const lastLogin = localStorage.getItem("lastLogin");

  if (lastLogin !== today) {
    if (lastLogin) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      streak = (lastLogin === yesterday) ? streak + 1 : 1;
      totalDays++;

      let questsDone = 0;
      ["d_pushups", "d_db_curl", "d_bb_curl", "d_walk3km", "d_skipping"].forEach(id => {
        if (questState[id]) questsDone++;
      });

      if (questsDone === 0) {
        strength = Math.max(1, strength - 1);
        vitality = Math.max(1, vitality - 1);
        stamina  = Math.max(1, stamina - 1);
        setTimeout(() => alert("⚠️ Zero Day Detected: Strength, Vitality & Stamina have decreased by 1."), 1000);
      }
      
      // Midnight Health Decay
      healthScore = Math.max(1, healthScore - 50);
    }

    questState = {};
    actionCounts = {};
    undoStack = [];
    dailyWater = 0;
    dailySleep = 0;
    workedOutToday = 0; // Clear frequency baseline for the new day
    localStorage.setItem("workedOutToday", "0");
    localStorage.setItem("bossClaimed", "false");
    localStorage.setItem("lastLogin", today);
  }

  // Weekly Reset
  function getMondayKey(d) {
    const date = new Date(d);
    const day = date.getDay();                         
    const diff = (day === 0 ? -6 : 1 - day);            
    const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate() + diff);
    return monday.toDateString();
  }
  const nowDate = new Date();
  const currentMondayKey = getMondayKey(nowDate);
  const savedMondayKey = localStorage.getItem("currentWeekMonday");
  if (savedMondayKey !== currentMondayKey) {
    wkWater = 0; wkReading = 0; wkWorkouts = 0; wkXP = 0;
    weeklyProgress = { pushups: 0, curls: 0, squats: 0, walk: 0, skips: 0, readGen: 0, readFin: 0, water: 0, sleep: 0 };
    ["w_iron","w_arms","w_legs","w_ranger","w_cyclone","w_scholar","w_market","w_hydro","w_alchem"]
      .forEach(id => delete questState[id]);
    localStorage.setItem("currentWeekMonday", currentMondayKey);
  }

  // Monthly Reset
  const lastMo = getNum("lastMonthReset", 0);
  if (!lastMo || nowDate.getMonth() !== new Date(lastMo).getMonth() || nowDate.getFullYear() !== new Date(lastMo).getFullYear()) {
    moWater = 0; moReading = 0; moWorkouts = 0; moXP = 0;
    localStorage.setItem("lastMonthReset", Date.now());
  }

  // ── 5. CORE FUNCTIONS ──
  function getHealthScore() {
    let wPct = Math.min(100, (dailyWater / 3.0) * 100);
    let sPct = Math.min(100, (dailySleep / 7.0) * 100);
    return Math.floor((wPct * 0.5) + (sPct * 0.5));
  }

  function getXPMultiplier() {
    let s = Math.round(healthScore);
    if (s < 25) return 0.75;
    if (s >= 25 && s <= 65) return 1.0;
    if (s > 65 && s <= 80) return 1.25;
    if (s > 80) return 1.5;
    return 1.0;
  }

  // Frequency logging rule (prevents logging multiple workout days within 24 hours)
  function logWorkoutDay() {
    if (workedOutToday === 0) {
      workedOutToday = 1;
      wkWorkouts++;
      moWorkouts++;
    }
  }

  function saveData() {
    localStorage.setItem("xp", xp);
    localStorage.setItem("level", level);
    localStorage.setItem("totalXP", totalXP);
    localStorage.setItem("totalDays", totalDays);
    localStorage.setItem("streak", streak);
    localStorage.setItem("healthScore", healthScore);
    localStorage.setItem("dailyWater", dailyWater);
    localStorage.setItem("dailySleep", dailySleep);
    localStorage.setItem("workedOutToday", workedOutToday);
    localStorage.setItem("water", water);
    localStorage.setItem("reading", reading);
    localStorage.setItem("workouts", workouts);
    localStorage.setItem("wkWater", wkWater);
    localStorage.setItem("wkReading", wkReading);
    localStorage.setItem("wkWorkouts", wkWorkouts);
    localStorage.setItem("wkXP", wkXP);
    localStorage.setItem("moWater", moWater);
    localStorage.setItem("moReading", moReading);
    localStorage.setItem("moWorkouts", moWorkouts);
    localStorage.setItem("moXP", moXP);
    localStorage.setItem("strength", strength);
    localStorage.setItem("knowledgeGen", knowledgeGen);
    localStorage.setItem("knowledgeFin", knowledgeFin);
    localStorage.setItem("vitality", vitality);
    localStorage.setItem("stamina", stamina);
    localStorage.setItem("questState",    JSON.stringify(questState));
    localStorage.setItem("actionCounts",  JSON.stringify(actionCounts));
    localStorage.setItem("undoStack",     JSON.stringify(undoStack));
    localStorage.setItem("playerClass",   JSON.stringify(playerClass));
    localStorage.setItem("weeklyProgress",JSON.stringify(weeklyProgress));
  }

  function getXPNeeded(l) { return Math.floor(100 * Math.pow(1.3, l - 1)); }

  function darkenHex(hex, factor = 0.65) {
    const h = hex.replace("#", "");
    if (h.length !== 6) return hex;
    const r = Math.max(0, Math.floor(parseInt(h.slice(0, 2), 16) * factor));
    const g = Math.max(0, Math.floor(parseInt(h.slice(2, 4), 16) * factor));
    const b = Math.max(0, Math.floor(parseInt(h.slice(4, 6), 16) * factor));
    return "#" + [r, g, b].map(v => v.toString(16).padStart(2, "0")).join("");
  }

  function applyTheme() {
    const color = playerClass.color || "#f0b429";
    document.documentElement.style.setProperty('--gold',    color);
    document.documentElement.style.setProperty('--gold-dk', darkenHex(color, 0.65));
    document.documentElement.style.setProperty('--gold-gl', color + '40');
  }

  function updateUI() {
    try {
      const el = (id) => document.getElementById(id);
      if (el("streak"))         el("streak").innerText = streak + (streak === 1 ? " Day" : " Days");
      if (el("levelText"))      el("levelText").innerText = `Level ${level}`;
      if (el("avatar"))         el("avatar").innerText = playerClass.icon;
      if (el("classNameTitle")) el("classNameTitle").innerText = playerClass.name;
      if (el("charClassLabel")) el("charClassLabel").innerText = String(playerClass.name).toUpperCase();
      if (el("charPathLabel"))  el("charPathLabel").innerText = playerClass.pathName;

      const needed = getXPNeeded(level);
      if (el("xpText")) el("xpText").innerText = `${xp} / ${needed} XP`;
      if (el("xpFill")) el("xpFill").style.width = `${Math.min(100, (xp / needed) * 100)}%`;
      
      let displayHealth = Math.round(healthScore);
      let multi = getXPMultiplier();
      if (el("healthScoreDisplay")) el("healthScoreDisplay").innerText = displayHealth;
      if (el("healthFill")) el("healthFill").style.width = `${displayHealth}%`;
      if (el("xpMultiplierBadge")) el("xpMultiplierBadge").innerText = `${multi}x XP Boost`;

      if (el("dailyWaterText")) el("dailyWaterText").innerText = `${Number(dailyWater).toFixed(1)} / 3.0 L`;
      if (el("dailySleepText")) el("dailySleepText").innerText = `${Number(dailySleep).toFixed(2)} / 7.0 hrs`;

      if (el("strengthStat"))     el("strengthStat").innerText     = Math.floor(strength);
      if (el("knowledgeGenStat")) el("knowledgeGenStat").innerText = Math.floor(knowledgeGen);
      if (el("knowledgeFinStat")) el("knowledgeFinStat").innerText = Math.floor(knowledgeFin);
      if (el("vitalityStat"))     el("vitalityStat").innerText     = Math.floor(vitality);
      if (el("staminaStat"))      el("staminaStat").innerText      = Math.floor(stamina);

      if (el("ltWater"))    el("ltWater").innerText    = water.toFixed(1) + " L";
      if (el("ltReading"))  el("ltReading").innerText  = reading + " pages";
      if (el("ltWorkouts")) el("ltWorkouts").innerText = workouts;
      if (el("ltTotalXP"))  el("ltTotalXP").innerText  = totalXP.toLocaleString();

      if (el("totalDaysActive")) el("totalDaysActive").innerText = totalDays;

      const pM = strength;
      const pE = (stamina + vitality) / 2;
      const pW = knowledgeGen;
      const pC = knowledgeFin;
      let focus = "Balanced";
      const maxS = Math.max(pM, pE, pW, pC);
      if (maxS > 1.5) {
        if      (maxS === pM) focus = "Might (Physical)";
        else if (maxS === pE) focus = "Endurance (Health)";
        else if (maxS === pW) focus = "Wisdom (General)";
        else if (maxS === pC) focus = "Cunning (Finance)";
      }
      if (el("dominantFocus")) el("dominantFocus").innerText = focus;

      const maxBar = Math.max(pM, pE, pW, pC, 20);
      if (el("strengthBar"))     el("strengthBar").style.width     = `${(strength     / maxBar) * 100}%`;
      if (el("knowledgeGenBar")) el("knowledgeGenBar").style.width = `${(knowledgeGen / maxBar) * 100}%`;
      if (el("knowledgeFinBar")) el("knowledgeFinBar").style.width = `${(knowledgeFin / maxBar) * 100}%`;
      if (el("vitalityBar"))     el("vitalityBar").style.width     = `${(vitality     / maxBar) * 100}%`;
      if (el("staminaBar"))      el("staminaBar").style.width      = `${(stamina      / maxBar) * 100}%`;

      // Progress Tab Metrics (Shows target metric strings explicitly as 'Days')
      if (el("wkWaterProgTxt")) el("wkWaterProgTxt").innerText = `${wkWater.toFixed(1)} / 21 L`;
      if (el("wkWaterBar")) el("wkWaterBar").style.width = `${Math.min(100, (wkWater / 21) * 100)}%`;
      if (el("wkReadProgTxt")) el("wkReadProgTxt").innerText = `${wkReading} / 70 Pgs`;
      if (el("wkReadBar")) el("wkReadBar").style.width = `${Math.min(100, (wkReading / 70) * 100)}%`;
      if (el("wkWktProgTxt")) el("wkWktProgTxt").innerText = `${wkWorkouts} / 4 Days`;
      if (el("wkWktBar")) el("wkWktBar").style.width = `${Math.min(100, (wkWorkouts / 4) * 100)}%`;

      if (el("moWaterProgTxt")) el("moWaterProgTxt").innerText = `${moWater.toFixed(1)} / 90 L`;
      if (el("moWaterBar")) el("moWaterBar").style.width = `${Math.min(100, (moWater / 90) * 100)}%`;
      if (el("moReadProgTxt")) el("moReadProgTxt").innerText = `${moReading} / 300 Pgs`;
      if (el("moReadBar")) el("moReadBar").style.width = `${Math.min(100, (moReading / 300) * 100)}%`;
      if (el("moWktProgTxt")) el("moWktProgTxt").innerText = `${moWorkouts} / 16 Days`;
      if (el("moWktBar")) el("moWktBar").style.width = `${Math.min(100, (moWorkouts / 16) * 100)}%`;

    } catch (e) {
      console.error("UI Update Failed", e);
    }
  }

  // ── 6. GAMEPLAY LOGIC ──
  function showFloatingXP(el, amount) {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const floatEl = document.createElement("div");
    floatEl.className = "xp-float";
    floatEl.innerText = "+" + amount + " XP";
    floatEl.style.left = (rect.left + rect.width / 2 - 20) + "px";
    floatEl.style.top  = rect.top + "px";
    document.body.appendChild(floatEl);
    setTimeout(() => floatEl.remove(), 1100);
  }

  function saveSnapshot() {
    const s = {
      xp, level, totalXP, healthScore, dailyWater, dailySleep, workedOutToday,
      water, reading, workouts,
      wkWater, wkReading, wkWorkouts, wkXP,
      moWater, moReading, moWorkouts, moXP,
      strength, knowledgeGen, knowledgeFin, vitality, stamina,
      questState:     JSON.parse(JSON.stringify(questState)),
      actionCounts:   JSON.parse(JSON.stringify(actionCounts)),
      weeklyProgress: JSON.parse(JSON.stringify(weeklyProgress)),
      playerClass:    JSON.parse(JSON.stringify(playerClass))
    };
    undoStack.push(s);
    if (undoStack.length > 50) undoStack.shift();
  }

  window.undoLastAction = function () {
    if (undoStack.length === 0) return alert("Nothing left to undo today!");
    const s = undoStack.pop();
    xp = s.xp; level = s.level; totalXP = s.totalXP;
    healthScore = s.healthScore || 100; dailyWater = s.dailyWater || 0; dailySleep = s.dailySleep || 0;
    workedOutToday = s.workedOutToday || 0;
    water = s.water; reading = s.reading; workouts = s.workouts;
    wkWater = s.wkWater; wkReading = s.wkReading; wkWorkouts = s.wkWorkouts; wkXP = s.wkXP;
    moWater = s.moWater; moReading = s.moReading; moWorkouts = s.moWorkouts; moXP = s.moXP;
    strength = s.strength; knowledgeGen = s.knowledgeGen; knowledgeFin = s.knowledgeFin;
    vitality = s.vitality; stamina = s.stamina; 
    questState = s.questState; actionCounts = s.actionCounts;
    weeklyProgress = s.weeklyProgress; playerClass = s.playerClass;
    applyTheme(); updateUI(); renderEverything(); saveData();
  };

  let pendingEvo = null;
  function processLevelUp() {
    let needed = getXPNeeded(level);
    let leveled = false;
    let failsafe = 0;
    let hitMilestoneIdx = -1; 

    while (xp >= needed && failsafe < 50) {
      xp -= needed;
      level++;
      leveled = true;
      needed = getXPNeeded(level);
      failsafe++;

      const idx = MILESTONES.indexOf(level);
      if (idx !== -1) hitMilestoneIdx = idx;
    }

    if (leveled) {
      if (hitMilestoneIdx !== -1) {
        const pM = strength;
        const pE = (stamina + vitality) / 2;
        const pW = knowledgeGen;
        const pC = knowledgeFin;
        const max = Math.max(pM, pE, pW, pC);
        if (max > 0) {
          const active = [];
          if (pC >= max * 0.8) active.push("C");
          if (pE >= max * 0.8) active.push("E");
          if (pM >= max * 0.8) active.push("M");
          if (pW >= max * 0.8) active.push("W");
          const pData = EVOLUTION_PATHS[active.sort().join("")];
          if (pData) {
            pendingEvo = {
              name: pData.tiers[hitMilestoneIdx], icon: pData.icon, color: pData.color, pathName: pData.pathName
            };
            document.getElementById("evoSection").classList.remove("hidden");
            document.getElementById("btnStandardContinue").classList.add("hidden");
            document.getElementById("evoNewName").innerText = pendingEvo.name;
            document.getElementById("evoNewIcon").innerText = pendingEvo.icon;
            document.getElementById("evoNewIcon").style.background = pendingEvo.color + "33";
            document.getElementById("evoNewIcon").style.border = "2px solid " + pendingEvo.color;
            document.getElementById("evoPathDesc").innerText = pendingEvo.pathName;
          }
        }
      } else {
        document.getElementById("evoSection").classList.add("hidden");
        document.getElementById("btnStandardContinue").classList.remove("hidden");
      }
      document.getElementById("levelUpNum").innerText = level;
      document.getElementById("levelUpOverlay").classList.add("show");
    }
  }

  window.closeLevelUp = () => document.getElementById("levelUpOverlay").classList.remove("show");
  window.acceptEvolution = () => {
    if (pendingEvo) { playerClass = pendingEvo; saveData(); applyTheme(); updateUI(); }
    window.closeLevelUp();
  };
  window.declineEvolution = window.closeLevelUp;

  window.doTask = function (id, baseXP, btn) {
    saveSnapshot();
    if (btn) {
      const r = document.createElement("span");
      const sz = Math.max(btn.clientWidth, btn.clientHeight) * 2;
      r.style.cssText = `position:absolute; border-radius:50%; width:${sz}px; height:${sz}px; background:rgba(255,255,255,.08); animation:ripple .55s ease forwards; pointer-events:none;`;
      btn.appendChild(r);
      setTimeout(() => r.remove(), 560);
    }

    const count = actionCounts[id + "_stat"] || 0;
    actionCounts[id + "_stat"] = count + 1;

    const factor = Math.pow(0.75, count);
    const g = 0.1 * factor;
    
    let earnedXP = Math.max(1, Math.round(baseXP * factor));
    earnedXP = Math.round(earnedXP * getXPMultiplier());

    if (btn) showFloatingXP(btn, earnedXP);

    // Baseline Health healing
    if (id === "t_water")       { water += 0.5; wkWater += 0.5; moWater += 0.5; dailyWater += 0.5; weeklyProgress.water += 0.5; healthScore = Math.min(100, healthScore + 8.33); }
    if (id === "t_water_micro") { water += 0.1; wkWater += 0.1; moWater += 0.1; dailyWater += 0.1; weeklyProgress.water += 0.1; healthScore = Math.min(100, healthScore + 1.66); }
    if (id === "t_sleep")       { dailySleep += 0.5; weeklyProgress.sleep += 0.5; healthScore = Math.min(100, healthScore + 3.57); }
    if (id === "t_sleep_micro") { dailySleep += 0.25; weeklyProgress.sleep += 0.25; healthScore = Math.min(100, healthScore + 1.78); }

    // Exercise Tasks trigger distinct day increments 
    if (id === "t_readGen")  { reading += 10; wkReading += 10; moReading += 10; knowledgeGen += g; weeklyProgress.readGen += 10; }
    if (id === "t_readFin")  { reading += 10; wkReading += 10; moReading += 10; knowledgeFin += g; weeklyProgress.readFin += 10; }
    if (id === "t_pushups")  { strength += g; workouts++; logWorkoutDay(); weeklyProgress.pushups += 10; }
    if (id === "t_pullups")  { strength += 0.15 * factor; workouts++; logWorkoutDay(); } 
    if (id === "t_bb_curl" || id === "t_db_curl") { strength += g; workouts++; logWorkoutDay(); weeklyProgress.curls += 10; }
    if (id === "t_squats")   { strength += g; vitality += g; workouts++; logWorkoutDay(); weeklyProgress.squats += 10; }
    if (id === "t_walk")     { stamina  += g; vitality += g; weeklyProgress.walk += 1;  }
    if (id === "t_skipping") { stamina  += g; workouts++; logWorkoutDay(); weeklyProgress.skips += 50; }

    xp += earnedXP; totalXP += earnedXP; wkXP += earnedXP; moXP += earnedXP;
    processLevelUp(); updateUI(); renderEverything(); saveData();
  };

  window.doQuest = function (id, baseXP, el) {
    if (questState[id]) return;
    saveSnapshot();
    questState[id] = true;

    let earnedXP = Math.round(baseXP * getXPMultiplier());
    if (el) showFloatingXP(el, earnedXP);

    if (id === "d_pushups")                          { strength += 0.1; workouts++; logWorkoutDay(); weeklyProgress.pushups += 20; }
    if (id === "d_db_curl" || id === "d_bb_curl")    { strength += 0.1; workouts++; logWorkoutDay(); weeklyProgress.curls += 15; }
    if (id === "d_walk3km")                          { stamina  += 0.1; weeklyProgress.walk += 3;  }
    if (id === "d_skipping")                         { stamina  += 0.1; workouts++; logWorkoutDay(); weeklyProgress.skips += 200;}

    xp += earnedXP; totalXP += earnedXP; wkXP += earnedXP; moXP += earnedXP;
    processLevelUp(); updateUI(); renderEverything(); saveData();
  };

  window.claimBoss = function () {
    if (localStorage.getItem("bossClaimed") === "true") return;
    saveSnapshot();
    localStorage.setItem("bossClaimed", "true");
    
    let earnedXP = Math.round(200 * getXPMultiplier());
    const btn = document.getElementById("bossClaimBtn");
    showFloatingXP(btn, earnedXP);
    
    xp += earnedXP; totalXP += earnedXP; wkXP += earnedXP; moXP += earnedXP;
    processLevelUp(); updateUI(); renderEverything(); saveData();
  };

  // ── 7. RENDERING ──
  function renderEverything() {
    try {
      const cQ = [
        { id: "d_pushups",  label: "💪 20 Pushups",   xp: 10 },
        { id: "d_db_curl",  label: "💪 15 DB Curls",  xp: 10 },
        { id: "d_bb_curl",  label: "💪 15 BB Curls",  xp: 10 },
        { id: "d_walk3km",  label: "👟 3km Walk",     xp: 15 },
        { id: "d_skipping", label: "🪢 200 Skipping", xp: 15 }
      ];
      
      const coreQuestListEl = document.getElementById("coreQuestList");
      if (coreQuestListEl) {
        let multi = getXPMultiplier();
        coreQuestListEl.innerHTML = cQ.map(q => {
          const d = questState[q.id];
          const adjXP = Math.round(q.xp * multi);
          return `<div class="quest-item ${d ? 'done' : ''}" onclick="doQuest('${q.id}',${q.xp}, this)">
            <div class="q-check">${d ? '✓' : ''}</div>
            <span class="q-text">${q.label}</span>
            <span class="q-xp">+${adjXP} XP</span>
          </div>`;
        }).join("");
      }

      const doneCount = cQ.filter(q => questState[q.id]).length;
      if (document.getElementById("bossFill")) document.getElementById("bossFill").style.width = `${(doneCount / cQ.length) * 100}%`;
      if (document.getElementById("bossProgress")) document.getElementById("bossProgress").innerText = `${doneCount} / ${cQ.length}`;
      
      const bossClaimBtnEl = document.getElementById("bossClaimBtn");
      if (bossClaimBtnEl) {
        if (doneCount === cQ.length && localStorage.getItem("bossClaimed") !== "true") {
          bossClaimBtnEl.classList.remove("hidden");
          bossClaimBtnEl.innerText = `🎁 Claim ${Math.round(200 * getXPMultiplier())} XP`;
        } else {
          bossClaimBtnEl.classList.add("hidden");
        }
      }

      const aT = [
        { id: "t_water",       icon: "💧",  label: "0.5L Water",     xp: 5  },
        { id: "t_water_micro", icon: "💧",  label: "100ml Water",    xp: 2  },
        { id: "t_readGen",     icon: "📚",  label: "10 Pgs Gen",     xp: 10 },
        { id: "t_readFin",     icon: "📈",  label: "10 Pgs Fin",     xp: 10 },
        { id: "t_pushups",     icon: "💪",  label: "10 Pushups",     xp: 10 },
        { id: "t_pullups",     icon: "🧗",  label: "10 Pullups",     xp: 15 },
        { id: "t_bb_curl",     icon: "🏋️", label: "10 BB Curl",     xp: 10 },
        { id: "t_db_curl",     icon: "🏋️", label: "10 DB Curl",     xp: 10 },
        { id: "t_squats",      icon: "🦵",  label: "10 Squats",      xp: 10 },
        { id: "t_walk",        icon: "👟",  label: "1km Walk",       xp: 10 },
        { id: "t_skipping",    icon: "🪢",  label: "50 Skipping",    xp: 10 },
        { id: "t_sleep",       icon: "💤",  label: "0.5h Sleep",     xp: 5  },
        { id: "t_sleep_micro", icon: "💤",  label: "15m Rest",       xp: 2  }
      ];
      
      const additionalTaskListEl = document.getElementById("additionalTaskList");
      if (additionalTaskListEl) {
        let multi = getXPMultiplier();
        additionalTaskListEl.innerHTML = aT.map(t => {
          const count = actionCounts[t.id + "_stat"] || 0;
          let currentXP = Math.max(1, Math.round(t.xp * Math.pow(0.75, count)));
          currentXP = Math.round(currentXP * multi);
          
          return `<button class="log-btn" onclick="doTask('${t.id}',${t.xp},this)">
            <span class="log-icon">${t.icon}</span>
            <span class="log-name">${t.label}</span>
            <span class="log-xp">+${currentXP} XP</span>
          </button>`;
        }).join("");
      }

      const wQ = [
        { id: "w_iron",    label: "💪 The Iron Marathon", k: "pushups", t: 200,  xp: 150 },
        { id: "w_arms",    label: "🏋️ Arms of Steel",     k: "curls",   t: 150,  xp: 150 },
        { id: "w_legs",    label: "🦵 Leg Day Hero",       k: "squats",  t: 100,  xp: 150 },
        { id: "w_ranger",  label: "👟 Ranger's Path",      k: "walk",    t: 25,   xp: 150 },
        { id: "w_cyclone", label: "🪢 Skipping Cyclone",   k: "skips",   t: 1500, xp: 150 },
        { id: "w_scholar", label: "📚 Scholar's Tome",     k: "readGen", t: 100,  xp: 150 },
        { id: "w_market",  label: "📈 Market Master",      k: "readFin", t: 100,  xp: 150 },
        { id: "w_hydro",   label: "💧 Hydration Master",   k: "water",   t: 20,   xp: 100 },
        { id: "w_alchem",  label: "💤 Alchemist's Rest",   k: "sleep",   t: 50,   xp: 150 }
      ];
      
      const weeklyQuestListEl = document.getElementById("weeklyQuestList");
      if (weeklyQuestListEl) {
        weeklyQuestListEl.innerHTML = wQ.map(q => {
          const cur = Math.min(weeklyProgress[q.k] || 0, q.t);
          if (cur >= q.t && !questState[q.id]) {
            questState[q.id] = true;
            xp += q.xp; totalXP += q.xp; wkXP += q.xp; moXP += q.xp;
            processLevelUp();
          }
          const done = questState[q.id];
          return `<div class="weekly-card ${done ? 'done' : ''}">
            <div class="w-top"><span class="w-label">${q.label}</span><span class="w-xp">+${q.xp} XP</span></div>
            <div class="w-bar"><div class="w-fill" style="width:${(cur / q.t) * 100}%"></div></div>
            <div class="w-bot">${cur} / ${q.t} ${done ? '✓' : ''}</div>
          </div>`;
        }).join("");
      }
    } catch (e) {
      console.error("Rendering Failed", e);
    }
  }

  window.hardReset = function () {
    if (confirm("Delete all data? This cannot be undone.")) {
      localStorage.clear();
      location.reload();
    }
  };

  try {
    applyTheme();
    updateUI();
    renderEverything();
    saveData();
  } catch (initErr) {
    saveData();
  }

});
