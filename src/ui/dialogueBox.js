import { k } from "../kaplayCtx.js";
import { initAudio as getAudioCtx } from "../utils/audio.js";

export let isDialogueActive = false;

// Reproduce un "blip" procedimental (usa el AudioContext compartido de audio.js)
function playBlip(char) {
    const audioCtx = getAudioCtx();
    if (!audioCtx) return;
    
    // Ignorar espacios y puntuación
    if (char === " " || char === "." || char === "," || char === "!" || char === "?") return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "sine"; // Sonido suave y redondo
    
    // Variar un poco el tono base para darle vida
    const baseFreq = 700;
    const charOffset = (char.charCodeAt(0) % 10) * 40; 
    osc.frequency.setValueAtTime(baseFreq + charOffset, audioCtx.currentTime);

    // Envelope muy corto
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.07);

    // Optimización estricta de GC
    osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
    };
}

export function startDialogue(lines, onComplete = () => {}) {
    if (isDialogueActive) return;
    isDialogueActive = true;
    globalThis.isDialogueActive = true;
    
    getAudioCtx();

    let currentLineIndex = 0;
    let currentCharIndex = 0;
    let isTyping = false;
    let typeTimer = null;
    let canProgress = false;

    // Retardo para evitar que la misma tecla que abre el diálogo se procese como "siguiente"
    k.wait(0.1, () => canProgress = true);

    // --- CONSTRUCCIÓN VISUAL ---
    
    const dialogueContainer = k.add([
        k.pos(k.width() / 2, k.height() - 20),
        k.anchor("bot"),
        k.z(10000), // Asegurarse de estar sobre cualquier elemento
        k.fixed()
    ]);

    // Fondo redondeado color crema
    const bg = dialogueContainer.add([
        k.rect(500, 100, { radius: 12 }),
        k.color(245, 240, 220),
        k.anchor("bot"),
        k.outline(4, k.rgb(150, 120, 100))
    ]);

    // Texto del diálogo
    const textNode = dialogueContainer.add([
        k.text("", { 
            size: 16, 
            width: 460, 
            align: "left",
            font: "monospace"
        }),
        k.pos(-230, -85), 
        k.color(60, 40, 30)
    ]);

    // Indicador de "Siguiente"
    const nextIndicator = dialogueContainer.add([
        k.text("▼", { size: 14 }),
        k.pos(220, -25),
        k.color(150, 50, 50),
        k.opacity(0)
    ]);

    // Efecto de parpadeo del indicador
    const blinkLoop = k.loop(0.5, () => {
        if (!isTyping) {
            nextIndicator.opacity = nextIndicator.opacity === 1 ? 0 : 1;
        } else {
            nextIndicator.opacity = 0;
        }
    });

    // --- LÓGICA DE MÁQUINA DE ESCRIBIR ---

    function showLine() {
        if (currentLineIndex >= lines.length) {
            closeDialogue();
            return;
        }
        
        isTyping = true;
        currentCharIndex = 0;
        textNode.text = "";
        const line = lines[currentLineIndex];
        
        function typeNextChar() {
            if (!isTyping) return;
            
            if (currentCharIndex < line.length) {
                const char = line[currentCharIndex];
                textNode.text += char;
                playBlip(char);
                currentCharIndex++;
                
                // Pausas dramáticas por puntuación
                let delay = 0.035;
                if (char === "." || char === "!" || char === "?") delay = 0.25;
                else if (char === ",") delay = 0.15;
                
                typeTimer = k.wait(delay, typeNextChar);
            } else {
                isTyping = false;
            }
        }
        
        typeNextChar();
    }

    function skipTyping() {
        if (typeTimer) typeTimer.cancel();
        isTyping = false;
        textNode.text = lines[currentLineIndex];
    }

    function closeDialogue() {
        dialogueContainer.destroy();
        blinkLoop.cancel();
        inputEvent.cancel();
        if (mouseInputEvent) mouseInputEvent.cancel();
        if (virtualInputEvent) {
            window.virtualKeyEvents?.removeEventListener("virtual_keydown", virtualInputEvent);
        }
        
        k.wait(0.1, () => {
            isDialogueActive = false;
            globalThis.isDialogueActive = false;
            onComplete();
        });
    }

    let lastAdvance = 0;
    const nextLineAction = () => {
        if (!canProgress) return;
        const now = performance.now();
        if (now - lastAdvance < 150) return;
        lastAdvance = now;
        if (isTyping) {
            skipTyping();
        } else {
            currentLineIndex++;
            showLine();
        }
    };

    const inputEvent = k.onKeyPress(["space", "e", "enter"], nextLineAction);
    const mouseInputEvent = k.onMousePress(nextLineAction);
    
    let virtualInputEvent = null;
    if (window.virtualKeyEvents) {
        virtualInputEvent = (e) => {
            if (e.detail === 'space' || e.detail === 'e') nextLineAction();
        };
        window.virtualKeyEvents.addEventListener("virtual_keydown", virtualInputEvent);
    }

    // Iniciar la escritura
    showLine();
}
