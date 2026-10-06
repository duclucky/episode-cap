import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createAccount,createClient,abi,normalizeMessageFeeAllocations} from 'genlayer-js';
import {studioDevnet} from 'genlayer-js/chains';
import {CalldataAddress} from 'genlayer-js/types';
import {hexToBytes} from 'viem';

export const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const RPC='https://studio-next.genlayer.com/api', CHAIN=61997, GEN=10n**18n;
export const EVIDENCE=path.join(ROOT,'docs/evidence/studio-dev');
export const DEPLOYMENT=path.join(EVIDENCE,'deployment.json');
export const SOURCE=path.join(ROOT,'contracts/episode_cap.py');
export function guard(condition,code){if(!condition){const error=new Error(code);error.safeCode=code;throw error;}}
export function report(error){console.error(JSON.stringify({error:error?.safeCode??'NETWORK_OR_RUNTIME_ERROR',rpcErrorCode:Number.isInteger(error?.code)?error.code:null}));process.exitCode=1;}
export const load=(file,fallback=null)=>fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):fallback;
export function save(file,value){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n');}
export const code=()=>fs.readFileSync(SOURCE,'utf8');
export const sourceHash=()=>crypto.createHash('sha256').update(fs.readFileSync(SOURCE)).digest('hex');
export const commit=()=>execFileSync('git',['rev-parse','HEAD'],{cwd:ROOT,encoding:'utf8'}).trim();
export const dirty=()=>!!execFileSync('git',['status','--porcelain'],{cwd:ROOT,encoding:'utf8'}).trim();
export function gen(value){const n=BigInt(value),fraction=n%GEN;return `${n/GEN}${fraction?'.'+fraction.toString().padStart(18,'0').replace(/0+$/,''):''} GEN`;}
export function amount(text){guard(/^\d+(\.\d{1,18})? GEN$/.test(text),'INVALID_GEN_VIEW');const [whole,fraction='']=text.slice(0,-4).split('.');return BigInt(whole)*GEN+BigInt(fraction.padEnd(18,'0'));}
export function addressArg(address){guard(/^0x[0-9a-fA-F]{40}$/.test(address),'INVALID_ADDRESS');return new CalldataAddress(hexToBytes(address));}
function accounts(){
  const values={};
  for(const file of [path.join(ROOT,'.env'),path.resolve(ROOT,'..','.env')]){
    if(!fs.existsSync(file))continue;
    for(const line of fs.readFileSync(file,'utf8').split(/\r?\n/)){
      if(line.trimStart().startsWith('#'))continue;
      const index=line.indexOf('=');if(index<=0)continue;
      const key=line.slice(0,index).trim();let value=line.slice(index+1).trim();
      if((value.startsWith('"')&&value.endsWith('"'))||(value.startsWith("'")&&value.endsWith("'")))value=value.slice(1,-1);
      if(value&&!values[key])values[key]=value;
    }
  }
  const result={};
  for(const [role,name] of Object.entries({funder:'STUDIONET_PRIVATE_KEY',beneficiary:'STUDIONET_INTEGRATOR_PRIVATE_KEY'})){
    const key=values[name]??'';guard(/^(0x)?[0-9a-fA-F]{64}$/.test(key),'AUTHORIZED_CONFIGURATION_MISSING');
    result[role]=createAccount(key.startsWith('0x')?key:'0x'+key);
  }
  guard(result.funder.address.toLowerCase()!==result.beneficiary.address.toLowerCase(),'DISTINCT_ROLES_REQUIRED');
  return result;
}
export async function context(withAccounts=false){
  guard(studioDevnet.id===CHAIN,'SDK_CHAIN_MISMATCH');
  const publicClient=createClient({chain:studioDevnet,endpoint:RPC});
  guard(Number(BigInt(await publicClient.request({method:'eth_chainId',params:[]})))===CHAIN,'RPC_CHAIN_MISMATCH');
  const roles=withAccounts?accounts():{};
  const clients=Object.fromEntries(Object.entries(roles).map(([role,account])=>[role,createClient({chain:studioDevnet,endpoint:RPC,account})]));
  return {publicClient,roles,clients};
}
export async function view(client,address,functionName,args=[]){return client.readContract({address,functionName,args,transactionHashVariant:'latest-final'});}
export async function simulate(request){
  const response=await fetch(RPC,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'sim_call',params:[request]},(_,value)=>typeof value==='bigint'?value.toString():value),signal:AbortSignal.timeout(55000)});
  const envelope=await response.json();
  guard(response.ok&&!envelope.error,'SIMULATION_RPC_FAILED');
  return envelope.result;
}
export function simulationErrors(receipt){
  const text=JSON.stringify(receipt?.genvm_result??{})+' '+(typeof receipt?.result==='string'?Buffer.from(receipt.result,'base64').toString('utf8'):'');
  return ['AttributeError','TypeError','UserError','ValueError','NameError','invalid semantic output','invalid derived settlement meaning','review expired','DIGEST_MISMATCH','SOURCE_BINDING','EXTRACTION_BOUND','EVENT_BINDING','InsufficientFees','BudgetTooLow','MessageAllocationsNotEqualBudget','MessageNoMatchingAllocation','AllocationLifecycleBudgetInsufficient','MessageEmissionPhaseMismatch','nondet','timeout'].filter(word=>text.toLowerCase().includes(word.toLowerCase()));
}
export async function measuredFees(client,address,functionName,args,value=0n,messageAllocations){
  const baseline=await client.estimateTransactionFees(messageAllocations?{messageAllocations}:{});
  const data=abi.transactions.serialize([abi.calldata.encode(abi.calldata.makeCalldataObject(functionName,args)),false]);
  const receipt=await simulate({type:'write',from:client.account.address,to:address,data,value:'0x'+value.toString(16),sim_config:{genvm_datetime:new Date().toISOString()},fees:{distribution:baseline.distribution,feeValue:baseline.feeValue,...(baseline.messageAllocations?{messageAllocations:normalizeMessageFeeAllocations(baseline.messageAllocations)}:{})}});
  if(receipt?.execution_result!=='SUCCESS')console.log(JSON.stringify({stage:'FEE_SIMULATION_ERROR',method:functionName,executionResult:receipt?.execution_result??'UNKNOWN',categories:simulationErrors(receipt)}));
  guard(receipt?.execution_result==='SUCCESS','TIMESTAMPED_FEE_SIMULATION_FAILED');
  return client.estimateTransactionFeesFromSimulation({simulation:{receipt,feeAccounting:receipt.genvm_result?.fee_accounting,feeReport:receipt.genvm_result?.fee_accounting?.execution_fee_report},...(messageAllocations?{messageAllocations}:{})});
}
