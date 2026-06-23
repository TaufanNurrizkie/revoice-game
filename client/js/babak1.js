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
    // gambar lubang submit sebagai "pocket" gelap (mirip lubang biliar) di tiap dead-end
    ZONA.forEach(function (z) {
      const isCurrentZona = currentZona === z;
      const px = z.col * TILE + TILE / 2;
      const py = z.row * TILE + TILE / 2;

      // lingkaran lubang -- gelap pekat, beda dari warna bola kata
      ctx.beginPath();
      ctx.arc(px, py, TILE * 0.42, 0, Math.PI * 2);
      ctx.fillStyle = isCurrentZona ? "#0a120d" : "#060907";
      ctx.fill();
      ctx.strokeStyle = isCurrentZona ? "#f0c468" : "#3a5a45";
      ctx.lineWidth = isCurrentZona ? 2 : 1.5;
      ctx.stroke();

      // label kata Inggris -- hanya ditonjolkan saat player berdiri di lubang ini
      ctx.font = "bold 9px 'Trebuchet MS', sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = isCurrentZona ? "#f0c468" : "#5a6e5f";
      ctx.fillText(z.inggris, px, py + TILE * 0.42 + 12);
    });

    // gambar bola yang belum diambil & belum submit (di dalam labirin)
    bolaList.forEach(function (b) {
      if (b.taken || b.submitted) return;
      const px = b.col * TILE + TILE / 2;
      const py = b.row * TILE + TILE / 2;
      const pulse = 7 + Math.sin(performance.now() / 220) * 1.4;
      ctx.beginPath();
      ctx.arc(px, py, pulse, 0, Math.PI * 2);
      ctx.fillStyle = "#e08a3c";
      ctx.fill();
      ctx.font = "bold 9px 'Trebuchet MS', sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#1c2b24";
      ctx.fillText(b.indo, px, py + 18);
    });
  }

  function drawCarried(ctx, playerX, playerY) {
    if (!carrying) return;
    ctx.beginPath();
    ctx.arc(playerX, playerY - 14, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#e08a3c";
    ctx.fill();
    ctx.font = "bold 9px 'Trebuchet MS', sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#1c2b24";
    ctx.fillText(carrying.indo, playerX, playerY - 22);
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
