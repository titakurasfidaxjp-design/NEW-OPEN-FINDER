// Official studio openings for Repilates. 06:51 JST daily.
import {scanOfficial} from '../lib/official-core.mjs';
export default async function(){const {getStore}=await import('@netlify/blobs');console.log('[official-scan]',JSON.stringify(await scanOfficial('repilates',{getStore})));}
export const config={schedule:'51 21 * * *'};
