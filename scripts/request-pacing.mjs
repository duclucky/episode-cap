// Respect the hosted RPC quota at the HTTP boundary, including SDK subrequests.
export function paceFetch(fetchFn,rpc,{intervalMs=2200,now=Date.now,wait=ms=>new Promise(resolve=>setTimeout(resolve,ms))}={}){
  if(!Number.isInteger(intervalMs)||intervalMs<2100)throw new RangeError('RPC interval must preserve the 30-per-minute quota');
  const endpoint=new URL(rpc).href;let tail=Promise.resolve(),nextAllowed=0;
  return (input,...args)=>{
    const url=new URL(typeof input==='object'&&'url' in input?input.url:String(input)).href;
    if(url!==endpoint)return fetchFn(input,...args);
    const job=tail.then(async()=>{
      const delay=Math.max(0,nextAllowed-now());if(delay)await wait(delay);
      nextAllowed=now()+intervalMs;return fetchFn(input,...args);
    });
    tail=job.catch(()=>{});return job;
  };
}
