---
titel: "Gebläse- und Klimaanlagensteuerung Fehlersuche"
seitencode: "6413-01"
sektion_nr: ""
sektion: "1990 BMW M3 Elektrik-Fehlersuche-Handbuch"
titel_en: "'"
seitentyp: "table"
konfidenz: 0.99
bilddatei: "6413-01.jpg"
tags:
  - sektion/
  - seite
  - typ/table
---

# Gebläse- und Klimaanlagensteuerung Fehlersuche

> [!info] BMW-Seite `6413-01` · Abschnitt  — 1990 BMW M3 Elektrik-Fehlersuche-Handbuch
> Typ: **Tabelle** · Konfidenz: **0.99**
> Originalseite oben, deutsche Übersetzung darunter. Die **Originalseite ist maßgeblich**.

![[6413-01.jpg]]

*Originaltitel (EN): "*

---

## Beschreibung
Die Seite 6413-1 „A/C Blower Controls“ beschreibt die elektrische Wirkungsweise der Gebläse- und Klimaanlagensteuerung und enthält eine systematische Fehlersuche. Erläutert werden die Spannungsversorgung über den Gebläsestufenschalter, die Funktion der Gebläsewiderstände sowie des Sicherheitsschalters. Eine Symptomtabelle ordnet typische Fehlerbilder den Prüfungen A oder B zu. Die anschließenden Tabellen geben für den Test der Steuerschalter und den Test der Gebläsestufensteuerung die Messpunkte, Sollspannungen und weiterführenden Diagnoseschritte an.

## Transkription
> [!note]- Transkription (aufklappen)
> KLIMAGERÄTE-GEBLÄSESTEUERUNG – 6413-1
>
> SCHALTUNGSFUNKTION
> Bei Zündschalterstellung RUN wird Batteriespannung über die GN/BR-Leitungen an die Steuerschalter und an die Gebläsestufensteuerung angelegt. Wenn entweder der Klimaanlagen-Wahlschalter oder der Frischluft-/Umluftschalter eingeschaltet ist oder die Gebläsestufensteuerung auf Stellung 1 steht, wird die Batteriespannung über die YL-Leitung an die Gebläsewiderstände und den Gebläsemotor angelegt.
>
> Der Gebläsemotor ist ein Motor mit variabler Drehzahl, der mit einer Drehzahl läuft, die proportional zur anliegenden Spannung ist. Wenn alle Gebläsewiderstände im Stromkreis liegen, wird die am Motor anliegende Spannung reduziert, sodass der Motor mit niedriger Drehzahl läuft.
>
> Wenn die Gebläsestufensteuerung durch die Stellungen 2 und 3 bewegt wird, werden einige Widerstände überbrückt. Dadurch liegt eine höhere Spannung am Gebläsemotor an, der dann mit höherer Drehzahl läuft. Wenn die Gebläsestufensteuerung auf Stellung 4 bewegt wird, wird die Batteriespannung direkt an den Gebläsemotor angelegt; dieser läuft dann mit maximaler Drehzahl.
>
> Die Gebläsewiderstände geben aufgrund des durch sie fließenden Stroms Wärme ab. Sie werden durch den Luftstrom des Gebläses gekühlt. Wenn der Luftstrom zur Kühlung der Widerstände nicht ausreicht, öffnet der Sicherheitsschalter und schaltet den Gebläsemotor ab, bis die Widerstände abgekühlt sind.
>
> HINWEISE ZUR FEHLERSUCHE
> • Führen Sie die folgenden Prüfungen durch, bevor Sie mit der Systemdiagnose beginnen.
> 1. Sicherung 20 durch Sichtprüfung kontrollieren.
> 2. Wenn das Gebläse nur auf der höchsten Stufe läuft, den Sicherheitsschalter der Gebläsewiderstände auf Unterbrechung prüfen.
> • Siehe „Heizung und Klimaanlage (6410-0) – Systemprüfung“ für eine Anleitung zum Normalbetrieb.
> • Siehe „Systemdiagnose“ für die Diagnoseprüfungen.
>
> SYSTEMDIAGNOSE
> • Führen Sie die in der nachstehenden Symptomtabelle für Ihr Fehlerbild aufgeführten Prüfungen durch.
> • Die Prüfungen sind in der Symptomtabelle aufgeführt.
>
> SYMPTOMTABELLE
> Fehlerbild | Prüfung durchführen
> Gebläsemotor läuft in keiner Gebläsestellung. | B
> Gebläse läuft nur auf HIGH (läuft in keiner anderen Gebläsestellung). | B
> Gebläse läuft in einigen Betriebsarten nicht. | A
> Gebläse läuft bei eingeschalteter Klimaanlage oder im Umluftbetrieb nicht. | A
> Klimaanlagen-Wahlschalter oder Frischluft-/Umluftschalter leuchtet nicht. | A
>
> A: SPANNUNGSPRÜFUNG DER STEUERSCHALTER
> Messen: SPANNUNG
> Am: Steuerschalter-Steckverbinder (getrennt)
> Bedingungen:
> • Zündschalter: RUN
> • Gebläsestufensteuerung: OFF
>
> Messen zwischen | Sollspannung | Zur Diagnose
> 1 (GN/BR) und Masse | Batterie | Siehe 1
> 1 (GN/BR) und 3 (YL) | Batterie | Siehe 2 und 4
> 7 (GN/BR) und Masse | Batterie | Siehe 1
> 7 (GN/BR) und 5 (YL) | Batterie | Siehe 2 und 4
> 7 (GN/BR) und 6 (BR/WT) | Batterie | Siehe 3
>
> • Wenn alle Spannungen korrekt sind, Prüfung B durchführen.
> 1. GN/BR-Leitung auf Unterbrechung prüfen.
> 2. YL-Leitung auf Unterbrechung prüfen.
> 3. BR/WT-Leitung auf Unterbrechung prüfen.
> 4. Wenn zwischen der GN/BR-Leitung und beiden YL-Leitungen (Anschlüsse 3 und 5) keine Spannung anliegt, Prüfung B durchführen.
>
> B: PRÜFUNG DER GEBLÄSESTUFENSTEUERUNG
> Messen: SPANNUNG
> Am: Steckverbinder der Gebläsestufensteuerung (getrennt)
> Bedingungen:
> • Zündschalter: RUN
> • Klimaanlagen-Wahlschalter: ON (gedrückt)
> • Frischluft-/Umluftschalter: FRESH (nicht gedrückt)
>
> Messen zwischen | Sollspannung | Zur Diagnose
> 4 (GN/BR) und Masse | Batterie | Siehe 1
> 7 (YL) und Masse | Batterie | Siehe 2
> • Klimaanlagen-Wahlschalter: OFF (nicht gedrückt)
> 7 (YL) und Masse | 0 Volt | Siehe 3
>
> (Fortsetzung in der nächsten Spalte)
> (Fortsetzung auf der nächsten Seite)


## Fachbegriffe (EN → DE)
| Englisch | Deutsch |
| --- | --- |
| A/C Blower Controls | Klimageräte-Gebläsesteuerung |
| Circuit Operation | Schaltungsfunktion |
| System Diagnosis | Systemdiagnose |
| Blower Motor | Gebläsemotor |
| Blower Speed Control | Gebläsestufensteuerung |
| Blower Resistors | Gebläsewiderstände |
| Control Switches | Steuerschalter |
| A/C Select Switch | Klimaanlagen-Wahlschalter |
| Fresh/Recirculating Air Switch | Frischluft-/Umluftschalter |
| Safety Switch | Sicherheitsschalter |
| Symptom Table | Symptomtabelle |
| Control Switch Voltage Test | Spannungsprüfung der Steuerschalter |
| Blower Speed Control Test | Prüfung der Gebläsestufensteuerung |
| Blower Speed Control Connector | Steckverbinder der Gebläsestufensteuerung |
| Battery voltage | Batteriespannung |
| Ground | Masse |
| open circuit | Unterbrechung |
| GN/BR wire | GN/BR-Leitung (grün/braun) |
| YL wire | YL-Leitung (gelb) |
| BR/WT wire | BR/WT-Leitung (braun/weiß) |
| HIGH | höchste Gebläsestufe |
| RUN | Zündschalterstellung RUN |
| FRESH | Frischluftbetrieb |

---
[[Startseite]] · [[_Übersicht — 1990 BMW M3 Elektrik-Fehlersuche-Handbuch|Abschnittsübersicht]] · [[Glossar]]
