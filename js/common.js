export function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
export function parseMCQs(text){
 text=text.replace(/\r/g,'').trim();
 const starts=[...text.matchAll(/(?:^|\n)\s*(\d+)\.\s*/g)];
 if(!starts.length)return[];
 const out=[];
 for(let i=0;i<starts.length;i++){
  const a=starts[i].index+(starts[i][0].startsWith('\n')?1:0);
  const b=i+1<starts.length?starts[i+1].index:text.length;
  let c=text.slice(a,b).trim().replace(/^\d+\.\s*/,'');
  const am=c.match(/\bAnswer\s*:\s*([A-D])\)\s*(.*?)\s*$/is);
  const body=am?c.slice(0,am.index).trim():c;
  const ms=[...body.matchAll(/(?:^|\n|\s)([A-D])\)\s*(.*?)(?=\s+[A-D]\)\s|\s*$)/gs)];
  const options={}; ms.forEach(m=>options[m[1]]=m[2].trim());
  const q=ms.length?body.slice(0,ms[0].index).trim():body;
  if(q&&Object.keys(options).length>=2)out.push({id:i+1,question:q,options,answer:am?am[1].toUpperCase():null});
 }
 return out;
}
function bytesToB64(bytes){let s='';const chunk=0x8000;for(let i=0;i<bytes.length;i+=chunk)s+=String.fromCharCode(...bytes.subarray(i,i+chunk));return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function b64ToBytes(str){str=str.replace(/-/g,'+').replace(/_/g,'/');while(str.length%4)str+='=';const s=atob(str);const a=new Uint8Array(s.length);for(let i=0;i<s.length;i++)a[i]=s.charCodeAt(i);return a}
export async function encodeTest(obj){
 const raw=new TextEncoder().encode(JSON.stringify(obj));
 if('CompressionStream' in window){
  const cs=new CompressionStream('gzip');const writer=cs.writable.getWriter();writer.write(raw);writer.close();
  const buf=await new Response(cs.readable).arrayBuffer();return 'g'+bytesToB64(new Uint8Array(buf));
 }
 return 'u'+encodeURIComponent(JSON.stringify(obj));
}
export async function decodeTest(token){
 if(!token)return null;
 try{
  if(token[0]==='u')return JSON.parse(decodeURIComponent(token.slice(1)));
  if(token[0]==='g'&&'DecompressionStream' in window){
   const bytes=b64ToBytes(token.slice(1));const ds=new DecompressionStream('gzip');const writer=ds.writable.getWriter();writer.write(bytes);writer.close();
   const buf=await new Response(ds.readable).arrayBuffer();return JSON.parse(new TextDecoder().decode(buf));
  }
 }catch(e){console.error(e)}
 return null;
}
export function tokenFromUrl(){return location.hash.startsWith('#t=')?location.hash.slice(3):new URLSearchParams(location.search).get('t')}
export function fmt(sec){sec=Math.max(0,Math.floor(sec));return String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0')}