// Daily OPEN LEAD FINDER, 三重 group 1/2 (JST 06:08).
import {scanShard} from '../lib/daily-core.mjs';
export default async function() {
  const {getStore}=await import('@netlify/blobs');
  const result=await scanShard('三重',0,{getStore});
  console.log('[daily-scan]',JSON.stringify(result));
}
export const config={schedule:'8 21 * * *'};
