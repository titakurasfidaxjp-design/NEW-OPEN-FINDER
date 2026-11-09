// Daily OPEN LEAD FINDER, 富山 group 1/2 (JST 06:16).
import {scanShard} from '../lib/daily-core.mjs';
export default async function() {
  const {getStore}=await import('@netlify/blobs');
  const result=await scanShard('富山',0,{getStore});
  console.log('[daily-scan]',JSON.stringify(result));
}
export const config={schedule:'16 21 * * *'};
