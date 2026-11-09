// Daily OPEN LEAD FINDER, 愛知 group 1/2 (JST 06:02).
import {scanShard} from '../lib/daily-core.mjs';
export default async function() {
  const {getStore}=await import('@netlify/blobs');
  const result=await scanShard('愛知',0,{getStore});
  console.log('[daily-scan]',JSON.stringify(result));
}
export const config={schedule:'2 21 * * *'};
