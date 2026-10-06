import path from 'node:path';
import {CALL_KEY_UNNAMED,MessageType,encodeExternalMessageFeeParams} from 'genlayer-js';
import {safeReceipt} from './receipts.mjs';
import {settledTransferFee} from './transfer-fees.mjs';
import {examples} from './examples.mjs';
import {optionalCover} from './optional-cover.mjs';
import {ROOT,EVIDENCE,DEPLOYMENT,CHAIN,GEN,context,sourceHash,gen,amount,guard,report,load,save,view,measuredFees,addressArg} from './network.mjs';
const STATE=path.join(ROOT,'local/lifecycle.json');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function main(){
  const d=load(DEPLOYMENT);guard(d?.active&&d.chainId===CHAIN&&d.sourceSha256===sourceHash(),'DEPLOYMENT_IDENTITY_REQUIRED');
  const {roles,clients,publicClient}=await context(true), address=d.contractAddress;
  const state=load(STATE,{contractAddress:address,cases:{},transactions:{}});
  guard(state.contractAddress===address,'LIFECYCLE_IDENTITY_MISMATCH');
  const persist=()=>save(STATE,state);
  const read=async(method,args=[])=>JSON.parse(String(await view(publicClient,address,method,args)));
  const credit=async(id,role)=>amount(String(await view(publicClient,address,'get_credit',[id,addressArg(roles[role].address)])));
  const maybeCover=id=>optionalCover(publicClient,address,id);
  async function waitApplied(pending){
    for(let index=0;index<25;index++){
      const cover=await read('get_cover',[pending.id]);
      const applied=pending.method==='create_cover'?!!cover:pending.method==='ratify_cover'?cover.status==='READY':pending.method==='review_cover'?cover.attempts>=pending.expectedAttempt:pending.method==='expire_cover'?cover.status==='REFUNDED':pending.method==='close_cover'?cover.status==='CLOSED':await credit(pending.id,pending.role)===0n;
      if(applied)return;await sleep(2000);
    }
    guard(false,'FINALIZED_CANONICAL_APPLICATION_NOT_OBSERVED');
  }
  async function finishPending(){
    if(!state.pending)return;
    const pending=state.pending;
    const receipt=await clients[pending.role].waitForTransactionReceipt({hash:pending.hash,waitUntil:'finalized',interval:3000,retries:180});
    const safe=safeReceipt(receipt,pending.hash);
    state.transactions[pending.key]={role:pending.role,method:pending.method,value:pending.value,feeDeposit:pending.feeDeposit,...safe};persist();
    console.log(JSON.stringify({stage:'FINALIZED_OR_RECOVERED',step:pending.key,...safe}));
    guard(safe.status==='FINALIZED'&&safe.executionResult==='SUCCESS','LIFECYCLE_EXECUTION_FAILED');
    await waitApplied(pending);state.pending=null;state.intent=null;persist();
  }
  await finishPending();guard(!state.intent,'UNHASHED_INTENT_REQUIRES_STATUS_RECOVERY');
  async function write(name,role,method,args,value=0n,expectedAttempt=0){
    const key=name+':'+method+(method==='withdraw_credit'?':'+role:method==='review_cover'?':'+expectedAttempt:'');
    guard(!state.transactions[key],'DUPLICATE_STEP_REFUSED');
    const client=clients[role];let allocations;
    if(method==='withdraw_credit'){
      const gasPrice=BigInt(await publicClient.request({method:'eth_gasPrice',params:[]}));
      guard(gasPrice>0n,'EXTERNAL_GAS_PRICE_REQUIRED');
      allocations=[{messageType:MessageType.External,recipient:roles[role].address,callKey:CALL_KEY_UNNAMED,budget:21000n*gasPrice,feeParams:encodeExternalMessageFeeParams({gasLimit:21000n,maxGasPrice:gasPrice})}];
    }
    const quote=await measuredFees(client,address,method,args,value,allocations);
    guard(await client.getBalance({address:roles[role].address})>=value+quote.feeValue,'ACTOR_BALANCE_BELOW_MEASURED_FEE');
    state.intent={key,role,method,id:args[0],expectedAttempt,value:gen(value),feeDeposit:gen(quote.feeValue),at:new Date().toISOString()};persist();
    const hash=await client.writeContract({address,functionName:method,args,value,fees:{distribution:quote.distribution,feeValue:quote.feeValue,...(quote.messageAllocations?.length?{messageAllocations:quote.messageAllocations}:{})}});
    state.pending={...state.intent,hash};persist();
    console.log(JSON.stringify({stage:'SUBMITTED',step:key,role,method,value:gen(value),feeDeposit:gen(quote.feeValue),transactionHash:hash}));
    await finishPending();
  }
  const retry=examples[0].events.map((event,index)=>({...event,event:index?'WARP device registrations failed.':'Cloudflare confirms an authenticated compensation transfer to this beneficiary in the June report.'}));
  const badDigest=examples[0].events.map(event=>({...event,source_digest:'0'.repeat(64)}));
  const cases=[
    {name:'same',events:examples[0].events,deposit:2n*GEN,count:1},
    {name:'separate',events:examples[1].events,deposit:2n*GEN,count:2},
    {name:'retry',events:retry,deposit:GEN,count:0},
    {name:'expiry',events:examples[0].events,deposit:GEN,count:0},
    {name:'digest',events:badDigest,deposit:GEN,count:0},
  ];
  for(const scenario of cases){
    const {name}=scenario;
    const item=state.cases[name]??={id:`ec-${d.sourceCommit.slice(0,7)}-${name}`,withdrawals:{},judgments:[]};persist();
    const id=item.id;let cover=await maybeCover(id);
    if(!cover){
      const now=Date.now(),duration=name==='expiry'?60000:scenario.count?7200000:240000;
      item.ratifyDeadline=new Date(now+(name==='expiry'?30000:scenario.count?3600000:120000)).toISOString();
      item.reviewDeadline=new Date(now+duration).toISOString();persist();
      await write(name,'funder','create_cover',[id,addressArg(roles.beneficiary.address),JSON.stringify(scenario.events),item.ratifyDeadline,item.reviewDeadline],scenario.deposit);
      cover=await read('get_cover',[id]);
    }
    if(name!=='expiry'&&cover.status==='RATIFYING'){
      await write(name,'beneficiary','ratify_cover',[id,cover.definition_digest]);cover=await read('get_cover',[id]);
    }
    const requestedAttempts=name==='retry'?2:name==='expiry'?0:1;
    while(['READY','RETRYABLE'].includes(cover.status)&&cover.attempts<requestedAttempts&&Date.now()/1000<cover.review_deadline){
      const next=cover.attempts+1;
      await write(name,'funder','review_cover',[id],0n,next);cover=await read('get_cover',[id]);
    }
    if(requestedAttempts&&cover.attempts&&!item.judgmentVerified){
      item.judgments=[];
      for(let index=1;index<=cover.attempts;index++)item.judgments.push(await read('get_attempt',[id,index]));
      item.afterReview=cover;item.occurrences=await read('get_occurrences',[id]);
      item.consensus=[];
      for(let index=1;index<=cover.attempts;index++){
        const stored=state.transactions[name+':review_cover:'+index];guard(stored,'REVIEW_RECEIPT_REQUIRED');
        const tx=await publicClient.getTransaction({hash:stored.transactionHash});
        const consensus={leaderOnly:tx.leader_only,initialValidators:Number(tx.num_of_initial_validators),result:tx.result_name};
        guard(consensus.leaderOnly===false&&consensus.initialValidators>=2&&consensus.result==='MAJORITY_AGREE','INDEPENDENT_CONSENSUS_NOT_PROVED');item.consensus.push(consensus);
      }
      persist();
      if(scenario.count){
        guard(cover.status==='SETTLED'&&cover.occurrence_count===scenario.count&&await credit(id,'beneficiary')===BigInt(scenario.count)*GEN&&await credit(id,'funder')===scenario.deposit-BigInt(scenario.count)*GEN,'CAUSAL_CREDIT_EXAMPLE_UNEXPECTED');
      }else{
        guard(cover.status==='RETRYABLE'&&cover.reserve===gen(scenario.deposit)&&cover.funder_credit==='0 GEN'&&cover.beneficiary_credit==='0 GEN','NONPENALIZING_EXAMPLE_UNEXPECTED');
        if(name==='digest')guard(item.judgments.every(x=>x.source_code==='DIGEST_MISMATCH'),'EXACT_SOURCE_VERSION_REJECTION_REQUIRED');
      }
      item.judgmentVerified=true;persist();console.log(JSON.stringify({stage:'JUDGMENT_PROVED',case:name,status:cover.status,occurrences:cover.occurrence_count,attempts:cover.attempts,consensus:item.consensus}));
    }
    if(['RATIFYING','READY','RETRYABLE'].includes(cover.status)){
      guard(!scenario.count,'UNEXPECTED_PENDING_SETTLEMENT');
      while(Date.now()/1000<cover.review_deadline+2){
        const seconds=Math.ceil(cover.review_deadline+2-Date.now()/1000);console.log(JSON.stringify({stage:'WAITING_FOR_EXPIRY',case:name,seconds}));await sleep(Math.min(15000,seconds*1000));
      }
      await write(name,'funder','expire_cover',[id]);cover=await read('get_cover',[id]);item.afterExpiry=cover;persist();
      guard(cover.status==='REFUNDED'&&await credit(id,'funder')===scenario.deposit,'EXPIRY_REFUND_REQUIRED');
    }
    for(const role of ['beneficiary','funder']){
      const due=await credit(id,role);
      if(due>0n){
        guard(!item.withdrawals[role]?.complete,'REPEATED_WITHDRAWAL_REFUSED');
        item.withdrawals[role]??={amount:gen(due),nativeBefore:gen(await publicClient.getBalance({address})),recipientBefore:gen(await publicClient.getBalance({address:roles[role].address})),recipient:roles[role].address};persist();
        await write(name,role,'withdraw_credit',[id]);
      }
      const proof=item.withdrawals[role];
      if(proof&&!proof.complete){
        const stored=state.transactions[name+':withdraw_credit:'+role];guard(stored,'WITHDRAWAL_RECEIPT_REQUIRED');
        let tx;for(let attempt=0;attempt<20;attempt++){
          tx=await publicClient.getTransaction({hash:stored.transactionHash});if((tx.data?.fee_accounting??tx.fee_accounting)?.status==='settled')break;await sleep(2000);
        }
        const reconciled=settledTransferFee(tx.data?.fee_accounting??tx.fee_accounting,proof.recipient);
        const nativeAfter=await publicClient.getBalance({address}),recipientAfter=await publicClient.getBalance({address:proof.recipient});
        const decrease=amount(proof.nativeBefore)-nativeAfter,netIncrease=recipientAfter-amount(proof.recipientBefore);
        guard(decrease===amount(proof.amount),'EXACT_NATIVE_DECREASE_REQUIRED');
        guard(netIncrease+reconciled.netCharged===amount(proof.amount),'EXACT_RECIPIENT_FEE_EQUATION_REQUIRED');
        const message=tx.messages?.find(x=>String(x.recipient).toLowerCase()===proof.recipient.toLowerCase()&&BigInt(x.value)===amount(proof.amount));guard(message,'EXACT_EXTERNAL_TRANSFER_MESSAGE_REQUIRED');
        const children=[];
        for(const hash of await publicClient.getTriggeredTransactionIds({hash:stored.transactionHash})){
          const receipt=await publicClient.waitForTransactionReceipt({hash,waitUntil:'finalized',interval:3000,retries:120});
          const safe=safeReceipt(receipt,hash);guard(safe.status==='FINALIZED'&&safe.executionResult==='SUCCESS','CHILD_TRANSFER_PROOF_REQUIRED');children.push(safe);
        }
        Object.assign(proof,{complete:true,nativeAfter:gen(nativeAfter),nativeDecrease:gen(decrease),recipientAfter:gen(recipientAfter),recipientNetIncrease:gen(netIncrease),fee:reconciled.proof,parentReceipt:stored,externalMessage:{recipient:proof.recipient,value:gen(message.value)},childReceipts:children,childBoundary:children.length?'Triggered transactions finalized':'External native transfer executed within finalized parent; no triggered child transaction reported',creditAfter:gen(await credit(id,role)),checkedAt:new Date().toISOString()});persist();
        console.log(JSON.stringify({stage:'WITHDRAWAL_PROVED',case:name,role,amount:proof.amount,nativeDecrease:proof.nativeDecrease,recipientNetIncrease:proof.recipientNetIncrease,netFee:proof.fee.netCharged}));
      }
    }
    cover=await read('get_cover',[id]);if(cover.status!=='CLOSED')await write(name,'funder','close_cover',[id]);
    item.finalCover=await read('get_cover',[id]);persist();
    guard(item.finalCover.status==='CLOSED'&&item.finalCover.reserve==='0 GEN'&&item.finalCover.funder_credit==='0 GEN'&&item.finalCover.beneficiary_credit==='0 GEN','CLOSED_ZERO_LIABILITY_REQUIRED');
  }
  const accounting=await read('get_accounting'),nativeBalance=gen(await publicClient.getBalance({address}));
  guard(['same','separate','retry','digest'].every(name=>state.cases[name].judgmentVerified),'ALL_REQUIRED_JUDGMENTS_REQUIRED');
  guard(accounting.conserved&&accounting.received==='7 GEN'&&accounting.withdrawn==='7 GEN'&&accounting.locked==='0 GEN'&&accounting.credits==='0 GEN'&&nativeBalance==='0 GEN','GLOBAL_ZERO_LIABILITY_REQUIRED');
  save(path.join(EVIDENCE,'lifecycle.json'),{command:'node scripts/lifecycle.mjs',checkedAt:new Date().toISOString(),network:'Studio Dev',chainId:CHAIN,contractAddress:address,sourceSha256:sourceHash(),roles:Object.fromEntries(Object.entries(roles).map(([role,account])=>[role,account.address])),cases:state.cases,transactions:state.transactions,accounting,nativeBalance,evidenceIsSanitized:true});
  console.log(JSON.stringify({stage:'LIFECYCLE_PASS',cases:5,accounting,nativeBalance}));
}
main().catch(report);
