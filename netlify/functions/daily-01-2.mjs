// OPEN LEAD FINDER v5.1, 愛知, group 3/4, 06:20 JST.
import {scanShard} from '../lib/daily-core.mjs';
export default async function() {
  const {getStore}=await import('@netlify/blobs');
  const result=await scanShard('愛知',2,{getStore});
  console.log('[daily-scan]',JSON.stringify(result));
}
export const config={schedule:'20 21 * * *'};
