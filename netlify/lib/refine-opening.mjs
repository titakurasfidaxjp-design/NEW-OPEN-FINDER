// OPEN LEAD FINDER v5.3: conservative second-pass corrections on stored headlines.
// No remote content, no claims of verified opening. Preserve id/firstSeenAt for history.
const TARGET=['愛知','岐阜','静岡','三重','滋賀','石川','福井','富山','長野'];
const PREFECTURES=['北海道','青森','岩手','宮城','秋田','山形','福島','茨城','栃木','群馬','埼玉','千葉','東京','神奈川','新潟','富山','石川','福井','山梨','長野','岐阜','静岡','愛知','三重','滋賀','京都','大阪','兵庫','奈良','和歌山','鳥取','島根','岡山','広島','山口','徳島','香川','愛媛','高知','福岡','佐賀','長崎','熊本','大分','宮崎','鹿児島','沖縄'];
const openWord=/(?:グランド|プレ|ニュー)?オープン|OPEN|新規?出店|新店舗|開(?:店|業|院|校|所|設)/i;
const negateNear=/(?:無料|店舗)?(?:体験|見学|予約|キャンペーン|内覧|受付|説明会)/;
const compact=s=>String(s||'').normalize('NFKC').replace(/\s+/g,' ');
const pad=n=>String(n).padStart(2,'0');

function explicitRegions(title){
 const found=[];
 for(const r of PREFECTURES){
   const suffix=r==='北海道'?'':r==='東京'?'都':r==='京都'||r==='大阪'?'府':'県';
   if(title.includes(r+suffix) && !(r==='東京'&&title.includes('東京都外')))found.push(r);
 }
 return found;
}
function strongCityRegion(title){
 const cities={
  愛知:/名古屋市|一宮市|岡崎市|豊橋市|日進市|半田市|蒲郡市|大府市|豊田市|刈谷市/,
  岐阜:/大垣市|多治見市|可児市|岐阜市|高山市/,
  静岡:/浜松市|静岡市|沼津市|藤枝市|掛川市/,
  三重:/四日市市|松阪市|鈴鹿市|桑名市|伊勢市/,
  滋賀:/大津市|草津市|彦根市|長浜市/,
  石川:/金沢市|小松市|野々市市|七尾市/,
  福井:/福井市|鯖江市|敦賀市|坂井市/,
  富山:/高岡市|射水市|富山市|魚津市/,
  長野:/松本市|長野市|上田市|佐久市/
 };
 return Object.entries(cities).filter(([,re])=>re.test(title)).map(([r])=>r);
}
function detectOpeningDate(title,publishedAt){
 const t=compact(title);
 const published=new Date(publishedAt||'');
 const pubYear=Number.isFinite(+published)?published.getUTCFullYear():null;
 const pubMonth=Number.isFinite(+published)?published.getUTCMonth()+1:null;
 const re=/(?:(20\d{2})年\s*)?(1[0-2]|0?[1-9])月\s*(?:(3[01]|[12]\d|0?[1-9])日)?/g;
 const dates=[];
 for(const m of t.matchAll(re)){
  const start=m.index,end=start+m[0].length;
  const after=t.slice(end,end+65), before=t.slice(Math.max(0,start-50),start);
  const next=openWord.exec(after);
  const earlier=[...before.matchAll(new RegExp(openWord.source,'gi'))].pop();
  let score=0;
  if(next)score+=next.index<=25?10:next.index<=48?5:2;
  if(earlier){const distance=before.length-earlier.index-earlier[0].length;score+=distance<=22?5:distance<=40?2:0}
  // 「12月5日から店舗見学」「11月14日から無料体験」 are not opening dates.
  if(/^(?:から|より|～|〜|~|に)?\s*(?:店舗)?(?:見学|体験|無料体験|内覧|予約受付|キャンペーン)/.test(after))score-=18;
  if(negateNear.test(before.slice(-16))&& !/新(?:店舗|規出店)|開業日/.test(before.slice(-16)))score-=7;
  if(next&&/(見学|体験|イベント|予約|キャンペーン)/.test(after.slice(0,next.index)))score-=11;
  if(m[1])score+=2;
  if(m[3])score+=1;
  if(score<5)continue;
  let year=m[1]?Number(m[1]):pubYear;
  const month=Number(m[2]);
  if(!m[1]&&pubYear&&pubMonth){
    if(pubMonth-month>=6)year+=1;
    else if(month-pubMonth>=7)year-=1;
  }
  if(!year)continue;
  const day=m[3]?Number(m[3]):null;
  dates.push({score,month,year,day,text:m[0].trim()});
 }
 if(!dates.length)return null;
 dates.sort((a,b)=>b.score-a.score);
 // If two distinct months have equally strong opening evidence, request manual check.
 if(dates[1]&&dates[1].year*12+dates[1].month!==dates[0].year*12+dates[0].month&&dates[0].score-dates[1].score<3)return {ambiguous:true};
 return {...dates[0],monthKey:`${dates[0].year}-${pad(dates[0].month)}`};
}
export function refineOpening(item){
 const t=compact(item.title),a={...item};
 const notes=[],warnings=[...new Set(Array.isArray(a.warnings)?a.warnings:[])];
 let quality=['high','review','noise'].includes(a.quality)?a.quality:'review';
 const downgrade=()=>{if(quality==='high')quality='review'};
 const explicit=explicitRegions(t),foundCities=strongCityRegion(t);
 const regionConflict=explicit.length===1&&foundCities.length===1&&explicit[0]!==foundCities[0];
 const regions=regionConflict?[]:(explicit.length?explicit:foundCities);
 if(regionConflict){downgrade();notes.push('県名と市名の対応が不一致：本社所在地と出店先の混在の可能性');}
 // Geographic evidence gets priority over the prefecture used in a Google News query.
 if(regions.length===1){
  const actual=regions[0];
  if(!TARGET.includes(actual)){quality='noise';notes.push('指定9県以外');}
  else if(a.region!==actual){a.region=actual;notes.push(`記事中の所在地に合わせて${actual}県へ補正`);}
 }else if(regions.length>1){
  downgrade();notes.push('複数県の店舗情報を含む可能性：店舗単位の確認が必要');
 }
 // Strong out-of-area cities without explicit suffix (e.g. 藤沢市石川).
 if(/神奈川県|藤沢市|千葉県|東京都(?!外)|大阪府/.test(t)&&!explicit.some(x=>TARGET.includes(x))&&!foundCities.length){quality='noise';notes.push('対象県外の所在地');}
 // Business classification: don't label tyre/car buying as luxury-goods pawn/buying stores.
 if(a.industry==='買取専門店'&&/(?:タイヤ|ホイール|中古車|自動車|車両|トラック|バイク|廃車).{0,10}(?:買取|買い取り)|(?:買取|買い取り).{0,10}(?:タイヤ|ホイール|中古車|自動車|車両|トラック|バイク)/.test(t)){
  quality='noise';notes.push('自動車・タイヤ等の専門買取（ブランド品買取店ではない）');
 }
 if(a.industry==='ピラティス'&&/(フィットネスジム|24時間(?:営業)?(?:フィットネス)?ジム|スポーツクラブ)/.test(t)&&/(備えた|併設|ジム)/.test(t)){
  a.industry='フィットネスジム';notes.push('主業態はフィットネスジムとして補正');
 }
 if(a.industry==='アイラッシュサロン'&&/(眉毛専門店|アイブロウ専門店|アイブロウサロン)/.test(t)&&!/(まつげ|まつ毛|アイラッシュ|ラッシュリフト)/.test(t)){
  downgrade();notes.push('眉毛専門店：まつ毛サロンとは業態が異なる');
 }
 const detected=detectOpeningDate(t,a.publishedAt);
 if(detected?.ambiguous){downgrade();notes.push('複数の開業候補月があり確認が必要');}
 else if(detected?.monthKey){
  a.openingMonthResolved=detected.monthKey;
  if(a.month!==detected.monthKey){a.month=detected.monthKey;notes.push('開業表現の近くの日付から対象月を補正');}
  if(detected.day)a.openingDateText=`${detected.year}年${detected.month}月${detected.day}日`;
  else a.openingDateText=`${detected.year}年${detected.month}月（日付未確認）`;
 }else{downgrade();notes.push('記事見出しだけでは開業月を確定できない');}
 // Most aggregated opening stories must be split into branches before calling them 1 store.
 if(/(?:\d+店舗を(?:新規)?オープン|\d+店舗が(?:新規)?オープン|複数店舗を(?:一斉)?オープン)/.test(t)){
  downgrade();notes.push('複数店舗の一括発表：1記事＝1店舗ではない');
 }
 if(notes.length){warnings.unshift(...notes);a.auditNotes=notes;}
 a.quality=quality;a.warnings=[...new Set(warnings)].slice(0,12);
 return a;
}
export {detectOpeningDate,explicitRegions};
