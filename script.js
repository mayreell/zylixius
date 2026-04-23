// ── GitHub Projects ──────────────────────────────────────────────
const LANG_COLORS = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python:     '#3572A5',
  HTML:       '#e34c26',
  CSS:        '#563d7c',
  Java:       '#b07219',
  Lua:        '#000080',
  Shell:      '#89e051',
};

async function loadProjects() {
  const grid = document.getElementById('projects-grid');
  try {
    const res = await fetch(
      'https://api.github.com/users/mayreell/repos?sort=updated&per_page=6'
    );
    if (!res.ok) throw new Error('fetch failed');
    const repos = await res.json();

    const filtered = repos.filter((r) => !r.fork).slice(0, 6);
    if (!filtered.length) throw new Error('no repos');

    grid.innerHTML = filtered.map((r) => {
      const color = LANG_COLORS[r.language] || '#666';
      const lang  = r.language || '';
      const desc  = r.description || 'no description yet lol';
      const stars = r.stargazers_count;
      return `
        <a class="proj-card" href="${r.html_url}" target="_blank" rel="noopener">
          <div class="proj-header">
            <span class="proj-icon">⬡</span>
            <span class="proj-name">${r.name}</span>
          </div>
          <p class="proj-desc">${desc}</p>
          <div class="proj-footer">
            ${lang ? `<span class="proj-lang"><span class="lang-dot" style="background:${color}"></span>${lang}</span>` : ''}
            ${stars ? `<span class="proj-stars">★ ${stars}</span>` : ''}
          </div>
        </a>`;
    }).join('');
  } catch {
    grid.innerHTML = `<p style="color:var(--muted);font-size:0.78rem;">couldn't load repos rn. check back later ig.</p>`;
  }
}

loadProjects();


const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

document.querySelectorAll('section').forEach((el) => {
  el.classList.add('fade-section');
  observer.observe(el);
});

// ── Inject scroll fade styles ───────────────────────────────────
const style = document.createElement('style');
style.textContent = `
  .fade-section {
    opacity: 0;
    transform: translateY(24px);
    transition: opacity 0.6s ease, transform 0.6s ease;
  }
  .fade-section.visible {
    opacity: 1;
    transform: translateY(0);
  }
`;
document.head.appendChild(style);

// ── Active nav highlight ────────────────────────────────────────
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('nav a');

window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach((s) => {
    if (window.scrollY >= s.offsetTop - 120) current = s.getAttribute('id');
  });
  navLinks.forEach((a) => {
    a.style.color = a.getAttribute('href') === `#${current}` ? 'var(--green-lt)' : '';
  });
});
