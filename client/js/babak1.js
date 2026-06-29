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
  orbImg.src = "assets/sprites/orb-orange.png";

  // ---------- Data pasangan kata (Indonesia -> Inggris) ----------
  const PASANGAN = [
    { indo: "Sibuk", inggris: "Hectic" },
    { indo: "Secara Harfiah", inggris: "Literally" },
    { indo: "Wawasan", inggris: "Insight" },
    { indo: "Batasan", inggris: "Boundary" },
    { indo: "Umpan Balik", inggris: "Feedback" },
  ];

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

  // Acak penempatan kata Inggris ke tiap lubang (tetap selama 1 sesi)
  (function shuffleLubangWords() {
    const words = PASANGAN.map(function (p) {
      return p.inggris;
    });
    for (let i = words.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = words[i];
      words[i] = words[j];
      words[j] = tmp;
    }
    ZONA.forEach(function (z, i) {
      z.inggris = words[i];
    });
  })();

  let bolaList = [];
  let carrying = null;
  let currentZona = null;
  let onAllSubmittedCallback = null;
  let onSubmitResultCallback = null;

  function init() {
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
