// Import Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { getStorage, ref, uploadBytes, listAll, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-storage.js";

// ⚡ Remplace par ta config Firebase (copie depuis console.firebase.google.com)
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB0Rlt_n77KMKt2XSTVAiBi6xZCVOMg8GQ",
  authDomain: "myscan-3cc0b.firebaseapp.com",
  projectId: "myscan-3cc0b",
  storageBucket: "myscan-3cc0b.firebasestorage.app",
  messagingSenderId: "620077583319",
  appId: "1:620077583319:web:b39a2597a3671b5cbcd992",
  measurementId: "G-7TN4Y18L25"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
// Init Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);

// Sélecteurs
const loginSection = document.getElementById("loginSection");
const uploadSection = document.getElementById("uploadSection");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const loginError = document.getElementById("loginError");

const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");
const uploadMsg = document.getElementById("uploadMsg");
const scanList = document.getElementById("scanList");

// Connexion
loginBtn.onclick = () => {
  signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value)
    .catch(err => loginError.textContent = "Erreur: " + err.message);
};

// Déconnexion
logoutBtn.onclick = () => signOut(auth);

// Gestion état utilisateur
onAuthStateChanged(auth, (user) => {
  if (user) {
    loginSection.style.display = "none";
    uploadSection.style.display = "block";
    logoutBtn.style.display = "block";
  } else {
    loginSection.style.display = "block";
    uploadSection.style.display = "none";
    logoutBtn.style.display = "none";
  }
});

// Upload d’un scan
uploadBtn.onclick = async () => {
  const file = fileInput.files[0];
  if (!file) return alert("Choisis un fichier !");
  const fileRef = ref(storage, "scans/" + file.name);
  await uploadBytes(fileRef, file);
  uploadMsg.textContent = "✅ Upload réussi !";
  loadScans();
};

// Charger les scans
async function loadScans() {
  scanList.innerHTML = "Chargement...";
  const listRef = ref(storage, "scans/");
  const res = await listAll(listRef);
  scanList.innerHTML = "";
  for (const item of res.items) {
    const url = await getDownloadURL(item);
    const li = document.createElement("li");
    li.innerHTML = `<a href="${url}" target="_blank">${item.name}</a>`;
    scanList.appendChild(li);
  }
}
loadScans();
