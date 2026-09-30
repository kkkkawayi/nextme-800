(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const atlas = window.ATLAS, grid = $('atlas-grid'), panel = $('moment');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let active = null, pinned = false, closeTimer, openTimer, sound = true, chinese = false, paused = reduced, started = 0, previousFocus;
  const monthNames = ['April','May','June','July','August'];
  const offset = 134, height = 2430;
  const tiles = new Map();
  const visible=new Set();
  const observer=new IntersectionObserver(entries=>{for(const e of entries){const id=Number(e.target.dataset.id),item=atlas.items.find(x=>x.id===id),img=e.target.querySelector('img');if(e.isIntersecting)visible.add(id);else visible.delete(id);if(img){const animate=()=>{if(!paused&&visible.has(id))img.src=item.gif;};if(e.isIntersecting){if(img.complete&&img.naturalWidth)animate();else img.addEventListener('load',animate,{once:true});}else img.src=item.thumbnail;}}},{rootMargin:'80px'});
  const preloadCache=new Map();let prefetchController=null,prefetchId=null,prefetchGeneration=0;
  function releaseOldPrefetch(){while(preloadCache.size>3){const [id,value]=preloadCache.entries().next().value;preloadCache.delete(id);if(id!==active?.id)URL.revokeObjectURL(value.url);}}
  async function warmNearby(anchor){
    if(active||navigator.connection?.saveData||document.hidden)return;
    const generation=++prefetchGeneration;
    const list=atlas.items.filter(x=>x.video&&visible.has(x.id));
    if(anchor){const idx=atlas.items.findIndex(x=>x.id===anchor);list.sort((a,b)=>Math.abs(atlas.items.indexOf(a)-idx)-Math.abs(atlas.items.indexOf(b)-idx));}
    for(const item of list.slice(0,3)){
      if(generation!==prefetchGeneration||document.hidden)break;
      if(preloadCache.has(item.id)||active?.id===item.id)continue;
      const controller=new AbortController();prefetchController=controller;prefetchId=item.id;
      try{const r=await fetch(item.video,{signal:controller.signal,priority:'low',cache:'force-cache'});if(!r.ok)continue;const blob=await r.blob();preloadCache.set(item.id,{url:URL.createObjectURL(blob)});releaseOldPrefetch();}catch{}finally{if(prefetchController===controller){prefetchController=null;prefetchId=null;}}
    }
  }
  function scheduleWarm(anchor){
    if(prefetchController){prefetchController.abort();prefetchController=null;}
    prefetchGeneration++;
    const run=()=>warmNearby(anchor);
    if('requestIdleCallback' in window)requestIdleCallback(run,{timeout:4000});else setTimeout(run,1000);
  }
  addEventListener('load',()=>{
    const images=[...grid.querySelectorAll('img')].filter(x=>visible.has(Number(x.parentElement.dataset.id)));
    Promise.all(images.map(x=>x.complete?Promise.resolve():new Promise(r=>{x.addEventListener('load',r,{once:true});x.addEventListener('error',r,{once:true});}))).then(()=>scheduleWarm());
  });

  const formatDate = d => new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Hong_Kong'});
  const safePlay = video => video.play().catch(() => {
    if (!video.muted) {
      video.muted = true;
      video.play().catch(() => { $('announcement').textContent = 'Select this moment to play.'; });
      $('audio-state').textContent = 'Click for sound';
    } else {
      $('announcement').textContent = 'Select this moment to play.';
    }
  });
  atlas.months.forEach(([month,top],i) => {
    const label = document.createElement('div'); label.className='month'; label.style.top=((top-offset)/height*100)+'%';
    const title = document.createElement('b');title.textContent=monthNames[i];const year=document.createElement('small');year.textContent='2026';label.append(title,year);grid.append(label);
  });
  atlas.items.forEach((item,i) => {
    const [x,y,w,h]=item.rect, tile=document.createElement('button');tile.className='tile';tile.dataset.id=item.id;
    Object.assign(tile.style,{left:x/40+'%',top:(y-offset)/height*100+'%',width:w/40+'%',height:h/height*100+'%','--delay':(-i*.37)+'s','--origin':`${25+i%60}% ${30+i%55}%`});
    tile.setAttribute('aria-label',`${item.title}, ${formatDate(item.timestamp)}. Open moment`);tile.setAttribute('aria-expanded','false');
    const img=document.createElement('img');img.src=item.thumbnail;img.loading='lazy';img.fetchPriority='low';img.alt='';img.decoding='async';img.draggable=false;tile.append(img);if(!item.video){const flag=document.createElement('span');flag.className='still-flag';flag.textContent='Photo';tile.append(flag);}
    if(item.thumbnailVideo){const v=document.createElement('video');v.src=item.thumbnailVideo;v.muted=true;v.loop=true;v.playsInline=true;v.autoplay=!paused;v.poster=item.image;img.replaceWith(v);}
    if(item.label){const label=document.createElement('span');label.className='tile-label';label.textContent=item.label;tile.append(label);}
    tile.addEventListener('pointerenter',e=>{if(e.pointerType==='touch'||pinned)return;clearTimeout(closeTimer);clearTimeout(openTimer);openTimer=setTimeout(()=>open(item,tile,false),100);});
    tile.addEventListener('pointerleave',()=>{clearTimeout(openTimer);scheduleClose();});
    tile.addEventListener('focus',()=>{if(!pinned)open(item,tile,false);});
    tile.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();clearTimeout(openTimer);open(item,tile,true);});
    tile.addEventListener('click',e=>{if(e.detail===0){clearTimeout(openTimer);open(item,tile,true);}});
    tile.addEventListener('keydown',e=>{if(e.key==='Escape'){close();return;}const moves={ArrowRight:1,ArrowLeft:-1};if(moves[e.key]){e.preventDefault();const j=(i+moves[e.key]+atlas.items.length)%atlas.items.length;tiles.get(atlas.items[j].id).focus();}});
    tiles.set(item.id,tile);grid.append(tile);observer.observe(tile);
  });
  function scheduleClose(){clearTimeout(closeTimer);closeTimer=setTimeout(()=>{if(!pinned)close();},180);}
  function updateText(){if(!active)return;$('moment-title').textContent=active.title;$('audio-state').dataset.pending=String(!active.video);$('caption').textContent='"'+(chinese?active.captionZh:active.caption)+'"';$('moment-date').textContent=formatDate(active.timestamp);$('category').textContent=active.category;$('moment-time').textContent=new Date(active.timestamp).toLocaleTimeString('en-GB',{hour12:false,timeZone:'Asia/Hong_Kong'})+' HKT';$('pin-state').textContent=pinned?'Pinned · Esc to close':'Click to keep open';$('audio-state').textContent=!active.video?'Still photograph':active.hasAudio?($('moment-video').muted?'Click for sound':'Sound on'):'Audio unavailable';}
  function position(tile){const r=tile.getBoundingClientRect(),p=panel.getBoundingClientRect(),vw=innerWidth,vh=innerHeight;const x=Math.max(12,Math.min(vw-p.width-12,r.left+r.width/2-p.width/2));const y=Math.max(12,Math.min(vh-p.height-12,r.top+r.height/2-p.height*.36));panel.style.left=x+'px';panel.style.top=y+'px';panel.style.setProperty('--anchor',`${r.left+r.width/2-x}px ${r.top+r.height/2-y}px`);}
  function open(item,tile,keep){clearTimeout(closeTimer);if(pinned&&active?.id!==item.id&&!keep)return;const changed=active?.id!==item.id;
    if(active)tiles.get(active.id).classList.remove('active');if(active)tiles.get(active.id).setAttribute('aria-expanded','false');
    active=item;pinned=keep;previousFocus=tile;tile.classList.add('active');tile.setAttribute('aria-expanded','true');panel.hidden=false;document.body.classList.add('inspecting');
    if(changed){if(prefetchController){prefetchController.abort();prefetchController=null;}prefetchGeneration++;started=performance.now();const img=$('moment-image'),video=$('moment-video');if(!item.video)img.src=item.image;img.alt=item.title;video.pause();video.removeAttribute('src');img.hidden=!!item.video;video.hidden=!item.video;
      if(item.video){img.removeAttribute('src');video.poster=item.thumbnail;video.preload='auto';video.src=preloadCache.get(item.id)?.url||item.video;video.playbackRate=3;video.muted=!sound||!item.hasAudio;video.loop=true;if(!paused)safePlay(video);}
      panel.querySelector('.progress span').style.transform='scaleX(0)';loadGaze(item);
    }
    if(keep&&item.video&&item.hasAudio&&!changed){const video=$('moment-video');video.muted=false;if(!paused)safePlay(video);}
    updateText();position(tile);if(keep)$('close').focus({preventScroll:true});
  }
  function close(restore=false){clearTimeout(openTimer);clearTimeout(closeTimer);if(active){tiles.get(active.id).classList.remove('active');tiles.get(active.id).setAttribute('aria-expanded','false');}panel.hidden=true;$('moment-video').pause();$('moment-video').removeAttribute('src');$('moment-video').load();document.body.classList.remove('inspecting');const lastId=active?.id;active=null;pinned=false;scheduleWarm(lastId);if(restore&&previousFocus){const t=previousFocus;/* Suppress the focus-open handler while restoring keyboard location. */pinned=true;t.focus({preventScroll:true});pinned=false;}}
  panel.addEventListener('pointerenter',()=>{clearTimeout(closeTimer);clearTimeout(openTimer);});panel.addEventListener('pointerleave',scheduleClose);
  panel.addEventListener('click',e=>{if(e.target.closest('#close'))return;pinned=true;if(active?.video&&active.hasAudio){const video=$('moment-video');video.muted=false;if(!paused)safePlay(video);}updateText();});
  $('close').addEventListener('click',()=>close(true));document.addEventListener('keydown',e=>{if(e.key==='Escape')close(true);});
  document.addEventListener('pointerdown',e=>{if(!panel.contains(e.target)&&!e.target.closest('.tile'))close();});
  document.addEventListener('focusin',e=>{if(active&&!panel.contains(e.target)&&!e.target.closest('.tile'))close();});
  addEventListener('resize',()=>{if(active)position(tiles.get(active.id));});addEventListener('scroll',()=>{if(active)position(tiles.get(active.id));},{passive:true});
  function setPaused(value){paused=value;document.body.classList.toggle('paused',paused);$('motion').textContent=paused?'Play motion':'Pause motion';$('motion').setAttribute('aria-pressed',String(!paused));atlas.items.forEach(item=>{const img=tiles.get(item.id).querySelector('img');if(img)img.src=(!paused&&visible.has(item.id))?item.gif:item.thumbnail;});document.querySelectorAll('video').forEach(v=>{if(paused)v.pause();else if(v.getAttribute('src'))safePlay(v);});}
  $('motion').addEventListener('click',()=>setPaused(!paused));setPaused(paused);
  $('sound').addEventListener('click',()=>{sound=!sound;$('sound').textContent=sound?'Sound on':'Sound off';$('sound').setAttribute('aria-pressed',String(sound));$('moment-video').muted=!sound||!active?.hasAudio;if(active?.video&&!paused)safePlay($('moment-video'));updateText();});
  $('language').addEventListener('click',()=>{chinese=!chinese;$('language').textContent=chinese?'English':'中文';updateText();});
  let gazeEnabled=true,gazeFrames=null,gazeRaf=null;
  const gazeCache=new Map(),canvas=$('gaze-canvas');
  function loadGaze(item){
    gazeFrames=null;canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height);
    $('gaze-toggle').title=item.gaze?'Approximate recorded gaze: green point and yellow recent trail':'No aligned gaze record for this moment';
    if(!item.gaze)return;
    const id=item.id;
    if(!gazeCache.has(item.gaze))gazeCache.set(item.gaze,fetch(item.gaze).then(r=>{if(!r.ok)throw Error('gaze');return r.json()}).catch(()=>null));
    gazeCache.get(item.gaze).then(data=>{if(active?.id===id){gazeFrames=data?.frames||null;paintGaze();}});
  }
  function paintGaze(){
    if(gazeRaf){cancelAnimationFrame(gazeRaf);gazeRaf=null;}
    const v=$('moment-video'),box=canvas.getBoundingClientRect();
    if(!box.width||!box.height)return;
    const ratio=Math.min(devicePixelRatio||1,2),w=box.width,h=box.height;
    if(canvas.width!==Math.round(w*ratio)||canvas.height!==Math.round(h*ratio)){canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);}
    const ctx=canvas.getContext('2d');ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,w,h);
    if(active?.video&&gazeEnabled&&gazeFrames&&v.readyState>=2){
      const pts=gazeFrames[Math.min(gazeFrames.length-1,Math.floor(v.currentTime))]||[];
      const side=Math.max(w,h),ox=(w-side)/2,oy=(h-side)/2;
      const xy=pts.map(p=>[ox+p[0]*side,oy+p[1]*side]);
      if(xy.length){
        ctx.lineCap='round';ctx.lineWidth=2;
        for(let i=1;i<xy.length;i++){ctx.strokeStyle=`rgba(255,200,0,${.25+.65*i/xy.length})`;ctx.beginPath();ctx.moveTo(...xy[i-1]);ctx.lineTo(...xy[i]);ctx.stroke();}
        const [x,y]=xy[xy.length-1];ctx.strokeStyle='#00ff80';ctx.fillStyle='#00ff80';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,Math.max(4,side*18/1843),0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(x,y,1.5,0,Math.PI*2);ctx.fill();
      }
    }
    if(active?.video&&!v.paused&&!document.hidden)gazeRaf=requestAnimationFrame(paintGaze);
  }
  $('gaze-toggle').addEventListener('click',()=>{gazeEnabled=!gazeEnabled;$('gaze-toggle').textContent=gazeEnabled?'Gaze on':'Gaze off';$('gaze-toggle').setAttribute('aria-pressed',String(gazeEnabled));paintGaze();});
  $('moment-video').addEventListener('playing',paintGaze);
  $('moment-video').addEventListener('timeupdate',paintGaze);
  addEventListener('resize',paintGaze);

  $('moment-video').addEventListener('timeupdate',()=>{const v=$('moment-video');panel.querySelector('.progress span').style.transform=`scaleX(${v.duration?v.currentTime/v.duration:0})`;});
  document.addEventListener('visibilitychange',()=>{document.body.classList.toggle('paused',paused||document.hidden);atlas.items.forEach(item=>{const img=tiles.get(item.id).querySelector('img');if(img)img.src=(paused||document.hidden||!visible.has(item.id))?item.thumbnail:item.gif;});if(document.hidden)$('moment-video').pause();else if(active?.video&&!paused)safePlay($('moment-video'));});
})();
