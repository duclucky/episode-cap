import test from 'node:test';
import assert from 'node:assert/strict';
import {safeReceipt} from '../../scripts/receipts.mjs';
const hash='0x'+'a'.repeat(64), address='0x'+'b'.repeat(40);
test('raw Studio leader result, not FINALIZED alone, proves success',()=>{
  const result=safeReceipt({status:'FINALIZED',to:address,consensus_data:{leader_receipt:[{execution_result:'ERROR'},{execution_result:'SUCCESS'}]}},hash);
  assert.deepEqual(result,{transactionHash:hash,contractAddress:address,status:'FINALIZED',executionResult:'SUCCESS'});
});
test('SDK normalized result maps FINISHED_WITH_RETURN to SUCCESS',()=>{
  assert.equal(safeReceipt({statusName:'FINALIZED',contractAddress:address,txExecutionResultName:'FINISHED_WITH_RETURN'},hash).executionResult,'SUCCESS');
});
test('SDK error and unknown result cannot be promoted to SUCCESS',()=>{
  assert.equal(safeReceipt({statusName:'FINALIZED',txExecutionResultName:'FINISHED_WITH_ERROR'},hash).executionResult,'ERROR');
  assert.equal(safeReceipt({status:'FINALIZED'},hash).executionResult,'UNKNOWN');
});
test('private validator configuration never enters allowlisted evidence',()=>{
  const result=safeReceipt({status:'FINALIZED',node_config:{secret:'must not leak'},consensus_data:{leader_receipt:[{execution_result:'SUCCESS',private_key:'must not leak'}]}},hash);
  assert.ok(!JSON.stringify(result).includes('must not leak'));
  assert.equal(Object.keys(result).length,4);
});
test('malformed receipt and malformed identities are not accepted',()=>{
  assert.throws(()=>safeReceipt(null,hash));
  const result=safeReceipt({status:'FINALIZED',recipient:'not an address'},'bad hash');
  assert.equal(result.contractAddress,'');
  assert.equal(result.transactionHash,'');
});
