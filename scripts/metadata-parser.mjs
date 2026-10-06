export function nonpayableFailure(receipt){
  const result=typeof receipt?.result==='string'?Buffer.from(receipt.result,'base64').toString('utf8'):'';
  const engine=receipt?.genvm_result??{};
  const diagnostic=[result,engine.error_description,engine.raw_error,engine.stderr].filter(value=>typeof value==='string').join('\n');
  return receipt?.execution_result==='ERROR'&&/\bnon[- ]payable\b/i.test(diagnostic);
}
