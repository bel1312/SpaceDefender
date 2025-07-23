// Space Defender - Main Game Logic

// Canvas setup
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 600;

// Game variables
let gameActive = false;
let score = 0;
let highScore = 0;
let playerHealth = 100;
let level = 1;
let enemySpawnRate = 120; // Frames between enemy spawns
let powerUpSpawnRate = 500; // Frames between power-up spawns
let gameFrame = 0;
let gameSpeed = 1;
let backgroundY = 0;
let combo = 0;
let comboTimer = 0;
let comboMultiplier = 1;
let screenShake = 0;
let bossActive = false;
let bossWarningActive = false;
let bossSpawnTimer = 0;
let soundEnabled = true;

// Sound elements and management
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const soundBuffers = {};

// Sound management system
const SoundManager = {
  init() {
    // Set up sound toggle button
    document.getElementById("sound-toggle").textContent = `Sound: ${
      soundEnabled ? "ON" : "OFF"
    }`;

    // Create simple sounds programmatically instead of using audio files
    this.createSounds();

    console.log("Sound system initialized");
  },

  createSounds() {
    // Create laser sound (high-pitched beep)
    this.createBeepSound("laser", 880, 0.1, "square");

    // Create explosion sound (noise burst)
    this.createNoiseSound("explosion", 0.3);

    // Create powerup sound (ascending tone)
    this.createSweepSound("powerup", 440, 880, 0.3);

    // Create hit sound (short low beep)
    this.createBeepSound("hit", 220, 0.1, "sawtooth");

    // Create game over sound (descending tone)
    this.createSweepSound("gameOver", 440, 110, 0.5);

    // Create level up sound (ascending arpeggio)
    this.createArpeggioSound("levelUp");

    // Create boss warning sound (alarm-like sound)
    this.createAlarmSound("bossWarning");

    // Create background music (simple looping pattern)
    this.createBackgroundMusic();
  },

  createBeepSound(name, frequency, duration, type = "sine") {
    soundBuffers[name] = () => {
      if (!soundEnabled) return;

      try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(
          frequency,
          audioContext.currentTime
        );

        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + duration
        );

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + duration);
      } catch (error) {
        console.log(`Error playing ${name} sound:`, error);
      }
    };
  },

  createNoiseSound(name, duration) {
    soundBuffers[name] = () => {
      if (!soundEnabled) return;

      try {
        const bufferSize = audioContext.sampleRate * duration;
        const buffer = audioContext.createBuffer(
          1,
          bufferSize,
          audioContext.sampleRate
        );
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noise = audioContext.createBufferSource();
        noise.buffer = buffer;

        const gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + duration
        );

        noise.connect(gainNode);
        gainNode.connect(audioContext.destination);

        noise.start();
        noise.stop(audioContext.currentTime + duration);
      } catch (error) {
        console.log(`Error playing ${name} sound:`, error);
      }
    };
  },

  createSweepSound(name, startFreq, endFreq, duration) {
    soundBuffers[name] = () => {
      if (!soundEnabled) return;

      try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(
          startFreq,
          audioContext.currentTime
        );
        oscillator.frequency.exponentialRampToValueAtTime(
          endFreq,
          audioContext.currentTime + duration
        );

        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + duration
        );

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + duration);
      } catch (error) {
        console.log(`Error playing ${name} sound:`, error);
      }
    };
  },

  createArpeggioSound(name) {
    soundBuffers[name] = () => {
      if (!soundEnabled) return;

      try {
        const notes = [261.63, 329.63, 392.0, 523.25]; // C4, E4, G4, C5
        const duration = 0.15;

        notes.forEach((freq, i) => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          oscillator.type = "sine";
          oscillator.frequency.value = freq;

          gainNode.gain.setValueAtTime(
            0.4,
            audioContext.currentTime + i * duration
          );
          gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            audioContext.currentTime + (i + 1) * duration
          );

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);

          oscillator.start(audioContext.currentTime + i * duration);
          oscillator.stop(audioContext.currentTime + (i + 1) * duration);
        });
      } catch (error) {
        console.log(`Error playing ${name} sound:`, error);
      }
    };
  },

  createAlarmSound(name) {
    soundBuffers[name] = () => {
      if (!soundEnabled) return;

      try {
        for (let i = 0; i < 3; i++) {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          oscillator.type = "square";
          oscillator.frequency.value = 440;

          gainNode.gain.setValueAtTime(0.4, audioContext.currentTime + i * 0.4);
          gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            audioContext.currentTime + i * 0.4 + 0.2
          );

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);

          oscillator.start(audioContext.currentTime + i * 0.4);
          oscillator.stop(audioContext.currentTime + i * 0.4 + 0.2);
        }
      } catch (error) {
        console.log(`Error playing ${name} sound:`, error);
      }
    };
  },

  createBackgroundMusic() {
    // Simple background music pattern
    let isPlaying = false;
    let intervalId = null;

    soundBuffers.backgroundMusic = {
      play() {
        if (!soundEnabled || isPlaying) return;

        isPlaying = true;
        const notes = [261.63, 329.63, 392.0, 329.63]; // C4, E4, G4, E4
        let index = 0;

        intervalId = setInterval(() => {
          if (!soundEnabled) {
            this.stop();
            return;
          }

          try {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.type = "sine";
            oscillator.frequency.value = notes[index % notes.length];

            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(
              0.01,
              audioContext.currentTime + 0.3
            );

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.3);

            index++;
          } catch (error) {
            console.log("Error playing background music:", error);
          }
        }, 400);
      },

      stop() {
        isPlaying = false;
        if (intervalId !== null) {
          clearInterval(intervalId);
          intervalId = null;
        }
      },
    };
  },

  play(soundName) {
    if (!soundEnabled || !soundBuffers[soundName]) return;

    // Resume audio context if it's suspended (needed for Chrome's autoplay policy)
    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    // Play the sound
    if (typeof soundBuffers[soundName] === "function") {
      soundBuffers[soundName]();
    } else if (soundBuffers[soundName].play) {
      soundBuffers[soundName].play();
    }
  },

  toggle() {
    soundEnabled = !soundEnabled;
    document.getElementById("sound-toggle").textContent = `Sound: ${
      soundEnabled ? "ON" : "OFF"
    }`;

    if (soundEnabled) {
      if (gameActive) {
        this.play("backgroundMusic");
      }
    } else {
      if (soundBuffers.backgroundMusic && soundBuffers.backgroundMusic.stop) {
        soundBuffers.backgroundMusic.stop();
      }
    }
  },
};

// Function to play a sound
function playSound(name) {
  SoundManager.play(name);
}

// Create a function to show damage indicators
function showDamageIndicator(x, y, damage) {
  // Create floating damage text
  floatingTexts.push({
    text: `-${damage}`,
    x,
    y,
    color: "#ff6666",
    size: 16,
    alpha: 1,
    velocity: -2,
  });
}

// Background stars with parallax effect
const backgroundLayers = [
  {
    stars: [],
    count: 50,
    size: [1, 2],
    speed: 0.5,
    color: "rgba(255, 255, 255, 0.5)",
  },
  {
    stars: [],
    count: 30,
    size: [2, 3],
    speed: 1,
    color: "rgba(255, 255, 255, 0.7)",
  },
  {
    stars: [],
    count: 20,
    size: [2, 4],
    speed: 1.5,
    color: "rgba(255, 255, 255, 0.9)",
  },
];

// Create stars for each background layer
function createBackgroundStars() {
  backgroundLayers.forEach((layer) => {
    for (let i = 0; i < layer.count; i++) {
      layer.stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * (layer.size[1] - layer.size[0]) + layer.size[0],
      });
    }
  });
}

// Draw background with parallax effect
function drawBackground() {
  // Clear canvas
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Apply screen shake
  if (screenShake > 0) {
    ctx.save();
    const shakeX = (Math.random() - 0.5) * screenShake;
    const shakeY = (Math.random() - 0.5) * screenShake;
    ctx.translate(shakeX, shakeY);
    screenShake -= 0.5;
    if (screenShake < 0) screenShake = 0;
  }

  // Draw stars with parallax effect
  backgroundLayers.forEach((layer) => {
    ctx.fillStyle = layer.color;
    layer.stars.forEach((star) => {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();

      // Move stars based on layer speed
      star.y += layer.speed * gameSpeed;

      // Reset stars that go off screen
      if (star.y > canvas.height) {
        star.y = 0;
        star.x = Math.random() * canvas.width;
      }
    });
  });
}

// Load high score from local storage
function loadHighScore() {
  const savedHighScore = localStorage.getItem("spaceDefenderHighScore");
  if (savedHighScore !== null) {
    highScore = parseInt(savedHighScore);
  }
  updateHighScoreDisplay();
}

// Save high score to local storage
function saveHighScore() {
  localStorage.setItem("spaceDefenderHighScore", highScore);
}

// Update high score if current score is higher
function checkHighScore() {
  if (score > highScore) {
    highScore = score;
    saveHighScore();
    updateHighScoreDisplay();
    return true;
  }
  return false;
}

// Reset high score
function resetHighScore() {
  highScore = 0;
  saveHighScore();
  updateHighScoreDisplay();
}

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
      // Play laser sound
      playSound("laser");

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

      // Show indicator
      document.getElementById("rapid-fire-indicator").classList.add("active");

      // Play power-up sound
      playSound("powerup");

      // Visual feedback that power-up is activated
      createFloatingText(
        "RAPID FIRE!",
        player.x + player.width / 2,
        player.y - 20,
        "mothership"
      );
    },
  },
  {
    name: "doubleDamage",
    color: "#ffff00",
    duration: 600, // Increased from 300
    effect() {
      player.powerUps.doubleDamage.active = true;
      player.powerUps.doubleDamage.timer = this.duration;

      // Show indicator
      document
        .getElementById("double-damage-indicator")
        .classList.add("active");

      // Play power-up sound
      playSound("powerup");

      // Visual feedback that power-up is activated
      createFloatingText(
        "DAMAGE BOOST x2!",
        player.x + player.width / 2,
        player.y - 20,
        "mothership"
      );
    },
  },
  {
    name: "healthBoost",
    color: "#00ff00",
    effect() {
      const oldHealth = playerHealth;
      playerHealth = Math.min(100, playerHealth + 25); // Increased from 20
      updateHealthDisplay();

      // Show indicator briefly
      document.getElementById("health-boost-indicator").classList.add("active");
      setTimeout(() => {
        document
          .getElementById("health-boost-indicator")
          .classList.remove("active");
      }, 2000);

      // Play power-up sound
      playSound("powerup");

      // Visual feedback for health boost
      createFloatingText(
        `+${playerHealth - oldHealth} HEALTH!`,
        player.x + player.width / 2,
        player.y - 20,
        "mothership"
      );
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
    flashTimer: 0, // Add flash timer for hit effect
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
  // Draw boss if active
  if (bossActive) {
    boss.draw();
    return;
  }

  enemies.forEach((enemy) => {
    // Use flash effect when enemy is hit
    if (enemy.flashTimer > 0) {
      ctx.fillStyle = "#ffffff";
    } else {
      ctx.fillStyle = enemy.color;
    }

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
      ctx.fillStyle = enemy.flashTimer > 0 ? "#ffffff" : "#88ccff";
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
        ctx.fillStyle =
          enemy.flashTimer > 0
            ? "#ffffff"
            : `hsl(${(gameFrame * 5 + i * 120) % 360}, 100%, 70%)`;
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
      ctx.fillStyle = enemy.flashTimer > 0 ? "#ffffff" : "#ff6600";
      ctx.beginPath();
      ctx.moveTo(enemy.x + enemy.width * 0.3, enemy.y + enemy.height * 0.8);
      ctx.lineTo(enemy.x + enemy.width * 0.5, enemy.y + enemy.height);
      ctx.lineTo(enemy.x + enemy.width * 0.7, enemy.y + enemy.height * 0.8);
      ctx.closePath();
      ctx.fill();

      // Cockpit
      ctx.fillStyle = enemy.flashTimer > 0 ? "#ffffff" : "#333333";
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
      ctx.fillStyle = enemy.flashTimer > 0 ? "#ffffff" : "#cc0000";
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

      // Draw health bar for destroyer
      const healthPercent = enemy.health / enemyTypes[1].health;
      ctx.fillStyle = "#333";
      ctx.fillRect(enemy.x, enemy.y - 10, enemy.width, 5);
      ctx.fillStyle =
        healthPercent > 0.6
          ? "#00ff00"
          : healthPercent > 0.3
          ? "#ffff00"
          : "#ff0000";
      ctx.fillRect(enemy.x, enemy.y - 10, enemy.width * healthPercent, 5);
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
      ctx.fillStyle = enemy.flashTimer > 0 ? "#ffffff" : "#ccaaff";
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
      ctx.strokeStyle =
        enemy.flashTimer > 0 ? "#ffffff" : `hsl(${gameFrame % 360}, 100%, 70%)`;
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
        ctx.fillStyle = enemy.flashTimer > 0 ? "#ffffff" : "#7711aa";
        ctx.beginPath();
        ctx.rect(
          enemy.x + enemy.width * (0.2 + i * 0.15),
          enemy.y + enemy.height * 0.7,
          enemy.width * 0.1,
          enemy.height * 0.2
        );
        ctx.fill();
      }

      // Draw health bar for mothership
      const healthPercent = enemy.health / enemyTypes[2].health;
      ctx.fillStyle = "#333";
      ctx.fillRect(enemy.x, enemy.y - 15, enemy.width, 8);
      ctx.fillStyle =
        healthPercent > 0.6
          ? "#00ff00"
          : healthPercent > 0.3
          ? "#ffff00"
          : "#ff0000";
      ctx.fillRect(enemy.x, enemy.y - 15, enemy.width * healthPercent, 8);
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

    // Make double damage bullets larger and more impressive
    if (player.powerUps.doubleDamage.active) {
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(
        bullet.x + bullet.width / 2,
        bullet.y + bullet.height / 2,
        bullet.width,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = bullet.color;
      ctx.fill();
    } else {
      ctx.fillStyle = bullet.color;
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    }

    // Reset shadow for other drawings
    ctx.shadowBlur = 0;
  });
}

// Update enemies
function updateEnemies() {
  // Skip regular enemy updates if boss is active
  if (bossActive) {
    boss.update();
    return;
  }

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

        // Add screen shake
        screenShake = 5;

        // Play hit sound
        playSound("hit");

        // Show damage effect
        showDamageEffect();

        // Check if player is dead
        if (playerHealth <= 0) {
          gameOver();
        }
      }
    }

    // Remove enemies that go off screen
    if (enemy.y > canvas.height) {
      enemies.splice(i, 1);
      // Reset combo when enemy escapes
      combo = 0;
      comboMultiplier = 1;
      document.getElementById("combo-display").style.display = "none";
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

      // Play explosion sound
      playSound("explosion");

      // Add screen shake
      screenShake = 10;

      // Show damage effect
      showDamageEffect();

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
          // Add points with combo multiplier
          const pointsEarned = Math.round(enemy.points * comboMultiplier);
          score += pointsEarned;

          // Show floating score text
          createFloatingText(
            `+${pointsEarned}`,
            enemy.x + enemy.width / 2,
            enemy.y,
            enemy.type
          );

          // Increment combo
          addToCombo();

          updateScoreDisplay();

          // Create explosion
          createExplosion(
            enemy.x + enemy.width / 2,
            enemy.y + enemy.height / 2
          );

          // Play explosion sound
          playSound("explosion");

          // Add screen shake based on enemy size
          if (enemy.type === "mothership") {
            screenShake = 15;
          } else if (enemy.type === "destroyer") {
            screenShake = 10;
          } else {
            screenShake = 5;
          }

          // Remove enemy
          enemies.splice(i, 1);

          // Check for level up
          checkLevelUp();
        } else {
          // Play hit sound for non-fatal hits
          playSound("hit");

          // Show damage indicator for larger enemies
          if (enemy.type === "destroyer" || enemy.type === "mothership") {
            // Add flash effect to enemy
            enemy.flashTimer = 5;

            // Show damage number
            showDamageIndicator(bullet.x, bullet.y, damage);
          }
        }

        break;
      }
    }

    // Update enemy flash timer if it has one
    if (enemy.flashTimer > 0) {
      enemy.flashTimer--;
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

    // Play level up sound
    playSound("levelUp");

    // Update level display with animation
    const levelDisplay = document.getElementById("level-display");
    levelDisplay.textContent = `Level: ${level}`;
    levelDisplay.classList.add("level-up");

    // Create level up text
    createFloatingText(
      `LEVEL UP!`,
      canvas.width / 2,
      canvas.height / 2,
      "mothership"
    );

    // Add screen shake for dramatic effect
    screenShake = 10;

    // Remove animation class after animation completes
    setTimeout(() => {
      levelDisplay.classList.remove("level-up");
    }, 2000);

    // Spawn power-up as level up reward
    if (level % 2 === 0) {
      // Every even level
      const randomType =
        powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
      powerUps.push({
        x: Math.random() * (canvas.width - 30),
        y: Math.random() * (canvas.height / 2) + canvas.height / 4,
        width: 30,
        height: 30,
        speed: 0,
        color: randomType.color,
        type: randomType.name,
        effect: randomType.effect,
        duration: randomType.duration || 0,
      });
    }
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
    document.getElementById("low-health-effect").classList.remove("active");
  } else if (playerHealth > 30) {
    healthBar.style.background = "linear-gradient(to right, #ffcc00, #ffff66)";
    document.getElementById("low-health-effect").classList.remove("active");
  } else {
    healthBar.style.background = "linear-gradient(to right, #ff3333, #ff6666)";
    // Activate low health effect when health is below 30%
    document.getElementById("low-health-effect").classList.add("active");
  }
}

// Show damage effect
function showDamageEffect() {
  const damageOverlay = document.getElementById("damage-overlay");
  damageOverlay.classList.remove("active");

  // Force browser to recognize the removal before adding again
  void damageOverlay.offsetWidth;

  damageOverlay.classList.add("active");
}

// Update high score display
function updateHighScoreDisplay() {
  document.getElementById(
    "high-score-display"
  ).textContent = `High Score: ${highScore}`;
}

// Game over
function gameOver() {
  gameActive = false;

  // Stop background music
  if (soundBuffers.backgroundMusic && soundBuffers.backgroundMusic.stop) {
    soundBuffers.backgroundMusic.stop();
  }

  // Play game over sound
  playSound("gameOver");

  // Check for high score
  const isNewHighScore = checkHighScore();

  // Show game over screen
  document.getElementById("game-over").style.display = "flex";
  document.getElementById("final-score").textContent = `Your score: ${score}`;

  // Show high score message if it's a new high score
  const highScoreMessage = document.getElementById("high-score-message");
  if (isNewHighScore) {
    highScoreMessage.textContent = "NEW HIGH SCORE!";
    highScoreMessage.style.display = "block";
  } else {
    highScoreMessage.style.display = "none";
  }
}

// Floating text for score display
const floatingTexts = [];

function createFloatingText(text, x, y, enemyType) {
  let color = "#ffffff";

  // Different colors based on enemy type
  if (enemyType === "mothership") {
    color = "#ff00ff";
  } else if (enemyType === "destroyer") {
    color = "#ff9900";
  } else {
    color = "#ffffff";
  }

  floatingTexts.push({
    text,
    x,
    y,
    color,
    size: enemyType === "mothership" ? 24 : enemyType === "destroyer" ? 20 : 16,
    alpha: 1,
    velocity: -2,
  });
}

function updateFloatingTexts() {
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const text = floatingTexts[i];
    text.y += text.velocity;
    text.alpha -= 0.02;

    if (text.alpha <= 0) {
      floatingTexts.splice(i, 1);
    }
  }
}

function drawFloatingTexts() {
  floatingTexts.forEach((text) => {
    ctx.fillStyle = text.color
      .replace(")", `, ${text.alpha})`)
      .replace("rgb", "rgba");
    ctx.font = `bold ${text.size}px Arial`;
    ctx.textAlign = "center";
    ctx.fillText(text.text, text.x, text.y);
  });
}

// Update combo
function updateCombo() {
  if (combo > 0) {
    comboTimer--;
    if (comboTimer <= 0) {
      // Reset combo if timer runs out
      combo = 0;
      comboMultiplier = 1;
      document.getElementById("combo-display").style.display = "none";
    } else {
      // Update combo display
      document.getElementById(
        "combo-display"
      ).textContent = `${combo}x Combo (${comboMultiplier.toFixed(1)}x Points)`;
      document.getElementById("combo-display").style.display = "block";
    }
  }
}

// Add to combo
function addToCombo() {
  combo++;
  comboTimer = 120; // 2 seconds at 60fps

  // Increase multiplier (capped at 5.0)
  comboMultiplier = Math.min(5.0, 1 + combo * 0.1);

  // Update combo display
  updateCombo();
}

// Boss definition
const boss = {
  x: 0,
  y: -200,
  width: 200,
  height: 150,
  speed: 2,
  health: 500,
  maxHealth: 500,
  bullets: [],
  active: false,
  phase: 1,
  attackTimer: 0,
  attackCooldown: 60,
  movementPattern: "entrance",
  targetX: 0,
  targetY: 0,
  specialAttackTimer: 0,
  specialAttackCooldown: 300,
  invulnerable: false,
  flashTimer: 0,

  update() {
    if (!this.active) return;

    // Movement patterns
    switch (this.movementPattern) {
      case "entrance":
        // Move down to enter the screen
        if (this.y < 100) {
          this.y += this.speed;
        } else {
          this.movementPattern = "side-to-side";
          this.targetX = canvas.width / 2 - this.width / 2;
        }
        break;

      case "side-to-side":
        // Move side to side at the top of the screen
        const dx = this.targetX - this.x;
        this.x += dx * 0.05;

        // Change direction when reaching target
        if (Math.abs(dx) < 5) {
          this.targetX = Math.random() * (canvas.width - this.width);
        }
        break;

      case "charge":
        // Charge toward player then return to top
        if (this.y < canvas.height + 50) {
          this.y += this.speed * 3;
        } else {
          this.y = -50;
          this.x = Math.random() * (canvas.width - this.width);
          this.movementPattern = "side-to-side";
        }
        break;

      case "circle":
        // Move in a circular pattern
        const centerX = canvas.width / 2 - this.width / 2;
        const centerY = canvas.height / 3;
        const radius = canvas.width / 4;
        const angle = gameFrame * 0.01;

        this.x = centerX + Math.cos(angle) * radius;
        this.y = centerY + Math.sin(angle) * radius;
        break;
    }

    // Attack patterns based on phase - slower attack rates
    this.attackTimer--;
    if (this.attackTimer <= 0) {
      this.attack();
      // Longer cooldowns to give player breathing room
      this.attackTimer = this.attackCooldown + Math.floor(Math.random() * 30); // Add randomness
    }

    // Special attack - much longer cooldowns
    this.specialAttackTimer--;
    if (this.specialAttackTimer <= 0) {
      this.specialAttack();
      // Much longer cooldowns for special attacks
      this.specialAttackTimer =
        this.specialAttackCooldown + Math.floor(Math.random() * 60);
    }

    // Update bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];

      // Move bullet
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;

      // Remove bullets that go off screen
      if (
        bullet.x < -bullet.size ||
        bullet.x > canvas.width + bullet.size ||
        bullet.y < -bullet.size ||
        bullet.y > canvas.height + bullet.size
      ) {
        this.bullets.splice(i, 1);
        continue;
      }

      // Check for collision with player
      if (
        bullet.x - bullet.size < player.x + player.width &&
        bullet.x + bullet.size > player.x &&
        bullet.y - bullet.size < player.y + player.height &&
        bullet.y + bullet.size > player.y
      ) {
        // Player hit by boss bullet
        playerHealth -= bullet.damage;
        updateHealthDisplay();
        this.bullets.splice(i, 1);

        // Add screen shake
        screenShake = 5;

        // Show damage effect
        showDamageEffect();

        // Check if player is dead
        if (playerHealth <= 0) {
          gameOver();
        }
      }
    }

    // Flash effect when taking damage
    if (this.flashTimer > 0) {
      this.flashTimer--;
    }

    // Phase transitions
    if (this.phase === 1 && this.health <= this.maxHealth * 0.7) {
      this.phase = 2;
      this.attackCooldown = 60; // Increased from 45
      this.specialAttackCooldown = 300; // Increased from 240
      this.movementPattern = "circle";
      createFloatingText(
        "PHASE 2",
        this.x + this.width / 2,
        this.y,
        "mothership"
      );
      screenShake = 15;

      // Drop a health power-up to help player
      const healthPowerUp = powerUpTypes.find((p) => p.name === "healthBoost");
      if (healthPowerUp) {
        powerUps.push({
          x: Math.random() * (canvas.width - 30),
          y: canvas.height / 2,
          width: 30,
          height: 30,
          speed: 2,
          color: healthPowerUp.color,
          type: healthPowerUp.name,
          effect: healthPowerUp.effect,
          duration: healthPowerUp.duration || 0,
        });
      }
    } else if (this.phase === 2 && this.health <= this.maxHealth * 0.3) {
      this.phase = 3;
      this.attackCooldown = 45; // Increased from 30
      this.specialAttackCooldown = 240; // Increased from 180
      this.movementPattern = "side-to-side";
      createFloatingText(
        "FINAL PHASE",
        this.x + this.width / 2,
        this.y,
        "mothership"
      );
      screenShake = 20;

      // Drop another power-up to help player
      const randomType =
        powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
      powerUps.push({
        x: Math.random() * (canvas.width - 30),
        y: canvas.height / 2,
        width: 30,
        height: 30,
        speed: 2,
        color: randomType.color,
        type: randomType.name,
        effect: randomType.effect,
        duration: randomType.duration || 0,
      });
    }
  },

  draw() {
    if (!this.active) return;

    // Draw boss with flash effect when hit
    if (this.flashTimer % 6 < 3) {
      ctx.fillStyle = "#ff0000";
    } else {
      ctx.fillStyle = "#660000";
    }

    // Main body
    ctx.beginPath();
    ctx.moveTo(this.x + this.width / 2, this.y);
    ctx.lineTo(this.x + this.width, this.y + this.height * 0.4);
    ctx.lineTo(this.x + this.width * 0.8, this.y + this.height * 0.6);
    ctx.lineTo(this.x + this.width, this.y + this.height);
    ctx.lineTo(this.x, this.y + this.height);
    ctx.lineTo(this.x + this.width * 0.2, this.y + this.height * 0.6);
    ctx.lineTo(this.x, this.y + this.height * 0.4);
    ctx.closePath();
    ctx.fill();

    // Core
    ctx.fillStyle = "#ffcc00";
    ctx.beginPath();
    ctx.arc(
      this.x + this.width / 2,
      this.y + this.height / 2,
      30,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Energy field
    ctx.strokeStyle = `hsl(${gameFrame % 360}, 100%, 50%)`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(
      this.x + this.width / 2,
      this.y + this.height / 2,
      40 + Math.sin(gameFrame * 0.1) * 5,
      0,
      Math.PI * 2
    );
    ctx.stroke();

    // Weapon pods
    ctx.fillStyle = "#cc0000";

    // Left weapon
    ctx.beginPath();
    ctx.arc(
      this.x + this.width * 0.2,
      this.y + this.height * 0.3,
      15,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Right weapon
    ctx.beginPath();
    ctx.arc(
      this.x + this.width * 0.8,
      this.y + this.height * 0.3,
      15,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Bottom weapon
    ctx.beginPath();
    ctx.arc(
      this.x + this.width / 2,
      this.y + this.height * 0.8,
      15,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Draw boss bullets
    this.bullets.forEach((bullet) => {
      ctx.fillStyle = bullet.color;

      // Add glow effect
      ctx.shadowColor = bullet.color;
      ctx.shadowBlur = 10;

      // Draw bullet based on type
      if (bullet.type === "laser") {
        // Draw laser beam
        ctx.beginPath();
        ctx.moveTo(bullet.startX, bullet.startY);
        ctx.lineTo(bullet.x, bullet.y);
        ctx.lineWidth = bullet.size;
        ctx.strokeStyle = bullet.color;
        ctx.stroke();
      } else {
        // Draw regular bullet
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Reset shadow
      ctx.shadowBlur = 0;
    });
  },

  attack() {
    // Different attack patterns based on phase
    switch (this.phase) {
      case 1:
        // Phase 1: Basic spread shot with fewer bullets
        this.spreadShot(5, 2.5, 8, 5, "#ff3333"); // Reduced speed
        break;

      case 2:
        // Phase 2: Faster spread shot + aimed shot but more manageable
        this.spreadShot(5, 3, 10, 7, "#ff6600"); // Reduced count and speed
        if (Math.random() > 0.5) {
          // Only 50% chance to add aimed shot
          this.aimedShot(1, 6, 8, "#ff0000"); // Reduced count and speed
        }
        break;

      case 3:
        // Phase 3: Multiple attack types but more balanced
        const attackType = Math.floor(Math.random() * 3);

        if (attackType === 0) {
          this.spreadShot(7, 4, 10, 10, "#ff0000"); // Reduced count
        } else if (attackType === 1) {
          this.spiralShot(10, 7, 6, "#ff3300"); // Reduced count and speed
        } else {
          this.aimedShot(2, 8, 10, "#ff0066"); // Reduced count
        }
        break;
    }
  },

  specialAttack() {
    // Special attacks based on phase
    switch (this.phase) {
      case 1:
        // Phase 1: Line of bullets with gap
        this.lineShot(16, 5, 8, "#ff9900"); // Reduced count and speed
        break;

      case 2:
        // Phase 2: Spiral pattern with reasonable density
        this.spiralShot(18, 6, 8, "#ff00ff"); // Reduced count and speed
        break;

      case 3:
        // Phase 3: Charge attack with bullet hell but with warning
        this.chargeAttack();
        break;
    }
  },

  spreadShot(count, speed, size, damage, color) {
    // Create spread of bullets
    const angleStep = Math.PI / (count - 1);

    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 2 - Math.PI / 4 + angleStep * i;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      this.bullets.push({
        x: this.x + this.width / 2,
        y: this.y + this.height,
        vx,
        vy,
        size,
        damage,
        color,
        type: "normal",
      });
    }
  },

  aimedShot(count, speed, damage, color) {
    // Shoot directly at player
    for (let i = 0; i < count; i++) {
      // Calculate angle to player
      const dx = player.x + player.width / 2 - (this.x + this.width / 2);
      const dy = player.y + player.height / 2 - (this.y + this.height / 2);
      const angle = Math.atan2(dy, dx);

      // Add slight spread for multiple bullets
      const spreadAngle = angle + (Math.random() - 0.5) * 0.3;

      const vx = Math.cos(spreadAngle) * speed;
      const vy = Math.sin(spreadAngle) * speed;

      this.bullets.push({
        x: this.x + this.width / 2,
        y: this.y + this.height / 2,
        vx,
        vy,
        size: 10,
        damage,
        color,
        type: "normal",
      });
    }
  },

  spiralShot(count, speed, damage, color) {
    // Create spiral of bullets with more manageable density
    const angleStep = (Math.PI * 2) / count;
    const startAngle = gameFrame * 0.05;

    for (let i = 0; i < count; i++) {
      const angle = startAngle + angleStep * i;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      this.bullets.push({
        x: this.x + this.width / 2,
        y: this.y + this.height / 2,
        vx,
        vy,
        size: 8,
        damage,
        color,
        type: "normal",
      });
    }
  },

  lineShot(count, speed, damage, color) {
    // Create line of bullets across the screen with gaps for the player to dodge through
    const gapPosition = Math.floor(Math.random() * (count - 4)) + 2; // Random gap position
    const gapWidth = 2; // Width of the gap (number of bullets to skip)

    for (let i = 0; i < count; i++) {
      // Skip bullets to create a gap
      if (i >= gapPosition && i < gapPosition + gapWidth) {
        continue;
      }

      const xPos = (canvas.width / (count - 1)) * i;

      this.bullets.push({
        x: xPos,
        y: this.y + this.height,
        vx: 0,
        vy: speed,
        size: 8,
        damage,
        color,
        type: "normal",
      });
    }

    // Create a visual indicator for the gap
    createFloatingText(
      "→",
      (canvas.width / (count - 1)) * (gapPosition + gapWidth / 2),
      this.y + this.height + 30,
      "mothership"
    );
  },

  chargeAttack() {
    // Show warning before charge
    createFloatingText(
      "⚠️ CHARGE ATTACK ⚠️",
      canvas.width / 2,
      canvas.height / 2,
      "mothership"
    );

    // Give player time to react
    setTimeout(() => {
      // Change movement pattern to charge
      this.movementPattern = "charge";
      this.targetY = canvas.height + 100;

      // Create warning effect
      screenShake = 10;

      // Create bullets in all directions but with a pattern that can be dodged
      const bulletCount = 12; // Reduced from 16
      const angleStep = (Math.PI * 2) / bulletCount;

      for (let i = 0; i < bulletCount; i++) {
        const angle = angleStep * i;
        const vx = Math.cos(angle) * 4;
        const vy = Math.sin(angle) * 4;

        this.bullets.push({
          x: this.x + this.width / 2,
          y: this.y + this.height / 2,
          vx,
          vy,
          size: 10, // Slightly smaller
          damage: 15,
          color: "#ff0000",
          type: "normal",
        });
      }
    }, 1000); // 1 second warning
  },

  takeDamage(amount) {
    if (this.invulnerable) return;

    this.health -= amount;
    this.flashTimer = 30;

    // Update boss health bar
    updateBossHealthBar();

    // Check if boss is defeated
    if (this.health <= 0) {
      this.defeat();
    }
  },

  defeat() {
    // Create multiple explosions
    for (let i = 0; i < 20; i++) {
      setTimeout(() => {
        const x = this.x + Math.random() * this.width;
        const y = this.y + Math.random() * this.height;
        createExplosion(x, y);
        screenShake = 15;
      }, i * 100);
    }

    // Add score
    const pointsEarned = 1000 * level;
    score += pointsEarned;
    updateScoreDisplay();

    // Show floating text
    createFloatingText(
      `+${pointsEarned}`,
      this.x + this.width / 2,
      this.y,
      "mothership"
    );
    createFloatingText(
      "BOSS DEFEATED!",
      canvas.width / 2,
      canvas.height / 2,
      "mothership"
    );

    // Reset boss
    this.active = false;
    bossActive = false;

    // Hide boss health bar
    document.getElementById("boss-container").style.display = "none";

    // Drop multiple power-ups
    for (let i = 0; i < 3; i++) {
      const randomType =
        powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
      powerUps.push({
        x: this.x + (this.width / 4) * (i + 1),
        y: this.y + this.height / 2,
        width: 30,
        height: 30,
        speed: 2,
        color: randomType.color,
        type: randomType.name,
        effect: randomType.effect,
        duration: randomType.duration || 0,
      });
    }

    // Final explosion
    setTimeout(() => {
      createExplosion(this.x + this.width / 2, this.y + this.height / 2, 100);
      screenShake = 30;
    }, 2000);
  },
};

// Update boss health bar
function updateBossHealthBar() {
  const healthPercent = (boss.health / boss.maxHealth) * 100;
  document.getElementById("boss-health-bar").style.width = `${healthPercent}%`;

  // Change color based on health
  const bossHealthBar = document.getElementById("boss-health-bar");
  if (healthPercent > 60) {
    bossHealthBar.style.background =
      "linear-gradient(to right, #ff0000, #ff3333)";
  } else if (healthPercent > 30) {
    bossHealthBar.style.background =
      "linear-gradient(to right, #ff3300, #ff6600)";
  } else {
    bossHealthBar.style.background =
      "linear-gradient(to right, #ff0000, #990000)";
  }
}

// Start boss encounter
function startBossEncounter() {
  // Play boss warning sound
  playSound("bossWarning");

  // Show warning
  const warning = document.querySelector(".boss-warning");
  warning.style.display = "block";
  screenShake = 10;

  // Clear all enemies and bullets
  enemies.length = 0;

  // Set timer to start boss after warning
  setTimeout(() => {
    warning.style.display = "none";

    // Activate boss
    boss.active = true;
    bossActive = true;
    boss.x = canvas.width / 2 - boss.width / 2;
    boss.y = -boss.height;
    boss.health = boss.maxHealth = 250 * level; // Reduced from 500 * level
    boss.phase = 1;
    boss.attackTimer = boss.attackCooldown;
    boss.specialAttackTimer = boss.specialAttackCooldown;
    boss.movementPattern = "entrance";
    boss.bullets = [];
    boss.flashTimer = 0;
    boss.invulnerable = false;

    // Show boss health bar
    document.getElementById("boss-container").style.display = "flex";
    updateBossHealthBar();
  }, 3000);
}

// Check for boss spawn
function checkBossSpawn() {
  // Spawn boss every 5 levels
  if (level % 5 === 0 && !bossActive && !bossWarningActive) {
    bossWarningActive = true;
    startBossEncounter();
  }
}

// Check for collision with player bullets
function checkBulletCollisions() {
  // Check for collision with boss
  if (bossActive) {
    for (let j = player.bullets.length - 1; j >= 0; j--) {
      const bullet = player.bullets[j];

      if (
        bullet.x < boss.x + boss.width &&
        bullet.x + bullet.width > boss.x &&
        bullet.y < boss.y + boss.height &&
        bullet.y + bullet.height > boss.y
      ) {
        // Boss hit by bullet
        const damage = player.powerUps.doubleDamage.active ? 4 : 2; // Increased base damage and double damage effect
        boss.takeDamage(damage);

        // Remove bullet
        player.bullets.splice(j, 1);

        // Add to combo
        addToCombo();
      }
    }
  }
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
  floatingTexts.length = 0;
  player.powerUps.rapidFire.active = false;
  player.powerUps.rapidFire.timer = 0;
  player.powerUps.doubleDamage.active = false;
  player.powerUps.doubleDamage.timer = 0;
  player.maxShootCooldown = 15;
  combo = 0;
  comboTimer = 0;
  comboMultiplier = 1;
  screenShake = 0;
  bossActive = false;
  bossWarningActive = false;
  boss.active = false;
  boss.bullets = [];

  // Reset UI indicators
  document.getElementById("rapid-fire-indicator").classList.remove("active");
  document.getElementById("double-damage-indicator").classList.remove("active");
  document.getElementById("health-boost-indicator").classList.remove("active");
  document.getElementById("combo-display").style.display = "none";
  document.getElementById("level-display").textContent = `Level: ${level}`;
  document.getElementById("level-display").classList.remove("level-up");
  document.getElementById("damage-overlay").classList.remove("active");
  document.getElementById("low-health-effect").classList.remove("active");
  document.getElementById("boss-container").style.display = "none";
  document.querySelector(".boss-warning").style.display = "none";

  // Update displays
  updateScoreDisplay();
  updateHealthDisplay();
}

// Main game loop
function gameLoop() {
  if (!gameActive) return;

  // Draw background
  drawBackground();

  // Update combo
  updateCombo();

  // Check for boss spawn
  checkBossSpawn();

  // Spawn enemies (only if boss is not active)
  if (!bossActive && gameFrame % enemySpawnRate === 0) {
    createEnemy();
  }

  // Spawn power-ups (less frequently during boss)
  if (
    gameFrame % (bossActive ? powerUpSpawnRate * 2 : powerUpSpawnRate) ===
    0
  ) {
    createPowerUp();
  }

  // Update and draw player
  player.update();
  player.draw();

  // Update and draw player bullets
  updatePlayerBullets();
  drawPlayerBullets();

  // Update and draw enemies or boss
  updateEnemies();
  drawEnemies();

  // Check bullet collisions with boss
  checkBulletCollisions();

  // Update and draw power-ups
  updatePowerUps();
  drawPowerUps();

  // Update and draw explosions
  updateExplosions();
  drawExplosions();

  // Update and draw floating texts
  updateFloatingTexts();
  drawFloatingTexts();

  // Reset screen shake transform if active
  if (screenShake > 0) {
    ctx.restore();
  }

  // Increment game frame
  gameFrame++;

  // Request next frame
  requestAnimationFrame(gameLoop);
}

// Event listeners
document.getElementById("start-button").addEventListener("click", () => {
  // Hide start screen
  document.getElementById("start-screen").style.display = "none";

  // Initialize sounds
  SoundManager.init();

  // Reset game
  resetGame();

  // Start game
  gameActive = true;

  // Start background music
  if (soundEnabled) {
    SoundManager.play("backgroundMusic");
  }

  gameLoop();
});

document.getElementById("restart-button").addEventListener("click", () => {
  // Hide game over screen
  document.getElementById("game-over").style.display = "none";

  // Initialize sounds again
  SoundManager.init();

  // Reset game
  resetGame();

  // Start game
  gameActive = true;

  // Start background music
  if (soundEnabled) {
    SoundManager.play("backgroundMusic");
  }

  gameLoop();
});

document.getElementById("reset-high-score").addEventListener("click", () => {
  // Reset high score
  resetHighScore();

  // Update high score message
  document.getElementById("high-score-message").style.display = "none";
});

// Sound toggle button
document.getElementById("sound-toggle").addEventListener("click", () => {
  SoundManager.toggle();
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
    case "m": // Toggle sound with 'm' key
      SoundManager.toggle();
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
createBackgroundStars();

// Load high score when the game starts
loadHighScore();

// Initialize sound system
SoundManager.init();

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
