/* ===========================
   QUAD 3s ACCOUNT MENU (PROTOTYPE)
   Shows "Log In" or the signed-in student's menu in the nav.
   Reads the same browser-only demo account as the Student Portal.
   =========================== */
(function () {
    const STORE_KEY = 'q3_portal_demo_v1';
    const PORTAL = 'quad3s-course.html';

    function load() {
        try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; }
        catch (e) { return {}; }
    }
    function save(state) {
        try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
    }
    const esc = s => String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    const loginIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
    const chev = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';

    function render() {
        const slot = document.getElementById('navAccount');
        const mobileItem = document.getElementById('navLoginItem');
        if (!slot) return;
        const state = load();
        const u = state.user;

        if (!u) {
            slot.innerHTML = `<a href="${PORTAL}#login" class="nav-login">${loginIcon}Log In</a>`;
            if (mobileItem) mobileItem.innerHTML = `<a href="${PORTAL}#login">Student Log In</a>`;
            return;
        }

        const initials = ((u.first || '')[0] || '') + ((u.last || '')[0] || '');
        const hasCourse = (state.owned || []).includes('holdem');
        slot.innerHTML = `
            <div class="user-menu" id="siteUserMenu">
                <button class="user-chip" type="button" aria-haspopup="true" aria-expanded="false">
                    <span class="avatar">${esc(initials.toUpperCase() || 'Q3')}</span>
                    <span class="user-name">${esc(u.first)}</span>
                    ${chev}
                </button>
                <div class="user-dropdown">
                    <div class="user-dropdown-head">
                        <strong>${esc(u.first)} ${esc(u.last)}</strong>
                        <span>${esc(u.email)}</span>
                    </div>
                    <a href="${PORTAL}#dashboard">Dashboard</a>
                    <a href="${PORTAL}#${hasCourse ? 'lesson' : 'dashboard'}">${hasCourse ? 'My Course' : 'Browse Courses'}</a>
                    <button type="button" data-logout>Log Out</button>
                </div>
            </div>`;
        if (mobileItem) mobileItem.innerHTML = `<a href="${PORTAL}#dashboard">My Dashboard</a>`;

        const menu = slot.querySelector('.user-menu');
        const chip = slot.querySelector('.user-chip');
        chip.addEventListener('click', e => {
            e.stopPropagation();
            const open = menu.classList.toggle('open');
            chip.setAttribute('aria-expanded', open);
        });
        slot.querySelector('[data-logout]').addEventListener('click', () => {
            const s = load();
            s.user = null;
            save(s);
            render();
        });
    }

    document.addEventListener('click', () => {
        const m = document.getElementById('siteUserMenu');
        if (m) m.classList.remove('open');
    });
    // Keep the nav in sync if the student logs in or out in another tab
    window.addEventListener('storage', e => { if (e.key === STORE_KEY) render(); });
    document.addEventListener('DOMContentLoaded', render);
})();
