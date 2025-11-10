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

const gameOverOverlay = document.getElementById('gameOverOverlay');
const finalScoreText = document.getElementById('finalScoreText');
const rankingNotice = document.getElementById('rankingNotice');
const returnBtn = document.getElementById('returnBtn');

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
    e.preventDefault(); // 余計な入力を阻止
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
      showFloatingScore(head.x + boxSize / 2, head.y - 6, 100); // アニメーション呼び出し
      break;
    }
  }

  // 食べていない場合は尻尾を消す
  if (!ateFood) snake.pop();

  // スネーク描画
  ctx.fillStyle = '#4CAF50';
  snake.forEach(part => {
    ctx.beginPath();
    // 角丸を再現する
    const radius = 4;
    ctx.moveTo(part.x + radius, part.y);
    ctx.lineTo(part.x + boxSize - radius, part.y);
    ctx.quadraticCurveTo(part.x + boxSize, part.y, part.x + boxSize, part.y + radius);
    ctx.lineTo(part.x + boxSize, part.y + boxSize - radius);
    ctx.quadraticCurveTo(part.x + boxSize, part.y + boxSize, part.x + boxSize - radius, part.y + boxSize);
    ctx.lineTo(part.x + radius, part.y + boxSize);
    ctx.quadraticCurveTo(part.x, part.y + boxSize, part.x, part.y + boxSize - radius);
    ctx.lineTo(part.x, part.y + radius);
    ctx.quadraticCurveTo(part.x, part.y, part.x + radius, part.y);
    ctx.fill();
  });

  // エサ描画
  ctx.fillStyle = '#d9333f';
  foods.forEach(f => ctx.fillRect(f.x, f.y, boxSize, boxSize));

  // --- スコア「+100」浮かび上がりアニメーション描画 ---
  if (floatingTexts.length) {
    ctx.save();
    ctx.font = "bold 20px Poppins, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    floatingTexts.forEach(ft => {
      ctx.globalAlpha = ft.alpha;
      ctx.fillStyle = "#B00000";
      ctx.fillText(ft.text, ft.x, ft.y);

      // アニメーション更新
      ft.y -= 1.1;     // 少し上へ
      ft.alpha -= 0.2;  // フェードアウト
    });

    // 消えたものを削除
    floatingTexts = floatingTexts.filter(ft => ft.alpha > 0);
    ctx.restore();
  }

  // スコア更新
  document.getElementById('scoreDisplay').textContent = 'Score: ' + score;

  requestAnimationFrame(drawGame);
}

// ===============================
// アニメーション関数
// ===============================
// スコア浮かび上がり用のエフェクト配列
let floatingTexts = []; // { x, y, alpha, vy, text }

// スコア加算アニメーション
function showFloatingScore(x, y, amount = 100) {
    floatingTexts.push({
    text: `+${amount}`,
    x, y,
    alpha: 1.0,
    vy: 0.8,
  });
}

// ===============================
// ゲームオーバー処理
// ===============================
async function gameOver() {
  gameRunning = false;

  // 最終スコア表示
  finalScoreText.textContent = `スコア: ${score}`;
  rankingNotice.textContent = "";

  let isInRanking = false;

  // スコア送信＆ランキング更新
  if (playerName) {
    try {
      await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: playerName, score }),
      });
      const res = await fetch("/api/scores");
      const data = await res.json();

      // 現在のプレイヤーがランキングにいるか確認
      const rankIndex = data.findIndex(r => r.player_name === playerName && r.score === score);

      if (rankIndex !== -1 && rankIndex < 10) {
        rankingNotice.textContent = `🎉 ランキング入賞！ ${rankIndex + 1}位！`;
        isInRanking = true;
      } else {
        rankingNotice.textContent = `ランキング圏外`;
      }

      updateRanking();
    } catch (err) {
      console.error("ランキング更新失敗:", err);
      rankingNotice.textContent = "通信エラー（スコア送信失敗）";
    }
  } else {
    rankingNotice.textContent = "スコア送信なし";
  }

  // ゲームオーバーオーバーレイを表示
  gameOverOverlay.style.display = "flex";
}

returnBtn.addEventListener('click', () => {
  window.location.reload(); // // タイトルに戻る → リロード
});

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
      li.innerHTML = `
        <span class="rank">${i + 1}.</span>
        <span class="name">${row.player_name}</span>
        <span class="score">${row.score}</span>
      `;
      list.appendChild(li);
    });
  } catch (err) {
    console.error("ランキング取得失敗:", err);
  }
}

// 起動時にランキング表示
updateRanking();
