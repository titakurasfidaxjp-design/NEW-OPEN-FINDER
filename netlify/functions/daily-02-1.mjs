// Daily OPEN LEAD FINDER, 岐阜 group 2/2 (JST 06:05).
import {scanShard} from '../lib/daily-core.mjs';
export default async function() {
  const {getStore}=await import('@netlify/blobs');
  const result=await scanShard('岐阜',1,{getStore});
  console.log('[daily-scan]',JSON.stringify(result));
}
export const config={schedule:'5 21 * * *'};
