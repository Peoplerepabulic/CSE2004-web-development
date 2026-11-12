import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import {
  dayOptions,
  parkDate,
  availableHours,
  windowWeather,
  rankPlaces,
  composePlan,
  summarizePlan,
  transferMinutes,
  minuteLabel,
  traits,
  loadForecast,
  CACHE_KEY,
  parseForecast,
  readCache,
  MAX_CACHE_MS,
} from "../dist/planner-core.mjs";
const placeSource = readFileSync(
  new URL("../dist/app.js", import.meta.url),
  "utf8",
).split("const $ =")[0];
const places = vm.runInNewContext(
  placeSource + ";JSON.parse(JSON.stringify(places))",
);
const now = Date.parse("2026-11-11T14:00:00Z");
const row = (hour, extra = {}) => ({
  time: Date.parse("2026-11-11T06:00:00Z") + hour * 3600000,
  temperature_2m: 65,
  apparent_temperature: 65,
  precipitation_probability: 10,
  weather_code: 1,
  cloud_cover: 20,
  wind_speed_10m: 5,
  is_day: 1,
  ...extra,
});
const rows = Array.from({ length: 12 }, (_, i) => row(i + 8));
const payload = (data = rows) => ({
  hourly_units: {
    time: "unixtime",
    temperature_2m: "°F",
    wind_speed_10m: "mp/h",
  },
  hourly: Object.fromEntries(
    Object.keys(data[0]).map((key) => [
      key,
      data.map((r) => (key === "time" ? r[key] / 1000 : r[key])),
    ]),
  ),
});
const storage = (value) => ({
  getItem: () => value || null,
  setItem(k, v) {
    value = v;
  },
  value: () => value,
});
const preferences = {
  date: "2026-11-11",
  hour: 10,
  duration: 120,
  interests: [],
};
const clear = windowWeather(rows, preferences.date, 10, 120);
test("St. Louis dates and DST use park time, not the device timezone", () => {
  assert.equal(parkDate(Date.parse("2026-11-12T02:00:00Z")), "2026-11-11");
  assert.deepEqual(dayOptions(Date.parse("2026-11-01T05:30:00Z")), [
    "2026-11-01",
    "2026-11-02",
  ]);
  assert.deepEqual(
    availableHours("2026-11-11", 240, Date.parse("2026-11-12T01:00:00Z")),
    [],
  );
  assert.ok(availableHours("2026-11-12", 240, now).includes(8));
});
test("forecast validates units, null rows, gaps and actual window coverage", () => {
  assert.equal(parseForecast(payload()).length, 12);
  assert.throws(() =>
    parseForecast({ ...payload(), hourly_units: { temperature_2m: "°C" } }),
  );
  const bad = payload();
  bad.hourly.temperature_2m[2] = null;
  assert.equal(windowWeather(parseForecast(bad), "2026-11-11", 10, 120), null);
  assert.equal(windowWeather(rows, "2026-11-12", 10, 120), null);
  assert.equal(windowWeather(rows, "2026-11-11", 19, 120), null);
  assert.equal(clear.high, 65);
});
test("rain favors genuine indoor options, never The Muny or outdoor gardens", () => {
  const wet = windowWeather(
    rows.map((r) => ({
      ...r,
      precipitation_probability: 80,
      weather_code: 61,
    })),
    "2026-11-11",
    10,
    120,
  );
  const ranked = rankPlaces(places, preferences, wet);
  assert.ok(["planetarium", "history-museum"].includes(ranked[0].place.id));
  assert.ok(!ranked.some((r) => r.place.id === "muny"));
  assert.ok(
    ranked
      .find((r) => r.place.id === "jewel-box")
      .reasons.some((s) => s.includes("outdoor")),
  );
});
test("storm does not recommend outdoor sport or call woodland shelter", () => {
  const storm = windowWeather(
    rows.map((r) => ({ ...r, weather_code: 95 })),
    "2026-11-11",
    10,
    120,
  );
  assert.equal(
    rankPlaces(places, { ...preferences, interests: ["sport"] }, storm).length,
    0,
  );
  assert.ok(
    rankPlaces(places, preferences, storm).every((r) =>
      ["planetarium", "history-museum"].includes(r.place.id),
    ),
  );
});
test("interests and full visit lengths are honored, with honest empty results", () => {
  const ranked = rankPlaces(
    places,
    { ...preferences, duration: 60, interests: ["sport"] },
    clear,
  );
  assert.ok(
    ranked.every((r) => ["archery", "dwight-tennis"].includes(r.place.id)),
  );
  const culture = rankPlaces(
    places,
    { ...preferences, duration: 60, interests: ["culture"] },
    clear,
  );
  assert.deepEqual(
    Array.from(culture, (r) => r.place.id),
    ["planetarium"],
  );
  const plan = composePlan(rankPlaces(places, preferences, clear), 120);
  assert.ok(plan.visitMinutes + plan.bufferMinutes <= 120);
  assert.equal(plan.spareMinutes, 120 - plan.visitMinutes - plan.bufferMinutes);
  assert.equal(
    new Set(plan.stops.map((s) => s.place.id)).size,
    plan.stops.length,
  );
  assert.ok(
    composePlan(ranked, 60, ["archery", "dwight-tennis"]).stops.length === 0,
  );
});
test("offline/manual recommendations disclose no weather assumptions", () => {
  assert.ok(
    rankPlaces(places, preferences, null).every((r) =>
      r.reasons.some((s) => s.includes("weather is unavailable")),
    ),
  );
});
test("fetch success caches validated data; fresh cache avoids repeat requests", async () => {
  const s = storage();
  let requests = 0;
  const fetchImpl = async () => {
    requests++;
    return { ok: true, json: async () => payload() };
  };
  const result = await loadForecast({ fetchImpl, storage: s, now });
  assert.equal(result.source, "network");
  assert.ok(JSON.parse(s.value()).rows.length);
  const cached = await loadForecast({ fetchImpl, storage: s, now: now + 1000 });
  assert.equal(cached.source, "cache");
  assert.equal(requests, 1);
});
test("API 500 returns timestamped cached forecast or explicit unavailable", async () => {
  const cached = storage(
    JSON.stringify({ version: 1, fetchedAt: now - 3600000, rows }),
  );
  const fetchImpl = async () => ({ ok: false });
  const result = await loadForecast({ fetchImpl, storage: cached, now });
  assert.equal(result.source, "stale");
  assert.equal(result.fetchedAt, now - 3600000);
  assert.equal(
    (await loadForecast({ fetchImpl, storage: storage(), now })).source,
    "unavailable",
  );
});
test("malformed responses, corrupt cache and expired cache never become fake weather", async () => {
  const fetchImpl = async () => ({
    ok: true,
    json: async () => ({ error: true }),
  });
  assert.equal(
    (await loadForecast({ fetchImpl, storage: storage("{broken"), now }))
      .source,
    "unavailable",
  );
  assert.equal(
    readCache(
      storage(
        JSON.stringify({ version: 1, fetchedAt: now - MAX_CACHE_MS - 1, rows }),
      ),
      now,
    ),
    null,
  );
});
test("storage denied preserves successful forecast in memory", async () => {
  const blocked = {
    getItem() {
      throw new Error("SecurityError");
    },
    setItem() {
      throw new Error("QuotaExceededError");
    },
  };
  const result = await loadForecast({
    fetchImpl: async () => ({ ok: true, json: async () => payload() }),
    storage: blocked,
    now,
  });
  assert.equal(result.source, "network");
  assert.equal(result.storageAvailable, false);
  assert.ok(result.rows.length);
});
test("network timeout aborts and returns manual fallback", async () => {
  const fetchImpl = (_, { signal }) =>
    new Promise((resolve, reject) =>
      signal.addEventListener("abort", () => reject(new Error("AbortError"))),
    );
  const result = await loadForecast({
    fetchImpl,
    storage: storage(),
    now,
    timeoutMs: 5,
  });
  assert.equal(result.source, "unavailable");
});

test("compact plans stay in one area; cross-area plans reserve a larger allowance", () => {
  const ranked = rankPlaces(
    places,
    { ...preferences, duration: 240, interests: ["culture"] },
    clear,
  );
  const compact = composePlan(ranked, 240, [], {
    compact: true,
    startHour: 10,
  });
  assert.equal(
    new Set(compact.stops.map((s) => traits[s.place.id].cluster)).size,
    1,
  );
  const wider = composePlan(ranked, 240, [], { compact: false, startHour: 10 });
  assert.equal(wider.stops.length, 2);
  assert.equal(wider.bufferMinutes, 40);
  assert.equal(wider.timeline[1].start, wider.timeline[0].end + 40);
  assert.equal(wider.spareMinutes, 50);
});
test("reordering recomputes allowances and detects an over-budget plan", () => {
  const ranked = rankPlaces(places, preferences, clear);
  const byId = (id) => ranked.find((s) => s.place.id === id);
  const a = byId("grand-basin"),
    b = byId("art-hill"),
    c = byId("pagoda-circle");
  assert.equal(transferMinutes(a, b), 20);
  assert.equal(transferMinutes(a, c), 40);
  assert.equal(summarizePlan([a, b, c], 150, 10).overBudget, false);
  const changed = summarizePlan([a, c, b], 150, 10);
  assert.equal(changed.overBudget, true);
  assert.equal(changed.spareMinutes, -10);
});
test("timeline labels handle noon and visits ending on minute boundaries", () => {
  assert.equal(minuteLabel(12 * 60), "12:00pm");
  assert.equal(minuteLabel(11 * 60 + 25), "11:25am");
  const plan = composePlan(rankPlaces(places, preferences, clear), 120, [], {
    startHour: 11,
  });
  assert.equal(plan.timeline[0].start, 660);
  assert.ok(plan.timeline.at(-1).end <= 780);
});
test("all interest/budget combinations stay unique, within budget and respect exclusions", () => {
  for (const duration of [60, 120, 240])
    for (const interest of [
      [],
      ["walk"],
      ["water"],
      ["culture"],
      ["sport"],
      ["family"],
    ])
      for (const compact of [true, false]) {
        const ranked = rankPlaces(
          places,
          { ...preferences, duration, interests: interest },
          clear,
        );
        const plan = composePlan(ranked, duration, ["art-hill"], {
          compact,
          startHour: 10,
        });
        assert.ok(plan.spareMinutes >= 0);
        assert.equal(plan.overBudget, false);
        assert.ok(!plan.stops.some((s) => s.place.id === "art-hill"));
        assert.equal(
          new Set(plan.stops.map((s) => s.place.id)).size,
          plan.stops.length,
        );
      }
});
