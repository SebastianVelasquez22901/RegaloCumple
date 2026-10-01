import { k } from "../kaplayCtx.js";
import { gameState } from "../state/gameState.js";

export function createHUD() {
    const hud = k.add([
        k.fixed(),
        k.z(2000), // Se dibuja sobre la escena
        k.pos(20, 20),
        "memoryUI"
    ]);

    hud.add([
        k.rect(160, 40, { radius: 8 }),
        k.color(0, 0, 0),
        k.opacity(0.6)
    ]);

    const counterText = hud.add([
        k.text(`Recuerdos: ${gameState.memoriesFound.size}/${gameState.totalMemoriesRequired}`, { size: 16 }),
        k.pos(15, 12),
        k.color(255, 255, 255),
        k.scale(1)
    ]);

    // Reactividad al estado global usando el bus de eventos de Kaplay
    const evMem = k.on("memory_collected", (currentSize) => {
        counterText.text = `Recuerdos: ${currentSize}/${gameState.totalMemoriesRequired}`;
        
        // Animación "Pop" de atención
        k.tween(1.5, 1, 0.3, (v) => counterText.scale = k.vec2(v, v), k.easings.easeOutQuad);
        counterText.color = k.rgb(255, 255, 100);
        k.wait(0.3, () => counterText.color = k.rgb(255, 255, 255));
    });

    const evFin = k.on("finale_ready", () => {
        counterText.text = "¡Abre el Buzón!";
        counterText.color = k.rgb(100, 255, 100);
    });

    // Limpieza explícita de listeners para evitar memory leaks en transiciones
    hud.onDestroy(() => {
        evMem.cancel();
        evFin.cancel();
    });

    return hud;
}
