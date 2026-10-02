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
    const baseX = 90;
    const baseY = dh - 90;
    const baseR = 44;
    const knobR = 18;
    const grabR = 85;
    const deadzone = 0.3;

    const joyBase = currentMobileControls.add([
        k.circle(baseR),
        k.pos(baseX, baseY),
        k.anchor("center"),
        k.color(20, 20, 30),
        k.opacity(0.35),
        k.outline(2, k.rgb(255, 215, 0))
    ]);
    const knob = currentMobileControls.add([
        k.circle(knobR),
        k.pos(baseX, baseY),
        k.anchor("center"),
        k.color(255, 215, 0),
        k.opacity(0.55),
        k.z(1)
    ]);

    let joyTouch = null;
    const setDir = (l, r, u, d) => {
        const v = window.virtualInput;
        v.left = l; v.right = r; v.up = u; v.down = d;
    };
    const resetJoy = () => {
        joyTouch = null;
        knob.pos = k.vec2(baseX, baseY);
        knob.opacity = 0.55;
        joyBase.opacity = 0.35;
        setDir(false, false, false, false);
    };
    const moveJoy = (pos) => {
        let dx = pos.x - baseX;
        let dy = pos.y - baseY;
        const len = Math.hypot(dx, dy);
        if (len > baseR) {
            dx = (dx / len) * baseR;
            dy = (dy / len) * baseR;
        }
        knob.pos = k.vec2(baseX + dx, baseY + dy);
        const nx = dx / baseR;
        const ny = dy / baseR;
        setDir(nx < -deadzone, nx > deadzone, ny < -deadzone, ny > deadzone);
    };

    const joyEvents = [
        k.onTouchStart((id, pos) => {
            if (joyTouch !== null || currentMobileControls.hidden) return;
            if (pos.dist(k.vec2(baseX, baseY)) <= grabR) {
                joyTouch = id;
                knob.opacity = 0.85;
                joyBase.opacity = 0.5;
                moveJoy(pos);
            }
        }),
        k.onTouchMove((id, pos) => {
            if (id === joyTouch) moveJoy(pos);
        }),
        k.onTouchEnd((id) => {
            if (id === joyTouch) resetJoy();
        })
    ];
    currentMobileControls.onDestroy(() => {
        joyEvents.forEach((e) => e.cancel());
        resetJoy();
    });

    // Botones de Acción (Esquina inferior derecha)
    const actX = dw - 70;
    const actY = dh - 70;

    createBtn(actX, actY + 28, 26, 26, "e", "E", true);
    createBtn(actX, actY - 28, 26, 26, "space", "ESP", true);

    // Permitir ocultar/mostrar programáticamente (útil en cinemáticas)
    currentMobileControls.onUpdate(() => {
        if (globalThis.isCinematic || globalThis.isDialogueActive) {
            if (!currentMobileControls.hidden) resetJoy();
            currentMobileControls.hidden = true;
        } else {
            currentMobileControls.hidden = false;
        }
    });
}
