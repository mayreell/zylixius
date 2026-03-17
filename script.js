// ── Fade-in on scroll ───────────────────────────────────────────
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
