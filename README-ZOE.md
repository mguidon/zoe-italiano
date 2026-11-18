# 🇮🇹 Zoe lernt Italienisch — So kommst du an die App

Drei Möglichkeiten, dem Kind die App zugänglich zu machen:

---

## Option 1: Ordner kopieren (am einfachsten) 📁

Einfach den ganzen Ordner `italo` auf den PC der Tochter kopieren
(USB-Stick, OneDrive, E-Mail, ...).

Dann dort **`index.html` doppelklicken** → öffnet sich im Browser.

> ⚠️ Wichtig: Auf dem PC der Tochter am besten **Microsoft Edge** benutzen —
> nur dort gibt es die echten italienischen Stimmen **Elsa** (Anna) und
> **Diego** (Luca) ohne Installation.
>
> Falls Edge die Stimmen nicht zeigt:
> Windows-Einstellungen → Zeit und Sprache → Sprache hinzufügen → **Italienisch** →
> Optionen → Komponenten **"Text_to_Speech"** hinzufügen.

---

## Option 2: Kostenlos im Web veröffentlichen 🌍 (empfohlen)

Inhalt: Die App besteht nur aus diesen 4 Dateien:
`index.html`, `style.css`, `app.js`, `topics.js`

**Netlify Drop (ohne Konto-Aufwand, in 2 Minuten):**

1. Ordner `italo` öffnen — fertige ZIP: [`zoe-italiano.zip`](zoe-italiano.zip) hochladen
2. Auf https://app.netlify.com/drop die ZIP-Datei (oder den Ordner) hineinziehen
3. Netlify gibt eine Adresse wie `https://zoe-italiano-abc123.netlify.app` —
   diese Adresse der Tochter geben (in **Edge** öffnen!)
4. Wenn du later etwas änderst (neues Thema etc.): einfach die neuen Dateien
   bei Netlify erneut hineinziehen.

**Alternative:** GitHub Pages oder Azure Static Web Apps — geht auch, ist aber
mehr Einrichtung.

---

## Option 3: Über dein WLAN (Dein PC als Server) 🏠

1. Auf **deinem** PC doppelt auf **`Start-Server.bat`** klicken
   (Fenster offen lassen!)
2. Das Fenster zeigt deine IP-Adresse, z. B. `192.168.1.20`
3. Auf dem PC der Tochter (gleicher Netzwerk!) im Browser öffnen:
   `http://192.168.1.20:8080`

> ⚠️ Windows fragt ggf. beim ersten Start nach Firewall-Erlaubnis → "Zulassen" klicken.
> Funktioniert nur, solange dein PC an ist und im selben WLAN.

---

## 📝 Neue Themen hinzufügen

Einfach in `topics.js` einen neuen Block nach dem Vorbild der bestehenden
Themen ergänzen — die App zeigt ihn automatisch auf der Themenseite.
Oder sag mir Bescheid, ich mache das.
