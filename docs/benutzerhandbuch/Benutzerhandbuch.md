---
title: ChatBot Admin – Benutzerhandbuch
category: Administration
folder: Benutzerhandbuch
version: 1.0
---

# ChatBot Admin – Benutzerhandbuch

## Überblick

**ChatBot Admin** ist das zentrale Verwaltungs-Dashboard für die Chatbots
(„Widgets") der Justus-Liebig-Universität Gießen. Über die Oberfläche
konfigurieren, verwalten und überwachen Sie alle Chatbot-Widgets, die
anschließend auf Webseiten und Portalen der Universität (z. B. im Plone-CMS)
eingebettet werden.

Die Anwendung erfüllt zwei Aufgaben:

1. **Verwaltung** – Sie erstellen und bearbeiten Widgets, legen deren Verhalten
   und Aussehen fest und behalten Gespräche sowie Nutzungszahlen im Blick.
2. **Einbettung** – Für jedes Widget erhalten Sie einen fertigen
   Einbettungscode und eine Direkt-URL, mit denen der Chatbot auf einer Seite
   erscheint.

Dieses Handbuch richtet sich an Redakteurinnen und Redakteure sowie an
Administratorinnen und Administratoren, die Chatbots betreuen. Es sind keine
Programmierkenntnisse erforderlich.

## Anwendungsfälle

* **Neuen Chatbot bereitstellen** – Ein Widget für eine bestimmte Webseite oder
  ein Portal anlegen und mit einer Wissensdatenbank (Knowledge-Base) verknüpfen.
* **Verhalten anpassen** – Den Einstiegstext, Antwortregeln und
  Gesprächsvorlagen festlegen, damit der Chatbot passend antwortet.
* **Aussehen anpassen** – Titel, Begrüßung, Farbe, Symbol und Position des
  Chat-Fensters an das Design der Zielseite anpassen.
* **Widget einbetten** – Den generierten Code in das CMS (Plone) übernehmen und
  die korrekte Anbindung prüfen.
* **Gespräche einsehen** – Vergangene Konversationen nachlesen und – bei Bedarf –
  manuell beantworten.
* **Nutzung auswerten** – Über die Statistik-Seite Gesprächsvolumen,
  Nutzerzahlen, Antwortzeiten und Bewertungen verfolgen.

## Aufbau der Oberfläche

Nach der Anmeldung besteht die Anwendung aus einem festen Navigationsbereich und
dem jeweils gewählten Arbeitsbereich.

* **Seitenleiste (Desktop, linke Seite)** – Enthält die Hauptnavigation:
    * **Widgets** – Öffnet die Übersicht aller Widgets. Aufgeklappt zeigt der
      Eintrag zusätzlich jedes einzelne Widget als Direktlink zu dessen
      Gesprächen.
    * **Statistiken** – Öffnet die seitenweite Nutzungsauswertung.
* **Untere Navigationsleiste (Mobilgeräte / schmale Fenster)** – Ersetzt die
  Seitenleiste und bietet dieselben Ziele „Widgets" und „Statistiken".
* **Benutzermenü (unten in der Seitenleiste)** – Zeigt Ihren Namen und Ihre
  Rolle. Über einen Klick öffnen sich:
    * **Mock-Widget-Portal** (nur für Administratoren) – Eine Testumgebung, die
      die Einbettung eines Widgets in eine externe Seite nachstellt.
    * **Abmelden** – Beendet die Sitzung.
* **Design-Umschalter** – Ein Segment-Schalter mit drei Optionen:
  **Helles Design**, **Systemdesign** (folgt der Einstellung Ihres
  Betriebssystems) und **Dunkles Design**.

## Funktion starten

### Anmelden

1. Öffnen Sie die Adresse des ChatBot Admin in Ihrem Browser.
2. Sie werden auf die **Anmeldeseite** geleitet. Je nach Konfiguration erscheint
   dort entweder:
    * eine Schaltfläche **„Anmelden mit …"** für die zentrale Single-Sign-On-
      Anmeldung (SSO) der Universität, **oder**
    * ein Formular mit **Benutzername** und **Passwort**.
3. Melden Sie sich mit Ihren Zugangsdaten an.
4. Nach erfolgreicher Anmeldung öffnet sich automatisch die **Widget-Übersicht**
   („Dashboard Übersicht").

### Ein Widget öffnen oder erstellen

1. In der Widget-Übersicht sehen Sie alle vorhandenen Widgets als Karten.
2. Jede Karte bietet drei Schaltflächen:
    * **Einstellungen** – Widget konfigurieren.
    * **Chatbox** – Gespräche dieses Widgets ansehen.
    * **Einbetten** – Einbettungscode und Prüfung öffnen.
3. Um ein neues Widget anzulegen, klicken Sie auf die Karte
   **„Neues Widget"** (mit dem Plus-Symbol) am Ende der Liste.

## Optionen und Einstellungen

Die Anwendung gliedert sich in mehrere Arbeitsbereiche. Nachfolgend sind alle
Bereiche und ihre Einstellungen im Detail beschrieben.

### 1. Widget-Übersicht (Dashboard)

Die Startseite listet alle Widgets als Karten. Jede Karte zeigt Symbol,
Name, verknüpfte Knowledge-Base, das Routing sowie die Kennzahlen
**Gespräche** und **Bewertung** und einen Status (**Aktiv** oder **Pause**).

Über die **Werkzeugleiste** am oberen Rand steuern Sie die Anzeige:

* **Suche** – Filtert die Widgets nach ihrem Namen.
* **Filter** – Beschränkt die Anzeige auf **Alle**, **Aktiv** oder **Pause**.
* **Sortieren** – Ordnet die Karten nach **Name (A–Z)**, **Gespräche** oder
  **Bewertung**.

### 2. Widget konfigurieren

Öffnen Sie ein Widget über **Einstellungen** (oder legen Sie ein neues an). Die
Konfigurationsseite ist zweispaltig aufgebaut. Oben finden Sie den Kopfbereich
mit Widget-Name, Status-Anzeige und den Schaltflächen **Abbrechen**,
**Speichern** (bzw. **Erstellen**) sowie – bei bestehenden Widgets –
**Widget aktivieren / deaktivieren**.

> **Wichtig:** Änderungen werden erst wirksam, wenn Sie auf **Speichern**
> klicken. Der Button zeigt danach kurz **„Gespeichert"** an.

#### Grundeinstellungen

* **Name** *(Pflichtfeld)* – Der interne Name des Widgets. Solange der
  Anzeige-Titel nicht manuell geändert wurde, übernimmt er automatisch den
  Namen.
* **Knowledge-Base-ID** *(Pflichtfeld)* – Die Wissensdatenbank, aus der der
  Chatbot seine Antworten bezieht. Über die Auswahl finden Sie die verfügbaren
  Knowledge-Bases.
* **Routing** – Bestimmt die Zugriffsebene der verwendeten Wissensquelle:
  **public**, **internal** oder **private**.

Bei bestehenden Widgets sind die Grundeinstellungen eingeklappt und lassen sich
über **Bearbeiten** ausklappen.

#### Gesprächseinstellungen

* **Start-Prompt** – Die grundlegende Anweisung an den Chatbot (System-Prompt).
  Hier legen Sie fest, wie sich der Bot verhalten und in welchem Ton er antworten
  soll.
* **Vorlagen** *(max. 4)* – Vorgeschlagene Fragen, die den Nutzenden als
  anklickbare „Chips" im Chat angezeigt werden. Ohne Vorlagen erscheinen keine
  Vorschläge. Über **Vorlage hinzufügen** ergänzen, über das Papierkorb-Symbol
  entfernen Sie einen Eintrag.
* **Regeln** – Zusätzliche Verhaltensregeln, die zusammen mit dem Start-Prompt
  an den Chatbot übergeben werden. Jede Regel lässt sich einzeln **aktivieren**
  oder **deaktivieren** (Häkchen) und entfernen. Deaktivierte Regeln werden
  durchgestrichen dargestellt und nicht angewendet.
* **Gesprächsverlauf speichern** – Speichert Konversationen zur späteren
  Auswertung.
* **Feedback-Schaltflächen** – Blendet unter jeder Antwort Symbole für
  „Daumen hoch/runter" ein, damit Nutzende Antworten bewerten können.

#### Rate Limits (Begrenzungen)

Über Schieberegler begrenzen Sie die Nutzung, um Missbrauch und Überlastung zu
vermeiden:

* **Anfragen pro Minute** – Bereich 1 bis 60.
* **Anfragen pro Nutzer/Tag** – Bereich 1 bis 500.
* **Max. Tokens pro Antwort** – Bereich 50 bis 2000. Bestimmt die maximale Länge
  einer Antwort. Ist der Wert zu niedrig, kann eine Antwort abgeschnitten werden.

#### Erscheinungsbild

* **Titel** – Die Überschrift im Kopf des Chat-Fensters.
* **Begrüßungstext** – Die erste Nachricht, die der Bot beim Öffnen zeigt.
* **Akzentfarbe** – Die Hauptfarbe des Widgets (Farbwähler oder Hex-Wert, z. B.
  `#0052ff`). Sie färbt Kopfzeile, Schaltflächen und Nutzer-Nachrichten.
* **Position** – Platzierung des Chat-Buttons auf der Seite: **Unten rechts**,
  **Unten links**, **Oben rechts** oder **Oben links**.
* **Icon** – Das Symbol des Chat-Buttons. Wählen Sie aus den angebotenen
  Symbolen (z. B. Sprechblase, Kopfhörer, Globus).

#### Output – Widget-Code

* **Einbettungscode** – Der fertige HTML-Code zum Einfügen in eine Seite. Über
  **Kopieren** übernehmen Sie ihn in die Zwischenablage.
* **Direkte URL** – Ein Link, unter dem der Chatbot als eigenständige Vollseite
  erreichbar ist. Über die Symbole lässt sich die URL kopieren oder in einem
  neuen Tab öffnen.

#### Vorschau

Rechts unten zeigt eine **Live-Vorschau**, wie das Widget aussieht und sich
verhält. Klicken Sie auf den Chat-Button, um das Fenster zu öffnen. Sie können
echte Nachrichten eingeben und die Antworten des Chatbots testen; Titel,
Begrüßung, Farbe, Position, Vorlagen und Feedback-Buttons werden sofort
übernommen. Über **Zurücksetzen** starten Sie die Vorschau neu.

> Für den Antworttest muss eine gültige **Knowledge-Base-ID** hinterlegt sein.

### 3. Einbetten

Der Bereich **Einbetten** führt in drei Schritten durch die Einbindung in das
Plone-CMS:

1. **Globaler Script-Loader** – Ein Code-Ausschnitt, der **einmalig** und global
   im Plone-Theme (im `<head>`) eingebunden wird – nicht pro Seite.
2. **Widget-Platzhalter pro Seite** – Ein Code-Ausschnitt, der im Inhalt jeder
   Seite eingefügt wird, auf der das Widget erscheinen soll. Zusätzlich steht die
   **Direkte URL** zum Kopieren oder Öffnen bereit.
3. **Widget testen** – Eine automatische Prüfung mit vier Statusanzeigen:
    * **Widget-Status** – aktiv oder pausiert.
    * **Knowledge-Base** – ob eine gültige, existierende Wissensdatenbank
      zugewiesen ist.
    * **Backend erreichbar** – ob der Dienst antwortet.
    * **Testseite erreichbar** – ob die Standalone-Seite ausgeliefert wird.

   Über **Testseite öffnen** rufen Sie eine Testumgebung auf, die die echte
   Einbettung nachstellt.

Alle Code-Blöcke lassen sich mit **Code kopieren** übernehmen.

### 4. Gespräche (Chatbox)

Über **Chatbox** (auf der Widget-Karte oder in der Seitenleiste) öffnen Sie die
Gesprächsübersicht eines Widgets. Sie enthält:

* Eine Kopfzeile mit dem Widget-Namen und der Zahl der heutigen Gespräche.
* Kennzahlen: **Gespräche**, **Offen**, **Ø Antwortzeit**, **Bewertung**.
* **Zuletzt aktiv** – Eine durchsuchbare Liste der jüngsten Gespräche. Ein Klick
  öffnet das jeweilige Gespräch.
* **Top-Fragen** – Die häufigsten Fragen dieses Widgets als Balkenliste.

**Gesprächsdetail:** Im geöffneten Gespräch sehen Sie in der Mitte den
kompletten Nachrichtenverlauf und ein Eingabefeld, über das Sie als
Administrator manuell antworten können (Senden mit dem Button oder
`Strg`/`Cmd` + `Enter`). Rechts fasst die **Nutzerinfo** Details zusammen:
Online-Status, Kanal, Sprache, Quelle, erste Sitzung, eine **Bewertung** mit
Verteilung sowie das aktive **KB-Routing**.

### 5. Statistiken

Die Statistik-Seite bietet eine seitenweite Auswertung über alle Widgets:

* **Kennzahlen-Karten** – Gespräche gesamt, eindeutige Nutzer, durchschnittliche
  Antwortzeit und durchschnittliche Bewertung, jeweils mit Trend zum Vormonat.
* **Gespräche über Zeit** – Ein Balkendiagramm, umschaltbar zwischen **Tag**,
  **Woche** und **Monat**.
* **Häufigste Fragen** – Die Top-Nutzeranfragen, durchsuchbar über das Suchfeld
  in der Kopfzeile.
* **Widget-Verteilung** – Ein Ringdiagramm, das die Gespräche nach Widget
  aufteilt.
* **Zeitraum-Karten** – Zusammenfassungen für **Heute**, **Diese Woche** und
  **Diesen Monat**.

## Hinweise

* **Pflichtfelder beim Erstellen:** Ein neues Widget kann erst gespeichert
  werden, wenn **Name** und **Knowledge-Base-ID** ausgefüllt sind.
* **Speichern nicht vergessen:** Änderungen an der Konfiguration werden erst nach
  Klick auf **Speichern** übernommen. Der Status (aktivieren/deaktivieren) wird
  bei bestehenden Widgets dagegen sofort gespeichert.
* **Pausierte Widgets:** Ein deaktiviertes Widget zeigt Besuchenden den Hinweis
  „Dieses Widget ist derzeit pausiert" und nimmt keine Nachrichten an.
* **Vorschau benötigt Knowledge-Base:** Ohne gültige Knowledge-Base-ID kann die
  Vorschau keine echten Antworten erzeugen.
* **Beispieldaten:** Die Ansichten **Statistiken** und die Gesprächslisten
  zeigen derzeit teilweise Beispieldaten zur Veranschaulichung. Die tatsächlichen
  Zahlen hängen vom angebundenen Backend ab.
* **Token-Limit:** Bricht eine Antwort unerwartet ab, erhöhen Sie den Wert
  **Max. Tokens pro Antwort**.

## Erweiterte Einstellungen

* **Routing-Ebenen** – Über **public**, **internal** und **private** steuern Sie,
  welche Wissensquelle bzw. Zugriffsebene ein Widget nutzt. Wählen Sie die
  Ebene passend zur Zielgruppe der Seite.
* **Regeln und Start-Prompt** – Der aktive Start-Prompt und alle **aktivierten**
  Regeln werden gemeinsam zu einer Gesamtanweisung für den Chatbot
  zusammengeführt. So lassen sich einzelne Vorgaben gezielt an- und abschalten,
  ohne den Grundtext zu ändern.
* **Standalone-Seite (`/w/<Widget-ID>`)** – Jedes Widget ist auch als
  öffentliche Vollseite erreichbar (Direkte URL). Sie eignet sich zum Teilen
  eines Chatbots ohne Einbettung in eine bestehende Seite.
* **Design-Auswahl** – Über den Design-Umschalter wählen Sie zwischen hellem,
  dunklem und systemgesteuertem Erscheinungsbild der Verwaltungsoberfläche. Diese
  Einstellung betrifft nur das Admin-Dashboard, nicht die eingebetteten Widgets.
* **Rollen** – Ihre Rolle (**user**, **admin** oder **superadmin**) bestimmt den
  Funktionsumfang. Nur Administratoren sehen z. B. den Zugang zum
  **Mock-Widget-Portal** im Benutzermenü.

## Empfehlung

Für typische Szenarien hat sich folgendes Vorgehen bewährt:

1. **Zuerst die Grundeinstellungen** ausfüllen (Name, Knowledge-Base-ID, Routing)
   und speichern.
2. **Verhalten festlegen:** Einen klaren, freundlichen Start-Prompt formulieren,
   zwei bis vier hilfreiche Vorlagen anlegen und nur die wirklich benötigten
   Regeln aktivieren.
3. **Rate Limits belassen:** Die Standardwerte sind für den Regelbetrieb
   sinnvoll. Erhöhen Sie **Max. Tokens pro Antwort** nur, wenn Antworten
   sichtbar abgeschnitten werden.
4. **Vor dem Veröffentlichen testen:** Nutzen Sie die **Vorschau** und die
   Prüfschritte unter **Einbetten**, bis alle vier Statusanzeigen grün sind.
5. **Erst dann einbetten** und das Widget aktiv schalten.

Lassen Sie **Feedback-Schaltflächen** aktiviert, um kontinuierlich Rückmeldungen
zur Antwortqualität zu erhalten, und prüfen Sie regelmäßig die **Statistiken**,
um Bedarf und Nutzung im Blick zu behalten.
