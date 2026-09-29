const API_BASE = "https://api.open-meteo.com/v1/forecast";
const GEOCODING_BASE = "https://geocoding-api.open-meteo.com/v1/search";
const STORAGE_KEYS = {
  unit: "skyline-unit",
  recent: "skyline-recent",
  favorites: "skyline-favorites",
  place: "skyline-place",
};

const elements = {
  searchForm: document.querySelector("#search-form"),
  searchInput: document.querySelector("#city-search"),
  searchResults: document.querySelector("#search-results"),
  currentSection: document.querySelector(".current-weather"),
  city: document.querySelector("#current-city"),
  country: document.querySelector("#current-country"),
  date: document.querySelector("#current-date"),
  updated: document.querySelector("#last-updated"),
  icon: document.querySelector("#current-icon"),
  temperature: document.querySelector("#current-temperature"),
  condition: document.querySelector("#current-condition"),
  feelsLike: document.querySelector("#feels-like"),
  humidity: document.querySelector("#current-humidity"),
  wind: document.querySelector("#current-wind"),
  forecast: document.querySelector("#forecast-grid"),
  hourly: document.querySelector("#hourly-list"),
  stats: document.querySelector("#stats-grid"),
  chart: document.querySelector("#trend-chart"),
  chartEmpty: document.querySelector(".chart-empty"),
  forecastLocation: document.querySelector("#forecast-location"),
  favoriteButton: document.querySelector("#favorite-button"),
  favoriteLabel: document.querySelector("#favorite-label"),
  favorites: document.querySelector("#favorites-list"),
  recent: document.querySelector("#recent-list"),
  clearRecent: document.querySelector("#clear-recent"),
  notice: document.querySelector("#notice"),
  noticeText: document.querySelector("#notice-text"),
  retryButton: document.querySelector("#retry-button"),
  noticeClose: document.querySelector("#notice-close"),
  refreshButton: document.querySelector("#refresh-button"),
  locationButton: document.querySelector("#location-button"),
  menuButton: document.querySelector("#menu-button"),
  sidebar: document.querySelector("#sidebar"),
  sidebarCloseButton: document.querySelector("#sidebar-close-button"),
  menuScrim: document.querySelector("#menu-scrim"),
};

const state = {
  weather: null,
  place: readStorage(STORAGE_KEYS.place, null),
  unit: readStorage(STORAGE_KEYS.unit, "celsius"),
  metric: "temperature",
  favorites: readStorage(STORAGE_KEYS.favorites, []),
  recent: readStorage(STORAGE_KEYS.recent, []),
  weatherRequest: 0,
  searchRequest: 0,
  retry: null,
};

const weatherGroups = [
  { codes: [0], label: "Clear Sky", dayIcon: "sun", nightIcon: "moon" },
  {
    codes: [1, 2, 3],
    label: "Partly Cloudy",
    dayIcon: "partly-cloudy",
    nightIcon: "cloud",
  },
  { codes: [45, 48], label: "Fog", dayIcon: "fog", nightIcon: "fog" },
  {
    codes: [51, 53, 55, 56, 57],
    label: "Drizzle",
    dayIcon: "drizzle",
    nightIcon: "drizzle",
  },
  {
    codes: [61, 63, 65, 66, 67],
    label: "Rain",
    dayIcon: "rain",
    nightIcon: "rain",
  },
  {
    codes: [71, 73, 75, 77],
    label: "Snow",
    dayIcon: "snow",
    nightIcon: "snow",
  },
  {
    codes: [80, 81, 82],
    label: "Rain Showers",
    dayIcon: "showers",
    nightIcon: "showers",
  },
  {
    codes: [85, 86],
    label: "Snow Showers",
    dayIcon: "snow",
    nightIcon: "snow",
  },
  {
    codes: [95, 96, 99],
    label: "Thunderstorm",
    dayIcon: "thunderstorm",
    nightIcon: "thunderstorm",
  },
];

const iconMarkup = {
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>',
  moon: '<path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z"/>',
  "partly-cloudy":
    '<circle cx="8" cy="8" r="3"/><path d="M8 2v1m0 10v1M2 8h1m10 0h1m-10.2-4.2.7.7m7 7 .7.7m-.7-8.4-.7.7m-7 7-.7.7"/><path d="M6 19h12a3 3 0 0 0 .2-6 6 6 0 0 0-11.1 1A2.5 2.5 0 0 0 6 19Z"/>',
  cloud:
    '<path d="M5 19h13a4 4 0 0 0 .2-8A7 7 0 0 0 5 12a3.5 3.5 0 0 0 0 7Z"/>',
  fog: '<path d="M5 12h13a3 3 0 0 0 .2-6A5.5 5.5 0 0 0 7 7.5 2.5 2.5 0 0 0 5 12Zm-2 4h18M5 20h14"/>',
  drizzle:
    '<path d="M5 14h13a3 3 0 0 0 .2-6A5.5 5.5 0 0 0 7 9.5 2.5 2.5 0 0 0 5 14Z"/><path d="m9 17-.5 1m5.5-1-.5 1m5.5-1-.5 1"/>',
  rain: '<path d="M5 13h13a3 3 0 0 0 .2-6A5.5 5.5 0 0 0 7 8.5 2.5 2.5 0 0 0 5 13Z"/><path d="m8 16-1 2m6-2-1 2m6-2-1 2"/>',
  showers:
    '<path d="M5 13h13a3 3 0 0 0 .2-6A5.5 5.5 0 0 0 7 8.5 2.5 2.5 0 0 0 5 13Z"/><path d="m9 16-.5 1m5.5-1-.5 1m5.5-1-.5 1m-8 3-.5 1m5.5-1-.5 1"/>',
  snow: '<path d="M5 13h13a3 3 0 0 0 .2-6A5.5 5.5 0 0 0 7 8.5 2.5 2.5 0 0 0 5 13Z"/><path d="M8 17h.01M13 18h.01M18 17h.01M10 21h.01M16 21h.01"/>',
  thunderstorm:
    '<path d="M5 13h13a3 3 0 0 0 .2-6A5.5 5.5 0 0 0 7 8.5 2.5 2.5 0 0 0 5 13Z"/><path d="m13 14-4 5h3l-1 4 5-6h-3l1-3"/>',
  dashboard:
    '<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="5" rx="1"/><rect x="13" y="10" width="8" height="11" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/>',
  calendar:
    '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  pin: '<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"/>',
  close: '<path d="m18 6-12 12M6 6l12 12"/>',
  refresh:
    '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.6 9a7 7 0 0 1 11.6-2L20 12M4 12l2.8 5a7 7 0 0 0 11.6-2"/>',
  wind: '<path d="M3 8h12a3 3 0 1 0-3-3M2 12h17a3 3 0 1 1-3 3M4 16h7a3 3 0 1 1-3 3"/>',
  compass:
    '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z"/>',
  gauge: '<path d="M20.5 15a9 9 0 1 0-17 0"/><path d="m12 13 4-4M5 18h14"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  droplets:
    '<path d="M12 3s-6 6.5-6 11a6 6 0 0 0 12 0c0-4.5-6-11-6-11Z"/><path d="M9 15a3 3 0 0 0 3 3"/>',
  precipitation:
    '<path d="M5 13h13a3 3 0 0 0 .2-6A5.5 5.5 0 0 0 7 8.5 2.5 2.5 0 0 0 5 13Z"/><path d="m9 16-1 2m6-2-1 2"/>',
  sunrise:
    '<path d="M3 18h18M5 14a7 7 0 0 1 14 0M12 2v5m-7.1-1 2.1 2.1m12-2.1-2.1 2.1M2 22h20"/>',
  sunset:
    '<path d="M3 18h18M5 14a7 7 0 0 1 14 0M12 7V2m-7.1 1 2.1 2.1m12-2.1-2.1 2.1M2 22h20"/>',
};

function getIconSvg(name, classes = "icon-svg") {
  return `<svg class="${classes}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${iconMarkup[name] || iconMarkup.cloud}</svg>`;
}

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    showNotice("Your browser could not save this preference.");
  }
}

async function requestJson(url, message) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(message);
  return response.json();
}

async function searchLocation(query) {
  const params = new URLSearchParams({
    name: query,
    count: "6",
    language: "en",
    format: "json",
  });
  const data = await requestJson(
    `${GEOCODING_BASE}?${params}`,
    "Unable to search locations right now.",
  );
  return data.results || [];
}

async function fetchWeather(place) {
  const params = new URLSearchParams({
    latitude: place.latitude,
    longitude: place.longitude,
    timezone: "auto",
    forecast_days: "5",
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m",
    hourly:
      "temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,visibility,uv_index,cloud_cover,precipitation",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max,uv_index_max",
  });
  return requestJson(
    `${API_BASE}?${params}`,
    "Unable to load weather data. Please try again.",
  );
}

function getCondition(code, isDay = true) {
  const group = weatherGroups.find((item) => item.codes.includes(code));
  return group
    ? { label: group.label, icon: isDay ? group.dayIcon : group.nightIcon }
    : { label: "Conditions unavailable", icon: "cloud" };
}

function getTemperature(value) {
  if (!Number.isFinite(value)) return "--";
  return Math.round(state.unit === "fahrenheit" ? (value * 9) / 5 + 32 : value);
}

function getTemperatureUnit() {
  return state.unit === "fahrenheit" ? "°F" : "°C";
}

function showNotice(message, retry = null) {
  elements.noticeText.textContent = message;
  state.retry = retry;
  elements.retryButton.hidden = !retry;
  elements.notice.hidden = false;
}

function hideNotice() {
  elements.notice.hidden = true;
  state.retry = null;
}

function showLoading(label = "Loading weather data...") {
  elements.currentSection.setAttribute("aria-busy", "true");
  elements.updated.textContent = label;
  elements.refreshButton.disabled = true;
  elements.refreshButton.classList.add("is-loading");
  hideNotice();
}

function showError(message, retry) {
  elements.currentSection.setAttribute("aria-busy", "false");
  elements.refreshButton.disabled = false;
  elements.refreshButton.classList.remove("is-loading");
  showNotice(message, retry);
}

async function loadWeather(place, { saveRecent = true } = {}) {
  const requestId = ++state.weatherRequest;
  const selectedPlace = normalizePlace(place);
  state.place = selectedPlace;
  showLoading();
  try {
    const data = await fetchWeather(selectedPlace);
    if (requestId !== state.weatherRequest) return;
    if (!data.current || !data.daily || !data.hourly)
      throw new Error("The weather service returned incomplete data.");
    state.weather = data;
    writeStorage(STORAGE_KEYS.place, selectedPlace);
    if (saveRecent && selectedPlace.name) saveRecentLocation(selectedPlace);
    displayWeather(data, selectedPlace);
    elements.currentSection.setAttribute("aria-busy", "false");
    elements.refreshButton.disabled = false;
    elements.refreshButton.classList.remove("is-loading");
    elements.updated.textContent = `Last updated: ${new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date())}`;
    hideNotice();
  } catch {
    if (requestId !== state.weatherRequest) return;
    showError(
      "Unable to load weather data. Check your connection and try again.",
      () => loadWeather(selectedPlace, { saveRecent }),
    );
  }
}

function normalizePlace(place) {
  return {
    name: place.name || "Current location",
    country: place.country || "",
    country_code: place.country_code || "",
    latitude: Number(place.latitude),
    longitude: Number(place.longitude),
    timezone: place.timezone || "auto",
    admin1: place.admin1 || "",
  };
}

function displayWeather(data, place) {
  const current = data.current;
  const condition = getCondition(current.weather_code, current.is_day === 1);
  elements.city.textContent = place.name;
  elements.country.textContent = place.country_code
    ? place.country_code.toUpperCase()
    : place.country;
  elements.date.textContent = formatDate(current.time, data.timezone);
  elements.icon.innerHTML = getIconSvg(
    condition.icon,
    `icon-svg weather-svg weather-${condition.icon}`,
  );
  elements.icon.setAttribute("aria-label", condition.label);
  elements.temperature.innerHTML = `${getTemperature(current.temperature_2m)}<span>${getTemperatureUnit()}</span>`;
  elements.condition.textContent = condition.label;
  elements.feelsLike.textContent = `${getTemperature(current.apparent_temperature)}${getTemperatureUnit()}`;
  elements.humidity.textContent = `${current.relative_humidity_2m}%`;
  elements.wind.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
  elements.forecastLocation.textContent = `${place.name}${place.country ? `, ${place.country}` : ""}`;
  displayForecast(data);
  displayHourlyForecast(data);
  displayStats(data);
  drawTrendChart();
  updateFavoriteButton();
}

function formatDate(dateString, timezone) {
  const date = new Date(`${dateString}:00Z`);
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: timezone,
  }).format(date);
}

function displayForecast(data) {
  elements.forecast.replaceChildren();
  data.daily.time.forEach((date, index) => {
    const condition = getCondition(data.daily.weather_code[index]);
    const card = document.createElement("article");
    card.className = "forecast-card";
    card.innerHTML = `<span class="forecast-day">${index === 0 ? "Today" : weekday(date, data.timezone)}</span>
      <span class="forecast-date">${shortDate(date, data.timezone)}</span>
      <span class="forecast-icon" aria-label="${condition.label}">${getIconSvg(condition.icon, `icon-svg weather-svg weather-${condition.icon}`)}</span>
      <span class="forecast-temps">${getTemperature(data.daily.temperature_2m_max[index])}° <span>/ ${getTemperature(data.daily.temperature_2m_min[index])}°</span></span>
      <span class="forecast-condition">${condition.label}</span>
      <span class="forecast-rain">${data.daily.precipitation_probability_max[index] ?? "--"}% rain</span>`;
    elements.forecast.append(card);
  });
}

function weekday(date, timezone) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    timeZone: timezone,
  }).format(new Date(`${date}T12:00:00Z`));
}

function shortDate(date, timezone) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    timeZone: timezone,
  }).format(new Date(`${date}T12:00:00Z`));
}

function getCurrentHourIndex(data) {
  const currentHour = data.current.time.slice(0, 13);
  const index = data.hourly.time.findIndex(
    (time) => time.slice(0, 13) === currentHour,
  );
  return Math.max(0, index);
}

function displayHourlyForecast(data) {
  const start = getCurrentHourIndex(data);
  elements.hourly.replaceChildren();
  for (
    let index = start;
    index < Math.min(start + 12, data.hourly.time.length);
    index += 1
  ) {
    const time = data.hourly.time[index].slice(11, 13);
    const hour = Number(time);
    const label =
      index === start
        ? "Now"
        : `${hour % 12 || 12} ${hour >= 12 ? "PM" : "AM"}`;
    const condition = getCondition(
      data.hourly.weather_code[index],
      hour >= 6 && hour < 18,
    );
    const card = document.createElement("article");
    card.className = "hour-card";
    card.innerHTML = `<span class="hour-time">${label}</span><span class="hour-icon" aria-label="${condition.label}">${getIconSvg(condition.icon, `icon-svg weather-svg weather-${condition.icon}`)}</span>
      <span class="hour-temp">${getTemperature(data.hourly.temperature_2m[index])}°</span><span class="hour-rain">${data.hourly.precipitation_probability[index] ?? "--"}% rain</span>`;
    elements.hourly.append(card);
  }
}

function displayStats(data) {
  const current = data.current;
  const index = getCurrentHourIndex(data);
  const direction = compassDirection(current.wind_direction_10m);
  const statistics = [
    ["Humidity", "droplets", `${current.relative_humidity_2m}`, "%"],
    ["Wind Speed", "wind", `${Math.round(current.wind_speed_10m)}`, "km/h"],
    [
      "Wind Direction",
      "compass",
      direction,
      `${Math.round(current.wind_direction_10m)}°`,
    ],
    [
      "Pressure",
      "gauge",
      current.pressure_msl == null
        ? "--"
        : `${Math.round(current.pressure_msl)}`,
      "hPa",
    ],
    [
      "Visibility",
      "eye",
      data.hourly.visibility[index] == null
        ? "--"
        : `${(data.hourly.visibility[index] / 1000).toFixed(1)}`,
      "km",
    ],
    [
      "Cloud Cover",
      "cloud",
      current.cloud_cover == null ? "--" : `${current.cloud_cover}`,
      "%",
    ],
    [
      "UV Index",
      "sun",
      data.hourly.uv_index[index] == null
        ? "--"
        : `${Math.round(data.hourly.uv_index[index])}`,
      "",
    ],
    [
      "Precipitation",
      "precipitation",
      current.precipitation == null ? "--" : `${current.precipitation}`,
      "mm",
    ],
    ["Sunrise", "sunrise", clockTime(data.daily.sunrise[0]), ""],
    ["Sunset", "sunset", clockTime(data.daily.sunset[0]), ""],
  ];
  elements.stats.replaceChildren();
  statistics.forEach(([label, icon, value, unit]) => {
    const card = document.createElement("article");
    card.className = "stat-card";
    card.innerHTML = `<div class="stat-top"><span class="stat-icon">${getIconSvg(icon)}</span><span>${label}</span></div><p class="stat-value">${value}<small>${unit}</small></p>`;
    elements.stats.append(card);
  });
}

function compassDirection(degrees) {
  if (!Number.isFinite(degrees)) return "--";
  return ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][
    Math.round(degrees / 45) % 8
  ];
}

function clockTime(dateString) {
  if (!dateString) return "--";
  const hour = Number(dateString.slice(11, 13));
  const minute = dateString.slice(14, 16);
  return `${hour % 12 || 12}:${minute} ${hour >= 12 ? "PM" : "AM"}`;
}

function drawTrendChart() {
  const canvas = elements.chart;
  const context = canvas.getContext("2d");
  if (!context) return;
  const bounds = canvas.getBoundingClientRect();
  const width = Math.max(1, bounds.width);
  const height = Math.max(1, bounds.height);
  const ratio = window.devicePixelRatio || 1;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  context.scale(ratio, ratio);
  context.clearRect(0, 0, width, height);
  const data = state.weather;
  if (!data) {
    elements.chartEmpty.hidden = false;
    return;
  }
  elements.chartEmpty.hidden = true;
  const start = getCurrentHourIndex(data);
  const values = Array.from({ length: 6 }, (_, index) => {
    const value =
      data.hourly[
        state.metric === "temperature"
          ? "temperature_2m"
          : "relative_humidity_2m"
      ][start + index * 2];
    return state.metric === "temperature"
      ? getTemperature(value)
      : Math.round(value);
  }).filter(Number.isFinite);
  if (values.length < 2) return;
  const left = 38,
    right = 17,
    top = 17,
    bottom = 28;
  const min =
    Math.floor(
      (Math.min(...values) - (state.metric === "temperature" ? 2 : 8)) / 5,
    ) * 5;
  const max =
    Math.ceil(
      (Math.max(...values) + (state.metric === "temperature" ? 2 : 8)) / 5,
    ) * 5;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const x = (index) => left + (plotWidth * index) / (values.length - 1);
  const y = (value) =>
    top + ((max - value) / Math.max(1, max - min)) * plotHeight;
  context.font = "10px DM Sans, sans-serif";
  context.textBaseline = "middle";
  for (let tick = 0; tick <= 3; tick += 1) {
    const value = max - ((max - min) * tick) / 3;
    const lineY = top + (plotHeight * tick) / 3;
    context.strokeStyle = "#e8edf4";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(left, lineY);
    context.lineTo(width - right, lineY);
    context.stroke();
    context.fillStyle = "#8390a5";
    context.textAlign = "right";
    context.fillText(
      `${Math.round(value)}${state.metric === "temperature" ? "°" : "%"}`,
      left - 9,
      lineY,
    );
  }
  const gradient = context.createLinearGradient(0, top, 0, height - bottom);
  gradient.addColorStop(0, "#3184e530");
  gradient.addColorStop(1, "#3184e500");
  context.beginPath();
  values.forEach((value, index) =>
    index
      ? context.lineTo(x(index), y(value))
      : context.moveTo(x(index), y(value)),
  );
  context.lineTo(x(values.length - 1), height - bottom);
  context.lineTo(x(0), height - bottom);
  context.closePath();
  context.fillStyle = gradient;
  context.fill();
  context.beginPath();
  values.forEach((value, index) =>
    index
      ? context.lineTo(x(index), y(value))
      : context.moveTo(x(index), y(value)),
  );
  context.strokeStyle = "#2b79dc";
  context.lineWidth = 2.5;
  context.lineJoin = "round";
  context.stroke();
  values.forEach((value, index) => {
    context.beginPath();
    context.arc(x(index), y(value), 4, 0, Math.PI * 2);
    context.fillStyle = "#fff";
    context.fill();
    context.strokeStyle = "#2b79dc";
    context.lineWidth = 2;
    context.stroke();
    const hourIndex = start + index * 2;
    const hour = Number(data.hourly.time[hourIndex].slice(11, 13));
    context.fillStyle = "#75839a";
    context.textAlign = "center";
    context.fillText(
      index === 0 ? "Now" : `${hour % 12 || 12}${hour >= 12 ? "p" : "a"}`,
      x(index),
      height - 11,
    );
  });
  canvas.setAttribute(
    "aria-label",
    `${state.metric} trend over the next twelve hours`,
  );
}

function saveRecentLocation(place) {
  state.recent = [
    place,
    ...state.recent.filter(
      (item) =>
        item.latitude !== place.latitude || item.longitude !== place.longitude,
    ),
  ].slice(0, 5);
  writeStorage(STORAGE_KEYS.recent, state.recent);
  renderSavedLocations();
}

function toggleFavorite() {
  if (!state.place) return;
  const exists = state.favorites.some(
    (place) =>
      place.latitude === state.place.latitude &&
      place.longitude === state.place.longitude,
  );
  state.favorites = exists
    ? state.favorites.filter(
        (place) =>
          place.latitude !== state.place.latitude ||
          place.longitude !== state.place.longitude,
      )
    : [state.place, ...state.favorites];
  writeStorage(STORAGE_KEYS.favorites, state.favorites);
  updateFavoriteButton();
  renderSavedLocations();
}

function updateFavoriteButton() {
  const isFavorite =
    state.place &&
    state.favorites.some(
      (place) =>
        place.latitude === state.place.latitude &&
        place.longitude === state.place.longitude,
    );
  elements.favoriteButton.disabled = !state.place;
  elements.favoriteButton.classList.toggle("is-favorite", Boolean(isFavorite));
  elements.favoriteButton.setAttribute(
    "aria-pressed",
    String(Boolean(isFavorite)),
  );
  elements.favoriteButton.querySelector("span:first-child").innerHTML =
    getIconSvg("star");
  elements.favoriteLabel.textContent = isFavorite
    ? "Added to Favorites"
    : "Add to Favorites";
}

function renderSavedLocations() {
  renderLocationList(
    elements.favorites,
    state.favorites,
    "No favorites yet. Add one from the current weather panel.",
    true,
  );
  renderLocationList(
    elements.recent,
    state.recent,
    "Your searched places will show here.",
    false,
  );
  elements.clearRecent.hidden = state.recent.length === 0;
}

function renderLocationList(container, places, emptyMessage, removable) {
  container.replaceChildren();
  if (!places.length) {
    const empty = document.createElement("p");
    empty.className = "empty-copy";
    empty.textContent = emptyMessage;
    container.append(empty);
    return;
  }
  places.forEach((place, index) => {
    const row = document.createElement("div");
    row.className = "saved-item";
    const button = document.createElement("button");
    button.className = "saved-place";
    button.type = "button";
    button.textContent = `${place.name}${place.country ? `, ${place.country}` : ""}`;
    button.addEventListener("click", () => loadWeather(place));
    row.append(button);
    if (removable) {
      const remove = document.createElement("button");
      remove.className = "remove-saved";
      remove.type = "button";
      remove.setAttribute("aria-label", `Remove ${place.name} from favorites`);
      remove.innerHTML = getIconSvg("close");
      remove.addEventListener("click", () => {
        state.favorites.splice(index, 1);
        writeStorage(STORAGE_KEYS.favorites, state.favorites);
        updateFavoriteButton();
        renderSavedLocations();
      });
      row.append(remove);
    }
    container.append(row);
  });
}

async function handleSearch(event) {
  event.preventDefault();
  const query = elements.searchInput.value.trim();
  if (!query) {
    showNotice("Enter a city or town to search.");
    elements.searchInput.focus();
    return;
  }
  const requestId = ++state.searchRequest;
  elements.searchResults.hidden = false;
  elements.searchResults.innerHTML =
    '<p class="empty-copy" style="padding: 12px 14px">Searching locations...</p>';
  hideNotice();
  try {
    const places = await searchLocation(query);
    if (requestId !== state.searchRequest) return;
    if (!places.length) {
      elements.searchResults.innerHTML =
        '<p class="empty-copy" style="padding: 12px 14px">No location found. Try searching for another city.</p>';
      return;
    }
    displaySearchResults(places);
  } catch {
    if (requestId === state.searchRequest) {
      elements.searchResults.hidden = true;
      showNotice(
        "Location search failed. Check your connection and try again.",
        () => handleSearch(new Event("submit", { cancelable: true })),
      );
    }
  }
}

function displaySearchResults(places) {
  elements.searchResults.replaceChildren();
  places.forEach((place) => {
    const button = document.createElement("button");
    button.className = "search-result";
    button.type = "button";
    button.setAttribute("role", "option");
    const primary = document.createElement("strong");
    primary.textContent = place.name;
    const detail = document.createElement("span");
    detail.textContent = [place.admin1, place.country]
      .filter(Boolean)
      .join(", ");
    button.append(primary, detail);
    button.addEventListener("click", () => {
      elements.searchInput.value = place.name;
      elements.searchResults.hidden = true;
      loadWeather(place);
    });
    elements.searchResults.append(button);
  });
  elements.searchResults.hidden = false;
}

function useCurrentLocation() {
  if (!navigator.geolocation) {
    showNotice(
      "Location is not available in this browser. Search for a city instead.",
    );
    return;
  }
  elements.locationButton.disabled = true;
  elements.locationButton.setAttribute("aria-busy", "true");
  elements.locationButton.lastChild.textContent = " Finding location...";
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const place = {
        name: "Current location",
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        timezone: "auto",
      };
      elements.locationButton.disabled = false;
      elements.locationButton.setAttribute("aria-busy", "false");
      elements.locationButton.lastChild.textContent = " Use My Location";
      await loadWeather(place, { saveRecent: false });
    },
    (error) => {
      elements.locationButton.disabled = false;
      elements.locationButton.setAttribute("aria-busy", "false");
      elements.locationButton.lastChild.textContent = " Use My Location";
      if (error.code === error.PERMISSION_DENIED)
        showNotice(
          "Location access was denied. Please search for a city instead.",
        );
      else if (error.code === error.POSITION_UNAVAILABLE)
        showNotice(
          "Your location could not be determined. Search for a city instead.",
        );
      else
        showNotice(
          "Location lookup timed out. Please try again or search for a city.",
        );
    },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
  );
}

function setUnit(unit) {
  state.unit = unit;
  writeStorage(STORAGE_KEYS.unit, unit);
  document.querySelectorAll(".unit-button").forEach((button) => {
    const selected = button.dataset.unit === unit;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  if (state.weather && state.place) displayWeather(state.weather, state.place);
}

function setMetric(metric) {
  state.metric = metric;
  document.querySelectorAll(".chart-button").forEach((button) => {
    const selected = button.dataset.metric === metric;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  elements.chart.setAttribute("aria-label", `${metric} trend chart`);
  drawTrendChart();
}

function setMenuOpen(open) {
  elements.sidebar.classList.toggle("open", open);
  elements.menuScrim.classList.toggle("visible", open);
  elements.menuButton.setAttribute("aria-expanded", String(open));
  elements.menuButton.setAttribute(
    "aria-label",
    open ? "Close navigation" : "Open navigation",
  );
  document.body.classList.toggle("menu-open", open);
}

function addEventListeners() {
  elements.searchForm.addEventListener("submit", handleSearch);
  elements.searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Escape") elements.searchResults.hidden = true;
  });
  document.addEventListener("click", (event) => {
    if (!elements.searchForm.contains(event.target))
      elements.searchResults.hidden = true;
  });
  elements.refreshButton.addEventListener(
    "click",
    () => state.place && loadWeather(state.place, { saveRecent: false }),
  );
  elements.locationButton.addEventListener("click", useCurrentLocation);
  elements.favoriteButton.addEventListener("click", toggleFavorite);
  elements.retryButton.addEventListener("click", () => state.retry?.());
  elements.noticeClose.addEventListener("click", hideNotice);
  elements.clearRecent.addEventListener("click", () => {
    state.recent = [];
    writeStorage(STORAGE_KEYS.recent, state.recent);
    renderSavedLocations();
  });
  document
    .querySelectorAll(".unit-button")
    .forEach((button) =>
      button.addEventListener("click", () => setUnit(button.dataset.unit)),
    );
  document
    .querySelectorAll(".chart-button")
    .forEach((button) =>
      button.addEventListener("click", () => setMetric(button.dataset.metric)),
    );
  elements.menuButton.addEventListener("click", () =>
    setMenuOpen(!elements.sidebar.classList.contains("open")),
  );
  elements.sidebarCloseButton.addEventListener("click", () => {
    setMenuOpen(false);
  });
  elements.menuScrim.addEventListener("click", () => setMenuOpen(false));
  elements.sidebar
    .querySelectorAll(".nav-link")
    .forEach((link) =>
      link.addEventListener("click", () => setMenuOpen(false)),
    );
  window.addEventListener("resize", drawTrendChart);
}

function initialize() {
  addEventListeners();
  renderSavedLocations();
  setUnit(state.unit);
  if (state.place) loadWeather(state.place, { saveRecent: false });
}

initialize();
