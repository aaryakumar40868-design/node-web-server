// Copy button behavior
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.copy-btn');
  if (!btn) return;
  const text = btn.dataset.copy;
  navigator.clipboard?.writeText(text).then(() => {
    const prev = btn.textContent;
    btn.textContent = 'Copied';
    setTimeout(() => btn.textContent = prev, 1200);
  }).catch(() => {
    btn.textContent = 'Error';
    setTimeout(() => btn.textContent = 'Copy', 1200);
  });
});

// Keyboard focus states for accessibility
document.querySelectorAll('a, button').forEach(el => {
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') el.click();
  });
});
