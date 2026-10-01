import { k } from "../kaplayCtx.js";
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

    const createBtn = (y, textStr, isMobile) => {
        const btn = k.add([
            k.rect(280, 40, { radius: 8 }),
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

        btn.onClick(() => {
            window.isMobileMode = isMobile;
            setupMobileControls();
            k.go("house");
        });
        
        // Soporte touch estricto
        btn.onTouchStart((id, pos) => {
            if (btn.hasPoint(pos)) {
                window.isMobileMode = isMobile;
                setupMobileControls();
                k.go("house");
            }
        });
    };

    createBtn(centerY, "💻 Jugar en Computadora", false);
    createBtn(centerY + 60, "📱 Jugar en Teléfono / Tablet", true);
});
