# Backgrounds checked against Dittobase (10 Nov 2026)

Every background in her `went` list, checked against Dittobase’s page for it. Those pages list both the Pokémon caught with the background and the ones that keep it when evolved. Anything surprising was checked again on Leek Duck and Serebii. Full detail, with our ids, is in `data/background-dittobase-check.json`. Nothing has been changed in `data/` yet.

## Suggested changes (Pokémon caught with the background)

**Wrong Pokémon or wrong look (swap):**
- **Madrid 2024:** add Pheromosa `795`, remove Stakataka `805`. Stakataka comes only from Serebii’s background list. Serebii’s own raid list, Leek Duck and the official raid list all have Pheromosa there, not Stakataka.
- **Pokémon Horizons 2026:** Charmander → `4-goggles-2026`, Charizard → `6-goggles-2026`, Pikachu → `25-horizons` (Captain’s Hat). Backed by Dittobase and Serebii.
- **Pokopia:** Ditto → `132-spring-2026-a` and `132-spring-2026-b` (cap and hat). Backed by Dittobase and Serebii.
- **Concierge:** Psyduck → `54-swim-2025` (Swim Ring). Backed by Dittobase and Serebii.
- **GO Wild Area 2025 Global:** Bewear → `760-wildarea-2025` (Wilderness Cape). Backed by Dittobase and Serebii.
- **GO Wild Area 2026:** Machamp → `68-wildarea-2026-01` (Modern Jacket). Backed by Dittobase and Serebii.
- **Delightful Days:** Lapras → `131-costume-2020` (scarf, from the Water Festival). Backed by Dittobase and Serebii.
- **GO Wild Area 2024 Global (sb-gowa-fukuoka):** Dialga → `483-origin`, Palkia → `484-origin`, add Toxtricity Low Key `849-low-key`. Backed by Dittobase and Leek Duck.
- **GO Fest 2024 Wormhole Sun:** Necrozma → `800-dusk-mane`. Our own note already says this.

**Missing (add):**
- **GO Tour 2026 X:** Xerneas `716`, Honedge `679`, Pikachu `25-gotour-2026-c` and `25-gotour-2026-c-02`. Dittobase and Serebii both list these; our list has only the Kalos starters.
- **GO Fest 2026 Global:** the species are all there, but the entry needs a `cards` list to show the raid forms: `483-origin`, `484-origin`, `487-origin`, `641-therian`, `642-therian`, `645-therian`, `905-therian`, `386-attack`, `386-defense`, `386-speed`, `649-burn`, `649-chill`, `649-douse`, plus `649-shock`. Shock is on Leek Duck’s raid list but not on Dittobase.
- **Community Days 2026:** Alolan Vulpix `37-alolan` (Serebii too).
- **Tales of Transformation:** Flabébé `669-red`, `669-yellow`, `669-orange`, `669-white`.
- **December 2024 Recap:** Galarian Ponyta `77-galarian` (Leek Duck and Serebii too).
- **GO Fest 2025 Dark Skies:** Toxtricity Low Key `849-low-key` (Dynamax).
- **Team Leader Yellow:** party-hat Bulbasaur, Charmander and Squirtle (`1-jan-2020-noevolve`, `4-jan-2020-noevolve`, `7-jan-2020-noevolve`), from Ultra Unlock: 10th Anniversary.

**Decide (Jemma):**
- **Paris 2025:** the same card was also given at a separate event, the Pokémon Méga Évolution Paris Event (13–14 Sep 2025): Charmander `4`, with Charmeleon `5` and Charizard `6` by evolving. Add these only if she went in September.

## Kept by evolving (if we show those)

Dittobase lists many Pokémon that keep the background when evolved. None of them are in our lists. The main ones:
- **LEGO:** Raichu `26`. **Copenhagen:** Rapidash `78-spring-2023-valor` (already in).
- **Madrid:** Dawn Wings `800-dawn-wings` and Dusk Mane `800-dusk-mane` by fusing. These are doubtful: for GO Fest 2024, Leek Duck says a fused Necrozma gets its own variant of the background. The same doubt applies to the Wormhole and GO Wild Area 2025 fusions.
- **Paris:** Crowned Sword Zacian and Crowned Shield Zamazenta (no entries of their own in our dex).
- **Tour Kalos X/Y and Mega:** the starters’ evolutions (`651` `652` `654` `655` `657` `658`), plus Doublade `680` and Aegislash `681-shield` (X/Y only).
- **Black/White:** the Pokémon Day starters’ evolutions, and Black and White Kyurem `646-black` / `646-white` by fusing.
- **Community Days and the season backgrounds:** every featured Pokémon’s evolutions, including all eight Eeveelutions on Delightful Days.
- **Dark Skies:** 26 evolved Dynamax ones.
- **Team Leader Yellow:** Electabuzz `125-spring-2023-instinct`, Electivire `466-spring-2023-instinct`, Muk `89-anniversary-2024` and the starters’ evolutions.

## Matches (nothing to do)

London 2023; Copenhagen 2026 (re-confirmed: 9 cards, Shadow Moltres, Entei, Kyogre and Groudon, Rapidash by evolving); GO Fest 2026 Mewtwo; Tour Diamond, Pearl, Ruby, Sapphire, Gold (Shadow Ho-Oh) and Silver (Shadow Lugia); Mega (all 54); Y (all caught ones); Black/White, Black and White (all caught ones); GO Fest 2025 (all six Regis; Dittobase now has Regigigas too); 9th Anniversary; Zacian; Zamazenta; Radiance; Wormhole; Might and Mastery; Dual Destiny.

## Notes

- Our Dark Skies list has 23 Power Spot extras that come from Serebii only. Dittobase doesn’t list them; they stay, as Jemma asked.
- Team Leader Red and Blue: Dittobase also lists the Ultra Unlock: 10th Anniversary rewards under every leader. Those rewards follow the player’s team, and Jemma is Instinct, so they aren’t suggested.
- Dittobase has no page for 10th Anniversary Celebration (Mewtwo) or 10th Anniversary (Gimmighoul coin), so those two weren’t checked.
- Shadow, Dynamax and Gigantamax are boxes on an entry, not separate ids. The JSON lists which ones each background has.
