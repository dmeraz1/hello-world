document.documentElement.classList.add('js');

document.getElementById('year').textContent = new Date().getFullYear();

// Fade sections in as they scroll into view
const sections = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  sections.forEach((s) => io.observe(s));
} else {
  sections.forEach((s) => s.classList.add('in'));
}

// Brass scroll-progress bar
const bar = document.querySelector('.progress span');
const updateProgress = () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  bar.style.width = (max > 0 ? (scrollY / max) * 100 : 0) + '%';
};
addEventListener('scroll', updateProgress, { passive: true });
updateProgress();
