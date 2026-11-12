/* OPEN LEAD FINDER v5.8 — FC-friendly lead classification.
 * This is NOT proof of a shop's legal operator, franchise contract or ad decision rights.
 * Keep all collected records; classification only controls client display / CSV.
 */
(function (root) {
  'use strict';
  const known = [
    // Large brands whose stores are generally poor first-call targets.  Store operation unverified.
    {name:'Rintosull', group:'chain', re:/rintosull/i},
    {name:'LAVA', group:'chain', re:/(?:ホットヨガ(?:スタジオ)?\s*)?LAVA\s*(?:[\p{Script=Han}\p{Script=Katakana}]|イオン|店|\b)/iu},
    {name:'Repilates', group:'chain', re:/repilates|リピラティス/i},
    {name:'FAST NAIL', group:'chain', re:/fast\s*nail|ファストネイル/i},
    {name:'THE CITY BAKERY', group:'chain', re:/the\s*city\s*bakery|シティベーカリー/i},
    {name:'513BAKERY', group:'chain', re:/513\s*bakery/i},
    {name:'BeeQuick', group:'chain', re:/bee\s*quick|ビークイック/i},
    {name:'パンとエスプレッソと', group:'chain', re:/パンとエスプレッソと/},
    {name:'R Baker', group:'chain', re:/\br\s*baker\b/i},
    {name:'匠 整体院', group:'chain', re:/匠\s*[^\n。]{0,24}整体院/},
    {name:'銀座ハリッチ系列', group:'chain', re:/銀座ハリッチ|ハリッチ系列|\bNEL\b/i},
    {name:'エニタイムフィットネス', group:'chain', re:/エニタイム(?:フィットネス)?|anytime\s*fitness/i},
    {name:'chocoZAP', group:'chain', re:/choco\s*zap|ちょこざっぷ|チョコザップ/i},
    {name:'カーブス', group:'chain', re:/カーブス/},
    {name:'スターバックス', group:'chain', re:/スターバックス|starbucks/i},
    {name:'コメダ珈琲', group:'chain', re:/コメダ(?:珈琲|コーヒー|珈琲店)/},
    {name:'ドトール', group:'chain', re:/ドトール/},
    {name:'タリーズ', group:'chain', re:/タリーズ(?:コーヒー)?/},
    {name:'乃が美', group:'chain', re:/乃が美/},
    {name:'銀座に志かわ', group:'chain', re:/銀座に志かわ/},
    {name:'シャトレーゼ', group:'chain', re:/シャトレーゼ/},
    {name:'焼肉きんぐ', group:'chain', re:/焼肉きんぐ/},
    {name:'丸源ラーメン', group:'chain', re:/丸源ラーメン/},
    // FC-capable / multi-store brands: do NOT infer whether this particular store is FC or direct.
    {name:'おたからや', group:'franchise', re:/おたからや/},
    {name:'買取大吉', group:'franchise', re:/買取大吉/},
    {name:'買取わかば', group:'franchise', re:/買取(?:店)?わかば/},
    {name:'いくらや', group:'franchise', re:/いくらや/},
    {name:'セルフカフェ', group:'franchise', re:/セルフカフェ/},
    {name:'ワンルーク', group:'franchise', re:/ワンルーク/},
    {name:'おそうじ本舗', group:'franchise', re:/おそうじ本舗/},
    {name:'おそうじ革命', group:'franchise', re:/おそうじ革命/},
    {name:'買取店WAKABA', group:'franchise', re:/\bwakaba\b/i},
    {name:'銀座屋', group:'franchise', re:/銀座屋/},
    {name:'キングラム', group:'franchise', re:/キングラム/},
    {name:'さすがや', group:'franchise', re:/さすがや/}
  ];
  const MANUAL_KEY='olf-v57-extra-excluded-brands';
  function getManualTerms() {try{const x=JSON.parse(localStorage.getItem(MANUAL_KEY)||'[]');return Array.isArray(x)?x.filter(t=>typeof t==='string'&&t.trim().length>=3).slice(0,50):[]}catch{return []}}
  function saveManualTerms(items){try{localStorage.setItem(MANUAL_KEY,JSON.stringify(items))}catch{}}
  function addManualTerm(term){const t=String(term||'').normalize('NFKC').trim().slice(0,50);if(t.length<3||t.length>50)return false;const xs=getManualTerms();if(xs.some(x=>x.toLowerCase()===t.toLowerCase()))return false;saveManualTerms([...xs,t].slice(0,50));return true}
  function removeManualTerm(term){saveManualTerms(getManualTerms().filter(x=>x!==term))}
  // Brand level is not a factual claim about the ownership of a particular branch.
  const fallback={group:'unknown',label:'運営形態を要確認',reason:'見出し等だけでは、個人経営・FC加盟・直営の別を判断できません。'};
  function fit(article, extraExclude=getManualTerms()) {
    const name=String(article?.storeName||'').normalize('NFKC');
    const title=String(article?.title||name).normalize('NFKC');
    const source=String(article?.source||'').normalize('NFKC');
    const combined=[name,title].join(' ／ ');
    // Local opt-out is independent of operator classification; never call it a direct store.
    const term=(Array.isArray(extraExclude)?extraExclude:[]).map(t=>String(t).normalize('NFKC').trim()).filter(t=>t.length>=3).find(t=>(combined+' ／ '+source).toLowerCase().includes(t.toLowerCase()));
    if(term)return {group:'manual',label:'手動除外',reason:`利用者が登録した除外キーワード「${term}」に一致しました。`};
    const brand=known.find(b=>b.re.test(name)||b.re.test(title)||(article?.official&&b.re.test(source)));
    // Explicit operator evidence takes precedence over inferred brand reputation.
    if(/(?:本部直営|直営店舗|直営店|直営として(?:出店|開業|オープン))/.test(combined)){
      return {group:'direct',label:'直営との記載あり',reason:'見出し・店舗名に「直営」の記載があります。運営会社を確認してから判断してください。',brand:brand?.name};
    }
    if(/(?:FC加盟店|FCオーナー|フランチャイズ加盟店|加盟店(?:として)?(?:開業|オープン)|フランチャイズ(?:として|で)開業)/i.test(combined)){
      return {group:'franchise',label:'FC加盟店との記載あり',reason:'見出し・店舗名にFC加盟の記載があります。広告・Web制作の決裁権は個別確認が必要です。',brand:brand?.name,confirmed:true};
    }
    if(brand?.group==='franchise'){
      return {group:'franchise',label:'FC展開ブランド（店舗形態未確認）',reason:`「${brand.name}」はFC展開ブランドとして登録されています。ただし、この店舗がFC加盟店か直営店かは未確認です。架電前に運営元を調査してください。`,brand:brand.name,confirmed:false};
    }
    if(brand?.group==='chain'){
      return {group:'chain',label:'大手・系列ブランド（運営形態未確認）',reason:`「${brand.name}」に一致。直営店との断定ではありません。初期画面では大手・系列候補として非表示にしています。`,brand:brand.name};
    }
    if(/(?:個人(?:で|が|経営)|夫婦(?:で|が)(?:開業|営む|経営)|独立(?:して)?開業|脱サラして開業|一人で(?:開業|始め)|地元(?:出身者|の夫婦)が開業)/.test(title)){
      return {group:'independent',label:'独立開業の記載あり',reason:'見出しに個人・独立開業の記載があります。運営実態や決裁権は別途確認してください。'};
    }
    if(/(?:全国\s*\d{2,4}\s*店舗|\d{2,4}\s*店舗目|全国(?:展開|に展開)|全国(?:\d{1,3}\s*都道府県)|\d{2,4}\s*号店|(?:系列|グループ)の(?:店舗|新店|新規)|(?:運営する|手掛ける)[^。]{0,12}(?:\d{2,4}店舗|チェーン))/i.test(title)){
      return {group:'chain',label:'多店舗展開の可能性（FC不明）',reason:'見出しに多店舗展開・系列の表現があります。FC加盟店の可能性もあるため、必要なら「全件表示」で確認してください。'};
    }
    return {...fallback};
  }
  function visible(item, mode, extraExclude=getManualTerms()) {
    const f=fit(item,extraExclude);
    if(mode==='all')return true;
    if(mode==='excluded')return ['direct','chain','manual'].includes(f.group);
    if(mode==='fc_priority')return f.group==='franchise';
    if(mode==='independent')return f.group==='independent';
    // lean is the default: FC candidates (both verified mentions and unverified brands) ARE kept.
    // with_fc is a backward-compatible alias for previous saved settings.
    return !['direct','chain','manual'].includes(f.group);
  }
  function salesRank(item){const f=fit(item);return f.group==='independent'?0:f.group==='franchise'?(f.confirmed?0:1):f.group==='unknown'?2:f.group==='chain'?3:4;}
  root.OLFSalesFit={fit,visible,salesRank,getManualTerms,addManualTerm,removeManualTerm};
})(globalThis);
