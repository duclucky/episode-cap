import {guard,gen} from './network.mjs';
export function settledTransferFee(fee,recipient){
  guard(fee?.status==='settled'&&/^0x[0-9a-fA-F]{40}$/.test(recipient),'SETTLED_FEE_PROOF_REQUIRED');
  const nonnegative=value=>{guard(/^\d+$/.test(String(value)),'NONNEGATIVE_FEE_REQUIRED');return BigInt(value);};
  const paid=nonnegative(fee.paid_fee_value),refunded=nonnegative(fee.total_refunded);
  const payouts=fee.external_message_fee_payouts??[];guard(Array.isArray(payouts),'FEE_PAYOUT_LIST_REQUIRED');
  let total=0n,recipientPayout=0n;const safe=[];
  for(const item of payouts){
    guard(/^0x[0-9a-fA-F]{40}$/.test(item?.recipient),'FEE_PAYOUT_RECIPIENT_REQUIRED');
    const value=nonnegative(item.amount);total+=value;
    if(item.recipient.toLowerCase()===recipient.toLowerCase())recipientPayout+=value;
    safe.push({recipient:item.recipient,amount:gen(value)});
  }
  guard(total===nonnegative(fee.external_message_fee_settled??0),'EXTERNAL_FEE_COVERAGE_REQUIRED');
  const charged=paid-refunded,netCharged=charged-recipientPayout;
  guard(charged>=0n&&netCharged>=0n,'NONNEGATIVE_NET_FEE_REQUIRED');
  return {netCharged,proof:{status:'settled',paid:gen(paid),refunded:gen(refunded),charged:gen(charged),recipientFeePayout:gen(recipientPayout),netCharged:gen(netCharged),externalFeePayouts:safe}};
}
