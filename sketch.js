let ballX;
let ballY;
let ballspeedX;
let ballspeedY;
let ballRadius;
let paddleX;
let paddleY;
let paddleSpeed;
let paddleWidth;
let paddleHeight;
function setup() {
  createCanvas(600, 400);
  ballX = width / 2;
  ballY = height / 2;
  ballspeedX = 5;
  ballspeedY = 5;
  ballRadius = 15;
  paddleX = width/2;
  paddleY = height-30;
  paddleSpeed = 15;
  paddleWidth = 150;
  paddleHeight = 15;
}

function draw() {
  background(0);
  ballX = ballX + ballspeedX;
  ballY -= ballspeedY;
  
  // パドルを動かす
  if (keyIsDown(LEFT_ARROW)){
    paddleX = paddleX - paddleSpeed;
    if (paddleX < 0){
      paddleX = 0;
    }
  }
  
  if (keyIsDown(RIGHT_ARROW)){
    paddleX = paddleX + paddleSpeed;
    if (paddleX + paddleWidth > width){
      paddleX = width - paddleWidth;
    }
  }
  
  // 右に当たったら
  if (ballX + ballRadius > width){
    ballspeedX *= -1;
  }
  
  // 左に当たったら
  if (ballX - ballRadius < 0){
    ballspeedX *= -1;
  }
  
  // 上に当たったら
  if (ballY - ballRadius < 0){
    ballspeedY *= -1
  }
  
  // 下に当たったら
  if (ballY + ballRadius > height){
    ballspeedY = 0;
    ballspeedX = 0;
    fill("white");
    textAlign(CENTER);
    textSize(20);
    text("GAMEOVER",width/2,height/2);
  }
  
  if (paddleX<ballX &&
     ballX < paddleX + paddleWidth &&
     paddleY-ballRadius < ballY + ballRadius &&
     ballY + ballRadius < paddleY){
    ballspeedY *= -1
  }
  circle(ballX,ballY,ballRadius * 2);
  rect(paddleX,paddleY,paddleWidth,paddleHeight);
}