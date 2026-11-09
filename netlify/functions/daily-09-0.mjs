// Daily OPEN LEAD FINDER, 長野 group 1/2 (JST 06:18).
import {scanShard} from '../lib/daily-core.mjs';
export default async function() {
  const {getStore}=await import('@netlify/blobs');
  const result=await scanShard('長野',0,{getStore});
  console.log('[daily-scan]',JSON.stringify(result));
}
export const config={schedule:'18 21 * * *'};
