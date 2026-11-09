// Daily OPEN LEAD FINDER, 静岡 group 2/2 (JST 06:07).
import {scanShard} from '../lib/daily-core.mjs';
export default async function() {
  const {getStore}=await import('@netlify/blobs');
  const result=await scanShard('静岡',1,{getStore});
  console.log('[daily-scan]',JSON.stringify(result));
}
export const config={schedule:'7 21 * * *'};
