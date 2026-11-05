
const $=s=>document.querySelector(s),page=document.body.dataset.page,qs=new URLSearchParams(location.search);

const match=(v,t)=>norm(v.title+' '+v.cat+' '+(v.description||'')).includes(t);
const thumb=v=>v.thumbnail_url?`background-image:url('${esc(v.thumbnail_url)}')`:'';

const card=v=>`<a class="card" href="watch.html?id=${v.id}"><div class="th" style="${thumb(v)}"><b>${esc(v.duration)}</b></div><div class="ci"><h3>${esc(v.title)}</h3><small>${esc(v.cat)} • ${bn(v.views)} বার দেখা</small><div><span class="btn" style="padding:3px 16px;margin-top:8px">দেখুন</span></div></div></a>`;

const grid=a=>a.length?`<div class="grid">${a.map(card).join('')}</div>`:'<div class="ld">😕 কোনো ভিডিও পাওয়া যায়নি।</div>';

// Google Drive video ID বের করা
function getDriveId(url){
 try{
  const u=new URL(url);
  if(!u.hostname.includes('drive.google.com'))return null;

  let m=u.pathname.match(/\/file\/d\/([^/]+)/);
  if(m)return m[1];

  return u.searchParams.get('id');
 }catch{
  return null;
 }
}

// Google Drive download URL
function getDriveDownloadUrl(url){
 const id=getDriveId(url);
 return id?`https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}`:null;
}

// Header
$('#h').innerHTML=`
<div class="w bar">
 <a class="logo" href="index.html">Elite Gopal</a>
 <nav id="nv">
  <a href="index.html">হোম</a>
  <a href="videos.html">ভিডিও দেখুন</a>
  <a href="index.html#cats">ক্যাটাগরি</a>
  <a href="videos.html?sort=new">নতুন ভিডিও</a>
  <a href="about.html">আমাদের সম্পর্কে</a>
  <a href="contact.html">যোগাযোগ</a>
 </nav>
 <div class="sb">
  <input id="q" placeholder="🔍 ভিডিও খুঁজুন" autocomplete="off">
  <div id="sug"></div>
 </div>
 <button id="ham" aria-label="মেনু">☰</button>
</div>`;

// Footer
$('#f').innerHTML=`
<div class="w">
 <div class="logo">Elite Gopal</div>
 <p>
  <a href="about.html">আমাদের সম্পর্কে</a>
  <a href="contact.html">যোগাযোগ</a>
  <a href="about.html#privacy">গোপনীয়তা নীতি</a>
  <a href="about.html#terms">ব্যবহারের শর্তাবলী</a>
 </p>
 <p>© ${bn(new Date().getFullYear())} Elite Gopal। সর্বস্বত্ব সংরক্ষিত।</p>
</div>`;

$('#ham').onclick=()=>$('#nv').classList.toggle('open');

let ALL=[];
const qi=$('#q');

qi.oninput=async()=>{
 const t=norm(qi.value.trim());
 if(!t)return $('#sug').innerHTML='';

 try{
  if(!ALL.length)ALL=await getVideos();
 }catch{}

 const r=ALL.filter(v=>match(v,t)).slice(0,5);

 $('#sug').innerHTML=r.length
  ?r.map(v=>`<a href="watch.html?id=${v.id}">${esc(v.title)}</a>`).join('')
  :'<a>কোনো ফলাফল নেই</a>';
};

qi.onkeydown=e=>{
 if(e.key==='Enter'&&qi.value.trim())
  location.href='videos.html?q='+encodeURIComponent(qi.value.trim());
};

document.addEventListener('click',e=>{
 if(!e.target.closest('.sb'))$('#sug').innerHTML='';
});

// Pages
const pages={

async home(){
 const a=await getVideos();
 const cs=await getCats();
 const pop=[...a].sort((x,y)=>y.views-x.views);
 const f=pop[0];

 $('#app').innerHTML=
 (f?`
 <div class="w">
  <div class="hero" style="${f.thumbnail_url?`background-image:linear-gradient(#0007,#0007),url('${esc(f.thumbnail_url)}')`:''}">
   <div>
    <h1>${esc(f.title)}</h1>
    <p>${esc((f.description||'').slice(0,140))}</p>
    <p>
     <a class="btn" href="watch.html?id=${f.id}">এখনই দেখুন</a>
     <a class="btn o" href="about.html">আরও জানুন</a>
    </p>
   </div>
  </div>
 </div>`:'')
 +`
 <section>
  <div class="w">
   <h2>জনপ্রিয় ভিডিও</h2>
   ${grid(pop.slice(0,8))}
  </div>
 </section>

 <section class="gr">
  <div class="w">
   <h2>নতুন প্রকাশিত ভিডিও</h2>
   ${grid(a.slice(0,8))}
  </div>
 </section>

 <section id="cats">
  <div class="w">
   <h2>জনপ্রিয় ক্যাটাগরি</h2>
   <div class="grid">
    ${cs.map(c=>`<a class="cat" href="videos.html?cat=${c.id}">${esc(c.name)}</a>`).join('')}
   </div>
  </div>
 </section>`;
},

async videos(){
 const a=await getVideos();
 const cs=await getCats();

 let cat=qs.get('cat')||'';
 let sort=qs.get('sort')||'new';
 let q=qs.get('q')||'';
 let n=12;

 $('#app').innerHTML=`
 <div class="w">
  <h2 style="margin-top:24px">ভিডিও দেখুন</h2>
  <div class="row" id="ch"></div>
  <div class="row">
   <select id="so" class="chip">
    <option value="new">সর্বশেষ ভিডিও</option>
    <option value="pop">জনপ্রিয় ভিডিও</option>
   </select>
   <input id="fq" class="chip" placeholder="সার্চ বা ফিল্টার করুন" value="${esc(q)}">
  </div>
  <div id="gr"></div>
  <p style="text-align:center">
   <button class="btn" id="lm">আরও দেখুন</button>
  </p>
 </div>`;

 $('#so').value=sort;

 const draw=()=>{
  $('#ch').innerHTML=[
   {id:'',name:'সব'},...cs
  ].map(c=>`
   <button class="chip ${c.id==cat?'on':''}" data-c="${c.id}">
    ${esc(c.name)}
   </button>`).join('');

  const r=a.filter(v=>
   (!cat||v.category_id==cat)&&
   (!q||match(v,norm(q)))
  ).sort((x,y)=>
   sort=='pop'
    ?y.views-x.views
    :new Date(y.created_at)-new Date(x.created_at)
  );

  $('#gr').innerHTML=grid(r.slice(0,n));
  $('#lm').style.display=r.length>n?'':'none';
 };

 $('#ch').onclick=e=>{
  const b=e.target.closest('[data-c]');
  if(b){
   cat=b.dataset.c;
   n=12;
   draw();
  }
 };

 $('#so').onchange=e=>{
  sort=e.target.value;
  draw();
 };

 $('#fq').oninput=e=>{
  q=e.target.value.trim();
  n=12;
  draw();
 };

 $('#lm').onclick=()=>{
  n+=12;
  draw();
 };

 draw();
},

async watch(){
 const a=await getVideos();
 const i=a.findIndex(v=>v.id==qs.get('id'));
 const v=a[i];

 if(!v){
  return $('#app').innerHTML=`
   <div class="w ld">
    ভিডিওটি পাওয়া যায়নি।
    <a class="btn" href="videos.html">সব ভিডিও দেখুন</a>
   </div>`;
 }

 document.title=v.title+' – Elite Gopal';

 if(LIVE)sb.rpc('increment_views',{vid:v.id});
 v.views++;

 const rel=a.filter(x=>
  x.category_id==v.category_id&&x.id!=v.id
 ).slice(0,4);

 // ভিডিওটি Google Drive-এর নাকি সরাসরি আপলোড করা
 const driveId=getDriveId(v.video_url);
 const isDrive=!!driveId;

 // Google Drive হলে iframe, অন্যথায় video player
 const player=isDrive
  ?`
   <iframe
    id="pl"
    src="https://drive.google.com/file/d/${encodeURIComponent(driveId)}/preview"
    title="${esc(v.title)}"
    allow="autoplay; fullscreen"
    allowfullscreen
    style="width:100%;aspect-ratio:16/9;border:0;border-radius:14px;background:#000"
   ></iframe>`
  :`
   <video
    id="pl"
    controls
    playsinline
    poster="${esc(v.thumbnail_url||'')}"
    src="${esc(v.video_url||'')}"
    style="width:100%;max-height:70vh;border-radius:14px;background:#000"
   ></video>`;

 $('#app').innerHTML=`
 <div class="w" style="padding-top:20px">

  ${player}

  <h1>${esc(v.title)}</h1>

  <div class="row">
   <span class="chip">${esc(v.cat)}</span>
   <span>👁 ${bn(v.views)} বার দেখা</span>
   <span>📅 ${new Date(v.created_at).toLocaleDateString('bn-BD')}</span>
  </div>

  <p>${esc(v.description||'')}</p>

  <div class="row">
   ${v.allow_download&&v.video_url
    ?'<button class="btn" id="dl">⬇ ভিডিও ডাউনলোড</button>'
    :''}

   ${a[i-1]
    ?`<a class="btn o" href="watch.html?id=${a[i-1].id}">← আগের ভিডিও</a>`
    :''}

   ${a[i+1]
    ?`<a class="btn o" href="watch.html?id=${a[i+1].id}">পরের ভিডিও →</a>`
    :''}
  </div>

  <div id="dm"></div>

  <h2 style="margin-top:24px">সম্পর্কিত ভিডিও</h2>
  ${grid(rel)}

 </div>`;

 const m=$('#dm');
 const pl=$('#pl');

 // সরাসরি আপলোড করা ভিডিওতে error message
 if(!isDrive){
  pl.onerror=()=>{
   m.className='msg e';
   m.textContent='ভিডিওটি চালানো যাচ্ছে না। পরে আবার চেষ্টা করুন।';
  };
 }

 // Download button
 const dl=$('#dl');

 if(dl)dl.onclick=async()=>{
  m.className='msg';
  m.textContent='ডাউনলোড প্রস্তুত হচ্ছে...';

  // Google Drive video download
  if(isDrive){
   const downloadUrl=getDriveDownloadUrl(v.video_url);

   if(downloadUrl){
    window.open(downloadUrl,'_blank','noopener');
    m.textContent='Google Drive-এর ডাউনলোড পেজ খোলা হয়েছে। সেখানে Download অপশনে ক্লিক করুন।';
   }else{
    m.className='msg e';
    m.textContent='Google Drive ডাউনলোড লিংক তৈরি করা যায়নি।';
   }

   return;
  }

  // Supabase Storage / direct video download
  try{
   const r=await fetch(v.video_url);
   if(!r.ok)throw new Error('Download failed');

   const len=+r.headers.get('content-length');
   const rd=r.body.getReader();
   const ch=[];
   let got=0;

   for(;;){
    const{done,value}=await rd.read();
    if(done)break;

    ch.push(value);
    got+=value.length;

    if(len){
     m.textContent=`ডাউনলোড হচ্ছে... ${bn(Math.round(got/len*100))}%`;
    }
   }

   const u=URL.createObjectURL(new Blob(ch));
   const l=document.createElement('a');

   l.href=u;
   l.download=(v.title||'video')+'.mp4';
   document.body.appendChild(l);
   l.click();
   l.remove();

   setTimeout(()=>URL.revokeObjectURL(u),60000);

   m.textContent='✅ ডাউনলোড সম্পন্ন।';

  }catch{
   m.className='msg e';
   m.innerHTML=`
    সরাসরি ডাউনলোড করা যায়নি।
    <a href="${esc(v.video_url)}" target="_blank" rel="noopener">
     <u>এখানে ক্লিক করে ভিডিও খুলুন</u>
    </a>`;
  }
 };
},

about(){},

contact(){
 $('#cf').onsubmit=async e=>{
  e.preventDefault();

  const b=e.target.querySelector('button');
  const f=Object.fromEntries(new FormData(e.target));
  const m=$('#cm');

  b.disabled=true;
  b.textContent='পাঠানো হচ্ছে...';

  try{
   if(LIVE){
    const{error}=await sb.from('messages').insert(f);
    if(error)throw error;
   }

   e.target.reset();
   m.className='msg';
   m.textContent='✅ ধন্যবাদ! আপনার বার্তা সফলভাবে পাঠানো হয়েছে।';

  }catch{
   m.className='msg e';
   m.textContent='দুঃখিত, বার্তা পাঠানো যায়নি। আবার চেষ্টা করুন।';
  }

  b.disabled=false;
  b.textContent='পাঠান';
 };
}

};

// Page load
(async()=>{
 const a=$('#app');

 if(pages[page]&&page!='contact'){
  a.innerHTML='<div class="ld">লোড হচ্ছে...</div>';
 }

 try{
  await pages[page]?.();
 }catch(e){
  console.error(e);

  a.innerHTML=`
   <div class="w">
    <div class="msg e">
     দুঃখিত, তথ্য লোড করা যায়নি।
     ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।
    </div>
   </div>`;
 }
})();
