// client/js/babak3.js

window.Babak3 = (function () {
  const doorCols = [2, 7, 13, 18];
  const doorLetters = ["A", "B", "C", "D"];

  const questionPool = [
    { word: "GOAL", options: ["Impian", "Harapan", "Tujuan", "Keinginan"], correctIndex: 2 },
    { word: "RELATE", options: ["Memahami", "Menyesuaikan", "Merasa terhubung", "Menanggapi"], correctIndex: 2 },
    { word: "ISSUE", options: ["Persoalan", "Isu", "Perdebatan", "Kesalahan"], correctIndex: 0 },
    { word: "TRIGGER", options: ["Pemicu", "Penyebab", "Gangguan", "Tekanan"], correctIndex: 0 },
    { word: "APPROACH", options: ["Strategi", "Pendekatan", "Cara", "Metode"], correctIndex: 1 },
    { word: "IMPACT", options: ["Akibat", "Dampak", "Pengaruh", "Perubahan"], correctIndex: 1 },
    { word: "CHALLENGE", options: ["Tantangan", "Hambatan", "Cobaan", "Masalah"], correctIndex: 0 },
    { word: "SUPPORT", options: ["Bantuan", "Dukungan", "Pertolongan", "Perlindungan"], correctIndex: 1 },
    { word: "MINDSET", options: ["Sikap", "Sudut Pandang", "Pola Pikir", "Keyakinan"], correctIndex: 2 },
    { word: "FEEDBACK", options: ["Kritik", "Saran", "Umpan Balik", "Penilaian"], correctIndex: 2 },
    { word: "PRIORITY", options: ["Urgensi", "Prioritas", "Kepentingan", "Kebutuhan"], correctIndex: 1 },
    { word: "ADAPT", options: ["Berubah", "Menyesuaikan", "Berkembang", "Beradaptasi"], correctIndex: 3 },
    { word: "INSIGHT", options: ["Wawasan", "Pengetahuan", "Pemahaman", "Informasi"], correctIndex: 0 },
    { word: "STRUGGLE", options: ["Berjuang", "Kesulitan", "Hambatan", "Usaha"], correctIndex: 1 },
    { word: "ACHIEVE", options: ["Berusaha", "Berhasil", "Mencapai", "Meraih"], correctIndex: 2 },
    { word: "CREATIVE", options: ["Inovatif", "Kreatif", "Imajinatif", "Berbakat"], correctIndex: 1 },
    { word: "MANAGE", options: ["Mengelola", "Mengatur", "Menangani", "Memimpin"], correctIndex: 0 },
    { word: "TRUST", options: ["Keyakinan", "Harapan", "Kepercayaan", "Kejujuran"], correctIndex: 2 },
    { word: "IMPROVE", options: ["Meningkatkan", "Memperbaiki", "Mengembangkan", "Memperbarui"], correctIndex: 1 },
    { word: "FOCUS", options: ["Fokus", "Konsentrasi", "Perhatian", "Keseriusan"], correctIndex: 0 },
    { word: "BOUNDARY", options: ["Batas", "Aturan", "Batasan", "Larangan"], correctIndex: 2 },
    { word: "COMMIT", options: ["Setuju", "Berkomitmen", "Bertekad", "Bersedia"], correctIndex: 1 },
    { word: "EXPLORE", options: ["Mencari", "Menjelajahi", "Menyelidiki", "Menemukan"], correctIndex: 1 },
    { word: "PASSION", options: ["Hobi", "Minat", "Semangat", "Kegemaran"], correctIndex: 2 },
    { word: "REFLECT", options: ["Berpikir", "Merenungkan", "Mengevaluasi", "Mempertimbangkan"], correctIndex: 1 },
    { word: "RESILIENCE", options: ["Keberanian", "Ketangguhan", "Ketahanan", "Kekuatan"], correctIndex: 2 },
    { word: "TRANSFORM", options: ["Berubah", "Berkembang", "Mengubah", "Berinovasi"], correctIndex: 2 },
    { word: "VALIDATE", options: ["Membuktikan", "Menyetujui", "Memvalidasi", "Mengonfirmasi"], correctIndex: 2 },
    { word: "NETWORK", options: ["Komunitas", "Koneksi", "Jaringan", "Kelompok"], correctIndex: 2 },
    { word: "ORGANIZE", options: ["Mengelola", "Menyusun", "Mengatur", "Merencanakan"], correctIndex: 2 },
    { word: "DELIVER", options: ["Mengirim", "Menyerahkan", "Memberikan", "Menyelesaikan"], correctIndex: 1 },
    { word: "INITIATIVE", options: ["Ide", "Inisiatif", "Langkah", "Usaha"], correctIndex: 1 },
    { word: "COLLABORATE", options: ["Bergabung", "Berdiskusi", "Bekerja Sama", "Berkomunikasi"], correctIndex: 2 },
    { word: "COMMUNICATE", options: ["Berbicara", "Berinteraksi", "Berkomunikasi", "Berdialog"], correctIndex: 2 },
    { word: "MOTIVATE", options: ["Mendorong", "Memotivasi", "Menginspirasi", "Menyemangati"], correctIndex: 1 },
    { word: "ANALYZE", options: ["Memeriksa", "Menganalisis", "Menilai", "Mempelajari"], correctIndex: 1 },
    { word: "DECISION", options: ["Pilihan", "Keputusan", "Pertimbangan", "Kesimpulan"], correctIndex: 1 },
    { word: "EMPATHY", options: ["Kepedulian", "Simpati", "Empati", "Perhatian"], correctIndex: 2 },
    { word: "BALANCE", options: ["Kesetaraan", "Keseimbangan", "Kestabilan", "Keselarasan"], correctIndex: 1 },
    { word: "CLARITY", options: ["Kejernihan", "Ketepatan", "Kejelasan", "Kepastian"], correctIndex: 2 },
  ];

  // Ambil 5 soal acak dan acak posisi jawaban benar tiap soal
  function pickQuestions(pool, n) {
    const picked = [...pool].sort(() => Math.random() - 0.5).slice(0, n);
    return picked.map(q => {
      // Acak posisi jawaban benar di antara 4 opsi
      const correctAnswer = q.options[q.correctIndex];
      const shuffled = [...q.options].sort(() => Math.random() - 0.5);
      return {
        word: q.word,
        options: shuffled,
        correctIndex: shuffled.indexOf(correctAnswer),
      };
    });
  }

  let questions = pickQuestions(questionPool, 5);

  const pattern = [
    "#####################",
    "#...................#",
    "#.#####.#######.###.#",
    "#.#...#.#.....#...#.#",
    "#.#.#.###.###.###.#.#",
    "#...#.....#.......#.#",
    "#####.###.#####.###.#",
    "#.....#.#.#...#.#...#",
    "#.#####.#.#.#.#.#.###",
    "#.#.....#...#.#.....#",
    "#.#.#######.#.#####.#",
    "#.#.#.......#.....#.#",
    "#.###.#####.#####.#.#",
    "#.....#...#.#...#...#",
    "#######.#.#.#.#.#####",
    "#.......#.....#.....#",
    "#...................#",
    "##D####D#####D####D##",
    "#####################",
  ];

  let currentQuestionIndex = 0;
  let active = false;
  let onAllSubmittedCallback = null;
  let onSubmitResultCallback = null;

  // Ghost state
  let ghost = {
    x: 10 * 26 + 13, // TILE = 26, mid col 10
    y: 1 * 26 + 13,
    speed: 100, // pixels per second (player is usually around 80-100)
    size: 26,
    targetTile: null,
  };

  function init() {
    active = true;
    currentQuestionIndex = 0;
    questions = pickQuestions(questionPool, 5); // Acak ulang tiap init
    window.Maze.loadPattern(pattern);
    resetLevel();
  }

  function resetLevel() {
    // Reset player
    window.PlayerModule.teleport(1, 1);
    window.PlayerModule.setQueuedDir(null);

    // Reset ghost
    ghost.x = 10 * window.Maze.TILE + window.Maze.TILE / 2;
    ghost.y = 1 * window.Maze.TILE + window.Maze.TILE / 2;
    ghost.targetTile = null;
  }

  function getCurrentQuestion() {
    if (currentQuestionIndex < questions.length) {
      return questions[currentQuestionIndex];
    }
    return null;
  }

  function onPlayerMove(col, row) {
    if (!active) return;

    if (window.Maze.grid[row][col] === 4) {
      // Door
      const doorIndex = doorCols.indexOf(col);
      if (doorIndex !== -1) {
        checkAnswer(doorIndex);
      }
    }
  }

  function checkAnswer(doorIndex) {
    const q = questions[currentQuestionIndex];
    const isCorrect = doorIndex === q.correctIndex;

    if (onSubmitResultCallback) {
      onSubmitResultCallback(isCorrect, {
        indo: q.options[doorIndex],
        inggris: q.word,
      });
    }

    if (isCorrect) {
      currentQuestionIndex++;
      if (currentQuestionIndex >= questions.length) {
        active = false;
        if (onAllSubmittedCallback) onAllSubmittedCallback();
      } else {
        resetLevel();
      }
    } else {
      // Salah: ganti soal saat ini dengan soal baru dari pool, lalu reset posisi
      replaceCurrentQuestion();
      resetLevel();
    }
  }

  // Ganti soal saat ini dengan soal baru acak dari pool (hindari soal yang sudah muncul)
  function replaceCurrentQuestion() {
    const usedWords = questions.map(q => q.word);
    const available = questionPool.filter(q => !usedWords.includes(q.word));
    const pool = available.length > 0 ? available : questionPool;
    const raw = pool[Math.floor(Math.random() * pool.length)];
    const correctAnswer = raw.options[raw.correctIndex];
    const shuffled = [...raw.options].sort(() => Math.random() - 0.5);
    questions[currentQuestionIndex] = {
      word: raw.word,
      options: shuffled,
      correctIndex: shuffled.indexOf(correctAnswer),
    };
  }

  function findPath(startCol, startRow, targetCol, targetRow) {
    const queue = [{ c: startCol, r: startRow, path: [] }];
    const visited = Array(window.Maze.ROWS)
      .fill(0)
      .map(() => Array(window.Maze.COLS).fill(false));

    if (
      startRow >= 0 &&
      startRow < window.Maze.ROWS &&
      startCol >= 0 &&
      startCol < window.Maze.COLS
    ) {
      visited[startRow][startCol] = true;
    }

    while (queue.length > 0) {
      const curr = queue.shift();
      if (curr.c === targetCol && curr.r === targetRow) {
        return curr.path;
      }
      const dirs = [
        [0, -1],
        [0, 1],
        [-1, 0],
        [1, 0],
      ];
      for (let i = 0; i < dirs.length; i++) {
        const nc = curr.c + dirs[i][0];
        const nr = curr.r + dirs[i][1];
        if (
          nc >= 0 &&
          nc < window.Maze.COLS &&
          nr >= 0 &&
          nr < window.Maze.ROWS
        ) {
          if (window.Maze.isWalkable(nc, nr) && !visited[nr][nc]) {
            visited[nr][nc] = true;
            queue.push({
              c: nc,
              r: nr,
              path: curr.path.concat([{ c: nc, r: nr }]),
            });
          }
        }
      }
    }
    return [];
  }

  function update(dt) {
    if (!active) return;

    // Ghost chases player
    const px = window.PlayerModule.self.x;
    const py = window.PlayerModule.self.y;

    if (!ghost.targetTile) {
      const ghostCol = Math.floor(ghost.x / window.Maze.TILE);
      const ghostRow = Math.floor(ghost.y / window.Maze.TILE);
      const playerCol = Math.floor(px / window.Maze.TILE);
      const playerRow = Math.floor(py / window.Maze.TILE);

      const path = findPath(ghostCol, ghostRow, playerCol, playerRow);
      if (path && path.length > 0) {
        ghost.targetTile = path[0];
      }
    }

    if (ghost.targetTile) {
      let targetX =
        ghost.targetTile.c * window.Maze.TILE + window.Maze.TILE / 2;
      let targetY =
        ghost.targetTile.r * window.Maze.TILE + window.Maze.TILE / 2;

      let dx = targetX - ghost.x;
      let dy = targetY - ghost.y;
      let dist = Math.sqrt(dx * dx + dy * dy);

      const moveStep = ghost.speed * (dt / 1000);
      if (dist <= moveStep) {
        ghost.x = targetX;
        ghost.y = targetY;
        ghost.targetTile = null; // reached, calculate next tile on next frame
      } else {
        ghost.x += (dx / dist) * moveStep;
        ghost.y += (dy / dist) * moveStep;
      }
    }

    // Ghost touch player
    const dxPlayer = px - ghost.x;
    const dyPlayer = py - ghost.y;
    const distPlayer = Math.sqrt(dxPlayer * dxPlayer + dyPlayer * dyPlayer);

    if (distPlayer < window.Maze.TILE * 0.8) {
      // Kena hantu: ganti soal baru, reset posisi, tanpa kurangi nyawa
      if (onSubmitResultCallback) {
        onSubmitResultCallback(
          false,
          { indo: "Dimakan Hantu!", inggris: "Ghost" },
          true,
        );
      }
      replaceCurrentQuestion();
      resetLevel();
    }
  }

  function draw(ctx) {
    if (!active) return;

    // Draw doors options at the bottom
    const q = getCurrentQuestion();
    if (q) {
      ctx.fillStyle = "#ffffff";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (let i = 0; i < doorCols.length; i++) {
        const cx = doorCols[i] * window.Maze.TILE + window.Maze.TILE / 2;
        const cy = 17 * window.Maze.TILE + window.Maze.TILE / 2;

        // Draw letter
        ctx.fillStyle = "#ffffff";
        ctx.fillText(doorLetters[i], cx, cy - 15);
      }
    }

    // Draw ghost
    ctx.font = "18px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("👻", ghost.x, ghost.y);
  }

  return {
    init,
    resetLevel,
    getCurrentQuestion,
    onPlayerMove,
    update,
    draw,
    onAllSubmitted: function (cb) {
      onAllSubmittedCallback = cb;
    },
    onSubmitResult: function (cb) {
      onSubmitResultCallback = cb;
    },
    doorLetters,
  };
})();
