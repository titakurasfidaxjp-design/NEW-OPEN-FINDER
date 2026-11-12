// OPEN LEAD FINDER v5 — morning RSS scan for 9 prefectures / 40 sectors.
// IMPORTANT: These are candidate news articles, NOT verified storefronts.
import { PROFILES, parseRSS, classify, articleId } from '../functions/search-openings.mjs';
import {refineOpening} from './refine-opening.mjs';
import {discoveryPlan,EXTRA_INDUSTRIES,TARGET_REGIONS,REGION_CITIES} from './discovery-queries.mjs';
export {TARGET_REGIONS,REGION_CITIES};
export const INDUSTRIES=Object.keys(PROFILES);
export const SHARD_SIZE=11;
export const SHARD_PARTS=Math.ceil(INDUSTRIES.length/SHARD_SIZE);
export const STORE_NAME='olf-daily-9pref-v5';

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
  const best=candidates[0]?refineOpening(candidates[0]):null;
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
    return parseRSS(xml).map(x=>pickArticle(x,industry,region,months,query)).filter(Boolean).map(a=>({...a,discoveryRoutes:['standard']}));
  }finally{clearTimeout(timer)}
}
// Uses the same RSS/validation/classification pipeline as the standard scan.
// Failure here must never prevent a valid standard scan from being stored.
export async function fetchDiscoveryIndustry(industry,region,months,fetcher=fetch,now=new Date()){
  const plan=discoveryPlan(industry,region,now);
  if(!plan)return [];
  const url='https://news.google.com/rss/search?'+new URLSearchParams({q:plan.query,hl:'ja',gl:'JP',ceid:'JP:ja'});
  const c=new AbortController(),timer=setTimeout(()=>c.abort(),5500);
  try{
    const response=await fetcher(url,{signal:c.signal,headers:{Accept:'application/rss+xml, application/xml;q=0.9'}});
    if(!response.ok)throw Error('RSS HTTP '+response.status);
    const xml=await response.text();
    if(!/<rss[\s>]|<item[\s>]/i.test(xml))throw Error('RSSが取得できませんでした');
    return parseRSS(xml).map(x=>pickArticle(x,industry,region,months,plan.query))
      .filter(Boolean).map(a=>({...a,discoveryRoutes:[plan.route]}));
  }finally{clearTimeout(timer)}
}
export async function scanShard(region,part,{getStore,fetcher=fetch,now=new Date()}={}){
  if(!TARGET_REGIONS.includes(region)||(!Number.isInteger(part)||part<0||part>=SHARD_PARTS))throw Error('Invalid shard');
  if(typeof getStore!=='function')throw Error('Storage connector missing');
  const target=INDUSTRIES.slice(part*SHARD_SIZE,(part+1)*SHARD_SIZE),months=monthWindow(now),store=getStore(STORE_NAME),key=shardKey(region,part);
  const previous=await store.get(key,{type:'json',consistency:'strong'}).catch(()=>null);
  const previousMap=new Map((previous?.articles||[]).map(a=>[a.id,a]));
  let ptr=0,completed=0,extraCompleted=0;const failed=[],extraFailed=[],records=[];
  async function worker(){while(ptr<target.length){
    const industry=target[ptr++];
    const planned=!!discoveryPlan(industry,region,now);
    const tasks=[fetchIndustry(industry,region,months,fetcher,now)];
    if(planned)tasks.push(fetchDiscoveryIndustry(industry,region,months,fetcher,now));
    const outcomes=await Promise.allSettled(tasks);
    if(outcomes[0].status==='fulfilled'){records.push(...outcomes[0].value);completed++;}
    else failed.push({industry,message:String(outcomes[0].reason?.message||outcomes[0].reason).slice(0,110)});
    if(planned){if(outcomes[1].status==='fulfilled'){records.push(...outcomes[1].value);extraCompleted++;}
      else extraFailed.push({industry,message:String(outcomes[1].reason?.message||outcomes[1].reason).slice(0,110)});}
  }}
  await Promise.all(Array.from({length:4},()=>worker()));
  const nowIso=now.toISOString(),cutoff=now.getTime()-40*86400000;
  const map=new Map();
  for(const prev of previousMap.values()){
    const first=Date.parse(prev.firstSeenAt||'');if(Number.isFinite(first)&&first>cutoff)map.set(prev.id,prev);
  }
  for(const a of records){
    const before=map.get(a.id),firstSeenAt=before?.firstSeenAt||nowIso;
    const merged={id:a.id,title:a.title,url:a.url,source:a.source,publishedAt:a.publishedAt,industry:a.industry,region:a.region,month:a.month,quality:a.quality,score:a.score,reasons:a.reasons,warnings:a.warnings,openingDateText:a.openingDateText,firstSeenAt,lastSeenAt:nowIso,discoveryRoutes:a.discoveryRoutes||['standard']};
    const routes=[...new Set([...(before?.discoveryRoutes||[]),...merged.discoveryRoutes])];
    if(!before||order[merged.quality]>order[before.quality]||(order[merged.quality]===order[before.quality]&&merged.score>=before.score))map.set(a.id,{...merged,discoveryRoutes:routes});
    else map.set(a.id,{...before,lastSeenAt:nowIso,discoveryRoutes:routes});
  }
  const articles=[...map.values()].sort((a,b)=>Date.parse(b.firstSeenAt)-Date.parse(a.firstSeenAt)).slice(0,240);
  // On total failure, retain last successful snapshot and explicitly report errors.
  const newCount=records.filter(a=>!previousMap.has(a.id)).length;
  const output={region,part,updatedAt:nowIso,completed,expected:target.length,failed,months,articles:completed===0&&extraCompleted===0&&previous?.articles?.length?previous.articles:articles,newCount,extraCompleted,extraExpected:target.filter(i=>EXTRA_INDUSTRIES.includes(i)).length,extraFailed};
  await store.setJSON(key,output);
  return {key,region,part,completed,failures:failed.length,extraCompleted,extraFailures:extraFailed.length,count:output.articles.length,newCount};
}
