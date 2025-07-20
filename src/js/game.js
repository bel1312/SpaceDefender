// Space Defender - Main Game Logic

// Canvas setup
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 600;

// Game variables
let gameActive = false;
let score = 0;
let playerHealth = 100;
let level = 1;
let enemySpawnRate = 120; // Frames between enemy spawns
let powerUpSpawnRate = 500; // Frames between power-up spawns
let gameFrame = 0;
let gameSpeed = 1;
let backgroundY = 0;

// Game objects
const player = {
  x: canvas.width / 2 - 25,
  y: canvas.height - 100,
  width: 50,
  height: 50,
  speed: 5,
  color: "#0099ff",
  bullets: [],
  powerUpActive: false,
  powerUpTimer: 0,
  powerUpType: null,
  shootCooldown: 0,
  maxShootCooldown: 15,
  moving: {
    left: false,
    right: false,
    up: false,
    down: false,
  },
  draw() {
    // Draw ship body
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(this.x + this.width / 2, this.y);
    ctx.lineTo(this.x + this.width, this.y + this.height);
    ctx.lineTo(this.x, this.y + this.height);
    ctx.closePath();
    ctx.fill();

    // Draw cockpit
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(
      this.x + this.width / 2,
      this.y + this.height / 2,
      10,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Draw engine flames
    ctx.fillStyle = "#ff9900";
    ctx.beginPath();
    ctx.moveTo(this.x + 10, this.y + this.height);
    ctx.lineTo(this.x + 20, this.y + this.height + 15);
    ctx.lineTo(this.x, this.y + this.height);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(this.x + this.width - 10, this.y + this.height);
    ctx.lineTo(this.x + this.width - 20, this.y + this.height + 15);
    ctx.lineTo(this.x + this.width, this.y + this.height);
    ctx.closePath();
    ctx.fill();

    // Power-up visual effect
    if (this.powerUpActive) {
      ctx.strokeStyle =
        this.powerUpType === "rapidFire" ? "#ff00ff" : "#ffff00";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(
        this.x + this.width / 2,
        this.y + this.height / 2,
        30,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }
  },
  update() {
    // Movement
    if (this.moving.left && this.x > 0) this.x -= this.speed;
    if (this.moving.right && this.x < canvas.width - this.width)
      this.x += this.speed;
    if (this.moving.up && this.y > 0) this.y -= this.speed;
    if (this.moving.down && this.y < canvas.height - this.height)
      this.y += this.speed;

    // Shooting cooldown
    if (this.shootCooldown > 0) this.shootCooldown--;

    // Power-up timer
    if (this.powerUpActive) {
      this.powerUpTimer--;
      if (this.powerUpTimer <= 0) {
        this.powerUpActive = false;
        this.powerUpType = null;
        this.maxShootCooldown = 15;
      }
    }
  },
  shoot() {
    if (this.shootCooldown <= 0) {
      // Create new bullet
      this.bullets.push({
        x: this.x + this.width / 2 - 2,
        y: this.y,
        width: 4,
        height: 15,
        speed: 10,
        color:
          this.powerUpActive && this.powerUpType === "doubleDamage"
            ? "#ffff00"
            : "#ffffff",
      });

      // If rapid fire power-up is active, add a second bullet
      if (this.powerUpActive && this.powerUpType === "rapidFire") {
        this.bullets.push({
          x: this.x + this.width / 2 - 10,
          y: this.y + 10,
          width: 4,
          height: 15,
          speed: 10,
          color: "#ff00ff",
        });

        this.bullets.push({
          x: this.x + this.width / 2 + 6,
          y: this.y + 10,
          width: 4,
          height: 15,
          speed: 10,
          color: "#ff00ff",
        });
      }

      // Reset cooldown
      this.shootCooldown = this.maxShootCooldown;
    }
  },
};

// Arrays to store game objects
const enemies = [];
const powerUps = [];
const stars = [];
const explosions = [];

// Enemy types
const enemyTypes = [
  {
    name: "chicken",
    width: 40,
    height: 40,
    speed: 2,
    health: 1,
    points: 10,
    color: "#ff6666",
    shootRate: 0.005,
  },
  {
    name: "boss",
    width: 80,
    height: 80,
    speed: 1,
    health: 5,
    points: 50,
    color: "#ff0000",
    shootRate: 0.02,
  },
];

// Power-up types
const powerUpTypes = [
  {
    name: "rapidFire",
    color: "#ff00ff",
    duration: 300,
    effect() {
      player.powerUpActive = true;
      player.powerUpType = "rapidFire";
      player.powerUpTimer = this.duration;
      player.maxShootCooldown = 5;
    },
  },
  {
    name: "doubleDamage",
    color: "#ffff00",
    duration: 300,
    effect() {
      player.powerUpActive = true;
      player.powerUpType = "doubleDamage";
      player.powerUpTimer = this.duration;
    },
  },
  {
    name: "healthBoost",
    color: "#00ff00",
    effect() {
      playerHealth = Math.min(100, playerHealth + 20);
      updateHealthDisplay();
    },
  },
];

// Create initial stars
function createStars() {
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 3 + 1,
      speed: Math.random() * 3 + 1,
    });
  }
}

// Draw stars
function drawStars() {
  ctx.fillStyle = "#ffffff";
  stars.forEach((star) => {
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  });
}

// Update stars
function updateStars() {
  stars.forEach((star) => {
    star.y += star.speed * gameSpeed;
    if (star.y > canvas.height) {
      star.y = 0;
      star.x = Math.random() * canvas.width;
    }
  });
}

// Create enemy
function createEnemy() {
  const randomEnemyType = Math.random() > 0.9 ? enemyTypes[1] : enemyTypes[0];

  enemies.push({
    x: Math.random() * (canvas.width - randomEnemyType.width),
    y: -randomEnemyType.height,
    width: randomEnemyType.width,
    height: randomEnemyType.height,
    speed: randomEnemyType.speed,
    health: randomEnemyType.health,
    points: randomEnemyType.points,
    color: randomEnemyType.color,
    shootRate: randomEnemyType.shootRate,
    bullets: [],
    type: randomEnemyType.name,
  });
}

// Create power-up
function createPowerUp() {
  const randomType =
    powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];

  powerUps.push({
    x: Math.random() * (canvas.width - 30),
    y: -30,
    width: 30,
    height: 30,
    speed: 2,
    color: randomType.color,
    type: randomType.name,
    effect: randomType.effect,
    duration: randomType.duration || 0,
  });
}

// Draw enemies
function drawEnemies() {
  enemies.forEach((enemy) => {
    ctx.fillStyle = enemy.color;

    if (enemy.type === "chicken") {
      // Draw chicken body
      ctx.beginPath();
      ctx.arc(
        enemy.x + enemy.width / 2,
        enemy.y + enemy.height / 2,
        enemy.width / 2,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Draw chicken beak
      ctx.fillStyle = "#ffcc00";
      ctx.beginPath();
      ctx.moveTo(enemy.x + enemy.width / 2, enemy.y + enemy.height);
      ctx.lineTo(enemy.x + enemy.width / 2 + 10, enemy.y + enemy.height + 15);
      ctx.lineTo(enemy.x + enemy.width / 2 - 10, enemy.y + enemy.height + 15);
      ctx.closePath();
      ctx.fill();

      // Draw chicken eyes
      ctx.fillStyle = "#000000";
      ctx.beginPath();
      ctx.arc(
        enemy.x + enemy.width / 2 - 10,
        enemy.y + enemy.height / 2 - 5,
        5,
        0,
        Math.PI * 2
      );
      ctx.fill();

      ctx.beginPath();
      ctx.arc(
        enemy.x + enemy.width / 2 + 10,
        enemy.y + enemy.height / 2 - 5,
        5,
        0,
        Math.PI * 2
      );
      ctx.fill();
    } else if (enemy.type === "boss") {
      // Draw boss body
      ctx.beginPath();
      ctx.arc(
        enemy.x + enemy.width / 2,
        enemy.y + enemy.height / 2,
        enemy.width / 2,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Draw boss crown
      ctx.fillStyle = "#ffcc00";
      ctx.beginPath();
      ctx.moveTo(enemy.x + 10, enemy.y + 10);
      ctx.lineTo(enemy.x + enemy.width / 2, enemy.y - 20);
      ctx.lineTo(enemy.x + enemy.width - 10, enemy.y + 10);
      ctx.closePath();
      ctx.fill();

      // Draw boss eyes
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(
        enemy.x + enemy.width / 2 - 15,
        enemy.y + enemy.height / 2 - 5,
        10,
        0,
        Math.PI * 2
      );
      ctx.fill();

      ctx.beginPath();
      ctx.arc(
        enemy.x + enemy.width / 2 + 15,
        enemy.y + enemy.height / 2 - 5,
        10,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Draw boss pupils
      ctx.fillStyle = "#000000";
      ctx.beginPath();
      ctx.arc(
        enemy.x + enemy.width / 2 - 15,
        enemy.y + enemy.height / 2 - 5,
        5,
        0,
        Math.PI * 2
      );
      ctx.fill();

      ctx.beginPath();
      ctx.arc(
        enemy.x + enemy.width / 2 + 15,
        enemy.y + enemy.height / 2 - 5,
        5,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    // Draw enemy bullets
    enemy.bullets.forEach((bullet) => {
      ctx.fillStyle = "#ff6666";
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
  });
}

// Draw power-ups
function drawPowerUps() {
  powerUps.forEach((powerUp) => {
    ctx.fillStyle = powerUp.color;
    ctx.beginPath();
    ctx.arc(
      powerUp.x + powerUp.width / 2,
      powerUp.y + powerUp.height / 2,
      powerUp.width / 2,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Draw power-up icon
    ctx.fillStyle = "#ffffff";
    ctx.font = "20px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    let icon = "?";
    if (powerUp.type === "rapidFire") icon = "R";
    else if (powerUp.type === "doubleDamage") icon = "D";
    else if (powerUp.type === "healthBoost") icon = "H";

    ctx.fillText(
      icon,
      powerUp.x + powerUp.width / 2,
      powerUp.y + powerUp.height / 2
    );
  });
}

// Draw player bullets
function drawPlayerBullets() {
  player.bullets.forEach((bullet) => {
    ctx.fillStyle = bullet.color;
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  });
}

// Update enemies
function updateEnemies() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];
    enemy.y += enemy.speed * gameSpeed;

    // Enemy shooting
    if (Math.random() < enemy.shootRate) {
      enemy.bullets.push({
        x: enemy.x + enemy.width / 2 - 2,
        y: enemy.y + enemy.height,
        width: 4,
        height: 10,
        speed: 5,
      });
    }

    // Update enemy bullets
    for (let j = enemy.bullets.length - 1; j >= 0; j--) {
      const bullet = enemy.bullets[j];
      bullet.y += bullet.speed;

      // Remove bullets that go off screen
      if (bullet.y > canvas.height) {
        enemy.bullets.splice(j, 1);
        continue;
      }

      // Check for collision with player
      if (
        bullet.x < player.x + player.width &&
        bullet.x + bullet.width > player.x &&
        bullet.y < player.y + player.height &&
        bullet.y + bullet.height > player.y
      ) {
        // Player hit by enemy bullet
        playerHealth -= 10;
        updateHealthDisplay();
        enemy.bullets.splice(j, 1);

        // Check if player is dead
        if (playerHealth <= 0) {
          gameOver();
        }
      }
    }

    // Remove enemies that go off screen
    if (enemy.y > canvas.height) {
      enemies.splice(i, 1);
      continue;
    }

    // Check for collision with player
    if (
      enemy.x < player.x + player.width &&
      enemy.x + enemy.width > player.x &&
      enemy.y < player.y + player.height &&
      enemy.y + enemy.height > player.y
    ) {
      // Player collided with enemy
      playerHealth -= 20;
      updateHealthDisplay();

      // Create explosion
      createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);

      // Remove enemy
      enemies.splice(i, 1);

      // Check if player is dead
      if (playerHealth <= 0) {
        gameOver();
      }

      continue;
    }

    // Check for collision with player bullets
    for (let j = player.bullets.length - 1; j >= 0; j--) {
      const bullet = player.bullets[j];

      if (
        bullet.x < enemy.x + enemy.width &&
        bullet.x + bullet.width > enemy.x &&
        bullet.y < enemy.y + enemy.height &&
        bullet.y + bullet.height > enemy.y
      ) {
        // Enemy hit by bullet
        const damage =
          player.powerUpActive && player.powerUpType === "doubleDamage" ? 2 : 1;
        enemy.health -= damage;

        // Remove bullet
        player.bullets.splice(j, 1);

        // Check if enemy is dead
        if (enemy.health <= 0) {
          // Add points
          score += enemy.points;
          updateScoreDisplay();

          // Create explosion
          createExplosion(
            enemy.x + enemy.width / 2,
            enemy.y + enemy.height / 2
          );

          // Remove enemy
          enemies.splice(i, 1);

          // Check for level up
          checkLevelUp();
        }

        break;
      }
    }
  }
}

// Update power-ups
function updatePowerUps() {
  for (let i = powerUps.length - 1; i >= 0; i--) {
    const powerUp = powerUps[i];
    powerUp.y += powerUp.speed * gameSpeed;

    // Remove power-ups that go off screen
    if (powerUp.y > canvas.height) {
      powerUps.splice(i, 1);
      continue;
    }

    // Check for collision with player
    if (
      powerUp.x < player.x + player.width &&
      powerUp.x + powerUp.width > player.x &&
      powerUp.y < player.y + player.height &&
      powerUp.y + powerUp.height > player.y
    ) {
      // Apply power-up effect
      powerUp.effect();

      // Remove power-up
      powerUps.splice(i, 1);
    }
  }
}

// Update player bullets
function updatePlayerBullets() {
  for (let i = player.bullets.length - 1; i >= 0; i--) {
    const bullet = player.bullets[i];
    bullet.y -= bullet.speed;

    // Remove bullets that go off screen
    if (bullet.y + bullet.height < 0) {
      player.bullets.splice(i, 1);
    }
  }
}

// Create explosion
function createExplosion(x, y) {
  explosions.push({
    x,
    y,
    radius: 5,
    maxRadius: 30,
    expandSpeed: 1,
    particles: [],
    alpha: 1,
  });

  // Create explosion particles
  for (let i = 0; i < 20; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3 + 1;

    explosions[explosions.length - 1].particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: Math.random() * 3 + 1,
      color: `hsl(${Math.random() * 30 + 15}, 100%, 50%)`,
      alpha: 1,
    });
  }
}

// Draw explosions
function drawExplosions() {
  explosions.forEach((explosion) => {
    // Draw explosion circle
    ctx.beginPath();
    ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 150, 0, ${explosion.alpha})`;
    ctx.fill();

    // Draw explosion particles
    explosion.particles.forEach((particle) => {
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fillStyle = particle.color
        .replace(")", `, ${particle.alpha})`)
        .replace("rgb", "rgba");
      ctx.fill();
    });
  });
}

// Update explosions
function updateExplosions() {
  for (let i = explosions.length - 1; i >= 0; i--) {
    const explosion = explosions[i];

    // Expand explosion
    explosion.radius += explosion.expandSpeed;
    explosion.alpha -= 0.02;

    // Update particles
    explosion.particles.forEach((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.alpha -= 0.02;
    });

    // Remove explosion when it's done
    if (explosion.alpha <= 0) {
      explosions.splice(i, 1);
    }
  }
}

// Check for level up
function checkLevelUp() {
  if (score >= level * 100) {
    level++;
    enemySpawnRate = Math.max(30, enemySpawnRate - 10);
    gameSpeed += 0.1;
  }
}

// Update score display
function updateScoreDisplay() {
  document.getElementById("score-display").textContent = `Score: ${score}`;
}

// Update health display
function updateHealthDisplay() {
  document.getElementById(
    "health-display"
  ).textContent = `Health: ${playerHealth}%`;
}

// Game over
function gameOver() {
  gameActive = false;
  document.getElementById("game-over").style.display = "flex";
  document.getElementById("final-score").textContent = `Your score: ${score}`;
}

// Main game loop
function gameLoop() {
  if (!gameActive) return;

  // Clear canvas
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Update and draw stars
  updateStars();
  drawStars();

  // Spawn enemies
  if (gameFrame % enemySpawnRate === 0) {
    createEnemy();
  }

  // Spawn power-ups
  if (gameFrame % powerUpSpawnRate === 0) {
    createPowerUp();
  }

  // Update and draw player
  player.update();
  player.draw();

  // Update and draw player bullets
  updatePlayerBullets();
  drawPlayerBullets();

  // Update and draw enemies
  updateEnemies();
  drawEnemies();

  // Update and draw power-ups
  updatePowerUps();
  drawPowerUps();

  // Update and draw explosions
  updateExplosions();
  drawExplosions();

  // Increment game frame
  gameFrame++;

  // Request next frame
  requestAnimationFrame(gameLoop);
}

// Event listeners
document.getElementById("start-button").addEventListener("click", () => {
  // Hide start screen
  document.getElementById("start-screen").style.display = "none";

  // Reset game variables
  score = 0;
  playerHealth = 100;
  level = 1;
  enemySpawnRate = 120;
  gameSpeed = 1;
  gameFrame = 0;
  enemies.length = 0;
  powerUps.length = 0;
  player.bullets.length = 0;
  explosions.length = 0;

  // Update displays
  updateScoreDisplay();
  updateHealthDisplay();

  // Start game
  gameActive = true;
  gameLoop();
});

document.getElementById("restart-button").addEventListener("click", () => {
  // Hide game over screen
  document.getElementById("game-over").style.display = "none";

  // Reset game variables
  score = 0;
  playerHealth = 100;
  level = 1;
  enemySpawnRate = 120;
  gameSpeed = 1;
  gameFrame = 0;
  enemies.length = 0;
  powerUps.length = 0;
  player.bullets.length = 0;
  explosions.length = 0;

  // Update displays
  updateScoreDisplay();
  updateHealthDisplay();

  // Start game
  gameActive = true;
  gameLoop();
});

// Keyboard controls
window.addEventListener("keydown", (e) => {
  switch (e.key) {
    case "ArrowLeft":
      player.moving.left = true;
      break;
    case "ArrowRight":
      player.moving.right = true;
      break;
    case "ArrowUp":
      player.moving.up = true;
      break;
    case "ArrowDown":
      player.moving.down = true;
      break;
    case " ":
      if (gameActive) player.shoot();
      break;
  }
});

window.addEventListener("keyup", (e) => {
  switch (e.key) {
    case "ArrowLeft":
      player.moving.left = false;
      break;
    case "ArrowRight":
      player.moving.right = false;
      break;
    case "ArrowUp":
      player.moving.up = false;
      break;
    case "ArrowDown":
      player.moving.down = false;
      break;
  }
});

// Initialize stars
createStars();

// Resize canvas when window resizes
window.addEventListener("resize", () => {
  // Maintain aspect ratio
  const container = document.getElementById("game-container");
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;

  const aspectRatio = canvas.width / canvas.height;

  if (containerWidth / containerHeight > aspectRatio) {
    canvas.style.height = `${containerHeight}px`;
    canvas.style.width = `${containerHeight * aspectRatio}px`;
  } else {
    canvas.style.width = `${containerWidth}px`;
    canvas.style.height = `${containerWidth / aspectRatio}px`;
  }
});
