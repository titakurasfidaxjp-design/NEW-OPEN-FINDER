// v5.9 — complementary Google News RSS queries for small-business and FC discovery.
// Search route is a lead-research signal, NEVER verification of shop ownership.
import {PROFILES} from '../functions/search-openings.mjs';
// Shared region vocabulary; re-exported by daily-core for existing callers.
export const TARGET_REGIONS = ['愛知','岐阜','静岡','三重','滋賀','石川','福井','富山','長野'];
export const REGION_CITIES = {
  '愛知':['名古屋','豊橋','一宮','岡崎'], '岐阜':['岐阜市','大垣','高山','多治見'],
  '静岡':['静岡市','浜松','沼津','富士市'], '三重':['四日市','津市','鈴鹿','松阪'],
  '滋賀':['大津','草津','彦根','長浜'], '石川':['金沢','小松','白山','野々市'],
  '福井':['福井市','鯖江','敦賀','坂井'], '富山':['富山市','高岡','射水','魚津'],
  '長野':['長野市','松本','上田','佐久']
};

const INDIE = new Set([
  'ピラティス','パーソナルジム','整体院','接骨院','鍼灸院','エステサロン','美容室',
  'ネイルサロン','アイラッシュサロン','トリミングサロン','カーコーティング',
  'ドライヘッドスパ','ペットホテル','カフェ・喫茶店','ベーカリー',
  'ラーメン店','焼肉店','インドアゴルフ','歯科医院','動物病院'
]);
const FRANCHISE = new Set(['買取専門店','ハウスクリーニング','個別指導塾','スマホ修理店']);
export const EXTRA_INDUSTRIES=[...FRANCHISE,...INDIE];
const FC_SEARCH={
  '買取専門店':['買取わかば','いくらや','銀座屋','売るナビ','キングラム','さすがや','リユースショップ'],
  'ハウスクリーニング':['おそうじ本舗','おそうじ革命','ハウスクリーニング'],
  '個別指導塾':['個別指導塾','学習塾','個別指導教室'],
  'スマホ修理店':['スマホ修理','iPhone修理','スマートフォン修理']
};
const INDIE_SEARCH={
  'カフェ・喫茶店':['喫茶店','コーヒースタンド','自家焙煎カフェ'],
  'ベーカリー':['パン屋','ブーランジェリー','ベーカリー'],
  '美容室':['美容室','ヘアサロン','美容院'],
  'ラーメン店':['ラーメン店','ラーメン屋','中華そば'],
  '整体院':['整体院','整体サロン','整体'],
  'パーソナルジム':['パーソナルジム','パーソナルトレーニング','プライベートジム']
};
const quoted=s=>'"'+String(s).replace(/["\\]/g,'')+'"';
export function discoveryPlan(industry,region,now=new Date()){
  if(!PROFILES[industry]||!TARGET_REGIONS.includes(region))return null;
  const fc=FRANCHISE.has(industry);
  if(!fc&&!INDIE.has(industry))return null;
  // Repeated 3-day cycle covers distinct wording while limiting requests per function.
  const localDay=Math.floor((now.getTime()+9*3600000)/86400000);
  const variant=localDay%3;
  const places=[region,...REGION_CITIES[region]].slice(0,5).map(quoted).join(' OR ');
  const terms=(fc?FC_SEARCH[industry]:INDIE_SEARCH[industry])||PROFILES[industry].search;
  const words=[...new Set(terms)].slice(0,fc?6:3).map(quoted).join(' OR ');
  const after=new Date(now.getTime()-105*86400000).toISOString().slice(0,10);
  let opening,route;
  if(fc){
    route='fc-additional';
    opening=variant===0?'("開店" OR "新規オープン" OR "オープン予定")':variant===1?'("加盟店" OR "フランチャイズ" OR "FC店") ("新店" OR "オープン" OR "開店")':'("新規出店" OR "店舗オープン" OR "開業")';
  }else{
    route='indie-additional';
    opening=variant===0?'("開店" OR "プレオープン" OR "オープン予定")':variant===1?'("新しくオープン" OR "新規開店" OR "開店しました")':'("独立開業" OR "新規開業" OR "新しく開業" OR "開業予定")';
  }
  const query=`(${words}) (${places}) ${opening} after:${after} -加盟者募集 -FC募集 -フランチャイズ募集 -開業セミナー`;
  return {industry,region,route,variant,query};
}
