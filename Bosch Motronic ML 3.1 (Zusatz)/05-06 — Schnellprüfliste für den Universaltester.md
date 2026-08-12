---
titel: "Schnellprüfliste für den Universaltester"
seitencode: "05-06"
sektion: "Bosch Motronic ML 3.1 (Zusatz)"
titel_en: "Quick Test List for the Universal Tester"
seitentyp: "table"
konfidenz: 0.88
bilddatei: "05-06.png"
tags:
  - zusatzmaterial
  - bosch-motronic
  - sektion/12
  - sektion/13
---

# Schnellprüfliste für den Universaltester

> [!info] Bosch Motronic ML 3.1 Diagnosehandbuch (BMW-5006) · Rahmen `05-06`
> Original: **Italienisch** · Typ: **Tabelle** · Konfidenz: **0.88**
> Ergänzendes Material, nicht Teil des BMW-Werkstatthandbuchs. Die **Originalseite ist maßgeblich**.

![[05-06.png]]

*Original title (EN): Quick Test List for the Universal Tester*

---

## Beschreibung
Die Doppelseite zeigt eine Schnellprüfliste für den universellen Prüfadapter ETT 018.01 zur Diagnose des Motronic-Systems. Aufgeführt sind Prüfzyklen für Drehzahl- und Referenzmarkengeber, Kühlmitteltemperaturfühler, Kraftstoffvarianten-Schalter, Leerlauf- und Volllastschalter sowie Masseleitungen. Die Tabelle nennt die zu verwendenden Prüfanschlüsse, Messbereiche, Prüfvoraussetzungen und die jeweiligen Sollwerte.

## Transkription
> [!note]- Transkription (aufklappen)
> Schnellprüfliste für den Universaltester ETT 018.01
>
> Adapterkabel: ohne Katalognummer 1 684 463 124 / mit Katalognummer 1 684 463 128
> Hinweis: Das Kabel 124 ist bei Fahrzeugmodellen mit Katalysator nicht austauschbar; der Funktionstest der Lambdaregelung kann jedoch auch ohne Universaltester durchgeführt werden.
> In diesem Fall müssen die Prüfzyklen 39, 40, 41 und 42 manuell ausgeführt werden. Dazu den Stecker der Lambdasonde und den Stecker am Steuergerät (Masse 24) abziehen und für den Masseanschluss des schwarzen Messkabels oder für den Plusanschluss einer 1,5-V-Flachbatterie verwenden. Zum Masseanschluss der schwarzen Messleitung den Pluspol der Flachbatterie mit Masse verbinden.
>
> Linke Seite (J05):
> Spalten: Prüfzyklus | Wahlschalter V/Ω | Prüfanschlüsse | Prüfung von Bauteil/Funktion | Prüfanweisungen bzw. Prüfbedingungen | Sollwerte
>
> 1 | V | 1 | 0,5 | Drehzahlgeber (Isolationswiderstand) | Motor abstellen, Zündung ausschalten, Steuergerät und Hauptrelais abziehen. | größer als 1 MΩ
> 2 | V | 2 | 25,5 | Referenzmarkengeber (Isolationswiderstand) | — | größer als 1 MΩ
> 3 | V | 3 | 8,27 | Referenzmarkengeber (Wicklungswiderstand) | — | 600–1600 Ω
> 4 | V | 4 | 25,26 | Referenzmarkengeber (Wicklungswiderstand) | — | 600–1600 Ω
> 5 | V | 5 | 13,5 | Kühlmitteltemperaturfühler | Widerstand temperaturabhängig: 15–30 °C bzw. 80 °C. | 1450–3300 Ω bei 15–30 °C; 280–360 Ω bei 80 °C
> 6 | V | 6 | 22,6 | Kühlmitteltemperaturfühler | Widerstand temperaturabhängig: 15–30 °C. | 1450–3300 Ω
> 7 | V | 7 | 10,5 | Kraftstoffvarianten-Schalter | Je nach Codierung. | kleiner als 10 Ω oder größer als 1 MΩ
> 8 | V | 8 | 29,5 | Entfallen | — | —
> 9 | V | 9 | 2,5 | Leerlaufschalter, Fahrpedalkontakt in Minimalstellung | Fahrpedal in Ruhestellung; Fahrpedal leicht betätigen. | kleiner als 10 Ω bzw. größer als 1 MΩ
> 10 | V | 10 | 3,5 | Volllastschalter, Fahrpedalkontakt bei Volllast | Fahrpedal vollständig durchtreten; Fahrpedal leicht entlasten. | kleiner als 10 Ω bzw. größer als 1 MΩ
> 11 | V | 11, 12, 13 | 16,5; 17,5; 19,5 | Masseleitungen | Kontaktwiderstand. | jeweils kleiner als 10 Ω
>
> Rechte Seite (J06):
> Fortsetzung der Schnellprüfliste beziehungsweise Weiterführung der tabellarischen Prüfzyklen; auf dem vorliegenden Ausschnitt sind keine zusätzlichen Tabellenzeilen oder Anweisungen gegenüber dem dargestellten Tabellenbereich lesbar.


## Fachbegriffe (EN → DE)
| Englisch | Deutsch |
| --- | --- |
| Motronic | Motronic-Motorsteuerung |
| universal tester | Universaltester |
| test adapter | Prüfadapter |
| engine speed sensor | Drehzahlgeber |
| reference mark sensor | Referenzmarkengeber |
| insulation resistance | Isolationswiderstand |
| winding resistance | Wicklungswiderstand |
| coolant temperature sensor | Kühlmitteltemperaturfühler |
| fuel variant switch | Kraftstoffvarianten-Schalter |
| idle switch | Leerlaufschalter |
| full-load switch | Volllastschalter |
| accelerator pedal contact | Fahrpedalkontakt |
| main relay | Hauptrelais |
| contact resistance | Kontaktwiderstand |
| nominal values | Sollwerte |

---
[[Bosch Motronic ML 3.1 (Zusatz)]] · [[Startseite]] · [[Glossar]]
