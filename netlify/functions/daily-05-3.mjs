// OPEN LEAD FINDER v5.1, 滋賀, group 4/4, 06:29 JST.
import {scanShard} from '../lib/daily-core.mjs';
export default async function() {
  const {getStore}=await import('@netlify/blobs');
  const result=await scanShard('滋賀',3,{getStore});
  console.log('[daily-scan]',JSON.stringify(result));
}
export const config={schedule:'29 21 * * *'};
