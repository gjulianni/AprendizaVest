function salvarLogin(objeto) {
  console.log("Salvando login:", objeto);
  
  // Adiciona uma propriedade session para indicar que a sessão está ativa
  objeto.session = true;
  console.log("Objeto atualizado com session:", objeto);
  
  // JSON.stringify() é usado para converter de objeto JS em string JSON
  localStorage.setItem("usuario", JSON.stringify(objeto));
  console.log('Usuário salvo no localStorage:', localStorage.getItem('usuario'));
}

function logar() {
  console.log("Iniciando login");

  const mail = document.getElementById("login-mail").value.trim();
  const senha = document.getElementById("login-senha").value.trim();

  if (!mail || mail.length === 0 || !senha || senha.length === 0) {
    document.getElementsByClassName("errormsg")[0].innerText = "Por favor, insira seu e-mail e senha para logar.";
    document.getElementsByClassName("errormsg")[0].style.display = "flex";
  } else {
    document.getElementsByClassName("errormsg")[0].style.display = "none";
    const usuario = { mail, senha };

    // Configuração da requisição
    const url = `${urlbase}/login`;

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(usuario),
    };

    // Submete a requisição
    fetch(url, options)
      .then((response) => {
        console.log("Resposta recebida");
        if (!response.ok) {
          alert("Erro na requisição");
        }
        return response.json();
      })
      .then((data) => {
        console.log("Dados recebidos:", data);
        if (data.idusuario) {
          data.session = true;
          salvarLogin(data);
          window.location.href = "../front/index.html";
        } else {
          alert(data.erro);
        }
      })
      .catch((error) => {
        console.error("Erro:", error);
      });
  }
}

// Função para verificar se o usuário está logado
function isUserLoggedIn() {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  return usuario && usuario.session === true;
}
