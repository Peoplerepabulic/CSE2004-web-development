const CHECKLIST_KEY = "bass-fishing-checklist";
const TRIP_PLAN_KEY = "bass-fishing-trip-plan";

const checklistItems = document.querySelectorAll(".trip-item");
const progressText = document.querySelector("#progress-text");
const progressFill = document.querySelector("#progress-fill");
const progressTrack = document.querySelector(".progress-track");
const readyMessage = document.querySelector("#ready-message");
const resetButton = document.querySelector("#reset-checklist");

function saveChecklist() {
  try {
    const state = [...checklistItems].map((item) => item.checked);
    localStorage.setItem(CHECKLIST_KEY, JSON.stringify(state));
  } catch (error) {
    /* storage unavailable; the checklist still works for this page view */
  }
}

function loadChecklist() {
  try {
    const saved = JSON.parse(localStorage.getItem(CHECKLIST_KEY) || "[]");
    checklistItems.forEach((item, index) => {
      item.checked = saved[index] === true;
    });
  } catch (error) {
    /* corrupted data; start unchecked */
  }
}

function updateChecklist() {
  const total = checklistItems.length;
  const checked = [...checklistItems].filter((item) => item.checked).length;
  const percent = total === 0 ? 0 : (checked / total) * 100;

  progressText.textContent = `${checked} of ${total} ready`;
  progressFill.style.width = `${percent}%`;
  progressTrack.setAttribute("aria-valuenow", checked);
  readyMessage.hidden = checked !== total;
  saveChecklist();
}

checklistItems.forEach((item) => {
  item.addEventListener("change", updateChecklist);
});

resetButton.addEventListener("click", () => {
  checklistItems.forEach((item) => {
    item.checked = false;
  });
  updateChecklist();
});

loadChecklist();
updateChecklist();

const tripForm = document.querySelector(".trip-form");
const formMessage = document.querySelector("#form-message");
const planSummary = document.querySelector("#plan-summary");
const planDetails = document.querySelector("#plan-details");
const tripDateInput = document.querySelector("#trip-date");

// Prevent choosing a past date (uses the visitor's local date).
(function setMinDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  tripDateInput.min = `${year}-${month}-${day}`;
})();

const EXPERIENCE_LABELS = {
  "first-time": "First time fishing",
  beginner: "Beginner",
  intermediate: "Intermediate",
};

const TIME_LABELS = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
};

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderPlanSummary(plan) {
  const rows = [
    ["Name", plan.name || "Not given"],
    ["Experience", EXPERIENCE_LABELS[plan.experience] || "Not chosen"],
    ["Preferred date", plan.date || "Not chosen"],
    ["Time of day", TIME_LABELS[plan.time] || "Not chosen"],
    ["Practice goal", plan.notes || "Not given"],
  ];
  planDetails.innerHTML = rows
    .map(
      ([label, value]) =>
        `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd>`
    )
    .join("");
  planSummary.hidden = false;
}

function loadTripPlan() {
  try {
    const saved = JSON.parse(localStorage.getItem(TRIP_PLAN_KEY) || "null");
    if (!saved) return;
    document.querySelector("#angler-name").value = saved.name || "";
    document.querySelector("#experience").value = saved.experience || "";
    if (saved.date) tripDateInput.value = saved.date;
    if (saved.time) {
      const radio = tripForm.querySelector(
        `input[name="time"][value="${saved.time}"]`
      );
      if (radio) radio.checked = true;
    }
    document.querySelector("#notes").value = saved.notes || "";
    renderPlanSummary(saved);
  } catch (error) {
    /* corrupted data; start with a blank form */
  }
}

tripForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const plan = {
    name: document.querySelector("#angler-name").value.trim(),
    experience: document.querySelector("#experience").value,
    date: tripDateInput.value,
    time:
      (tripForm.querySelector('input[name="time"]:checked') || {}).value || "",
    notes: document.querySelector("#notes").value.trim(),
  };

  try {
    localStorage.setItem(TRIP_PLAN_KEY, JSON.stringify(plan));
  } catch (error) {
    /* storage unavailable; the summary still renders for this page view */
  }

  renderPlanSummary(plan);
  formMessage.textContent =
    "Plan saved in this browser and shown below. Nothing was sent anywhere.";
});

loadTripPlan();

/* ---------- Theme toggle ---------- */
const themeToggle = document.querySelector("#theme-toggle");

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
  themeToggle.setAttribute(
    "aria-label",
    theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
  );
  try {
    localStorage.setItem("bass-fishing-theme", theme);
  } catch (error) {
    /* storage unavailable; theme still applies for this page view */
  }
}

(function initTheme() {
  let saved = null;
  try {
    saved = localStorage.getItem("bass-fishing-theme");
  } catch (error) {
    /* ignore */
  }
  const prefersDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(saved || (prefersDark ? "dark" : "light"));
})();

themeToggle.addEventListener("click", () => {
  const current =
    document.documentElement.getAttribute("data-theme") === "dark"
      ? "dark"
      : "light";
  applyTheme(current === "dark" ? "light" : "dark");
});

/* ---------- Lure picker ---------- */
const pickButton = document.querySelector("#pick-lure");
const pickerResult = document.querySelector("#picker-result");
const pickerLure = document.querySelector("#picker-lure");
const pickerWhy = document.querySelector("#picker-why");
const pickerHow = document.querySelector("#picker-how");

function checkedValue(name) {
  const el = document.querySelector(`input[name="${name}"]:checked`);
  return el ? el.value : "";
}

function recommendLure(water, weather, time) {
  if (time === "night") {
    return {
      lure: "Black buzzbait or spinnerbait",
      why: "At night bass hunt by vibration and silhouette, not sight. A dark lure makes the strongest silhouette against the surface.",
      how: "Slow-roll it just under or on the surface near shallow cover. Keep the retrieve steady so bass can track it.",
    };
  }
  if (water === "muddy") {
    return {
      lure: "Chartreuse spinnerbait",
      why: "In muddy water bass cannot see far, so you need flash and thump. Bright chartreuse shows up best and the blades call fish in from a distance.",
      how: "Cast past cover and retrieve at a medium pace, bumping it off wood or rocks when you can.",
    };
  }
  if (
    (time === "morning" || time === "evening") &&
    weather !== "windy" &&
    water !== "muddy"
  ) {
    return {
      lure: "Topwater popper",
      why: "Calm low-light periods are prime topwater time. Bass push baitfish up and strike aggressively at the surface.",
      how: "Pop, pause, pop. Let it sit still for a few seconds between pops — most strikes come on the pause.",
    };
  }
  if (weather === "windy") {
    return {
      lure: "Spinnerbait",
      why: "Wind chops the surface and pushes baitfish against banks. A spinnerbait stays stable in chop and its flash mimics fleeing shad.",
      how: "Cast with the wind along windy banks and burn it just under the surface.",
    };
  }
  if (water === "clear" && weather === "sunny" && time === "midday") {
    return {
      lure: "Wacky-rigged Senko or drop shot",
      why: "Clear water plus bright midday sun makes bass wary. Go finesse: a slow-falling soft plastic in natural colors is hard to refuse.",
      how: "Cast to shade, docks, or depth changes. Let it fall on slack line and watch the line for subtle ticks.",
    };
  }
  if (weather === "overcast") {
    return {
      lure: "Shallow crankbait",
      why: "Cloud cover makes bass roam and chase. A crankbait covering water quickly finds the active fish.",
      how: "Steady retrieve, deflecting off cover. Vary the speed until you get bit, then repeat what worked.",
    };
  }
  if (weather === "rain") {
    return {
      lure: "Spinnerbait",
      why: "Rain washes food into the water and breaks up the surface, making bass less cautious and more willing to chase.",
      how: "Fish it a little faster than usual near runoff areas and shallow cover.",
    };
  }
  return {
    lure: "Texas-rigged soft-plastic worm",
    why: "When nothing stands out about the conditions, the Texas rig is the all-rounder: weedless, natural, and effective almost everywhere.",
    how: "Cast, let it sink to the bottom, then lift-and-drop it slowly back to you.",
  };
}

pickButton.addEventListener("click", () => {
  const rec = recommendLure(
    checkedValue("water"),
    checkedValue("weather"),
    checkedValue("timeofday")
  );
  pickerLure.textContent = rec.lure;
  pickerWhy.textContent = rec.why;
  pickerHow.textContent = rec.how;
  pickerResult.hidden = false;
});

/* ---------- Catch log ---------- */
const LOG_KEY = "bass-fishing-catch-log";
const logForm = document.querySelector("#log-form");
const logEntries = document.querySelector("#log-entries");
const logEmpty = document.querySelector("#log-empty");
const logStats = document.querySelector("#log-stats");
const statTotal = document.querySelector("#stat-total");
const statHeaviest = document.querySelector("#stat-heaviest");
const statLatest = document.querySelector("#stat-latest");
const logMessage = document.querySelector("#log-message");
const logDateInput = document.querySelector("#log-date");
const logPhotoInput = document.querySelector("#log-photo");

let pendingPhotoDataUrl = null;

function localToday() {
  const t = new Date();
  const month = String(t.getMonth() + 1).padStart(2, "0");
  const day = String(t.getDate()).padStart(2, "0");
  return `${t.getFullYear()}-${month}-${day}`;
}

function setLogDateToday() {
  const today = localToday();
  logDateInput.value = today;
  logDateInput.max = today;
}

function loadLog() {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveLog(entries) {
  try {
    localStorage.setItem(LOG_KEY, JSON.stringify(entries));
    return true;
  } catch (error) {
    return false; // storage full or unavailable
  }
}

function formatLogDate(iso) {
  if (!iso) return "–";
  const d = new Date(iso + "T12:00:00");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function entryHtml(e) {
  const sizeBits = [];
  if (e.weight) sizeBits.push(escapeHtml(String(e.weight)) + " lbs");
  if (e.length) sizeBits.push(escapeHtml(String(e.length)) + " in");
  const size = sizeBits.length ? ` <span>· ${sizeBits.join(" · ")}</span>` : "";
  const img = e.photo
    ? `<img src="${e.photo}" alt="Photo of a ${escapeHtml(
        e.species || "bass"
      )} caught at ${escapeHtml(e.location || "unknown location")}" loading="lazy">`
    : "";
  const lure = e.lure
    ? `<p><strong>Lure:</strong> ${escapeHtml(e.lure)}</p>`
    : "";
  const notes = e.notes ? `<p>${escapeHtml(e.notes)}</p>` : "";
  return (
    `<article class="log-card">${img}<div class="log-card-body">` +
    `<h4>${escapeHtml(e.species || "Bass")}${size}</h4>` +
    `<p class="log-meta">${escapeHtml(formatLogDate(e.date))} · ${escapeHtml(
      e.location || "Unknown location"
    )}</p>` +
    `${lure}${notes}` +
    `<button class="delete-button" type="button" data-id="${e.id}">Delete</button>` +
    `</div></article>`
  );
}

function renderLog() {
  const entries = loadLog().sort(
    (a, b) => String(b.date).localeCompare(String(a.date)) || b.id - a.id
  );

  if (entries.length === 0) {
    logStats.hidden = true;
    logEmpty.hidden = false;
    logEntries.innerHTML = "";
    return;
  }

  logStats.hidden = false;
  logEmpty.hidden = true;
  statTotal.textContent = entries.length;

  const weights = entries
    .map((e) => parseFloat(e.weight))
    .filter((w) => !isNaN(w) && w > 0);
  statHeaviest.textContent = weights.length
    ? Math.max(...weights).toFixed(1)
    : "–";
  statLatest.textContent = formatLogDate(entries[0].date);

  logEntries.innerHTML = entries.map(entryHtml).join("");
}

logPhotoInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  pendingPhotoDataUrl = null;
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 900;
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      pendingPhotoDataUrl = canvas.toDataURL("image/jpeg", 0.75);
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
});

logForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const entry = {
    id: Date.now(),
    date: logDateInput.value,
    location: document.querySelector("#log-location").value.trim(),
    species: document.querySelector("#log-species").value,
    weight: document.querySelector("#log-weight").value,
    length: document.querySelector("#log-length").value,
    lure: document.querySelector("#log-lure").value.trim(),
    notes: document.querySelector("#log-notes").value.trim(),
    photo: pendingPhotoDataUrl,
  };

  const entries = loadLog();
  entries.push(entry);

  if (saveLog(entries)) {
    logMessage.textContent = "Catch logged. Nice one!";
  } else {
    // Storage full: retry without the photo.
    entry.photo = null;
    pendingPhotoDataUrl = null;
    logPhotoInput.value = "";
    if (saveLog(entries)) {
      logMessage.textContent =
        "Saved, but the photo was too large for browser storage and was skipped.";
    } else {
      logMessage.textContent =
        "Could not save — browser storage is full or unavailable.";
      return;
    }
  }

  logForm.reset();
  setLogDateToday();
  pendingPhotoDataUrl = null;
  renderLog();
});

logEntries.addEventListener("click", (event) => {
  const btn = event.target.closest(".delete-button");
  if (!btn) return;
  const id = Number(btn.getAttribute("data-id"));
  saveLog(loadLog().filter((e) => e.id !== id));
  renderLog();
});

setLogDateToday();
renderLog();
