// Generate an ignored, reviewable prototype; never replace production source.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {ROOT,code,guard} from './network.mjs';
export function proposedSource(){
  let source=code();
  if(source.includes('VERSION = "EC_V2"'))return source;
  guard(source.includes('VERSION = "EC_V1"'),'BASELINE_VERSION_REQUIRED');
  source=source.replace('VERSION = "EC_V1"','VERSION = "EC_V2"');
  const old='"Each selected event must be affirmatively supported by its exact excerpt in report context: SUPPORTED or UNVERIFIABLE. "';
  const rule='The event field is the FULL factual proposition being judged, not a display label. The excerpt is only a location anchor and may describe something different. SUPPORTED requires affirmative report support for EVERY material assertion in event, including product, event type, outcome and stated timing. A genuine excerpt never proves an unrelated event description. If any asserted fact is absent or contradicted, return UNVERIFIABLE. In particular, an outage excerpt cannot prove compensation, payment, customer loss, subscription, identity or another unreported action. First assess the complete event descriptions against the report. If either endpoint is UNVERIFIABLE, its pair relation must also be UNVERIFIABLE. Per event return SUPPORTED or UNVERIFIABLE. ';
  guard(source.includes(old),'BASELINE_PROMPT_REQUIRED');
  source=source.replace(old,JSON.stringify(rule)).replace('EPISODECAP EC_V1 LOCKED TASK','EPISODECAP EC_V2 LOCKED TASK');
  const start=source.indexOf('def _source_body('),end=source.indexOf('\ndef _normalize_result(',start);
  guard(start>=0&&end>start,'SOURCE_BINDER_REQUIRED');
  const binder=`def _source_body(response, event):
    body = response.body
    if response.status != 200 or not isinstance(body, bytes) or not 1000 <= len(body) <= 500000:
        return None, "SOURCE_UNAVAILABLE"
    try:
        decoded = body.decode("utf-8")
        canonical = 'rel="canonical" href="' + event["source_url"] + '"'
        dates = re.findall(r'"datePublished"\\s*:\\s*"([^\\"]+)"', decoded)
        if canonical not in decoded or not dates or dates[0][:10] != event["report_date"]:
            return None, "SOURCE_BINDING"
        text = _text(body)
        if not 1000 <= len(text) <= 60000:
            return None, "EXTRACTION_BOUND"
        if hashlib.sha256(text.encode("utf-8")).hexdigest() != event["source_digest"]:
            return None, "DIGEST_MISMATCH"
        if event["excerpt"] not in text:
            return None, "EVENT_BINDING"
        return text, "COMPLETE"
    except Exception:
        return None, "EXTRACTION_INVALID"

`;
  source=source.slice(0,start)+binder+source.slice(end);
  guard(!/[^\x00-\x7f]/.test(source),'ASCII_PROTOTYPE_REQUIRED');return source;
}
if(process.argv[1]&&path.resolve(process.argv[1])===path.join(ROOT,'scripts/propose-v2.mjs')){
  const source=proposedSource(),file=path.join(ROOT,'local/proposed_v2.py');
  fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,source);
  console.log(JSON.stringify({stage:'PROTOTYPE_ONLY',productionSourceUnchanged:true,sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),path:'local/proposed_v2.py'}));
}
