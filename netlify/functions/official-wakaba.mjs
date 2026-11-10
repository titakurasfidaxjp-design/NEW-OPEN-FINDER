// OPEN LEAD FINDER v5.5: wakaba official site, Japan time 06:45.
import {scanOfficial} from '../lib/official-core.mjs';
export default async function(){const {getStore}=await import('@netlify/blobs');console.log('[official-scan]',JSON.stringify(await scanOfficial('wakaba',{getStore})));}
export const config={schedule:'45 21 * * *'};
