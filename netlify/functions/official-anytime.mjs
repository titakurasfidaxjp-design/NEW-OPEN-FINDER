// OPEN LEAD FINDER v5.5: anytime official site, Japan time 06:48.
import {scanOfficial} from '../lib/official-core.mjs';
export default async function(){const {getStore}=await import('@netlify/blobs');console.log('[official-scan]',JSON.stringify(await scanOfficial('anytime',{getStore})));}
export const config={schedule:'48 21 * * *'};
