---
titel: "Fehlersuchplan Bordcomputer BC II"
seitencode: "65-501"
sektion_nr: "65"
sektion: "Radio und Sonderausstattung"
titel_en: "'"
seitentyp: "table"
konfidenz: 0.98
bilddatei: "65-501.jpg"
tags:
  - sektion/65
  - seite
  - typ/table
---

# Fehlersuchplan Bordcomputer BC II

> [!info] BMW-Seite `65-501` · Abschnitt 65 — Radio und Sonderausstattung
> Typ: **Tabelle** · Konfidenz: **0.98**
> Originalseite oben, deutsche Übersetzung darunter. Die **Originalseite ist maßgeblich**.

![[65 - Radio und Sonderausstattung/65-501.jpg]]

*Originaltitel (EN): "*

---

## Beschreibung
Die Seite 65-501 zeigt einen Fehlersuchplan für die Multifunktions- bzw. Bordcomputeranzeige BC II. Behandelt werden eine ausgefallene Tasten- und Hintergrundbeleuchtung bei eingeschalteter Fahrzeugbeleuchtung sowie eine fehlende oder fehlerhafte Geschwindigkeits- und Verbrauchsanzeige. Für jede Störung sind mögliche Fehlerursachen, Prüfbedingungen, Sollwerte und Hinweise zur weiteren Signalverfolgung oder Bauteilerneuerung angegeben.

## Transkription
> [!note]- Transkription (aufklappen)
> Seite 65-501
>
> Störung / Funktion | Möglicher Fehler | Prüfung / Sollwert | Bei Abweichung: Fehlerquellen / Hinweise
>
> 5. Beleuchtung der Tasten der Anzeigeplatine des Zündschlosses ab Stellung R (bei eingeschalteter Beleuchtung) funktioniert nicht
>
> Mögliche Fehler:
> – Klemme 31g, Klemme R, Klemme 58: Spannungsversorgung fehlt.
> – Leuchten im BC II defekt.
>
> Prüfung / Sollwert:
> – Zwischen Pin 10 (= Klemme 31) und Pin 5 (= Klemme R): Sollwert 10 V (nur die Tastenbeleuchtung funktioniert bei eingeschalteter Fahrzeugbeleuchtung).
> – Zwischen Pin 9 (= Klemme 31g) und Pin 8 (= Klemme 58 k): Sollwert U = Batteriespannung, abhängig von der Schalterstellung.
>
> Fehlerquellen / Hinweise:
> – Leitungsunterbrechung.
> – Glühlampen ersetzen; je nach Fehler die Lichtleiste mit einer kleinen Zange herausziehen (bei externer Prüfung die aufgedruckten Spannungsdaten beachten) oder die Tastenbeleuchtung ersetzen (12 V, 1,2 W).
>
> 6. Keine oder falsche SPEED-Anzeige
>
> Mögliche Fehler:
> – Falscher Codierstecker* im BC II.
> – Geschwindigkeitssignal fehlt.
>
> Prüfung / Sollwert:
> – Siehe Punkt 1.
> – Geschwindigkeitssignal am Steckanschluss der Leitung zum Geschwindigkeitsgeber mit dem BMW-Service-Prüfgerät simulieren.
>
> Fehlerquellen / Hinweise:
> – Signal bis zum BC II verfolgen.
>
> Möglicher Fehler:
> – Fehler im Eingangssignal.
>
> Prüfung / Sollwert:
> – Bei simulierten 256 Hz, eingeschalteter Zündung (Motor steht), die Tasten SPEED und SET-RES am BC II betätigen. Angezeigter Wert: siehe Codiersteckertabelle*.
>
> Möglicher Fehler:
> – BC II defekt.
>
> Fehlerquelle / Hinweis:
> – BC II ersetzen (siehe Punkt 1).
>
> 7. Keine oder falsche CONSUMPTION-Anzeige
>
> Mögliche Fehler:
> – Falscher Codierstecker* im BC II.
>
> Prüfung / Sollwert:
> – Siehe Punkt 1.
>
> Möglicher Fehler:
> – Fehler im Eingangssignal.
>
> Prüfung / Sollwert:
> – Bei laufendem Motor muss ein Verbrauchssignal an Pin 17 und an Pin 10 (= B−) anliegen.
>
> Fehlerquellen / Hinweise:
> – Signal vom L-Jetronic-Steuergerät, Pin 12, oder von Leitung 11 des 2BE-Steuergeräts mit dem BMW-Service-Prüfgerät prüfen.
> – Oszilloskopprüfung oder BMW Digitaltester II: ms-Test, gegebenenfalls mit Signal von Zylinder 1 oder 2.
>
> Möglicher Fehler:
> – BC II defekt.
>
> Fehlerquelle / Hinweis:
> – BC II ersetzen (siehe Punkt 1).
>
> * Siehe Technische Daten.


## Fachbegriffe (EN → DE)
| Englisch | Deutsch |
| --- | --- |
| Ignition lock | Zündschloss |
| display board | Anzeigeplatine |
| button lighting | Tastenbeleuchtung |
| background lighting | Hintergrundbeleuchtung |
| BC II | Bordcomputer II |
| terminal 31 | Klemme 31 (Masse) |
| terminal 31g | Klemme 31g |
| terminal R | Klemme R |
| terminal 58 | Klemme 58 (Beleuchtung) |
| coding plug | Codierstecker |
| speed display | Geschwindigkeitsanzeige |
| speed signal | Geschwindigkeitssignal |
| speed transmitter | Geschwindigkeitsgeber |
| input signal | Eingangssignal |
| consumption display | Verbrauchsanzeige |
| consumption signal | Verbrauchssignal |
| L-Jetronic control unit | L-Jetronic-Steuergerät |
| 2BE control unit | 2BE-Steuergerät |
| BMW service test unit | BMW-Service-Prüfgerät |
| BMW digital tester II | BMW Digitaltester II |
| battery voltage | Batteriespannung |
| break in wire | Leitungsunterbrechung |

---
[[Startseite]] · [[_Übersicht 65 — Radio und Sonderausstattung|Abschnittsübersicht]] · [[Glossar]]
