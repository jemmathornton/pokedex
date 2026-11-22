# What Pokémon HOME tracks (for a HOME tracker)

Research for the HOME side of the Pokédex. Every source was read on **22 Nov 2026** (links at the bottom). Bulbapedia refuses automated reading, so anything from it is from **search snippets only** and says so. “Inferred” marks my own reasoning. The lists are also in `data/home-facts.json`.

**Corrections to what we knew:**
- The Shiny boxes aren’t separate pages: Serebii’s depositable page has a “Standard Boxes | Shiny Boxes” switch ([depositable][s-dep]).
- Seven of the eight cap Pikachu are marked “(Not Available)”. **Partner Cap is shown as shiny-obtainable** (doubtful, see 4).
- The rest held: #0001 to #1025 ([depositable][s-dep]); Victini and Battle Bond Greninja are “(Not Available)”; the gender rule matches Bulbapedia ([Pokédex (HOME)][b-dex], snippet).

## 1. Gigantamax

- **HOME keeps the Gigantamax Factor.** Official: “Yes, Pokémon HOME will recognize a Pokémon’s Gigantamax Factor” ([Pokémon Support][o-gmax]).
  - HOME also blocks Gigantamax Factor Pikachu, Eevee and Meowth from Brilliant Diamond & Shining Pearl, and Pikachu and Eevee from Legends: Arceus ([Serebii transfer][s-tr]). Bulbapedia adds Duraludon (from v3.2.1) and lists Scarlet & Violet and Legends: Z-A as blocked too ([Pokémon HOME][b-home], snippet). The sources differ on which games: **unsure**.
- **Whether HOME shows the Factor on screen: unsure.** A community answer says HOME’s status screen shows a Gigantamax icon. It’s untested and unofficial ([PokéBase][pb-gmax]).
- **Pokédex entries:** yes. Official: “Pokémon that can Mega Evolve or Gigantamax will have those forms be registered, too!” ([HOME features][o-feat]).
  - How: deposit the Pokémon **with** the Gigantamax Factor. Serebii: “Gigantamax variants will only appear if you have the Gigantamax variant” ([National Pokédex][s-dex]). Bulbapedia says the same ([Pokédex (HOME)][b-dex], snippet).
- **From Pokémon GO:** “Gigantamax Pokémon are not able to be sent to Pokémon HOME” ([GO Help: Max Pokémon][go-max]). The only Gigantamax Melmetal is the special gift for a first GO-to-HOME transfer. Max Soup can’t give it to any other Melmetal ([Pokémon Support][o-melm]).
- **The list (34 entries, 32 species).** This is Serebii’s “Gigantamax Capable” box in its categorised HOME list ([categorised][s-cat]):
  - 0003 Venusaur, 0006 Charizard, 0009 Blastoise, 0012 Butterfree, 0025 Pikachu, 0052 Meowth, 0068 Machamp, 0094 Gengar, 0099 Kingler, 0131 Lapras, 0133 Eevee, 0143 Snorlax, 0569 Garbodor, 0809 Melmetal
  - 0812 Rillaboom, 0815 Cinderace, 0818 Inteleon, 0823 Corviknight, 0826 Orbeetle, 0834 Drednaw, 0839 Coalossal, 0841 Flapple, 0842 Appletun, 0844 Sandaconda
  - 0849 Toxtricity (default form), 0849 Toxtricity (Low Key Form), 0851 Centiskorch, 0858 Hatterene, 0861 Grimmsnarl, 0869 Alcremie, 0879 Copperajah, 0884 Duraludon
  - 0892 Urshifu (default form), 0892 Urshifu (Rapid Strike Style)
- **Toxtricity:** both forms share one Gigantamax look. Serebii’s Gigantamax page has one Toxtricity row and two Urshifu rows, so 33 forms ([Gigantamax][s-gmax]; [Low Key][b-lowkey], snippet).
  - Whether HOME’s Pokédex has one Gigantamax Toxtricity entry or two: **unsure**.
- **Alcremie:** one Gigantamax for every cream and sweet ([categorised][s-cat]).
- **Shiny Gigantamax:** Serebii’s shiny Gigantamax box leaves **Melmetal and both Urshifu** blank. The rest show as shiny-obtainable ([categorised][s-cat]).

## 2. Dynamax

- **No Dynamax entries in HOME’s Pokédex.** Serebii’s features page says the Pokédex “includes every single form including Mega Evolution and Dynamax” ([features][s-feat]).
  - Inferred: “Dynamax” there means the Gigantamax forms. Plain Dynamax isn’t a form, and no source lists Dynamax entries.
- **Dynamax Level** (0–10) belongs to each Pokémon, not to the Pokédex.
  - HOME never rewrites Pokémon data. Official: HOME “only changes the displayed information and does not overwrite Pokémon data” ([Pokémon Support][o-display]).
  - Whether HOME shows the Dynamax Level: **unsure**. No official source found.
- **From GO:** “Only Dynamax Pokémon can be sent to Pokémon HOME”, and they “will not retain their Max Moves” ([GO Help: Max Pokémon][go-max]). Bulbapedia: no Dynamax information from GO is kept, and every Pokémon arrives at Dynamax Level 0 ([GO Transporter][b-got], snippet).
- **For a tracker** (inferred): Dynamax isn’t a yes/no thing in HOME. GO’s Dynamax-ness is lost on transfer, and Dynamax Level is a 0–10 number on each Pokémon. Leave “Dynamax” as a GO-only box. The HOME equivalent is the Gigantamax entries (section 1).

## 3. Mega and Primal

- **No Mega Evolved Pokémon in HOME’s boxes.** Every Mega form and Primal Kyogre and Groudon are on Serebii’s Undepositable list (“form changes that take place within battle, require a hold item to change, or are combined Pokémon”) ([undepositable][s-non]).
  - Held items (so Mega Stones) go to the Bag when a Pokémon is deposited ([Pokémon Support][o-items]).
  - GO won’t send Mega Evolved Pokémon ([GO Help: sending to HOME][go-home]).
- **HOME’s National Pokédex lists them.** Official: “Pokémon that can Mega Evolve … will have those forms be registered, too!” ([HOME features][o-feat]).
  - Serebii: these forms “can be in the software’s Pokédex”; “they are added when you add the Pokémon itself” ([undepositable][s-non]).
  - Bulbapedia: Mega data is registered when any form of that Pokémon is deposited ([Pokémon HOME][b-home], snippet).
  - Primal Kyogre and Groudon are inferred to work the same way. They’re on the same Serebii list, but no source says so directly.
- **Serebii’s list has 96 Mega entries** (with Primal Kyogre and Groudon besides) ([undepositable][s-non]). Where Serebii repeats a name, the picture names tell them apart: Raichu X and Y, Absol and Absol Z, Garchomp and Garchomp Z, Lucario and Lucario Z, Magearna and Magearna Original Color, and Tatsugiri ×3 (inferred: Curly, Droopy and Stretchy).
  - Bulbapedia’s Mega Evolution Pokédex has 93 ([list][b-megadex], snippet). Inferred: 96 minus the two extra Tatsugiri and Original Color Magearna.
  - Bulbapedia says HOME shows Mega Meowstic as two forms, male and female ([Pokédex (HOME)][b-dex], snippet). Serebii lists one: **unsure**.
- **Legends: Z-A is connected.** HOME 4.0.0 added “Compatibility with Pokémon Legends: Z-A” ([Nintendo version history][n-ver]). Nintendo dates it 1 April 2026; Serebii says it rolled out from 2 April 2026 ([1 April][s-n0104], [2 April][s-n0204]). The link is Switch only ([HOME: move][o-move]).
- **What it changed for Megas:**
  - **New game Pokédexes:** Lumiose, Hyperspace and a **Mega Evolution Pokédex**, filled with Pokémon from the game ([Serebii, 2 April 2026][s-n0204]).
    - Bulbapedia: a Mega Evolution Pokédex entry also needs the linked Z-A save to have that Mega Stone ([Pokédex (HOME)][b-dex], snippet; **unsure** on the details).
  - **The Z-A Megas** (base game and Mega Dimension) are now on Serebii’s Undepositable list, so HOME’s National Pokédex has them (inferred from that page) ([undepositable][s-non]).
  - **A new Mega Magearna variant:** put Original Color Magearna into Z-A and you can get it. It “has its own Pokédex entry” ([Serebii, 2 April 2026][s-n0204]).
  - **Rewards:** a HOME challenge “Fill in your Mega Evolution Pokédex in Pokémon Legends: Z-A!” ([challenges][s-chal]). Completing the Lumiose, Hyperspace and Mega Evolution Pokédexes with Z-A Pokémon gives a **shiny Volcanion** ([Serebii, 27 April 2026][s-n2704]).
  - Megas still can’t be kept in boxes.

## 4. Shiny: what can’t be shiny in HOME

Serebii’s Shiny Boxes hold the same 1,391 entries as the Standard Boxes. **39 are blank “(Not Available)”**, across 29 species ([depositable][s-dep]). Serebii: “if a Pokémon doesn’t display, it currently cannot be obtained as Shiny.” Serebii updated the list for HOME 4.0.0 ([2 April 2026][s-n0204]). The categorised list has the same 39 ([categorised][s-cat]).

| No. | Pokémon | Form (Serebii’s name; — = default form) |
|---|---|---|
| 0025 | Pikachu | Original Cap |
| 0025 | Pikachu | Hoenn Cap |
| 0025 | Pikachu | Sinnoh Cap |
| 0025 | Pikachu | Unova Cap |
| 0025 | Pikachu | Kalos Cap |
| 0025 | Pikachu | Alola Cap |
| 0025 | Pikachu | World Cap |
| 0494 | Victini | — |
| 0658 | Greninja | Battle Bond |
| 0666 | Vivillon | Poké Ball Pattern |
| 0670 | Floette | Eternal Flower |
| 0720 | Hoopa | — |
| 0720 | Hoopa | Hoopa Unbound |
| 0789 | Cosmog | — |
| 0790 | Cosmoem | — |
| 0801 | Magearna | — |
| 0801 | Magearna | Original Color |
| 0802 | Marshadow | — |
| 0891 | Kubfu | — |
| 0892 | Urshifu | — |
| 0892 | Urshifu | Rapid Strike Style |
| 0893 | Zarude | — |
| 0893 | Zarude | Dada |
| 0896 | Glastrier | — |
| 0897 | Spectrier | — |
| 0898 | Calyrex | — |
| 0901 | Ursaluna | Blood Moon Form |
| 1009 | Walking Wake | — |
| 1010 | Iron Leaves | — |
| 1014 | Okidogi | — |
| 1015 | Munkidori | — |
| 1016 | Fezandipiti | — |
| 1017 | Ogerpon | — |
| 1020 | Gouging Fire | — |
| 1021 | Raging Bolt | — |
| 1022 | Iron Boulder | — |
| 1023 | Iron Crown | — |
| 1024 | Terapagos | — |
| 1025 | Pecharunt | — |

- **No shiny at all for 24 species:** Victini, Hoopa, Cosmog, Cosmoem, Magearna, Marshadow, Kubfu, Urshifu, Zarude, Glastrier, Spectrier, Calyrex, Walking Wake, Iron Leaves, Okidogi, Munkidori, Fezandipiti, Ogerpon, Gouging Fire, Raging Bolt, Iron Boulder, Iron Crown, Terapagos and Pecharunt.
- **Only some forms blank:** Pikachu (7 caps), Greninja (Battle Bond), Vivillon (Poké Ball), Floette (Eternal Flower), Ursaluna (Blood Moon).
- **Gigantamax Capable, 3 more blanks:** 0809 Melmetal and 0892 Urshifu (both styles) ([categorised][s-cat]).
- **Doubts, where Serebii shows a shiny that may not exist (unsure):**
  - **0772 Type: Null.** Serebii’s own Sword & Shield page says Type: Null can’t be given as Shiny there ([SwSh shiny][s-swsh-shiny]). Its event database has no shiny Type: Null, only shiny Silvally ([events 772][s-ev772]).
  - **0025 Pikachu, Partner Cap.** Every other cap is blank. I found no shiny Partner Cap event ([events 025][s-ev025]; [Dittobase][dittobase]).
- **Checked against other sources and consistent:** shiny Volcanion came from HOME in April 2026 ([27 April][s-n2704]). Serebii’s event database has shiny events for Zygarde, Poipole, Eternatus and Koraidon ([718][s-ev718], [803][s-ev803], [890][s-ev890], [1007][s-ev1007]).

## 5. Forms

Serebii’s Standard Boxes: **1,391 entries for 1,025 species**. **196 species have more than one entry (562 entries)** ([depositable][s-dep]).
- The categorised list adds 34 “Gigantamax Capable” entries (1,425) ([categorised][s-cat]).
- HOME itself counts forms. Its challenges include “Register 10 forms of Furfrou”, “Register 6 forms of Rotom” and “Register Alcremie’s Forms” ([challenges][s-chal]).

The default form is the species’ plain name (inferred from the pictures: Vivillon Meadow, Minior Red Core, Furfrou Natural, Basculin Red-Striped, Urshifu Single Strike, Toxtricity Amped, Paldean Tauros Combat Breed). Names below are Serebii’s with the species name taken off. A species can be in more than one group (Rattata: Alolan and Female).

**Regional forms (55)**
- **Alolan** (18): 0019 Rattata, 0020 Raticate, 0026 Raichu, 0027 Sandshrew, 0028 Sandslash, 0037 Vulpix, 0038 Ninetales, 0050 Diglett, 0051 Dugtrio, 0052 Meowth, 0053 Persian, 0074 Geodude, 0075 Graveler, 0076 Golem, 0088 Grimer, 0089 Muk, 0103 Exeggutor, 0105 Marowak
- **Galarian** (19): 0052 Meowth, 0077 Ponyta, 0078 Rapidash, 0079 Slowpoke, 0080 Slowbro, 0083 Farfetch’d, 0110 Weezing, 0122 Mr. Mime, 0144 Articuno, 0145 Zapdos, 0146 Moltres, 0199 Slowking, 0222 Corsola, 0263 Zigzagoon, 0264 Linoone, 0554 Darumaka, 0555 Darmanitan, 0562 Yamask, 0618 Stunfisk
- **Hisuian** (16): 0058 Growlithe, 0059 Arcanine, 0100 Voltorb, 0101 Electrode, 0157 Typhlosion, 0211 Qwilfish, 0215 Sneasel (also Hisuian female), 0503 Samurott, 0549 Lilligant, 0570 Zorua, 0571 Zoroark, 0628 Braviary, 0705 Sliggoo, 0706 Goodra, 0713 Avalugg, 0724 Decidueye
- **Paldean** (2): 0128 Tauros, 0194 Wooper

**Female entries (102 species):** see section 6.

**Other forms (number of entries in brackets, default first and not named)**
- 0025 Pikachu (10): Original Cap, Hoenn Cap, Sinnoh Cap, Unova Cap, Kalos Cap, Alola Cap, Partner Cap, World Cap (+ Female)
- 0128 Tauros (4): Blaze Breed, Aqua Breed (+ Paldean)
- 0201 Unown (28): B to Z, !, ?
- 0386 Deoxys (4): Attack Forme, Defense Forme, Speed Forme
- 0412 Burmy (3) and 0413 Wormadam (3): Sandy Cloak, Trash Cloak
- 0422 Shellos (2) and 0423 Gastrodon (2): East Sea
- 0479 Rotom (6): Heat Rotom, Wash Rotom, Frost Rotom, Fan Rotom, Mow Rotom
- 0492 Shaymin (2): Sky Forme
- 0550 Basculin (3): Blue-Striped Form, White-Striped Form
- 0585 Deerling (4) and 0586 Sawsbuck (4): Summer Form, Autumn Form, Winter Form
- 0641 Tornadus, 0642 Thundurus, 0645 Landorus, 0905 Enamorus (2 each): Therian Forme
- 0647 Keldeo (2): Resolute Form
- 0658 Greninja (2): Battle Bond
- 0666 Vivillon (20): Polar, Tundra, Continental, Garden, Elegant, Icy Snow, Modern, Marine, Archipelago, High Plains, Sandstorm, River, Monsoon, Savanna, Sun, Ocean, Jungle, Fancy, Poké Ball Pattern
- 0669 Flabébé (5), 0671 Florges (5): Yellow, Orange, Blue, White Flower; 0670 Floette (6): the same + Eternal Flower
- 0676 Furfrou (10): Heart, Star, Diamond, Deputante, Matron, Dandy, La Reine, Kabuki, Pharaoh Trim
- 0710 Pumpkaboo (4) and 0711 Gourgeist (4): Small Size, Large Size, Super Size
- 0718 Zygarde (4): 10% Forme, and “Zygarde Power Construct” twice (pictures: the 10% and the 50% Forme)
- 0720 Hoopa (2): Hoopa Unbound
- 0741 Oricorio (4): Pom-pom Style, P’au Style, Sensu Style
- 0744 Rockruff (2): Own Tempo
- 0745 Lycanroc (3): Midnight Form, Dusk Form
- 0774 Minior (7): Orange, Yellow, Green, Blue, Indigo, Violet Core
- 0801 Magearna (2): Original Color
- 0849 Toxtricity (2): Low Key Form
- 0854 Sinistea (2) and 0855 Polteageist (2): Authentic Form
- 0869 Alcremie (63): 9 creams (Vanilla Cream, Ruby Cream, Matcha Cream, Mint Cream, Lemon Cream, Salted Cream, Ruby Swirl, Caramel Swirl, Rainbow Swirl) × 7 sweets (Strawberry, Berry, Love, Star, Clover, Flower, Ribbon). Serebii’s text names only the cream; the sweets are from its picture names (inferred).
- 0892 Urshifu (2): Rapid Strike Style
- 0893 Zarude (2): Dada
- 0901 Ursaluna (2): Blood Moon Form
- 0925 Maushold (2): Family of Four
- 0931 Squawkabilly (4): Blue, Yellow, White Plumage
- 0978 Tatsugiri (3): Droopy Form, Stretchy Form
- 0982 Dudunsparce (2): Three-Segment Form
- 0999 Gimmighoul (2): Roaming Form
- 1012 Poltchageist (2): Artisan Form; 1013 Sinistcha (2): Masterpiece Form

**Look-alikes.** Serebii lists six entries with the same picture as the default: Battle Bond Greninja, Power Construct Zygarde ×2, Own Tempo Rockruff, Artisan Poltchageist and Masterpiece Sinistcha. Whether HOME’s Pokédex has separate entries for them: **unsure**.

**Not separate on Serebii’s list:** Let’s Go’s partner Pikachu and Eevee (whether HOME’s Pokédex shows them separately: **unsure**), and Ogerpon’s masks (Ogerpon appears once). Ogerpon’s other masks are on the Undepositable list.

**Forms HOME can’t keep: Serebii’s Undepositable list, 173** ([undepositable][s-non]).
- 96 Mega, plus Primal Kyogre and Groudon (section 3).
- Castform (Sunny, Rainy, Snowy Form) and Cherrim (Sunshine Form).
- Dialga, Palkia and Giratina (Origin Forme).
- Arceus ×18 (17 types + Legend Plate) and Silvally ×17 types.
- Darmanitan (Zen Mode, Galarian Zen Mode).
- Kyurem (Black, White) and Meloetta (Pirouette Forme).
- Genesect (Burn, Chill, Douse, Shock Drive) and Ash-Greninja.
- Aegislash (Blade Forme), Xerneas (Active Mode) and Zygarde (Complete Forme).
- Wishiwashi (School Form) and Mimikyu (Busted Form).
- Necrozma (Dusk Mane, Dawn Wings) and Ultra Necrozma.
- Cramorant (Gulping, Gorging Form), Eiscue (Noice Face) and Morpeko (Hangry Mode).
- Zacian (Crowned Sword), Zamazenta (Crowned Shield) and Eternatus (Eternamax).
- Calyrex (Ice Rider, Shadow Rider) and Palafin (Hero Form).
- Ogerpon (Hearthflame, Wellspring, Cornerstone Mask) and Terapagos (Terastal, Stellar Form).
- Serebii says these forms can still be in HOME’s Pokédex.
- GO agrees for some: Origin Giratina becomes Altered, Sunshine Cherrim becomes Overcast, and weather Castform becomes normal ([GO Help: sending to HOME][go-home]).

## 6. Gender

- **Separate entries only where they look different** (inferred from Serebii’s list).
  - Serebii lists a female entry for **102 species (103 entries, counting Hisuian Sneasel’s)**. The categorised list puts them in “Gender Variance” boxes, apart from Meowstic, Indeedee, Basculegion and Oinkologne, whose female is a form ([depositable][s-dep], [categorised][s-cat]).
  - Every other species has one entry for both genders.
- **Registering:** depositing a Pokémon with a gender difference registers both genders. A shiny one registers the shiny entry for its own gender only ([Pokédex (HOME)][b-dex], snippet).
- **On the phone app**, every species that has genders shows ♂/♀ symbols on its entry, and tapping them shows the differences. Only Meowstic, Indeedee, Basculegion and Oinkologne scroll like forms ([Pokédex (HOME)][b-dex], snippet).
  - Inferred: no source says HOME records which genders you’ve had for species without a difference, so it doesn’t track ♂/♀ for those.
- **Species with a female entry:** 0003 Venusaur, 0012 Butterfree, 0019 Rattata, 0020 Raticate, 0025 Pikachu, 0026 Raichu, 0041 Zubat, 0042 Golbat, 0044 Gloom, 0045 Vileplume, 0064 Kadabra, 0065 Alakazam, 0084 Doduo, 0085 Dodrio, 0097 Hypno, 0111 Rhyhorn, 0112 Rhydon, 0118 Goldeen, 0119 Seaking, 0123 Scyther, 0129 Magikarp, 0130 Gyarados, 0133 Eevee, 0154 Meganium, 0165 Ledyba, 0166 Ledian, 0178 Xatu, 0185 Sudowoodo, 0186 Politoed, 0190 Aipom, 0194 Wooper, 0195 Quagsire, 0198 Murkrow, 0202 Wobbuffet, 0203 Girafarig, 0207 Gligar, 0208 Steelix, 0212 Scizor, 0214 Heracross, 0215 Sneasel (and Hisuian Sneasel), 0217 Ursaring, 0221 Piloswine, 0224 Octillery, 0229 Houndoom, 0232 Donphan, 0255 Torchic, 0256 Combusken, 0257 Blaziken, 0267 Beautifly, 0269 Dustox, 0272 Ludicolo, 0274 Nuzleaf, 0275 Shiftry, 0307 Meditite, 0308 Medicham, 0315 Roselia, 0316 Gulpin, 0317 Swalot, 0322 Numel, 0323 Camerupt, 0332 Cacturne, 0350 Milotic, 0369 Relicanth, 0396 Starly, 0397 Staravia, 0398 Staraptor, 0399 Bidoof, 0400 Bibarel, 0401 Kricketot, 0402 Kricketune, 0403 Shinx, 0404 Luxio, 0405 Luxray, 0407 Roserade, 0415 Combee, 0417 Pachirisu, 0418 Buizel, 0419 Floatzel, 0424 Ambipom, 0443 Gible, 0444 Gabite, 0445 Garchomp, 0449 Hippopotas, 0450 Hippowdon, 0453 Croagunk, 0454 Toxicroak, 0456 Finneon, 0457 Lumineon, 0459 Snover, 0460 Abomasnow, 0461 Weavile, 0464 Rhyperior, 0465 Tangrowth, 0473 Mamoswine, 0521 Unfezant, 0592 Frillish, 0593 Jellicent, 0668 Pyroar, 0678 Meowstic, 0876 Indeedee, 0902 Basculegion, 0916 Oinkologne.

## 7. Anything else HOME’s Pokédex records

HOME’s own Pokédex records:
- **Registered, for each form**, when deposited ([HOME features][o-feat]). (That it stays registered after the Pokémon leaves was already known; not re-checked.)
- **Shiny, for each form** (Serebii: it can “show shiny variants”) ([features][s-feat]). A shiny deposit registers the shiny and the normal entry ([Pokédex (HOME)][b-dex], snippet).
- **One Pokédex per game** (since 2.0.0), which “can only register Pokémon caught in those specific games” ([HOME features][o-feat]). The official page names Kanto; Galar, Isle of Armor and Crown Tundra; Sinnoh; Hisui; and Paldea, Kitakami and Blueberry. Lumiose, Hyperspace and Mega Evolution came with Z-A ([Serebii, 2 April 2026][s-n0204]).
  - Legends: Arceus Pokémon register only once that species’ research is complete in the save ([Serebii transfer][s-tr]).
  - Completing game Pokédexes gives shiny mythicals: Meloetta, Enamorus, Manaphy, Keldeo and Meltan ([HOME features][o-feat]), and Volcanion ([27 April][s-n2704]).
- **Other ways entries get registered:**
  - Pokémon Bank passes its National Pokédex to HOME, with no need to move every form ([National Pokédex][s-dex]).
  - FireRed & LeafGreen on Switch sync their Pokédex when linked ([Serebii transfer][s-tr]).
- **Not in the Pokédex** (none of the sources show them there, inferred): **Alpha marks, origin marks, ribbons and Dynamax Level.** They belong to each Pokémon. Pokémon Support mentions the Alpha mark as something the status screen may show differently ([Pokémon Support][o-display]).
  - So for HOME, the boxes that match HOME’s own Pokédex are: **registered, shiny, each form (including Gigantamax and Mega), and each game’s Pokédex.**

## Sources (all read 22 Nov 2026)

- Serebii, Depositable Pokémon (numerical; Standard and Shiny Boxes): [s-dep]
- Serebii, Depositable Pokémon (categorised; Gigantamax and Gender Variance boxes): [s-cat]
- Serebii, Undepositable Pokémon: [s-non]
- Serebii, HOME National Pokédex: [s-dex]
- Serebii, HOME features: [s-feat]
- Serebii, HOME transfer: [s-tr]
- Serebii, HOME challenges: [s-chal]
- Serebii, Sword & Shield Gigantamax forms: [s-gmax]
- Serebii, Sword & Shield shiny Pokémon: [s-swsh-shiny]
- Serebii news, 1 April 2026, 2 April 2026 and 27 April 2026: [s-n0104], [s-n0204], [s-n2704]
- Serebii event database (Pikachu, Zygarde, Type: Null, Poipole, Eternatus, Koraidon): [s-ev025], [s-ev718], [s-ev772], [s-ev803], [s-ev890], [s-ev1007]
- Pokémon HOME official, features and moving Pokémon: [o-feat], [o-move]
- Pokémon Support: Gigantamax Factor [o-gmax]; Melmetal [o-melm]; held items [o-items]; status display [o-display]
- Nintendo, HOME version history: [n-ver]
- Pokémon GO Help, Max Pokémon and sending to HOME: [go-max], [go-home]
- Bulbapedia (search snippets only): [b-dex], [b-home], [b-got], [b-megadex], [b-lowkey]
- PokéBase (community answer): [pb-gmax]; Dittobase: [dittobase]

[s-dep]: https://www.serebii.net/pokemonhome/depositablepokemon.shtml
[s-cat]: https://www.serebii.net/pokemonhome/depositablepokemon-sorted.shtml
[s-non]: https://www.serebii.net/pokemonhome/nondepositablepokemon.shtml
[s-dex]: https://www.serebii.net/pokemonhome/nationalpokedex.shtml
[s-feat]: https://www.serebii.net/pokemonhome/features.shtml
[s-tr]: https://www.serebii.net/pokemonhome/transfer.shtml
[s-chal]: https://www.serebii.net/pokemonhome/challenges.shtml
[s-gmax]: https://www.serebii.net/swordshield/gigantamax.shtml
[s-swsh-shiny]: https://www.serebii.net/swordshield/shinypokemon.shtml
[s-n0104]: https://www.serebii.net/news/2026/01-April-2026.shtml
[s-n0204]: https://www.serebii.net/news/2026/02-April-2026.shtml
[s-n2704]: https://www.serebii.net/news/2026/27-April-2026.shtml
[s-ev025]: https://www.serebii.net/events/dex/025.shtml
[s-ev718]: https://www.serebii.net/events/dex/718.shtml
[s-ev772]: https://www.serebii.net/events/dex/772.shtml
[s-ev803]: https://www.serebii.net/events/dex/803.shtml
[s-ev890]: https://www.serebii.net/events/dex/890.shtml
[s-ev1007]: https://www.serebii.net/events/dex/1007.shtml
[o-feat]: https://home.pokemon.com/en-us/features
[o-move]: https://home.pokemon.com/en-us/move/
[o-gmax]: https://support.pokemon.com/hc/en-us/articles/360039030792
[o-melm]: https://support.pokemon.com/hc/en-us/articles/360049848812
[o-items]: https://support.pokemon.com/hc/en-us/articles/360039207832
[o-display]: https://support.pokemon.com/hc/en-us/articles/7963042951444
[n-ver]: https://en-americas-support.nintendo.com/app/answers/detail/a_id/49104
[go-max]: https://scopelyexplore.helpshift.com/hc/en/5-pokemon-go/faq/1211-what-are-max-pokemon/
[go-home]: https://scopelyexplore.helpshift.com/hc/faq/1339-sending-pokemon-to-pokemon-home/
[b-dex]: https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9dex_(HOME)
[b-home]: https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_HOME
[b-got]: https://bulbapedia.bulbagarden.net/wiki/GO_Transporter
[b-megadex]: https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_in_the_Mega_Evolution_Pok%C3%A9dex
[b-lowkey]: https://bulbapedia.bulbagarden.net/wiki/Low_Key
[pb-gmax]: https://pokemondb.net/pokebase/416780/will-a-pokemon-lose-its-gmax-if-transfer-to-home
[dittobase]: https://www.dittobase.com/pokedex/pikachu-partner-cap
