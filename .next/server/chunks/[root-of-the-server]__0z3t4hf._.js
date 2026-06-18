module.exports=[93695,(e,t,E)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},14747,(e,t,E)=>{t.exports=e.x("path",()=>require("path"))},18622,(e,t,E)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},56704,(e,t,E)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},32319,(e,t,E)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},24725,(e,t,E)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},70406,(e,t,E)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},54799,(e,t,E)=>{t.exports=e.x("crypto",()=>require("crypto"))},85148,(e,t,E)=>{t.exports=e.x("better-sqlite3-90e2652d1716b047",()=>require("better-sqlite3-90e2652d1716b047"))},12e3,e=>{"use strict";var t=e.i(85148),E=e.i(14747),r=e.i(49632);let a=E.default.join(process.cwd(),"data","ayuu.db"),T=null;e.s(["getDb",0,function(){return T||((T=new t.default(a)).pragma("journal_mode = WAL"),T.pragma("foreign_keys = ON"),function(e){e.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      nickname TEXT DEFAULT '',
      avatar TEXT DEFAULT '',
      role TEXT DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS blogs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      summary TEXT DEFAULT '',
      content TEXT DEFAULT '',
      cover_image TEXT DEFAULT '',
      category TEXT DEFAULT '',
      tags TEXT DEFAULT '[]',
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'published')),
      view_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      published_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS media_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_type TEXT DEFAULT 'image' CHECK(file_type IN ('image', 'audio', 'video', 'document')),
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      url TEXT NOT NULL,
      size INTEGER DEFAULT 0,
      mime_type TEXT DEFAULT '',
      usage_type TEXT DEFAULT 'other' CHECK(usage_type IN ('home_background', 'blog_cover', 'gallery', 'avatar', 'about', 'other')),
      alt_text TEXT DEFAULT '',
      user_id INTEGER DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS music (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      artist TEXT DEFAULT '',
      url TEXT NOT NULL,
      cover_image TEXT DEFAULT '',
      duration INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      is_background INTEGER DEFAULT 0,
      is_enabled INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS site_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      config_key TEXT UNIQUE NOT NULL,
      config_value TEXT DEFAULT '',
      description TEXT DEFAULT '',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT DEFAULT '',
      target_id INTEGER,
      detail TEXT DEFAULT '',
      ip TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (admin_id) REFERENCES admins(id)
    );

    CREATE INDEX IF NOT EXISTS idx_blogs_status ON blogs(status);
    CREATE INDEX IF NOT EXISTS idx_blogs_slug ON blogs(slug);
    CREATE INDEX IF NOT EXISTS idx_media_files_type ON media_files(file_type);
    CREATE INDEX IF NOT EXISTS idx_music_enabled ON music(is_enabled);
    CREATE INDEX IF NOT EXISTS idx_operation_logs_admin ON operation_logs(admin_id);
    CREATE INDEX IF NOT EXISTS idx_site_config_key ON site_config(config_key);
  `);try{e.exec("ALTER TABLE blogs ADD COLUMN version INTEGER DEFAULT 1")}catch(e){}try{e.exec("ALTER TABLE site_config ADD COLUMN version INTEGER DEFAULT 1")}catch(e){}try{e.exec("ALTER TABLE music ADD COLUMN version INTEGER DEFAULT 1")}catch(e){}try{e.exec("ALTER TABLE media_files ADD COLUMN version INTEGER DEFAULT 1")}catch(e){}try{e.exec("ALTER TABLE users ADD COLUMN version INTEGER DEFAULT 1")}catch(e){}try{e.exec("ALTER TABLE users ADD COLUMN login_count INTEGER DEFAULT 0")}catch(e){}if(e.exec("CREATE TABLE IF NOT EXISTS favorites (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, target_type TEXT NOT NULL CHECK(target_type IN ('blog', 'music', 'media')), target_id INTEGER NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(user_id, target_type, target_id), FOREIGN KEY (user_id) REFERENCES users(id))"),e.exec("CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id)"),e.exec("CREATE INDEX IF NOT EXISTS idx_favorites_target ON favorites(target_type, target_id)"),e.exec("CREATE TABLE IF NOT EXISTS likes (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, target_type TEXT NOT NULL CHECK(target_type IN ('blog', 'music', 'media')), target_id INTEGER NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(user_id, target_type, target_id), FOREIGN KEY (user_id) REFERENCES users(id))"),e.exec("CREATE INDEX IF NOT EXISTS idx_likes_user ON likes(user_id)"),e.exec("CREATE INDEX IF NOT EXISTS idx_likes_target ON likes(target_type, target_id)"),e.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='comments'").get()?e.prepare("PRAGMA table_info(comments)").all().map(e=>e.name).includes("parent_id")||(e.exec("ALTER TABLE comments RENAME TO comments_old"),e.exec("CREATE TABLE comments (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, target_type TEXT NOT NULL CHECK(target_type IN ('blog', 'media', 'music', 'friend', 'project')), target_id INTEGER NOT NULL, content TEXT NOT NULL, parent_id INTEGER DEFAULT NULL, status TEXT DEFAULT 'approved' CHECK(status IN ('pending', 'approved', 'rejected')), created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id))"),e.exec("INSERT INTO comments (id, user_id, target_type, target_id, content, status, created_at, updated_at) SELECT id, user_id, target_type, target_id, content, status, created_at, created_at FROM comments_old"),e.exec("DROP TABLE comments_old")):e.exec("CREATE TABLE IF NOT EXISTS comments (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, target_type TEXT NOT NULL CHECK(target_type IN ('blog', 'media', 'music', 'friend', 'project')), target_id INTEGER NOT NULL, content TEXT NOT NULL, parent_id INTEGER DEFAULT NULL, status TEXT DEFAULT 'approved' CHECK(status IN ('pending', 'approved', 'rejected')), created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id))"),e.exec("CREATE INDEX IF NOT EXISTS idx_comments_target ON comments(target_type, target_id)"),e.exec("CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id)"),e.exec(`CREATE TABLE IF NOT EXISTS friends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT DEFAULT '',
    avatar TEXT DEFAULT '',
    theme_color TEXT DEFAULT 'rgba(99, 102, 241, 0.5)',
    sort_order INTEGER DEFAULT 0,
    is_enabled INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1
  )`),e.exec(`CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    icon TEXT DEFAULT '🚀',
    github_url TEXT DEFAULT '',
    tags TEXT DEFAULT '[]',
    sort_order INTEGER DEFAULT 0,
    is_enabled INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1
  )`),0===e.prepare("SELECT COUNT(*) as cnt FROM friends").get().cnt){let t=e.prepare("INSERT INTO friends (name, url, description, avatar, theme_color, sort_order) VALUES (?, ?, ?, ?, ?, ?)");for(let e of[["罗德岛 PRTS","https://prts.wiki/","记录泰拉大陆的各项数据与前文明遗迹，愿源石的阴霾早日散去。","https://bu.dusays.com/2026/03/24/69c1e38b4c370.jpg","rgba(16, 185, 129, 0.5)",0]])t.run(...e)}if(0===e.prepare("SELECT COUNT(*) as cnt FROM projects").get().cnt){let t=e.prepare("INSERT INTO projects (name, description, icon, github_url, tags, sort_order) VALUES (?, ?, ?, ?, ?, ?)");for(let e of[["Computational Chemistry Tool","该工具本作者使用在Win下的WSL2平台，系统为Ubuntu22，个人使用请依据自己数据进行修改（这些工具只是整合了一些流程）","🚀","https://github.com/heiehiehi/Computational_Chemistry_Tool",'["Gromacs","RMSF"]',0]])t.run(...e)}if(e.exec("CREATE TABLE IF NOT EXISTS user_ai_quota (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, date TEXT NOT NULL, used_count INTEGER DEFAULT 0, daily_limit INTEGER DEFAULT 10, UNIQUE(user_id, date), FOREIGN KEY (user_id) REFERENCES users(id))"),e.exec("CREATE INDEX IF NOT EXISTS idx_ai_quota_user_date ON user_ai_quota(user_id, date)"),!e.prepare("SELECT id FROM admins WHERE username = ?").get("admin")){let t=r.default.hashSync("admin123",10);e.prepare("INSERT INTO admins (username, password_hash, nickname, role) VALUES (?, ?, ?, ?)").run("admin",t,"管理员","admin")}let t=e.prepare("INSERT OR IGNORE INTO site_config (config_key, config_value, description) VALUES (?, ?, ?)");for(let[e,E,r]of[["site_title","y悠悠","网站标题"],["site_subtitle","的宝藏之地","网站副标题"],["hero_title","欢迎来到y悠悠的宝藏之地","首页主标题"],["hero_subtitle","代码、学术与生活的碎片记录","首页副标题"],["hero_background_image","","首页背景图"],["announcement","","公告内容"],["show_ai_assistant","true","显示AI助手"],["show_tools","true","显示工具箱"],["show_games","true","显示游戏中心"],["show_blog","true","显示博客"],["show_about","true","显示关于页面"],["show_music","true","显示音乐播放器"],["show_announcement","false","显示公告栏"],["bio","在代码、学术与分子动力学模拟间穿梭的普通人。近期正埋头于 GROMACS 模拟研究与神经网络计算。","个人简介"],["qq","1124533793","QQ号"],["wechat","y悠悠","微信号"]])t.run(e,E,r)}(T)),T}])},22321,e=>{"use strict";var t=e.i(47909),E=e.i(74017),r=e.i(96250),a=e.i(59756),T=e.i(61916),i=e.i(74677),s=e.i(69741),n=e.i(16795),o=e.i(87718),d=e.i(95169),N=e.i(47587),l=e.i(66012),u=e.i(70101),c=e.i(26937),R=e.i(10372),p=e.i(93695);e.i(52474);var A=e.i(220),_=e.i(89171),I=e.i(12e3);async function L(){let e=(0,I.getDb)().prepare("SELECT * FROM projects WHERE is_enabled = 1 ORDER BY sort_order ASC, created_at DESC").all();return _.NextResponse.json({projects:e})}e.s(["GET",0,L],31326);var U=e.i(31326);let g=new t.AppRouteRouteModule({definition:{kind:E.RouteKind.APP_ROUTE,page:"/api/projects/route",pathname:"/api/projects",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/app/api/projects/route.ts",nextConfigOutput:"",userland:U}),{workAsyncStorage:m,workUnitAsyncStorage:C,serverHooks:D}=g;async function O(e,t,r){r.requestMeta&&(0,a.setRequestMeta)(e,r.requestMeta),g.isDev&&(0,a.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let _="/api/projects/route";_=_.replace(/\/index$/,"")||"/";let I=await g.prepare(e,t,{srcPage:_,multiZoneDraftMode:!1});if(!I)return t.statusCode=400,t.end("Bad Request"),null==r.waitUntil||r.waitUntil.call(r,Promise.resolve()),null;let{buildId:L,params:U,nextConfig:m,parsedUrl:C,isDraftMode:D,prerenderManifest:O,routerServerContext:F,isOnDemandRevalidate:S,revalidateOnlyGenerated:M,resolvedPathname:h,clientReferenceManifest:x,serverActionsManifest:f}=I,X=(0,s.normalizeAppPath)(_),v=!!(O.dynamicRoutes[X]||O.routes[h]),y=async()=>((null==F?void 0:F.render404)?await F.render404(e,t,C,!1):t.end("This page could not be found"),null);if(v&&!D){let e=!!O.routes[h],t=O.dynamicRoutes[X];if(t&&!1===t.fallback&&!e){if(m.adapterPath)return await y();throw new p.NoFallbackError}}let b=null;!v||g.isDev||D||(b="/index"===(b=h)?"/":b);let G=!0===g.isDev||!v,P=v&&!G;f&&x&&(0,i.setManifestsSingleton)({page:_,clientReferenceManifest:x,serverActionsManifest:f});let w=e.method||"GET",k=(0,T.getTracer)(),K=k.getActiveScopeSpan(),q=!!(null==F?void 0:F.isWrappedByNextServer),j=!!(0,a.getRequestMeta)(e,"minimalMode"),Y=(0,a.getRequestMeta)(e,"incrementalCache")||await g.getIncrementalCache(e,m,O,j);null==Y||Y.resetRequestCache(),globalThis.__incrementalCache=Y;let H={params:U,previewProps:O.preview,renderOpts:{experimental:{authInterrupts:!!m.experimental.authInterrupts},cacheComponents:!!m.cacheComponents,supportsDynamicResponse:G,incrementalCache:Y,cacheLifeProfiles:m.cacheLife,waitUntil:r.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,E,r,a)=>g.onRequestError(e,t,r,a,F)},sharedContext:{buildId:L}},B=new n.NodeNextRequest(e),W=new n.NodeNextResponse(t),$=o.NextRequestAdapter.fromNodeNextRequest(B,(0,o.signalFromNodeResponse)(t));try{let a,i=async e=>g.handle($,H).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let E=k.getRootSpanAttributes();if(!E)return;if(E.get("next.span_type")!==d.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${E.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let r=E.get("next.route");if(r){let t=`${w} ${r}`;e.setAttributes({"next.route":r,"http.route":r,"next.span_name":t}),e.updateName(t),a&&a!==e&&(a.setAttribute("http.route",r),a.updateName(t))}else e.updateName(`${w} ${_}`)}),s=async a=>{var T,s;let n=async({previousCacheEntry:E})=>{try{if(!j&&S&&M&&!E)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let T=await i(a);e.fetchMetrics=H.renderOpts.fetchMetrics;let s=H.renderOpts.pendingWaitUntil;s&&r.waitUntil&&(r.waitUntil(s),s=void 0);let n=H.renderOpts.collectedTags;if(!v)return await (0,l.sendResponse)(B,W,T,H.renderOpts.pendingWaitUntil),null;{let e=await T.blob(),t=(0,u.toNodeOutgoingHttpHeaders)(T.headers);n&&(t[R.NEXT_CACHE_TAGS_HEADER]=n),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let E=void 0!==H.renderOpts.collectedRevalidate&&!(H.renderOpts.collectedRevalidate>=R.INFINITE_CACHE)&&H.renderOpts.collectedRevalidate,r=void 0===H.renderOpts.collectedExpire||H.renderOpts.collectedExpire>=R.INFINITE_CACHE?void 0:H.renderOpts.collectedExpire;return{value:{kind:A.CachedRouteKind.APP_ROUTE,status:T.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:E,expire:r}}}}catch(t){throw(null==E?void 0:E.isStale)&&await g.onRequestError(e,t,{routerKind:"App Router",routePath:_,routeType:"route",revalidateReason:(0,N.getRevalidateReason)({isStaticGeneration:P,isOnDemandRevalidate:S})},!1,F),t}},o=await g.handleResponse({req:e,nextConfig:m,cacheKey:b,routeKind:E.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:O,isRoutePPREnabled:!1,isOnDemandRevalidate:S,revalidateOnlyGenerated:M,responseGenerator:n,waitUntil:r.waitUntil,isMinimalMode:j});if(!v)return null;if((null==o||null==(T=o.value)?void 0:T.kind)!==A.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==o||null==(s=o.value)?void 0:s.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});j||t.setHeader("x-nextjs-cache",S?"REVALIDATED":o.isMiss?"MISS":o.isStale?"STALE":"HIT"),D&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let d=(0,u.fromNodeOutgoingHttpHeaders)(o.value.headers);return j&&v||d.delete(R.NEXT_CACHE_TAGS_HEADER),!o.cacheControl||t.getHeader("Cache-Control")||d.get("Cache-Control")||d.set("Cache-Control",(0,c.getCacheControlHeader)(o.cacheControl)),await (0,l.sendResponse)(B,W,new Response(o.value.body,{headers:d,status:o.value.status||200})),null};q&&K?await s(K):(a=k.getActiveScopeSpan(),await k.withPropagatedContext(e.headers,()=>k.trace(d.BaseServerSpan.handleRequest,{spanName:`${w} ${_}`,kind:T.SpanKind.SERVER,attributes:{"http.method":w,"http.target":e.url}},s),void 0,!q))}catch(t){if(t instanceof p.NoFallbackError||await g.onRequestError(e,t,{routerKind:"App Router",routePath:X,routeType:"route",revalidateReason:(0,N.getRevalidateReason)({isStaticGeneration:P,isOnDemandRevalidate:S})},!1,F),v)throw t;return await (0,l.sendResponse)(B,W,new Response(null,{status:500})),null}}e.s(["handler",0,O,"patchFetch",0,function(){return(0,r.patchFetch)({workAsyncStorage:m,workUnitAsyncStorage:C})},"routeModule",0,g,"serverHooks",0,D,"workAsyncStorage",0,m,"workUnitAsyncStorage",0,C],22321)}];

//# sourceMappingURL=%5Broot-of-the-server%5D__0z3t4hf._.js.map