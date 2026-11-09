// Daily OPEN LEAD FINDER, 福井 group 2/2 (JST 06:15).
import {scanShard} from '../lib/daily-core.mjs';
export default async function() {
  const {getStore}=await import('@netlify/blobs');
  const result=await scanShard('福井',1,{getStore});
  console.log('[daily-scan]',JSON.stringify(result));
}
export const config={schedule:'15 21 * * *'};
