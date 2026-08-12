---
titel: "Elektrische Klimakompressor-Ansteuerung und Fehlersuche"
seitencode: "6452-02"
sektion_nr: ""
sektion: "1990 BMW M3 Elektrik-Fehlersuche-Handbuch"
titel_en: "'"
seitentyp: "table"
konfidenz: 0.99
bilddatei: "6452-02.jpg"
tags:
  - sektion/
  - seite
  - typ/table
---

# Elektrische Klimakompressor-Ansteuerung und Fehlersuche

> [!info] BMW-Seite `6452-02` · Abschnitt  — 1990 BMW M3 Elektrik-Fehlersuche-Handbuch
> Typ: **Tabelle** · Konfidenz: **0.99**
> Originalseite oben, deutsche Übersetzung darunter. Die **Originalseite ist maßgeblich**.

![[1990 BMW M3 Elektrik-Fehlersuche-Handbuch/Stromlaufplan Klimakompressor-Ansteuerung Heizung Klimaanlage (6452)/6452-02.jpg]]

*Originaltitel (EN): "*

---

## Beschreibung
Die Seite 6452-2 „A/C Compressor Controls“ beschreibt die elektrische Funktionsweise der Klimakompressor-Ansteuerung. Erläutert werden der Stromkreis über Sicherung 20, Klimaanlagen-Wahlschalter, Verdampfertemperaturregler, Kältemitteldruckschalter und Temperaturschalter sowie die Funktion der Kupplungsdiode und des Klimaanlagen-Einschaltsignals an das Motronic-Steuergerät. Zusätzlich enthält die Seite Hinweise zur Fehlersuche, eine Symptomtabelle und den ersten Diagnosetest zur Spannungsmessung am Verdampfertemperaturregler.

## Transkription
> [!note]- Transkription (aufklappen)
> 6452-2 – KLIMAKOMPRESSOR-STEUERUNG
>
> STROMKREISFUNKTION
> Wenn sich der Zündschalter in Stellung RUN befindet, wird Batteriespannung über Sicherung 20 an den Klimaanlagen-Wahlschalter angelegt. Wenn der Klimaanlagen-Wahlschalter gedrückt wird, liegt Spannung an Klemme 3 des Verdampfertemperaturreglers an. Der Verdampfertemperaturregler legt Spannung von Klemme 2 über den Kältemitteldruckschalter und den Temperaturschalter an die Kompressorkupplung an.
>
> Der Kältemitteldruckschalter schaltet die Kompressorkupplung ab, wenn der Kältemitteldruck über 435 PSI (30,0 bar) steigt oder wenn ein Kältemittelverlust den Druck unter 21,8 PSI (1,5 bar) abfallen lässt. Der Verdampfertemperaturregler erkennt das Öffnen des Kältemitteldruckschalters an Klemme 5 und schaltet die Ausgangsspannung an der Kompressor-Steuerklemme ab. Der Verdampfertemperaturregler lässt die Kompressorkupplung erst wieder einschalten, wenn die Durchgängigkeit zwischen den Klemmen 5 und 2 wiederhergestellt ist. Der Regler prüft die Durchgängigkeit, indem er alle 8 bis 10 Sekunden kurzzeitig Spannung an die Kompressorsteuerung anlegt. Spannung am Eingang des Klimaanlagen-Kupplungsmonitors zeigt Durchgängigkeit an. Der Verdampfertemperaturregler legt weiterhin Spannung am Ausgang der Kompressorsteuerung an; dadurch wird der Kompressor eingeschaltet.
>
> Der Temperaturschalter öffnet, um die Kompressorbelastung vom Motor zu nehmen, wenn die Motorkühlmitteltemperatur über 226 °F (108 °C) steigt. Der Verdampfertemperaturfühler signalisiert dem Verdampfertemperaturregler, die Kompressorkupplung spannungslos zu schalten, wenn die Verdampfertemperatur so niedrig ist, dass Vereisung auftreten könnte.
>
> KUPPLUNGSDIODE
> Bei jedem Abschalten der Kompressorkupplung induziert das zusammenbrechende Magnetfeld eine Spannung in der Wicklung. Die Kupplungsdiode stellt einen Strompfad für den daraus resultierenden Strom bereit.
>
> EINGANG „KLIMAANLAGE EIN“
> Wenn die Kompressorkupplung eingeschaltet wird, wird Spannung an Klemme 29 des Motronic-Steuergeräts angelegt. Das Motronic-Steuergerät verwendet dieses Signal, um die Leerlaufdrehzahl zu erhöhen und dadurch die erhöhte Motorbelastung durch das Einschalten der Kompressorkupplung auszugleichen.
>
> HINWEISE ZUR FEHLERSUCHE
> • Führen Sie die folgenden Prüfungen vor der Systemdiagnose durch.
> 1. Sicherung 20 durch Sichtprüfung kontrollieren.
> 2. Prüfen, ob der Stecker der Kompressorkupplung fest sitzt.
> • Siehe „Heating and Air Conditioning (6410A-0) System Check“ als Anleitung für den normalen Betrieb.
> • Für diagnostische Prüfungen zu „System Diagnosis“ gehen.
>
> SYSTEMDIAGNOSE
> • Führen Sie die für Ihr Symptom in der nachstehenden Symptomtabelle aufgeführten Prüfungen durch.
> • Die Prüfungen folgen der Symptomtabelle.
>
> SYMPTOMTABELLE
> Kompressorkupplung schaltet nicht ein: A
> Leerlaufdrehzahl des Motors ist nicht hoch genug, wenn die Kompressorkupplung einschaltet (nur Motor 325): D
>
> A: KLIMAANLAGEN-ISOLATIONSPRÜFUNG (TABELLE 1)
> Messung: SPANNUNG
> Messstelle: VERDAMPFERTEMPERATURREGLER (abgeklemmt)
> Bedingungen:
> • Zündschalter: RUN (Motor muss nicht laufen)
> • Klimaanlagen-Wahlschalter: EIN (gedrückt)
>
> Messen zwischen: 3 und Masse
> Sollspannung: Batteriespannung
> Zur Diagnose: Siehe 1
>
> • Wenn die Spannung korrekt ist, mit Tabelle 2 fortfahren.
> 1. Mit Prüfung E fortfahren.


## Fachbegriffe (EN → DE)
| Englisch | Deutsch |
| --- | --- |
| A/C compressor controls | Klimakompressor-Steuerung |
| compressor clutch | Kompressorkupplung |
| ignition switch | Zündschalter |
| A/C select switch | Klimaanlagen-Wahlschalter |
| evaporator temperature regulator | Verdampfertemperaturregler |
| refrigerant pressure switch | Kältemitteldruckschalter |
| temperature switch | Temperaturschalter |
| clutch diode | Kupplungsdiode |
| evaporator temperature sensor | Verdampfertemperaturfühler |
| compressor control terminal | Kompressor-Steuerklemme |
| A/C clutch monitor input | Eingang des Klimaanlagen-Kupplungsmonitors |
| Motronic Control Unit | Motronic-Steuergerät |
| compressor connector | Kompressorstecker |
| system diagnosis | Systemdiagnose |
| symptom table | Symptomtabelle |
| isolation test | Isolationsprüfung |
| battery voltage | Batteriespannung |
| fuse | Sicherung |

---
[[Startseite]] · [[_Übersicht — 1990 BMW M3 Elektrik-Fehlersuche-Handbuch|Abschnittsübersicht]] · [[Glossar]]
