// ১) Supabase প্রজেক্ট থেকে URL ও anon (public) key এখানে বসান। service_role key কখনো এখানে দেবেন না।
const SUPABASE_URL='https://unokdahndjolcptnqmbc.supabase.co',SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVub2tkYWhuZGpvbGNwdG5xbWJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM3ODI5MTIsImV4cCI6MjEwOTM1ODkxMn0.t3Vl1zHDw7YpYloin-KTZTsGbqlPKJPvfo3PGyKG8aY';
const LIVE=!SUPABASE_URL.startsWith('YOUR_');
const sb=LIVE?supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY):null;
const CATS=['গোপাল ভাঁড়','নাট বল্টু','CID','কার্টুন','বাংলা বিনোদন','অন্যান্য'];
const DEMO=CATS.slice(0,4).map((c,i)=>({id:'d'+i,title:c+' – নমুনা ভিডিও',description:'এটি ডেমো ভিডিও। Supabase যুক্ত করলে আপনার আপলোড করা ভিডিও এখানে দেখা যাবে।',cat:c,category_id:i+1,thumbnail_url:'',video_url:'https://www.w3schools.com/html/mov_bbb.mp4',duration:'০০:১০',allow_download:true,published:true,views:100*(i+1),created_at:new Date(Date.now()-i*864e5).toISOString()}));
const norm=s=>(s||'').normalize('NFC').toLowerCase();
const bn=n=>String(n).replace(/\d/g,d=>'০১২৩৪৫৬৭৮৯'[d]);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function getCats(){if(!LIVE)return CATS.map((n,i)=>({id:i+1,name:n}));const{data,error}=await sb.from('categories').select('*').order('name');if(error)throw error;return data}
async function getVideos(all){if(!LIVE)return DEMO;let q=sb.from('videos').select('*,categories(name)').order('created_at',{ascending:false});if(!all)q=q.eq('published',true);const{data,error}=await q;if(error)throw error;return data.map(v=>({...v,cat:v.categories?.name||'অন্যান্য'}))}
