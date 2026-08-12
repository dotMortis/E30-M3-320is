---
titel: "DME-Fehlersuche mit BMW-Diagnosesystem"
seitencode: "13-912"
sektion_nr: "13"
sektion: "Kraftstoffsystem"
titel_en: "Troubleshooting DME with BMW Diag. System (M20 engine)"
seitentyp: "table"
konfidenz: 0.94
bilddatei: "13-912.jpg"
tags:
  - sektion/13
  - seite
  - typ/table
---

# DME-Fehlersuche mit BMW-Diagnosesystem

> [!info] BMW-Seite `13-912` · Abschnitt 13 — Kraftstoffsystem
> Typ: **Tabelle** · Konfidenz: **0.94**
> Originalseite oben, deutsche Übersetzung darunter. Die **Originalseite ist maßgeblich**.

![[13-912.jpg]]

*Originaltitel (EN): Troubleshooting DME with BMW Diag. System (M20 engine)*

---

## Beschreibung
Die Seite 13-912 beschreibt die Fehlersuche am DME-Motorsteuergerät mit dem BMW-Diagnosesystem für M20-Motoren im E30. Sie enthält die Vorgehensweise zum Anschließen des BMW-Service-Testers und zur Identifikation des Steuergeräts, eine Liste der über Statusabrufe prüfbaren Aktoren und Eingangssignale sowie eine Tabelle mit dynamischen Sollwerten für die Motortypen M20 B20 und M20 B25.

## Transkription
> [!note]- Transkription (aufklappen)
> 13-912
>
> FEHLERSUCHE AM DME MIT BMW-DIAGNOSESYSTEM (M20-Motor)
>
> Diskette einlegen und Diagnosegerät am BMW-Service-Tester anschließen – siehe Bedienungsanleitung des BMW-DIAGNOSESYSTEMS.
>
> Zündung EIN:
> 01 DME anwählen. Gegebenenfalls Kurztest durchführen (beim Kurztest wird lediglich angezeigt, ob Fehler im System vorhanden sind).
> Die Steuergeräte-Identifikation erscheint auf dem Bildschirm, nachdem das Steuergerät die Datenübertragung beendet hat.
>
> Version E30, Modell, Motorkennbuchstabe M20 B20 / B25
> HAUPTGRUPPE Kraftstoffart
> CODIERUNG prüfen – siehe Technische Daten oder Teile-Mikrofiche
> ECE/D-Länderversion
> BMW-HARDWARENUMMER    * *** ***
> SOFTWARENUMMER        ***
> BOSCH-HARDWARENUMMER  * *** *** ***
> SOFTWARENUMMER        * *** *** ***
> FERTIGUNGSCODE        ***
> Mit der Auswahlübersicht fortfahren.
>
> Hinweis:
> Beim Austausch eines Steuergeräts außerdem einen Ausdruck der Identifikation (Testcode) mitsenden.
>
> Fehlerspeicher abrufen – 900.
> Statuslisten können ebenfalls als zusätzliche Hilfe bei der Fehlersuche abgerufen werden.
>
> Statusabrufe
> 100 anwählen
> Ansteuerung des elektrischen Kraftstoffpumpenrelais
> Tankentlüftungsventil
> Sauerstoffsensor
> Ansteuerung des Hauptrelais
> Ansteuerung des Kompressors
> Klimaanlagenschalter
> Fahrstufe P/N (nur Automatikgetriebe)
> Zündzeitpunktabgriff (nur Automatikgetriebe)
> Leerlaufschalter
> Volllastschalter
> Halbsequentielle Einspritzung
> Relais und Ventile sind bei der Ansteuerung hör- und fühlbar.
> Die Schalterstellung zeigt die Stellung EIN oder AUS an.
>
> Dynamische Statusabrufe
> 200 anwählen
>
> Motortyp                         M20 B20             M20 B25
> Leerlaufdrehzahl in/min 1)       760 ± 40            760 ± 40
> CO-Gehalt in Vol.-% 1) 2)        0,7 ± 0,5           0,7 ± 0,5
> Zündzeitpunkt in Kurbelwellen-
> OT vor OT 1)                     4 ± 5               10 ± 5
> Lastsignal tL in ms 1)           2,1 ... 2,5         1,9 ... 2,3
> Einspritzzeit tI in ms 1) 3)     4,9 ... 5,3         4,4 ... 4,8
> Abschaltdrehzahl in/min          6400 ± 40           6400 ± 40
> Luftmengenmesser-Spannungs-
> verhältnis Up/Uv 1)
> bei Leerlaufdrehzahl             0,2 ... 0,3 %
>
> Sauerstoffsensor-Spannung        0,5 bis 0,8 V
>
> 1) Öltemperatur > 60 °C (140 °F) oder Kühlmitteltemperatur > 80 °C (175 °F), keine elektrischen Verbraucher eingeschaltet, bei Leerlaufdrehzahl.
> 2) Vor dem Katalysator gemessen.
> 3) Gültig bei halbsequentieller Einspritzung. Bei Paralleleinspritzung (im Diagnosebetrieb aktiv) gilt die Hälfte dieses Wertes.
>
> Lastsignal tL (Betriebstemperatur) im Fahrzeug prüfen.
>
> Zusätzliche Informationen: siehe Elektrisches Fehlersuchhandbuch (E34).


## Fachbegriffe (EN → DE)
| Englisch | Deutsch |
| --- | --- |
| DME | Digitale Motorelektronik (Motorsteuergerät) |
| BMW Diagnosing System | BMW-Diagnosesystem |
| BMW Service Tester | BMW-Service-Tester |
| control unit | Steuergerät |
| fault memory | Fehlerspeicher |
| status calls | Statusabrufe |
| electric fuel pump relay | elektrisches Kraftstoffpumpenrelais |
| tank venting valve | Tankentlüftungsventil |
| oxygen sensor | Sauerstoffsensor |
| master relay | Hauptrelais |
| air conditioner switch | Klimaanlagenschalter |
| idle speed switch | Leerlaufschalter |
| full load switch | Volllastschalter |
| semi-sequential injection | halbsequentielle Einspritzung |
| parallel injection | Paralleleinspritzung |
| load signal tL | Lastsignal tL |
| injection time tI | Einspritzzeit tI |
| shutoff speed | Abschaltdrehzahl |
| air flow sensor | Luftmengenmesser |
| catalytic converter | Katalysator |

---
[[Startseite]] · [[_Übersicht 13 — Kraftstoffsystem|Abschnittsübersicht]] · [[Glossar]]
