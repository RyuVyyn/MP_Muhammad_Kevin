(function () {
  "use strict";

  var motion = window.Motion || null;
  var reduceMotionQuery =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : null;
  var REVEAL_EASE = [0.22, 0.61, 0.36, 1];

  function canAnimate() {
    return !!motion && !(reduceMotionQuery && reduceMotionQuery.matches);
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* ---------- Hero spotlight (index.html) ---------- */

  var roster = document.getElementById("roster-list");
  var stage = document.getElementById("hero-stage");
  var art = document.getElementById("hero-art");
  var nameEl = document.getElementById("hero-name");
  var rolesEl = document.getElementById("hero-roles");
  var loreEl = document.getElementById("hero-lore");
  var abilitiesEl = document.getElementById("hero-abilities");
  var info = document.querySelector(".select__info");
  var hasData = typeof HEROES !== "undefined";

  function heroBySlug(slug) {
    for (var i = 0; i < HEROES.length; i++) {
      if (HEROES[i].slug === slug) {
        return HEROES[i];
      }
    }
    return null;
  }

  function abilitiesMarkup(hero) {
    return hero.abilities
      .map(function (ability) {
        var glyph = ability.icon
          ? '<img src="' + esc(ability.icon) + '" alt="" width="90" height="90" />'
          : "";
        return (
          '<li class="ability-icon">' +
          '<span class="ability-icon__glyph">' +
          glyph +
          "</span>" +
          '<span class="ability-icon__name">' +
          esc(ability.name) +
          "</span>" +
          "</li>"
        );
      })
      .join("");
  }

  function renderHero(hero) {
    stage.style.setProperty("--accent", hero.accent || "#c9a227");
    art.src = hero.render;
    art.alt = hero.name + ", in-game render";
    nameEl.textContent = hero.name;
    rolesEl.innerHTML = hero.roles
      .map(function (role) {
        return "<li>" + esc(role) + "</li>";
      })
      .join("");
    loreEl.textContent = hero.summary || (hero.lore && hero.lore[0]) || "";
    abilitiesEl.innerHTML = abilitiesMarkup(hero);

    if (!animateHeroSwap()) {
      info.classList.remove("is-entering");
      void info.offsetWidth;
      info.classList.add("is-entering");
    }
  }

  function animateHeroSwap() {
    if (!canAnimate() || !info) {
      return false;
    }

    info.classList.remove("is-entering");

    var pieces = [
      info.querySelector(".select__name"),
      info.querySelector(".role-tags"),
      info.querySelector(".select__lore"),
      info.querySelector(".ability-icons")
    ].filter(Boolean);

    motion.animate(
      info,
      { opacity: [0, 1], y: [10, 0] },
      { type: "spring", stiffness: 240, damping: 28 }
    );

    if (pieces.length) {
      motion.animate(
        pieces,
        { opacity: [0, 1], y: [12, 0] },
        { duration: 0.36, delay: motion.stagger(0.05), ease: REVEAL_EASE }
      );
    }

    return true;
  }

  function setActiveTile(slug) {
    var tiles = roster.querySelectorAll(".hero-tile");
    for (var i = 0; i < tiles.length; i++) {
      var isTarget = tiles[i].dataset.slug === slug;
      tiles[i].classList.toggle("is-active", isTarget);
      tiles[i].setAttribute("aria-pressed", isTarget ? "true" : "false");
    }
  }

  function gridColumns() {
    var cols = getComputedStyle(roster).gridTemplateColumns;
    return cols && cols.indexOf(" ") !== -1 ? cols.split(" ").length : 1;
  }

  function moveFocus(step) {
    var tiles = Array.prototype.slice.call(roster.querySelectorAll(".hero-tile"));
    var idx = tiles.indexOf(document.activeElement);
    var cols = gridColumns();
    var next;

    if (idx === -1) {
      next = 0;
    } else if (step === "left") {
      next = idx - 1;
    } else if (step === "right") {
      next = idx + 1;
    } else if (step === "up") {
      next = idx - cols;
    } else {
      next = idx + cols;
    }

    if (next < 0 || next >= tiles.length) {
      return;
    }
    tiles[next].focus();
    selectHero(tiles[next].dataset.slug);
  }

  function selectHero(slug) {
    var hero = heroBySlug(slug);
    if (!hero) {
      return;
    }
    setActiveTile(slug);
    renderHero(hero);

    if (window.matchMedia("(max-width: 1000px)").matches) {
      stage.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function setupRoster() {
    if (!roster || !stage || !hasData) {
      return;
    }

    roster.addEventListener("click", function (event) {
      var tile = event.target.closest(".hero-tile");
      if (tile) {
        selectHero(tile.dataset.slug);
      }
    });

    roster.addEventListener("keydown", function (event) {
      var map = {
        ArrowLeft: "left",
        ArrowRight: "right",
        ArrowUp: "up",
        ArrowDown: "down"
      };
      if (map[event.key]) {
        event.preventDefault();
        moveFocus(map[event.key]);
      }
    });
  }

  /* ---------- Background music (both pages) ---------- */

  function setupBgm() {
    var bgm = document.getElementById("bgm");
    var toggle = document.getElementById("bgm-toggle");

    if (!bgm || !toggle) {
      return;
    }

    bgm.volume = 0.05;

    function start() {
      var attempt = bgm.play();
      if (attempt && typeof attempt.catch === "function") {
        attempt.catch(function () {
          /* autoplay blocked until the first user gesture */
        });
      }
    }

    function onFirstGesture(event) {
      if (!toggle.contains(event.target) && bgm.paused) {
        start();
      }
      document.removeEventListener("pointerdown", onFirstGesture);
      document.removeEventListener("keydown", onFirstGesture);
    }

    start();
    document.addEventListener("pointerdown", onFirstGesture);
    document.addEventListener("keydown", onFirstGesture);

    toggle.addEventListener("click", function () {
      if (bgm.paused) {
        start();
      } else {
        bgm.pause();
      }
    });

    bgm.addEventListener("play", function () {
      toggle.classList.add("is-playing");
      toggle.setAttribute("aria-pressed", "true");
    });

    bgm.addEventListener("pause", function () {
      toggle.classList.remove("is-playing");
      toggle.setAttribute("aria-pressed", "false");
    });

    bgm.addEventListener("error", function () {
      toggle.disabled = true;
      toggle.setAttribute("title", "Background music could not be loaded.");
    });
  }

  /* ---------- Scroll reveals (both pages) ---------- */

  function revealSections() {
    if (!canAnimate()) {
      return;
    }

    var sections = document.querySelectorAll(".section");
    Array.prototype.forEach.call(sections, function (section) {
      motion.inView(
        section,
        function () {
          motion.animate(
            section,
            { opacity: [0, 1], y: [14, 0] },
            { duration: 0.5, ease: REVEAL_EASE }
          );
        },
        { amount: 0.12 }
      );
    });
  }

  function revealRoster() {
    if (!canAnimate() || !roster) {
      return;
    }

    var cells = Array.prototype.slice.call(roster.querySelectorAll(".roster__cell"));
    if (!cells.length) {
      return;
    }

    motion.inView(
      roster,
      function () {
        motion.animate(
          cells,
          { opacity: [0, 1], y: [12, 0] },
          { duration: 0.4, delay: motion.stagger(0.008), ease: REVEAL_EASE }
        );
      },
      { amount: 0.05 }
    );
  }

  /* ---------- Mobile navigation (both pages) ---------- */

  function setupNav() {
    var toggle = document.getElementById("nav-toggle");
    var nav = document.getElementById("site-nav");

    if (!toggle || !nav) {
      return;
    }

    var desktopQuery = window.matchMedia("(min-width: 1001px)");

    function isOpen() {
      return nav.classList.contains("is-open");
    }

    function setOpen(open) {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    }

    toggle.addEventListener("click", function () {
      setOpen(!isOpen());
    });

    nav.addEventListener("click", function (event) {
      if (event.target.closest(".site-nav__link")) {
        setOpen(false);
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && isOpen()) {
        setOpen(false);
        toggle.focus();
      }
    });

    document.addEventListener("pointerdown", function (event) {
      if (!isOpen()) {
        return;
      }
      if (nav.contains(event.target) || toggle.contains(event.target)) {
        return;
      }
      setOpen(false);
    });

    function syncWithViewport() {
      if (desktopQuery.matches) {
        setOpen(false);
      }
    }

    if (typeof desktopQuery.addEventListener === "function") {
      desktopQuery.addEventListener("change", syncWithViewport);
    }
    syncWithViewport();
  }

  /* ---------- Fan review form (index.html) ---------- */

  var REVIEW_KEY = "deadlockCodex.reviews";
  var REVIEW_LIMIT = 12;
  var REVIEW_SHOWN = 3;
  var reviews = [];

  function loadReviews() {
    try {
      var parsed = JSON.parse(window.localStorage.getItem(REVIEW_KEY) || "[]");
      reviews = Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      reviews = [];
    }
  }

  function persistReviews() {
    try {
      window.localStorage.setItem(REVIEW_KEY, JSON.stringify(reviews));
    } catch (error) {
      /* storage blocked: keep the current session copy in memory */
    }
  }

  function starsFor(rating) {
    if (rating === "5") {
      return "★★★★★";
    }
    if (rating === "3") {
      return "★★★";
    }
    return "★";
  }

  function heroName(slug) {
    if (typeof HEROES !== "undefined") {
      for (var i = 0; i < HEROES.length; i++) {
        if (HEROES[i].slug === slug) {
          return HEROES[i].name;
        }
      }
    }
    return slug;
  }

  function renderReviews(highlightNewest) {
    var log = document.getElementById("rv-log");
    var list = document.getElementById("rv-list");

    if (!log || !list) {
      return;
    }

    list.innerHTML = "";
    var shown = reviews.slice(0, REVIEW_SHOWN);
    log.hidden = shown.length === 0;

    shown.forEach(function (item) {
      var card = document.createElement("li");
      card.className = "review-card";

      var meta = document.createElement("p");
      meta.className = "review-card__meta";

      var author = document.createElement("span");
      author.textContent = item.name;

      var score = document.createElement("span");
      score.className = "review-card__stars";
      score.textContent = starsFor(item.rating);
      score.setAttribute("aria-label", "Rated " + item.rating + " out of 5");

      var hero = document.createElement("span");
      hero.className = "review-card__hero";
      hero.textContent = "main: " + heroName(item.favourite);

      meta.appendChild(author);
      meta.appendChild(score);
      meta.appendChild(hero);
      card.appendChild(meta);

      if (item.message) {
        var body = document.createElement("p");
        body.className = "review-card__text";
        body.textContent = item.message;
        card.appendChild(body);
      }

      list.appendChild(card);
    });

    if (highlightNewest && canAnimate() && list.firstElementChild) {
      motion.animate(
        list.firstElementChild,
        { opacity: [0, 1], y: [10, 0], scale: [0.98, 1] },
        { duration: 0.4, ease: REVEAL_EASE }
      );
    }
  }

  function setupForm() {
    var form = document.querySelector(".review-form");
    var status = document.getElementById("rv-status");
    var nameInput = document.getElementById("rv-name");

    if (!form || !status) {
      return;
    }

    loadReviews();
    renderReviews(false);

    if (nameInput) {
      nameInput.addEventListener("input", function () {
        nameInput.setCustomValidity("");
      });
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      if (nameInput) {
        var trimmed = nameInput.value.trim();
        nameInput.setCustomValidity(
          trimmed.length > 0 && trimmed.length < 2 ? "Please enter at least two characters." : ""
        );
      }

      if (!form.checkValidity()) {
        status.className = "form-status is-error";
        status.textContent = "Please check the highlighted fields before sending.";
        form.reportValidity();
        return;
      }

      var data = new window.FormData(form);
      var review = {
        name: String(data.get("name") || "").trim(),
        rating: String(data.get("rating") || "5"),
        favourite: String(data.get("favourite") || ""),
        message: String(data.get("message") || "").trim()
      };

      reviews.unshift(review);
      reviews = reviews.slice(0, REVIEW_LIMIT);
      persistReviews();

      status.className = "form-status is-success";
      status.textContent = "Thanks, " + review.name + ". Your review is saved.";

      form.reset();
      if (nameInput) {
        nameInput.setCustomValidity("");
      }

      renderReviews(true);

      if (canAnimate()) {
        motion.animate(
          status,
          { opacity: [0, 1], y: [8, 0] },
          { duration: 0.3, ease: REVEAL_EASE }
        );
      }
    });
  }

  function init() {
    setupRoster();
    setupBgm();
    setupNav();
    setupForm();
    revealSections();
    revealRoster();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
