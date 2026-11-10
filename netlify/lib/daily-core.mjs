// OPEN LEAD FINDER v5 — morning RSS scan for 9 prefectures / 40 sectors.
// IMPORTANT: These are candidate news articles, NOT verified storefronts.
import { PROFILES, parseRSS, classify, articleId } from '../functions/search-openings.mjs';

export const TARGET_REGIONS = ['愛知','岐阜','静岡','三重','滋賀','石川','福井','富山','長野'];
export const INDUSTRIES = Object.keys(PROFILES);
export const SHARD_SIZE = 11;
export const SHARD_PARTS = Math.ceil(INDUSTRIES.length / SHARD_SIZE);
export const STORE_NAME = 'olf-daily-9pref-v5';
export const REGION_CITIES = {
  '愛知':['名古屋','豊橋','一宮','岡崎'], '岐阜':['岐阜市','大垣','高山','多治見'],
  '静岡':['静岡市','浜松','沼津','富士市'], '三重':['四日市','津市','鈴鹿','松阪'],
  '滋賀':['大津','草津','彦根','長浜'], '石川':['金沢','小松','白山','野々市'],
  '福井':['福井市','鯖江','敦賀','坂井'], '富山':['富山市','高岡','射水','魚津'],
  '長野':['長野市','松本','上田','佐久']
};
const JST_OFFSET = 9*60*60*1000;
export function monthWindow(now = new Date()) {
  const d = new Date(now.getTime()+JST_OFFSET), y = d.getUTCFullYear(), m=d.getUTCMonth();
  return [-1,0,1,2,3].map(delta=>{const a=new Date(Date.UTC(y,m+delta,1));return `${a.getUTCFullYear()}-${String(a.getUTCMonth()+1).padStart(2,'0')}`;});
}
export const shardKey=(r,p)=>`${r}-${p}`;
export function buildQuery(industry,region,now=new Date()) {
  if(!PROFILES[industry]||!TARGET_REGIONS.includes(region))throw new Error('Invalid industry/region');
  const choices = PROFILES[industry].search.slice(0,3).map(x=>`"${x}"`).join(' OR ');
  const places = [region,...REGION_CITIES[region]].map(x=>`"${x}"`).join(' OR ');
  const after = new Date(now.getTime()-75*86400000).toISOString().slice(0,10);
  return `(${choices}) (${places}) ("新規オープン" OR "新店舗" OR "開業" OR "開院" OR "開校" OR "開所" OR "開設" OR "出店") after:${after} -加盟者募集 -開業セミナー`;
}
const order={high:2,review:1,noise:0};
export function pickArticle(item,industry,region,months,query){
  const candidates=months.map(month=>({month,mode:'general',...item,industry,region,query})).map(a=>({...a,...classify(a)}));
  candidates.sort((a,b)=>(order[b.quality]-order[a.quality])||(b.score-a.score));
  const best=candidates[0];
  if(!best||best.quality==='noise')return null;
  return {...best,id:articleId(best.title,best.source)};
}
export async function fetchIndustry(industry,region,months,fetcher=fetch,now=new Date()){
  const query=buildQuery(industry,region,now);
  const url='https://news.google.com/rss/search?'+new URLSearchParams({q:query,hl:'ja',gl:'JP',ceid:'JP:ja'});
  const c=new AbortController(),timer=setTimeout(()=>c.abort(),5500);
  try{
    const response=await fetcher(url,{signal:c.signal,headers:{Accept:'application/rss+xml, application/xml;q=0.9'}});
    if(!response.ok)throw Error('RSS HTTP '+response.status);
    const xml=await response.text();
    if(!/<rss[\s>]|<item[\s>]/i.test(xml))throw Error('RSSが取得できませんでした');
    return parseRSS(xml).map(x=>pickArticle(x,industry,region,months,query)).filter(Boolean);
  }finally{clearTimeout(timer)}
}
export async function scanShard(region,part,{getStore,fetcher=fetch,now=new Date()}={}){
  if(!TARGET_REGIONS.includes(region)||(!Number.isInteger(part)||part<0||part>=SHARD_PARTS))throw Error('Invalid shard');
  if(typeof getStore!=='function')throw Error('Storage connector missing');
  const target=INDUSTRIES.slice(part*SHARD_SIZE,(part+1)*SHARD_SIZE),months=monthWindow(now),store=getStore(STORE_NAME),key=shardKey(region,part);
  const previous=await store.get(key,{type:'json',consistency:'strong'}).catch(()=>null);
  const previousMap=new Map((previous?.articles||[]).map(a=>[a.id,a]));
  let ptr=0,completed=0;const failed=[],records=[];
  async function worker(){while(ptr<target.length){const industry=target[ptr++];try{const matches=await fetchIndustry(industry,region,months,fetcher,now);records.push(...matches);completed++;}catch(e){failed.push({industry,message:String(e?.message||e).slice(0,110)});}}}
  await Promise.all(Array.from({length:4},()=>worker()));
  const nowIso=now.toISOString(),cutoff=now.getTime()-40*86400000;
  const map=new Map();
  for(const prev of previousMap.values()){
    const first=Date.parse(prev.firstSeenAt||'');if(Number.isFinite(first)&&first>cutoff)map.set(prev.id,prev);
  }
  for(const a of records){
    const before=map.get(a.id),firstSeenAt=before?.firstSeenAt||nowIso;
    const merged={id:a.id,title:a.title,url:a.url,source:a.source,publishedAt:a.publishedAt,industry:a.industry,region:a.region,month:a.month,quality:a.quality,score:a.score,reasons:a.reasons,warnings:a.warnings,openingDateText:a.openingDateText,firstSeenAt,lastSeenAt:nowIso};
    if(!before||order[merged.quality]>order[before.quality]||(order[merged.quality]===order[before.quality]&&merged.score>=before.score))map.set(a.id,merged);
    else map.set(a.id,{...before,lastSeenAt:nowIso});
  }
  const articles=[...map.values()].sort((a,b)=>Date.parse(b.firstSeenAt)-Date.parse(a.firstSeenAt)).slice(0,240);
  // On total failure, retain last successful snapshot and explicitly report errors.
  const newCount=records.filter(a=>!previousMap.has(a.id)).length;
  const output={region,part,updatedAt:nowIso,completed,expected:target.length,failed,months,articles:completed===0&&previous?.articles?.length?previous.articles:articles,newCount};
  await store.setJSON(key,output);
  return {key,region,part,completed,failures:failed.length,count:output.articles.length,newCount};
}
