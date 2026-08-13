---
titel: "LIESMICH"
tags:
  - anleitung
---

# LIESMICH — Anleitung

Willkommen zu deinem deutschen BMW‑Reparaturhandbuch (E30 M3 / 320is) als
durchsuchbares **Obsidian**‑Wissensarchiv. Diese Anleitung erklärt in wenigen
Schritten Installation, Suche und Zoom.

---

## 1. Obsidian installieren

1. Lade **Obsidian** kostenlos von <https://obsidian.md> herunter (Windows, macOS oder Linux).
2. Installiere und starte das Programm.

## 2. Dieses Handbuch öffnen

1. In Obsidian auf **„Ordner als Tresor öffnen“** (Open folder as vault) klicken.
2. **Diesen Projektordner** auswählen (der Ordner, in dem diese Datei `LIESMICH.md` liegt).
3. Falls gefragt wird, ob Plugins von Drittanbietern erlaubt werden sollen: **„Vertrauen“** wählen
   (nötig für den Zoom‑Betrachter, siehe Punkt 5).

Danach die **[[Startseite]]** öffnen — dein Ausgangspunkt zu allen Abschnitten.

## 3. Aufbau

- **[[Startseite]]** — Übersicht aller Abschnitte, technischen Daten und des Glossars.
- Jeder **Abschnitt** ist ein Ordner mit deutschem Namen (z. B. *34 - Bremsen*). Große Abschnitte
  sind in **Unterthemen** gegliedert.
- Jede **Seite** ist eine Notiz, deren Dateiname den **BMW‑Seitencode** und einen **deutschen
  Titel** trägt (z. B. `34-01 — Bremsprüfung auf dem Prüfstand`).
- In jeder Notiz: oben der **Original‑Scan**, darunter **Beschreibung**, aufklappbare
  **Transkription** und eine Tabelle der **Fachbegriffe (EN → DE)**.
- Anzugsdrehmoment-Tabellen und die zugehörigen Ein-/Ausbauseiten verlinken sich
  **gegenseitig** (Abschnitt „Anzugsdrehmomente“ bzw. „Betrifft folgende Arbeitsschritte“) —
  vor einem Arbeitsschritt lohnt sich also ein Blick auf die Seite selbst.
- Der **Original‑Scan liegt im selben Ordner** wie die Notiz — der Tresor ist eigenständig.
- **[[Glossar]]** (nach Anfangsbuchstabe aufgeteilt), **[[Technische-Daten]]**,
  **[[Sonderwerkzeuge]]** (BMW-Spezialwerkzeug-Index) und **[[Sicherheitshinweise]]**
  (Warnhinweise nach Abschnitt) sowie Zusatzmaterial
  (**[[Bosch Motronic ML 3.1 (Zusatz)]]**, **[[Referenzbilder]]**).

> [!info] Wichtig
> Die deutschen Texte wurden automatisch aus den Scans von 1989 erzeugt und dienen der
> **Suche und dem Verständnis**. Maßgeblich ist immer die **Originalseite** (der Scan).

## 4. Suchen (deutsch **und** englisch)

Dieser Tresor bringt eine **eigene, verbesserte Suche** mit (Plugin *Vault Search*,
vorinstalliert und aktiv). Sie ist auf dieses Handbuch abgestimmt und deutlich
treffsicherer als die Standardsuche.

- Taste **`Strg`+`Umschalt`+`F`** (Mac: `Cmd`+`Umschalt`+`F`) öffnet die Handbuch‑Suche.
- Ergebnisse werden **gewichtet** sortiert: zuerst Treffer im **Titel**, dann in den
  **Tags**, dann im **Inhalt**. Die relevanteste Seite steht oben.
- **Tippfehlertolerant:** kleine Vertipper werden automatisch korrigiert; die Suche
  zeigt dann einen Hinweis „meintest du …?“ und liefert trotzdem die passenden Seiten.
- **Sinnverwandte Begriffe** werden mitgesucht: „*Benzin*“, „*Sprit*“ oder „*Auspuff*“
  finden auch die Seiten zu *Kraftstoff* bzw. *Abgasanlage* (auf Basis des Glossars
  und gängiger Alltagsbegriffe).
- **Zusammengesetzte Wörter** werden zerlegt: „*Ventil*“ findet auch
  *Tankentlüftungs**ventil***, „*Kerze*“ findet *Zünd**kerze***. Umgekehrt findet
  „*Kraftstofftank*“ auch Seiten, die nur *Tank* nennen.
- **Umlaute egal:** „*kuehler*“ und „*kühler*“, „*tuer*“ und „*tür*“ liefern das Gleiche.
- Beispiel: **„Bremsscheibe“** oder **„brake disc“** — beides findet die passenden Seiten.
- **Tags mitsuchen:** einfach mit eintippen, z. B. „*typ diagram bremsen*“ oder „*sektion 34*“.
- **Seitencodes und Pfade:** „*16-02*“ findet direkt die passende Seite, auch mit
  Bindestrich im Code.
- Beim ersten Aufruf wird der Suchindex kurz aufgebaut (etwa eine Zehntelsekunde) —
  danach ist die Suche sofort da.

> [!info] Datenquelle für Synonyme
> Die allgemeinsprachlichen Synonyme (z. B. *Sprit* ↔ *Kraftstoff*) stammen zu einem
> Teil aus [OpenThesaurus](https://www.openthesaurus.de) (Daniel Naber u. a.),
> lizenziert unter CC‑BY‑SA 4.0 / LGPL 2.1 — auf dieses Handbuch gefiltert, siehe
> `.obsidian/plugins/vault-search/scripts/build-data.mjs`.

> [!tip] Standardsuche weiterhin verfügbar
> Obsidians eingebaute globale Suche erreichst du weiterhin über die Seitenleiste
> oder die Befehlspalette (**`Strg`+`P`** → „*Suche: In allen Dateien suchen*“).
> Mit **`Strg`+`O`** springst du wie gewohnt über Titel oder BMW‑Code zu einer Seite.

## 5. RAG‑Chat (KI‑gestützte Fragen)

Zusätzlich zur Volltextsuche gibt es einen **KI‑Chat** (Plugin *RAG Chat*), der Fragen in
normaler Sprache beantwortet — z. B. „Anzugsdrehmoment Zylinderkopf?“ oder „welches
Spezialwerkzeug für den Radialwellendichtring?“. Jede Antwort ist in zwei Abschnitte
gegliedert:

1. **Aus dem Werkstatthandbuch** — stützt sich ausschließlich auf tatsächlich gefundene
   Handbuchseiten und **zitiert immer die genaue Seite**. Fehlt eine Angabe im Handbuch, sagt
   der Chat das ausdrücklich, statt eine Zahl zu erfinden.
2. **Zusätzliches Wissen (Allgemeinwissen & Web, nicht werksseitig verifiziert)** — ergänzt
   die Antwort immer um Kontext, Praxistipps und aktuelle Web‑Ergebnisse (Google Search), klar
   getrennt vom Werksinhalt. Bei sicherheitsrelevanten Werten (Drehmomente, Toleranzen) hat die
   Werksangabe aus Abschnitt 1 immer Vorrang vor ungeprüften Zusatzinfos.

- **Offline‑first für das Handbuch selbst:** Der Such‑Index (ein Textindex
  `rag-index-text.orama.msp` plus mehrere Vektor‑Shards `rag-index-vectors-*.orama.msp`, alle
  im Plugin‑Ordner) ist bereits fertig gebaut und im Repository enthalten. Die Web‑Suche
  (Abschnitt 2) benötigt dagegen eine aktive Internetverbindung.
- **Öffnen:** Symbol in der linken Randleiste, oder Befehlspalette (**`Strg`+`P`**) →
  „*RAG: Frage stellen*“.
- **Merkt sich das Gespräch:** Rückfragen wie „und was ist mit dem S14?“ beziehen sich auf
  die vorherige Antwort — der gesamte bisherige Chatverlauf wird bei jeder neuen Frage
  mitgeschickt.
- **Sucht bei Bedarf selbstständig weiter:** Der Chat entscheidet selbst, ob eine erste Suche
  reicht oder ob er erneut im Handbuch sucht, die tippfehler‑/synonymtolerante **Handbuchsuche**
  (Plugin *Vault Search*) nutzt, eine bestimmte Seite vollständig nachlädt, das Web durchsucht —
  oder **dich um eine kurze Rückfrage bittet** (z. B. bei mehrdeutigen Fragen), bevor er
  antwortet. Dafür zeigt er kurze Status‑Hinweise wie „*Runde 2/4: durchsuche Handbuch nach
  „…“ …*“. Eine Rückfrage erscheint als eigene, farblich hervorgehobene Chat‑Nachricht — einfach
  direkt darunter antworten, der Chat setzt dieselbe Suche fort. Pro Frage gibt es ein festes
  Limit an Suchrunden (Einstellungen → RAG Chat → „*Max. Werkzeug‑Runden*“, Standard 4), danach
  antwortet der Chat direkt mit dem, was er bis dahin gefunden hat.
- **Ist dieses Plugin deaktiviert (Vault Search):** funktioniert der Chat trotzdem, findet dann
  aber ggf. weniger im Handbuch selbst.
- **API‑Schlüssel erforderlich** (unter Einstellungen → RAG Chat einzutragen):
  - **Google‑Schlüssel** (`GEMINI_API_KEY`) — wird sowohl für die Frage‑Embeddings als auch
    für die eigentliche Antwortgenerierung (`gemini-3.6-flash`) verwendet.
  - Der Schlüssel bleibt **lokal** in den Obsidian‑Einstellungen (`data.json`) dieses Tresors
    gespeichert (verschlüsselt), niemals im Repository.
- **Index neu bauen** (nur nötig, wenn sich Notizen/Scans ändern): im Ordner `.pipeline/rag/`
  — Voraussetzung: `uv` (Python) und `node`/`npm` sind installiert, sowie eine `.env`‑Datei im
  Projekt‑Root mit `GEMINI_API_KEY=...`.
  ```
  cd .pipeline/rag
  uv venv && uv pip install -r requirements.txt
  .venv/bin/python3 build_rag_index.py --pilot 20   # Kostencheck (paar Cent) vor dem Vollbau
  .venv/bin/python3 build_rag_index.py              # Vollbau (~$0.35-0.40, einmalig)
  cd build && npm install && node build_orama.mjs   # baut Textindex + Vektor-Shards im Plugin-Ordner
  ```
  Die einmaligen Embedding‑Kosten sowie die spätere Chat‑Nutzung laufen beide über den
  Google‑Schlüssel.

## 6. Zoom / Lupe für die Scans

- **Einfachster Weg:** im Lesemodus auf ein Bild klicken — Obsidian zeigt es vergrößert.
- **Komfortabler Zoom (empfohlen):** Das Plugin **Image Toolkit** ist vorkonfiguriert. Aktivierung:
  1. **Einstellungen** → **Community‑Plugins**.
  2. Falls „Eingeschränkter Modus“ aktiv ist: **deaktivieren**.
  3. **Durchsuchen** → **„Image Toolkit“** → **Installieren** → **Aktivieren**.
  4. Fertig — ein Klick auf ein Bild öffnet den Zoom‑Betrachter (Ziehen zum Verschieben, Mausrad zum Zoomen).

## 7. Tipps

- Der Tresor ist **eigenständig**: Scans und Notizen liegen zusammen in den Abschnittsordnern.
  Du kannst den **ganzen Projektordner** kopieren oder auf einen USB‑Stick ziehen — es funktioniert überall.
- Nichts kann kaputtgehen: Es sind nur Text‑ und Bilddateien. Zum Nur‑Lesen einfach nichts ändern.

Viel Erfolg an der Werkstatt! 🔧

[[Startseite]]
