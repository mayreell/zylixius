/* ===========================
   QUAD 3s STUDENT PORTAL (PROTOTYPE)
   Accounts, payments and progress are simulated
   and saved in this browser only (localStorage).
   =========================== */

document.addEventListener('DOMContentLoaded', () => {

    // ---------- Data ----------
    const STORE_KEY = 'q3_portal_demo_v1';

    const COURSES = {
        holdem: {
            suit: '♠',
            title: "Texas Hold'em",
            desc: 'The foundation of every dealing career. Positions, pitching, the board, and running the action, start to finish.',
            includes: ['4 video modules with Rey', 'Interactive table walkthroughs and quizzes', 'Weekly in-person skill check-ins', 'Practice audition when you\'re ready'],
            price: 100,
            grants: ['holdem'],
        },
        full: {
            suit: '♣',
            title: 'Full Curriculum',
            desc: "Hold'em, Omaha, and casino table games in one program. Graduate job-ready across multiple formats.",
            includes: ["Texas Hold'em course", 'Casino Table Games course', 'Weekly check-ins and practice auditions', 'Help landing real casino auditions'],
            price: 200,
            grants: ['holdem', 'tablegames', 'full'],
            featured: true,
        },
        tablegames: {
            suit: '♥',
            title: 'Casino Table Games',
            desc: 'Baccarat, Blackjack, and Three Card Poker. More games means more opportunities on the floor.',
            includes: ['Baccarat, Blackjack and Three Card Poker', 'Payout and procedure drills', 'Weekly in-person skill check-ins'],
            price: 100,
            grants: ['tablegames'],
        },
    };

    const LESSON_TITLES = ['The Table and the Button', 'Pitching the Hole Cards', 'Burn and Turn', 'Who Acts First'];

    const CHECK_EXPLAIN = {
        1: 'Correct. The small blind is one seat left of the button, and the big blind is next to it.',
        2: "Correct. Dealing starts at the small blind, so the button is always last.",
        3: 'Correct. Burn one before every street. It protects the game from a flashed top card.',
        4: 'Correct. The big blind already has a bet in, so they get the last word preflop.',
    };

    const QUIZ = [
        {
            q: 'Which player receives the first hole card?',
            opts: ['The button', 'The small blind', 'The big blind', 'Under the gun'],
            a: 1,
            why: 'The deal starts one seat left of the button, which is the small blind.',
        },
        {
            q: 'In a hand that reaches the river, how many cards are burned?',
            opts: ['1', '2', '3', '5'],
            a: 2,
            why: 'One burn before the flop, one before the turn, and one before the river.',
        },
        {
            q: 'Before the flop, who acts first?',
            opts: ['The small blind', 'The button', 'The player left of the big blind', 'The big blind'],
            a: 2,
            why: 'Under the gun, the seat left of the big blind, opens the action preflop.',
        },
        {
            q: 'On the turn, who acts first?',
            opts: ['First active player left of the button', 'The player left of the big blind', 'The button', 'Whoever bet last on the flop'],
            a: 0,
            why: 'After the flop, action always starts with the first active player left of the button.',
        },
        {
            q: 'Eight players are dealt in. How many hole cards should be out?',
            opts: ['8', '10', '16', '18'],
            a: 2,
            why: 'Players times two. Eight players means 16 hole cards.',
        },
    ];
    const PASS_MARK = 4;

    // ---------- State ----------
    const blank = () => ({ user: null, owned: [], lessonsDone: [], quizPassed: false, quizBest: null });

    function load() {
        try {
            const raw = localStorage.getItem(STORE_KEY);
            if (raw) return Object.assign(blank(), JSON.parse(raw));
        } catch (e) { /* storage blocked, run in memory */ }
        return blank();
    }

    function save() {
        try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
    }

    let state = load();

    const owns = id => state.owned.includes(id);
    const money = n => '$' + n.toLocaleString('en-US');
    const progressPct = () => Math.round(((state.lessonsDone.length + (state.quizPassed ? 1 : 0)) / 5) * 100);
    const $ = id => document.getElementById(id);

    // ---------- Toast ----------
    let toastTimer;
    function toast(msg) {
        const t = $('toast');
        t.textContent = msg;
        t.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
    }

    // ---------- Reveal on scroll ----------
    const revealObs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('in');
                revealObs.unobserve(e.target);
            }
        });
    }, { threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

    // ---------- Screens & routing ----------
    const SCREENS = ['auth', 'dashboard', 'checkout', 'lesson', 'soon'];

    function showScreen(name) {
        SCREENS.forEach(s => { $('screen-' + s).hidden = (s !== name); });
        document.querySelectorAll('[data-nav]').forEach(a => {
            a.classList.toggle('active', a.dataset.nav === name);
        });
        window.scrollTo(0, 0);
    }

    function go(hash) {
        if (location.hash.slice(1) === hash) route();
        else location.hash = hash;
    }

    function route() {
        const [name, arg] = location.hash.slice(1).split('/');
        updateNav();

        if (!state.user) {
            showAuth(name === 'signup' ? 'signup' : 'login');
            return;
        }

        switch (name) {
            case 'checkout':
                if (!COURSES[arg]) return go('dashboard');
                if (owns(arg)) return go(arg === 'tablegames' ? 'soon' : 'lesson');
                return showCheckout(arg);
            case 'lesson':
                if (!owns('holdem')) return go('checkout/holdem');
                return showLesson();
            case 'soon':
                if (!owns('tablegames')) return go('checkout/tablegames');
                return showScreen('soon');
            case 'dashboard':
                return showDashboard();
            default:
                return go('dashboard');
        }
    }

    window.addEventListener('hashchange', route);

    // ---------- Nav / user menu ----------
    const userMenu = $('userMenu');
    const portalLinks = $('portalLinks');

    function updateNav() {
        const u = state.user;
        userMenu.classList.toggle('hidden', !u);
        portalLinks.classList.toggle('hidden', !u);
        if (u) {
            $('userInitials').textContent = ((u.first[0] || '') + (u.last[0] || '')).toUpperCase() || 'Q3';
            $('userName').textContent = u.first;
        }
    }

    $('userChip').addEventListener('click', e => {
        e.stopPropagation();
        const open = userMenu.classList.toggle('open');
        $('userChip').setAttribute('aria-expanded', open);
    });
    document.addEventListener('click', () => userMenu.classList.remove('open'));

    $('logoutBtn').addEventListener('click', () => {
        state.user = null;
        save();
        userMenu.classList.remove('open');
        toast('Logged out. See you at the table.');
        go('login');
    });

    $('resetDemo').addEventListener('click', () => {
        state = blank();
        save();
        resetLessonUI();
        toast('Demo reset. Start fresh.');
        go('signup');
    });

    // ---------- Form helpers ----------
    function setError(id, msg) {
        const input = $(id);
        const err = $(id + 'Error');
        if (input) input.classList.toggle('error', !!msg);
        if (err) err.textContent = msg || '';
    }
    const validEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

    // ---------- AUTH ----------
    function showAuth(tab) {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
        $('loginForm').classList.toggle('hidden', tab !== 'login');
        $('signupForm').classList.toggle('hidden', tab !== 'signup');
        showScreen('auth');
    }

    document.querySelectorAll('.auth-tab').forEach(t => {
        t.addEventListener('click', () => { location.hash = t.dataset.tab; });
    });

    $('loginForm').addEventListener('submit', e => {
        e.preventDefault();
        const email = $('loginEmail').value.trim();
        const pw = $('loginPassword').value;
        let ok = true;
        setError('loginEmail', !email ? 'Email is required.' : !validEmail(email) ? 'Enter a valid email.' : '');
        setError('loginPassword', !pw ? 'Password is required.' : '');
        if (!email || !validEmail(email) || !pw) ok = false;
        if (!ok) return;

        // Prototype: accept anything. Keep the saved name if it's the same email.
        if (!state.user || state.user.email !== email) {
            const prefix = email.split('@')[0].replace(/[^a-zA-Z]/g, ' ').trim().split(' ')[0] || 'Student';
            const prev = state._lastUser && state._lastUser.email === email ? state._lastUser : null;
            state.user = prev || { first: prefix.charAt(0).toUpperCase() + prefix.slice(1), last: '', email };
        }
        save();
        toast('Welcome back, ' + state.user.first + '!');
        go('dashboard');
    });

    $('signupForm').addEventListener('submit', e => {
        e.preventDefault();
        const first = $('suFirst').value.trim();
        const last = $('suLast').value.trim();
        const email = $('suEmail').value.trim();
        const pw = $('suPassword').value;
        setError('suFirst', first ? '' : 'First name is required.');
        setError('suLast', last ? '' : 'Last name is required.');
        setError('suEmail', !email ? 'Email is required.' : !validEmail(email) ? 'Enter a valid email.' : '');
        setError('suPassword', pw.length < 8 ? 'Use at least 8 characters.' : '');
        if (!first || !last || !validEmail(email) || pw.length < 8) return;

        state.user = { first, last, email };
        state._lastUser = state.user;
        save();
        toast('Account created. Welcome to Quad 3s, ' + first + '!');
        go('dashboard');
    });

    ['loginEmail', 'loginPassword', 'suFirst', 'suLast', 'suEmail', 'suPassword', 'payName', 'payCard'].forEach(id => {
        const el = $(id);
        if (el) el.addEventListener('input', () => setError(id, ''));
    });

    // ---------- DASHBOARD ----------
    function showDashboard() {
        const u = state.user;
        $('dashName').textContent = u.first;
        $('dashHello').textContent = state.owned.length ? 'Welcome back, ' : 'Welcome, ';
        const pct = progressPct();
        const done = state.lessonsDone.length;

        // Continue card
        const cc = $('continueCard');
        if (owns('holdem')) {
            let next;
            if (done < 4) {
                const n = [1, 2, 3, 4].find(i => !state.lessonsDone.includes(i));
                next = 'Next up: Lesson ' + n + ', ' + LESSON_TITLES[n - 1];
            } else if (!state.quizPassed) {
                next = 'Next up: the Module 1 Quiz';
            } else {
                next = 'Module 1 complete. Module 2 is unlocked.';
            }
            cc.innerHTML = `
                <div>
                    <span class="cc-label">Continue Learning · Texas Hold'em</span>
                    <h3>Module 1: Hold'em Fundamentals</h3>
                    <p>${next}</p>
                    <div class="progress-track"><div class="progress-fill" style="width:0"></div></div>
                    <span class="cc-pct">${pct}% complete</span>
                </div>
                <a href="#lesson" class="btn btn-primary">${pct === 0 ? 'Start Lesson' : 'Resume'}</a>`;
            requestAnimationFrame(() => requestAnimationFrame(() => {
                cc.querySelector('.progress-fill').style.width = pct + '%';
            }));
            $('dashSub').textContent = 'Pick up where you left off.';
        } else {
            cc.innerHTML = `
                <div>
                    <span class="cc-label">Get Started</span>
                    <h3>Start Your Dealing Career</h3>
                    <p>Unlock Texas Hold'em to begin Module 1. Lessons, table demos, and quizzes are ready when you are.</p>
                </div>
                <a href="#checkout/holdem" class="btn btn-primary">Unlock Hold'em</a>`;
            $('dashSub').textContent = 'Your account is ready. Choose a course to begin.';
        }

        // Stats
        $('statLessons').textContent = done + '/4';
        $('statQuiz').textContent = state.quizPassed ? 'Passed' : (done === 4 ? 'Ready' : 'Locked');
        const mods = owns('holdem') ? (state.quizPassed ? 2 : 1) : 0;
        $('statModules').textContent = mods + '/4';

        // Courses
        $('dashCourses').innerHTML = ['holdem', 'full', 'tablegames'].map(id => {
            const c = COURSES[id];
            const have = owns(id);
            const href = have ? (id === 'tablegames' ? '#soon' : '#lesson') : '#checkout/' + id;
            return `
                <div class="dc-card${c.featured ? ' featured' : ''}">
                    <span class="dc-status ${have ? 'owned' : 'locked'}">${have ? 'Enrolled' : 'Locked'}</span>
                    <span class="course-suit">${c.suit}</span>
                    <h3>${c.title}</h3>
                    <p>${c.desc}</p>
                    ${have ? '' : `<span class="dc-price">${money(c.price)} <span>one-time</span></span>`}
                    <a href="${href}" class="btn ${have ? 'btn-primary' : 'btn-outline'}">${have ? 'Go to Course' : 'Unlock Course'}</a>
                </div>`;
        }).join('');

        showScreen('dashboard');
    }

    // ---------- CHECKOUT ----------
    let checkoutId = null;

    function showCheckout(id) {
        checkoutId = id;
        const c = COURSES[id];
        $('coSuit').textContent = c.suit;
        $('coTitle').textContent = c.title;
        $('coDesc').textContent = c.desc;
        $('coIncludes').innerHTML = c.includes.map(i =>
            `<li><svg viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>${i}</li>`
        ).join('');
        $('coFull').textContent = money(c.price);
        $('payName').value = state.user ? (state.user.first + ' ' + state.user.last).trim() : '';
        setError('payName', '');
        setError('payCard', '');
        $('payForm').classList.remove('hidden');
        $('paySuccess').classList.add('hidden');
        $('payBtn').classList.remove('is-loading');
        updateDue();
        showScreen('checkout');
    }

    function updateDue() {
        const c = COURSES[checkoutId];
        if (!c) return;
        const due = c.price;
        $('coDue').textContent = money(due);
        $('payBtn').querySelector('.btn-text').textContent = 'Pay ' + money(due);
    }

    $('payCard').addEventListener('input', e => {
        const digits = e.target.value.replace(/\D/g, '').slice(0, 16);
        e.target.value = digits.replace(/(.{4})/g, '$1 ').trim();
    });

    $('payForm').addEventListener('submit', e => {
        e.preventDefault();
        const name = $('payName').value.trim();
        const digits = $('payCard').value.replace(/\D/g, '');
        setError('payName', name ? '' : 'Name on card is required.');
        setError('payCard', digits.length >= 15 ? '' : 'Enter a full card number.');
        if (!name || digits.length < 15) return;

        $('payBtn').classList.add('is-loading');
        // Fake processing delay. Nothing leaves the page.
        setTimeout(() => {
            const c = COURSES[checkoutId];
            c.grants.forEach(g => { if (!owns(g)) state.owned.push(g); });
            save();
            $('payForm').classList.add('hidden');
            $('paySuccess').classList.remove('hidden');
            const toSoon = checkoutId === 'tablegames';
            $('paySuccessMsg').textContent = c.title + ' is unlocked on your account.' + (toSoon ? '' : " Let's deal your first hand.");
            $('paySuccessBtn').textContent = toSoon ? 'Open Course' : 'Start Module 1';
            $('paySuccessBtn').setAttribute('href', toSoon ? '#soon' : '#lesson');
            toast('Payment complete (demo). Course unlocked!');
        }, 1400);
    });

    // ---------- LESSON ----------
    let demosBuilt = false;

    function showLesson() {
        showScreen('lesson');
        if (!demosBuilt) { buildDemos(); demosBuilt = true; }
        renderProgress();
        renderQuiz();
    }

    function renderProgress() {
        const pct = progressPct();
        $('outlineFill').style.width = pct + '%';
        $('outlinePct').textContent = pct + '%';

        [1, 2, 3, 4].forEach(n => {
            const done = state.lessonsDone.includes(n);
            document.querySelector(`.lesson-block[data-lesson="${n}"]`).classList.toggle('is-done', done);
            document.querySelector(`[data-outline="${n}"]`).classList.toggle('done', done);
            const check = document.querySelector(`.check[data-check="${n}"]`);
            if (done && !check.dataset.answered) showCheckSolved(check, n);
        });

        const allDone = state.lessonsDone.length === 4;
        const quizLink = document.querySelector('[data-outline="quiz"]');
        quizLink.classList.toggle('locked', !allDone);
        quizLink.classList.toggle('done', state.quizPassed);
        $('quiz').classList.toggle('unlocked', allDone);
        const left = 4 - state.lessonsDone.length;
        $('quizLockMsg').textContent = left > 0
            ? `Answer the Quick Check in ${left === 4 ? 'all 4 lessons' : left + ' more lesson' + (left > 1 ? 's' : '')} to unlock the module quiz.`
            : '';

        const passed = state.quizPassed;
        $('mod2Outline').classList.toggle('locked', !passed);
        $('mod2Outline').classList.toggle('unlocked-now', passed);
        $('mod2Msg').textContent = passed ? 'Unlocked · lessons coming soon' : 'Pass the Module 1 quiz to unlock';
        $('nextModule').classList.toggle('open', passed);
        $('nextMsg').textContent = passed ? 'Unlocked! New lessons are being filmed now.' : 'Locked until you pass the Module 1 quiz.';
        $('nextLock').innerHTML = passed
            ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>'
            : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
    }

    function markLessonDone(n) {
        if (state.lessonsDone.includes(n)) return;
        const wasLocked = state.lessonsDone.length < 4;
        state.lessonsDone.push(n);
        save();
        renderProgress();
        if (wasLocked && state.lessonsDone.length === 4) toast('All lessons done. The quiz is unlocked!');
        else toast('Lesson ' + n + ' complete!');
    }

    // Quick checks
    function showCheckSolved(check, n) {
        check.dataset.answered = '1';
        check.querySelectorAll('.check-opts button').forEach(b => {
            b.disabled = true;
            b.classList.toggle('right', b.dataset.opt === check.dataset.correct);
        });
        const fb = check.querySelector('.check-feedback');
        fb.textContent = CHECK_EXPLAIN[n];
        fb.className = 'check-feedback ok';
    }

    document.querySelectorAll('.check').forEach(check => {
        const n = Number(check.dataset.check);
        check.querySelectorAll('.check-opts button').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.dataset.opt === check.dataset.correct) {
                    showCheckSolved(check, n);
                    markLessonDone(n);
                } else {
                    btn.classList.add('wrong');
                    btn.disabled = true;
                    const fb = check.querySelector('.check-feedback');
                    fb.textContent = 'Not quite. Look back at the table above and try again.';
                    fb.className = 'check-feedback no';
                }
            });
        });
    });

    function resetLessonUI() {
        document.querySelectorAll('.check').forEach(check => {
            delete check.dataset.answered;
            check.querySelectorAll('.check-opts button').forEach(b => { b.disabled = false; b.className = ''; });
            const fb = check.querySelector('.check-feedback');
            fb.textContent = '';
            fb.className = 'check-feedback';
        });
    }

    // Outline links scroll within the page (no hash change)
    document.querySelectorAll('.outline-items a, .lesson-crumbs a[href^="#l"]').forEach(a => {
        a.addEventListener('click', e => {
            const target = document.querySelector(a.getAttribute('href'));
            if (!target) return;
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    // Highlight current lesson in outline
    const currentObs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (!e.isIntersecting) return;
            const key = e.target.dataset.lesson || 'quiz';
            document.querySelectorAll('[data-outline]').forEach(a => a.classList.toggle('current', a.dataset.outline === key));
        });
    }, { rootMargin: '-40% 0px -55% 0px' });
    document.querySelectorAll('.lesson-block, #quiz').forEach(el => currentObs.observe(el));

    // Course outline collapses on small screens so the lesson comes first
    const outline = $('outline');
    const smallScreen = window.matchMedia('(max-width: 1000px)');
    if (smallScreen.matches) outline.classList.add('collapsed');
    $('outlineHead').addEventListener('click', () => {
        if (smallScreen.matches) outline.classList.toggle('collapsed');
    });

    // Video placeholder
    $('videoPlay').addEventListener('click', () => {
        $('videoShell').classList.add('poked');
        toast("Video placeholder. Rey's Module 1 video will play here.");
    });

    // ---------- QUIZ ----------
    function renderQuiz(forceFresh) {
        const form = $('quizForm');
        const result = $('quizResult');

        if (state.quizPassed && !forceFresh) {
            form.innerHTML = '';
            showQuizResult(state.quizBest, true, false);
            return;
        }

        result.classList.add('hidden');
        form.innerHTML = QUIZ.map((item, i) => `
            <div class="quiz-q" data-q="${i}">
                <span class="quiz-q-num">Question ${i + 1} of ${QUIZ.length}</span>
                <h4>${item.q}</h4>
                <div class="quiz-opts">
                    ${item.opts.map((o, j) => `
                        <label class="quiz-opt">
                            <input type="radio" name="q${i}" value="${j}">
                            <span>${o}</span>
                        </label>`).join('')}
                </div>
            </div>`).join('') +
            `<button type="submit" class="btn btn-primary quiz-submit" id="quizSubmit" disabled>Submit Answers</button>`;

        form.querySelectorAll('input').forEach(inp => inp.addEventListener('change', () => {
            const answered = QUIZ.every((_, i) => form.querySelector(`input[name="q${i}"]:checked`));
            $('quizSubmit').disabled = !answered;
        }));
    }

    $('quizForm').addEventListener('submit', e => {
        e.preventDefault();
        const form = $('quizForm');
        let score = 0;

        QUIZ.forEach((item, i) => {
            const picked = Number(form.querySelector(`input[name="q${i}"]:checked`).value);
            const box = form.querySelector(`[data-q="${i}"]`);
            const right = picked === item.a;
            if (right) score++;
            box.classList.add(right ? 'right' : 'wrong');
            box.querySelectorAll('.quiz-opt').forEach((lab, j) => {
                lab.querySelector('input').disabled = true;
                if (j === item.a) lab.classList.add('is-correct');
                else if (j === picked) lab.classList.add('is-wrong');
            });
            const ex = document.createElement('p');
            ex.className = 'quiz-explain';
            ex.textContent = (right ? '✓ ' : '✗ ') + item.why;
            box.appendChild(ex);
        });
        $('quizSubmit').remove();

        const passed = score >= PASS_MARK;
        state.quizBest = Math.max(state.quizBest || 0, score);
        if (passed && !state.quizPassed) {
            state.quizPassed = true;
            save();
            renderProgress();
            chipBurst();
            toast('Module 2 unlocked!');
        } else {
            save();
        }
        showQuizResult(score, passed, true);
    });

    function showQuizResult(score, passed, fresh) {
        const result = $('quizResult');
        result.className = 'quiz-result ' + (passed ? 'pass' : 'fail');
        result.innerHTML = passed
            ? `<div class="quiz-score">${score}/${QUIZ.length}</div>
               <h3>${fresh ? 'You Passed!' : 'Quiz Passed'}</h3>
               <p>Module 2: Pot Management &amp; Chip Handling is now unlocked.</p>
               <button class="btn btn-outline-light" id="quizRetake" type="button">Retake for Practice</button>`
            : `<div class="quiz-score">${score}/${QUIZ.length}</div>
               <h3>Almost There</h3>
               <p>You need ${PASS_MARK} out of ${QUIZ.length} to move on. Review the explanations above, then try again.</p>
               <button class="btn btn-primary" id="quizRetake" type="button">Retake Quiz</button>`;
        $('quizRetake').addEventListener('click', () => {
            renderQuiz(true);
            $('quiz').scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    function chipBurst() {
        const host = $('quiz');
        const colors = ['#c9a84c', '#c0392b', '#2e6fd1', '#ffffff', '#1a6b4c'];
        const rect = host.getBoundingClientRect();
        for (let i = 0; i < 26; i++) {
            const chip = document.createElement('span');
            chip.className = 'chip-burst';
            chip.style.background = colors[i % colors.length];
            chip.style.left = (rect.width / 2) + 'px';
            chip.style.top = (rect.height - 120) + 'px';
            const ang = Math.random() * Math.PI * 2;
            const dist = 120 + Math.random() * 220;
            chip.style.setProperty('--dx', Math.cos(ang) * dist + 'px');
            chip.style.setProperty('--dy', Math.sin(ang) * dist - 80 + 'px');
            chip.style.animationDelay = (Math.random() * 0.15) + 's';
            host.appendChild(chip);
            setTimeout(() => chip.remove(), 1500);
        }
    }

    // ============================================================
    //   ANIMATED TABLE DEMOS
    // ============================================================

    // Seat angles in degrees (screen coords, y down). Seat 1 sits on the
    // dealer's left and seats run clockwise. Dealer is at the bottom.
    const ANG = [150, 198, 246, 294, 342, 30];
    const BTN = 0; // button on seat 1 for the fixed demos

    const polar = (i, rx, ry, offset = 0) => {
        const a = (ANG[i] + offset) * Math.PI / 180;
        return { x: 50 + rx * Math.cos(a), y: 50 + ry * Math.sin(a) };
    };
    const DECK = { x: 50, y: 79 };
    const later = (list, fn, ms) => list.push(setTimeout(fn, ms));
    const clearAll = list => { list.forEach(clearTimeout); list.length = 0; };

    function place(el, pos) {
        el.style.left = pos.x + '%';
        el.style.top = pos.y + '%';
    }

    function buildTable(wrap) {
        wrap.innerHTML = '<div class="felt"><span class="felt-mark">Quad 3s</span></div><div class="dealer-spot">Dealer</div>';
        const seats = ANG.map((_, i) => {
            const s = document.createElement('div');
            const pos = polar(i, 42.5, 40.5);
            s.className = 'seat' + (pos.y < 45 ? ' top' : '');
            s.innerHTML = `${i + 1}<span class="seat-tag"></span><span class="seat-order"></span>`;
            place(s, pos);
            wrap.appendChild(s);
            return s;
        });
        return {
            wrap,
            seats,
            tag(i, text) {
                const t = seats[i].querySelector('.seat-tag');
                t.textContent = text;
                t.classList.toggle('show', !!text);
            },
            clearTags() { seats.forEach((_, i) => this.tag(i, '')); },
            hot(i, on) { seats[i].classList.toggle('hot', on); },
        };
    }

    function standardTags(t, b) {
        t.clearTags();
        t.tag(b, 'BTN');
        t.tag((b + 1) % 6, 'SB');
        t.tag((b + 2) % 6, 'BB');
        t.tag((b + 3) % 6, 'UTG');
    }

    function addChip(wrap, cls, text) {
        const c = document.createElement('div');
        c.className = cls;
        if (text) c.textContent = text;
        wrap.appendChild(c);
        return c;
    }

    function makeCard(face, extra) {
        const c = document.createElement('div');
        c.className = 'pcard' + (extra ? ' ' + extra : '');
        const red = face && /[♥♦]/.test(face);
        const faceHtml = face ? `${face.slice(0, -1)}<small>${face.slice(-1)}</small>` : '';
        c.innerHTML = `<div class="pcard-inner"><div class="pcard-back"></div><div class="pcard-front${red ? ' red' : ''}">${faceHtml}</div></div>`;
        return c;
    }

    function fly(wrap, card, from, to, rot) {
        place(card, from);
        card.style.setProperty('--rot', '0deg');
        wrap.appendChild(card);
        card.getBoundingClientRect(); // commit start position
        requestAnimationFrame(() => {
            place(card, to);
            card.style.setProperty('--rot', (rot || 0) + 'deg');
        });
        return card;
    }

    function holeCardPos(seat, which) {
        return { pos: polar(seat, 29, 26, which ? 5 : -5), rot: ANG[seat] - 90 + (which ? 6 : -6) };
    }

    function staticHoleCards(t) {
        for (let s = 0; s < 6; s++) {
            [0, 1].forEach(r => {
                const { pos, rot } = holeCardPos(s, r);
                const c = makeCard();
                place(c, pos);
                c.style.setProperty('--rot', rot + 'deg');
                t.wrap.appendChild(c);
            });
        }
    }

    function addDeck(wrap) {
        const d = document.createElement('div');
        d.className = 'deck';
        place(d, DECK);
        wrap.appendChild(d);
    }

    function buildDemos() {
        buildPositionsDemo();
        buildDealDemo();
        buildBoardDemo();
        buildActionDemo();
    }

    // --- Lesson 1: positions ---
    function buildPositionsDemo() {
        const t = buildTable(document.querySelector('[data-demo="positions"]'));
        const btn = addChip(t.wrap, 'd-button', 'D');
        const sb = addChip(t.wrap, 'blind-chip sb');
        const bb = addChip(t.wrap, 'blind-chip bb');
        let b = 0;
        let hand = 1;

        function draw() {
            standardTags(t, b);
            place(btn, polar(b, 27, 24, 12));
            place(sb, polar((b + 1) % 6, 27, 24, -4));
            place(bb, polar((b + 2) % 6, 27, 24, -4));
            $('posStatus').textContent = `Hand ${hand} · Button on seat ${b + 1}`;
        }
        draw();

        $('moveBtn').addEventListener('click', () => {
            b = (b + 1) % 6;
            hand++;
            draw();
            t.hot(b, true);
            setTimeout(() => t.hot(b, false), 700);
        });
    }

    // --- Lesson 2: pitching hole cards ---
    function buildDealDemo() {
        const t = buildTable(document.querySelector('[data-demo="deal"]'));
        standardTags(t, BTN);
        place(addChip(t.wrap, 'd-button', 'D'), polar(BTN, 27, 24, 12));
        addDeck(t.wrap);

        const timers = [];
        let dealt = false;
        let cards = [];
        const btn = $('dealBtn');
        const status = $('dealStatus');

        btn.addEventListener('click', () => {
            if (dealt) {
                clearAll(timers);
                cards.forEach(c => c.remove());
                cards = [];
                dealt = false;
                btn.textContent = 'Deal Hole Cards';
                status.textContent = 'Ready to deal';
                return;
            }
            btn.disabled = true;
            let count = 0;
            for (let r = 0; r < 2; r++) {
                for (let k = 1; k <= 6; k++) {
                    const seat = (BTN + k) % 6;
                    const step = r * 6 + (k - 1);
                    later(timers, () => {
                        const { pos, rot } = holeCardPos(seat, r);
                        cards.push(fly(t.wrap, makeCard(), DECK, pos, rot));
                        count++;
                        t.hot(seat, true);
                        setTimeout(() => t.hot(seat, false), 260);
                        const label = seat === (BTN + 1) % 6 ? ' (small blind)' : seat === BTN ? ' (button)' : '';
                        status.textContent = `Card ${count} of 12 · Seat ${seat + 1}${label}`;
                    }, step * 260);
                }
            }
            later(timers, () => {
                status.textContent = '12 cards out. The button got the last one.';
                btn.textContent = 'Reset Deal';
                btn.disabled = false;
                dealt = true;
            }, 12 * 260 + 400);
        });
    }

    // --- Lesson 3: burn and turn ---
    function buildBoardDemo() {
        const t = buildTable(document.querySelector('[data-demo="board"]'));
        standardTags(t, BTN);
        place(addChip(t.wrap, 'd-button', 'D'), polar(BTN, 27, 24, 12));
        staticHoleCards(t);
        addDeck(t.wrap);

        const BURN = { x: 38, y: 77 };
        const burnLabel = document.createElement('span');
        burnLabel.className = 'burn-label';
        burnLabel.textContent = 'Burn';
        place(burnLabel, { x: BURN.x, y: BURN.y + 6 });
        t.wrap.appendChild(burnLabel);

        const slots = [0, 1, 2, 3, 4].map(i => ({ x: 50 + (i - 2) * 8.6, y: 47 }));
        slots.forEach(p => {
            const s = document.createElement('div');
            s.className = 'slot';
            place(s, p);
            t.wrap.appendChild(s);
        });

        const FACES = ['K♥', '7♣', '2♦', 'J♠', '9♥'];
        const STREETS = [
            { name: 'Flop', cards: [0, 1, 2], next: 'Burn & Deal Turn' },
            { name: 'Turn', cards: [3], next: 'Burn & Deal River' },
            { name: 'River', cards: [4], next: 'Reset Board' },
        ];
        const timers = [];
        let street = 0;
        let burns = 0;
        let placed = [];
        const btn = $('streetBtn');
        const status = $('boardStatus');
        const pills = $('streetPills').children;

        const setPills = () => [...pills].forEach((p, i) => {
            p.classList.toggle('active', i === street);
            p.classList.toggle('past', i < street);
        });
        const boardCount = () => [0, 3, 4, 5][street];
        const setStatus = () => { status.textContent = `Burned: ${burns} · Board: ${boardCount()} card${boardCount() === 1 ? '' : 's'}`; };

        btn.addEventListener('click', () => {
            if (street === 3) {
                clearAll(timers);
                placed.forEach(c => c.remove());
                placed = [];
                street = 0;
                burns = 0;
                btn.textContent = 'Burn & Deal Flop';
                setPills();
                setStatus();
                return;
            }
            btn.disabled = true;
            const s = STREETS[street];

            // 1. Burn one, face down
            const burnPos = { x: BURN.x + burns * 0.8, y: BURN.y - burns * 0.6 };
            placed.push(fly(t.wrap, makeCard(), DECK, burnPos, -8 + burns * 7));
            burns++;
            status.textContent = 'Burn one...';

            // 2. Deal the street, then flip
            s.cards.forEach((ci, k) => {
                later(timers, () => {
                    const c = fly(t.wrap, makeCard(FACES[ci], 'board'), DECK, slots[ci], 0);
                    placed.push(c);
                    later(timers, () => c.classList.add('face-up'), 520);
                }, 600 + k * 170);
            });

            later(timers, () => {
                street++;
                setPills();
                setStatus();
                btn.textContent = s.next;
                btn.disabled = false;
            }, 600 + s.cards.length * 170 + 600);
        });

        setPills();
        setStatus();
    }

    // --- Lesson 4: action order ---
    function buildActionDemo() {
        const t = buildTable(document.querySelector('[data-demo="action"]'));
        standardTags(t, BTN);
        place(addChip(t.wrap, 'd-button', 'D'), polar(BTN, 27, 24, 12));
        staticHoleCards(t);
        const glow = addChip(t.wrap, 'action-glow');
        place(glow, polar(0, 42.5, 40.5));

        const timers = [];
        let mode = 'pre';
        const btn = $('actionBtn');
        const status = $('actionStatus');
        const seg = $('actionSeg');

        const order = () => {
            const start = mode === 'pre' ? 3 : 1; // UTG preflop, SB after the flop
            return [0, 1, 2, 3, 4, 5].map(k => (BTN + start + k) % 6);
        };

        function reset() {
            clearAll(timers);
            glow.classList.remove('show');
            t.seats.forEach((s, i) => {
                t.hot(i, false);
                s.querySelector('.seat-order').classList.remove('show');
            });
            btn.disabled = false;
            status.textContent = mode === 'pre' ? 'Preflop order' : 'Flop, turn and river order';
        }

        seg.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
            seg.querySelectorAll('button').forEach(x => x.classList.toggle('active', x === b));
            mode = b.dataset.mode;
            reset();
        }));

        btn.addEventListener('click', () => {
            reset();
            btn.disabled = true;
            const seq = order();
            seq.forEach((seat, i) => {
                later(timers, () => {
                    if (i > 0) t.hot(seq[i - 1], false);
                    glow.classList.add('show');
                    place(glow, polar(seat, 42.5, 40.5));
                    t.hot(seat, true);
                    const badge = t.seats[seat].querySelector('.seat-order');
                    badge.textContent = i + 1;
                    badge.classList.add('show');
                    const tag = t.seats[seat].querySelector('.seat-tag').textContent;
                    status.textContent = `${i + 1}. Seat ${seat + 1}${tag ? ' (' + tag + ')' : ''}${i === 0 ? ' acts first' : i === 5 ? ' acts last' : ''}`;
                }, i * 650);
            });
            later(timers, () => {
                t.hot(seq[5], false);
                glow.classList.remove('show');
                status.textContent = mode === 'pre'
                    ? 'UTG acts first. The big blind acts last.'
                    : 'Small blind acts first. The button acts last.';
                btn.disabled = false;
            }, 6 * 650 + 300);
        });
    }

    // ---------- Boot ----------
    if (!location.hash) location.hash = state.user ? 'dashboard' : 'signup';
    route();
});
