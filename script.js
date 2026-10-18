const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

const safeText = value =>
    String(value).replace(/[&<>"']/g, c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[c]));

/* IMAGE FIX */

function fixImages(root = document) {
    $$('img', root).forEach(img => {
        if (img.dataset.fallbackReady) return;

        img.dataset.fallbackReady = 'true';

        img.addEventListener('error', function () {
            const original = this.getAttribute('src') || '';

            if (this.dataset.triedFallback) return;

            this.dataset.triedFallback = 'true';

            if (original.startsWith('images/')) {
                this.src = original.replace(/^images\//, '');
            } else if (
                original &&
                !original.startsWith('http') &&
                !original.startsWith('data:')
            ) {
                this.src = 'images/' + original.replace(/^\.\//, '');
            }
        });
    });
}

/* THEME */

function initTheme() {
    const saved = localStorage.getItem('museumAlmostsTheme');

    if (saved === 'light') {
        document.body.classList.remove('dark');
    } else {
        document.body.classList.add('dark');
    }

    const btn = $('#themeToggle');

    if (btn) {
        btn.textContent =
            document.body.classList.contains('dark') ? '☾' : '☼';

        btn.addEventListener('click', () => {
            document.body.classList.toggle('dark');

            const dark = document.body.classList.contains('dark');

            localStorage.setItem(
                'museumAlmostsTheme',
                dark ? 'dark' : 'light'
            );

            btn.textContent = dark ? '☾' : '☼';
        });
    }
}

/* MOBILE NAVIGATION */

function initNav() {
    const menu = $('#menuToggle');
    const nav = $('#mainNav');

    menu?.addEventListener('click', () => {
        nav?.classList.toggle('open');
    });

    $$('#mainNav a').forEach(a => {
        a.addEventListener('click', () => {
            nav?.classList.remove('open');
        });
    });
}

/* LIKES */

function likes() {
    try {
        return JSON.parse(
            localStorage.getItem('museumAlmostsLikes') || '[]'
        );
    } catch {
        return [];
    }
}

function toggleLike(id) {
    let items = likes();

    items = items.includes(id)
        ? items.filter(n => n !== id)
        : [...items, id];

    localStorage.setItem(
        'museumAlmostsLikes',
        JSON.stringify(items)
    );
}

/* STORY CARDS */

function renderCard(s, feature = false) {
    if (feature) {
        return `
            <article class="feature-card">
                <a class="feature-cover"
                   href="story.html?id=${s.id}">

                    <img
                        src="${safeText(s.cover)}"
                        alt="Photographic cover for ${safeText(s.title)}"
                        loading="lazy"
                    >

                    <span class="cover-title">
                        ${safeText(s.title)}
                    </span>
                </a>

                <h3>${safeText(s.title)}</h3>

                <p>
                    ${safeText(s.genre)} ·
                    by ${safeText(s.author)}
                </p>
            </article>
        `;
    }

    return `
        <article class="book-card">

            <a class="cover-link"
               href="story.html?id=${s.id}"
               aria-label="Read ${safeText(s.title)}">

                <img
                    src="${safeText(s.cover)}"
                    alt="Photographic cover for ${safeText(s.title)}"
                    loading="lazy"
                >

                <span class="read-overlay">
                    READ STORY ↗
                </span>
            </a>

            <div class="card-top">

                <span class="genre-tag">
                    ${safeText(s.genre)}
                </span>

                <button
                    class="like-button ${
                        likes().includes(s.id) ? 'liked' : ''
                    }"
                    data-like="${s.id}"
                    aria-label="Like ${safeText(s.title)}"
                >
                    ${likes().includes(s.id) ? '♥' : '♡'}
                </button>

            </div>

            <h3 class="book-title">
                ${safeText(s.title)}
            </h3>

            <p class="book-author">
                by ${safeText(s.author)} · 1 chapter
            </p>

            <p class="book-synopsis">
                ${safeText(s.synopsis)}
            </p>

        </article>
    `;
}

/* DISPLAY STORIES */

function renderBooks() {
    if (typeof stories === 'undefined') return;

    const grid = $('#bookGrid');
    const featured = $('#featuredGrid');

    if (featured) {
        featured.innerHTML = stories
            .slice(0, 5)
            .map(s => renderCard(s, true))
            .join('');

        fixImages(featured);
    }

    if (!grid) return;

    const params = new URLSearchParams(location.search);

    let genre = params.get('genre') || 'All';

    const search = $('#searchInput');

    if (search && params.get('q')) {
        search.value = params.get('q');
    }

    function paint() {
        const term = (search?.value || '')
            .trim()
            .toLowerCase();

        const list = stories.filter(s => {
            const matchesGenre =
                genre === 'All' || s.genre === genre;

            const matchesSearch = `
                ${s.title}
                ${s.author}
                ${s.genre}
                ${s.synopsis}
            `.toLowerCase().includes(term);

            return matchesGenre && matchesSearch;
        });

        const count = $('#resultsCount');

        if (count) {
            count.textContent =
                `${list.length} ${
                    list.length === 1 ? 'story' : 'stories'
                }`;
        }

        grid.innerHTML = list.length
            ? list.map(s => renderCard(s)).join('')
            : `
                <div class="empty-state">
                    <h3>No stories found</h3>
                    <p>Try a different title or genre.</p>
                </div>
            `;

        fixImages(grid);

        $$('[data-like]', grid).forEach(b => {
            b.addEventListener('click', () => {
                toggleLike(Number(b.dataset.like));
                paint();
            });
        });
    }

    function setGenre(value) {
        genre = value;

        $$('[data-genre]').forEach(b => {
            b.classList.toggle(
                'active',
                b.dataset.genre === value
            );
        });

        paint();

        document.querySelector('#library')?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }

    $$('[data-genre]').forEach(b => {
        b.addEventListener('click', () => {
            setGenre(b.dataset.genre);
        });
    });

    $$('.genre-chip').forEach(b => {
        b.classList.toggle(
            'active',
            b.dataset.genre === genre
        );
    });

    $('#clearFilters')?.addEventListener('click', () => {
        if (search) search.value = '';
        setGenre('All');
    });

    search?.addEventListener('input', paint);

    paint();
}

/* READING PAGE */

function renderStory() {
    const root = $('#storyDetail');

    if (!root || typeof stories === 'undefined') return;

    const id = Number(
        new URLSearchParams(location.search).get('id') || 1
    );

    const s = stories.find(x => x.id === id) || stories[0];

    document.title =
        `${s.title} — A Museum of Almosts`;

    const paras = [
        s.content,
        s.synopsis,
        `The rain had softened the edges of the evening, turning every window into a reflection of a world I almost recognized. I kept thinking about the words I had left unsaid and how they seemed to grow louder in the quiet.`,
        `I took a breath, then another. There was no perfect way to begin again, no neat little sentence that could make everything hurt less. There was only this moment, and the small brave choice to stay inside it.`,
        `Outside, the streetlights trembled in the puddles. I folded the letter carefully and held it close, knowing that some endings are not doors closing. Sometimes, they are the first light beneath a new one.`
    ];

    root.innerHTML = `
        <div class="story-detail">

            <aside>
                <img
                    class="story-poster"
                    src="${safeText(s.cover)}"
                    alt="Cover of ${safeText(s.title)}"
                >
            </aside>

            <div class="story-info">

                <p class="eyebrow">
                    A MUSEUM OF ALMOSTS ORIGINAL ·
                    STORY ${String(s.id).padStart(2, '0')}
                </p>

                <h1>${safeText(s.title)}</h1>

                <p class="story-meta">
                    By <strong>${safeText(s.author)}</strong>
                    · ${safeText(s.genre)}
                    · One chapter
                </p>

                <p class="story-synopsis">
                    ${safeText(s.synopsis)}
                </p>

                <div class="story-actions">

                    <button
                        class="button primary"
                        id="startReading"
                    >
                        Start reading ↓
                    </button>

                    <button
                        class="secondary-button"
                        id="likeReader"
                    >
                        ${
                            likes().includes(s.id)
                                ? '♥ Saved to likes'
                                : '♡ Save to likes'
                        }
                    </button>

                    <button
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
                        ${safeText(s.synopsis)}
                    </p>

                </div>

            </div>
        </div>

        <img
            class="scene-image"
            src="${safeText(s.scene)}"
            alt="Atmospheric photo for ${safeText(s.title)}"
        >

        <article class="chapter-box" id="chapter">

            <p class="chapter-kicker">
                CHAPTER 01 · SINGLE CHAPTER
            </p>

            <h2>${safeText(s.chapter)}</h2>

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
                ${paras.map(p => `
                    <p>${safeText(p)}</p>
                `).join('')}
            </div>

            <div class="end-note">
                ♡ &nbsp; You reached the end of this
                one-chapter story. Thank you for reading.
            </div>

            <div class="reader-bottom">

                <a
                    class="secondary-button"
                    href="stories.html"
                >
                    ← More stories
                </a>

                <button
                    class="button primary"
                    id="nextStory"
                >
                    Read another story →
                </button>

            </div>

        </article>
    `;

    fixImages(root);

    $('#startReading')?.addEventListener('click', () => {
        $('#chapter')?.scrollIntoView({
            behavior: 'smooth'
        });
    });

    $('#synopsisToggle')?.addEventListener('click', () => {
        const panel = $('#synopsisPanel');

        panel.hidden = !panel.hidden;

        $('#synopsisToggle').textContent =
            panel.hidden ? 'Show synopsis' : 'Hide synopsis';
    });

    $('#likeReader')?.addEventListener('click', () => {
        toggleLike(s.id);

        $('#likeReader').textContent =
            likes().includes(s.id)
                ? '♥ Saved to likes'
                : '♡ Save to likes';
    });

    $('#nextStory')?.addEventListener('click', () => {
        location.href =
            `story.html?id=${s.id % stories.length + 1}`;
    });

    function progress() {
        const el = $('#chapter');

        if (!el) return;

        const pct = Math.max(
            0,
            Math.min(
                100,
                Math.round(
                    (
                        window.scrollY -
                        el.offsetTop +
                        window.innerHeight * 0.4
                    ) / el.scrollHeight * 100
                )
            )
        );

        $('#progressBar').style.width = pct + '%';

        $('#progressLabel').textContent =
            `Reading progress: ${pct}%`;
    }

    window.addEventListener('scroll', progress, {
        passive: true
    });

    progress();
}

/* START WEBSITE */

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initNav();
    renderBooks();
    renderStory();
    fixImages();
});const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

const safeText = value =>
    String(value).replace(/[&<>"']/g, c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[c]));

/* IMAGE FIX */

function fixImages(root = document) {
    $$('img', root).forEach(img => {
        if (img.dataset.fallbackReady) return;

        img.dataset.fallbackReady = 'true';

        img.addEventListener('error', function () {
            const original = this.getAttribute('src') || '';

            if (this.dataset.triedFallback) return;

            this.dataset.triedFallback = 'true';

            if (original.startsWith('images/')) {
                this.src = original.replace(/^images\//, '');
            } else if (
                original &&
                !original.startsWith('http') &&
                !original.startsWith('data:')
            ) {
                this.src = 'images/' + original.replace(/^\.\//, '');
            }
        });
    });
}

/* THEME */

function initTheme() {
    const saved = localStorage.getItem('museumAlmostsTheme');

    if (saved === 'light') {
        document.body.classList.remove('dark');
    } else {
        document.body.classList.add('dark');
    }

    const btn = $('#themeToggle');

    if (btn) {
        btn.textContent =
            document.body.classList.contains('dark') ? '☾' : '☼';

        btn.addEventListener('click', () => {
            document.body.classList.toggle('dark');

            const dark = document.body.classList.contains('dark');

            localStorage.setItem(
                'museumAlmostsTheme',
                dark ? 'dark' : 'light'
            );

            btn.textContent = dark ? '☾' : '☼';
        });
    }
}

/* MOBILE NAVIGATION */

function initNav() {
    const menu = $('#menuToggle');
    const nav = $('#mainNav');

    menu?.addEventListener('click', () => {
        nav?.classList.toggle('open');
    });

    $$('#mainNav a').forEach(a => {
        a.addEventListener('click', () => {
            nav?.classList.remove('open');
        });
    });
}

/* LIKES */

function likes() {
    try {
        return JSON.parse(
            localStorage.getItem('museumAlmostsLikes') || '[]'
        );
    } catch {
        return [];
    }
}

function toggleLike(id) {
    let items = likes();

    items = items.includes(id)
        ? items.filter(n => n !== id)
        : [...items, id];

    localStorage.setItem(
        'museumAlmostsLikes',
        JSON.stringify(items)
    );
}

/* STORY CARDS */

function renderCard(s, feature = false) {
    if (feature) {
        return `
            <article class="feature-card">
                <a class="feature-cover"
                   href="story.html?id=${s.id}">

                    <img
                        src="${safeText(s.cover)}"
                        alt="Photographic cover for ${safeText(s.title)}"
                        loading="lazy"
                    >

                    <span class="cover-title">
                        ${safeText(s.title)}
                    </span>
                </a>

                <h3>${safeText(s.title)}</h3>

                <p>
                    ${safeText(s.genre)} ·
                    by ${safeText(s.author)}
                </p>
            </article>
        `;
    }

    return `
        <article class="book-card">

            <a class="cover-link"
               href="story.html?id=${s.id}"
               aria-label="Read ${safeText(s.title)}">

                <img
                    src="${safeText(s.cover)}"
                    alt="Photographic cover for ${safeText(s.title)}"
                    loading="lazy"
                >

                <span class="read-overlay">
                    READ STORY ↗
                </span>
            </a>

            <div class="card-top">

                <span class="genre-tag">
                    ${safeText(s.genre)}
                </span>

                <button
                    class="like-button ${
                        likes().includes(s.id) ? 'liked' : ''
                    }"
                    data-like="${s.id}"
                    aria-label="Like ${safeText(s.title)}"
                >
                    ${likes().includes(s.id) ? '♥' : '♡'}
                </button>

            </div>

            <h3 class="book-title">
                ${safeText(s.title)}
            </h3>

            <p class="book-author">
                by ${safeText(s.author)} · 1 chapter
            </p>

            <p class="book-synopsis">
                ${safeText(s.synopsis)}
            </p>

        </article>
    `;
}

/* DISPLAY STORIES */

function renderBooks() {
    if (typeof stories === 'undefined') return;

    const grid = $('#bookGrid');
    const featured = $('#featuredGrid');

    if (featured) {
        featured.innerHTML = stories
            .slice(0, 5)
            .map(s => renderCard(s, true))
            .join('');

        fixImages(featured);
    }

    if (!grid) return;

    const params = new URLSearchParams(location.search);

    let genre = params.get('genre') || 'All';

    const search = $('#searchInput');

    if (search && params.get('q')) {
        search.value = params.get('q');
    }

    function paint() {
        const term = (search?.value || '')
            .trim()
            .toLowerCase();

        const list = stories.filter(s => {
            const matchesGenre =
                genre === 'All' || s.genre === genre;

            const matchesSearch = `
                ${s.title}
                ${s.author}
                ${s.genre}
                ${s.synopsis}
            `.toLowerCase().includes(term);

            return matchesGenre && matchesSearch;
        });

        const count = $('#resultsCount');

        if (count) {
            count.textContent =
                `${list.length} ${
                    list.length === 1 ? 'story' : 'stories'
                }`;
        }

        grid.innerHTML = list.length
            ? list.map(s => renderCard(s)).join('')
            : `
                <div class="empty-state">
                    <h3>No stories found</h3>
                    <p>Try a different title or genre.</p>
                </div>
            `;

        fixImages(grid);

        $$('[data-like]', grid).forEach(b => {
            b.addEventListener('click', () => {
                toggleLike(Number(b.dataset.like));
                paint();
            });
        });
    }

    function setGenre(value) {
        genre = value;

        $$('[data-genre]').forEach(b => {
            b.classList.toggle(
                'active',
                b.dataset.genre === value
            );
        });

        paint();

        document.querySelector('#library')?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }

    $$('[data-genre]').forEach(b => {
        b.addEventListener('click', () => {
            setGenre(b.dataset.genre);
        });
    });

    $$('.genre-chip').forEach(b => {
        b.classList.toggle(
            'active',
            b.dataset.genre === genre
        );
    });

    $('#clearFilters')?.addEventListener('click', () => {
        if (search) search.value = '';
        setGenre('All');
    });

    search?.addEventListener('input', paint);

    paint();
}

/* READING PAGE */

function renderStory() {
    const root = $('#storyDetail');

    if (!root || typeof stories === 'undefined') return;

    const id = Number(
        new URLSearchParams(location.search).get('id') || 1
    );

    const s = stories.find(x => x.id === id) || stories[0];

    document.title =
        `${s.title} — A Museum of Almosts`;

    const paras = [
        s.content,
        s.synopsis,
        `The rain had softened the edges of the evening, turning every window into a reflection of a world I almost recognized. I kept thinking about the words I had left unsaid and how they seemed to grow louder in the quiet.`,
        `I took a breath, then another. There was no perfect way to begin again, no neat little sentence that could make everything hurt less. There was only this moment, and the small brave choice to stay inside it.`,
        `Outside, the streetlights trembled in the puddles. I folded the letter carefully and held it close, knowing that some endings are not doors closing. Sometimes, they are the first light beneath a new one.`
    ];

    root.innerHTML = `
        <div class="story-detail">

            <aside>
                <img
                    class="story-poster"
                    src="${safeText(s.cover)}"
                    alt="Cover of ${safeText(s.title)}"
                >
            </aside>

            <div class="story-info">

                <p class="eyebrow">
                    A MUSEUM OF ALMOSTS ORIGINAL ·
                    STORY ${String(s.id).padStart(2, '0')}
                </p>

                <h1>${safeText(s.title)}</h1>

                <p class="story-meta">
                    By <strong>${safeText(s.author)}</strong>
                    · ${safeText(s.genre)}
                    · One chapter
                </p>

                <p class="story-synopsis">
                    ${safeText(s.synopsis)}
                </p>

                <div class="story-actions">

                    <button
                        class="button primary"
                        id="startReading"
                    >
                        Start reading ↓
                    </button>

                    <button
                        class="secondary-button"
                        id="likeReader"
                    >
                        ${
                            likes().includes(s.id)
                                ? '♥ Saved to likes'
                                : '♡ Save to likes'
                        }
                    </button>

                    <button
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
                        ${safeText(s.synopsis)}
                    </p>

                </div>

            </div>
        </div>

        <img
            class="scene-image"
            src="${safeText(s.scene)}"
            alt="Atmospheric photo for ${safeText(s.title)}"
        >

        <article class="chapter-box" id="chapter">

            <p class="chapter-kicker">
                CHAPTER 01 · SINGLE CHAPTER
            </p>

            <h2>${safeText(s.chapter)}</h2>

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
                ${paras.map(p => `
                    <p>${safeText(p)}</p>
                `).join('')}
            </div>

            <div class="end-note">
                ♡ &nbsp; You reached the end of this
                one-chapter story. Thank you for reading.
            </div>

            <div class="reader-bottom">

                <a
                    class="secondary-button"
                    href="stories.html"
                >
                    ← More stories
                </a>

                <button
                    class="button primary"
                    id="nextStory"
                >
                    Read another story →
                </button>

            </div>

        </article>
    `;

    fixImages(root);

    $('#startReading')?.addEventListener('click', () => {
        $('#chapter')?.scrollIntoView({
            behavior: 'smooth'
        });
    });

    $('#synopsisToggle')?.addEventListener('click', () => {
        const panel = $('#synopsisPanel');

        panel.hidden = !panel.hidden;

        $('#synopsisToggle').textContent =
            panel.hidden ? 'Show synopsis' : 'Hide synopsis';
    });

    $('#likeReader')?.addEventListener('click', () => {
        toggleLike(s.id);

        $('#likeReader').textContent =
            likes().includes(s.id)
                ? '♥ Saved to likes'
                : '♡ Save to likes';
    });

    $('#nextStory')?.addEventListener('click', () => {
        location.href =
            `story.html?id=${s.id % stories.length + 1}`;
    });

    function progress() {
        const el = $('#chapter');

        if (!el) return;

        const pct = Math.max(
            0,
            Math.min(
                100,
                Math.round(
                    (
                        window.scrollY -
                        el.offsetTop +
                        window.innerHeight * 0.4
                    ) / el.scrollHeight * 100
                )
            )
        );

        $('#progressBar').style.width = pct + '%';

        $('#progressLabel').textContent =
            `Reading progress: ${pct}%`;
    }

    window.addEventListener('scroll', progress, {
        passive: true
    });

    progress();
}

/* START WEBSITE */

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initNav();
    renderBooks();
    renderStory();
    fixImages();
});
