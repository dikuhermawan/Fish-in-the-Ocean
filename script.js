// --- Konfigurasi Game ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gravity = 0.36;
const fishJump = -6.6;
const coralGap = 160;
const coralWidth = 66;
const coralInterval = 1450; // ms Antar Obstacle
const coralSpeed = 2.28;

const fish = {
  x: 76,
  y: 260,
  size: 34,
  velocity: 0
};

let corals = [];
let score = 0;
let gameOn = false;
let gameOver = false;
let flew = false;
let interval;
let lastCoral = Date.now();
const scoreDiv = document.getElementById('score');
const startText = document.getElementById('start-text');
const gameOverDiv = document.getElementById('game-over');
const finalScore = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');

// --- Event Tombol ---
document.addEventListener('keydown', function(e) {
  if (e.code === 'Space') {
    // Jika sedang game over, restart (sembunyikan notifikasi skor)
    if (gameOver) restartGame();
    else if (!gameOn) startGame();
    fishFly();
    e.preventDefault();
  }
});
canvas.addEventListener('mousedown', () => {
  if (gameOver) restartGame();
  else if (!gameOn) startGame();
  fishFly();
});
canvas.addEventListener('touchstart', evt => {
  evt.preventDefault();
  if (gameOver) restartGame();
  else if (!gameOn) startGame();
  fishFly();
});

// Start & Restart Button
restartBtn.onclick = restartGame;

function startGame() {
  reset();
  gameOn = true;
  // Pastikan apakah sebelumnya overlay game over tampil, kita sembunyikan
  gameOverDiv.style.display = 'none';
  startText.style.display = 'none';
  interval = setInterval(loop, 1000/60); // ~60fps
}

function restartGame() {
  gameOverDiv.style.display = 'none';
  startGame();
}

function reset() {
  // Posisi awal ikan
  fish.y = 260;
  fish.velocity = 0;
  score = 0;
  corals = [];
  lastCoral = Date.now();
  gameOver = false;
  flew = false;
  scoreDiv.textContent = "0";
}

// Ini dipanggil waktu klik/tekan spasi
function fishFly() {
  if (gameOver) return;
  if (!flew) flew = true;
  fish.velocity = fishJump;
}

// Generator warna coral/karang-rumput secara random (green/biru/ungu)
function randomCoralColor() {
  const colors = ['#48cf61', '#19a799', '#3659d2', '#c059f6', "#10ecce"];
  return colors[Math.floor(Math.random()*colors.length)];
}

// MAIN LOOP
function loop() {
  // Gambar background laut
  drawBackground();

  // Gambar ikan kecil
  fish.velocity += gravity; // gravitasi
  fish.y += fish.velocity;
  drawFish();

  // Buat obstacle secara berkala
  if (Date.now() - lastCoral > coralInterval) {
    addCoral();
    lastCoral = Date.now();
  }

  // Geser & Gambar Obstacle
  for (let i=corals.length-1; i>=0; i--) {
    corals[i].x -= coralSpeed;
    drawCoral(corals[i]);

    // Cek tabrakan (collision)
    if (checkCollision(corals[i])) {
      endGame();
      return;
    }

    // Tambah skor jika sudah melewati obstacle
    if (!corals[i].passed && corals[i].x + coralWidth < fish.x) {
      score++;
      corals[i].passed = true;
      scoreDiv.textContent = score;
    }

    // Buang coral jika sudah di luar layar
    if (corals[i].x + coralWidth < 0) {
      corals.splice(i,1);
    }
  }

  // Cek jika jatuh di bawah laut atau terbang terlalu atas
  if (fish.y + fish.size > canvas.height || fish.y - fish.size < 0) {
    endGame();
    return;
  }
}

// --- Gambar Elemen Game di Canvas ---

function drawBackground() {
  // Biru bawah laut gradasi sederhana
  var grad = ctx.createLinearGradient(0,0,0,canvas.height);
  grad.addColorStop(0,"#72d3f7");
  grad.addColorStop(0.25,"#38ade3");
  grad.addColorStop(0.55,"#2482b1");
  grad.addColorStop(1,"#235085");

  ctx.fillStyle = grad;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // gelembung kecil
  for (let b=0; b<9; b++) {
    ctx.beginPath();
    let bx = (b*71+b*sevSeed(fish.y))%canvas.width;
    let by = (b*b*59 + Date.now()/40 + fish.y*0.9)%canvas.height;
    ctx.arc(bx, by, 6+(b%2?2:0), 0, Math.PI*2);
    ctx.strokeStyle = '#fff8';
    ctx.stroke();
    ctx.closePath();
  }
}

// Simple peredam masa waktu
function sevSeed(v) {return Math.abs(Math.sin(v))*42;}

// --- Menggambar Ikan ---
function drawFish() {
  ctx.save();
  ctx.translate(fish.x, fish.y);
  ctx.rotate(Math.min(fish.velocity / 22, 0.22)); // dikit doang miring
  // Badan
  ctx.beginPath();
  ctx.ellipse(0, 0, 19, 13.5, 0, 0, Math.PI*2);
  ctx.fillStyle = "#fec676";
  ctx.shadowColor ="#ecae48e6";
  ctx.shadowBlur = 9;
  ctx.fill();
  ctx.shadowBlur = 0;

  // Ekor
  ctx.beginPath();
  ctx.moveTo(-19, 0);
  ctx.lineTo(-32, -11*(Math.sin(Date.now()/130)+1.33)/2);
  ctx.lineTo(-28, 11*(Math.sin(Date.now()/130)+1.16)/2);
  ctx.closePath();
  ctx.fillStyle="#38bff7";
  ctx.globalAlpha = 0.82;
  ctx.fill();
  ctx.globalAlpha = 1;

  // Garis atas badan/sirip
  ctx.beginPath();
  ctx.arc(-2, -9, 8, 0, Math.PI);
  ctx.lineWidth=2;
  ctx.strokeStyle="#e0c5a8";
  ctx.stroke();

  // Mata
  ctx.beginPath();
  ctx.arc(8, -4, 4.6, 0, Math.PI*2);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(10, -5, 1.7, 0, Math.PI*2);
  ctx.fillStyle = "#2c2527";
  ctx.fill();

  // Mulut titik
  ctx.beginPath();
  ctx.arc(19.7, 1, 1, 0, Math.PI*2);
  ctx.fillStyle = "#262";
  ctx.globalAlpha = 0.7;
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.restore();
}

// --- Coral / Rugged (penghalang bawah laut)
function addCoral() {
  const minY = 80;
  const maxY = canvas.height - coralGap - 80;
  const y = minY + Math.random() * (maxY - minY);
  const color = randomCoralColor();

  corals.push({
    x: canvas.width,
    y: y,
    width: coralWidth,
    gap: coralGap,
    color: color,
    passed: false
  });
}

function drawCoral(coral) {
  // Atas coral
  ctx.beginPath();
  ctx.moveTo(coral.x, 0);
  ctx.lineTo(coral.x + coral.width, 0);
  ctx.lineTo(coral.x + coral.width, coral.y);
  ctx.lineTo(coral.x, coral.y);

  // Ranting karang warna-warni
  ctx.fillStyle = coral.color;
  ctx.shadowColor=coral.color+"cc";
  ctx.shadowBlur=11;
  ctx.fill();
  ctx.shadowBlur=0;

  for (let k=0; k<3; k++) {
    ctx.beginPath();
    ctx.ellipse(coral.x + coral.width/4 + 10*k, coral.y - 32 - 12*k, 6, 40-16*k, Math.PI*(-0.2+0.28*k),0,2*Math.PI);
    ctx.fillStyle = coral.color+"c0";
    ctx.fill();
  }

  // Bawah coral (gap sebagai jalan ikan)
  let bottomTop = coral.y + coral.gap;
  ctx.beginPath();
  ctx.moveTo(coral.x, bottomTop);
  ctx.lineTo(coral.x + coral.width, bottomTop);
  ctx.lineTo(coral.x + coral.width, canvas.height);
  ctx.lineTo(coral.x, canvas.height);

  ctx.fillStyle = coral.color;
  ctx.shadowColor=coral.color+"AA";
  ctx.shadowBlur=12;
  ctx.fill();
  ctx.shadowBlur=0;

  // ornament (gelembung digrafis)
  if (Math.random()>0.83) {
    ctx.beginPath();
    ctx.arc(coral.x+coral.width/2, bottomTop+12+Math.random()*55, Math.random()*7+2,0,2*Math.PI);
    ctx.fillStyle='#ddf8';
    ctx.fill();
  }
}

// Cek Collision: return true kalau kena
function checkCollision(coral) {
  // Fish bounding box (agak kecil, supaya enak)
  const fx = fish.x, fy = fish.y, r = 18.3;
  if (
      fx + r > coral.x && fx - r < coral.x + coral.width
      && (
        fy - r < coral.y
        || fy + r > coral.y + coral.gap
      )
    ) {
      return true;
    }
  return false;
}

// --- Game Over/End ---
function endGame() {
  gameOn = false;
  gameOver = true;
  clearInterval(interval);
  finalScore.textContent = "Skor: " + score;
  gameOverDiv.style.display = 'block';
}

// Set background ke awal/siap main
function initScreen() {
  drawBackground();
  drawFish();
}
initScreen();
