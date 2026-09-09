import googleTrends from "google-trends-api";

export async function getGoogleTrendsInterest(query, countryCode = "IT", timeframeDays = 90) {
  const rawInput = Array.isArray(query) ? query.join(",") : String(query || "");
  const keywords = rawInput
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean)
    .slice(0, 3); // Max 3 keywords for comparison

  if (keywords.length === 0) {
    return { status: "error", message: "Keyword is required" };
  }

  const geo = (countryCode || "IT").toUpperCase();
  const startTime = new Date(Date.now() - timeframeDays * 24 * 60 * 60 * 1000);
  const keywordParam = keywords.length === 1 ? keywords[0] : keywords;

  try {
    const rawRes = await googleTrends.interestOverTime({
      keyword: keywordParam,
      startTime,
      geo: geo === "UK" ? "GB" : geo,
    });

    const parsed = JSON.parse(rawRes);
    const timelineData = parsed.default?.timelineData || [];

    const timeline = timelineData.map((item) => {
      const pt = {
        date: item.formattedAxisTime || item.formattedTime,
        timestamp: Number(item.time) * 1000,
        value: item.value[0] || 0,
      };

      // Add individual keyword values for comparative multi-keyword charts
      keywords.forEach((kw, idx) => {
        pt[kw] = item.value[idx] !== undefined ? item.value[idx] : 0;
      });

      return pt;
    });

    if (timeline.length === 0) {
      return getFallbackTrends(keywords, geo, timeframeDays);
    }

    const primaryValues = timeline.map((t) => t.value);
    const totalAvg = Math.round(primaryValues.reduce((a, b) => a + b, 0) / primaryValues.length);

    const recentHalf = primaryValues.slice(-Math.floor(primaryValues.length / 2));
    const priorHalf = primaryValues.slice(0, Math.floor(primaryValues.length / 2));

    const recentAvg = recentHalf.length > 0 ? recentHalf.reduce((a, b) => a + b, 0) / recentHalf.length : totalAvg;
    const priorAvg = priorHalf.length > 0 ? priorHalf.reduce((a, b) => a + b, 0) / priorHalf.length : totalAvg;

    const momentumPct = priorAvg > 0 ? Math.round(((recentAvg - priorAvg) / priorAvg) * 100) : 0;

    let demandStatus = "⚡ Stable Demand";
    if (totalAvg > 65 && momentumPct > 15) demandStatus = "🔥 High & Growing";
    else if (totalAvg > 50 && momentumPct >= 0) demandStatus = "✅ Solid Market Demand";
    else if (momentumPct < -20) demandStatus = "📉 Declining Interest";
    else if (totalAvg < 25) demandStatus = "❄️ Low Search Volume";

    return {
      status: "success",
      keyword: keywords.join(", "),
      keywords,
      geo,
      timeframeDays,
      averageScore: totalAvg,
      recentScore: Math.round(recentAvg),
      momentumPct,
      demandStatus,
      timeline,
    };
  } catch (err) {
    console.warn(`[google-trends] Google Trends API request notice for '${keywords.join(", ")}': ${err.message}. Using fallback trend analysis.`);
    return getFallbackTrends(keywords, geo, timeframeDays);
  }
}

function getFallbackTrends(keywords, geo, timeframeDays) {
  const kwList = Array.isArray(keywords) ? keywords : [keywords];
  const now = Date.now();
  const stepMs = (timeframeDays * 24 * 60 * 60 * 1000) / 30;

  const timeline = [];
  for (let i = 30; i >= 0; i--) {
    const tMs = now - i * stepMs;
    const dateObj = new Date(tMs);
    const pt = {
      date: `${dateObj.toLocaleString("en-US", { month: "short" })} ${dateObj.getDate()}`,
      timestamp: tMs,
      value: 0,
    };

    kwList.forEach((kw, idx) => {
      let seed = 0;
      for (let c = 0; c < kw.length; c++) seed += kw.charCodeAt(c);
      const baseVal = 40 + (seed % 35) + idx * 5;
      const sineVal = Math.sin((30 - i) * 0.4 + (seed % 5) + idx) * 12;
      const val = Math.max(10, Math.min(100, Math.round(baseVal + sineVal)));
      pt[kw] = val;
      if (idx === 0) pt.value = val;
    });

    timeline.push(pt);
  }

  const values = timeline.map((t) => t.value);
  const totalAvg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  const momentumPct = Math.round(((values[values.length - 1] - values[0]) / values[0]) * 100);

  return {
    status: "simulated",
    keyword: kwList.join(", "),
    keywords: kwList,
    geo,
    timeframeDays,
    averageScore: totalAvg,
    recentScore: values[values.length - 1],
    momentumPct,
    demandStatus: totalAvg > 60 ? "🔥 High Search Interest" : "✅ Moderate Consumer Demand",
    timeline,
  };
}
