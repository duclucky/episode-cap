// Read-only feasibility: raw HTML can vary while the exact review text stays fixed.
import path from 'node:path';
import {abi} from 'genlayer-js';
import {examples} from './examples.mjs';
import {EVIDENCE,context,code,simulate,guard,report,save} from './network.mjs';
async function main(){
  await context(false);
  const source=code(),start=source.indexOf('    def __init__(self) -> None:\n',source.indexOf('class EpisodeCap(')),end=source.indexOf('\n    def _cover(',start);
  const constructor=`    def __init__(self) -> None:
        urls = ${JSON.stringify(examples.map(x=>x.events[0].source_url))}
        for index, url in enumerate(urls):
            for attempt in range(3):
                def leader():
                    response = gl.nondet.web.request(url, method="GET")
                    raw = response.body
                    text = _text(raw)
                    decoded = raw.decode("utf-8")
                    dates = re.findall(r'"datePublished"\\s*:\\s*"([^\\"]+)"', decoded)
                    return {"index": index, "attempt": attempt, "status": response.status, "rawDigest": hashlib.sha256(raw).hexdigest(), "reviewDigest": hashlib.sha256(text.encode("utf-8")).hexdigest(), "canonical": ('rel="canonical" href="' + url + '"') in decoded, "published": dates[0][:10] if dates else "", "reviewLength": len(text)}
                def validator(candidate):
                    # Technical representation probe, not a consequential semantic judge.
                    return isinstance(candidate, gl.vm.Return) and candidate.calldata["reviewDigest"] == leader()["reviewDigest"]
                record = gl.vm.run_nondet_default(leader, validator)
                print("EC_REP=" + _json(record))
`;
  const instrumented=source.slice(0,start)+constructor+source.slice(end);
  const data=abi.transactions.serialize([instrumented,abi.calldata.encode(abi.calldata.makeCalldataObject(undefined,[])),false]);
  const receipt=await simulate({type:'deploy',from:'0x0000000000000000000000000000000000000001',to:'0x0000000000000000000000000000000000000000',data});
  const records=[];
  function visit(value){
    if(typeof value==='string')for(const line of value.split('\n')){
      if(!line.startsWith('EC_REP='))continue;
      let x;try{x=JSON.parse(line.slice(7));}catch{continue;}
      if(![0,1].includes(x.index)||![0,1,2].includes(x.attempt)||!Number.isInteger(x.status)||!Number.isInteger(x.reviewLength)||!/^\d{4}-\d{2}-\d{2}$/.test(x.published)||![x.rawDigest,x.reviewDigest].every(d=>/^[a-f0-9]{64}$/.test(d)))continue;
      records.push({index:x.index,attempt:x.attempt,status:x.status,rawDigest:x.rawDigest,reviewDigest:x.reviewDigest,canonical:x.canonical===true,published:x.published,reviewLength:x.reviewLength});
    }else if(value&&typeof value==='object')for(const x of Object.values(value))visit(x);
  }
  visit(receipt);
  const stable=records.length===6&&records.every(x=>x.status===200&&x.canonical&&x.reviewLength>=1000&&x.reviewLength<=60000)&&[0,1].every(index=>new Set(records.filter(x=>x.index===index).map(x=>x.reviewDigest)).size===1);
  const proof={command:'node scripts/representation-probe.mjs',at:new Date().toISOString(),mode:'UNSIGNED_REPRESENTATION_PROBE',noKeysLoaded:true,noTransactionSubmitted:true,noGENSent:true,executionResult:receipt?.execution_result??'UNKNOWN',records,reviewTextStable:stable,scope:'No production policy change or finalized consensus; hashes represent the exact text currently supplied to the semantic model'};
  save(path.join(EVIDENCE,'representation-probe.json'),proof);console.log(JSON.stringify(proof));guard(stable&&receipt.execution_result==='SUCCESS','REVIEW_TEXT_NOT_STABLE');
}
main().catch(report);
