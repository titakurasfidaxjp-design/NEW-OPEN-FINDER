// Read the shared nightly snapshot; no new RSS fetch occurs when refreshing this endpoint.
import {getStore} from '@netlify/blobs';
import {mergeOpenings,outsideTarget} from '../lib/merge-openings.mjs';
import {refineOpening} from '../lib/refine-opening.mjs';
import {TARGET_REGIONS,shardKey,STORE_NAME,INDUSTRIES,SHARD_PARTS} from '../lib/daily-core.mjs';
import {OFFICIAL_STORE,SOURCE_IDS} from '../lib/official-core.mjs';
const hdr={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'};
export default async function(req){
 if(req.method!=='GET')return new Response(JSON.stringify({error:'GETのみ対応'}),{status:405,headers:hdr});
 try{
  const store=getStore(STORE_NAME),keys=TARGET_REGIONS.flatMap(r=>Array.from({length:SHARD_PARTS},(_,part)=>shardKey(r,part)));
  const pieces=await Promise.all(keys.map(async key=>{try{return {key,data:await store.get(key,{type:'json',consistency:'strong'})};}catch(e){return {key,error:String(e?.message||e).slice(0,140)}}}));
  const unique=new Map(),warnings=[],order={high:2,review:1,noise:0};let outsideCount=0;
  for(const {key,data,error} of pieces){
    if(error){warnings.push(key+': '+error);continue}
    if(!data){warnings.push(key+': 未実行');continue}
    if(data.failed?.length)warnings.push(key+': '+data.failed.length+'業種で取得失敗');
    for(const original of data.articles||[]){
      const a=refineOpening(original);
      if(!['high','review'].includes(a.quality)||!TARGET_REGIONS.includes(a.region)||!INDUSTRIES.includes(a.industry))continue;
      if(outsideTarget(a)){outsideCount++;continue;}
      const id=a.id||a.title;
      const old=unique.get(id);
      if(!old||order[a.quality]>order[old.quality]||(order[a.quality]===order[old.quality]&&a.score>old.score))unique.set(id,a);
    }
  }
  const base=[...unique.values()];
  const result=mergeOpenings(base);
  // Official opening-list records represent STORES, not news articles. Merge only
  // when the same brand AND branch name appear in the same prefecture.
  const officialStore=getStore(OFFICIAL_STORE),officialSnaps=await Promise.all(SOURCE_IDS.map(async source=>{try{return {source,data:await officialStore.get(source,{type:'json',consistency:'strong'})}}catch(e){return {source,error:String(e?.message||e).slice(0,120)}}}));
  const official=[];for(const {source,data,error} of officialSnaps){if(error)warnings.push('公式 '+source+': '+error);else if(!data)warnings.push('公式 '+source+': 未取得（official-* のRun nowで収集可能）');else {if(data.errors?.length)warnings.push('公式 '+source+': '+data.errors.length+'件の取得警告');for(const a of data.articles||[])if(TARGET_REGIONS.includes(a.region)&&INDUSTRIES.includes(a.industry))official.push(a)}}
  const norm=x=>String(x||'').normalize('NFKC').toLowerCase().replace(/[\s　・,，.。:：!！?？\-\/()（）「」『』【】\[\]"'“”]/g,'');
  function sameStore(a,b){
   if(a.region!==b.region||a.industry!==b.industry)return false;
   const name=norm(b.storeName||'');const title=norm(a.title||'');
   if(!name||name.length<7)return false;
   const brand=b.storeName.startsWith('Rintosull')?'rintosull':b.storeName.startsWith('買取大吉')?'買取大吉':'';
   return brand&&title.includes(norm(brand))&&title.includes(name.replace(norm(brand),''));
  }
  const combined=[...result.articles];let joinedOfficial=0;
  for(const a of official){const found=combined.findIndex(b=>sameStore(b,a));if(found===-1){combined.push(a);continue}
   const old=combined[found],seen=new Set(),sources=[];
   for(const s of [{source:a.source,url:a.url,title:a.title},...(old.sources||[{source:old.source,url:old.url,title:old.title}])]){if(!s.url||seen.has(s.url))continue;seen.add(s.url);sources.push(s)}
   combined[found]={...a,firstSeenAt:[a.firstSeenAt,old.firstSeenAt].filter(Boolean).sort()[0],sources,matchedRecords:(old.matchedRecords||1)+1};joinedOfficial++;
  }
  const articles=combined.slice(0,1200);
  return new Response(JSON.stringify({version:'v5.4',regions:TARGET_REGIONS,industries:INDUSTRIES.length,articles,summary:{shardsReady:pieces.filter(x=>x.data).length,totalShards:keys.length,lastUpdatedAt:[...pieces.map(x=>x.data?.updatedAt),...officialSnaps.map(x=>x.data?.updatedAt)].filter(Boolean).sort().at(-1)||'',warnings,syndicatedDuplicatesRemoved:result.duplicates,outsideTargetExcluded:outsideCount,rawCandidates:base.length,officialSourcesReady:officialSnaps.filter(x=>x.data).length,officialSourcesTotal:SOURCE_IDS.length,officialStores:official.length,officialMatchedNews:joinedOfficial}}),{headers:hdr});
 }catch(e){console.error('[get-daily]',e);return new Response(JSON.stringify({error:'保存された検索結果を読み込めませんでした。',detail:String(e?.message||e).slice(0,160)}),{status:500,headers:hdr});}
}
