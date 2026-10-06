const sources=[
  {url:'https://blog.cloudflare.com/cloudflare-service-outage-june-12-2025/',date:'2025-06-12',digest:'a9a51d80d491cd5d62fcdda143c71ccd883cb98c3bfbb2bfbc46ed0d29d7853d'},
  {url:'https://blog.cloudflare.com/cloudflare-1-1-1-1-incident-on-july-14-2025/',date:'2025-07-15',digest:'0b0f1b7a9cc6581b97464664ef58b44e7007cf4165668d4384c194907b14f139'},
];
export const examples=[
  {name:'same',expectedCount:1,events:[
    {id:'access',event:'Access identity based login failures in the June 12 outage',excerpt:'Access failed 100% of identity based logins'},
    {id:'warp',event:'Cloudflare WARP team observed failing registrations of new devices.',excerpt:'Cloudflare WARP team begins to see registrations of new devices fail'},
  ]},
  {name:'separate',expectedCount:2,events:[
    {id:'resolver',event:'1.1.1.1 resolver outage from withdrawn routes on July 14',excerpt:'DNS traffic to 1.1.1.1 Resolver service begins to drop globally'},
    {id:'bgp',event:'BGP origin hijack visible at 21:54 UTC on July 14, explicitly not the resolver outage cause',excerpt:'BGP origin hijack of 1.1.1.0/24'},
  ]},
].map((example,index)=>({...example,events:example.events.map(event=>({...event,source_url:sources[index].url,source_digest:sources[index].digest,report_date:sources[index].date}))}));
