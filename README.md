# Jogo — Roguelite de Criaturas Determinísticas (F0)

Protótipo F0 conforme o **GDD v0.4.1**. Objetivo: responder
*"o sistema produz decisões interessantes?"* — com quadrados coloridos,
sem arte, sem servidor, nada persiste entre runs.

## Comandos

- Instalar tudo (raiz): `npm install`
- Rodar o jogo (dev): `npm run dev`  → http://localhost:5173
- Rodar os testes do motor: `npm test`

## Estrutura

- `packages/engine` — lógica pura em TypeScript (sinergias, batalha, ofertas).
  NUNCA importa React/DOM. Testável com Vitest, roda igual no cliente e no servidor.
- `apps/game` — SPA Vite + React + Zustand. Só UI e estado; toda regra vem do engine.

## Regras do F0 (GDD v0.4.1)

- 3×3×3×3 = 81 receitas suportadas pelo motor (sem instanciar manualmente).
- Ofertas no F0: MUTAR e CRIAR (CRIAR transparente: mostra a receita completa).
- Sinergia é automática e declarativa (tabela de dados). Sem botão "combinar".
- Batalha determinística (mesmo estado → mesmo resultado), ordem por VELOCIDADE.
- Sem raridade, sem type chart, sem persistência entre runs.
- UI em pt-BR; palavra "sinergia" não aparece para o jogador.

## TODOs (fora do F0 — não implementar agora)

- [ ] Nome procedural + card social (F2)
- [ ] Persistência de dano/HP entre batalhas da mesma run (F1)
- [ ] SACRIFICAR (F1) · Fundir/Travar/Mutação (F2)
- [ ] Redenção de sinergias negativas (F2)
- [ ] Tema/lore, arte, Supabase, Next.js (F3)