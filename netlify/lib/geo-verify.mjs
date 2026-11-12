// OPEN LEAD FINDER v6.0 — geographic location of the OPENING, not the search query.
// Headline-only evidence is NOT an address verification. Conservative by design.
export const GEO_TARGET=['愛知','岐阜','静岡','三重','滋賀','石川','福井','富山','長野'];
const PREFS='北海道 青森 岩手 宮城 秋田 山形 福島 茨城 栃木 群馬 埼玉 千葉 東京 神奈川 新潟 富山 石川 福井 山梨 長野 岐阜 静岡 愛知 三重 滋賀 京都 大阪 兵庫 奈良 和歌山 鳥取 島根 岡山 広島 山口 徳島 香川 愛媛 高知 福岡 佐賀 長崎 熊本 大分 宮崎 鹿児島 沖縄'.split(' ');
// Deliberately use unambiguous municipality names / named transit landmarks, not free-form fragments.
// The ambiguous names 高山, 小松, 草津, 大宮, 四谷, 石川 etc. must not by themselves assign a prefecture.
const TARGET_CITIES={
 愛知:'名古屋市 名古屋駅 名古屋港 名古屋 豊橋市 一宮市 岡崎市 豊田市 春日井市 瀬戸市 新瀬戸駅 半田市 西尾市 刈谷市 安城市 岩倉市 蒲郡市 豊川市 碧南市 大府市 東海市 知多市 日進市 長久手市 江南市 津島市 犬山市 稲沢市 尾張旭市 豊明市 常滑市 あま市 知立市 清須市 小牧市',
 岐阜:'岐阜市 大垣市 多治見市 可児市 高山市 各務原市 中津川市 恵那市 美濃加茂市 羽島市 瑞穂市 本巣市 郡上市 土岐市 下呂市 関市 飛騨市',
 静岡:'静岡市 浜松市 沼津市 富士市 富士宮市 藤枝市 焼津市 掛川市 磐田市 袋井市 御殿場市 三島市 伊東市 熱海市 湖西市 島田市 伊豆の国市 菊川市 裾野市',
 三重:'四日市市 津市 鈴鹿市 桑名市 松阪市 伊勢市 伊賀市 名張市 亀山市 志摩市 鳥羽市 いなべ市',
 滋賀:'大津市 草津市 彦根市 長浜市 守山市 栗東市 近江八幡市 甲賀市 東近江市 高島市 野洲市 湖南市 米原市',
 石川:'金沢市 金沢駅 小松市 野々市市 白山市 七尾市 輪島市 能美市 羽咋市 加賀市 かほく市 珠洲市',
 福井:'福井市 福井駅 鯖江市 敦賀市 坂井市 越前市 小浜市 大野市 勝山市 あわら市',
 富山:'富山市 富山駅 高岡市 射水市 砺波市 魚津市 氷見市 黒部市 滑川市 南砺市 小矢部市',
 長野:'長野市 長野駅 松本市 上田市 佐久市 安曇野市 諏訪市 飯田市 塩尻市 伊那市 千曲市 岡谷市 須坂市 駒ヶ根市 茅野市 中野市 飯島町 下諏訪町'
};
const OUT_CITIES={
 北海道:'札幌市 札幌駅 札幌 苫小牧市 函館市 旭川市 小樽市 帯広市 北見市 釧路市 千歳市',
 青森:'青森市 弘前市 八戸市', 岩手:'盛岡市 一関市', 宮城:'仙台市 仙台駅 仙台 石巻市 名取市',
 秋田:'秋田市',山形:'山形市 米沢市 酒田市',福島:'福島市 郡山市 いわき市 会津若松市',
 茨城:'水戸市 土浦市 つくば市 日立市 古河市 取手市 守谷市 ひたちなか市',
 栃木:'宇都宮市 宇都宮 足利市 小山市 栃木市 佐野市',群馬:'前橋市 高崎市 太田市 伊勢崎市 桐生市 草津町',
 埼玉:'さいたま市 川口市 東川口 北浦和 浦和駅 大宮駅 川越市 越谷市 所沢市 草加市 上尾市 春日部市 熊谷市',
 千葉:'千葉市 船橋市 松戸市 柏市 市川市 浦安市 茂原市 市原市 木更津市 成田市 幕張新都心 幕張駅',
 東京:'新宿区 渋谷区 千代田区 品川区 目黒区 江東区 墨田区 台東区 文京区 豊島区 世田谷区 板橋区 練馬区 足立区 江戸川区 中野区 杉並区 大田区 荒川区 葛飾区 調布市 町田市 八王子市 府中市 立川市 武蔵野市 国分寺市 四谷店 汐留 押上 スカイツリータウン ソラマチ 青物横丁 東京馬喰町 新板橋 布田駅 自由が丘駅 自由が丘ミューズ 銀座新橋店',
 神奈川:'横浜市 川崎市 相模原市 横須賀市 藤沢市 茅ヶ崎市 鎌倉市 平塚市 厚木市 小田原市 鴨居駅',
 新潟:'新潟市 長岡市 上越市 三条市 新発田市 柏崎市',山梨:'甲府市 甲斐市 富士吉田市',
 京都:'京都市 京阪丹波橋駅 丹波橋駅 京都大学医学部附属病院 宇治市 亀岡市 福知山市 舞鶴市',
 大阪:'大阪市 梅田EAST店 梅田駅 十三店 堺市 東大阪市 枚方市 豊中市 吹田市 高槻市 茨木市 岸和田市',
 兵庫:'神戸市 姫路市 西宮市 尼崎市 明石市 芦屋市 加古川市',奈良:'奈良市 生駒市 奈良・生駒 橿原市 橿原坊城 大和郡山市',
 和歌山:'和歌山市 田辺市',鳥取:'鳥取市 米子市',島根:'松江市 出雲市',岡山:'岡山市 倉敷市 津山市',
 広島:'広島市 福山市 尾道市 尾道三成 呉市 東広島市',山口:'下関市 山口市 宇部市',
 徳島:'徳島市',香川:'高松市 丸亀市',愛媛:'松山市 今治市',高知:'高知市',
 福岡:'福岡市 北九州市 久留米市',佐賀:'佐賀市',長崎:'長崎市 佐世保市',熊本:'熊本市',大分:'大分市 別府市',宮崎:'宮崎市',鹿児島:'鹿児島市',沖縄:'那覇市 浦添市 沖縄市'
};
const PLACE_MAP=new Map(Object.entries({...OUT_CITIES,...TARGET_CITIES}).map(([region,v])=>[region,v.split(' ').sort((a,b)=>b.length-a.length)]));
const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const clean=s=>String(s||'').normalize('NFKC').replace(/\s+/g,' ');
function hints(title){
 const t=clean(title),found=[];
 // Native prefecture names: suffix is crucial so a brand or family name cannot match.
 for(const r of PREFS){
  const suffix=r==='北海道'?'':r==='東京'?'都':(r==='大阪'||r==='京都')?'府':'県';
  const phrase=r+suffix;
  if(!t.includes(phrase))continue;
  const re=new RegExp(esc(phrase),'g');
  for(const m of t.matchAll(re)){
   const trailing=t.slice(m.index+phrase.length,m.index+phrase.length+4);
   if(r==='東京'&&trailing.startsWith('外'))continue;
   // A chain originating from a region is NOT an opening there.
   if(/^(?:発|出身|産|内の会社|の企業)/.test(trailing))continue;
   found.push({region:r,phrase,at:m.index,weight:4});
  }
 }
 for(const [r,places] of PLACE_MAP){
  for(const p of places){
   let from=0;
   while(from<t.length){const at=t.indexOf(p,from);if(at<0)break;from=at+p.length;
    // Reject origin/reference signals or unrelated generic mentions.
    const after=t.slice(from,from+7);
    if(/^(?:発祥|出身|から移住|から進出|が監修|の有名)/.test(after))continue;
    found.push({region:r,phrase:p,at,weight:2});
    // one occurrence per place is enough
    break;
   }
  }
 }
 // Never interpret a fragment of a longer place name as another municipality.
 return found.filter(h=>!found.some(o=>o!==h&&o.at<=h.at&&o.at+o.phrase.length>=h.at+h.phrase.length&&o.phrase.length>h.phrase.length));
}
function contextual(h,t){
 const after=t.slice(h.at+h.phrase.length,h.at+h.phrase.length+27);
 const before=t.slice(Math.max(0,h.at-15),h.at);
 let score=h.weight;
 if(/[【\[][^】\]]*$/.test(before))score+=3;
 if(/^(?:に|で|の|へ|周辺で|内に)/.test(after))score+=1;
 if(/(?:店|院|校|カフェ|サロン|ジム|オープン|開店|開院|開校|開業|開所)/.test(after))score+=2;
 if(/(?:オープン|開店|開院|開校|開業|開所|出店)/.test(t.slice(h.at, h.at+90)))score+=1;
 if(/(?:発祥|出身|由来|本社|監修|提供|生まれ|拠点を持つ)/.test(after.slice(0,10)))score-=4;
 return score;
}
export function assessOpeningGeo(item){
 if(item?.official)return {status:'matched',region:item.region,evidence:'公式新店情報の掲載地域',matches:[]};
 const title=clean(item.title),matches=hints(title);
 if(!matches.length)return {status:'unknown',region:null,evidence:'見出しから開業地を特定できません',matches:[]};
 // A bracketed dateline such as 【土浦市】 has priority over unrelated background mentions.
 const leading=title.match(/^[\s【\[]([^】\]]{1,28})[】\]]/);
 if(leading){const inside=matches.filter(m=>m.at>=leading.index&&m.at<leading[0].length);
  const regs=[...new Set(inside.map(x=>x.region))];
  if(regs.length===1)return result(regs[0],inside,'見出し先頭の地域表記');
 }
 const weighted=matches.map(h=>({...h,score:contextual(h,title)}));
 const byReg=new Map();for(const h of weighted)byReg.set(h.region,Math.max(h.score,byReg.get(h.region)||0));
 const top=[...byReg.entries()].sort((a,b)=>b[1]-a[1]);
 if(top.length===1)return result(top[0][0],weighted,'記事見出しの所在地表記');
 // With competing locations, do not invent a branch. Require a decisive proximity advantage.
 if(top[0][1]>=top[1][1]+4&&top[0][1]>=6)return result(top[0][0],weighted,'店舗付近の所在地表記（他地域の記載もあり）');
 return {status:'conflict',region:null,evidence:`複数地域の記載：${top.slice(0,4).map(([r])=>r).join('・')}`,matches:weighted};
}
function result(region,matches,evidence){return {status:GEO_TARGET.includes(region)?'matched':'outside',region,evidence,matches};}
