// Proposed prompt repair evaluated in an unsigned constructor, before promotion.
import path from 'node:path';
import crypto from 'node:crypto';
import {abi} from 'genlayer-js';
import {examples} from './examples.mjs';
import {EVIDENCE,context,code,sourceHash,simulate,guard,report,save,simulationErrors} from './network.mjs';
export const FULL_EVENT_RULE = 'The event field is the FULL factual proposition being judged, not a display label. The excerpt is only a location anchor and may describe something different. SUPPORTED requires affirmative report support for EVERY material assertion in event, including product, event type, outcome and stated timing. A genuine excerpt never proves an unrelated event description. If any asserted fact is absent or contradicted, return UNVERIFIABLE. In particular, an outage excerpt cannot prove compensation, payment, customer loss, subscription, identity or another unreported action. First assess the complete event descriptions against the report. If either endpoint is UNVERIFIABLE, its pair relation must also be UNVERIFIABLE. ';
async function main(){
  await context(false);
  const v2=true;
  let proposed=code();
  const needle='"Each selected event must be affirmatively supported by its exact excerpt in report context: SUPPORTED or UNVERIFIABLE. "';
  if(!v2){
    guard(proposed.includes(needle),'BASELINE_PROMPT_NOT_FOUND');
    proposed=proposed.replace(needle,JSON.stringify(FULL_EVENT_RULE+'Per event return SUPPORTED or UNVERIFIABLE. '));
  }
  const reviewHashes=['a9a51d80d491cd5d62fcdda143c71ccd883cb98c3bfbb2bfbc46ed0d29d7853d','0b0f1b7a9cc6581b97464664ef58b44e7007cf4165668d4384c194907b14f139'];
  const selected=examples.map((example,index)=>({...example,events:example.events.map(event=>({...event,source_digest:v2?reviewHashes[index]:event.source_digest}))}));
  const scenarios=[...selected,
    {name:'unsupported_payment',expectedCount:0,events:selected[0].events.map((event,index)=>({...event,event:index?event.event:'Cloudflare confirms an authenticated compensation transfer to this beneficiary in the June report.'}))},
    {name:'contradictory_event',expectedCount:0,events:selected[0].events.map((event,index)=>({...event,event:index?event.event:'Access identity based logins remained fully available throughout the June 12 incident.'}))},
  ];
  const start=proposed.indexOf('    def __init__(self) -> None:\n',proposed.indexOf('class EpisodeCap(')),end=proposed.indexOf('\n    def _cover(',start);
  guard(start>0&&end>start,'CONSTRUCTOR_NOT_FOUND');
  const constructor=`    def __init__(self) -> None:
        scenarios = ${JSON.stringify(scenarios)}
        for index, scenario in enumerate(scenarios):
            events = scenario["events"]
            def leader():
                return _semantic_task([dict(event) for event in events])
            def validator(candidate):
                return _equivalent(candidate, leader(), [event["id"] for event in events])
            result = gl.vm.run_nondet_default(leader, validator)
            print("EC_REGRESSION=" + _json({"index": index, "stage": result.get("stage"), "source_code": result.get("source_code", ""), "verdict": result.get("verdict")}))
`;
  const instrumented=proposed.slice(0,start)+constructor+proposed.slice(end);
  const data=abi.transactions.serialize([instrumented,abi.calldata.encode(abi.calldata.makeCalldataObject(undefined,[])),false]);
  const receipt=await simulate({type:'deploy',from:'0x0000000000000000000000000000000000000001',to:'0x0000000000000000000000000000000000000000',data});
  const cases=[];
  function visit(value){
    if(typeof value==='string')for(const line of value.split('\n')){
      if(!line.startsWith('EC_REGRESSION='))continue;
      let item;try{item=JSON.parse(line.slice('EC_REGRESSION='.length));}catch{continue;}
      if(!Number.isInteger(item.index)||!scenarios[item.index])continue;
      const v=item.verdict,valid=v&&Array.isArray(v.events)&&v.events.length===2&&v.events.every(x=>['SUPPORTED','UNVERIFIABLE'].includes(x[1]))&&Array.isArray(v.pairs)&&v.pairs.length===1&&['SAME_CAUSE','SEPARATE_CAUSES','UNVERIFIABLE'].includes(v.pairs[0][2]);
      cases.push({name:scenarios[item.index].name,stage:['JUDGED','RETRYABLE','MODEL_INVALID'].includes(item.stage)?item.stage:'UNKNOWN',sourceCode:['DIGEST_MISMATCH','SOURCE_BINDING','EVENT_BINDING','SOURCE_UNAVAILABLE'].includes(item.source_code)?item.source_code:'',supports:valid?v.events.map(x=>x[1]):[],relation:valid?v.pairs[0][2]:'UNVERIFIABLE',complete:valid&&v.complete===true,occurrenceCount:valid&&v.complete?new Set(v.roots).size:0,expectedCount:scenarios[item.index].expectedCount});
    }else if(value&&typeof value==='object')for(const item of Object.values(value))visit(item);
  }
  visit(receipt);
  const passed=receipt?.execution_result==='SUCCESS'&&cases.length===4&&cases.every(x=>x.stage==='JUDGED'&&x.occurrenceCount===x.expectedCount&&(x.expectedCount>0||!x.complete&&x.supports[0]==='UNVERIFIABLE'&&x.relation==='UNVERIFIABLE'));
  const proof={command:'node scripts/semantic-regression.mjs',at:new Date().toISOString(),mode:'UNSIGNED_PRODUCTION_EC_V2_REGRESSION',sourceSha256:sourceHash(),instrumentedHelpersUnchanged:true,noKeysLoaded:true,noTransactionSubmitted:true,noGENSent:true,executionResult:receipt?.execution_result??'UNKNOWN',cases,categories:simulationErrors(receipt),passed,scope:'Production helpers instrumented in unsigned constructor; not finalized consensus'};
  save(path.join(EVIDENCE,'production-semantic-regression.json'),proof);console.log(JSON.stringify(proof));guard(passed,'FULL_EVENT_REGRESSION_FAILED');
}
main().catch(report);
