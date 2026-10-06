const sources=[
  {url:'https://blog.cloudflare.com/cloudflare-service-outage-june-12-2025/',date:'2025-06-12',digest:'547aee5894b306500ff1165638e08ad0b071268ad836fd1e56fb5d55c40ba4ff'},
  {url:'https://blog.cloudflare.com/cloudflare-1-1-1-1-incident-on-july-14-2025/',date:'2025-07-15',digest:'604155db5bea9e0edf11e124262747515d48cef06c1123675c6735e466727819'},
];
export const examples=[
  {name:'same',expectedCount:1,events:[
    {id:'access',event:'Access identity based login failures in the June 12 outage',excerpt:'Access failed 100% of identity based logins'},
    {id:'warp',event:'WARP new device registration failures in the June 12 outage',excerpt:'registrations of new devices fail'},
  ]},
  {name:'separate',expectedCount:2,events:[
    {id:'resolver',event:'1.1.1.1 resolver outage from withdrawn routes on July 14',excerpt:'DNS traffic to 1.1.1.1 Resolver service begins to drop globally'},
    {id:'bgp',event:'BGP origin hijack visible at 21:54 UTC on July 14, explicitly not the resolver outage cause',excerpt:'BGP origin hijack of 1.1.1.0/24'},
  ]},
].map((example,index)=>({...example,events:example.events.map(event=>({...event,source_url:sources[index].url,source_digest:sources[index].digest,report_date:sources[index].date}))}));
