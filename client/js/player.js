// client/js/player.js
// Mengatur posisi player sendiri (lokal) dan render player lain (remote, dari Socket.io).
// Render karakter memakai sprite sheet sesuai pilihan di halaman pilih-karakter.html
// (client/assets/sprites/<id>-player.png) dengan animasi arah idle/atas/bawah/kiri/kanan,
// fallback ke blob warna kalau gambar belum termuat atau karakter belum dipilih.

window.PlayerModule = (function () {
  const TILE = window.Maze.TILE;
  const FRAME = 64; // ukuran tiap frame di sprite sheet (lihat catatan layout di bawah)

  // ---------- Layout sprite sheet ----------
  // Grid 4 kolom x 3 baris, tiap sel 64x64px:
  //   row0: idle, down_1, down_2, (kosong)
  //   row1: up_1, up_2, left_1, left_2
  //   row2: right_1, right_2, (kosong), (kosong)
  const FRAMES = {
    idle: [{ col: 0, row: 0 }],
    down: [
      { col: 1, row: 0 },
      { col: 2, row: 0 },
    ],
    up: [
      { col: 0, row: 1 },
      { col: 1, row: 1 },
    ],
    left: [
      { col: 2, row: 1 },
      { col: 2, row: 2 },
    ],
    right: [
      { col: 0, row: 2 },
      { col: 1, row: 3 },
    ],
  };

  // ---------- Cache image per karakter, supaya sprite yang sama tidak di-load ulang ----------
  const imageCache = {}; // { characterId: { img: Image, loaded: bool } }

  function loadCharacterImage(characterId) {
    if (imageCache[characterId]) return imageCache[characterId];

    const charData = window.getCharacterById(characterId);
    const entry = { img: new Image(), loaded: false };
    entry.img.onload = function () {
      entry.loaded = true;
    };
    entry.img.onerror = function () {
      console.warn(
        'Sprite "' + characterId + '" gagal dimuat, fallback ke blob warna.',
      );
    };
    entry.img.src = charData.sprite;

    imageCache[characterId] = entry;
    return entry;
  }

  // karakter yang dipilih player di halaman pilih-karakter.html (default ke karakter pertama kalau tidak ada)
  const myCharacterId =
    sessionStorage.getItem("revoice_characterId") ||
    (window.CHARACTERS && window.CHARACTERS[0]
      ? window.CHARACTERS[0].id
      : "cat");

  const self = {
    col: 1,
    row: 1,
    x: 0,
    y: 0,
    moveTimer: 0,
    moveInterval: 120,
    color: "#d9534f",
    characterId: myCharacterId,
    facing: "down", // arah hadap terakhir, dipakai untuk pilih baris sprite
    animFrame: 0,
  };

  loadCharacterImage(self.characterId);

  // remotePlayers: { socketId: { col, row, name, color, facing, characterId } }
  const remotePlayers = {};

  function syncPixel() {
    self.x = self.col * TILE + TILE / 2;
    self.y = self.row * TILE + TILE / 2;
  }
  syncPixel();
  window.Maze.forceWalkable(self.col, self.row);

  let queuedDir = null;
  let onMoveCallback = null; // dipanggil setiap kali player berhasil pindah grid (untuk kirim ke server)

  function dirVector(d) {
    if (d === "up") return { x: 0, y: -1 };
    if (d === "down") return { x: 0, y: 1 };
    if (d === "left") return { x: -1, y: 0 };
    if (d === "right") return { x: 1, y: 0 };
    return { x: 0, y: 0 };
  }

  function setQueuedDir(dir) {
    queuedDir = dir;
  }

  function update(dt, blocked) {
    if (blocked || !queuedDir) {
      self.animFrame = 0;
      return;
    }

    const v = dirVector(queuedDir);
    if (v.x === 0 && v.y === 0) return;

    self.facing = queuedDir;

    self.moveTimer += dt;
    if (self.moveTimer < self.moveInterval) return;

    const nc = self.col + v.x;
    const nr = self.row + v.y;

    if (window.Maze.isWalkable(nc, nr)) {
      self.col = nc;
      self.row = nr;
      syncPixel();
      self.moveTimer = 0;
      self.animFrame = 1 - self.animFrame; // toggle frame jalan HANYA saat benar-benar berpindah tile
      if (onMoveCallback) onMoveCallback(self.col, self.row, self.facing);
    } else {
      self.moveTimer = self.moveInterval;
      self.animFrame = 0; // diam di tempat (ketabrak dinding) -> tampilkan frame diam, bukan animasi jalan
    }
  }

  function drawBlob(ctx, x, y, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 6.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1c2b24";
    ctx.beginPath();
    ctx.arc(-2.5, -1, 1.2, 0, Math.PI * 2);
    ctx.arc(2.5, -1, 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Gambar sprite karakter pada posisi (x,y) tile-center, dengan arah & frame animasi tertentu.
  // displaySize menentukan seberapa besar sprite digambar (dalam pixel canvas).
  function drawSprite(
    ctx,
    x,
    y,
    characterId,
    facing,
    animFrame,
    displaySize,
    fallbackColor,
  ) {
    const entry = loadCharacterImage(characterId);
    if (!entry.loaded) {
      drawBlob(ctx, x, y, fallbackColor || "#d9534f");
      return;
    }
    const seq = FRAMES[facing] || FRAMES.idle;
    const frame = seq[animFrame % seq.length];

    ctx.drawImage(
      entry.img,
      frame.col * FRAME,
      frame.row * FRAME,
      FRAME,
      FRAME, // source rect di sprite sheet
      x - displaySize / 2,
      y - displaySize / 2 - displaySize * 0.15,
      displaySize,
      displaySize, // tujuan di canvas (sedikit naik biar "kaki" pas di tile)
    );
  }

  function draw(ctx) {
    const displaySize = TILE * 1.6; // sprite digambar sedikit lebih besar dari 1 tile biar terlihat jelas

    // render player lain (remote) dulu, supaya player sendiri tetap di atas/lebih jelas
    Object.values(remotePlayers).forEach(function (p) {
      const px = p.col * TILE + TILE / 2;
      const py = p.row * TILE + TILE / 2;
      drawSprite(
        ctx,
        px,
        py,
        p.characterId || "cat",
        p.facing || "down",
        p.animFrame || 0,
        displaySize,
        p.color,
      );
    });

    drawSprite(
      ctx,
      self.x,
      self.y,
      self.characterId,
      self.facing,
      self.animFrame,
      displaySize,
      self.color,
    );
  }

  // --- fungsi untuk dipanggil dari socket-client.js ---
  function setRoomState(playersObj) {
    Object.keys(playersObj).forEach(function (id) {
      remotePlayers[id] = playersObj[id];
    });
  }
  function addRemotePlayer(id, data) {
    remotePlayers[id] = data;
  }
  function updateRemotePlayer(id, col, row, facing) {
    if (remotePlayers[id]) {
      const p = remotePlayers[id];
      if (p.col !== col || p.row !== row) {
        p.animFrame = 1 - (p.animFrame || 0);
      }
      p.col = col;
      p.row = row;
      if (facing) p.facing = facing;
    }
  }
  function removeRemotePlayer(id) {
    delete remotePlayers[id];
  }

  return {
    self,
    setQueuedDir,
    update,
    draw,
    onMove: function (cb) {
      onMoveCallback = cb;
    },
    setRoomState,
    addRemotePlayer,
    updateRemotePlayer,
    removeRemotePlayer,
  };
})();
