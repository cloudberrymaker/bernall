const $ = (selector, root = document) =>
  root.querySelector(selector);

const $$ = (selector, root = document) =>
  [...root.querySelectorAll(selector)];

const safeText = value =>
  String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[character]));


/* ==========================
   THEME
========================== */

function initTheme() {
  const saved = localStorage.getItem("museumAlmostsTheme");

  document.body.classList.toggle("dark", saved !== "light");

  const button = $("#themeToggle");

  if (!button) return;

  const updateIcon = () => {
    button.textContent =
      document.body.classList.contains("dark") ? "☾" : "☼";
  };

  updateIcon();

  button.addEventListener("click", () => {
    document.body.classList.toggle("dark");

    const isDark = document.body.classList.contains("dark");

    localStorage.setItem(
      "museumAlmostsTheme",
      isDark ? "dark" : "light"
    );

    updateIcon();
  });
}


/* ==========================
   NAVIGATION
========================== */

function initNav() {
  $("#menuToggle")?.addEventListener("click", () => {
    $("#mainNav")?.classList.toggle("open");
  });

  $$("#mainNav a").forEach(link => {
    link.addEventListener("click", () => {
      $("#mainNav")?.classList.remove("open");
    });
  });
}


/* ==========================
   LIKES
========================== */

function likes() {
  try {
    const data = JSON.parse(
      localStorage.getItem("museumAlmostsLikes") || "[]"
    );

    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function toggleLike(id) {
  let data = likes();

  data = data.includes(id)
    ? data.filter(item => item !== id)
    : [...data, id];

  localStorage.setItem(
    "museumAlmostsLikes",
    JSON.stringify(data)
  );
}


/* ==========================
   IMAGE FALLBACK
========================== */

function fixImages(root = document) {
  $$("img", root).forEach(img => {
    if (img.dataset.imageFallback === "ready") return;

    img.dataset.imageFallback = "ready";

    img.addEventListener("error", () => {
      const current = img.getAttribute("src") || "";

      if (img.dataset.fallbackAttempted === "yes") return;

      img.dataset.fallbackAttempted = "yes";

      if (current.startsWith("images/")) {
        img.src = current.replace(/^images\//, "");
      } else if (
        current &&
        !current.startsWith("http") &&
        !current.startsWith("/") &&
        !current.startsWith("data:")
      ) {
        img.src = "images/" + current.replace(/^\.\//, "");
      }
    });
  });
}


/* ==========================
   STORY CARD
========================== */

function renderCard(story, featured = false) {
  const title = safeText(story.title);
  const author = safeText(story.author);
  const genre = safeText(story.genre);
  const synopsis = safeText(story.synopsis);
  const cover = safeText(story.cover);

  if (featured) {
    return `
      <article class="feature-card">
        <a class="feature-cover" href="story.html?id=${story.id}">
          <img src="${cover}" alt="Cover of ${title}" loading="lazy">
          <span class="cover-title">${title}</span>
        </a>
        <h3>${title}</h3>
        <p>${genre} · by ${author}</p>
      </article>
    `;
  }

  const liked = likes().includes(story.id);

  return `
    <article class="book-card">
      <a
        class="cover-link"
        href="story.html?id=${story.id}"
        aria-label="Read ${title}"
      >
        <img src="${cover}" alt="Cover of ${title}" loading="lazy">
        <span class="read-overlay">READ STORY ↗</span>
      </a>

      <div class="card-top">
        <span class="genre-tag">${genre}</span>

        <button
          type="button"
          class="like-button ${liked ? "liked" : ""}"
          data-like="${story.id}"
          aria-label="Like ${title}"
        >
          ${liked ? "♥" : "♡"}
        </button>
      </div>

      <h3 class="book-title">${title}</h3>
      <p class="book-author">by ${author} · 1 chapter</p>
      <p class="book-synopsis">${synopsis}</p>
    </article>
  `;
}


/* ==========================
   STORIES GRID
========================== */

function renderBooks() {
  if (
    typeof stories === "undefined" ||
    !Array.isArray(stories)
  ) {
    console.error("stories.js is missing or not loaded.");
    return;
  }

  const featured = $("#featuredGrid");
  const grid = $("#bookGrid");
  const search = $("#searchInput");

  if (featured) {
    featured.innerHTML = stories
      .slice(0, 5)
      .map(story => renderCard(story, true))
      .join("");

    fixImages(featured);
  }

  if (!grid) {
    search?.addEventListener("keydown", event => {
      if (event.key === "Enter" && search.value.trim()) {
        location.href =
          "stories.html?q=" +
          encodeURIComponent(search.value.trim());
      }
    });

    return;
  }

  const params = new URLSearchParams(location.search);

  let genre = params.get("genre") || "All";

  if (search && params.get("q")) {
    search.value = params.get("q");
  }

  function paint() {
    const term = (search?.value || "").trim().toLowerCase();

    const filtered = stories.filter(story => {
      const matchesGenre =
        genre === "All" || story.genre === genre;

      const text = [
        story.title,
        story.author,
        story.genre,
        story.synopsis
      ].join(" ").toLowerCase();

      return matchesGenre && text.includes(term);
    });

    const count = $("#resultsCount");

    if (count) {
      count.textContent =
        `${filtered.length} ${
          filtered.length === 1 ? "story" : "stories"
        }`;
    }

    grid.innerHTML = filtered.length
      ? filtered.map(story => renderCard(story)).join("")
      : `
        <div class="empty-state">
          <h3>No stories found</h3>
          <p>Try a different title or genre.</p>
        </div>
      `;

    // Make sure the cards are visible.
    grid.style.display = "grid";
    grid.style.visibility = "visible";
    grid.style.opacity = "1";

    fixImages(grid);

    $$("[data-like]", grid).forEach(button => {
      button.addEventListener("click", () => {
        const id = Number(button.dataset.like);

        toggleLike(id);

        const liked = likes().includes(id);

        button.classList.toggle("liked", liked);
        button.textContent = liked ? "♥" : "♡";
      });
    });
  }

  function setGenre(value) {
    genre = value;

    $$("[data-genre]").forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.genre === value
      );
    });

    paint();

    $("#library")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  $$("[data-genre]").forEach(button => {
    button.addEventListener("click", () => {
      setGenre(button.dataset.genre);
    });
  });

  $("#clearFilters")?.addEventListener("click", () => {
    if (search) search.value = "";
    setGenre("All");
  });

  search?.addEventListener("input", paint);

  paint();
}


/* ==========================
   READING PAGE
========================== */

function renderStory() {
  const root = $("#storyDetail");

  if (
    !root ||
    typeof stories === "undefined" ||
    !Array.isArray(stories) ||
    stories.length === 0
  ) {
    return;
  }

  const id = Number(
    new URLSearchParams(location.search).get("id") || 1
  );

  const story =
    stories.find(item => item.id === id) || stories[0];

  document.title =
    `${story.title} — A Museum of Almosts`;

  const paragraphs = String(story.content || "")
    .split(/\n\s*\n/)
    .filter(Boolean);

  root.innerHTML = `
    <div class="story-detail">
      <aside>
        <img
          class="story-poster"
          src="${safeText(story.cover)}"
          alt="Cover of ${safeText(story.title)}"
        >
      </aside>

      <div class="story-info">
        <p class="eyebrow">
          A MUSEUM OF ALMOSTS ORIGINAL ·
          STORY ${String(story.id).padStart(2, "0")}
        </p>

        <h1>${safeText(story.title)}</h1>

        <p class="story-meta">
          By <strong>${safeText(story.author)}</strong>
          · ${safeText(story.genre)} · One chapter
        </p>

        <p class="story-synopsis">
          ${safeText(story.synopsis)}
        </p>

        <div class="story-actions">
          <button class="button primary" id="startReading">
            Start reading ↓
          </button>

          <button class="secondary-button" id="likeReader">
            ${likes().includes(story.id)
              ? "♥ Saved to likes"
              : "♡ Save to likes"}
          </button>

          <button class="secondary-button" id="synopsisToggle">
            Hide synopsis
          </button>
        </div>

        <div class="synopsis-panel" id="synopsisPanel">
          <p class="eyebrow">THE STORY BEHIND THE COVER</p>
          <p class="story-synopsis">
            ${safeText(story.synopsis)}
          </p>
        </div>
      </div>
    </div>

    <img
      class="scene-image"
      src="${safeText(story.scene)}"
      alt="Scene for ${safeText(story.title)}"
    >

    <article class="chapter-box" id="chapter">
      <p class="chapter-kicker">
        CHAPTER 01 · SINGLE CHAPTER
      </p>

      <h2>${safeText(story.chapter)}</h2>

      <div class="reading-progress">
        <span id="progressBar"></span>
      </div>

      <div class="progress-label" id="progressLabel">
        Reading progress: 0%
      </div>

      <div class="story-copy">
        ${paragraphs.map(paragraph =>
          `<p>${safeText(paragraph)}</p>`
        ).join("")}
      </div>

      <div class="end-note">
        ♡ You reached the end of this one-chapter story.
        Thank you for reading.
      </div>

      <div class="reader-bottom">
        <a class="secondary-button" href="stories.html">
          ← More stories
        </a>

        <button class="button primary" id="nextStory">
          Read another story →
        </button>
      </div>
    </article>
  `;

  fixImages(root);

  $("#startReading")?.addEventListener("click", () => {
    $("#chapter")?.scrollIntoView({
      behavior: "smooth"
    });
  });

  $("#synopsisToggle")?.addEventListener("click", () => {
    const panel = $("#synopsisPanel");
    const button = $("#synopsisToggle");

    if (!panel || !button) return;

    panel.hidden = !panel.hidden;

    button.textContent =
      panel.hidden ? "Show synopsis" : "Hide synopsis";
  });

  $("#likeReader")?.addEventListener("click", () => {
    toggleLike(story.id);

    $("#likeReader").textContent =
      likes().includes(story.id)
        ? "♥ Saved to likes"
        : "♡ Save to likes";
  });

  $("#nextStory")?.addEventListener("click", () => {
    const index = stories.findIndex(
      item => item.id === story.id
    );

    const next = stories[(index + 1) % stories.length];

    location.href = `story.html?id=${next.id}`;
  });

  function updateProgress() {
    const chapter = $("#chapter");

    if (!chapter) return;

    const progress = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          (
            window.scrollY -
            chapter.offsetTop +
            window.innerHeight * 0.4
          ) / chapter.scrollHeight * 100
        )
      )
    );

    const bar = $("#progressBar");
    const label = $("#progressLabel");

    if (bar) bar.style.width = progress + "%";

    if (label) {
      label.textContent =
        `Reading progress: ${progress}%`;
    }
  }

  window.addEventListener("scroll", updateProgress, {
    passive: true
  });

  updateProgress();
}


/* ==========================
   START WEBSITE
========================== */

function initializeWebsite() {
  initTheme();
  initNav();
  renderBooks();
  renderStory();
  fixImages();
}

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    initializeWebsite
  );
} else {
  initializeWebsite();
              }
