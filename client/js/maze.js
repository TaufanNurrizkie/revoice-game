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
  const TILE = 22;
  const COLS = 21;
  const ROWS = 19;
  
  let grid = [];

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
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const val = grid[r][c];
        if (val === 1) { // Wall (Minimal Garden Hedge with occasional flowers/details)
          // Ground base under hedges
          ctx.fillStyle = "#142618";
          ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
          
          // Clean hedge block with rounded corners
          ctx.fillStyle = "#254c2d";
          const margin = 1;
          const rx = c * TILE + margin;
          const ry = r * TILE + margin;
          const rw = TILE - margin * 2;
          const rh = TILE - margin * 2;
          const rad = 4; // corner radius
          
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(rx, ry, rw, rh, rad);
          } else {
            ctx.rect(rx, ry, rw, rh);
          }
          ctx.fill();
          
          // Simple inner highlight for 3D depth (soft top-left inner border)
          ctx.strokeStyle = "#32663d";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(rx + rad, ry + 1.5);
          ctx.lineTo(rx + rw - rad, ry + 1.5);
          ctx.moveTo(rx + 1.5, ry + rad);
          ctx.lineTo(rx + 1.5, ry + rh - rad);
          ctx.stroke();

          // Decide variety decoration based on coordinates (deterministic pseudo-random)
          const seed = (c * 17 + r * 23) % 10;
          if (seed === 0) {
            // Draw 1-2 tiny flowers
            ctx.fillStyle = (c + r) % 2 === 0 ? "#ffd700" : "#e95c5c"; // yellow or red flower
            ctx.beginPath();
            ctx.arc(rx + rw * 0.35, ry + rh * 0.4, 1.8, 0, Math.PI * 2);
            ctx.fill();
            
            // Flower center
            ctx.fillStyle = "#fff";
            ctx.beginPath();
            ctx.arc(rx + rw * 0.35, ry + rh * 0.4, 0.6, 0, Math.PI * 2);
            ctx.fill();

            // A second flower on some
            if (c % 2 === 0) {
              ctx.fillStyle = "#e286e2"; // pink flower
              ctx.beginPath();
              ctx.arc(rx + rw * 0.65, ry + rh * 0.65, 1.8, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = "#fff";
              ctx.beginPath();
              ctx.arc(rx + rw * 0.65, ry + rh * 0.65, 0.6, 0, Math.PI * 2);
              ctx.fill();
            }
          } else if (seed === 1) {
            // Draw a cute small leaf detail inside the hedge
            ctx.fillStyle = "#417a4c"; // lighter leaf green
            ctx.beginPath();
            ctx.ellipse(rx + rw * 0.5, ry + rh * 0.45, 3.5, 1.8, Math.PI / 4, 0, Math.PI * 2);
            ctx.ellipse(rx + rw * 0.35, ry + rh * 0.55, 3, 1.5, -Math.PI / 6, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (val === 2) { // Water
          // Gambar animasi sungai sederhana (bergerak horizontal)
          const offset = (performance.now() / 40) % TILE;
          ctx.fillStyle = "#103c54";
          ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
          ctx.strokeStyle = "#1c5d80";
          ctx.beginPath();
          ctx.moveTo(c * TILE, r * TILE + TILE/2);
          ctx.lineTo(c * TILE + TILE, r * TILE + TILE/2);
          ctx.stroke();
        } else if (val === 3) { // Bridge
          ctx.fillStyle = "#7a5c43"; // warna kayu
          ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
          // Garis papan kayu
          ctx.strokeStyle = "#4a3320";
          ctx.beginPath();
          ctx.moveTo(c * TILE + TILE * 0.2, r * TILE);
          ctx.lineTo(c * TILE + TILE * 0.2, r * TILE + TILE);
          ctx.moveTo(c * TILE + TILE * 0.8, r * TILE);
          ctx.lineTo(c * TILE + TILE * 0.8, r * TILE + TILE);
          ctx.stroke();
        } else if (val === 4) { // Door
          ctx.fillStyle = "#5c4033"; // dark brown frame
          ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
          ctx.fillStyle = "#a0522d"; // sienna inner
          ctx.fillRect(c * TILE + 2, r * TILE + 2, TILE - 4, TILE - 2);
          // Knob
          ctx.fillStyle = "#ffd700";
          ctx.beginPath();
          ctx.arc(c * TILE + TILE - 5, r * TILE + TILE / 2, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  return { TILE, COLS, ROWS, get grid() { return grid; }, isWalkable, forceWalkable, setTile, loadPattern, draw };
})();
