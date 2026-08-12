---
titel: "Bordcomputer II prüfen"
seitencode: "65-500"
sektion_nr: "65"
sektion: "Radio und Sonderausstattung"
titel_en: "On-board computer (Generation II) - testing instructions"
seitentyp: "table"
konfidenz: 0.97
bilddatei: "65-500.jpg"
tags:
  - sektion/65
  - seite
  - typ/table
---

# Bordcomputer II prüfen

> [!info] BMW-Seite `65-500` · Abschnitt 65 — Radio und Sonderausstattung
> Typ: **Tabelle** · Konfidenz: **0.97**
> Originalseite oben, deutsche Übersetzung darunter. Die **Originalseite ist maßgeblich**.

![[65-500.jpg]]

*Originaltitel (EN): On-board computer (Generation II) - testing instructions*

---

## Beschreibung
Werkstattprüfseite 65–500 für den Bordcomputer II (Generation II) des BMW E30. Sie beschreibt die Voraussetzungen und erforderlichen Prüfmittel, die Funktionen der Klemmen- beziehungsweise Zündschlossstellungen 0, R, 15 und 50 sowie die systematische Fehlersuche anhand von Anzeigezuständen. Die Tabelle führt mögliche Fehlerursachen, Prüfungen und Abhilfemaßnahmen für die Anzeigen „PPPP“, „AAAA“, eine fehlende Anzeige und eine schwache Zeitanzeige auf.

## Transkription
> [!note]- Transkription (aufklappen)
> 65–500
>
> PRÜFANWEISUNGEN FÜR BORDCOMPUTER (GENERATION II)
>
> Diese Prüfanweisungen sind in einer logischen Reihenfolge zusammengestellt; die Prüfschritte können jedoch auch einzeln durchgeführt werden. Die angegebenen Pinnummern müssen verwendet werden – Kurzschlussgefahr!
>
> Prüfvoraussetzungen:
> Der Bordcomputer II muss gemäß der Bedienungsanleitung (Kapitel 2) aufgerufen und Daten müssen gespeichert werden können.
>
> Erforderliche Prüfmittel:
> Universaladapter mit Anschlussleitung sowie BMW-Serviceprüfgerät (Multimeterprüfungen).
>
> Die im Bordcomputer II gespeicherten Daten werden durch den Verbindungsschalter des Prüfadapters gelöscht, der sich zwischen dem Kabelbaumstecker des Bordcomputers II und dem Bordcomputer II befindet.
>
> Funktionen bei den Zündschlossstellungen:
> 0: Keine Display-Hintergrundbeleuchtung; Tasten können nicht betätigt werden.
> R: Display beleuchtet, Bedienung möglich, Codierfunktion freigegeben.
> 15: Wie R, jedoch zusätzlich Funktionen für Wegstrecke, Zeit und Verbrauch; Codierfunktion gesperrt.
> 50: Wie 15, jedoch darf die Anlasssperre erst 6 Sekunden nach Wegnahme des Klemme-50-Signals wirksam werden.
>
> Universaladapter HWB Nr. 81 12 9 425 091
> Anschlussleitung Kabelbaum, 26-polig: 096
> Anschlussleitung Steuergerät, 26-polig: 097
>
> Hinweis:
> Die Art des Codiersteckers* kann durch gleichzeitiges Drücken der Tasten 1 und 100 bei Zündschlossstellung 15 aufgerufen werden. Ist ein Aufrufen nicht möglich, die Spannungsversorgung zwischen Pin 10 (= B–) und Pin 7 (= Klemme 15) prüfen.
>
> Fehlerbild / Betrieb | Möglicher Fehler | Prüfung / Sollwert | Abweichung vom Sollwert – Fehlerquelle / Information
>
> 1. „PPPP“ erscheint in der Anzeige
> Mögliche Fehler:
> – am Codierstecker* auf der Rückseite
> – an dessen Steckkontakten
> – am Bordcomputer II
> Prüfung: Codierprüfung.
> Abhilfe:
> – Codierstecker ersetzen, Spannungsversorgung unterbrechen, wieder anschließen und Codierprüfung durchführen.
> – Bordcomputer II ersetzen.
> Nach dem Ersetzen des Bordcomputers II die Codierung prüfen und das Reservevolumen abgleichen:
> Wenn die Tankvolumenwerte nicht dem Reservebereich entsprechen, den Kraftstoffstandgeber so weit aus dem Tank herausziehen, dass der Schwimmer am unteren Anschlag steht. Die Plombierung am Bordcomputer II (links neben der Taste 1000) entfernen. Zündschloss in Stellung 15. Nach gleichzeitigem Drücken der Tasten 1 und 1000 den angezeigten Literwert* mit einem Schraubendreher korrigieren. Plombierung wieder anbringen.
>
> Hinweis:
> Die Anzeige der Reichweite kann nach dem Aufrufen des Tankvolumens geändert worden sein.
>
> 2. „AAAA“ erscheint in der Anzeige
> Möglicher Fehler: Interner Fehler des Bordcomputers II.
> Abhilfe: Bordcomputer II ersetzen; siehe auch Punkt 1.
>
> 3. Keine Anzeige
> Möglicher Fehler: Spannungsversorgung fehlt.
> Prüfung: Zwischen Pin 10 (= B–) und Pin 6 (= B+). Sollwert: U ≥ 10 V.
> Fehlerquelle / Information: Leitungen zum und vom Instrumentenkombi; Steckverbindungen.
>
> 4. Schwache Zeitanzeige, jedoch keine weiteren Bedienfunktionen bei Zündschlossstellung R möglich
> Mögliche Fehler:
> – Keine Spannung an Klemme R.
> Prüfung: Zwischen Pin 10 (= B–) und Pin 5 (= Klemme R). Sollwert: U ≥ 10 V.
> Fehlerquelle / Information: Leitungen zum und vom Instrumentenkombi; Steckverbindungen.
> – Bordcomputer II defekt, zum Beispiel Tasten.
> Abhilfe: Bordcomputer II ersetzen (siehe Punkt 1).
>
> * Siehe technische Daten.


## Fachbegriffe (EN → DE)
| Englisch | Deutsch |
| --- | --- |
| on-board computer (Generation II) | Bordcomputer II (Generation II) |
| testing instructions | Prüfanweisungen |
| universal adapter | Universaladapter |
| BMW service test unit | BMW-Serviceprüfgerät |
| wire harness plug | Kabelbaumstecker |
| coding plug | Codierstecker |
| ignition lock position | Zündschlossstellung |
| terminal 15 | Klemme 15 |
| terminal R | Klemme R |
| terminal 50 | Klemme 50 |
| starting interlock | Anlasssperre |
| fuel level transmitter | Kraftstoffstandgeber |
| float | Schwimmer |
| anti-tamper lock | Plombierung |
| instrument cluster | Instrumentenkombi |
| coding test | Codierprüfung |
| driving range display | Reichweitenanzeige |
| reserve volume | Reservevolumen |

---
[[Startseite]] · [[_Übersicht 65 — Radio und Sonderausstattung|Abschnittsübersicht]] · [[Glossar]]
