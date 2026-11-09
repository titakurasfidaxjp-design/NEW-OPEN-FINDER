// OPEN LEAD FINDER Discovery v3 — public Google News RSS candidate discovery.
// The queried opening month is a search hint, not a verified business opening date.
const MAX_SCANS = 4; // small batches avoid long external network requests
const MAX_RESULTS = 400;
const HEADLINE = /(新規|新店|新店舗|オープン|OPEN|開業|開店|開校|開院|出店|開設|プレオープン|グランドオープン)/i;
const headers={'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Cache-Control':'no-store'};
const respond=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
function xmlText(s=''){
 return s.replace(/^<!\[CDATA\[([\s\S]*?)\]\]>$/,'$1').replace(/&(#x[0-9a-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi,(all,x)=>{
  const t=x.toLowerCase(),m={amp:'&',quot:'"',apos:"'",lt:'<',gt:'>',nbsp:' '};if(m[t])return m[t];
  const n=t.startsWith('#x')?parseInt(t.slice(2),16):parseInt(t.slice(1),10);
  return Number.isFinite(n)&&n>0&&n<=0x10ffff?String.fromCodePoint(n):all;
 });
}
function field(xml,tag){const m=xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`,'i'));return m?xmlText(m[1].trim()).replace(/<[^>]+>/g,'').trim():''}
function parseRSS(xml){return [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)].slice(0,80).map(([,z])=>({title:field(z,'title'),url:field(z,'link'),source:field(z,'source'),publishedAt:field(z,'pubDate')})).filter(x=>x.title&&/^https:\/\//.test(x.url))}
const validName = x=>typeof x==='string'&&x.trim().length>0&&x.trim().length<75&&!/[\x00-\x1f]/.test(x);
function validate(x){if(!x||!['industries','regions','months'].every(k=>Array.isArray(x[k])))return null;
 const industries=[...new Set(x.industries.filter(validName).map(t=>t.trim()))].slice(0,12),regions=[...new Set(x.regions.filter(validName).map(t=>t.trim()))].slice(0,12),months=[...new Set(x.months.filter(s=>typeof s==='string'&&/^20\d{2}-(0[1-9]|1[0-2])$/.test(s)))].slice(0,18);
 if(!industries.length||!regions.length||!months.length)return null;
 const offset=Number.isInteger(x.offset)&&x.offset>=0&&x.offset<=3000?x.offset:0;
 const mode=['general','preopen','fc'].includes(x.mode)?x.mode:'general';return {industries,regions,months,offset,mode};
}
function term(i,r,m,mode){const [y,n]=m.split('-').map(Number);const date=`"${y}年${n}月"`;
 const trailer=mode==='fc'?'(FC OR フランチャイズ OR 加盟店) (オープン OR 新規出店 OR 新店)':mode==='preopen'?'(オープン予定 OR 開業予定 OR 新店舗 OR プレオープン)':'(オープン OR 開業 OR 開店 OR 新店舗 OR 出店 OR 開校 OR 開院)';
 return `"${i}" "${r}" ${date} ${trailer}`;
}
function scanPlan(c){const all=[];for(const m of c.months)for(const i of c.industries)for(const r of c.regions)all.push({industry:i,region:r,month:m,mode:c.mode,query:term(i,r,m,c.mode)});
 return {scans:all.slice(c.offset,c.offset+MAX_SCANS),total:all.length,offset:c.offset,nextOffset:Math.min(all.length,c.offset+MAX_SCANS)};
}
async function fetchRSS(scan,fetchFn=fetch){const url='https://news.google.com/rss/search?'+new URLSearchParams({q:scan.query,hl:'ja',gl:'JP',ceid:'JP:ja'}).toString();const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),5500);try{const res=await fetchFn(url,{signal:ctl.signal,headers:{'Accept':'application/rss+xml, application/xml;q=0.9, text/xml;q=0.8','User-Agent':'Mozilla/5.0'}});if(!res.ok)throw new Error('News source status '+res.status);const xml=await res.text();if(!xml.includes('<rss')&&!xml.includes('<item'))throw new Error('Invalid RSS');return parseRSS(xml).map(a=>({...a,...scan,signal:HEADLINE.test(a.title)?'opening':'review'}))}finally{clearTimeout(timer)}}
function articleId(title){const norm=title.normalize('NFKC').replace(/\s+/g,'').toLowerCase();let hash=2166136261;for(let i=0;i<norm.length;i++){hash^=norm.charCodeAt(i);hash=Math.imul(hash,16777619)}return (hash>>>0).toString(36)+'-'+norm.slice(0,30)}
function unique(out){const ids=new Set(),result=[];for(const a of out){const id=articleId(a.title);if(ids.has(id))continue;ids.add(id);const t=Date.parse(a.publishedAt);result.push({id,title:a.title,url:a.url,source:a.source,publishedAt:Number.isFinite(t)?new Date(t).toISOString():'',industry:a.industry,region:a.region,month:a.month,mode:a.mode,signal:a.signal,query:a.query});if(result.length>=MAX_RESULTS)break}return result.sort((a,b)=>(a.signal==='opening'?0:1)-(b.signal==='opening'?0:1)||Date.parse(b.publishedAt||0)-Date.parse(a.publishedAt||0))}
export default async function handler(request){if(request.method==='OPTIONS')return new Response(null,{status:204,headers});if(request.method==='GET'&&new URL(request.url).searchParams.get('health')==='1')return respond({ok:true,version:'v3.1',function:'search-openings'});if(request.method!=='POST')return respond({error:'POSTのみ対応しています。'},405);
 let payload;try{const s=await request.text();if(s.length>15000)return respond({error:'検索条件が大きすぎます。'},413);payload=JSON.parse(s)}catch{return respond({error:'検索条件の形式が正しくありません。'},400)}
 const c=validate(payload);if(!c)return respond({error:'業種・地域・月を選択してください。'},400);
 const plan=scanPlan(c);if(!plan.scans.length)return respond({articles:[],meta:{searched:0,failed:0,totalCombos:plan.total,offset:plan.offset,nextOffset:plan.nextOffset,hasMore:false,rawHits:0}});
 const out=[],errors=[];let cursor=0;async function worker(){while(cursor<plan.scans.length){const s=plan.scans[cursor++];try{out.push(...await fetchRSS(s))}catch(e){errors.push(String(e?.message||e))}}}
 await Promise.all(Array.from({length:Math.min(4,plan.scans.length)},()=>worker()));if(errors.length===plan.scans.length){console.warn('[OLF] RSS failure',errors.slice(0,3));return respond({error:'GoogleニュースRSSに接続できませんでした。深掘り検索タブのGoogle検索をお試しください。',diagnostic:{kind:'rss-unavailable',attempted:plan.scans.length,firstError:errors[0]?.slice(0,150)}},502)}
 const articles=unique(out);return respond({articles,meta:{searched:plan.scans.length,failed:errors.length,totalCombos:plan.total,offset:plan.offset,nextOffset:plan.nextOffset,hasMore:plan.nextOffset<plan.total,rawHits:out.length,unique:articles.length}})
}
export {parseRSS,validate,scanPlan,unique,articleId};
