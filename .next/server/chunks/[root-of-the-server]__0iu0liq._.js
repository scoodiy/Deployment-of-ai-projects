module.exports=[93695,(e,t,r)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},14747,(e,t,r)=>{t.exports=e.x("path",()=>require("path"))},18622,(e,t,r)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},56704,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},32319,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},24725,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},70406,(e,t,r)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},54799,(e,t,r)=>{t.exports=e.x("crypto",()=>require("crypto"))},85148,(e,t,r)=>{t.exports=e.x("better-sqlite3-90e2652d1716b047",()=>require("better-sqlite3-90e2652d1716b047"))},12e3,e=>{"use strict";var t=e.i(85148),r=e.i(14747),a=e.i(49632);let s=r.default.join(process.cwd(),"data","ayuu.db"),E=null;e.s(["getDb",0,function(){return E||((E=new t.default(s)).pragma("journal_mode = WAL"),E.pragma("foreign_keys = ON"),function(e){e.exec(`
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
  )`),0===e.prepare("SELECT COUNT(*) as cnt FROM friends").get().cnt){let t=e.prepare("INSERT INTO friends (name, url, description, avatar, theme_color, sort_order) VALUES (?, ?, ?, ?, ?, ?)");for(let e of[["罗德岛 PRTS","https://prts.wiki/","记录泰拉大陆的各项数据与前文明遗迹，愿源石的阴霾早日散去。","https://bu.dusays.com/2026/03/24/69c1e38b4c370.jpg","rgba(16, 185, 129, 0.5)",0]])t.run(...e)}if(0===e.prepare("SELECT COUNT(*) as cnt FROM projects").get().cnt){let t=e.prepare("INSERT INTO projects (name, description, icon, github_url, tags, sort_order) VALUES (?, ?, ?, ?, ?, ?)");for(let e of[["Computational Chemistry Tool","该工具本作者使用在Win下的WSL2平台，系统为Ubuntu22，个人使用请依据自己数据进行修改（这些工具只是整合了一些流程）","🚀","https://github.com/heiehiehi/Computational_Chemistry_Tool",'["Gromacs","RMSF"]',0]])t.run(...e)}if(e.exec("CREATE TABLE IF NOT EXISTS user_ai_quota (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, date TEXT NOT NULL, used_count INTEGER DEFAULT 0, daily_limit INTEGER DEFAULT 10, UNIQUE(user_id, date), FOREIGN KEY (user_id) REFERENCES users(id))"),e.exec("CREATE INDEX IF NOT EXISTS idx_ai_quota_user_date ON user_ai_quota(user_id, date)"),!e.prepare("SELECT id FROM admins WHERE username = ?").get("admin")){let t=a.default.hashSync("admin123",10);e.prepare("INSERT INTO admins (username, password_hash, nickname, role) VALUES (?, ?, ?, ?)").run("admin",t,"管理员","admin")}let t=e.prepare("INSERT OR IGNORE INTO site_config (config_key, config_value, description) VALUES (?, ?, ?)");for(let[e,r,a]of[["site_title","y悠悠","网站标题"],["site_subtitle","的宝藏之地","网站副标题"],["hero_title","欢迎来到y悠悠的宝藏之地","首页主标题"],["hero_subtitle","代码、学术与生活的碎片记录","首页副标题"],["hero_background_image","","首页背景图"],["announcement","","公告内容"],["show_ai_assistant","true","显示AI助手"],["show_tools","true","显示工具箱"],["show_games","true","显示游戏中心"],["show_blog","true","显示博客"],["show_about","true","显示关于页面"],["show_music","true","显示音乐播放器"],["show_announcement","false","显示公告栏"],["bio","在代码、学术与分子动力学模拟间穿梭的普通人。近期正埋头于 GROMACS 模拟研究与神经网络计算。","个人简介"],["qq","1124533793","QQ号"],["wechat","y悠悠","微信号"]])t.run(e,r,a)}(E)),E}])},80549,e=>{"use strict";var t=e.i(27957),r=e.i(92368),a=e.i(49632);let s=new TextEncoder().encode(process.env.JWT_SECRET||"ayuu-fun-admin-secret-key-2026"),E="admin_token";async function i(e){return a.default.hash(e,10)}async function n(e,t){return a.default.compare(e,t)}async function T(e){return new t.SignJWT(e).setProtectedHeader({alg:"HS256"}).setIssuedAt().setExpirationTime("7d").sign(s)}async function o(e){try{let{payload:t}=await (0,r.jwtVerify)(e,s);return t}catch{return null}}async function d(e){let t=e.headers.get("Authorization");if(t?.startsWith("Bearer "))return t.slice(7);let r=e.headers.get("Cookie");if(r){let e=r.split(";").map(e=>e.trim()).find(e=>e.startsWith(`${E}=`));if(e)return e.split("=")[1]}return null}async function u(e){let t=await d(e);return t?o(t):null}e.s(["clearTokenCookie",0,function(){return`${E}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`},"createToken",0,T,"getAdminFromRequest",0,u,"hashPassword",0,i,"setTokenCookie",0,function(e){return`${E}=${e}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`},"verifyPassword",0,n])},71809,e=>{"use strict";var t=e.i(12e3);e.s(["idempotentBan",0,function(e,r,a,s){let E=(0,t.getDb)(),i=E.prepare("SELECT id, status FROM users WHERE id = ?").get(e);return i?"banned"===i.status?{success:!0,alreadyBanned:!0,message:"用户已被封禁"}:(E.transaction(()=>{E.prepare("UPDATE users SET status = ?, ban_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run("banned",r,e),E.prepare("INSERT INTO operation_logs (admin_id, action, target_type, target_id, detail, ip) VALUES (?, ?, ?, ?, ?, ?)").run(a,"ban","user",e,`封禁用户: ${r}`,s)})(),{success:!0,message:"用户已封禁"}):{success:!1,message:"用户不存在"}},"idempotentFavorite",0,function(e,r,a){let s=(0,t.getDb)(),E=s.prepare("SELECT id FROM favorites WHERE user_id = ? AND target_type = ? AND target_id = ?").get(e,r,a);if(E)return{success:!0,alreadyFavorited:!0,favoriteId:E.id,message:"已收藏"};try{let t=s.prepare("INSERT INTO favorites (user_id, target_type, target_id) VALUES (?, ?, ?)").run(e,r,a);return{success:!0,favoriteId:t.lastInsertRowid,message:"收藏成功"}}catch(e){if(e instanceof Error&&e.message.includes("UNIQUE"))return{success:!0,alreadyFavorited:!0,message:"已收藏"};return{success:!1,message:"收藏失败"}}},"idempotentLike",0,function(e,r,a){let s=(0,t.getDb)(),E=s.prepare("SELECT id FROM likes WHERE user_id = ? AND target_type = ? AND target_id = ?").get(e,r,a);if(E)return{success:!0,alreadyLiked:!0,likeId:E.id,message:"已点赞"};try{let t=s.prepare("INSERT INTO likes (user_id, target_type, target_id) VALUES (?, ?, ?)").run(e,r,a);return{success:!0,likeId:t.lastInsertRowid,message:"点赞成功"}}catch(e){if(e instanceof Error&&e.message.includes("UNIQUE"))return{success:!0,alreadyLiked:!0,message:"已点赞"};return{success:!1,message:"点赞失败"}}},"idempotentUnban",0,function(e,r,a){let s=(0,t.getDb)(),E=s.prepare("SELECT id, status FROM users WHERE id = ?").get(e);return E?"active"===E.status?{success:!0,alreadyActive:!0,message:"用户已处于正常状态"}:(s.transaction(()=>{s.prepare("UPDATE users SET status = ?, ban_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run("active","",e),s.prepare("INSERT INTO operation_logs (admin_id, action, target_type, target_id, detail, ip) VALUES (?, ?, ?, ?, ?, ?)").run(r,"unban","user",e,"解封用户",a)})(),{success:!0,message:"用户已解封"}):{success:!1,message:"用户不存在"}},"idempotentUnfavorite",0,function(e,r,a){return(0,t.getDb)().prepare("DELETE FROM favorites WHERE user_id = ? AND target_type = ? AND target_id = ?").run(e,r,a),{success:!0,message:"取消收藏成功"}},"idempotentUnlike",0,function(e,r,a){return(0,t.getDb)().prepare("DELETE FROM likes WHERE user_id = ? AND target_type = ? AND target_id = ?").run(e,r,a),{success:!0,message:"取消点赞成功"}}])},33588,e=>{"use strict";var t=e.i(47909),r=e.i(74017),a=e.i(96250),s=e.i(59756),E=e.i(61916),i=e.i(74677),n=e.i(69741),T=e.i(16795),o=e.i(87718),d=e.i(95169),u=e.i(47587),c=e.i(66012),l=e.i(70101),N=e.i(26937),p=e.i(10372),R=e.i(93695);e.i(52474);var A=e.i(220),_=e.i(89171),I=e.i(12e3),L=e.i(80549),g=e.i(71809);async function U(e,{params:t}){let r=await (0,L.getAdminFromRequest)(e);if(!r)return _.NextResponse.json({error:"未登录"},{status:401});let{id:a}=await t;if(!(0,I.getDb)().prepare("SELECT * FROM users WHERE id = ?").get(a))return _.NextResponse.json({error:"用户不存在"},{status:404});try{let t=e.headers.get("x-forwarded-for")||"unknown",s=(0,g.idempotentUnban)(Number(a),r.adminId,t);if(!s.success)return _.NextResponse.json({error:s.message},{status:400});return _.NextResponse.json({success:!0,message:s.message,already_active:s.alreadyActive||!1})}catch(e){return console.error("Unban user error:",e),_.NextResponse.json({error:"解封失败"},{status:500})}}e.s(["PUT",0,U],69159);var m=e.i(69159);let D=new t.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/api/admin/users/[id]/unban/route",pathname:"/api/admin/users/[id]/unban",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/app/api/admin/users/[id]/unban/route.ts",nextConfigOutput:"",userland:m}),{workAsyncStorage:C,workUnitAsyncStorage:O,serverHooks:S}=D;async function F(e,t,a){a.requestMeta&&(0,s.setRequestMeta)(e,a.requestMeta),D.isDev&&(0,s.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let _="/api/admin/users/[id]/unban/route";_=_.replace(/\/index$/,"")||"/";let I=await D.prepare(e,t,{srcPage:_,multiZoneDraftMode:!1});if(!I)return t.statusCode=400,t.end("Bad Request"),null==a.waitUntil||a.waitUntil.call(a,Promise.resolve()),null;let{buildId:L,params:g,nextConfig:U,parsedUrl:m,isDraftMode:C,prerenderManifest:O,routerServerContext:S,isOnDemandRevalidate:F,revalidateOnlyGenerated:f,resolvedPathname:h,clientReferenceManifest:M,serverActionsManifest:x}=I,y=(0,n.normalizeAppPath)(_),v=!!(O.dynamicRoutes[y]||O.routes[h]),b=async()=>((null==S?void 0:S.render404)?await S.render404(e,t,m,!1):t.end("This page could not be found"),null);if(v&&!C){let e=!!O.routes[h],t=O.dynamicRoutes[y];if(t&&!1===t.fallback&&!e){if(U.adapterPath)return await b();throw new R.NoFallbackError}}let X=null;!v||D.isDev||C||(X="/index"===(X=h)?"/":X);let w=!0===D.isDev||!v,P=v&&!w;x&&M&&(0,i.setManifestsSingleton)({page:_,clientReferenceManifest:M,serverActionsManifest:x});let G=e.method||"GET",k=(0,E.getTracer)(),H=k.getActiveScopeSpan(),q=!!(null==S?void 0:S.isWrappedByNextServer),K=!!(0,s.getRequestMeta)(e,"minimalMode"),j=(0,s.getRequestMeta)(e,"incrementalCache")||await D.getIncrementalCache(e,U,O,K);null==j||j.resetRequestCache(),globalThis.__incrementalCache=j;let Y={params:g,previewProps:O.preview,renderOpts:{experimental:{authInterrupts:!!U.experimental.authInterrupts},cacheComponents:!!U.cacheComponents,supportsDynamicResponse:w,incrementalCache:j,cacheLifeProfiles:U.cacheLife,waitUntil:a.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,a,s)=>D.onRequestError(e,t,a,s,S)},sharedContext:{buildId:L}},B=new T.NodeNextRequest(e),W=new T.NodeNextResponse(t),$=o.NextRequestAdapter.fromNodeNextRequest(B,(0,o.signalFromNodeResponse)(t));try{let s,i=async e=>D.handle($,Y).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=k.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==d.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let a=r.get("next.route");if(a){let t=`${G} ${a}`;e.setAttributes({"next.route":a,"http.route":a,"next.span_name":t}),e.updateName(t),s&&s!==e&&(s.setAttribute("http.route",a),s.updateName(t))}else e.updateName(`${G} ${_}`)}),n=async s=>{var E,n;let T=async({previousCacheEntry:r})=>{try{if(!K&&F&&f&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let E=await i(s);e.fetchMetrics=Y.renderOpts.fetchMetrics;let n=Y.renderOpts.pendingWaitUntil;n&&a.waitUntil&&(a.waitUntil(n),n=void 0);let T=Y.renderOpts.collectedTags;if(!v)return await (0,c.sendResponse)(B,W,E,Y.renderOpts.pendingWaitUntil),null;{let e=await E.blob(),t=(0,l.toNodeOutgoingHttpHeaders)(E.headers);T&&(t[p.NEXT_CACHE_TAGS_HEADER]=T),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==Y.renderOpts.collectedRevalidate&&!(Y.renderOpts.collectedRevalidate>=p.INFINITE_CACHE)&&Y.renderOpts.collectedRevalidate,a=void 0===Y.renderOpts.collectedExpire||Y.renderOpts.collectedExpire>=p.INFINITE_CACHE?void 0:Y.renderOpts.collectedExpire;return{value:{kind:A.CachedRouteKind.APP_ROUTE,status:E.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:a}}}}catch(t){throw(null==r?void 0:r.isStale)&&await D.onRequestError(e,t,{routerKind:"App Router",routePath:_,routeType:"route",revalidateReason:(0,u.getRevalidateReason)({isStaticGeneration:P,isOnDemandRevalidate:F})},!1,S),t}},o=await D.handleResponse({req:e,nextConfig:U,cacheKey:X,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:O,isRoutePPREnabled:!1,isOnDemandRevalidate:F,revalidateOnlyGenerated:f,responseGenerator:T,waitUntil:a.waitUntil,isMinimalMode:K});if(!v)return null;if((null==o||null==(E=o.value)?void 0:E.kind)!==A.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==o||null==(n=o.value)?void 0:n.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});K||t.setHeader("x-nextjs-cache",F?"REVALIDATED":o.isMiss?"MISS":o.isStale?"STALE":"HIT"),C&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let d=(0,l.fromNodeOutgoingHttpHeaders)(o.value.headers);return K&&v||d.delete(p.NEXT_CACHE_TAGS_HEADER),!o.cacheControl||t.getHeader("Cache-Control")||d.get("Cache-Control")||d.set("Cache-Control",(0,N.getCacheControlHeader)(o.cacheControl)),await (0,c.sendResponse)(B,W,new Response(o.value.body,{headers:d,status:o.value.status||200})),null};q&&H?await n(H):(s=k.getActiveScopeSpan(),await k.withPropagatedContext(e.headers,()=>k.trace(d.BaseServerSpan.handleRequest,{spanName:`${G} ${_}`,kind:E.SpanKind.SERVER,attributes:{"http.method":G,"http.target":e.url}},n),void 0,!q))}catch(t){if(t instanceof R.NoFallbackError||await D.onRequestError(e,t,{routerKind:"App Router",routePath:y,routeType:"route",revalidateReason:(0,u.getRevalidateReason)({isStaticGeneration:P,isOnDemandRevalidate:F})},!1,S),v)throw t;return await (0,c.sendResponse)(B,W,new Response(null,{status:500})),null}}e.s(["handler",0,F,"patchFetch",0,function(){return(0,a.patchFetch)({workAsyncStorage:C,workUnitAsyncStorage:O})},"routeModule",0,D,"serverHooks",0,S,"workAsyncStorage",0,C,"workUnitAsyncStorage",0,O],33588)}];

//# sourceMappingURL=%5Broot-of-the-server%5D__0iu0liq._.js.map