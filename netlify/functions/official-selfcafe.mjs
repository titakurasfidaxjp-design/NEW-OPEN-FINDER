// OPEN LEAD FINDER v5.5: selfcafe official site, Japan time 06:46.
import {scanOfficial} from '../lib/official-core.mjs';
export default async function(){const {getStore}=await import('@netlify/blobs');console.log('[official-scan]',JSON.stringify(await scanOfficial('selfcafe',{getStore})));}
export const config={schedule:'46 21 * * *'};
