// ===============================
// Snake Game Server.js（安定版）
// ===============================

import express from "express";
import mysql from "mysql2";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ===============================
// 静的ファイル設定
// ===============================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// ===============================
// MySQL自動再接続ロジック
// ===============================
let db;

function handleDisconnect() {
  db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  db.connect(err => {
    if (err) {
      console.error("MySQL接続失敗:", err);
      setTimeout(handleDisconnect, 2000); // 2秒後に再試行
    } else {
      console.log("MySQLに接続しました");
    }
  });

  db.on("error", err => {
    console.error("MySQLエラー:", err.code);
    if (
      err.code === "PROTOCOL_CONNECTION_LOST" ||
      err.code === "ECONNRESET" ||
      err.code === "ETIMEDOUT"
    ) {
      console.log("再接続を試みます...");
      handleDisconnect();
    } else {
      throw err;
    }
  });
}

handleDisconnect();

// ===============================
// スコア登録API
// ===============================
app.post("/api/score", (req, res) => {
  const { name, score } = req.body;
  if (!name || !score)
    return res.status(400).json({ error: "名前とスコアは必須です。" });

  db.query(
    "INSERT INTO scores (player_name, score) VALUES (?, ?)",
    [name, score],
    err => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "スコアを保存しました。" });
    }
  );
});

// ===============================
// ランキング取得API
// ===============================
app.get("/api/scores", (req, res) => {
  db.query(
    "SELECT player_name, score FROM scores ORDER BY score DESC LIMIT 10",
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
});

// ===============================
// サーバー起動
// ===============================
app.listen(PORT, () => {
  console.log(`サーバーが起動しました: http://localhost:${PORT}`);
});
