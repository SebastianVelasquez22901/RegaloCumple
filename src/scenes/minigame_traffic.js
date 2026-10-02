import { k } from "../kaplayCtx.js";
import { playBGM } from "../utils/audio.js";

import { setupMobileControls } from "../ui/mobileControls.js";

async function loadTrafficAssets() {
    const genSprite = async (name, w, h, drawFn) => {
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        drawFn(ctx);
        await k.loadSprite(name, canvas.toDataURL());
    };

    await Promise.all([
        genSprite("spr_mazda3_player", 22, 38, (ctx) => {
            // Carrocería gris metálico
            ctx.fillStyle = "#757575";
            ctx.beginPath(); ctx.roundRect(2, 2, 18, 34, 4); ctx.fill();
            // Techo más oscuro
            ctx.fillStyle = "#616161";
            ctx.fillRect(4, 12, 14, 16);
            // Parabrisas
            ctx.fillStyle = "#212121";
            ctx.beginPath(); ctx.moveTo(4, 12); ctx.lineTo(18, 12); ctx.lineTo(16, 6); ctx.lineTo(6, 6); ctx.fill(); // Frente
            ctx.beginPath(); ctx.moveTo(4, 28); ctx.lineTo(18, 28); ctx.lineTo(16, 34); ctx.lineTo(6, 34); ctx.fill(); // Trasero
            // Luces delanteras (proyectando levemente)
            ctx.fillStyle = "#FFF59D";
            ctx.fillRect(2, 2, 4, 3);
            ctx.fillRect(16, 2, 4, 3);
            // Destello de flores en el copiloto
            ctx.fillStyle = "#F48FB1";
            ctx.fillRect(12, 14, 4, 4);
            ctx.fillStyle = "#FFEB3B";
            ctx.fillRect(14, 15, 2, 2);
        }),
        genSprite("spr_traffic_car_blue", 20, 34, (ctx) => {
            ctx.fillStyle = "#1976D2";
            ctx.beginPath(); ctx.roundRect(2, 2, 16, 30, 3); ctx.fill();
            ctx.fillStyle = "#212121";
            ctx.fillRect(4, 8, 12, 14); // Techo
            ctx.fillStyle = "#111111";
            ctx.fillRect(5, 6, 10, 4); // Ventana frente
            ctx.fillRect(5, 22, 10, 3); // Ventana atrás
        }),
        genSprite("spr_traffic_truck", 24, 44, (ctx) => {
            ctx.fillStyle = "#F57C00";
            ctx.fillRect(2, 10, 20, 32); // Caja
            ctx.fillStyle = "#B0BEC5";
            ctx.fillRect(4, 2, 16, 8); // Cabina
            ctx.fillStyle = "#111111";
            ctx.fillRect(5, 4, 14, 4); // Parabrisas
        }),
        genSprite("spr_puddle", 22, 14, (ctx) => {
            ctx.fillStyle = "#546E7A";
            ctx.beginPath();
            ctx.ellipse(11, 7, 10, 6, 0, 0, Math.PI * 2);
            ctx.fill();
        }),
        genSprite("spr_flower_boost", 16, 16, (ctx) => {
            ctx.fillStyle = "#4CAF50";
            ctx.fillRect(6, 6, 4, 8); // tallos
            ctx.fillStyle = "#F48FB1";
            ctx.beginPath(); ctx.arc(5, 5, 4, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(11, 5, 4, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(8, 9, 4, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#FFEB3B";
            ctx.beginPath(); ctx.arc(5, 5, 1.5, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(11, 5, 1.5, 0, Math.PI * 2); ctx.fill();
        }),
        genSprite("spr_cutscene_park", 36, 36, (ctx) => {
            // Suelo mojado
            ctx.fillStyle = "#37474F";
            ctx.fillRect(0, 0, 36, 36);
            // Árboles verdes
            ctx.fillStyle = "#2E7D32";
            ctx.beginPath(); ctx.arc(8, 8, 12, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(28, 10, 10, 0, Math.PI * 2); ctx.fill();
            // Entrada/Puerta
            ctx.fillStyle = "#795548";
            ctx.fillRect(14, 0, 8, 8);
            // Cochecito gris estacionado
            ctx.fillStyle = "#757575";
            ctx.fillRect(14, 20, 10, 14);
        }),
        genSprite("item_corazon", 16, 16, (ctx) => {
            ctx.fillStyle = "#E53935";
            ctx.beginPath();
            ctx.arc(4, 4, 3, 0, Math.PI * 2);
            ctx.arc(12, 4, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(1, 6);
            ctx.lineTo(8, 14);
            ctx.lineTo(15, 6);
            ctx.fill();
        })
    ]);
}

k.scene("minigame_traffic", async () => {
    playBGM("music_minigame_3");
    if (window.isMobileMode) setupMobileControls();
    await loadTrafficAssets();
    
    // Carretera oscura
    k.setBackground(k.Color.fromHex("#263238"));

    let progress = 0;
    let integrity = 100;
    let isGameOver = false;
    let asphaltSpeed = 240;

    // Líneas de asfalto
    const lines = [];
    for (let i = 0; i < 5; i++) {
        const lineLeft = k.add([k.rect(4, 40), k.pos(k.width()/2 - 50, i * 160), k.color(255, 255, 255), k.opacity(0.5)]);
        const lineRight = k.add([k.rect(4, 40), k.pos(k.width()/2 + 50, i * 160), k.color(255, 255, 255), k.opacity(0.5)]);
        lines.push({ left: lineLeft, right: lineRight });
    }

    k.onUpdate(() => {
        if (isGameOver) return;
        lines.forEach(l => {
            l.left.pos.y += asphaltSpeed * k.dt();
            l.right.pos.y += asphaltSpeed * k.dt();
            if (l.left.pos.y > k.height()) { l.left.pos.y -= 800; }
            if (l.right.pos.y > k.height()) { l.right.pos.y -= 800; }
        });
        
        progress = Math.min(100, progress + 3 * k.dt()); // Sube a 100% en ~33s
        updateUI();
        if (progress >= 100) checkWin();
    });

    // Lluvia procedural diagonal
    k.onUpdate(() => {
        if (k.rand() < 0.6) {
            k.add([
                k.rect(1, k.rand(10, 20)),
                k.pos(k.rand(0, k.width() + 100), -20),
                k.color(200, 220, 255),
                k.opacity(0.3),
                k.move(k.vec2(-0.3, 1).unit(), 800),
                k.lifespan(1)
            ]);
        }
    });

    // UI
    const uiText = k.add([
        k.text(`Rumbo a Lomas de Portugal: 0%`, { size: 16 }),
        k.pos(k.width() / 2, 20),
        k.anchor("center"),
        k.fixed(), k.z(100)
    ]);
    const uiIntegrity = k.add([
        k.text(`Integridad del Ramo: 100%`, { size: 14 }),
        k.pos(k.width() / 2, 50),
        k.color(255, 100, 150),
        k.anchor("center"),
        k.fixed(), k.z(100)
    ]);

    const updateUI = () => {
        uiText.text = `Rumbo a Lomas de Portugal: ${Math.floor(progress)}%`;
        uiIntegrity.text = `Integridad del Ramo: ${Math.floor(integrity)}%`;
    };

    // Jugador (Mazda 3)
    let player = k.add([
        k.sprite("spr_mazda3_player"),
        k.pos(k.width() / 2, k.height() - 80),
        k.anchor("center"),
        k.scale(2),
        k.area({ shape: new k.Rect(k.vec2(-9, -16), 18, 32) }),
        k.z(50),
        "player"
    ]);

    k.onUpdate(() => {
        if (isGameOver) return;
        if (k.isKeyDown("left") || window.virtualInput.left) player.move(-220, 0);
        if (k.isKeyDown("right") || window.virtualInput.right) player.move(220, 0);
        if (k.isKeyDown("up") || window.virtualInput.up) player.move(0, -100);
        if (k.isKeyDown("down") || window.virtualInput.down) player.move(0, 150);
        
        if (player.pos.x < k.width()/2 - 120) player.pos.x = k.width()/2 - 120;
        if (player.pos.x > k.width()/2 + 120) player.pos.x = k.width()/2 + 120;
        if (player.pos.y < 100) player.pos.y = 100;
        if (player.pos.y > k.height() - 60) player.pos.y = k.height() - 60;
    });

    k.onUpdate(() => {
        if (player.pos.x < k.width()/2 - 120) player.pos.x = k.width()/2 - 120;
        if (player.pos.x > k.width()/2 + 120) player.pos.x = k.width()/2 + 120;
        if (player.pos.y > k.height() - 40) player.pos.y = k.height() - 40;
        if (player.pos.y < 50) player.pos.y = 50;
    });

    // Spawner de carretera
    const spawner = k.loop(0.85, () => {
        if (isGameOver) return;
        
        const typeRand = k.rand();
        const laneX = k.width()/2 + k.choose([-100, 0, 100]) + k.rand(-10, 10);
        
        if (typeRand < 0.6) {
            // Tráfico lento (autos y camiones)
            const isTruck = k.rand() > 0.6;
            k.add([
                k.sprite(isTruck ? "spr_traffic_truck" : "spr_traffic_car_blue"),
                k.pos(laneX, -50),
                k.anchor("center"),
                k.scale(2),
                k.area({ shape: new k.Rect(isTruck ? k.vec2(-10, -20) : k.vec2(-8, -15), isTruck ? 20 : 16, isTruck ? 40 : 30) }),
                k.move(k.DOWN, k.rand(100, 180)),
                k.z(10),
                "traffic"
            ]);
        } else if (typeRand < 0.9) {
            // Charcos
            k.add([
                k.sprite("spr_puddle"),
                k.pos(laneX, -50),
                k.anchor("center"),
                k.scale(2),
                k.area(),
                k.move(k.DOWN, asphaltSpeed),
                k.z(5),
                "puddle"
            ]);
        } else {
            // Ramo restaurador
            k.add([
                k.sprite("spr_flower_boost"),
                k.pos(laneX, -50),
                k.anchor("center"),
                k.scale(2),
                k.area(),
                k.move(k.DOWN, asphaltSpeed),
                k.z(15),
                "flower"
            ]);
        }
    });

    k.onUpdate("traffic", (t) => { if (t.pos.y > k.height() + 100) k.destroy(t); });
    k.onUpdate("puddle", (p) => { if (p.pos.y > k.height() + 100) k.destroy(p); });
    k.onUpdate("flower", (f) => { if (f.pos.y > k.height() + 100) k.destroy(f); });

    // Colisiones
    player.onCollide("traffic", (t) => {
        if (isGameOver) return;
        k.shake(2);
        integrity = Math.max(15, integrity - 10); // Nunca baja de 15%
        updateUI();
        // Leve empujón
        player.pos.x += k.rand(-10, 10);
        player.pos.y += 10;
    });

    player.onCollide("puddle", (p) => {
        if (isGameOver) return;
        player.pos.x += k.choose([-15, 15]); // Resbalón lateral
    });

    player.onCollide("flower", (f) => {
        if (isGameOver) return;
        k.destroy(f);
        integrity = Math.min(100, integrity + 15);
        updateUI();
        
        // Efecto visual positivo
        const fx = k.add([
            k.sprite("spr_flower_boost"),
            k.pos(player.pos),
            k.anchor("center"),
            k.scale(3),
            k.opacity(1),
            k.move(k.UP, 100),
            k.lifespan(0.5, { fade: 0.1 }),
            k.z(60)
        ]);
    });

    const checkWin = () => {
        if (isGameOver) return;
        isGameOver = true;
        spawner.cancel();
        
        // Frena asfalto
        asphaltSpeed = 0;
        k.destroyAll("traffic");
        k.destroyAll("puddle");
        k.destroyAll("flower");
        
        triggerVictorySequence();
    };

    const triggerVictorySequence = () => {
        // Mazda orilla y sube suave
        k.tween(
            player.pos.clone(),
            k.vec2(k.width()/2 + 80, k.height() / 2 + 50),
            2,
            (p) => player.pos = p,
            k.easings.easeInOutQuad
        );

        k.wait(2.5, () => {
            // Limpiar la carretera
            k.destroy(player);
            uiText.hidden = true;
            uiIntegrity.hidden = true;
            lines.forEach(l => { k.destroy(l.left); k.destroy(l.right); });
            
            // Fondo parque lluvioso
            k.setBackground(k.Color.fromHex("#37474F"));
            
            k.add([
                k.sprite("spr_cutscene_park"),
                k.pos(k.width() / 2, k.height() / 2),
                k.anchor("center"),
                k.scale(4)
            ]);

            // Personajes abrazados
            k.add([
                k.sprite("player", { anim: "idle_down" }),
                k.pos(k.width() / 2 - 10, k.height() / 2 + 30),
                k.anchor("center"),
                k.scale(1.5)
            ]);
            k.add([
                k.rect(14, 18),
                k.color(100, 150, 200),
                k.pos(k.width() / 2 + 10, k.height() / 2 + 30),
                k.anchor("center")
            ]);
            
            // Corazón
            k.add([
                k.sprite("item_corazon"),
                k.pos(k.width() / 2, k.height() / 2 - 10),
                k.anchor("center"),
                k.scale(2),
                k.opacity(1),
                k.move(k.UP, 30),
                k.lifespan(2, { fade: 0.5 })
            ]);
            
            k.wait(1.5, () => {
                showMemoryModal();
            });
        });
    };

    const showMemoryModal = () => {
        const modalBg = k.add([
            k.rect(k.width() * 0.85, 260),
            k.pos(k.width() / 2, k.height() / 2),
            k.anchor("center"),
            k.color(20, 20, 20),
            k.opacity(0.95),
            k.fixed()
        ]);
        
        k.add([
            k.text("Recuerdo Desbloqueado: Flores bajo la lluvia", { size: 20, width: modalBg.width - 40, align: "center" }),
            k.pos(k.width() / 2, k.height() / 2 - 90),
            k.anchor("center"),
            k.color(255, 215, 0),
            k.fixed()
        ]);

        const memoryText = "Aquel día tenías tu actividad de divulgación del espacio en el Parque Naciones Unidas y sentí tu ausencia a cada minuto. Conseguí un ramo sencillo de flores y me propuse dártelo sin importar lo que pasara: no importó la lluvia torrencial, ni el tráfico interminable de la carretera, ni el tiempo que tuve que esperar. Cada obstáculo valió la pena en el instante en que vi la ilusión en tus ojos al recibirlo; tu sonrisa iluminó la tarde y se convirtió en el verdadero regalo para mí.";
        
        k.add([
            k.text(memoryText, { size: 14, width: modalBg.width - 60, align: "center" }),
            k.pos(k.width() / 2, k.height() / 2 + 10),
            k.anchor("center"),
            k.fixed()
        ]);

        k.add([
            k.text(`[ ${window.isMobileMode ? "Toca la pantalla" : "Presiona ESPACIO"} para continuar ]`, { size: 14 }),
            k.pos(k.width() / 2, k.height() / 2 + 110),
            k.anchor("center"),
            k.color(150, 150, 150),
            k.fixed()
        ]);

        let canProceed = false;
        k.wait(1, () => { canProceed = true; });
        const proceed = () => {
            if (!canProceed) return;
            waitForSpace.cancel();
            if (waitForClick) waitForClick.cancel();
            import("../state/gameState.js").then(({ gameState }) => {
                gameState.collectMemory("memoria_3");
                k.go("town", { spawnPos: globalThis.lastPlayerPos });
            });
        };

        const waitForSpace = k.onKeyPress("space", proceed);
        const waitForClick = k.onMousePress(proceed);
    };
});
