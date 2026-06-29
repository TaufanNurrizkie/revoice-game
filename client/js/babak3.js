// client/js/babak3.js

window.Babak3 = (function () {
  const doorCols = [2, 7, 13, 18];
  const doorLetters = ["A", "B", "C", "D"];

  const questions = [
    {
      word: "GOAL",
      options: ["Impian", "Harapan", "Tujuan", "Keinginan"],
      correctIndex: 2,
    },
    {
      word: "RELATE",
      options: ["Memahami", "Menyesuaikan", "Merasa terhubung", "Menanggapi"],
      correctIndex: 2,
    },
    {
      word: "ISSUE",
      options: ["Persoalan", "Isu", "Perdebatan", "Kesalahan"],
      correctIndex: 0,
    },
    {
      word: "TRIGGER",
      options: ["Pemicu", "Penyebab", "Gangguan", "Tekanan"],
      correctIndex: 0,
    },
    {
      word: "APPROACH",
      options: ["Strategi", "Pendekatan", "Cara", "Metode"],
      correctIndex: 1,
    },
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
      // Mock the bola object just for the callback parameter compatibility if needed,
      // but main.js Babak3 handler will be adjusted.
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
      // Wrong answer, reset!
      resetLevel();
    }
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
      // Caught by ghost!
      if (onSubmitResultCallback) {
        // Send a "wrong" signal to trigger the "Kurang tepat" or "Awas Hantu" banner
        onSubmitResultCallback(
          false,
          { indo: "Dimakan Hantu!", inggris: "Ghost" },
          true,
        );
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
    onAllSubmitted: function (cb) {
      onAllSubmittedCallback = cb;
    },
    onSubmitResult: function (cb) {
      onSubmitResultCallback = cb;
    },
    doorLetters,
  };
})();
