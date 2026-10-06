import test from 'node:test';
import assert from 'node:assert/strict';
import {paceFetch} from '../../scripts/request-pacing.mjs';
const RPC='https://example.org/api';
test('parallel verification reads respect a rolling 30-per-minute quota without losing results',async()=>{
  let clock=0;const starts=[];
  const fetch=paceFetch(async(_url,options)=>{starts.push(clock);return options.id;},RPC,{now:()=>clock,wait:async ms=>{clock+=ms;}});
  const ids=Array.from({length:37},(_,id)=>id);
  const result=await Promise.all(ids.map(id=>fetch(RPC,{id})));
  assert.deepEqual(result,ids);
  for(const end of starts)assert.ok(starts.filter(start=>start<=end&&start>end-60000).length<=30);
});
test('a failed read consumes its quota slot, is not replayed, and does not block the next read',async()=>{
  let clock=0,calls=0;const starts=[];
  const fetch=paceFetch(async()=>{starts.push(clock);if(++calls===1)throw new Error('expected failure');return 'next';},RPC,{now:()=>clock,wait:async ms=>{clock+=ms;}});
  await assert.rejects(fetch(RPC),/expected failure/);
  assert.equal(await fetch(RPC),'next');assert.equal(calls,2);assert.ok(starts[1]-starts[0]>=2100);
});
