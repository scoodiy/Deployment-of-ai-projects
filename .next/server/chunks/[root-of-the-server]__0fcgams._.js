module.exports=[93695,(e,t,r)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},14747,(e,t,r)=>{t.exports=e.x("path",()=>require("path"))},18622,(e,t,r)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},56704,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},32319,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},24725,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},70406,(e,t,r)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},54799,(e,t,r)=>{t.exports=e.x("crypto",()=>require("crypto"))},85148,(e,t,r)=>{t.exports=e.x("better-sqlite3-90e2652d1716b047",()=>require("better-sqlite3-90e2652d1716b047"))},12e3,e=>{"use strict";var t=e.i(85148),r=e.i(14747),a=e.i(49632);let i=r.default.join(process.cwd(),"data","ayuu.db"),s=null;e.s(["getDb",0,function(){return s||((s=new t.default(i)).pragma("journal_mode = WAL"),s.pragma("foreign_keys = ON"),function(e){e.exec(`
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
  )`),0===e.prepare("SELECT COUNT(*) as cnt FROM friends").get().cnt){let t=e.prepare("INSERT INTO friends (name, url, description, avatar, theme_color, sort_order) VALUES (?, ?, ?, ?, ?, ?)");for(let e of[["罗德岛 PRTS","https://prts.wiki/","记录泰拉大陆的各项数据与前文明遗迹，愿源石的阴霾早日散去。","https://bu.dusays.com/2026/03/24/69c1e38b4c370.jpg","rgba(16, 185, 129, 0.5)",0]])t.run(...e)}if(0===e.prepare("SELECT COUNT(*) as cnt FROM projects").get().cnt){let t=e.prepare("INSERT INTO projects (name, description, icon, github_url, tags, sort_order) VALUES (?, ?, ?, ?, ?, ?)");for(let e of[["Computational Chemistry Tool","该工具本作者使用在Win下的WSL2平台，系统为Ubuntu22，个人使用请依据自己数据进行修改（这些工具只是整合了一些流程）","🚀","https://github.com/heiehiehi/Computational_Chemistry_Tool",'["Gromacs","RMSF"]',0]])t.run(...e)}if(e.exec("CREATE TABLE IF NOT EXISTS user_ai_quota (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, date TEXT NOT NULL, used_count INTEGER DEFAULT 0, daily_limit INTEGER DEFAULT 10, UNIQUE(user_id, date), FOREIGN KEY (user_id) REFERENCES users(id))"),e.exec("CREATE INDEX IF NOT EXISTS idx_ai_quota_user_date ON user_ai_quota(user_id, date)"),!e.prepare("SELECT id FROM admins WHERE username = ?").get("admin")){let t=a.default.hashSync("admin123",10);e.prepare("INSERT INTO admins (username, password_hash, nickname, role) VALUES (?, ?, ?, ?)").run("admin",t,"管理员","admin")}let t=e.prepare("INSERT OR IGNORE INTO site_config (config_key, config_value, description) VALUES (?, ?, ?)");for(let[e,r,a]of[["site_title","y悠悠","网站标题"],["site_subtitle","的宝藏之地","网站副标题"],["hero_title","欢迎来到y悠悠的宝藏之地","首页主标题"],["hero_subtitle","代码、学术与生活的碎片记录","首页副标题"],["hero_background_image","","首页背景图"],["announcement","","公告内容"],["show_ai_assistant","true","显示AI助手"],["show_tools","true","显示工具箱"],["show_games","true","显示游戏中心"],["show_blog","true","显示博客"],["show_about","true","显示关于页面"],["show_music","true","显示音乐播放器"],["show_announcement","false","显示公告栏"],["bio","在代码、学术与分子动力学模拟间穿梭的普通人。近期正埋头于 GROMACS 模拟研究与神经网络计算。","个人简介"],["qq","1124533793","QQ号"],["wechat","y悠悠","微信号"]])t.run(e,r,a)}(s)),s}])},80549,e=>{"use strict";var t=e.i(27957),r=e.i(92368),a=e.i(49632);let i=new TextEncoder().encode(process.env.JWT_SECRET||"ayuu-fun-admin-secret-key-2026"),s="admin_token";async function n(e){return a.default.hash(e,10)}async function E(e,t){return a.default.compare(e,t)}async function o(e){return new t.SignJWT(e).setProtectedHeader({alg:"HS256"}).setIssuedAt().setExpirationTime("7d").sign(i)}async function T(e){try{let{payload:t}=await (0,r.jwtVerify)(e,i);return t}catch{return null}}async function d(e){let t=e.headers.get("Authorization");if(t?.startsWith("Bearer "))return t.slice(7);let r=e.headers.get("Cookie");if(r){let e=r.split(";").map(e=>e.trim()).find(e=>e.startsWith(`${s}=`));if(e)return e.split("=")[1]}return null}async function l(e){let t=await d(e);return t?T(t):null}e.s(["clearTokenCookie",0,function(){return`${s}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`},"createToken",0,o,"getAdminFromRequest",0,l,"hashPassword",0,n,"setTokenCookie",0,function(e){return`${s}=${e}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`},"verifyPassword",0,E])},24868,(e,t,r)=>{t.exports=e.x("fs/promises",()=>require("fs/promises"))},38339,e=>{"use strict";let t=new Map;setInterval(()=>{let e=Date.now();for(let[r,a]of t.entries())a.resetTime<=e&&t.delete(r)},6e4);let r={login:{maxRequests:5,windowSeconds:60,keyPrefix:"rl:login",errorMessage:"登录尝试过多，请1分钟后再试"},register:{maxRequests:5,windowSeconds:3600,keyPrefix:"rl:reg",errorMessage:"注册操作过于频繁，请1小时后再试"},sendCode:{maxRequests:3,windowSeconds:60,keyPrefix:"rl:code",errorMessage:"验证码发送过于频繁，请稍后再试"},comment:{maxRequests:3,windowSeconds:60,keyPrefix:"rl:comment",errorMessage:"评论过于频繁，请稍后再试"},aiCall:{maxRequests:10,windowSeconds:60,keyPrefix:"rl:ai:minute",errorMessage:"AI调用过于频繁，请稍后再试"},aiDaily:{maxRequests:50,windowSeconds:86400,keyPrefix:"rl:ai:daily",errorMessage:"今日AI调用次数已用完"},upload:{maxRequests:10,windowSeconds:86400,keyPrefix:"rl:upload",errorMessage:"今日上传次数已达上限"},gameScore:{maxRequests:10,windowSeconds:60,keyPrefix:"rl:game",errorMessage:"提交过于频繁，请稍后再试"},global:{maxRequests:120,windowSeconds:60,keyPrefix:"rl:global",errorMessage:"请求过于频繁，请稍后再试"}};function a(e,a,i){let s={...r[e],...i},n=`${s.keyPrefix}:${a}`,E=Date.now(),o=t.get(n);if(!o||o.resetTime<=E)return o={count:1,resetTime:E+1e3*s.windowSeconds},t.set(n,o),{limited:!1};if(o.count++,o.count>s.maxRequests){let e=Math.ceil((o.resetTime-E)/1e3);return{limited:!0,retryAfter:e,message:`${s.errorMessage}（${e}秒后重试）`}}return{limited:!1}}function i(e){let t=e.headers.get("x-forwarded-for");return t?t.split(",")[0].trim():e.headers.get("x-real-ip")||"unknown"}e.s(["getClientIp",0,i,"rateLimitMiddleware",0,function(e,t,r){let s=i(t),n=r||s,E=a("global",s);if(E.limited)return{blocked:!0,response:new Response(JSON.stringify({error:E.message}),{status:429,headers:{"Content-Type":"application/json","Retry-After":String(E.retryAfter)}})};let o=a(e,n);return o.limited?{blocked:!0,response:new Response(JSON.stringify({error:o.message}),{status:429,headers:{"Content-Type":"application/json","Retry-After":String(o.retryAfter)}})}:{blocked:!1}}])},19603,e=>{"use strict";var t=e.i(47909),r=e.i(74017),a=e.i(96250),i=e.i(59756),s=e.i(61916),n=e.i(74677),E=e.i(69741),o=e.i(16795),T=e.i(87718),d=e.i(95169),l=e.i(47587),u=e.i(66012),c=e.i(70101),p=e.i(26937),N=e.i(10372),R=e.i(93695);e.i(52474);var A=e.i(220),I=e.i(89171),_=e.i(12e3),m=e.i(80549),g=e.i(38339),L=e.i(24868),U=e.i(14747),f=e.i(54799);let x={image:["image/jpeg","image/png","image/webp","image/gif","image/svg+xml"],audio:["audio/mpeg","audio/wav","audio/mp3","audio/ogg","audio/flac"],video:["video/mp4","video/webm"],document:["application/pdf"]},C={image:0xa00000,audio:0x1400000,video:0x3200000,document:0xa00000};async function S(e){let t=await (0,m.getAdminFromRequest)(e);if(!t)return I.NextResponse.json({error:"未登录"},{status:401});let r=(0,g.getClientIp)(e),a=(0,g.rateLimitMiddleware)("upload",e,String(t.adminId));if(a.blocked)return a.response;let i=null;try{var s;let a=await e.formData(),n=a.get("file"),E=a.get("usage_type")||"other";if(!n)return I.NextResponse.json({error:"请选择文件"},{status:400});let o=(s=n.type).startsWith("image/")?"image":s.startsWith("audio/")?"audio":s.startsWith("video/")?"video":"document",T=x[o]||[];if(!T.includes(n.type))return I.NextResponse.json({error:`不支持的文件类型: ${n.type}。支持: ${T.join(", ")}`},{status:400});let d=C[o]||0xa00000;if(n.size>d)return I.NextResponse.json({error:`文件大小超过限制(${Math.round(d/1024/1024)}MB)`},{status:400});let l=U.default.extname(n.name).toLowerCase().replace(/[^a-z0-9.]/g,""),u=`${(0,f.randomUUID)()}${l}`,c=U.default.join(process.cwd(),"public","uploads");await (0,L.mkdir)(c,{recursive:!0});let p=Buffer.from(await n.arrayBuffer());i=U.default.join(c,u),await (0,L.writeFile)(i,p);let N=(0,_.getDb)();try{let e=N.prepare(`
        INSERT INTO media_files (file_type, filename, original_name, url, size, mime_type, usage_type, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(o,u,n.name,`/uploads/${u}`,n.size,n.type,E,t.adminId);return N.prepare("INSERT INTO operation_logs (admin_id, action, target_type, target_id, detail, ip) VALUES (?, ?, ?, ?, ?, ?)").run(t.adminId,"upload","media",e.lastInsertRowid,`上传文件: ${n.name} (${o}, ${Math.round(n.size/1024)}KB)`,r),I.NextResponse.json({success:!0,id:e.lastInsertRowid,url:`/uploads/${u}`,filename:u})}catch(e){if(i)try{await (0,L.unlink)(i)}catch{}throw e}}catch(e){return console.error("Upload error:",e),I.NextResponse.json({error:"上传失败"},{status:500})}}e.s(["POST",0,S],68636);var O=e.i(68636);let h=new t.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/api/admin/media/upload/route",pathname:"/api/admin/media/upload",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/app/api/admin/media/upload/route.ts",nextConfigOutput:"",userland:O}),{workAsyncStorage:D,workUnitAsyncStorage:M,serverHooks:y}=h;async function F(e,t,a){a.requestMeta&&(0,i.setRequestMeta)(e,a.requestMeta),h.isDev&&(0,i.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let I="/api/admin/media/upload/route";I=I.replace(/\/index$/,"")||"/";let _=await h.prepare(e,t,{srcPage:I,multiZoneDraftMode:!1});if(!_)return t.statusCode=400,t.end("Bad Request"),null==a.waitUntil||a.waitUntil.call(a,Promise.resolve()),null;let{buildId:m,params:g,nextConfig:L,parsedUrl:U,isDraftMode:f,prerenderManifest:x,routerServerContext:C,isOnDemandRevalidate:S,revalidateOnlyGenerated:O,resolvedPathname:D,clientReferenceManifest:M,serverActionsManifest:y}=_,F=(0,E.normalizeAppPath)(I),w=!!(x.dynamicRoutes[F]||x.routes[D]),v=async()=>((null==C?void 0:C.render404)?await C.render404(e,t,U,!1):t.end("This page could not be found"),null);if(w&&!f){let e=!!x.routes[D],t=x.dynamicRoutes[F];if(t&&!1===t.fallback&&!e){if(L.adapterPath)return await v();throw new R.NoFallbackError}}let X=null;!w||h.isDev||f||(X="/index"===(X=D)?"/":X);let b=!0===h.isDev||!w,P=w&&!b;y&&M&&(0,n.setManifestsSingleton)({page:I,clientReferenceManifest:M,serverActionsManifest:y});let k=e.method||"GET",G=(0,s.getTracer)(),q=G.getActiveScopeSpan(),j=!!(null==C?void 0:C.isWrappedByNextServer),K=!!(0,i.getRequestMeta)(e,"minimalMode"),B=(0,i.getRequestMeta)(e,"incrementalCache")||await h.getIncrementalCache(e,L,x,K);null==B||B.resetRequestCache(),globalThis.__incrementalCache=B;let H={params:g,previewProps:x.preview,renderOpts:{experimental:{authInterrupts:!!L.experimental.authInterrupts},cacheComponents:!!L.cacheComponents,supportsDynamicResponse:b,incrementalCache:B,cacheLifeProfiles:L.cacheLife,waitUntil:a.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,a,i)=>h.onRequestError(e,t,a,i,C)},sharedContext:{buildId:m}},Y=new o.NodeNextRequest(e),$=new o.NodeNextResponse(t),W=T.NextRequestAdapter.fromNodeNextRequest(Y,(0,T.signalFromNodeResponse)(t));try{let i,n=async e=>h.handle(W,H).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=G.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==d.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let a=r.get("next.route");if(a){let t=`${k} ${a}`;e.setAttributes({"next.route":a,"http.route":a,"next.span_name":t}),e.updateName(t),i&&i!==e&&(i.setAttribute("http.route",a),i.updateName(t))}else e.updateName(`${k} ${I}`)}),E=async i=>{var s,E;let o=async({previousCacheEntry:r})=>{try{if(!K&&S&&O&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let s=await n(i);e.fetchMetrics=H.renderOpts.fetchMetrics;let E=H.renderOpts.pendingWaitUntil;E&&a.waitUntil&&(a.waitUntil(E),E=void 0);let o=H.renderOpts.collectedTags;if(!w)return await (0,u.sendResponse)(Y,$,s,H.renderOpts.pendingWaitUntil),null;{let e=await s.blob(),t=(0,c.toNodeOutgoingHttpHeaders)(s.headers);o&&(t[N.NEXT_CACHE_TAGS_HEADER]=o),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==H.renderOpts.collectedRevalidate&&!(H.renderOpts.collectedRevalidate>=N.INFINITE_CACHE)&&H.renderOpts.collectedRevalidate,a=void 0===H.renderOpts.collectedExpire||H.renderOpts.collectedExpire>=N.INFINITE_CACHE?void 0:H.renderOpts.collectedExpire;return{value:{kind:A.CachedRouteKind.APP_ROUTE,status:s.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:a}}}}catch(t){throw(null==r?void 0:r.isStale)&&await h.onRequestError(e,t,{routerKind:"App Router",routePath:I,routeType:"route",revalidateReason:(0,l.getRevalidateReason)({isStaticGeneration:P,isOnDemandRevalidate:S})},!1,C),t}},T=await h.handleResponse({req:e,nextConfig:L,cacheKey:X,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:x,isRoutePPREnabled:!1,isOnDemandRevalidate:S,revalidateOnlyGenerated:O,responseGenerator:o,waitUntil:a.waitUntil,isMinimalMode:K});if(!w)return null;if((null==T||null==(s=T.value)?void 0:s.kind)!==A.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==T||null==(E=T.value)?void 0:E.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});K||t.setHeader("x-nextjs-cache",S?"REVALIDATED":T.isMiss?"MISS":T.isStale?"STALE":"HIT"),f&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let d=(0,c.fromNodeOutgoingHttpHeaders)(T.value.headers);return K&&w||d.delete(N.NEXT_CACHE_TAGS_HEADER),!T.cacheControl||t.getHeader("Cache-Control")||d.get("Cache-Control")||d.set("Cache-Control",(0,p.getCacheControlHeader)(T.cacheControl)),await (0,u.sendResponse)(Y,$,new Response(T.value.body,{headers:d,status:T.value.status||200})),null};j&&q?await E(q):(i=G.getActiveScopeSpan(),await G.withPropagatedContext(e.headers,()=>G.trace(d.BaseServerSpan.handleRequest,{spanName:`${k} ${I}`,kind:s.SpanKind.SERVER,attributes:{"http.method":k,"http.target":e.url}},E),void 0,!j))}catch(t){if(t instanceof R.NoFallbackError||await h.onRequestError(e,t,{routerKind:"App Router",routePath:F,routeType:"route",revalidateReason:(0,l.getRevalidateReason)({isStaticGeneration:P,isOnDemandRevalidate:S})},!1,C),w)throw t;return await (0,u.sendResponse)(Y,$,new Response(null,{status:500})),null}}e.s(["handler",0,F,"patchFetch",0,function(){return(0,a.patchFetch)({workAsyncStorage:D,workUnitAsyncStorage:M})},"routeModule",0,h,"serverHooks",0,y,"workAsyncStorage",0,D,"workUnitAsyncStorage",0,M],19603)}];

//# sourceMappingURL=%5Broot-of-the-server%5D__0fcgams._.js.map