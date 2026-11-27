/**
 * Generates seamless helical coil SVG paths wrapping around rounded-rectangle
 * card borders for `.card-border-snake` elements.
 *
 * Uses one batched layout read pass followed by batched path attribute writes
 * inside `requestAnimationFrame` so no forced reflows occur.
 */

const COIL_PITCH = 14;
const COIL_TANGENT_AMP = 3.6;
const COIL_NORMAL_AMP = 3.6;
const SAMPLES_PER_TURN = 14;

/**
 * Sample a point, unit tangent, and outward unit normal along a rounded rectangle
 * perimeter of size `width x height` and corner radius `radius`.
 */
function sampleRoundedRect(s, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    const sx = Math.max(0, width - 2 * r);
    const sy = Math.max(0, height - 2 * r);
    const arc = (Math.PI * r) / 2;

    if (s < sx) {
        return { cx: r + s, cy: 0, tx: 1, ty: 0, nx: 0, ny: -1 };
    }
    s -= sx;

    if (s < arc && r > 0) {
        const u = s / r;
        const sinU = Math.sin(u);
        const cosU = Math.cos(u);
        return {
            cx: width - r + r * sinU,
            cy: r - r * cosU,
            tx: cosU,
            ty: sinU,
            nx: sinU,
            ny: -cosU,
        };
    }
    s -= arc;

    if (s < sy) {
        return { cx: width, cy: r + s, tx: 0, ty: 1, nx: 1, ny: 0 };
    }
    s -= sy;

    if (s < arc && r > 0) {
        const u = s / r;
        const sinU = Math.sin(u);
        const cosU = Math.cos(u);
        return {
            cx: width - r + r * cosU,
            cy: height - r + r * sinU,
            tx: -sinU,
            ty: cosU,
            nx: cosU,
            ny: sinU,
        };
    }
    s -= arc;

    if (s < sx) {
        return { cx: width - r - s, cy: height, tx: -1, ty: 0, nx: 0, ny: 1 };
    }
    s -= sx;

    if (s < arc && r > 0) {
        const u = s / r;
        const sinU = Math.sin(u);
        const cosU = Math.cos(u);
        return {
            cx: r - r * sinU,
            cy: height - r + r * cosU,
            tx: -cosU,
            ty: -sinU,
            nx: -sinU,
            ny: cosU,
        };
    }
    s -= arc;

    if (s < sy) {
        return { cx: 0, cy: height - r - s, tx: 0, ty: -1, nx: -1, ny: 0 };
    }
    s -= sy;

    const u = r > 0 ? Math.min(s / r, Math.PI / 2) : 0;
    const sinU = Math.sin(u);
    const cosU = Math.cos(u);
    return {
        cx: r - r * cosU,
        cy: r - r * sinU,
        tx: sinU,
        ty: -cosU,
        nx: -cosU,
        ny: -sinU,
    };
}

/**
 * Build a closed prolate-cycloid helix SVG path wrapping the rounded-rect border.
 */
function buildCoilPath(width, height, radius = 7.5) {
    if (width <= 0 || height <= 0) return '';
    const r = Math.min(radius, width / 2, height / 2);
    const perimeter = 2 * Math.max(0, width - 2 * r) + 2 * Math.max(0, height - 2 * r) + 2 * Math.PI * r;
    const turns = Math.max(20, Math.round(perimeter / COIL_PITCH));
    const totalSteps = turns * SAMPLES_PER_TURN;
    const coords = new Array(totalSteps);

    for (let i = 0; i < totalSteps; i++) {
        const progress = i / totalSteps;
        const s = progress * perimeter;
        const theta = progress * turns * 2 * Math.PI;
        const { cx, cy, tx, ty, nx, ny } = sampleRoundedRect(s, width, height, r);
        const alongT = COIL_TANGENT_AMP * Math.sin(theta);
        const alongN = -COIL_NORMAL_AMP * Math.cos(theta);
        const x = cx + alongT * tx + alongN * nx;
        const y = cy + alongT * ty + alongN * ny;
        coords[i] = `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
    }

    return `${coords.join(' ')} Z`;
}

function initCardCoilBorders() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const svgs = Array.from(document.querySelectorAll('.card-border-snake'));
    if (svgs.length === 0) return;

    let rafId = 0;

    const updateAll = () => {
        rafId = 0;
        // Phase 1: Batch DOM reads
        const measurements = svgs.map((svg) => ({
            svg,
            width: svg.clientWidth,
            height: svg.clientHeight,
        }));

        // Phase 2: Batch DOM writes
        for (const { svg, width, height } of measurements) {
            const key = `${width}x${height}`;
            if (svg.dataset.coilSize === key) continue;
            svg.dataset.coilSize = key;

            const d = buildCoilPath(width, height);
            if (!d) continue;

            const paths = svg.querySelectorAll('path');
            for (const pathEl of paths) {
                pathEl.setAttribute('d', d);
            }
        }
    };

    const scheduleUpdate = () => {
        if (rafId) return;
        rafId = window.requestAnimationFrame(updateAll);
    };

    scheduleUpdate();

    if (typeof ResizeObserver !== 'undefined') {
        const observer = new ResizeObserver(scheduleUpdate);
        for (const svg of svgs) {
            observer.observe(svg);
        }
    }
}

initCardCoilBorders();
