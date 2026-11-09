// Read the shared nightly snapshot; no new RSS fetch occurs when refreshing this endpoint.
import {getStore} from '@netlify/blobs';
import {TARGET_REGIONS,shardKey,STORE_NAME,INDUSTRIES} from '../lib/daily-core.mjs';
const hdr={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'};
export default async function(req){
 if(req.method!=='GET')return new Response(JSON.stringify({error:'GETのみ対応'}),{status:405,headers:hdr});
 try{
  const store=getStore(STORE_NAME),keys=TARGET_REGIONS.flatMap(r=>[shardKey(r,0),shardKey(r,1)]);
  const pieces=await Promise.all(keys.map(async key=>{try{return {key,data:await store.get(key,{type:'json',consistency:'strong'})};}catch(e){return {key,error:String(e?.message||e).slice(0,140)}}}));
  const unique=new Map(),warnings=[],order={high:2,review:1,noise:0};
  for(const {key,data,error} of pieces){
    if(error){warnings.push(key+': '+error);continue}
    if(!data){warnings.push(key+': 未実行');continue}
    if(data.failed?.length)warnings.push(key+': '+data.failed.length+'業種で取得失敗');
    for(const a of data.articles||[]){
      if(!['high','review'].includes(a.quality)||!TARGET_REGIONS.includes(a.region)||!INDUSTRIES.includes(a.industry))continue;
      const id=a.id||a.title;
      const old=unique.get(id);
      if(!old||order[a.quality]>order[old.quality]||(order[a.quality]===order[old.quality]&&a.score>old.score))unique.set(id,a);
    }
  }
  const articles=[...unique.values()].sort((a,b)=>Date.parse(b.firstSeenAt||0)-Date.parse(a.firstSeenAt||0)||b.score-a.score).slice(0,1200);
  return new Response(JSON.stringify({version:'v5.0',regions:TARGET_REGIONS,industries:INDUSTRIES.length,articles,summary:{shardsReady:pieces.filter(x=>x.data).length,totalShards:keys.length,lastUpdatedAt:pieces.reduce((max,x)=>x.data?.updatedAt>max?x.data.updatedAt:max,''),warnings}}),{headers:hdr});
 }catch(e){console.error('[get-daily]',e);return new Response(JSON.stringify({error:'保存された検索結果を読み込めませんでした。',detail:String(e?.message||e).slice(0,160)}),{status:500,headers:hdr});}
}
