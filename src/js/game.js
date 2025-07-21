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
  powerUps: {
    rapidFire: {
      active: false,
      timer: 0,
    },
    doubleDamage: {
      active: false,
      timer: 0,
    },
  },
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

    // Power-up visual effects
    if (this.powerUps.rapidFire.active) {
      // Draw rapid fire ring
      const rapidFireProgress =
        this.powerUps.rapidFire.timer / powerUpTypes[0].duration;
      ctx.strokeStyle = "#ff00ff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(
        this.x + this.width / 2,
        this.y + this.height / 2,
        30,
        -Math.PI / 2,
        Math.PI * 2 * rapidFireProgress - Math.PI / 2
      );
      ctx.stroke();
    }

    if (this.powerUps.doubleDamage.active) {
      // Draw double damage ring
      const doubleDamageProgress =
        this.powerUps.doubleDamage.timer / powerUpTypes[1].duration;
      ctx.strokeStyle = "#ffff00";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(
        this.x + this.width / 2,
        this.y + this.height / 2,
        35,
        -Math.PI / 2,
        Math.PI * 2 * doubleDamageProgress - Math.PI / 2
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

    // Power-up timers
    if (this.powerUps.rapidFire.active) {
      this.powerUps.rapidFire.timer--;
      document.getElementById("rapid-fire-indicator").classList.add("active");
      if (this.powerUps.rapidFire.timer <= 0) {
        this.powerUps.rapidFire.active = false;
        this.maxShootCooldown = 15;
        document
          .getElementById("rapid-fire-indicator")
          .classList.remove("active");
      }
    }

    if (this.powerUps.doubleDamage.active) {
      this.powerUps.doubleDamage.timer--;
      document
        .getElementById("double-damage-indicator")
        .classList.add("active");
      if (this.powerUps.doubleDamage.timer <= 0) {
        this.powerUps.doubleDamage.active = false;
        document
          .getElementById("double-damage-indicator")
          .classList.remove("active");
      }
    }
  },
  shoot() {
    if (this.shootCooldown <= 0) {
      // Create new bullet
      this.bullets.push({
        x: this.x + this.width / 2 - 4,
        y: this.y,
        width: 8,
        height: 20,
        speed: 10,
        color: this.powerUps.doubleDamage.active ? "#ffff00" : "#ffffff",
      });

      // If rapid fire power-up is active, add additional bullets
      if (this.powerUps.rapidFire.active) {
        this.bullets.push({
          x: this.x + this.width / 2 - 12,
          y: this.y + 10,
          width: 8,
          height: 20,
          speed: 10,
          color: "#ff00ff",
        });

        this.bullets.push({
          x: this.x + this.width / 2 + 4,
          y: this.y + 10,
          width: 8,
          height: 20,
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
    name: "scout",
    width: 40,
    height: 40,
    speed: 2,
    health: 1,
    points: 10,
    color: "#5599ff",
    shootRate: 0.005,
  },
  {
    name: "destroyer",
    width: 80,
    height: 80,
    speed: 1,
    health: 5,
    points: 50,
    color: "#ff0000",
    shootRate: 0.02,
  },
  {
    name: "mothership",
    width: 100,
    height: 60,
    speed: 0.7,
    health: 8,
    points: 100,
    color: "#9933ff",
    shootRate: 0.03,
  },
];

// Power-up types
const powerUpTypes = [
  {
    name: "rapidFire",
    color: "#ff00ff",
    duration: 600, // Increased from 300
    effect() {
      player.powerUps.rapidFire.active = true;
      player.powerUps.rapidFire.timer = this.duration;
      player.maxShootCooldown = 5;
    },
  },
  {
    name: "doubleDamage",
    color: "#ffff00",
    duration: 600, // Increased from 300
    effect() {
      player.powerUps.doubleDamage.active = true;
      player.powerUps.doubleDamage.timer = this.duration;
    },
  },
  {
    name: "healthBoost",
    color: "#00ff00",
    effect() {
      playerHealth = Math.min(100, playerHealth + 25); // Increased from 20
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
  // Determine enemy type based on random chance and game level
  let randomEnemyType;
  const rand = Math.random();

  if (rand > 0.95 && level >= 3) {
    // 5% chance for mothership at level 3+
    randomEnemyType = enemyTypes[2]; // mothership
  } else if (rand > 0.85 && level >= 2) {
    // 10% chance for destroyer at level 2+
    randomEnemyType = enemyTypes[1]; // destroyer
  } else {
    // Default to scout
    randomEnemyType = enemyTypes[0]; // scout
  }

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

    if (enemy.type === "scout") {
      // Draw alien scout ship (flying saucer)
      // Main body
      ctx.beginPath();
      ctx.ellipse(
        enemy.x + enemy.width / 2,
        enemy.y + enemy.height / 2,
        enemy.width / 2,
        enemy.height / 4,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Top dome
      ctx.fillStyle = "#88ccff";
      ctx.beginPath();
      ctx.arc(
        enemy.x + enemy.width / 2,
        enemy.y + enemy.height / 2,
        enemy.width / 4,
        0,
        Math.PI,
        true
      );
      ctx.fill();

      // Bottom lights
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = `hsl(${(gameFrame * 5 + i * 120) % 360}, 100%, 70%)`;
        ctx.beginPath();
        ctx.arc(
          enemy.x + enemy.width * (0.3 + i * 0.2),
          enemy.y + enemy.height * 0.7,
          3,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    } else if (enemy.type === "destroyer") {
      // Draw alien destroyer (triangular warship)
      // Main body
      ctx.beginPath();
      ctx.moveTo(enemy.x + enemy.width / 2, enemy.y);
      ctx.lineTo(enemy.x + enemy.width, enemy.y + enemy.height * 0.8);
      ctx.lineTo(enemy.x, enemy.y + enemy.height * 0.8);
      ctx.closePath();
      ctx.fill();

      // Engine glow
      ctx.fillStyle = "#ff6600";
      ctx.beginPath();
      ctx.moveTo(enemy.x + enemy.width * 0.3, enemy.y + enemy.height * 0.8);
      ctx.lineTo(enemy.x + enemy.width * 0.5, enemy.y + enemy.height);
      ctx.lineTo(enemy.x + enemy.width * 0.7, enemy.y + enemy.height * 0.8);
      ctx.closePath();
      ctx.fill();

      // Cockpit
      ctx.fillStyle = "#333333";
      ctx.beginPath();
      ctx.arc(
        enemy.x + enemy.width / 2,
        enemy.y + enemy.height / 3,
        enemy.width / 6,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Weapon pods
      ctx.fillStyle = "#cc0000";
      ctx.beginPath();
      ctx.arc(
        enemy.x + enemy.width * 0.25,
        enemy.y + enemy.height * 0.5,
        enemy.width / 10,
        0,
        Math.PI * 2
      );
      ctx.fill();

      ctx.beginPath();
      ctx.arc(
        enemy.x + enemy.width * 0.75,
        enemy.y + enemy.height * 0.5,
        enemy.width / 10,
        0,
        Math.PI * 2
      );
      ctx.fill();
    } else if (enemy.type === "mothership") {
      // Draw alien mothership (large oval with details)
      // Main body
      ctx.beginPath();
      ctx.ellipse(
        enemy.x + enemy.width / 2,
        enemy.y + enemy.height / 2,
        enemy.width / 2,
        enemy.height / 3,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Center dome
      ctx.fillStyle = "#ccaaff";
      ctx.beginPath();
      ctx.arc(
        enemy.x + enemy.width / 2,
        enemy.y + enemy.height / 2,
        enemy.width / 5,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Pulsing energy ring
      ctx.strokeStyle = `hsl(${gameFrame % 360}, 100%, 70%)`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(
        enemy.x + enemy.width / 2,
        enemy.y + enemy.height / 2,
        enemy.width / 2 + Math.sin(gameFrame * 0.05) * 5,
        enemy.height / 3 + Math.sin(gameFrame * 0.05) * 5,
        0,
        0,
        Math.PI * 2
      );
      ctx.stroke();

      // Bottom protrusions
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = "#7711aa";
        ctx.beginPath();
        ctx.rect(
          enemy.x + enemy.width * (0.2 + i * 0.15),
          enemy.y + enemy.height * 0.7,
          enemy.width * 0.1,
          enemy.height * 0.2
        );
        ctx.fill();
      }
    }

    // Draw enemy bullets
    enemy.bullets.forEach((bullet) => {
      // Add glow effect to enemy bullets
      ctx.shadowColor = "#ff0000";
      ctx.shadowBlur = 10;

      // Different bullet colors based on enemy type
      if (enemy.type === "scout") {
        ctx.fillStyle = "#5599ff";
      } else if (enemy.type === "destroyer") {
        ctx.fillStyle = "#ff3333";
      } else if (enemy.type === "mothership") {
        ctx.fillStyle = "#cc33ff";
      } else {
        ctx.fillStyle = "#ff6666";
      }

      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
      ctx.shadowBlur = 0;
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

    // Add a pulsing glow effect
    ctx.strokeStyle = powerUp.color;
    ctx.lineWidth = 2 + Math.sin(gameFrame * 0.1) * 2;
    ctx.beginPath();
    ctx.arc(
      powerUp.x + powerUp.width / 2,
      powerUp.y + powerUp.height / 2,
      powerUp.width / 2 + 5,
      0,
      Math.PI * 2
    );
    ctx.stroke();
  });
}

// Draw player bullets
function drawPlayerBullets() {
  player.bullets.forEach((bullet) => {
    // Add glow effect
    ctx.shadowColor = bullet.color;
    ctx.shadowBlur = 15;

    ctx.fillStyle = bullet.color;
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);

    // Reset shadow for other drawings
    ctx.shadowBlur = 0;
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
        x: enemy.x + enemy.width / 2 - 4,
        y: enemy.y + enemy.height,
        width: 8,
        height: 15,
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
        const damage = player.powerUps.doubleDamage.active ? 2 : 1;
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
  const healthBar = document.getElementById("health-bar");
  healthBar.style.width = `${playerHealth}%`;

  // Change color based on health level
  if (playerHealth > 60) {
    healthBar.style.background = "linear-gradient(to right, #33cc33, #66ff66)";
  } else if (playerHealth > 30) {
    healthBar.style.background = "linear-gradient(to right, #ffcc00, #ffff66)";
  } else {
    healthBar.style.background = "linear-gradient(to right, #ff3333, #ff6666)";
  }
}

// Game over
function gameOver() {
  gameActive = false;
  document.getElementById("game-over").style.display = "flex";
  document.getElementById("final-score").textContent = `Your score: ${score}`;
}

// Reset game variables
function resetGame() {
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
  player.powerUps.rapidFire.active = false;
  player.powerUps.rapidFire.timer = 0;
  player.powerUps.doubleDamage.active = false;
  player.powerUps.doubleDamage.timer = 0;
  player.maxShootCooldown = 15;

  // Reset UI indicators
  document.getElementById("rapid-fire-indicator").classList.remove("active");
  document.getElementById("double-damage-indicator").classList.remove("active");

  // Update displays
  updateScoreDisplay();
  updateHealthDisplay();
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

  // Reset game
  resetGame();

  // Start game
  gameActive = true;
  gameLoop();
});

document.getElementById("restart-button").addEventListener("click", () => {
  // Hide game over screen
  document.getElementById("game-over").style.display = "none";

  // Reset game
  resetGame();

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
