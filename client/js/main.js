// client/js/main.js
// Entry point: game loop, input, dan menghubungkan semua module
// (Maze, PlayerModule, HUD, Babak1, Babak2, SocketClient).

(function () {
  // Redirect ke halaman identitas kalau belum isi data
  if (!sessionStorage.getItem("revoice_sessionId")) {
    window.location.href = "index.html";
    return;
  }
  if (!sessionStorage.getItem("revoice_characterId")) {
    window.location.href = "pilih-karakter.html";
    return;
  }

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  canvas.width = window.Maze.COLS * window.Maze.TILE;
  canvas.height = window.Maze.ROWS * window.Maze.TILE;

  const banner = document.getElementById("banner-status");
  const submitBtn = document.getElementById("btn-submit");
  const popupTransition = document.getElementById("popup-transition");
  const popupTransitionTitle = document.getElementById("popup-transition-title");
  const popupTransitionDesc = document.getElementById("popup-transition-desc");
  const btnLanjut = document.getElementById("btn-lanjut");
  
  const popupAlert = document.getElementById("popup-alert");
  const popupAlertMsg = document.getElementById("popup-alert-msg");
  
  const babak2QuestionEl = document.getElementById("babak2-question");
  
  let alertTimeout;
  window.showGameAlert = function(title, msg) {
    popupAlertMsg.textContent = msg || title; // Fallback to title if msg isn't used
    popupAlert.style.display = "flex";
    
    if (alertTimeout) clearTimeout(alertTimeout);
    alertTimeout = setTimeout(() => {
      popupAlert.style.display = "none";
    }, 3000);
  };

  let currentBabak = 1; // 1 atau 2
  window.currentBabak = currentBabak;
  let gameOver = false;
  const sessionStartTime = performance.now();

  // ==================== BABAK 1 SETUP ====================
  window.Babak1.init();

  // ---------- Input keyboard ----------
  const keyDirMap = {
    ArrowUp: "up", w: "up", W: "up",
    ArrowDown: "down", s: "down", S: "down",
    ArrowLeft: "left", a: "left", A: "left",
    ArrowRight: "right", d: "right", D: "right",
  };
  const heldKeys = {};

  window.addEventListener("click", function () {
    window.AudioEngine.init();
    window.AudioEngine.startBGM();
  });

  window.addEventListener("keydown", function (e) {
    // Initialize audio on first user interaction
    window.AudioEngine.init();
    window.AudioEngine.startBGM();

    if (keyDirMap[e.key]) {
      heldKeys[keyDirMap[e.key]] = true;
      window.PlayerModule.setQueuedDir(keyDirMap[e.key]);
      e.preventDefault();
    } else if (e.key === " " || e.key === "Enter") {
      handleSubmit();
      e.preventDefault();
    }
  });

  window.addEventListener("keyup", function (e) {
    if (keyDirMap[e.key]) {
      delete heldKeys[keyDirMap[e.key]];
      const stillHeld = Object.keys(heldKeys)[0];
      window.PlayerModule.setQueuedDir(stillHeld || null);
      e.preventDefault();
    }
  });

  submitBtn.addEventListener("click", handleSubmit);

  function handleSubmit() {
    if (gameOver) return;
    if (currentBabak === 1) {
      window.Babak1.trySubmit();
    } else if (currentBabak === 2) {
      window.Babak2.trySubmit();
    }
  }

  // ---------- Hubungkan player move ----------
  window.PlayerModule.onMove(function (col, row, facing) {
    window.SocketClient.sendMove(col, row, facing, currentBabak);
    if (currentBabak === 1) {
      window.Babak1.onPlayerMove(col, row);
    } else if (currentBabak === 2) {
      window.Babak2.onPlayerMove(col, row);
    } else if (currentBabak === 3) {
      window.Babak3.onPlayerMove(col, row);
    }
    updateBanner();
  });

  // ==================== BABAK 1 CALLBACKS ====================
  function updateBanner() {
    if (currentBabak === 1) {
      updateBannerBabak1();
    } else if (currentBabak === 2) {
      updateBannerBabak2();
    } else if (currentBabak === 3) {
      updateBannerBabak3();
    }
  }

  function updateBannerBabak1() {
    const lubang = window.Babak1.getCurrentZona();
    const carrying = window.Babak1.isCarrying();

    if (!carrying) {
      banner.textContent = "Dekati salah satu bola kata di dalam labirin untuk membawanya.";
      submitBtn.disabled = true;
    } else if (lubang) {
      banner.innerHTML = 'Membawa kata. Lubang ini berlabel: <b>"' + lubang.inggris + '"</b> — cocok? Tekan submit.';
      submitBtn.disabled = false;
    } else {
      banner.textContent = "Membawa kata. Cari lubang (dead-end) yang labelnya cocok.";
      submitBtn.disabled = false;
    }
  }

  window.Babak1.onSubmitResult(function (cocok, bola) {
    if (cocok) {
      window.AudioEngine.play('correct');
      window.HUD.setStars(window.HUD.getStars() + 1);
      banner.innerHTML = 'Cocok! <b>"' + bola.indo + '"</b> = <b>"' + bola.inggris + '"</b> tercatat.';
    } else {
      window.AudioEngine.play('wrong');
      banner.innerHTML = "Belum cocok, coba lubang lain.";
    }

    sendJawaban(1, bola.indo, bola.inggris, cocok);
    setTimeout(updateBanner, 1400);
  });

  window.Babak1.onAllSubmitted(function () {
    window.AudioEngine.play('complete');
    banner.innerHTML = "<b>Semua kata berhasil dicocokkan!</b> Babak 1 selesai.";
    submitBtn.disabled = true;

    // Simpan waktu babak 1
    sendWaktu(1, window.HUD.getElapsedSeconds(), window.HUD.getStars());

    // Tampilkan popup transisi setelah 1 detik
    setTimeout(function () {
      popupTransitionTitle.textContent = "Babak 1 Selesai!";
      popupTransitionDesc.textContent = "Hebat! Anda telah menyelesaikan babak pertama.";
      btnLanjut.textContent = "Lanjut ke Babak 2";
      popupTransition.style.display = "flex";
    }, 1000);
  });

  // ==================== POPUP TRANSISI ====================
  btnLanjut.addEventListener("click", function () {
    popupTransition.style.display = "none";
    if (currentBabak === 1) {
      startBabak2();
    } else if (currentBabak === 2) {
      startBabak3();
    }
  });

  // ==================== BABAK 2 SETUP ====================
  function startBabak2() {
    currentBabak = 2;
    window.currentBabak = currentBabak;
    window.HUD.setBabak(2);
    window.HUD.resetTimer();

    // Inisialisasi Babak 2 (ini akan meload pattern baru ke Maze)
    window.Babak2.init();

    // Reset posisi player ke atas peta baru
    window.PlayerModule.teleport(10, 1);
    window.PlayerModule.setQueuedDir(null);

    // Tampilkan UI pertanyaan
    babak2QuestionEl.style.display = "block";
    submitBtn.textContent = "Bangun Jembatan!";
    updateBabak2Question();
    updateBanner();

    // Setup callbacks Babak 2
    window.Babak2.onSubmitResult(function (cocok, bola) {
      if (cocok) {
        window.AudioEngine.play('correct');
        window.HUD.setStars(window.HUD.getStars() + 1);
        banner.innerHTML = 'Benar! <b>"' + bola.indo + '"</b> — jembatan bertambah!';
        banner.style.color = "#8fd93f";
        updateBabak2Question();
      } else {
        window.AudioEngine.play('wrong');
        banner.innerHTML = 'Kurang tepat! Cari jawaban yang benar untuk soal ini.';
        banner.style.color = "#d9534f";
      }

      sendJawaban(2, bola.indo, bola.inggris, cocok);
      setTimeout(function () {
        banner.style.color = "";
        updateBanner();
      }, 1400);
    });

    window.Babak2.onAllSubmitted(function () {
      window.AudioEngine.play('complete');
      banner.innerHTML = "<b>Jembatan selesai dibangun!</b> Kamu berhasil menyeberang! 🎉";
      submitBtn.disabled = true;

      // Simpan waktu babak 2
      sendWaktu(2, window.HUD.getElapsedSeconds(), window.HUD.getStars());

      setTimeout(function () {
        popupTransitionTitle.textContent = "Babak 2 Selesai!";
        popupTransitionDesc.textContent = "Luar biasa! Jembatan makna telah berhasil dibangun.";
        btnLanjut.textContent = "Lanjut ke Babak 3";
        popupTransition.style.display = "flex";
      }, 1000);
    });
  }

  // ==================== BABAK 3 SETUP ====================
  function startBabak3() {
    currentBabak = 3;
    window.currentBabak = currentBabak;
    window.HUD.setBabak(3);
    window.HUD.resetTimer();

    window.Babak3.init();

    // Tampilkan UI pertanyaan menggunakan div yang sama
    babak2QuestionEl.style.display = "block";
    submitBtn.textContent = "Pilih Pintu!";
    submitBtn.disabled = true;
    updateBabak3Question();
    updateBanner();

    window.Babak3.onSubmitResult(function (cocok, bola, isGhost) {
      if (cocok) {
        window.AudioEngine.play('correct');
        window.HUD.setStars(window.HUD.getStars() + 1);
        banner.innerHTML = 'Benar! Jawaban tepat, lanjut soal berikutnya!';
        banner.style.color = "#8fd93f";
        updateBabak3Question();
      } else {
        if (isGhost) {
          window.AudioEngine.play('ghost');
          banner.innerHTML = 'HAP! Tertangkap hantu 👻, ulangi dari atas!';
        } else {
          window.AudioEngine.play('wrong');
          banner.innerHTML = 'Salah pintu! Ulangi dari atas!';
        }
        banner.style.color = "#d9534f";
      }

      sendJawaban(3, bola.indo, bola.inggris, cocok);
      setTimeout(function () {
        banner.style.color = "";
        updateBanner();
      }, 1400);
    });

    window.Babak3.onAllSubmitted(function () {
      window.AudioEngine.play('complete');
      gameOver = true;
      babak2QuestionEl.style.display = "none";
      banner.innerHTML = "<b>Tamat!</b> Kamu berhasil melewati semua labirin! 🎉";
      submitBtn.disabled = true;
      
      // Simpan waktu babak 3
      sendWaktu(3, window.HUD.getElapsedSeconds(), window.HUD.getStars());

      // Redirect ke leaderboard setelah 2.5 detik
      setTimeout(function () {
        window.location.href = "leaderboard.html";
      }, 2500);
    });
  }

  function updateBabak3Question() {
    const q = window.Babak3.getCurrentQuestion();
    if (q) {
      let optionsHtml = q.options.map(function(opt, idx) {
        return window.Babak3.doorLetters[idx] + ". " + opt;
      }).join("&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;");
      
      babak2QuestionEl.innerHTML = '📖 <b>' + q.word + '</b><br><span style="font-size: 12px; font-weight: normal; color: #fff;">' + optionsHtml + '</span>';
    } else {
      babak2QuestionEl.textContent = "Semua soal telah dijawab!";
    }
  }

  function updateBannerBabak3() {
    banner.textContent = "Lari dari hantu dan pilih pintu jawaban yang benar di bawah!";
  }

  function updateBabak2Question() {
    const q = window.Babak2.getCurrentQuestion();
    if (q) {
      babak2QuestionEl.innerHTML = '📖 Terjemahkan kata yang di-<i>bold</i>: <br>"' +
        q.kalimat.replace(q.inggris, '<b style="color:#e08a3c">' + q.inggris + '</b>') + '"';
    } else {
      babak2QuestionEl.textContent = "Semua soal telah dijawab!";
    }
  }

  function updateBannerBabak2() {
    const carrying = window.Babak2.isCarrying();
    const inZone = window.Babak2.isInSubmitZone();

    if (!carrying) {
      banner.textContent = "Ambil kotak kata yang sesuai dengan soal di atas.";
      submitBtn.disabled = true;
    } else if (inZone) {
      banner.innerHTML = "Kamu di tepi sungai. Tekan <b>Spasi</b> untuk menaruh jembatan!";
      submitBtn.disabled = false;
    } else {
      banner.textContent = "Bawa kata ke tepi sungai (di atas jembatan berikutnya).";
      submitBtn.disabled = true;
    }
  }

  // ==================== UTILITY ====================
  function sendWaktu(babak, waktuDetik, skor) {
    const sessionId = sessionStorage.getItem("revoice_sessionId");
    fetch("/api/responden/waktu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, babak, waktuDetik, skor }),
    }).catch(function (err) {
      console.warn("Gagal kirim waktu ke server:", err.message);
    });
  }

  function sendJawaban(babak, soalTeks, jawaban, benar) {
    const sessionId = sessionStorage.getItem("revoice_sessionId");
    fetch("/api/responden/jawaban", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        babak: babak,
        soalIndex: soalTeks,
        jawaban: jawaban,
        benar: benar,
        latencyMs: Math.round(performance.now() - sessionStartTime),
      }),
    }).catch(function (err) {
      console.warn("Gagal kirim jawaban ke server:", err.message);
    });
  }

  // ==================== GAME LOOP ====================
  let lastTime = performance.now();
  function loop(now) {
    const dt = now - lastTime;
    lastTime = now;

    window.HUD.tickTimer();
    window.PlayerModule.update(dt, false);

    ctx.fillStyle = "#0a120d";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    window.Maze.draw(ctx);

    if (currentBabak === 1) {
      window.Babak1.draw(ctx);
      window.PlayerModule.draw(ctx, currentBabak);
      window.Babak1.drawCarried(ctx, window.PlayerModule.self.x, window.PlayerModule.self.y);
    } else if (currentBabak === 2) {
      window.Babak2.draw(ctx);
      window.PlayerModule.draw(ctx, currentBabak);
      window.Babak2.drawCarried(ctx, window.PlayerModule.self.x, window.PlayerModule.self.y);
    } else if (currentBabak === 3) {
      window.Babak3.update(dt);
      window.Babak3.draw(ctx);
      window.PlayerModule.draw(ctx, currentBabak);
    }

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  updateBanner();
})();

