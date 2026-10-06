// Unsigned instrumentation of production helpers; no account or persistent write.
import path from 'node:path';
import {abi} from 'genlayer-js';
import {examples} from './examples.mjs';
import {EVIDENCE,CHAIN,RPC,context,code,sourceHash,save,simulate,guard,report,simulationErrors} from './network.mjs';

async function main(){
  await context(false);
  const source=code();
  const start=source.indexOf('    def __init__(self) -> None:\n',source.indexOf('class EpisodeCap('));
  const end=source.indexOf('\n    def _cover(',start);
  guard(start>0&&end>start,'PRODUCTION_CONSTRUCTOR_NOT_FOUND');
  const constructor=`    def __init__(self) -> None:
        examples = ${JSON.stringify(examples)}
        for index, example in enumerate(examples):
            events = example["events"]
            def leader():
                response = gl.nondet.web.request(events[0]["source_url"], method="GET")
                body = response.body
                text = _text(body)
                dates = re.findall(r'"datePublished"\\s*:\\s*"([^\\"]+)"', body.decode("utf-8"))
                print("EC_SOURCE=" + _json({"index": index, "status": response.status, "length": len(body), "digest": hashlib.sha256(body).hexdigest(), "published": dates[0][:10] if dates else "", "textLength": len(text), "excerptPresent": [event["excerpt"] in text for event in events]}))
                return _semantic_task([dict(event) for event in events])
            def validator(candidate):
                return _equivalent(candidate, leader(), [event["id"] for event in events])
            result = gl.vm.run_nondet_default(leader, validator)
            print("EC_MEANING=" + _json({"index": index, "stage": result.get("stage"), "source_code": result.get("source_code", ""), "verdict": result.get("verdict")}))
`;
  const instrumented=source.slice(0,start)+constructor+source.slice(end);
  const data=abi.transactions.serialize([instrumented,abi.calldata.encode(abi.calldata.makeCalldataObject(undefined,[])),false]);
  const receipt=await simulate({type:'deploy',from:'0x0000000000000000000000000000000000000001',to:'0x0000000000000000000000000000000000000000',data});
  const sources=[],meanings=[];
  function visit(value){
    if(typeof value==='string')for(const line of value.split('\n')){
      if(!line.startsWith('EC_SOURCE=')&&!line.startsWith('EC_MEANING='))continue;
      let record;try{record=JSON.parse(line.slice(line.indexOf('=')+1));}catch{continue;}
      if(![0,1].includes(record.index))continue;
      if(line.startsWith('EC_SOURCE=')&&Number.isInteger(record.status)&&/^[0-9a-f]{64}$/.test(record.digest)&&/^\d{4}-\d{2}-\d{2}$/.test(record.published)){
        sources.push({index:record.index,status:record.status,length:record.length,digest:record.digest,published:record.published,textLength:record.textLength,excerptPresent:record.excerptPresent?.map(x=>x===true)});
      }
      if(line.startsWith('EC_MEANING=')&&['JUDGED','RETRYABLE','MODEL_INVALID'].includes(record.stage)){
        const v=record.verdict;
        const valid=v&&Array.isArray(v.events)&&Array.isArray(v.pairs)&&v.events.length===2&&v.pairs.length===1&&v.events.every(x=>Array.isArray(x)&&x.length===2&&['SUPPORTED','UNVERIFIABLE'].includes(x[1]))&&['SAME_CAUSE','SEPARATE_CAUSES','UNVERIFIABLE'].includes(v.pairs[0]?.[2]);
        meanings.push({index:record.index,stage:record.stage,sourceCode:['SOURCE_UNAVAILABLE','DIGEST_MISMATCH','SOURCE_BINDING','EXTRACTION_BOUND','EVENT_BINDING','EXTRACTION_INVALID'].includes(record.source_code)?record.source_code:'',complete:valid?v.complete===true:false,relation:valid?v.pairs[0][2]:'UNVERIFIABLE',occurrenceCount:valid&&v.complete?new Set(v.roots).size:0});
      }
    }else if(value&&typeof value==='object')for(const item of Object.values(value))visit(item);
  }
  visit(receipt);
  const passed=receipt?.execution_result==='SUCCESS'&&sources.length===2&&meanings.length===2&&sources.every(x=>x.status===200&&x.excerptPresent.every(Boolean))&&meanings.every(x=>x.stage==='JUDGED'&&x.complete&&x.occurrenceCount===examples[x.index].expectedCount);
  const proof={command:'node scripts/semantic-smoke.mjs',at:new Date().toISOString(),network:'Studio Dev',chainId:CHAIN,rpc:RPC,sourceSha256:sourceHash(),mode:'UNSIGNED_INSTRUMENTED_CONSTRUCTOR',productionHelpersUnchanged:true,noKeysLoaded:true,noTransactionSubmitted:true,noGENSent:true,executionResult:receipt?.execution_result??'UNKNOWN',sources,meanings,categories:simulationErrors(receipt),passed,limitation:'Leader simulation of production helpers; not deployed or finalized validator consensus.'};
  save(path.join(EVIDENCE,'semantic-smoke.json'),proof);console.log(JSON.stringify(proof));guard(passed,'PRODUCTION_MEANING_SMOKE_FAILED');
}
main().catch(report);
