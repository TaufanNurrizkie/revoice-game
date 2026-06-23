// client/js/babak3.js

window.Babak3 = (function () {
  const doorCols = [2, 7, 13, 18];
  const doorLetters = ["A", "B", "C", "D"];

  const questions = [
    { word: "GOAL", options: ["Impian", "Harapan", "Tujuan", "Keinginan"], correctIndex: 2 },
    { word: "RELATE", options: ["Memahami", "Menyesuaikan", "Merasa terhubung", "Menanggapi"], correctIndex: 2 },
    { word: "ISSUE", options: ["Persoalan", "Isu", "Perdebatan", "Kesalahan"], correctIndex: 0 },
    { word: "TRIGGER", options: ["Pemicu", "Penyebab", "Gangguan", "Tekanan"], correctIndex: 0 },
    { word: "APPROACH", options: ["Strategi", "Pendekatan", "Cara", "Metode"], correctIndex: 1 }
  ];

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
    "#####################"
  ];

  let currentQuestionIndex = 0;
  let active = false;
  let onAllSubmittedCallback = null;
  let onSubmitResultCallback = null;

  // Ghost state
  let ghost = {
    x: 10 * 22 + 11, // TILE = 22, mid col 10
    y: 1 * 22 + 11,
    speed: 35, // pixels per second (player is usually around 80-100)
    size: 22
  };

  function init() {
    active = true;
    currentQuestionIndex = 0;
    window.Maze.loadPattern(pattern);
    resetLevel();
  }

  function resetLevel() {
    // Reset player
    window.PlayerModule.self.col = 1;
    window.PlayerModule.self.row = 1;
    window.PlayerModule.self.x = 1 * window.Maze.TILE + window.Maze.TILE / 2;
    window.PlayerModule.self.y = 1 * window.Maze.TILE + window.Maze.TILE / 2;
    window.PlayerModule.setQueuedDir(null);

    // Reset ghost
    ghost.x = 10 * window.Maze.TILE + window.Maze.TILE / 2;
    ghost.y = 1 * window.Maze.TILE + window.Maze.TILE / 2;
  }

  function getCurrentQuestion() {
    if (currentQuestionIndex < questions.length) {
      return questions[currentQuestionIndex];
    }
    return null;
  }

  function onPlayerMove(col, row) {
    if (!active) return;

    if (window.Maze.grid[row][col] === 4) { // Door
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
        // Mock the bola object just for the callback parameter compatibility if needed, 
        // but main.js Babak3 handler will be adjusted.
        onSubmitResultCallback(isCorrect, { indo: q.options[doorIndex], inggris: q.word });
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
      // Wrong answer, reset!
      resetLevel();
    }
  }

  function update(dt) {
    if (!active) return;

    // Ghost chases player
    const px = window.PlayerModule.self.x;
    const py = window.PlayerModule.self.y;
    
    const dx = px - ghost.x;
    const dy = py - ghost.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0) {
      ghost.x += (dx / dist) * ghost.speed * (dt / 1000);
      ghost.y += (dy / dist) * ghost.speed * (dt / 1000);
    }

    // Ghost touch player
    if (dist < window.Maze.TILE * 0.8) {
      // Caught by ghost!
      if (onSubmitResultCallback) {
        // Send a "wrong" signal to trigger the "Kurang tepat" or "Awas Hantu" banner
        onSubmitResultCallback(false, { indo: "Dimakan Hantu!", inggris: "Ghost" }, true);
      }
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
    onAllSubmitted: function (cb) { onAllSubmittedCallback = cb; },
    onSubmitResult: function (cb) { onSubmitResultCallback = cb; },
    doorLetters
  };
})();
