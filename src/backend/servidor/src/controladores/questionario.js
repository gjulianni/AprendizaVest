const { pool } = require("./bd.js");


async function listarQuestionario(req, res) {
  const { idusuario } = req.query;

  if (!idusuario) {
    return res.json({ erro: "Forneça os seus dados." });
  } else {
    try {
      // Obter as avaliações do usuário
      let resposta = await pool.query(
        `SELECT id, datahorario, score::float
         FROM avaliacoes
         WHERE id_usuario = $1`,
        [idusuario]
      );

      if (resposta.rowCount > 0) {
        const questionarios = resposta.rows;

        // Obter as questões e respostas associadas a cada avaliação
        for (const questionario of questionarios) {
          const questoesResposta = await pool.query(
            `SELECT b.enunciado, a.res_selecionada_id as "respondido", b.id as "correto"
             FROM avaliacoesinfo as a
             JOIN questoes as b ON a.questao_id = b.id
             WHERE a.avaliacao_id = $1`,
            [questionario.id]
          );

          questionario.questoes = questoesResposta.rows;
        }

        return res.json({ questionarios });
      } else {
        return res.json({
          erro: "Você não tem questionário respondido com nota para ser aprovado.",
        });
      }
    } catch (erro) {
      return res.status(500).json({ erro: "Erro ao listar questionário.", detalhes: erro.message });
    }
  }
}


/*
Padrão de requisição para cadastrar um questionário
{
  "idusuario":1,
  "questoes": [
    {"idquestao":2,"resposta":false},
    {"idquestao":5,"resposta":true},
    {"idquestao":10,"resposta":true},
    {"idquestao":15,"resposta":false}
  ]
}
*/



async function salvarQuestionario(req, res) {
  const { idusuario, materiaID, questoes } = req.body;

  if (!idusuario || !materiaID || !questoes || questoes.length === 0) {
    return res.status(400).json({ erro: "Dados incompletos." });
  }

  try {
    // Verifica se o usuário já tem alguma avaliação aprovada nesta matéria
    const resposta = await pool.query(
      `SELECT score::float
       FROM avaliacoes
       WHERE id_usuario = $1 AND materia_id = $2 AND score >= 7`,
      [idusuario, materiaID]
    );

    if (resposta.rowCount > 0 && resposta.rows[0].nota >= 0) {
      return res.status(400).json({
        erro: `Você já foi aprovado nesta avaliação com nota ${resposta.rows[0].nota}.`
      });
    }

    // Cria uma nova avaliação
    const novaAvaliacao = await pool.query(
      'INSERT INTO avaliacoes (id_usuario, materia_id) VALUES ($1, $2) RETURNING id',
      [idusuario, materiaID]
    );

    const idavaliacao = novaAvaliacao.rows[0].id;
    let score = 0;

    for (const questao of questoes) {
      const { idquestao, idresposta } = questao;
      
      // Verifica se a resposta está correta
      const result = await pool.query(
        'SELECT correta FROM respostas WHERE id = $1 AND questao_id = $2',
        [idresposta, idquestao]
      );

      const correta = result.rows.length > 0 && result.rows[0].correta;
      if (correta) {
        score += 1; // Incrementa a pontuação se a resposta estiver correta
      }

      // Salva a resposta na tabela de resultados
      await pool.query(
        `INSERT INTO avaliacoesinfo (avaliacao_id, questao_id, res_selecionada_id, correta)
         VALUES ($1, $2, $3, $4)`,
        [idavaliacao, idquestao, idresposta, correta]
      );
    }

    // Atualiza a avaliação com a pontuação total
    await pool.query(
      'UPDATE avaliacoes SET score = $1 WHERE id = $2',
      [score, idavaliacao]
    );

    res.json({ score });
  } catch (error) {
    console.error('Erro ao salvar questionário:', error);
    res.status(500).json({ erro: 'Erro ao salvar questionário.', detalhes: error.message });
  }
}

async function verificarAprovacao(idusuario, materiaID) {

  if (!idusuario) {
    console.log('forneca o idusuario');
    throw new Error("Forneça o ID do usuário.");
  }

  let resposta = await pool.query(
    `SELECT id, score::float, datahorario
         FROM avaliacoes
         WHERE id_usuario = $1 AND score >= 7 AND materia_id = $2
         ORDER BY datahorario DESC
         LIMIT 1`,  // Obtém apenas o questionário mais recente com nota >= 7
    [idusuario, materiaID]
  );

  if (resposta.rowCount > 0) {

    const idQuestionario = resposta.rows[0].id;

      // Agora, obtenha as respostas associadas a esse questionário
      
      const respostasQuestoes = await pool.query(
        `SELECT q.enunciado, r.alternativas AS resposta_selecionada
        FROM avaliacoesinfo qq
        JOIN questoes q ON qq.questao_id = q.id
        JOIN respostas r ON r.id = qq.res_selecionada_id
        WHERE qq.avaliacao_id = $1`,
      [idQuestionario]
      );
        
      const respostasApenas = respostasQuestoes.rows.map(item => ({
        enunciado: item.enunciado,
        resposta: item.resposta_selecionada
    }));

    return {
        aprovado: true,
        score: resposta.rows[0].score,
        datahorario: resposta.rows[0].datahorario,
        respostasQuestionario: respostasApenas
    };
  } else {
    return {
      aprovado: false,
      score: null,
      datahorario: null,
      respostasQuestionario: null
    };
  }
}

// Exporta as funções
module.exports = { listarQuestionario, salvarQuestionario, verificarAprovacao };