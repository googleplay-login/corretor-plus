# CORRETOR+ — Painel do Corretor de Planos de Saúde

Protótipo funcional (gratuito, roda localmente) para **corretor individual**. Foco nas dores reais: comissões/estorno, cotação multi-operadora, carteira/renovações, leads, proposta e base ANS.

## Como acessar
Abra o **preview ao vivo** (aba da porta 5173). No login, **qualquer e-mail/senha** funciona (é uma demo).

## O que já funciona
| Módulo | Recursos |
|---|---|
| **Login** | Cadastro/entrada (demo); dados persistidos no navegador (localStorage) |
| **Dashboard** | KPIs de comissões, clientes/vidas, meta; alertas ("precisa da sua atenção"); gráfico de 12 meses; renovações ≤90d |
| **Clientes** | CRUD completo + beneficiários (idade/f aixa automática) + contratos + comissões + CSV |
| **Leads** | Kanban com arrastar-e-soltar (Novo→Ganho), follow-up com badge vermelho, converter em cliente |
| **Cotar** | Calcula mensalidade somando pelas **10 faixas etárias da ANS**; comparativo 2-3 planos; badge "Recomendado"; gera proposta |
| **Renovações** | Contagem regressiva, reajuste negociado, aviso prévio, status |
| **Comissões** | Calculadora, simulação de **estorno** (75%→15%), alerta de glosa, CSV |
| **Financeiro** | Previsto/pago/atraso/glosado, metas mensais, por operadora |
| **Base ANS** | Artigos + tabela de prazos pesquisável + "como explicar pro cliente" |
| **Propostas** | Prévia, imprimir/PDF, link público (simulado), status |

## Como foi feito
- React + Vite. Sem backend: os dados ficam no `localStorage` (ideal para validar/uso pessoal).
- Dados de exemplo já populados (operadoras, planos, preços por faixa, clientes, leads, comissões).

## Limitações desta versão
- Persistência local (não sincroniza entre dispositivos).
- Valores de planos são **indicativos** — confirme no contrato da operadora.
- Link de proposta e envio de e-mail são simulados (não há API real).

## Para virar produção (de graça)
1. **Supabase** (gratuito): banco + login real.
2. Migrar o `store.jsx` de `localStorage` para chamadas Supabase/Postgres.
3. Publicar na **Vercel** com domínio `*.vercel.app`.

## Rodar localmente
```
cd corretor-mais
npm install
npm run dev   # abre em http://localhost:5173
```
