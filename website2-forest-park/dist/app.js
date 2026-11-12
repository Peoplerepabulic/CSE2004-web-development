"use strict";

// Fixed editorial places; planner.mjs fetches weather for the park’s fixed coordinates.
const places = [
  {
    id: "art-hill",
    name: "Art Hill",
    category: "A hillside daydream",
    tags: ["picnic"],
    minutes: 30,
    icon: "basket",
    location: "The grassy slope between the Art Museum and the Grand Basin.",
    teaser: "Spread a blanket. Watch the clouds take their time.",
    description:
      "An open hillside with a lovely outlook toward the Grand Basin. Settle onto the grass for a small picnic, a sketch, or a chapter of your book.",
    invitation:
      "Pick one cloud and watch it change shape before you turn the page.",
    source: "https://www.forestparkforever.org/picnic-spots",
    art: "hill",
  },
  {
    id: "grand-basin",
    name: "Emerson Grand Basin",
    category: "A moment by the water",
    tags: ["water"],
    minutes: 25,
    icon: "waves",
    location: "At the foot of Art Hill, below the Saint Louis Art Museum.",
    teaser: "Fountains, reflections, and a reason to slow down.",
    description:
      "Walk beside the basin and look back toward Art Hill. The broad water and fountain views make this a gentle place to pause and notice the park around you.",
    invitation:
      "Find a reflection you like. Try sketching it without lifting your pencil.",
    source: "https://www.forestparkmap.org/",
    art: "water",
  },
  {
    id: "jewel-box",
    name: "Jewel Box gardens",
    category: "A little botanical wonder",
    tags: ["garden"],
    minutes: 30,
    icon: "plant",
    location: "The outdoor gardens surrounding the Jewel Box conservatory.",
    teaser: "A glasshouse silhouette, framed by the garden.",
    description:
      "Enjoy the outdoor setting of the Jewel Box, where the conservatory provides a striking backdrop to the surrounding gardens. Plantings change with the seasons. Interior access has separate hours and may require admission.",
    invitation:
      "Look closely at a leaf. How many shades of green can you find?",
    source: "https://www.forestparkmap.org/jewel-box",
    art: "glass",
  },
  {
    id: "kennedy-forest",
    name: "Kennedy Forest",
    category: "Beneath the canopy",
    tags: ["woods"],
    minutes: 45,
    icon: "tree",
    location: "The woodland area in the southwestern portion of Forest Park.",
    teaser: "Trade the hurry for birdsong and leafy paths.",
    description:
      "Follow designated paths through a woodland landscape. Kennedy Forest is a place for noticing birds, listening to leaves, and enjoying a different, quieter texture of the park. Trail surfaces vary; check current access before setting out.",
    invitation:
      "Pause for one minute. Count the different sounds before moving on.",
    source: "https://www.forestparkmap.org/kennedy-forest",
    art: "woods",
  },
  {
    id: "pagoda-circle",
    name: "Pagoda Circle",
    category: "A garden interlude",
    tags: ["garden", "water", "picnic"],
    minutes: 25,
    icon: "plant",
    location: "The landscaped circle in front of The Muny.",
    teaser: "Take the long way around a lovely little corner.",
    description:
      "Make time for the landscaped setting around Pagoda Circle, near The Muny. Water, seasonal color, and open views invite an unhurried wander. Events can change the feel and availability of the area.",
    invitation:
      "Choose a color, then see how many times you can spot it on your walk.",
    source: "https://www.forestparkforever.org/picnic-spots",
    art: "garden",
  },
  {
    id: "pavilion",
    name: "World’s Fair Pavilion",
    category: "A view worth a pause",
    tags: ["picnic"],
    minutes: 30,
    icon: "compass",
    location: "Government Hill, overlooking the park from the pavilion.",
    teaser: "A hilltop outlook for the last page of your day.",
    description:
      "Visit the hill around the World’s Fair Pavilion for an elevated park outlook. The lawn below is a lovely place to pause. The pavilion also hosts events, so this guide does not promise access to the structure itself.",
    invitation:
      "Before you leave, write down one small thing you want to remember.",
    source: "https://www.forestparkmap.org/world-s-fair-pavilion",
    art: "pavilion",
  },
  {
    id: "zoo",
    name: "Saint Louis Zoo",
    category: "A little wild wonder",
    tags: ["wildlife"],
    minutes: 120,
    location: "The Saint Louis Zoo campus in Forest Park.",
    teaser: "A day of wildlife, curiosity, and leafy pathways.",
    description:
      "Explore the zoo at your own pace and choose a few animal habitats to spend time with. Check the zoo’s official visitor information for opening hours and any attraction reservations.",
    invitation: "Choose one animal and notice how it moves.",
    source: "https://stlzoo.org/",
  },
  {
    id: "forest-golf",
    name: "Forest Park Golf Course",
    category: "Out on the fairway",
    tags: ["sport"],
    minutes: 120,
    location: "Norman K. Probstein Golf Course in Forest Park.",
    teaser: "Rolling greens beneath a wide Missouri sky.",
    description:
      "Plan a round at Forest Park’s public golf course. This is a suggested visit block, not a full round estimate. Tee times, fees, equipment and course access must be checked with the operator.",
    invitation: "Leave room in your day for the pace of the course.",
    source: "https://www.forestparkgc.com/",
  },
  {
    id: "highlands",
    name: "The Highlands Golf & Tennis",
    category: "Find your rhythm",
    tags: ["sport"],
    minutes: 90,
    location: "The Highlands Golf and Tennis Center in Forest Park.",
    teaser: "A little golf, a little tennis, a lot of fresh air.",
    description:
      "Choose golf, practice at the range, or a tennis session. Reserve the activity you want with the venue; this guide does not book courts or tee times.",
    invitation: "Pick one activity and make an afternoon of it.",
    source: "https://www.highlandsgolfandtennis.com/",
  },
  {
    id: "archery",
    name: "St. Louis Archery Club",
    category: "A moment of focus",
    tags: ["sport"],
    minutes: 60,
    location: "Forest Park Archery Range.",
    teaser: "A quiet practice field tucked among the trees.",
    description:
      "The city lists St. Louis Archery Club as the contact for the Forest Park Archery Range. Check range rules, equipment requirements and current access before visiting. Use designated shooting areas and follow all range instructions.",
    invitation: "Plan your visit with the club before bringing equipment.",
    source:
      "https://www.stlouis-mo.gov/government/departments/parks/parks/browse-parks/amenity.cfm?id=345",
  },
  {
    id: "planetarium",
    name: "James S. McDonnell Planetarium",
    category: "A doorway to the stars",
    tags: ["culture"],
    minutes: 60,
    location:
      "The Saint Louis Science Center’s planetarium grounds in Forest Park.",
    teaser: "An extraordinary silhouette and a universe of wonder.",
    description:
      "See the distinctive planetarium building and explore the surrounding grounds. For an indoor star show, check the Science Center’s current program and ticket information.",
    invitation: "Find the moon in the sky, or a new question to take inside.",
    source: "https://www.slsc.org/attraction/mcdonnell-planetarium/",
  },
  {
    id: "muny",
    name: "The Muny",
    category: "An evening under the stars",
    tags: ["culture"],
    minutes: 150,
    location: "1 Theatre Drive, near Pagoda Circle in Forest Park.",
    teaser: "Trees, twilight, and the anticipation of a curtain rising.",
    description:
      "Plan an evening around the outdoor theatre’s seasonal performances. This guide does not show live schedules or guarantee entry. Performance length varies; check the official calendar and admission options.",
    invitation: "Choose a performance, then leave time for a walk beforehand.",
    source: "https://muny.org/visit/",
  },
  {
    id: "history-museum",
    name: "Missouri History Museum",
    category: "Stories worth slowing down for",
    tags: ["culture"],
    minutes: 90,
    location:
      "The northern edge of Forest Park, near Lindell Boulevard and DeBaliviere Avenue.",
    teaser: "Follow a city’s stories through a beautiful park landmark.",
    description:
      "Explore the museum’s exhibitions and the stories of the St. Louis region. Check the museum’s current hours, exhibitions and visitor information before planning an indoor visit.",
    invitation: "Find one story that changes how you see the city.",
    source: "https://mohistory.org/museum",
  },
  {
    id: "dwight-tennis",
    name: "Dwight Davis Tennis Center",
    category: "A little friendly rally",
    tags: ["sport"],
    minutes: 60,
    location: "The Dwight Davis Memorial Tennis Center in Forest Park.",
    teaser: "A court, a friend, and time for one more rally.",
    description:
      "Plan a tennis session in the park. Court reservations, fees, lessons and equipment arrangements are handled by the center; check availability directly before arriving.",
    invitation: "Invite a friend and set aside an hour to play.",
    source: "https://www.forestparkmap.org/dwight-davis-memorial-tennis-center",
  },
];
const $ = (selector) => document.querySelector(selector);
const storageKey = "forest-park-field-notes-v1";
let saved = [];
let filter = "all";
let activePlace;
let toastTimer;
let storageAvailable = true;
try {
  const stored = JSON.parse(localStorage.getItem(storageKey) || "[]");
  saved = Array.isArray(stored)
    ? [...new Set(stored)].filter((id) =>
        places.some((place) => place.id === id),
      )
    : [];
} catch {
  storageAvailable = false;
}

// Original paintings of real destinations; decorative layers animate locally.
function artwork(place) {
  const atmosphere = place.tags.includes("water")
    ? "water"
    : place.id === "muny" || place.id === "planetarium"
      ? "stars"
      : "leaves";
  return `<div class="place-art living-scene atmosphere-${atmosphere}"><img class="place-painting" src="assets/places/${place.id}.webp" alt="Hand-painted interpretation of ${place.name} in Forest Park" loading="lazy" decoding="async" width="1536" height="1024"><span class="scene-haze" aria-hidden="true"></span><span class="scene-glints" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span class="scene-leaf" aria-hidden="true"></span></div>`;
}
function notify(message) {
  clearTimeout(toastTimer);
  $("#toast").textContent = message;
  $("#toast").classList.add("visible");
  toastTimer = setTimeout(() => $("#toast").classList.remove("visible"), 3500);
}
function persist() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(saved));
  } catch {
    storageAvailable = false;
  }
}
const sceneObserver =
  "IntersectionObserver" in window
    ? new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) =>
            entry.target.classList.toggle("in-view", entry.isIntersecting),
          );
        },
        { rootMargin: "80px" },
      )
    : null;
function observeScenes() {
  if (!sceneObserver) {
    document
      .querySelectorAll(".living-scene,.hero")
      .forEach((scene) => scene.classList.add("in-view"));
    return;
  }
  sceneObserver.disconnect();
  document
    .querySelectorAll(".living-scene,.hero")
    .forEach((scene) => sceneObserver.observe(scene));
}
function renderPlaces() {
  const visible = places.filter(
    (place) => filter === "all" || place.tags.includes(filter),
  );
  $("#result-count").textContent =
    `${visible.length} ${visible.length === 1 ? "place" : "places"} to make a day your own.`;
  $("#places").innerHTML = visible
    .map(
      (place) =>
        `<article class="place-card"><a class="card-open" href="#place-dialog" data-open="${place.id}" aria-label="Explore ${place.name}">${artwork(place)}<div class="card-copy"><div class="card-meta"><span>${place.category}</span><span>${place.minutes} min visit</span></div><h3>${place.name}</h3><p>${place.teaser}</p></div></a><div class="card-bottom"><span>Take a closer look ↗</span><button class="save-button" data-save="${place.id}" aria-label="${saved.includes(place.id) ? "Remove" : "Save"} ${place.name}" aria-pressed="${saved.includes(place.id)}"><img src="assets/${saved.includes(place.id) ? "check" : "bookmark-simple"}.svg" alt=""></button></div></article>`,
    )
    .join("");
  observeScenes();
}
function renderDay() {
  document.dispatchEvent(
    new CustomEvent("field-notes-change", { detail: { ids: [...saved] } }),
  );
  $("#nav-count").textContent = saved.length;
  $("#day-count").textContent =
    `${saved.length} ${saved.length === 1 ? "place" : "places"}`;
  $("#day-empty").hidden = saved.length > 0;
  $("#download").disabled = $("#clear").disabled = saved.length === 0;
  $("#itinerary").innerHTML = saved
    .map((id, index) => {
      const place = places.find((item) => item.id === id);
      return `<li class="stop"><span class="stop-index">${String(index + 1).padStart(2, "0")}</span><div><strong>${place.name}</strong><small>${place.minutes} min suggested</small></div><div class="stop-controls"><button data-move="${id}" data-direction="-1" aria-label="Move ${place.name} up" ${index === 0 ? "disabled" : ""}>↑</button><button data-move="${id}" data-direction="1" aria-label="Move ${place.name} down" ${index === saved.length - 1 ? "disabled" : ""}>↓</button><button data-remove="${id}" aria-label="Remove ${place.name} from your day">×</button></div></li>`;
    })
    .join("");
  const total = saved.reduce(
    (sum, id) => sum + places.find((place) => place.id === id).minutes,
    0,
  );
  $("#day-summary").textContent = saved.length
    ? `${total} minutes of suggested visits · Travel time is extra. This is your list, not a walking route.`
    : "Suggested pause times exclude travel between places.";
  if (activePlace)
    $("#detail-save").textContent = saved.includes(activePlace.id)
      ? "Remove from my day"
      : "Add to my little day +";
}
function toggleSave(id) {
  const adding = !saved.includes(id);
  saved = adding ? [...saved, id] : saved.filter((value) => value !== id);
  persist();
  renderDay();
  // Preserve focus by updating buttons in place instead of rebuilding the grid.
  document.querySelectorAll("[data-save]").forEach((button) => {
    const place = places.find((item) => item.id === button.dataset.save);
    const selected = saved.includes(place.id);
    button.setAttribute("aria-pressed", String(selected));
    button.setAttribute(
      "aria-label",
      `${selected ? "Remove" : "Save"} ${place.name}`,
    );
    button.querySelector("img").src =
      `assets/${selected ? "check" : "bookmark-simple"}.svg`;
  });
  notify(
    storageAvailable
      ? adding
        ? "A lovely little stop, saved to your day."
        : "Removed from your day."
      : "Saved for this visit only. Download your notes to keep them.",
  );
}
function openPlace(id) {
  activePlace = places.find((place) => place.id === id);
  const place = activePlace;
  $("#detail-art").innerHTML = artwork(place);
  $("#detail-kicker").textContent = place.category;
  $("#detail-title").textContent = place.name;
  $("#detail-description").textContent = place.description;
  $("#detail-facts").innerHTML =
    `<div><dt>Find it here</dt><dd>${place.location}</dd></div><div><dt>Make a little time</dt><dd>${place.minutes} minutes suggested, plus travel.</dd></div>`;
  $("#detail-invitation").textContent = place.invitation;
  $("#detail-source").href = place.source;
  renderDay();
  $("#place-dialog").showModal();
  observeScenes();
  $("#place-dialog").scrollTop = 0;
}
$("#places").addEventListener("click", (event) => {
  const open = event.target.closest("[data-open]");
  const save = event.target.closest("[data-save]");
  if (open) {
    event.preventDefault();
    openPlace(open.dataset.open);
  }
  if (save) toggleSave(save.dataset.save);
});
document.querySelectorAll("[data-filter]").forEach((button) =>
  button.addEventListener("click", () => {
    filter = button.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach((item) => {
      item.classList.toggle("selected", item === button);
      item.setAttribute("aria-pressed", String(item === button));
    });
    renderPlaces();
  }),
);
$("#surprise").addEventListener("click", () => {
  const options = places.filter(
    (place) => filter === "all" || place.tags.includes(filter),
  );
  openPlace(options[Math.floor(Math.random() * options.length)].id);
});
$("#detail-save").addEventListener("click", () => toggleSave(activePlace.id));
$("#itinerary").addEventListener("click", (event) => {
  const remove = event.target.closest("[data-remove]");
  const move = event.target.closest("[data-move]");
  if (remove) {
    toggleSave(remove.dataset.remove);
    $("#clear").focus();
  }
  if (move) {
    const index = saved.indexOf(move.dataset.move),
      next = index + Number(move.dataset.direction);
    if (next < 0 || next >= saved.length) return;
    [saved[index], saved[next]] = [saved[next], saved[index]];
    persist();
    renderDay();
    const controls = [...document.querySelectorAll("[data-move]")];
    const focus =
      controls.find(
        (button) =>
          button.dataset.move === move.dataset.move &&
          button.dataset.direction === move.dataset.direction &&
          !button.disabled,
      ) || document.querySelector(`[data-remove="${move.dataset.move}"]`);
    focus.focus();
    notify("Your stops have a new order.");
  }
});
$("#clear").addEventListener("click", () => {
  saved = [];
  persist();
  renderPlaces();
  renderDay();
  $("#day-empty a").focus();
  notify("A fresh page for your next adventure.");
});
$("#download").addEventListener("click", () => {
  const content = [
    "MY LITTLE DAY IN FOREST PARK",
    "St. Louis, Missouri",
    "",
    ...(window.ForestPlanner?.exportContext() || []),
    ...saved.flatMap((id, index) => {
      const place = places.find((item) => item.id === id);
      return [
        `${index + 1}. ${place.name}`,
        place.location,
        `${place.minutes} minutes suggested, excluding travel.`,
        place.invitation,
        "",
      ];
    }),
    "These are editorial suggestions, not live access information or navigation directions.",
    "Check park notices before visiting: https://www.forestparkmap.org/alerts",
  ];
  const url = URL.createObjectURL(
    new Blob([content.join("\n")], { type: "text/plain;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "my-forest-park-day.txt";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  notify("Your field notes are ready to take along.");
});
document.querySelectorAll("dialog").forEach((dialog) => {
  dialog
    .querySelector(".dialog-close")
    .addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      const box = dialog.getBoundingClientRect();
      if (
        event.clientX < box.left ||
        event.clientX > box.right ||
        event.clientY < box.top ||
        event.clientY > box.bottom
      )
        dialog.close();
    }
  });
});
$("#privacy").addEventListener("click", () => $("#privacy-dialog").showModal());
$("#privacy-close").addEventListener("click", () =>
  $("#privacy-dialog").close(),
);
let sceneRequest = 0;
const heroScenes = {
  morning: [
    "assets/forest-hero.webp",
    "Morning light across the Grand Basin and Art Hill.",
  ],
  golden: [
    "assets/hero-golden.webp",
    "Golden sunset over the Grand Basin and Art Hill.",
  ],
  dusk: [
    "assets/hero-dusk.webp",
    "Blue hour at the Grand Basin, with softly glowing fountains.",
  ],
};
document.querySelectorAll("button[data-scene]").forEach((button) =>
  button.addEventListener("click", async () => {
    const request = ++sceneRequest;
    const scene = button.dataset.scene;
    const target = document.querySelector(`[data-hero="${scene}"]`);
    target.src = heroScenes[scene][0];
    try {
      await target.decode();
    } catch {
      notify("This scene could not load. Please try again.");
      return;
    }
    if (request !== sceneRequest) return;
    document.body.dataset.scene = scene;
    document.querySelectorAll("[data-hero]").forEach((img) => {
      img.classList.toggle("is-active", img === target);
      img.setAttribute("aria-hidden", String(img !== target));
    });
    document
      .querySelectorAll("button[data-scene]")
      .forEach((item) =>
        item.setAttribute("aria-pressed", String(item === button)),
      );
  }),
);
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let motionPaused = reducedMotion.matches;
try {
  motionPaused =
    motionPaused || localStorage.getItem("forest-park-motion") === "paused";
} catch {
  /* Motion works without storage. */
}
function updateMotion() {
  const paused = motionPaused || reducedMotion.matches;
  document.body.classList.toggle("motion-paused", paused);
  $("#motion").setAttribute("aria-pressed", String(!paused));
  $("#motion").setAttribute(
    "aria-label",
    paused ? "Enable decorative motion" : "Pause decorative motion",
  );
}
$("#motion").addEventListener("click", () => {
  if (reducedMotion.matches) {
    notify("Your system’s reduced-motion preference is respected.");
    return;
  }
  motionPaused = !motionPaused;
  updateMotion();
  try {
    localStorage.setItem(
      "forest-park-motion",
      motionPaused ? "paused" : "playing",
    );
  } catch {
    /* Optional preference. */
  }
});
reducedMotion.addEventListener("change", updateMotion);
updateMotion();
renderPlaces();
renderDay();
if ("IntersectionObserver" in window) {
  document.body.classList.add("js-motion");
  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.remove("pending");
          observer.unobserve(entry.target);
        }
      }),
    { threshold: 0.08 },
  );
  document.querySelectorAll(".reveal").forEach((section) => {
    section.classList.add("pending");
    observer.observe(section);
  });
  const tagline = $("#tagline");
  tagline.innerHTML = tagline.innerHTML
    .split("<br>")
    .map((line) =>
      line
        .split(" ")
        .map((word) => `<span class="word">${word}</span>`)
        .join(" "),
    )
    .join("<br>");
  const words = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        tagline
          .querySelectorAll(".word")
          .forEach((word, index) =>
            setTimeout(() => word.classList.add("lit"), index * 85),
          );
        words.disconnect();
      }
    },
    { threshold: 0.7 },
  );
  words.observe(tagline);
}

// Small integration boundary: the planner adds to, never replaces, the visitor’s day.
window.ForestGuide = Object.freeze({
  places,
  openPlace,
  savedIds: () => [...saved],
  addStops(ids) {
    saved = [
      ...new Set([
        ...saved,
        ...ids.filter((id) => places.some((p) => p.id === id)),
      ]),
    ];
    persist();
    renderDay();
    renderPlaces();
    notify(
      storageAvailable
        ? "Your suggested stops are in your day. Reorder them below."
        : "Saved for this visit only. Download your notes to keep them.",
    );
    return storageAvailable;
  },
});
