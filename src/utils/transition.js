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
    const halfW = k.width() / 2;
    const halfH = k.height() / 2;

    // Límites para que la cámara no salga del mapa (centrada fija si el mapa es menor que la pantalla)
    const clampCam = (pos) => k.vec2(
        mapWidth > k.width() ? Math.max(halfW, Math.min(pos.x, mapWidth - halfW)) : mapWidth / 2,
        mapHeight > k.height() ? Math.max(halfH, Math.min(pos.y, mapHeight - halfH)) : mapHeight / 2
    );

    k.camPos(clampCam(player.pos));

    k.onUpdate(() => {
        const smoothed = k.camPos().lerp(player.pos, Math.min(1, k.dt() * 4));
        k.camPos(clampCam(smoothed));
    });
}
