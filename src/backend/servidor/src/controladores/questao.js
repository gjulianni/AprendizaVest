const { pool } = require('./bd'); // Ajuste o caminho se necessário

// Função para listar questões e alternativas filtradas por matéria
const listarQuestao = async (req, res) => {
    const materiaId = parseInt(req.query.materia_id, 10); // Obtém o ID da matéria da query string

    if (isNaN(materiaId)) {
        return res.status(400).send('Parâmetro materia_id é necessário e deve ser um número');
    }

    try {
        // Consulta para obter questões com alternativas filtradas pela matéria
        const result = await pool.query(`
            SELECT q.id AS questao_id, q.enunciado, a.id AS resposta_id, a.alternativas, a.correta
            FROM questoes q
            LEFT JOIN respostas a ON q.id = a.questao_id
            WHERE q.materia_id = $1
            ORDER BY q.id, a.id
        `, [materiaId]);

        // Organize os resultados em formato JSON
        const questoes = result.rows.reduce((acc, row) => {
            const { questao_id, enunciado, resposta_id, alternativas, correta } = row;

            // Se a questão não está no acumulador, adicione-a
            if (!acc[questao_id]) {
                acc[questao_id] = {
                    id: questao_id,
                    enunciado: enunciado,
                    alternativas: []
                };
            }

            // Adicione as alternativas à questão
            if (resposta_id) {
                acc[questao_id].alternativas.push({
                    id: resposta_id,
                    alternativa: alternativas,
                    correta: correta
                });
            }

            return acc;
        }, {});

        // Converta o objeto de questões em um array
        const questoesArray = Object.values(questoes);

        // Envie a resposta como JSON
        res.json(questoesArray);
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao buscar questões e alternativas');
    }
};

module.exports = {
    listarQuestao,
};