const { pool } = require("./bd.js");

async function listarQuestao(req, res) {
  const { materia } = req.query; // Supondo que a matéria é passada como um parâmetro na query string

  try {
    const questoesQuery = `
      SELECT q.idquestao, q.enunciado, r.idresposta, r.texto, r.correta
      FROM tbquestao q
      JOIN tbresposta r ON q.idquestao = r.idquestao
      WHERE q.materia = $1
      ORDER BY q.idquestao`;

    const { rows: questoes } = await pool.query(questoesQuery, [materia]);

    const questoesFormatadas = {};

    questoes.forEach(row => {
      if (!questoesFormatadas[row.idquestao]) {
        questoesFormatadas[row.idquestao] = {
          idquestao: row.idquestao,
          enunciado: row.enunciado,
          respostas: []
        };
      }

      questoesFormatadas[row.idquestao].respostas.push({
        idresposta: row.idresposta,
        texto: row.texto,
        correta: row.correta
      });
    });

    console.log(`Matéria recebida: ${materia}`);
    console.log(`Questões encontradas: ${questoes.length}`);
    console.log(`Questões formatadas: `, questoesFormatadas);

    return res.json(Object.values(questoesFormatadas));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao listar questões." });
  }
}

module.exports = { listarQuestao };