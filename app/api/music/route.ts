import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

const NET_EASE_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  Referer: 'https://music.163.com/',
}

type SongResult = {
  id: string
  name?: string
  artist?: string
  author?: string
  cover?: string
  pic?: string
  url?: string
  lrc?: string
  error?: string
}

// 从网易云获取单首歌曲详情（含歌词）
async function fetchFromNetEase(songId: string): Promise<SongResult> {
  try {
    const [detailRes, lrcRes] = await Promise.all([
      fetch(
        `https://music.163.com/api/song/detail/?id=${songId}&ids=[${songId}]`,
        { headers: NET_EASE_HEADERS, signal: AbortSignal.timeout(6000) },
      ),
      fetch(
        `https://music.163.com/api/song/lyric?id=${songId}&lv=-1&kv=-1&tv=-1`,
        { headers: NET_EASE_HEADERS, signal: AbortSignal.timeout(6000) },
      ).catch(() => null),
    ])

    const detail = await detailRes.json()
    const song = detail.songs?.[0]

    if (!song) {
      return { id: songId, error: 'not_found' }
    }

    let lrcText = ''
    if (lrcRes && lrcRes.ok) {
      try {
        const lrcData = await lrcRes.json()
        lrcText = lrcData.lrc?.lyric || ''
      } catch (e) {
        console.error('Lyric parse error:', e);
        /* 歌词可选，失败不影响主流程 */
      }
    }

    const artistName = song.artists?.[0]?.name || '未知歌手'

    return {
      id: songId,
      name: song.name,
      artist: artistName,
      author: artistName,
      cover: song.album?.picUrl || '',
      pic: song.album?.picUrl || '',
      url: `https://music.163.com/song/media/outer/url?id=${songId}.mp3`,
      lrc: lrcText,
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[api/music] 获取歌曲 ${songId} 失败:`, error);
    }
    return { id: songId, error: String(error) }
  }
}

export async function GET(request: NextRequest) {
  const ids = request.nextUrl.searchParams.get('ids')

  // 无 ids 参数时：从数据库读取（后台管理的歌曲）
  if (!ids) {
    const db = getDb()
    const rows = db.prepare(
      'SELECT id, title, artist, url, cover_image FROM music WHERE is_enabled = 1 ORDER BY sort_order ASC, created_at DESC'
    ).all() as Array<{ id: number; title: string; artist: string; url: string; cover_image: string }>

    // 同时尝试从网易云拉歌词（有网易云 ID 的歌曲）
    const results: SongResult[] = await Promise.all(
      rows.map(async (row) => {
        // 尝试从 url 中提取网易云歌曲 ID
        const match = row.url.match(/id=(\d+)/)
        let lrcText = ''
        if (match) {
          const netEaseId = match[1]
          try {
            const lrcRes = await fetch(
              `https://music.163.com/api/song/lyric?id=${netEaseId}&lv=-1&kv=-1&tv=-1`,
              { headers: NET_EASE_HEADERS, signal: AbortSignal.timeout(6000) },
            )
            if (lrcRes.ok) {
              const lrcData = await lrcRes.json()
              lrcText = lrcData.lrc?.lyric || ''
            }
          } catch (e) {
            console.error('Lyric fetch error:', e);
            /* 歌词可选 */
          }
        }
        return {
          id: String(row.id),
          name: row.title,
          artist: row.artist || '未知歌手',
          author: row.artist || '未知歌手',
          cover: row.cover_image || '',
          pic: row.cover_image || '',
          url: row.url,
          lrc: lrcText,
        }
      })
    )

    return NextResponse.json(results)
  }

  // 有 ids 参数时：保持原有逻辑，从网易云获取
  const songIds = ids.split(',').map((id) => id.trim()).filter(Boolean)
  const results: SongResult[] = await Promise.all(songIds.map(fetchFromNetEase))
  return NextResponse.json(results)
}
