import {guard} from './network.mjs';
export function externalPriceCap(policy){
  guard(policy?.receiptGasPrice!==undefined,'PROTOCOL_PRICE_QUOTE_REQUIRED');
  const price=BigInt(policy.receiptGasPrice);
  guard(price>0n,'POSITIVE_PROTOCOL_PRICE_REQUIRED');
  return (price*12000n+9999n)/10000n;
}
