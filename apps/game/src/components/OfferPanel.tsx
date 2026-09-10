import { useMemo, useState } from 'react';
import { previewOffer, resolveSacrifice, teamPower, withTarget } from '@jogo/engine';
import type { Axis, Offer } from '@jogo/engine';
import { useGame } from '../store';

const AXES: Axis[] = ['CORE', 'BODY', 'INSTINCT', 'ORIGIN'];

export default function OfferPanel() {
    const offers = useGame((s) => s.offers);
    const team = useGame((s) => s.team);
    const stage = useGame((s) => s.stage);
    const chooseOffer = useGame((s) => s.chooseOffer);
    const toBattle = useGame((s) => s.toBattle);
    const [selected, setSelected] = useState<Offer | null>(null);
    const [target, setTarget] = useState<number | null>(null);
    const [victim, setVictim] = useState<number | null>(null);
    const [sacAxis, setSacAxis] = useState<Axis | null>(null);

    const isMutate = selected?.kind === 'MUTAR';
    const isSacrifice = selected?.kind === 'SACRIFICAR';

    const alvoDefinido = isMutate ? target !== null : true;
    const sacrificioDefinido =
        isSacrifice ? victim !== null && target !== null && sacAxis !== null && victim !== target : true;

    const preview = useMemo(() => {
        if (!selected) return null;
        if (isSacrifice && (victim === null || target === null || sacAxis === null || victim === target)) return null;
        let resolved: Offer;
        if (isMutate) resolved = withTarget(selected, target ?? 0);
        else if (isSacrifice) resolved = resolveSacrifice(selected, victim ?? 0, target ?? 0, sacAxis ?? 'CORE');
        else resolved = selected;
        return previewOffer(team, resolved);
    }, [selected, target, victim, sacAxis, team, isMutate, isSacrifice]);

    const bpBefore = teamPower(team);
    const bpAfter = preview ? teamPower(preview.teamAfter) : null;

    function selectOffer(offer: Offer) {
        setSelected(offer);
        setTarget(null);
        setVictim(null);
        setSacAxis(null);
        if (offer.kind === 'MUTAR' && team.length === 1) setTarget(0);
    }

    function confirm() {
        if (!selected) return;
        if (isMutate && target === null) return;
        if (isSacrifice && (victim === null || target === null || sacAxis === null || victim === target)) return;
        chooseOffer(selected, {
            targetIndex: isMutate ? (target ?? 0) : isSacrifice ? (target ?? 0) : undefined,
            victimIndex: isSacrifice ? (victim ?? 0) : undefined,
            axis: isSacrifice ? (sacAxis ?? undefined) : undefined,
        });
        setSelected(null);
        setTarget(null);
        setVictim(null);
        setSacAxis(null);
    }

    return (
        <section className="offers">
            <h2>Escolha 1 oferta (Etapa {stage})</h2>
            <p className="muted hint">Você pode aplicar <b>uma</b> oferta por etapa antes da batalha.</p>
            <div className="offer-row">
                {offers.map((offer) => (
                    <button
                        key={offer.offerId}
                        className={`offer-card ${selected?.offerId === offer.offerId ? 'selected' : ''}`}
                        onClick={() => selectOffer(offer)}
                    >
                        <strong>
                            {offer.kind === 'MUTAR' ? '🧬 MUTAR' : offer.kind === 'SACRIFICAR' ? '⚔️ SACRIFICAR' : '➕ CRIAR'}
                        </strong>
                        {offer.kind === 'MUTAR' && <span>{offer.axis}: {String(offer.partId)}</span>}
                        {offer.kind === 'SACRIFICAR' && <span>Sacrifique 1 criatura para transferir uma parte</span>}
                        {offer.kind === 'CRIAR' && (
                            <span className="recipe-preview">
                                {offer.recipe.core} · {offer.recipe.body} · {offer.recipe.instinct} · {offer.recipe.origin}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {isMutate && team.length > 1 && (
                <div className="target-pick">
                    <h3>Qual criatura será alterada?</h3>
                    <div className="target-row">
                        {team.map((c, i) => (
                            <button
                                key={`${c.id}-${i}`}
                                className={`target-card ${target === i ? 'selected' : ''}`}
                                onClick={() => setTarget(i)}
                            >
                                <strong>#{c.id}</strong>
                                <span className="label">{c.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {isSacrifice && (
                <div className="target-pick">
                    <h3>1) Quem será sacrificado?</h3>
                    <div className="target-row">
                        {team.map((c, i) => (
                            <button
                                key={`${c.id}-${i}`}
                                className={`target-card ${victim === i ? 'selected' : ''}`}
                                onClick={() => setVictim(i)}
                            >
                                <strong>#{c.id}</strong>
                                <span className="label">{c.label}</span>
                            </button>
                        ))}
                    </div>
                    <h3>2) Quem recebe a parte?</h3>
                    <div className="target-row">
                        {team.map((c, i) => (
                            <button
                                key={`${c.id}-${i}`}
                                className={`target-card ${target === i ? 'selected' : ''}`}
                                disabled={i === victim}
                                onClick={() => setTarget(i)}
                            >
                                <strong>#{c.id}</strong>
                                <span className="label">{c.label}</span>
                                {i === victim && <span className="muted">— sacrificado</span>}
                            </button>
                        ))}
                    </div>
                    <h3>3) Qual eixo transferir?</h3>
                    <div className="target-row">
                        {AXES.map((ax) => (
                            <button
                                key={ax}
                                className={`target-card ${sacAxis === ax ? 'selected' : ''}`}
                                onClick={() => setSacAxis(ax)}
                            >
                                <strong>{ax}</strong>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {preview && alvoDefinido && sacrificioDefinido && (
                <div className="preview">
                    <h3>Prévia antes de confirmar</h3>
                    <p>
                        BP {bpBefore} → <b>{bpAfter}</b> · HP {preview.hpTotalBefore} → <b>{preview.hpTotalAfter}</b> · ATK{' '}
                        {preview.atkTotalBefore} → <b>{preview.atkTotalAfter}</b> · DEF {preview.defTotalBefore} →{' '}
                        <b>{preview.defTotalAfter}</b> · SPD {preview.spdTotalBefore} → <b>{preview.spdTotalAfter}</b>
                    </p>
                    {preview.effectsRemoved.length > 0 && (
                        <p className="fx removed">− {preview.effectsRemoved.map((fx) => fx.name).join(', ')} removido(s)</p>
                    )}
                    {preview.effectsAdded.map((fx) => (
                        <p key={fx.id} className={`fx ${fx.kind}`}>
                            + {fx.name}: {fx.desc}
                        </p>
                    ))}
                    <div className="actions">
                        <button onClick={confirm}>Aplicar e ir para a batalha</button>
                        <button
                            onClick={() => {
                                setSelected(null);
                                setTarget(null);
                                setVictim(null);
                                setSacAxis(null);
                            }}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}
            <button className="battle-btn ghost" onClick={toBattle}>
                Pular escolha e ir para a batalha
            </button>
        </section>
    );
}
