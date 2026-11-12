/* Visual-only pointer parallax. Scroll depth uses CSS view timelines, never a scroll listener. */
(() => {
  const hero = document.querySelector(".hero");
  const media = matchMedia("(prefers-reduced-motion: reduce)");
  const pointer = matchMedia("(hover: hover) and (pointer: fine)");
  const planes = [...hero.querySelectorAll(".cinema-plane")];
  const depths = [0, 3, 2, 7, 1, 10, 8, 0, 4];
  let visible = true,
    frame = 0,
    x = 0,
    y = 0;
  const reset = () =>
    planes.forEach((plane) => {
      plane.style.removeProperty("--mx");
      plane.style.removeProperty("--my");
    });
  const draw = () => {
    frame = 0;
    if (
      media.matches ||
      !visible ||
      document.body.classList.contains("motion-paused")
    ) {
      reset();
      return;
    }
    planes.forEach((plane, i) => {
      plane.style.setProperty("--mx", `${x * depths[i]}px`);
      plane.style.setProperty("--my", `${y * depths[i]}px`);
    });
  };
  hero.addEventListener(
    "pointermove",
    (event) => {
      if (!pointer.matches || media.matches || !visible) return;
      const box = hero.getBoundingClientRect();
      x = (event.clientX - box.left) / box.width - 0.5;
      y = (event.clientY - box.top) / box.height - 0.5;
      if (!frame) frame = requestAnimationFrame(draw);
    },
    { passive: true },
  );
  hero.addEventListener("pointerleave", reset);
  media.addEventListener("change", reset);
  new MutationObserver(() => {
    if (document.body.classList.contains("motion-paused")) reset();
  }).observe(document.body, { attributes: true, attributeFilter: ["class"] });
  if ("IntersectionObserver" in window)
    new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      hero.classList.toggle("cinema-asleep", !visible);
      if (!visible) {
        cancelAnimationFrame(frame);
        frame = 0;
        reset();
      }
    }).observe(hero);
})();
