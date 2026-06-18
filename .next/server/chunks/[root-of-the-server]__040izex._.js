module.exports=[93695,(e,t,r)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},14747,(e,t,r)=>{t.exports=e.x("path",()=>require("path"))},18622,(e,t,r)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},56704,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},32319,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},24725,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},70406,(e,t,r)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},54799,(e,t,r)=>{t.exports=e.x("crypto",()=>require("crypto"))},85148,(e,t,r)=>{t.exports=e.x("better-sqlite3-90e2652d1716b047",()=>require("better-sqlite3-90e2652d1716b047"))},12e3,e=>{"use strict";var t=e.i(85148),r=e.i(14747),a=e.i(49632);let E=r.default.join(process.cwd(),"data","ayuu.db"),s=null;e.s(["getDb",0,function(){return s||((s=new t.default(E)).pragma("journal_mode = WAL"),s.pragma("foreign_keys = ON"),function(e){e.exec(`
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
  )`),0===e.prepare("SELECT COUNT(*) as cnt FROM friends").get().cnt){let t=e.prepare("INSERT INTO friends (name, url, description, avatar, theme_color, sort_order) VALUES (?, ?, ?, ?, ?, ?)");for(let e of[["罗德岛 PRTS","https://prts.wiki/","记录泰拉大陆的各项数据与前文明遗迹，愿源石的阴霾早日散去。","https://bu.dusays.com/2026/03/24/69c1e38b4c370.jpg","rgba(16, 185, 129, 0.5)",0]])t.run(...e)}if(0===e.prepare("SELECT COUNT(*) as cnt FROM projects").get().cnt){let t=e.prepare("INSERT INTO projects (name, description, icon, github_url, tags, sort_order) VALUES (?, ?, ?, ?, ?, ?)");for(let e of[["Computational Chemistry Tool","该工具本作者使用在Win下的WSL2平台，系统为Ubuntu22，个人使用请依据自己数据进行修改（这些工具只是整合了一些流程）","🚀","https://github.com/heiehiehi/Computational_Chemistry_Tool",'["Gromacs","RMSF"]',0]])t.run(...e)}if(e.exec("CREATE TABLE IF NOT EXISTS user_ai_quota (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, date TEXT NOT NULL, used_count INTEGER DEFAULT 0, daily_limit INTEGER DEFAULT 10, UNIQUE(user_id, date), FOREIGN KEY (user_id) REFERENCES users(id))"),e.exec("CREATE INDEX IF NOT EXISTS idx_ai_quota_user_date ON user_ai_quota(user_id, date)"),!e.prepare("SELECT id FROM admins WHERE username = ?").get("admin")){let t=a.default.hashSync("admin123",10);e.prepare("INSERT INTO admins (username, password_hash, nickname, role) VALUES (?, ?, ?, ?)").run("admin",t,"管理员","admin")}let t=e.prepare("INSERT OR IGNORE INTO site_config (config_key, config_value, description) VALUES (?, ?, ?)");for(let[e,r,a]of[["site_title","y悠悠","网站标题"],["site_subtitle","的宝藏之地","网站副标题"],["hero_title","欢迎来到y悠悠的宝藏之地","首页主标题"],["hero_subtitle","代码、学术与生活的碎片记录","首页副标题"],["hero_background_image","","首页背景图"],["announcement","","公告内容"],["show_ai_assistant","true","显示AI助手"],["show_tools","true","显示工具箱"],["show_games","true","显示游戏中心"],["show_blog","true","显示博客"],["show_about","true","显示关于页面"],["show_music","true","显示音乐播放器"],["show_announcement","false","显示公告栏"],["bio","在代码、学术与分子动力学模拟间穿梭的普通人。近期正埋头于 GROMACS 模拟研究与神经网络计算。","个人简介"],["qq","1124533793","QQ号"],["wechat","y悠悠","微信号"]])t.run(e,r,a)}(s)),s}])},24075,e=>{"use strict";var t=e.i(27957),r=e.i(92368),a=e.i(49632);let E=new TextEncoder().encode(process.env.USER_JWT_SECRET||"ayuu-fun-user-secret-key-2026");async function s(e){return a.default.hash(e,10)}async function i(e,t){return a.default.compare(e,t)}async function T(e){return new t.SignJWT(e).setProtectedHeader({alg:"HS256"}).setIssuedAt().setExpirationTime("7d").sign(E)}async function n(e){try{let{payload:t}=await (0,r.jwtVerify)(e,E);return t}catch{return null}}async function o(e){let t=e.headers.get("Authorization"),r=t?.startsWith("Bearer ")?t.slice(7):null;if(!r){let t=e.headers.get("Cookie");if(t){let e=t.split(";").map(e=>e.trim()).find(e=>e.startsWith("user_token="));e&&(r=e.split("=")[1])}}return r?n(r):null}e.s(["createUserToken",0,T,"getUserFromRequest",0,o,"hashPassword",0,s,"verifyPassword",0,i])},23307,e=>{"use strict";var t=e.i(47909),r=e.i(74017),a=e.i(96250),E=e.i(59756),s=e.i(61916),i=e.i(74677),T=e.i(69741),n=e.i(16795),o=e.i(87718),d=e.i(95169),u=e.i(47587),l=e.i(66012),N=e.i(70101),c=e.i(26937),p=e.i(10372),R=e.i(93695);e.i(52474);var A=e.i(220),_=e.i(89171),I=e.i(12e3),L=e.i(24075);let U=["id","username","password_hash","password","role","status","is_admin","is_superuser","is_active","created_at","updated_at","ai_quota"];async function g(e){let t=await (0,L.getUserFromRequest)(e);if(!t)return _.NextResponse.json({error:"未登录"},{status:401});let r=(0,I.getDb)().prepare("SELECT id, username, email, nickname, avatar, bio, signature, status, created_at FROM users WHERE id = ?").get(t.userId);return r?_.NextResponse.json({user:r}):_.NextResponse.json({error:"用户不存在"},{status:404})}async function m(e){let t=await (0,L.getUserFromRequest)(e);if(!t)return _.NextResponse.json({error:"未登录"},{status:401});let r=(0,I.getDb)(),a=r.prepare("SELECT * FROM users WHERE id = ?").get(t.userId);if(!a)return _.NextResponse.json({error:"用户不存在"},{status:404});if("banned"===a.status)return _.NextResponse.json({error:"账号已被封禁，无法修改资料"},{status:403});try{let a=await e.json();if(Object.keys(a).some(e=>U.includes(e)))return _.NextResponse.json({error:"包含不允许修改的字段"},{status:400});let E=[],s=[];for(let e of["nickname","bio","signature","email"])if(void 0!==a[e]){if("email"===e){let E=String(a[e]);if(!E||!E.includes("@"))return _.NextResponse.json({error:"邮箱格式不正确"},{status:400});if(r.prepare("SELECT id FROM users WHERE email = ? AND id != ?").get(E,t.userId))return _.NextResponse.json({error:"该邮箱已被使用"},{status:400})}E.push(`${e} = ?`),s.push(String(a[e]))}if(0===E.length)return _.NextResponse.json({error:"没有需要更新的内容"},{status:400});return s.push(String(t.userId)),r.prepare(`UPDATE users SET ${E.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...s),_.NextResponse.json({success:!0,message:"保存成功"})}catch(e){return console.error("Update profile error:",e),_.NextResponse.json({error:"保存失败"},{status:500})}}e.s(["GET",0,g,"PUT",0,m],62224);var C=e.i(62224);let O=new t.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/api/user/profile/route",pathname:"/api/user/profile",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/app/api/user/profile/route.ts",nextConfigOutput:"",userland:C}),{workAsyncStorage:D,workUnitAsyncStorage:h,serverHooks:S}=O;async function F(e,t,a){a.requestMeta&&(0,E.setRequestMeta)(e,a.requestMeta),O.isDev&&(0,E.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let _="/api/user/profile/route";_=_.replace(/\/index$/,"")||"/";let I=await O.prepare(e,t,{srcPage:_,multiZoneDraftMode:!1});if(!I)return t.statusCode=400,t.end("Bad Request"),null==a.waitUntil||a.waitUntil.call(a,Promise.resolve()),null;let{buildId:L,params:U,nextConfig:g,parsedUrl:m,isDraftMode:C,prerenderManifest:D,routerServerContext:h,isOnDemandRevalidate:S,revalidateOnlyGenerated:F,resolvedPathname:f,clientReferenceManifest:x,serverActionsManifest:M}=I,y=(0,T.normalizeAppPath)(_),v=!!(D.dynamicRoutes[y]||D.routes[f]),X=async()=>((null==h?void 0:h.render404)?await h.render404(e,t,m,!1):t.end("This page could not be found"),null);if(v&&!C){let e=!!D.routes[f],t=D.dynamicRoutes[y];if(t&&!1===t.fallback&&!e){if(g.adapterPath)return await X();throw new R.NoFallbackError}}let b=null;!v||O.isDev||C||(b="/index"===(b=f)?"/":b);let w=!0===O.isDev||!v,P=v&&!w;M&&x&&(0,i.setManifestsSingleton)({page:_,clientReferenceManifest:x,serverActionsManifest:M});let G=e.method||"GET",k=(0,s.getTracer)(),j=k.getActiveScopeSpan(),q=!!(null==h?void 0:h.isWrappedByNextServer),K=!!(0,E.getRequestMeta)(e,"minimalMode"),H=(0,E.getRequestMeta)(e,"incrementalCache")||await O.getIncrementalCache(e,g,D,K);null==H||H.resetRequestCache(),globalThis.__incrementalCache=H;let Y={params:U,previewProps:D.preview,renderOpts:{experimental:{authInterrupts:!!g.experimental.authInterrupts},cacheComponents:!!g.cacheComponents,supportsDynamicResponse:w,incrementalCache:H,cacheLifeProfiles:g.cacheLife,waitUntil:a.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,a,E)=>O.onRequestError(e,t,a,E,h)},sharedContext:{buildId:L}},B=new n.NodeNextRequest(e),W=new n.NodeNextResponse(t),$=o.NextRequestAdapter.fromNodeNextRequest(B,(0,o.signalFromNodeResponse)(t));try{let E,i=async e=>O.handle($,Y).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=k.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==d.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let a=r.get("next.route");if(a){let t=`${G} ${a}`;e.setAttributes({"next.route":a,"http.route":a,"next.span_name":t}),e.updateName(t),E&&E!==e&&(E.setAttribute("http.route",a),E.updateName(t))}else e.updateName(`${G} ${_}`)}),T=async E=>{var s,T;let n=async({previousCacheEntry:r})=>{try{if(!K&&S&&F&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let s=await i(E);e.fetchMetrics=Y.renderOpts.fetchMetrics;let T=Y.renderOpts.pendingWaitUntil;T&&a.waitUntil&&(a.waitUntil(T),T=void 0);let n=Y.renderOpts.collectedTags;if(!v)return await (0,l.sendResponse)(B,W,s,Y.renderOpts.pendingWaitUntil),null;{let e=await s.blob(),t=(0,N.toNodeOutgoingHttpHeaders)(s.headers);n&&(t[p.NEXT_CACHE_TAGS_HEADER]=n),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==Y.renderOpts.collectedRevalidate&&!(Y.renderOpts.collectedRevalidate>=p.INFINITE_CACHE)&&Y.renderOpts.collectedRevalidate,a=void 0===Y.renderOpts.collectedExpire||Y.renderOpts.collectedExpire>=p.INFINITE_CACHE?void 0:Y.renderOpts.collectedExpire;return{value:{kind:A.CachedRouteKind.APP_ROUTE,status:s.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:a}}}}catch(t){throw(null==r?void 0:r.isStale)&&await O.onRequestError(e,t,{routerKind:"App Router",routePath:_,routeType:"route",revalidateReason:(0,u.getRevalidateReason)({isStaticGeneration:P,isOnDemandRevalidate:S})},!1,h),t}},o=await O.handleResponse({req:e,nextConfig:g,cacheKey:b,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:D,isRoutePPREnabled:!1,isOnDemandRevalidate:S,revalidateOnlyGenerated:F,responseGenerator:n,waitUntil:a.waitUntil,isMinimalMode:K});if(!v)return null;if((null==o||null==(s=o.value)?void 0:s.kind)!==A.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==o||null==(T=o.value)?void 0:T.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});K||t.setHeader("x-nextjs-cache",S?"REVALIDATED":o.isMiss?"MISS":o.isStale?"STALE":"HIT"),C&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let d=(0,N.fromNodeOutgoingHttpHeaders)(o.value.headers);return K&&v||d.delete(p.NEXT_CACHE_TAGS_HEADER),!o.cacheControl||t.getHeader("Cache-Control")||d.get("Cache-Control")||d.set("Cache-Control",(0,c.getCacheControlHeader)(o.cacheControl)),await (0,l.sendResponse)(B,W,new Response(o.value.body,{headers:d,status:o.value.status||200})),null};q&&j?await T(j):(E=k.getActiveScopeSpan(),await k.withPropagatedContext(e.headers,()=>k.trace(d.BaseServerSpan.handleRequest,{spanName:`${G} ${_}`,kind:s.SpanKind.SERVER,attributes:{"http.method":G,"http.target":e.url}},T),void 0,!q))}catch(t){if(t instanceof R.NoFallbackError||await O.onRequestError(e,t,{routerKind:"App Router",routePath:y,routeType:"route",revalidateReason:(0,u.getRevalidateReason)({isStaticGeneration:P,isOnDemandRevalidate:S})},!1,h),v)throw t;return await (0,l.sendResponse)(B,W,new Response(null,{status:500})),null}}e.s(["handler",0,F,"patchFetch",0,function(){return(0,a.patchFetch)({workAsyncStorage:D,workUnitAsyncStorage:h})},"routeModule",0,O,"serverHooks",0,S,"workAsyncStorage",0,D,"workUnitAsyncStorage",0,h],23307)}];

//# sourceMappingURL=%5Broot-of-the-server%5D__040izex._.js.map