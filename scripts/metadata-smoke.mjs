// Negative exact-runtime probe. Unsigned simulation never deposits actual GEN.
import path from 'node:path';
import {abi} from 'genlayer-js';
import {EVIDENCE,DEPLOYMENT,RPC,CHAIN,GEN,context,sourceHash,guard,report,load,save,view} from './network.mjs';
import {nonpayableFailure} from './metadata-parser.mjs';
async function main(){
  const d=load(DEPLOYMENT);guard(d?.active&&d.sourceSha256===sourceHash(),'DEPLOYMENT_IDENTITY_REQUIRED');
  const {publicClient}=await context(false),id=`ec-${d.sourceCommit.slice(0,7)}-same`;
  const before=String(await view(publicClient,d.contractAddress,'get_cover',[id]));
  const cover=JSON.parse(before);guard(cover.status==='CLOSED','CLOSED_IDEMPOTENT_TARGET_REQUIRED');
  const quote=await publicClient.estimateTransactionFees();
  const data=abi.transactions.serialize([abi.calldata.encode(abi.calldata.makeCalldataObject('close_cover',[id])),false]);
  async function probe(value){
    const response=await fetch(RPC,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'sim_call',params:[{type:'write',from:cover.funder,to:d.contractAddress,data,value:'0x'+value.toString(16),sim_config:{genvm_datetime:new Date().toISOString()},fees:{distribution:quote.distribution,feeValue:quote.feeValue}}]},(_,value)=>typeof value==='bigint'?value.toString():value),signal:AbortSignal.timeout(30000)});
    const envelope=await response.json();guard(response.ok,'METADATA_PROBE_TRANSPORT_FAILED');
    return envelope.result??envelope.error?.data?.receipt;
  }
  const control=await probe(0n),receipt=await probe(GEN);
  const after=String(await view(publicClient,d.contractAddress,'get_cover',[id]));
  const rejected=control?.execution_result==='SUCCESS'&&nonpayableFailure(receipt)&&before===after;
  const proof={command:'node scripts/metadata-smoke.mjs',at:new Date().toISOString(),network:'Studio Dev',chainId:CHAIN,contractAddress:d.contractAddress,sourceSha256:sourceHash(),mode:'UNSIGNED_SIMULATION',method:'close_cover',zeroValueControl:control?.execution_result??'UNKNOWN',simulatedValue:'1 GEN',executionResult:receipt?.execution_result??'UNKNOWN',nonpayableValueRejected:rejected,canonicalCoverUnchanged:before===after,noKeysLoaded:true,noTransactionSubmitted:true,noGENSent:true};
  save(path.join(EVIDENCE,'metadata-smoke.json'),proof);console.log(JSON.stringify(proof));guard(rejected,'NONPAYABLE_VALUE_REJECTION_REQUIRED');
}
main().catch(report);
