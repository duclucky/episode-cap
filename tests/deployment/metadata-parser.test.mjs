import test from 'node:test';
import assert from 'node:assert/strict';
import {nonpayableFailure} from '../../scripts/metadata-parser.mjs';
test('runtime diagnostic proves non-payability when return payload only gives a system error',()=>{
  assert.equal(nonpayableFailure({execution_result:'ERROR',result:Buffer.from('system error').toString('base64'),genvm_result:{error_description:'non-payable method received a nonzero value'}}),true);
});
test('success cannot be promoted to a negative proof by diagnostic words',()=>{
  assert.equal(nonpayableFailure({execution_result:'SUCCESS',genvm_result:{stderr:'non-payable'}}),false);
});
test('unrelated errors or untrusted stdout do not prove non-payability',()=>{
  assert.equal(nonpayableFailure({execution_result:'ERROR',genvm_result:{stdout:'non-payable',error_description:'timeout'}}),false);
  assert.equal(nonpayableFailure(null),false);
});
