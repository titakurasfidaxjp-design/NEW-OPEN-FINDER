// Daily official openings, 06:42 Japan time (21:42 UTC).
import {scanOfficial} from '../lib/official-core.mjs';
export default async function(){const {getStore}=await import('@netlify/blobs');console.log('[official-scan]',JSON.stringify(await scanOfficial('rintosull',{getStore})));}
export const config={schedule:'42 21 * * *'};
