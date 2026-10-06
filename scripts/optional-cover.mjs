import {abi} from 'genlayer-js';
import {RPC,guard,view} from './network.mjs';
export function unknownCover(envelope){
  const receipt=envelope?.error?.data?.receipt;
  if(envelope?.error?.code!==-32000||receipt?.execution_result!=='ERROR'||typeof receipt.result!=='string'||receipt.result.length>256||!/^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(receipt.result))return false;
  const bytes=Buffer.from(receipt.result,'base64');
  return bytes[0]===1&&bytes.subarray(1).toString('utf8')==='unknown cover';
}
export async function optionalCover(client,address,id){
  const data=abi.transactions.serialize([abi.calldata.encode(abi.calldata.makeCalldataObject('get_cover',[id])),false]);
  const response=await fetch(RPC,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'gen_call',params:[{type:'read',to:address,from:'0x0000000000000000000000000000000000000000',data,transaction_hash_variant:'latest-final'}]}),signal:AbortSignal.timeout(30000)});
  const envelope=await response.json();guard(response.ok,'CANONICAL_COVER_TRANSPORT_FAILED');
  if(unknownCover(envelope))return null;
  guard(!envelope.error,'CANONICAL_COVER_READ_FAILED');
  return JSON.parse(String(await view(client,address,'get_cover',[id])));
}
