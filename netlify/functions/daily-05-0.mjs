// Daily OPEN LEAD FINDER, 滋賀 group 1/2 (JST 06:10).
import {scanShard} from '../lib/daily-core.mjs';
export default async function() {
  const {getStore}=await import('@netlify/blobs');
  const result=await scanShard('滋賀',0,{getStore});
  console.log('[daily-scan]',JSON.stringify(result));
}
export const config={schedule:'10 21 * * *'};
