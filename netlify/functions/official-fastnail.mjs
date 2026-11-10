// OPEN LEAD FINDER v5.5: fastnail official site, Japan time 06:49.
import {scanOfficial} from '../lib/official-core.mjs';
export default async function(){const {getStore}=await import('@netlify/blobs');console.log('[official-scan]',JSON.stringify(await scanOfficial('fastnail',{getStore})));}
export const config={schedule:'49 21 * * *'};
