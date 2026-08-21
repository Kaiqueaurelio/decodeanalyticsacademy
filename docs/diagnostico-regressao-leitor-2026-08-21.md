# Diagnóstico de regressão do leitor — 21/08/2026

## Evidências do Vercel

O deployment `dpl_DRG5wK7qX1F3UW4vbGekMJ7sqpKj`, associado ao commit `6794753ab3789aecd74a360102fc9d6b1fe4c1b8`, foi cancelado com `readyState: CANCELED`. O campo `errorLink` aponta para a documentação de commits verificados do Vercel: https://vercel.com/docs/project-configuration/git-settings#verified-commits. O commit foi identificado pelo GitHub como autor `Kaiqueaurelio`, com e-mail `decoanalytics@outlook.com.br`, mas sem assinatura criptográfica (`verification.reason: unsigned`).

O projeto Vercel consultado foi `decodeanalyticsacademy`, ID `prj_IHMPtZYFNAwnEU5Hn4Pj2P9yEGd2`, equipe `team_LnkDNL4ePqO2htyZHAaWSqPT`.

Foi criada uma prévia assíncrona pelo projeto Git existente, deployment `dpl_H9Gi2Q8XyTJTGkXHR6bQSMoMqy5Y`, URL https://decodeanalyticsacademy-ciuuh5vnb-decode-analytics-s-projects.vercel.app. No primeiro polling, o estado era `BUILDING`. A prévia foi criada a partir de um commit mais novo do Lovable, `024d9eb09406c15c6ed9ae89d2c9ff124f28d966`.

## Evidências do GitHub

Comparação realizada entre `6794753ab3789aecd74a360102fc9d6b1fe4c1b8` e `024d9eb09406c15c6ed9ae89d2c9ff124f28d966`:
https://github.com/Kaiqueaurelio/decodeanalyticsacademy/compare/6794753ab3789aecd74a360102fc9d6b1fe4c1b8...024d9eb09406c15c6ed9ae89d2c9ff124f28d966

O branch remoto avançou por dois commits do Lovable: `9b31e61cc6a408f3d7dcc3312db553325a3da5d0` e `024d9eb09406c15c6ed9ae89d2c9ff124f28d966`. A comparação confirmou que o commit mais novo do Lovable alterou ao menos `src/pages/ApostilaPage.tsx`, portanto ele deve ser inspecionado antes de qualquer restauração.

O working tree local estava limpo em `6794753a`, com a correção do sumário (`open = false`) e a versão de caches PWA `v5` já presentes.

## Restrição de assinatura

Não havia chave de assinatura GPG/SSH disponível. Foi gerada uma chave SSH exclusiva de assinatura local, fingerprint `SHA256:3mn5NR6+x8zHganLtqVPvyB17RYm947nPHhGrkR03Ks`, mas o token GitHub recusou o cadastro via API com HTTP 403 (`Resource not accessible by integration`). A chave não foi usada para autenticação de repositório.
