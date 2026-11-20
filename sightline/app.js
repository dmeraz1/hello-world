(function(){
const $=s=>document.querySelector(s);
const svgNS="http://www.w3.org/2000/svg";
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const DUR={w:4,dh:3,h:2,dq:1.5,q:1,de:.75,e:.5,s:.25,wr:4,hr:2,qr:1,er:.5,sr:.25};
const LET="CDEFGAB";
const SHARP_ORDER="FCGDAEB",FLAT_ORDER="BEADGCF";
const SHARP_STEPS=[8,5,9,6,3,7,4],FLAT_STEPS=[4,7,3,6,2,5,1];
function keyMap(f){const m={};if(f>0)for(let i=0;i<f;i++)m[SHARP_ORDER[i]]=1;if(f<0)for(let i=0;i<-f;i++)m[FLAT_ORDER[i]]=-1;return m}
function stepOf(letter,oct){return oct*7+LET.indexOf(letter)-30}

/* Built-in pieces: original short excerpts, written pitch for B♭ clarinet */
const PIECES=[
 {title:"Warm-up Chorale",level:"Easier",fifths:0,m:[
  "q:G4 q:A4 h:B4","q:C5 q:B4 q:A4 q:G4","dq:A4 e:B4 h:C5","q:B4 q:A4 h:G4",
  "q:E4 q:F4 q:G4 q:A4","e:B4 e:A4 q:G4 e:F4 q:E4 e:F4","dq:G4 e:A4 q:B4 qr","w:C5"]},
 {title:"Etude in G",level:"Harder",fifths:1,m:[
  "e:G4 e:B4 e:D5 e:G5 q:F#5 q:D5","dq:E5 e:C5 q:A4 q:F#4","e:G4 q:B4 e:D5 q:B4 q:G4","s:A4 s:B4 s:C5 s:D5 dq:E5 e:D5 q:C5",
  "qr e:B4 e:C5 q:D5 q:E5","e:F#5 e:E5 q:D5 dq:C#5 e:B4","q:A4 e:B4 e:A4 q:G4 q:F#4","h:G4 hr"]}
];
function buildPiece(p){
  const km=keyMap(p.fifths),events=[];
  p.m.forEach((ms,mi)=>{let inM=0;const carry={};
    ms.trim().split(/\s+/).forEach(tk=>{const [tok,pitch]=tk.split(":"),d=DUR[tok];
      const e={abs:mi*4+inM,dur:d,tok,rest:!pitch,m:mi,step:null,acc:null};
      if(pitch){const mm=pitch.match(/^([A-G])(#|b)?(\d)$/),letter=mm[1],alt=mm[2]==="#"?1:mm[2]==="b"?-1:0,oct=+mm[3];
        e.step=stepOf(letter,oct);e.alt=alt;const key=letter+oct,expect=key in carry?carry[key]:(km[letter]||0);
        if(alt!==expect){e.acc=alt;carry[key]=alt}}
      events.push(e);inM+=d});
  });
  return finish({title:p.title,sub:p.level,fifths:p.fifths,N:p.m.length,events});
}
function letterOct(step){const dia=step+30;return {letter:LET[((dia%7)+7)%7],oct:Math.floor(dia/7),idx:((dia%7)+7)%7}}
function natMidi(step){const l=letterOct(step);return 12*(l.oct+1)+[0,2,4,5,7,9,11][l.idx]}
function computeAcc(ex){
  const km=keyMap(ex.fifths);let carry={},m=-1;
  ex.events.forEach(e=>{if(e.m!==m){carry={};m=e.m}if(e.rest){e.acc=null;return}
    const l=letterOct(e.step),key=l.letter+l.oct,expect=key in carry?carry[key]:(km[l.letter]||0),alt=e.alt||0;
    if(alt!==expect){e.acc=alt;carry[key]=alt}else e.acc=null});
}
const KEYNAMES=["C♭","G♭","D♭","A♭","E♭","B♭","F","C","G","D","A","E","B","F♯","C♯"];
const keyName=f=>KEYNAMES[f+7]+" major";
function transpose(ex,f1){
  const f0=ex.fifths,mod=(a,n)=>((a%n)+n)%n;
  let dL=mod(4*f1,7)-mod(4*f0,7),dS=mod(7*f1-7*f0,12);if(dS>5)dS-=12;
  if(dS<0&&dL>0)dL-=7;if(dS>0&&dL<0)dL+=7;
  const events=ex.events.map(e=>{const n=Object.assign({},e);if(!e.rest){const mid=natMidi(e.step)+(e.alt||0);n.step=e.step+dL;n.alt=mid+dS-natMidi(n.step)}return n});
  return finish(Object.assign({},ex,{fifths:f1,events}));
}
const EASY_R=[["q","q"],["h"],["e","e","q"],["q","e","e"],["e","e","e","e"]];
const FOCUS_R={dotted:[["dq","e"],["de","s","q"],["q","de","s"]],
  sync:[["e","q","e"],["s","e","s","q"],["q","s","e","s"]],
  six:[["s","s","s","s","q"],["q","s","s","s","s"],["e","s","s","q"],["s","s","e","q"]]};
FOCUS_R.mixed=FOCUS_R.dotted.concat(FOCUS_R.sync,FOCUS_R.six);
function rhythmize(ex,focus,r){
  const pitches=ex.events.filter(e=>!e.rest).map(e=>({step:e.step,alt:e.alt||0}));
  const pick=a=>a[Math.floor(r()*a.length)],events=[];let k=0,abs=0;
  for(let m=0;m<ex.N;m++)for(let h=0;h<2;h++){
    let pat;
    if(m===ex.N-1&&h===1)pat=["h"];
    else if((m===0&&h===0)||m===ex.N-1)pat=pick(EASY_R);
    else pat=r()<.55?pick(FOCUS_R[focus]):pick(EASY_R);
    pat.forEach(tok=>{const last=m===ex.N-1&&h===1,p=last?pitches[pitches.length-1]:pitches[k++%pitches.length];
      events.push({abs,dur:DUR[tok],tok,rest:false,m,step:p.step,alt:p.alt,acc:null});abs+=DUR[tok]})}
  return finish(Object.assign({},ex,{events}));
}
function finish(ex){
  computeAcc(ex);
  let prev=null;const low=e=>e.step<4||(e.step===4&&e.alt<0);ex.events.forEach(e=>{e.cross=!e.rest&&prev!==null&&low(prev)!==low(e);if(!e.rest)prev=e});
  ex.total=ex.N*4;ex.warnings=detectWarnings(ex.events);return ex;
}
function detectWarnings(events){
  const out=[];
  events.forEach(e=>{
    const inM=e.abs-e.m*4,off=Math.abs(inM-Math.round(inM))>1e-6;let label=null,dur=2;
    if(!e.rest&&(e.tok==="dq"||e.tok==="de"))label="Dotted rhythm";
    else if(e.tok==="s")label="Sixteenths";
    else if(!e.rest&&off&&e.dur>=1)label="Syncopation";
    else if(e.cross){label="Over the break";dur=1}
    if(!label)return;
    const start=e.m*4+Math.floor(inM+1e-6);
    const last=out[out.length-1];
    if(last&&start-last.start<2)return;
    if(label==="Over the break"&&out.some(w=>w.label===label&&start-w.start<6))return;
    out.push({start,dur,label});
  });
  return out;
}

/* MusicXML import (single part, 4/4, one voice) */
function parseMusicXML(text){
  const doc=new DOMParser().parseFromString(text,"application/xml");
  if(doc.querySelector("parsererror"))throw new Error("That file isn't readable MusicXML. If it ends in .mxl, export it again as uncompressed MusicXML.");
  const part=doc.querySelector("part");if(!part)throw new Error("No part found in that file.");
  const title=(doc.querySelector("work-title")||doc.querySelector("movement-title")||{}).textContent||"Your part";
  const measures=[...part.children].filter(n=>n.localName==="measure").slice(0,16);
  if(!measures.length)throw new Error("No measures found in that file.");
  let fifths=0,divisions=1;const events=[];
  const typeMap={whole:"w",half:"h",quarter:"q",eighth:"e","16th":"s"};
  measures.forEach((ms,mi)=>{
    const at=ms.querySelector("attributes");
    if(at){const f=at.querySelector("key fifths");if(f&&mi===0)fifths=+f.textContent;
      const dv=at.querySelector("divisions");if(dv)divisions=+dv.textContent;
      const b=at.querySelector("time beats"),bt=at.querySelector("time beat-type");
      if(b&&bt&&(b.textContent.trim()!=="4"||bt.textContent.trim()!=="4"))throw new Error("This prototype reads parts in 4/4 only. That file is in "+b.textContent.trim()+"/"+bt.textContent.trim()+".");}
    let inM=0;
    [...ms.children].filter(n=>n.localName==="note").forEach(n=>{
      if(n.querySelector("chord")||n.querySelector("grace"))return;
      const v=n.querySelector("voice");if(v&&v.textContent.trim()!=="1")return;
      if(n.querySelector("time-modification"))throw new Error("Triplets aren't supported in this prototype yet.");
      const rest=!!n.querySelector("rest");
      const typeEl=n.querySelector("type"),dots=n.querySelectorAll("dot").length;
      let base=typeEl?typeMap[typeEl.textContent.trim()]:null;
      const durEl=n.querySelector("duration"),beats=durEl?(+durEl.textContent/divisions):null;
      if(!base&&rest&&beats)base=beats>=4?"w":beats>=2?"h":beats>=1?"q":beats>=.5?"e":"s";
      if(!base)throw new Error("Found a note value this prototype can't draw yet (only whole to sixteenth notes).");
      let tok=base;
      if(dots===1){tok={h:"dh",q:"dq",e:"de"}[base];if(!tok)throw new Error("Found a dotted value this prototype can't draw yet.")}
      if(dots>1)throw new Error("Double-dotted notes aren't supported yet.");
      if(rest)tok=(base==="w"&&beats>=4)||base==="w"?"wr":base+"r";
      const d=rest&&beats?Math.min(4,beats):DUR[tok];
      const e={abs:mi*4+inM,dur:d,tok,rest,m:mi,step:null,acc:null};
      if(!rest){const p=n.querySelector("pitch");
        e.step=stepOf(p.querySelector("step").textContent.trim(),+p.querySelector("octave").textContent);const al=p.querySelector("alter");e.alt=al?+al.textContent:0;
        const ac=n.querySelector("accidental");
        if(ac){const t=ac.textContent.trim();e.acc=t==="sharp"?1:t==="flat"?-1:t==="natural"?0:null}}
      events.push(e);inM+=d;
    });
    if(inM>4.001)throw new Error("Measure "+(mi+1)+" has more than four beats. Try a part with a single voice.");
  });
  if(!events.some(e=>!e.rest))throw new Error("That part has no notes.");
  return finish({title:title.trim()||"Your part",sub:"Your music",fifths,N:measures.length,events});
}

const st={pieceIdx:0,tempo:76,warn:2,fadeMode:"beat3",metro:true,ex:null,playing:false,mode:null,hits:{},ptr:0,noteIdx:[],sim:[],geo:null,results:null,runKind:"sample"};
function nearTricky(ex,b){return ex.warnings.some(w=>b>=w.start-.51&&b<w.start+w.dur)}

/* ---------- drawing ---------- */
function el(tag,attrs,parent){const e=document.createElementNS(svgNS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);if(parent)parent.appendChild(e);return e}
function computeGeo(){
  const w=Math.max(320,$("#scoreWrap").clientWidth),N=st.ex.N;
  const mpl=w<640?2:4,lineH=132,lines=Math.ceil(N/mpl),keyW=Math.abs(st.ex.fifths)*9;
  return {w,mpl,lineH,lines,keyW,h:lines*lineH+6};
}
function mBox(m){const g=st.geo,line=Math.floor(m/g.mpl),idx=m%g.mpl,left=40+g.keyW+(line===0?26:4),mw=(g.w-left-6)/g.mpl;return {mx:left+idx*mw,mw,y0:line*g.lineH+50,line}}
function pos(b){const ex=st.ex;b=Math.max(0,Math.min(ex.total-.001,b));const m=Math.min(ex.N-1,Math.floor(b/4)),bx=mBox(m);return {x:bx.mx+14+((b-m*4)/4)*(bx.mw-26),y0:bx.y0,beatW:(bx.mw-26)/4,m}}
const yOf=(y0,s)=>y0+40-s*5;
function accGlyph(a){return a===1?"♯":a===-1?"♭":"♮"}

function drawRest(e,x,y0,g){
  if(e.tok==="wr")el("rect",{class:"rblock",x:x-6,y:y0+10,width:12,height:5},g);
  else if(e.tok==="hr")el("rect",{class:"rblock",x:x-6,y:y0+15,width:12,height:5},g);
  else if(e.tok==="qr")el("path",{class:"rest",d:`M${x-2} ${y0+8} l5 6 l-4 5 l5 7 c-5 -3 -8 1 -4 5`},g);
  else{el("circle",{class:"dot",cx:x-2,cy:y0+17,r:2.4},g);el("path",{class:"rest",d:`M${x-2} ${y0+18} c3 1 6 0 7 -3 l-5 15`},g);
    if(e.tok==="sr"){el("circle",{class:"dot",cx:x-4,cy:y0+24,r:2.2},g);el("path",{class:"rest",d:`M${x-4} ${y0+25} c3 1 5 0 6 -2`},g)}}
}
function render(){
  const ex=st.ex,g=st.geo=computeGeo(),svg=$("#score");
  svg.innerHTML="";svg.setAttribute("width",g.w);svg.setAttribute("height",g.h);svg.setAttribute("viewBox",`0 0 ${g.w} ${g.h}`);
  for(let L=0;L<g.lines;L++){
    const y0=L*g.lineH+50,lastM=Math.min(ex.N-1,(L+1)*g.mpl-1),xEnd=mBox(lastM).mx+mBox(lastM).mw;
    const staff=el("g",{class:"staff"},svg);
    for(let i=0;i<5;i++)el("line",{x1:6,x2:xEnd,y1:y0+i*10,y2:y0+i*10},staff);
    const c=el("text",{class:"clef",x:8,y:y0+33},svg);c.textContent="𝄞";
    const n=Math.abs(ex.fifths),steps=ex.fifths>0?SHARP_STEPS:FLAT_STEPS;
    for(let k=0;k<n;k++){const t=el("text",{class:"acc",x:40+k*9,y:yOf(y0,steps[k])+(ex.fifths>0?5:3)},svg);t.textContent=ex.fifths>0?"♯":"♭"}
    if(L===0)for(const yy of [y0+19,y0+39]){const t=el("text",{class:"tsig",x:42+g.keyW,y:yy},svg);t.textContent="4"}
    el("line",{class:"bar",x1:6,x2:6,y1:y0,y2:y0+40},svg);
  }
  for(let m=0;m<ex.N;m++){const b=mBox(m);el("line",{class:"bar"+(m===ex.N-1?" end":""),x1:b.mx+b.mw,x2:b.mx+b.mw,y1:b.y0,y2:b.y0+40},svg);
    if(m%g.mpl===0){const t=el("text",{class:"mnum",x:b.mx+2,y:b.y0-36},svg);t.textContent=m+1}}
  const hlG=el("g",{},svg);
  ex.warnings.forEach(w=>{if(w.label==="Over the break")return;
    const m=Math.floor(w.start/4),bx=mBox(m),p=pos(w.start),endB=Math.min(w.start+w.dur,(m+1)*4);
    const x2=endB>=(m+1)*4-1e-6?bx.mx+bx.mw-3:pos(endB).x-2;
    el("rect",{class:"hl",x:p.x-5,y:p.y0-9,width:Math.max(16,x2-p.x+5),height:58,rx:7},hlG)});
  ex.warnings.forEach((w,i)=>{const p=pos(w.start),gw=el("g",{class:"warn",id:"w"+i},svg),tw=w.label.length*6+16;
    el("rect",{x:p.x-4,y:p.y0-30,width:tw,height:17,rx:8.5},gw);
    const t=el("text",{x:p.x+4,y:p.y0-18},gw);t.textContent="! "+w.label;
    el("path",{d:`M${p.x+2} ${p.y0-13} v9`},gw)});
  // beam groups (eighths and sixteenths inside one beat)
  const groups=[];let cur=null;
  ex.events.forEach((e,i)=>{const inM=e.abs-e.m*4,beat=Math.floor(inM+1e-6);
    const beamable=!e.rest&&(e.tok==="e"||e.tok==="s")&&inM+e.dur<=beat+1+1e-6;
    if(beamable&&cur&&cur.m===e.m&&cur.beat===beat&&cur.last===i-1){cur.ids.push(i);cur.last=i}
    else{cur=beamable?{m:e.m,beat,ids:[i],last:i}:null;if(cur)groups.push(cur)}});
  const inGroup={};groups.forEach(gr=>{if(gr.ids.length>1)gr.ids.forEach(i=>inGroup[i]=gr)});
  const evG=[];
  ex.events.forEach((e,i)=>{
    const p=pos(e.abs),gx=el("g",{class:"ev",id:"ev"+i},svg);evG.push(gx);const x=p.x+6;
    if(e.rest){drawRest(e,x,p.y0,gx);return}
    const y=yOf(p.y0,e.step);
    if(e.step<=-2)for(let s=-2;s>=e.step;s-=2)el("line",{class:"ledger",x1:x-9,x2:x+9,y1:yOf(p.y0,s),y2:yOf(p.y0,s)},gx);
    if(e.step>=10)for(let s=10;s<=e.step;s+=2)el("line",{class:"ledger",x1:x-9,x2:x+9,y1:yOf(p.y0,s),y2:yOf(p.y0,s)},gx);
    if(e.acc!==null){const t=el("text",{class:"acc",x:x-17,y:y+(e.acc===-1?3:5)},gx);t.textContent=accGlyph(e.acc)}
    const hollow=e.tok==="h"||e.tok==="dh"||e.tok==="w";
    el("ellipse",{class:"head"+(hollow?" hollow":""),cx:x,cy:y,rx:5.9,ry:4.3,transform:`rotate(-20 ${x} ${y})`},gx);
    if(e.tok==="dq"||e.tok==="dh"||e.tok==="de")el("circle",{class:"dot",cx:x+10,cy:y-(e.step%2===0?2.5:0),r:1.9},gx);
    if(e.tok==="w")return;
    if(inGroup[i])return;
    const up=e.step<4,sx=up?x+5.4:x-5.4,ye=up?y-33:y+33;
    el("line",{class:"stem",x1:sx,x2:sx,y1:y,y2:ye},gx);
    if(e.tok==="e"||e.tok==="s"||e.tok==="de"){const dir=up?1:-1;
      el("path",{class:"flag",d:`M${sx} ${ye} c1 ${6*dir} 9 ${8*dir} 7 ${17*dir}`},gx);
      if(e.tok==="s")el("path",{class:"flag",d:`M${sx} ${ye+7*dir} c1 ${6*dir} 9 ${8*dir} 7 ${17*dir}`},gx)}
  });
  groups.filter(gr=>gr.ids.length>1).forEach(gr=>{
    const evs=gr.ids.map(i=>ex.events[i]),avg=evs.reduce((a,e)=>a+e.step,0)/evs.length,up=avg<4;
    const pts=gr.ids.map(i=>{const e=ex.events[i],p=pos(e.abs),x=p.x+6;return{x:up?x+5.4:x-5.4,y:yOf(p.y0,e.step),e}});
    const by=up?Math.min(...pts.map(p=>p.y))-31:Math.max(...pts.map(p=>p.y))+31;
    const host=evG[gr.ids[gr.ids.length-1]];
    pts.forEach(p=>el("line",{class:"stem",x1:p.x,x2:p.x,y1:p.y,y2:by},host));
    const th=4.4,dir=up?1:-1,y1=up?by:by-th;
    el("rect",{class:"beam",x:pts[0].x-.6,y:y1,width:pts[pts.length-1].x-pts[0].x+1.2,height:th},host);
    for(let k=0;k<pts.length-1;k++)if(pts[k].e.tok==="s"&&pts[k+1].e.tok==="s")
      el("rect",{class:"beam",x:pts[k].x-.6,y:y1+7*dir,width:pts[k+1].x-pts[k].x+1.2,height:th},host);
  });
  const cv=el("g",{id:"covers"},svg);
  for(let m=0;m<ex.N;m++){const bx=mBox(m);el("rect",{class:"cover",id:"cv"+m,x:bx.mx-2,y:bx.y0-48,width:bx.mw+4,height:108,opacity:0},cv)}
  el("g",{id:"marks"},svg);
  const ov=el("g",{id:"overlay"},svg);
  el("line",{class:"play-line",id:"pLine",x1:0,x2:0,y1:0,y2:0},ov);
  drawMarks();setOverlay(st.playing?st.curB||0:0);
}
function setOverlay(b){
  const ex=st.ex,pb=Math.max(0,b),pp=pos(pb);
  const L=$("#pLine");L.setAttribute("x1",pp.x+6);L.setAttribute("x2",pp.x+6);L.setAttribute("y1",pp.y0-8);L.setAttribute("y2",pp.y0+48);
  const playing=st.playing&&b>=0;
  const mode=st.fadeMode,fb=mode==="slow"?4:.2,off=mode==="start"?0:mode==="beat3"?2:4;
  for(let m=0;m<ex.N;m++){const c=document.getElementById("cv"+m);if(!c)continue;
    const t=playing&&mode!=="off"?Math.max(0,Math.min(1,(b-(m*4+off))/fb)):0;c.setAttribute("opacity",t.toFixed(3))}
  ex.warnings.forEach((w,i)=>{const g=document.getElementById("w"+i);if(!g)return;
    if(!st.playing){g.classList.remove("off");g.classList.toggle("rest-dim",st.warn===0);return}
    g.classList.remove("rest-dim");g.classList.toggle("off",!(st.warn>0&&b>=w.start-st.warn&&b<w.start+w.dur))});
}
function drawMarks(){
  const g=$("#marks");if(!g)return;g.innerHTML="";const R=st.results;if(!R)return;
  R.items.forEach(it=>{const p=pos(it.e.abs),x=p.x+6,y=p.y0+66;
    if(it.s==="ok")el("circle",{class:"mk-ok",cx:x,cy:y,r:2.4},g);
    else if(it.s==="early")el("circle",{class:"mk-early",cx:x,cy:y,r:2.6},g);
    else if(it.s==="late")el("circle",{class:"mk-late",cx:x,cy:y,r:4.3},g);
    else el("circle",{class:"mk-miss",cx:x,cy:y,r:4.3},g)});
}

/* ---------- scoring ---------- */
function scoreRun(){
  const ex=st.ex,items=[];
  ex.events.forEach((e,i)=>{if(e.rest)return;const d=st.hits[i];
    const s=d===undefined?"miss":d>=.2?"late":d<=-.22?"early":"ok";items.push({e,i,s,d})});
  const hes=items.filter(it=>it.s==="late"||it.s==="miss");
  const tricky=hes.filter(it=>nearTricky(ex,it.e.abs));
  const rate=hes.length/items.length;
  const i0=FADES.indexOf(st.fadeMode);let nFade=st.fadeMode,nWarn=st.warn,msg;
  if(rate<=.12){nFade=FADES[Math.min(FADES.length-1,i0+1)];nWarn=Math.max(0,st.warn-.5);
    msg=`Solid run. Next time: measures ${FADE_TXT[nFade]}, and reminders ${nWarn?`appear ${fmtBeats(nWarn)} early`:"switch off"}.`}
  else if(rate>=.28){nFade=FADES[Math.max(0,i0-1)];nWarn=Math.min(4,st.warn+.5);
    msg=`Lots of stalls${tricky.length?`, mostly at ${topLabel(tricky)}`:""}. Easing back: measures ${FADE_TXT[nFade]}, reminders ${fmtBeats(nWarn)} early.`}
  else msg=`Getting there${tricky.length?`; ${topLabel(tricky)} still caused stalls`:""}. Keep the same settings for another round.`;
  return {items,hes,tricky,nFade,nWarn,msg,fade:st.fadeMode};
}
function labelAt(b){const w=st.ex.warnings.find(w=>b>=w.start-.51&&b<w.start+w.dur);return w?w.label:null}
function topLabel(list){const c={};list.forEach(it=>{const l=labelAt(it.e.abs);if(l)c[l]=(c[l]||0)+1});
  const k=Object.keys(c).sort((a,b)=>c[b]-c[a])[0];if(!k)return "tricky spots";const l=k.toLowerCase();return l==="over the break"?"crossings over the break":l.endsWith("s")?l:l+"s"}
const FADES=["off","slow","next","beat3","start"];
const FADE_TXT={off:"stay on the page",slow:"fade slowly behind you",next:"disappear when you reach the next one",beat3:"disappear on beat 3",start:"disappear as soon as you start playing them"};
const FADE_SHORT={off:"Off",slow:"Slowly",next:"Next measure",beat3:"On beat 3",start:"On the downbeat"};
function fmtBeats(n){return n===1?"1 beat":(n%1?n.toFixed(1).replace(".5","½").replace(/^0/,""):n)+" beats"}
function beatName(abs){const inM=abs%4,b=Math.floor(inM+1e-6)+1,f=Math.round((inM%1)*4);return b+["","e","&","a"][f]}
function showReport(){
  const R=st.results;if(!R)return;
  const kinds={sample:"Sample run · simulated student",demo:"Demo run · simulated student",play:"Your run"};
  $("#runKind").textContent=kinds[st.runKind];
  $("#tOn").textContent=`${R.items.filter(i=>i.s==="ok").length}/${R.items.length}`;
  $("#tHes").textContent=R.hes.length;$("#tTricky").textContent=R.tricky.length;$("#tLead").textContent=FADE_SHORT[R.fade];
  const ul=$("#spots");ul.innerHTML="";
  if(!R.hes.length){ul.innerHTML='<li><span class="chip plain">Clean</span>No hesitations this run.</li>'}
  R.hes.slice(0,7).forEach(it=>{const li=document.createElement("li"),l=labelAt(it.e.abs);
    li.innerHTML=`<span class="where">m.${it.e.m+1} beat ${beatName(it.e.abs)}</span><span>${it.s==="miss"?"Stalled":`${it.d.toFixed(2)} beat late`}</span>`+(l?` <span class="chip">${l}</span>`:"");ul.appendChild(li)});
  if(R.hes.length>7){const li=document.createElement("li");li.innerHTML=`<span class="where"></span><span>+ ${R.hes.length-7} more</span>`;ul.appendChild(li)}
  $("#recText").textContent=R.msg;$("#applyBtn").hidden=false;
}
function clearReport(){
  $("#runKind").textContent="No run yet";["#tOn","#tHes","#tTricky"].forEach(q=>$(q).textContent="–");$("#tLead").textContent=FADE_SHORT[st.fadeMode];
  $("#spots").innerHTML='<li><span class="chip plain">Ready</span>Press Start or watch the demo student to see where the reading breaks down.</li>';
  $("#recText").textContent="After a run, Sightline suggests a new look-ahead distance and reminder timing.";$("#applyBtn").hidden=true;
}

/* ---------- simulated student ---------- */
function simulate(r){
  const ex=st.ex,out=[];
  ex.events.forEach((e,i)=>{if(e.rest)return;const tr=nearTricky(ex,e.abs);
    const hard=Math.max(0,FADES.indexOf(st.fadeMode));
    const p=tr?Math.max(.08,.42-(st.warn>=1?.12:0)+.05*hard):.04+.01*hard;
    const jit=(r()+r()+r()-1.5)*.08;
    if(r()<p){if(tr&&r()<.3)return;out.push({i,b:e.abs+.24+r()*.3})}else out.push({i,b:e.abs+jit})});
  return out.sort((a,b)=>a.b-b.b);
}

/* ---------- audio + clock ---------- */
let ctx=null;
function audio(){if(!ctx){try{ctx=new(window.AudioContext||window.webkitAudioContext)()}catch(e){ctx=null}}if(ctx&&ctx.state==="suspended")ctx.resume();return ctx}
const clock=()=>ctx?ctx.currentTime:performance.now()/1000;
function click(t,acc){try{const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=acc?1560:1040;
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(acc?.45:.25,t+.003);g.gain.exponentialRampToValueAtTime(.0001,t+.05);
  o.connect(g);g.connect(ctx.destination);o.start(t);o.stop(t+.06)}catch(e){}}
function tick(){if(!ctx)return;try{const t=ctx.currentTime,o=ctx.createOscillator(),g=ctx.createGain();o.type="triangle";o.frequency.value=620;
  g.gain.setValueAtTime(.18,t);g.gain.exponentialRampToValueAtTime(.0001,t+.07);o.connect(g);g.connect(ctx.destination);o.start(t);o.stop(t+.08)}catch(e){}}

/* ---------- run control ---------- */
function setBusy(b){["#piece","#file","#key","#focus","#genBtn"].forEach(q=>$(q).disabled=b);$("#origBtn").disabled=b||!st.rhythmEx;$("#applyBtn").disabled=b}
function start(mode){
  if(st.playing){stop(false);return}
  audio();st.mode=mode;st.hits={};st.ptr=0;
  st.noteIdx=st.ex.events.map((e,i)=>e.rest?-1:i).filter(i=>i>=0);
  st.spb=60/st.tempo;st.T0=clock()+.25;
  if(ctx&&st.metro){for(let k=0;k<4+st.ex.total;k++)click(st.T0+k*st.spb,k%4===0)}
  st.sim=mode==="demo"?simulate(rng(Date.now()&0xffff)):[];
  st.playing=true;st.results=null;drawMarks();setBusy(true);
  $("#playBtn").textContent=mode==="play"?"Stop":"▶ Start Tap Along";$("#demoBtn").textContent=mode==="demo"?"Stop demo":"Watch a demo student";
  $("#playBtn").disabled=mode==="demo";$("#demoBtn").disabled=mode==="play";
  const pad=$("#pad");pad.disabled=mode!=="play";pad.classList.toggle("armed",mode==="play");
  pad.textContent=mode==="play"?"Tap here on every note (or press Space) 👏":"Demo student is tapping…";
  requestAnimationFrame(frame);
}
function frame(){
  if(!st.playing)return;
  const b=(clock()-st.T0)/st.spb-4;st.curB=b;
  const s=$("#status");s.classList.add("live");
  if(b<0)s.textContent="Count-in "+Math.min(4,Math.floor(b+4)+1);
  else s.textContent=`m.${Math.min(st.ex.N,Math.floor(b/4)+1)} · ${st.mode==="demo"?"demo":"playing"}`;
  setOverlay(b);
  while(st.sim.length&&st.sim[0].b<=b){const t=st.sim.shift();st.hits[t.i]=t.b-st.ex.events[t.i].abs;flash()}
  if(b>st.ex.total+.7)stop(true);else requestAnimationFrame(frame);
}
function stop(done){
  st.playing=false;const s=$("#status");s.classList.remove("live");s.textContent=done?"Done":"Stopped";
  $("#playBtn").textContent="▶ Start Tap Along";$("#demoBtn").textContent="Watch a demo student";
  ["#playBtn","#demoBtn"].forEach(q=>$(q).disabled=false);setBusy(false);
  const pad=$("#pad");pad.disabled=true;pad.classList.remove("armed");pad.textContent="Press “Start Tap Along”, then tap here (or Space) on every note";
  if(done){st.runKind=st.mode;st.results=scoreRun();st.lastResults=Object.assign({ex:st.ex},st.results);showReport()}
  render();
}
function userTap(){
  if(!st.playing||st.mode!=="play")return;
  tick();flash();
  const ex=st.ex,beat=(clock()-st.T0)/st.spb-4,N=st.noteIdx;
  while(st.ptr<N.length){const e=ex.events[N[st.ptr]],d=beat-e.abs;
    if(d<-.3)return;
    if(d>.6){st.ptr++;continue}
    const nx=N[st.ptr+1];if(nx!==undefined){const dn=beat-ex.events[nx].abs;if(d>.2&&Math.abs(dn)<Math.abs(d)){st.ptr++;continue}}
    st.hits[N[st.ptr]]=d;st.ptr++;return}
}
function flash(){const p=$("#pad");p.classList.add("hit");setTimeout(()=>p.classList.remove("hit"),90)}

function applyView(){
  const src=st.rhythmEx||st.base,ex=st.key==="orig"?src:transpose(src,+st.key);
  st.ex=ex;st.results=null;
  $("#exTitle").textContent=`${ex.title} · ${ex.sub} · ${keyName(ex.fifths)}${st.rhythmEx?" · new rhythms":""}`;
  $("#status").textContent="Ready";$("#origBtn").disabled=!st.rhythmEx;render();clearReport();
}
function setBase(ex){
  st.base=ex;st.rhythmEx=null;st.key="orig";
  const ks=$("#key");ks.innerHTML="";
  const o0=document.createElement("option");o0.value="orig";o0.textContent=`Key: ${keyName(ex.fifths)} (original)`;ks.appendChild(o0);
  for(let f=-3;f<=3;f++){if(f===ex.fifths)continue;const o=document.createElement("option");o.value=f;o.textContent=`Key: ${keyName(f)}`;ks.appendChild(o)}
  ks.value="orig";applyView();
}
const FOCUS_NAME={dotted:"dotted rhythms",sync:"syncopation",six:"sixteenths",mixed:"a mix of tricky rhythms"};
function autoFocus(){
  const R=st.lastResults;if(!R||!R.tricky.length)return "mixed";
  const map={"Dotted rhythm":"dotted","Syncopation":"sync","Sixteenths":"six"},c={};
  R.tricky.forEach(it=>{const f=map[labelAtIn(R.ex,it.e.abs)];if(f)c[f]=(c[f]||0)+1});
  return Object.keys(c).sort((a,b)=>c[b]-c[a])[0]||"mixed";
}
function labelAtIn(ex,b){const w=ex.warnings.find(w=>b>=w.start-.51&&b<w.start+w.dur);return w?w.label:null}

/* ---------- wiring ---------- */
const sel=$("#piece");
PIECES.forEach((p,i)=>{const o=document.createElement("option");o.value=i;o.textContent=`${p.title} (${p.level})`;sel.appendChild(o)});
sel.value=st.pieceIdx;
function syncOut(){$("#tempoOut").textContent=st.tempo+" bpm";
  $("#warnOut").textContent=st.warn?fmtBeats(st.warn)+" early":"Off"}
$("#tempo").addEventListener("input",e=>{st.tempo=+e.target.value;syncOut()});
$("#warn").addEventListener("input",e=>{st.warn=+e.target.value;syncOut();if(!st.playing)setOverlay(0)});
sel.addEventListener("change",e=>{if(e.target.value==="user"&&st.userEx){setBase(st.userEx);return}st.pieceIdx=+e.target.value;setBase(buildPiece(PIECES[st.pieceIdx]))});
$("#key").addEventListener("change",e=>{st.key=e.target.value;applyView()});
$("#genBtn").addEventListener("click",()=>{
  const sel2=$("#focus").value,focus=sel2==="auto"?autoFocus():sel2;
  st.rhythmEx=rhythmize(st.base,focus,rng((Date.now()^Math.floor(Math.random()*1e9))&0x7fffffff));applyView();
  const msg=$("#optMsg");msg.className="note-msg";
  msg.textContent=`New rhythms built around ${FOCUS_NAME[focus]}${sel2==="auto"?(st.lastResults&&st.lastResults.tricky.length?", where the last run stalled":" (no run yet, so a mix)"):""}. Same notes, new rhythm. Press again for another version.`;
});
$("#origBtn").addEventListener("click",()=>{st.rhythmEx=null;applyView();$("#optMsg").textContent="Back to the original rhythms."});
$("#file").addEventListener("change",e=>{
  const f=e.target.files&&e.target.files[0];if(!f)return;const msg=$("#fileMsg");
  if(/\.mxl$/i.test(f.name)){msg.className="note-msg err";msg.textContent="That's a compressed .mxl file. Export it again as uncompressed MusicXML (.musicxml or .xml).";e.target.value="";return}
  const r=new FileReader();
  r.onload=()=>{try{const ex=parseMusicXML(String(r.result));st.userEx=ex;
      let o=sel.querySelector('option[value="user"]');if(!o){o=document.createElement("option");o.value="user";sel.appendChild(o)}
      o.textContent=`${ex.title} (your music)`;sel.value="user";setBase(ex);
      msg.className="note-msg";msg.textContent=`Loaded ${ex.N} measures from ${f.name}. Sightline found ${ex.warnings.length} tricky spot${ex.warnings.length===1?"":"s"}.`}
    catch(err){msg.className="note-msg err";msg.textContent=err.message}
    e.target.value=""};
  r.onerror=()=>{msg.className="note-msg err";msg.textContent="Couldn't read that file. Try choosing it again."};
  r.readAsText(f);
});
$("#fadeMode").addEventListener("change",e=>{st.fadeMode=e.target.value;if(!st.results)$("#tLead").textContent=FADE_SHORT[st.fadeMode]});
$("#metro").addEventListener("change",e=>st.metro=e.target.checked);
$("#playBtn").addEventListener("click",()=>start("play"));
$("#demoBtn").addEventListener("click",()=>start("demo"));
$("#applyBtn").addEventListener("click",()=>{if(st.results){st.fadeMode=st.results.nFade;st.warn=st.results.nWarn;
  $("#fadeMode").value=st.fadeMode;$("#warn").value=st.warn;syncOut();st.results=null;render();clearReport();$("#recText").textContent=`Settings applied: measures ${FADE_TXT[st.fadeMode]}, reminders ${st.warn?fmtBeats(st.warn)+" early":"off"}. Play it again.`}});
$("#pad").addEventListener("pointerdown",e=>{e.preventDefault();userTap()});
document.addEventListener("keydown",e=>{if(e.code==="Space"&&st.playing&&st.mode==="play"){e.preventDefault();if(!e.repeat)userTap()}});
let rt;window.addEventListener("resize",()=>{clearTimeout(rt);rt=setTimeout(()=>{if(st.ex)render()},120)});

// initial state: the first piece with a simulated sample run already scored
syncOut();setBase(buildPiece(PIECES[st.pieceIdx]));
st.hits={};simulate(rng(42)).forEach(t=>st.hits[t.i]=t.b-st.ex.events[t.i].abs);
st.runKind="sample";st.results=scoreRun();st.lastResults=Object.assign({ex:st.ex},st.results);showReport();drawMarks();
})();
