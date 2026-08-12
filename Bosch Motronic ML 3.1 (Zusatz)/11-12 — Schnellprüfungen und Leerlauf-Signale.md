---
titel: "Schnellprüfungen und Leerlauf-Signale"
seitencode: "11-12"
sektion: "Bosch Motronic ML 3.1 (Zusatz)"
titel_en: "Quick Tests and Idle-Speed Signals"
seitentyp: "table"
konfidenz: 0.86
bilddatei: "11-12.png"
tags:
  - zusatzmaterial
  - bosch-motronic
  - sektion/12
  - sektion/13
---

# Schnellprüfungen und Leerlauf-Signale

> [!info] Bosch Motronic ML 3.1 Diagnosehandbuch (BMW-5006) · Rahmen `11-12`
> Original: **Italienisch** · Typ: **Tabelle** · Konfidenz: **0.86**
> Ergänzendes Material, nicht Teil des BMW-Werkstatthandbuchs. Die **Originalseite ist maßgeblich**.

![[11-12.png]]

*Original title (EN): Quick Tests and Idle-Speed Signals*

---

## Beschreibung
Die Doppelseite J11/J12 enthält eine Tabelle für Schnellprüfungen mit dem universellen Prüfadapter Bosch ETT 018.01 an der Motronic. Beschrieben werden Kraftstoffdruck, CO-Gehalt, Zünd- und Schließwinkel, Schubabschaltung sowie die Ansteuerung des Leerlaufdrehzahl-Stellglieds. Die rechte Seite zeigt den Anschluss des Manometers und die Signalverläufe am Leerlauf-Stellglied.

## Transkription
> [!note]- Transkription (aufklappen)
> Linke Seite (J11):
>
> LISTE DER SCHNELLPRÜFUNGEN FÜR DEN UNIVERSELLEN PRÜFADAPTER ETT 018.01
>
> Prüfkabel ohne Katalysator: 1 684 463 124 / mit Katalysator: 1 684 463 128
>
> Spaltenüberschriften:
> Prüfzyklus | Wahlschalter V / Ω | Messklemmen | Prüfung des Bauteils bzw. der Funktion; Prüfbedingungen | Nennwerte
>
> Prüfzyklus 31 – Messklemmen 17 und 15:
> Kraftstoff-Elektropumpe und Kraftstoffdruckregler prüfen. Das Manometer abnehmen bzw. aus dem Messkreis entfernen (siehe obere Abbildung); gegebenenfalls die Prüfsteckdose T3 anschließen.
> Nennwert: 2,8 bis 3,2 bar.
>
> Prüfzyklus 32 – Messklemmen 17 und 15:
> Leerlaufdrehzahl und CO-Gehalt (ohne Katalysator). Motortester, CO-Tester und, falls vorhanden, das Diagnosekabel 1 684 463 196 anschließen. Den Motor auf Betriebstemperatur bringen. Nach Betätigung der Taste T2 müssen die Werte unverändert bleiben.
> Nennwerte: 800 bis 900 min⁻¹; 0,5 bis 1,5 Vol.-% CO. Bei Fahrzeugen mit Katalysator ist Prüfzyklus 42 zu beachten.
>
> Prüfzyklus 33 – Messklemmen 17 und 15:
> Zündwinkel im Leerlauf.
> Nennwert: −5 bis +5°.
>
> Zündwinkel bei Volllast.
> Nennwert: 15 bis 25°.
>
> Die Motordrehzahl auf 3000 min⁻¹ einstellen und die Taste T6 drücken. Bei Fahrzeugen mit Katalysator:
> Nennwert: 13 bis 23°.
>
> Prüfzyklus 34 – Messklemmen 17 und 15:
> Schließwinkel im Leerlauf.
> Nennwert: 10 bis 23°.
>
> Schließwinkel bei 2000 min⁻¹.
> Nennwert: 17 bis 39°.
>
> Prüfzyklus 35 – Messklemmen 17 und 16:
> Die Unterbrechung der Kraftstoffversorgung im Schubbetrieb prüfen. Die Motordrehzahl auf 3000 min⁻¹ einstellen und die Taste T6 drücken. Die Einspritzsignale müssen aussetzen. Sobald wieder Einspritzsignale auftreten, muss die Drehzahl in Richtung Leerlaufdrehzahl abfallen.
> Nennwert: Der Motor läuft im Leerlauf.
>
> Prüfzyklus 36 – Messklemmen 18 und 16; Wahlschalter 33,5:
> Impulssignal des Leerlaufdrehzahl-Stellglieds prüfen. Die Messung erfolgt mit dem Motortester im Schließwinkel-Messbereich (Skala 5). Klemme 15 des Motortesters am roten Leiter anschließen. Motor auf Betriebstemperatur, Leerlaufdrehzahl.
> Bei gedrückten Tasten T5 und T6 muss die Leerlaufdrehzahl auf 800 bis 850 min⁻¹ ansteigen; falls erforderlich, Korrekturen vornehmen.
> Nennwert: 20 bis 30 %. Form des Signals siehe Abbildung (oszilloskopischer Eingang).
>
> Rechte Seite (J12):
>
> Pfeile = Anschluss des Manometers.
>
> Signale am Leerlaufdrehzahl-Stellglied.
>
> Die Abbildung zeigt die wiederkehrenden Impulssignale des Leerlaufdrehzahl-Stellglieds. Bildnummer: 261/0259.


## Fachbegriffe (EN → DE)
| Englisch | Deutsch |
| --- | --- |
| quick test | Schnellprüfung |
| universal test adapter | universeller Prüfadapter |
| fuel pump | Kraftstoffpumpe |
| fuel pressure regulator | Kraftstoffdruckregler |
| fuel pressure | Kraftstoffdruck |
| pressure gauge | Manometer |
| idle speed | Leerlaufdrehzahl |
| CO tester | CO-Tester |
| ignition angle | Zündwinkel |
| dwell angle | Schließwinkel |
| fuel cut-off on overrun | Schubabschaltung |
| injection signal | Einspritzsignal |
| idle-speed actuator | Leerlaufdrehzahl-Stellglied |
| operating temperature | Betriebstemperatur |
| test cycle | Prüfzyklus |
| diagnostic cable | Diagnosekabel |
| nominal value | Nennwert |

---
[[Bosch Motronic ML 3.1 (Zusatz)]] · [[Startseite]] · [[Glossar]]
