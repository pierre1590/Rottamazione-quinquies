# 🧾 Rottamazione Quinquies Calculator

Un'applicazione web progressiva (PWA) moderna per calcolare il piano di ammortamento della "Rottamazione Quinquies"  con interessi al 3% e rateizzazione fino a 54 rate (9 anni).

🔗 **Live Demo:** [Inserisci qui il link Vercel una volta deployato]

![Screenshot App](public/screenshot-placeholder.png) <!-- (Opzionale: metti uno screen in public) -->

## ✨ Caratteristiche Principali

- 📱 **Mobile First & Glassmorphism**: Design moderno stile iOS con effetti "liquid glass" e blur.
- ⚡ **PWA Offline-Ready**: Funziona perfettamente senza internet una volta installata (Service Worker attivo).
- 🧮 **Algoritmo Finanziario Preciso**:
  - **Rata 1 (31 Luglio)**: Solo capitale (senza interessi).
  - **Rate 2-N (Bimestrali)**: Rata costante alla francese (capitale + interessi 3% annuo).
  - **Vincolo 100€**: Blocca il calcolo se la rata scende sotto il minimo di legge.
- 📄 **Export PDF & Stampa**: Genera un documento PDF professionale con tabella ammortamento completa.
- ⌨️ **UX Ottimizzata**: Input numerici smart per tastierini mobili, selezione rapida "Max Rate".

## 🛠️ Tecnologie Utilizzate

- **React 18** + **TypeScript** (Vite)
- **Tailwind CSS v4** (Stili utility-first)
- **Vite PWA Plugin** (Gestione offline e installazione)
- **jsPDF** + **AutoTable** (Generazione PDF client-side)

## 🚀 Installazione Locale

Vuoi provare il progetto sul tuo computer?

1.  **Clona la repository**:
    ```bash
    git clone https://github.com/pierre1590/rottamazione-pwa.git
    cd rottamazione-pwa
    ```

2.  **Installa le dipendenze**:
    ```bash
    npm install
    ```

3.  **Avvia il server di sviluppo**:
    ```bash
    npm run dev
    ```
    Visita `http://localhost:####`.

## 📱 Come Installare su Smartphone (PWA)

1.  Apri il sito dal browser (Safari su iOS, Chrome su Android).
2.  Tocca il tasto **Condividi** (iOS) o il **Menu** (Android).
3.  Seleziona **"Aggiungi alla schermata Home"**.
4.  L'app apparirà come un'icona nativa e funzionerà anche offline!

## 📦 Build per Produzione

Per creare la versione ottimizzata da caricare su Vercel/Netlify:

```bash
npm run build
npm run preview  # Per testare la build (Service Worker attivo)
```