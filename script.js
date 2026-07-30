// ---------------------------------------------------------------
// Shared: respect prefers-reduced-motion for JS-driven smooth scrolls
// (the CSS `scroll-behavior: auto !important` override only governs
// anchor/CSS-triggered scrolling, not explicit scrollIntoView calls)
// ---------------------------------------------------------------
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;
const scrollBehavior = prefersReducedMotion ? "auto" : "smooth";

// ---------------------------------------------------------------
// Nav scroll state + scroll progress (rAF-throttled to avoid
// running layout work more than once per frame)
// ---------------------------------------------------------------
const nav = document.getElementById("nav");
const progressBar = document.getElementById("progressBar");
const scrollArea = document.getElementById("scrollArea");
let scrollTicking = false;

function onScroll() {
  const scrolled = scrollArea.scrollTop;
  nav.classList.toggle("scrolled", scrolled > 20);

  const trackHeight = scrollArea.scrollHeight - scrollArea.clientHeight;
  const pct = trackHeight > 0 ? (scrolled / trackHeight) * 100 : 0;
  progressBar.style.width = pct + "%";
  scrollTicking = false;
}
scrollArea.addEventListener(
  "scroll",
  () => {
    if (!scrollTicking) {
      requestAnimationFrame(onScroll);
      scrollTicking = true;
    }
  },
  { passive: true }
);
onScroll();

// ---------------------------------------------------------------
// Primary navigation: hamburger-triggered side menu drawer
// ---------------------------------------------------------------
const menuToggle = document.getElementById("menuToggle");
const menuClose = document.getElementById("menuClose");
const sideMenu = document.getElementById("sideMenu");
const menuOverlay = document.getElementById("menuOverlay");

if (menuToggle && sideMenu && menuOverlay) {
  // Compensate for scrollArea's own scrollbar disappearing when it locks,
  // so its content doesn't visibly reflow on browsers with non-overlay
  // scrollbars (Windows Chrome/Firefox/Edge).
  const scrollbarWidth = scrollArea.offsetWidth - scrollArea.clientWidth;

  const setMenuOpen = (open) => {
    sideMenu.classList.toggle("open", open);
    menuOverlay.classList.toggle("open", open);
    sideMenu.setAttribute("aria-hidden", String(!open));
    menuToggle.setAttribute("aria-expanded", String(open));
    scrollArea.style.overflow = open ? "hidden" : "";
    const comp = open && scrollbarWidth > 0 ? `${scrollbarWidth}px` : "";
    scrollArea.style.paddingRight = comp;
    if (open) {
      const firstLink = sideMenu.querySelector(".side-menu-links a");
      if (firstLink) firstLink.focus();
    } else {
      menuToggle.focus();
    }
  };

  menuToggle.addEventListener("click", () => setMenuOpen(true));
  menuClose.addEventListener("click", () => setMenuOpen(false));
  menuOverlay.addEventListener("click", () => setMenuOpen(false));
  sideMenu.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => setMenuOpen(false))
  );
  document.addEventListener("keydown", (e) => {
    if (!sideMenu.classList.contains("open")) return;
    if (e.key === "Escape") {
      setMenuOpen(false);
      return;
    }
    // Trap focus inside the drawer while it's open: without this, tabbing
    // past the last link lands on background page content that's covered
    // by the overlay but was never actually removed from the tab order.
    if (e.key === "Tab") {
      const focusable = Array.from(sideMenu.querySelectorAll("a, button")).filter(
        (el) => el.offsetParent !== null
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
}

// ---------------------------------------------------------------
// Side menu: highlight whichever section is currently in view, so the
// menu still orients you after you've scrolled deep into a section.
// Accordion sections collapse down to just their header when closed, so
// this tracks scroll position directly (last header to cross a fixed
// line near the top) rather than intersection area, which would favor
// whichever short collapsed header happens to overlap a band the most.
// ---------------------------------------------------------------
if (sideMenu) {
  const sideMenuLinks = Array.from(sideMenu.querySelectorAll(".side-menu-links a"));
  const sections = sideMenuLinks
    .map((link) => document.getElementById(link.getAttribute("href").slice(1)))
    .filter(Boolean);

  if (sections.length) {
    const setActiveLink = (id) => {
      sideMenuLinks.forEach((link) => {
        const isActive = link.getAttribute("href") === `#${id}`;
        link.classList.toggle("active", isActive);
        if (isActive) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
    };

    const LINE = 96; // just below the fixed nav
    let activeSectionTicking = false;
    function updateActiveSection() {
      // Whichever header sits closest to LINE "wins". A strict "last header
      // to cross LINE" rule breaks near the bottom of a short, all-collapsed
      // page: there's often not enough content left below a section to ever
      // scroll its header up that far, so it'd get stuck showing whatever
      // came before as active even after you've navigated past it.
      let current = sections[0];
      let bestDistance = Infinity;
      for (const section of sections) {
        const distance = Math.abs(section.getBoundingClientRect().top - LINE);
        if (distance < bestDistance) {
          bestDistance = distance;
          current = section;
        }
      }
      setActiveLink(current.id);
      activeSectionTicking = false;
    }
    scrollArea.addEventListener(
      "scroll",
      () => {
        if (!activeSectionTicking) {
          requestAnimationFrame(updateActiveSection);
          activeSectionTicking = true;
        }
      },
      { passive: true }
    );
    updateActiveSection();
  }
}

// ---------------------------------------------------------------
// Resume preview modal: every "View Resume" / "Resume" link opens an
// inline preview instead of forcing a download; the modal itself still
// offers an explicit Download PDF action for anyone who wants the file.
// ---------------------------------------------------------------
const resumeModal = document.getElementById("resumeModal");
const resumeModalOverlay = document.getElementById("resumeModalOverlay");
const resumeModalClose = document.getElementById("resumeModalClose");
const resumeModalFrame = document.getElementById("resumeModalFrame");
const resumeTriggers = document.querySelectorAll(".resume-trigger");

if (resumeModal && resumeModalOverlay && resumeModalClose && resumeModalFrame && resumeTriggers.length) {
  const RESUME_SRC = "Vivek_Murugulla_Resume_MSBA.pdf";
  let resumeFrameLoaded = false;
  let resumePreviouslyFocused = null;

  const setResumeOpen = (open) => {
    if (open && !resumeFrameLoaded) {
      resumeModalFrame.src = RESUME_SRC;
      resumeFrameLoaded = true;
    }
    resumeModal.classList.toggle("open", open);
    resumeModalOverlay.classList.toggle("open", open);
    resumeModal.setAttribute("aria-hidden", String(!open));
    scrollArea.style.overflow = open ? "hidden" : "";
    if (open) {
      resumePreviouslyFocused = document.activeElement;
      // resumeModal's visibility is CSS-transitioned, and a browser won't
      // focus an element it still considers hidden. Even listening for
      // transitionend isn't fully reliable: it can fire a frame before the
      // browser's focus machinery actually treats the element as visible
      // (most noticeable under prefers-reduced-motion's near-zero
      // durations). Retrying across a few animation frames sidesteps the
      // exact timing rather than depending on it.
      let attempts = 0;
      const tryFocus = () => {
        resumeModalClose.focus();
        attempts += 1;
        if (document.activeElement !== resumeModalClose && attempts < 10) {
          requestAnimationFrame(tryFocus);
        }
      };
      tryFocus();
    } else if (resumePreviouslyFocused instanceof HTMLElement) {
      resumePreviouslyFocused.focus();
    }
  };

  resumeTriggers.forEach((trigger) => {
    trigger.addEventListener("click", (e) => {
      // Cmd/Ctrl/Shift+click is a "open in new tab/window" request. Chrome
      // honors that regardless of preventDefault, so blocking it here just
      // pops the modal open on top of the page the user was already on,
      // on top of the new tab they actually asked for.
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      setResumeOpen(true);
    });
  });
  resumeModalClose.addEventListener("click", () => setResumeOpen(false));
  resumeModalOverlay.addEventListener("click", () => setResumeOpen(false));
  document.addEventListener("keydown", (e) => {
    if (!resumeModal.classList.contains("open")) return;
    if (e.key === "Escape") {
      setResumeOpen(false);
      return;
    }
    // Same focus-trap reasoning as the side menu. The iframe's own PDF
    // viewer has internal tab stops the parent page can't observe or
    // intercept, so this only guards the boundary between the two real
    // buttons -- the common case of a keyboard user not diving into the
    // embedded viewer's own controls.
    if (e.key === "Tab") {
      const focusable = Array.from(resumeModal.querySelectorAll("a, button")).filter(
        (el) => el.offsetParent !== null
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
}

// ---------------------------------------------------------------
// Cursor-follow glow field (rAF-throttled)
// ---------------------------------------------------------------
const glowField = document.getElementById("glowField");
if (glowField && window.matchMedia("(pointer: fine)").matches && !prefersReducedMotion) {
  let mouseTicking = false;
  let lastMouseX = 0;
  let lastMouseY = 0;
  window.addEventListener(
    "mousemove",
    (e) => {
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
      if (!mouseTicking) {
        requestAnimationFrame(() => {
          glowField.style.setProperty("--mx", lastMouseX + "px");
          glowField.style.setProperty("--my", lastMouseY + "px");
          mouseTicking = false;
        });
        mouseTicking = true;
      }
    },
    { passive: true }
  );
}

// ---------------------------------------------------------------
// Reveal-on-scroll
// ---------------------------------------------------------------
const revealEls = document.querySelectorAll(".reveal");
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { root: scrollArea, threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
);
revealEls.forEach((el) => revealObserver.observe(el));

// ---------------------------------------------------------------
// Animated counters (research stats)
// ---------------------------------------------------------------
function animateCount(el) {
  const target = parseInt(el.dataset.count, 10);
  const suffix = el.dataset.suffix || "";
  if (prefersReducedMotion) {
    el.textContent = target + suffix;
    return;
  }
  const duration = 1200;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target) + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

const counters = document.querySelectorAll("[data-count]");
const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  },
  { root: scrollArea, threshold: 0.5 }
);
counters.forEach((el) => counterObserver.observe(el));

// ---------------------------------------------------------------
// Core Web Vitals gauge animation (100 / 100)
// ---------------------------------------------------------------
const vitalsCircle = document.getElementById("vitalsCircle");
const vitalsNum = document.getElementById("vitalsNum");
if (vitalsCircle && vitalsNum) {
  const gaugeObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const circumference = 326.7;
          const target = 100;
          vitalsCircle.style.strokeDashoffset =
            circumference - (target / 100) * circumference;

          if (prefersReducedMotion) {
            vitalsNum.textContent = target;
          } else {
            const start = performance.now();
            const duration = 1400;
            function tick(now) {
              const progress = Math.min((now - start) / duration, 1);
              const eased = 1 - Math.pow(1 - progress, 3);
              vitalsNum.textContent = Math.round(eased * target);
              if (progress < 1) requestAnimationFrame(tick);
            }
            requestAnimationFrame(tick);
          }
          gaugeObserver.unobserve(entry.target);
        }
      });
    },
    { root: scrollArea, threshold: 0.4 }
  );
  gaugeObserver.observe(vitalsCircle);
}

// ---------------------------------------------------------------
// GitHub contribution graph (real data, graceful fallback)
// ---------------------------------------------------------------
const GITHUB_USER = "Vivekmurugulla2004";
const contribGraph = document.getElementById("contribGraph");

// Shared intensity -> class mapping so the fallback and real data render
// identically and never drift from the legend swatches in CSS.
function intensityClass(intensity) {
  if (intensity <= 0) return "";
  if (intensity > 0.66) return "contrib-cell--high";
  if (intensity > 0.33) return "contrib-cell--mid";
  return "contrib-cell--low";
}

function renderFallbackGrid() {
  contribGraph.innerHTML = "";
  const weeks = 52;
  for (let w = 0; w < weeks; w++) {
    for (let d = 0; d < 7; d++) {
      const cell = document.createElement("div");
      cell.className = `contrib-cell ${intensityClass(Math.random())}`.trim();
      contribGraph.appendChild(cell);
    }
  }
}

async function renderContribGraph() {
  if (!contribGraph) return;
  try {
    const res = await fetch(
      `https://github-contributions-api.jogruber.de/v4/${GITHUB_USER}?y=last`
    );
    if (!res.ok) throw new Error("bad response");
    const data = await res.json();
    const days = data.contributions;
    if (!days || !days.length) throw new Error("no data");

    contribGraph.innerHTML = "";
    const maxCount = Math.max(...days.map((d) => d.count), 1);
    days.forEach((day) => {
      const cell = document.createElement("div");
      const intensity = day.count / maxCount;
      cell.className = `contrib-cell ${intensityClass(day.count === 0 ? 0 : intensity)}`.trim();
      cell.title = `${day.date}: ${day.count} contribution${day.count === 1 ? "" : "s"}`;
      contribGraph.appendChild(cell);
    });
  } catch (err) {
    renderFallbackGrid();
  }
}

// Deferred: the graph lives inside the (initially collapsed) Accomplishments
// section, so there's no reason to spend a network request on it until the
// visitor actually opens that section.
let contribGraphLoaded = false;
function loadContribGraphOnce() {
  if (contribGraphLoaded || !contribGraph) return;
  contribGraphLoaded = true;
  renderContribGraph();
}

// ---------------------------------------------------------------
// Portfolio accordion: expand/collapse
// ---------------------------------------------------------------
function getPanelFor(header) {
  return header.parentElement.querySelector(":scope > .accordion-panel");
}

function setSectionOpen(header, shouldOpen) {
  const panel = getPanelFor(header);
  if (!panel) return;
  const section = header.parentElement;
  panel.classList.toggle("open", shouldOpen);
  header.setAttribute("aria-expanded", String(shouldOpen));
  section.classList.toggle("open", shouldOpen);
  if (shouldOpen && section.id === "accomplishments") loadContribGraphOnce();
}

document.querySelectorAll(".accordion-header").forEach((header) => {
  header.addEventListener("click", () => {
    const panel = getPanelFor(header);
    setSectionOpen(header, !(panel && panel.classList.contains("open")));
  });
});

// Opens the accordion section matching a #hash, if there is one, and
// resyncs the scroll position once its expand transition finishes (the
// native anchor scroll fires before the transition has added the extra
// content height, so it can otherwise land short for a section late in
// the page). Shared by in-page link clicks, a hash already present on
// load, and back/forward navigation between hash states -- a bookmarked,
// shared, or history-navigated link should work exactly like a click.
function openSectionFromHash(id) {
  const section = document.getElementById(id);
  if (!section || !section.classList.contains("accordion-item")) return;
  const header = section.querySelector(":scope > .accordion-header");
  if (!header) return;
  const panel = getPanelFor(header);
  const alreadyOpen = panel && panel.classList.contains("open");
  setSectionOpen(header, true);

  // Skip the resync if the section was already open: no transition will
  // fire to clean the listener up since there's no state change to animate.
  if (!panel || alreadyOpen) return;
  const resync = (e) => {
    if (e.target !== panel || e.propertyName !== "grid-template-rows") return;
    panel.removeEventListener("transitionend", resync);
    section.scrollIntoView({ block: "start", behavior: scrollBehavior });
  };
  panel.addEventListener("transitionend", resync);
}

// Any in-page link that targets an accordion section opens it before the
// browser's native smooth-scroll lands on it.
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", () => openSectionFromHash(link.getAttribute("href").slice(1)));
});

// A hash already in the URL on load (bookmark, shared link, refresh) or
// reached via browser back/forward never fires a link click, so it needs
// the same handling triggered separately.
if (location.hash) openSectionFromHash(location.hash.slice(1));
window.addEventListener("hashchange", () => openSectionFromHash(location.hash.slice(1)));

// ---------------------------------------------------------------
// Swipeable carousels: dot indicators + click-to-scroll
// ---------------------------------------------------------------
document.querySelectorAll(".carousel").forEach((carousel) => {
  const track = carousel.querySelector("[data-carousel]");
  const dotsWrap = carousel.querySelector("[data-dots]");
  if (!track || !dotsWrap) return;
  const cards = Array.from(track.children);
  if (cards.length < 2) return;

  cards.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.className = "carousel-dot";
    dot.setAttribute("aria-label", `Go to card ${i + 1}`);
    if (i === 0) dot.classList.add("active");
    dot.addEventListener("click", () => {
      cards[i].scrollIntoView({ behavior: scrollBehavior, inline: "start", block: "nearest" });
    });
    dotsWrap.appendChild(dot);
  });
  const dots = Array.from(dotsWrap.children);

  const cardObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const idx = cards.indexOf(entry.target);
          if (idx === -1) return;
          dots.forEach((d) => d.classList.remove("active"));
          dots[idx].classList.add("active");
        }
      });
    },
    { root: track, threshold: 0.6 }
  );
  cards.forEach((c) => cardObserver.observe(c));
});

// ---------------------------------------------------------------
// Footer year
// ---------------------------------------------------------------
document.getElementById("year").textContent = new Date().getFullYear();

// ---------------------------------------------------------------
// Easter egg: Konami code
// ---------------------------------------------------------------
const KONAMI = [
  "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
  "b", "a",
];
let konamiProgress = 0;

window.addEventListener("keydown", (e) => {
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  konamiProgress = key === KONAMI[konamiProgress] ? konamiProgress + 1 : 0;
  if (konamiProgress === KONAMI.length) {
    konamiProgress = 0;
    showEasterEgg();
  }
});

function showEasterEgg() {
  const overlay = document.createElement("div");
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", "eggTitle");
  overlay.style.cssText =
    "position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;" +
    "background:rgba(20,18,26,0.55);backdrop-filter:blur(4px);animation:fadeIn 0.2s ease-out;";
  overlay.innerHTML = `
    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:20px;padding:40px 44px;
      max-width:360px;text-align:center;box-shadow:var(--pop);font-family:var(--sans);">
      <div style="font-size:34px;margin-bottom:12px;">📚</div>
      <div id="eggTitle" style="font-family:var(--serif);font-size:20px;font-weight:600;color:var(--text);margin-bottom:10px;">
        You found it.
      </div>
      <p style="font-size:14px;color:var(--text-dim);line-height:1.6;margin:0 0 20px;">
        Anyone who knows the Konami code by heart probably also has strong opinions about comic reading order.
        We'd get along.
      </p>
      <button type="button" id="eggClose" style="font-family:inherit;font-weight:700;font-size:13px;padding:10px 20px;
        border-radius:999px;border:none;background:linear-gradient(135deg, var(--accent), var(--accent-bright));color:#fff8f6;cursor:pointer;
        box-shadow:var(--pop-sm);">Nice</button>
    </div>`;
  document.body.appendChild(overlay);

  const closeBtn = overlay.querySelector("#eggClose");
  const previouslyFocused = document.activeElement;
  function close() {
    overlay.remove();
    document.removeEventListener("keydown", onKeydown);
    if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
  }
  function onKeydown(e) {
    if (e.key === "Escape") close();
  }
  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener("keydown", onKeydown);
  closeBtn.focus();
}
