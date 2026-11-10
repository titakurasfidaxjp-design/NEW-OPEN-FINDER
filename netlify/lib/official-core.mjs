// v5.4: conservative parsing of publicly published *official* opening lists.
// A blank result is not silently treated as success if the document structure changes.
export const SOURCE_IDS=['rintosull','daikichi'];
export const OFFICIAL_STORE='olf-official-v54';
export const NINE=['愛知','岐阜','静岡','三重','滋賀','石川','福井','富山','長野'];
const REGION_NAMES=new Map(NINE.flatMap(x=>[[x,x],[x+'県',x]]));
const clean=s=>String(s||'').normalize('NFKC').replace(/\s+/g,' ').trim();
export function textLines(html){
 const noScripts=String(html||'').replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi,' ');
 const withLines=noScripts.replace(/<\s*br\b[^>]*\/?\s*>/gi,'\n').replace(/<\/(?:div|p|li|h[1-6]|section|article|tr|td|span|a|strong|em)>/gi,'\n').replace(/<[^>]*>/g,' ');
 const decoded=withLines.replace(/&(?:nbsp|amp|lt|gt|quot|apos|#39|#x27|#x2f);/gi,m=>({'&nbsp;':' ','&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&#39;':"'",'&#x27;':"'",'&#x2f;':'/'}[m.toLowerCase()]||m)).replace(/&#(\d+);/g,(_,x)=>String.fromCodePoint(Number(x))).replace(/&#x([a-f0-9]+);/gi,(_,x)=>String.fromCodePoint(parseInt(x,16)));
 return decoded.split(/[\r\n]+/).map(clean).filter(Boolean);
}
const iso=(y,m,d)=>{const n=[+y,+m,+d];if(n[0]<2024||n[0]>2040||n[1]<1||n[1]>12||n[2]<1||n[2]>31)return null;const dt=new Date(Date.UTC(n[0],n[1]-1,n[2]));return dt.getUTCFullYear()===n[0]&&dt.getUTCMonth()===n[1]-1&&dt.getUTCDate()===n[2]?`${n[0]}-${String(n[1]).padStart(2,'0')}-${String(n[2]).padStart(2,'0')}`:null};
const entry=(brand,name,region,date,sourceUrl)=>({id:'official:'+brand+':'+region+':'+name,storeName:name,industry:brand==='daikichi'?'買取専門店':'ピラティス',region,month:date.slice(0,7),openingDate:date,openingDateText:`${Number(date.slice(0,4))}年${Number(date.slice(5,7))}月${Number(date.slice(8,10))}日`,datePrecision:'day',title:`${name}｜${region}県｜${date} 新規オープン（公式情報）`,source:brand==='daikichi'?'買取大吉 公式新店情報':'Rintosull 公式新店情報',url:sourceUrl,quality:'high',score:98,reasons:['公式新店一覧に掲載','店名・開業日・地域を抽出'],auditNotes:['公式一覧から抽出。独自の広告契約可否は未確認'],official:true,publishedAt:null});
export function parseRintosull(html,url='https://rintosull.jp/news/all-topics-20261027.html'){
 const lines=textLines(html);let region='',date='',renewal=false;const seen=new Set(),found=[];
 for(let i=0;i<lines.length;i++){
  const s=lines[i];
  const r=s.match(/[＜<]([\p{Script=Han}\p{Script=Hiragana}]{2,6})(?:エリア|地域)[＞>]/u);
  if(r){region=REGION_NAMES.get(r[1])||'';date='';renewal=false;continue;}
  // Date lines may be styled as 〖 2027/1/4 オープン 〗.
  const d=s.match(/20\d{2}\s*[/年]\s*\d{1,2}\s*[/月]\s*\d{1,2}\s*日?\s*(?:に)?\s*(?:リニューアル|新規)?\s*(?:グランド)?\s*(?:OPEN|オープン)/i);
  if(d){const x=d[0].match(/(20\d{2})\s*[/年]\s*(\d{1,2})\s*[/月]\s*(\d{1,2})/);date=x?iso(...x.slice(1)):null;renewal=/リニューアル|RENEWAL/i.test(s);continue;}
  if(!region||!date||renewal)continue;
  const m=s.match(/(?:▶\s*)?[〖【「『]\s*([^〖〗【】「」『』]{2,58}店)\s*[〗】」』]/);
  if(!m)continue;
  const name='Rintosull '+clean(m[1]);const id=region+'|'+name+'|'+date;if(seen.has(id))continue;seen.add(id);found.push(entry('rintosull',name,region,date,url));
 }
 return found;
}
export function parseDaikichi(html,url='https://www.kaitori-daikichi.jp/open/category/new/'){
 const lines=textLines(html),found=[],seen=new Set();let pubYear=new Date().getUTCFullYear();
 for(const s of lines){
  const pub=s.match(/^(20\d{2})\s*[/.-]\s*\d{1,2}\s*[/.-]\s*\d{1,2}$/);if(pub){pubYear=Number(pub[1]);continue;}
  const m=s.match(/[【〖]\s*([^【】〖〗]{2,25})\s*[】〗]\s*(\d{1,2})月(\d{1,2})日\s*[『「]\s*([^『』「」]{3,65})\s*[』」]\s*(?:OPEN|オープン)/i);
  if(!m)continue;
  const pref=m[1].match(/^(愛知|岐阜|静岡|三重|滋賀|石川|福井|富山|長野)県/);if(!pref)continue;
  const region=pref[1],name=clean(m[4]);if(!/買取大吉/.test(name))continue;
  let year=pubYear,mon=+m[2],day=+m[3];const monthDelta=mon-(Number(new Date().toISOString().slice(5,7)));
  // A December press release may announce a January opening; do not force same year.
  if(mon===1&&s.includes('来年'))year=pubYear+1;
  let date=iso(year,mon,day);if(!date)continue;
  const key=region+'|'+name+'|'+date;if(seen.has(key))continue;seen.add(key);found.push(entry('daikichi',name,region,date,url));
 }
 return found;
}
const sources={
 rintosull:{urls:['https://rintosull.jp/news/all-topics-20261027.html'],parse:parseRintosull},
 daikichi:{urls:['https://www.kaitori-daikichi.jp/open/category/new/','https://www.kaitori-daikichi.jp/open/category/new/page/2/'],parse:parseDaikichi}
};
export function discoverRintosullArticles(html){
 const all=[...String(html||'').matchAll(/href=["']([^"']*all-topics-(20\d{6})(?:-newopen)?\.html[^"']*)["']/gi)]
  .map(m=>({url:new URL(m[1], 'https://rintosull.jp/news/').href,stamp:m[2]}))
  .filter(o=>{try{return new URL(o.url).hostname==='rintosull.jp'}catch{return false}});
 const seen=new Set();return all.sort((a,b)=>b.stamp.localeCompare(a.stamp)).filter(x=>{if(seen.has(x.url))return false;seen.add(x.url);return true}).slice(0,3).map(x=>x.url);
}
export async function scanOfficial(source,{getStore,fetcher=fetch,now=new Date()}={}){
 if(!sources[source])throw Error('Unsupported official source');if(typeof getStore!=='function')throw Error('Missing store');
 const store=getStore(OFFICIAL_STORE),before=await store.get(source,{type:'json',consistency:'strong'}).catch(()=>null),prev=new Map((before?.articles||[]).map(x=>[x.id,x]));const found=[],errors=[];
 const urls=[...sources[source].urls];
 if(source==='rintosull'){
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),6500);
  try{const index=await fetcher('https://rintosull.jp/news/',{signal:controller.signal});if(index.ok){const html=await index.text();const links=discoverRintosullArticles(html);for(const u of links)if(!urls.includes(u))urls.push(u);}}
  catch(e){errors.push('公式記事一覧: '+String(e?.message||e).slice(0,80));}
  finally{clearTimeout(timeout)}
 }
 const results=await Promise.all(urls.map(async url=>{const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),6500);
  try{const res=await fetcher(url,{signal:ctl.signal,headers:{'Accept':'text/html'}});if(!res.ok)throw Error('HTTP '+res.status);const html=await res.text();if(html.length<800)throw Error('Unexpected short HTML');return {url,articles:sources[source].parse(html,url)}}catch(e){return {url,error:String(e?.message||e).slice(0,90)}}finally{clearTimeout(timer)}
 }));
 for(const v of results){if(v.error)errors.push(`${v.url}: ${v.error}`);else found.push(...v.articles)}
 if(!found.length&&results.every(x=>x.error))throw Error(errors.join('; '));
 const nowIso=now.toISOString(),cutoff=now.getTime()-100*86400000,map=new Map();for(const a of prev.values()){const d=Date.parse(a.openingDate+'T00:00:00+09:00');if(Number.isFinite(d)&&d>=cutoff)map.set(a.id,a)}
 for(const a of found){const earlier=map.get(a.id);map.set(a.id,{...a,firstSeenAt:earlier?.firstSeenAt||nowIso,lastSeenAt:nowIso});}
 const articles=[...map.values()].filter(a=>Date.parse(a.openingDate+'T00:00:00+09:00')>=cutoff).sort((a,b)=>a.openingDate.localeCompare(b.openingDate)).slice(0,250);
 await store.setJSON(source,{source,updatedAt:nowIso,articles,count:articles.length,errors});
 return {source,count:articles.length,fetched:found.length,errors};
}
