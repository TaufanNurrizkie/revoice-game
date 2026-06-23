// client/js/babak2.js
// BABAK 2 — "Jembatan Makna"

window.Babak2 = (function () {
  const TILE = window.Maze.TILE;

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
    {col: 2, row: 2}, {col: 5, row: 2}, {col: 8, row: 2}, {col: 12, row: 2}, {col: 15, row: 2}, {col: 18, row: 2},
    {col: 3, row: 4}, {col: 6, row: 4}, {col: 14, row: 4}, {col: 17, row: 4}
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
      if (onSubmitResultCallback) onSubmitResultCallback(false, carrying);
      return { cocok: false, bola: carrying };
    }
  }

  function draw(ctx) {
    // Soal di UI (jika lebih baik digambar di canvas)
    // Tapi karena ada banner, kita tampilkan saja via getProgressInfo

    // Gambar bola
    bolaList.forEach(b => {
      if (b.taken || b.submitted) return;
      const px = b.col * TILE + TILE / 2;
      const py = b.row * TILE + TILE / 2;
      const pulse = 7 + Math.sin(performance.now() / 220) * 1.4;
      ctx.beginPath();
      ctx.arc(px, py, pulse, 0, Math.PI * 2);
      ctx.fillStyle = "#3f9d8f"; // warna beda dari babak 1
      ctx.fill();
      ctx.font = "bold 9px 'Trebuchet MS', sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#fff";
      ctx.fillText(b.indo, px, py + 18);
    });
  }

  function drawCarried(ctx, playerX, playerY) {
    if (!carrying) return;
    ctx.beginPath();
    ctx.arc(playerX, playerY - 14, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#3f9d8f";
    ctx.fill();
    ctx.font = "bold 9px 'Trebuchet MS', sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.fillText(carrying.indo, playerX, playerY - 22);
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
