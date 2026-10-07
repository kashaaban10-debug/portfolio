const crypto = require('node:crypto');
const sources = {facebook:'فيسبوك',whatsapp:'واتساب',instagram:'إنستجرام',search:'بحث',friend:'صديق',lesson:'الحصة',other:'مصدر آخر',direct:'مباشر أو غير معروف'};
const limits=new Map(),sent=new Map(),pending=new Set();
const clean=(v,n)=>String(v||'').normalize('NFKC').replace(/[\u0000-\u001f\u007f<>\u202a-\u202e\u2066-\u2069]/g,'').trim().slice(0,n);
const token=()=>String(process.env.TELEGRAM_BOT_TOKEN||'').replace(/[\s\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g,'').trim();
const enabled=()=>Boolean(token()&&/^\d+$/.test(process.env.TELEGRAM_CHAT_ID||''));
const sign=text=>crypto.createHmac('sha256',token()).update(text).digest('hex');
const peer=req=>crypto.createHash('sha256').update(String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0]).digest('hex');
function challenge(req){const payload=Date.now()+':'+crypto.randomBytes(12).toString('hex')+':'+peer(req);return payload+':'+sign(payload);}
function validChallenge(value,req){const parts=String(value||'').split(':');if(parts.length!==4)return false;const sig=parts.pop(),payload=parts.join(':'),age=Date.now()-Number(parts[0]);if(age<1500||age>1200000||parts[2]!==peer(req)||!/^[a-f0-9]{64}$/.test(sig))return false;return crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(sign(payload)));}
module.exports=async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method==='GET')return res.status(200).json(enabled()?{enabled:true,challenge:challenge(req)}:{enabled:false});
 if(req.method!=='POST')return res.status(405).json({error:'method_not_allowed'});
 if(req.headers.origin!==(process.env.VISITOR_ALLOWED_ORIGIN||'https://karimshaabanportfolio.vercel.app'))return res.status(403).json({error:'origin_not_allowed'});
 if(!enabled())return res.status(503).json({error:'not_configured'});
 let b=req.body;try{if(typeof b==='string')b=JSON.parse(b);}catch{return res.status(400).json({error:'invalid_request'});}
 if(!b||b.consent!==true||b.website||!validChallenge(b.challenge,req)||!/^[a-f0-9-]{36}$/i.test(b.registrationId||''))return res.status(400).json({error:'invalid_request'});
 const name=clean(b.name,40);if(name.length<2)return res.status(400).json({error:'invalid_name'});
 const now=Date.now();for(const [k,t]of sent)if(now-t>3600000)sent.delete(k);for(const[k,v]of limits)if(now-v.time>3600000)limits.delete(k);
 const id=b.registrationId;if(sent.has(id))return res.status(200).json({sent:true});if(pending.has(id))return res.status(409).json({error:'pending'});
 const ip=peer(req),bucket=limits.get(ip)||{time:now,count:0};if(bucket.count>=5||pending.size>=20||sent.size>=100)return res.status(429).json({error:'rate_limited'});
 bucket.count++;limits.set(ip,bucket);pending.add(id);
 const grade=[1,2,3].includes(Number(b.grade))?['','أولى إعدادي','تانية إعدادي','تالتة إعدادي'][Number(b.grade)]:'لم يحدد الصف';
 const source=Object.hasOwn(sources,b.source)?b.source:'direct',reported=Object.hasOwn(sources,b.reportedSource)?b.reportedSource:null;
 const date=new Intl.DateTimeFormat('ar-EG',{timeZone:'Africa/Cairo',dateStyle:'medium',timeStyle:'short'}).format(new Date());
 const text=['🎉 تسجيل جديد في موقع مستر كريم','الاسم: '+name,'الصف: '+grade,'مصدر الرابط: '+sources[source],reported?'عرفنا من: '+sources[reported]+' (اختيار الطالب)':'','الوقت: '+date,'الاسم مكتوب بواسطة الزائر، وليس هوية موثقة.'].filter(Boolean).join('\n');
 try{const r=await fetch('https://api.telegram.org/bot'+token()+'/sendMessage',{method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(8000),body:JSON.stringify({chat_id:process.env.TELEGRAM_CHAT_ID,text,link_preview_options:{is_disabled:true}})});const result=await r.json();if(!r.ok||!result.ok){const reason=r.status===401?'invalid_bot_token':result.description==='Bad Request: chat not found'?'chat_not_found':r.status===403?'bot_blocked_or_forbidden':r.status===429?'telegram_rate_limited':'telegram_rejected';console.error('visitor_notification_failed',reason,'http_status',r.status,'telegram_code',Number(result.error_code)||0,'token_format',/^\d+:[A-Za-z0-9_-]{35}$/.test(token())?'valid':'invalid');throw Error('send_failed');}sent.set(id,Date.now());return res.status(200).json({sent:true});}
 catch(error){if(error.message!=='send_failed')console.error('visitor_notification_failed',error.name==='TimeoutError'?'telegram_timeout':'telegram_connection_error');return res.status(503).json({error:'temporarily_unavailable'});}finally{pending.delete(id);}
};
