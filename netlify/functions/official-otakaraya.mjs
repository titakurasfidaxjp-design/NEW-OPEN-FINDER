// OPEN LEAD FINDER v5.5: otakaraya official site, Japan time 06:44.
import {scanOfficial} from '../lib/official-core.mjs';
export default async function(){const {getStore}=await import('@netlify/blobs');console.log('[official-scan]',JSON.stringify(await scanOfficial('otakaraya',{getStore})));}
export const config={schedule:'44 21 * * *'};
