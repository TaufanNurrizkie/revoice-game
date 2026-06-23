// client/js/quiz.js
// Mengatur popup soal: render pertanyaan + opsi, validasi jawaban, kirim hasil ke backend.

window.Quiz = (function () {
  const overlay = document.getElementById('quiz-overlay');
  const questionEl = document.getElementById('quiz-question');
  const optionsEl = document.getElementById('quiz-options');
  const feedbackEl = document.getElementById('quiz-feedback');

  let startTime = 0;
  let onDoneCallback = null;

  function open(soal, babakIndex, soalIndex) {
    questionEl.textContent = soal.teks;
    optionsEl.innerHTML = '';
    feedbackEl.textContent = '';
    startTime = performance.now();

    soal.opsi.forEach(function (opt) {
      const btn = document.createElement('button');
      btn.className = 'opt-btn';
      btn.textContent = opt;
      btn.addEventListener('click', function () {
        answer(soal, opt, btn, babakIndex, soalIndex);
      });
      optionsEl.appendChild(btn);
    });

    overlay.classList.add('show');
  }

  function answer(soal, chosen, btnEl, babakIndex, soalIndex) {
    const latency = Math.round(performance.now() - startTime);
    const allBtns = optionsEl.querySelectorAll('.opt-btn');
    allBtns.forEach(function (b) { b.disabled = true; });

    let isCorrect = true;
    if (soal.benar !== null && soal.benar !== undefined) {
      isCorrect = (chosen === soal.benar);
      if (isCorrect) {
        btnEl.classList.add('correct');
      } else {
        btnEl.classList.add('wrong');
        allBtns.forEach(function (b) {
          if (b.textContent === soal.benar) b.classList.add('correct');
        });
      }
    } else {
      btnEl.classList.add('correct');
    }

    feedbackEl.textContent = isCorrect
      ? 'Tercatat! (' + latency + ' ms)'
      : 'Kurang tepat. Jawaban benar: "' + soal.benar + '" (' + latency + ' ms)';

    // kirim hasil ke backend (sesuaikan endpoint di server/routes/responden.js)
    const sessionId = sessionStorage.getItem('revoice_sessionId');
    fetch('/api/responden/jawaban', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        babak: babakIndex,
        soalIndex,
        jawaban: chosen,
        benar: isCorrect,
        latencyMs: latency
      })
    }).catch(function (err) {
      console.warn('Gagal kirim jawaban ke server:', err.message);
    });

    setTimeout(function () {
      overlay.classList.remove('show');
      if (onDoneCallback) onDoneCallback(isCorrect);
    }, 900);
  }

  return {
    open,
    onDone: function (cb) { onDoneCallback = cb; }
  };
})();
