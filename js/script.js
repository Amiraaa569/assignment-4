document.addEventListener('DOMContentLoaded', () => {

    const $  = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
    const STORAGE = {
        THEME: 'pref-theme',
        NAME: 'username',
        VISITS: 'visit-count',
        PROJECT: 'project-controls'
    };

    function applyTheme(theme) {
        const isDark = theme === 'dark';
        document.documentElement.classList.toggle('dark', isDark);
        $('#themeToggle')?.setAttribute('aria-pressed', String(isDark));
    }
    function initTheme() {
        const saved = localStorage.getItem(STORAGE.THEME);
        const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        applyTheme(saved || preferred);
    }

    $('#themeToggle')?.addEventListener('click', () => {
        const next = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
        localStorage.setItem(STORAGE.THEME, next);
        applyTheme(next);
    });

    function timeWord(h) { return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; }
    function updateGreeting() {
        const el = $('#greeting'); if (!el) return;
        const h = new Date().getHours();
        const name = localStorage.getItem(STORAGE.NAME) || '';
        el.textContent = `${timeWord(h)}${name ? ', ' + name : ''} 👋`;
    }
    $('#usernameForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = $('#username'); if (!input) return;
        const val = input.value.trim();
        if (val) { localStorage.setItem(STORAGE.NAME, val); updateGreeting(); input.value = ''; }
    });

    function initVisits() {
        const el = $('#visitInfo');
        const raw = localStorage.getItem(STORAGE.VISITS);
        const prev = raw ? parseInt(raw, 10) || 0 : 0;
        const current = prev + 1;
        localStorage.setItem(STORAGE.VISITS, String(current));

        if (el) {
            const label = current === 1
                ? 'This is your first visit to this portfolio.'
                : `Welcome back! You have visited this portfolio ${current} times.`;
            el.textContent = label;
        }
    }

    $('#aiSuggestIntro')?.addEventListener('click', () => {
        const out = $('#aiIntroOutput'); if (!out) return;
        const suggestions = [
            'I build thoughtful, fast web apps focused on accessibility and craft.',
            'Frontend developer turning ideas into clear, resilient interfaces.',
            'Crafting usable, inclusive web experiences—one component at a time.'
        ];
        out.textContent = suggestions[Math.floor(Math.random() * suggestions.length)];
        out.classList.add('fade'); // CSS helper animation
    });

    function timeoutFetch(url, opts = {}, ms = 6000) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), ms);
        return fetch(url, { ...opts, signal: controller.signal }).finally(() => clearTimeout(id));
    }
    async function fetchDevFact() {
        const status = $('#factStatus'), out = $('#factText'), retry = $('#retryFact');
        if (!status || !out || !retry) return;
        status.hidden = false; out.textContent = ''; retry.hidden = true;

        const sources = [
            async () => {
                const res = await timeoutFetch('https://api.github.com/zen', { headers: { 'Accept': 'text/plain' } }, 6000);
                if (!res.ok) throw new Error('zen bad status');
                const text = await res.text();
                return `GitHub Zen: ${text}`;
            },
            async () => {
                const res = await timeoutFetch('https://api.quotable.io/random', {}, 6000);
                if (!res.ok) throw new Error('quotable bad status');
                const data = await res.json();
                return `Quote: ${data.content} — ${data.author || 'Unknown'}`;
            }
        ];
        const localFallbacks = [
            'Keep it simple and ship often.',
            'Small steps, steady progress.',
            'Make it work, then make it nice, then make it fast.',
            'Prefer clarity over cleverness.',
            'Accessibility first, polish second.'
        ];

        try {
            let text = null;
            for (const src of sources) { try { text = await src(); if (text) break; } catch {} }
            if (!text) text = localFallbacks[Math.floor(Math.random() * localFallbacks.length)];
            out.textContent = text;
        } catch {
            out.textContent = localFallbacks[0];
            retry.hidden = false;
        } finally {
            status.hidden = true;
            retry.hidden = false;
        }
    }
    $('#loadFact')?.addEventListener('click', fetchDevFact);
    $('#retryFact')?.addEventListener('click', fetchDevFact);

    const projectsData = [
        {
            id: 1,
            title: 'Social Media App Development',
            type: 'web',
            date: '2024-10-01',
            summary: 'Developed a social media app.',
            details: 'Built with JavaFX. Supports adding friends and posting.',
            image: 'assets/images/social-media.webp',
        },
        {
            id: 2,
            title: 'Parking System',
            type: 'hardware',
            date: '2025-02-01',
            summary: 'Implemented a parking system.',
            details: 'Using an FPGA board. Verilog language is used.',
            image: 'assets/images/fpga.webp',
        },
    ];

    function svgPlaceholder(label = 'Image') {
        const svg = encodeURIComponent(
            `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='450'>
        <defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'>
          <stop offset='0%' stop-color='#e5e7eb'/><stop offset='100%' stop-color='#cbd5e1'/>
        </linearGradient></defs>
        <rect width='100%' height='100%' fill='url(#g)'/>
        <g fill='#334155' font-family='Segoe UI, Arial' text-anchor='middle'>
          <text x='400' y='220' font-size='32'>${label}</text>
          <text x='400' y='260' font-size='14'>placeholder</text>
        </g>
      </svg>`
        );
        return `data:image/svg+xml;utf8,${svg}`;
    }

    function renderProjects(list) {
        const root = $('#projectsList'); if (!root) return;
        root.innerHTML = '';
        if (!list.length) { $('#emptyState')?.removeAttribute('hidden'); return; }
        $('#emptyState')?.setAttribute('hidden','');

        list.forEach(p => {
            const el = document.createElement('article');
            el.className = 'project appear visible';
            const detailsId = `details-${p.id}`;

            el.innerHTML = `
        <header><h3>${p.title}</h3><span class="tag">${p.type}</span></header>
        <small class="muted">Date: ${new Date(p.date).toLocaleDateString()}</small>
        <div class="image-slot"><img src="${p.image}" alt="${p.title}" loading="lazy" decoding="async"></div>
        <div class="details" id="${detailsId}" aria-hidden="true">
          <p class="muted">${p.summary}</p>
          <p>${p.details}</p>
        </div>
        <button class="btn btn-ghost toggle" data-id="${p.id}" aria-expanded="false" aria-controls="${detailsId}">
          More details
        </button>
      `;

            const img = el.querySelector('img');
            img.addEventListener('error', () => {
                img.src = svgPlaceholder(p.title);
                img.alt = `${p.title} (placeholder)`;
            });

            root.appendChild(el);
        });
    }

    function getFilteredSortedProjects() {
        const q = ($('#search')?.value || '').trim().toLowerCase();
        const f = $('#filter')?.value || 'all';
        const s = $('#sort')?.value || 'date-desc';

        let list = projectsData.filter(p => {
            const matchesText = !q
                || p.title.toLowerCase().includes(q)
                || (p.summary && p.summary.toLowerCase().includes(q));
            const matchesType = f === 'all' || p.type === f;
            return matchesText && matchesType;
        });

        list.sort((a, b) => {
            if (s === 'date-desc') return new Date(b.date) - new Date(a.date);
            if (s === 'date-asc')  return new Date(a.date) - new Date(b.date);
            if (s === 'title-asc') return a.title.localeCompare(b.title);
            if (s === 'title-desc')return b.title.localeCompare(a.title);
            return 0;
        });
        return list;
    }

    function updateProjectsUI() {
        const state = {
            search: $('#search')?.value || '',
            filter: $('#filter')?.value || 'all',
            sort: $('#sort')?.value || 'date-desc',
        };
        localStorage.setItem(STORAGE.PROJECT, JSON.stringify(state));
        renderProjects(getFilteredSortedProjects());
    }

    function initProjectControlsState() {
        const raw = localStorage.getItem(STORAGE.PROJECT);
        if (!raw) {
            updateProjectsUI();
            return;
        }
        try {
            const saved = JSON.parse(raw);
            if ($('#search') && typeof saved.search === 'string') $('#search').value = saved.search;
            if ($('#filter') && typeof saved.filter === 'string') $('#filter').value = saved.filter;
            if ($('#sort') && typeof saved.sort === 'string') $('#sort').value = saved.sort;
        } catch {
        }
        updateProjectsUI();
    }

    ['#search', '#filter', '#sort'].forEach(sel => $(sel)?.addEventListener('input', updateProjectsUI));

    $('#projectsList')?.addEventListener('click', (e) => {
        const btn = e.target.closest('.toggle'); if (!btn) return;
        const id = btn.dataset.id;
        const panel = document.getElementById(`details-${id}`);
        const open = !panel.classList.contains('open');
        panel.classList.toggle('open', open);
        panel.setAttribute('aria-hidden', String(!open));
        btn.setAttribute('aria-expanded', String(open));
        btn.textContent = open ? 'Hide details' : 'More details';
    });

    const form = $('#contactForm'), statusEl = $('#formStatus');
    if (form && statusEl) {
        const nameInput = $('#name'), emailInput = $('#email'), messageInput = $('#message');
        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        const counterEl = $('#messageCounter');
        if (messageInput && counterEl) {
            const maxLenAttr = messageInput.getAttribute('maxlength');
            const maxLen = maxLenAttr ? parseInt(maxLenAttr, 10) || 300 : 300;
            const updateCounterText = () => {
                const len = messageInput.value.length;
                counterEl.textContent = `${len} / ${maxLen} characters`;
            };
            messageInput.addEventListener('input', updateCounterText);
            updateCounterText();
        }

        function clearInvalid(){ [nameInput, emailInput, messageInput].forEach(e=>e?.classList.remove('is-invalid')); }

        form.addEventListener('submit', e => {
            e.preventDefault(); clearInvalid(); statusEl.hidden = true; statusEl.classList.remove('ok','error');
            const n = nameInput?.value.trim(), em = emailInput?.value.trim(), m = messageInput?.value.trim();

            if (!n){ nameInput.classList.add('is-invalid'); statusEl.textContent='Please enter your name.'; statusEl.classList.add('error'); statusEl.hidden=false; return; }
            if (!em){ emailInput.classList.add('is-invalid'); statusEl.textContent='Please enter your email.'; statusEl.classList.add('error'); statusEl.hidden=false; return; }
            if (!emailRe.test(em)){ emailInput.classList.add('is-invalid'); statusEl.textContent='Please enter a valid email address.'; statusEl.classList.add('error'); statusEl.hidden=false; return; }
            if (!m || m.length < 10){ messageInput.classList.add('is-invalid'); statusEl.textContent='Message must be at least 10 characters.'; statusEl.classList.add('error'); statusEl.hidden=false; return; }

            statusEl.textContent = '✅ Thanks! Your message was sent (demo).';
            statusEl.classList.add('ok');
            statusEl.hidden = false;

            form.reset();
            if (messageInput) {
                messageInput.dispatchEvent(new Event('input'));
            }
            statusEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
    }

    function initAppearAnimations() {
        const els = $$('.appear'); if (!els.length) return;
        if (!('IntersectionObserver' in window)) { els.forEach(el => el.classList.add('visible')); return; }
        const io = new IntersectionObserver((entries) => {
            entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
        }, { threshold: 0.1 });
        els.forEach(el => io.observe(el));
    }

    initTheme();
    updateGreeting();
    initAppearAnimations();
    initVisits();
    initProjectControlsState();
    $('#year') && ($('#year').textContent = new Date().getFullYear());
});

