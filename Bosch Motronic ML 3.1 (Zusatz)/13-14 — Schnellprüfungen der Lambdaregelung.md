---
titel: "Schnellprüfungen der Lambdaregelung"
seitencode: "13-14"
sektion: "Bosch Motronic ML 3.1 (Zusatz)"
titel_en: "Lambda Control Quick Tests"
seitentyp: "table"
konfidenz: 0.86
bilddatei: "13-14.png"
tags:
  - zusatzmaterial
  - bosch-motronic
  - sektion/12
  - sektion/13
---

# Schnellprüfungen der Lambdaregelung

> [!info] Bosch Motronic ML 3.1 Diagnosehandbuch (BMW-5006) · Rahmen `13-14`
> Original: **Italienisch** · Typ: **Tabelle** · Konfidenz: **0.86**
> Ergänzendes Material, nicht Teil des BMW-Werkstatthandbuchs. Die **Originalseite ist maßgeblich**.

![[13-14.png]]

*Original title (EN): Lambda Control Quick Tests*

---

## Beschreibung
Die Doppelseite zeigt die Prüfschritte 37 bis 42 für den universellen Prüfadapter ETT 018.01 am BMW-Motronic-System. Die linke Seite enthält eine Tabelle mit Anschlussklemmen, Prüfbedingungen und Sollwerten für Relais, Leerlaufsteller sowie die obere, untere und normale Lambdaregelung. Die rechte Seite erläutert anhand von Abbildungen die Lage und Anschlussbelegung der Lambdasonde.

## Transkription
> [!note]- Transkription (aufklappen)
> Linke Seite (J13):
>
> Liste der Schnellprüfungen für den universellen Prüfadapter ETT 018.01
> Adapterkabel ohne Katalysator: 1 684 463 124 / mit Katalysator: 1 684 463 128
>
> Spalten: Prüfzyklus | Messgeräteanschlüsse V/Ω | Prüfanschlüsse | Prüfung des Bauteils bzw. der Funktion – Anweisungen/Prüfbedingungen | Nennwerte
>
> Prüfzyklus 37 – Klemmen 19 und 16; Prüfanschluss 34,5:
> Wie Prüfzyklus 37, jedoch Messung an der zweiten Wicklung des Stellmotors für die Leerlaufdrehzahl.
> Nennwert: 70–80 %. Signalform wie bei der ersten Wicklung.
>
> Prüfzyklus 38 – Klemmen 20 und 15; Prüfanschluss 31,5:
> Relais für die Tankentlüftung. Zündung einschalten.
> Nennwert: 10–15 V.
>
> Relais für die Tankentlüftung/Ansteuerung: Gang herausnehmen, Motor starten und leicht Gas geben. Drehzahl bis etwa 1700 U/min.
> Nennwert: 10–15 V.
> Bei einer Drehzahl oberhalb dieses Wertes: maximal 4 V.
>
> Prüfung der Funktion der Lambdaregelung (nur Modelle mit Katalysator):
> Ein analoges Voltmeter – oder eine LED mit einem Vorwiderstand von etwa 1 kΩ – an die Diagnosesteckdose anschließen, Klemme 5 zum Pluspol der Batterie. Motor und Katalysator auf Betriebstemperatur bringen, Verbraucher ausschalten. Motor im Leerlauf laufen lassen.
>
> Prüfzyklus 39 – Klemmen 20 und 22; Prüfanschluss an Masse:
> Obere Regelgrenze der Lambdaregelung. Der Prüfadapter legt Klemme 14 an Masse. Achtung: Die Arbeiten schnell durchführen, um den Katalysator zu schützen.
> Nennwert: 10–15 V (LED leuchtet).
>
> Prüfzyklus 40 – Klemmen 20 und 23; Prüfanschluss 24: 8 V +2 V:
> Untere Regelgrenze der Lambdaregelung. Der Prüfadapter legt Klemme 24 an 8 V +2 V.
> Nennwert: weniger als 1 V (LED erlischt; Motorlauf unregelmäßig).
>
> Prüfzyklus 41 – Klemmen 20 und 24; Prüfanschluss 24 an der Lambdasonde:
> Betrieb der Lambdaregelung. Das Adapterkabel verbindet Klemme 24 mit der Lambdasonde. Achtung: Wenn keine Zeigerausschläge erkennbar sind, die Motordrehzahl leicht erhöhen, die CO-Einstellschraube verstellen oder die Lambdasonde ersetzen.
> Nennwert: 0–15 V. Die Anzeige schwingt gleichmäßig zwischen dem unteren und dem oberen Wert; die LED blinkt.
>
> Prüfzyklus 42 – Klemmen 17 und 15; Prüfanschluss 24 offen:
> Steuerwert der Lambdaregelung, Unterbrechung. Der Prüfadapter unterbricht die Verbindung zwischen Klemme 24 und der Lambdasonde. Motor im Leerlauf laufen lassen.
> Nennwert: 10–15 V (LED leuchtet).
>
> Rechte Seite (J14):
>
> Pfeil = Lambdasonde
> 1 = Steckverbindung für die Lambdasonde (abgezogen)
> 2 = Anschlüsse und Heizung der Sonde
> 3 = Signal der Lambdasonde


## Fachbegriffe (EN → DE)
| Englisch | Deutsch |
| --- | --- |
| lambda control | Lambdaregelung |
| oxygen sensor | Lambdasonde |
| test adapter | Prüfadapter |
| diagnostic socket | Diagnosesteckdose |
| idle speed actuator | Leerlaufsteller |
| tank ventilation relay | Tankentlüftungsrelais |
| upper control limit | obere Regelgrenze |
| lower control limit | untere Regelgrenze |
| oxygen sensor signal | Lambdasondensignal |
| sensor heater | Sondenheizung |
| nominal value | Nennwert |
| series resistor | Vorwiderstand |

---
[[Bosch Motronic ML 3.1 (Zusatz)]] · [[Startseite]] · [[Glossar]]
