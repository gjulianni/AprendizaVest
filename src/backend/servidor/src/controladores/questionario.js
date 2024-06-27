const { pool } = require("./bd.js");


async function listarQuestionario(req, res) {
  const { idusuario } = req.body;

  if (!idusuario) {
    return res.json({ erro: "Forneça os seus dados." });
  } else {
    try {
      let resposta = await pool.query(
        `SELECT idquestionario, datahorario, nota::float
         FROM tbquestionario
         WHERE idusuario = $1`,
        [idusuario]
      );

      if (resposta.rowCount > 0) {
        const questionario = resposta.rows[0];

        resposta = await pool.query(
          `SELECT b.enunciado, a.resposta as "respondido", b.resposta as "correto" 
           FROM tbquestao_por_questionario as a
           JOIN tbquestao as b ON a.idquestao = b.idquestao
           WHERE a.idquestionario = $1`,
          [questionario.idquestionario]
        );

        return res.json({ questionario, questoes: resposta.rows });
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
  const { idusuario, idavaliacao, respostas } = req.body;

  if (!idusuario || !idavaliacao || !respostas || respostas.length === 0) {
    return res.status(400).json({ erro: "Dados incompletos." });
  }

  try {
    // Verifica se o usuário já tem alguma avaliação aprovada nesta avaliação
    const resposta = await pool.query(
      `SELECT nota::float
       FROM tbquestionario
       WHERE idusuario = $1 AND idavaliacao = $2 AND nota >= 70`,
      [idusuario, idavaliacao]
    );

    if (resposta.rowCount > 0 && resposta.rows[0].nota >= 70) {
      return res.status(400).json({
        erro: `Você já foi aprovado nesta avaliação com nota ${resposta.rows[0].nota}.`
      });
    }

    // Calcula a nota com base nas respostas
    let acertos = 0;
    for (const resposta of respostas) {
      const resultado = await pool.query(
        `SELECT correta
         FROM tbresposta
         WHERE idresposta = $1`,
        [resposta.idresposta]
      );

      if (resultado.rows.length > 0 && resultado.rows[0].correta) {
        acertos++;
      }
    }

    const totalQuestoes = respostas.length;
    const nota = (acertos / totalQuestoes) * 100;

    if (nota >= 70) {
      // Registra o questionário com nota >= 70 no banco
      const queryInsertQuestionario = `
        INSERT INTO tbquestionario (idusuario, idavaliacao, nota)
        VALUES ($1, $2, $3)
        RETURNING idquestionario`;
      const valuesInsertQuestionario = [idusuario, idavaliacao, nota];

      const { rows } = await pool.query(queryInsertQuestionario, valuesInsertQuestionario);
      const idquestionario = rows[0].idquestionario;

      // Registra as respostas no questionário
      for (const resposta of respostas) {
        await pool.query(
          `INSERT INTO tbquestao_por_questionario (idquestionario, idquestao, idresposta)
           VALUES ($1, $2, $3)`,
          [idquestionario, resposta.idquestao, resposta.idresposta]
        );
      }

      return res.status(201).json({ mensagem: "Avaliação registrada com sucesso.", nota });
    } else {
      return res.status(400).json({ erro: `Sua nota foi ${nota}. Você não atingiu a nota mínima para aprovação.` });
    }
  } catch (error) {
    return res.status(500).json({ erro: "Erro ao salvar avaliação.", detalhes: error.message });
  }
}

async function verificarAprovacao(idusuario) {

  if (!idusuario) {
    throw new Error("Forneça o ID do usuário.");
  }

  let resposta = await pool.query(
    `SELECT idquestionario, nota::float, datahorario
     FROM tbquestionario
     WHERE idusuario = $1 AND nota >= 70
     ORDER BY datahorario DESC
     LIMIT 1`,  // Obtém apenas o questionário mais recente com nota >= 70
    [idusuario]
  );

  if (resposta.rowCount > 0) {

    const idQuestionario = resposta.rows[0].idquestionario;

      // Agora, obtenha as respostas associadas a esse questionário
      
      const respostasQuestoes = await pool.query(
        `SELECT q.enunciado, qq.resposta
       FROM tbquestao_por_questionario qq
       JOIN tbquestao q ON qq.idquestao = q.idquestao
       WHERE qq.idquestionario = $1`,
      [idQuestionario]
      );

        
      const respostasApenas = respostasQuestoes.rows.map(item => ({
        enunciado: item.enunciado,
        resposta: item.resposta
    }));

    return {
        aprovado: true,
        nota: resposta.rows[0].nota,
        datahorario: resposta.rows[0].datahorario,
        respostasQuestionario: respostasApenas
    };
  } else {
    return {
      aprovado: false,
      nota: null,
      datahorario: null,
      respostasQuestionario: null
    };
  }
}

// Exporta as funções
module.exports = { listarQuestionario, salvarQuestionario, verificarAprovacao };