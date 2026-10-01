import { k } from "../kaplayCtx.js";
import { playBGM } from "../utils/audio.js";

k.scene("credits", () => {
    playBGM("music_credits");
    k.setBackground(k.Color.fromHex("#000000"));

    const centerX = k.width() / 2;
    const scrollSpeed = 40;

    const createText = (str, yOffset, size = 24, color = k.rgb(255, 255, 255)) => {
        return k.add([
            k.text(str, { size: size, align: "center", width: k.width() - 40 }),
            k.pos(centerX, k.height() + yOffset),
            k.anchor("center"),
            k.color(color),
            k.move(k.UP, scrollSpeed)
        ]);
    };

    const lines = [
        { text: "========================================", size: 16, y: 0 },
        { text: "CRÉDITOS", size: 32, y: 40, color: k.rgb(255, 215, 0) },
        { text: "========================================", size: 16, y: 80 },
        
        { text: "Creado por:", size: 20, y: 160 },
        { text: "Sebastián Alejandro Velásquez Bonilla", size: 28, y: 200, color: k.rgb(100, 200, 255) },
        
        { text: "Assets & Arte Gráfico:", size: 20, y: 300 },
        { text: "- Sprites de Gatitos: Free Pack (32x32)", size: 16, y: 340 },
        { text: "- Escenario, Mapas & Casas: Sprout Lands Pixel Pack", size: 16, y: 380 },
        { text: "- Snoopy Joe Cool: Generado en memoria / Canvas Art", size: 16, y: 420 },
        { text: "- Minijuegos & Lógica: Desarrollado en Kaplay Engine", size: 16, y: 460 },
        
        { text: "----------------------------------------", size: 16, y: 540 },
        
        { text: "\"Será algo sencillo,", size: 24, y: 640, color: k.rgb(255, 200, 200) },
        { text: "pero lo hice con todo mi amor.", size: 24, y: 680, color: k.rgb(255, 200, 200) },
    ];

    let lastText = null;
    lines.forEach(l => {
        lastText = createText(l.text, l.y, l.size, l.color);
    });

    // When the last text scrolls up sufficiently, transition to final fixed screen
    const checkFinal = k.onUpdate(() => {
        if (lastText && lastText.pos.y < -50) {
            checkFinal.cancel();
            triggerFinalScreen();
        }
    });

    function triggerFinalScreen() {
        k.destroyAll(); // Clear scrolling text

        // Pantalla dorada/blanca
        k.setBackground(k.Color.fromHex("#FFF9E6"));

        // Corazones tenues titilando de fondo
        k.loop(0.4, () => {
            k.add([
                k.sprite("item_corazon"),
                k.pos(k.rand(0, k.width()), k.rand(0, k.height())),
                k.scale(k.rand(1, 3)),
                k.opacity(0),
                k.color(255, 180, 200),
                "bg_heart"
            ]);
        });

        k.onUpdate("bg_heart", (h) => {
            h.opacity = Math.sin(k.time() * 2) * 0.3 + 0.3; // Titila
            h.pos.y -= 10 * k.dt();
            if (h.pos.y < -20) k.destroy(h);
        });

        k.add([
            k.text("¡Feliz cumpleaños, mi vida!", { size: 40, align: "center", width: k.width() - 40 }),
            k.pos(k.width() / 2, k.height() / 2),
            k.anchor("center"),
            k.color(220, 50, 80)
        ]);
        
        k.add([
            k.text("========================================", { size: 16 }),
            k.pos(k.width() / 2, k.height() / 2 + 60),
            k.anchor("center"),
            k.color(220, 150, 80)
        ]);
    }
});
