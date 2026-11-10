// OPEN LEAD FINDER v5.2: consolidate the SAME opening across news syndication.
// Conservative: never collapse different named branches merely because the chain matches.
const clean=s=>String(s||'').normalize('NFKC').replace(/\s+/g,' ').trim();
const WORD_END='(?:店|院|校|スタジオ|スクール|教室|営業所|センター|ステーション|ショップ|ジム|カフェ|ベーカリー|サロン|クリニック|ホテル|工場|施設)';
function keyText(s){return clean(s).toLowerCase().replace(/[\s　・,，.。:：!！?？\-/\/()（）「」『』【】\[\]"'“”#＃~〜～]/g,'')}
export function storefrontName(title){
  const t=clean(title);
  const quotes=[...t.matchAll(/[「『“"]([^」』”"]{3,100})[」』”"]/g)].map(m=>clean(m[1]));
  const candidates=[];
  for(const q of quotes){
    if(q.length>72||!new RegExp(WORD_END+'$').test(q))continue;
    if(/^(?:新(?:規)?店舗|店舗|オープン|キャンペーン|NEW|OPEN|新店)$/.test(q))continue;
    const k=keyText(q.replace(/^(?:(?:高価|金・プラチナ|ブランド品)?買取(?:専門店)?|タイヤ・ホイール買取専門店|女性専用マシンピラティススタジオ|マシンピラティススタジオ|ホットヨガスタジオ|パーソナルジム|新店舗)\s*/i,''));
    if(k.length>=5)candidates.push(k);
  }
  if(!candidates.length)return '';
  // When both shopping mall and shop name are quoted, prefer the complete tenant name.
  candidates.sort((a,b)=>b.length-a.length);
  // A release listing multiple DIFFERENT branches is not a single-store opening.
  if(candidates.some(k=>k!==candidates[0]&&!candidates[0].includes(k)))return '';
  return candidates[0];
}
export function normalizedHeadline(a){
  let t=clean(a.title);
  const s=clean(a.source);
  if(s)for(const sep of [' - ',' | ','｜'])if(t.endsWith(sep+s))t=t.slice(0,-(sep+s).length);
  t=t.replace(/^(?:【写真】|〖写真〗|【画像】|【速報】)/,'').replace(/\s*\((?:20\d{2}年\d{1,2}月\d{1,2}日掲載|画像ギャラリー[^)]*)\)\s*$/,'').replace(/\s*\(画像ギャラリー.*$/,'');
  return keyText(t);
}
function threeGramDice(a,b){
  if(!a||!b)return 0;
  const grams=s=>{const result=new Set();for(let i=0;i<=s.length-3;i++)result.add(s.slice(i,i+3));return result};
  const x=grams(a),y=grams(b);let shared=0;for(const g of x)if(y.has(g))shared++;
  return x.size&&y.size?2*shared/(x.size+y.size):0;
}
const knownLocations={
 '愛知':/愛知県|名古屋市|名古屋|豊橋市|豊橋|岡崎市|岡崎|一宮市|一宮|半田市|半田|日進市|日進|春日井市|春日井|豊田市|豊田|刈谷市|刈谷|蒲郡市|蒲郡|大府市|大府|豊川市|豊川/,
 '岐阜':/岐阜県|岐阜市|大垣市|大垣|多治見市|多治見|高山市|高山|可児市|可児|各務原市|各務原|関市|中津川市|中津川|恵那市|恵那/,
 '静岡':/静岡県|静岡市|浜松市|浜松|沼津市|沼津|富士市|富士宮市|藤枝市|藤枝|磐田市|磐田|掛川市|掛川|三島市|三島/,
 '三重':/三重県|四日市市|四日市|松阪市|松阪|津市|鈴鹿市|鈴鹿|桑名市|桑名|伊勢市|伊勢|亀山市|亀山|名張市|名張/,
 '滋賀':/滋賀県|大津市|大津|草津市|草津|彦根市|彦根|長浜市|長浜|近江八幡市|近江八幡|守山市|守山|栗東市|栗東/,
 '石川':/石川県|金沢市|金沢|小松市|小松|白山市|野々市市|野々市|加賀市|七尾市|七尾|輪島市|輪島|能美市|能美|羽咋市|羽咋/,
 '福井':/福井県|福井市|鯖江市|鯖江|敦賀市|敦賀|坂井市|坂井|越前市|越前|大野市|勝山市|勝山/,
 '富山':/富山県|富山市|高岡市|高岡|射水市|射水|魚津市|魚津|砺波市|砺波|氷見市|氷見|黒部市|黒部/,
 '長野':/長野県|長野市|松本市|松本|上田市|上田|佐久市|佐久|飯田市|飯田|安曇野市|安曇野|塩尻市|塩尻|伊那市|伊那/
};
// A street/neighborhood name can coincide with a prefecture (藤沢市石川 ≠ 石川県).
export function outsideTarget(a){
  const t=clean(a.title),r=a.region;
  if(r==='石川'&&/(藤沢市石川|藤沢石川|藤沢市の石川)/.test(t)&&!knownLocations['石川'].test(t))return true;
  if(r==='富山'&&/(富山町|富山地区)/.test(t)&&!knownLocations['富山'].test(t))return true;
  const explicitOther=/(?:東京都|神奈川県|千葉県|埼玉県|大阪府|京都府|兵庫県|北海道|福岡県|沖縄県|新潟県|山梨県|岡山県|香川県|山形県)/.test(t);
  // Do not mistake an operator's head-office address for the actual opening location.
  const targetProof=knownLocations[r]?.test(t);
  if(explicitOther&&!targetProof&&/(?:藤沢市|横浜市|千葉市|新潟市|岡山市|高松市|大阪市|京都市|東京都|神奈川県)/.test(t))return true;
  return false;
}
function closeInTime(a,b){
 const ta=Date.parse(a.publishedAt||''),tb=Date.parse(b.publishedAt||'');
 return !Number.isFinite(ta)||!Number.isFinite(tb)||Math.abs(ta-tb)<=220*86400000;
}
export function sameOpening(a,b){
  if(a.region!==b.region)return false;
  if(!closeInTime(a,b))return false;
  const aa=normalizedHeadline(a),bb=normalizedHeadline(b);
  const na=storefrontName(a.title),nb=storefrontName(b.title);
  if(na&&nb&&na!==nb)return false;
  // Exact / near-identical syndicated headlines, including when branch is not in quotes.
  if(aa===bb&&aa.length>=18)return true;
  if(na&&nb&&na===nb)return true;
  if(Math.min(aa.length,bb.length)>=35){
    if(aa.includes(bb)||bb.includes(aa))return true;
    if(threeGramDice(aa,bb)>=(na||nb ? .975 : .94))return true;
  }
  return false;
}
const tier={high:2,review:1,noise:0};
function scoreSource(item){
 let n=0;const u=String(item.url||'');
 if(/prtimes\.jp\/main\/html\/rd\//.test(u)||/atpress\.ne\.jp\/news\//.test(u))n+=22;
 else if(/\.goguynet\.jp\//.test(u))n+=10;
 else if(/(news\.livedoor\.com\/pr_topics|mantan-web\.jp\/prtimes|tv-tokyo\.co\.jp\/plus\/external-pr)/.test(u))n-=8;
 if(/(?:photopage|\/photo\/|画像ギャラリー)/i.test(u+' '+String(item.title||'')))n-=20;
 n+=(tier[item.quality]||0)*15+(Number(item.score)||0)/25;
 return n;
}
export function mergeOpenings(input){
 const groups=[];let duplicates=0;
 const sorted=[...input].sort((a,b)=>scoreSource(b)-scoreSource(a));
 for(const a of sorted){
   let group=groups.find(g=>sameOpening(g.items[0],a));
   if(!group){group={items:[]};groups.push(group)} else duplicates++;
   group.items.push(a);
 }
 const merged=groups.map(g=>{
   const items=g.items;
   // Source preference is independent of classification confidence.
   const primary=[...items].sort((a,b)=>scoreSource(b)-scoreSource(a))[0];
   const strongest=[...items].sort((a,b)=>(tier[b.quality]-tier[a.quality])||(Number(b.score||0)-Number(a.score||0)))[0];
   const sources=[];const seen=new Set();
   for(const a of items){if(!a.url||seen.has(a.url))continue;seen.add(a.url);sources.push({source:a.source||'掲載元不明',url:a.url,title:a.title})}
   const firstSeenAt=items.map(a=>a.firstSeenAt).filter(Boolean).sort()[0]||primary.firstSeenAt;
   return {...primary,quality:strongest.quality,score:strongest.score,industry:strongest.industry,
      reasons:strongest.reasons,warnings:strongest.warnings,firstSeenAt,
      sources,duplicateCount:Math.max(0,sources.length-1),matchedRecords:items.length};
 });
 return {articles:merged.sort((a,b)=>Date.parse(b.firstSeenAt||0)-Date.parse(a.firstSeenAt||0)||(b.score||0)-(a.score||0)),duplicates};
}
