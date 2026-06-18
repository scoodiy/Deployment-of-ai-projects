// app/api/weather/route.ts
import { NextRequest, NextResponse } from 'next/server';

// 城市ID映射（常用城市）
const CITY_MAP: Record<string, string> = {
  '北京': '101010100', '上海': '101020100', '广州': '101280101',
  '深圳': '101280601', '杭州': '101210101', '南京': '101190101',
  '成都': '101270101', '武汉': '101200101', '西安': '101110101',
  '重庆': '101040100', '天津': '101030100', '苏州': '101190401',
  '长沙': '101250101', '郑州': '101180101', '东莞': '101281601',
  '青岛': '101120201', '沈阳': '101070101', '宁波': '101210401',
  '昆明': '101290101', '大连': '101070201', '厦门': '101230201',
  '哈尔滨': '101050101', '济南': '101120101', '福州': '101230101',
  '合肥': '101220101', '温州': '101210701', '石家庄': '101090101',
  '贵阳': '101260101', '南宁': '101300101', '长春': '101060101',
  '泉州': '101230501', '南昌': '101240101', '太原': '101100101',
  '烟台': '101120501', '珠海': '101280701', '乌鲁木齐': '101130101',
};

export async function GET(req: NextRequest) {
  const token = process.env.QWEATHER_KEY;
  const { searchParams } = new URL(req.url);
  const city = searchParams.get('city') || '北京';

  // 查找城市ID
  const locationId = CITY_MAP[city] || '101010100';

  if (!token) {
    // 无 token 时返回模拟数据
    return NextResponse.json({
      code: "200",
      city: city,
      now: {
        temp: "22",
        feelsLike: "20",
        text: "晴转多云（模拟）",
        icon: "101",
        windDir: "东南风",
        windScale: "2",
        humidity: "45",
        vis: "10"
      }
    });
  }

  const apiHosts = [
    'https://api.qweather.com/v7/weather/now',
    'https://devapi.qweather.com/v7/weather/now'
  ];

  for (const host of apiHosts) {
    try {
      const url = `${host}?location=${locationId}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept-Encoding': 'gzip',
          'User-Agent': 'Weather-Proxy/1.0'
        },
        cache: 'no-store'
      });

      const data = await res.json();

      if (data.code === "200" || res.status === 200) {
        return NextResponse.json({ ...data, city });
      }
    } catch (err: any) {
      continue;
    }
  }

  return NextResponse.json({
    code: "500",
    message: "天气服务暂时不可用"
  }, { status: 500 });
}
