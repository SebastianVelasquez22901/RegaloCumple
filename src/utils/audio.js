import { k } from "../kaplayCtx.js";

let audioCtx = null;

export function initAudio() {
    try {
        if (!audioCtx) {
            const AudioCtor = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtor) return null;
            audioCtx = new AudioCtor();
        }

        if (audioCtx.state === "suspended") {
            audioCtx.resume().catch(() => {});
        }

        return audioCtx;
    } catch (error) {
        console.warn("No se pudo inicializar el AudioContext:", error);
        return null;
    }
}

// Frecuencias base para las notas (Octava 4)
const notes = {
    'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23,
    'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
    'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46,
    'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
    'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94
};

// Tracks (melodías)
const tracks = {
    music_main: {
        name: "Dulce Soledad",
        tempo: 100,
        melody: [
            { n: 'E4', d: 1 }, { n: null, d: 0.5 }, { n: 'E4', d: 0.5 }, { n: 'D4', d: 1 }, { n: 'C4', d: 1 },
            { n: 'E4', d: 1 }, { n: null, d: 0.5 }, { n: 'E4', d: 0.5 }, { n: 'F4', d: 1 }, { n: 'G4', d: 1 },
            { n: 'A4', d: 2 }, { n: 'G4', d: 2 }, { n: 'F4', d: 2 }, { n: 'E4', d: 2 }
        ]
    },
    music_minigame_1: {
        name: "Elemento",
        tempo: 90,
        melody: [
            { n: 'C4', d: 1 }, { n: 'E4', d: 1 }, { n: 'G4', d: 2 },
            { n: 'C4', d: 1 }, { n: 'F4', d: 1 }, { n: 'A4', d: 2 },
            { n: 'B3', d: 1 }, { n: 'D4', d: 1 }, { n: 'G4', d: 2 },
            { n: 'C4', d: 4 }
        ]
    },
    music_minigame_2: {
        name: "Visita",
        tempo: 140,
        melody: [
            { n: 'E4', d: 0.5 }, { n: 'E4', d: 0.5 }, { n: 'E4', d: 1 }, { n: 'C4', d: 0.5 }, { n: 'D4', d: 0.5 },
            { n: 'E4', d: 1 }, { n: 'F4', d: 1 }, { n: 'G4', d: 2 },
            { n: 'A4', d: 0.5 }, { n: 'A4', d: 0.5 }, { n: 'A4', d: 1 }, { n: 'G4', d: 0.5 }, { n: 'F4', d: 0.5 },
            { n: 'E4', d: 4 }
        ]
    },
    music_minigame_3: {
        name: "Cámara de Faltas",
        tempo: 110,
        melody: [
            { n: 'A3', d: 1 }, { n: 'C4', d: 1 }, { n: 'E4', d: 1 }, { n: 'A4', d: 1 },
            { n: 'G4', d: 1.5 }, { n: 'F4', d: 0.5 }, { n: 'E4', d: 2 },
            { n: 'D4', d: 1 }, { n: 'F4', d: 1 }, { n: 'A4', d: 1 }, { n: 'D5', d: 1 },
            { n: 'C5', d: 1.5 }, { n: 'B4', d: 0.5 }, { n: 'A4', d: 2 }
        ]
    },
    music_credits: {
        name: "Vida en el Espejo",
        tempo: 80,
        melody: [
            { n: 'C4', d: 2 }, { n: 'G4', d: 2 }, { n: 'E4', d: 4 },
            { n: 'F4', d: 2 }, { n: 'A4', d: 2 }, { n: 'G4', d: 4 },
            { n: 'C4', d: 2 }, { n: 'G4', d: 2 }, { n: 'E4', d: 4 },
            { n: 'D4', d: 2 }, { n: 'B3', d: 2 }, { n: 'C4', d: 4 }
        ]
    }
};

let currentOscillators = [];
let isPlaying = false;
let currentTimeout = null;

function playNote(freq, duration) {
    const ctx = initAudio();
    if (!ctx || !freq) return;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);

    currentOscillators.push(osc);
    osc.onended = () => {
        currentOscillators = currentOscillators.filter(o => o !== osc);
    };
}

let currentIndex = 0;
let currentTrack = null;
let currentTrackWidget = null;

function showTrackNotification(songTitle) {
    if (currentTrackWidget) {
        k.destroy(currentTrackWidget);
    }

    const boxWidth = 190;
    const boxHeight = 26;

    currentTrackWidget = k.add([
        k.pos(k.vec2(k.width() - 10, 10)),
        k.anchor("topright"),
        k.fixed(),
        k.z(990)
    ]);

    currentTrackWidget.add([
        k.rect(boxWidth, boxHeight, { radius: 5 }),
        k.color(22, 22, 28),
        k.opacity(0.85),
        k.anchor("topright")
    ]);

    currentTrackWidget.add([
        k.text(`♪ Enjambre - ${songTitle}`, {
            size: 9,
            align: "center",
            width: boxWidth - 12
        }),
        k.pos(k.vec2(-boxWidth / 2, boxHeight / 2)),
        k.anchor("center"),
        k.color(240, 235, 215)
    ]);

    k.wait(3.5, () => {
        if (currentTrackWidget) {
            k.tween(0.85, 0, 0.5, (v) => {
                if (currentTrackWidget && currentTrackWidget.children[0]) {
                    currentTrackWidget.children[0].opacity = v;
                    currentTrackWidget.children[1].opacity = v / 0.85;
                }
            }, k.easings.linear);
            k.wait(0.5, () => {
                if (currentTrackWidget) {
                    k.destroy(currentTrackWidget);
                    currentTrackWidget = null;
                }
            });
        }
    });
}

function loopTrack() {
    if (!isPlaying || !currentTrack) return;

    const noteObj = currentTrack.melody[currentIndex];
    const beatDuration = (60 / currentTrack.tempo);
    const duration = noteObj.d * beatDuration;

    if (noteObj.n && notes[noteObj.n]) {
        playNote(notes[noteObj.n], duration);
    }

    currentIndex = (currentIndex + 1) % currentTrack.melody.length;
    currentTimeout = setTimeout(loopTrack, duration * 1000);
}

let currentTrackName = null;

export function playBGM(trackName) {
    if (!trackName) return;

    if (currentTrackName === trackName && isPlaying) {
        return;
    }

    stopBGM();
    currentTrackName = trackName;

    currentTrack = tracks[trackName];
    if (!currentTrack) return;

    showTrackNotification(currentTrack.name);

    isPlaying = true;
    currentIndex = 0;

    const startPlaying = () => {
        const ctx = initAudio();
        if (!ctx) return;

        if (ctx.state === 'suspended') {
            ctx.resume().then(() => loopTrack()).catch(() => loopTrack());
        } else {
            loopTrack();
        }
    };

    const ctx = initAudio();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
        const unlock = () => {
            ctx.resume().then(() => {
                if (isPlaying) loopTrack();
            }).catch(() => {
                if (isPlaying) loopTrack();
            });
            window.removeEventListener('keydown', unlock);
            window.removeEventListener('mousedown', unlock);
            window.removeEventListener('touchstart', unlock);
        };
        window.addEventListener('keydown', unlock, { once: true });
        window.addEventListener('mousedown', unlock, { once: true });
        window.addEventListener('touchstart', unlock, { once: true });
    } else {
        startPlaying();
    }
}

export function playMusic(trackKey) {
    const aliases = {
        dulce_soledad: 'music_main',
        music_main: 'music_main',
    };
    return playBGM(aliases[trackKey] || trackKey);
}

export function stopBGM() {
    isPlaying = false;
    if (currentTimeout) {
        clearTimeout(currentTimeout);
        currentTimeout = null;
    }
    currentOscillators.forEach(osc => {
        try { osc.stop(); } catch (e) {}
    });
    currentOscillators = [];
}
