const SPEED_SCALE = 0.00001;

const game = document.querySelector("#game");
const scoreDisplay = document.querySelector("#score");
const startMessage = document.querySelector("#start-message");
const gameoverMessage = document.querySelector("#gameover-message");
const JUMP_SOUND = new Audio('assets/jump.wav'); // Dodajemy deklarację dźwięku skoku

document.addEventListener("click", startGame, { once: true }); // obsługa kliknięcia myszką
document.addEventListener("touchstart", startGame, { once: true }); // obsługa dotknięcia ekranu
document.addEventListener("keydown", startGame, { once: true });
game.addEventListener("click", startGame, { once: true }); 

/* general variables */
let lastTime;
let speedScale;
let score;

/* frame update */
function update(time) { 
  if (lastTime == null) {
    lastTime = time;
    window.requestAnimationFrame(update);
    return;
  }

  const delta = time - lastTime;

  updateGround(delta, speedScale);
  updateDino(delta, speedScale);
  updateCactus(delta, speedScale);
  updateSpeedScale(delta);
  updateScore(delta);

  if (checkGameOver()) return handleGameOver();

  lastTime = time;
  window.requestAnimationFrame(update);
}

function startGame() {
  lastTime = null;
  speedScale = 1;
  score = 0;
  setupGround();
  setupDino();
  setupCactus();
  startMessage.classList.add("hide");
  gameoverMessage.classList.add("hide");
  window.requestAnimationFrame(update);
  game.addEventListener("touchstart", onTouchJump);
}

/* speeds up the game over time */
function updateSpeedScale(delta) { 
  speedScale += delta * SPEED_SCALE;
}

function updateScore(delta) {
  score += delta * 0.01; 
  scoreDisplay.textContent = Math.floor(score);
}

/* collision conditions */
function checkCollision(rect1, rect2) {
  return (
    rect1.left < rect2.right &&
    rect1.top < rect2.bottom &&
    rect1.right > rect2.left &&
    rect1.bottom > rect2.top
  );
}

function checkGameOver() {
  const dinoRect = getDinoRect();
  return getCactusRects().some(rect => checkCollision(rect, dinoRect)); /* check collision with any of the cactus */
}

function handleGameOver() {
  setDinoLose();
  setTimeout(() => {
    document.addEventListener("keydown", startGame, { once: true });
    gameoverMessage.classList.remove("hide");
    // Dodajemy również nasłuchiwanie kliknięcia na element gry, jeśli gra zostanie przegrana
    game.addEventListener("click", startGame, { once: true });
    // Dodajemy nasłuchiwanie dotknięcia ekranu na elemencie gry, jeśli gra zostanie przegrana
    game.addEventListener("touchstart", startGame, { once: true });

    // Dodajemy odtwarzanie dźwięku po przegranej grze
    const audio = new Audio('assets/sound.mp3');
    audio.play();
  }, 100);
}



function onTouchJump() {
  if (!isJumping) {
    yVelocity = JUMP_SPEED;
    isJumping = true;
    JUMP_SOUND.play(); // Odtwarzamy dźwięk skoku
  }
}
 

/* HANDLING CSS PROPERTIES */

/* get property value */
function getCustomProperty(elem, prop) {
  return parseFloat(getComputedStyle(elem).getPropertyValue(prop)) || 0;
}

/* set property value */
function setCustomProperty(elem, prop, value) {
  elem.style.setProperty(prop, value);
}

/* increment the property value */
function incrementCustomProperty(elem, prop, inc) {
  setCustomProperty(elem, prop, getCustomProperty(elem, prop) + inc);
}

/* GROUND MOVEMENT */

const GROUND_SPEED = 0.05;
const grounds = document.querySelectorAll(".ground");

function setupGround() {
  setCustomProperty(grounds[0], "--left", 0);
  setCustomProperty(grounds[1], "--left", 300);
}

function updateGround(delta, speedScale) {
  grounds.forEach(ground => {
    incrementCustomProperty(ground, "--left", delta * speedScale * GROUND_SPEED * -1); /* moves the ground according to game speed */

    if (getCustomProperty(ground, "--left") <= -300) {
      incrementCustomProperty(ground, "--left", 600); /* loop the elements */
    }
  });
}

/* DINOSAUR MOVEMENT */

const dino = document.querySelector("#dino");
const JUMP_SPEED = 0.4;
const GRAVITY = 0.00125;
const DINO_FRAME_COUNT = 2;
const FRAME_TIME = 100;

let isJumping;
let dinoFrame;
let currentFrameTime;
let yVelocity;

function setupDino() {
  isJumping = false;
  dinoFrame = 0;
  currentFrameTime = 0;
  yVelocity = 0;

  setCustomProperty(dino, "--bottom", 0);
  document.removeEventListener("keydown", onJump); /* reset the dinosaur if the player dies while jumping */
  document.addEventListener("keydown", onJump);
  
  // Dodajemy nasłuchiwanie zdarzenia kliknięcia myszką na obszarze gry
  game.addEventListener("mousedown", onClickJump);
}

function updateDino(delta, speedScale) {
  handleRun(delta, speedScale);
  handleJump(delta);
}

function getDinoRect() {
  return dino.getBoundingClientRect(); /* get the dinosaur hitbox */
}

function setDinoLose() {
  dino.src = "assets/dino-lose.png";
}

function handleRun(delta, speedScale) {
  if (isJumping) {
    dino.src = `assets/dino-stationary.png`;
    return;
  }

  if (currentFrameTime >= FRAME_TIME) {
    dinoFrame = (dinoFrame + 1) % DINO_FRAME_COUNT;
    dino.src = `assets/dino-run-${dinoFrame}.png`; /* switch between images to simulate movement */
    currentFrameTime -= FRAME_TIME;
  }
  currentFrameTime += delta * speedScale;
}

function handleJump(delta) {
  if (!isJumping) return;

  incrementCustomProperty(dino, "--bottom", yVelocity * delta);

  if (getCustomProperty(dino, "--bottom") <= 0) {
    setCustomProperty(dino, "--bottom", 0);
    isJumping = false;
  }

  yVelocity -= GRAVITY * delta;
}

function onJump(e) {
  if (e.code !== "Space" || isJumping) return;

  yVelocity = JUMP_SPEED;
  isJumping = true;
  JUMP_SOUND.play(); // Odtwarzamy dźwięk skoku
}

function onClickJump() {
  if (!isJumping) {
    yVelocity = JUMP_SPEED;
    isJumping = true;
    JUMP_SOUND.play(); // Odtwarzamy dźwięk skoku
  }
}

/* ADD CACTUS */

const CACTUS_SPEED = 0.05;
const CACTUS_INTERVAL_MIN = 500;
const CACTUS_INTERVAL_MAX = 3000;

let nextCactusTime;

function setupCactus() {
  nextCactusTime = CACTUS_INTERVAL_MIN;
  document.querySelectorAll(".cactus").forEach(cactus => {
    cactus.remove(); /* remove cactus when game restart */
  })
}

function updateCactus(delta, speedScale) {
  document.querySelectorAll(".cactus").forEach(cactus => {
    incrementCustomProperty(cactus, "--left", delta * speedScale * CACTUS_SPEED * -1);
    if (getCustomProperty(cactus, "--left") <= -100) {
      cactus.remove(); /* remove cactus off screen so it doesn't impair game performance */
    }
  })

  if (nextCactusTime <= 0) {
    createCactus();
    nextCactusTime =
      randomizer(CACTUS_INTERVAL_MIN, CACTUS_INTERVAL_MAX) / speedScale;
  }
  nextCactusTime -= delta;
}

function getCactusRects() {
  return [...document.querySelectorAll(".cactus")].map(cactus => {
    return cactus.getBoundingClientRect(); /* get the hitbox of all the cactus on the screen */
  })
}

function createCactus() {
  const cactus = document.createElement("img");
  cactus.src = "assets/cactus.gif";
  cactus.classList.add("cactus");
  setCustomProperty(cactus, "--left", 100);
  game.append(cactus); 
}

function randomizer(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min); /* choose a number between minimum and maximum */
}
