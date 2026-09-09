import { useMemo, useState } from 'react';
import { previewOffer, teamPower, withTarget } from '@jogo/engine';
import type { Offer } from '@jogo/engine';
import { useGame } from '../store';

export default function OfferPanel() {
    const offers = useGame((s) => s.offers);
    const team = useGame((s) => s.team);
    const stage = useGame((s) => s.stage);
    const chooseOffer = useGame((s) => s.chooseOffer);
    const toBattle = useGame((s) => s.toBattle);

    const [selected, setSelected] = useState<Offer | null>(null);
    const [target, setTarget] = useState<number | null>(null);

    const precisaAlvo = selected?.kind === 'MUTAR';
    const alvoDefinido = precisaAlvo ? target !== null : true;

    const preview = useMemo(() => {
        if (!selected) return null;
        const resolved = precisaAlvo ? withTarget(selected, target ?? 0) : selected;
        return previewOffer(team, resolved);
    }, [selected, target, team, precisaAlvo]);

    const bpBefore = teamPower(team);
    const bpAfter = preview ? teamPower(preview.teamAfter) : null;

    function selectOffer(offer: Offer) {
        setSelected(offer);
        setTarget(offer.kind === 'MUTAR' && team.length === 1 ? 0 : null);
    }

    function confirm() {
        if (!selected || !alvoDefinido) return;
        const t = target ?? 0;
        setSelected(null);
        setTarget(null);
        chooseOffer(selected, t); // aplica e avança para o Scouting
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
                        <strong>{offer.kind === 'MUTAR' ? '🧬 MUTAR' : '➕ CRIAR'}</strong>
                        {offer.kind === 'MUTAR' && <span>{offer.axis}: {String(offer.partId)}</span>}
                        {offer.kind === 'CRIAR' && (
                            <span className="recipe-preview">
                                {offer.recipe.core} · {offer.recipe.body} · {offer.recipe.instinct} · {offer.recipe.origin}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {precisaAlvo && team.length > 1 && (
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

            {preview && alvoDefinido && (
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