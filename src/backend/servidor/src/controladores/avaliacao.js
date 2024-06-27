const { pool } = require("./bd.js");

async function salvarAvaliacao(req, res) {
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

module.exports = { salvarAvaliacao };