// OPEN LEAD FINDER v5.1, 滋賀, group 3/4, 06:28 JST.
import {scanShard} from '../lib/daily-core.mjs';
export default async function() {
  const {getStore}=await import('@netlify/blobs');
  const result=await scanShard('滋賀',2,{getStore});
  console.log('[daily-scan]',JSON.stringify(result));
}
export const config={schedule:'28 21 * * *'};
