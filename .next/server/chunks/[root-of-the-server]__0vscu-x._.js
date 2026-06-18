module.exports=[93695,(e,t,r)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},14747,(e,t,r)=>{t.exports=e.x("path",()=>require("path"))},18622,(e,t,r)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},56704,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},32319,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},24725,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},70406,(e,t,r)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},54799,(e,t,r)=>{t.exports=e.x("crypto",()=>require("crypto"))},85148,(e,t,r)=>{t.exports=e.x("better-sqlite3-90e2652d1716b047",()=>require("better-sqlite3-90e2652d1716b047"))},12e3,e=>{"use strict";var t=e.i(85148),r=e.i(14747),a=e.i(49632);let E=r.default.join(process.cwd(),"data","ayuu.db"),i=null;e.s(["getDb",0,function(){return i||((i=new t.default(E)).pragma("journal_mode = WAL"),i.pragma("foreign_keys = ON"),function(e){e.exec(`
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
  )`),0===e.prepare("SELECT COUNT(*) as cnt FROM friends").get().cnt){let t=e.prepare("INSERT INTO friends (name, url, description, avatar, theme_color, sort_order) VALUES (?, ?, ?, ?, ?, ?)");for(let e of[["罗德岛 PRTS","https://prts.wiki/","记录泰拉大陆的各项数据与前文明遗迹，愿源石的阴霾早日散去。","https://bu.dusays.com/2026/03/24/69c1e38b4c370.jpg","rgba(16, 185, 129, 0.5)",0]])t.run(...e)}if(0===e.prepare("SELECT COUNT(*) as cnt FROM projects").get().cnt){let t=e.prepare("INSERT INTO projects (name, description, icon, github_url, tags, sort_order) VALUES (?, ?, ?, ?, ?, ?)");for(let e of[["Computational Chemistry Tool","该工具本作者使用在Win下的WSL2平台，系统为Ubuntu22，个人使用请依据自己数据进行修改（这些工具只是整合了一些流程）","🚀","https://github.com/heiehiehi/Computational_Chemistry_Tool",'["Gromacs","RMSF"]',0]])t.run(...e)}if(e.exec("CREATE TABLE IF NOT EXISTS user_ai_quota (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, date TEXT NOT NULL, used_count INTEGER DEFAULT 0, daily_limit INTEGER DEFAULT 10, UNIQUE(user_id, date), FOREIGN KEY (user_id) REFERENCES users(id))"),e.exec("CREATE INDEX IF NOT EXISTS idx_ai_quota_user_date ON user_ai_quota(user_id, date)"),!e.prepare("SELECT id FROM admins WHERE username = ?").get("admin")){let t=a.default.hashSync("admin123",10);e.prepare("INSERT INTO admins (username, password_hash, nickname, role) VALUES (?, ?, ?, ?)").run("admin",t,"管理员","admin")}let t=e.prepare("INSERT OR IGNORE INTO site_config (config_key, config_value, description) VALUES (?, ?, ?)");for(let[e,r,a]of[["site_title","y悠悠","网站标题"],["site_subtitle","的宝藏之地","网站副标题"],["hero_title","欢迎来到y悠悠的宝藏之地","首页主标题"],["hero_subtitle","代码、学术与生活的碎片记录","首页副标题"],["hero_background_image","","首页背景图"],["announcement","","公告内容"],["show_ai_assistant","true","显示AI助手"],["show_tools","true","显示工具箱"],["show_games","true","显示游戏中心"],["show_blog","true","显示博客"],["show_about","true","显示关于页面"],["show_music","true","显示音乐播放器"],["show_announcement","false","显示公告栏"],["bio","在代码、学术与分子动力学模拟间穿梭的普通人。近期正埋头于 GROMACS 模拟研究与神经网络计算。","个人简介"],["qq","1124533793","QQ号"],["wechat","y悠悠","微信号"]])t.run(e,r,a)}(i)),i}])},80549,e=>{"use strict";var t=e.i(27957),r=e.i(92368),a=e.i(49632);let E=new TextEncoder().encode(process.env.JWT_SECRET||"ayuu-fun-admin-secret-key-2026"),i="admin_token";async function T(e){return a.default.hash(e,10)}async function s(e,t){return a.default.compare(e,t)}async function n(e){return new t.SignJWT(e).setProtectedHeader({alg:"HS256"}).setIssuedAt().setExpirationTime("7d").sign(E)}async function o(e){try{let{payload:t}=await (0,r.jwtVerify)(e,E);return t}catch{return null}}async function d(e){let t=e.headers.get("Authorization");if(t?.startsWith("Bearer "))return t.slice(7);let r=e.headers.get("Cookie");if(r){let e=r.split(";").map(e=>e.trim()).find(e=>e.startsWith(`${i}=`));if(e)return e.split("=")[1]}return null}async function u(e){let t=await d(e);return t?o(t):null}e.s(["clearTokenCookie",0,function(){return`${i}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`},"createToken",0,n,"getAdminFromRequest",0,u,"hashPassword",0,T,"setTokenCookie",0,function(e){return`${i}=${e}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`},"verifyPassword",0,s])},15073,e=>{"use strict";var t=e.i(47909),r=e.i(74017),a=e.i(96250),E=e.i(59756),i=e.i(61916),T=e.i(74677),s=e.i(69741),n=e.i(16795),o=e.i(87718),d=e.i(95169),u=e.i(47587),l=e.i(66012),c=e.i(70101),N=e.i(26937),R=e.i(10372),p=e.i(93695);e.i(52474);var A=e.i(220),_=e.i(89171),I=e.i(12e3),L=e.i(80549);async function U(e,{params:t}){if(!await (0,L.getAdminFromRequest)(e))return _.NextResponse.json({error:"未登录"},{status:401});let{id:r}=await t,a=await e.json();return(0,I.getDb)().prepare(`
    UPDATE friends SET
      name = COALESCE(?, name),
      url = COALESCE(?, url),
      description = COALESCE(?, description),
      avatar = COALESCE(?, avatar),
      theme_color = COALESCE(?, theme_color),
      sort_order = COALESCE(?, sort_order),
      is_enabled = COALESCE(?, is_enabled),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(a.name,a.url,a.description,a.avatar,a.theme_color,a.sort_order,a.is_enabled,r),_.NextResponse.json({success:!0})}async function m(e,{params:t}){let r=await (0,L.getAdminFromRequest)(e);if(!r)return _.NextResponse.json({error:"未登录"},{status:401});let{id:a}=await t,E=(0,I.getDb)(),i=E.prepare("SELECT name FROM friends WHERE id = ?").get(a);return i?(E.prepare("DELETE FROM friends WHERE id = ?").run(a),E.prepare("INSERT INTO operation_logs (admin_id, action, target_type, target_id, detail, ip) VALUES (?, ?, ?, ?, ?, ?)").run(r.adminId,"delete","friend",a,`删除友链: ${i.name}`,e.headers.get("x-forwarded-for")||"unknown"),_.NextResponse.json({success:!0})):_.NextResponse.json({error:"友链不存在"},{status:404})}e.s(["DELETE",0,m,"PUT",0,U],12434);var g=e.i(12434);let C=new t.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/api/admin/friends/[id]/route",pathname:"/api/admin/friends/[id]",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/app/api/admin/friends/[id]/route.ts",nextConfigOutput:"",userland:g}),{workAsyncStorage:O,workUnitAsyncStorage:D,serverHooks:S}=C;async function h(e,t,a){a.requestMeta&&(0,E.setRequestMeta)(e,a.requestMeta),C.isDev&&(0,E.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let _="/api/admin/friends/[id]/route";_=_.replace(/\/index$/,"")||"/";let I=await C.prepare(e,t,{srcPage:_,multiZoneDraftMode:!1});if(!I)return t.statusCode=400,t.end("Bad Request"),null==a.waitUntil||a.waitUntil.call(a,Promise.resolve()),null;let{buildId:L,params:U,nextConfig:m,parsedUrl:g,isDraftMode:O,prerenderManifest:D,routerServerContext:S,isOnDemandRevalidate:h,revalidateOnlyGenerated:F,resolvedPathname:f,clientReferenceManifest:x,serverActionsManifest:M}=I,y=(0,s.normalizeAppPath)(_),v=!!(D.dynamicRoutes[y]||D.routes[f]),X=async()=>((null==S?void 0:S.render404)?await S.render404(e,t,g,!1):t.end("This page could not be found"),null);if(v&&!O){let e=!!D.routes[f],t=D.dynamicRoutes[y];if(t&&!1===t.fallback&&!e){if(m.adapterPath)return await X();throw new p.NoFallbackError}}let b=null;!v||C.isDev||O||(b="/index"===(b=f)?"/":b);let w=!0===C.isDev||!v,P=v&&!w;M&&x&&(0,T.setManifestsSingleton)({page:_,clientReferenceManifest:x,serverActionsManifest:M});let G=e.method||"GET",k=(0,i.getTracer)(),q=k.getActiveScopeSpan(),K=!!(null==S?void 0:S.isWrappedByNextServer),H=!!(0,E.getRequestMeta)(e,"minimalMode"),j=(0,E.getRequestMeta)(e,"incrementalCache")||await C.getIncrementalCache(e,m,D,H);null==j||j.resetRequestCache(),globalThis.__incrementalCache=j;let Y={params:U,previewProps:D.preview,renderOpts:{experimental:{authInterrupts:!!m.experimental.authInterrupts},cacheComponents:!!m.cacheComponents,supportsDynamicResponse:w,incrementalCache:j,cacheLifeProfiles:m.cacheLife,waitUntil:a.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,a,E)=>C.onRequestError(e,t,a,E,S)},sharedContext:{buildId:L}},B=new n.NodeNextRequest(e),W=new n.NodeNextResponse(t),$=o.NextRequestAdapter.fromNodeNextRequest(B,(0,o.signalFromNodeResponse)(t));try{let E,T=async e=>C.handle($,Y).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=k.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==d.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let a=r.get("next.route");if(a){let t=`${G} ${a}`;e.setAttributes({"next.route":a,"http.route":a,"next.span_name":t}),e.updateName(t),E&&E!==e&&(E.setAttribute("http.route",a),E.updateName(t))}else e.updateName(`${G} ${_}`)}),s=async E=>{var i,s;let n=async({previousCacheEntry:r})=>{try{if(!H&&h&&F&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let i=await T(E);e.fetchMetrics=Y.renderOpts.fetchMetrics;let s=Y.renderOpts.pendingWaitUntil;s&&a.waitUntil&&(a.waitUntil(s),s=void 0);let n=Y.renderOpts.collectedTags;if(!v)return await (0,l.sendResponse)(B,W,i,Y.renderOpts.pendingWaitUntil),null;{let e=await i.blob(),t=(0,c.toNodeOutgoingHttpHeaders)(i.headers);n&&(t[R.NEXT_CACHE_TAGS_HEADER]=n),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==Y.renderOpts.collectedRevalidate&&!(Y.renderOpts.collectedRevalidate>=R.INFINITE_CACHE)&&Y.renderOpts.collectedRevalidate,a=void 0===Y.renderOpts.collectedExpire||Y.renderOpts.collectedExpire>=R.INFINITE_CACHE?void 0:Y.renderOpts.collectedExpire;return{value:{kind:A.CachedRouteKind.APP_ROUTE,status:i.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:a}}}}catch(t){throw(null==r?void 0:r.isStale)&&await C.onRequestError(e,t,{routerKind:"App Router",routePath:_,routeType:"route",revalidateReason:(0,u.getRevalidateReason)({isStaticGeneration:P,isOnDemandRevalidate:h})},!1,S),t}},o=await C.handleResponse({req:e,nextConfig:m,cacheKey:b,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:D,isRoutePPREnabled:!1,isOnDemandRevalidate:h,revalidateOnlyGenerated:F,responseGenerator:n,waitUntil:a.waitUntil,isMinimalMode:H});if(!v)return null;if((null==o||null==(i=o.value)?void 0:i.kind)!==A.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==o||null==(s=o.value)?void 0:s.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});H||t.setHeader("x-nextjs-cache",h?"REVALIDATED":o.isMiss?"MISS":o.isStale?"STALE":"HIT"),O&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let d=(0,c.fromNodeOutgoingHttpHeaders)(o.value.headers);return H&&v||d.delete(R.NEXT_CACHE_TAGS_HEADER),!o.cacheControl||t.getHeader("Cache-Control")||d.get("Cache-Control")||d.set("Cache-Control",(0,N.getCacheControlHeader)(o.cacheControl)),await (0,l.sendResponse)(B,W,new Response(o.value.body,{headers:d,status:o.value.status||200})),null};K&&q?await s(q):(E=k.getActiveScopeSpan(),await k.withPropagatedContext(e.headers,()=>k.trace(d.BaseServerSpan.handleRequest,{spanName:`${G} ${_}`,kind:i.SpanKind.SERVER,attributes:{"http.method":G,"http.target":e.url}},s),void 0,!K))}catch(t){if(t instanceof p.NoFallbackError||await C.onRequestError(e,t,{routerKind:"App Router",routePath:y,routeType:"route",revalidateReason:(0,u.getRevalidateReason)({isStaticGeneration:P,isOnDemandRevalidate:h})},!1,S),v)throw t;return await (0,l.sendResponse)(B,W,new Response(null,{status:500})),null}}e.s(["handler",0,h,"patchFetch",0,function(){return(0,a.patchFetch)({workAsyncStorage:O,workUnitAsyncStorage:D})},"routeModule",0,C,"serverHooks",0,S,"workAsyncStorage",0,O,"workUnitAsyncStorage",0,D],15073)}];

//# sourceMappingURL=%5Broot-of-the-server%5D__0vscu-x._.js.map