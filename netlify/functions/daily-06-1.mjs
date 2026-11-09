// Daily OPEN LEAD FINDER, 石川 group 2/2 (JST 06:13).
import {scanShard} from '../lib/daily-core.mjs';
export default async function() {
  const {getStore}=await import('@netlify/blobs');
  const result=await scanShard('石川',1,{getStore});
  console.log('[daily-scan]',JSON.stringify(result));
}
export const config={schedule:'13 21 * * *'};
