// OPEN LEAD FINDER v5.1, 静岡, group 3/4, 06:24 JST.
import {scanShard} from '../lib/daily-core.mjs';
export default async function() {
  const {getStore}=await import('@netlify/blobs');
  const result=await scanShard('静岡',2,{getStore});
  console.log('[daily-scan]',JSON.stringify(result));
}
export const config={schedule:'24 21 * * *'};
