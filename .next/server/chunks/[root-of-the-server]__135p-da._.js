module.exports=[93695,(e,t,r)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},14747,(e,t,r)=>{t.exports=e.x("path",()=>require("path"))},18622,(e,t,r)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},56704,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},32319,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},24725,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},70406,(e,t,r)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},54799,(e,t,r)=>{t.exports=e.x("crypto",()=>require("crypto"))},85148,(e,t,r)=>{t.exports=e.x("better-sqlite3-90e2652d1716b047",()=>require("better-sqlite3-90e2652d1716b047"))},12e3,e=>{"use strict";var t=e.i(85148),r=e.i(14747),a=e.i(49632);let s=r.default.join(process.cwd(),"data","ayuu.db"),i=null;e.s(["getDb",0,function(){return i||((i=new t.default(s)).pragma("journal_mode = WAL"),i.pragma("foreign_keys = ON"),function(e){e.exec(`
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
  )`),0===e.prepare("SELECT COUNT(*) as cnt FROM friends").get().cnt){let t=e.prepare("INSERT INTO friends (name, url, description, avatar, theme_color, sort_order) VALUES (?, ?, ?, ?, ?, ?)");for(let e of[["罗德岛 PRTS","https://prts.wiki/","记录泰拉大陆的各项数据与前文明遗迹，愿源石的阴霾早日散去。","https://bu.dusays.com/2026/03/24/69c1e38b4c370.jpg","rgba(16, 185, 129, 0.5)",0]])t.run(...e)}if(0===e.prepare("SELECT COUNT(*) as cnt FROM projects").get().cnt){let t=e.prepare("INSERT INTO projects (name, description, icon, github_url, tags, sort_order) VALUES (?, ?, ?, ?, ?, ?)");for(let e of[["Computational Chemistry Tool","该工具本作者使用在Win下的WSL2平台，系统为Ubuntu22，个人使用请依据自己数据进行修改（这些工具只是整合了一些流程）","🚀","https://github.com/heiehiehi/Computational_Chemistry_Tool",'["Gromacs","RMSF"]',0]])t.run(...e)}if(e.exec("CREATE TABLE IF NOT EXISTS user_ai_quota (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, date TEXT NOT NULL, used_count INTEGER DEFAULT 0, daily_limit INTEGER DEFAULT 10, UNIQUE(user_id, date), FOREIGN KEY (user_id) REFERENCES users(id))"),e.exec("CREATE INDEX IF NOT EXISTS idx_ai_quota_user_date ON user_ai_quota(user_id, date)"),!e.prepare("SELECT id FROM admins WHERE username = ?").get("admin")){let t=a.default.hashSync("admin123",10);e.prepare("INSERT INTO admins (username, password_hash, nickname, role) VALUES (?, ?, ?, ?)").run("admin",t,"管理员","admin")}let t=e.prepare("INSERT OR IGNORE INTO site_config (config_key, config_value, description) VALUES (?, ?, ?)");for(let[e,r,a]of[["site_title","y悠悠","网站标题"],["site_subtitle","的宝藏之地","网站副标题"],["hero_title","欢迎来到y悠悠的宝藏之地","首页主标题"],["hero_subtitle","代码、学术与生活的碎片记录","首页副标题"],["hero_background_image","","首页背景图"],["announcement","","公告内容"],["show_ai_assistant","true","显示AI助手"],["show_tools","true","显示工具箱"],["show_games","true","显示游戏中心"],["show_blog","true","显示博客"],["show_about","true","显示关于页面"],["show_music","true","显示音乐播放器"],["show_announcement","false","显示公告栏"],["bio","在代码、学术与分子动力学模拟间穿梭的普通人。近期正埋头于 GROMACS 模拟研究与神经网络计算。","个人简介"],["qq","1124533793","QQ号"],["wechat","y悠悠","微信号"]])t.run(e,r,a)}(i)),i}])},24075,e=>{"use strict";var t=e.i(27957),r=e.i(92368),a=e.i(49632);let s=new TextEncoder().encode(process.env.USER_JWT_SECRET||"ayuu-fun-user-secret-key-2026");async function i(e){return a.default.hash(e,10)}async function E(e,t){return a.default.compare(e,t)}async function n(e){return new t.SignJWT(e).setProtectedHeader({alg:"HS256"}).setIssuedAt().setExpirationTime("7d").sign(s)}async function T(e){try{let{payload:t}=await (0,r.jwtVerify)(e,s);return t}catch{return null}}async function o(e){let t=e.headers.get("Authorization"),r=t?.startsWith("Bearer ")?t.slice(7):null;if(!r){let t=e.headers.get("Cookie");if(t){let e=t.split(";").map(e=>e.trim()).find(e=>e.startsWith("user_token="));e&&(r=e.split("=")[1])}}return r?T(r):null}e.s(["createUserToken",0,n,"getUserFromRequest",0,o,"hashPassword",0,i,"verifyPassword",0,E])},38339,e=>{"use strict";let t=new Map;setInterval(()=>{let e=Date.now();for(let[r,a]of t.entries())a.resetTime<=e&&t.delete(r)},6e4);let r={login:{maxRequests:5,windowSeconds:60,keyPrefix:"rl:login",errorMessage:"登录尝试过多，请1分钟后再试"},register:{maxRequests:5,windowSeconds:3600,keyPrefix:"rl:reg",errorMessage:"注册操作过于频繁，请1小时后再试"},sendCode:{maxRequests:3,windowSeconds:60,keyPrefix:"rl:code",errorMessage:"验证码发送过于频繁，请稍后再试"},comment:{maxRequests:3,windowSeconds:60,keyPrefix:"rl:comment",errorMessage:"评论过于频繁，请稍后再试"},aiCall:{maxRequests:10,windowSeconds:60,keyPrefix:"rl:ai:minute",errorMessage:"AI调用过于频繁，请稍后再试"},aiDaily:{maxRequests:50,windowSeconds:86400,keyPrefix:"rl:ai:daily",errorMessage:"今日AI调用次数已用完"},upload:{maxRequests:10,windowSeconds:86400,keyPrefix:"rl:upload",errorMessage:"今日上传次数已达上限"},gameScore:{maxRequests:10,windowSeconds:60,keyPrefix:"rl:game",errorMessage:"提交过于频繁，请稍后再试"},global:{maxRequests:120,windowSeconds:60,keyPrefix:"rl:global",errorMessage:"请求过于频繁，请稍后再试"}};function a(e,a,s){let i={...r[e],...s},E=`${i.keyPrefix}:${a}`,n=Date.now(),T=t.get(E);if(!T||T.resetTime<=n)return T={count:1,resetTime:n+1e3*i.windowSeconds},t.set(E,T),{limited:!1};if(T.count++,T.count>i.maxRequests){let e=Math.ceil((T.resetTime-n)/1e3);return{limited:!0,retryAfter:e,message:`${i.errorMessage}（${e}秒后重试）`}}return{limited:!1}}function s(e){let t=e.headers.get("x-forwarded-for");return t?t.split(",")[0].trim():e.headers.get("x-real-ip")||"unknown"}e.s(["getClientIp",0,s,"rateLimitMiddleware",0,function(e,t,r){let i=s(t),E=r||i,n=a("global",i);if(n.limited)return{blocked:!0,response:new Response(JSON.stringify({error:n.message}),{status:429,headers:{"Content-Type":"application/json","Retry-After":String(n.retryAfter)}})};let T=a(e,E);return T.limited?{blocked:!0,response:new Response(JSON.stringify({error:T.message}),{status:429,headers:{"Content-Type":"application/json","Retry-After":String(T.retryAfter)}})}:{blocked:!1}}])},6848,e=>{"use strict";var t=e.i(47909),r=e.i(74017),a=e.i(96250),s=e.i(59756),i=e.i(61916),E=e.i(74677),n=e.i(69741),T=e.i(16795),o=e.i(87718),d=e.i(95169),l=e.i(47587),u=e.i(66012),c=e.i(70101),N=e.i(26937),R=e.i(10372),p=e.i(93695);e.i(52474);var A=e.i(220),I=e.i(89171),_=e.i(12e3),L=e.i(24075),m=e.i(38339);async function g(e){let t=(0,m.getClientIp)(e),r=(0,m.rateLimitMiddleware)("login",e,t);if(r.blocked)return r.response;try{let{email:t,password:r}=await e.json();if(!t||!r)return I.NextResponse.json({error:"请输入邮箱和密码"},{status:400});let a=(0,_.getDb)().prepare("SELECT * FROM users WHERE email = ?").get(t);if(!a)return I.NextResponse.json({error:"该邮箱未注册"},{status:401});if("banned"===a.status)return I.NextResponse.json({error:"账号已被封禁"},{status:403});if(!await (0,L.verifyPassword)(r,a.password_hash))return I.NextResponse.json({error:"密码错误"},{status:401});let s=await (0,L.createUserToken)({userId:a.id,username:a.username,email:a.email}),i=I.NextResponse.json({success:!0,token:s,user:{id:a.id,username:a.username,email:a.email}});return i.headers.set("Set-Cookie",`user_token=${s}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`),i}catch(e){return console.error("Login error:",e),I.NextResponse.json({error:"登录失败"},{status:500})}}e.s(["POST",0,g],93547);var U=e.i(93547);let C=new t.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/api/user/login/route",pathname:"/api/user/login",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/app/api/user/login/route.ts",nextConfigOutput:"",userland:U}),{workAsyncStorage:x,workUnitAsyncStorage:S,serverHooks:O}=C;async function f(e,t,a){a.requestMeta&&(0,s.setRequestMeta)(e,a.requestMeta),C.isDev&&(0,s.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let I="/api/user/login/route";I=I.replace(/\/index$/,"")||"/";let _=await C.prepare(e,t,{srcPage:I,multiZoneDraftMode:!1});if(!_)return t.statusCode=400,t.end("Bad Request"),null==a.waitUntil||a.waitUntil.call(a,Promise.resolve()),null;let{buildId:L,params:m,nextConfig:g,parsedUrl:U,isDraftMode:x,prerenderManifest:S,routerServerContext:O,isOnDemandRevalidate:f,revalidateOnlyGenerated:D,resolvedPathname:h,clientReferenceManifest:M,serverActionsManifest:F}=_,y=(0,n.normalizeAppPath)(I),w=!!(S.dynamicRoutes[y]||S.routes[h]),v=async()=>((null==O?void 0:O.render404)?await O.render404(e,t,U,!1):t.end("This page could not be found"),null);if(w&&!x){let e=!!S.routes[h],t=S.dynamicRoutes[y];if(t&&!1===t.fallback&&!e){if(g.adapterPath)return await v();throw new p.NoFallbackError}}let X=null;!w||C.isDev||x||(X="/index"===(X=h)?"/":X);let b=!0===C.isDev||!w,P=w&&!b;F&&M&&(0,E.setManifestsSingleton)({page:I,clientReferenceManifest:M,serverActionsManifest:F});let k=e.method||"GET",G=(0,i.getTracer)(),q=G.getActiveScopeSpan(),j=!!(null==O?void 0:O.isWrappedByNextServer),K=!!(0,s.getRequestMeta)(e,"minimalMode"),H=(0,s.getRequestMeta)(e,"incrementalCache")||await C.getIncrementalCache(e,g,S,K);null==H||H.resetRequestCache(),globalThis.__incrementalCache=H;let Y={params:m,previewProps:S.preview,renderOpts:{experimental:{authInterrupts:!!g.experimental.authInterrupts},cacheComponents:!!g.cacheComponents,supportsDynamicResponse:b,incrementalCache:H,cacheLifeProfiles:g.cacheLife,waitUntil:a.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,a,s)=>C.onRequestError(e,t,a,s,O)},sharedContext:{buildId:L}},B=new T.NodeNextRequest(e),$=new T.NodeNextResponse(t),W=o.NextRequestAdapter.fromNodeNextRequest(B,(0,o.signalFromNodeResponse)(t));try{let s,E=async e=>C.handle(W,Y).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=G.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==d.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let a=r.get("next.route");if(a){let t=`${k} ${a}`;e.setAttributes({"next.route":a,"http.route":a,"next.span_name":t}),e.updateName(t),s&&s!==e&&(s.setAttribute("http.route",a),s.updateName(t))}else e.updateName(`${k} ${I}`)}),n=async s=>{var i,n;let T=async({previousCacheEntry:r})=>{try{if(!K&&f&&D&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let i=await E(s);e.fetchMetrics=Y.renderOpts.fetchMetrics;let n=Y.renderOpts.pendingWaitUntil;n&&a.waitUntil&&(a.waitUntil(n),n=void 0);let T=Y.renderOpts.collectedTags;if(!w)return await (0,u.sendResponse)(B,$,i,Y.renderOpts.pendingWaitUntil),null;{let e=await i.blob(),t=(0,c.toNodeOutgoingHttpHeaders)(i.headers);T&&(t[R.NEXT_CACHE_TAGS_HEADER]=T),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==Y.renderOpts.collectedRevalidate&&!(Y.renderOpts.collectedRevalidate>=R.INFINITE_CACHE)&&Y.renderOpts.collectedRevalidate,a=void 0===Y.renderOpts.collectedExpire||Y.renderOpts.collectedExpire>=R.INFINITE_CACHE?void 0:Y.renderOpts.collectedExpire;return{value:{kind:A.CachedRouteKind.APP_ROUTE,status:i.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:a}}}}catch(t){throw(null==r?void 0:r.isStale)&&await C.onRequestError(e,t,{routerKind:"App Router",routePath:I,routeType:"route",revalidateReason:(0,l.getRevalidateReason)({isStaticGeneration:P,isOnDemandRevalidate:f})},!1,O),t}},o=await C.handleResponse({req:e,nextConfig:g,cacheKey:X,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:S,isRoutePPREnabled:!1,isOnDemandRevalidate:f,revalidateOnlyGenerated:D,responseGenerator:T,waitUntil:a.waitUntil,isMinimalMode:K});if(!w)return null;if((null==o||null==(i=o.value)?void 0:i.kind)!==A.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==o||null==(n=o.value)?void 0:n.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});K||t.setHeader("x-nextjs-cache",f?"REVALIDATED":o.isMiss?"MISS":o.isStale?"STALE":"HIT"),x&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let d=(0,c.fromNodeOutgoingHttpHeaders)(o.value.headers);return K&&w||d.delete(R.NEXT_CACHE_TAGS_HEADER),!o.cacheControl||t.getHeader("Cache-Control")||d.get("Cache-Control")||d.set("Cache-Control",(0,N.getCacheControlHeader)(o.cacheControl)),await (0,u.sendResponse)(B,$,new Response(o.value.body,{headers:d,status:o.value.status||200})),null};j&&q?await n(q):(s=G.getActiveScopeSpan(),await G.withPropagatedContext(e.headers,()=>G.trace(d.BaseServerSpan.handleRequest,{spanName:`${k} ${I}`,kind:i.SpanKind.SERVER,attributes:{"http.method":k,"http.target":e.url}},n),void 0,!j))}catch(t){if(t instanceof p.NoFallbackError||await C.onRequestError(e,t,{routerKind:"App Router",routePath:y,routeType:"route",revalidateReason:(0,l.getRevalidateReason)({isStaticGeneration:P,isOnDemandRevalidate:f})},!1,O),w)throw t;return await (0,u.sendResponse)(B,$,new Response(null,{status:500})),null}}e.s(["handler",0,f,"patchFetch",0,function(){return(0,a.patchFetch)({workAsyncStorage:x,workUnitAsyncStorage:S})},"routeModule",0,C,"serverHooks",0,O,"workAsyncStorage",0,x,"workUnitAsyncStorage",0,S],6848)}];

//# sourceMappingURL=%5Broot-of-the-server%5D__135p-da._.js.map