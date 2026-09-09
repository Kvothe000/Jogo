import { BODIES, CORES, INSTINCTS, ORIGINS } from '@jogo/engine';
import type { Axis } from '@jogo/engine';

const AXIS_LABEL: Record<Axis, string> = {
    CORE: 'CORE',
    BODY: 'BODY',
    INSTINCT: 'INSTINCT',
    ORIGIN: 'ORIGIN',
};

function partInfo(axis: Axis, part: string) {
    if (axis === 'CORE') return CORES[part as keyof typeof CORES];
    if (axis === 'BODY') return BODIES[part as keyof typeof BODIES];
    if (axis === 'INSTINCT') return INSTINCTS[part as keyof typeof INSTINCTS];
    return ORIGINS[part as keyof typeof ORIGINS];
}

export function partColor(axis: Axis, part: string): string {
    return partInfo(axis, part)?.color ?? '#888';
}

export default function PartSquare({ axis, part }: { axis: Axis; part: string }) {
    const info = partInfo(axis, part);
    const tip = info ? `${AXIS_LABEL[axis]}: ${info.label} — ${info.desc}` : AXIS_LABEL[axis];
    return (
        <span
            className="square tip"
            style={{ background: partColor(axis, part) }}
            data-tip={tip}
        />
    );
}