// Daily OPEN LEAD FINDER, 岐阜 group 1/2 (JST 06:04).
import {scanShard} from '../lib/daily-core.mjs';
export default async function() {
  const {getStore}=await import('@netlify/blobs');
  const result=await scanShard('岐阜',0,{getStore});
  console.log('[daily-scan]',JSON.stringify(result));
}
export const config={schedule:'4 21 * * *'};
