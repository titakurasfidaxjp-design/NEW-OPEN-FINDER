// OPEN LEAD FINDER v5.5: lava official site, Japan time 06:47.
import {scanOfficial} from '../lib/official-core.mjs';
export default async function(){const {getStore}=await import('@netlify/blobs');console.log('[official-scan]',JSON.stringify(await scanOfficial('lava',{getStore})));}
export const config={schedule:'47 21 * * *'};
