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
