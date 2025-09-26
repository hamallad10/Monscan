// ---------- CONFIGURE ICI ----------
const SUPABASE_URL = "https://qbfqbapicbhutqmingvk.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiZnFiYXBpY2JodXRxbWluZ3ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3NTAyOTYsImV4cCI6MjA3NDMyNjI5Nn0.Je3a2LR76gETeHeIhcUMyk05MpE3PYhaI6YeZG1YDyQ";
const BUCKET = "scans";
// ---------- FIN CONFIG ----------

const supabase = supabaseJs.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// elements
const loginSection = document.getElementById('loginSection');
const scanSection = document.getElementById('scanSection');
const historySection = document.getElementById('historySection');
const emailEl = document.getElementById('email');
const passEl = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const uploadBtn = document.getElementById('uploadBtn');
const fileEl = document.getElementById('file');
const titleEl = document.getElementById('title');
const previewEl = document.getElementById('preview');
const dropArea = document.getElementById('dropArea');
const browseBtn = document.getElementById('browseBtn');
const clearBtn = document.getElementById('clearBtn');
const listDiv = document.getElementById('list');
const searchInput = document.getElementById('searchInput');
const toast = document.getElementById('toast');
const okSound = document.getElementById('okSound');
const errSound = document.getElementById('errSound');

let currentUser = null;

// UTIL
function showToast(msg, success=true){
  toast.textContent = msg;
  toast.classList.add('show');
  if(success && okSound) try{ okSound.play().catch(()=>{}) }catch(e){}
  if(!success && errSound) try{ errSound.play().catch(()=>{}) }catch(e){}
  setTimeout(()=>toast.classList.remove('show'),3000);
}
function escapeHtml(s){ return (s+'').replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

// AUTH: login + signup
loginBtn.addEventListener('click', async ()=>{
  const email = emailEl.value.trim(), password = passEl.value;
  if(!email || !password) return showToast('Email & mot de passe requis', false);
  loginBtn.disabled = true;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  loginBtn.disabled = false;
  if(error) return showToast('Erreur connexion: '+error.message, false);
  currentUser = data.user;
  postLogin();
});

signupBtn.addEventListener('click', async ()=>{
  const email = emailEl.value.trim(), password = passEl.value;
  if(!email || !password) return showToast('Email & mot de passe requis', false);
  signupBtn.disabled = true;
  const { data, error } = await supabase.auth.signUp({ email, password });
  signupBtn.disabled = false;
  if(error) return showToast('Erreur création: '+error.message, false);
  showToast('Compte créé — vérifie ton email');
});

// après login : afficher upload
function postLogin(){
  loginSection.classList.add('hidden');
  scanSection.classList.remove('hidden');
  loadList();
}

// vérif session existante
(async function init(){
  const { data } = await supabase.auth.getSession();
  if(data.session){
    currentUser = data.session.user;
    postLogin();
  } else {
    // non connecté; still show list (public read) but upload hidden
    loadList();
  }
})();


// DROPAREA / BROWSE
dropArea.addEventListener('click', ()=> fileEl.click());
browseBtn.addEventListener('click', ()=> fileEl.click());
dropArea.addEventListener('dragover', e=>{ e.preventDefault(); dropArea.classList.add('dragover'); });
dropArea.addEventListener('dragleave', e=>{ e.preventDefault(); dropArea.classList.remove('dragover'); });
dropArea.addEventListener('drop', e=>{
  e.preventDefault(); dropArea.classList.remove('dragover');
  const f = e.dataTransfer.files[0];
  if(f) handleFile(f);
});
fileEl.addEventListener('change', ()=> {
  if(fileEl.files && fileEl.files[0]) handleFile(fileEl.files[0]);
});
clearBtn.addEventListener('click', ()=> {
  fileEl.value = ''; titleEl.value=''; previewEl.innerHTML='';
});

// prévisualisation
function handleFile(file){
  previewEl.innerHTML = '';
  if(file.type.startsWith('image/')){
    const reader = new FileReader();
    reader.onload = ()=> previewEl.innerHTML = `<img src="${reader.result}" alt="preview">`;
    reader.readAsDataURL(file);
  } else {
    previewEl.innerHTML = `<div class="preview-file">${escapeHtml(file.name)} — ${Math.round(file.size/1024)} KB</div>`;
  }
}

// UPLOAD (seul utilisateur autorisé peut)
uploadBtn.addEventListener('click', async ()=>{
  if(!currentUser) return showToast('Connecte-toi pour uploader', false);
  const file = fileEl.files[0];
  if(!file) return showToast('Choisir un fichier', false);
  uploadBtn.disabled = true; uploadBtn.textContent = 'Upload en cours...';
  try{
    const timestamp = Date.now();
    const safeName = `${timestamp}_${file.name.replace(/\s+/g,'_')}`;
    const { error } = await supabase.storage.from(BUCKET).upload(safeName, file, { upsert: false });
    if(error) throw error;
    showToast('Upload réussi');
    fileEl.value=''; titleEl.value=''; previewEl.innerHTML='';
    loadList();
  }catch(err){
    console.error(err);
    showToast('Erreur upload: '+(err.message||err), false);
  }finally{
    uploadBtn.disabled=false; uploadBtn.textContent='Uploader';
  }
});

// LIST files
async function loadList(){
  listDiv.innerHTML = 'Chargement...';
  try{
    const { data, error } = await supabase.storage.from(BUCKET).list('', {limit: 200, sortBy: {column: 'created_at', order: 'desc'}} );
    if(error) throw error;
    if(!data || data.length===0){ listDiv.innerHTML = '<i>Aucun scan pour le moment.</i>'; return; }
    const q = (searchInput.value||'').toLowerCase();
    listDiv.innerHTML = '';
    for(const f of data){
      if(q && !f.name.toLowerCase().includes(q)) continue;
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${encodeURIComponent(f.name)}`;
      const item = document.createElement('div'); item.className = 'scan';
      const meta = document.createElement('div'); meta.className='meta';
      let content = `<strong>${escapeHtml(f.name)}</strong><div class="muted">Taille: ${Math.round((f.size||0)/1024)}KB</div>`;
      if(f.name.toLowerCase().endsWith('.pdf')){
        content += `<div><a href="${publicUrl}" target="_blank">Ouvrir PDF</a> · <a href="${publicUrl}" download>Télécharger</a></div>`;
      } else {
        content += `<div><img src="${publicUrl}" alt="${escapeHtml(f.name)}" style="max-width:120px;border-radius:6px;margin-top:8px"></div>`;
      }
      meta.innerHTML = content;
      item.appendChild(meta);
      listDiv.appendChild(item);
    }
  }catch(err){
    console.error(err);
    listDiv.innerHTML = '<i>Erreur de chargement</i>';
  }
}

// recherche
searchInput.addEventListener('input', ()=> loadList());
