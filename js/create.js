import {parseMCQs,esc,encodeTest} from './common.js';
let parsed=null;
const title=document.getElementById('title'),minutes=document.getElementById('minutes'),source=document.getElementById('source'),preview=document.getElementById('preview'),msg=document.getElementById('msg'),linkBtn=document.getElementById('linkBtn');
document.getElementById('previewBtn').onclick=()=>{
 parsed=parseMCQs(source.value);
 if(!parsed.length){msg.innerHTML='<p class="error">No questions detected. Make sure each question starts with 1., 2., 3. and contains A), B), C), D) plus Answer:.</p>';linkBtn.classList.add('hidden');return}
 const missing=parsed.filter(q=>!q.answer).length;
 msg.innerHTML='<p class="successText">✓ '+parsed.length+' questions detected'+(missing?' • '+missing+' answer(s) not detected':'')+'.</p>';
 preview.innerHTML=parsed.map(q=>'<article class="card"><h3>'+q.id+'. '+esc(q.question)+'</h3>'+Object.entries(q.options).map(([k,v])=>'<div class="previewOption"><b>'+k+') </b>'+esc(v)+'</div>').join('')+'<p class="answerLine">Correct: <b>'+esc(q.answer||'Not detected')+'</b></p></article>').join('');
 linkBtn.classList.remove('hidden');
};
linkBtn.onclick=async()=>{
 if(!parsed)return;
 linkBtn.disabled=true;linkBtn.textContent='Generating…';
 const data={v:1,title:title.value.trim()||'Mock Test',minutes:Math.max(1,+minutes.value||30),questions:parsed};
 const token=await encodeTest(data);
 const url=location.href.split('#')[0].replace(/index\.html$/,'test.html')+'#t='+token;
 const shareText='📝 '+data.title+'
⏱️ '+data.minutes+' minutes
📚 '+data.questions.length+' questions

Take the mock test here:
'+url;
 msg.innerHTML='<div class="shareBox"><b>Shareable Test Link</b><input id="shareUrl" value="'+url+'" readonly><button id="copyBtn">Copy Link</button><button id="shareBtn">Share</button><small>For large tests, the link can become long. Modern browsers compress the test data automatically.</small></div>';
 document.getElementById('copyBtn').onclick=()=>navigator.clipboard?.writeText(url).then(()=>document.getElementById('copyBtn').textContent='Copied!');
 document.getElementById('shareBtn').onclick=async()=>{if(navigator.share)await navigator.share({title:data.title,text:shareText,url});else navigator.clipboard?.writeText(shareText).then(()=>alert('Share text copied.'))};
 linkBtn.disabled=false;linkBtn.textContent='Generate Shareable Link';
};