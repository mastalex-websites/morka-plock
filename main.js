const bar = document.querySelector("[data-bar]");
const menu = document.querySelector("[data-menu]");
const openButton = document.querySelector("[data-menu-open]");
const closeButton = document.querySelector("[data-menu-close]");

function setMenu(open) {
  menu.hidden = !open;
  openButton.setAttribute("aria-expanded", String(open));
  document.body.style.overflow = open ? "hidden" : "";
  (open ? closeButton : openButton).focus();
}

openButton.addEventListener("click", () => setMenu(true));
closeButton.addEventListener("click", () => setMenu(false));

menu.addEventListener("click", (event) => {
  if (event.target.closest("a")) setMenu(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !menu.hidden) setMenu(false);
});

function updateBar() {
  bar.classList.toggle("is-scrolled", window.scrollY > 8);
}

updateBar();
window.addEventListener("scroll", updateBar, { passive: true });

document.querySelectorAll("[data-scroll]").forEach((button) => {
  const track = document.getElementById(button.dataset.scroll);
  button.addEventListener("click", () => {
    const step = track.firstElementChild.getBoundingClientRect().width + 20;
    track.scrollBy({ left: step * Number(button.dataset.direction), behavior: "smooth" });
  });
});

function countUp(element) {
  const target = Number(element.dataset.count);
  const suffix = element.dataset.suffix || "";
  const start = performance.now();

  function step(now) {
    const t = Math.min(1, (now - start) / 1400);
    const eased = 1 - (1 - t) ** 3;
    element.textContent = Math.round(target * eased) + suffix;
    if (t < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

const counters = document.querySelectorAll("[data-count]");
const animateCounters = matchMedia("(prefers-reduced-motion: no-preference)").matches;

if (animateCounters && "IntersectionObserver" in window) {
  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        countUp(entry.target);
        counterObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.6 }
  );

  counters.forEach((element) => counterObserver.observe(element));
}

const revealed = document.querySelectorAll("[data-reveal]");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -10% 0px" }
  );

  revealed.forEach((element) => observer.observe(element));
} else {
  revealed.forEach((element) => element.classList.add("is-visible"));
}
