// ===============================
// Snake Game main.js（改良版）
// ===============================

// --- Canvasと描画設定 ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- DOM要素取得 ---
const overlay = document.getElementById('overlay'); // 操作説明オーバーレイ
const startBtn = document.getElementById('startBtn'); // スタートボタン
const playerNameInput = document.getElementById('playerName'); // プレイヤー名入力欄

// --- ゲーム基本設定 ---
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
let playerName = ""; // プレイヤー名を保持

// ===============================
// ゲーム開始前
// ===============================

// ボタンクリックでゲーム開始
startBtn.addEventListener('click', () => {
  playerName = playerNameInput.value.trim();
  if (playerName === "") {
    alert("プレイヤー名を入力してください");
    return;
  }
  startGame();
});

// キー操作制御
document.addEventListener('keydown', e => {
  const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '];
  if (keys.includes(e.key)) {
    e.preventDefault(); // ← 余計な入力を阻止
  }

  // 矢印キー操作
  if (gameRunning) changeDirection(e);

  // Enterキーで開始
  if (!gameRunning && e.code === "Enter") {
    playerName = playerNameInput.value.trim();
    if (playerName === "") {
      alert("プレイヤー名を入力してください");
      return;
    }
    startGame();
  }
});

// スネーク操作キー
document.addEventListener('keydown', changeDirection);

// ===============================
// ゲーム中処理
// ===============================
function startGame() {
  overlay.style.display = "none"; // 操作説明を非表示にする
  snake = [{x: Math.floor(cols/2)*boxSize, y: Math.floor(rows/2)*boxSize}];
  dx = boxSize;
  dy = 0;
  score = 0;
  speed = 200;
  gameRunning = true;
  lastTime = 0;
  foods = [];

  // 初期エサ配置
  for (let i = 0; i < maxFood; i++) {
    foods.push(generateFood());
  }

  requestAnimationFrame(drawGame);
}

// ===============================
// エサ生成関数
// ===============================
function generateFood() {
  let x = Math.floor(Math.random() * cols) * boxSize;
  let y = Math.floor(Math.random() * rows) * boxSize;

  // スネークや既存のエサと重ならないようにする
  while (snake.some(part => part.x === x && part.y === y) ||
         foods.some(f => f.x === x && f.y === y)) {
    x = Math.floor(Math.random() * cols) * boxSize;
    y = Math.floor(Math.random() * rows) * boxSize;
  }
  return {x, y};
}

// ===============================
// 方向転換処理
// ===============================
function changeDirection(e) {
  if (e.key === 'ArrowUp' && dy === 0) { dx = 0; dy = -boxSize; }
  if (e.key === 'ArrowDown' && dy === 0) { dx = 0; dy = boxSize; }
  if (e.key === 'ArrowLeft' && dx === 0) { dx = -boxSize; dy = 0; }
  if (e.key === 'ArrowRight' && dx === 0) { dx = boxSize; dy = 0; }
}

// ===============================
// グリッド線描画（背景補助）
// ===============================
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

// ===============================
// 衝突判定
// ===============================
function checkCollision(head) {
  // 壁判定
  if (head.x < 0 || head.x >= cols*boxSize || head.y < 0 || head.y >= rows*boxSize)
    return true;

  // 自分自身との衝突
  for (let i = 1; i < snake.length; i++) {
    if (head.x === snake[i].x && head.y === snake[i].y)
      return true;
  }

  return false;
}

// ===============================
// メインゲームループ
// ===============================
function drawGame(timestamp) {
  if (!gameRunning) return;

  if (timestamp - lastTime < speed) {
    requestAnimationFrame(drawGame);
    return;
  }
  lastTime = timestamp;

  // 背景
  ctx.fillStyle = '#eeee';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawGrid();

  // 新しい頭の位置
  const head = {x: snake[0].x + dx, y: snake[0].y + dy};

  if (checkCollision(head)) {
    gameOver();
    return;
  }

  snake.unshift(head);

  // エサを食べた判定
  let ateFood = false;
  for (let i = 0; i < foods.length; i++) {
    if (head.x === foods[i].x && head.y === foods[i].y) {
      score += 100;
      foods[i] = generateFood();
      speed = Math.max(50, speed - 5); // スピードアップ
      ateFood = true;
      break;
    }
  }

  // 食べていない場合は尻尾を消す
  if (!ateFood) snake.pop();

  // スネーク描画
  ctx.fillStyle = 'green';
  snake.forEach(part => ctx.fillRect(part.x, part.y, boxSize, boxSize));

  // エサ描画
  ctx.fillStyle = 'red';
  foods.forEach(f => ctx.fillRect(f.x, f.y, boxSize, boxSize));

  // スコア更新
  document.getElementById('scoreDisplay').textContent = 'Score: ' + score;

  requestAnimationFrame(drawGame);
}

// ===============================
// ゲームオーバー処理
// ===============================
function gameOver() {
  alert(`Game Over! Score: ${score}`);
  gameRunning = false;

  // スコア送信
  if (playerName) saveScore(playerName, score);

  // 再挑戦準備：オーバーレイ再表示
  overlay.style.display = "flex";
  playerNameInput.value = playerName; // 名前を残しておく
  updateRanking();
}

// ===============================
// API連携：スコア保存・取得
// ===============================

// スコア送信
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
