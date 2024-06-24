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
  const { idusuario, questoes } = req.body;

  if (!idusuario) {
    return res.json({ erro: "Forneça os seus dados." });
  } else if (!questoes || questoes.length == 0) {
    return res.json({ erro: "Forneça as questões do questionário." });
  } else {
    // Verifica se o usuário já tem algum questionário com nota >= 70
    let resposta = await pool.query(
      `SELECT nota::float
     FROM tbquestionario
     WHERE idusuario = $1 AND nota >= 70`,
      [idusuario]
      
    );

    if (resposta.rowCount > 0 && resposta.rows[0].nota > 0) {
      return res.status(201).json({
        erro: `Você não pode responder o questionário novamente. Você já foi aprovado com nota ${resposta.rows[0].nota}.`,
        nota: resposta.rows[0].nota,
      });
    } else {
      // Calcula a nota nas questões
      let soma = 0;
      for (let i = 0; i < questoes.length; i++) {
        // O comando SQL retorna 0 ou 1, sendo 1 ao acertar a questão
        resposta = await pool.query(
          `SELECT count(*)::INTEGER 
            FROM tbquestao
            WHERE idquestao = $1 AND resposta = $2`,
          [questoes[i].idquestao, questoes[i].resposta]
        );
        // somatório das notas
        soma += resposta.rows[0].count;
      }

      // Obtém a média de acertos
      let nota = (soma / questoes.length) * 100;

      if (nota >= 70) {
        // Cria o questionário
        const respostaQuestionario = await pool.query(
          "INSERT INTO tbquestionario(idusuario,nota) VALUES ($1,$2) RETURNING idquestionario,datahorario,nota",
          [idusuario, nota]
        );
        const idquestionario = respostaQuestionario.rows[0].idquestionario;
        if (idquestionario) {
          // Salva cada questão
          for (let i = 0; i < questoes.length; i++) {
            resposta = await pool.query(
              "INSERT INTO tbquestao_por_questionario(idquestionario,idquestao,resposta) VALUES ($1,$2,$3) RETURNING idquestionario,idquestao,resposta",
              [idquestionario, questoes[i].idquestao, questoes[i].resposta]
            );
          }
          return res.status(202).json(respostaQuestionario.rows[0]);
        } else {
          return res.json({ erro: "Problemas ao salvar o questionário. Tente novamente" });
        }
        
      } else {
        return res.status(400).json({ erro: `Você obteve nota ${nota}. Tente novamente.`, nota });
      }

    }
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