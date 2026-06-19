// app/api/weather/route.ts
import { NextRequest, NextResponse } from 'next/server';

// 天气描述中英文映射
const WEATHER_ZH: Record<string, string> = {
  'Sunny': '晴天', 'Clear': '晴朗', 'Partly cloudy': '多云', 'Partly Cloudy': '多云',
  'Cloudy': '阴天', 'Overcast': '阴天', 'Mist': '薄雾', 'Fog': '雾', 'Freezing fog': '冻雾',
  'Patchy rain possible': '可能有小雨', 'Light rain': '小雨', 'Light drizzle': '毛毛雨',
  'Moderate rain': '中雨', 'Heavy rain': '大雨', 'Torrential rain': '暴雨',
  'Light rain shower': '阵雨', 'Moderate or heavy rain shower': '大阵雨',
  'Thundery outbreaks possible': '可能有雷阵雨', 'Patchy light rain': '零星小雨',
  'Patchy light drizzle': '零星毛毛雨', 'Patchy light snow': '零星小雪',
  'Light snow': '小雪', 'Moderate snow': '中雪', 'Heavy snow': '大雪',
  'Blowing snow': '风吹雪', 'Blizzard': '暴风雪', 'Haze': '雾霾',
  'Smoky haze': '雾霾', 'Smoke': '烟雾',
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get('city') || '北京';

  try {
    // 支持坐标格式: "lat,lon"
    let queryCity = city;
    let resolvedCity = city;
    const coordMatch = city.match(/^(-?\d+\.?\d*),(-?\d+\.?\d*)$/);
    if (coordMatch) {
      // 坐标模式：用 wttr.in 坐标查询，并尝试反向解析城市名
      queryCity = `${coordMatch[1]},${coordMatch[2]}`;
      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${coordMatch[1]}&lon=${coordMatch[2]}&format=json&accept-language=zh-CN`,
          { headers: { 'User-Agent': 'ayuu.fun/1.0' } }
        );
        const geoData = await geoRes.json();
        resolvedCity = geoData.address?.city || geoData.address?.town || geoData.address?.county || geoData.address?.state || city;
      } catch {
        resolvedCity = city;
      }
    }

    const url = `https://wttr.in/${encodeURIComponent(queryCity)}?format=j1`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'curl/7.81.0' },
      cache: 'no-store',
    });
    const data = await res.json();

    if (data.current_condition && data.current_condition.length > 0) {
      const cur = data.current_condition[0];
      const descEn = cur.weatherDesc?.[0]?.value || 'Unknown';
      const desc = WEATHER_ZH[descEn] || descEn;

      return NextResponse.json({
        code: "200",
        city: resolvedCity,
        now: {
          temp: cur.temp_C,
          feelsLike: cur.FeelsLikeC,
          text: desc,
          icon: cur.weatherCode,
          windDir: cur.winddir16Point,
          windScale: cur.windspeedKmph,
          humidity: cur.humidity,
          vis: cur.visibility
        },
        updateTime: data.weather?.[0]?.date || new Date().toISOString()
      });
    }

    return NextResponse.json({ code: "500", message: "天气数据获取失败" }, { status: 500 });
  } catch (err: any) {
    return NextResponse.json({ code: "500", message: "天气服务暂时不可用" }, { status: 500 });
  }
}
