let questoes = [];
let questaoAtual = 0;
const letrasAlternativas = ['a', 'b', 'c', 'd'];
let respostasMarcadas = []; // Array para armazenar as respostas marcadas pelo usuário

async function carregarQuestoes() {
  try {
    console.log(`Buscando questões para matéria ID: ${materiaID}`);
    const response = await fetch(`http://localhost:3030/questao?materia_id=${materiaID}`);
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

  questaoNumeroElement.innerText = `Questão ${questaoIndex + 1} - Enunciado`;
  enunciadoElement.innerText = questao.enunciado;
  optionsElement.innerHTML = ""; // Limpa as opções anteriores

  questao.alternativas.forEach((resposta, index) => {
    const label = document.createElement("label");
    const input = document.createElement("input");
    const span = document.createElement("span");

    input.type = "radio";
    input.name = `resposta-${questao.id}`; // Usar um nome único para cada questão
    input.value = resposta.id;

    // Verificar se essa resposta está marcada
    if (respostasMarcadas[questao.id] === resposta.id) {
      input.checked = true;
    }

    // Adicionar a letra da alternativa antes do texto
    span.innerText = `${letrasAlternativas[index]}) ${resposta.alternativa}`;

    label.appendChild(input);
    label.appendChild(span);
    optionsElement.appendChild(label);

    // Adicionar evento para marcar a resposta selecionada
    input.addEventListener('change', () => {
      marcarResposta(questao.id, resposta.id);
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

async function enviarRespostas() {
  try {
    const dadosUsuario = JSON.parse(localStorage.getItem('usuario'));
    if (!dadosUsuario || !dadosUsuario.idusuario) {
      throw new Error('Dados do usuário não encontrados no localStorage.');
    }
    const idusuario = dadosUsuario.idusuario;
    const respostasFormatadas = questoes.map((questao) => ({
      idquestao: questao.id,
      idresposta: respostasMarcadas[questao.id] || null // Caso não tenha resposta marcada, envia null
    }));

    // Envia as respostas para o backend
    const respostaEnvio = await fetch('http://localhost:3030/questionario', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idusuario, materiaID, questoes: respostasFormatadas }),
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

// Chama a função para carregar as questões ao iniciar a página
carregarQuestoes();