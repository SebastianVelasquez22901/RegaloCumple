import kaplay from "kaplay";

export const k = kaplay({
    width: 640,
    height: 360,
    letterbox: true,
    background: [80, 160, 80],
    pixelDensity: 1,
    crisp: true,
    global: false
});
