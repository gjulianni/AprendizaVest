let questoes = [];
let questaoAtual = 0;
const letrasAlternativas = ['a', 'b', 'c', 'd'];
let respostasMarcadas = []; // Array para armazenar as respostas marcadas pelo usuário

async function carregarQuestoes() {
  try {
    const response = await fetch('http://localhost:3030/questao?materia=Gramática');
    if (!response.ok) {
      throw new Error('Erro ao carregar as questões.');
    }
    questoes = await response.json();
    if (questoes.length > 0) {
      atualizarQuestao(questoes, questaoAtual);
    } else {
      console.error('Nenhuma questão encontrada.');
    }
  } catch (error) {
    console.error('Erro ao carregar as questões:', error);
  }
}

function atualizarQuestao(questoes, questaoIndex) {
  const questao = questoes[questaoIndex];
  const questaoNumeroElement = document.getElementById("questao-numero");
  const enunciadoElement = document.getElementById("enunciado");
  const optionsElement = document.getElementById("options");

  questaoNumeroElement.innerText = `Questão ${questaoIndex + 1}`;
  enunciadoElement.innerText = questao.enunciado;
  optionsElement.innerHTML = ""; // Limpa as opções anteriores

  questao.respostas.forEach((resposta, index) => {
    const label = document.createElement("label");
    const input = document.createElement("input");
    const span = document.createElement("span");

    input.type = "radio";
    input.name = `resposta-${questao.idquestao}`; // Usar um nome único para cada questão
    input.value = resposta.idresposta;

    // Verificar se essa resposta está marcada
    if (respostasMarcadas[questao.idquestao] === resposta.idresposta) {
      input.checked = true;
    }

    // Adicionar a letra da alternativa antes do texto
    span.innerText = `${letrasAlternativas[index]}) ${resposta.texto}`;

    label.appendChild(input);
    label.appendChild(span);
    optionsElement.appendChild(label);

    // Adicionar evento para marcar a resposta selecionada
    input.addEventListener('change', () => {
      marcarResposta(questao.idquestao, resposta.idresposta);
    });
  });
}

function marcarResposta(idQuestao, idResposta) {
  respostasMarcadas[idQuestao] = idResposta; // Armazenar a resposta marcada
}

function questaoAnterior() {
  if (questaoAtual > 0) {
    questaoAtual--;
    atualizarQuestao(questoes, questaoAtual);
  }
}

function proximaQuestao() {
  if (questaoAtual < questoes.length - 1) {
    questaoAtual++;
    atualizarQuestao(questoes, questaoAtual);
  }
}

async function obterIdAvaliacao() {
    try {
      const resposta = await fetch('http://localhost:3030/questao?materia=Gramática');
      if (!resposta.ok) {
        throw new Error('Erro ao obter idavaliacao.');
      }
      const dados = await resposta.json();
      
      // Verifica se há questões retornadas e se a primeira questão tem idavaliacao
      if (dados.length > 0 && dados[0].idavaliacao) {
        return dados[0].idavaliacao;
      } else {
        throw new Error('ID de avaliação não encontrado.');
      }
    } catch (error) {
      console.error('Erro ao obter idavaliacao:', error.message);
      throw error;
    }
  }

async function enviarRespostas() {
  try {
    // Obtenha o usuário logado do localStorage
    const dadosUsuario = JSON.parse(localStorage.getItem('usuario'));
    const idusuario = dadosUsuario.idusuario;

    // Obtenha o idavaliacao da página atual
    const idavaliacao = await obterIdAvaliacao();
    if (!idavaliacao) {
      throw new Error('Não foi possível obter o ID de avaliação.');
    }

    // Obtenha as questões com idavaliacao da página atual
    const questoes = await obterQuestoes();

    // Prepara as respostas marcadas para envio ao backend
    const respostasFormatadas = questoes.map((questao, index) => ({
      idquestao: questao.idquestao,
      idresposta: respostasMarcadas[questao.idquestao] || null // Caso não tenha resposta marcada, envia null
    }));

    // Envia as respostas para o backend
    const respostaEnvio = await fetch('http://localhost:3030/questionario', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idusuario, idavaliacao, questoes: respostasFormatadas }),
    });

    if (respostaEnvio.ok) {
      console.log('Respostas enviadas com sucesso.');
    } else {
      throw new Error('Erro ao enviar respostas.');
    }
  } catch (error) {
    console.error('Erro ao enviar respostas:', error.message);
    throw error;
  }
}

async function obterQuestoes() {
  try {
    const resposta = await fetch('http://localhost:3030/questao?materia=Gramática');
    if (!resposta.ok) {
      throw new Error('Erro ao obter questões.');
    }
    const dados = await resposta.json();
    return dados;
  } catch (error) {
    console.error('Erro ao obter questões:', error.message);
    throw error;
  }
}

// Chama a função para carregar as questões ao iniciar a página
carregarQuestoes();