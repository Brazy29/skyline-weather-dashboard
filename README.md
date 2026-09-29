# Brazy Skyline Weather Dashboard

A responsive weather dashboard built with HTML, CSS, and vanilla JavaScript. It retrieves live location and forecast data from Open-Meteo and does not require an API key.

## Run Locally

Because the app uses browser APIs and network requests, serve the project over localhost instead of opening `index.html` directly.

With Node.js and npm installed, run this command from the project folder:

```bash
npx --yes http-server . -p 4173
```

Then open [http://127.0.0.1:4173](http://127.0.0.1:4173). Alternatively, open the project in VS Code and use the Live Server extension.

## Features

- Search cities with Open-Meteo geocoding and select from matching locations.
- View live current conditions, a five-day forecast, a 12-hour outlook, and weather statistics.
- Explore temperature and humidity trends in the chart.
- Switch between Celsius and Fahrenheit without making another weather request.
- Refresh conditions or request weather for the current location. Geolocation requires browser permission.
- Save favorite locations and revisit recent searches; these and the temperature preference are stored in local storage.
- Use the responsive sidebar and horizontally scrollable forecast strips on smaller screens.
- Weather conditions and interface controls use inline SVG icons.

## Project Files

```text
index.html
css/style.css
js/script.js
design/
  design.jpeg
  desktop-view.png
  tablet-view.png
  mobile-view.png
```

## Data Sources

- [Open-Meteo Forecast API](https://open-meteo.com/en/docs)
- [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api)

The dashboard needs an internet connection to load live weather. The font family is loaded from Google Fonts; system fallbacks are used if it is unavailable.
