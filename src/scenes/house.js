import { k } from "../kaplayCtx.js";
import { interactable } from "../components/interactable.js";
import { startDialogue } from "../ui/dialogueBox.js";
import { spawnPlayer } from "../entities/player.js";
import { applyFadeIn, changeScene, setupCamera } from "../utils/transition.js";
import { createHUD } from "../ui/hud.js";
import { playBGM } from "../utils/audio.js";
import { setupMobileControls } from "../ui/mobileControls.js";

const MAP_W = 320;
const MAP_H = 240;

k.scene("house", (args = {}) => {
    playBGM("music_main");
    if (window.isMobileMode) setupMobileControls();
    
    // Suelo de madera cálida con listones
    k.add([k.rect(MAP_W, MAP_H), k.color(140, 90, 60), k.pos(0, 0)]);
    for(let i=1; i<MAP_W/20; i++) {
        k.add([k.rect(2, MAP_H), k.color(120, 70, 40), k.pos(i*20, 0)]);
    }
    
    // Muros oscuros con zócalo
    k.add([k.rect(MAP_W, 30), k.pos(0, 0), k.area(), k.body({ isStatic: true }), k.color(90, 60, 40)]);
    k.add([k.rect(MAP_W, 6), k.pos(0, 30), k.color(110, 80, 50)]); // Zócalo

    k.add([k.rect(MAP_W, 16), k.pos(0, MAP_H - 16), k.area(), k.body({ isStatic: true }), k.color(60, 40, 20)]);
    k.add([k.rect(16, MAP_H), k.pos(0, 0), k.area(), k.body({ isStatic: true }), k.color(60, 40, 20)]);
    k.add([k.rect(16, MAP_H), k.pos(MAP_W - 16, 0), k.area(), k.body({ isStatic: true }), k.color(60, 40, 20)]);

    // Cama estilizada
    const bed = k.add([k.pos(50, 40), k.area({ shape: new k.Rect(k.vec2(0,0), 56, 76) }), k.body({ isStatic: true }), k.z(40)]);
    bed.add([k.rect(56, 76, { radius: 6 }), k.color(120, 80, 50)]); // Marco
    bed.add([k.rect(48, 64, { radius: 4 }), k.color(80, 130, 220), k.pos(4, 8)]); // Colchón/Manta
    bed.add([k.rect(48, 16, { radius: 2 }), k.color(240, 240, 240), k.pos(4, 12)]); // Almohada
    bed.add([k.rect(48, 8), k.color(60, 100, 180), k.pos(4, 64)]); // Doblez

    // Alfombra mullida de dos tonos
    k.add([k.rect(90, 90, { radius: 45 }), k.color(220, 110, 110), k.pos(MAP_W/2, MAP_H/2), k.anchor("center"), k.z(1)]);
    k.add([k.rect(70, 70, { radius: 35 }), k.color(240, 130, 130), k.pos(MAP_W/2, MAP_H/2), k.anchor("center"), k.z(2)]);

    // Mesita de noche 3D
    const desk = k.add([k.pos(110, 35), k.area({ shape: new k.Rect(k.vec2(0,0), 24, 24) }), k.body({ isStatic: true }), k.z(35)]);
    desk.add([k.circle(14), k.scale(1, 6/14), k.color(0,0,0), k.opacity(0.3), k.pos(12, 26), k.z(-1)]); // sombra
    desk.add([k.rect(24, 24, { radius: 2 }), k.color(140, 90, 60)]); // Top
    desk.add([k.rect(20, 16), k.color(110, 60, 40), k.pos(2, 24)]); // Frontal
    desk.add([k.rect(6, 2), k.color(60, 30, 20), k.pos(9, 28)]); // Tirador
    
    // Nota en la pared
    const wallNote = k.add([
        k.rect(16, 16, { radius: 1 }),
        k.color(240, 230, 200),
        k.pos(200, 15),
        k.z(10),
        k.area(),
        "interactable_entity",
        interactable({
            promptText: "(E) Leer Nota",
            onInteract: () => {
                globalThis.hasReadWallNote = true;
                startDialogue([
                    "¡Feliz cumpleaños, mi vida!",
                    "Hoy es un día muy especial y preparé una pequeña sorpresa para ti.",
                    "Sal al jardín; hay algunos recuerdos y amigos esperándote afuera.",
                    "Ve a explorarlo con calma. Te amo."
                ]);
            }
        })
    ]);
    
    // Chinche roja sujetando la nota
    wallNote.add([k.circle(2), k.color(200, 30, 30), k.pos(8, 2)]);
    
    // Eliminamos la nota del escritorio para unificar en la pared
    // Felpudo y puerta de salida
    k.add([k.rect(56, 24, { radius: 4 }), k.color(180, 160, 140), k.pos(MAP_W/2, MAP_H - 12), k.anchor("center"), k.z(1)]);
    k.add([k.rect(48, 16, { radius: 2 }), k.color(150, 130, 110), k.pos(MAP_W/2, MAP_H - 12), k.anchor("center"), k.z(2)]);
    
    k.add([
        k.rect(56, 16), k.color(130, 80, 50), k.pos(MAP_W/2, MAP_H - 8), k.anchor("center"), k.area(), k.z(3), "exit_door"
    ]);
    
    // Control de estado para salir
    globalThis.hasReadWallNote = false;

    const startPos = args.spawnPos || k.vec2(60, 100); 
    const facing = args.facing || k.vec2(0, 1);
    const player = spawnPlayer(startPos, facing);

    player.onCollide("exit_door", () => {
        if (!globalThis.hasReadWallNote) {
            // Empujar levemente al jugador y mostrar advertencia
            player.pos.y -= 10;
            player.velocity.y = 0;
            startDialogue(["La puerta está cerrada...", "Siento que me falta leer algo en la pared antes de salir."]);
            return;
        }
        changeScene("town", k.vec2(480, 260), k.vec2(0, 1));
    });

    setupCamera(player, MAP_W, MAP_H);
    applyFadeIn();
    
    createHUD();
    
    // Si no venimos de otra escena, mostrar Intro
    if (!args.spawnPos) {
        // Oscurecer y crear fade in
        const veil = k.add([
            k.rect(k.width(), k.height()),
            k.color(0, 0, 0),
            k.fixed(),
            k.z(999),
            k.opacity(1)
        ]);
        
        // Efecto de fade in
        k.tween(1, 0, 1, (v) => veil.opacity = v, k.easings.linear);

        // Bloqueo simulado temporal para usar lógica de diálogo
        const wasDialogueActive = (typeof globalThis.isIntroActive !== 'undefined') ? globalThis.isIntroActive : false;
        globalThis.isIntroActive = true;
        
        // Bloquear movimiento hackeando el estado global del diálogo
        player.paused = true;
        
        const introBox = k.add([
            k.rect(400, 150, { radius: 8 }),
            k.color(20, 20, 25),
            k.outline(4, k.rgb(180, 180, 200)),
            k.pos(k.width() / 2, k.height() / 2),
            k.anchor("center"),
            k.fixed(),
            k.z(1000)
        ]);

        introBox.add([
            k.text(`¿Dónde estoy?\n\nTodo se siente familiar, pero diferente...\n\n[ ${window.isMobileMode ? "Toca la pantalla" : "Presiona ESPACIO"} para continuar ]`, { size: 16, width: 360, align: "center", font: "monospace" }),
            k.color(220, 220, 220),
            k.anchor("center")
        ]);

        const closeIntro = () => {
            introBox.destroy();
            globalThis.isIntroActive = false;
            player.paused = false;
            introInput.cancel();
            mouseInput.cancel();
        };
        const introInput = k.onKeyPress("space", closeIntro);
        const mouseInput = k.onMousePress(closeIntro);
    }
});

