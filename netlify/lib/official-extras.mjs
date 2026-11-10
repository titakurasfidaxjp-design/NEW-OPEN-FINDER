// OPEN LEAD FINDER v5.5 — strict official-source adapters.
// A source is an official business website, not a Google result or an aggregator.
// No store is emitted without a verified prefecture and a verifiable opening month/day.
const PREFS=['愛知','岐阜','静岡','三重','滋賀','石川','福井','富山','長野'];
const PATS=Object.fromEntries(PREFS.map(p=>[p,new RegExp(p+'県')]));
const KIND={otakaraya:['買取専門店','おたからや'],wakaba:['買取専門店','買取わかば'],selfcafe:['カフェ・喫茶店','セルフカフェ'],lava:['ヨガスタジオ','ホットヨガLAVA'],anytime:['フィットネスジム','エニタイムフィットネス'],fastnail:['ネイルサロン','FAST NAIL']};
const LABEL={otakaraya:'おたからや',wakaba:'買取わかば',selfcafe:'セルフカフェ',lava:'LAVA',anytime:'エニタイムフィットネス',fastnail:'FAST NAIL'};
const clean=s=>String(s||'').normalize('NFKC').replace(/\s+/g,' ').trim();
const decode=s=>String(s||'').replace(/&(?:nbsp|amp|lt|gt|quot|apos|#39);/gi,m=>({'&nbsp;':' ','&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&#39;':"'"}[m.toLowerCase()]||m)).replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(+n)).replace(/&#x([a-f\d]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16)));
const strip=s=>clean(decode(String(s||'').replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi,' ').replace(/<[^>]+>/g,' ')));
const textLines=html=>decode(String(html||'').replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi,' ').replace(/<\s*br\b[^>]*>/gi,'\n').replace(/<\/(?:div|p|li|h[1-6]|section|article|tr|td|span|strong|em|a)>/gi,'\n').replace(/<[^>]+>/g,' ')).split(/[\r\n]+/).map(clean).filter(Boolean);
const iso=(y,m,d)=>{const q=new Date(Date.UTC(+y,+m-1,+d));return +y>=2024&&+y<=2040&&q.getUTCFullYear()===+y&&q.getUTCMonth()===+m-1&&q.getUTCDate()===+d?`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`:null;};
const dateFrom=s=>{let m=String(s||'').match(/(20\d{2})\s*[年/.\-]\s*(\d{1,2})\s*[月/.\-]\s*(\d{1,2})\s*日?/);return m?iso(...m.slice(1)):null;};
const tokyoYear=now=>+(new Date(now.getTime()+9*3600000).toISOString().slice(0,4));
function ymdFromMonthDay(s,year){const m=clean(s).match(/(\d{1,2})月\s*(\d{1,2})日/);return m?iso(year,+m[1],+m[2]):null;}
function monthOnly(s){const m=clean(s).match(/(20\d{2})年\s*(\d{1,2})月/);return m&&+m[2]>=1&&+m[2]<=12?`${m[1]}-${m[2].padStart(2,'0')}`:null;}
function verifiedPrefNearAddress(lines){
 const address=/^(?:住所|店舗住所|所在地|〒|住所\/駅\/徒歩|【住所】|〖住所〗)/;
 for(let i=0;i<lines.length;i++)if(address.test(lines[i])){
  const s=lines.slice(i,i+5).join(' ');
  const match=s.match(/(?:〒\s*\d{3}-?\d{4}\s*)?(愛知|岐阜|静岡|三重|滋賀|石川|福井|富山|長野)県[\p{Script=Han}\p{Script=Hiragana}]/u);
  if(match)return match[1];
 }
 return null;
}
function storeName(s){return clean(s).replace(/^[「『【〖\s]+|[」』】〗\s]+$/g,'').slice(0,90)}
function officialRecord(source,name,region,date,url,{detailUrl=null,month=null,note=null}={}){
 if(!PREFS.includes(region)||!KIND[source]||!/(?:店|院)$/.test(name))return null;
 if(date&&!/^20\d{2}-\d{2}-\d{2}$/.test(date))return null;
 const mo=date?.slice(0,7)||month;if(!mo||!/^20\d{2}-(0[1-9]|1[0-2])$/.test(mo))return null;
 // The ID ignores dates to retain firstSeen when a business postpones opening.
 const id='official:'+source+':'+region+':'+clean(name).replace(/[\s　・]/g,'').toLowerCase();
 const targetUrl=/^https:\/\//.test(detailUrl||'')?detailUrl:url;
 return {id,storeName:name,industry:KIND[source][0],region,month:mo,openingDate:date||null,openingDateText:date?`${+mo.slice(0,4)}年${+mo.slice(5)}月${+date.slice(8)}日`:`${+mo.slice(0,4)}年${+mo.slice(5)}月（日付未確認）`,datePrecision:date?'day':'month',title:`${name}｜${region}県｜${date||mo} オープン（公式情報）`,source:`${LABEL[source]} 公式新店情報`,url:targetUrl,officialListUrl:url,quality:'high',score:date?98:90,reasons:['公式サイトで新店舗情報を確認','住所（県名）と開業時期を抽出'],auditNotes:[note||'公式公開情報から抽出。店舗の独自広告契約権限は未確認'],official:true,publishedAt:null};
}
function links(html,base){
 const out=[];for(const m of String(html||'').matchAll(/<a\b([^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*)>([\s\S]*?)<\/a>/gi)){
  try{const u=new URL(decode(m[2]),base);if(u.protocol!=='https:')continue;out.push({url:u.href,label:strip(m[3]),html:m[3],attrs:m[1]})}catch{}
 }return out;
}
function unique(items,k='url'){const seen=new Set();return items.filter(v=>{if(seen.has(v[k]))return false;seen.add(v[k]);return true})}
const hostIs=(url,host)=>{try{return new URL(url).hostname===host}catch{return false}};
const rangeIndex=(html,ref,keyword)=>{const t=String(html||'');const at=t.indexOf(keyword);return at<0?null:t.slice(Math.max(0,at-450),at+450)};
function scanOtakarayaList(html,now,base){
 const year=tokyoYear(now),candidates=[];
 for(const a of links(html,base)){
  if(!/^(?:www\.)?otakaraya(?:-shop)?\.jp$/i.test(new URL(a.url).hostname))continue;
  if(/リニューアル|閉店|移転/.test(a.label))continue;
  const m=a.label.match(/(?:新店舗オープン\s*)?([^　\s]+?店)\s*(\d{1,2})月\s*(\d{1,2})日\s*(?:新規)?オープン/);
  if(!m)continue;
  const publish=a.label.match(/(20\d{2})[.年/](\d{1,2})[.月/](\d{1,2})/);
  const y=publish?+publish[1]:year;const date=iso(y,+m[2],+m[3]);if(!date)continue;
  candidates.push({name:'おたからや '+m[1],date,url:a.url});
 }
 return unique(candidates,'url').slice(0,22);
}
function detailOtakaraya(html,candidate){
 const lines=textLines(html),r=verifiedPrefNearAddress(lines);if(!r)return null;
 if(!lines.some(x=>x.includes(candidate.name.replace(/^おたからや /,''))))return null;
 return officialRecord('otakaraya',candidate.name,r,candidate.date,candidate.url,{detailUrl:candidate.url});
}
function parseWakabaList(html,base){
 const c=[];
 for(const a of links(html,base)){
  if(!hostIs(a.url,'wakaba-shop.jp'))continue;
  const m=a.label.match(/(20\d{2}年\d{1,2}月\d{1,2}日)[\s　]*(.*?店)がオープン/);
  if(m)c.push({date:dateFrom(m[1]),name:storeName(m[2].startsWith('買取店')?m[2].replace(/^買取店わかば/,'買取わかば '):'買取わかば '+m[2]),url:a.url});
 }
 return unique(c.filter(x=>x.date&&x.name),'url').slice(0,15);
}
function detailWakaba(html,candidate){const r=verifiedPrefNearAddress(textLines(html));return r?officialRecord('wakaba',candidate.name,r,candidate.date,candidate.url,{detailUrl:candidate.url}):null;}
function parseSelfcafeArticle(html,url){
 const lines=textLines(html),t=lines.join(' ');
 const nameMatch=t.match(/店舗名\s*[:：]\s*(セルフカフェ[^\s　。]{2,45}店)/);
 const name=nameMatch?storeName(nameMatch[1]):storeName(t.match(/[「『](セルフカフェ[^」』]{2,45}店)[」』]/)?.[1]||'');
 const region=verifiedPrefNearAddress(lines);if(!name||!region)return null;
 const dt=t.match(/オープン日\s*[:：]\s*(20\d{2}年\d{1,2}月\d{1,2}日)/);
 const date=dt?dateFrom(dt[1]):dateFrom(t.match(/(20\d{2}年\d{1,2}月\d{1,2}日)\s*[^。]{0,35}(?:OPEN|オープン)/i)?.[1]||'');if(!date)return null;
 const detail=links(html,url).find(l=>hostIs(l.url,'selfcafe.jp')&&/\/shop\//.test(l.url))?.url;
 return officialRecord('selfcafe',name,region,date,url,{detailUrl:detail||url});
}
function scanLavaArticle(html,url){
 const t=textLines(html),all=t.join(' '),month=monthOnly(all.match(/20\d{2}年\d{1,2}月に[^。]{0,130}?(?:オープン|スタート)/)?.[0]||'');
 if(!month||/リニューアルオープン|移転オープン/.test(all.slice(0,1500)))return [];
 let region=null;const result=[];
 for(const s of t){
  const r=s.match(/[＜<]\s*(愛知|岐阜|静岡|三重|滋賀|石川|福井|富山|長野)(?:県)?エリア\s*[＞>]/);
  if(r){region=r[1];continue}
  if(/[＜<][^<>]{1,15}エリア[＞>]/.test(s)){region=null;continue}
  const m=s.match(/[〖【]([^〖〗【】]{2,60}店)[〗】]/);if(!m||!region||!/キャンペーン|無料見学|予約/.test(s))continue;
  const name=storeName('ホットヨガLAVA '+m[1]);
  // Do not infer exact day from the article publication date or a promotion date.
  const record=officialRecord('lava',name,region,null,url,{month,note:'公式の開業「月」を確認。正確な開業日は元記事で要確認'});if(record)result.push(record);
 }return result;
}
function parseAnytimeNews(html,url){
 const lines=textLines(html),t=lines.join(' ');
 const m=t.match(/(?:【|〖)グランドオープン(?:】|〗)\s*([^（）]{2,65}店)\s*[（(](愛知|岐阜|静岡|三重|滋賀|石川|福井|富山|長野)県/);
 if(!m||/リニューアル|移転/.test(t.slice(0,650)))return null;
 // The publication date is NOT automatically an opening date.
 const opener=t.match(/(20\d{2}年\d{1,2}月\d{1,2}日)[^。]{0,40}(?:グランド)?オープン/);
 const date=opener?dateFrom(opener[1]):null;
 if(!date)return null;
 return officialRecord('anytime',storeName('エニタイムフィットネス '+m[1]),m[2],date,url);
}
function parseFastnailArticle(html,url){
 const t=textLines(html).join(' ');
 if(!/新店舗情報/.test(t)||/移転|リニューアル/.test(t.slice(0,600)))return null;
 const m=t.match(/(?:【|〖)店舗名(?:】|〗)\s*(?:FASTNAIL\(ファストネイル\)|FASTNAIL|ファストネイル)\s*([^。\s　【〖]{2,60}店)/i);
 const d=t.match(/(?:【|〖)オープン日(?:】|〗)\s*(20\d{2}年\d{1,2}月\d{1,2}日)/);
 const p=t.match(/(?:【|〖)住所(?:】|〗)[^\u3002]{0,75}?(愛知|岐阜|静岡|三重|滋賀|石川|福井|富山|長野)県/);
 const name=m?storeName('FAST NAIL '+m[1]):null,date=d?dateFrom(d[1]):null;
 return name&&date&&p?officialRecord('fastnail',name,p[1],date,url):null;
}
const CONFIG={
 otakaraya:{url:'https://www.otakaraya.jp/news/',host:'www.otakaraya.jp'},
 wakaba:{url:'https://wakaba-shop.jp/',host:'wakaba-shop.jp'},
 selfcafe:{url:'https://selfcafe.jp/news/',host:'selfcafe.jp'},
 lava:{url:'https://lava-intl.co.jp/news/',host:'lava-intl.co.jp'},
 anytime:{url:'https://www.anytimefitness.co.jp/newslist/',host:'www.anytimefitness.co.jp'},
 fastnail:{url:'https://fastnail.jp/news_cat/store/',host:'fastnail.jp'}
};
export const EXTRA_IDS=Object.keys(CONFIG);
export {parseSelfcafeArticle,scanLavaArticle,parseFastnailArticle,parseAnytimeNews,detailOtakaraya,scanOtakarayaList,parseWakabaList,detailWakaba};
async function fetchHtml(fetcher,url){const ctl=new AbortController(),timeout=setTimeout(()=>ctl.abort(),8000);try{const r=await fetcher(url,{signal:ctl.signal,headers:{Accept:'text/html','User-Agent':'OpenLeadFinder/5.5 (public official store announcements)'}});if(!r.ok)throw Error('HTTP '+r.status);const txt=await r.text();if(txt.length<100)throw Error('短すぎるHTML');return txt;}finally{clearTimeout(timeout)}}
async function fromArticles(source,html,base,fetcher,errors){
 let targets=[];
 const available=links(html,base);
 if(source==='otakaraya'){
  targets=scanOtakarayaList(html,new Date(),base);
 }else if(source==='wakaba'){
  targets=parseWakabaList(html,base);
 }else if(source==='selfcafe'){
  targets=unique(available.filter(x=>hostIs(x.url,'selfcafe.jp')&&/\/newstore\/20\d{6,}/.test(x.url)).slice(0,25));
 }else if(source==='lava'){
  targets=unique(available.filter(x=>hostIs(x.url,'lava-intl.co.jp')&&/\/news\//.test(x.url)&&/新店舗/.test(x.label)&&/ホットヨガスタジオLAVA/.test(x.label)&&!/リニューアル|移転/.test(x.label)).slice(0,10));
 }else if(source==='anytime'){
  targets=unique(available.filter(x=>hostIs(x.url,'www.anytimefitness.co.jp')&&/グランドオープン/.test(x.label)&&!/リニューアル|移転/.test(x.label)&&/(愛知|岐阜|静岡|三重|滋賀|石川|福井|富山|長野)県/.test(x.label)).slice(0,20));
 }else if(source==='fastnail'){
  targets=unique(available.filter(x=>hostIs(x.url,'fastnail.jp')&&/\/news\/news-\d+\//.test(x.url)&&/新店舗情報/.test(x.label)).slice(0,18));
 }
 const pages=await Promise.all(targets.map(async q=>{try{return {q,html:await fetchHtml(fetcher,q.url)}}catch(e){return {q,error:String(e?.message||e)}}}));
 const records=[];let successful=0;
 for(const p of pages){if(p.error){errors.push(`${p.q.url}: ${p.error.slice(0,80)}`);continue}successful++;try{
  if(source==='otakaraya'){const x=detailOtakaraya(p.html,p.q);if(x)records.push(x)}
  if(source==='wakaba'){const x=detailWakaba(p.html,p.q);if(x)records.push(x)}
  if(source==='selfcafe'){const x=parseSelfcafeArticle(p.html,p.q.url);if(x)records.push(x)}
  if(source==='lava')records.push(...scanLavaArticle(p.html,p.q.url));
  if(source==='anytime'){const x=parseAnytimeNews(p.html,p.q.url);if(x)records.push(x)}
  if(source==='fastnail'){const x=parseFastnailArticle(p.html,p.q.url);if(x)records.push(x)}
 }catch(e){errors.push(`${p.q.url}: 解析エラー ${String(e.message).slice(0,90)}`)}}
 return {records,targets:targets.length,successful};
}
function withinHorizon(a,now){
 const anchor=a.openingDate||((a.month||'')+'-28');const date=Date.parse(anchor+'T00:00:00+09:00');return Number.isFinite(date)&&date>now.getTime()-100*86400000&&date<now.getTime()+700*86400000;
}
export async function scanExtraOfficial(source,{getStore,fetcher=fetch,now=new Date()}={}){
 if(!CONFIG[source])throw Error('Unknown official source: '+source);if(typeof getStore!=='function')throw Error('Missing getStore');
 const errors=[],cfg=CONFIG[source],store=getStore('olf-official-v54');
 const before=await store.get(source,{type:'json',consistency:'strong'}).catch(()=>null),prev=new Map((before?.articles||[]).map(a=>[a.id,a]));
 let html;try{html=await fetchHtml(fetcher,cfg.url)}catch(e){throw Error('公式一覧ページの取得失敗: '+String(e.message))}
 const {records,targets,successful}=await fromArticles(source,html,cfg.url,fetcher,errors);
 // Only persist parsed records. Do not pretend the entire source was checked when article links failed.
 if(targets>0&&successful===0)throw Error('個別記事の取得にすべて失敗: '+errors.slice(0,2).join('; '));
 const merged=new Map();for(const a of prev.values())if(withinHorizon(a,now))merged.set(a.id,a);
 for(const a of records)if(withinHorizon(a,now)){
  const prior=merged.get(a.id);merged.set(a.id,{...a,firstSeenAt:prior?.firstSeenAt||now.toISOString(),lastSeenAt:now.toISOString()});
 }
 const articles=[...merged.values()].filter(a=>withinHorizon(a,now)).sort((a,b)=>(a.openingDate||a.month).localeCompare(b.openingDate||b.month)).slice(0,250);
 await store.setJSON(source,{source,updatedAt:now.toISOString(),articles,count:articles.length,fetched:records.length,targets,successful,errors:errors.slice(0,15)});
 return {source,count:articles.length,fetched:records.length,targets,successful,errors:errors.slice(0,15)};
}
