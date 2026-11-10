// OPEN LEAD FINDER v5.1, 長野, group 3/4, 06:36 JST.
import {scanShard} from '../lib/daily-core.mjs';
export default async function() {
  const {getStore}=await import('@netlify/blobs');
  const result=await scanShard('長野',2,{getStore});
  console.log('[daily-scan]',JSON.stringify(result));
}
export const config={schedule:'36 21 * * *'};
