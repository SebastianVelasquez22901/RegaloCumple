import { k } from "../kaplayCtx.js";

async function loadRocketAssets() {
    const genSprite = async (name, w, h, drawFn) => {
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        drawFn(ctx);
        await k.loadSprite(name, canvas.toDataURL());
    };

    await Promise.all([
        genSprite("spr_rocket", 16, 24, (ctx) => {
            // Cuerpo
            ctx.fillStyle = "#FFFFFF";
            ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(12, 10); ctx.lineTo(12, 18); ctx.lineTo(4, 18); ctx.lineTo(4, 10); ctx.fill();
            // Punta
            ctx.fillStyle = "#E53935";
            ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(10, 5); ctx.lineTo(6, 5); ctx.fill();
            // Alas
            ctx.fillStyle = "#E53935";
            ctx.beginPath(); ctx.moveTo(4, 14); ctx.lineTo(0, 20); ctx.lineTo(4, 18); ctx.fill();
            ctx.beginPath(); ctx.moveTo(12, 14); ctx.lineTo(16, 20); ctx.lineTo(12, 18); ctx.fill();
            // Ventana
            ctx.fillStyle = "#4FC3F7";
            ctx.beginPath(); ctx.arc(8, 10, 2, 0, Math.PI * 2); ctx.fill();
            // Fuego
            ctx.fillStyle = "#FFA000";
            ctx.beginPath(); ctx.moveTo(5, 18); ctx.lineTo(8, 24); ctx.lineTo(11, 18); ctx.fill();
            ctx.fillStyle = "#FFCA28";
            ctx.beginPath(); ctx.moveTo(6, 18); ctx.lineTo(8, 22); ctx.lineTo(10, 18); ctx.fill();
        }),
        genSprite("spr_star", 16, 16, (ctx) => {
            ctx.fillStyle = "#FFD54F";
            ctx.beginPath();
            ctx.moveTo(8, 0); ctx.lineTo(10, 6); ctx.lineTo(16, 8);
            ctx.lineTo(10, 10); ctx.lineTo(8, 16); ctx.lineTo(6, 10);
            ctx.lineTo(0, 8); ctx.lineTo(6, 6); ctx.fill();
        }),
        genSprite("spr_obstacle_space", 18, 18, (ctx) => {
            ctx.fillStyle = "#795548";
            ctx.beginPath(); ctx.arc(9, 9, 8, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#5D4037";
            ctx.beginPath(); ctx.arc(6, 6, 2, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(12, 12, 3, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(5, 13, 1.5, 0, Math.PI * 2); ctx.fill();
        }),
        genSprite("spr_tv_couch", 32, 24, (ctx) => {
            // Sofá
            ctx.fillStyle = "#8D6E63";
            ctx.fillRect(0, 12, 32, 12); // base
            ctx.fillStyle = "#A1887F";
            ctx.fillRect(2, 8, 28, 8); // espaldar
            ctx.fillStyle = "#5D4037";
            ctx.fillRect(0, 10, 4, 8); // brazo izq
            ctx.fillRect(28, 10, 4, 8); // brazo der
            // TV (pequeña arriba en la pared, por simplicidad la dibujamos arriba del sofá)
            ctx.fillStyle = "#212121";
            ctx.fillRect(10, 0, 12, 8);
            ctx.fillStyle = "#4FC3F7"; // pantalla azul claro
            ctx.fillRect(11, 1, 10, 6);
        })
    ]);
}

k.scene("minigame_rocket", async () => {
    await loadRocketAssets();
    
    let altitud = 0;
    let isGameOver = false;

    // Fondo dinámico
    const bg = k.add([
        k.rect(k.width(), k.height()),
        k.pos(0, 0),
        k.color(135, 206, 235), // Sky blue inicial
        k.z(-10)
    ]);

    const updateBackground = () => {
        // Interpolar desde Sky Blue (135, 206, 235) a Negro (10, 10, 20)
        const progress = Math.min(1, altitud / 100);
        const r = 135 - (135 - 10) * progress;
        const g = 206 - (206 - 10) * progress;
        const b = 235 - (235 - 20) * progress;
        bg.color = k.rgb(r, g, b);
    };

    const rocket = k.add([
        k.sprite("spr_rocket"),
        k.pos(k.width() / 2, k.height() - 60),
        k.anchor("center"),
        k.scale(2),
        k.area({ shape: new k.Rect(k.vec2(0, 0), 12, 20) }),
        "rocket"
    ]);

    // UI
    const barBg = k.add([
        k.rect(200, 20),
        k.pos(k.width() / 2 - 100, 20),
        k.color(100, 100, 100),
        k.fixed()
    ]);
    
    const barProgress = k.add([
        k.rect(0, 20),
        k.pos(k.width() / 2 - 100, 20),
        k.color(100, 255, 100),
        k.fixed()
    ]);

    const uiText = k.add([
        k.text("Altitud: 0%", { size: 16 }),
        k.pos(k.width() / 2, 50),
        k.anchor("center"),
        k.fixed()
    ]);

    const updateBar = () => {
        barProgress.width = (altitud / 100) * 200;
        uiText.text = `Altitud: ${Math.floor(altitud)}%`;
        updateBackground();
    };

    // Movement
    k.onKeyDown("left", () => {
        if (isGameOver) return;
        rocket.move(-250, 0);
    });

    k.onKeyDown("right", () => {
        if (isGameOver) return;
        rocket.move(250, 0);
    });

    k.onUpdate(() => {
        if (rocket.pos.x < 20) rocket.pos.x = 20;
        if (rocket.pos.x > k.width() - 20) rocket.pos.x = k.width() - 20;
        
        // Efecto de estrellas en el fondo si ya estamos alto
        if (altitud > 30 && !isGameOver && k.rand() < 0.05) {
            k.add([
                k.rect(2, 2),
                k.pos(k.rand(0, k.width()), -10),
                k.color(255, 255, 255),
                k.move(k.DOWN, k.rand(300, 500)),
                k.z(-5),
                "bg_star"
            ]);
        }
    });

    k.onUpdate("bg_star", (s) => {
        if (s.pos.y > k.height()) k.destroy(s);
    });

    // Spawner
    const spawnItem = () => {
        if (isGameOver) return;
        
        const isGood = k.rand() > 0.35;
        const x = k.rand(20, k.width() - 20);
        const speed = k.rand(140, 190);
        
        if (isGood) {
            k.add([
                k.sprite("spr_star"),
                k.pos(x, -30),
                k.anchor("center"),
                k.scale(2),
                k.area(),
                k.move(k.DOWN, speed),
                "good_item"
            ]);
        } else {
            const ast = k.add([
                k.sprite("spr_obstacle_space"),
                k.pos(x, -30),
                k.anchor("center"),
                k.scale(2),
                k.area({ shape: new k.Rect(k.vec2(0, 0), 14, 14) }),
                k.move(k.DOWN, speed),
                "bad_item"
            ]);
            ast.onUpdate(() => ast.angle += 1);
        }
    };

    const spawner = k.loop(0.7, spawnItem);

    rocket.onCollide("good_item", (item) => {
        if (isGameOver) return;
        k.destroy(item);
        altitud = Math.min(100, altitud + 8);
        updateBar();
        checkWin();
    });

    rocket.onCollide("bad_item", (item) => {
        if (isGameOver) return;
        k.destroy(item);
        altitud = Math.max(0, altitud - 4);
        k.shake(2);
        updateBar();
    });

    k.onUpdate("good_item", (item) => { if (item.pos.y > k.height() + 30) k.destroy(item); });
    k.onUpdate("bad_item", (item) => { if (item.pos.y > k.height() + 30) k.destroy(item); });

    const checkWin = () => {
        if (altitud >= 100 && !isGameOver) {
            isGameOver = true;
            spawner.cancel();
            k.destroyAll("good_item");
            k.destroyAll("bad_item");
            triggerVictorySequence();
        }
    };

    const triggerVictorySequence = () => {
        // Desvanece el cohete subiendo
        k.tween(
            rocket.pos.y,
            -50,
            2,
            (y) => rocket.pos.y = y,
            k.easings.easeInQuad
        );

        k.wait(2.5, () => {
            // Limpiar la escena para la viñeta
            k.destroy(rocket);
            k.destroyAll("bg_star");
            uiText.hidden = true;
            barBg.hidden = true;
            barProgress.hidden = true;
            
            // Fondo cálido de sala
            bg.color = k.Color.fromHex("#FFECB3");
            
            k.add([
                k.sprite("spr_tv_couch"),
                k.pos(k.width() / 2, k.height() / 2),
                k.anchor("center"),
                k.scale(4)
            ]);

            // Jugador y acompañantes viendo la TV
            const p1 = k.add([
                k.sprite("player", { anim: "idle_up" }),
                k.pos(k.width() / 2 - 20, k.height() / 2 + 30),
                k.anchor("center"),
                k.scale(1.5)
            ]);
            
            // Un personaje genérico a su lado
            k.add([
                k.rect(16, 20),
                k.color(100, 150, 200),
                k.pos(k.width() / 2 + 20, k.height() / 2 + 30),
                k.anchor("center")
            ]);
            
            k.wait(1.5, () => {
                showMemoryModal();
            });
        });
    };

    const showMemoryModal = () => {
        const modalBg = k.add([
            k.rect(k.width() * 0.8, 250),
            k.pos(k.width() / 2, k.height() / 2),
            k.anchor("center"),
            k.color(20, 20, 20),
            k.opacity(0.95),
            k.fixed()
        ]);
        
        k.add([
            k.text("Recuerdo Desbloqueado: El despegue hacia las estrellas", { size: 20, width: modalBg.width - 40, align: "center" }),
            k.pos(k.width() / 2, k.height() / 2 - 80),
            k.anchor("center"),
            k.color(255, 215, 0),
            k.fixed()
        ]);

        const memoryText = "Ese día en abril me escapé del trabajo solo para verte, y valió cada segundo. Ver el despegue de ese cohete tripulado junto a ti y a tus papás fue increíble, pero lo más especial no fue lo que pasaba en el cielo, sino estar ahí contigo. Te veías hermosa como siempre, y compartir esa emoción juntos hizo que ese día se quedara grabado para siempre en mi corazón.";
        
        k.add([
            k.text(memoryText, { size: 14, width: modalBg.width - 60, align: "center" }),
            k.pos(k.width() / 2, k.height() / 2 + 10),
            k.anchor("center"),
            k.fixed()
        ]);

        k.add([
            k.text("[ Presiona ESPACIO para continuar ]", { size: 14 }),
            k.pos(k.width() / 2, k.height() / 2 + 100),
            k.anchor("center"),
            k.color(150, 150, 150),
            k.fixed()
        ]);

        const waitForSpace = k.onKeyPress("space", () => {
            waitForSpace.cancel();
            import("../state/gameState.js").then(({ gameState }) => {
                gameState.collectMemory("memoria_2");
                k.go("town", { spawnPos: globalThis.lastPlayerPos });
            });
        });
    };
});
