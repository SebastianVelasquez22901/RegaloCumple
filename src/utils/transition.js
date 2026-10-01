import { k } from "../kaplayCtx.js";

let isTransitioning = false;

export function changeScene(targetScene, spawnPos, facing = k.vec2(0, 1)) {
    if (isTransitioning) return;
    isTransitioning = true;

    // Cortina a negro (Fade Out)
    const overlay = k.add([
        k.rect(k.width(), k.height()),
        k.color(0, 0, 0),
        k.fixed(),
        k.z(3000),
        k.opacity(0)
    ]);

    k.tween(0, 1, 0.4, (val) => overlay.opacity = val, k.easings.linear)
        .onEnd(() => {
            isTransitioning = false;
            k.go(targetScene, { spawnPos, facing });
        });
}

export function applyFadeIn() {
    const overlay = k.add([
        k.rect(k.width(), k.height()),
        k.color(0, 0, 0),
        k.fixed(),
        k.z(3000),
        k.opacity(1)
    ]);
    k.tween(1, 0, 0.4, (val) => overlay.opacity = val, k.easings.linear)
        .onEnd(() => overlay.destroy());
}

export function setupCamera(player, mapWidth, mapHeight) {
    k.onUpdate(() => {
        // Suavizado (lerp)
        const camPos = k.camPos();
        const targetPos = player.pos;
        const newPos = camPos.lerp(targetPos, k.dt() * 4);
        
        // Clamping (límites para que la cámara no salga del mapa)
        const halfW = k.width() / 2;
        const halfH = k.height() / 2;
        
        let cx = newPos.x;
        let cy = newPos.y;

        if (mapWidth > k.width()) {
            cx = Math.max(halfW, Math.min(cx, mapWidth - halfW));
        } else {
            cx = mapWidth / 2; // Centrar fijo si el mapa es más pequeño que la pantalla
        }

        if (mapHeight > k.height()) {
            cy = Math.max(halfH, Math.min(cy, mapHeight - halfH));
        } else {
            cy = mapHeight / 2;
        }
        
        k.camPos(cx, cy);
    });
}
