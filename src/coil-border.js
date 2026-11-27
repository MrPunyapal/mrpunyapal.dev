/**
 * Generates G1-smooth concavely notched card borders (rounded fillets into
 * inward corner scoops) and seamless helical coil SVG paths wrapping those
 * borders for `.card-border-snake` elements.
 *
 * Uses one batched layout read pass followed by batched path attribute writes
 * inside `requestAnimationFrame` so no forced reflows occur.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';
const COIL_PITCH = 24;
const COIL_TANGENT_AMP = 2.4;
const COIL_NORMAL_AMP = 3.0;
const SAMPLES_PER_TURN = 18;
const FILLET_RADIUS = 7;
const SCOOP_RADIUS = 20;
const INNER_FRAME_INSET = 4.5;

function getCornerRadii(width, height) {
    const baseSpan = SCOOP_RADIUS + 2 * FILLET_RADIUS;
    const scale = Math.min(1, width / (baseSpan * 3), height / (baseSpan * 3));
    const f = FILLET_RADIUS * scale;
    const R = SCOOP_RADIUS * scale;
    return { f, R, n: R + 2 * f };
}

/**
 * Sample a point, unit tangent, and outward unit normal along a G1-smooth
 * concavely notched rectangle perimeter of size `width x height`.
 */
function sampleNotchedRect(s, width, height) {
    const { f, R, n } = getCornerRadii(width, height);
    const sx = Math.max(0, width - 2 * n);
    const sy = Math.max(0, height - 2 * n);
    const arcF = (Math.PI * f) / 2;
    const arcR = (Math.PI * R) / 2;

    // 1. Top straight
    if (s < sx) return { cx: n + s, cy: 0, tx: 1, ty: 0, nx: 0, ny: -1 };
    s -= sx;

    // 2. Top-right corner: fillet 1 -> scoop -> fillet 2
    if (s < arcF && f > 0) {
        const u = s / f;
        const sinU = Math.sin(u), cosU = Math.cos(u);
        return { cx: width - n + f * sinU, cy: f - f * cosU, tx: cosU, ty: sinU, nx: sinU, ny: -cosU };
    }
    s -= arcF;
    if (s < arcR && R > 0) {
        const u = s / R;
        const sinU = Math.sin(u), cosU = Math.cos(u);
        return { cx: width - f - R * cosU, cy: f + R * sinU, tx: sinU, ty: cosU, nx: cosU, ny: -sinU };
    }
    s -= arcR;
    if (s < arcF && f > 0) {
        const u = s / f;
        const sinU = Math.sin(u), cosU = Math.cos(u);
        return { cx: width - f + f * sinU, cy: n - f * cosU, tx: cosU, ty: sinU, nx: sinU, ny: -cosU };
    }
    s -= arcF;

    // 3. Right straight
    if (s < sy) return { cx: width, cy: n + s, tx: 0, ty: 1, nx: 1, ny: 0 };
    s -= sy;

    // 4. Bottom-right corner: fillet 1 -> scoop -> fillet 2
    if (s < arcF && f > 0) {
        const u = s / f;
        const sinU = Math.sin(u), cosU = Math.cos(u);
        return { cx: width - f + f * cosU, cy: height - n + f * sinU, tx: -sinU, ty: cosU, nx: cosU, ny: sinU };
    }
    s -= arcF;
    if (s < arcR && R > 0) {
        const u = s / R;
        const sinU = Math.sin(u), cosU = Math.cos(u);
        return { cx: width - f - R * sinU, cy: height - f - R * cosU, tx: -cosU, ty: sinU, nx: sinU, ny: cosU };
    }
    s -= arcR;
    if (s < arcF && f > 0) {
        const u = s / f;
        const sinU = Math.sin(u), cosU = Math.cos(u);
        return { cx: width - n + f * cosU, cy: height - f + f * sinU, tx: -sinU, ty: cosU, nx: cosU, ny: sinU };
    }
    s -= arcF;

    // 5. Bottom straight
    if (s < sx) return { cx: width - n - s, cy: height, tx: -1, ty: 0, nx: 0, ny: 1 };
    s -= sx;

    // 6. Bottom-left corner: fillet 1 -> scoop -> fillet 2
    if (s < arcF && f > 0) {
        const u = s / f;
        const sinU = Math.sin(u), cosU = Math.cos(u);
        return { cx: n - f * sinU, cy: height - f + f * cosU, tx: -cosU, ty: -sinU, nx: -sinU, ny: cosU };
    }
    s -= arcF;
    if (s < arcR && R > 0) {
        const u = s / R;
        const sinU = Math.sin(u), cosU = Math.cos(u);
        return { cx: f + R * cosU, cy: height - f - R * sinU, tx: -sinU, ty: -cosU, nx: -cosU, ny: sinU };
    }
    s -= arcR;
    if (s < arcF && f > 0) {
        const u = s / f;
        const sinU = Math.sin(u), cosU = Math.cos(u);
        return { cx: f - f * sinU, cy: height - n + f * cosU, tx: -cosU, ty: -sinU, nx: -sinU, ny: cosU };
    }
    s -= arcF;

    // 7. Left straight
    if (s < sy) return { cx: 0, cy: height - n - s, tx: 0, ty: -1, nx: -1, ny: 0 };
    s -= sy;

    // 8. Top-left corner: fillet 1 -> scoop -> fillet 2
    if (s < arcF && f > 0) {
        const u = s / f;
        const sinU = Math.sin(u), cosU = Math.cos(u);
        return { cx: f - f * cosU, cy: n - f * sinU, tx: sinU, ty: -cosU, nx: -cosU, ny: -sinU };
    }
    s -= arcF;
    if (s < arcR && R > 0) {
        const u = s / R;
        const sinU = Math.sin(u), cosU = Math.cos(u);
        return { cx: f + R * sinU, cy: f + R * cosU, tx: cosU, ty: -sinU, nx: -sinU, ny: -cosU };
    }
    s -= arcR;

    const u = f > 0 ? Math.min(Math.PI / 2, s / f) : 0;
    const sinU = Math.sin(u), cosU = Math.cos(u);
    return { cx: n - f * cosU, cy: f - f * sinU, tx: sinU, ty: -cosU, nx: -cosU, ny: -sinU };
}

function buildNotchedSurfacePath(width, height, inset = 0) {
    const { f: baseF, R: baseR, n } = getCornerRadii(width, height);
    const d = Math.min(inset, Math.max(0, baseF - 1.5));
    const f = baseF - d;
    const R = baseR + d;
    const fs = f.toFixed(1);
    const rs = R.toFixed(1);
    const ns = n.toFixed(1);
    const ds = d.toFixed(1);
    const w = width;
    const h = height;

    return [
        `M${ns} ${ds}`,
        `L${(w - n).toFixed(1)} ${ds}`,
        `A${fs} ${fs} 0 0 1 ${(w - n + f).toFixed(1)} ${baseF.toFixed(1)}`,
        `A${rs} ${rs} 0 0 0 ${(w - baseF).toFixed(1)} ${(baseF + R).toFixed(1)}`,
        `A${fs} ${fs} 0 0 1 ${(w - d).toFixed(1)} ${ns}`,
        `L${(w - d).toFixed(1)} ${(h - n).toFixed(1)}`,
        `A${fs} ${fs} 0 0 1 ${(w - baseF).toFixed(1)} ${(h - n + f).toFixed(1)}`,
        `A${rs} ${rs} 0 0 0 ${(w - n + f).toFixed(1)} ${(h - baseF).toFixed(1)}`,
        `A${fs} ${fs} 0 0 1 ${(w - n).toFixed(1)} ${(h - d).toFixed(1)}`,
        `L${ns} ${(h - d).toFixed(1)}`,
        `A${fs} ${fs} 0 0 1 ${(n - f).toFixed(1)} ${(h - baseF).toFixed(1)}`,
        `A${rs} ${rs} 0 0 0 ${baseF.toFixed(1)} ${(h - n + f).toFixed(1)}`,
        `A${fs} ${fs} 0 0 1 ${ds} ${(h - n).toFixed(1)}`,
        `L${ds} ${ns}`,
        `A${fs} ${fs} 0 0 1 ${baseF.toFixed(1)} ${(n - f).toFixed(1)}`,
        `A${rs} ${rs} 0 0 0 ${(n - f).toFixed(1)} ${baseF.toFixed(1)}`,
        `A${fs} ${fs} 0 0 1 ${ns} ${ds}`,
        'Z',
    ].join(' ');
}

/**
 * Build a closed sinusoidal-helix SVG path wrapping the G1-smooth notched
 * card border, plus mask geometry so alternating half-turns shade and tuck
 * cleanly behind the 1px border line.
 */
function buildCoilGeometry(width, height) {
    if (width <= 0 || height <= 0) return null;
    const { f, R, n } = getCornerRadii(width, height);
    const perimeter =
        2 * Math.max(0, width - 2 * n) +
        2 * Math.max(0, height - 2 * n) +
        4 * Math.PI * f +
        2 * Math.PI * R;
    const turns = Math.max(16, Math.round(perimeter / COIL_PITCH));
    const totalSteps = turns * SAMPLES_PER_TURN;
    const coords = new Array(totalSteps);

    for (let i = 0; i < totalSteps; i++) {
        const progress = i / totalSteps;
        const s = progress * perimeter;
        const theta = progress * turns * 2 * Math.PI;
        const { cx, cy, tx, ty, nx, ny } = sampleNotchedRect(s, width, height);
        const alongT = -COIL_TANGENT_AMP * Math.cos(theta);
        const alongN = -COIL_NORMAL_AMP * Math.cos(theta);
        const x = cx + alongT * tx + alongN * nx;
        const y = cy + alongT * ty + alongN * ny;
        coords[i] = `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
    }

    const backShadeParts = new Array(turns);
    const backGapParts = new Array(turns);

    for (let k = 0; k < turns; k++) {
        const shadePts = [];
        for (let step = 0; step <= 8; step++) {
            const frac = 1.12 + (0.76 * step) / 8;
            const theta = (2 * k + frac) * Math.PI;
            const s = (theta / (turns * 2 * Math.PI)) * perimeter;
            const { cx, cy, tx, ty, nx, ny } = sampleNotchedRect(s, width, height);
            const alongT = -COIL_TANGENT_AMP * Math.cos(theta);
            const alongN = -COIL_NORMAL_AMP * Math.cos(theta);
            const x = cx + alongT * tx + alongN * nx;
            const y = cy + alongT * ty + alongN * ny;
            shadePts.push(`${step === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`);
        }
        backShadeParts[k] = shadePts.join(' ');

        const sCross = ((k + 0.75) / turns) * perimeter;
        const p1 = sampleNotchedRect((sCross - 2.6 + perimeter) % perimeter, width, height);
        const p2 = sampleNotchedRect(sCross, width, height);
        const p3 = sampleNotchedRect((sCross + 2.6) % perimeter, width, height);
        backGapParts[k] = `M${p1.cx.toFixed(1)} ${p1.cy.toFixed(1)} L${p2.cx.toFixed(1)} ${p2.cy.toFixed(1)} L${p3.cx.toFixed(1)} ${p3.cy.toFixed(1)}`;
    }

    return {
        surfacePath: buildNotchedSurfacePath(width, height, 0),
        innerSurfacePath: buildNotchedSurfacePath(width, height, INNER_FRAME_INSET),
        coilPath: `${coords.join(' ')} Z`,
        backShadePath: backShadeParts.join(' '),
        backGapPath: backGapParts.join(' '),
    };
}

function ensureCoilMaskLayer(svg, index) {
    let group = svg.querySelector('g[data-coil-group]');
    if (group) {
        return {
            surfacePath: svg.querySelector('path.card-notched-surface'),
            innerSurfacePath: svg.querySelector('path.card-notched-inner'),
            mask: svg.querySelector('mask'),
            maskRect: svg.querySelector('mask > rect'),
            shadePath: svg.querySelector('path[data-coil-shade]'),
            gapPath: svg.querySelector('path[data-coil-gap]'),
            snakePaths: group.querySelectorAll('path'),
        };
    }

    const maskId = `coil-border-mask-${index}`;
    const defs = document.createElementNS(SVG_NS, 'defs');
    const mask = document.createElementNS(SVG_NS, 'mask');
    mask.setAttribute('id', maskId);
    mask.setAttribute('maskUnits', 'userSpaceOnUse');

    const maskRect = document.createElementNS(SVG_NS, 'rect');
    maskRect.setAttribute('fill', '#ffffff');

    const shadePath = document.createElementNS(SVG_NS, 'path');
    shadePath.setAttribute('data-coil-shade', 'true');
    shadePath.setAttribute('fill', 'none');
    shadePath.setAttribute('stroke', '#b8b8b8');
    shadePath.setAttribute('stroke-width', '3.6');
    shadePath.setAttribute('stroke-linecap', 'round');

    const gapPath = document.createElementNS(SVG_NS, 'path');
    gapPath.setAttribute('data-coil-gap', 'true');
    gapPath.setAttribute('fill', 'none');
    gapPath.setAttribute('stroke', '#000000');
    gapPath.setAttribute('stroke-width', '2.0');
    gapPath.setAttribute('stroke-linecap', 'butt');

    mask.appendChild(maskRect);
    mask.appendChild(shadePath);
    mask.appendChild(gapPath);
    defs.appendChild(mask);

    const surfacePath = document.createElementNS(SVG_NS, 'path');
    surfacePath.setAttribute('class', 'card-notched-surface');

    const innerSurfacePath = document.createElementNS(SVG_NS, 'path');
    innerSurfacePath.setAttribute('class', 'card-notched-inner');

    group = document.createElementNS(SVG_NS, 'g');
    group.setAttribute('data-coil-group', 'true');
    group.setAttribute('mask', `url(#${maskId})`);

    const snakePaths = Array.from(svg.querySelectorAll('path'));
    for (const pathEl of snakePaths) {
        group.appendChild(pathEl);
    }

    svg.appendChild(defs);
    svg.appendChild(surfacePath);
    svg.appendChild(innerSurfacePath);
    svg.appendChild(group);

    return { surfacePath, innerSurfacePath, mask, maskRect, shadePath, gapPath, snakePaths };
}

function initCardCoilBorders() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
        measurements.forEach(({ svg, width, height }, index) => {
            const key = `${width}x${height}`;
            if (svg.dataset.coilSize === key) return;
            svg.dataset.coilSize = key;

            const geometry = buildCoilGeometry(width, height);
            if (!geometry) return;

            const { surfacePath, innerSurfacePath, mask, maskRect, shadePath, gapPath, snakePaths } = ensureCoilMaskLayer(svg, index);
            surfacePath.setAttribute('d', geometry.surfacePath);
            innerSurfacePath.setAttribute('d', geometry.innerSurfacePath);

            if (reducedMotion) return;

            const pad = 12;
            const maskWidth = width + pad * 2;
            const maskHeight = height + pad * 2;

            mask.setAttribute('x', String(-pad));
            mask.setAttribute('y', String(-pad));
            mask.setAttribute('width', String(maskWidth));
            mask.setAttribute('height', String(maskHeight));
            maskRect.setAttribute('x', String(-pad));
            maskRect.setAttribute('y', String(-pad));
            maskRect.setAttribute('width', String(maskWidth));
            maskRect.setAttribute('height', String(maskHeight));

            shadePath.setAttribute('d', geometry.backShadePath);
            gapPath.setAttribute('d', geometry.backGapPath);

            for (const pathEl of snakePaths) {
                pathEl.setAttribute('d', geometry.coilPath);
            }
        });
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
