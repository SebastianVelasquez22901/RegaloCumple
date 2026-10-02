import kaplay from "kaplay";

const W = 640;
const H = 360;

// Resolución interna acorde a la pantalla real: evita que textos y sprites se vean borrosos o pixelados al agrandarse.
function computePixelDensity() {
    const dpr = window.devicePixelRatio || 1;
    const a = window.innerWidth;
    const b = window.innerHeight;
    const long = Math.max(a, b);
    const short = Math.min(a, b);
    const fit = Math.min(long / W, short / H) * dpr;
    return Math.min(4, Math.max(1, Math.ceil(fit)));
}

export const k = kaplay({
    width: W,
    height: H,
    letterbox: true,
    background: [80, 160, 80],
    pixelDensity: computePixelDensity(),
    crisp: true,
    global: false
});
