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
