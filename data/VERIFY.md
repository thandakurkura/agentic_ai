# StyleScent Data Quality & Verification Audit

Generated: 2026-11-11T06:39:18.817Z
Total Fragrances: **20**
Verified Entries: **0 / 20 (0.0%)**

## 1. Coverage Distributions

### By Olfactory Family
| Family | Count |
|---|---|
| woody | 10 |
| floral | 1 |
| citrus | 0 |
| fresh | 2 |
| oriental | 4 |
| gourmand | 1 |
| aromatic | 1 |
| fruity | 1 |

### By Season
| Season | Count |
|---|---|
| spring | 8 |
| summer | 5 |
| autumn | 17 |
| winter | 16 |

### By Occasion
| Occasion | Count |
|---|---|
| college_fest | 0 |
| office | 9 |
| date_night | 14 |
| wedding | 11 |
| casual | 10 |
| interview | 1 |
| party | 13 |
| festival_traditional | 0 |

### By Price Band
| Price Band | Count |
|---|---|
| budget | 0 |
| mid | 6 |
| premium | 14 |
| null | 0 |

### By Projection
| Projection | Count |
|---|---|
| soft | 1 |
| moderate | 5 |
| strong | 8 |
| null | 6 |

### By Target Demographic
| Demographic | Count |
|---|---|
| men | 18 |
| unisex | 2 |
| women | 0 |

## 2. Audit Warnings

- ⚠️ Season "summer" has only 5 fragrances (threshold: 6).
- ⚠️ Occasion "college_fest" has only 0 fragrances (threshold: 6).
- ⚠️ Occasion "interview" has only 1 fragrances (threshold: 6).
- ⚠️ Occasion "festival_traditional" has only 0 fragrances (threshold: 6).
- ⚠️ Price band "budget" has only 0 fragrances (threshold: 8).
- ⚠️ Price band "mid" has only 6 fragrances (threshold: 8).
- ⚠️ 6 entries have null projection: Dior Homme Intense, XJ 1861 Naxos, Imagination, Dior Homme Parfum, MYSLF Eau de Parfum, Gentleman Réserve Privée
- ⚠️ 2 entries have null longevity: MYSLF Eau de Parfum, Gentleman Réserve Privée
- ⚠️ 6 entries have "low" confidence: Dior Homme Intense, XJ 1861 Naxos, Imagination, Dior Homme Parfum, MYSLF Eau de Parfum, Gentleman Réserve Privée
- ⚠️ Demo coverage check: only 0 fragrance(s) match college_fest + autumn/winter + evening/night without vanilla/musk (threshold: 3).

## 3. Demo Coverage Check

> Criteria: Occasion = `college_fest` AND Season ∈ {`autumn`, `winter`} AND Time ∈ {`evening`, `night`} AND Notes exclude `vanilla` and `musk`.

Matching Fragrances Found: **0**
_None currently match all 4 criteria. Flagged for seed data expansion._

## 4. Unverified Entries Checklist

The following **20** entries require team verification prior to judging demo usage:

| ID | Fragrance Name | Brand | Family | Confidence | Verified |
|---|---|---|---|---|:---:|
| p_001 | Aventus | Creed | fruity | high | [ ] |
| p_002 | Bleu de Chanel Eau de Parfum | Chanel | woody | high | [ ] |
| p_003 | Dior Homme Intense | Dior | woody | low | [ ] |
| p_004 | Sauvage Elixir | Dior | woody | high | [ ] |
| p_005 | XJ 1861 Naxos | Xerjoff | oriental | low | [ ] |
| p_006 | Terre d'Hermès | Hermès | woody | high | [ ] |
| p_007 | Layton | Parfums de Marly | woody | high | [ ] |
| p_008 | Imagination | Louis Vuitton | fresh | low | [ ] |
| p_009 | Spicebomb Extreme | Viktor & Rolf | oriental | high | [ ] |
| p_010 | Le Male Le Parfum | Jean Paul Gaultier | oriental | high | [ ] |
| p_011 | Althaïr | Parfums de Marly | gourmand | high | [ ] |
| p_012 | La Nuit de L'Homme | Yves Saint Laurent | woody | high | [ ] |
| p_013 | Dior Homme Parfum | Dior | woody | low | [ ] |
| p_014 | Angels' Share | By Kilian | oriental | high | [ ] |
| p_015 | Bleu de Chanel Parfum | Chanel | woody | high | [ ] |
| p_016 | Green Irish Tweed | Creed | fresh | high | [ ] |
| p_017 | Viking | Creed | aromatic | high | [ ] |
| p_018 | Royal Oud | Creed | woody | high | [ ] |
| p_019 | MYSLF Eau de Parfum | Yves Saint Laurent | floral | low | [ ] |
| p_020 | Gentleman Réserve Privée | Givenchy | woody | low | [ ] |
