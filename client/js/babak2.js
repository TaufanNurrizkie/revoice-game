// client/js/babak2.js
// BABAK 2 — "Jembatan Makna"

window.Babak2 = (function () {
  const TILE = window.Maze.TILE;

  function drawFruit(ctx, x, y, size, type) {
    ctx.save();
    ctx.translate(x, y);
    
    // Draw brown stem
    ctx.strokeStyle = "#5a3a22";
    ctx.lineWidth = size * 0.12;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.25);
    ctx.quadraticCurveTo(size * 0.1, -size * 0.5, size * 0.18, -size * 0.45);
    ctx.stroke();
    
    // Draw green leaf
    ctx.fillStyle = "#417a4c";
    ctx.beginPath();
    ctx.ellipse(size * 0.15, -size * 0.4, size * 0.16, size * 0.08, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
    
    if (type === "orange") {
      // Draw warm orange apple/fruit (Babak 1)
      ctx.fillStyle = "#e76f51"; // cute warm orange-red apple
      ctx.beginPath();
      ctx.arc(-size * 0.15, 0, size * 0.38, 0, Math.PI * 2);
      ctx.arc(size * 0.15, 0, size * 0.38, 0, Math.PI * 2);
      ctx.fill();
      
      // Bottom brown notch
      ctx.fillStyle = "#5a3a22";
      ctx.beginPath();
      ctx.arc(0, size * 0.34, size * 0.06, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Draw cool teal magic forest berry (Babak 2)
      ctx.fillStyle = "#2a9d8f"; // soft teal magic berry
      ctx.beginPath();
      ctx.arc(-size * 0.14, -size * 0.1, size * 0.32, 0, Math.PI * 2);
      ctx.arc(size * 0.14, -size * 0.1, size * 0.32, 0, Math.PI * 2);
      ctx.arc(0, size * 0.16, size * 0.32, 0, Math.PI * 2);
      ctx.fill();
      
      // Bottom notch
      ctx.fillStyle = "#1b4d45";
      ctx.beginPath();
      ctx.arc(0, size * 0.34, size * 0.06, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Glossy highlight
    ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
    ctx.beginPath();
    ctx.ellipse(-size * 0.12, -size * 0.15, size * 0.12, size * 0.06, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }

  function drawBasket(ctx, px, py, isCurrentZona, glowColor) {
    // Ground shadow / aura glow
    const glowRadius = TILE * 0.8 + Math.sin(performance.now() / 100) * 1.5;
    const grad = ctx.createRadialGradient(px, py + TILE * 0.15, 2, px, py + TILE * 0.15, glowRadius);
    grad.addColorStop(0, isCurrentZona ? glowColor : "rgba(255, 255, 255, 0.15)");
    grad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(px, py + TILE * 0.15, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(px, py + TILE * 0.05);
    
    // Woven Basket Base
    ctx.fillStyle = "#8a6642"; // light wood/wicker brown
    ctx.beginPath();
    ctx.moveTo(-9, -2);
    ctx.lineTo(9, -2);
    ctx.lineTo(6, 7);
    ctx.lineTo(-6, 7);
    ctx.closePath();
    ctx.fill();
    
    // Basket rim (top border)
    ctx.fillStyle = "#6e4e2f"; // darker brown
    ctx.fillRect(-10, -5, 20, 3);
    
    // Woven pattern lines
    ctx.strokeStyle = "#4a3320";
    ctx.lineWidth = 1;
    ctx.beginPath();
    // Vertical ribs
    ctx.moveTo(-6, -2); ctx.lineTo(-4, 7);
    ctx.moveTo(-2, -2); ctx.lineTo(-1, 7);
    ctx.moveTo(2, -2);  ctx.lineTo(1, 7);
    ctx.moveTo(6, -2);  ctx.lineTo(4, 7);
    // Horizontal rings
    ctx.moveTo(-8, 1);  ctx.lineTo(8, 1);
    ctx.moveTo(-7, 4);  ctx.lineTo(7, 4);
    ctx.stroke();

    // Draw some straw/green leaves inside the basket
    ctx.fillStyle = "#417a4c";
    ctx.beginPath();
    ctx.ellipse(-3, -6, 4, 2, -Math.PI/6, 0, Math.PI*2);
    ctx.ellipse(4, -6, 4, 2, Math.PI/6, 0, Math.PI*2);
    ctx.fill();
    
    ctx.restore();
  }

  const orbImg = new Image();
  orbImg.src = "assets/sprites/orb-teal.png";

  const SOAL_LIST = [
    { kalimat: "Aku lagi overthinking tentang masa depan.", inggris: "overthinking", indo: "Berpikir Berlebih" },
    { kalimat: "Dia selalu support aku.", inggris: "support", indo: "Mendukung" },
    { kalimat: "Aku nggak setuju sama statement itu.", inggris: "statement", indo: "Pernyataan" },
    { kalimat: "Aku suka vibes tempat ini.", inggris: "vibes", indo: "Suasana" },
    { kalimat: "Dia meliki banyak experience di bidang itu.", inggris: "experience", indo: "Pengalaman" },
    { kalimat: "Media sosial memberi influence besar pada remaja.", inggris: "influence", indo: "Pengaruh" },
    { kalimat: "Dia memiliki mindset yang positif.", inggris: "mindset", indo: "Pola Pikir" },
    { kalimat: "Aku prefer belajar malam.", inggris: "prefer", indo: "Memilih" },
    { kalimat: "Dia selalu kasih feedback yang bagus.", inggris: "feedback", indo: "Umpan Balik" },
    { kalimat: "Aku struggle buat konsisten belajar setiap hari.", inggris: "struggle", indo: "Kesusahan" }
  ];

  // Acak urutan soal
  let questions = [];
  let currentQIndex = 0;

  const pattern = [
    "#####################",
    "#...................#",
    "#...................#",
    "#...................#",
    "#...................#",
    "#...................#",
    "##########.##########",
    "~~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~",
    "##########.##########",
    "#####################",
  ];

  const bolaPositions = [
    { col: 2, row: 2 }, { col: 5, row: 2 }, { col: 8, row: 2 }, { col: 12, row: 2 }, { col: 15, row: 2 }, { col: 18, row: 2 },
    { col: 3, row: 4 }, { col: 6, row: 4 }, { col: 14, row: 4 }, { col: 17, row: 4 }
  ];

  let bolaList = [];
  let carrying = null;
  let inSubmitZone = false;

  let onAllSubmittedCallback = null;
  let onSubmitResultCallback = null;

  function init() {
    window.Maze.loadPattern(pattern);

    // Siapkan soal (acak urutan)
    questions = [...SOAL_LIST];
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }

    // Siapkan bola jawaban (acak letak)
    let answers = [...questions];
    for (let i = answers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [answers[i], answers[j]] = [answers[j], answers[i]];
    }

    bolaList = answers.map((ans, i) => ({
      indo: ans.indo,
      inggris: ans.inggris,
      col: bolaPositions[i].col,
      row: bolaPositions[i].row,
      taken: false,
      submitted: false
    }));

    currentQIndex = 0;
    carrying = null;
    inSubmitZone = false;
  }

  function getBridgeTargetPos() {
    return { col: 10, row: 7 + currentQIndex }; // Jembatan membentang ke bawah dari row 7
  }

  function onPlayerMove(col, row) {
    if (!carrying) {
      const target = bolaList.find(b => !b.taken && !b.submitted && b.col === col && b.row === row);
      if (target) {
        target.taken = true;
        carrying = target;
        if (window.AudioEngine) window.AudioEngine.play('pickup');
      }
    }

    // Submit zone: berdiri tepat sebelum jembatan berikutnya yang harus dibangun
    const targetBridge = getBridgeTargetPos();
    // Bisa berdiri di tile atasnya (col 10, row-1) atau di tile jembatan sebelumnya (yang mana = targetBridge.row - 1)
    if (col === targetBridge.col && row === targetBridge.row - 1) {
      inSubmitZone = true;
    } else {
      inSubmitZone = false;
    }
  }

  function trySubmit() {
    if (!carrying || !inSubmitZone) return null;

    const currentQ = questions[currentQIndex];
    const cocok = carrying.inggris === currentQ.inggris;

    if (cocok) {
      carrying.submitted = true;
      const targetBridge = getBridgeTargetPos();

      // Bangun jembatan
      window.Maze.setTile(targetBridge.col, targetBridge.row, 3);

      const submittedBola = carrying;
      carrying = null;
      currentQIndex++;

      if (onSubmitResultCallback) onSubmitResultCallback(true, submittedBola);

      if (currentQIndex >= questions.length) {
        if (onAllSubmittedCallback) onAllSubmittedCallback();
      }
      return { cocok: true, bola: submittedBola };
    } else {
      if (window.showGameAlert) {
        window.showGameAlert("Jawaban Salah!", "Bola dikembalikan ke posisi semula.");
      } else {
        alert("Jawaban salah! Bola dikembalikan ke posisi semula.");
      }
      carrying.taken = false;
      const returnedBola = carrying;
      carrying = null;
      if (onSubmitResultCallback) onSubmitResultCallback(false, returnedBola);
      return { cocok: false, bola: returnedBola };
    }
  }

  function draw(ctx) {
    // Gambar portal submit di dekat jembatan jika babak belum selesai (sebagai Basket Buah)
    if (currentQIndex < questions.length) {
      const targetBridge = getBridgeTargetPos();
      const px = targetBridge.col * TILE + TILE / 2;
      const py = (targetBridge.row - 1) * TILE + TILE / 2;
      
      drawBasket(ctx, px, py, inSubmitZone, "rgba(63, 157, 143, 0.45)");
      
      // Portal text label
      ctx.font = "bold 9px 'Trebuchet MS', sans-serif";
      ctx.textAlign = "center";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#1c2b24";
      ctx.strokeText("PORTAL SUBMIT", px, py - 16);
      ctx.fillStyle = inSubmitZone ? "#64ffe6" : "#fff";
      ctx.fillText("PORTAL SUBMIT", px, py - 16);
    }

    // Gambar buah teal magic berry
    bolaList.forEach(b => {
      if (b.taken || b.submitted) return;
      const px = b.col * TILE + TILE / 2;
      const py = b.row * TILE + TILE / 2;
      const size = 16 + Math.sin(performance.now() / 220) * 2; // Pulsing size
      
      drawFruit(ctx, px, py, size, "teal");

      ctx.font = "bold 9px 'Trebuchet MS', sans-serif";
      ctx.textAlign = "center";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#1c2b24";
      ctx.strokeText(b.indo, px, py + 18);
      ctx.fillStyle = "#fff";
      ctx.fillText(b.indo, px, py + 18);
    });
  }

  function drawCarried(ctx, playerX, playerY) {
    if (!carrying) return;
    
    // Determine animation movement state
    const player = window.PlayerModule ? window.PlayerModule.self : { isMoving: false };
    const isMoving = player.isMoving || false;
    
    // Cute carried item bobbing animation (faster bounce when moving, gentle float when idle)
    const bobPeriod = isMoving ? 120 : 220;
    const bob = Math.sin(performance.now() / bobPeriod) * 1.6;
    
    // Position fruit to float cleanly above the head with a distinct gap (not touching the head)
    const ox = playerX;
    const oy = playerY - 24 + bob; 
    const size = 15; // cute, visible size
    
    ctx.save();
    
    // Soft shadow below the fruit
    ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 2;
    
    drawFruit(ctx, ox, oy, size, "teal");
    ctx.restore();
    
    // Word label floats cleanly above the speech bubble with outline for visibility
    ctx.font = "bold 9px 'Trebuchet MS', sans-serif";
    ctx.textAlign = "center";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#1c2b24";
    ctx.strokeText(carrying.indo, playerX, playerY - 36);
    ctx.fillStyle = "#fff";
    ctx.fillText(carrying.indo, playerX, playerY - 36);
  }

  function getCurrentQuestion() {
    return questions[currentQIndex] || null;
  }

  return {
    init,
    onPlayerMove,
    trySubmit,
    draw,
    drawCarried,
    isCarrying: () => !!carrying,
    isInSubmitZone: () => inSubmitZone,
    getCurrentQuestion,
    onAllSubmitted: cb => onAllSubmittedCallback = cb,
    onSubmitResult: cb => onSubmitResultCallback = cb
  };
})();
