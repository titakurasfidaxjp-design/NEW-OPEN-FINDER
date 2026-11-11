// OPEN LEAD FINDER v5.6: sales-focused public official listing sources.
// Interpret only explicit opening indications and prefecture labels. Never infer a day from a month.
const TARGET=['愛知','岐阜','静岡','三重','滋賀','石川','福井','富山','長野'];
const OFFICIAL_STORE='olf-official-v54';
const clean=s=>String(s||'').normalize('NFKC').replace(/\s+/g,' ').trim();
const strip=html=>clean(String(html||'').replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(+n)));
const iso=(y,m,d)=>{const dt=new Date(Date.UTC(+y,+m-1,+d));return +y>=2024&&+y<=2040&&dt.getUTCFullYear()===+y&&dt.getUTCMonth()===+m-1&&dt.getUTCDate()===+d?`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`:null};
const month=(y,m)=>+y>=2024&&+y<=2040&&+m>=1&&+m<=12?`${y}-${String(m).padStart(2,'0')}`:null;
function record(source,name,region,{date=null,mon=null,url,siteUrl,note=''}){
 if(!TARGET.includes(region)||!/(?:店|院)$/.test(name)||!(date||mon))return null;
 const mm=date?.slice(0,7)||mon;
 if(!/^20\d{2}-(?:0[1-9]|1[0-2])$/.test(mm))return null;
 const brand=source==='ikuraya'?'いくらや':'Repilates';
 const nameClean=clean(name),id=`official:${source}:${region}:${nameClean.replace(/[\s　・]/g,'').toLowerCase()}`;
 return {id,storeName:nameClean,industry:source==='ikuraya'?'買取専門店':'ピラティス',region,month:mm,openingDate:date,openingDateText:date?`${+date.slice(0,4)}年${+date.slice(5,7)}月${+date.slice(8)}日`:`${+mm.slice(0,4)}年${+mm.slice(5)}月（日付未確認）`,datePrecision:date?'day':'month',title:`${nameClean}｜${region}県｜${date||mm} オープン（公式情報）`,source:`${brand} 公式新店情報`,url,officialListUrl:siteUrl,quality:'high',score:date?98:90,reasons:['公式の新店舗情報に掲載','店舗名・地域・開業時期を確認'],auditNotes:[note||'公式公開情報から抽出。独自の広告契約権限は未確認'],official:true,publishedAt:null};
}
// Ikuraya /open/ listing has a release date followed by:
// 《愛知県名古屋市》10月31日 名古屋安田通店オープン！
// Extract explicit prefecture and opening date; no locality guessing.
export function parseIkuraya(html,siteUrl='https://www.kaitori-ikuraya.jp/open/'){
 const text=strip(html),out=[],seen=new Set();
 const re=/《(愛知|岐阜|静岡|三重|滋賀|石川|福井|富山|長野)県[^》]{0,22}》\s*(\d{1,2})月\s*(\d{1,2})日\s*([^。！!《》]{2,50}?店)\s*オープン/gu;
 const links=[...String(html||'').matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)].map(m=>{try{const u=new URL(m[1],siteUrl);return u.hostname==='www.kaitori-ikuraya.jp'?{url:u.href,label:strip(m[2])}:null}catch{return null}}).filter(Boolean);
 for(const match of text.matchAll(re)){
  const reg=match[1],mo=+match[2],day=+match[3],shortName=clean(match[4]);
  const before=text.slice(Math.max(0,match.index-250),match.index);
  const matches=[...before.matchAll(/(20\d{2})\s*[/年.\-]\s*\d{1,2}\s*[/月.\-]\s*\d{1,2}/g)];
  // Prefer the visible publication year; if absent, skip rather than invent one.
  const published=matches.at(-1);if(!published)continue;
  const date=iso(+published[1],mo,day);if(!date)continue;
  const name=shortName.startsWith('いくらや')?shortName:'いくらや '+shortName;
  const url=links.find(a=>a.label.includes(shortName)&&a.url!==siteUrl)?.url||siteUrl;
  const item=record('ikuraya',name,reg,{date,url,siteUrl,note:'公式オープン記事から確認。運営会社・広告決裁権は架電前に要確認'});
  if(item&&!seen.has(item.id)){out.push(item);seen.add(item.id)}
 }
 return out;
}
// Repilates studio listing contains visible cards in the form:
// 県名 NEW 予約受付中 2027年1月新店舗OPEN [branch]店 〒123-4567 県名[city]
// Restrict the match to the address immediately following a store name.
export function parseRepilates(html,siteUrl='https://repilates.jp/studio/'){
 const text=strip(html),out=[],seen=new Set();
 const re=/(20\d{2})年\s*(\d{1,2})月\s*新店舗\s*(?:OPEN|オープン)\s*([\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}A-Za-z0-9・ー\-\s]{2,48}?店)\s*(?:〒\s*\d{3}-?\d{4}\s*)?(愛知|岐阜|静岡|三重|滋賀|石川|福井|富山|長野)県/giu;
 for(const m of text.matchAll(re)){
  const mo=month(m[1],m[2]);if(!mo)continue;
  const name='Repilates '+clean(m[3]),region=m[4];
  const item=record('repilates',name,region,{mon:mo,url:siteUrl,siteUrl,note:'公式スタジオ一覧から開業予定月を確認。日にちは未確認'});
  if(item&&!seen.has(item.id)){out.push(item);seen.add(item.id)}
 }
 return out;
}
const CONF={ikuraya:{url:'https://www.kaitori-ikuraya.jp/open/',parse:parseIkuraya},repilates:{url:'https://repilates.jp/studio/',parse:parseRepilates}};
function horizon(a,now){const anchor=a.openingDate||a.month+'-28';const stamp=Date.parse(anchor+'T00:00:00+09:00');return Number.isFinite(stamp)&&stamp>now.getTime()-100*86400000&&stamp<now.getTime()+700*86400000}
export async function scanSalesOfficial(source,{getStore,fetcher=fetch,now=new Date()}={}){
 const cfg=CONF[source];if(!cfg)throw Error('Unknown official sales source');if(typeof getStore!=='function')throw Error('Missing Netlify store');
 const store=getStore(OFFICIAL_STORE),before=await store.get(source,{type:'json',consistency:'strong'}).catch(()=>null);
 const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),10000);let html;
 try{const resp=await fetcher(cfg.url,{signal:ctl.signal,headers:{Accept:'text/html'}});if(!resp.ok)throw Error('HTTP '+resp.status);html=await resp.text();if(html.length<100)throw Error('Unexpected short HTML');}finally{clearTimeout(timer)}
 const incoming=cfg.parse(html,cfg.url),old=new Map((before?.articles||[]).filter(a=>horizon(a,now)).map(a=>[a.id,a]));
 for(const item of incoming){const prior=old.get(item.id);if(horizon(item,now))old.set(item.id,{...item,firstSeenAt:prior?.firstSeenAt||now.toISOString(),lastSeenAt:now.toISOString()})}
 const articles=[...old.values()].sort((a,b)=>(a.openingDate||a.month).localeCompare(b.openingDate||b.month)).slice(0,250);
 const errors=[];
 if(!incoming.length)errors.push('該当9県の開業情報を抽出できませんでした。対象店なし／サイト変更の可能性があります。');
 await store.setJSON(source,{source,updatedAt:now.toISOString(),articles,count:articles.length,fetched:incoming.length,targets:1,successful:1,errors});
 return {source,count:articles.length,fetched:incoming.length,errors};
}
