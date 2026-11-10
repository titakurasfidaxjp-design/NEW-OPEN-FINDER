// Daily official openings, 06:43 Japan time (21:43 UTC).
import {scanOfficial} from '../lib/official-core.mjs';
export default async function(){const {getStore}=await import('@netlify/blobs');console.log('[official-scan]',JSON.stringify(await scanOfficial('daikichi',{getStore})));}
export const config={schedule:'43 21 * * *'};
