// OPEN LEAD FINDER v5.1, 岐阜, group 4/4, 06:23 JST.
import {scanShard} from '../lib/daily-core.mjs';
export default async function() {
  const {getStore}=await import('@netlify/blobs');
  const result=await scanShard('岐阜',3,{getStore});
  console.log('[daily-scan]',JSON.stringify(result));
}
export const config={schedule:'23 21 * * *'};
