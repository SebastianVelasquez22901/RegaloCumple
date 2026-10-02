import { k } from "../kaplayCtx.js";
import { playBGM } from "../utils/audio.js";

import { setupMobileControls } from "../ui/mobileControls.js";

// Generador procedural de assets para el minijuego
async function loadMinigameAssets() {
    const genSprite = async (name, w, h, drawFn) => {
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        drawFn(ctx);
        await k.loadSprite(name, canvas.toDataURL());
    };

    await Promise.all([
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
        }),
        genSprite("item_te", 16, 16, (ctx) => {
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(4, 6, 8, 8);
            ctx.fillStyle = "#BDBDBD";
            ctx.fillRect(12, 8, 3, 4); // asa
            ctx.fillStyle = "#8D6E63";
            ctx.fillRect(5, 7, 6, 1); // te
            ctx.fillStyle = "#E0E0E0";
            ctx.fillRect(6, 1, 1, 3); // vapor
            ctx.fillRect(9, 2, 1, 2);
        }),
        genSprite("item_flor", 16, 16, (ctx) => {
            ctx.fillStyle = "#4CAF50";
            ctx.fillRect(7, 8, 2, 8); // tallo
            ctx.fillStyle = "#F48FB1";
            ctx.beginPath(); ctx.arc(8, 6, 4, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#FDD835";
            ctx.beginPath(); ctx.arc(8, 6, 2, 0, Math.PI * 2); ctx.fill();
        }),
        genSprite("obstaculo_nube", 24, 16, (ctx) => {
            ctx.fillStyle = "#757575";
            ctx.beginPath();
            ctx.arc(8, 8, 5, 0, Math.PI * 2);
            ctx.arc(16, 8, 5, 0, Math.PI * 2);
            ctx.arc(12, 5, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#424242"; // gotas
            ctx.fillRect(8, 14, 1, 2);
            ctx.fillRect(16, 14, 1, 2);
        }),
        genSprite("decor_cama", 32, 24, (ctx) => {
            ctx.fillStyle = "#795548"; // Madera
            ctx.fillRect(2, 4, 4, 20);
            ctx.fillRect(26, 12, 4, 12);
            ctx.fillRect(2, 16, 28, 4);
            ctx.fillStyle = "#FFFFFF"; // Sábana
            ctx.fillRect(6, 14, 20, 6);
            ctx.fillStyle = "#E0E0E0"; // Almohada
            ctx.fillRect(6, 12, 8, 4);
        })
    ]);
}

k.scene("minigame_hospital", async () => {
    playBGM("music_minigame_1");
    if (window.isMobileMode) setupMobileControls();
    await loadMinigameAssets();
    
    let animo = 0;
    let isGameOver = false;
    let slowTimer = 0;
    
    k.setBackground(k.Color.fromHex("#87CEEB"));

    const player = k.add([
        k.sprite("player", { anim: "idle_down" }),
        k.pos(k.width() / 2, k.height() - 40),
        k.anchor("center"),
        k.area({ shape: new k.Rect(k.vec2(-12, -12), 24, 36) }),
        "player"
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
        k.color(255, 100, 100),
        k.fixed()
    ]);

    const uiText = k.add([
        k.text("Ánimo: 0%", { size: 16 }),
        k.pos(k.width() / 2, 50),
        k.anchor("center"),
        k.fixed()
    ]);

    const updateBar = () => {
        barProgress.width = (animo / 100) * 200;
        uiText.text = `Ánimo: ${Math.floor(animo)}%`;
    };

    // Movement
    k.onUpdate(() => {
        if (isGameOver) return;
        let isMoving = false;
        const speed = slowTimer > 0 ? 132 : 220;

        if (k.isKeyDown("left") || window.virtualInput.left) {
            player.move(-speed, 0);
            player.flipX = false;
            if (player.curAnim() !== "walk_left") player.play("walk_left");
            isMoving = true;
        } else if (k.isKeyDown("right") || window.virtualInput.right) {
            player.move(speed, 0);
            player.flipX = false;
            if (player.curAnim() !== "walk_right") player.play("walk_right");
            isMoving = true;
        }

        if (!isMoving && player.curAnim() !== "idle_down") {
            player.play("idle_down");
        }
    });

    k.onUpdate(() => {
        if (slowTimer > 0) slowTimer -= k.dt();
        if (player.pos.x < 20) player.pos.x = 20;
        if (player.pos.x > k.width() - 20) player.pos.x = k.width() - 20;
    });

    // Spawner
    const spawnItem = () => {
        if (isGameOver) return;
        
        const isGood = k.rand() > 0.3;
        const x = k.rand(20, k.width() - 20);
        const speed = k.rand(120, 180);
        
        let type, sprite, val;
        
        if (isGood) {
            const r = k.rand();
            if (r < 0.4) { type = "te"; sprite = "item_te"; val = 8; }
            else if (r < 0.7) { type = "flor"; sprite = "item_flor"; val = 10; }
            else { type = "corazon"; sprite = "item_corazon"; val = 15; }
            
            k.add([
                k.sprite(sprite),
                k.pos(x, -20),
                k.anchor("center"),
                k.scale(2),
                k.area(),
                k.move(k.DOWN, speed),
                "good_item",
                { val }
            ]);
        } else {
            k.add([
                k.sprite("obstaculo_nube"),
                k.pos(x, -20),
                k.anchor("center"),
                k.scale(2),
                k.area(),
                k.move(k.DOWN, speed),
                "bad_item"
            ]);
        }
    };

    const spawner = k.loop(0.8, spawnItem);

    player.onCollide("good_item", (item) => {
        if (isGameOver) return;
        k.destroy(item);
        animo = Math.min(100, animo + item.val);
        updateBar();
        checkWin();
    });

    player.onCollide("bad_item", (item) => {
        if (isGameOver) return;
        k.destroy(item);
        animo = Math.max(0, animo - 5);
        slowTimer = 1;
        updateBar();
    });

    k.onUpdate("good_item", (item) => { if (item.pos.y > k.height() + 20) k.destroy(item); });
    k.onUpdate("bad_item", (item) => { if (item.pos.y > k.height() + 20) k.destroy(item); });

    const checkWin = () => {
        if (animo >= 100 && !isGameOver) {
            isGameOver = true;
            spawner.cancel();
            k.destroyAll("good_item");
            k.destroyAll("bad_item");
            player.play("idle_down");
            triggerVictorySequence();
        }
    };

    const triggerVictorySequence = () => {
        k.setBackground(k.Color.fromHex("#FFECB3")); // Habitación cálida
        
        const cama = k.add([
            k.sprite("decor_cama"),
            k.pos(k.width() / 2 + 50, k.height() / 2),
            k.anchor("center"),
            k.scale(3)
        ]);

        k.tween(
            player.pos.clone(),
            k.vec2(k.width() / 2 - 50, k.height() / 2 + 30),
            2,
            (p) => player.pos = p,
            k.easings.linear
        );
        player.flipX = false;
        player.play("walk_right");
        
        k.wait(2, () => {
            player.play("idle_right");
            
            // Corazón flotante
            k.add([
                k.sprite("item_corazon"),
                k.pos(k.width() / 2, k.height() / 2 - 20),
                k.anchor("center"),
                k.scale(3),
                k.opacity(1),
                k.move(k.UP, 20),
                k.lifespan(2, { fade: 0.5 })
            ]);
            
            k.wait(1.5, () => {
                showMemoryModal();
            });
        });
    };

    const showMemoryModal = () => {
        const bg = k.add([
            k.rect(k.width() * 0.8, 200),
            k.pos(k.width() / 2, k.height() / 2),
            k.anchor("center"),
            k.color(20, 20, 20),
            k.opacity(0.9),
            k.fixed()
        ]);
        
        k.add([
            k.text("Recuerdo Desbloqueado: Tu luz en el hospital", { size: 24, width: bg.width - 40, align: "center" }),
            k.pos(k.width() / 2, k.height() / 2 - 60),
            k.anchor("center"),
            k.color(255, 215, 0),
            k.fixed()
        ]);

        k.add([
            k.text("Gracias por estar a mi lado y cuidarme cuando más vulnerable estuve. Tu compañía, tus visitas y tu cariño fueron mi mejor medicina.", { size: 16, width: bg.width - 60, align: "center" }),
            k.pos(k.width() / 2, k.height() / 2),
            k.anchor("center"),
            k.fixed()
        ]);

        k.add([
            k.text(`[ ${window.isMobileMode ? "Toca la pantalla" : "Presiona ESPACIO"} para continuar ]`, { size: 14 }),
            k.pos(k.width() / 2, k.height() / 2 + 70),
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
                gameState.collectMemory("memoria_1");
                k.go("town", { spawnPos: globalThis.lastPlayerPos });
            });
        };

        const waitForSpace = k.onKeyPress("space", proceed);
        const waitForClick = k.onMousePress(proceed);
    };
});
