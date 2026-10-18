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


/* ========================================
   IMAGE PATH FIX
======================================== */

function fixImages(root = document) {
    $$("img", root).forEach(img => {
        if (img.dataset.imageFixed === "true") return;

        img.dataset.imageFixed = "true";

        img.addEventListener("error", function () {
            if (this.dataset.fallbackTried === "true") {
                return;
            }

            this.dataset.fallbackTried = "true";

            const current = this.getAttribute("src") || "";

            if (current.startsWith("images/")) {
                this.src = current.replace(/^images\//, "");
            } else if (
                current &&
                !current.startsWith("http") &&
                !current.startsWith("data:") &&
                !current.startsWith("/")
            ) {
                this.src = "images/" + current.replace(/^\.\//, "");
            }
        });
    });
}


/* ========================================
   DARK AND LIGHT MODE
======================================== */

function initTheme() {
    const saved = localStorage.getItem("museumAlmostsTheme");

    if (saved === "light") {
        document.body.classList.remove("dark");
    } else {
        document.body.classList.add("dark");
    }

    const button = $("#themeToggle");

    if (!button) return;

    function updateIcon() {
        button.textContent =
            document.body.classList.contains("dark")
                ? "☾"
                : "☼";
    }

    updateIcon();

    button.addEventListener("click", () => {
        document.body.classList.toggle("dark");

        const isDark =
            document.body.classList.contains("dark");

        localStorage.setItem(
            "museumAlmostsTheme",
            isDark ? "dark" : "light"
        );

        updateIcon();
    });
}


/* ========================================
   MOBILE NAVIGATION
======================================== */

function initNav() {
    const menuButton = $("#menuToggle");
    const navigation = $("#mainNav");

    menuButton?.addEventListener("click", () => {
        navigation?.classList.toggle("open");
    });

    $$("#mainNav a").forEach(link => {
        link.addEventListener("click", () => {
            navigation?.classList.remove("open");
        });
    });
}


/* ========================================
   LIKES SYSTEM
======================================== */

function likes() {
    try {
        const saved = JSON.parse(
            localStorage.getItem("museumAlmostsLikes") || "[]"
        );

        return Array.isArray(saved) ? saved : [];
    } catch (error) {
        return [];
    }
}

function toggleLike(id) {
    let savedLikes = likes();

    if (savedLikes.includes(id)) {
        savedLikes = savedLikes.filter(item => item !== id);
    } else {
        savedLikes.push(id);
    }

    localStorage.setItem(
        "museumAlmostsLikes",
        JSON.stringify(savedLikes)
    );
}


/* ========================================
   CREATE STORY CARDS
======================================== */

function renderCard(story, featured = false) {
    const title = safeText(story.title);
    const author = safeText(story.author);
    const genre = safeText(story.genre);
    const synopsis = safeText(story.synopsis);
    const cover = safeText(story.cover);

    const isLiked = likes().includes(story.id);

    if (featured) {
        return `
            <article class="feature-card">

                <a
                    class="feature-cover"
                    href="story.html?id=${story.id}"
                >
                    <img
                        src="${cover}"
                        alt="Cover for ${title}"
                        loading="lazy"
                    >

                    <span class="cover-title">
                        ${title}
                    </span>
                </a>

                <h3>${title}</h3>

                <p>
                    ${genre} · by ${author}
                </p>

            </article>
        `;
    }

    return `
        <article class="book-card">

            <a
                class="cover-link"
                href="story.html?id=${story.id}"
                aria-label="Read ${title}"
            >

                <img
                    src="${cover}"
                    alt="Cover for ${title}"
                    loading="lazy"
                >

                <span class="read-overlay">
                    READ STORY ↗
                </span>

            </a>

            <div class="card-top">

                <span class="genre-tag">
                    ${genre}
                </span>

                <button
                    type="button"
                    class="like-button ${isLiked ? "liked" : ""}"
                    data-like="${story.id}"
                    aria-label="Like ${title}"
                >
                    ${isLiked ? "♥" : "♡"}
                </button>

            </div>

            <h3 class="book-title">
                ${title}
            </h3>

            <p class="book-author">
                by ${author} · 1 chapter
            </p>

            <p class="book-synopsis">
                ${synopsis}
            </p>

        </article>
    `;
}


/* ========================================
   DISPLAY ALL STORIES
======================================== */

function renderBooks() {
    if (
        typeof stories === "undefined" ||
        !Array.isArray(stories)
    ) {
        console.error("stories.js was not loaded correctly.");
        return;
    }

    const grid = $("#bookGrid");
    const featuredGrid = $("#featuredGrid");
    const searchInput = $("#searchInput");

    /* FEATURED STORIES */

    if (featuredGrid) {
        featuredGrid.innerHTML = stories
            .slice(0, 5)
            .map(story => renderCard(story, true))
            .join("");

        fixImages(featuredGrid);
    }

    /* SEARCH FROM HOMEPAGE */

    if (!grid) {
        if (searchInput) {
            searchInput.addEventListener("keydown", event => {
                if (
                    event.key === "Enter" &&
                    searchInput.value.trim()
                ) {
                    window.location.href =
                        "stories.html?q=" +
                        encodeURIComponent(
                            searchInput.value.trim()
                        );
                }
            });
        }

        return;
    }

    const params = new URLSearchParams(
        window.location.search
    );

    let selectedGenre = params.get("genre") || "All";

    if (searchInput && params.get("q")) {
        searchInput.value = params.get("q");
    }

    /* PAINT STORY CARDS */

    function paint() {
        const searchTerm = (
            searchInput?.value || ""
        ).trim().toLowerCase();

        const filteredStories = stories.filter(story => {
            const genreMatches =
                selectedGenre === "All" ||
                story.genre === selectedGenre;

            const searchableText = [
                story.title,
                story.author,
                story.genre,
                story.synopsis
            ].join(" ").toLowerCase();

            const searchMatches =
                searchableText.includes(searchTerm);

            return genreMatches && searchMatches;
        });

        const resultsCount = $("#resultsCount");

        if (resultsCount) {
            resultsCount.textContent =
                filteredStories.length +
                (
                    filteredStories.length === 1
                        ? " story"
                        : " stories"
                );
        }

        if (filteredStories.length > 0) {
            grid.innerHTML = filteredStories
                .map(story => renderCard(story))
                .join("");
        } else {
            grid.innerHTML = `
                <div class="empty-state">
                    <h3>No stories found</h3>
                    <p>
                        Try a different title or genre.
                    </p>
                </div>
            `;
        }

        /* FIX IMAGES AFTER RENDERING */

        fixImages(grid);

        /* LIKE BUTTONS */

        $$("[data-like]", grid).forEach(button => {
            button.addEventListener("click", () => {
                const storyId = Number(
                    button.dataset.like
                );

                toggleLike(storyId);

                const liked = likes().includes(storyId);

                button.classList.toggle("liked", liked);
                button.textContent = liked ? "♥" : "♡";
            });
        });
    }

    /* GENRE FILTERS */

    function setGenre(genre) {
        selectedGenre = genre;

        $$("[data-genre]").forEach(button => {
            button.classList.toggle(
                "active",
                button.dataset.genre === genre
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

    $$(".genre-chip").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.genre === selectedGenre
        );
    });

    /* CLEAR FILTERS */

    $("#clearFilters")?.addEventListener("click", () => {
        if (searchInput) {
            searchInput.value = "";
        }

        setGenre("All");
    });

    /* LIVE SEARCH */

    searchInput?.addEventListener("input", paint);

    /* INITIAL DISPLAY */

    paint();
}


/* ========================================
   STORY READING PAGE
======================================== */

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

    const params = new URLSearchParams(
        window.location.search
    );

    const storyId = Number(
        params.get("id") || 1
    );

    const story =
        stories.find(item => item.id === storyId) ||
        stories[0];

    document.title =
        story.title + " — A Museum of Almosts";

    const paragraphs = [
        story.content,
        story.synopsis,

        `The rain had softened the edges of the evening,
        turning every window into a reflection of a world
        I almost recognized. I kept thinking about the
        words I had left unsaid and how they seemed to
        grow louder in the quiet.`,

        `I took a breath, then another. There was no
        perfect way to begin again, no neat little
        sentence that could make everything hurt less.
        There was only this moment, and the small brave
        choice to stay inside it.`,

        `Outside, the streetlights trembled in the
        puddles. I folded the letter carefully and held
        it close, knowing that some endings are not
        doors closing. Sometimes, they are the first
        light beneath a new one.`
    ];

    const nextIndex =
        (stories.findIndex(item => item.id === story.id) + 1) %
        stories.length;

    const nextStory = stories[nextIndex];

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

                <h1>
                    ${safeText(story.title)}
                </h1>

                <p class="story-meta">
                    By
                    <strong>${safeText(story.author)}</strong>
                    · ${safeText(story.genre)}
                    · One chapter
                </p>

                <p class="story-synopsis">
                    ${safeText(story.synopsis)}
                </p>

                <div class="story-actions">

                    <button
                        type="button"
                        class="button primary"
                        id="startReading"
                    >
                        Start reading ↓
                    </button>

                    <button
                        type="button"
                        class="secondary-button"
                        id="likeReader"
                    >
                        ${
                            likes().includes(story.id)
                                ? "♥ Saved to likes"
                                : "♡ Save to likes"
                        }
                    </button>

                    <button
                        type="button"
                        class="secondary-button"
                        id="synopsisToggle"
                    >
                        Hide synopsis
                    </button>

                </div>

                <div
                    class="synopsis-panel"
                    id="synopsisPanel"
                >

                    <p class="eyebrow">
                        THE STORY BEHIND THE COVER
                    </p>

                    <p class="story-synopsis">
                        ${safeText(story.synopsis)}
                    </p>

                </div>

            </div>

        </div>

        <img
            class="scene-image"
            src="${safeText(story.scene)}"
            alt="Atmospheric photo for ${safeText(story.title)}"
        >

        <article
            class="chapter-box"
            id="chapter"
        >

            <p class="chapter-kicker">
                CHAPTER 01 · SINGLE CHAPTER
            </p>

            <h2>
                ${safeText(story.chapter)}
            </h2>

            <div class="reading-progress">
                <span id="progressBar"></span>
            </div>

            <div
                class="progress-label"
                id="progressLabel"
            >
                Reading progress: 0%
            </div>

            <div class="story-copy">
                ${paragraphs.map(paragraph => `
                    <p>
                        ${safeText(paragraph).replace(/\n/g, "<br>")}
                    </p>
                `).join("")}
            </div>

            <div class="end-note">
                ♡ &nbsp;
                You reached the end of this one-chapter story.
                Thank you for reading.
            </div>

            <div class="reader-bottom">

                <a
                    class="secondary-button"
                    href="stories.html"
                >
                    ← More stories
                </a>

                <button
                    type="button"
                    class="button primary"
                    id="nextStory"
                >
                    Read another story →
                </button>

            </div>

        </article>
    `;

    /* FIX READING PAGE IMAGES */

    fixImages(root);

    /* START READING */

    $("#startReading")?.addEventListener("click", () => {
        $("#chapter")?.scrollIntoView({
            behavior: "smooth"
        });
    });

    /* SYNOPSIS TOGGLE */

    $("#synopsisToggle")?.addEventListener("click", () => {
        const panel = $("#synopsisPanel");
        const button = $("#synopsisToggle");

        if (!panel || !button) return;

        panel.hidden = !panel.hidden;

        button.textContent =
            panel.hidden
                ? "Show synopsis"
                : "Hide synopsis";
    });

    /* SAVE TO LIKES */

    $("#likeReader")?.addEventListener("click", () => {
        toggleLike(story.id);

        $("#likeReader").textContent =
            likes().includes(story.id)
                ? "♥ Saved to likes"
                : "♡ Save to likes";
    });

    /* NEXT STORY */

    $("#nextStory")?.addEventListener("click", () => {
        window.location.href =
            "story.html?id=" + nextStory.id;
    });

    /* READING PROGRESS */

    function updateReadingProgress() {
        const chapter = $("#chapter");
        const progressBar = $("#progressBar");
        const progressLabel = $("#progressLabel");

        if (!chapter || !progressBar || !progressLabel) {
            return;
        }

        const chapterHeight = chapter.scrollHeight;

        const progress = chapterHeight > 0
            ? Math.max(
                0,
                Math.min(
                    100,
                    Math.round(
                        (
                            window.scrollY -
                            chapter.offsetTop +
                            window.innerHeight * 0.4
                        ) / chapterHeight * 100
                    )
                )
            )
            : 0;

        progressBar.style.width = progress + "%";

        progressLabel.textContent =
            "Reading progress: " + progress + "%";
    }

    window.addEventListener(
        "scroll",
        updateReadingProgress,
        { passive: true }
    );

    updateReadingProgress();
}


/* ========================================
   INITIALIZE WEBSITE
======================================== */

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
