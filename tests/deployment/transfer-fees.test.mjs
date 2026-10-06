import test from 'node:test';
import assert from 'node:assert/strict';
import {settledTransferFee} from '../../scripts/transfer-fees.mjs';
const recipient='0x'+'a'.repeat(40);
const fee={status:'settled',paid_fee_value:'100',total_refunded:'30',external_message_fee_settled:'5',external_message_fee_payouts:[{recipient,amount:'5'}]};
test('withdrawal balance equation accounts for refunds and separate recipient fee payout',()=>{
  assert.equal(settledTransferFee(fee,recipient).netCharged,65n);
});
test('pending fees cannot masquerade as settled proof',()=>assert.throws(()=>settledTransferFee({...fee,status:'pending'},recipient)));
test('negative or malformed amounts cannot enter fee evidence',()=>{
  for(const amount of ['-1','1.5','unknown'])assert.throws(()=>settledTransferFee({...fee,paid_fee_value:amount},recipient));
});
test('incomplete fee payouts and over-refunds fail deterministic reconciliation',()=>{
  assert.throws(()=>settledTransferFee({...fee,external_message_fee_settled:'6'},recipient));
  assert.throws(()=>settledTransferFee({...fee,total_refunded:'101'},recipient));
});
