// 複数のボールを扱う配列
let balls = [];
let ballRadius = 10;
// ボールの最大数（無限増殖を防ぐ）
let maxBalls = 16;
let paddleX;
let paddleY;
let paddleSpeed;
let paddleWidth;
let paddleHeight;

let bricks = [];
let brickRows = 4;
let brickCols = 8;
let brickWidth;
let brickHeight = 20;
let brickPadding = 6;
let topOffset = 50;
// ブロックが生成される確率 (0.0〜1.0)。小さくするとまばらに、1.0で全て出現。
let brickSpawnProb = 0.8;
// 特殊ブロック（当たるとブロックを増やす）が生成される確率
let brickMultiplierProb = 0.12;

// ステージ設定配列（行・列・出現確率・特殊ブロック確率など）
let levels = [
  { rows: 3, cols: 7, spawnProb: 0.9, multiplierProb: 0.12 },
  { rows: 4, cols: 8, spawnProb: 0.8, multiplierProb: 0.14 },
  { rows: 5, cols: 9, spawnProb: 0.85, multiplierProb: 0.16 }
];
let currentLevel = 0;
let levelClearTimer = 0;
let levelClearDelay = 90; // フレーム数で次ステージへの遷移を遅らせる
// プレイヤーが開始キーを押すまでゲームを始めない
let gameStarted = false;

let score = 0;
let lives = 3;
let gameOver = false;
let gameWin = false;

function setup() {
  createCanvas(600, 400);
  initGame();
}

function initGame() {
  // ゲーム全体を初期化し、1ステージ目を開始する
  balls = [];
  paddleWidth = 120;
  paddleHeight = 12;
  paddleX = (width - paddleWidth) / 2;
  paddleY = height - 30;
  paddleSpeed = 12;

  score = 0;
  lives = 3;
  gameOver = false;
  gameWin = false;
  currentLevel = 0;
  startLevel(currentLevel);
}

// ステージ開始: レベル設定を反映してブロックを作る
function startLevel(levelIndex) {
  let cfg = levels[levelIndex];
  brickRows = cfg.rows;
  brickCols = cfg.cols;
  brickSpawnProb = cfg.spawnProb;
  brickMultiplierProb = cfg.multiplierProb;

  // 初期ボール1個で開始
  balls = [];
  balls.push({ x: width / 2, y: height - 60, vx: random([-4, -3, 3, 4]), vy: -5, r: ballRadius });
  // レベル開始時はプレイヤー操作で開始（Shiftキー）させる
  gameStarted = false;
  // レベル切替時はパドルを中央に戻す
  paddleX = (width - paddleWidth) / 2;

  // ビルド
  buildBricks();
  levelClearTimer = 0;
}

function buildBricks() {
  brickWidth = (width - (brickCols + 1) * brickPadding) / brickCols;
  bricks = [];
  for (let r = 0; r < brickRows; r++) {
    for (let c = 0; c < brickCols; c++) {
      let bx = brickPadding + c * (brickWidth + brickPadding);
      let by = topOffset + r * (brickHeight + brickPadding);
      // 確率で alive を決める
      let alive = random() < brickSpawnProb;
      // 種類: 'normal' または 'multiplier'
      let type = random() < brickMultiplierProb ? 'multiplier' : 'normal';
      bricks.push({ x: bx, y: by, w: brickWidth, h: brickHeight, alive: alive, type: type });
    }
  }

  // 万一すべて消えているなら最低1個を普通ブロックにする
  let anyAlive = bricks.some(b => b.alive);
  if (!anyAlive && bricks.length > 0) {
    let idx = floor(random(bricks.length));
    bricks[idx].alive = true;
    bricks[idx].type = 'normal';
  }
}

function draw() {
  background(30);
  fill(255);
  textSize(14);
  textAlign(LEFT, TOP);
  text("SCORE: " + score, 8, 8);
  text("LIVES: " + lives, 120, 8);
  text("R: Restart", width - 100, 8);

  if (gameOver) {
    fill(255, 50, 50);
    textAlign(CENTER, CENTER);
    textSize(36);
    text("GAME OVER", width / 2, height / 2 - 20);
    textSize(16);
    text("Press R to restart", width / 2, height / 2 + 20);
    return;
  }

  if (gameWin) {
    fill(100, 255, 100);
    textAlign(CENTER, CENTER);
    textSize(36);
    text("YOU WIN!", width / 2, height / 2 - 20);
    textSize(16);
    text("Press R to play again", width / 2, height / 2 + 20);
    return;
  }

  // bricks
  for (let i = 0; i < bricks.length; i++) {
    let b = bricks[i];
    if (b.alive) {
      // 特殊ブロックは色を変える
      if (b.type === 'multiplier') {
        fill(255, 140, 0); // オレンジ
      } else {
        fill(200 - (i % brickCols) * 10, 120 + (i % 3) * 40, 180);
      }
      rect(b.x, b.y, b.w, b.h, 4);
    }
  }

  // ball movement: 複数ボールを更新
  // レベルクリア待ち中や未開始時はボールを停止させる
  if (levelClearTimer <= 0 && !gameOver && !gameWin && gameStarted) {
    for (let bi = balls.length - 1; bi >= 0; bi--) {
    let ball = balls[bi];
    ball.x += ball.vx;
    ball.y += ball.vy;

    // wall collisions
    if (ball.x - ball.r < 0) {
      ball.x = ball.r;
      ball.vx *= -1;
    }
    if (ball.x + ball.r > width) {
      ball.x = width - ball.r;
      ball.vx *= -1;
    }
    if (ball.y - ball.r < 0) {
      ball.y = ball.r;
      ball.vy *= -1;
    }
    
    // paddle collision (better angle control)
    if (
      ball.y + ball.r >= paddleY &&
      ball.y + ball.r <= paddleY + paddleHeight &&
      ball.x >= paddleX &&
      ball.x <= paddleX + paddleWidth &&
      ball.vy > 0
    ) {
      // bounce upward
      ball.vy = -abs(ball.vy);
      // change X speed based on where it hits the paddle
      let hitPos = (ball.x - paddleX) / paddleWidth - 0.5; // -0.5..0.5
      ball.vx += hitPos * 8;
      // limit max x speed
      ball.vx = constrain(ball.vx, -8, 8);
      ball.y = paddleY - ball.r - 1;
    }

    // bricks collision (per-ball)
    for (let i = 0; i < bricks.length; i++) {
      let b = bricks[i];
      if (!b.alive) continue;
      if (
        ball.x + ball.r > b.x &&
        ball.x - ball.r < b.x + b.w &&
        ball.y + ball.r > b.y &&
        ball.y - ball.r < b.y + b.h
      ) {
        // collision response
        ball.vy *= -1;
        b.alive = false;
        score += 10;

        // 特殊ブロックならボール数を現在の数だけ追加（倍にする）
        if (b.type === 'multiplier') {
          let currentBalls = balls.length;
          // 追加可能数
          let canAdd = min(currentBalls, maxBalls - currentBalls);
          for (let s = 0; s < canAdd; s++) {
            // 新しいボールは現在のボール位置から少しばらついた速度で生成
            let nvx = random(-4, 4);
            if (abs(nvx) < 1) nvx = nvx < 0 ? -1 : 1;
            let nvy = -random(3, 6);
            balls.push({ x: ball.x + random(-6, 6), y: ball.y + random(-6, 6), vx: nvx, vy: nvy, r: ball.r });
          }
        }

        break; // prevent multiple brick hits from same ball this frame
      }
    }

    // bottom (miss) : ボールが下に落ちたらそのボールを消す
    if (ball.y - ball.r > height) {
      balls.splice(bi, 1);
    }
    }
  }

  // ボールが全て無くなったらライフを減らし、残機あればボール1個で再開
  if (balls.length === 0) {
    lives--;
    // 残機が減ったときはパドルを中央に戻す
    paddleX = (width - paddleWidth) / 2;
    if (lives <= 0) {
      gameOver = true;
      // 明示的にクリア
      balls = [];
    } else {
      // 新しいボール1個を追加するが、プレイヤーがShiftを押すまで動かさない
      balls = [];
      balls.push({ x: width / 2, y: height - 60, vx: random([-4, -3, 3, 4]), vy: -5, r: ballRadius });
      paddleX = (width - paddleWidth) / 2;
      gameStarted = false; // プレイヤー操作で再開
    }
  }

  // ゲーム開始待ちの表示（ステージクリア待ち中は別表示が優先される）
  if (!gameStarted && levelClearTimer <= 0 && !gameOver && !gameWin) {
    fill(180);
    textAlign(CENTER, CENTER);
    textSize(20);
    text("Press SHIFT to start", width / 2, height / 2 + 20);
  }

  // paddle control
  // paddle control: Shift が押されるまで動かせないようにする
  if (gameStarted) {
    if (keyIsDown(LEFT_ARROW)) {
      paddleX -= paddleSpeed;
    }
    if (keyIsDown(RIGHT_ARROW)) {
      paddleX += paddleSpeed;
    }
  }
  // 位置は常に画面内に収める（動かせない間も中央などで固定される）
  paddleX = constrain(paddleX, 0, width - paddleWidth);

  // draw balls and paddle
  fill(255, 220, 0);
  for (let ball of balls) {
    circle(ball.x, ball.y, ball.r * 2);
  }

  fill(180);
  rect(paddleX, paddleY, paddleWidth, paddleHeight, 4);

  // check win
  let anyAlive = bricks.some(b => b.alive);
  if (!anyAlive) {
    // ステージクリア
    if (levelClearTimer === 0) levelClearTimer = levelClearDelay;
  }

  // レベルクリア待ちタイマー
  if (levelClearTimer > 0) {
    // 表示
    fill(200, 200, 60);
    textAlign(CENTER, CENTER);
    textSize(28);
    text("STAGE CLEAR!", width / 2, height / 2 - 10);
    levelClearTimer--;
    if (levelClearTimer === 0) {
      // 次のステージへ
      if (currentLevel < levels.length - 1) {
        currentLevel++;
        startLevel(currentLevel);
      } else {
        // 最終ステージクリアでゲーム勝利
        gameWin = true;
      }
    }
  }
}

function keyPressed() {
  // R でゲームをリスタート
  if (key === 'r' || key === 'R') {
    initGame();
  }

  // Shift キーでステージ開始（プレイヤーの意思でスタート）
  // p5.js では SHIFT 定数が使えるが、念のため keyCode 16 も許容
  if (!gameStarted && (key === 'Shift' || keyCode === SHIFT || keyCode === 16)) {
    // ステージクリア待ちやゲームオーバー中は無視
    if (levelClearTimer <= 0 && !gameOver && !gameWin) {
      gameStarted = true;
    }
  }
}