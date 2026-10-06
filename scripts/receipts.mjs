import {transactionsStatusNumberToName,executionResultNumberToName} from 'genlayer-js/types';
const address=value=>typeof value==='string'&&/^0x[0-9a-fA-F]{40}$/.test(value)?value:'';
const hash=value=>typeof value==='string'&&/^0x[0-9a-fA-F]{64}$/.test(value)?value:'';
export function safeReceipt(receipt,transactionHash){
  if(!receipt||typeof receipt!=='object')throw new Error('INVALID_RECEIPT');
  const leaders=receipt.consensus_data?.leader_receipt;
  const leader=Array.isArray(leaders)?leaders.at(-1):leaders;
  const status=receipt.statusName??receipt.status;
  const execution=receipt.txExecutionResultName??receipt.txExecutionResult??receipt.executionResult??receipt.execution_result??leader?.execution_result;
  const statusName=String(typeof status==='string'?status:transactionsStatusNumberToName[status]??'UNKNOWN').toUpperCase();
  const resultName=String(typeof execution==='string'?execution:executionResultNumberToName[execution]??'UNKNOWN').toUpperCase();
  const executionResult=resultName==='FINISHED_WITH_RETURN'?'SUCCESS':resultName==='FINISHED_WITH_ERROR'?'ERROR':resultName;
  return {transactionHash:hash(transactionHash),contractAddress:address(receipt.contractAddress??receipt.recipient??receipt.to),status:statusName,executionResult};
}
