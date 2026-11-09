// Daily OPEN LEAD FINDER, 長野 group 2/2 (JST 06:19).
import {scanShard} from '../lib/daily-core.mjs';
export default async function() {
  const {getStore}=await import('@netlify/blobs');
  const result=await scanShard('長野',1,{getStore});
  console.log('[daily-scan]',JSON.stringify(result));
}
export const config={schedule:'19 21 * * *'};
