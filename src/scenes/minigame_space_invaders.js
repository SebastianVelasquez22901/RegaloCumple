import { k } from "../kaplayCtx.js";
import { playBGM } from "../utils/audio.js";

import { setupMobileControls } from "../ui/mobileControls.js";

async function loadSpaceInvadersAssets() {
    const genSprite = async (name, w, h, drawFn) => {
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        drawFn(ctx);
        await k.loadSprite(name, canvas.toDataURL());
    };

    await Promise.all([
        genSprite("spr_player_ship", 20, 20, (ctx) => {
            // Nave (triángulo estilizado)
            ctx.fillStyle = "#FFFFFF";
            ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(20, 16); ctx.lineTo(0, 16); ctx.fill();
            // Cabina
            ctx.fillStyle = "#4FC3F7";
            ctx.beginPath(); ctx.arc(10, 10, 3, 0, Math.PI * 2); ctx.fill();
            // Propulsores
            ctx.fillStyle = "#E53935";
            ctx.fillRect(4, 16, 4, 4);
            ctx.fillRect(12, 16, 4, 4);
        }),
        genSprite("spr_laser", 4, 10, (ctx) => {
            ctx.fillStyle = "#FFEB3B";
            ctx.fillRect(0, 0, 4, 10);
            ctx.fillStyle = "#00BCD4";
            ctx.fillRect(1, 1, 2, 8);
        }),
        genSprite("spr_invader_1", 16, 16, (ctx) => {
            ctx.fillStyle = "#4CAF50"; // Verde alienígena
            ctx.fillRect(2, 4, 12, 8);
            ctx.fillRect(0, 6, 16, 4);
            ctx.fillStyle = "#111111"; // Ojos
            ctx.fillRect(4, 6, 2, 2);
            ctx.fillRect(10, 6, 2, 2);
            // Antenas
            ctx.fillStyle = "#81C784";
            ctx.fillRect(4, 0, 2, 4);
            ctx.fillRect(10, 0, 2, 4);
        }),
        genSprite("spr_invader_2", 16, 16, (ctx) => {
            ctx.fillStyle = "#9C27B0"; // Morado
            ctx.beginPath(); ctx.arc(8, 8, 8, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#111111"; // Ojo cíclope
            ctx.fillRect(6, 6, 4, 4);
            ctx.fillStyle = "#E1BEE7"; // Detalles
            ctx.fillRect(4, 2, 2, 2);
            ctx.fillRect(10, 12, 2, 2);
        }),
        genSprite("spr_enemy_laser", 4, 4, (ctx) => {
            ctx.fillStyle = "#FF5252";
            ctx.beginPath(); ctx.arc(2, 2, 2, 0, Math.PI * 2); ctx.fill();
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
            // TV
            ctx.fillStyle = "#212121";
            ctx.fillRect(10, 0, 12, 8);
            ctx.fillStyle = "#4FC3F7"; 
            ctx.fillRect(11, 1, 10, 6);
        })
    ]);
}

k.scene("minigame_space_invaders", async () => {
    playBGM("music_minigame_2");
    if (window.isMobileMode) setupMobileControls();
    await loadSpaceInvadersAssets();
    
    k.setBackground(k.Color.fromHex("#0B0B1A"));
    
    // Estrellas de fondo estáticas
    for (let i = 0; i < 60; i++) {
        k.add([
            k.rect(2, 2),
            k.pos(k.rand(0, k.width()), k.rand(0, k.height())),
            k.color(255, 255, 255),
            k.opacity(k.rand(0.3, 0.8)),
            k.z(-10),
            "bg_star"
        ]);
    }

    let wave = 1;
    let score = 0;
    let lives = 3;
    let isGameOver = false;
    let lastShootTime = 0;
    const TOTAL_WAVES = 2;

    const uiText = k.add([
        k.text(`Oleada: 1/2   Puntos: 0   Vidas: 3`, { size: 16 }),
        k.pos(20, 20),
        k.color(255, 255, 255),
        k.fixed(),
        k.z(100)
    ]);

    const updateUI = () => {
        uiText.text = `Oleada: ${wave}/${TOTAL_WAVES}   Puntos: ${score}   Vidas: ${lives}`;
    };

    let player = k.add([
        k.sprite("spr_player_ship"),
        k.pos(k.width() / 2, k.height() - 36),
        k.anchor("center"),
        k.scale(2),
        k.area({ shape: new k.Rect(k.vec2(-8, -8), 16, 16) }),
        "player",
        { isInvulnerable: false }
    ]);

    k.onUpdate(() => {
        if (isGameOver) return;
        if (k.isKeyDown("left") || window.virtualInput.left) {
            player.move(-280, 0);
            if (player.pos.x < 20) player.pos.x = 20;
        }
        if (k.isKeyDown("right") || window.virtualInput.right) {
            player.move(280, 0);
            if (player.pos.x > k.width() - 20) player.pos.x = k.width() - 20;
        }
        if (k.isKeyDown("space") || window.virtualInput.space) {
            shootLaser();
        }
    });

    const shootLaser = () => {
        if (isGameOver) return;
        if (k.time() - lastShootTime < 0.28) return;
        lastShootTime = k.time();
        
        k.add([
            k.sprite("spr_laser"),
            k.pos(player.pos.x, player.pos.y - 20),
            k.anchor("center"),
            k.scale(2),
            k.area(),
            k.move(k.UP, 380),
            "player_laser"
        ]);
    };

    k.onUpdate("player_laser", (l) => { if (l.pos.y < -20) k.destroy(l); });
    k.onUpdate("enemy_laser", (l) => { if (l.pos.y > k.height() + 20) k.destroy(l); });

    // Lógica del Grid de Invasores
    let invaderDir = 1;
    const INVADER_SPEED = 60;
    let invadersGroup = [];
    
    const spawnWave = () => {
        invaderDir = 1;
        invadersGroup = [];
        const cols = 6;
        const rows = 3;
        const startX = k.width() / 2 - (cols * 50) / 2;
        const startY = 80;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const sprite = (r % 2 === 0) ? "spr_invader_1" : "spr_invader_2";
                const invader = k.add([
                    k.sprite(sprite),
                    k.pos(startX + c * 50, startY + r * 40),
                    k.anchor("center"),
                    k.scale(2),
                    k.area(),
                    "invader",
                    { row: r, col: c }
                ]);
                invadersGroup.push(invader);
            }
        }
    };

    spawnWave();

    // Movimiento y disparos de invasores
    k.onUpdate(() => {
        if (isGameOver) return;
        
        let hitEdge = false;
        
        // Mover todos
        for (const inv of invadersGroup) {
            if (!inv.exists()) continue;
            inv.move(invaderDir * (INVADER_SPEED + (wave * 20)), 0);
            if (inv.pos.x < 30 || inv.pos.x > k.width() - 30) {
                hitEdge = true;
            }
        }

        // Bajar al tocar borde
        if (hitEdge) {
            invaderDir *= -1;
            for (const inv of invadersGroup) {
                if (!inv.exists()) continue;
                inv.pos.y += 14;
                inv.pos.x += invaderDir * 5; // empujoncito para no quedarse pegado
            }
        }

        // Limpiar destruidos del arreglo
        invadersGroup = invadersGroup.filter(i => i.exists());

        // Si los invasores llegan hasta la nave, se pierde una vida y se reinicia la oleada
        if (invadersGroup.some(i => i.pos.y > k.height() - 70)) {
            lives--;
            if (lives <= 0) lives = 3;
            k.shake(4);
            k.destroyAll("invader");
            k.destroyAll("enemy_laser");
            k.destroyAll("player_laser");
            spawnWave();
            updateUI();
            return;
        }

        // Si no quedan invasores, siguiente oleada o victoria
        if (invadersGroup.length === 0) {
            if (wave < TOTAL_WAVES) {
                wave++;
                updateUI();
                spawnWave();
            } else {
                checkWin();
            }
        }
    });

    // Disparos enemigos (loop independiente)
    const enemyShooter = k.loop(1.2 - (wave * 0.2), () => {
        if (isGameOver || invadersGroup.length === 0) return;
        // Elegir un invasor aleatorio de los que quedan
        const shooter = k.choose(invadersGroup);
        if (shooter && shooter.exists()) {
            k.add([
                k.sprite("spr_enemy_laser"),
                k.pos(shooter.pos.x, shooter.pos.y + 10),
                k.anchor("center"),
                k.scale(2),
                k.area(),
                k.move(k.DOWN, 180 + (wave * 20)),
                "enemy_laser"
            ]);
        }
    });

    // Colisiones
    k.onCollide("player_laser", "invader", (laser, invader) => {
        k.destroy(laser);
        
        // Explosión de partículas
        for (let i = 0; i < 5; i++) {
            k.add([
                k.rect(4, 4),
                k.pos(invader.pos),
                k.color(255, k.rand(100, 255), 0),
                k.move(k.vec2(k.rand(-1, 1), k.rand(-1, 1)).unit(), k.rand(50, 100)),
                k.opacity(1),
                k.lifespan(0.3, { fade: 0.1 })
            ]);
        }
        
        k.destroy(invader);
        score += 100;
        updateUI();
    });

    k.onCollide("enemy_laser", "player", (laser, p) => {
        if (p.isInvulnerable || isGameOver) return;
        k.destroy(laser);
        
        lives--;
        updateUI();
        
        k.shake(4);
        
        if (lives <= 0) {
            // Reiniciar oleada
            lives = 3;
            k.destroyAll("invader");
            k.destroyAll("enemy_laser");
            k.destroyAll("player_laser");
            spawnWave();
            updateUI();
        } else {
            // Invulnerabilidad temporal
            p.isInvulnerable = true;
            let blinks = 0;
            const blinkLoop = k.loop(0.1, () => {
                p.hidden = !p.hidden;
                blinks++;
                if (blinks >= 15) {
                    p.hidden = false;
                    p.isInvulnerable = false;
                    blinkLoop.cancel();
                }
            });
        }
    });

    const checkWin = () => {
        if (isGameOver) return;
        isGameOver = true;
        enemyShooter.cancel();
        k.destroyAll("enemy_laser");
        k.destroyAll("player_laser");
        
        triggerVictorySequence();
    };

    const triggerVictorySequence = () => {
        // Cohete asciende y sale de la pantalla
        k.tween(
            player.pos.y,
            -50,
            1.5,
            (y) => player.pos.y = y,
            k.easings.easeInQuad
        );

        k.wait(2, () => {
            // Limpiar la escena
            k.destroy(player);
            uiText.hidden = true;
            
            // Fondo cálido de sala
            k.setBackground(k.Color.fromHex("#FFECB3"));
            k.destroyAll("bg_star"); // Remover estrellas
            
            k.add([
                k.sprite("spr_tv_couch"),
                k.pos(k.width() / 2, k.height() / 2),
                k.anchor("center"),
                k.scale(4)
            ]);

            // Jugador y papá viendo la TV
            k.add([
                k.sprite("player", { anim: "idle_up" }),
                k.pos(k.width() / 2 - 20, k.height() / 2 + 30),
                k.anchor("center"),
                k.scale(1.5)
            ]);
            
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
            k.text(`[ ${window.isMobileMode ? "Toca la pantalla" : "Presiona ESPACIO"} para continuar ]`, { size: 14 }),
            k.pos(k.width() / 2, k.height() / 2 + 100),
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
                gameState.collectMemory("memoria_2");
                k.go("town", { spawnPos: globalThis.lastPlayerPos });
            });
        };

        const waitForSpace = k.onKeyPress("space", proceed);
        const waitForClick = k.onMousePress(proceed);
    };
});
