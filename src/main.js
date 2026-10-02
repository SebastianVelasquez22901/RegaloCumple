import { k } from "./kaplayCtx.js";

// Cargamos todas las escenas
import "./scenes/device_select.js";
import "./scenes/house.js";
import "./scenes/town.js";
import "./scenes/minigame_hospital.js";
import "./scenes/minigame_space_invaders.js";
import "./scenes/minigame_traffic.js";
import "./scenes/credits.js";

// Arrancamos el juego directamente en la casa (intro)
import { initGraphicsCache } from "./utils/textureCache.js";

const loadImage = (src) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
    img.src = src;
});

async function start() {
    await initGraphicsCache();

    // Cargar spritesheet del jugador
    {
        const img = await loadImage("./img/character-spritesheet.png");
        {
            const exactRows = img.height / 64;
            await k.loadSprite("player", img.src, {
                sliceX: 13,
                sliceY: exactRows,
                anims: {
                    idle_up: 104,
                    walk_up: { from: 105, to: 112, loop: true, speed: 12 },
                    idle_left: 117,
                    walk_left: { from: 118, to: 125, loop: true, speed: 12 },
                    idle_down: 130,
                    walk_down: { from: 131, to: 138, loop: true, speed: 12 },
                    idle_right: 143,
                    walk_right: { from: 144, to: 151, loop: true, speed: 12 },
                }
            });
        }
    }

    // Gatos: la hoja tiene celdas de 32x32 (col, fila). Se recorta la celda y se
    // ajusta al bounding box del gato para que el área de colisión quede justa.
    const CAT_CELL = 32;
    const extractCat = (name, img, col, row) => {
        const cell = document.createElement("canvas");
        cell.width = cell.height = CAT_CELL;
        const cctx = cell.getContext("2d");
        cctx.drawImage(img, col * CAT_CELL, row * CAT_CELL, CAT_CELL, CAT_CELL, 0, 0, CAT_CELL, CAT_CELL);

        const { data } = cctx.getImageData(0, 0, CAT_CELL, CAT_CELL);
        let minX = CAT_CELL, minY = CAT_CELL, maxX = -1, maxY = -1;
        for (let y = 0; y < CAT_CELL; y++) {
            for (let x = 0; x < CAT_CELL; x++) {
                if (data[(y * CAT_CELL + x) * 4 + 3] > 0) {
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                }
            }
        }
        const w = maxX - minX + 1, h = maxY - minY + 1;
        const out = document.createElement("canvas");
        out.width = w;
        out.height = h;
        out.getContext("2d").drawImage(cell, minX, minY, w, h, 0, 0, w, h);
        return k.loadSprite(name, out.toDataURL("image/png"));
    };

    const [catGris, catNaranja, catBlanco] = await Promise.all([
        loadImage("./img/Free pack/cat 1.png"),
        loadImage("./img/Free pack/cat 1.6.png"),
        loadImage("./img/Free pack/cat 1.9.png"),
    ]);

    await Promise.all([
        extractCat("gato_sentado", catGris, 0, 0),       // Luna: gris, sentada
        extractCat("gato_panecillo", catNaranja, 0, 3),  // Mishi: naranja, panecillo (de frente)
        extractCat("gato_durmiendo", catBlanco, 6, 3),   // Oreo: blanco, hecho bolita
    ]);

    // Snoopy con lentes (imagen recortada, ya con fondo transparente)
    await k.loadSprite("snoopy_cool", "./sprites/snoopy_lentes.png");

    await new Promise((resolve) => {
        const c = document.createElement("canvas");
        c.width = 16; c.height = 16;
        const ctx = c.getContext("2d");
        ctx.fillStyle = "#E53935";
        ctx.beginPath(); ctx.arc(4, 4, 3, 0, Math.PI * 2); ctx.arc(12, 4, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(1, 6); ctx.lineTo(8, 14); ctx.lineTo(15, 6); ctx.fill();
        k.loadSprite("item_corazon", c.toDataURL()).then(resolve);
    });

    k.go("device_select");
}

start().catch((err) => {
    console.error(err);
    const msg = document.createElement("div");
    msg.textContent = "Ups, el juego no pudo cargar. Recarga la página.";
    msg.style.cssText = "position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#111;color:#f0ebd7;font:18px sans-serif;text-align:center;padding:24px;z-index:10001";
    document.body.appendChild(msg);
});
