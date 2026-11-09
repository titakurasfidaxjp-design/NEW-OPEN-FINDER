// Daily OPEN LEAD FINDER, 愛知 group 2/2 (JST 06:03).
import {scanShard} from '../lib/daily-core.mjs';
export default async function() {
  const {getStore}=await import('@netlify/blobs');
  const result=await scanShard('愛知',1,{getStore});
  console.log('[daily-scan]',JSON.stringify(result));
}
export const config={schedule:'3 21 * * *'};
