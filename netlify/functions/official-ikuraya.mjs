// Official new-opening announcements for Ikuraya. 06:50 JST daily.
import {scanOfficial} from '../lib/official-core.mjs';
export default async function(){const {getStore}=await import('@netlify/blobs');console.log('[official-scan]',JSON.stringify(await scanOfficial('ikuraya',{getStore})));}
export const config={schedule:'50 21 * * *'};
