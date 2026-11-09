// Daily OPEN LEAD FINDER, 静岡 group 1/2 (JST 06:06).
import {scanShard} from '../lib/daily-core.mjs';
export default async function() {
  const {getStore}=await import('@netlify/blobs');
  const result=await scanShard('静岡',0,{getStore});
  console.log('[daily-scan]',JSON.stringify(result));
}
export const config={schedule:'6 21 * * *'};
