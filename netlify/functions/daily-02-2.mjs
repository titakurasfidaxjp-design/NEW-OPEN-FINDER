// OPEN LEAD FINDER v5.1, 岐阜, group 3/4, 06:22 JST.
import {scanShard} from '../lib/daily-core.mjs';
export default async function() {
  const {getStore}=await import('@netlify/blobs');
  const result=await scanShard('岐阜',2,{getStore});
  console.log('[daily-scan]',JSON.stringify(result));
}
export const config={schedule:'22 21 * * *'};
