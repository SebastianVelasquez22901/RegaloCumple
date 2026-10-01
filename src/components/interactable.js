import { k } from "../kaplayCtx.js";

export function interactable(config = {}) {
    return {
        id: "interactable",
        require: ["pos", "area"],
        promptText: config.promptText || "(E) Leer",
        onInteract: config.onInteract || (() => {}),
        isFocused: false,

        add() {
            this.use("interactable_entity"); // Asegurar que tenga el tag
        },

        triggerInteraction(player) {
            this.onInteract(player);
        }
    };
}
