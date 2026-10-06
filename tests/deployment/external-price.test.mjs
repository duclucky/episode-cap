import test from 'node:test';
import assert from 'node:assert/strict';
import {externalPriceCap} from '../../scripts/external-price.mjs';
test('Studio outer gas price zero cannot erase the live protocol price cap',()=>{
  assert.equal(externalPriceCap({receiptGasPrice:250000000n,evmGasPrice:0n}),300000000n);
});
test('unknown or zero protocol prices cannot produce a withdrawal fee allocation',()=>{
  assert.throws(()=>externalPriceCap({receiptGasPrice:0n}));
  assert.throws(()=>externalPriceCap({}));
});
test('positive price headroom rounds up deterministically',()=>assert.equal(externalPriceCap({receiptGasPrice:3n}),4n));
