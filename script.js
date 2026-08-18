const canvas = document.getElementById("space");
const ctx = canvas.getContext("2d");

const scenes = document.querySelectorAll(".scene");
const startBtn = document.getElementById("startBtn");
const skipBtn = document.getElementById("skip");
const musicBtn = document.getElementById("musicBtn");
const song = document.getElementById("song");
const progress = document.querySelector("#progress i");

let W, H;
let stars = [];
let comets = [];

let currentScene = 0;
let started = false;
let startTime = 0;
let timers = [];

let audioCtx = null;
let master = null;
let melodyGain = null;
let melodyTimer = null;


/* =========================
   КОСМОС
========================= */

function resize() {
    W = window.innerWidth;
    H = window.innerHeight;

    canvas.width = W;
    canvas.height = H;

    stars = [];

    for (let i = 0; i < 180; i++) {
        stars.push({
            x: Math.random() * W,
            y: Math.random() * H,
            r: Math.random() * 1.4 + 0.2,
            a: Math.random() * 0.8 + 0.2
        });
    }

    createComets();
}


function createComets() {

    comets = [
        {
            x: -180,
            y: H * 0.32,
            vx: 3.1,
            vy: 0.7
        },
        {
            x: W + 180,
            y: H * 0.68,
            vx: -3.1,
            vy: -0.7
        }
    ];
}


function drawStars(time) {

    ctx.fillStyle = "#02030a";
    ctx.fillRect(0, 0, W, H);

    stars.forEach(star => {

        const twinkle =
            0.55 +
            Math.sin(time * 0.001 + star.x) * 0.45;

        ctx.globalAlpha = star.a * twinkle;

        ctx.fillStyle = "#ffffff";

        ctx.beginPath();
        ctx.arc(
            star.x,
            star.y,
            star.r,
            0,
            Math.PI * 2
        );

        ctx.fill();
    });

    ctx.globalAlpha = 1;
}


function drawComet(c) {

    const angle = Math.atan2(c.vy, c.vx);

    ctx.save();

    ctx.translate(c.x, c.y);
    ctx.rotate(angle);

    const tail =
        ctx.createLinearGradient(
            -200,
            0,
            30,
            0
        );

    tail.addColorStop(
        0,
        "rgba(255,120,20,0)"
    );

    tail.addColorStop(
        0.7,
        "rgba(255,200,100,.35)"
    );

    tail.addColorStop(
        1,
        "rgba(255,245,220,.95)"
    );

    ctx.fillStyle = tail;

    ctx.beginPath();

    ctx.moveTo(-200, 0);

    ctx.quadraticCurveTo(
        -70,
        -22,
        10,
        -6
    );

    ctx.quadraticCurveTo(
        -70,
        22,
        -200,
        0
    );

    ctx.fill();


    const glow =
        ctx.createRadialGradient(
            0,
            0,
            0,
            0,
            0,
            30
        );

    glow.addColorStop(0, "#ffffff");
    glow.addColorStop(0.2, "#ffe5a0");
    glow.addColorStop(0.65, "#ff9e3d");
    glow.addColorStop(
        1,
        "rgba(255,70,10,0)"
    );

    ctx.fillStyle = glow;

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        30,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.restore();
}


function animation(time) {

    drawStars(time);

    if (started && currentScene <= 1) {

        comets.forEach(comet => {

            comet.x += comet.vx;
            comet.y += comet.vy;

            drawComet(comet);

        });

    }

    requestAnimationFrame(animation);
}


/* =========================
   СЦЕНЫ
========================= */

function showScene(number) {

    currentScene = number;

    scenes.forEach((scene, index) => {

        if (index === number) {
            scene.classList.add("active");
        } else {
            scene.classList.remove("active");
        }

    });

    if (number === 5) {
        fadeBackgroundMusic();
    }
}


/* =========================
   ВСПЫШКА
========================= */

function explosionFlash() {

    const flash = document.createElement("div");

    flash.className = "flash";

    document.body.appendChild(flash);

    requestAnimationFrame(() => {

        flash.classList.add("go");

    });

    setTimeout(() => {

        flash.remove();

    }, 1000);
}


/* =========================
   СЦЕНАРИЙ
========================= */

const timeline = [

    {
        time: 0,
        scene: 0
    },

    {
        time: 16000,
        scene: 1
    },

    {
        time: 34000,
        scene: 2
    },

    {
        time: 78000,
        scene: 3
    },

    {
        time: 125000,
        scene: 4
    },

    {
        time: 188000,
        scene: 5
    }

];


function startTimeline() {

    timers.forEach(timer => clearTimeout(timer));

    timers = [];


    timeline.forEach(item => {

        const timer = setTimeout(() => {

            if (item.scene === 1) {

                explosionFlash();

                showScene(1);

                setTimeout(() => {

                    createComets();

                }, 1000);

            } else {

                showScene(item.scene);

            }

        }, item.time);


        timers.push(timer);

    });


    const progressTimer = setInterval(() => {

        if (!started || currentScene === 5) {

            clearInterval(progressTimer);

            return;
        }

        const elapsed =
            performance.now() - startTime;

        const percent =
            Math.min(
                100,
                elapsed / 188000 * 100
            );

        progress.style.width =
            percent + "%";

    }, 100);

}


/* =========================
   АУДИО
========================= */

function initAudio() {

    if (audioCtx) return;

    const AudioContext =
        window.AudioContext ||
        window.webkitAudioContext;

    if (!AudioContext) return;

    audioCtx = new AudioContext();

    master =
        audioCtx.createGain();

    master.gain.value = 0.1;

    master.connect(
        audioCtx.destination
    );


    melodyGain =
        audioCtx.createGain();

    melodyGain.gain.value = 0.001;

    melodyGain.connect(master);
}


function playNote(
    frequency,
    time,
    duration,
    volume
) {

    if (!audioCtx) return;

    const oscillator =
        audioCtx.createOscillator();

    const gain =
        audioCtx.createGain();

    oscillator.type = "triangle";

    oscillator.frequency.value =
        frequency;

    gain.gain.setValueAtTime(
        0.001,
        time
    );

    gain.gain.exponentialRampToValueAtTime(
        volume,
        time + 0.03
    );

    gain.gain.exponentialRampToValueAtTime(
        0.001,
        time + duration
    );

    oscillator.connect(gain);

    gain.connect(melodyGain);

    oscillator.start(time);

    oscillator.stop(
        time + duration + 0.05
    );
}


function startBackgroundMusic() {

    if (!audioCtx) return;

    const beat = 60 / 126;

    const melody = [
        261.63,
        329.63,
        392.00,
        329.63,
        293.66,
        349.23,
        440.00,
        349.23
    ];


    function playPhrase() {

        if (!started) return;

        const now =
            audioCtx.currentTime + 0.05;

        melody.forEach(
            (frequency, index) => {

                playNote(
                    frequency,
                    now + index * beat / 2,
                    beat * 0.4,
                    0.025
                );

            }
        );

    }


    playPhrase();

    melodyTimer =
        setInterval(
            playPhrase,
            beat * 4 * 1000
        );
}


function fadeBackgroundMusic() {

    if (!melodyGain || !audioCtx)
        return;

    melodyGain.gain.cancelScheduledValues(
        audioCtx.currentTime
    );

    melodyGain.gain.setTargetAtTime(
        0.001,
        audioCtx.currentTime,
        0.5
    );
}


/* =========================
   ГЛАВНАЯ КНОПКА
========================= */

startBtn.onclick = async function () {

    if (started) return;

    started = true;

    startTime =
        performance.now();


    initAudio();


    if (
        audioCtx &&
        audioCtx.state === "suspended"
    ) {

        await audioCtx.resume();

    }


    startBackgroundMusic();


    /*
       Пытаемся сразу запустить песню.
       Это разрешено iPhone,
       потому что функция вызвана
       непосредственно нажатием.
    */

    try {

        await song.play();

        musicBtn.textContent =
            "❚❚ Пауза";

    }

    catch (error) {

        console.log(
            "Автозапуск песни:",
            error
        );

    }


    startTimeline();

};


/* =========================
   ПРОПУСТИТЬ
========================= */

skipBtn.onclick = function () {

    timers.forEach(
        timer => clearTimeout(timer)
    );

    currentScene = 5;

    showScene(5);

};


/* =========================
   КНОПКА ПЕСНИ
========================= */

musicBtn.onclick = async function () {

    try {

        if (
            audioCtx &&
            audioCtx.state === "suspended"
        ) {

            await audioCtx.resume();

        }


        if (song.paused) {

            await song.play();

            musicBtn.textContent =
                "❚❚ Пауза";

        }

        else {

            song.pause();

            musicBtn.textContent =
                "▶ Продолжить";

        }

    }

    catch (error) {

        console.log(error);

    }

};


song.onended = function () {

    musicBtn.textContent =
        "▶ Послушать ещё раз";

};


/* =========================
   ЗАПУСК
========================= */

resize();

window.addEventListener(
    "resize",
    resize
);

requestAnimationFrame(
    animation
);