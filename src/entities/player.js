import { k } from "../kaplayCtx.js";
import { isDialogueActive } from "../ui/dialogueBox.js";

const ACCELERATION = 1200;
const MAX_SPEED = 180;
const FRICTION = 1000;
const INTERACT_RANGE = 35;

export function spawnPlayer(startPos, facing = k.vec2(0, 1)) {
    const player = k.add([
        k.sprite("player"),
        k.pos(startPos),
        k.anchor("center"),
        k.area({ shape: new k.Rect(k.vec2(-8, 16), 16, 12) }), // Colisión a la altura de los pies en el sprite 64x64
        k.body(),
        k.z(startPos.y),
        k.scale(1),
        "player",
        {
            velocity: k.vec2(0, 0),
            facingDirection: facing,
            currentInteractable: null
        }
    ]);

    // Iniciar animación en base a la dirección
    if (facing.y < 0) player.play("idle_up");
    else if (facing.x < 0) player.play("idle_left");
    else if (facing.x > 0) player.play("idle_right");
    else player.play("idle_down");

    // Sombra en el suelo
    player.add([
        k.circle(8), 
        k.scale(1, 0.375), // Escala Y para simular una elipse (height 6 / width 16)
        k.color(0, 0, 0),
        k.opacity(0.25),
        k.pos(0, 16), // A la altura de los pies
        k.z(-1)
    ]);

    // --- INDICADOR GLOBAL DE INTERACCIÓN ---
    const interactPrompt = k.add([
        k.rect(160, 24, { radius: 4 }),
        k.color(20, 20, 25),
        k.opacity(0.85),
        k.anchor("center"),
        k.pos(-1000, -1000), // Oculto por defecto
        k.z(9999)
    ]);
    
    interactPrompt.hidden = true;

    interactPrompt.label = interactPrompt.add([
        k.text("", { size: 10 }),
        k.anchor("center"),
        k.color(255, 255, 255)
    ]);

    player.onUpdate(() => {
        player.z = player.pos.y;
        
        if (isDialogueActive || globalThis.isCinematic) {
            player.velocity.x = moveTowards(player.velocity.x, 0, FRICTION * k.dt());
            player.velocity.y = moveTowards(player.velocity.y, 0, FRICTION * k.dt());
            player.move(player.velocity);
            
            if (player.velocity.len() === 0 && player.curAnim()?.startsWith("walk")) {
                player.play(player.curAnim().replace("walk", "idle"));
            }
            player.currentInteractable = null;
            interactPrompt.hidden = true;
            return;
        }

        let inputDir = k.vec2(0, 0);
        if (k.isKeyDown("left") || k.isKeyDown("a") || window.virtualInput.left) inputDir.x -= 1;
        if (k.isKeyDown("right") || k.isKeyDown("d") || window.virtualInput.right) inputDir.x += 1;
        if (k.isKeyDown("up") || k.isKeyDown("w") || window.virtualInput.up) inputDir.y -= 1;
        if (k.isKeyDown("down") || k.isKeyDown("s") || window.virtualInput.down) inputDir.y += 1;

        if (inputDir.x !== 0 || inputDir.y !== 0) {
            inputDir = inputDir.unit();
            
            // Determinar animación por dirección
            if (Math.abs(inputDir.x) > Math.abs(inputDir.y)) {
                player.facingDirection = k.vec2(Math.sign(inputDir.x), 0);
                const anim = inputDir.x > 0 ? "walk_right" : "walk_left";
                if (player.curAnim() !== anim) player.play(anim);
            } else if (Math.abs(inputDir.y) > 0) {
                player.facingDirection = k.vec2(0, Math.sign(inputDir.y));
                const anim = inputDir.y > 0 ? "walk_down" : "walk_up";
                if (player.curAnim() !== anim) player.play(anim);
            }

            player.velocity.x = moveTowards(player.velocity.x, inputDir.x * MAX_SPEED, ACCELERATION * k.dt());
            player.velocity.y = moveTowards(player.velocity.y, inputDir.y * MAX_SPEED, ACCELERATION * k.dt());
        } else {
            // Parar animación si no hay input
            if (player.curAnim()?.startsWith("walk")) {
                player.play(player.curAnim().replace("walk", "idle"));
            }
            player.velocity.x = moveTowards(player.velocity.x, 0, FRICTION * k.dt());
            player.velocity.y = moveTowards(player.velocity.y, 0, FRICTION * k.dt());
        }

        player.move(player.velocity);
        
        // --- ACTUALIZAR PROMPT GLOBAL ---
        updateInteractionFocus(player);

        if (player.currentInteractable && !isDialogueActive && !globalThis.isCinematic) {
            interactPrompt.hidden = false;
            const wPos = player.currentInteractable.worldPos();
            const h = player.currentInteractable.height || 32;
            interactPrompt.pos.x = wPos.x;
            interactPrompt.pos.y = wPos.y - h / 2 - 24;
            
            const txt = player.currentInteractable.promptText;
            interactPrompt.label.text = txt;
            interactPrompt.width = k.formatText({ text: txt, size: 10 }).width + 12;
        } else {
            interactPrompt.hidden = true;
        }
    });

    const handleAction = () => {
        if (!isDialogueActive && player.currentInteractable) {
            player.currentInteractable.triggerInteraction(player);
        }
    };

    k.onKeyPress(["e", "space"], handleAction);
    
    const virtualHandler = (e) => {
        if (e.detail === 'e' || e.detail === 'space') handleAction();
    };
    window.virtualKeyEvents.addEventListener('virtual_keydown', virtualHandler);
    
    // Cleanup en destroy
    player.onDestroy(() => {
        window.virtualKeyEvents.removeEventListener('virtual_keydown', virtualHandler);
    });

    return player;
}

function updateInteractionFocus(p) {
    const interactables = k.get("interactable_entity");
    let closest = null;
    let minDist = INTERACT_RANGE;

    const lookPoint = p.pos.add(p.facingDirection.scale(16));

    for (const obj of interactables) {
        const dist = lookPoint.dist(obj.worldPos());
        if (dist < minDist) {
            minDist = dist;
            closest = obj;
        }
    }

    p.currentInteractable = closest;
}

function moveTowards(current, target, maxDelta) {
    if (Math.abs(target - current) <= maxDelta) return target;
    return current + Math.sign(target - current) * maxDelta;
}
