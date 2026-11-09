// Daily OPEN LEAD FINDER, 滋賀 group 2/2 (JST 06:11).
import {scanShard} from '../lib/daily-core.mjs';
export default async function() {
  const {getStore}=await import('@netlify/blobs');
  const result=await scanShard('滋賀',1,{getStore});
  console.log('[daily-scan]',JSON.stringify(result));
}
export const config={schedule:'11 21 * * *'};
