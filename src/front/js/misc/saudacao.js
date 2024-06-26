// Importe as funções do pool de conexão com o banco de dados
const { pool } = require("../backend/servidor/src/controladores/bd.js");

// Nova rota para obter o nome do usuário
app.get("/usuario/nome", async (req, res) => {
  try {
   // Obtém o e-mail do usuário da requisição
   const emailUsuario = req.query.email;

   // Faz uma consulta ao banco de dados para obter o nome do usuário com base no e-mail
   const resultado = await pool.query("SELECT nome FROM tbusuario WHERE mail = $1", [emailUsuario]);

    // Se o usuário for encontrado, retorna o nome do usuário
    if (resultado.rows.length > 0) {
      const nomeUsuario = resultado.rows[0].nome;
      res.json({ nomeUsuario });
    } else {
      res.status(404).json({ erro: "Usuário não encontrado" });
    }
  } catch (erro) {
    console.error("Erro ao obter o nome do usuário:", erro);
    res.status(500).json({ erro: "Erro ao obter o nome do usuário" });
  }
});
