import { k } from "../kaplayCtx.js";

let generated = false;

// Genera texturas usando Canvas 2D nativo para offscreen caching
export async function initGraphicsCache() {
    if (generated) return;
    generated = true;

    function createTexture(width, height, drawFn) {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        drawFn(ctx);
        return canvas.toDataURL("image/png");
    }

    // ÁRBOL (64x80)
    const treeURL = createTexture(64, 80, (ctx) => {
        // Sombra proyectada
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.beginPath(); ctx.ellipse(32, 75, 26, 12, 0, 0, Math.PI * 2); ctx.fill();

        // Tronco de madera
        ctx.fillStyle = "rgb(130, 90, 60)";
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(25, 55, 14, 20, 2);
        else ctx.fillRect(25, 55, 14, 20);
        ctx.fill();

        // Copas esféricas
        ctx.fillStyle = "rgb(40, 100, 50)";
        ctx.beginPath(); ctx.arc(32, 48, 30, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "rgb(60, 130, 70)";
        ctx.beginPath(); ctx.arc(32, 40, 24, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "rgb(80, 160, 90)";
        ctx.beginPath(); ctx.arc(28, 32, 16, 0, Math.PI*2); ctx.fill();
    });

    const treeFruitURL = createTexture(64, 80, (ctx) => {
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.beginPath(); ctx.ellipse(32, 75, 26, 12, 0, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = "rgb(130, 90, 60)";
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(25, 55, 14, 20, 2);
        else ctx.fillRect(25, 55, 14, 20);
        ctx.fill();

        ctx.fillStyle = "rgb(40, 100, 50)";
        ctx.beginPath(); ctx.arc(32, 48, 30, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "rgb(60, 130, 70)";
        ctx.beginPath(); ctx.arc(32, 40, 24, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "rgb(80, 160, 90)";
        ctx.beginPath(); ctx.arc(28, 32, 16, 0, Math.PI*2); ctx.fill();

        // Frutas estilo AC (Naranjas)
        ctx.fillStyle = "rgb(240, 150, 50)";
        ctx.beginPath(); ctx.arc(18, 48, 4, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(46, 42, 4, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(32, 32, 4, 0, Math.PI*2); ctx.fill();
    });

    await k.loadSprite("tree_cached", treeURL);
    await k.loadSprite("tree_fruit_cached", treeFruitURL);
}
