// === YouTube Audio Setup ===
let ytPlayer;
let isVideoReady = false;
let userClickedPlay = false;

window.onYouTubeIframeAPIReady = function() {
    ytPlayer = new YT.Player('youtube-player', {
        height: '1',
        width: '1',
        videoId: 't3wNvxkFFLY', // User provided YouTube Video ID
        playerVars: {
            'autoplay': 0,
            'controls': 0,
            'disablekb': 1,
            'fs': 0,
            'loop': 1,
            'playlist': 't3wNvxkFFLY', // Need this so it loops properly
            'origin': window.location.origin === 'file://' ? 'https://localhost' : window.location.origin
        },
        events: {
            'onReady': onPlayerReady,
            'onError': onPlayerError,
            'onStateChange': onPlayerStateChange
        }
    });
};

function onPlayerError(event) {
    console.error("YouTube Player Error:", event.data);
    // 2=invalid parameter, 5=HTML5 player error, 100=video not found/removed/private, 101/150=video owner doesn't allow embed.
}

function onPlayerStateChange(event) {
    console.log("YouTube Player State Change:", event.data);
}

function onPlayerReady(event) {
    isVideoReady = true;
    ytPlayer.setVolume(100); // Set volume to 100%

    // If the user already clicked the envelope before the video was ready, play it now
    if (userClickedPlay) {
        playMusic();
    }
}

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
        userClickedPlay = true; // Mark that user initiated playback
        
        if (isPlaying) return;
        
        if (isVideoReady && ytPlayer && ytPlayer.playVideo) {
            ytPlayer.playVideo();
            isPlaying = true;
            if (pauseBtnText) pauseBtnText.textContent = "Pause Music";
        }
    }

    function toggleControls() {
        if (isPlaying) {
            if (isVideoReady && ytPlayer.pauseVideo) ytPlayer.pauseVideo();
            if (pauseBtnText) pauseBtnText.textContent = "Play Music";
        } else {
            if (isVideoReady && ytPlayer.playVideo) ytPlayer.playVideo();
            if (pauseBtnText) pauseBtnText.textContent = "Pause Music";
        }
        isPlaying = !isPlaying;
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
            // Optional: rewind music
            if (isVideoReady && ytPlayer && ytPlayer.seekTo) {
                ytPlayer.seekTo(0);
            }
            if (!isPlaying) {
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