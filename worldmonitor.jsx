import { useState, useEffect, useCallback } from "react";

const SECTIONS = [
  { id: "world",   labelEn: "WORLD",   labelHi: "विश्व",    icon: "🌍", color: "#4ade80" },
  { id: "finance", labelEn: "FINANCE", labelHi: "वित्त",    icon: "📈", color: "#38bdf8" },
  { id: "geo",     labelEn: "GEO",     labelHi: "भू-राज",   icon: "⚡", color: "#fb923c" },
  { id: "climate", labelEn: "CLIMATE", labelHi: "जलवायु",   icon: "🌦", color: "#a78bfa" },
  { id: "cyber",   labelEn: "CYBER",   labelHi: "साइबर",    icon: "🔒", color: "#f472b6" },
];

const PROMPTS = {
  en: {
    world:   "Generate 4 realistic current world news headlines with a 1-sentence brief each. Cover major global events — politics, humanitarian, diplomacy. Format as JSON array: [{headline, brief, region, severity}] where severity is low/medium/high/critical. Only JSON, no markdown.",
    finance: "Generate 4 realistic global finance/market updates. Cover stock markets, crypto, commodities, economic indicators. Format as JSON array: [{headline, brief, metric, change}] where change is like '+1.2%' or '-0.8%'. Only JSON, no markdown.",
    geo:     "Generate 4 realistic geopolitical alert briefs. Cover active conflicts, diplomatic tensions, military movements, sanctions. Format as JSON array: [{headline, brief, region, threatLevel}] where threatLevel is watch/elevated/high/critical. Only JSON, no markdown.",
    climate: "Generate 4 realistic climate and natural disaster alerts. Cover storms, earthquakes, wildfires, floods, climate events. Format as JSON array: [{headline, brief, location, type}] where type is storm/earthquake/flood/fire/heatwave/other. Only JSON, no markdown.",
    cyber:   "Generate 4 realistic cybersecurity and tech news items. Cover breaches, vulnerabilities, AI developments, cyber attacks. Format as JSON array: [{headline, brief, target, riskLevel}] where riskLevel is low/medium/high/critical. Only JSON, no markdown.",
  },
  hi: {
    world:   "4 यथार्थवादी वर्तमान विश्व समाचार हेडलाइन बनाएं, प्रत्येक के साथ 1 वाक्य का विवरण। राजनीति, मानवीय, कूटनीति को कवर करें। JSON array format में दें: [{headline, brief, region, severity}] जहाँ severity है low/medium/high/critical। केवल JSON, कोई markdown नहीं।",
    finance: "4 यथार्थवादी वैश्विक वित्त/बाजार अपडेट बनाएं। शेयर बाजार, क्रिप्टो, कमोडिटी को कवर करें। JSON array: [{headline, brief, metric, change}] जहाँ change जैसे '+1.2%' या '-0.8%'। केवल JSON।",
    geo:     "4 यथार्थवादी भू-राजनीतिक अलर्ट बनाएं। सक्रिय संघर्ष, कूटनीतिक तनाव, सैन्य गतिविधियां। JSON array: [{headline, brief, region, threatLevel}] जहाँ threatLevel है watch/elevated/high/critical। केवल JSON।",
    climate: "4 यथार्थवादी जलवायु और प्राकृतिक आपदा अलर्ट बनाएं। तूफान, भूकंप, बाढ़, आग। JSON array: [{headline, brief, location, type}] जहाँ type है storm/earthquake/flood/fire/heatwave/other। केवल JSON।",
    cyber:   "4 यथार्थवादी साइबर सुरक्षा और तकनीक समाचार बनाएं। साइबर हमले, AI विकास, डेटा उल्लंघन। JSON array: [{headline, brief, target, riskLevel}] जहाँ riskLevel है low/medium/high/critical। केवल JSON।",
  },
};

const UI = {
  en: {
    appName: "WORLD MONITOR",
    appSub: "GLOBAL INTELLIGENCE FEED",
    feedActive: "INTELLIGENCE FEED",
    acquiring: "ACQUIRING SIGNAL...",
    feedsActive: (n) => `${n} FEEDS ACTIVE`,
    standby: "STANDBY",
    refresh: "↺ REFRESH",
    signalLost: "SIGNAL LOST — RETRY",
    retry: "RETRY",
    loadingIntel: (d) => `LOADING INTEL${".".repeat(d)}`,
    lastSync: (t) => `LAST SYNC: ${t}`,
    footer: "WORLDMONITOR v1.0 · AI-POWERED · CLAUDE SONNET",
    langToggle: "हिंदी",
  },
  hi: {
    appName: "विश्व मॉनिटर",
    appSub: "वैश्विक खुफिया फ़ीड",
    feedActive: "खुफिया फ़ीड",
    acquiring: "सिग्नल प्राप्त हो रहा है...",
    feedsActive: (n) => `${n} फ़ीड सक्रिय`,
    standby: "प्रतीक्षा",
    refresh: "↺ रिफ्रेश",
    signalLost: "सिग्नल खो गया — पुनः प्रयास",
    retry: "पुनः प्रयास",
    loadingIntel: (d) => `खुफिया लोड हो रहा है${".".repeat(d)}`,
    lastSync: (t) => `अंतिम सिंक: ${t}`,
    footer: "विश्व मॉनिटर v1.0 · AI-संचालित · क्लॉड सॉनेट",
    langToggle: "English",
  },
};

const SEVERITY_COLORS = {
  low: "#4ade80", medium: "#facc15", high: "#fb923c", critical: "#ef4444",
  watch: "#4ade80", elevated: "#facc15",
};

async function fetchSection(sectionId, lang) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [{ role: "user", content: PROMPTS[lang][sectionId] }],
    }),
  });
  const data = await res.json();
  const text = data.content?.map(b => b.text || "").join("") || "[]";
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

function useNow() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function TypedText({ text, speed = 18 }) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const t = setInterval(() => {
      if (i < text.length) { setDisplayed(text.slice(0, ++i)); }
      else clearInterval(t);
    }, speed);
    return () => clearInterval(t);
  }, [text, speed]);
  return <span>{displayed}<span style={{ opacity: displayed.length < text.length ? 1 : 0, color: "#4ade80" }}>▋</span></span>;
}

function SignalBars({ level = 3 }) {
  return (
    <span style={{ display: "inline-flex", gap: 2, alignItems: "flex-end", height: 14 }}>
      {[1,2,3,4].map(i => (
        <span key={i} style={{
          width: 3, height: 3 + i * 2.5,
          background: i <= level ? "#4ade80" : "#1e3a2a",
          borderRadius: 1, display: "block",
        }} />
      ))}
    </span>
  );
}

function LangToggle({ lang, onToggle }) {
  const ui = UI[lang];
  return (
    <button
      onClick={onToggle}
      style={{
        background: "rgba(74,222,128,0.08)",
        border: "1px solid rgba(74,222,128,0.3)",
        borderRadius: 5,
        padding: "4px 10px",
        color: "#4ade80",
        fontSize: lang === "hi" ? 11 : 10,
        fontFamily: lang === "hi" ? "'Noto Sans Devanagari', sans-serif" : "'Courier New', monospace",
        letterSpacing: lang === "hi" ? "0" : "0.1em",
        cursor: "pointer",
        transition: "all 0.15s",
        display: "flex", alignItems: "center", gap: 5,
        flexShrink: 0,
      }}
    >
      🌐 {ui.langToggle}
    </button>
  );
}

function NewsCard({ item, sectionId, lang }) {
  const [expanded, setExpanded] = useState(false);
  const severity = item.severity || item.threatLevel || item.riskLevel || "low";
  const badge = item.region || item.metric || item.location || item.target || "";
  const sColor = SEVERITY_COLORS[severity] || "#4ade80";
  const isHindi = lang === "hi";
  const fontFamily = isHindi ? "'Noto Sans Devanagari', 'Courier New', monospace" : "'Courier New', monospace";

  return (
    <div
      onClick={() => setExpanded(e => !e)}
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderLeft: `3px solid ${sColor}`,
        borderRadius: 6,
        padding: "12px 14px",
        marginBottom: 10,
        cursor: "pointer",
        WebkitTapHighlightColor: "transparent",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{
        position: "absolute", inset: 0,
        background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,70,0.015) 2px, rgba(0,255,70,0.015) 4px)",
        pointerEvents: "none",
      }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 11, color: sColor,
            letterSpacing: "0.06em", marginBottom: 5,
            display: "flex", gap: 8, alignItems: "center",
            fontFamily: "'Courier New', monospace",
          }}>
            <span style={{
              background: `${sColor}22`, color: sColor,
              border: `1px solid ${sColor}44`,
              padding: "1px 6px", borderRadius: 3,
              textTransform: "uppercase", fontSize: 10,
            }}>{severity}</span>
            {badge && <span style={{ color: "#666", fontSize: 10 }}>{badge}</span>}
          </div>
          <div style={{
            fontSize: isHindi ? 13 : 13.5,
            fontWeight: 600,
            color: "#e2e8f0", lineHeight: 1.5,
            fontFamily,
            letterSpacing: isHindi ? "0" : "0.01em",
          }}>
            {item.headline}
          </div>
          {expanded && (
            <div style={{
              marginTop: 8, fontSize: isHindi ? 12 : 12.5,
              color: "#94a3b8", lineHeight: 1.7,
              fontFamily,
              borderTop: "1px solid rgba(255,255,255,0.06)",
              paddingTop: 8,
            }}>
              <TypedText text={item.brief} speed={12} />
            </div>
          )}
          {item.change && (
            <div style={{
              marginTop: 6, fontSize: 14, fontWeight: 700,
              fontFamily: "'Courier New', monospace",
              color: item.change?.startsWith("+") ? "#4ade80" : "#ef4444",
            }}>{item.change}</div>
          )}
        </div>
        <div style={{
          color: "#334155", fontSize: 16, flexShrink: 0, marginTop: 2,
          transform: expanded ? "rotate(180deg)" : "none",
          transition: "transform 0.2s",
        }}>▾</div>
      </div>
    </div>
  );
}

function SectionPanel({ sectionId, active, lang }) {
  const [dataByLang, setDataByLang] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const sec = SECTIONS.find(s => s.id === sectionId);
  const ui = UI[lang];
  const isHindi = lang === "hi";
  const fontFamily = isHindi ? "'Noto Sans Devanagari', sans-serif" : "'Courier New', monospace";

  const data = dataByLang[lang] || null;

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const items = await fetchSection(sectionId, lang);
      setDataByLang(prev => ({ ...prev, [lang]: items }));
      setLastUpdated(new Date());
    } catch (e) {
      setError(ui.signalLost);
    }
    setLoading(false);
  }, [sectionId, lang]);

  useEffect(() => {
    if (active && !data && !loading) load();
  }, [active, data, loading, load]);

  // When lang changes and no data for new lang, auto-fetch
  useEffect(() => {
    if (active && !dataByLang[lang] && !loading) load();
  }, [lang]);

  if (!active) return null;

  return (
    <div style={{ padding: "0 14px 24px" }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "14px 0 12px",
        borderBottom: `1px solid ${sec.color}33`,
        marginBottom: 14,
      }}>
        <div style={{
          fontSize: 11,
          fontFamily: isHindi ? fontFamily : "'Courier New', monospace",
          color: sec.color, letterSpacing: isHindi ? "0" : "0.15em",
          display: "flex", gap: 8, alignItems: "center",
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: "50%",
            background: loading ? "#facc15" : (data ? sec.color : "#334155"),
            display: "inline-block",
            boxShadow: loading ? "0 0 8px #facc15" : (data ? `0 0 8px ${sec.color}` : "none"),
            animation: loading ? "pulse 0.8s infinite" : "none",
          }} />
          {loading ? ui.acquiring : (data ? ui.feedsActive(data.length) : ui.standby)}
        </div>
        <button
          onClick={load}
          disabled={loading}
          style={{
            background: "transparent", border: `1px solid ${sec.color}44`,
            color: sec.color, borderRadius: 4,
            padding: "4px 10px",
            fontSize: isHindi ? 11 : 10,
            fontFamily: isHindi ? fontFamily : "'Courier New', monospace",
            letterSpacing: isHindi ? "0" : "0.1em",
            cursor: loading ? "default" : "pointer",
            opacity: loading ? 0.5 : 1,
          }}
        >{ui.refresh}</button>
      </div>

      {error && (
        <div style={{
          background: "#ef444411", border: "1px solid #ef444444",
          borderRadius: 6, padding: "12px 14px",
          color: "#ef4444",
          fontFamily: isHindi ? fontFamily : "'Courier New', monospace",
          fontSize: 12, marginBottom: 12,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span>⚠ {error}</span>
          <button onClick={load} style={{
            background: "#ef444422", border: "1px solid #ef444455",
            color: "#ef4444", borderRadius: 4,
            padding: "3px 10px", fontSize: 11,
            fontFamily: isHindi ? fontFamily : "'Courier New', monospace",
            cursor: "pointer",
          }}>{ui.retry}</button>
        </div>
      )}

      {loading && !data && (
        <div style={{ padding: "40px 0", textAlign: "center" }}>
          <LoadingDots color={sec.color} lang={lang} />
        </div>
      )}

      {data && data.map((item, i) => (
        <NewsCard key={`${lang}-${i}`} item={item} sectionId={sectionId} lang={lang} />
      ))}

      {lastUpdated && (
        <div style={{
          textAlign: "center", fontSize: 10,
          color: "#334155",
          fontFamily: isHindi ? fontFamily : "'Courier New', monospace",
          letterSpacing: isHindi ? "0" : "0.1em",
          marginTop: 8,
        }}>
          {ui.lastSync(lastUpdated.toLocaleTimeString())}
        </div>
      )}
    </div>
  );
}

function LoadingDots({ color, lang }) {
  const [dots, setDots] = useState(0);
  const ui = UI[lang];
  const isHindi = lang === "hi";
  useEffect(() => {
    const t = setInterval(() => setDots(d => (d + 1) % 4), 400);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{
      color, fontSize: 13,
      letterSpacing: isHindi ? "0" : "0.2em",
      fontFamily: isHindi ? "'Noto Sans Devanagari', sans-serif" : "'Courier New', monospace",
    }}>
      {ui.loadingIntel(dots)}
    </div>
  );
}

export default function WorldMonitor() {
  const [active, setActive] = useState("world");
  const [lang, setLang] = useState("en");
  const now = useNow();
  const activeSec = SECTIONS.find(s => s.id === active);
  const ui = UI[lang];
  const isHindi = lang === "hi";
  const fontFamily = isHindi ? "'Noto Sans Devanagari', sans-serif" : "'Courier New', monospace";

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080c10",
      color: "#e2e8f0",
      fontFamily,
      maxWidth: 480,
      margin: "0 auto",
      position: "relative",
      overflowX: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { margin: 0; background: #080c10; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: #0d1117; }
        ::-webkit-scrollbar-thumb { background: #1e3a2a; border-radius: 3px; }
      `}</style>

      {/* Scanline */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, height: 2,
        background: "linear-gradient(transparent, rgba(74,222,128,0.08), transparent)",
        animation: "scanline 6s linear infinite",
        pointerEvents: "none", zIndex: 100,
      }} />

      {/* Top bar */}
      <div style={{
        padding: "12px 14px 10px",
        background: "rgba(8,12,16,0.95)",
        position: "sticky", top: 0, zIndex: 50,
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(74,222,128,0.15)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div>
            <div style={{
              fontSize: isHindi ? 14 : 15, fontWeight: 700,
              color: "#4ade80", letterSpacing: isHindi ? "0" : "0.2em",
              textShadow: "0 0 12px rgba(74,222,128,0.5)",
              fontFamily,
            }}>◈ {ui.appName}</div>
            <div style={{
              fontSize: 9, color: "#334155",
              letterSpacing: isHindi ? "0" : "0.15em",
              marginTop: 1, fontFamily,
            }}>{ui.appSub}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
            <LangToggle lang={lang} onToggle={() => setLang(l => l === "en" ? "hi" : "en")} />
            <div style={{
              fontSize: 11, color: "#4ade80",
              letterSpacing: "0.1em",
              fontFamily: "'Courier New', monospace",
              fontVariantNumeric: "tabular-nums",
            }}>
              {now.toLocaleTimeString("en-US", { hour12: false })}
            </div>
            <SignalBars level={4} />
          </div>
        </div>

        {/* Nav tabs */}
        <div style={{
          display: "flex", gap: 6, overflowX: "auto",
          paddingBottom: 2,
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}>
          {SECTIONS.map(sec => {
            const label = lang === "hi" ? sec.labelHi : sec.labelEn;
            return (
              <button
                key={sec.id}
                onClick={() => setActive(sec.id)}
                style={{
                  flexShrink: 0,
                  background: active === sec.id ? `${sec.color}18` : "transparent",
                  border: `1px solid ${active === sec.id ? sec.color + "66" : "#1e293b"}`,
                  borderRadius: 5,
                  padding: "6px 10px",
                  color: active === sec.id ? sec.color : "#475569",
                  fontSize: isHindi ? 11 : 10,
                  letterSpacing: isHindi ? "0" : "0.12em",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  display: "flex", alignItems: "center", gap: 5,
                  fontFamily,
                  boxShadow: active === sec.id ? `0 0 10px ${sec.color}22` : "none",
                }}
              >
                <span style={{ fontSize: 12 }}>{sec.icon}</span>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active section indicator */}
      <div style={{
        background: `linear-gradient(135deg, ${activeSec.color}08, transparent)`,
        padding: "10px 14px 6px",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: "50%",
          background: activeSec.color,
          boxShadow: `0 0 8px ${activeSec.color}`,
        }} />
        <span style={{
          fontSize: isHindi ? 11 : 10,
          color: activeSec.color,
          letterSpacing: isHindi ? "0" : "0.2em",
          fontFamily,
        }}>
          {lang === "hi" ? activeSec.labelHi : activeSec.labelEn} {ui.feedActive}
        </span>
        <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${activeSec.color}33, transparent)` }} />
      </div>

      {/* Content */}
      {SECTIONS.map(sec => (
        <SectionPanel key={sec.id} sectionId={sec.id} active={active === sec.id} lang={lang} />
      ))}

      {/* Footer */}
      <div style={{
        textAlign: "center", padding: "16px 14px",
        borderTop: "1px solid rgba(255,255,255,0.04)",
        color: "#1e293b", fontSize: 9,
        letterSpacing: isHindi ? "0" : "0.15em",
        fontFamily,
      }}>
        {ui.footer}
      </div>
    </div>
  );
}
