import { k } from "../kaplayCtx.js";
import { interactable } from "../components/interactable.js";
import { startDialogue } from "../ui/dialogueBox.js";
import { gameState } from "../state/gameState.js";

export function spawnNPC(id, pos, color, name, dialogues) {
    const npc = k.add([
        k.pos(pos),
        k.anchor("bot"),
        k.area({ shape: new k.Rect(k.vec2(-10, -10), 20, 10) }), // Físicas
        k.body({ isStatic: true }),
        k.z(pos.y),
        k.scale(1),
        "interactable_entity",
        "npc",
        interactable({
            promptText: `(E) Hablar con ${name}`,
            onInteract: (player) => {
                let lines = dialogues.initial;
                if (gameState.isFinaleReady && dialogues.completed) {
                    lines = dialogues.completed;
                } else if (dialogues.afterMemoryCheck) {
                    lines = dialogues.afterMemoryCheck() ? dialogues.afterMemory : dialogues.initial;
                }
                gameState.talkedToNPCs.add(id);
                startDialogue(lines);
            }
        })
    ]);

    // Sombra
    npc.add([k.circle(12), k.scale(1, 5/12), k.color(0,0,0), k.opacity(0.3), k.pos(0, 0), k.z(-1)]);

    // Cuerpo
    npc.add([k.rect(16, 12, { radius: 4 }), k.color(color), k.pos(0, -6), k.anchor("center")]);
    // Camisa
    npc.add([k.rect(16, 6), k.color(240, 240, 200), k.pos(0, -3), k.anchor("center")]);
    
    // Cabeza
    npc.add([k.rect(20, 16, { radius: 6 }), k.color(color), k.pos(0, -18), k.anchor("center")]);
    
    // Orejas de animal
    npc.add([k.polygon([k.vec2(-6, -26), k.vec2(-12, -32), k.vec2(-10, -22)]), k.color(color)]);
    npc.add([k.polygon([k.vec2(6, -26), k.vec2(12, -32), k.vec2(10, -22)]), k.color(color)]);

    // Rostro (Ojos y Nariz)
    npc.add([k.rect(3, 4, { radius: 1 }), k.color(20, 20, 20), k.pos(-5, -20), k.anchor("center")]);
    npc.add([k.rect(3, 4, { radius: 1 }), k.color(20, 20, 20), k.pos(5, -20), k.anchor("center")]);
    npc.add([k.circle(1.5), k.color(20, 20, 20), k.pos(0, -15)]);

    npc.onUpdate(() => {
        // Respiración suave
        npc.scale.y = 1 + Math.sin(k.time() * 2 + pos.x) * 0.05;
    });

    return npc;
}

// Gatos manejados en town.js directamente

