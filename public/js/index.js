// ============================================
// 🔥 Firebase Configuração e Importações
// ============================================
import app from '../../app/firebase-config.js';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);

// ============================================
// 👤 Autenticação de Usuário
// ============================================

let usuarioLogado = null; // Armazena o usuário autenticado

// Cadastro de novo usuário
const btnCadastro = document.getElementById("btnCadastrarUsuario");
if (btnCadastro) {
  btnCadastro.addEventListener("click", () => {
    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;

    if (!email || !senha) {
      alert("Preencha todos os campos.");
      return;
    }

    createUserWithEmailAndPassword(auth, email, senha)
    .then(() => {
      alert("Usuário cadastrado com sucesso!");
      window.location.href = "/index.html"; // Corrigido
    })
    .catch(tratarErro);
  });
}

// Login de usuário
const btnLogin = document.getElementById("fazerLogin");
if (btnLogin) {
  btnLogin.addEventListener("click", () => {
    const email = document.getElementById("nomeUsuario").value;
    const senha = document.getElementById("senhaUsuario").value;

    if (!email || !senha) {
      alert("Preencha todos os campos.");
      return;
    }

    signInWithEmailAndPassword(auth, email, senha)
      .then(() => {
        alert("Login realizado com sucesso!");
        modalLogin.style.display = "none";
      })
      .catch(tratarErro);
  });
}

// Tratamento de erros de autenticação
function tratarErro(error) {
  let mensagemErro = "";
  switch (error.code) {
    case "auth/email-already-in-use":
      mensagemErro = "Este e-mail já está em uso.";
      break;
    case "auth/invalid-email":
      mensagemErro = "E-mail inválido.";
      break;
    case "auth/weak-password":
      mensagemErro = "A senha deve ter pelo menos 6 caracteres.";
      break;
    case "auth/user-not-found":
    case "auth/wrong-password":
      mensagemErro = "E-mail ou senha incorretos.";
      break;
    default:
      mensagemErro = "Erro: " + error.message;
  }
  alert(mensagemErro);
}

// Monitorar estado de autenticação
onAuthStateChanged(auth, (user) => {
  usuarioLogado = user;

  const btnEntrar = document.getElementById("entrar");
  const btnCadastrar = document.getElementById("cadastrar");
  const btnFavoritos = document.getElementById("favoritos");
  const btnAddPublicao = document.getElementById("addPublicao");

  if (user) {
    btnEntrar && (btnEntrar.style.display = "none");
    btnCadastrar && (btnCadastrar.style.display = "none");
    btnLogout.style.display = "inline-block";

    btnFavoritos && (btnFavoritos.style.display = "inline-block");
    btnAddPublicao && (btnAddPublicao.style.display = "inline-block");
  } else {
    btnEntrar && (btnEntrar.style.display = "inline-block");
    btnCadastrar && (btnCadastrar.style.display = "inline-block");
    btnLogout.style.display = "none";

    btnFavoritos && (btnFavoritos.style.display = "none");
    btnAddPublicao && (btnAddPublicao.style.display = "none");
  }
});

// ============================================
// 🔓 Logout
// ============================================

const btnLogout = document.createElement("button");
btnLogout.id = "btnSair";
btnLogout.textContent = "Sair";
btnLogout.style.display = "none";
btnLogout.onclick = () => {
  signOut(auth).then(() => {
    alert("Você saiu da conta.");
    location.reload();
  });
};
document.querySelector(".entrarCadastrar")?.appendChild(btnLogout);

// ============================================
// 📦 Publicações - Postar, Listar, Favoritos
// ============================================

// Escapar caracteres especiais no código (evita XSS)
function escapeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Postar projeto
const btnPostar = document.getElementById("btnPostar");
if (btnPostar) {
  btnPostar.addEventListener("click", async () => {
    const titulo = document.getElementById("txtTituloPost").value;
    const descricao = document.getElementById("txtDescricaoPost").value;
    const codigoBruto = document.getElementById("txtCodigoPost").value;
    const github = document.getElementById("txtGithubPost").value;

    if (!usuarioLogado) {
      alert("Você precisa estar logado para postar um projeto.");
      return;
    }
    
    if (titulo && descricao && codigoBruto) {
      try {
        await addDoc(collection(db, "projetos"), {
          titulo,
          descricao,
          codigo: codigoBruto,
          github,
          data: new Date().toISOString(),
          uid: usuarioLogado.uid // Agora é obrigatório e sempre será válido
        });
        alert("Projeto postado com sucesso!");
        carregarPublicacoes();
        modalADDPublicao.style.display = "none";
      } catch (e) {
        console.error("Erro ao postar projeto: ", e);
        alert("Erro ao postar projeto. Tente novamente.");
      }
    } else {
      alert("Preencha todos os campos obrigatórios.");
    }
    
  });
}

// Carregar todas as publicações
async function carregarPublicacoes() {
  const lista = document.getElementById("listaPublicacoes");
  if (!lista) return;

  lista.innerHTML = "";

  const querySnapshot = await getDocs(collection(db, "projetos"));
  querySnapshot.forEach((doc) => {
    const data = doc.data();

    const card = document.createElement("div");
    card.className = "publicacao";

    const codigoEscapado = escapeHTML(data.codigo);

    card.innerHTML = `
      <h3><a href="detalhes.html?id=${doc.id}">${data.titulo}</a></h3>
      <p> ${data.descricao}</p>
      
    `;
    lista.appendChild(card);
  });
}


const btnFavoritos = document.getElementById("favoritos");

// Ver publicações do usuário logado
btnFavoritos.addEventListener("click", async () => {
  if (!usuarioLogado) {
    alert("Você precisa estar logado para ver suas publicações.");
    return;
  }

  const container = document.getElementById("listaPublicacoes");
  if (!container) return;

  container.innerHTML = "<p>Carregando suas publicações...</p>";

  try {
    const q = query(collection(db, "projetos"), where("uid", "==", usuarioLogado.uid));
    const snapshot = await getDocs(q);

    container.innerHTML = "";

    if (snapshot.empty) {
      container.innerHTML = "<p>Você ainda não publicou nada.</p>";
      return;
    }

    snapshot.forEach((docSnap, index) => {
      const data = docSnap.data();
      const html = `
        <div class="publicacao" data-id="${docSnap.id}">
          <h3><a href="detalhes.html?id=${docSnap.id}">${data.titulo}</a></h3>
          <p><strong>Descrição:</strong> ${data.descricao}</p>
          <div class="conteudoEscluir">
            <button class="btnExcluir">🗑️ Excluir</button>
          </div>  
          
        </div>
      `;
      container.innerHTML += html;
    });

    // ⬇️ Adiciona eventos de clique nos botões de exclusão
    container.querySelectorAll(".btnExcluir").forEach((btn) => {
      btn.addEventListener("click", async (event) => {
        const div = event.target.closest(".publicacao");
        const docId = div.getAttribute("data-id");

        if (confirm("Deseja realmente excluir esta publicação?")) {
          try {
            await deleteDoc(doc(db, "projetos", docId));
            alert("Publicação excluída com sucesso!");
            btnFavoritos.click(); // Recarrega
          } catch (err) {
            console.error("Erro ao excluir:", err);
            alert("Erro ao excluir publicação.");
          }
        }
      });
    });

  } catch (err) {
    console.error("Erro ao buscar publicações:", err);
    container.innerHTML = "<p>Erro ao carregar suas publicações.</p>";
  }
});







// ============================================
// 🧩 Modais de Login e Publicação
// ============================================

const modalLogin = document.getElementById("modalLogin");
const modalADDPublicao = document.getElementById("modalADDPublicao");
const addPublicao = document.getElementById("addPublicao");

// Modal de login
document.getElementById("entrar")?.addEventListener("click", () => {
  modalLogin.style.display = "block";
});
document.querySelector(".fecharEntrar")?.addEventListener("click", () => {
  modalLogin.style.display = "none";
});
window.addEventListener("click", (event) => {
  if (event.target === modalLogin) modalLogin.style.display = "none";
});

// Modal de adicionar publicação
if (addPublicao) {
  addPublicao.addEventListener("click", () => {
    if (usuarioLogado) {
      modalADDPublicao.style.display = "block";
    } else {
      alert("Você precisa estar logado para adicionar uma publicação.");
      modalLogin.style.display = "block";
    }
  });
}
document.querySelector(".fecharEntrarPublicao")?.addEventListener("click", () => {
  modalADDPublicao.style.display = "none";
});

// ============================================
// 🚀 Carregamento Inicial
// ============================================

window.addEventListener("DOMContentLoaded", carregarPublicacoes);
