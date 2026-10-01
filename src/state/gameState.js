import { k } from "../kaplayCtx.js";

export const gameState = {
    memoriesFound: new Set(),
    totalMemoriesRequired: 3,
    talkedToNPCs: new Set(),
    isFinaleReady: false,

    collectMemory(id) {
        if (!this.memoriesFound.has(id)) {
            this.memoriesFound.add(id);
            this.checkProgress();
            k.trigger("memory_collected", this.memoriesFound.size);
        }
    },

    hasCollected(id) {
        return this.memoriesFound.has(id);
    },

    checkProgress() {
        if (this.memoriesFound.size >= this.totalMemoriesRequired && !this.isFinaleReady) {
            this.isFinaleReady = true;
            k.trigger("finale_ready");
        }
    }
};
