import {
  ZONE,
  PREF_KEY,
  dayOptions,
  availableHours,
  timeLabel,
  parkHour,
  loadForecast,
  windowWeather,
  rankPlaces,
  composePlan,
  summarizePlan,
  minuteLabel,
  traits,
  AREA_LABELS,
} from "./planner-core.mjs?v=2";

const $ = (selector) => document.querySelector(selector);
const escapeHTML = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const stamp = (time) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: ZONE,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(time));
const moodLabels = {
  sun: "Room for a little sunshine",
  cloud: "A softer kind of sky",
  rain: "Leave room for a rain plan",
  snow: "A wintry little forecast",
  storm: "A day to reconsider outdoors",
};
const moodIcons = { sun: "☀", cloud: "☁", rain: "☂", snow: "❄", storm: "☂" };
let guide,
  storage,
  forecast = { rows: [], source: "loading" },
  loading = false;
let dirty = false,
  planView = null;
let plan = null,
  excluded = [],
  preferences,
  savedContext = [];
const CONTEXT_KEY = "forest-park-plan-context-v1";

function storageWarning() {
  $("#planner-storage").hidden = false;
  $("#planner-storage").textContent =
    "This browser could not save everything. Your plan works for this visit; download a copy to keep it.";
}
function writeStorage(key, value) {
  try {
    if (!storage) throw new Error();
    storage.setItem(key, JSON.stringify(value));
  } catch {
    storageWarning();
  }
}
function readStorage(key) {
  try {
    return JSON.parse(storage?.getItem(key) || "null");
  } catch {
    return null;
  }
}
function refreshDates() {
  const dates = dayOptions();
  const previous = $("#outing-date").value;
  if (
    [...$("#outing-date").options].map((o) => o.value).join() !== dates.join()
  ) {
    $("#outing-date").replaceChildren(
      ...dates.map(
        (date, i) =>
          new Option(
            `${i ? "Tomorrow" : "Today"} · ${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(date + "T12:00:00Z"))}`,
            date,
          ),
      ),
    );
    if (dates.includes(previous)) $("#outing-date").value = previous;
  }
  refreshHours();
}
function refreshHours() {
  const date = $("#outing-date").value;
  const duration = Number($("#outing-duration").value);
  const previous = Number($("#outing-hour").value);
  const hours = availableHours(date, duration);
  $("#outing-hour").replaceChildren(
    ...hours.map((h) => new Option(timeLabel(h), String(h))),
  );
  if (hours.includes(previous)) $("#outing-hour").value = String(previous);
  if (!hours.length)
    $("#outing-hour").append(new Option("No start times left today", ""));
  $("#make-plan").disabled = !hours.length;
  $("#planner-form-message").textContent = hours.length
    ? ""
    : "It’s a little late for this visit length. Choose tomorrow or a shorter outing.";
}
function readPreferences() {
  return {
    date: $("#outing-date").value,
    hour: Number($("#outing-hour").value),
    duration: Number($("#outing-duration").value),
    interests: [
      ...document.querySelectorAll('input[name="interest"]:checked'),
    ].map((i) => i.value),
    follow: $("#follow-weather").checked,
    compact: $("#compact-plan").checked,
  };
}
function weatherForPrefs() {
  if (!preferences || !$("#outing-hour").value) return null;
  return windowWeather(
    forecast.rows,
    preferences.date,
    preferences.hour,
    preferences.duration,
  );
}
function weatherText(w) {
  return w
    ? `${Math.round(w.low)}–${Math.round(w.high)}°F · up to ${Math.round(w.rain)}% hourly precipitation chance · wind up to ${Math.round(w.wind)} mph`
    : "Weather unavailable for this whole window; these are interest-based suggestions.";
}
function contextText(p = preferences) {
  return `${p.date} · ${timeLabel(p.hour)}–${timeLabel(p.hour + p.duration / 60)} St. Louis time · ${p.duration / 60} ${p.duration === 60 ? "hour" : "hours"}`;
}
function markPlanOutdated(message) {
  if (!plan) return;
  dirty = true;
  $("#plan-update").hidden = false;
  $("#plan-update-message").textContent = message;
  $("#make-plan").textContent = "Update my little day →";
  $("#plan-update button").disabled = !$("#outing-hour").value;
  document
    .querySelectorAll("[data-plan-up],[data-plan-down],[data-plan-remove]")
    .forEach((b) => (b.disabled = true));
  $("#download-plan").disabled = true;
  saveButtonState();
}
function applyWeatherScene() {
  const w = weatherForPrefs();
  if (preferences?.follow && w) document.body.dataset.weather = w.mood;
  else delete document.body.dataset.weather;
}
function comfortCost(w) {
  return (
    w.rain +
    w.wind * 2 +
    Math.max(0, w.feelsHigh - 80) * 3 +
    Math.max(0, 45 - w.feelsLow) * 2 +
    (w.dark ? 45 : 0) +
    (w.severe ? 300 : 0)
  );
}
function renderWeather() {
  const w = weatherForPrefs();
  $("#weather-panel").setAttribute("aria-busy", String(loading));
  $("#weather-retry").disabled = loading;
  $("#weather-retry").textContent = loading
    ? "Checking the forecast…"
    : "Refresh forecast ↻";
  $("#weather-title").textContent = w
    ? moodLabels[w.mood]
    : loading
      ? "A peek at the sky…"
      : "The sky is a little uncertain.";
  $("#weather-mark").textContent = w ? moodIcons[w.mood] : "☁";
  const age = forecast.fetchedAt
    ? `Retrieved ${stamp(forecast.fetchedAt)}.`
    : "";
  $("#weather-status").textContent = loading
    ? "Fetching the park’s hourly forecast. You can still plan by interest."
    : forecast.source === "unavailable"
      ? "The forecast couldn’t be loaded. Retry when you’re connected, or plan by interest below."
      : forecast.source === "stale"
        ? `Refresh failed. Showing a saved forecast, not the latest. ${age}`
        : `${forecast.source === "cache" ? "Recent saved forecast." : "Hourly forecast loaded."} ${age}`;
  $("#weather-facts").innerHTML = w
    ? `<div><strong>${Math.round(w.low)}–${Math.round(w.high)}<small>°F</small></strong><span>forecast temperature</span></div><div><strong>${Math.round(w.rain)}<small>%</small></strong><span>highest hourly precip. chance</span></div><div><strong>${Math.round(w.wind)}<small> mph</small></strong><span>highest forecast wind</span></div>`
    : "<p>No complete forecast for this window. Fixed places are still here to explore.</p>";
  $("#weather-advice").textContent = !w
    ? "No weather assumptions are used in your recommendations."
    : w.severe
      ? "Concerning conditions are forecast. Consider another time; this guide is not a weather alert service."
      : w.wet
        ? "Keep a flexible plan. Indoor visits need confirmed hours and, for shows, tickets."
        : w.dark
          ? "This window includes hours after dark. Check lighting, access and closing times."
          : w.wind >= 18
            ? "A breezy window. An indoor pause may suit you better than an exposed picnic."
            : w.feelsHigh >= 85
              ? "Leave room for shade, water and a slower pace."
              : w.feelsLow <= 35
                ? "Bring warm layers; an indoor break may be welcome."
                : "A little time outside could fit this forecast. Conditions can still change.";
  $("#weather-hours").innerHTML = w
    ? w.rows
        .map(
          (r) =>
            `<div><time datetime="${new Date(r.time).toISOString()}">${timeLabel(parkHour(r.time))}</time><strong>${Math.round(r.temperature_2m)}°</strong><span>${Math.round(r.precipitation_probability)}% precip.</span></div>`,
        )
        .join("")
    : "";
  const better = $("#better-window");
  better.hidden = true;
  if (w && forecast.source !== "stale") {
    const alternatives = availableHours(preferences.date, preferences.duration)
      .map((hour) => ({
        hour,
        w: windowWeather(
          forecast.rows,
          preferences.date,
          hour,
          preferences.duration,
        ),
      }))
      .filter((a) => a.w)
      .sort((a, b) => comfortCost(a.w) - comfortCost(b.w));
    if (
      alternatives[0] &&
      comfortCost(w) - comfortCost(alternatives[0].w) >= 15
    ) {
      better.hidden = false;
      better.dataset.hour = alternatives[0].hour;
      better.textContent = `Try ${timeLabel(alternatives[0].hour)} for a gentler forecast →`;
    }
  }
  applyWeatherScene();
}
function saveButtonState() {
  if (!plan) return;
  const allSaved =
    plan.stops.length &&
    plan.stops.every((s) => guide.savedIds().includes(s.place.id));
  $("#save-plan").disabled =
    dirty || plan.overBudget || !plan.stops.length || Boolean(allSaved);
  $("#save-plan").textContent = allSaved
    ? "These stops are in your day ✓"
    : "Add these stops to my day +";
}
function renderPlan({ focus = false, message = "" } = {}) {
  const w = planView.weather;
  $("#plan-result").hidden = false;
  $("#plan-title").textContent = plan.stops.length
    ? "A little day, just for you."
    : "Let’s leave a little more room.";
  $("#plan-summary").textContent = plan.stops.length
    ? `${plan.visitMinutes} min visiting · ${plan.bufferMinutes} min cushion · ${plan.overBudget ? `${-plan.spareMinutes} min over budget` : `${plan.spareMinutes} min open`}`
    : "No fitting stops";
  $("#plan-context").textContent =
    `${contextText(planView.preferences)}. ${weatherText(w)}${planView.source === "stale" ? " · Saved forecast, not current." : ""}`;
  $("#plan-notice").textContent =
    (plan.overBudget
      ? "This order needs more transfer allowance than your time budget. Remove a stop, change the order or allow more time before saving."
      : message) ||
    (w?.severe
      ? "Consider postponing. Indoor suggestions do not guarantee safe travel or open doors."
      : "A suggested order, not a route. Confirm opening hours, reservations and actual travel before setting out.");
  $("#suggested-stops").innerHTML = plan.stops
    .map((item, i) => {
      const p = item.place;
      const slot = plan.timeline[i];
      const area = AREA_LABELS[traits[p.id].cluster];
      const access = traits[p.id].indoor
        ? "Indoor visit · confirm hours"
        : traits[p.id].booking
          ? "Arrange access or equipment"
          : "Outdoor visit";
      return `<li class="suggested-stop"><div class="stop-slot"><span>${minuteLabel(slot.start)}–${minuteLabel(slot.end)}</span><small>${i ? `${slot.transfer} min transfer allowance before this stop` : "Your first pause"}</small></div><img class="suggestion-art" src="assets/places/${p.id}.webp" alt="Hand-painted interpretation of ${escapeHTML(p.name)} in Forest Park" width="960" height="640"><div class="suggestion-copy"><span class="eyebrow">STOP ${String(i + 1).padStart(2, "0")} · ${p.minutes} MIN VISIT</span><h4>${escapeHTML(p.name)}</h4><div class="stop-tags"><span>${area}</span><span>${access}</span></div><ul>${item.reasons.map((reason) => `<li>${escapeHTML(reason)}</li>`).join("")}</ul><div class="suggestion-links"><button type="button" class="text-button" data-plan-detail="${p.id}">Take a closer look ↗</button><a href="${escapeHTML(p.source)}" target="_blank" rel="noreferrer">Check hours & access ↗</a></div></div><div class="suggestion-controls"><button type="button" data-plan-up="${p.id}" aria-label="Move ${escapeHTML(p.name)} earlier" ${i === 0 ? "disabled" : ""}>↑</button><button type="button" data-plan-down="${p.id}" aria-label="Move ${escapeHTML(p.name)} later" ${i === plan.stops.length - 1 ? "disabled" : ""}>↓</button><button type="button" data-plan-remove="${p.id}" aria-label="Remove ${escapeHTML(p.name)} from suggestion">×</button></div></li>`;
    })
    .join("");
  $("#plan-empty").hidden = Boolean(plan.stops.length);
  $("#plan-empty-reason").textContent = excluded.length
    ? "You removed the suggested stops. Restore suggestions, change your interests or allow more time."
    : w?.severe
      ? "Your interests do not match an indoor stop that fits. Try another date or allow more time; consider postponing outdoor plans."
      : "These interests need a longer visit, or no matching place fits. Try two hours, half a day or all interests. You can always browse all fourteen places below.";
  $("#download-plan").disabled = dirty || plan.overBudget || !plan.stops.length;
  $("#broaden-plan").hidden = !preferences.interests.length;
  saveButtonState();
  if (focus) $("#plan-title").focus({ preventScroll: true });
}
function generate({ focus = false, message = "" } = {}) {
  if (!$("#outing-hour").value) return;
  dirty = false;
  $("#plan-update").hidden = true;
  $("#make-plan").textContent = "Find my little day →";
  planView = {
    preferences: { ...preferences, interests: [...preferences.interests] },
    weather: weatherForPrefs(),
    source: forecast.source,
    fetchedAt: forecast.fetchedAt,
  };
  plan = composePlan(
    rankPlaces(guide.places, preferences, weatherForPrefs()),
    preferences.duration,
    excluded,
    { compact: preferences.compact, startHour: preferences.hour },
  );
  renderPlan({ focus, message });
}
function preferencesChanged() {
  refreshDates();
  preferences = readPreferences();
  excluded = [];
  writeStorage(PREF_KEY, preferences);
  renderWeather();
  markPlanOutdated(
    "Your choices changed. Update the suggestions when you’re ready; your edited plan is kept here until then.",
  );
}
async function refreshWeather(force = false) {
  if (loading) return;
  loading = true;
  renderWeather();
  forecast = await loadForecast({ storage, force });
  loading = false;
  if (forecast.storageAvailable === false) storageWarning();
  refreshDates();
  preferences = readPreferences();
  renderWeather();
  if (
    plan &&
    (forecast.fetchedAt !== planView.fetchedAt ||
      forecast.source !== planView.source)
  ) {
    markPlanOutdated(
      "The forecast was refreshed. Review updated suggestions before saving; your edited order has not been changed.",
    );
  }
}
function planNotes() {
  return [
    "PLANNING REFERENCE — FOREST PARK",
    contextText(planView.preferences),
    weatherText(planView.weather),
    planView.fetchedAt
      ? `Forecast retrieved ${stamp(planView.fetchedAt)}${planView.source === "stale" ? " (saved forecast; refresh failed)" : ""}.`
      : "No weather data available.",
    `${plan.visitMinutes} minutes visiting; ${plan.bufferMinutes} minutes of planning cushion; ${plan.spareMinutes} minutes unallocated.`,
    "Cushions are not measured travel times. Check actual travel, hours, tickets and current conditions.",
    "",
  ];
}
function downloadPlan() {
  if (dirty || !plan || plan.overBudget) return;
  const lines = [
    ...planNotes(),
    ...plan.stops.flatMap((s, i) => [
      `${i + 1}. ${s.place.name} — ${minuteLabel(plan.timeline[i].start)}–${minuteLabel(plan.timeline[i].end)} (${s.place.minutes} min visit)`,
      `${AREA_LABELS[traits[s.place.id].cluster]} · ${plan.timeline[i].transfer} min transfer allowance before this stop`,
      s.place.location,
      ...s.reasons,
      s.place.source,
      "",
    ]),
  ];
  const url = URL.createObjectURL(
    new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "forest-park-suggested-day.txt";
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  $("#plan-notice").textContent =
    "Your suggestion is ready to download. It includes the forecast timestamp and official place links.";
}
function boot() {
  guide = window.ForestGuide;
  if (!guide) return;
  try {
    storage = window.localStorage;
  } catch {
    storageWarning();
  }
  const stored = readStorage(PREF_KEY);
  const storedContext = readStorage(CONTEXT_KEY);
  if (
    Array.isArray(storedContext) &&
    storedContext.length < 20 &&
    storedContext.every((s) => typeof s === "string" && s.length < 1000)
  )
    savedContext = storedContext;
  refreshDates();
  if (stored && [60, 120, 240].includes(stored.duration))
    $("#outing-duration").value = String(stored.duration);
  if (stored && dayOptions().includes(stored.date))
    $("#outing-date").value = stored.date;
  refreshHours();
  if (
    stored &&
    availableHours(
      $("#outing-date").value,
      Number($("#outing-duration").value),
    ).includes(stored.hour)
  )
    $("#outing-hour").value = String(stored.hour);
  if (stored && Array.isArray(stored.interests))
    document
      .querySelectorAll('input[name="interest"]')
      .forEach((i) => (i.checked = stored.interests.includes(i.value)));
  $("#follow-weather").checked = stored?.follow === true;
  $("#compact-plan").checked = stored?.compact !== false;
  preferences = readPreferences();
  window.ForestPlanner = Object.freeze({
    exportContext: () =>
      savedContext.length
        ? [
            "Last saved planning reference (your edited list may differ):",
            ...savedContext,
          ]
        : [],
  });
  $("#outing-form").addEventListener("change", preferencesChanged);
  $("#outing-form").addEventListener("submit", (event) => {
    event.preventDefault();
    refreshDates();
    preferences = readPreferences();
    excluded = [];
    writeStorage(PREF_KEY, preferences);
    renderWeather();
    generate({ focus: true });
    $("#plan-result").scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
      block: "start",
    });
  });
  $("#follow-weather").addEventListener("change", () => {
    preferences = readPreferences();
    writeStorage(PREF_KEY, preferences);
    applyWeatherScene();
  });
  document.querySelectorAll("button[data-scene]").forEach((button) =>
    button.addEventListener("click", () => {
      $("#follow-weather").checked = false;
      preferences = readPreferences();
      writeStorage(PREF_KEY, preferences);
      applyWeatherScene();
    }),
  );
  $("#weather-retry").addEventListener("click", () => refreshWeather(true));
  $("#better-window").addEventListener("click", () => {
    $("#outing-hour").value = $("#better-window").dataset.hour;
    preferencesChanged();
    $("#outing-hour").focus();
  });
  $("#broaden-plan").addEventListener("click", () => {
    document
      .querySelectorAll('input[name="interest"]')
      .forEach((i) => (i.checked = false));
    preferencesChanged();
    generate({ focus: true });
  });
  $("#reset-plan").addEventListener("click", () => {
    excluded = [];
    generate({ focus: true });
  });
  $("#save-plan").addEventListener("click", () => {
    if (dirty || !plan || plan.overBudget) return;
    const kept = guide.addStops(plan.stops.map((s) => s.place.id));
    savedContext = planNotes();
    writeStorage(CONTEXT_KEY, savedContext);
    if (!kept) storageWarning();
    $("#plan-notice").textContent = kept
      ? "Added to your saved day without replacing your existing stops. You can reorder or remove them below."
      : "Your stops are kept for this visit. Download a copy before leaving.";
    saveButtonState();
    $("#plan-notice").tabIndex = -1;
    $("#plan-notice").focus({ preventScroll: true });
  });
  $("#download-plan").addEventListener("click", downloadPlan);
  $("#suggested-stops").addEventListener("click", (event) => {
    const b = event.target.closest("button");
    if (!b) return;
    if (b.dataset.planDetail) {
      guide.openPlace(b.dataset.planDetail);
      return;
    }
    if (dirty) return;
    const focusId =
      b.dataset.planUp || b.dataset.planDown || b.dataset.planRemove;
    const direction = b.dataset.planUp
      ? "up"
      : b.dataset.planDown
        ? "down"
        : "remove";
    if (b.dataset.planRemove) {
      excluded.push(b.dataset.planRemove);
      plan.stops = plan.stops.filter(
        (s) => s.place.id !== b.dataset.planRemove,
      );
    } else {
      const id = b.dataset.planUp || b.dataset.planDown;
      const i = plan.stops.findIndex((s) => s.place.id === id);
      const next = i + (b.dataset.planUp ? -1 : 1);
      if (i < 0 || next < 0 || next >= plan.stops.length) return;
      [plan.stops[i], plan.stops[next]] = [plan.stops[next], plan.stops[i]];
    }
    plan = summarizePlan(
      plan.stops,
      planView.preferences.duration,
      planView.preferences.hour,
    );
    renderPlan({
      message:
        "Your suggestion has been adjusted. Add it to your day when you’re ready.",
    });
    const sameControl = document.querySelector(
      `[data-plan-${direction}="${focusId}"]:not(:disabled)`,
    );
    const fallback =
      document.querySelector(`[data-plan-remove="${focusId}"]`) ||
      document.querySelector("[data-plan-remove]") ||
      $("#reset-plan");
    (sameControl || fallback).focus({ preventScroll: true });
  });
  document.addEventListener("field-notes-change", (event) => {
    if (!event.detail.ids.length) {
      savedContext = [];
      writeStorage(CONTEXT_KEY, []);
    }
    saveButtonState();
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      const previous = JSON.stringify(preferences);
      refreshDates();
      preferences = readPreferences();
      if (previous !== JSON.stringify(preferences)) {
        renderWeather();
        markPlanOutdated(
          "The available dates or start times changed. Update your suggestions before saving.",
        );
      }
      if (
        forecast.fetchedAt &&
        Date.now() - forecast.fetchedAt > 30 * 60 * 1000
      )
        refreshWeather();
    }
  });
  refreshWeather();
}
if (document.readyState === "loading")
  document.addEventListener("DOMContentLoaded", boot, { once: true });
else boot();
