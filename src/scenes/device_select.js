import { k } from "../kaplayCtx.js";
import { initAudio, playMusic } from "../utils/audio.js";
import { setupMobileControls } from "../ui/mobileControls.js";

k.scene("device_select", () => {
    k.setBackground(k.Color.fromHex("#1A1A24"));

    const centerX = k.width() / 2;
    const centerY = k.height() / 2;

    k.add([
        k.text("¿Cómo vas a jugar?", { size: 24, align: "center" }),
        k.pos(centerX, centerY - 60),
        k.anchor("center"),
        k.color(240, 235, 215)
    ]);

    let started = false;
    const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;

    const enterFullscreenLandscape = () => {
        try {
            const el = document.documentElement;
            const p = el.requestFullscreen ? el.requestFullscreen() : null;
            Promise.resolve(p)
                .then(() => screen.orientation?.lock?.("landscape"))
                .catch(() => {});
        } catch (e) {}
    };

    const startGame = (isMobile) => {
        if (started) return;
        started = true;
        if (isMobile) {
            // touchend cuenta como gesto de usuario válido para pantalla completa
            window.addEventListener("touchend", enterFullscreenLandscape, { once: true });
            enterFullscreenLandscape();
        }
        try {
            initAudio();
        } catch (error) {
            console.warn("No se pudo desbloquear el audio al iniciar:", error);
        }

        window.isMobileMode = isMobile;
        setupMobileControls();
        playMusic("dulce_soledad");
        k.go("house");
    };

    const createBtn = (y, textStr, isMobile) => {
        const btn = k.add([
            k.rect(360, 40, { radius: 8 }),
            k.pos(centerX, y),
            k.anchor("center"),
            k.color(40, 40, 50),
            k.area()
        ]);

        btn.add([
            k.text(textStr, { size: 14 }),
            k.anchor("center"),
            k.color(255, 255, 255)
        ]);

        btn.onHover(() => btn.color = k.rgb(60, 60, 70));
        btn.onHoverEnd(() => btn.color = k.rgb(40, 40, 50));

        btn.onClick(() => startGame(isMobile));

        btn.onTouchStart((pos) => {
            if (btn.hasPoint(pos)) {
                startGame(isMobile);
            }
        });
    };

    createBtn(centerY, `💻 Jugar en Computadora${isTouchDevice ? "" : " (recomendado)"}`, false);
    createBtn(centerY + 60, `📱 Jugar en Celular${isTouchDevice ? " (recomendado)" : ""}`, true);
});
