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

// v6.1: A LOCALITY-focused third lane to find smaller shops that news searches
// matching just prefecture/capital-city labels can miss. This is a candidate
// discovery route; matching a query is NOT proof of an independently owned shop.
// Municipality names are written with 市/町 where applicable to reduce ambiguity.
export const LOCAL_MUNICIPALITIES={
 '愛知':['名古屋市','豊橋市','岡崎市','一宮市','春日井市','豊田市','半田市','刈谷市','安城市','豊川市','瀬戸市','小牧市','稲沢市','江南市','大府市','知多市','日進市','長久手市'],
 '岐阜':['岐阜市','大垣市','高山市','多治見市','可児市','各務原市','関市','中津川市','美濃加茂市','羽島市','恵那市','土岐市','瑞穂市','本巣市','下呂市'],
 '静岡':['静岡市','浜松市','沼津市','富士市','焼津市','藤枝市','磐田市','掛川市','三島市','富士宮市','島田市','袋井市','御殿場市','湖西市','伊豆の国市'],
 '三重':['四日市市','津市','鈴鹿市','松阪市','桑名市','伊勢市','伊賀市','名張市','亀山市','志摩市','いなべ市','鳥羽市'],
 '滋賀':['大津市','草津市','彦根市','長浜市','守山市','栗東市','近江八幡市','東近江市','甲賀市','湖南市','野洲市','高島市','米原市'],
 '石川':['金沢市','小松市','白山市','野々市市','加賀市','七尾市','能美市','かほく市','羽咋市','輪島市','珠洲市'],
 '福井':['福井市','鯖江市','敦賀市','坂井市','越前市','大野市','あわら市','小浜市','勝山市'],
 '富山':['富山市','高岡市','射水市','魚津市','砺波市','南砺市','黒部市','滑川市','氷見市','小矢部市'],
 '長野':['長野市','松本市','上田市','佐久市','飯田市','安曇野市','塩尻市','伊那市','千曲市','茅野市','諏訪市','岡谷市','須坂市','駒ヶ根市','中野市']
};
const LOCAL_SEARCH={
 '買取専門店':['買取専門店','買取店','買取大吉','おたからや'],
 'カフェ・喫茶店':['カフェ','喫茶店','コーヒースタンド'],
 'ベーカリー':['パン屋','ベーカリー','パン工房'],
 '美容室':['美容室','美容院','ヘアサロン'],
 '整体院':['整体院','整体サロン'],
 'パーソナルジム':['パーソナルジム','パーソナルトレーニング'],
 'ネイルサロン':['ネイルサロン'],
 'アイラッシュサロン':['まつげサロン','眉毛サロン','アイラッシュサロン'],
 'ラーメン店':['ラーメン店','ラーメン屋','中華そば'],
 '焼肉店':['焼肉店','焼肉屋'],
 'トリミングサロン':['トリミングサロン','ドッグサロン'],
 'ドライヘッドスパ':['ドライヘッドスパ','ヘッドスパ専門店'],
 '鍼灸院':['鍼灸院','鍼灸サロン'],
 'エステサロン':['エステサロン','脱毛サロン'],
 'ピラティス':['ピラティススタジオ','マシンピラティス'],
 'インドアゴルフ':['インドアゴルフ','シミュレーションゴルフ'],
 'ハウスクリーニング':['ハウスクリーニング','おそうじ本舗','おそうじ革命'],
 '個別指導塾':['個別指導塾','学習塾'],
 'スマホ修理店':['スマホ修理店','iPhone修理店'],
 'ペットホテル':['ペットホテル','ドッグホテル'],
 '動物病院':['動物病院','ペットクリニック'],
 '歯科医院':['歯科医院','デンタルクリニック'],
 'テイクアウト専門店':['弁当専門店','テイクアウト専門店'],
 'カーコーティング':['カーコーティング','コーティング専門店']
};
export const LOCAL_INDUSTRIES=Object.keys(LOCAL_SEARCH);
// 24 priority industries * 9 prefectures / 2 alternating days = 108 searches/day.
// Within a six-day cycle each industry-prefecture pair gets 3 municipality cohorts.
export function localDiscoveryPlan(industry,region,now=new Date()){
 if(!Object.hasOwn(LOCAL_SEARCH,industry)||!Object.hasOwn(LOCAL_MUNICIPALITIES,region))return null;
 const localDay=Math.floor((now.getTime()+9*3600000)/86400000);
 const ri=TARGET_REGIONS.indexOf(region), ii=LOCAL_INDUSTRIES.indexOf(industry);
 if((localDay+ri+ii)%2!==0)return null;
 const cohort=Math.floor(localDay/2)%3;
 const cities=LOCAL_MUNICIPALITIES[region].filter((_,i)=>i%3===cohort);
 const types=LOCAL_SEARCH[industry].slice(0,3).map(quoted).join(' OR ');
 const localities=cities.map(quoted).join(' OR ');
 const after=new Date(now.getTime()-100*86400000).toISOString().slice(0,10);
 const opening='("新規オープン" OR "オープン予定" OR "開店" OR "開業" OR "新店" OR "新規出店")';
 const query=`(${types}) (${localities}) ${opening} after:${after} -加盟者募集 -FC募集 -オーナー募集 -開業セミナー`;
 return {industry,region,route:'local-additional',cohort,cities,query};
}
