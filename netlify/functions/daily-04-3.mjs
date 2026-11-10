// OPEN LEAD FINDER v5.1, 三重, group 4/4, 06:27 JST.
import {scanShard} from '../lib/daily-core.mjs';
export default async function() {
  const {getStore}=await import('@netlify/blobs');
  const result=await scanShard('三重',3,{getStore});
  console.log('[daily-scan]',JSON.stringify(result));
}
export const config={schedule:'27 21 * * *'};
