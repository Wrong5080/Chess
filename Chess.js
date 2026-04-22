
/* ═══════════════════════════════════════════════════════════════════
   AUDIO ENGINE
═══════════════════════════════════════════════════════════════════ */
const AUDIO=(()=>{
  let ctx=null,sfxBus=null,musicBus=null,sfxOn=true,musicOn=true;
  const EL={bg:document.getElementById('aud-bg'),move:document.getElementById('aud-move'),capture:document.getElementById('aud-capture'),victory:document.getElementById('aud-victory'),defeat:document.getElementById('aud-defeat')};
  const loaded={};
  Object.entries(EL).forEach(([k,el])=>{el.addEventListener('canplaythrough',()=>{loaded[k]=true},{once:true});el.load();});

  function init(){
    if(ctx)return;
    try{ctx=new(window.AudioContext||window.webkitAudioContext)();sfxBus=ctx.createGain();sfxBus.gain.value=0.85;sfxBus.connect(ctx.destination);musicBus=ctx.createGain();musicBus.gain.value=0.26;musicBus.connect(ctx.destination);}catch(e){sfxOn=false;musicOn=false;}
  }
  const res=()=>ctx?.state==='suspended'&&ctx.resume();
  const mkG=(v,d,t,bus=sfxBus)=>{const g=ctx.createGain();g.connect(bus);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(1e-4,t+d);return g;};
  const mkO=(tp,f,g,t,d)=>{const o=ctx.createOscillator();o.type=tp;o.frequency.value=f;o.connect(g);o.start(t);o.stop(t+d+.02);return o;};
  const mkN=(t,v,d,fc=1800,q=.6,bus=sfxBus)=>{const n=Math.ceil(ctx.sampleRate*d),buf=ctx.createBuffer(1,n,ctx.sampleRate),da=buf.getChannelData(0);for(let i=0;i<n;i++)da[i]=Math.random()*2-1;const s=ctx.createBufferSource();s.buffer=buf;const f=ctx.createBiquadFilter();f.type='bandpass';f.frequency.value=fc;f.Q.value=q;const g=mkG(v,d,t,bus);s.connect(f);f.connect(g);s.start(t);s.stop(t+d+.02);};

  const SFX={
    move(){const t=ctx.currentTime;const g=mkG(.18,.1,t);mkO('square',680,g,t,.1);mkG(.14,.14,t);mkO('sine',88,mkG(.14,.14,t),t,.14);mkN(t,.1,.07,1100,.5);},
    capture(){const t=ctx.currentTime;const gI=mkG(.5,.35,t);const oI=ctx.createOscillator();oI.type='sine';oI.frequency.setValueAtTime(230,t);oI.frequency.exponentialRampToValueAtTime(36,t+.28);oI.connect(gI);oI.start(t);oI.stop(t+.38);mkO('square',260,mkG(.28,.12,t+.01),t+.01,.1);mkN(t,.55,.1,2800,.5);mkN(t+.04,.32,.16,750,.4);},
    check(){const t=ctx.currentTime;[660,830,1060].forEach((f,i)=>{const d=t+i*.12;mkO('sine',f,mkG(.2,.18,d),d,.2);mkO('sawtooth',f*2,mkG(.07,.16,d),d,.18);mkN(d,.09,.06,f*1.5,1.2);});mkO('triangle',880,mkG(.09,.85,t+.4),t+.4,.88);},
    castle(){const t=ctx.currentTime;const n=ctx.sampleRate*.42,buf=ctx.createBuffer(1,Math.ceil(n),ctx.sampleRate),d=buf.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;const s=ctx.createBufferSource();s.buffer=buf;const fl=ctx.createBiquadFilter();fl.type='lowpass';fl.frequency.setValueAtTime(4000,t);fl.frequency.exponentialRampToValueAtTime(360,t+.36);const g=mkG(.34,.38,t);s.connect(fl);fl.connect(g);s.start(t);s.stop(t+.44);mkO('square',540,mkG(.18,.22,t),t,.22);mkN(t,.25,.1,850,.5);mkO('square',420,mkG(.12,.16,t+.3),t+.3,.16);},
    promote(){const t=ctx.currentTime;[523,659,784,1047].forEach((f,i)=>{const d=t+i*.07;mkO('triangle',f,mkG(.14,.42,d),d,.44);mkO('sine',f*1.5,mkG(.055,.3,d),d,.32);});},
    end(){const t=ctx.currentTime;[146.83,174.61,220,261.63,293.66].forEach((f,i)=>{const d=t+i*.13;const g=ctx.createGain();g.connect(sfxBus);g.gain.setValueAtTime(0,d);g.gain.linearRampToValueAtTime(.12,d+.08);g.gain.exponentialRampToValueAtTime(1e-4,d+2.2);mkO('triangle',f,g,d,2.2);const g2=ctx.createGain();g2.connect(sfxBus);g2.gain.setValueAtTime(0,d);g2.gain.linearRampToValueAtTime(.055,d+.05);g2.gain.exponentialRampToValueAtTime(1e-4,d+1.8);mkO('sine',f*2,g2,d,1.8);});setTimeout(()=>{const tb=ctx.currentTime;mkO('triangle',440,mkG(.2,2.8,tb),tb,2.9);mkO('sine',880,mkG(.08,2,tb),tb,2.1);},820);},
    select(){const t=ctx.currentTime;mkO('square',1060,mkG(.07,.06,t),t,.06);mkN(t,.04,.04,2800,.8);},
    error(){const t=ctx.currentTime;mkO('square',108,mkG(.11,.22,t),t,.24);mkN(t,.07,.13,190,.4);},
    clock(){const t=ctx.currentTime;mkO('square',880,mkG(.16,.05,t),t,.05);},
    resign(){const t=ctx.currentTime;[440,415,392,370].forEach((f,i)=>{setTimeout(()=>{if(!ctx)return;const tb=ctx.currentTime;mkO('sine',f,mkG(.12,.3,tb),tb,.35);},i*120);});},
  };

  const MUSIC=(()=>{
    let timer=null,playing=false,nextTime=0,beat=0,phraseIdx=0;
    const BPM=52,BEAT=60/BPM;
    const S={D3:146.83,F3:174.61,G3:196,A3:220,Bb3:233.08,C4:261.63,D4:293.66,E4:329.63,F4:349.23,G4:392,A4:440,Bb4:466.16,C5:523.25,D5:587.33,E5:659.25};
    const PH=[{bass:S.D3,chord:[S.D4,S.F4,S.A4],melody:[S.D5,S.C5,S.A4,S.G4]},{bass:116.54,chord:[S.Bb3*2,S.D4,S.F4],melody:[S.F4,S.E4,S.D4,S.C4]},{bass:110,chord:[S.A3*2,S.C4,S.E4],melody:[S.E5,S.D5,S.C5,S.A4]},{bass:98,chord:[S.G3*2,S.Bb3*2,S.D4],melody:[S.G4,S.F4,S.E4,S.D4]}];
    const note=(f,v,atk,sus,rel,tp='triangle',bus=musicBus)=>{if(!ctx||!playing)return;const t=nextTime,g=ctx.createGain();g.connect(bus);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+atk);g.gain.setValueAtTime(v,t+atk+sus);g.gain.exponentialRampToValueAtTime(1e-4,t+atk+sus+rel);const o=ctx.createOscillator();o.type=tp;o.frequency.value=f;o.connect(g);o.start(t);o.stop(t+atk+sus+rel+.05);};
    const tick=v=>{if(!ctx||!playing)return;const t=nextTime,buf=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*.04),ctx.sampleRate),d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;const s=ctx.createBufferSource();s.buffer=buf;const f=ctx.createBiquadFilter();f.type='highpass';f.frequency.value=6000;const g=ctx.createGain();g.connect(musicBus);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(1e-4,t+.04);s.connect(f);f.connect(g);s.start(t);s.stop(t+.05);};
    const pad=(f,v,dur)=>{if(!ctx||!playing)return;const t=nextTime,g=ctx.createGain();g.connect(musicBus);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+1.5);g.gain.setValueAtTime(v,t+dur-1.5);g.gain.linearRampToValueAtTime(1e-4,t+dur);const o=ctx.createOscillator();o.type='sine';o.frequency.value=f;o.detune.setValueAtTime(-3,t);o.detune.linearRampToValueAtTime(3,t+dur*.5);o.detune.linearRampToValueAtTime(-3,t+dur);o.connect(g);o.start(t);o.stop(t+dur+.1);};
    function sched(){const ph=PH[phraseIdx],b=beat%8;
      if(b===0||b===4){note(ph.bass,.42,.04,.32,.5,'sine');note(ph.bass*2,.16,.04,.2,.4,'triangle');}
      if(b===6){const np=PH[(phraseIdx+1)%4];note((ph.bass+np.bass)/2,.26,.03,.15,.35,'sine');}
      if(b===1||b===3||b===5||b===7)note(ph.chord[Math.floor(b/2)%ph.chord.length],.12,.02,.1,.55,'triangle');
      if(b===2||b===4)note(ph.chord[(b/2)%ph.chord.length],.09,.02,.08,.45,'triangle');
      if(b===0||b===2||b===5){const mi=(beat+phraseIdx)%ph.melody.length;note(ph.melody[mi],.07+Math.random()*.04,.03,.12,.7,'triangle');}
      if(b===0){pad(ph.bass*2,.05,BEAT*8*.8);pad(ph.chord[1],.034,BEAT*8*.7);pad(ph.chord[2]||ph.chord[0],.027,BEAT*8*.65);}
      tick(b===0?.16:.06);
      const sv=nextTime;nextTime+=BEAT*.5;tick(.032);nextTime=sv;
      nextTime+=BEAT;beat++;if(beat%8===0)phraseIdx=(phraseIdx+1)%4;
    }
    return{
      start(){if(!ctx||playing)return;playing=true;nextTime=ctx.currentTime+.05;beat=0;phraseIdx=0;timer=setInterval(()=>{while(nextTime<ctx.currentTime+.12)sched();},25);document.getElementById('musicViz')?.classList.add('playing');document.getElementById('trackName').textContent='♩ AMBIENT CLOCKWORK';},
      stop(){playing=false;clearInterval(timer);document.getElementById('musicViz')?.classList.remove('playing');document.getElementById('trackName').textContent='— PAUSED —';},
    };
  })();

  const playEl=(id,vol=1)=>{const el=EL[id];if(!el||!loaded[id])return false;try{el.volume=vol;el.currentTime=0;el.play().catch(()=>{});return true;}catch(e){return false;}};

  return{
    init(){init();if(musicOn){const el=EL.bg;if(el){el.volume=0.35;el.play().catch(()=>{if(ctx)MUSIC.start();});}else if(ctx)MUSIC.start();}},
    play(name){if(!sfxOn)return;init();res();const hm={move:'move',capture:'capture'};if(hm[name]&&playEl(hm[name],.8))return;SFX[name]?.();},
    playVictory(){init();res();if(!ctx&&!playEl('victory',.9))return;if(!playEl('victory',.9))SFX.end();},
    playDefeat(){init();res();if(!ctx&&!playEl('defeat',.9))return;if(!playEl('defeat',.9))SFX.end();},
    toggleSfx(){sfxOn=!sfxOn;['mTog','gTog'].forEach(id=>{const el=document.getElementById(id);if(el)el.className='tog'+(sfxOn?' on':'');});},
    toggleMusic(){musicOn=!musicOn;['mscTog'].forEach(id=>{const el=document.getElementById(id);if(el)el.className='tog'+(musicOn?' on':'');});if(musicOn){EL.bg?.play().catch(()=>MUSIC.start());MUSIC.start();}else{EL.bg?.pause();MUSIC.stop();}},
    startMusic(){if(!musicOn)return;init();EL.bg?.play().catch(()=>MUSIC.start());MUSIC.start();},
    stopMusic(){EL.bg?.pause();MUSIC.stop();},
  };
})();

/* ═══════════════════════════════════════════════════════════════════
   SVG PIECE ART
═══════════════════════════════════════════════════════════════════ */
let _sid=0;
function pieceSVG(code,size=52){
  const cl=code[0],tp=code[1],id='p'+(++_sid);
  const W={body:'#f2e6c4',body2:'#e0ceaa',stroke:'#987018',accent:'#c89020',base:'#b07018',shine:'rgba(255,255,255,.72)',shadow:'rgba(70,35,0,.5)',eye:'#7a3808',gem:'#c84818',gemShine:'rgba(255,200,160,.7)'};
  const B={body:'#1c1028',body2:'#130c1c',stroke:'#881818',accent:'#c01e1e',base:'#6c1212',shine:'rgba(255,100,70,.32)',shadow:'rgba(0,0,0,.8)',eye:'#ff5030',gem:'#dd2020',gemShine:'rgba(255,140,120,.6)'};
  const C=cl==='w'?W:B;
  return`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56" width="${size}" height="${size}"><defs><radialGradient id="bd${id}" cx="38%" cy="32%" r="68%"><stop offset="0%" stop-color="${C.body}"/><stop offset="100%" stop-color="${C.body2}"/></radialGradient><radialGradient id="gm${id}" cx="35%" cy="30%" r="65%"><stop offset="0%" stop-color="${C.gem}"/><stop offset="100%" stop-color="${C.base}"/></radialGradient></defs><ellipse cx="28" cy="51.5" rx="13" ry="3.2" fill="${C.shadow}" opacity=".5"/><path d="M16,49 Q28,54 40,49 L38.5,44 Q28,48 17.5,44 Z" fill="${C.base}"/><path d="M17.5,44 Q28,48 38.5,44 L37.5,41.5 Q28,45 18.5,41.5 Z" fill="${C.accent}" opacity=".75"/>
${tp==='P'?`<path d="M22,41.5 Q20.5,34 21.5,27.5 Q23.5,20 28,17.5 Q32.5,20 34.5,27.5 Q35.5,34 34,41.5 Z" fill="url(#bd${id})" stroke="${C.stroke}" stroke-width="1.6"/><path d="M22,35 Q28,37.5 34,35" stroke="${C.accent}" stroke-width="1" fill="none" opacity=".65"/><circle cx="28" cy="13.5" r="9.5" fill="url(#bd${id})" stroke="${C.stroke}" stroke-width="1.6"/><ellipse cx="24.5" cy="10.5" rx="3.2" ry="2.2" fill="${C.shine}" opacity=".75"/>`:tp==='R'?`<path d="M19.5,41.5 L18.5,28 L18.5,25.5 L20.5,25.5 L20.5,21.5 L35.5,21.5 L35.5,25.5 L37.5,25.5 L37.5,28 L36.5,41.5 Z" fill="url(#bd${id})" stroke="${C.stroke}" stroke-width="1.6" stroke-linejoin="round"/><rect x="17.5" y="13.5" width="6" height="10" rx=".6" fill="url(#bd${id})" stroke="${C.stroke}" stroke-width="1.6"/><rect x="25" y="13.5" width="6" height="10" rx=".6" fill="url(#bd${id})" stroke="${C.stroke}" stroke-width="1.6"/><rect x="32.5" y="13.5" width="6" height="10" rx=".6" fill="url(#bd${id})" stroke="${C.stroke}" stroke-width="1.6"/><path d="M19.5,34 L36.5,34" stroke="${C.accent}" stroke-width="1" opacity=".55"/><rect x="18" y="14" width="5" height="1.6" rx=".4" fill="${C.shine}" opacity=".6"/><rect x="25.5" y="14" width="5" height="1.6" rx=".4" fill="${C.shine}" opacity=".6"/><rect x="33" y="14" width="5" height="1.6" rx=".4" fill="${C.shine}" opacity=".6"/>`:tp==='B'?`<path d="M23,41.5 Q21.5,33 22.5,25 Q24,17.5 28,15 Q32,17.5 33.5,25 Q34.5,33 33,41.5 Z" fill="url(#bd${id})" stroke="${C.stroke}" stroke-width="1.6"/><path d="M23,34.5 Q28,37 33,34.5" stroke="${C.accent}" stroke-width="1" fill="none" opacity=".65"/><ellipse cx="28" cy="21" rx="5" ry="2" fill="${C.accent}" opacity=".48"/><circle cx="28" cy="10" r="7" fill="url(#bd${id})" stroke="${C.stroke}" stroke-width="1.6"/><circle cx="28" cy="4.5" r="3.2" fill="url(#gm${id})" stroke="${C.stroke}" stroke-width="1"/><circle cx="27" cy="3.8" r="1.1" fill="${C.gemShine}" opacity=".85"/><ellipse cx="25" cy="8" rx="2.8" ry="2" fill="${C.shine}" opacity=".7"/>`:tp==='N'?`<path d="M21,41.5 L21,31 Q20,23 23.5,16.5 Q26,9.5 28.5,7.5 Q31,9 33.5,13.5 Q36,18.5 35,24.5 Q34,29 30.5,31 Q34,31 37,34 Q38.5,37.5 37,40.5 L33.5,40.5 Q35,37.5 33,35.5 Q30.5,33.5 27.5,34 L25.5,34 L25,41.5 Z" fill="url(#bd${id})" stroke="${C.stroke}" stroke-width="1.6" stroke-linejoin="round"/><path d="M24.5,15 Q22.5,21 22.5,28.5" stroke="${C.stroke}" stroke-width=".9" fill="none" opacity=".38"/><path d="M28.5,7.5 Q30.5,4.5 32.5,6 Q31.5,9 29.5,10 Z" fill="${C.body2}" stroke="${C.stroke}" stroke-width="1.1"/><circle cx="32" cy="14" r="2.4" fill="${C.eye}" stroke="${C.stroke}" stroke-width=".9"/><circle cx="31.4" cy="13.4" r="1" fill="${C.shine}" opacity=".9"/><path d="M22,36 Q27.5,38.5 34,36" stroke="${C.accent}" stroke-width="1.1" fill="none" opacity=".6"/>`:tp==='Q'?`<path d="M19.5,41.5 Q18.5,32 20.5,25 Q22.5,18.5 28,17 Q33.5,18.5 35.5,25 Q37.5,32 36.5,41.5 Z" fill="url(#bd${id})" stroke="${C.stroke}" stroke-width="1.6"/><path d="M21.5,32 Q28,35 34.5,32" stroke="${C.accent}" stroke-width="1.2" fill="none"/><ellipse cx="28" cy="22" rx="6.5" ry="2.2" fill="${C.accent}" opacity=".42"/><path d="M21.5,17 L34.5,17 L33.5,13.5 L22.5,13.5 Z" fill="${C.accent}" stroke="${C.stroke}" stroke-width="1"/><polygon points="28,5 29.5,13 26.5,13" fill="url(#bd${id})" stroke="${C.stroke}" stroke-width="1"/><polygon points="22,8.5 24,13.5 20,13.5" fill="url(#bd${id})" stroke="${C.stroke}" stroke-width="1"/><polygon points="34,8.5 36,13.5 32,13.5" fill="url(#bd${id})" stroke="${C.stroke}" stroke-width="1"/><circle cx="19.2" cy="14" r="2.4" fill="url(#gm${id})" stroke="${C.stroke}" stroke-width=".9"/><circle cx="36.8" cy="14" r="2.4" fill="url(#gm${id})" stroke="${C.stroke}" stroke-width=".9"/><circle cx="28" cy="5" r="2.8" fill="url(#gm${id})" stroke="${C.stroke}" stroke-width=".9"/><circle cx="27.2" cy="4.3" r="1.1" fill="${C.gemShine}" opacity=".9"/><circle cx="19.2" cy="13.2" r=".9" fill="${C.gemShine}" opacity=".8"/><circle cx="36.8" cy="13.2" r=".9" fill="${C.gemShine}" opacity=".8"/><ellipse cx="23.5" cy="26" rx="2.5" ry="4" fill="${C.shine}" opacity=".38"/>`:tp==='K'?`<path d="M19.5,41.5 Q18.5,32 20.5,25 Q22.5,18.5 28,17 Q33.5,18.5 35.5,25 Q37.5,32 36.5,41.5 Z" fill="url(#bd${id})" stroke="${C.stroke}" stroke-width="1.6"/><path d="M21.5,32 Q28,35 34.5,32" stroke="${C.accent}" stroke-width="1.2" fill="none"/><ellipse cx="28" cy="22" rx="6.5" ry="2.2" fill="${C.accent}" opacity=".42"/><path d="M21,17 L35,17 L34,14 L22,14 Z" fill="${C.accent}" stroke="${C.stroke}" stroke-width="1"/><polygon points="28,7.5 29.5,13.5 26.5,13.5" fill="url(#bd${id})" stroke="${C.stroke}" stroke-width="1"/><polygon points="21.5,10 23.5,14 19.5,14" fill="url(#bd${id})" stroke="${C.stroke}" stroke-width="1"/><polygon points="34.5,10 36.5,14 32.5,14" fill="url(#bd${id})" stroke="${C.stroke}" stroke-width="1"/><circle cx="19.2" cy="14.2" r="2.4" fill="url(#gm${id})" stroke="${C.stroke}" stroke-width=".9"/><circle cx="36.8" cy="14.2" r="2.4" fill="url(#gm${id})" stroke="${C.stroke}" stroke-width=".9"/><rect x="26.2" y="5" width="3.6" height="10" rx=".6" fill="${C.accent}" stroke="${C.stroke}" stroke-width=".9"/><rect x="23" y="8" width="10" height="3.6" rx=".6" fill="${C.accent}" stroke="${C.stroke}" stroke-width=".9"/><rect x="26.8" y="5.5" width="1.8" height="2.5" rx=".3" fill="${C.shine}" opacity=".65"/><ellipse cx="23.5" cy="26" rx="2.5" ry="4" fill="${C.shine}" opacity=".38"/>`:''}</svg>`;
}
const capSVG=code=>pieceSVG(code,20);

/* ═══════════════════════════════════════════════════════════════════
   OPENING BOOK
   Each entry: sequence of move strings → { next moves with weights }
═══════════════════════════════════════════════════════════════════ */
const OPENING_BOOK = {
  '':['e4','d4','Nf3','c4'],
  'e4':['e5','c5','e6','c6','d6','g6'],
  'e4 e5':['Nf3','Nc3','f4'],
  'e4 e5 Nf3':['Nc6','Nf6','d6'],
  'e4 e5 Nf3 Nc6':['Bc4','Bb5','d4'],
  'e4 e5 Nf3 Nc6 Bc4':['Bc5','Nf6'],
  'e4 c5':['Nf3','Nc3'],
  'e4 c5 Nf3':['d6','Nc6','e6'],
  'e4 e6':['d4'],
  'e4 e6 d4':['d5'],
  'd4':['d5','Nf6','f5'],
  'd4 d5':['c4','Nf3','Bf4'],
  'd4 d5 c4':['e6','c6','dxc4'],
  'd4 Nf6':['c4','Nf3'],
  'd4 Nf6 c4':['e6','g6','c5'],
  'Nf3':['d5','Nf6','c5'],
  'c4':['e5','c5','Nf6','e6'],
};
const OPENING_NAMES = {
  'e4 e5':           "King's Pawn",
  'e4 e5 Nf3':       "King's Knight",
  'e4 e5 Nf3 Nc6 Bc4':'Italian Game',
  'e4 e5 Nf3 Nc6 Bb5':'Ruy Lopez',
  'e4 c5':           'Sicilian Defense',
  'e4 c5 Nf3':       'Sicilian Open',
  'e4 e6':           'French Defense',
  'e4 e6 d4 d5':     'French Defense',
  'e4 d6':           "Pirc Defense",
  'e4 g6':           'Modern Defense',
  'd4 d5':           "Queen's Pawn",
  'd4 d5 c4':        "Queen's Gambit",
  'd4 d5 c4 e6':     "Queen's Gambit Declined",
  'd4 d5 c4 c6':     'Slav Defense',
  'd4 Nf6':          "Indian Defense",
  'd4 Nf6 c4 e6':    "Nimzo/QID",
  'd4 Nf6 c4 g6':    "King's Indian",
  'Nf3':             "Réti Opening",
  'c4':              'English Opening',
};

/* ═══════════════════════════════════════════════════════════════════
   CHESS ENGINE
═══════════════════════════════════════════════════════════════════ */
const MAT={P:100,N:320,B:330,R:500,Q:900,K:20000};
const PST={
  P:[[0,0,0,0,0,0,0,0],[50,50,50,50,50,50,50,50],[10,10,20,30,30,20,10,10],[5,5,10,25,25,10,5,5],[0,0,0,20,20,0,0,0],[5,-5,-10,0,0,-10,-5,5],[5,10,10,-20,-20,10,10,5],[0,0,0,0,0,0,0,0]],
  N:[[-50,-40,-30,-30,-30,-30,-40,-50],[-40,-20,0,0,0,0,-20,-40],[-30,0,10,15,15,10,0,-30],[-30,5,15,20,20,15,5,-30],[-30,0,15,20,20,15,0,-30],[-30,5,10,15,15,10,5,-30],[-40,-20,0,5,5,0,-20,-40],[-50,-40,-30,-30,-30,-30,-40,-50]],
  B:[[-20,-10,-10,-10,-10,-10,-10,-20],[-10,0,0,0,0,0,0,-10],[-10,0,5,10,10,5,0,-10],[-10,5,5,10,10,5,5,-10],[-10,0,10,10,10,10,0,-10],[-10,10,10,10,10,10,10,-10],[-10,5,0,0,0,0,5,-10],[-20,-10,-10,-10,-10,-10,-10,-20]],
  R:[[0,0,0,0,0,0,0,0],[5,10,10,10,10,10,10,5],[-5,0,0,0,0,0,0,-5],[-5,0,0,0,0,0,0,-5],[-5,0,0,0,0,0,0,-5],[-5,0,0,0,0,0,0,-5],[-5,0,0,0,0,0,0,-5],[0,0,0,5,5,0,0,0]],
  Q:[[-20,-10,-10,-5,-5,-10,-10,-20],[-10,0,0,0,0,0,0,-10],[-10,0,5,5,5,5,0,-10],[-5,0,5,5,5,5,0,-5],[0,0,5,5,5,5,0,-5],[-10,5,5,5,5,5,0,-10],[-10,0,5,0,0,0,0,-10],[-20,-10,-10,-5,-5,-10,-10,-20]],
  K:[[-30,-40,-40,-50,-50,-40,-40,-30],[-30,-40,-40,-50,-50,-40,-40,-30],[-30,-40,-40,-50,-50,-40,-40,-30],[-30,-40,-40,-50,-50,-40,-40,-30],[-20,-30,-30,-40,-40,-30,-30,-20],[-10,-20,-20,-20,-20,-20,-20,-10],[20,20,0,0,0,0,20,20],[20,30,10,0,0,10,30,20]]
};
const NoCR={wK:false,wQ:false,bK:false,bQ:false};
const inB=(r,c)=>r>=0&&r<8&&c>=0&&c<8;
const col=p=>p?p[0]:null;
const typ=p=>p?p[1]:null;

function rawMoves(r,c,brd,ep,cr){
  const p=brd[r][c];if(!p)return[];
  const cl=col(p),tp=typ(p),mv=[],dir=cl==='w'?-1:1;
  const sl=(dr,dc)=>{let nr=r+dr,nc=c+dc;while(inB(nr,nc)){if(col(brd[nr][nc])===cl)break;mv.push([nr,nc]);if(brd[nr][nc])break;nr+=dr;nc+=dc;}};
  if(tp==='P'){
    if(inB(r+dir,c)&&!brd[r+dir][c]){mv.push([r+dir,c]);if(r===(cl==='w'?6:1)&&!brd[r+2*dir][c])mv.push([r+2*dir,c]);}
    [-1,1].forEach(dc=>{if(inB(r+dir,c+dc)){if(brd[r+dir][c+dc]&&col(brd[r+dir][c+dc])!==cl)mv.push([r+dir,c+dc]);if(ep&&ep[0]===r+dir&&ep[1]===c+dc)mv.push([r+dir,c+dc]);}});
  }else if(tp==='N'){[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr,dc])=>{const nr=r+dr,nc=c+dc;if(inB(nr,nc)&&col(brd[nr][nc])!==cl)mv.push([nr,nc]);});}
  else if(tp==='B')[[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([dr,dc])=>sl(dr,dc));
  else if(tp==='R')[[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr,dc])=>sl(dr,dc));
  else if(tp==='Q')[[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr,dc])=>sl(dr,dc));
  else if(tp==='K'){
    [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(([dr,dc])=>{const nr=r+dr,nc=c+dc;if(inB(nr,nc)&&col(brd[nr][nc])!==cl)mv.push([nr,nc]);});
    const kr=cl==='w'?7:0;
    if(r===kr&&c===4){
      if(cr[cl+'K']&&!brd[kr][5]&&!brd[kr][6]&&!atk(kr,4,cl,brd,ep)&&!atk(kr,5,cl,brd,ep)&&!atk(kr,6,cl,brd,ep))mv.push([kr,6]);
      if(cr[cl+'Q']&&!brd[kr][3]&&!brd[kr][2]&&!brd[kr][1]&&!atk(kr,4,cl,brd,ep)&&!atk(kr,3,cl,brd,ep)&&!atk(kr,2,cl,brd,ep))mv.push([kr,2]);
    }
  }
  return mv;
}
function atk(r,c,dc,brd,ep){const ac=dc==='w'?'b':'w';for(let rr=0;rr<8;rr++)for(let cc=0;cc<8;cc++)if(col(brd[rr][cc])===ac&&rawMoves(rr,cc,brd,ep,NoCR).some(([mr,mc])=>mr===r&&mc===c))return true;return false;}
function kPos(cl,brd){for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(brd[r][c]===cl+'K')return[r,c];return[0,0];}
function inChk(cl,brd,ep){const[kr,kc]=kPos(cl,brd);return atk(kr,kc,cl,brd,ep);}
function applyMv(r,c,nr,nc,brd,ep){
  const nb=brd.map(row=>[...row]),p=nb[r][c],cl=col(p),tp=typ(p);let nep=null;
  if(tp==='P'&&ep&&ep[0]===nr&&ep[1]===nc)nb[cl==='w'?nr+1:nr-1][nc]=null;
  if(tp==='K'){const kr=cl==='w'?7:0;if(c===4&&nc===6){nb[kr][5]=nb[kr][7];nb[kr][7]=null;}if(c===4&&nc===2){nb[kr][3]=nb[kr][0];nb[kr][0]=null;}}
  if(tp==='P'&&Math.abs(nr-r)===2)nep=[(r+nr)/2,nc];
  nb[nr][nc]=p;nb[r][c]=null;return{board:nb,ep:nep};
}
function updCR(cr,piece,r,c,nr,nc){
  const nc_cr={...cr},cl=col(piece),tp=typ(piece);
  if(tp==='K'){nc_cr[cl+'K']=false;nc_cr[cl+'Q']=false;}
  if(tp==='R'){if(cl==='w'){if(r===7&&c===0)nc_cr.wQ=false;if(r===7&&c===7)nc_cr.wK=false;}else{if(r===0&&c===0)nc_cr.bQ=false;if(r===0&&c===7)nc_cr.bK=false;}}
  if(nr===0&&nc===0)nc_cr.bQ=false;
  if(nr===0&&nc===7)nc_cr.bK=false;
  if(nr===7&&nc===0)nc_cr.wQ=false;
  if(nr===7&&nc===7)nc_cr.wK=false;
  return nc_cr;
}
function legalMoves(r,c,brd,ep,cr){return rawMoves(r,c,brd,ep,cr).filter(([nr,nc])=>{const{board:nb,ep:nep}=applyMv(r,c,nr,nc,brd,ep);return!inChk(col(brd[r][c]),nb,nep);});}
function allLegal(cl,brd,ep,cr){const mv=[];for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(col(brd[r][c])===cl)legalMoves(r,c,brd,ep,cr).forEach(to=>mv.push({from:[r,c],to}));return mv;}
function insufficientMaterial(brd){
  const p={w:[],b:[]};for(let r=0;r<8;r++)for(let c=0;c<8;c++){const pc=brd[r][c];if(pc)p[col(pc)].push(typ(pc));}
  const isK=c=>p[c].length===1&&p[c][0]==='K';
  const isKN=c=>p[c].length===2&&p[c].includes('K')&&p[c].includes('N');
  const isKB=c=>p[c].length===2&&p[c].includes('K')&&p[c].includes('B');
  if(isK('w')&&isK('b'))return true;
  if(isK('w')&&(isKN('b')||isKB('b')))return true;
  if(isK('b')&&(isKN('w')||isKB('w')))return true;
  if(isKB('w')&&isKB('b'))return true;
  return false;
}
function boardHash(brd,ep,cr){return brd.map(r=>r.map(c=>c||'.').join('')).join('|')+'|'+JSON.stringify(ep)+'|'+cr.wK+cr.wQ+cr.bK+cr.bQ;}
function evalBoard(brd){let s=0;for(let r=0;r<8;r++)for(let c=0;c<8;c++){const p=brd[r][c];if(!p)continue;const cl=col(p),tp=typ(p),pr=cl==='w'?r:7-r;s+=(cl==='w'?1:-1)*(MAT[tp]+(PST[tp]?PST[tp][pr][c]:0));}return s;}
function orderMvs(mvs,brd){return mvs.sort((a,b)=>{const sc=m=>{let v=brd[m.to[0]][m.to[1]];if(!v&&typ(brd[m.from[0]][m.from[1]])==='P'&&m.to[1]!==m.from[1])v='bP';const at=brd[m.from[0]][m.from[1]];return v?MAT[typ(v)]-MAT[typ(at)]/10:0;};return sc(b)-sc(a);});}
function minimax(brd,depth,alpha,beta,isMax,ep,cr){
  if(depth===0)return evalBoard(brd);
  const cl=isMax?'w':'b';let mvs=allLegal(cl,brd,ep,cr);
  if(!mvs.length)return inChk(cl,brd,ep)?(isMax?-99999+depth:99999-depth):0;
  mvs=orderMvs(mvs,brd);
  if(isMax){let best=-Infinity;for(const m of mvs){const{board:nb,ep:nep}=applyMv(m.from[0],m.from[1],m.to[0],m.to[1],brd,ep);const ncr=updCR(cr,brd[m.from[0]][m.from[1]],m.from[0],m.from[1],m.to[0],m.to[1]);const v=minimax(nb,depth-1,alpha,beta,false,nep,ncr);best=Math.max(best,v);alpha=Math.max(alpha,v);if(beta<=alpha)break;}return best;}
  else{let best=Infinity;for(const m of mvs){const{board:nb,ep:nep}=applyMv(m.from[0],m.from[1],m.to[0],m.to[1],brd,ep);const ncr=updCR(cr,brd[m.from[0]][m.from[1]],m.from[0],m.from[1],m.to[0],m.to[1]);const v=minimax(nb,depth-1,alpha,beta,true,nep,ncr);best=Math.min(best,v);beta=Math.min(beta,v);if(beta<=alpha)break;}return best;}
}

// Opening book lookup — converts internal move representation to SAN-like
function bookMove(moveHistory){
  const key=moveHistory.join(' ');
  const choices=OPENING_BOOK[key];
  if(!choices||!choices.length)return null;
  // Pick a random book move — map SAN-ish to board coords
  const pick=choices[Math.floor(Math.random()*choices.length)];
  return pick;
}

// Convert simple SAN (e4, Nf3, Bc4 etc.) to [fromR,fromC,toR,toC]
function sanToMove(san,brd,ep,cr,cl){
  const files='abcdefgh';
  const mvs=allLegal(cl,brd,ep,cr);
  const sanClean=san.replace('x','').replace('+','').replace('#','');
  if(sanClean==='O-O'||sanClean==='O-O-O'){
    const kr=cl==='w'?7:0, kc=4, dc=sanClean==='O-O'?6:2;
    return mvs.find(m=>m.from[0]===kr&&m.from[1]===kc&&m.to[1]===dc)||null;
  }
  const toFile=files.indexOf(sanClean[sanClean.length-2]);
  const toRank=8-parseInt(sanClean[sanClean.length-1]);
  if(toFile<0||toRank<0)return null;
  let piece='P', reqFile=-1;
  if('KQRBN'.includes(sanClean[0]))piece=sanClean[0];
  else if(sanClean.length>=3&&files.includes(sanClean[0]))reqFile=files.indexOf(sanClean[0]);
  for(const m of mvs){
    const[fr,fc]=m.from,[tr,tc]=m.to;
    if(tr===toRank&&tc===toFile&&typ(brd[fr][fc])===piece){
      if(reqFile>=0&&fc!==reqFile)continue;
      return m;
    }
  }
  return null;
}

function bestMove(brd,ep,cr,depth,moveHist){
  // Try opening book first
  const bookSAN=bookMove(moveHist);
  if(bookSAN){
    const bm=sanToMove(bookSAN,brd,ep,cr,'b');
    if(bm)return bm;
  }
  let mvs=allLegal('b',brd,ep,cr);if(!mvs.length)return null;
  if(depth===1)return mvs[Math.floor(Math.random()*mvs.length)];
  mvs=orderMvs([...mvs],brd);let bv=Infinity,bm=mvs[0];
  for(const m of mvs){const{board:nb,ep:nep}=applyMv(m.from[0],m.from[1],m.to[0],m.to[1],brd,ep);const ncr=updCR(cr,brd[m.from[0]][m.from[1]],m.from[0],m.from[1],m.to[0],m.to[1]);const v=minimax(nb,depth-1,-Infinity,Infinity,true,nep,ncr);if(v<bv){bv=v;bm=m;}}
  return bm;
}

/* ═══════════════════════════════════════════════════════════════════
   GAME STATE
═══════════════════════════════════════════════════════════════════ */
let GB=[],turn='w',sel=null,vmoves=[],epTarget=null;
let CR={wK:true,wQ:true,bK:true,bQ:true};
let capW=[],capB=[],mhist=[],sanHist=[],scores={w:0,b:0},lastMv=null,chkFlag=false,pendPromo=null;
let gmode=null,aiDepth=3,aiOn=false,gOver=false,flipped=false;
let posHistory={},halfMoveClock=0;
let timeControl=0,clockW=0,clockB=0,clockTimer=null,_clockStartTid=null;
let pendDiff=null,boardTheme='wood';
let annotations={};  // key=r+','+c → 'r'|'y'|'b'
let arrowStart=null;  // right-click drag
let historyIdx=-1;  // for replaying history
let stateStack=[];  // for undo

// Stats
let gameStartTime=Date.now(),moveTimes=[],lastMoveTime=Date.now();

function initBrd(){
  GB=Array(8).fill(null).map(()=>Array(8).fill(null));
  const back=['R','N','B','Q','K','B','N','R'];
  for(let c=0;c<8;c++){GB[0][c]='b'+back[c];GB[1][c]='bP';GB[6][c]='wP';GB[7][c]='w'+back[c];}
  posHistory={};halfMoveClock=0;stateStack=[];
}

/* ═══ NAVIGATION ═══ */
function go1P(){AUDIO.init();AUDIO.play('select');document.getElementById('diffScreen').style.display='flex';}
function hideDiff(){document.getElementById('diffScreen').style.display='none';}
function go2P(){AUDIO.init();AUDIO.play('select');pendDiff=null;gmode='2p';document.getElementById('modeVal').textContent='2 PLAYER';document.getElementById('diffPanel').style.display='none';document.getElementById('timeScreen').style.display='flex';}
function pickTime(diff){AUDIO.play('select');pendDiff=diff;hideDiff();document.getElementById('timeScreen').style.display='flex';}
function hideTime(){document.getElementById('timeScreen').style.display='none';}
function startWithTime(sec){
  AUDIO.play('select');hideTime();timeControl=sec;clockW=sec;clockB=sec;
  if(gmode!=='2p'){
    gmode='1p';
    const deps={easy:1,medium:3,hard:5},labs={easy:'NOVICE',medium:'STANDARD',hard:'MASTER'};
    aiDepth=deps[pendDiff||'medium'];
    document.getElementById('modeVal').textContent='1P VS COMPUTER';
    document.getElementById('diffPanel').style.display='block';
    document.getElementById('diffVal').textContent=labs[pendDiff||'medium'];
  }
  showGame();
}
function showGame(){
  document.getElementById('menuScreen').style.display='none';
  document.getElementById('gameScreen').classList.add('on');
  buildCoords();AUDIO.startMusic();resetGame(false);
}
function gotoMenu(){
  hideAllResults();
  document.getElementById('menuScreen').style.display='flex';
  document.getElementById('gameScreen').classList.remove('on');
  AUDIO.stopMusic();stopClock();scores={w:0,b:0};
}
function hideAllResults(){['victoryScreen','defeatScreen','drawScreen'].forEach(id=>document.getElementById(id).classList.remove('show'));}
function toggleSnd(e){e.stopPropagation();AUDIO.toggleSfx();}
function toggleMusic(e){e.stopPropagation();AUDIO.toggleMusic();}
function setTheme(t){
  boardTheme=t;
  const brd=document.getElementById('board');
  brd.className='board theme-'+t;
  ['wood','blue','green','marble'].forEach(n=>{const el=document.getElementById('th-'+n);if(el)el.classList.toggle('active',n===t);});
}
function flipBoard(){flipped=!flipped;buildCoords();render();}
function resignGame(){if(gOver)return;AUDIO.play('resign');endGame('resign',turn==='w'?'b':'w');}

/* ═══ CLOCK ═══ */
const fmtTime=s=>{if(s<=0)return'00:00';const m=Math.floor(s/60),sc=s%60;return String(m).padStart(2,'0')+':'+String(sc).padStart(2,'0');};
function updateClockUI(){
  const wd=document.getElementById('clockWdisp'),bd=document.getElementById('clockBdisp');
  if(wd){wd.textContent=timeControl?fmtTime(clockW):'∞';wd.className='clock-display'+(timeControl&&clockW<=10?' flagged':timeControl&&clockW<=30?' low':'');}
  if(bd){bd.textContent=timeControl?fmtTime(clockB):'∞';bd.className='clock-display'+(timeControl&&clockB<=10?' flagged':timeControl&&clockB<=30?' low':'');}
  const wBox=document.getElementById('clockWrow'),bBox=document.getElementById('clockBrow');
  if(wBox&&bBox){wBox.className=turn==='w'?'clock-row-active':'';bBox.className=turn==='b'?'clock-row-active':'';}
}
function startClock(){if(!timeControl||clockTimer)return;clockTimer=setInterval(()=>{if(gOver)return;if(turn==='w'){clockW=Math.max(0,clockW-1);if(clockW<=10&&clockW>0)AUDIO.play('clock');if(clockW===0){stopClock();endGame('timeout','b');}}else if(gmode!=='1p'){clockB=Math.max(0,clockB-1);if(clockB<=10&&clockB>0)AUDIO.play('clock');if(clockB===0){stopClock();endGame('timeout','w');}}updateClockUI();},1000);}
function stopClock(){clearInterval(clockTimer);clockTimer=null;}
function resetClock(){stopClock();clockW=timeControl;clockB=timeControl;updateClockUI();}

/* ═══ EVAL BAR ═══ */
function updateEvalBar(brd){
  const raw=evalBoard(brd);
  // Clamp to ±12 pawns for display
  const clamped=Math.max(-1200,Math.min(1200,raw));
  // Map to 0-100% (50% = equal, >50% = white advantage)
  const pct=50+clamped/24;
  document.getElementById('evalFill').style.height=pct+'%';
  const cp=(raw/100).toFixed(1);
  document.getElementById('evalVal').textContent=(raw>0?'+':'')+cp;
}

/* ═══ OPENING DETECTOR ═══ */
function detectOpening(hist){
  const key=hist.join(' ');
  for(let len=hist.length;len>=1;len--){
    const k=hist.slice(0,len).join(' ');
    if(OPENING_NAMES[k])return OPENING_NAMES[k];
  }
  return '';
}

/* ═══ BUILD COORDS ═══ */
function buildCoords(){
  const rk=document.getElementById('cranks'),fl=document.getElementById('cfiles');
  rk.innerHTML='';fl.innerHTML='';
  for(let r=0;r<8;r++){const d=document.createElement('div');d.className='cr-cell';d.textContent=flipped?r+1:8-r;rk.appendChild(d);}
  for(let c=0;c<8;c++){const d=document.createElement('div');d.className='cf-cell';d.textContent='abcdefgh'[flipped?7-c:c];fl.appendChild(d);}
}

/* ═══ RENDER ═══ */
function render(){
  const bEl=document.getElementById('board');
  // Re-create squares (keep arrow SVG)
  const arrowSVG=document.getElementById('arrowLayer');
  bEl.innerHTML='';bEl.appendChild(arrowSVG);

  const mvSet=new Set(vmoves.map(([r,c])=>r+','+c));
  const lSet=new Set(lastMv?[lastMv.from.join(','),lastMv.to.join(',')]:[]);
  const chkPos=chkFlag?kPos(turn,GB).join(','):null;

  for(let ri=0;ri<8;ri++)for(let ci=0;ci<8;ci++){
    const r=flipped?7-ri:ri, c=flipped?7-ci:ci;
    const sq=document.createElement('div');
    const k=r+','+c;
    sq.className='sq '+((ri+ci)%2===0?'lt':'dk');
    if(sel&&sel[0]===r&&sel[1]===c)sq.classList.add('sel');
    else if(lSet.has(k))sq.classList.add('last');
    if(chkPos===k)sq.classList.add('chk');
    const isCap=(GB[r][c]&&col(GB[r][c])!==turn)||(sel&&GB[sel[0]][sel[1]]&&typ(GB[sel[0]][sel[1]])==='P'&&c!==sel[1]&&!GB[r][c]);
    if(mvSet.has(k))sq.classList.add(isCap?'cmc':'cmd');
    // Annotation
    if(annotations[k])sq.classList.add('sq-ann-'+annotations[k]);
    if(GB[r][c]){
      const w=document.createElement('div');w.className='piece-wrap';
      if(lastMv&&lastMv.to[0]===r&&lastMv.to[1]===c)w.classList.add('last-moved');
      w.innerHTML=pieceSVG(GB[r][c]);sq.appendChild(w);
    }
    sq.addEventListener('click',()=>click(r,c));
    sq.addEventListener('mouseenter',()=>{
      if(GB[r][c]&&col(GB[r][c])===turn&&!sel&&!aiOn){
        const hints=legalMoves(r,c,GB,epTarget,CR);
        hints.forEach(([hr,hc])=>{const hidx=flipped?(7-hr)*8+(7-hc):hr*8+hc;const hsq=bEl.children[hidx+1];if(hsq)hsq.classList.add('hover-hint');});
      }
    });
    sq.addEventListener('mouseleave',()=>bEl.querySelectorAll('.hover-hint').forEach(el=>el.classList.remove('hover-hint')));
    // Right-click annotation (single square)
    sq.addEventListener('contextmenu',e=>{e.preventDefault();if(!arrowStart)cycleAnnotation(r,c);});
    sq.addEventListener('mousedown',e=>{if(e.button===2){e.preventDefault();arrowStart=[r,c];}});
    bEl.appendChild(sq);
  }

  // Turn lamp
  document.getElementById('tlamp').className='tlamp '+(turn==='w'?'w':'b');
  document.getElementById('tname').textContent=turn==='w'?'White':'Black';

  // Captured
  const wM=capW.reduce((s,p)=>s+MAT[typ(p)]/100,0),bM=capB.reduce((s,p)=>s+MAT[typ(p)]/100,0);
  document.getElementById('capW').innerHTML=capW.map(p=>`<span class="cap-icon">${capSVG(p)}</span>`).join('');
  document.getElementById('capB').innerHTML=capB.map(p=>`<span class="cap-icon">${capSVG(p)}</span>`).join('');
  document.getElementById('advW').textContent=wM>bM?`+${(wM-bM).toFixed(0)}`:'';
  document.getElementById('advB').textContent=bM>wM?`+${(bM-wM).toFixed(0)}`:'';

  // Move history
  const ml=document.getElementById('mlist');ml.innerHTML='';
  for(let i=0;i<mhist.length;i+=2){
    const row=document.createElement('div');row.className='mrow';
    row.innerHTML=`<span class="mn">${i/2+1}.</span><span class="mw">${mhist[i]||''}</span><span class="mb">${mhist[i+1]||''}</span>`;
    ml.appendChild(row);
  }
  ml.scrollTop=ml.scrollHeight;

  // Opening name
  const opName=detectOpening(sanHist);
  document.getElementById('openingName').textContent=opName?'♟ '+opName:'';

  // Scores
  document.getElementById('scW').textContent=scores.w;
  document.getElementById('scB').textContent=scores.b;
  updateClockUI();
  updateEvalBar(GB);
  renderArrows();
}

/* ═══ ANNOTATIONS ═══ */
function cycleAnnotation(r,c){
  const k=r+','+c;
  const cycle={'':'r','r':'y','y':'b','b':''};
  annotations[k]=cycle[annotations[k]||'']||'';
  render();
}
function drawArrow(from,to){
  // Store arrow in annotations as special key
  const key='arr:'+from.join(',')+':'+to.join(',');
  if(annotations[key])delete annotations[key];
  else annotations[key]='red';
  renderArrows();
}
function renderArrows(){
  const svg=document.getElementById('arrowLayer');
  // Remove old arrows
  svg.querySelectorAll('.ann-arrow').forEach(el=>el.remove());
  for(const k of Object.keys(annotations)){
    if(!k.startsWith('arr:'))continue;
    const parts=k.split(':');
    const[fr,fc]=parts[1].split(',').map(Number);
    const[tr,tc]=parts[2].split(',').map(Number);
    const fri=flipped?7-fr:fr,fci=flipped?7-fc:fc;
    const tri=flipped?7-tr:tr,tci=flipped?7-tc:tc;
    const x1=fci*64+32,y1=fri*64+32,x2=tci*64+32,y2=tri*64+32;
    // Shorten arrow to not cover piece
    const dx=x2-x1,dy=y2-y1,len=Math.sqrt(dx*dx+dy*dy),nx=dx/len,ny=dy/len;
    const line=document.createElementNS('http://www.w3.org/2000/svg','line');
    line.setAttribute('x1',x1+nx*22);line.setAttribute('y1',y1+ny*22);
    line.setAttribute('x2',x2-nx*20);line.setAttribute('y2',y2-ny*20);
    line.setAttribute('stroke','rgba(200,60,60,.82)');line.setAttribute('stroke-width','9');
    line.setAttribute('stroke-linecap','round');
    line.setAttribute('marker-end','url(#arrowhead)');
    line.className.baseVal='ann-arrow';
    svg.appendChild(line);
  }
}
function clearAnnotations(){annotations={};renderArrows();render();}

/* ═══ DRAG & DROP ═══ */
let dragInfo=null;
function setupDrag(){
  const ghost=document.getElementById('dragGhost');
  let dragStartX=0,dragStartY=0,isDragging=false;

  document.addEventListener('mousemove',e=>{
    if(!dragInfo)return;
    ghost.style.left=e.clientX+'px';ghost.style.top=e.clientY+'px';
    // Only show ghost after moving >6px (distinguishes click from drag)
    if(!isDragging){
      const dx=e.clientX-dragStartX,dy=e.clientY-dragStartY;
      if(dx*dx+dy*dy>36){isDragging=true;ghost.style.display='block';}
    }
    if(!isDragging)return;
    const sq=squareAtPos(e.clientX,e.clientY);
    document.querySelectorAll('.sq.drag-over').forEach(s=>s.classList.remove('drag-over'));
    if(sq){const ok=vmoves.some(([vr,vc])=>vr===sq[0]&&vc===sq[1]);if(ok){const idx=getSquareIdx(sq[0],sq[1]);const s=document.getElementById('board').children[idx+1];if(s)s.classList.add('drag-over');}}
  });

  document.addEventListener('mouseup',e=>{
    if(!dragInfo)return;
    ghost.style.display='none';
    document.querySelectorAll('.sq.drag-over').forEach(s=>s.classList.remove('drag-over'));
    const wasDragging=isDragging;
    isDragging=false;
    const sq=squareAtPos(e.clientX,e.clientY);
    if(wasDragging){
      // Drag-drop: execute move if valid destination, otherwise keep selection
      if(sq){
        const[dr,dc]=sq;
        if(vmoves.some(([vr,vc])=>vr===dr&&vc===dc)){execMove(dragInfo[0],dragInfo[1],dr,dc);}
        // else: dropped on invalid square — keep piece selected
      }
      // else: released off board — keep piece selected
    }
    // If not dragging (was just a click), do nothing — let the click event handle it
    dragInfo=null;
  });
}

function squareAtPos(x,y){
  const board=document.getElementById('board');
  const rect=board.getBoundingClientRect();
  const bx=x-rect.left,by=y-rect.top;
  if(bx<0||by<0||bx>512||by>512)return null;
  const ci=Math.floor(bx/64),ri=Math.floor(by/64);
  if(ci<0||ci>7||ri<0||ri>7)return null;
  return flipped?[7-ri,7-ci]:[ri,ci];
}
function getSquareIdx(r,c){return flipped?(7-r)*8+(7-c):r*8+c;}

/* ═══ CLICK ═══ */
function click(r,c){
  if(pendPromo||aiOn||gOver)return;
  if(gmode==='1p'&&turn==='b')return;
  AUDIO.init();
  if(sel){
    const valid=vmoves.some(([vr,vc])=>vr===r&&vc===c);
    if(valid){execMove(sel[0],sel[1],r,c);return;}
    if(GB[r][c]&&col(GB[r][c])===turn){
      // Click on different own piece — switch selection
      sel=[r,c];vmoves=legalMoves(r,c,GB,epTarget,CR);AUDIO.play('select');render();return;
    }
    // Click on empty/invalid square — deselect
    sel=null;vmoves=[];render();return;
  }
  if(GB[r][c]&&col(GB[r][c])===turn){
    sel=[r,c];vmoves=legalMoves(r,c,GB,epTarget,CR);AUDIO.play('select');
  } else {
    // Click on empty square — clear annotations
    const hasAnn=Object.keys(annotations).some(k=>!k.startsWith('arr:')&&annotations[k]);
    if(hasAnn)clearAnnotations();
    sel=null;vmoves=[];
  }
  render();
}

/* ═══ PIECE MOUSEDOWN — initiates drag ═══ */
function setupBoardMousedown(){
  document.getElementById('board').addEventListener('mousedown',e=>{
    if(e.button!==0)return;
    if(pendPromo||aiOn||gOver)return;
    if(gmode==='1p'&&turn==='b')return;
    const sq=squareAtPos(e.clientX,e.clientY);
    if(!sq)return;
    const[r,c]=sq;
    if(!GB[r][c]||col(GB[r][c])!==turn)return;
    // Pre-select on mousedown so drag ghost shows the right piece
    AUDIO.init();
    sel=[r,c];vmoves=legalMoves(r,c,GB,epTarget,CR);
    render();
    const ghost=document.getElementById('dragGhost');
    ghost.innerHTML=pieceSVG(GB[r][c],60);
    ghost.style.left=e.clientX+'px';ghost.style.top=e.clientY+'px';
    ghost.style.display='none'; // hidden until mouse moves >6px
    dragInfo=[r,c];
    // store start position for drag-distance detection
    document.getElementById('dragGhost')._sx=e.clientX;
    document.getElementById('dragGhost')._sy=e.clientY;
    e.preventDefault();
  });
}

/* ═══ NOTATION ═══ */
const toAN=(r,c)=>'abcdefgh'[c]+(8-r);
function makeNote(r,c,nr,nc,piece,cap,promo,chk,mate){
  const tp=typ(piece);
  if(tp==='K'&&Math.abs(nc-c)===2)return(nc>c?'O-O':'O-O-O')+(mate?'#':chk?'+':'');
  let n='';if(tp!=='P')n+=tp;
  if(cap||(tp==='P'&&c!==nc)){if(tp==='P')n+='abcdefgh'[c];n+='x';}
  n+=toAN(nr,nc);if(promo)n+='='+promo;if(mate)n+='#';else if(chk)n+='+';return n;
}
// Simplified SAN for opening book tracking
function simpleSAN(r,c,nr,nc,piece,cap){
  const tp=typ(piece);
  if(tp==='K'&&Math.abs(nc-c)===2)return nc>c?'O-O':'O-O-O';
  let n='';if(tp!=='P')n+=tp;
  if(cap&&tp==='P')n+='abcdefgh'[c];
  if(cap)n+='x';
  n+=toAN(nr,nc);return n;
}

/* ═══ PARTICLES ═══ */
function spawnParticles(sq,color){
  for(let i=0;i<8;i++){
    const p=document.createElement('div');p.className='cpart';
    const angle=Math.random()*Math.PI*2,dist=18+Math.random()*28;
    p.style.cssText=`--px:${Math.cos(angle)*dist}px;--py:${Math.sin(angle)*dist}px;background:${color};top:${20+Math.random()*24}px;left:${20+Math.random()*24}px;animation-duration:${.35+Math.random()*.2}s;`;
    sq.appendChild(p);setTimeout(()=>p.remove(),600);
  }
}

/* ═══ UNDO ═══ */
function undoMove(){
  if(aiOn||stateStack.length<1)return;
  gOver=false;
  hideAllResults();
  document.getElementById('promoModal').classList.add('off');
  pendPromo=null;
  
  // In 1P mode, undo 2 moves (player + AI)
  const steps=gmode==='1p'?Math.min(2,stateStack.length):1;
  for(let i=0;i<steps;i++){
    if(!stateStack.length)break;
    const s=stateStack.pop();
    GB=s.GB;turn=s.turn;epTarget=s.ep;CR={...s.CR};capW=[...s.capW];capB=[...s.capB];
    mhist.splice(-1);sanHist.splice(-1);lastMv=s.lastMv;chkFlag=s.chkFlag;halfMoveClock=s.halfMoveClock;scores={...s.scores};posHistory={...s.posHistory};
    if(s.clockW!==undefined)clockW=s.clockW;
    if(s.clockB!==undefined)clockB=s.clockB;
  }
  sel=null;vmoves=[];
  AUDIO.play('select');
  updateClockUI();
  render();
}

/* ═══ EXECUTE MOVE ═══ */
function execMove(r,c,nr,nc,isAI=false){
  // Save state for undo
  stateStack.push({GB:GB.map(row=>[...row]),turn,ep:epTarget,CR:{...CR},capW:[...capW],capB:[...capB],lastMv:lastMv?{...lastMv}:null,chkFlag,halfMoveClock,scores:{...scores},posHistory:{...posHistory},clockW,clockB});

  const piece=GB[r][c],cl=col(piece),tp=typ(piece);
  const captured=GB[nr][nc];
  let epCap=null;
  if(tp==='P'&&epTarget&&epTarget[0]===nr&&epTarget[1]===nc){const er=cl==='w'?nr+1:nr-1;epCap=GB[er][nc];GB[er][nc]=null;}
  const capPiece=captured||epCap;
  if(capPiece){cl==='w'?capW.push(capPiece):capB.push(capPiece);}
  
  let isCastle=false;
  if(tp==='K'){
    const kr=cl==='w'?7:0;
    if(c===4&&nc===6){GB[kr][5]=GB[kr][7];GB[kr][7]=null;isCastle=true;}
    if(c===4&&nc===2){GB[kr][3]=GB[kr][0];GB[kr][0]=null;isCastle=true;}
    CR[cl+'K']=false;CR[cl+'Q']=false;
  }
  
  // Update castling rights explicitly checking piece moved OR destination captured
  if(tp==='R'){if(cl==='w'){if(r===7&&c===0)CR.wQ=false;if(r===7&&c===7)CR.wK=false;}else{if(r===0&&c===0)CR.bQ=false;if(r===0&&c===7)CR.bK=false;}}
  if(nr===0&&nc===0)CR.bQ=false;
  if(nr===0&&nc===7)CR.bK=false;
  if(nr===7&&nc===0)CR.wQ=false;
  if(nr===7&&nc===7)CR.wK=false;

  epTarget=(tp==='P'&&Math.abs(nr-r)===2)?[(r+nr)/2,nc]:null;
  if(tp==='P'||capPiece)halfMoveClock=0;else halfMoveClock++;
  GB[nr][nc]=piece;GB[r][c]=null;
  lastMv={from:[r,c],to:[nr,nc]};sel=null;vmoves=[];
  annotations={};  // clear annotations on move

  // Track move time
  const now=Date.now();moveTimes.push(now-lastMoveTime);lastMoveTime=now;

  if(capPiece){setTimeout(()=>{const idx=getSquareIdx(nr,nc);const sq=document.getElementById('board')?.children[idx+1];if(sq)spawnParticles(sq,cl==='w'?'#e8c060':'#c01e1e');},10);}

  if(isCastle)AUDIO.play('castle');
  else if(capPiece)AUDIO.play('capture');
  else AUDIO.play('move');

  // Promotion
  const promoR=cl==='w'?0:7;
  if(tp==='P'&&nr===promoR){
    pendPromo={r:nr,c:nc,cl};render();
    if(isAI){GB[nr][nc]=cl+'Q';pendPromo=null;AUDIO.play('promote');finishMove(r,c,nr,nc,piece,capPiece,'Q',isCastle);}
    else showPromo(cl,promo=>{GB[nr][nc]=cl+promo;pendPromo=null;AUDIO.play('promote');finishMove(r,c,nr,nc,piece,capPiece,promo,isCastle);});
    return;
  }
  finishMove(r,c,nr,nc,piece,capPiece,null,isCastle);
}

function finishMove(r,c,nr,nc,piece,cap,promo,isCastle=false){
  const next=turn==='w'?'b':'w';
  chkFlag=inChk(next,GB,epTarget);
  const allMv=allLegal(next,GB,epTarget,CR);
  const noMoves=allMv.length===0;

  // Build notation (needs check/mate info)
  mhist.push(makeNote(r,c,nr,nc,piece,cap,promo,chkFlag,noMoves&&chkFlag));
  sanHist.push(simpleSAN(r,c,nr,nc,piece,cap));

  // ── Terminal conditions (checkmate / stalemate) ──
  if(noMoves){
    if(chkFlag){
      // Checkmate — current player (turn, who just moved) wins
      gOver=true;scores[turn]++;
      AUDIO.play('check');
      render();
      setTimeout(()=>endGame('checkmate',turn),500);
    }else{
      // Stalemate — next player has no moves but is not in check
      gOver=true;
      render();
      setTimeout(()=>endGame('stalemate',null),400);
    }
    return;
  }

  // ── Draw by rule (only when game continues) ──
  if(insufficientMaterial(GB)){gOver=true;render();setTimeout(()=>endGame('insuff',null),400);return;}
  if(halfMoveClock>=100){gOver=true;render();setTimeout(()=>endGame('50move',null),400);return;}
  const hash=boardHash(GB,epTarget,CR);
  posHistory[hash]=(posHistory[hash]||0)+1;
  if(posHistory[hash]>=3){gOver=true;render();setTimeout(()=>endGame('3fold',null),400);return;}

  // ── Game continues ──
  if(chkFlag)AUDIO.play('check');
  const st=document.getElementById('stext');
  if(chkFlag){st.textContent=(next==='w'?'White':'Black')+' is in CHECK!';st.className='stext alert';}
  else{st.textContent='Game in progress';st.className='stext';}
  turn=next;render();
  if(gmode==='1p'&&turn==='b'&&!gOver){
    // AI's turn: freeze White's clock during thinking, restart it after AI moves
    aiOn=true;stopClock();
    document.getElementById('thinkBox').style.display='block';render();
    const thinkDelay=aiDepth<=2?60:aiDepth===3?200:380;
    setTimeout(()=>{
      const mv=bestMove(GB,epTarget,CR,aiDepth,sanHist);
      aiOn=false;document.getElementById('thinkBox').style.display='none';
      if(mv&&!gOver)execMove(mv.from[0],mv.from[1],mv.to[0],mv.to[1],true);
      else if(!gOver)startClock(); // fallback: restart White's clock if AI had no move
    },thinkDelay);
  }else{
    if(!clockTimer&&!gOver)startClock();
  }
}

/* ═══ GAME STATS STRING ═══ */
function gameStatsStr(){
  const fullMoves=Math.ceil(mhist.length/2);
  const dur=Math.round((Date.now()-gameStartTime)/1000);
  const m=Math.floor(dur/60),s=dur%60;
  return`${fullMoves} moves · ${m}m ${s}s`;
}

/* ═══ END GAME ═══ */
function endGame(reason,winner){
  gOver=true;stopClock();
  const drawR={stalemate:'Stalemate',insuff:'Insufficient Material','50move':'50-Move Rule','3fold':'Threefold Repetition',timeout:'Time Out',resign:'Resignation'};
  const stats=gameStatsStr();

  const updScores=()=>{['vScW','vScB','dScW','dScB','drScW','drScB'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=scores[id.toLowerCase().includes('w')?'w':'b'];});};

  if(reason==='checkmate'||reason==='timeout'||reason==='resign'){
    const winName=winner==='w'?'White Wins!':'Black Wins!';
    if(gmode==='1p'&&winner==='b'){
      AUDIO.playDefeat();
      document.getElementById('defeatWinner').textContent=winName;
      document.getElementById('defeatCard').textContent=reason==='timeout'?'— TIME OUT —':reason==='resign'?'— RESIGNED —':'— CHECKMATE —';
      document.getElementById('defeatStats').textContent=stats;
      updScores();setTimeout(()=>document.getElementById('defeatScreen').classList.add('show'),600);
    }else{
      AUDIO.playVictory();
      document.getElementById('victoryWinner').textContent=winName;
      document.getElementById('victoryStats').textContent=stats;
      updScores();setTimeout(()=>document.getElementById('victoryScreen').classList.add('show'),600);
    }
  }else{
    document.getElementById('drawReason').textContent=drawR[reason]||'Draw';
    document.getElementById('drawStats').textContent=stats;
    updScores();setTimeout(()=>document.getElementById('drawScreen').classList.add('show'),600);
  }
  render();
}

/* ═══ PROMO ═══ */
function showPromo(cl,cb){
  const modal=document.getElementById('promoModal'),row=document.getElementById('promoRow');
  modal.classList.remove('off');row.innerHTML='';
  ['Q','R','B','N'].forEach(t=>{const btn=document.createElement('button');btn.className='pchoice';btn.innerHTML=pieceSVG(cl+t,58);btn.onclick=()=>{modal.classList.add('off');cb(t);};row.appendChild(btn);});
}

/* ═══ RESET ═══ */
function resetGame(keepScores=true){
  hideAllResults();
  document.getElementById('promoModal').classList.add('off');
  stopClock();initBrd();
  turn='w';sel=null;vmoves=[];epTarget=null;
  CR={wK:true,wQ:true,bK:true,bQ:true};
  capW=[];capB=[];mhist=[];sanHist=[];lastMv=null;chkFlag=false;pendPromo=null;aiOn=false;gOver=false;
  if(!keepScores)scores={w:0,b:0};
  annotations={};
  gameStartTime=Date.now();moveTimes=[];lastMoveTime=Date.now();
  resetClock();
  document.getElementById('stext').textContent='Game in progress';
  document.getElementById('stext').className='stext';
  document.getElementById('thinkBox').style.display='none';
  render();
  if(timeControl&&!gOver){clearTimeout(_clockStartTid);_clockStartTid=setTimeout(startClock,200);}
}

/* ═══ KEYBOARD SHORTCUTS ═══ */
// Document-level right-click mouseup for arrow drawing
document.addEventListener('mouseup',e=>{
  if(e.button!==2)return;
  if(!arrowStart)return;
  const sq=squareAtPos(e.clientX,e.clientY);
  if(sq&&(sq[0]!==arrowStart[0]||sq[1]!==arrowStart[1])){
    drawArrow(arrowStart,sq);
  }
  arrowStart=null;
});
document.addEventListener('contextmenu',e=>{
  // Only prevent default on the board area
  if(e.target.closest('#board'))e.preventDefault();
});

document.addEventListener('keydown',e=>{
  if(e.target.tagName==='INPUT')return;
  if(e.key==='z'||e.key==='Z')undoMove();
  if(e.key==='f'||e.key==='F')flipBoard();
  if(e.key==='Escape'){sel=null;vmoves=[];clearAnnotations();}
  if(e.key==='n'||e.key==='N')if(document.getElementById('gameScreen').classList.contains('on'))resetGame();
});

/* ═══ INIT ═══ */
setupDrag();
setupBoardMousedown();
