/** Pure planning rules and the weather boundary; no DOM dependencies. */
export const ZONE = "America/Chicago";
export const CACHE_KEY = "forest-park-weather-v1";
export const PREF_KEY = "forest-park-planner-v1";
export const FRESH_MS = 30 * 60 * 1000;
export const MAX_CACHE_MS = 24 * 60 * 60 * 1000;
export const WEATHER_URL =
  "https://api.open-meteo.com/v1/forecast?" +
  new URLSearchParams({
    latitude: "38.638",
    longitude: "-90.285",
    hourly:
      "temperature_2m,apparent_temperature,precipitation_probability,weather_code,cloud_cover,wind_speed_10m,is_day",
    forecast_days: "3",
    temperature_unit: "fahrenheit",
    wind_speed_unit: "mph",
    timezone: ZONE,
    timeformat: "unixtime",
  });
const dateFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
export function parkDate(time = Date.now()) {
  const parts = Object.fromEntries(
    dateFormat.formatToParts(new Date(time)).map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}
export function dayOptions(now = Date.now()) {
  const today = parkDate(now);
  const next = new Date(`${today}T12:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return [today, next.toISOString().slice(0, 10)];
}
export function parkHour(time) {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: ZONE,
      hour: "numeric",
      hourCycle: "h23",
    }).format(new Date(time)),
  );
}
export function timeLabel(hour) {
  return `${hour % 12 || 12}${hour < 12 ? "am" : "pm"}`;
}
export function availableHours(date, duration, now = Date.now()) {
  return Array.from({ length: 12 }, (_, i) => i + 8).filter(
    (h) =>
      h + duration / 60 <= 20 && (date !== parkDate(now) || h > parkHour(now)),
  );
}
const fields = [
  "temperature_2m",
  "apparent_temperature",
  "precipitation_probability",
  "weather_code",
  "cloud_cover",
  "wind_speed_10m",
  "is_day",
];
function validRow(r) {
  return (
    r &&
    ["time", ...fields].every(
      (k) => typeof r[k] === "number" && Number.isFinite(r[k]),
    ) &&
    r.time > 0 &&
    r.temperature_2m >= -100 &&
    r.temperature_2m <= 150 &&
    r.precipitation_probability >= 0 &&
    r.precipitation_probability <= 100 &&
    r.cloud_cover >= 0 &&
    r.cloud_cover <= 100 &&
    r.wind_speed_10m >= 0 &&
    [0, 1].includes(r.is_day)
  );
}
export function parseForecast(data) {
  if (
    !data?.hourly ||
    !Array.isArray(data.hourly.time) ||
    data.hourly.time.length > 1000 ||
    data.hourly_units?.temperature_2m !== "°F" ||
    data.hourly_units?.time !== "unixtime" ||
    !["mp/h", "mph"].includes(data.hourly_units?.wind_speed_10m)
  )
    throw new Error("Unexpected weather data");
  const rows = data.hourly.time
    .map((time, i) =>
      Object.fromEntries([
        ["time", time * 1000],
        ...fields.map((k) => [k, data.hourly[k]?.[i]]),
      ]),
    )
    .filter(validRow);
  if (!rows.length || rows.some((r, i) => i && r.time <= rows[i - 1].time))
    throw new Error("Incomplete weather data");
  return rows;
}
export function readCache(storage, now) {
  try {
    const cache = JSON.parse(storage?.getItem(CACHE_KEY) || "null");
    if (
      cache?.version !== 1 ||
      !Number.isFinite(cache.fetchedAt) ||
      cache.fetchedAt > now ||
      now - cache.fetchedAt > MAX_CACHE_MS ||
      !Array.isArray(cache.rows) ||
      !cache.rows.length ||
      cache.rows.length > 1000 ||
      !cache.rows.every(validRow) ||
      cache.rows.some((r, i) => i && r.time <= cache.rows[i - 1].time)
    )
      return null;
    return cache;
  } catch {
    return null;
  }
}
export async function loadForecast({
  fetchImpl = fetch,
  storage,
  now = Date.now(),
  force = false,
  timeoutMs = 12000,
} = {}) {
  const cache = readCache(storage, now);
  if (!force && cache && now - cache.fetchedAt < FRESH_MS)
    return { ...cache, source: "cache" };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(WEATHER_URL, {
      signal: controller.signal,
      credentials: "omit",
      referrerPolicy: "no-referrer",
    });
    if (!response.ok) throw new Error("Weather service unavailable");
    const rows = parseForecast(await response.json());
    const result = { version: 1, fetchedAt: now, rows };
    let storageAvailable = Boolean(storage);
    try {
      storage?.setItem(CACHE_KEY, JSON.stringify(result));
    } catch {
      storageAvailable = false;
    }
    return { ...result, source: "network", storageAvailable };
  } catch {
    return cache
      ? { ...cache, source: "stale" }
      : { rows: [], fetchedAt: null, source: "unavailable" };
  } finally {
    clearTimeout(timeout);
  }
}
export function windowWeather(rows, date, hour, duration) {
  const first = rows.find(
    (r) => parkDate(r.time) === date && parkHour(r.time) === hour,
  );
  if (!first) return null;
  const hours = duration / 60;
  const selected = Array.from({ length: hours }, (_, i) =>
    rows.find((r) => r.time === first.time + i * 3600000),
  );
  if (selected.some((r) => !r)) return null; // Never represent partial/null data as a complete forecast.
  const max = (key) => Math.max(...selected.map((r) => r[key]));
  const min = (key) => Math.min(...selected.map((r) => r[key]));
  const codes = selected.map((r) => r.weather_code);
  const storm = codes.some((c) => c >= 95);
  const snow = codes.some((c) => [71, 73, 75, 77, 85, 86].includes(c));
  const ice = codes.some((c) => [56, 57, 66, 67].includes(c));
  const wet =
    storm ||
    snow ||
    ice ||
    max("precipitation_probability") >= 50 ||
    codes.some((c) => c >= 51);
  const wind = max("wind_speed_10m");
  const severe =
    storm ||
    ice ||
    wind >= 30 ||
    max("apparent_temperature") >= 100 ||
    min("apparent_temperature") <= 10;
  return {
    rows: selected,
    low: min("temperature_2m"),
    high: max("temperature_2m"),
    feelsHigh: max("apparent_temperature"),
    feelsLow: min("apparent_temperature"),
    rain: max("precipitation_probability"),
    wind,
    wet,
    storm,
    snow,
    ice,
    severe,
    dark: selected.some((r) => !r.is_day),
    mood: storm
      ? "storm"
      : snow
        ? "snow"
        : wet
          ? "rain"
          : max("cloud_cover") >= 60
            ? "cloud"
            : "sun",
  };
}
export const INTERESTS = {
  walk: "a gentle walk",
  water: "time by the water",
  culture: "culture & stories",
  sport: "sport & play",
  family: "family discoveries",
};
// Editorial traits, not a live accessibility, opening-hours, or routing database.
export const traits = {
  "art-hill": { interests: ["walk", "family"], cluster: "basin" },
  "grand-basin": { interests: ["walk", "water", "family"], cluster: "basin" },
  "jewel-box": { interests: ["walk", "family"], cluster: "south" },
  "kennedy-forest": { interests: ["walk"], shade: true, cluster: "south" },
  "pagoda-circle": { interests: ["walk", "water", "family"], cluster: "north" },
  pavilion: { interests: ["walk", "family"], cluster: "south" },
  zoo: { interests: ["family", "walk"], cluster: "south" },
  "forest-golf": { interests: ["sport"], booking: true, cluster: "west" },
  highlands: { interests: ["sport"], booking: true, cluster: "south" },
  archery: { interests: ["sport"], booking: true, cluster: "west" },
  planetarium: {
    interests: ["culture", "family"],
    indoor: true,
    booking: true,
    cluster: "south",
  },
  muny: {
    interests: ["culture"],
    event: true,
    booking: true,
    cluster: "north",
  },
  "history-museum": {
    interests: ["culture", "family"],
    indoor: true,
    cluster: "north",
  },
  "dwight-tennis": { interests: ["sport"], booking: true, cluster: "north" },
};
export function rankPlaces(places, preferences, weather) {
  return places
    .filter(
      (p) =>
        p.minutes <= preferences.duration &&
        traits[p.id] &&
        !traits[p.id].event,
    )
    .map((p) => {
      const t = traits[p.id];
      const matches = preferences.interests.filter((i) =>
        t.interests.includes(i),
      );
      if (preferences.interests.length && !matches.length) return null;
      if (weather?.severe && !t.indoor) return null;
      let score = matches.length * 12;
      const reasons = [];
      if (matches.length)
        reasons.push(
          `Matches ${matches.map((i) => INTERESTS[i]).join(" and ")}.`,
        );
      if (!weather)
        reasons.push(
          "Chosen by your interests and visit length; weather is unavailable.",
        );
      else if (weather.severe) {
        score += 50;
        reasons.push(
          "Concerning conditions are forecast. Consider postponing; this indoor option is conditional on access and travel.",
        );
      } else if (weather.wet && t.indoor) {
        score += 35;
        reasons.push(
          "An indoor option for a wetter forecast; confirm hours and admission first.",
        );
      } else if (weather.wet) {
        score -= 20;
        reasons.push(
          "An outdoor stop: the forecast includes precipitation, so keep a backup plan.",
        );
      } else if (weather.wind >= 18 && !t.indoor) {
        score -= 15;
        reasons.push(
          "A breezy forecast makes exposed outdoor stops less appealing.",
        );
      } else if (
        (weather.feelsHigh >= 85 || weather.feelsLow <= 35) &&
        t.indoor
      ) {
        score += 25;
        reasons.push(
          "An indoor break may suit the forecast temperature; check opening hours.",
        );
      } else if (weather.feelsHigh >= 85 && t.shade) {
        score += 18;
        reasons.push(
          "Woodland shade may offer a break from the warmer forecast.",
        );
      } else if (!t.indoor && weather.feelsHigh < 85 && weather.feelsLow > 35) {
        score += 10;
        reasons.push(
          "The forecast temperature and lower precipitation chance suit an outdoor pause.",
        );
      } else
        reasons.push("Bring layers or water for the forecast temperature.");
      if (weather?.dark && !t.indoor) {
        score -= 25;
        reasons.push(
          "Part of this window is after dark; verify lighting and park access.",
        );
      }
      if (t.indoor)
        reasons.push(
          p.id === "planetarium"
            ? "For a star show, confirm a show time and tickets; the grounds alone are outdoors."
            : "Check the museum’s hours before planning an indoor visit.",
        );
      if (t.booking && !t.indoor)
        reasons.push(
          "Arrange equipment, reservations or range access with the venue.",
        );
      return { place: p, score, reasons };
    })
    .filter(Boolean)
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.place.minutes - b.place.minutes ||
        a.place.id.localeCompare(b.place.id),
    );
}
export const AREA_LABELS = {
  basin: "Art Hill & the Basin",
  south: "Southern park",
  north: "Northern park",
  west: "Western park",
};
// Deliberately conservative editorial allowances, not measured walking times.
export function transferMinutes(previous, next) {
  if (!previous || !next) return 0;
  return traits[previous.place.id].cluster === traits[next.place.id].cluster
    ? 20
    : 40;
}
export function summarizePlan(stops, duration, startHour = 0) {
  let elapsed = 0;
  const timeline = stops.map((item, index) => {
    const transfer = transferMinutes(stops[index - 1], item);
    elapsed += transfer;
    const start = startHour * 60 + elapsed;
    elapsed += item.place.minutes;
    return {
      id: item.place.id,
      start,
      end: startHour * 60 + elapsed,
      transfer,
    };
  });
  const visitMinutes = stops.reduce((sum, item) => sum + item.place.minutes, 0);
  return {
    stops,
    timeline,
    visitMinutes,
    bufferMinutes: elapsed - visitMinutes,
    spareMinutes: duration - elapsed,
    overBudget: elapsed > duration,
  };
}
export function minuteLabel(minutes) {
  const hour = Math.floor(minutes / 60) % 24;
  const minute = minutes % 60;
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")}${hour < 12 ? "am" : "pm"}`;
}
export function composePlan(
  ranked,
  duration,
  excluded = [],
  { compact = true, startHour = 0 } = {},
) {
  const result = [];
  const remaining = ranked.filter((item) => !excluded.includes(item.place.id));
  let used = 0;
  while (remaining.length && result.length < 3) {
    const previous = result.at(-1);
    const cluster = previous ? traits[previous.place.id].cluster : null;
    remaining.sort(
      (a, b) =>
        b.score +
        (cluster && traits[b.place.id].cluster === cluster ? 6 : 0) -
        (a.score + (cluster && traits[a.place.id].cluster === cluster ? 6 : 0)),
    );
    const index = remaining.findIndex(
      (item) =>
        (!compact || !cluster || traits[item.place.id].cluster === cluster) &&
        used + transferMinutes(previous, item) + item.place.minutes <= duration,
    );
    if (index < 0) break;
    const [item] = remaining.splice(index, 1);
    result.push(item);
    used += transferMinutes(previous, item) + item.place.minutes;
  }
  return summarizePlan(result, duration, startHour);
}
