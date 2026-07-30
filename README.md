# Liquid Sky Weather

A "liquid glass" weather app built with React + Tailwind, using live data from
[Open-Meteo](https://open-meteo.com) (no API key required).

## Run it in VS Code

1. Unzip this folder and open it in VS Code.
2. Open a terminal (``Ctrl+` `` / `` Cmd+` ``) and install dependencies:

   ```bash
   npm install
   ```

3. Start the dev server:

   ```bash
   npm run dev
   ```

4. Open the printed local URL (usually `http://localhost:5173`) in your browser.

## Build for production

```bash
npm run build
npm run preview
```

## Project structure

```
liquid-sky-weather/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.jsx      # React entry point
    ├── index.css     # Tailwind imports
    └── App.jsx        # The weather app component
```

## Notes

- Search for any city — it uses Open-Meteo's free geocoding endpoint.
- Defaults to Minneapolis, MN on first load.
- No API keys, accounts, or environment variables needed.
