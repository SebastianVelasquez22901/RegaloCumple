import { k } from "../kaplayCtx.js";
import { interactable } from "../components/interactable.js";
import { startDialogue } from "../ui/dialogueBox.js";
import { gameState } from "../state/gameState.js";

// Límite global para evitar sobrecarga de GPU
let activeParticles = 0;
const MAX_PARTICLES = 40;

export function spawnMemory(id, pos, memoryData) {
    const memory = k.add([
        k.pos(pos),
        k.area({ shape: new k.Rect(k.vec2(-12, -10), 24, 20) }),
        k.body({ isStatic: true }),
        k.z(pos.y),
        k.scale(1),
        "interactable_entity",
        interactable({
            promptText: "(E) Inspeccionar",
            onInteract: () => {
                if (!gameState.hasCollected(id)) {
                    if (memoryData.onUnlock) {
                        memoryData.onUnlock();
                        return;
                    }
                    startDialogue(memoryData.initialLines, () => {
                        gameState.collectMemory(id);
                        
                        // Partículas de magia con control estricto de pooling/límite
                        const numToSpawn = Math.min(15, MAX_PARTICLES - activeParticles);
                        for(let i=0; i<numToSpawn; i++) {
                            activeParticles++;
                            const p = k.add([
                                k.rect(4, 4),
                                k.pos(memory.pos),
                                k.color(k.rand(200,255), k.rand(200,255), k.rand(100,255)),
                                k.opacity(1)
                            ]);
                            const dir = k.vec2(k.rand(-1, 1), k.rand(-1, 1)).unit();
                            const speed = k.rand(30, 80);
                            let life = 0;
                            p.onUpdate(() => {
                                life += k.dt();
                                p.move(dir.scale(speed));
                                p.opacity = Math.max(0, 1 - (life / 0.8));
                                // Destrucción explícita si se hace invisible o sale de pantalla
                                if (p.opacity <= 0) {
                                    activeParticles--;
                                    p.destroy();
                                }
                            });
                        }
                        
                        setAgotado();
                    });
                } else {
                    startDialogue(memoryData.reminderLines);
                }
            }
        })
    ]);

    // Sombra
    memory.add([k.circle(14), k.scale(1, 6/14), k.color(0, 0, 0), k.opacity(0.3), k.pos(0, 6)]);

    const box = memory.add([k.pos(0, 0)]);
    
    // Caja dorada y tapa
    const base = box.add([k.rect(18, 16, { radius: 2 }), k.color(250, 210, 50), k.anchor("center")]);
    const lid = box.add([k.rect(20, 6, { radius: 2 }), k.color(255, 230, 90), k.anchor("center"), k.pos(0, -7)]);
    
    // Cintas
    const r1 = box.add([k.rect(4, 16), k.color(230, 60, 60), k.anchor("center")]);
    const r2 = box.add([k.rect(20, 4), k.color(230, 60, 60), k.anchor("center")]);
    
    // Moño 3D
    const bow1 = box.add([k.circle(4), k.color(240, 70, 70), k.pos(-4, -12)]);
    const bow2 = box.add([k.circle(4), k.color(240, 70, 70), k.pos(4, -12)]);
    const bowC = box.add([k.circle(2), k.color(255, 100, 100), k.pos(0, -11)]);

    const startY = memory.pos.y;
    memory.onUpdate(() => {
        if (!gameState.hasCollected(id)) {
            // Flotar caja completa y destello de tapa
            box.pos.y = Math.sin(k.time() * 4) * 3;
            lid.scale = k.vec2(1 + Math.sin(k.time() * 8) * 0.05); 
        }
    });

    function setAgotado() {
        base.color = k.rgb(180, 160, 100); 
        lid.color = k.rgb(180, 160, 100);
        r1.color = k.rgb(120, 80, 80);
        r2.color = k.rgb(120, 80, 80);
        bow1.color = k.rgb(120, 80, 80);
        bow2.color = k.rgb(120, 80, 80);
        bowC.color = k.rgb(120, 80, 80);
        
        box.scale = k.vec2(1.1, 0.4); 
        box.pos.y = 5;
    }

    if (gameState.hasCollected(id)) {
        setAgotado();
    }

    return memory;
}
