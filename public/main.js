const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const boxSize = 20;
const rows = 25;
const cols = 29;
const maxFood = 5;

let snake = [];
let dx = 0;
let dy = 0;
let foods = [];
let score = 0;
let speed = 200;
let lastTime = 0;
let gameRunning = false;

const startBtn = document.getElementById('startBtn');
startBtn.addEventListener('click', startGame);
document.addEventListener('keydown', changeDirection);

function startGame() {
  snake = [{x: Math.floor(cols/2)*boxSize, y: Math.floor(rows/2)*boxSize}];
  dx = boxSize;
  dy = 0;
  score = 0;
  speed = 200;
  gameRunning = true;
  lastTime = 0;
  foods = [];
  for (let i = 0; i < maxFood; i++) {
    foods.push(generateFood());
  }
  startBtn.style.display = 'none';
  requestAnimationFrame(drawGame);
}

function generateFood() {
  let x = Math.floor(Math.random() * cols) * boxSize;
  let y = Math.floor(Math.random() * rows) * boxSize;
  while (snake.some(part => part.x === x && part.y === y) || foods.some(f => f.x === x && f.y === y)) {
    x = Math.floor(Math.random() * cols) * boxSize;
    y = Math.floor(Math.random() * rows) * boxSize;
  }
  return {x, y};
}

function changeDirection(e) {
  if (e.key === 'ArrowUp' && dy === 0) { dx = 0; dy = -boxSize; }
  if (e.key === 'ArrowDown' && dy === 0) { dx = 0; dy = boxSize; }
  if (e.key === 'ArrowLeft' && dx === 0) { dx = -boxSize; dy = 0; }
  if (e.key === 'ArrowRight' && dx === 0) { dx = boxSize; dy = 0; }
}

function drawGrid() {
  ctx.strokeStyle = '#ccc';
  for (let r = 0; r <= rows; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r*boxSize);
    ctx.lineTo(cols*boxSize, r*boxSize);
    ctx.stroke();
  }
  for (let c = 0; c <= cols; c++) {
    ctx.beginPath();
    ctx.moveTo(c*boxSize, 0);
    ctx.lineTo(c*boxSize, rows*boxSize);
    ctx.stroke();
  }
}

function checkCollision(head) {
  if (head.x < 0 || head.x >= cols*boxSize || head.y < 0 || head.y >= rows*boxSize) return true;
  for (let i = 1; i < snake.length; i++) {
    if (head.x === snake[i].x && head.y === snake[i].y) return true;
  }
  return false;
}

function drawGame(timestamp) {
  if (!gameRunning) return;

  if (timestamp - lastTime < speed) {
    requestAnimationFrame(drawGame);
    return;
  }
  lastTime = timestamp;

  ctx.fillStyle = '#eeee';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawGrid();

  const head = {x: snake[0].x + dx, y: snake[0].y + dy};

  if (checkCollision(head)) {
    gameOver();
    return;
  }

  snake.unshift(head);

  let ateFood = false;
  for (let i = 0; i < foods.length; i++) {
    if (head.x === foods[i].x && head.y === foods[i].y) {
      score += 100;
      foods[i] = generateFood();
      speed = Math.max(50, speed - 5);
      ateFood = true;
      break;
    }
  }

  if (!ateFood) snake.pop();

  ctx.fillStyle = 'green';
  snake.forEach(part => ctx.fillRect(part.x, part.y, boxSize, boxSize));

  ctx.fillStyle = 'red';
  foods.forEach(f => ctx.fillRect(f.x, f.y, boxSize, boxSize));

  document.getElementById('scoreDisplay').textContent = 'Score: ' + score;

  requestAnimationFrame(drawGame);
}

function gameOver() {
  alert('Game Over! Score: ' + score);
  gameRunning = false;
  startBtn.style.display = 'inline';

  const name = prompt("名前を入力してください:");
  if (name) saveScore(name, score);
}

// --- ここからAPI連携 ---

// スコア保存
async function saveScore(name, score) {
  try {
    await fetch("/api/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, score }),
    });
    updateRanking();
  } catch (err) {
    console.error("スコア送信失敗:", err);
  }
}

// ランキング取得
async function updateRanking() {
  try {
    const res = await fetch("/api/scores");
    const data = await res.json();
    const list = document.getElementById("rankingList");
    list.innerHTML = "";
    data.forEach((row, i) => {
      const li = document.createElement("li");
      li.textContent = `${i + 1}. ${row.player_name} - ${row.score}`;
      list.appendChild(li);
    });
  } catch (err) {
    console.error("ランキング取得失敗:", err);
  }
}

// 起動時にランキング表示
updateRanking();
