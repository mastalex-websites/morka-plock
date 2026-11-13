(() => {
  const hero = document.querySelector("[data-sail]");
  if (!hero || !document.documentElement.classList.contains("sail-on")) return;

  const canvas = hero.querySelector(".sail__frames");
  const context = canvas.getContext("2d");
  const ambient = hero.querySelector(".sail__ambient");
  const ambientContext = ambient.getContext("2d");
  const veil = hero.querySelector(".sail__veil");
  const intro = hero.querySelector(".sail__intro");
  const skip = hero.querySelector(".sail__skip");
  const content = hero.querySelector(".sail__content");

  const FRAME_COUNT = 143;
  const PARALLEL_LOADS = 6;
  const DURATION_MS = 2200;
  const FRAMES_END = 0.8;
  const VEIL = [0.78, 0.9];
  const CONTENT = [0.84, 1];
  const SCROLL_KEYS = ["ArrowDown", "PageDown", "End", " ", "Spacebar"];

  const clamp = (x, min = 0, max = 1) => Math.min(max, Math.max(min, x));
  const ease = (t) => t * t * (3 - 2 * t);
  const span = ([from, to], x) => ease(clamp((x - from) / (to - from)));
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

  const size = matchMedia("(max-width: 900px)").matches ? 960 : 1280;
  const frameUrl = (i) => `media/frames/${size}/${String(i).padStart(3, "0")}.webp`;
  const frames = new Array(FRAME_COUNT);

  let wantedPosition = 0;
  let drawnPosition = -1;

  function nearestLoaded(index) {
    for (let offset = 0; offset < FRAME_COUNT; offset++) {
      if (frames[index - offset]) return index - offset;
      if (frames[index + offset]) return index + offset;
    }
    return -1;
  }

  function drawFrame(layer, image, alpha) {
    layer.globalAlpha = alpha;
    layer.drawImage(image, 0, 0, layer.canvas.width, layer.canvas.height);
  }

  function draw() {
    const position = Math.round(wantedPosition * 100) / 100;
    if (position === drawnPosition) return;

    const lower = Math.floor(position);
    const base = nearestLoaded(lower);
    if (base < 0) return;
    drawnPosition = position;

    const blend = base === lower ? position - lower : 0;
    const next = frames[lower + 1];
    const layers = ambient.offsetWidth ? [context, ambientContext] : [context];

    for (const layer of layers) {
      drawFrame(layer, frames[base], 1);
      if (blend > 0 && next) drawFrame(layer, next, blend);
    }
  }

  let nextToLoad = 0;

  function loadNext() {
    if (nextToLoad >= FRAME_COUNT) return;
    const index = nextToLoad++;
    const image = new Image();
    image.decoding = "async";
    image.src = frameUrl(index);
    image.decode()
      .then(() => {
        if (canvas.width !== image.naturalWidth) {
          canvas.width = image.naturalWidth;
          canvas.height = image.naturalHeight;
        }
        frames[index] = image;
        if (Math.abs(index - wantedPosition) < 2 || drawnPosition < 0) {
          drawnPosition = -1;
          draw();
        }
      })
      .catch(() => {})
      .finally(loadNext);
  }

  for (let i = 0; i < PARALLEL_LOADS; i++) loadNext();

  function paint(progress) {
    wantedPosition = clamp(progress / FRAMES_END) * (FRAME_COUNT - 1);
    draw();

    veil.style.opacity = span(VEIL, progress).toFixed(3);

    const introOpacity = 1 - span([0, 0.08], progress);
    intro.style.opacity = introOpacity.toFixed(3);
    intro.style.visibility = introOpacity > 0 ? "visible" : "hidden";

    document.documentElement.classList.toggle("hero-light", progress > 0.85);

    const contentOpacity = span(CONTENT, progress);
    content.style.opacity = contentOpacity.toFixed(3);
    content.style.visibility = contentOpacity > 0 ? "visible" : "hidden";
    content.style.transform = `translate3d(0, ${((1 - contentOpacity) * 24).toFixed(1)}px, 0)`;
  }

  let state = "idle";
  let touchStartY = 0;

  function finish() {
    state = "done";
    paint(1);
  }

  function play() {
    if (state !== "idle") return;
    state = "playing";
    let start = 0;

    function step(time) {
      if (state !== "playing") return;
      if (!start) start = time;
      const progress = easeInOut(clamp((time - start) / DURATION_MS));
      paint(progress);
      if (progress < 1) requestAnimationFrame(step);
      else finish();
    }

    requestAnimationFrame(step);
  }

  function holdScroll(event) {
    if (state === "done") return;
    event.preventDefault();
    play();
  }

  window.addEventListener("wheel", (event) => {
    if (event.deltaY > 0) holdScroll(event);
    else if (state === "playing") event.preventDefault();
  }, { passive: false });

  window.addEventListener("touchstart", (event) => {
    touchStartY = event.touches[0].clientY;
  }, { passive: true });

  window.addEventListener("touchmove", (event) => {
    if (touchStartY - event.touches[0].clientY > 8) holdScroll(event);
    else if (state === "playing") event.preventDefault();
  }, { passive: false });

  window.addEventListener("keydown", (event) => {
    if (SCROLL_KEYS.includes(event.key) && !event.target.closest("input, textarea, select, button")) holdScroll(event);
  });

  window.addEventListener("scroll", () => {
    if (state !== "done" && window.scrollY > 0) finish();
  }, { passive: true });

  skip.addEventListener("click", finish);

  if (window.scrollY > 0 || location.hash) finish();
  else paint(0);
})();
