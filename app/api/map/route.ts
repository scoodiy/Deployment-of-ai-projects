import { NextRequest, NextResponse } from 'next/server';

const AMAP_KEY = process.env.AMAP_KEY || '';
const NOMINATIM_UA = 'xhblogs-toolbox/1.0 (https://xhblogs.com)';

interface AmapPoi {
  name: string;
  address: string;
  cityname?: string;
  location: string;
  type?: string;
}

interface NominatimItem {
  display_name?: string;
  name?: string;
  lon: string;
  lat: string;
  type?: string;
}

interface MapResult {
  name: string;
  address: string;
  location: string;
  type: string;
}

async function searchAmap(query: string): Promise<MapResult[]> {
  if (!AMAP_KEY) return [];
  const res = await fetch(
    `https://restapi.amap.com/v3/place/text?keywords=${encodeURIComponent(query)}&key=${AMAP_KEY}&offset=8&page=1`,
    { signal: AbortSignal.timeout(8000) }
  );
  const data = await res.json();
  if (data.status !== '1' || !data.pois) return [];
  return data.pois.map((poi: AmapPoi) => ({
    name: poi.name,
    address: poi.address || poi.cityname || '',
    location: poi.location,
    type: poi.type?.split(';')[0] || '',
  }));
}

async function searchNominatim(query: string): Promise<MapResult[]> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=8&q=${encodeURIComponent(query)}`,
      {
        headers: { 'User-Agent': NOMINATIM_UA },
        signal: AbortSignal.timeout(8000),
      }
    );
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map((item: NominatimItem) => ({
      name: item.display_name?.split(',')[0] || item.name || '',
      address: item.display_name || '',
      location: `${item.lon},${item.lat}`,
      type: item.type || '',
    }));
  } catch (e) {
    console.error('Nominatim search error:', e);
    return [];
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query') || '';

  if (!query.trim()) {
    return NextResponse.json({ error: 'query is required' }, { status: 400 });
  }

  try {
    let results: MapResult[] = [];
    if (AMAP_KEY) {
      results = await searchAmap(query);
    }
    if (results.length === 0) {
      results = await searchNominatim(query);
    }
    return NextResponse.json({ success: true, data: results });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'map search error' }, { status: 502 });
  }
}
