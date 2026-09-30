(() => {
  const n = (kind, time, title, detail, children = []) => ({kind, time, title, detail, children});
  const root = n('plan', 'The evening before', 'Finish some work, or let the day open up?',
    'The evening preview leaves three routes open: finish a task, stay home, or head outside.', [
    n('actual', 'Morning · recorded', 'A campus start becomes a game detour',
      'A morning commute, AI posts, then a new game. The day is already moving away from the tidy study schedule.', [
      n('actual', 'Late morning · recorded', 'Play the game for a while',
        'The game takes a long stretch of the morning. Work can wait a little longer.', [
        n('actual', 'Afternoon · recorded', 'Research, videos, then rest',
          'An action-prediction discussion brings work back into the day. Later come Bilibili videos and a break for sleep.'),
        n('alternative', 'Afternoon · possible', 'Let the game take the whole day',
          'One more chapter becomes another. By evening, the assignment is still where it started.')
      ]),
      n('alternative', 'Late morning · possible', 'Close the game after ten minutes',
        'Keep the pleasure of a short detour, then choose what the rest of the day could hold.', [
        n('alternative', 'Afternoon · possible', 'Return to a small research question',
          'One interesting problem draws you back. The afternoon becomes a conversation rather than an obligation.'),
        n('alternative', 'Afternoon · possible', 'Choose a real rest',
          'Set the laptop aside and take the afternoon off. The pause has a beginning and an end.')
      ])
    ]),
    n('forecast', 'Morning · earlier preview', 'Take the library route',
      'Bring the assignment to the library and finish a piece of work before going home.', [
      n('forecast', 'Midday · possible', 'The task finally moves',
        'A difficult section starts to make sense. Lunch comes after the first piece is finished.', [
        n('forecast', 'Afternoon · possible', 'Carry the momentum into research',
          'The assignment sparks a question worth discussing. A classmate helps turn it into a new direction.'),
        n('alternative', 'Afternoon · possible', 'Notice fatigue and stop',
          'Leave while there is still energy for the evening. Work is only one part of the day.')
      ]),
      n('alternative', 'Midday · possible', 'The work stalls',
        'The document stays open, but attention shifts between videos and half-finished paragraphs.', [
        n('alternative', 'Afternoon · possible', 'Scroll between half-starts',
          'Stay at the desk until late afternoon. The hours pass without the progress the morning promised.'),
        n('alternative', 'Afternoon · possible', 'Leave with one useful question',
          'Write down the sticking point and ask a classmate over lunch. A stalled task becomes a shared problem.')
      ])
    ]),
    n('alternative', 'Morning · possible choice', 'Take the assignment to the waterfront',
      'Change the setting. Start with a view, and leave space for company as well as work.', [
      n('alternative', 'Midday · possible', 'Study outdoors, then meet for lunch',
        'Work through a few problems by the water. A classmate joins you for lunch.', [
        n('alternative', 'Afternoon · possible', 'Discuss a research idea together',
          'A lunchtime question grows into a research conversation. You return with a direction neither of you had planned.'),
        n('alternative', 'Afternoon · possible', 'Keep walking and let work wait',
          'The conversation continues along the shore. What stays with you is the company and the view.')
      ]),
      n('alternative', 'Midday · possible', 'The outing becomes a rest day',
        'The assignment stays in the bag. Lunch and a walk become the day’s main events.', [
        n('alternative', 'Afternoon · possible', 'Return home with room to think',
          'A quieter afternoon leaves space to read, reflect, or simply enjoy being home.'),
        n('alternative', 'Afternoon · possible', 'Stay out longer',
          'Meet a friend and explore somewhere new. The original plan can belong to tomorrow.')
      ])
    ])
  ]);
  const host = document.getElementById('choice-tree');
  if (!host) return;
  document.getElementById('tree-intro').textContent = 'After the exam, a day meant for catching up can become a game, a research conversation, or an afternoon by the water. Open the choices and see how each morning grows into a different day.';
  const viewport = host.querySelector('.canvas-viewport');
  const world = host.querySelector('.canvas-world');
  const nodesHost = host.querySelector('.canvas-nodes');
  const svg = host.querySelector('.canvas-links');
  const nodes = [];
  const WIDTH = 260, GAP = 36, STEP = 290;
  const camera = {x:0, y:0, scale:1};
  let bounds = {width:0,height:0};
  let ready = false;
  let selected = null;
  let animationFrame = 0;
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  function visit(node, parent=null, depth=0) {
    node.id = nodes.length; node.parent = parent; node.depth = depth; node.open = !parent;
    nodes.push(node);
    const button = document.createElement('button');
    button.type='button'; button.className='canvas-node '+node.kind;
    button.dataset.node=node.id; button.dataset.depth=depth;
    const time=document.createElement('span'); time.className='canvas-time'; time.textContent=node.time;
    const title=document.createElement('strong'); title.textContent=node.title;
    const detail=document.createElement('span'); detail.className='canvas-detail'; detail.textContent=node.detail;
    const state=document.createElement('span'); state.className='canvas-state'; state.setAttribute('aria-hidden','true');
    button.append(time,title,detail,state); node.element=button;
    button.draggable=false;
    button.addEventListener('click',event=>{
      if (event.detail && performance.now()<suppressClickUntil) return;
      stopAnimation();
      // Focus one generation at a time so its immediate choices stay readable.
      node.open=true;
      node.children.forEach(closeBranch);
      selected=node;
      layout();
      button.focus({preventScroll:true});
      focusNode(node);
    });
    nodesHost.append(button);
    node.children.forEach(child=>visit(child,node,depth+1));
  }
  visit(root);
  function visible(node) { return !node.parent || (node.parent.open && visible(node.parent)); }
  function measure(node) {
    node.span = node.open && node.children.length ? node.children.reduce((sum,child)=>sum+measure(child),0) : WIDTH+GAP;
    return node.span;
  }
  function place(node,left) {
    node.x=left+node.span/2-WIDTH/2; node.y=40+node.depth*STEP;
    let cursor=left;
    if(node.open) node.children.forEach(child=>{place(child,cursor);cursor+=child.span;});
  }
  function layout() {
    measure(root); place(root,24);
    const shown=nodes.filter(visible);
    bounds={width:root.span+48,height:Math.max(...shown.map(node=>node.y+(node.open?224:124)))+40};
    world.style.width=bounds.width+'px'; world.style.height=bounds.height+'px';
    svg.setAttribute('width',bounds.width); svg.setAttribute('height',bounds.height); svg.replaceChildren();
    for(const node of nodes) {
      const button=node.element; button.hidden=!visible(node);
      button.style.left=node.x+'px';button.style.top=node.y+'px';
      button.setAttribute('aria-expanded',String(node.open));
      button.setAttribute('aria-pressed',String(node===selected));
      button.classList.toggle('is-focused',node===selected);
      button.classList.toggle('is-muted',Boolean(selected && node!==selected && node.parent!==selected));
      button.querySelector('.canvas-detail').hidden=!node.open;
      button.querySelector('.canvas-state').textContent=node.open?'':(node.children.length?'+':'Read');
      if(node.parent && visible(node)) {
        const parent=node.parent;
        const x1=parent.x+WIDTH/2,y1=parent.y+(parent.open?224:124),x2=node.x+WIDTH/2,y2=node.y;
        const path=document.createElementNS('http://www.w3.org/2000/svg','path');
        path.setAttribute('d',`M ${x1} ${y1} C ${x1} ${y1+34}, ${x2} ${y2-34}, ${x2} ${y2}`);
        path.setAttribute('class',node.kind+(selected && node.parent!==selected?' is-muted':''));path.dataset.from=parent.id;path.dataset.to=node.id;
        svg.append(path);
      }
    }
  }
  function applyCamera() {
    world.style.transform=`translate(${camera.x}px,${camera.y}px) scale(${camera.scale})`;
    document.getElementById('canvas-zoom').value=Math.round(camera.scale*100)+'%';
    host.dataset.zoom=String(camera.scale);host.dataset.panX=String(camera.x);host.dataset.panY=String(camera.y);
  }
  function closeBranch(node) { node.open=false;node.children.forEach(closeBranch); }
  function stopAnimation() {cancelAnimationFrame(animationFrame);animationFrame=0;}
  function moveCamera(target) {
    stopAnimation();
    if(reducedMotion.matches) {Object.assign(camera,target);applyCamera();return;}
    const from={...camera},started=performance.now();
    function frame(now) {
      const t=Math.min(1,(now-started)/320),ease=1-Math.pow(1-t,3);
      for(const key of ['x','y','scale']) camera[key]=from[key]+(target[key]-from[key])*ease;
      applyCamera();
      if(t<1) animationFrame=requestAnimationFrame(frame);else animationFrame=0;
    }
    animationFrame=requestAnimationFrame(frame);
  }
  function focusNode(node) {
    const cx=node.x+WIDTH/2,cy=node.y+224/2;
    const group=[node,...node.children];
    const halfWidth=Math.max(...group.flatMap(item=>[Math.abs(item.x-cx),Math.abs(item.x+WIDTH-cx)]));
    const halfHeight=Math.max(...group.flatMap(item=>[Math.abs(item.y-cy),Math.abs(item.y+(item.open?224:124)-cy)]));
    const pad=24;
    const scale=Math.max(.08,Math.min(1,(viewport.clientWidth/2-pad)/halfWidth,(viewport.clientHeight/2-pad)/halfHeight));
    host.dataset.focusedNode=node.id;
    moveCamera({scale,x:viewport.clientWidth/2-cx*scale,y:viewport.clientHeight/2-cy*scale});
  }
  function fit() {
    stopAnimation();
    const pad=24;
    camera.scale=Math.max(.08,Math.min(1,(viewport.clientWidth-pad*2)/bounds.width,(viewport.clientHeight-pad*2)/bounds.height));
    camera.x=(viewport.clientWidth-bounds.width*camera.scale)/2;
    camera.y=Math.max(pad,(viewport.clientHeight-bounds.height*camera.scale)/2);
    applyCamera();
  }
  function zoom(factor,x=viewport.clientWidth/2,y=viewport.clientHeight/2) {
    stopAnimation();
    const next=Math.max(.08,Math.min(1.6,camera.scale*factor)),ratio=next/camera.scale;
    camera.x=x-(x-camera.x)*ratio; camera.y=y-(y-camera.y)*ratio;camera.scale=next;applyCamera();
  }
  host.querySelectorAll('[data-canvas]').forEach(button=>button.addEventListener('click',()=>{
    const action=button.dataset.canvas;
    if(action==='in') zoom(1.2);
    if(action==='out') zoom(1/1.2);
    if(action==='fit') fit();
    if(action==='expand') {selected=null;delete host.dataset.focusedNode;nodes.forEach(node=>node.open=Boolean(node.children.length));layout();fit();}
    if(action==='reset') {stopAnimation();selected=null;delete host.dataset.focusedNode;nodes.forEach(node=>node.open=!node.parent);layout();initialView();}
  }));
  function initialView() {
    if(viewport.clientWidth<600) {
      camera.scale=.85;camera.x=viewport.clientWidth/2-(root.x+WIDTH/2)*camera.scale;camera.y=28;applyCamera();
    } else fit();
  }
  let pointer=null,suppressClickUntil=0;
  // Capture immediately, disable native dragging, and keep a gesture through
  // the canvas edges. A drag must never turn into a node activation on release.
  viewport.addEventListener('dragstart',event=>event.preventDefault());
  viewport.addEventListener('click',event=>{
    if(event.detail && performance.now()<suppressClickUntil) {event.preventDefault();event.stopImmediatePropagation();}
  },true);
  viewport.addEventListener('pointerdown',event=>{
    if(!event.isPrimary || (event.pointerType==='mouse' && event.button!==0)) return;
    stopAnimation();
    event.preventDefault();
    const capture=event.target.closest('.canvas-node')||viewport;
    pointer={id:event.pointerId,x:event.clientX,y:event.clientY,cameraX:camera.x,cameraY:camera.y,capture,dragged:false};
    capture.setPointerCapture(event.pointerId);
  });
  viewport.addEventListener('pointermove',event=>{
    if(!pointer || pointer.id!==event.pointerId) return;
    const dx=event.clientX-pointer.x,dy=event.clientY-pointer.y;
    if(!pointer.dragged && Math.hypot(dx,dy)>4) {pointer.dragged=true;viewport.classList.add('is-dragging');}
    if(pointer.dragged) {event.preventDefault();camera.x=pointer.cameraX+dx;camera.y=pointer.cameraY+dy;applyCamera();}
  });
  function endDrag(event) {
    if(!pointer || pointer.id!==event.pointerId) return;
    if(pointer.dragged) suppressClickUntil=performance.now()+300;
    const capture=pointer.capture;pointer=null;
    if(capture.hasPointerCapture(event.pointerId)) capture.releasePointerCapture(event.pointerId);
    viewport.classList.remove('is-dragging');
  }
  viewport.addEventListener('pointerup',endDrag);viewport.addEventListener('pointercancel',endDrag);
  viewport.addEventListener('lostpointercapture',endDrag);
  // Trackpad panning is a wheel gesture, not a mouse pointer drag. Consume both
  // axes inside the canvas so horizontal swipes do not reach browser navigation.
  viewport.addEventListener('wheel',event=>{
    event.preventDefault();event.stopPropagation();stopAnimation();
    const rect=viewport.getBoundingClientRect();
    if(event.ctrlKey||event.metaKey) {zoom(Math.exp(-event.deltaY*.008),event.clientX-rect.left,event.clientY-rect.top);return;}
    const unit=event.deltaMode===1?16:event.deltaMode===2?viewport.clientHeight:1;
    camera.x-=event.deltaX*unit;camera.y-=event.deltaY*unit;applyCamera();
  },{passive:false});
  viewport.addEventListener('keydown',event=>{
    if(event.target!==viewport) return;
    const moves={ArrowLeft:[60,0],ArrowRight:[-60,0],ArrowUp:[0,60],ArrowDown:[0,-60]};
    if(moves[event.key]) {event.preventDefault();stopAnimation();camera.x+=moves[event.key][0];camera.y+=moves[event.key][1];applyCamera();}
    if(event.key==='+'||event.key==='=') {event.preventDefault();zoom(1.2);}
    if(event.key==='-') {event.preventDefault();zoom(1/1.2);}
  });
  new ResizeObserver(()=>{if(!ready)return;if(selected) focusNode(selected);else applyCamera();}).observe(viewport);
  layout();initialView();ready=true;
})();
