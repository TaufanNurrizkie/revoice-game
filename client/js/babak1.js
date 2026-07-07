// client/js/babak1.js
// BABAK 1 — "Jejak Kata" (carry-and-match, ala biliar)
//
// Mekanik:
// 1. Beberapa bola kata Indonesia tersebar DI DALAM labirin (player jalan bebas
//    di lorong-lorong ala Pac-Man untuk menemukannya).
// 2. Player jalan mendekati bola -> otomatis "membawa" bola itu (maksimal 1 bola sekaligus).
// 3. LUBANG SUBMIT ada DI DALAM labirin, tepat di titik-titik dead-end/jalan buntu
//    (seperti pocket meja biliar di ujung lorong). Tiap lubang punya 1 kata Inggris tetap.
// 4. Begitu player BERDIRI tepat di depan/di lubang itu sambil membawa bola, label kata
//    Inggris lubang tersebut ditampilkan di banner (supaya player bisa menilai sendiri
//    apakah cocok dengan bola yang dibawa).
// 5. Tekan tombol/Spasi untuk SUBMIT (mendorong bola masuk ke lubang). Kalau cocok ->
//    bola hilang (submitted), tercatat ke sistem. Kalau tidak cocok -> bola tetap dibawa,
//    player jalan ke lubang lain untuk coba lagi.
//
// Catatan desain: submit yang salah TIDAK mengurangi nyawa di Babak 1 -- babak ini murni
// pencocokan kosakata, bukan kuis benar-salah berisiko.

window.Babak1 = (function () {
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
    ctx.moveTo(0, -14);         // nose tip
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
  orbImg.src = "assets/sprites/orb-orange.png";

  // ---------- Data pasangan kata (Indonesia -> Inggris) ----------
  const PASANGAN_POOL = [
    { indo: "Sibuk", inggris: "Hectic" },
    { indo: "Secara Harfiah", inggris: "Literally" },
    { indo: "Wawasan", inggris: "Insight" },
    { indo: "Batasan", inggris: "Boundary" },
    { indo: "Umpan Balik", inggris: "Feedback" },
    { indo: "Tantangan", inggris: "Challenge" },
    { indo: "Dukungan", inggris: "Support" },
    { indo: "Dampak", inggris: "Impact" },
    { indo: "Strategi", inggris: "Strategy" },
    { indo: "Inovasi", inggris: "Innovation" },
    { indo: "Kolaborasi", inggris: "Collaboration" },
    { indo: "Motivasi", inggris: "Motivation" },
    { indo: "Prioritas", inggris: "Priority" },
    { indo: "Solusi", inggris: "Solution" },
    { indo: "Konsistensi", inggris: "Consistency" },
    { indo: "Perspektif", inggris: "Perspective" },
    { indo: "Kreativitas", inggris: "Creativity" },
    { indo: "Adaptasi", inggris: "Adaptation" },
    { indo: "Komunikasi", inggris: "Communication" },
    { indo: "Kepercayaan", inggris: "Trust" },
    { indo: "Kemampuan", inggris: "Ability" },
    { indo: "Pencapaian", inggris: "Achievement" },
    { indo: "Kesadaran", inggris: "Awareness" },
    { indo: "Keseimbangan", inggris: "Balance" },
    { indo: "Perilaku", inggris: "Behavior" },
    { indo: "Pilihan", inggris: "Choice" },
    { indo: "Kejelasan", inggris: "Clarity" },
    { indo: "Komitmen", inggris: "Commitment" },
    { indo: "Kepercayaan Diri", inggris: "Confidence" },
    { indo: "Koneksi", inggris: "Connection" },
    { indo: "Konteks", inggris: "Context" },
    { indo: "Budaya", inggris: "Culture" },
    { indo: "Keputusan", inggris: "Decision" },
    { indo: "Perkembangan", inggris: "Development" },
    { indo: "Perbedaan", inggris: "Difference" },
    { indo: "Usaha", inggris: "Effort" },
    { indo: "Emosi", inggris: "Emotion" },
    { indo: "Lingkungan", inggris: "Environment" },
    { indo: "Pengalaman", inggris: "Experience" },
    { indo: "Ekspresi", inggris: "Expression" },
    { indo: "Kebebasan", inggris: "Freedom" },
    { indo: "Pertumbuhan", inggris: "Growth" },
    { indo: "Kebiasaan", inggris: "Habit" },
    { indo: "Kebahagiaan", inggris: "Happiness" },
    { indo: "Identitas", inggris: "Identity" },
    { indo: "Imajinasi", inggris: "Imagination" },
    { indo: "Dampak", inggris: "Influence" },
    { indo: "Kecerdasan", inggris: "Intelligence" },
    { indo: "Niat", inggris: "Intention" },
    { indo: "Intuisi", inggris: "Intuition" },
    { indo: "Penilaian", inggris: "Judgment" },
    { indo: "Pengetahuan", inggris: "Knowledge" },
    { indo: "Kepemimpinan", inggris: "Leadership" },
    { indo: "Pembelajaran", inggris: "Learning" },
    { indo: "Logika", inggris: "Logic" },
    { indo: "Makna", inggris: "Meaning" },
    { indo: "Ingatan", inggris: "Memory" },
    { indo: "Pola Pikir", inggris: "Mindset" },
    { indo: "Kebutuhan", inggris: "Need" },
    { indo: "Jaringan", inggris: "Network" },
    { indo: "Peluang", inggris: "Opportunity" },
    { indo: "Organisasi", inggris: "Organization" },
    { indo: "Pola", inggris: "Pattern" },
    { indo: "Ketekunan", inggris: "Persistence" },
    { indo: "Potensi", inggris: "Potential" },
    { indo: "Proses", inggris: "Process" },
    { indo: "Kemajuan", inggris: "Progress" },
    { indo: "Tujuan", inggris: "Purpose" },
    { indo: "Hubungan", inggris: "Relationship" },
    { indo: "Ketahanan", inggris: "Resilience" },
    { indo: "Tanggung Jawab", inggris: "Responsibility" },
    { indo: "Risiko", inggris: "Risk" },
    { indo: "Keamanan", inggris: "Safety" },
    { indo: "Kepuasan", inggris: "Satisfaction" },
    { indo: "Keahlian", inggris: "Skill" },
    { indo: "Kekuatan", inggris: "Strength" },
    { indo: "Kesuksesan", inggris: "Success" },
    { indo: "Sistem", inggris: "System" },
    { indo: "Bakat", inggris: "Talent" },
    { indo: "Teknik", inggris: "Technique" },
    { indo: "Teknologi", inggris: "Technology" },
    { indo: "Pikiran", inggris: "Thought" },
    { indo: "Waktu", inggris: "Time" },
    { indo: "Nilai", inggris: "Value" },
    { indo: "Visi", inggris: "Vision" },
    { indo: "Kemauan", inggris: "Willingness" },
    { indo: "Kebijaksanaan", inggris: "Wisdom" },
  ];

  // Ambil 5 soal acak dari pool
  function pickRandom(pool, n) {
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, n);
  }

  let PASANGAN = pickRandom(PASANGAN_POOL, 5);

  // ---------- Posisi bola kata DI DALAM labirin (titik aman di lorong) ----------
  const bolaPositions = [
    { col: 3, row: 1 },
    { col: 19, row: 5 },
    { col: 15, row: 1 },
    { col: 15, row: 16 },
    { col: 16, row: 8 },
  ];

  // ---------- Lubang submit, ditempatkan di titik DEAD-END di dalam labirin ----------
  // Koordinat ini diambil dari hasil analisis pola maze.js -- titik dengan tepat
  // 1 jalan keluar (jalan buntu), persis seperti pocket di ujung lorong biliar.
  const LUBANG_POS = [
    { col: 9, row: 1 },
    { col: 19, row: 17 },
    { col: 1, row: 17 },
    { col: 9, row: 7 },
    { col: 15, row: 15 },
  ];

  const ZONA = LUBANG_POS.map(function (pos, i) {
    return {
      nama: "Lubang " + (i + 1),
      col: pos.col,
      row: pos.row,
      inggris: null,
    };
  });

  // Acak penempatan kata Inggris ke tiap lubang — dipanggil ulang tiap init()
  function shuffleLubangWords() {
    const words = PASANGAN.map(function (p) { return p.inggris; });
    for (let i = words.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = words[i]; words[i] = words[j]; words[j] = tmp;
    }
    ZONA.forEach(function (z, i) { z.inggris = words[i]; });
  }

  let bolaList = [];
  let carrying = null;
  let currentZona = null;
  let onAllSubmittedCallback = null;
  let onSubmitResultCallback = null;

  function init() {
    PASANGAN = pickRandom(PASANGAN_POOL, 5); // Acak ulang tiap init
    shuffleLubangWords(); // Assign ulang kata ke roket sesuai PASANGAN baru
    bolaList = PASANGAN.map(function (p, i) {
      return {
        indo: p.indo,
        inggris: p.inggris,
        col: bolaPositions[i].col,
        row: bolaPositions[i].row,
        taken: false,
        submitted: false,
      };
    });
    bolaList.forEach(function (b) {
      window.Maze.forceWalkable(b.col, b.row);
    });
    ZONA.forEach(function (z) {
      window.Maze.forceWalkable(z.col, z.row);
    });

    carrying = null;
    currentZona = null;
  }

  function findZonaAt(col, row) {
    return (
      ZONA.find(function (z) {
        return z.col === col && z.row === row;
      }) || null
    );
  }

  // Dipanggil tiap kali player berpindah grid (dari main.js)
  function onPlayerMove(col, row) {
    if (!carrying) {
      const target = bolaList.find(function (b) {
        return !b.taken && !b.submitted && b.col === col && b.row === row;
      });
      if (target) {
        target.taken = true;
        carrying = target;
        if (window.AudioEngine) window.AudioEngine.play('pickup');
      }
    }
    currentZona = findZonaAt(col, row);
  }

  function trySubmit() {
    if (!carrying || !currentZona) return null;

    const cocok = carrying.inggris === currentZona.inggris;
    if (cocok) {
      carrying.submitted = true;
      const submitted = carrying;
      carrying = null;
      if (onSubmitResultCallback) onSubmitResultCallback(true, submitted);
      if (
        bolaList.every(function (b) {
          return b.submitted;
        })
      ) {
        if (onAllSubmittedCallback) onAllSubmittedCallback();
      }
      return { cocok: true, bola: submitted };
    } else {
      if (onSubmitResultCallback) onSubmitResultCallback(false, carrying);
      return { cocok: false, bola: carrying };
    }
  }

  // ---------- Render ----------
  function draw(ctx) {
    // gambar lubang submit sebagai Basket Buah di tiap dead-end
    ZONA.forEach(function (z) {
      const isCurrentZona = currentZona === z;
      const px = z.col * TILE + TILE / 2;
      const py = z.row * TILE + TILE / 2;
      
      drawBasket(ctx, px, py, isCurrentZona, "rgba(240, 138, 60, 0.45)");

      // label kata Inggris -- hanya ditonjolkan saat player berdiri di lubang ini
      ctx.font = "bold 9px 'Trebuchet MS', sans-serif";
      ctx.textAlign = "center";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#1b3821";
      ctx.strokeText(z.inggris, px, py + TILE * 0.42 + 12);
      ctx.fillStyle = isCurrentZona ? "#ffd700" : "#a8d5b2";
      ctx.fillText(z.inggris, px, py + TILE * 0.42 + 12);
    });

    // gambar buah apel yang belum diambil (di dalam labirin)
    bolaList.forEach(function (b) {
      if (b.taken || b.submitted) return;
      const px = b.col * TILE + TILE / 2;
      const py = b.row * TILE + TILE / 2;
      const size = 16 + Math.sin(performance.now() / 220) * 2; // Pulsing size
      
      drawFruit(ctx, px, py, size, "orange");

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
    
    drawFruit(ctx, ox, oy, size, "orange");
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

  function getProgress() {
    const total = bolaList.length;
    const done = bolaList.filter(function (b) {
      return b.submitted;
    }).length;
    return { done, total };
  }

  function isCarrying() {
    return !!carrying;
  }
  function getCurrentZona() {
    return currentZona;
  }

  return {
    init,
    onPlayerMove,
    trySubmit,
    draw,
    drawCarried,
    getProgress,
    isCarrying,
    getCurrentZona,
    onAllSubmitted: function (cb) {
      onAllSubmittedCallback = cb;
    },
    onSubmitResult: function (cb) {
      onSubmitResultCallback = cb;
    },
  };
})();
