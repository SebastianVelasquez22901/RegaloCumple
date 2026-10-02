import { k } from "../kaplayCtx.js";

window.virtualInput = {
    left: false,
    right: false,
    up: false,
    down: false,
    e: false,
    space: false
};

window.virtualKeyEvents = new EventTarget();

let currentMobileControls = null;

export function setupMobileControls() {
    if (!window.isMobileMode) return;

    if (currentMobileControls) {
        k.destroy(currentMobileControls);
    }

    currentMobileControls = k.add([
        k.fixed(),
        k.z(9995),
        "mobileControls"
    ]);

    const createBtn = (x, y, w, h, inputKey, label, isCircle = false) => {
        const btn = currentMobileControls.add([
            isCircle ? k.circle(w) : k.rect(w, h, { radius: 8 }),
            k.pos(x, y),
            k.anchor("center"),
            k.color(20, 20, 30),
            k.opacity(0.4),
            k.area()
        ]);

        if (label) {
            btn.add([
                k.text(label, { size: isCircle ? 14 : 10 }),
                k.anchor("center"),
                k.color(255, 255, 255),
                k.z(1)
            ]);
        }

        // Borde dorado
        btn.add([
            isCircle ? k.circle(w) : k.rect(w, h, { radius: 8, fill: false }),
            k.color(255, 215, 0),
            k.opacity(0.6),
            k.anchor("center")
        ]);

        // Manejo de eventos
        btn.onHover(() => btn.opacity = 0.6);
        btn.onHoverEnd(() => {
            btn.opacity = 0.4;
            window.virtualInput[inputKey] = false;
        });

        const press = () => { 
            if (!window.virtualInput[inputKey]) {
                window.virtualKeyEvents.dispatchEvent(new CustomEvent('virtual_keydown', { detail: inputKey }));
            }
            window.virtualInput[inputKey] = true; 
            btn.opacity = 0.8; 
        };
        const release = () => { window.virtualInput[inputKey] = false; btn.opacity = 0.6; };

        // Kaplay 3 soporta onMouseDown / onTouchStart combinados mediante eventos de puntero o mouse
        btn.onClick(press);
        btn.onMousePress(() => {
            if (btn.isHovering()) press();
        });
        btn.onMouseRelease(() => {
            release();
        });

        // Touch events explicitly
        let activeTouch = null;
        btn.onTouchStart((id, pos) => {
            if (btn.hasPoint(pos)) {
                activeTouch = id;
                press();
            }
        });
        btn.onTouchEnd((id) => {
            if (id === activeTouch) {
                activeTouch = null;
                release();
            }
        });

        return btn;
    };

    const dw = k.width();
    const dh = k.height();

    // D-Pad (Esquina inferior izquierda)
    const padX = 78;
    const padY = dh - 78;
    const step = 42;
    const sz = 38;

    createBtn(padX, padY - step, sz, sz, "up", "▲");
    createBtn(padX, padY + step, sz, sz, "down", "▼");
    createBtn(padX - step, padY, sz, sz, "left", "◄");
    createBtn(padX + step, padY, sz, sz, "right", "►");

    // Botones de Acción (Esquina inferior derecha)
    const actX = dw - 70;
    const actY = dh - 70;

    createBtn(actX, actY + 28, 26, 26, "e", "E", true);
    createBtn(actX, actY - 28, 26, 26, "space", "ESP", true);

    // Permitir ocultar/mostrar programáticamente (útil en cinemáticas)
    currentMobileControls.onUpdate(() => {
        if (globalThis.isCinematic || globalThis.isDialogueActive) {
            currentMobileControls.hidden = true;
        } else {
            currentMobileControls.hidden = false;
        }
    });
}
