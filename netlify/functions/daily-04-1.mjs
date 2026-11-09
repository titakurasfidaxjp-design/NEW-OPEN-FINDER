// Daily OPEN LEAD FINDER, 三重 group 2/2 (JST 06:09).
import {scanShard} from '../lib/daily-core.mjs';
export default async function() {
  const {getStore}=await import('@netlify/blobs');
  const result=await scanShard('三重',1,{getStore});
  console.log('[daily-scan]',JSON.stringify(result));
}
export const config={schedule:'9 21 * * *'};
