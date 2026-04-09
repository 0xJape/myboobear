document.addEventListener("DOMContentLoaded", () => {
    // === DOM Elements ===
    const introScene = document.getElementById("intro-container");
    const transitionScene = document.getElementById("transition-scene");
    const letterScene = document.getElementById("letter-container");
    const envelopeWrapper = document.getElementById("envelope-wrapper");
    const envelope = document.getElementById("envelope");
    const letterPaper = document.querySelector(".letter-paper");
    const letterLines = document.querySelectorAll(".letter-line");
    const controls = document.getElementById("controls");
    const replayBtn = document.getElementById("replay-btn");
    const pauseBtn = document.getElementById("pause-btn");
    const pauseBtnText = pauseBtn.querySelector(".btn-text");
    const floatingHeartsContainer = document.getElementById("floating-hearts");

    // === Application State ===
    let isPlaying = false;
    let heartInterval;
    let sceneTimeout;

    // === Initialize Particle Canvas ===
    initParticles();

    // === Core interactions ===

    // 1. Envelope Click (Start Experience)
    envelopeWrapper.addEventListener("click", () => {
        startExperience();
    });

    // Also support keyboard navigation
    envelope.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            startExperience();
        }
    });

    function startExperience() {
        // Prevent multiple clicks
        envelopeWrapper.style.pointerEvents = "none";

        // Play music
        playMusic();

        // 1. Open envelope
        envelope.classList.add("opening");

        // 2. Spawn some initial hearts
        createHeartBurst();

        // 3. Move to transition scene
        setTimeout(() => {
            introScene.classList.remove("active");
            transitionScene.classList.add("active");
            
            // Start background floating hearts
            startFloatingHearts();
            
            // Shift background color warmer
            document.body.style.backgroundColor = "var(--bg-warm)";

            // 4. Move to letter scene
            setTimeout(() => {
                transitionScene.classList.remove("active");
                letterScene.classList.add("active");
                
                // Allow some time for layout, then show paper
                setTimeout(() => {
                    letterPaper.classList.add("visible");
                    revealLetterContent();
                }, 800);

            }, 3500); // Wait for transition words
        }, 1800); // Wait for envelope open animation
    }

    // 2. Letter Reveal Animation
    function revealLetterContent() {
        // Find maximum delay to know when to show controls
        let maxTotalDelay = 0;
        
        // Base delay after paper shows up
        const baseDelayMs = 2000; 

        letterLines.forEach((line) => {
            // The data-delay attribute defines the order (0, 1, 2, 3...)
            const orderDelay = parseInt(line.getAttribute("data-delay") || "0");
            
            // Each line takes 4.5 seconds to read before the next one starts fading in
            const timeToRevealMs = baseDelayMs + (orderDelay * 4500);
            
            setTimeout(() => {
                line.classList.add("visible");
                
                // Let the user scroll at their own pace instead of forcing scroll

            }, timeToRevealMs);

            maxTotalDelay = Math.max(maxTotalDelay, timeToRevealMs);
        });

        // Show controls after the very last line is revealed
        setTimeout(() => {
            controls.classList.add("visible");
        }, maxTotalDelay + 3000); 
    }

    // === Audio Playback ===
    function playMusic() {
        if (isPlaying) return;
        
        const ytContainer = document.getElementById("youtube-audio");
        ytContainer.innerHTML = `<iframe 
            width="560" 
            height="315" 
            src="https://www.youtube.com/embed/C43pOpjLLfM?autoplay=1&loop=1&playlist=C43pOpjLLfM&controls=0&disablekb=1&showinfo=0" 
            title="YouTube video player" 
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            allowfullscreen>
        </iframe>`;
        
        isPlaying = true;
        if (pauseBtnText) pauseBtnText.textContent = "Pause Music";
    }

    function toggleControls() {
        const ytContainer = document.getElementById("youtube-audio");
        if (isPlaying) {
            ytContainer.innerHTML = ''; // Destroy the iframe to stop playback
            if (pauseBtnText) pauseBtnText.textContent = "Play Music";
            isPlaying = false;
        } else {
            playMusic();
        }
    }

    pauseBtn.addEventListener("click", toggleControls);

    // === Reset & Replay ===
    replayBtn.addEventListener("click", () => {
        // Reset state
        clearInterval(heartInterval);
        floatingHeartsContainer.innerHTML = '';
        
        // Reset classes
        letterScene.classList.remove("active");
        letterPaper.classList.remove("visible");
        controls.classList.remove("visible");
        
        letterLines.forEach(line => {
            line.classList.remove("visible");
        });
        
        envelope.classList.remove("opening");
        envelopeWrapper.style.pointerEvents = "auto";
        
        document.body.style.backgroundColor = "var(--bg-deep)";
        
        // Return to intro
        setTimeout(() => {
            introScene.classList.add("active");
            if (!isPlaying) {
                playMusic();
            } else {
                // If it is playing, we can't cleanly seek to 0 with this embed approach without reloading the iframe.
                // So we just restart it.
                const ytContainer = document.getElementById("youtube-audio");
                ytContainer.innerHTML = '';
                isPlaying = false;
                playMusic();
            }
        }, 1000);
    });

    // === Visual Effects (Hearts) ===
    function createHeartBurst() {
        for (let i = 0; i < 15; i++) {
            setTimeout(spawnHeart, Math.random() * 800);
        }
    }

    function startFloatingHearts() {
        heartInterval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                spawnHeart();
            }
        }, 600);
    }

    function spawnHeart() {
        const heart = document.createElement("div");
        heart.classList.add("floating-heart");
        heart.innerHTML = "💖"; // You can mix hearts: 💖, ✨, 💕
        
        // Randomize size, position, and duration
        const size = Math.random() * 1.5 + 0.5; // 0.5rem to 2rem
        const left = Math.random() * 100; // 0% to 100%
        const duration = Math.random() * 10 + 10; // 10s to 20s
        
        heart.style.fontSize = `${size}rem`;
        heart.style.left = `${left}vw`;
        heart.style.animationDuration = `${duration}s`;
        
        floatingHeartsContainer.appendChild(heart);
        
        // Cleanup
        setTimeout(() => {
            if(heart.parentNode) {
                heart.remove();
            }
        }, duration * 1000);
    }

    // === Particle Canvas Background ===
    function initParticles() {
        const canvas = document.getElementById("particles-canvas");
        const ctx = canvas.getContext("2d");
        let width, height;
        let particles = [];

        function resize() {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        }

        window.addEventListener("resize", resize);
        resize();

        class Particle {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.size = Math.random() * 1.5 + 0.1;
                this.speedX = Math.random() * 0.4 - 0.2;
                this.speedY = Math.random() * 0.4 - 0.2;
                this.opacity = Math.random() * 0.5 + 0.1;
            }

            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                
                // Wrap around edges
                if (this.x < 0) this.x = width;
                if (this.x > width) this.x = 0;
                if (this.y < 0) this.y = height;
                if (this.y > height) this.y = 0;
            }

            draw() {
                ctx.fillStyle = `rgba(255, 220, 230, ${this.opacity})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Initialize particles
        const particleCount = Math.min(window.innerWidth / 10, 150); // Responsive count
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }

        function animate() {
            ctx.clearRect(0, 0, width, height);
            
            particles.forEach(p => {
                p.update();
                p.draw();
            });
            
            requestAnimationFrame(animate);
        }

        animate();
    }
});