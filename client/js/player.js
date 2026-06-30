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
      { col: 0, row: 2 },
      { col: 1, row: 2 },
    ],
    right: [
      { col: 2, row: 1 },
      { col: 3, row: 1 },
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
    isMoving: false,
    startCol: 1,
    startRow: 1,
    targetCol: 1,
    targetRow: 1,
  };

  loadCharacterImage(self.characterId);

  // remotePlayers: { socketId: { col, row, name, color, facing, characterId } }
  const remotePlayers = {};

  function syncPixel() {
    self.x = self.col * TILE + TILE / 2;
    self.y = self.row * TILE + TILE / 2;
    self.startCol = self.col;
    self.startRow = self.row;
    self.targetCol = self.col;
    self.targetRow = self.row;
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

  function teleport(col, row) {
    self.col = col;
    self.row = row;
    self.isMoving = false;
    self.moveTimer = 0;
    self.animFrame = 0;
    self.startCol = col;
    self.startRow = row;
    self.targetCol = col;
    self.targetRow = row;
    syncPixel();
    if (onMoveCallback) onMoveCallback(col, row, self.facing);
  }

  function update(dt, blocked) {
    // 1. Update local player movement interpolation
    if (self.isMoving) {
      self.moveTimer += dt;
      let t = self.moveTimer / self.moveInterval;
      if (t >= 1) {
        t = 1;
        self.isMoving = false;
        self.col = self.targetCol;
        self.row = self.targetRow;
        syncPixel();
        self.animFrame = 0;
      } else {
        const startX = self.startCol * TILE + TILE / 2;
        const startY = self.startRow * TILE + TILE / 2;
        const targetX = self.targetCol * TILE + TILE / 2;
        const targetY = self.targetRow * TILE + TILE / 2;
        self.x = startX + (targetX - startX) * t;
        self.y = startY + (targetY - startY) * t;
        
        // Cycle walking animation frames (0 or 1)
        self.animFrame = Math.round(t) % 2;
      }
    }

    // 2. Start a new move if not currently moving
    if (!self.isMoving) {
      if (blocked || !queuedDir) {
        self.animFrame = 0;
      } else {
        const v = dirVector(queuedDir);
        if (v.x !== 0 || v.y !== 0) {
          self.facing = queuedDir;
          const nc = self.col + v.x;
          const nr = self.row + v.y;
          if (window.Maze.isWalkable(nc, nr)) {
            self.isMoving = true;
            self.startCol = self.col;
            self.startRow = self.row;
            self.targetCol = nc;
            self.targetRow = nr;
            self.moveTimer = 0;
            self.animFrame = 0;
            if (window.AudioEngine) window.AudioEngine.play('move');
            if (onMoveCallback) onMoveCallback(self.targetCol, self.targetRow, self.facing);
          } else {
            self.animFrame = 0;
          }
        }
      }
    }

    // 3. Update remote players interpolation
    for (let id in remotePlayers) {
      const p = remotePlayers[id];
      if (p.lerpTimer < self.moveInterval) {
        p.lerpTimer += dt;
        let t = p.lerpTimer / self.moveInterval;
        if (t >= 1) {
          t = 1;
          p.x = p.targetX;
          p.y = p.targetY;
          p.animFrame = 0;
        } else {
          p.x = p.startX + (p.targetX - p.startX) * t;
          p.y = p.startY + (p.targetY - p.startY) * t;
          p.animFrame = Math.round(t) % 2;
        }
      } else {
        p.animFrame = 0;
      }
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
    const charData = window.getCharacterById(characterId);
    const frameSet = (charData.framesOverride && charData.framesOverride[facing])
      ? charData.framesOverride[facing]
      : (FRAMES[facing] || FRAMES.idle);
    const seq = frameSet;
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

  function draw(ctx, currentBabak) {
    const displaySize = TILE * 1.6; // sprite digambar sedikit lebih besar dari 1 tile biar terlihat jelas

    // render player lain (remote) dulu, supaya player sendiri tetap di atas/lebih jelas
    Object.values(remotePlayers).forEach(function (p) {
      if (p.babak === currentBabak) {
        drawSprite(
          ctx,
          p.x,
          p.y,
          p.characterId || "cat",
          p.facing || "down",
          p.animFrame || 0,
          displaySize,
          p.color,
        );
      }
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
      const p = playersObj[id];
      remotePlayers[id] = {
        col: p.col,
        row: p.row,
        x: p.col * TILE + TILE / 2,
        y: p.row * TILE + TILE / 2,
        startX: p.col * TILE + TILE / 2,
        startY: p.row * TILE + TILE / 2,
        targetX: p.col * TILE + TILE / 2,
        targetY: p.row * TILE + TILE / 2,
        lerpTimer: 120, // finished
        facing: p.facing || "down",
        characterId: p.characterId || "cat",
        animFrame: 0,
        color: p.color,
        name: p.name,
        babak: p.babak || 1,
      };
    });
  }
  function addRemotePlayer(id, data) {
    const px = data.col * TILE + TILE / 2;
    const py = data.row * TILE + TILE / 2;
    remotePlayers[id] = {
      col: data.col,
      row: data.row,
      x: px,
      y: py,
      startX: px,
      startY: py,
      targetX: px,
      targetY: py,
      lerpTimer: 120, // finished
      facing: data.facing || "down",
      characterId: data.characterId || "cat",
      animFrame: 0,
      color: data.color,
      name: data.name,
      babak: data.babak || 1,
    };
  }
  function updateRemotePlayer(id, col, row, facing, babak) {
    const p = remotePlayers[id];
    if (p) {
      p.col = col;
      p.row = row;
      p.startX = p.x;
      p.startY = p.y;
      p.targetX = col * TILE + TILE / 2;
      p.targetY = row * TILE + TILE / 2;
      p.lerpTimer = 0;
      if (facing) p.facing = facing;
      if (babak !== undefined) p.babak = babak;
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
    teleport,
  };
})();
