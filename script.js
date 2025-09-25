const SUPABASE_URL = "https://qbfqbapicbhutqmingvk.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiZnFiYXBpY2JodXRxbWluZ3ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3NTAyOTYsImV4cCI6MjA3NDMyNjI5Nn0.Je3a2LR76gETeHeIhcUMyk05MpE3PYhaI6YeZG1YDyQ";
const BUCKET = "scans";

const supabase = supabaseJs.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

const uploadBtn = document.getElementById('uploadBtn');
const fileInput = document.getElementById('file');
const titleInput = document.getElementById('title');
const listDiv = document.getElementById('list');
const filePreview = document.getElementById('filePreview');
const searchInput = document.getElementById('searchInput');
const toastDiv = document.getElementById('toast');

const loginSection = document.getElementById('loginSection');
const scanSection = document.getElementById('scanSection');

function showToast(msg){
  toastDiv.textContent=msg;
  toastDiv.classList.add('show');
  setTimeout(()=>toastDiv.classList.remove('show'),3000);
}

// --- LOGIN ---
loginBtn.onclick = async ()=>{
  const email=emailInput.value;
  const password=passwordInput.value;
  const {data,error}=await supabase.auth.signInWithPassword({email,password});
  if(error){ showToast('Erreur login: '+error.message); return; }
  showToast('Connecté !');
  loginSection.style.display='none';
  scanSection.style.display='block';
  loadList();
};

// --- LOGOUT ---
logoutBtn.onclick = async ()=>{
  await supabase.auth.signOut();
  showToast('Déconnecté !');
  loginSection.style.display='block';
  scanSection.style.display='none';
};

// --- PREVIEW ---
fileInput.addEventListener('change',()=>{
  filePreview.innerHTML='';
  const file=fileInput.files[0];
  if(!file) return;
  if(file.type.startsWith('image/')){
    const reader=new FileReader();
    reader.onload=()=>filePreview.innerHTML=`<img src="${reader.result}">`;
    reader.readAsDataURL(file);
  } else {
    filePreview.innerHTML=`<p>Fichier prêt à uploader: ${file.name}</p>`;
  }
});

function escapeHtml(s){ return (s+'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

// --- UPLOAD ---
uploadBtn.onclick=async ()=>{
  const file=fileInput.files[0];
  const title=titleInput.value||"Sans titre";
  if(!file) return showToast('Choisis un fichier.');
  uploadBtn.disabled=true; uploadBtn.textContent='Upload...';

  try{
    const timestamp=Date.now();
    const path=`${timestamp}_${file.name}`;
    const {error:upErr}=await supabase.storage.from(BUCKET).upload(path,file,{cacheControl:'3600',upsert:false});
    if(upErr) throw upErr;

    showToast('Upload réussi !');
    fileInput.value=''; titleInput.value=''; filePreview.innerHTML='';
    loadList();
  } catch(err){ console.error(err); showToast('Erreur: '+(err.message||JSON.stringify(err))); }
  finally{ uploadBtn.disabled=false; uploadBtn.textContent='Uploader'; }
};

// --- LISTE ---
async function loadList(){
  listDiv.innerHTML='Chargement...';
  try{
    const {data,error}=await supabase.storage.from(BUCKET).list('');
    if(error) throw error;
    if(!data || data.length===0){ listDiv.innerHTML='<i>Aucun scan pour le moment.</i>'; return; }

    const search=searchInput.value.toLowerCase();
    listDiv.innerHTML='';
    data.filter(f=>f.name.toLowerCase().includes(search)).forEach(f=>{
      const url=`${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${f.name}`;
      const div=document.createElement('div');
      div.className='scan';
      div.innerHTML=`<strong>${escapeHtml(f.name)}</strong><br>`;
      if(f.name.toLowerCase().endsWith('.pdf')){
        div.innerHTML+=`<a href="${url}" target="_blank">Ouvrir PDF</a>`;
      } else {
        div.innerHTML+=`<img src="${url}" alt="${escapeHtml(f.name)}">`;
      }
      listDiv.appendChild(div);
    });
  } catch(err){ console.error(err); listDiv.innerHTML='<i>Erreur chargement</i>'; }
}

searchInput.addEventListener('input',loadList);
