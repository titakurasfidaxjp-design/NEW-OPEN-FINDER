// OPEN LEAD FINDER v3.2 — opening-news candidate discovery.
// Scores headline-level signals only. An article is never proof of a real opening.
const MAX_SCANS=4, MAX_RESULTS=400;
const HEADLINE=/(新規|新店|新店舗|オープン|OPEN|開業|開店|開校|開院|出店|開設|プレオープン|グランドオープン)/i;
const OPEN_EVENT=/(新(?:規|たに)?(?:店舗|出店|開業|開店|開院|開校)|ニューオープン|グランドオープン|プレオープン|オープン予定|開業予定|開店予定|開院予定|新店舗オープン|店をオープン|店がオープン|店が開店|店を開店|新店オープン|新規オープン|OPEN(?:予定|ING)?)/i;
const OPEN_GENERIC=/(オープン|OPEN|開店|開業|開院|開校|出店|新店舗|新店)/i;
const STORE_SIGNAL=/(?:店|店舗|スタジオ|サロン|教室|スクール|院|ジム|ショップ|営業所|事業所|施設|校|センター)(?:が|を|に|で|の|へ|、|\s|$)|新店|新規出店|開店|開院|開校|新規開業|新店舗/i;
const NEGATIVE=/(?:FC|フランチャイズ|加盟(?:店|者|希望者|オーナー))\s*(?:の)?(?:募集|説明会|セミナー|相談会|個別相談)|(?:加盟者|オーナー|加盟店)募集|加盟店開発|独立支援セミナー|FCビジネス説明会|フランチャイズで開業する方法|開業資金の目安|フランチャイズランキング|(?:買取|売却)(?:価格|相場|実績)|価格改定|オンライン査定|キャンペーン開催|高価買取キャンペーン|期間限定(?:催事|イベント)|出張買取イベント|査定会|店舗数ランキング|業績発表|決算発表|株価|市場分析/i;
// Car dealerships and vehicle-buying businesses are not the intended "買取専門店" category.
// Apply only to valuables/reuse shops; do not change the 車販売 category.
const VEHICLE_ONLY=/(?:中古車|新車|自動車|車両|廃車|事故車|車買取|車の買取|車を買取|バイク買取|バイクの買取|トラック買取|自動車買取|車屋|カーディーラー|カーセブン|ガリバー|カーショップ|軽自動車|車販売|自動車販売|クルマ買取)/i;
const VEHICLE_CONTEXT=/(?:買取|査定|買い取り|売却|販売|ショップ|専門店|ディーラー)/i;
function wrongBusiness(title,industry){return industry==='買取専門店'&&VEHICLE_ONLY.test(title)&&VEHICLE_CONTEXT.test(title)}
const PREFECTURES=['北海道','青森','岩手','宮城','秋田','山形','福島','茨城','栃木','群馬','埼玉','千葉','東京','神奈川','新潟','富山','石川','福井','山梨','長野','岐阜','静岡','愛知','三重','滋賀','京都','大阪','兵庫','奈良','和歌山','鳥取','島根','岡山','広島','山口','徳島','香川','愛媛','高知','福岡','佐賀','長崎','熊本','大分','宮崎','鹿児島','沖縄'];
const CITIES={
'愛知':['名古屋','豊橋','一宮','岡崎','豊田市','安城','刈谷','春日井','小牧','半田','瀬戸','豊川','西尾','蒲郡','稲沢','大府','東海市','知多市','愛西','長久手','日進市','清須','北名古屋','尾張旭','常滑','知立','豊明','津島','碧南','江南','犬山','岩倉','高浜','田原','弥富','あま市','蟹江','幸田','豊山'],
'岐阜':['岐阜市','大垣','高山','多治見','関市','中津川','美濃加茂','各務原','可児','羽島','瑞穂','恵那','土岐','飛騨','本巣','郡上','下呂','海津'],
'三重':['四日市','津市','鈴鹿','松阪','桑名','伊勢','伊賀','名張','亀山','志摩','鳥羽','いなべ','尾鷲','熊野'],
'静岡':['静岡市','浜松','沼津','富士市','富士宮','三島','藤枝','焼津','磐田','掛川','袋井','御殿場','島田','伊東','熱海','湖西','裾野','菊川','牧之原','伊豆','御前崎'],
'石川':['金沢','小松','白山','野々市','加賀','七尾','羽咋','能美','輪島','珠洲','かほく'],
'富山':['富山市','高岡','射水','砺波','氷見','魚津','滑川','黒部','南砺','小矢部'],
'福井':['福井市','坂井','越前','鯖江','敦賀','大野','勝山','あわら','小浜'],
'長野':['長野市','松本','上田','佐久','飯田','安曇野','諏訪','塩尻','伊那','千曲','岡谷','須坂','駒ヶ根'],
'新潟':['新潟市','長岡','上越','三条','新発田','燕市','柏崎','見附','十日町','魚沼','妙高','糸魚川'],
'山梨':['甲府','甲斐','南アルプス','笛吹','中央市','富士吉田','都留','山梨市','韮崎','北杜','大月']};
const INDUSTRY_KEYWORDS={
'買取専門店':/(買取専門店|買取店|買取大吉|おたからや|買取わかば|買取WAKABA|売るナビ|銀座屋|キングラム|さすがや|リサイクルマート|いくらや|買取1丁目|買取壱番屋|ブランド買取|金買取|買取むすび|大吉\s*[^\s]{0,18}店)/i,
'ピラティス':/(ピラティス|pilates)/i,
'パーソナルジム':/(パーソナル(?:トレーニング|ジム)|プライベートジム)/i,
'整体院':/(整体|カイロプラクティック)/i,
'接骨院':/(接骨院|整骨院)/i,
'鍼灸院':/(鍼灸|はりきゅう)/i,
'エステサロン':/(エステ|痩身|脱毛サロン)/i,
'美容室':/(美容室|美容院|ヘアサロン|hair salon)/i,
'ネイルサロン':/(ネイルサロン|ネイル専門店)/i,
'アイラッシュサロン':/(アイラッシュ|まつ毛|まつげ|眉毛サロン)/i,
'個別指導塾':/(個別指導|学習塾|進学塾)/i,
'英会話教室':/(英会話|英語教室)/i,
'そろばん教室':/(そろばん|珠算教室)/i,
'トリミングサロン':/(トリミング|ドッグサロン|ペットサロン)/i,
'カーコーティング':/(カーコーティング|ガラスコーティング|車コーティング)/i,
'中古車販売':/(中古車|カーショップ|自動車販売店)/i,
'ハウスクリーニング':/(ハウスクリーニング|おそうじ本舗|おそうじ革命|エアコンクリーニング)/i,
'外壁塗装':/(外壁塗装|屋根塗装|塗装専門店)/i,
'リフォーム':/(リフォーム|住宅改修|リノベーション)/i,
'ドライヘッドスパ':/(ヘッドスパ|ヘッドマッサージ)/i,
'コインランドリー':/(コインランドリー|ランドリー)/i,
'ペットホテル':/(ペットホテル|ドッグホテル)/i
};
const headers={'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Cache-Control':'no-store'};
const respond=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
function xmlText(s=''){return s.replace(/^<!\[CDATA\[([\s\S]*?)\]\]>$/,'$1').replace(/&(#x[0-9a-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi,(all,x)=>{const t=x.toLowerCase(),m={amp:'&',quot:'"',apos:"'",lt:'<',gt:'>',nbsp:' '};if(m[t])return m[t];const n=t.startsWith('#x')?parseInt(t.slice(2),16):parseInt(t.slice(1),10);return Number.isFinite(n)&&n>0&&n<=0x10ffff?String.fromCodePoint(n):all;})}
function field(xml,tag){const m=xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`,'i'));return m?xmlText(m[1].trim()).replace(/<[^>]+>/g,'').trim():''}
function parseRSS(xml){return [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)].slice(0,80).map(([,z])=>({title:field(z,'title'),url:field(z,'link'),source:field(z,'source'),publishedAt:field(z,'pubDate')})).filter(x=>x.title&&/^https:\/\//.test(x.url))}
const validName=x=>typeof x==='string'&&x.trim().length>0&&x.trim().length<75&&!/[\x00-\x1f]/.test(x);
function validate(x){if(!x||!['industries','regions','months'].every(k=>Array.isArray(x[k])))return null;const industries=[...new Set(x.industries.filter(validName).map(t=>t.trim()))].slice(0,12),regions=[...new Set(x.regions.filter(validName).map(t=>t.trim()))].slice(0,12),months=[...new Set(x.months.filter(s=>typeof s==='string'&&/^20\d{2}-(0[1-9]|1[0-2])$/.test(s)))].slice(0,18);if(!industries.length||!regions.length||!months.length)return null;const offset=Number.isInteger(x.offset)&&x.offset>=0&&x.offset<=3000?x.offset:0;const mode=['general','preopen','fc'].includes(x.mode)?x.mode:'general';return {industries,regions,months,offset,mode}}
function term(i,r,m,mode){const [y,n]=m.split('-').map(Number);const industries=i==='買取専門店'?'(買取専門店 OR 買取大吉 OR おたからや OR 買取わかば OR いくらや)':`"${i}"`;
const openings=mode==='preopen'?'(オープン予定 OR 開店予定 OR 開業予定 OR 新店舗)':mode==='fc'?'(新店舗 OR 新規出店 OR オープン OR 開店)':'(新店舗 OR オープン OR 開店 OR 開業)';
const excluding='-加盟者募集 -加盟店募集 -FC募集 -買取相場 -買取実績 -キャンペーン'+(i==='買取専門店'?' -車買取 -中古車買取 -自動車買取 -自動車販売 -車販売 -中古車販売 -車屋':'');return `${industries} "${r}" ("${y}年${n}月" OR "${n}月") ${openings} ${excluding}`}
function scanPlan(c){const all=[];for(const m of c.months)for(const i of c.industries)for(const r of c.regions)all.push({industry:i,region:r,month:m,mode:c.mode,query:term(i,r,m,c.mode)});return {scans:all.slice(c.offset,c.offset+MAX_SCANS),total:all.length,offset:c.offset,nextOffset:Math.min(all.length,c.offset+MAX_SCANS)}}
function normalizeTitle(t,source=''){let out=String(t||'').normalize('NFKC').trim();if(source){for(const sep of [' - ',' | ','｜'])if(out.endsWith(sep+source))out=out.slice(0,-(sep+source).length)}return out}
function industryMatched(title,industry){if(wrongBusiness(title,industry))return false;const re=INDUSTRY_KEYWORDS[industry];return re?re.test(title):title.toLowerCase().includes(industry.toLowerCase())}
function regionMatched(title,region){if(title.includes(region))return true;return (CITIES[region]||[]).some(c=>title.includes(c))}
function explicitOtherRegion(title,region){const mentioned=PREFECTURES.filter(r=>title.includes(r+'県')||title.includes(r+'都')||title.includes(r+'府')||title.includes(r+'道'));return mentioned.length>0&&!mentioned.includes(region)}
function monthSignal(title,month){const [year,mon]=month.split('-').map(Number);const full=[...title.matchAll(/(20\d{2})年\s*(1[0-2]|0?[1-9])月/g)].map(m=>[+m[1],+m[2]]);if(full.length){if(full.some(([y,n])=>y===year&&n===mon))return 'match';if(full.some(([y,n])=>y===year&&n!==mon))return 'other';if(full.every(([y])=>y!==year))return 'other';}const simple=[...title.matchAll(/(?:^|[^\d])(1[0-2]|0?[1-9])月/g)].map(m=>+m[1]);if(simple.includes(mon))return 'month-only';if(simple.length)return 'other';return 'unknown'}
function classify(article){const title=normalizeTitle(article.title,article.source);const brand=article.industry==='買取専門店'&&/(買取大吉|おたからや|買取わかば|買取WAKABA|売るナビ|銀座屋|キングラム|さすがや|いくらや|買取むすび)/i.test(title);const opening=OPEN_EVENT.test(title)|| (OPEN_GENERIC.test(title)&&(STORE_SIGNAL.test(title)||brand));const store=STORE_SIGNAL.test(title);const industry=industryMatched(title,article.industry);const region=regionMatched(title,article.region);const wrongRegion=explicitOtherRegion(title,article.region);const m=monthSignal(title,article.month);const automotive=wrongBusiness(title,article.industry);const blocked=NEGATIVE.test(title)||automotive;const reasons=[];if(automotive)reasons.push('車買取・中古車販売等の別業種');if(opening)reasons.push('新規開業・開店の表現');if(industry)reasons.push('業種・ブランド一致');if(region)reasons.push('対象地域一致');if(m==='match')reasons.push('対象年月一致');else if(m==='month-only')reasons.push('対象月一致（年未確認）');if(store)reasons.push('店舗の記述');let score=(opening?30:0)+(industry?24:0)+(region?23:0)+(store?12:0)+(m==='match'?14:m==='month-only'?8:0);
if(wrongRegion)score-=70;if(m==='other')score-=45;if(blocked)score-=80;if(!opening)score-=30;if(!industry)score-=15;if(automotive)score-=70;
let quality='noise';if(opening&&industry&&region&&store&&!wrongRegion&&!blocked&&m!=='other'&&score>=80)quality='high';else if(opening&&industry&&!wrongRegion&&!blocked&&m!=='other')quality='review';else if(opening&&industry&&region&&!blocked&&m==='other')quality='review';
return {quality,score,reasons,signal:HEADLINE.test(title)?'opening':'review',monthEvidence:m}}
async function fetchRSS(scan,fetchFn=fetch){const url='https://news.google.com/rss/search?'+new URLSearchParams({q:scan.query,hl:'ja',gl:'JP',ceid:'JP:ja'}).toString();const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),5500);try{const res=await fetchFn(url,{signal:ctl.signal,headers:{'Accept':'application/rss+xml, application/xml;q=0.9, text/xml;q=0.8','User-Agent':'Mozilla/5.0'}});if(!res.ok)throw new Error('News source status '+res.status);const xml=await res.text();if(!xml.includes('<rss')&&!xml.includes('<item'))throw new Error('Invalid RSS');return parseRSS(xml).map(a=>({...a,...scan,...classify({...a,...scan})}))}finally{clearTimeout(timer)}}
function articleId(title,source=''){const norm=normalizeTitle(title,source).normalize('NFKC').replace(/\s+/g,'').toLowerCase();let hash=2166136261;for(let i=0;i<norm.length;i++){hash^=norm.charCodeAt(i);hash=Math.imul(hash,16777619)}return (hash>>>0).toString(36)+'-'+norm.slice(0,30)}
function unique(out){const ids=new Set(),result=[];for(const a of out){const id=articleId(a.title,a.source);if(ids.has(id))continue;ids.add(id);const t=Date.parse(a.publishedAt);result.push({id,title:a.title,url:a.url,source:a.source,publishedAt:Number.isFinite(t)?new Date(t).toISOString():'',industry:a.industry,region:a.region,month:a.month,mode:a.mode,signal:a.signal,quality:a.quality,score:a.score,reasons:a.reasons,monthEvidence:a.monthEvidence,query:a.query});if(result.length>=MAX_RESULTS)break}const level={high:0,review:1,noise:2};return result.sort((a,b)=>(level[a.quality]-level[b.quality])||(b.score-a.score)||Date.parse(b.publishedAt||0)-Date.parse(a.publishedAt||0))}
export default async function handler(request){if(request.method==='OPTIONS')return new Response(null,{status:204,headers});if(request.method==='GET'&&new URL(request.url).searchParams.get('health')==='1')return respond({ok:true,version:'v3.3',function:'search-openings'});if(request.method!=='POST')return respond({error:'POSTのみ対応しています。'},405);
let payload;try{const s=await request.text();if(s.length>15000)return respond({error:'検索条件が大きすぎます。'},413);payload=JSON.parse(s)}catch{return respond({error:'検索条件の形式が正しくありません。'},400)}const c=validate(payload);if(!c)return respond({error:'業種・地域・月を選択してください。'},400);const plan=scanPlan(c);if(!plan.scans.length)return respond({articles:[],meta:{searched:0,failed:0,totalCombos:plan.total,offset:plan.offset,nextOffset:plan.nextOffset,hasMore:false,rawHits:0}});const out=[],errors=[];let cursor=0;async function worker(){while(cursor<plan.scans.length){const s=plan.scans[cursor++];try{out.push(...await fetchRSS(s))}catch(e){errors.push(String(e?.message||e))}}}await Promise.all(Array.from({length:Math.min(4,plan.scans.length)},()=>worker()));if(errors.length===plan.scans.length){console.warn('[OLF] RSS failure',errors.slice(0,3));return respond({error:'GoogleニュースRSSに接続できませんでした。深掘り検索タブのGoogle検索をお試しください。',diagnostic:{kind:'rss-unavailable',attempted:plan.scans.length,firstError:errors[0]?.slice(0,150)}},502)}const articles=unique(out);const counts={high:articles.filter(a=>a.quality==='high').length,review:articles.filter(a=>a.quality==='review').length,noise:articles.filter(a=>a.quality==='noise').length};return respond({articles,meta:{searched:plan.scans.length,failed:errors.length,totalCombos:plan.total,offset:plan.offset,nextOffset:plan.nextOffset,hasMore:plan.nextOffset<plan.total,rawHits:out.length,unique:articles.length,qualityCounts:counts}})}
export {parseRSS,validate,scanPlan,unique,articleId,classify,term,monthSignal,normalizeTitle,wrongBusiness};
