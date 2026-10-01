import { k } from "../kaplayCtx.js";
import { interactable } from "../components/interactable.js";
import { startDialogue } from "../ui/dialogueBox.js";
import { spawnPlayer } from "../entities/player.js";
import { applyFadeIn, changeScene, setupCamera } from "../utils/transition.js";
import { spawnNPC } from "../entities/npc.js";
import { spawnMemory } from "../entities/collectibleMemory.js";
import { createHUD } from "../ui/hud.js";
import { gameState } from "../state/gameState.js";
import { playBGM } from "../utils/audio.js";
import { setupMobileControls } from "../ui/mobileControls.js";

const MAP_W = 960;
const MAP_H = 720;

k.scene("town", (args = {}) => {
    playBGM("music_main");
    if (window.isMobileMode) setupMobileControls();
    // --- CHEAT CODE DEV ---
    let devCodeBuffer = "";
    const DEV_SECRET = "22092001";
    k.onCharInput((ch) => {
        if (ch >= "0" && ch <= "9") {
            devCodeBuffer += ch;
            if (devCodeBuffer.length > DEV_SECRET.length) {
                devCodeBuffer = devCodeBuffer.slice(-DEV_SECRET.length);
            }
            if (devCodeBuffer === DEV_SECRET) {
                gameState.collectMemory("memoria_1");
                gameState.collectMemory("memoria_2");
                gameState.collectMemory("memoria_3");
                
                const devText = k.add([
                    k.text("¡Modo dev activado: Recuerdos completados (3/3)!", { size: 14 }),
                    k.pos(k.center().x, 40),
                    k.anchor("center"),
                    k.color(255, 215, 0),
                    k.z(9999),
                    k.fixed()
                ]);
                k.wait(3, () => k.destroy(devText));
                devCodeBuffer = "";
            }
        }
    });

    // ---- OPTIMIZACIÓN: OFFSCREEN CANVAS PARA TODO EL SUELO ----
    // Generamos el fondo, hierba y caminos una sola vez de forma nativa
    const floorCanvas = document.createElement("canvas");
    floorCanvas.width = MAP_W;
    floorCanvas.height = MAP_H;
    const ctx = floorCanvas.getContext("2d");
    
    ctx.fillStyle = "rgb(100, 180, 90)";
    ctx.fillRect(0, 0, MAP_W, MAP_H);

    for (let i = 0; i < 250; i++) {
        const rx = Math.random() * MAP_W;
        const ry = Math.random() * MAP_H;
        ctx.fillStyle = "rgb(80, 160, 70)";
        ctx.fillRect(rx, ry, 3, 4);
        if (Math.random() < 0.15) {
            ctx.fillStyle = `rgb(${200+Math.random()*55}, ${200+Math.random()*55}, 255)`;
            ctx.fillRect(rx + 2, ry + 3, 2, 2);
        }
    }

    function drawCtxPath(x, y, w, h) {
        ctx.fillStyle = "rgb(180, 140, 90)";
        if (ctx.roundRect) {
            ctx.beginPath(); ctx.roundRect(x - w/2 - 6, y - h/2 - 6, w + 12, h + 12, 16); ctx.fill();
            ctx.fillStyle = "rgb(210, 170, 110)";
            ctx.beginPath(); ctx.roundRect(x - w/2, y - h/2, w, h, 12); ctx.fill();
        } else {
            ctx.fillRect(x - w/2 - 6, y - h/2 - 6, w + 12, h + 12);
            ctx.fillStyle = "rgb(210, 170, 110)";
            ctx.fillRect(x - w/2, y - h/2, w, h);
        }
    }

    drawCtxPath(450, 260, 70, 220);
    drawCtxPath(330, 420, 320, 60);
    
    ctx.fillStyle = "rgb(180, 140, 90)";
    ctx.beginPath(); ctx.arc(480, 520, 95, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "rgb(210, 170, 110)";
    ctx.beginPath(); ctx.arc(480, 520, 85, 0, Math.PI*2); ctx.fill();

    // Cargamos y pintamos el canvas de fondo generado on-the-fly
    k.loadSprite("town_floor_cache", floorCanvas.toDataURL("image/png")).then(() => {
        k.add([ k.sprite("town_floor_cache"), k.pos(0,0), k.z(0) ]);
    });
    // Fallback de color mientras carga
    k.add([ k.rect(MAP_W, MAP_H), k.color(100, 180, 90), k.pos(0, 0), k.z(-1) ]);

    // Limites de colisión
    k.add([k.rect(MAP_W, 16), k.pos(0, -16), k.area(), k.body({ isStatic: true })]);
    k.add([k.rect(MAP_W, 16), k.pos(0, MAP_H), k.area(), k.body({ isStatic: true })]);
    k.add([k.rect(16, MAP_H), k.pos(-16, 0), k.area(), k.body({ isStatic: true })]);
    k.add([k.rect(16, MAP_H), k.pos(MAP_W, 0), k.area(), k.body({ isStatic: true })]);

    // ---- CASA EXTERIOR 3D ----
    const house = k.add([
        k.pos(480, 180),
        k.area({ shape: new k.Rect(k.vec2(-55, -20), 110, 60) }),
        k.body({ isStatic: true }),
        k.z(180)
    ]);
    
    // Sombra proyectada
    house.add([k.rect(130, 30, { radius: 10 }), k.color(0,0,0), k.opacity(0.2), k.anchor("center"), k.pos(0, 35)]);

    // Pared estuco y zócalo
    house.add([k.rect(110, 80, { radius: 4 }), k.color(245, 235, 220), k.anchor("center"), k.pos(0, 0)]);
    house.add([k.rect(110, 12), k.color(160, 110, 80), k.anchor("center"), k.pos(0, 34)]);

    // Techo
    const roof = house.add([k.pos(0, -40)]);
    roof.add([k.polygon([k.vec2(-65, 0), k.vec2(65, 0), k.vec2(45, -55), k.vec2(-45, -55)]), k.color(180, 70, 50)]);
    roof.add([k.polygon([k.vec2(-60, 0), k.vec2(60, 0), k.vec2(42, -50), k.vec2(-42, -50)]), k.color(210, 90, 70)]); 
    house.add([k.rect(110, 6), k.color(0, 0, 0), k.opacity(0.15), k.anchor("center"), k.pos(0, -37)]); 

    // Ventana Cálida
    const win = house.add([k.pos(-30, -5)]);
    win.add([k.rect(24, 28, { radius: 4 }), k.color(120, 80, 50), k.anchor("center")]); 
    win.add([k.rect(18, 22), k.color(255, 240, 140), k.anchor("center")]); 
    win.add([k.rect(18, 3), k.color(120, 80, 50), k.anchor("center")]); 
    win.add([k.rect(3, 22), k.color(120, 80, 50), k.anchor("center")]);

    // Puerta
    house.add([k.rect(28, 44, { radius: 2 }), k.color(100, 60, 40), k.anchor("bot"), k.pos(0, 40)]);
    house.add([k.rect(22, 38, { radius: 2 }), k.color(130, 80, 50), k.anchor("bot"), k.pos(0, 40)]);
    house.add([k.circle(2.5), k.color(220, 190, 60), k.pos(6, 18)]);

    // Escalón
    house.add([k.rect(40, 8, { radius: 4 }), k.color(180, 170, 160), k.anchor("center"), k.pos(0, 44)]);

    k.add([
        k.rect(36, 40), k.pos(480, 205), k.anchor("center"), k.area(), k.z(202), k.opacity(0),
        "interactable_entity",
        interactable({
            promptText: "(E) Entrar a casa",
            onInteract: () => changeScene("house", k.vec2(160, 200), k.vec2(0, -1))
        })
    ]);

    // ---- BUZÓN MÁGICO 3D ----
    const buzon = k.add([
        k.pos(560, 240),
        k.area({ shape: new k.Rect(k.vec2(-8, -10), 16, 20) }),
        k.body({ isStatic: true }),
        k.z(240),
        k.scale(1),
        "interactable_entity",
        interactable({
            promptText: "(E) Buzón",
            onInteract: () => {
                if (gameState.isFinaleReady) {
                    if (globalThis.finaleStarted) return;
                    globalThis.finaleStarted = true;
                    globalThis.isCinematic = true;
                    
                    const showFinalLetter = (onClose) => {
                        k.get("memoryUI").forEach(u => u.hidden = true);
                        
                        const overlay = k.add([
                            k.rect(k.width(), k.height()),
                            k.color(0, 0, 0),
                            k.opacity(0.65),
                            k.z(900),
                            k.fixed()
                        ]);

                        const cardWidth = k.width() * 0.84;
                        const cardHeight = k.height() * 0.78;

                        const card = k.add([
                            k.rect(cardWidth, cardHeight, { radius: 8 }),
                            k.pos(k.center()),
                            k.anchor("center"),
                            k.color(248, 241, 227),
                            k.z(901),
                            k.fixed()
                        ]);

                        const letterText = k.add([
                            k.text(
                                "Son pocos recuerdos para todos los que hemos ido formando estos meses,\n" +
                                "pero son regalos que han llegado a mí porque tú estás viva y me has hecho sentir vivo.\n\n" +
                                "Así que si bien hoy es tu cumpleaños donde deberías recibir todos los regalos del mundo,\n" +
                                "yo me siento profundamente agradecido porque el verdadero regalo nos lo das tú\n" +
                                "a todos nosotros —tu familia, tus amigos y a mí— solo por estar con vida\n" +
                                "y alegrarnos cada uno de nuestros días.\n\n" +
                                "Gracias por existir y gracias por ser como eres.\n\n" +
                                `[ ${window.isMobileMode ? "Toca la pantalla" : "Presiona ESPACIO"} para continuar ]`,
                                {
                                    size: 10,
                                    lineSpacing: 5,
                                    align: "center",
                                    width: cardWidth - 40
                                }
                            ),
                            k.pos(Math.round(k.center().x), Math.round(k.center().y)),
                            k.anchor("center"),
                            k.color(50, 40, 35),
                            k.z(902),
                            k.scale(1),
                            k.fixed()
                        ]);

                        const cleanup = () => {
                            k.destroy(overlay);
                            k.destroy(card);
                            k.destroy(letterText);
                            onClose();
                        };

                        k.wait(0.5, () => {
                            const handler = k.onKeyPress("space", () => {
                                handler.cancel();
                                cleanup();
                            });
                            const clickHandler = k.onMousePress(() => {
                                clickHandler.cancel();
                                if (handler) handler.cancel();
                                cleanup();
                            });
                        });
                    };

                    const triggerSnoopyCelebration = () => {
                        const snoopy = k.add([
                            k.sprite("snoopy_cool"),
                            k.pos(house.pos.x + 30, house.pos.y - 20),
                            k.anchor("center"),
                            k.scale(1),
                            k.z(house.z - 1)
                        ]);
                            
                            const player = k.get("player")[0];
                            const targetY = player ? player.pos.y : house.pos.y + 60;
                            
                            k.tween(snoopy.pos.y, targetY, 1, (y) => snoopy.pos.y = y - Math.abs(Math.sin(k.time() * 10)) * 20, k.easings.linear);
                            k.tween(snoopy.pos.x, player.pos.x + 30, 1, (x) => snoopy.pos.x = x, k.easings.linear);
                            
                            k.wait(1.1, () => {
                                snoopy.z = player.z + 1;
                                const bubble = k.add([
                                    k.rect(240, 40, { radius: 8 }),
                                    k.pos(Math.round(snoopy.pos.x), Math.round(snoopy.pos.y - 40)),
                                    k.anchor("center"),
                                    k.color(20, 20, 25),
                                    k.outline(2, k.rgb(255, 215, 0)),
                                    k.z(2000)
                                ]);
                                bubble.add([
                                    k.text("¡Te amo nena, nena cumpleañera!", { size: 14, width: 220, align: "center", font: "monospace" }),
                                    k.color(255, 255, 255),
                                    k.pos(0, 0), k.anchor("center"),
                                    k.z(2001)
                                ]);
                                k.wait(4, () => k.destroy(bubble));
                            });

                        // Efectos de Fiesta
                        const colors = ["#FF5964", "#FEE180", "#69D2E7", "#A8E6CF"];
                        k.loop(0.1, () => {
                            k.add([
                                k.sprite("item_corazon"),
                                k.pos(k.rand(0, k.width()), k.height() + 20),
                                k.move(k.UP, k.rand(80, 150)),
                                k.opacity(1),
                                k.scale(k.rand(1, 2)),
                                k.lifespan(4, { fade: 1 }),
                                k.offscreen({ destroy: true }),
                                k.fixed(), k.z(2000)
                            ]).onUpdate(function() {
                                this.pos.x += Math.sin(k.time() * 3 + this.pos.y) * 2;
                            });

                            k.add([
                                k.rect(6, 12),
                                k.pos(k.rand(0, k.width()), -20),
                                k.color(k.Color.fromHex(k.choose(colors))),
                                k.move(k.DOWN, k.rand(150, 300)),
                                k.opacity(1),
                                k.lifespan(4, { fade: 0.5 }),
                                k.offscreen({ destroy: true }),
                                k.fixed(), k.z(2000)
                            ]).onUpdate(function() {
                                this.angle += 10;
                                this.pos.x += Math.sin(k.time() * 5 + this.pos.y) * 3;
                            });
                        });

                        k.wait(6.5, () => {
                            triggerEndingCredits();
                        });
                    };

                    const triggerEndingCredits = () => {
                        const fade = k.add([
                            k.rect(k.width(), k.height()),
                            k.pos(0, 0),
                            k.color(0, 0, 0),
                            k.opacity(0),
                            k.fixed(), k.z(9999)
                        ]);
                        k.tween(0, 1, 2, (v) => fade.opacity = v, k.easings.linear);
                        
                        k.wait(2.5, () => {
                            globalThis.isCinematic = false;
                            k.go("credits");
                        });
                    };

                    showFinalLetter(() => {
                        triggerSnoopyCelebration();
                    });
                } else {
                    startDialogue([
                        "El buzón está cerrado.",
                        "Necesitas encontrar los 3 recuerdos esparcidos por el pueblo primero."
                    ]);
                }
            }
        })
    ]);
    
    buzon.add([k.rect(6, 24), k.color(120, 80, 50), k.anchor("bot"), k.pos(0, 16)]);
    buzon.add([k.circle(10), k.scale(1, 4/10), k.color(0,0,0), k.opacity(0.3), k.pos(0, 16), k.z(-1)]);
    buzon.add([k.rect(22, 16, { radius: 6 }), k.color(220, 50, 50), k.anchor("center"), k.pos(0, -6)]);
    buzon.add([k.rect(24, 6, { radius: 3 }), k.color(240, 70, 70), k.anchor("center"), k.pos(0, -12)]); 
    buzon.add([k.rect(14, 2, { radius: 1 }), k.color(50, 30, 30), k.anchor("center"), k.pos(0, -4)]); 
    buzon.add([k.rect(3, 12, { radius: 1 }), k.color(240, 200, 50), k.anchor("bot"), k.pos(14, -4)]);

    // NPCs
    spawnNPC("pepe", k.vec2(380, 480), k.rgb(120, 160, 200), "Pepe Mapache", {
        initial: ["¡Ey! ¡Feliz cumpleaños!", "Alguien escondió regalitos por el pueblo.", "Deberías buscarlos."],
        afterMemoryCheck: () => gameState.hasCollected("memoria_1"),
        afterMemory: ["¡Bien hecho encontrando el primero!"],
        completed: ["¡Wao! ¡Los encontraste todos! Revisa el buzón."]
    });

    // Limpiar gatos anteriores si existen (por precaución)
    k.destroyAll("cat");

    const gatosConfig = [
        { spriteId: "gato_sentado", pos: k.vec2(420, 290), nombre: "Gema" }, // Negro/Gris
        { spriteId: "gato_panecillo", pos: k.vec2(250, 520), nombre: "Crudo" }, // Naranja
        { spriteId: "gato_durmiendo", pos: k.vec2(710, 340), nombre: "Oreo" }
    ];

    gatosConfig.forEach(g => {
        k.add([
            k.sprite(g.spriteId),
            k.pos(g.pos),
            k.anchor("center"),
            k.scale(1),
            k.z(10),
            k.area(),
            k.body({ isStatic: true }),
            "interactable_entity",
            "cat",
            { catName: g.nombre },
            interactable({
                promptText: `(E) Acariciar a ${g.nombre}`,
                onInteract: () => {
                    if (g.nombre === "Crudo") {
                        startDialogue([
                            "Mejor me alejo o siento que me morderá la pantorrilla..."
                        ]);
                    } else {
                        startDialogue([
                            `Miau... (${g.nombre} está descansando tranquilamente)`
                        ]);
                    }
                }
            })
        ]);
    });

    // Snoopy ha sido retirado del mapa inicial y solo aparecerá en la cinemática.
    spawnMemory("memoria_1", k.vec2(250, 250), {
        initialLines: ["¡Un regalo escondido!", "Una foto de un viaje especial.", "¡Qué buena memoria!"],
        reminderLines: ["Ya abriste este regalo."],
        onUnlock: () => {
            const player = k.get("player")[0];
            globalThis.lastPlayerPos = player ? player.pos : k.vec2(250, 250);
            k.go("minigame_hospital");
        }
    });

    spawnMemory("memoria_2", k.vec2(750, 600), {
        initialLines: ["¡Un recuerdo brillante!", "Es un ticket de cine.", "¡Esa vez te reíste muchísimo!"],
        reminderLines: ["Ya tienes este recuerdo."],
        onUnlock: () => {
            const player = k.get("player")[0];
            globalThis.lastPlayerPos = player ? player.pos : k.vec2(750, 600);
            k.go("minigame_space_invaders");
        }
    });

    spawnMemory("memoria_3", k.vec2(800, 250), {
        initialLines: ["¡El último regalo!", "Una nota escrita a mano: 'Gracias por todo'.", "¡Qué bonito!"],
        reminderLines: ["El regalo está vacío."],
        onUnlock: () => {
            const player = k.get("player")[0];
            globalThis.lastPlayerPos = player ? player.pos : k.vec2(800, 250);
            k.go("minigame_traffic");
        }
    });

    // ---- OPTIMIZACIÓN: ÁRBOLES CACHEADOS OFFSCREEN ----
    function addTree(x, y) {
        const isFruit = k.chance(0.5);
        const spriteName = isFruit ? "tree_fruit_cached" : "tree_cached";
        
        const tree = k.add([
            k.sprite(spriteName),
            k.anchor("bot"), // El sprite se ancla desde abajo
            k.pos(x, y),
            k.area({ shape: new k.Rect(k.vec2(-10, -20), 20, 14) }), // Hitbox ajustado al ancla
            k.body({ isStatic: true }),
            k.z(y)
        ]);

        // Culling básico: si el árbol está muy lejos, desactivamos updates
        tree.onUpdate(() => {
            const cam = k.camPos();
            const dist = Math.abs(tree.pos.x - cam.x) + Math.abs(tree.pos.y - cam.y);
            tree.hidden = dist > 600;
        });
    }

    const treePositions = [
        [200, 200], [800, 300], [300, 500], [700, 600],
        [150, 600], [850, 150], [200, 400], [600, 350],
        [100, 300], [400, 150], [800, 500]
    ];
    for (const p of treePositions) addTree(p[0], p[1]);

    const startPos = args.spawnPos || k.vec2(480, 280);
    const facing = args.facing || k.vec2(0, 1);
    const player = spawnPlayer(startPos, facing);

    setupCamera(player, MAP_W, MAP_H);
    applyFadeIn();
    createHUD();
});
