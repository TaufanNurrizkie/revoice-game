// client/js/maze.js
// Definisi grid maze + fungsi render dinding.
// Layout ala Pac-Man: lorong-lorong saling terhubung membentuk jaringan
// (bukan ruangan-ruangan kotak terpisah).
//
// Konsep "lubang submit" (mirip biliar) ada DI DALAM labirin ini sendiri,
// tepat di titik-titik dead-end/jalan buntu -- itu diatur & digambar oleh
// babak1.js, maze.js hanya menyediakan struktur labirinnya.
//
// Diekspos lewat window.Maze supaya bisa dipakai file lain tanpa module bundler.

window.Maze = (function () {
  const TILE = 26;
  const COLS = 21;
  const ROWS = 19;
  
  let grid = [];

  // Load tile image assets
  const images = {};
  const imageSources = {
    biasa: 'assets/tiles/tile_biasa.png',
    planet: 'assets/tiles/tile_planet.png',
    bintang: 'assets/tiles/tile_bintang.png',
    boost: 'assets/tiles/tile_boost.png',
    portal: 'assets/tiles/tile_portal.png',
    tujuan: 'assets/tiles/tile_tujuan.png'
  };

  for (let key in imageSources) {
    const img = new Image();
    img.src = imageSources[key];
    images[key] = img;
  }

  const defaultPattern = [
    "#####################",
    "#.........#.........#",
    "#.##.###.#.#.###.##.#",
    "#...................#",
    "#.##.#.#######.#.##.#",
    "#....#....#....#....#",
    "####.#.##.#.##.#.####",
    "####.#.##.#.##.#.####",
    "#........#..........#",
    "#.##.###.#.###.##.#.#",
    "#..#.....#.....#....#",
    "##.#.###.#.###.#.##.#",
    "#....#.......#......#",
    "#.##.#.#######.#.##.#",
    "#..#.....#.....#....#",
    "#.#.###.#.#.###.#.#.#",
    "#...................#",
    "#.#################.#",
    "#####################",
  ];

  function loadPattern(patternArray) {
    grid = [];
    for (let r = 0; r < ROWS; r++) {
      const line = patternArray[r] || "#####################";
      const row = [];
      for (let c = 0; c < COLS; c++) {
        const char = line[c] || '#';
        if (char === '.') row.push(0); // walkable
        else if (char === '~') row.push(2); // water
        else if (char === '=') row.push(3); // bridge
        else if (char === 'D') row.push(4); // door
        else row.push(1); // wall/default
      }
      grid.push(row);
    }
  }

  // Load default on start
  loadPattern(defaultPattern);

  function isWalkable(col, row) {
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return false;
    return grid[row][col] === 0 || grid[row][col] === 3 || grid[row][col] === 4;
  }

  function forceWalkable(col, row) {
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return;
    grid[row][col] = 0;
  }
  
  function setTile(col, row, val) {
    if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
      grid[row][col] = val;
    }
  }

  function draw(ctx) {
    // 1. Draw Space Background
    ctx.fillStyle = "#070412";
    ctx.fillRect(0, 0, COLS * TILE, ROWS * TILE);

    // Nebula glow blobs
    const glows = [
      { x: COLS*TILE*0.2, y: ROWS*TILE*0.25, r: COLS*TILE*0.7, c: "rgba(124,58,237," },
      { x: COLS*TILE*0.8, y: ROWS*TILE*0.75, r: COLS*TILE*0.6, c: "rgba(6,182,212,"  },
      { x: COLS*TILE*0.5, y: ROWS*TILE*0.5,  r: COLS*TILE*0.5, c: "rgba(236,72,153," },
    ];
    glows.forEach(function(g) {
      const grd = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.r);
      grd.addColorStop(0,   g.c + "0.10)");
      grd.addColorStop(0.5, g.c + "0.04)");
      grd.addColorStop(1,   g.c + "0)");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, COLS * TILE, ROWS * TILE);
    });

    // Twinkling stars
    for (let i = 0; i < 45; i++) {
      const sx = (Math.sin(i * 123.45) * 0.5 + 0.5) * (COLS * TILE);
      const sy = (Math.cos(i * 321.12) * 0.5 + 0.5) * (ROWS * TILE);
      const size = (Math.sin(i * 45) * 0.5 + 0.5) * 1.2 + 0.4;
      const t = performance.now() / 1500 + i;
      const twinkle = Math.sin(t * 3) * 0.5 + 0.5;
      const colors = ["255,255,255","255,219,102","108,255,232","176,102,255"];
      ctx.globalAlpha = 0.15 + twinkle * 0.75;
      ctx.fillStyle = "rgb(" + colors[i % colors.length] + ")";
      ctx.beginPath();
      ctx.arc(sx, sy, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    function drawTileImage(img, col, row) {
        if (!img || !img.complete || img.width === 0) return;
        const cropX = img.width * 0.12,  cropY = img.height * 0.12;
        const cropW = img.width * 0.76,  cropH = img.height * 0.76;
        ctx.drawImage(img, cropX, cropY, cropW, cropH, col * TILE, row * TILE, TILE, TILE);
    }

    // 2. Draw Maze Grid Using Assets
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const val = grid[r][c];

        // Draw Portal block at spawn point (1,1)
        if (r === 1 && c === 1) {
          if (images.portal && images.portal.complete) {
            drawTileImage(images.portal, c, r);
          }
          continue; 
        }

        if (val === 1) { // Wall
          const isBorder = (r === 0 || r === ROWS-1 || c === 0 || c === COLS-1);
          const seed = (c * 31 + r * 17) % 25;

          let tileType = "biasa";
          if (!isBorder) {
            if (seed === 0 || seed === 1) tileType = "planet";
            else if (seed === 2 || seed === 3) tileType = "bintang";
            else if (seed === 4 || seed === 5) tileType = "boost";
          }

          if (images[tileType] && images[tileType].complete && images[tileType].width > 0) {
            drawTileImage(images[tileType], c, r);
          } else {
            // fallback solid
            ctx.fillStyle = isBorder ? "#1a0a3a" : "#150d30";
            ctx.fillRect(c*TILE, r*TILE, TILE, TILE);
          }
          // border tint ungu
          if (isBorder) {
            ctx.fillStyle = "rgba(139,92,246,0.35)";
            ctx.fillRect(c*TILE, r*TILE, TILE, TILE);
          }

        } else if (val === 2) { // Water / energy barrier
          ctx.fillStyle = "#001a2e";
          ctx.fillRect(c*TILE, r*TILE, TILE, TILE);
          const wt = performance.now() / 600 + c * 0.5;
          ctx.strokeStyle = "rgba(0,229,255," + (0.5 + Math.sin(wt)*0.3) + ")";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(c*TILE, r*TILE + TILE/2 + Math.sin(wt)*3);
          ctx.lineTo(c*TILE + TILE, r*TILE + TILE/2 + Math.sin(wt+1)*3);
          ctx.stroke();

        } else if (val === 3) { // Bridge
          ctx.fillStyle = "#0a2040";
          ctx.fillRect(c*TILE, r*TILE, TILE, TILE);
          ctx.strokeStyle = "rgba(77,163,255,0.7)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(c*TILE + TILE*0.25, r*TILE);
          ctx.lineTo(c*TILE + TILE*0.25, r*TILE + TILE);
          ctx.moveTo(c*TILE + TILE*0.75, r*TILE);
          ctx.lineTo(c*TILE + TILE*0.75, r*TILE + TILE);
          ctx.stroke();

        } else if (val === 4) { // Goal / door
          if (images.tujuan && images.tujuan.complete && images.tujuan.width > 0) {
            drawTileImage(images.tujuan, c, r);
          }
        }
      }
    }
  }

  return { TILE, COLS, ROWS, get grid() { return grid; }, isWalkable, forceWalkable, setTile, loadPattern, draw };
})();
