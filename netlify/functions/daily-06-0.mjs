// Daily OPEN LEAD FINDER, 石川 group 1/2 (JST 06:12).
import {scanShard} from '../lib/daily-core.mjs';
export default async function() {
  const {getStore}=await import('@netlify/blobs');
  const result=await scanShard('石川',0,{getStore});
  console.log('[daily-scan]',JSON.stringify(result));
}
export const config={schedule:'12 21 * * *'};
