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
        btn.onTouchStart((id, pos) => {
            if (btn.hasPoint(pos)) press();
        });
        btn.onTouchEnd((id, pos) => {
            release();
        });

        return btn;
    };

    const dw = k.width();
    const dh = k.height();

    // D-Pad (Esquina inferior izquierda)
    const padX = 60;
    const padY = dh - 60;
    
    createBtn(padX, padY - 32, 28, 28, "up", "▲");
    createBtn(padX, padY + 32, 28, 28, "down", "▼");
    createBtn(padX - 32, padY, 28, 28, "left", "◄");
    createBtn(padX + 32, padY, 28, 28, "right", "►");

    // Botones de Acción (Esquina inferior derecha)
    const actX = dw - 60;
    const actY = dh - 60;

    createBtn(actX, actY + 15, 20, 20, "e", "E", true);
    createBtn(actX, actY - 25, 20, 20, "space", "ESP", true);

    // Permitir ocultar/mostrar programáticamente (útil en cinemáticas)
    currentMobileControls.onUpdate(() => {
        if (globalThis.isCinematic || globalThis.isDialogueActive) {
            currentMobileControls.hidden = true;
        } else {
            currentMobileControls.hidden = false;
        }
    });
}
