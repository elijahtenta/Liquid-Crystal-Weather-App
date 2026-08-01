import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  MapPin,
  Sun,
  Moon,
  Cloud,
  CloudSun,
  CloudMoon,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Wind,
  Droplets,
  Gauge,
  Loader2,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Design: "Liquid Glass" — frosted, translucent panels floating     */
/*  over a soft animated sky-gradient that shifts with the actual     */
/*  weather condition. Specular highlights along top edges, blurred   */
/*  light blobs drifting behind the glass to sell the refraction.     */
/* ------------------------------------------------------------------ */

const WMO = {
  0: { label: "Clear sky", icon: (day) => (day ? Sun : Moon) },
  1: { label: "Mostly clear", icon: (day) => (day ? CloudSun : CloudMoon) },
  2: { label: "Partly cloudy", icon: (day) => (day ? CloudSun : CloudMoon) },
  3: { label: "Overcast", icon: () => Cloud },
  45: { label: "Fog", icon: () => CloudFog },
  48: { label: "Rime fog", icon: () => CloudFog },
  51: { label: "Light drizzle", icon: () => CloudDrizzle },
  53: { label: "Drizzle", icon: () => CloudDrizzle },
  55: { label: "Dense drizzle", icon: () => CloudDrizzle },
  56: { label: "Freezing drizzle", icon: () => CloudDrizzle },
  57: { label: "Freezing drizzle", icon: () => CloudDrizzle },
  61: { label: "Light rain", icon: () => CloudRain },
  63: { label: "Rain", icon: () => CloudRain },
  65: { label: "Heavy rain", icon: () => CloudRain },
  66: { label: "Freezing rain", icon: () => CloudRain },
  67: { label: "Freezing rain", icon: () => CloudRain },
  71: { label: "Light snow", icon: () => CloudSnow },
  73: { label: "Snow", icon: () => CloudSnow },
  75: { label: "Heavy snow", icon: () => CloudSnow },
  77: { label: "Snow grains", icon: () => CloudSnow },
  80: { label: "Rain showers", icon: () => CloudRain },
  81: { label: "Rain showers", icon: () => CloudRain },
  82: { label: "Violent showers", icon: () => CloudRain },
  85: { label: "Snow showers", icon: () => CloudSnow },
  86: { label: "Snow showers", icon: () => CloudSnow },
  95: { label: "Thunderstorm", icon: () => CloudLightning },
  96: { label: "Thunderstorm + hail", icon: () => CloudLightning },
  99: { label: "Thunderstorm + hail", icon: () => CloudLightning },
};

function describe(code) {
  return WMO[code] || { label: "Unknown", icon: () => Cloud };
}

function fmtHour(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric" });
}

function fmtDay(iso, idx) {
  if (idx === 0) return "Today";
  return new Date(iso).toLocaleDateString([], { weekday: "short" });
}

/* Weather-adaptive sky gradients — this is what the glass refracts */
function skyGradient(code, isDay) {
  if (code == null) {
    return "linear-gradient(160deg,#3E5C8A 0%,#6E8FC2 45%,#A7C4E8 100%)";
  }
  if ([95, 96, 99].includes(code)) {
    return isDay
      ? "linear-gradient(160deg,#3A3F5C 0%,#5B5A8C 45%,#8C7BA8 100%)"
      : "linear-gradient(160deg,#12101F 0%,#2B2247 45%,#4A2F5E 100%)";
  }
  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return isDay
      ? "linear-gradient(160deg,#7C93B0 0%,#AFC3DA 45%,#E8EEF4 100%)"
      : "linear-gradient(160deg,#1C2534 0%,#374862 45%,#5C7089 100%)";
  }
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return isDay
      ? "linear-gradient(160deg,#33475C 0%,#4E7089 45%,#7DA0AD 100%)"
      : "linear-gradient(160deg,#0E1A24 0%,#1F3140 45%,#2E4A52 100%)";
  }
  if ([45, 48].includes(code)) {
    return isDay
      ? "linear-gradient(160deg,#8A9AA5 0%,#B7C2C7 45%,#DCE3E2 100%)"
      : "linear-gradient(160deg,#1B2226 0%,#333F44 45%,#54636A 100%)";
  }
  if (code === 3) {
    return isDay
      ? "linear-gradient(160deg,#5B6E82 0%,#8494A4 45%,#B4C0C6 100%)"
      : "linear-gradient(160deg,#131920 0%,#293440 45%,#425160 100%)";
  }
  return isDay
    ? "linear-gradient(160deg,#2E6FA7 0%,#5FA0D6 45%,#BFE0F5 100%)"
    : "linear-gradient(160deg,#060B18 0%,#101B3A 45%,#22326B 100%)";
}

/* ---- Glass helpers -------------------------------------------------- */
const glassPanel = (radius = 28) => ({
  backgroundColor: "rgba(255,255,255,0.14)",
  backdropFilter: "blur(28px) saturate(160%)",
  WebkitBackdropFilter: "blur(28px) saturate(160%)",
  border: "1px solid rgba(255,255,255,0.32)",
  borderRadius: radius,
  boxShadow:
    "0 8px 32px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.55), inset 0 -1px 12px rgba(255,255,255,0.05)",
});

const glassInset = (radius = 20) => ({
  backgroundColor: "rgba(255,255,255,0.10)",
  backdropFilter: "blur(18px) saturate(150%)",
  WebkitBackdropFilter: "blur(18px) saturate(150%)",
  border: "1px solid rgba(255,255,255,0.25)",
  borderRadius: radius,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4)",
});

function Trace({ hours, width = 640, height = 110 }) {
  if (!hours || hours.length < 2) return null;
  const temps = hours.map((h) => h.temp);
  const min = Math.min(...temps);
  const max = Math.max(...temps);
  const span = Math.max(max - min, 1);
  const padY = 16;
  const points = hours.map((h, i) => {
    const x = (i / (hours.length - 1)) * width;
    const y = height - padY - ((h.temp - min) / span) * (height - padY * 2);
    return [x, y];
  });
  const path = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");
  const areaPath = `${path} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full h-24 md:h-28">
      <defs>
        <linearGradient id="traceFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="traceLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#FFE9B0" />
          <stop offset="100%" stopColor="#FFFFFF" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#traceFill)" />
      <path d={path} fill="none" stroke="url(#traceLine)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {points.map(([x, y], i) =>
        i % 4 === 0 ? <circle key={i} cx={x} cy={y} r="3" fill="#fff" fillOpacity="0.9" /> : null
      )}
    </svg>
  );
}

export default function WeatherApp() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [place, setPlace] = useState({ name: "Minneapolis", admin: "Minnesota, US", lat: 44.9778, lon: -93.265 });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeString, setTimeString] = useState(() =>
    new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
  );
  const debounceRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeString(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadWeather = useCallback(async (lat, lon) => {
    setLoading(true);
    setError(null);
    try {
      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m` +
        `&hourly=temperature_2m,weather_code,precipitation_probability` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
        `&timezone=auto&temperature_unit=fahrenheit&wind_speed_unit=mph`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Weather lookup failed");
      const json = await res.json();

      const nowIdx = json.hourly.time.findIndex((t) => t === json.current.time.slice(0, 13) + ":00");
      const startIdx = nowIdx >= 0 ? nowIdx : 0;
      const hourly = json.hourly.time.slice(startIdx, startIdx + 24).map((t, i) => ({
        time: t,
        temp: json.hourly.temperature_2m[startIdx + i],
        code: json.hourly.weather_code[startIdx + i],
        pop: json.hourly.precipitation_probability[startIdx + i],
      }));

      const daily = json.daily.time.map((t, i) => ({
        time: t,
        code: json.daily.weather_code[i],
        max: json.daily.temperature_2m_max[i],
        min: json.daily.temperature_2m_min[i],
        pop: json.daily.precipitation_probability_max[i],
      }));

      setData({ current: json.current, hourly, daily, timezone: json.timezone });
    } catch (e) {
      setError("Couldn't reach the weather station. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWeather(place.lat, place.lon);
  }, [place, loadWeather]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`
        );
        const json = await res.json();
        setSuggestions(json.results || []);
      } catch {
        setSuggestions([]);
      }
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  function pickSuggestion(s) {
    setPlace({
      name: s.name,
      admin: [s.admin1, s.country].filter(Boolean).join(", "),
      lat: s.latitude,
      lon: s.longitude,
    });
    setQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
  }

  const isDay = data?.current?.is_day === 1;
  const cur = data?.current;
  const curDesc = cur ? describe(cur.weather_code) : null;
  const CurIcon = curDesc ? curDesc.icon(isDay) : Cloud;
  const bg = skyGradient(cur?.weather_code, isDay ?? true);

  return (
    <div
      className="min-h-screen w-full relative overflow-hidden flex items-start justify-center p-4 md:p-10 transition-all duration-1000"
      style={{ background: bg, fontFamily: "-apple-system, 'SF Pro Display', 'Segoe UI', sans-serif" }}
    >
      {/* drifting light blobs — sell the refraction behind the glass */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 420,
          height: 420,
          top: -140,
          left: -120,
          background: "radial-gradient(circle,rgba(255,255,255,0.35) 0%,rgba(255,255,255,0) 70%)",
          filter: "blur(10px)",
        }}
      />
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 380,
          height: 380,
          bottom: -160,
          right: -100,
          background: "radial-gradient(circle,rgba(255,214,140,0.30) 0%,rgba(255,214,140,0) 70%)",
          filter: "blur(10px)",
        }}
      />
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 300,
          height: 300,
          top: "40%",
          right: "8%",
          background: "radial-gradient(circle,rgba(120,190,255,0.25) 0%,rgba(120,190,255,0) 70%)",
          filter: "blur(14px)",
        }}
      />

      <div className="w-full max-w-3xl relative">
        {/* Header pill */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-white">
            <div className="text-xs tracking-[0.3em] uppercase text-white/70">Now</div>
            <h1 className="text-2xl font-semibold tracking-tight drop-shadow-sm">Liquid Sky</h1>
          </div>
          <div className="text-xs text-white/70 text-right leading-relaxed">
            {new Date().toLocaleDateString([], { month: "short", day: "numeric" })}
            <br />
            {timeString}
            <br />
            {data ? data.timezone.split("/").pop().replace("_", " ") : ""}
          </div>
        </div>

        {/* Search — glass pill */}
        <div className="relative mb-6">
          <div className="flex items-center gap-2 px-4 py-3" style={glassInset(24)}>
            <Search size={18} className="text-white/80" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Search a city…"
              className="flex-1 bg-transparent outline-none text-sm md:text-base text-white placeholder-white/60"
            />
            {loading && <Loader2 size={16} className="animate-spin text-white/80" />}
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-20 mt-2 w-full overflow-hidden" style={glassPanel(20)}>
              {suggestions.map((s) => (
                <button
                  key={`${s.id}-${s.latitude}`}
                  onClick={() => pickSuggestion(s)}
                  className="w-full text-left px-4 py-3 text-sm flex items-center gap-2 text-white hover:bg-white/15 transition-colors border-b border-white/10 last:border-b-0"
                >
                  <MapPin size={14} className="text-white/70" />
                  <span className="font-semibold">{s.name}</span>
                  <span className="text-white/65">{[s.admin1, s.country].filter(Boolean).join(", ")}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 text-sm px-4 py-3 text-white" style={{ ...glassInset(18), borderColor: "rgba(255,150,130,0.5)" }}>
            {error}
          </div>
        )}

        {/* Hero glass card */}
        <div className="p-6 md:p-8 mb-6 relative overflow-hidden" style={glassPanel(32)}>
          {/* top specular highlight streak */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.9),transparent)" }}
          />
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-sm text-white/80">
                <MapPin size={14} />
                {place.name}
                {place.admin ? `, ${place.admin}` : ""}
              </div>
              <div className="flex items-end gap-3 mt-1">
                <span className="text-7xl md:text-8xl font-semibold text-white tabular-nums drop-shadow-md" style={{ letterSpacing: "-0.03em" }}>
                  {cur ? Math.round(cur.temperature_2m) : "--"}°
                </span>
              </div>
              <div className="text-sm md:text-base text-white/85">
                {curDesc ? curDesc.label : "Loading…"}
                {cur ? ` · feels like ${Math.round(cur.apparent_temperature)}°` : ""}
              </div>
            </div>
            <div className="p-4" style={glassInset(999)}>
              <CurIcon size={38} className="text-white" strokeWidth={1.6} />
            </div>
          </div>

          {/* trace */}
          <div className="mt-6">
            <div className="text-xs uppercase tracking-[0.25em] text-white/60 mb-1">24hr trend</div>
            <div className="p-3" style={glassInset(20)}>
              <Trace hours={data?.hourly} />
            </div>
            {data?.hourly && (
              <div className="flex justify-between text-[11px] text-white/60 mt-1 px-1">
                {[0, 6, 12, 18, 23].map((i) => (
                  <span key={i}>{fmtHour(data.hourly[Math.min(i, data.hourly.length - 1)].time)}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Stat icon={Droplets} label="Humidity" value={cur ? `${cur.relative_humidity_2m}%` : "--"} />
          <Stat icon={Wind} label="Wind" value={cur ? `${Math.round(cur.wind_speed_10m)} mph` : "--"} />
          <Stat icon={Gauge} label="Rain chance" value={data?.hourly?.[0] ? `${data.hourly[0].pop}%` : "--"} />
        </div>

        {/* Hourly strip */}
        <div className="p-4 mb-6" style={glassPanel(28)}>
          <div className="text-xs uppercase tracking-[0.25em] text-white/60 mb-3">Hourly</div>
          <div className="flex gap-4 overflow-x-auto pb-1">
            {(data?.hourly || []).map((h, i) => {
              const HIcon = describe(h.code).icon(true);
              return (
                <div key={h.time} className="flex flex-col items-center gap-1.5 min-w-[54px]" style={{ opacity: i === 0 ? 1 : 0.85 }}>
                  <span className="text-[11px] text-white/70">{i === 0 ? "Now" : fmtHour(h.time)}</span>
                  <HIcon size={20} className="text-white" strokeWidth={1.6} />
                  <span className="text-sm font-semibold text-white tabular-nums">{Math.round(h.temp)}°</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 7-day forecast */}
        <div className="p-4 mb-6" style={glassPanel(28)}>
          <div className="text-xs uppercase tracking-[0.25em] text-white/60 mb-2">7-Day</div>
          {(data?.daily || []).map((d, i) => {
            const DIcon = describe(d.code).icon(true);
            const allMax = data.daily.map((x) => x.max);
            const allMin = data.daily.map((x) => x.min);
            const lo = Math.min(...allMin);
            const hi = Math.max(...allMax);
            const spanPct = (v) => ((v - lo) / Math.max(hi - lo, 1)) * 100;
            return (
              <div key={d.time} className="flex items-center gap-3 py-2.5 border-b border-white/10 last:border-b-0">
                <span className="w-16 text-sm font-medium text-white">{fmtDay(d.time, i)}</span>
                <DIcon size={18} className="text-white/85" strokeWidth={1.6} />
                <span className="w-10 text-xs text-right text-sky-100/90">{d.pop}%</span>
                <span className="w-9 text-sm text-right tabular-nums text-white/60">{Math.round(d.min)}°</span>
                <div className="flex-1 h-1.5 rounded-full relative bg-white/15">
                  <div
                    className="absolute h-1.5 rounded-full"
                    style={{
                      left: `${spanPct(d.min)}%`,
                      right: `${100 - spanPct(d.max)}%`,
                      background: "linear-gradient(90deg,#FFE9B0,#FFFFFF)",
                    }}
                  />
                </div>
                <span className="w-9 text-sm text-right font-semibold tabular-nums text-white">{Math.round(d.max)}°</span>
              </div>
            );
          })}
        </div>

        <div className="text-center text-[11px] text-white/50 pb-2">Data via Open-Meteo · No key, no tracking</div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="px-4 py-3 flex flex-col gap-1" style={glassPanel(22)}>
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-white/65">
        <Icon size={13} />
        {label}
      </div>
      <div className="text-lg font-semibold text-white tabular-nums">{value}</div>
    </div>
  );
}
