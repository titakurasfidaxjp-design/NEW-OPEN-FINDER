// OPEN LEAD FINDER v5.1, 石川, group 4/4, 06:31 JST.
import {scanShard} from '../lib/daily-core.mjs';
export default async function() {
  const {getStore}=await import('@netlify/blobs');
  const result=await scanShard('石川',3,{getStore});
  console.log('[daily-scan]',JSON.stringify(result));
}
export const config={schedule:'31 21 * * *'};
