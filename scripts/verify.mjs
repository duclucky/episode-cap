// Read-only live acceptance checks; no account loading or signing.
import path from 'node:path';
import crypto from 'node:crypto';
import {safeReceipt} from './receipts.mjs';
import {settledTransferFee} from './transfer-fees.mjs';
import {EVIDENCE,DEPLOYMENT,CHAIN,context,sourceHash,gen,amount,addressArg,guard,report,load,save,view} from './network.mjs';
async function main(){
  const d=load(DEPLOYMENT),lifecycle=load(path.join(EVIDENCE,'lifecycle.json'));
  guard(d?.active&&d.chainId===CHAIN&&lifecycle?.chainId===CHAIN&&lifecycle.contractAddress===d.contractAddress,'COMPLETE_LIFECYCLE_IDENTITY_REQUIRED');
  const {publicClient}=await context(false),address=d.contractAddress;
  const deployedHash=crypto.createHash('sha256').update(await publicClient.getContractCode(address)).digest('hex');
  guard(deployedHash===sourceHash()&&deployedHash===d.sourceSha256,'EXACT_DEPLOYED_SOURCE_REQUIRED');
  guard(Object.keys((await publicClient.getContractSchema(address)).methods??{}).length===12,'SCHEMA_RECOGNITION_REQUIRED');
  const read=async(method,args=[])=>JSON.parse(String(await view(publicClient,address,method,args)));
  const accounting=await read('get_accounting'),nativeBalance=gen(await publicClient.getBalance({address}));
  guard(accounting.conserved&&accounting.received==='7 GEN'&&accounting.withdrawn==='7 GEN'&&accounting.locked==='0 GEN'&&accounting.credits==='0 GEN'&&nativeBalance==='0 GEN','GLOBAL_ZERO_NATIVE_LIABILITY_REQUIRED');
  const receipts=[],cases={},withdrawals=[];
  const deploy=safeReceipt(await publicClient.getTransaction({hash:d.deploy.transactionHash}),d.deploy.transactionHash);
  guard(deploy.status==='FINALIZED'&&deploy.executionResult==='SUCCESS','SUCCESSFUL_DEPLOYMENT_REQUIRED');receipts.push({step:'deploy',...deploy});
  for(const [name,item] of Object.entries(lifecycle.cases)){
    const cover=await read('get_cover',[item.id]);
    guard(cover.status==='CLOSED'&&cover.reserve==='0 GEN'&&cover.funder_credit==='0 GEN'&&cover.beneficiary_credit==='0 GEN'&&cover.withdrawn===cover.deposit,'CLOSED_COVER_ZERO_LIABILITY_REQUIRED');
    const events=await Promise.all(Object.keys(name==='separate'?{resolver:0,bgp:0}:{access:0,warp:0}).map(id=>read('get_event',[item.id,id])));
    const occurrences=await read('get_occurrences',[item.id]);
    const attempts=[];for(let index=1;index<=cover.attempts;index++)attempts.push(await read('get_attempt',[item.id,index]));
    if(name==='same')guard(occurrences.count===1&&attempts[0]?.relations['access:warp']==='SAME_CAUSE'&&item.afterReview.beneficiary_credit==='1 GEN'&&item.afterReview.funder_credit==='1 GEN','SAME_CAUSE_CREDIT_REQUIRED');
    if(name==='separate')guard(occurrences.count===2&&attempts[0]?.relations['resolver:bgp']==='SEPARATE_CAUSES'&&item.afterReview.beneficiary_credit==='2 GEN'&&item.afterReview.funder_credit==='0 GEN','SEPARATE_CAUSE_CREDIT_REQUIRED');
    if(name==='retry')guard(attempts.length===2&&attempts.every(x=>x.stage==='RETRYABLE')&&item.afterReview.reserve==='1 GEN'&&item.afterReview.beneficiary_credit==='0 GEN'&&item.afterExpiry.status==='REFUNDED','BOUNDED_NONPENALIZING_RETRY_REQUIRED');
    if(name==='digest')guard(attempts.length===1&&attempts[0].source_code==='DIGEST_MISMATCH'&&item.afterReview.reserve==='1 GEN'&&item.afterExpiry.status==='REFUNDED','SOURCE_VERSION_FAILURE_RECOVERY_REQUIRED');
    if(name==='expiry')guard(attempts.length===0&&item.afterExpiry.status==='REFUNDED','UNRATIFIED_EXPIRY_REQUIRED');
    for(const owner of Object.values(lifecycle.roles))guard(String(await view(publicClient,address,'get_credit',[item.id,addressArg(owner)]))==='0 GEN','NO_RESIDUAL_CREDIT_REQUIRED');
    cases[name]={cover,events,occurrences,attempts};
    for(const [role,proof] of Object.entries(item.withdrawals)){
      guard(proof.complete&&proof.creditAfter==='0 GEN','COMPLETE_WITHDRAWAL_PROOF_REQUIRED');
      const hash=proof.parentReceipt.transactionHash,tx=await publicClient.getTransaction({hash}),safe=safeReceipt(tx,hash);
      guard(safe.status==='FINALIZED'&&safe.executionResult==='SUCCESS','WITHDRAWAL_RECEIPT_REQUIRED');
      const fee=settledTransferFee(tx.data?.fee_accounting??tx.fee_accounting,proof.recipient);
      guard(amount(proof.recipientNetIncrease)+fee.netCharged===amount(proof.amount),'EXACT_RECIPIENT_FEE_EQUATION_REQUIRED');
      guard(amount(proof.nativeBefore)-amount(proof.nativeAfter)===amount(proof.amount)&&proof.nativeDecrease===proof.amount,'EXACT_NATIVE_DECREASE_REQUIRED');
      const message=tx.messages?.find(x=>String(x.recipient).toLowerCase()===proof.recipient.toLowerCase()&&BigInt(x.value)===amount(proof.amount));guard(message,'EXACT_TRANSFER_MESSAGE_REQUIRED');
      const childIds=await publicClient.getTriggeredTransactionIds({hash});guard(childIds.length===proof.childReceipts.length,'CHILD_PROOF_COVERAGE_REQUIRED');
      for(const child of proof.childReceipts){const receipt=safeReceipt(await publicClient.getTransaction({hash:child.transactionHash}),child.transactionHash);guard(receipt.status==='FINALIZED'&&receipt.executionResult==='SUCCESS','FINALIZED_CHILD_REQUIRED');}
      withdrawals.push({case:name,role,parentReceipt:safe,recipient:proof.recipient,amount:proof.amount,nativeBefore:proof.nativeBefore,nativeAfter:proof.nativeAfter,nativeDecrease:proof.nativeDecrease,recipientBefore:proof.recipientBefore,recipientAfter:proof.recipientAfter,recipientNetIncrease:proof.recipientNetIncrease,fee:fee.proof,equation:'recipient net increase + paid fee - total refunded - separate recipient external fee payout = transfer amount',message:{recipient:proof.recipient,value:gen(message.value)},childReceipts:proof.childReceipts,childBoundary:proof.childBoundary});
    }
  }
  for(const [step,stored] of Object.entries(lifecycle.transactions)){
    const tx=await publicClient.getTransaction({hash:stored.transactionHash}),safe=safeReceipt(tx,stored.transactionHash);
    guard(safe.status==='FINALIZED'&&safe.executionResult==='SUCCESS','ALL_RECEIPTS_SUCCESS_REQUIRED');
    const proof={step,...safe};
    if(stored.method==='review_cover'){
      const consensus={leaderOnly:tx.leader_only,initialValidators:Number(tx.num_of_initial_validators),result:tx.result_name};
      guard(consensus.leaderOnly===false&&consensus.initialValidators>=2&&consensus.result==='MAJORITY_AGREE','SEMANTIC_CONSENSUS_REQUIRED');proof.consensus=consensus;
    }
    receipts.push(proof);
  }
  const explorer=[];for(const url of [d.explorerUrl,d.deployTxUrl]){const response=await fetch(url);guard(response.ok,'EXPLORER_REACHABILITY_REQUIRED');explorer.push({url,httpStatus:response.status});}
  const proof={command:'node scripts/verify.mjs',at:new Date().toISOString(),mode:'READ_ONLY',network:'Studio Dev',chainId:CHAIN,contractAddress:address,sourceSha256:deployedHash,methodCount:12,cases,receipts,withdrawals,accounting,nativeBalance,explorer,evidenceIsSanitized:true};
  save(path.join(EVIDENCE,'reverification.json'),proof);
  console.log(JSON.stringify({stage:'STUDIO_DEV_VERIFY_PASS',address,cases:Object.keys(cases).length,receipts:receipts.length,withdrawals:withdrawals.length,accounting,nativeBalance,explorer}));
}
main().catch(report);
