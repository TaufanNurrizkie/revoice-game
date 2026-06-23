// client/js/hud.js
// Mengatur tampilan HUD (nyawa, skor, timer, babak).

window.HUD = (function () {
  const heartEl = document.getElementById('hud-heart-val');
  const starEl = document.getElementById('hud-star-val');
  const timerEl = document.getElementById('hud-timer-val');
  const babakEl = document.getElementById('hud-babak');

  let hearts = 3;
  let stars = 0;
  let startTime = performance.now();

  function setHearts(v) { hearts = v; heartEl.textContent = hearts; }
  function setStars(v) { stars = v; starEl.textContent = stars; }
  function setBabak(v) { babakEl.textContent = v; }
  function tickTimer() {
    timerEl.textContent = Math.floor((performance.now() - startTime) / 1000);
  }
  function resetTimer() { startTime = performance.now(); }

  return {
    setHearts, setStars, setBabak, tickTimer, resetTimer,
    getHearts: function () { return hearts; },
    getStars: function () { return stars; }
  };
})();
