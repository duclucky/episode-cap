import test from 'node:test';
import assert from 'node:assert/strict';
import {unknownCover} from '../../scripts/optional-cover.mjs';
const failure=(message='unknown cover',code=-32000)=>({error:{code,data:{receipt:{execution_result:'ERROR',result:Buffer.concat([Buffer.from([1]),Buffer.from(message)]).toString('base64')}}}});
test('exact raw GenVM UserError identifies an absent cover',()=>assert.equal(unknownCover(failure()),true));
test('transport or unrelated execution errors must not imply absence',()=>{
  assert.equal(unknownCover(failure('unknown cover',-32603)),false);
  assert.equal(unknownCover(failure('global accounting invariant')),false);
  assert.equal(unknownCover({error:{code:-32000,message:'execution failed'}}),false);
});
test('similar error prose and malformed result cannot be accepted',()=>{
  assert.equal(unknownCover(failure('unknown cover policy')),false);
  const malformed=failure();malformed.error.data.receipt.result='invalid base64';assert.equal(unknownCover(malformed),false);
});
test('successful read and private configuration cannot change classification',()=>{
  const response=failure();response.error.data.receipt.execution_result='SUCCESS';assert.equal(unknownCover(response),false);
  const privateResponse=failure();privateResponse.error.data.receipt.node_config={private_key:'not printed'};
  assert.equal(unknownCover(privateResponse),true);
});
