// client/js/babak2.js
// BABAK 2 — "Jembatan Makna"

window.Babak2 = (function () {
  const TILE = window.Maze.TILE;

  function drawFruit(ctx, x, y, size, type) {
    ctx.save();
    ctx.translate(x, y);

    const col  = type === "orange" ? "#FFD700" : "#00E5FF";
    const col2 = type === "orange" ? "#FFA500" : "#0097A7";
    const glow = type === "orange" ? "rgba(255,215,0,0.4)" : "rgba(0,229,255,0.4)";

    // Pulse glow
    const grd = ctx.createRadialGradient(0, 0, 1, 0, 0, size * 0.9);
    grd.addColorStop(0, glow);
    grd.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.9, 0, Math.PI * 2);
    ctx.fill();

    // 5-point star
    ctx.fillStyle = col;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const outerA = (Math.PI * 2 * i) / 5 - Math.PI / 2;
      const innerA = outerA + Math.PI / 5;
      const ox = Math.cos(outerA) * size * 0.5;
      const oy = Math.sin(outerA) * size * 0.5;
      const ix = Math.cos(innerA) * size * 0.22;
      const iy = Math.sin(innerA) * size * 0.22;
      i === 0 ? ctx.moveTo(ox, oy) : ctx.lineTo(ox, oy);
      ctx.lineTo(ix, iy);
    }
    ctx.closePath();
    ctx.fill();

    // Inner shadow facet
    ctx.fillStyle = col2;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const outerA = (Math.PI * 2 * i) / 5 - Math.PI / 2;
      const innerA = outerA + Math.PI / 5;
      const ox = Math.cos(outerA) * size * 0.28;
      const oy = Math.sin(outerA) * size * 0.28;
      const ix = Math.cos(innerA) * size * 0.13;
      const iy = Math.sin(innerA) * size * 0.13;
      i === 0 ? ctx.moveTo(ox, oy) : ctx.lineTo(ox, oy);
      ctx.lineTo(ix, iy);
    }
    ctx.closePath();
    ctx.fill();

    // Shine
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.beginPath();
    ctx.ellipse(-size * 0.1, -size * 0.18, size * 0.1, size * 0.05, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawBasket(ctx, px, py, isCurrentZona, glowColor) {
    // Ground glow
    const glowRadius = TILE * 0.85 + Math.sin(performance.now() / 120) * 1.5;
    const grad = ctx.createRadialGradient(px, py + TILE * 0.15, 2, px, py + TILE * 0.15, glowRadius);
    grad.addColorStop(0, isCurrentZona ? glowColor : "rgba(255,255,255,0.1)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(px, py + TILE * 0.15, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(px, py - TILE * 0.05);

    // --- Rocket body ---
    ctx.fillStyle = "#dce8f5";
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.bezierCurveTo(6, -8, 7, 0, 7, 8);
    ctx.lineTo(-7, 8);
    ctx.bezierCurveTo(-7, 0, -6, -8, 0, -14);
    ctx.closePath();
    ctx.fill();

    // Window
    ctx.fillStyle = isCurrentZona ? "#7df9ff" : "#3a8fc7";
    ctx.beginPath();
    ctx.arc(0, -1, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#1a4a6e";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Stripe
    ctx.fillStyle = "#e84545";
    ctx.fillRect(-7, 4, 14, 2.5);

    // Left fin
    ctx.fillStyle = "#b0c8e8";
    ctx.beginPath();
    ctx.moveTo(-7, 4);
    ctx.lineTo(-13, 10);
    ctx.lineTo(-7, 10);
    ctx.closePath();
    ctx.fill();

    // Right fin
    ctx.beginPath();
    ctx.moveTo(7, 4);
    ctx.lineTo(13, 10);
    ctx.lineTo(7, 10);
    ctx.closePath();
    ctx.fill();

    // Nozzle
    ctx.fillStyle = "#7a8fa8";
    ctx.fillRect(-4, 8, 8, 3);

    // Exhaust flame (animated)
    const flameH = 4 + Math.sin(performance.now() / 80) * 2;
    const flamGrd = ctx.createLinearGradient(0, 11, 0, 11 + flameH + 4);
    flamGrd.addColorStop(0, "#fff176");
    flamGrd.addColorStop(0.5, "#ff7043");
    flamGrd.addColorStop(1, "rgba(255,112,67,0)");
    ctx.fillStyle = flamGrd;
    ctx.beginPath();
    ctx.moveTo(-3.5, 11);
    ctx.lineTo(3.5, 11);
    ctx.lineTo(1, 11 + flameH + 4);
    ctx.lineTo(-1, 11 + flameH + 4);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  const orbImg = new Image();
  orbImg.src = "assets/sprites/orb-teal.png";

  const SOAL_POOL = [
    { kalimat: "Aku lagi overthinking tentang masa depan.", inggris: "overthinking", indo: "Berpikir Berlebih" },
    { kalimat: "Dia selalu support aku.", inggris: "support", indo: "Mendukung" },
    { kalimat: "Aku nggak setuju sama statement itu.", inggris: "statement", indo: "Pernyataan" },
    { kalimat: "Aku suka vibes tempat ini.", inggris: "vibes", indo: "Suasana" },
    { kalimat: "Dia memiliki banyak experience di bidang itu.", inggris: "experience", indo: "Pengalaman" },
    { kalimat: "Media sosial memberi influence besar pada remaja.", inggris: "influence", indo: "Pengaruh" },
    { kalimat: "Dia memiliki mindset yang positif.", inggris: "mindset", indo: "Pola Pikir" },
    { kalimat: "Aku prefer belajar malam.", inggris: "prefer", indo: "Memilih" },
    { kalimat: "Dia selalu kasih feedback yang bagus.", inggris: "feedback", indo: "Umpan Balik" },
    { kalimat: "Aku struggle buat konsisten belajar setiap hari.", inggris: "struggle", indo: "Kesusahan" },
    { kalimat: "Kita perlu update sistem ini.", inggris: "update", indo: "Perbarui" },
    { kalimat: "Dia punya skill komunikasi yang bagus.", inggris: "skill", indo: "Kemampuan" },
    { kalimat: "Aku mau upgrade diri aku tahun ini.", inggris: "upgrade", indo: "Tingkatkan" },
    { kalimat: "Situasinya bikin aku stress banget.", inggris: "stress", indo: "Tekanan" },
    { kalimat: "Kita harus manage waktu dengan baik.", inggris: "manage", indo: "Kelola" },
    { kalimat: "Proyek ini butuh planning yang matang.", inggris: "planning", indo: "Perencanaan" },
    { kalimat: "Dia punya attitude yang profesional.", inggris: "attitude", indo: "Sikap" },
    { kalimat: "Aku butuh challenge baru buat berkembang.", inggris: "challenge", indo: "Tantangan" },
    { kalimat: "Mereka butuh teamwork yang solid.", inggris: "teamwork", indo: "Kerja Tim" },
    { kalimat: "Aku pengen achieve semua target tahun ini.", inggris: "achieve", indo: "Mencapai" },
    { kalimat: "Kamu harus commit sama keputusan yang udah dibuat.", inggris: "commit", indo: "Berkomitmen" },
    { kalimat: "Dia selalu deliver hasil kerja tepat waktu.", inggris: "deliver", indo: "Menyerahkan" },
    { kalimat: "Aku mau explore lebih banyak peluang baru.", inggris: "explore", indo: "Menjelajahi" },
    { kalimat: "Kita perlu focus sama tujuan utama kita.", inggris: "focus", indo: "Fokus" },
    { kalimat: "Dia kasih impact besar buat timnya.", inggris: "impact", indo: "Dampak" },
    { kalimat: "Aku pengen improve kemampuan public speaking.", inggris: "improve", indo: "Meningkatkan" },
    { kalimat: "Kamu harus punya initiative buat mulai duluan.", inggris: "initiative", indo: "Inisiatif" },
    { kalimat: "Aku mau invest waktu buat belajar hal baru.", inggris: "invest", indo: "Menginvestasikan" },
    { kalimat: "Dia selalu maintain hubungan baik sama klien.", inggris: "maintain", indo: "Menjaga" },
    { kalimat: "Kita perlu network lebih luas di industri ini.", inggris: "network", indo: "Jaringan" },
    { kalimat: "Aku harus organize jadwal biar lebih rapi.", inggris: "organize", indo: "Mengatur" },
    { kalimat: "Dia punya passion yang kuat di bidang seni.", inggris: "passion", indo: "Semangat" },
    { kalimat: "Kamu perlu reflect diri setiap akhir minggu.", inggris: "reflect", indo: "Merenungkan" },
    { kalimat: "Aku mau share pengalaman ini ke temen-temen.", inggris: "share", indo: "Berbagi" },
    { kalimat: "Dia selalu solve masalah dengan tenang.", inggris: "solve", indo: "Memecahkan" },
    { kalimat: "Kita perlu track progress kita setiap hari.", inggris: "track", indo: "Melacak" },
    { kalimat: "Aku mau transform cara belajar aku sepenuhnya.", inggris: "transform", indo: "Mengubah" },
    { kalimat: "Dia always try yang terbaik dalam setiap situasi.", inggris: "try", indo: "Berusaha" },
    { kalimat: "Kamu harus validate ide kamu sebelum eksekusi.", inggris: "validate", indo: "Memvalidasi" },
    { kalimat: "Aku pengen volunteer di kegiatan sosial.", inggris: "volunteer", indo: "Sukarela" },
  ];

  // Ambil 10 soal acak dari pool
  function pickRandom(pool, n) {
    return [...pool].sort(() => Math.random() - 0.5).slice(0, n);
  }

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

    // Siapkan soal (ambil 10 acak dari pool)
    questions = pickRandom(SOAL_POOL, 10);

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
