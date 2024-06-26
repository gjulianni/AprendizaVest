document.addEventListener("DOMContentLoaded", exibirSaudacao);

function exibirSaudacao() {
    var saudacaoH2 = document.getElementById("greeting");
    var saudacao;
    var horaAtual = new Date().getHours();

    // Recupera os dados do usuário do localStorage
    var dadosUsuario = localStorage.getItem("usuario");

    if (!dadosUsuario) {
        saudacaoH2.textContent = "Erro";
        return;
    }

    // Converte os dados do usuário de JSON para objeto JavaScript
    dadosUsuario = JSON.parse(dadosUsuario);

    // Extrai o nome do usuário do objeto
    var nomeCompleto = dadosUsuario.nome;
    var primeiroNome = nomeCompleto.split(" ")[0];

    if (horaAtual >= 6 && horaAtual < 12) {
        saudacao = "Bom dia, " + primeiroNome + "! O que você quer estudar hoje?";
    } else if (horaAtual >= 12 && horaAtual < 18) {
        saudacao = "Boa tarde, " + primeiroNome + "! O que você quer estudar hoje?";
    } else {
        saudacao = "Boa noite, " + primeiroNome + "! O que você quer estudar hoje?";
    }

    saudacaoH2.textContent = saudacao;
}
