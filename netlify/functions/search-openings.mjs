// OPEN LEAD FINDER v2 - live news discovery via Google News public RSS.
// This is a Netlify Function, not a standalone HTML feature.
const MAX_SCANS = 12;
const MAX_RESULTS = 240;
const OPEN_RE = /(?:新規|新店|オープン|OPEN|開業|開店|開校|開院|出店|開設|プレオープン|グランドオープン)/i;
const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Cache-Control': 'no-store' };
const response = (body, status = 200) => new Response(JSON.stringify(body), { status, headers });
function decodeXml(input = '') {
  return input.replace(/^<!\[CDATA\[([\s\S]*?)\]\]>$/,'$1').replace(/&(#x[0-9a-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi, (full, token) => {
    const map = { amp:'&', quot:'"', apos:"'", lt:'<', gt:'>', nbsp:' ' };
    const lower = token.toLowerCase();
    if (map[lower] !== undefined) return map[lower];
    const n = lower.startsWith('#x') ? parseInt(lower.slice(2),16):parseInt(lower.slice(1),10);
    return Number.isFinite(n)&&n>0&&n<=0x10ffff ? String.fromCodePoint(n):full;
  });
}
function textField(xml, name) {
 const match = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, 'i'));
 return match ? decodeXml(match[1].trim()).replace(/<[^>]+>/g,'').trim() : '';
}
function parseRSS(xml) {
 const items = [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)].slice(0,70);
 return items.map(([,item]) => ({
    title:textField(item,'title'), url:textField(item,'link'),
    source:textField(item,'source'), publishedAt:textField(item,'pubDate'),
    description:textField(item,'description')
 })).filter(x=>x.title && /^https:\/\//.test(x.url));
}
const isText = x=>typeof x==='string' && x.trim().length>0 && x.trim().length<=65;
function validate(payload){
 if(!payload || !['industries','regions','months'].every(k=>Array.isArray(payload[k])))return null;
 const industries=[...new Set(payload.industries.filter(isText).map(x=>x.trim()))].slice(0,12);
 const regions=[...new Set(payload.regions.filter(isText).map(x=>x.trim()))].slice(0,12);
 const months=[...new Set(payload.months.filter(x=>typeof x==='string' && /^20\d{2}-(0[1-9]|1[0-2])$/.test(x)))].slice(0,19);
 if(!industries.length || !regions.length || !months.length)return null;
 return {industries,regions,months};
}
function scansFor(c){const out=[];
 for(const industry of c.industries)for(const region of c.regions)for(const month of c.months){
  if(out.length===MAX_SCANS)break;
  const [y,m]=month.split('-').map(Number);
  // The full year-month is a search hint, not proof of the actual opening date.
  const term=`"${industry}" "${region}" "${y}年${m}月" (オープン OR 開業 OR 開店 OR 新店舗 OR 開校 OR 出店)`;
  out.push({industry,region,month,query:term});
 }
 return out;
}
async function fetchNews(scan, fetchFn=fetch){
 const url='https://news.google.com/rss/search?'+new URLSearchParams({q:scan.query,hl:'ja',gl:'JP',ceid:'JP:ja'}).toString();
 const ctrl = new AbortController();const timeout=setTimeout(()=>ctrl.abort(),7500);
 try{
  const r=await fetchFn(url,{signal:ctrl.signal,headers:{'Accept':'application/rss+xml, application/xml;q=0.9, text/xml;q=0.8','User-Agent':'Mozilla/5.0 OPEN-LEAD-FINDER/2.0'}});
  if(!r.ok)throw new Error('News provider status '+r.status);
  const xml=await r.text();if(!xml.includes('<rss')&&!xml.includes('<item'))throw new Error('News provider returned non-RSS');
  return parseRSS(xml).map(a=>({...a,...scan,signal:OPEN_RE.test(a.title)?'headline':'review'}));
 }finally{clearTimeout(timeout)}
}
function unique(articles){const set=new Set();const result=[];
 for(const a of articles){const key=a.title.replace(/\s+/g,'').normalize('NFKC').toLowerCase();if(set.has(key))continue;set.add(key);
  const t=Date.parse(a.publishedAt);result.push({id:key.slice(0,180),title:a.title,url:a.url,source:a.source,publishedAt:Number.isFinite(t)?new Date(t).toISOString():'',industry:a.industry,region:a.region,month:a.month,query:a.query,signal:a.signal});if(result.length===MAX_RESULTS)break;
 }return result.sort((a,b)=>(a.signal==='headline'?0:1)-(b.signal==='headline'?0:1)||Date.parse(b.publishedAt||0)-Date.parse(a.publishedAt||0));
}
export default async function handler(request) {
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(request.method!=='POST')return response({error:'POSTのみ対応しています。'},405);
 let raw;try{raw=await request.text();if(raw.length>16000)return response({error:'検索条件が大きすぎます。'},413);raw=JSON.parse(raw)}catch(e){return response({error:'検索条件の形式が正しくありません。'},400)}
 const cond=validate(raw);if(!cond)return response({error:'業種、地域、期間を選択してください。'},400);
 const scans=scansFor(cond);const potential=cond.industries.length*cond.regions.length*cond.months.length;
 let cursor=0,failed=0;const out=[];
 async function worker(){while(cursor<scans.length){const scan=scans[cursor++];try{const a=await fetchNews(scan);out.push(...a)}catch(e){failed++;}}}
 await Promise.all(Array.from({length:Math.min(4,scans.length)},()=>worker()));
 if(failed===scans.length)return response({error:'ニュース情報を取得できませんでした。少し時間をおいて再試行するか、検索条件を絞ってください。'},502);
 const articles=unique(out);
 return response({articles,meta:{searched:scans.length,failed,skipped:Math.max(0,potential-scans.length),rawHits:out.length,total:articles.length}});
}
export {parseRSS,validate,scansFor,unique,fetchNews};
