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
    ctx.fillStyle = "#0B1026";
    ctx.fillRect(0, 0, COLS * TILE, ROWS * TILE);

    // Nebula effect
    const g1 = ctx.createRadialGradient(COLS*TILE*0.3, ROWS*TILE*0.3, 0, COLS*TILE*0.3, ROWS*TILE*0.3, COLS*TILE*0.8);
    g1.addColorStop(0, "rgba(77, 163, 255, 0.15)");
    g1.addColorStop(1, "rgba(77, 163, 255, 0)");
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, COLS * TILE, ROWS * TILE);

    const g2 = ctx.createRadialGradient(COLS*TILE*0.7, ROWS*TILE*0.8, 0, COLS*TILE*0.7, ROWS*TILE*0.8, COLS*TILE*0.7);
    g2.addColorStop(0, "rgba(176, 102, 255, 0.12)");
    g2.addColorStop(1, "rgba(176, 102, 255, 0)");
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, COLS * TILE, ROWS * TILE);

    // Global stars
    for (let i = 0; i < 45; i++) {
      const sx = (Math.sin(i * 123.45) * 0.5 + 0.5) * (COLS * TILE);
      const sy = (Math.cos(i * 321.12) * 0.5 + 0.5) * (ROWS * TILE);
      const size = (Math.sin(i * 45) * 0.5 + 0.5) * 1.2 + 0.5;
      
      const t = performance.now() / 1500 + i;
      const twinkle = Math.sin(t * 3) * 0.5 + 0.5;
      
      let starColor = "#FFFFFF";
      if (i % 3 === 0) starColor = "#FFDB66";
      if (i % 4 === 0) starColor = "#6CFFE8";
      if (i % 5 === 0) starColor = "#B066FF";
      
      ctx.globalAlpha = 0.2 + twinkle * 0.8;
      ctx.fillStyle = starColor;
      ctx.beginPath();
      ctx.arc(sx, sy, size, 0, Math.PI * 2);
      ctx.fill();
      
      if (twinkle > 0.7 && size > 1) {
        ctx.shadowColor = starColor;
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
    ctx.globalAlpha = 1.0;

    // Helper to draw tile images cropped to remove AI-generated borders
    function drawTileImage(img, col, row) {
        if (!img || !img.complete || img.width === 0) return;
        const offset = 0; // No overlap, perfect uniform size
        const cropX = img.width * 0.12;
        const cropY = img.height * 0.12;
        const cropW = img.width * 0.76;
        const cropH = img.height * 0.76;
        ctx.drawImage(
           img, 
           cropX, cropY, cropW, cropH, 
           col * TILE - offset, row * TILE - offset, TILE + offset*2, TILE + offset*2
        );
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

        if (val === 1) { // Wall (Kotak Biasa / Border)
          let isBorder = (r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1);
          const seed = (c * 31 + r * 17) % 25;
          
          let tileType = "biasa";
          if (!isBorder) {
              if (seed === 0 || seed === 1) tileType = "planet";
              else if (seed === 2 || seed === 3) tileType = "bintang";
              else if (seed === 4 || seed === 5) tileType = "boost";
          }
          
          if (images[tileType] && images[tileType].complete) {
             drawTileImage(images[tileType], c, r);
             // Tint border purple since tile_border generation failed and we reuse biasa
             if (isBorder && tileType === "biasa") {
                ctx.fillStyle = "rgba(176, 102, 255, 0.4)";
                const offset = 0;
                ctx.fillRect(c * TILE - offset, r * TILE - offset, TILE + offset*2, TILE + offset*2);
             }
          }

        } else if (val === 2) { // Water (Sci-fi energy)
          ctx.fillStyle = "#00E5FF";
          ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
          ctx.strokeStyle = "#FFFFFF";
          ctx.beginPath();
          ctx.moveTo(c * TILE, r * TILE + TILE/2);
          ctx.lineTo(c * TILE + TILE, r * TILE + TILE/2);
          ctx.stroke();
        } else if (val === 3) { // Bridge (Sci-fi bridge)
          ctx.fillStyle = "#4DA3FF";
          ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
          ctx.strokeStyle = "#00E5FF";
          ctx.beginPath();
          ctx.moveTo(c * TILE + TILE * 0.2, r * TILE);
          ctx.lineTo(c * TILE + TILE * 0.2, r * TILE + TILE);
          ctx.moveTo(c * TILE + TILE * 0.8, r * TILE);
          ctx.lineTo(c * TILE + TILE * 0.8, r * TILE + TILE);
          ctx.stroke();
        } else if (val === 4) { // Door (Tujuan / Goal - Orange)
          if (images.tujuan && images.tujuan.complete) {
             drawTileImage(images.tujuan, c, r);
          }
        }
      }
    }
  }

  return { TILE, COLS, ROWS, get grid() { return grid; }, isWalkable, forceWalkable, setTile, loadPattern, draw };
})();
