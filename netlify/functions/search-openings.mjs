import {mergeOpenings,outsideTarget} from '../lib/merge-openings.mjs';
import {refineOpening} from '../lib/refine-opening.mjs';
// OPEN LEAD FINDER v5.2 — 40 industries, cross-source syndication dedup.
// The output is candidate NEWS ARTICLES, never verified store openings.
const MAX_SCANS = 4, MAX_RESULTS = 400;

// Each category has an explicit retail-service match, a weaker contextual match,
// and signals which indicate a different business or a non-opening event.
const PROFILES = {
  '買取専門店': {
    strong: /買取(?:専門店|店)|買取大吉|おたからや|買取わかば|買取WAKABA|売るナビ|銀座屋|キングラム|さすがや|リサイクルマート|買取むすび|いくらや|ブランド(?:品)?買取(?:専門店|店)|貴金属買取(?:専門店|店)|金・プラチナ買取(?:専門店|店)/i,
    weak: /ブランド(?:品)?買取|貴金属(?:買取|査定)|金(?:・プラチナ)?買取|リユースショップ|買取(?:サービス|業)/i,
    wrong: /(?:中古車|新車|自動車|車両|廃車|事故車|バイク|トラック|カーセブン|ガリバー|車屋|カーショップ|ディーラー).{0,16}(?:買取|査定|販売|専門店)|(?:車|自動車|バイク|トラック)(?:の)?(?:買取|査定|販売)/i,
    search: ['買取専門店','買取大吉','おたからや','買取わかば']
  },
  'ピラティス': {
    strong: /(?:マシン)?ピラティス(?:スタジオ|専門店|教室)|pilates\s*(?:studio|スタジオ)|ピラティス/i,
    weak: /マシンピラティス|pilates/i,
    wrong: /(?:ピラティス|pilates).{0,16}(?:講座|レッスン動画|教材販売|資格取得|インストラクター養成|イベント開催|体験会のみ)/i,
    search: ['ピラティス','マシンピラティス','pilates']
  },
  'パーソナルジム': {
    strong: /パーソナル(?:トレーニング)?ジム|パーソナルトレーニング(?:スタジオ|専門店|ジム)|プライベートジム|マンツーマンジム/i,
    weak: /パーソナルトレーニング|パーソナルトレーナー/i,
    wrong: /(?:パーソナルトレーナー|パーソナルトレーニング).{0,16}(?:資格講座|養成講座|セミナー|講座開催)/i,
    search: ['パーソナルジム','パーソナルトレーニング','プライベートジム']
  },
  '整体院': {
    strong: /整体院|整体サロン|整体専門店|カイロプラクティック(?:院|サロン|センター)/i,
    weak: /整体|カイロプラクティック/i,
    wrong: /(?:整体|カイロプラクティック).{0,14}(?:オンライン講座|資格講座|セミナー|書籍発売)/i,
    search: ['整体院','整体サロン','カイロプラクティック']
  },
  '接骨院': {
    strong: /接骨院|整骨院|柔道整復(?:院|センター)/i,
    weak: /柔道整復|接骨|整骨/i,
    wrong: /(?:接骨|整骨|柔道整復).{0,12}(?:資格講座|試験対策|専門学校|セミナー)/i,
    search: ['接骨院','整骨院']
  },
  '鍼灸院': {
    strong: /鍼灸(?:院|サロン|専門院)|はり(?:・|と|きゅう)?きゅう(?:院|治療院)|鍼灸治療院/i,
    weak: /鍼灸|はりきゅう|針灸/i,
    wrong: /(?:鍼灸|はりきゅう).{0,14}(?:専門学校|資格試験|学会|セミナー|教育講座)/i,
    search: ['鍼灸院','鍼灸サロン','鍼灸治療院']
  },
  'エステサロン': {
    strong: /エステ(?:ティック)?サロン|痩身(?:専門店|サロン)|脱毛(?:専門店|サロン)|フェイシャル(?:専門店|サロン)/i,
    weak: /エステ|痩身|脱毛|フェイシャル/i,
    wrong: /(?:エステ|脱毛|痩身).{0,15}(?:新メニュー|コース開始|施術導入|美容機器発売|体験会のみ)/i,
    search: ['エステサロン','脱毛サロン','痩身サロン']
  },
  '美容室': {
    strong: /美容室|美容院|ヘアサロン|ヘアーサロン|hair\s*salon|美容所/i,
    weak: /美容師|ヘアスタイリスト|ヘアメイク/i,
    wrong: /(?:美容室|美容院|ヘアサロン).{0,16}(?:新メニュー|新商品|リニューアルのみ|髪型紹介|キャンペーン)/i,
    search: ['美容室','ヘアサロン','美容院']
  },
  'ネイルサロン': {
    strong: /ネイルサロン|ネイル専門店|nail\s*salon/i,
    weak: /ネイル(?:施術|ケア|サービス|ショップ)?/i,
    wrong: /(?:ネイル|nail).{0,16}(?:新商品|新色|チップ販売|資格試験|講座開催)/i,
    search: ['ネイルサロン','ネイル専門店']
  },
  'アイラッシュサロン': {
    strong: /アイラッシュサロン|まつ[毛げ]サロン|まつ[毛げ](?:エクステ|パーマ)(?:専門店|サロン)|眉毛(?:専門店|サロン)|アイブロウサロン|eyelash\s*salon/i,
    weak: /アイラッシュ|まつ[毛げ]|アイブロウ|眉毛/i,
    wrong: /(?:まつげ|まつ毛|眉毛|アイラッシュ).{0,16}(?:美容液発売|講座開催|新メニュー導入)/i,
    search: ['アイラッシュサロン','まつげサロン','眉毛サロン']
  },
  '個別指導塾': {
    strong: /個別指導(?:塾|学院|スクール|教室)|個別学習塾|個別指導/i,
    weak: /学習塾|進学塾|塾(?:の|が|を|に|で|、|\s|$)/i,
    wrong: /(?:塾|個別指導).{0,18}(?:春期講習|夏期講習|冬期講習|新講座|模試|教育セミナー|オンライン授業開始)/i,
    search: ['個別指導塾','個別指導','学習塾']
  },
  '英会話教室': {
    strong: /英会話(?:教室|スクール|学校|スタジオ)|英語(?:教室|スクール)|English\s*(?:school|conversation\s*school)/i,
    weak: /英会話|英語レッスン/i,
    wrong: /(?:英会話|英語).{0,16}(?:オンライン講座開始|教材販売|新講座|英検対策|無料セミナー)/i,
    search: ['英会話教室','英会話スクール','英語教室']
  },
  'そろばん教室': {
    strong: /そろばん(?:教室|スクール|塾)|珠算(?:教室|塾|スクール)/i,
    weak: /そろばん|珠算/i,
    wrong: /(?:そろばん|珠算).{0,14}(?:大会|検定|試験|教材|通信講座)/i,
    search: ['そろばん教室','珠算教室']
  },
  'トリミングサロン': {
    strong: /トリミング(?:サロン|専門店|ショップ|店)|ドッグサロン|ペット(?:美容室|サロン)|犬(?:の)?美容室/i,
    weak: /トリミング|ペット美容/i,
    wrong: /(?:トリミング|ペット美容).{0,16}(?:講座|資格|イベント|犬種別の方法|ハサミ発売)/i,
    search: ['トリミングサロン','ドッグサロン','ペット美容室']
  },
  'カーコーティング': {
    strong: /カーコーティング(?:専門店|店|ショップ)|コーティング(?:専門店|ショップ)|自動車(?:ボディ)?コーティング(?:店|専門店)|ガラスコーティング(?:専門店|店)/i,
    weak: /カーコーティング|車(?:の)?コーティング|自動車(?:ボディ)?コーティング/i,
    wrong: /(?:コーティング|車体).{0,16}(?:新商品発売|施工事例|技術発表|材料販売)/i,
    search: ['カーコーティング専門店','カーコーティング','コーティング専門店']
  },
  '中古車販売': {
    strong: /中古車(?:販売(?:店|専門店)|専門店|ショップ)|カーショップ|自動車販売店|(?:中古車|車)ディーラー|オート(?:プラザ|ガレージ)/i,
    weak: /中古車販売|中古車|自動車販売/i,
    wrong: /(?:中古車|自動車).{0,16}(?:相場|値上げ|ランキング|新車種発売|買取価格)/i,
    search: ['中古車販売店','中古車専門店','カーショップ']
  },
  'ハウスクリーニング': {
    strong: /ハウスクリーニング(?:専門店|店|サービス)|おそうじ本舗|おそうじ革命|エアコンクリーニング(?:専門店|店)|清掃(?:サービス|専門店)/i,
    weak: /ハウスクリーニング|エアコンクリーニング|おそうじ/i,
    wrong: /(?:クリーニング|掃除|おそうじ).{0,18}(?:方法|コツ|洗剤発売|ロボット発売|特集記事)/i,
    search: ['ハウスクリーニング','おそうじ本舗','おそうじ革命']
  },
  '外壁塗装': {
    strong: /外壁塗装(?:専門店|店|ショールーム)|塗装(?:専門店|ショールーム|会社|店)|屋根塗装(?:専門店|店)/i,
    weak: /外壁塗装|屋根塗装|住宅塗装/i,
    wrong: /(?:外壁塗装|屋根塗装).{0,18}(?:施工事例|料金比較|塗料発売|価格相場)/i,
    search: ['外壁塗装専門店','外壁塗装','塗装ショールーム']
  },
  'リフォーム': {
    strong: /リフォーム(?:専門店|店|ショールーム|ショップ|センター|会社)|リノベーション(?:専門店|ショールーム|ショップ)|住宅(?:リフォーム|改修)(?:専門店|ショールーム)/i,
    weak: /リフォーム|リノベーション|住宅改修/i,
    wrong: /(?:リフォーム|リノベーション).{0,16}(?:施工事例|完成見学会|工事完了|事例紹介|価格相場)/i,
    search: ['リフォーム専門店','リフォームショールーム','リノベーション専門店']
  },
  'ドライヘッドスパ': {
    strong: /ドライヘッドスパ(?:専門店|サロン|店)|ヘッドスパ(?:専門店|サロン)|ヘッドマッサージ(?:専門店|サロン)/i,
    weak: /ドライヘッドスパ|ヘッドスパ|ヘッドマッサージ/i,
    wrong: /(?:ヘッドスパ|ヘッドマッサージ).{0,18}(?:新メニュー導入|シャンプー発売|美容機器発売|講座開催)/i,
    search: ['ドライヘッドスパ専門店','ヘッドスパ専門店','ドライヘッドスパ']
  },
  'コインランドリー': {
    strong: /コインランドリー|セルフランドリー|無人ランドリー|ランドリー(?:店舗|専門店|ショップ)/i,
    weak: /ランドリー/i,
    wrong: /(?:ランドリー|洗濯).{0,17}(?:家電発売|洗剤発売|洗濯方法|機械展示会)/i,
    search: ['コインランドリー','セルフランドリー']
  },
  'ペットホテル': {
    strong: /ペットホテル|ドッグホテル|犬(?:の)?ホテル|ペット宿泊(?:施設|サービス)/i,
    weak: /ペット(?:預かり|宿泊)|犬(?:の)?預かり/i,
    wrong: /(?:ペットホテル|ドッグホテル).{0,18}(?:比較ランキング|旅行記事|旅行プラン紹介)/i,
    search: ['ペットホテル','ドッグホテル']
  },
  "カフェ・喫茶店": {
    strong: /カフェ(?:専門店|店舗|ショップ|喫茶店)?|喫茶店|コーヒースタンド|coffee\s*(?:shop|stand)|cafe(?:\s|$|[-・])/i,
    weak: /カフェ|喫茶|コーヒースタンド/i,
    wrong: /(?:カフェ|コーヒー).{0,18}(?:新商品|新作|豆販売|レシピ|フェス|イベント開催|ポップアップのみ)|カフェインレスの新商品/i,
    search: ["カフェ", "喫茶店", "コーヒースタンド"]
  },
  "ベーカリー": {
    strong: /ベーカリー(?:ショップ|店舗|専門店)?|パン屋|パン専門店|焼きたてパン(?:専門店|店)|製パン店|ブーランジェリー/i,
    weak: /ベーカリー|パン屋|製パン|ブーランジェリー/i,
    wrong: /(?:パン|ベーカリー).{0,17}(?:レシピ|料理教室|パン教室|新商品|新作|通販発売|製パン機|催事のみ)/i,
    search: ["ベーカリー", "パン屋", "ブーランジェリー"]
  },
  "ラーメン店": {
    strong: /ラーメン(?:専門店|店|屋)|中華そば(?:専門店|屋|店)|つけ麺(?:専門店|屋|店)/i,
    weak: /ラーメン|つけ麺|中華そば/i,
    wrong: /(?:ラーメン|つけ麺|中華そば).{0,17}(?:カップ|袋麺|インスタント|新商品|食べ比べ|ランキング|レシピ|フェス|催事のみ)/i,
    search: ["ラーメン店", "ラーメン専門店", "つけ麺専門店"]
  },
  "焼肉店": {
    strong: /焼肉(?:専門店|屋|店|レストラン)|ホルモン(?:焼き)?(?:専門店|屋|店)/i,
    weak: /焼肉|ホルモン焼き/i,
    wrong: /(?:焼肉|ホルモン).{0,17}(?:食べ放題フェア|新メニュー|新商品|レシピ|キャンペーン|通販発売)/i,
    search: ["焼肉店", "焼肉専門店", "ホルモン店"]
  },
  "テイクアウト専門店": {
    strong: /テイクアウト(?:専門店|店)|持ち帰り(?:専門店|店)|惣菜(?:専門店|店)|お弁当(?:専門店|店)|弁当(?:専門店|店)|デリ(?:カテッセン)?(?:専門店|店)/i,
    weak: /テイクアウト|持ち帰り|惣菜店|弁当店/i,
    wrong: /(?:テイクアウト|持ち帰り|弁当).{0,18}(?:対応開始|メニュー追加|レシピ|期間限定フェア|アプリ導入)/i,
    search: ["テイクアウト専門店", "惣菜専門店", "弁当専門店"]
  },
  "ヨガスタジオ": {
    strong: /ヨガ(?:スタジオ|専門店|スクール|教室)|ホットヨガ(?:スタジオ|専門店)|yoga\s*(?:studio|school)/i,
    weak: /ヨガ|ホットヨガ|yoga/i,
    wrong: /(?:ヨガ|yoga).{0,18}(?:マット|ウェア|資格講座|動画配信|イベントのみ|体験会のみ|養成講座)/i,
    search: ["ヨガスタジオ", "ホットヨガ", "ヨガ教室"]
  },
  "フィットネスジム": {
    strong: /24時間(?:フィットネス|ジム)|フィットネス(?:ジム|クラブ|スタジオ)|スポーツクラブ|総合型ジム|スポーツジム|無人ジム/i,
    weak: /フィットネス|スポーツジム|24時間ジム/i,
    wrong: /パーソナル(?:トレーニング)?ジム|ジム(?:用品|機器|ウェア)発売|スポーツクラブの大会|フィットネスアプリ/i,
    search: ["フィットネスジム", "24時間ジム", "スポーツクラブ"]
  },
  "インドアゴルフ": {
    strong: /インドアゴルフ(?:練習場|スクール|スタジオ|施設|店)?|シミュレーションゴルフ(?:施設|スタジオ|店)?|室内ゴルフ(?:練習場|施設|店)|ゴルフシミュレーター(?:スタジオ|施設)/i,
    weak: /インドアゴルフ|シミュレーションゴルフ|室内ゴルフ/i,
    wrong: /(?:ゴルフ|シミュレーター).{0,18}(?:新商品発売|機器発売|クラブ試打|ツアー|大会|レッスン動画|アプリ新機能)/i,
    search: ["インドアゴルフ", "シミュレーションゴルフ", "室内ゴルフ練習場"]
  },
  "歯科医院": {
    strong: /歯科(?:医院|クリニック|診療所)|デンタルクリニック|矯正歯科(?:医院|クリニック)|小児歯科(?:医院|クリニック)/i,
    weak: /歯科医院|歯科クリニック|デンタル/i,
    wrong: /歯科(?:学会|専門学校|医師会|教材|機器|商品|治療法|講演会)|デンタルケア(?:用品|商品)/i,
    search: ["歯科医院", "歯科クリニック", "デンタルクリニック"]
  },
  "動物病院": {
    strong: /動物病院|ペットクリニック|アニマルクリニック|獣医(?:科)?(?:医院|クリニック)/i,
    weak: /獣医|動物診療|動物医療/i,
    wrong: /(?:動物病院|獣医).{0,18}(?:学会|セミナー|資格試験|調査結果|採用サイト公開)|動物医療機器発売/i,
    search: ["動物病院", "ペットクリニック", "アニマルクリニック"]
  },
  "訪問看護ステーション": {
    strong: /訪問看護(?:ステーション|事業所|事業所等|センター)|在宅看護(?:ステーション|事業所)/i,
    weak: /訪問看護|在宅看護/i,
    wrong: /(?:訪問看護|在宅看護).{0,20}(?:制度改正|研修会|求人特集|助成金解説|新サービス紹介のみ)/i,
    search: ["訪問看護ステーション", "訪問看護事業所", "在宅看護"]
  },
  "放課後等デイサービス": {
    strong: /放課後等デイサービス|放課後デイサービス|放課後等デイ|放課後デイ(?!キャンプ)|放デイ/i,
    weak: /障害児通所|放課後の療育/i,
    wrong: /(?:放課後等?デイ|放デイ).{0,18}(?:制度解説|補助金解説|研修会|イベント開催のみ)/i,
    search: ["放課後等デイサービス", "放課後デイ", "放デイ"]
  },
  "児童発達支援": {
    strong: /児童発達支援(?:センター|事業所|施設)?|未就学児(?:の)?療育(?:施設|教室|センター)/i,
    weak: /児童発達支援|児童の療育/i,
    wrong: /(?:児童発達支援|療育).{0,18}(?:制度解説|研修会|資格講座|療育教材発売|利用方法解説)/i,
    search: ["児童発達支援", "児童発達支援事業所", "療育施設"]
  },
  "学童保育": {
    strong: /学童保育(?:所|施設|クラブ)?|民間学童(?:保育|クラブ)?|放課後児童クラブ|アフタースクール/i,
    weak: /学童保育|学童クラブ|放課後児童/i,
    wrong: /(?:学童|アフタースクール).{0,18}(?:制度解説|募集要項|説明会のみ|研究発表|利用料金比較)/i,
    search: ["学童保育", "民間学童", "学童クラブ"]
  },
  "プログラミング教室": {
    strong: /プログラミング(?:教室|スクール|塾)|子どもプログラミング(?:教室|スクール)|ロボットプログラミング(?:教室|スクール)/i,
    weak: /プログラミング学習|プログラミング/i,
    wrong: /(?:プログラミング|ロボット).{0,18}(?:教材発売|コンテスト|無料講座|オンライン講座開始|大会|アプリ新作)/i,
    search: ["プログラミング教室", "ロボットプログラミング教室", "子どもプログラミング"]
  },
  "パソコン教室": {
    strong: /パソコン(?:教室|スクール)|PC(?:教室|スクール)|コンピューター(?:教室|スクール)|デジタル(?:活用)?教室/i,
    weak: /パソコン教室|PCスクール|パソコン講座/i,
    wrong: /(?:パソコン|PC).{0,16}(?:製品発売|新機種|修理|販売|講座配信|オンライン授業開始)/i,
    search: ["パソコン教室", "PCスクール", "デジタル教室"]
  },
  "自動車整備工場": {
    strong: /自動車(?:整備工場|整備専門店|整備店|修理工場)|車(?:の)?整備(?:工場|専門店)|車検(?:専門店|工場)|カーメンテナンス(?:工場|専門店)/i,
    weak: /自動車整備|車検整備|車修理/i,
    wrong: /(?:自動車整備|車検|修理).{0,18}(?:制度改正|部品発売|技術講習|整備士試験|求人特集|料金比較)/i,
    search: ["自動車整備工場", "車検専門店", "車の整備工場"]
  },
  "スマホ修理店": {
    strong: /(?:スマホ|スマートフォン|iPhone|Android)(?:修理)(?:専門店|店|ショップ)|携帯修理(?:店|専門店)|スマホスピタル|アイサポ(?:店舗|店)?/i,
    weak: /スマホ修理|iPhone修理|スマートフォン修理/i,
    wrong: /(?:スマホ|iPhone|Android).{0,18}(?:修理方法|修理代比較|新機種発売|ケース発売|アプリ|機能紹介|新商品発売)/i,
    search: ["スマホ修理店", "iPhone修理店", "スマートフォン修理専門店"]
  }
};

const PREFECTURES=['北海道','青森','岩手','宮城','秋田','山形','福島','茨城','栃木','群馬','埼玉','千葉','東京','神奈川','新潟','富山','石川','福井','山梨','長野','岐阜','静岡','愛知','三重','滋賀','京都','大阪','兵庫','奈良','和歌山','鳥取','島根','岡山','広島','山口','徳島','香川','愛媛','高知','福岡','佐賀','長崎','熊本','大分','宮崎','鹿児島','沖縄'];
const CITIES={
'愛知':['名古屋','豊橋','一宮','岡崎','豊田市','安城','刈谷','春日井','小牧','半田','瀬戸','豊川','西尾','蒲郡','稲沢','大府','東海市','知多市','愛西','長久手','日進市','清須','北名古屋','尾張旭','常滑','知立','豊明','津島','碧南','江南','犬山','岩倉','高浜','田原','弥富','あま市','蟹江','幸田','豊山'],
'岐阜':['岐阜市','大垣','高山','多治見','関市','中津川','美濃加茂','各務原','可児','羽島','瑞穂','恵那','土岐','飛騨','本巣','郡上','下呂','海津'],
'三重':['四日市','津市','鈴鹿','松阪','桑名','伊勢','伊賀','名張','亀山','志摩','鳥羽','いなべ','尾鷲','熊野'],
'静岡':['静岡市','浜松','沼津','富士市','富士宮','三島','藤枝','焼津','磐田','掛川','袋井','御殿場','島田','伊東','熱海','湖西','裾野','菊川','牧之原','伊豆','御前崎'],
'石川':['金沢','小松','白山','野々市','加賀','七尾','羽咋','能美','輪島','珠洲','かほく'],
'富山':['富山市','高岡','射水','砺波','氷見','魚津','滑川','黒部','南砺','小矢部'],
'福井':['福井市','坂井','越前','鯖江','敦賀','大野','勝山','あわら','小浜'],
'滋賀':['大津','草津','彦根','長浜','守山','栗東','近江八幡','甲賀','野洲','湖南','東近江','高島','米原'],
'長野':['長野市','松本','上田','佐久','飯田','安曇野','諏訪','塩尻','伊那','千曲','岡谷','須坂','駒ヶ根'],
'新潟':['新潟市','長岡','上越','三条','新発田','燕市','柏崎','見附','十日町','魚沼','妙高','糸魚川'],
'山梨':['甲府','甲斐','南アルプス','笛吹','中央市','富士吉田','都留','山梨市','韮崎','北杜','大月']};
const OPEN_STRONG=/(新(?:規|たに)?(?:店舗|出店|開業|開店|開院|開校|開所|開設|教室|スタジオ|サロン|施設)|新店(?:舗)?(?:が|を|に|で|、|\s|オープン|OPEN)|グランドオープン|プレオープン|ニューオープン|(?:店舗|スタジオ|サロン|専門店|教室|校舎|院|営業所|ショールーム|店舗型施設).{0,22}(?:新(?:規)?(?:開設|開店|オープン)|オープン|OPEN|開院|開校|出店)|(?:開業|開院|開校|開店|出店|OPEN|オープン)(?:する|した|予定|を発表|へ|！|!|、|\s|$).{0,20}(?:店舗|教室|専門店|サロン|スタジオ|店|院|校)|(?:新規|新たに).{0,16}(?:オープン|OPEN|開院|開校|開所|開設|開店|出店)|(?:オープン|OPEN|開店|開業|開院|開校|開所|開設)予定)/i;
const OPEN_WEAK=/(オープン|OPEN|開業|開院|開校|開所|開設|開店|出店|新店舗|新教室|新スタジオ|新サロン|新拠点|新施設)/i;
const PLACE_SIGNAL=/(?:店|店舗|スタジオ|サロン|教室|スクール|整骨院|接骨院|整体院|鍼灸院|クリニック|ショップ|営業所|事業所|施設|ショールーム|校舎|支店|センター|ジム|ホテル|カフェ|ベーカリー|パン屋|インドアゴルフ|ゴルフ練習場|歯科医院|動物病院|訪問看護ステーション|放課後等デイサービス|児童発達支援|学童保育クラブ|学童クラブ|学童保育|整備工場|医院|病院|ステーション)(?:が|を|に|で|の|へ|、|「|『|\s|$)|新店舗|新教室|新スタジオ|新サロン|新規出店|開店|開院|開校/i;
const HARD_NOISE=/(?:加盟(?:希望者|オーナー|店)|FC|フランチャイズ).{0,12}(?:募集|説明会|セミナー|相談会|資料請求)|(?:オーナー|加盟店)募集|フランチャイズランキング|開業資金の目安|起業セミナー|開業の方法|(?:価格|相場|料金)ランキング|決算発表|株価|業績発表|市場分析|買収発表|新(?:商品|サービス|メニュー|コース|講座)(?:を)?(?:発売|追加|開始|導入|発表)|キャンペーン開催|期間限定(?:催事|イベント)|オープンキャンパス|オープンソース|オープンAI|オープン戦|オープンデータ/i;
const SOFT_NOISE=/(求人|オープニングスタッフ|従業員募集|スタッフ募集|体験会|説明会|キャンペーン|期間限定|リニューアル|移転オープン|開店記念|無料体験|内覧会|イベント開催)/i;
const headers={'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Cache-Control':'no-store'};
const respond=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
const normalize=s=>String(s??'').normalize('NFKC').replace(/\s+/g,' ').trim();
const escapeRegExp=s=>String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function xmlText(s=''){return String(s).replace(/^<!\[CDATA\[([\s\S]*?)\]\]>$/,'$1').replace(/&(#x[0-9a-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi,(all,x)=>{const t=x.toLowerCase(),m={amp:'&',quot:'"',apos:"'",lt:'<',gt:'>',nbsp:' '};if(m[t])return m[t];const n=t.startsWith('#x')?parseInt(t.slice(2),16):parseInt(t.slice(1),10);return Number.isFinite(n)&&n>0&&n<=0x10ffff?String.fromCodePoint(n):all})}
function field(xml,tag){const m=xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`,'i'));return m?xmlText(m[1].trim()).replace(/<[^>]+>/g,'').trim():''}
function parseRSS(xml){return [...String(xml).matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)].slice(0,80).map(([,z])=>({title:field(z,'title'),url:field(z,'link'),source:field(z,'source'),publishedAt:field(z,'pubDate')})).filter(x=>x.title&&/^https:\/\//.test(x.url))}
const validName=x=>typeof x==='string'&&x.trim().length>0&&x.trim().length<75&&!/[\x00-\x1f]/.test(x);
function validate(x){if(!x||!['industries','regions','months'].every(k=>Array.isArray(x[k])))return null;const industries=[...new Set(x.industries.filter(validName).map(t=>t.trim()))].slice(0,50),regions=[...new Set(x.regions.filter(validName).map(t=>t.trim()))].slice(0,12),months=[...new Set(x.months.filter(s=>typeof s==='string'&&/^20\d{2}-(0[1-9]|1[0-2])$/.test(s)))].slice(0,18);if(!industries.length||!regions.length||!months.length)return null;const offset=Number.isInteger(x.offset)&&x.offset>=0&&x.offset<=10000?x.offset:0;const mode=['general','preopen','fc'].includes(x.mode)?x.mode:'general';return {industries,regions,months,offset,mode}}
function term(industry,region,month,mode){const [y,m]=month.split('-').map(Number);const profile=PROFILES[industry];const terms=profile?.search||[industry];const cat=terms.slice(0,4).map(t=>'"'+t+'"').join(' OR ');const op=mode==='preopen'?'("オープン予定" OR "開業予定" OR "新店舗")':mode==='fc'?'("新店舗" OR "加盟店オープン" OR "新規出店")':'("新規オープン" OR "新店舗" OR "開業" OR "開校" OR "開院" OR "開設" OR "開所")';return `(${cat}) "${region}" ("${y}年${m}月" OR "${m}月") ${op} -加盟者募集 -開業セミナー -キャンペーン`}
function scanPlan(c){const all=[];for(const m of c.months)for(const i of c.industries)for(const r of c.regions)all.push({industry:i,region:r,month:m,mode:c.mode,query:term(i,r,m,c.mode)});return {scans:all.slice(c.offset,c.offset+MAX_SCANS),total:all.length,offset:c.offset,nextOffset:Math.min(all.length,c.offset+MAX_SCANS)}}
function normalizeTitle(title,source=''){let out=normalize(title);if(source){for(const sep of [' - ',' | ','｜'])if(out.endsWith(sep+source))out=out.slice(0,-(sep+source).length)}return out}
function industryEvidence(title,industry){const p=PROFILES[industry];if(!p){return {level:normalize(title).toLowerCase().includes(normalize(industry).toLowerCase())?'weak':'none',wrong:false,known:false}}
const wrong=!!(p.wrong?.test(title));return {level:p.strong.test(title)?'strong':p.weak?.test(title)?'weak':'none',wrong,known:true}}
function regionEvidence(title,region){if(title.includes(region))return {matched:true,kind:'prefecture'};if((CITIES[region]||[]).some(c=>title.includes(c)))return {matched:true,kind:'city'};return {matched:false,kind:'unknown'}}
function otherRegion(title,region,matched){if(matched)return false;const others=PREFECTURES.filter(r=>r!==region&&new RegExp(escapeRegExp(r)+'(?:都|道|府|県)').test(title));return others.length>0}
function monthEvidence(title,month){const [year,m]=month.split('-').map(Number);const explicit=[...title.matchAll(/(20\d{2})年\s*(1[0-2]|0?[1-9])月/g)].map(a=>[+a[1],+a[2]]);if(explicit.length){return explicit.some(([y,n])=>y===year&&n===m)?'match':'other'}const mons=[...title.matchAll(/(?:^|[^\d])(1[0-2]|0?[1-9])月/g)].map(a=>+a[1]);if(mons.length)return mons.includes(m)?'month-only':'other';return 'unknown'}
function publicationPlausible(publishedAt,month){const time=Date.parse(publishedAt||'');if(!Number.isFinite(time))return null;const [y,m]=month.split('-').map(Number);const earliest=Date.UTC(y,m-7,1);const latest=Date.UTC(y,m+3,1);return time>=earliest&&time<latest}
function monthOnlyRecent(publishedAt,month){const d=Date.parse(publishedAt||'');if(!Number.isFinite(d))return false;const [y,m]=month.split('-').map(Number),start=Date.UTC(y,m-1,1),end=Date.UTC(y,m,1);return d>=start-100*86400000&&d<end+45*86400000}
function extractDateCandidate(title){const m=title.match(/(?:20\d{2}年\s*)?(?:1[0-2]|0?[1-9])月\s*(?:3[01]|[12]\d|0?[1-9])日/);return m?m[0].replace(/\s+/g,''):''}
function classify(article){const title=normalizeTitle(article.title,article.source);const ie=industryEvidence(title,article.industry),re=regionEvidence(title,article.region),month=monthEvidence(title,article.month),plausible=publicationPlausible(article.publishedAt,article.month);const opening=OPEN_STRONG.test(title),openWeak=OPEN_WEAK.test(title),physical=PLACE_SIGNAL.test(title);const wrongRegion=otherRegion(title,article.region,re.matched),hard=HARD_NOISE.test(title),soft=SOFT_NOISE.test(title),industryNoise=ie.wrong;const reasons=[],warnings=[];
if(ie.level==='strong')reasons.push('業種を明示');else if(ie.level==='weak')reasons.push('業種に関連する語');else warnings.push('業種を確認できない');
if(opening)reasons.push('新店舗・開業の表現');else if(openWeak)warnings.push('開業の表現が曖昧');else warnings.push('開業を示す語がない');
if(physical)reasons.push('実店舗・施設の表現');else warnings.push('実店舗か未確認');
if(re.matched)reasons.push(re.kind==='city'?'対象地域の市名が一致':'対象都道府県が一致');else warnings.push('対象地域を見出しで未確認');
if(month==='match')reasons.push('対象年月が一致');else if(month==='month-only')warnings.push('対象月が一致（年未確認）');else if(month==='unknown')warnings.push('開業年月が見出しにない');else warnings.push('異なる年月の記載');
if(soft)warnings.push('求人・催事・移転等の可能性');if(hard)warnings.push('開業以外の告知の可能性');if(industryNoise)warnings.push('他業種の内容が優勢');if(wrongRegion)warnings.push('他県の情報の可能性');if(plausible===false&&month!=='match')warnings.push('記事公開日が対象月から離れている');
let score=(ie.level==='strong'?30:ie.level==='weak'?12:0)+(opening?25:openWeak?7:0)+(physical?10:0)+(re.matched?20:0)+(month==='match'?20:month==='month-only'?8:0)-(hard?65:0)-(industryNoise?60:0)-(wrongRegion?55:0)-(month==='other'?42:0)-(plausible===false&&month!=='match'?35:0)-(soft?8:0);
// Safely bias toward precision: HIGH means all major signals in the headline;
// REVIEW retains plausible matches with missing region/date evidence.
const strongMonth=month==='match'||(month==='month-only'&&monthOnlyRecent(article.publishedAt,article.month));let quality='noise';const plausibleArticle=ie.level!=='none'&&openWeak&&!industryNoise&&!hard&&!wrongRegion&&month!=='other'&&plausible!==false;
if(plausibleArticle&&ie.level==='strong'&&opening&&physical&&re.matched&&strongMonth&&!soft&&score>=90)quality='high';
else if(plausibleArticle&&((opening&&(re.matched||month==='match'||physical))||(ie.level==='strong'&&re.matched&&openWeak)))quality='review';
return {quality,score,reasons,warnings,signal:openWeak?'opening':'unconfirmed',monthEvidence:month,openingDateText:extractDateCandidate(title),evidenceLevel:ie.level}}
async function fetchRSS(scan,fetchFn=fetch){const url='https://news.google.com/rss/search?'+new URLSearchParams({q:scan.query,hl:'ja',gl:'JP',ceid:'JP:ja'}).toString();const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),6000);try{const res=await fetchFn(url,{signal:ctl.signal,headers:{Accept:'application/rss+xml, application/xml;q=0.9, text/xml;q=0.8','User-Agent':'Mozilla/5.0'}});if(!res.ok)throw new Error('News source status '+res.status);const xml=await res.text();if(!xml.includes('<rss')&&!xml.includes('<item'))throw new Error('Invalid RSS');return parseRSS(xml).map(a=>({...a,...scan,...classify({...a,...scan})}))}finally{clearTimeout(timer)}}
function articleId(title,source=''){const norm=normalizeTitle(title,source).normalize('NFKC').replace(/\s+/g,'').toLowerCase();let hash=2166136261;for(let i=0;i<norm.length;i++){hash^=norm.charCodeAt(i);hash=Math.imul(hash,16777619)}return (hash>>>0).toString(36)+'-'+norm.slice(0,30)}
function unique(out){const map=new Map(),order={high:2,review:1,noise:0};for(const a of out){const id=articleId(a.title,a.source),prev=map.get(id);if(prev&&(order[prev.quality]>order[a.quality]||(order[prev.quality]===order[a.quality]&&prev.score>=a.score)))continue;map.set(id,{...a,id})}return [...map.values()].slice(0,MAX_RESULTS).map(a=>{const t=Date.parse(a.publishedAt);return {id:a.id,title:a.title,url:a.url,source:a.source,publishedAt:Number.isFinite(t)?new Date(t).toISOString():'',industry:a.industry,region:a.region,month:a.month,mode:a.mode,signal:a.signal,quality:a.quality,score:a.score,reasons:a.reasons,warnings:a.warnings,monthEvidence:a.monthEvidence,openingDateText:a.openingDateText,evidenceLevel:a.evidenceLevel,query:a.query}}).sort((a,b)=>(order[b.quality]-order[a.quality])||(b.score-a.score)||Date.parse(b.publishedAt||0)-Date.parse(a.publishedAt||0))}
export default async function handler(request){if(request.method==='OPTIONS')return new Response(null,{status:204,headers});if(request.method==='GET'&&new URL(request.url).searchParams.get('health')==='1')return respond({ok:true,version:'v5.3',function:'search-openings',profileCount:Object.keys(PROFILES).length});if(request.method!=='POST')return respond({error:'POSTのみ対応しています。'},405);
let payload;try{const s=await request.text();if(s.length>15000)return respond({error:'検索条件が大きすぎます。'},413);payload=JSON.parse(s)}catch{return respond({error:'検索条件の形式が正しくありません。'},400)}const c=validate(payload);if(!c)return respond({error:'業種・地域・月を選択してください。'},400);const plan=scanPlan(c);if(!plan.scans.length)return respond({articles:[],meta:{searched:0,failed:0,totalCombos:plan.total,offset:plan.offset,nextOffset:plan.nextOffset,hasMore:false,rawHits:0}});
const out=[],errors=[];let cursor=0;async function worker(){while(cursor<plan.scans.length){const s=plan.scans[cursor++];try{out.push(...await fetchRSS(s))}catch(e){errors.push(String(e?.message||e))}}}await Promise.all(Array.from({length:Math.min(4,plan.scans.length)},()=>worker()));if(errors.length===plan.scans.length){console.warn('[OLF v4] RSS failure',errors.slice(0,3));return respond({error:'GoogleニュースRSSに接続できませんでした。深掘り検索のGoogle検索をお試しください。',diagnostic:{kind:'rss-unavailable',attempted:plan.scans.length,firstError:errors[0]?.slice(0,150)}},502)}const allArticles=unique(out).map(refineOpening).filter(a=>a.quality!=='noise'&&!outsideTarget(a));const articles=mergeOpenings(allArticles).articles;const qualityCounts={high:articles.filter(a=>a.quality==='high').length,review:articles.filter(a=>a.quality==='review').length,noise:articles.filter(a=>a.quality==='noise').length};return respond({articles,meta:{searched:plan.scans.length,failed:errors.length,totalCombos:plan.total,offset:plan.offset,nextOffset:plan.nextOffset,hasMore:plan.nextOffset<plan.total,rawHits:out.length,unique:articles.length,qualityCounts}})}
export {PROFILES,parseRSS,validate,scanPlan,unique,articleId,classify,term,monthEvidence,normalizeTitle,industryEvidence,regionEvidence,publicationPlausible};
