(()=>{'use strict';
const key='karim-visitor-v1';let profile=null,settings=null,modal=null;
try{profile=JSON.parse(localStorage.getItem(key));}catch{}
function source(){const p=new URLSearchParams(location.search),u=(p.get('utm_source')||'').toLowerCase();if(p.has('fbclid')||['facebook','fb'].includes(u))return'facebook';if(['whatsapp','wa'].includes(u))return'whatsapp';if(['instagram','ig'].includes(u))return'instagram';try{const h=new URL(document.referrer).hostname;if(/(^|\.)(facebook\.com|fb\.com)$/.test(h))return'facebook';if(/(^|\.)instagram\.com$/.test(h))return'instagram';if(/(^|\.)(google\.[a-z.]+|bing\.com|duckduckgo\.com)$/.test(h))return'search';}catch{}return'direct';}
const sourceAtEntry=source();
function save(){try{localStorage.setItem(key,JSON.stringify(profile));}catch{}}
function motion(){let prefs={};try{prefs=JSON.parse(localStorage.getItem('karim-academy-state'))?.prefs||{};}catch{}return prefs.motion!==false&&!matchMedia('(prefers-reduced-motion: reduce)').matches;}
function celebrate(){if(!motion())return;const c=document.createElement('div');c.className='kv-confetti';c.setAttribute('aria-hidden','true');for(let i=0;i<36;i++){const e=document.createElement('i');e.style.cssText=`left:${Math.random()*100}%;--delay:${Math.random()*.4}s;--color:${['#e9b760','#71d5b8','#94b9f8'][i%3]};--spin:${Math.random()*720}deg`;c.append(e);}document.body.append(c);setTimeout(()=>c.remove(),2600);}
function greet(name){const toast=document.createElement('div');toast.className='kv-toast';toast.setAttribute('role','status');toast.textContent='🎉 نوّرتنا يا '+name+'! افهمها.. اربطها.. وافتكرها';document.body.append(toast);setTimeout(()=>toast.remove(),5000);celebrate();}
function show(){
 modal=document.createElement('dialog');modal.id='kv-welcome';modal.dir='rtl';modal.innerHTML=`<form method="dialog" class="kv-box"><button type="button" class="kv-close" aria-label="المتابعة كزائر">×</button><div class="kv-star" aria-hidden="true">✦</div><p class="kv-eyebrow">ما وراء الحدث · مستر كريم شعبان</p><h2>كل حكاية بتبدأ بصاحبها.</h2><p class="kv-intro">تحب نناديك بإيه في رحلتك؟</p><label for="kv-name">اسمك أو اسمك الأول</label><input id="kv-name" name="name" autocomplete="given-name" maxlength="40" minlength="2" required placeholder="اكتب اسمك هنا…"><label for="kv-grade">صفك الدراسي <span>(اختياري)</span></label><select id="kv-grade"><option value="">اختار صفك</option><option value="1">أولى إعدادي</option><option value="2">تانية إعدادي</option><option value="3">تالتة إعدادي</option></select><label for="kv-source">عرفت الموقع منين؟ <span>(اختياري)</span></label><select id="kv-source"><option value="">تخطّي السؤال</option><option value="facebook">فيسبوك</option><option value="whatsapp">واتساب</option><option value="instagram">إنستجرام</option><option value="friend">صديق</option><option value="lesson">حصة مستر كريم</option><option value="search">بحث</option><option value="other">مكان تاني</option></select><div class="kv-trap" aria-hidden="true"><input name="website" tabindex="-1" autocomplete="off"></div><p class="kv-privacy">بالضغط على «ابدأ رحلتي»، بتوافق إن اسمك وصفك ومصدر الزيارة يتبعتوا لمستر كريم في إشعار خاص على تليجرام. مش بنطلب رقمك أو حساب تليجرام، وتقدر تتصفح كزائر.</p><button type="submit" class="kv-start">ابدأ رحلتي ←</button><button type="button" class="kv-guest">كمّل كزائر</button><p id="kv-status" role="status"></p></form>`;
 document.body.append(modal);const form=modal.querySelector('form'),status=modal.querySelector('#kv-status');
 const close=()=>{try{sessionStorage.setItem('kv-guest','1');}catch{}modal.close();modal.remove();};modal.querySelector('.kv-close').onclick=close;modal.querySelector('.kv-guest').onclick=close;modal.addEventListener('cancel',()=>{try{sessionStorage.setItem('kv-guest','1');}catch{}});
 const nameInput=modal.querySelector('#kv-name');if(profile?.name)nameInput.value=profile.name;
 const routeGrade=Number(location.hash.split('/')[1]);if([1,2,3].includes(routeGrade))modal.querySelector('#kv-grade').value=routeGrade;
 form.onsubmit=async e=>{e.preventDefault();const name=nameInput.value.replace(/[\u0000-\u001f\u007f<>\u202a-\u202e\u2066-\u2069]/g,'').trim().slice(0,40);if(name.length<2){status.textContent='اكتب اسمًا من حرفين على الأقل.';return;}
 const button=form.querySelector('.kv-start');button.disabled=true;status.textContent='بنجهّز ترحيبك…';
 const registrationId=profile?.registrationId||crypto.randomUUID();profile={name,registrationId,sent:false};save();
 try{const r=await fetch('/api/visitors',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,grade:modal.querySelector('#kv-grade').value,source:sourceAtEntry,reportedSource:modal.querySelector('#kv-source').value,website:form.elements.website.value,consent:true,registrationId,challenge:settings.challenge}),signal:AbortSignal.timeout(12000)});const data=await r.json();if(!r.ok||!data.sent)throw Error('registration_failed');profile.sent=true;save();
 if(window.AcademyDebug){window.AcademyDebug.state.name=name;try{localStorage.setItem('karim-academy-state',JSON.stringify(window.AcademyDebug.state));}catch{}}
 modal.close();modal.remove();try{sessionStorage.setItem('kv-greeted','1');}catch{}greet(name);
 }catch{status.textContent='الاتصال مش مستقر؛ ما قدرناش نأكد وصول التسجيل لمستر. تقدر تكمّل كزائر أو تعيد المحاولة.';button.disabled=false;button.textContent='حاول تاني';}
 };
 modal.showModal();nameInput.focus();
}
const css=document.createElement('link');css.rel='stylesheet';css.href='/visitor-welcome.css';document.head.append(css);
async function init(){if(profile?.sent){let shown=false;try{shown=sessionStorage.getItem('kv-greeted')==='1';sessionStorage.setItem('kv-greeted','1');}catch{}if(!shown)greet(String(profile.name||'صديقنا').slice(0,40));return;}
 try{if(sessionStorage.getItem('kv-guest'))return;}catch{}
 try{const r=await fetch('/api/visitors',{cache:'no-store',signal:AbortSignal.timeout(5000)});if(!r.ok)return;settings=await r.json();if(settings.enabled&&settings.challenge)setTimeout(show,1800);}catch{}
}
window.KarimWelcome={source};init();
})();
