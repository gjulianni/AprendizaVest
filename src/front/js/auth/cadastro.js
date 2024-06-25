function salvarUsuario() {
  const mail = document.getElementById("mail").value.trim();
  const nome = document.getElementById("nome").value.trim();
  const senha = document.getElementById("senha").value.trim();

  if (!mail || mail.length == 0) {
    alert("Forneça o e-mail");
  } else if (!nome || nome.length == 0) {
    alert("Forneça o nome");
  } else  if (!senha || senha.length == 0){
    alert("Forneça a senha");
  } else {
    const usuario = { mail, nome, senha };

    // Configuração da requisição
    const url = `${urlbase}/usuario`;

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
        if (!response.ok) {
          alert("Erro na requisição");
        }
        return response.json();
      })
      .then((data) => {
        if (data.idusuario) {
          data.session = true;
          salvarLogin(data);
          window.location.href = "../front/index.html";
        }
        else{
          alert(data.erro);
        }
      })
      .catch((error) => {
        console.error("Erro:", error);
      });
  }
}

// Salvar dados de login
function salvarLogin(objeto) {
  objeto.session = true;
  // JSON.stringify() é usado para converter de objeto JS em string JSON
  localStorage.setItem("usuario", JSON.stringify(objeto));
}
