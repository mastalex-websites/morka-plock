(() => {
  const pin = document.querySelector("[data-draw]");
  if (!pin || !document.documentElement.classList.contains("draw-on")) return;

  const stage = pin.querySelector(".marina__stage");
  const svg = pin.querySelector(".marina__scene");
  const steps = [...pin.querySelectorAll(".marina__steps li")];
  const SMOOTHING_MS = 200;
  const SCENE = { top: 70, width: 1800, height: 600, centre: 865, minWidth: 560 };

  const clamp = (x, min = 0, max = 1) => Math.min(max, Math.max(min, x));
  const ease = (t) => t * t * (3 - 2 * t);

  const groups = [...svg.querySelectorAll("g[data-s]")].map((group) => {
    const shapes = [...group.querySelectorAll("path, rect, circle")];
    shapes.forEach((shape) => {
      shape.setAttribute("pathLength", "1");
      shape.style.strokeDasharray = "1 1";
      shape.style.strokeDashoffset = "1";
      shape.style.visibility = "hidden";
    });
    return {
      shapes,
      start: Number(group.dataset.s),
      end: Number(group.dataset.e),
      duration: Math.min(1, Math.max(0.22, 4 / shapes.length)),
      last: -1,
    };
  });

  const fades = [...svg.querySelectorAll("[data-f]")].map((element) => {
    const [start, end] = element.dataset.f.split(" ").map(Number);
    return { element, start, end };
  });

  const stops = [{ at: 0, x: SCENE.centre, span: 0.04 }]
    .concat(steps.map((step) => ({
      at: Number(step.dataset.s),
      x: Number(step.dataset.x),
      span: (Number(step.dataset.e) - Number(step.dataset.s)) * 0.3,
    })))
    .concat([{ at: Number(steps[steps.length - 1].dataset.e), x: SCENE.centre, span: 0.04 }]);

  function focusAt(progress) {
    let i = 0;
    while (i < stops.length - 1 && progress >= stops[i + 1].at) i++;
    if (i === 0) return stops[0].x;
    const t = ease(clamp((progress - stops[i].at) / stops[i].span));
    return stops[i - 1].x + (stops[i].x - stops[i - 1].x) * t;
  }

  let viewWidth = SCENE.width;

  function measure() {
    const ratio = svg.clientWidth / Math.max(1, svg.clientHeight);
    viewWidth = Math.min(SCENE.width, Math.max(SCENE.minWidth, SCENE.height * ratio));
  }

  function frame(progress) {
    if (viewWidth >= SCENE.width) {
      svg.setAttribute("viewBox", `0 ${SCENE.top} ${SCENE.width} ${SCENE.height}`);
      return;
    }
    const left = clamp(focusAt(progress) - viewWidth / 2, 0, SCENE.width - viewWidth);
    svg.setAttribute("viewBox", `${left.toFixed(1)} ${SCENE.top} ${viewWidth.toFixed(1)} ${SCENE.height}`);
  }

  function paint(progress) {
    frame(progress);

    for (const group of groups) {
      const p = clamp((progress - group.start) / (group.end - group.start));
      if (p === group.last) continue;
      group.last = p;

      const count = group.shapes.length;
      group.shapes.forEach((shape, i) => {
        const delay = count > 1 ? (i / (count - 1)) * (1 - group.duration) : 0;
        const t = clamp((p - delay) / group.duration);
        shape.style.strokeDashoffset = (1 - t).toFixed(4);
        shape.style.visibility = t > 0 ? "visible" : "hidden";
      });
    }

    for (const fade of fades) {
      fade.element.style.opacity = clamp((progress - fade.start) / (fade.end - fade.start)).toFixed(3);
    }

    for (const step of steps) {
      const start = Number(step.dataset.s);
      const end = Number(step.dataset.e);
      step.classList.toggle("is-current", progress >= start && progress < end);
      step.classList.toggle("is-done", progress >= end);
    }
  }

  let current = -1;
  let goal = 0;
  let frameRequest = 0;
  let lastTime = 0;

  function readScroll() {
    const distance = Math.max(1, pin.offsetHeight - stage.offsetHeight);
    goal = clamp(-pin.getBoundingClientRect().top / distance);
  }

  function tick(time) {
    frameRequest = 0;
    const elapsed = lastTime ? Math.min(64, time - lastTime) : 16;
    lastTime = time;
    if (current < 0) current = goal;
    current += (goal - current) * (1 - Math.exp(-elapsed / (SMOOTHING_MS / 3)));
    if (Math.abs(goal - current) < 0.0002) current = goal;
    if (current !== goal) frameRequest = requestAnimationFrame(tick);
    else lastTime = 0;
    paint(current);
  }

  function update() {
    readScroll();
    if (!frameRequest) frameRequest = requestAnimationFrame(tick);
  }

  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", () => {
    measure();
    update();
  }, { passive: true });

  measure();
  readScroll();
  current = goal;
  paint(current);
})();
