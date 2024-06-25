const { pool } = require("./bd.js");

async function cadastrarUsuario(req, res) {
  // Desestrutura as propriedades mail e nome
  // do objeto JSON que está no body da requisição HTTTP
  const { mail, nome, senha } = req.body;
  if (!mail || mail.length == 0) {
    return res.json({ erro: "Forneça o e-mail." });
  } else if (!nome || nome.length == 0) {
    return res.json({ erro: "Forneça o nome." });
  } else if (!senha || senha.length == 0){
    return res.json({erro: "Forneça a senha."});
  } else {
    // Antes de criar um novo usuário, vamos ver se o e-mail já existe
    let resposta = await pool.query(
      "SELECT idusuario,mail,nome,senha FROM tbusuario WHERE mail=$1 LIMIT 1",
      [mail]
    );
    // Verifica se o usuário existe na tbusuario
    if (resposta.rowCount > 0) {
      // retorna o usuário já existe na tbusuario
      return res.json(resposta.rows[0]);
    } else {
      // Insere um registro na tbusuario
      resposta = await pool.query(
        "INSERT INTO tbusuario(mail,nome,senha) VALUES ($1,$2,$3) RETURNING idusuario, mail, nome, senha",
        [mail, nome, senha]
      );
      // Retorna o registro inserido no formato JSON
      let novoUsuario = resposta.rows[0];
      novoUsuario.session = true;
      return res.json(novoUsuario);
    }
  }
}

async function login(req, res) {
  const { mail, senha } = req.body;
  
  if (!mail || mail.length === 0 || !senha || senha.length === 0) {
    return res.json({ erro: "Forneça o e-mail e senha." });
  }

  try {
    // Procura na tbusuario o registro que corresponde ao e-mail e senha
    let resposta = await pool.query(
      "SELECT idusuario, mail, nome FROM tbusuario WHERE mail = $1 AND senha = $2 LIMIT 1",
      [mail, senha]
    );

    // Verifica se o usuário existe na tbusuario
    if (resposta.rowCount > 0) {
      let usuario = resposta.rows[0];
      usuario.session = true;
      // Retorna o registro no formato JSON
      return res.json(usuario);
      // Retorna o registro no formato JSON
    } else {
      return res.json({ erro: "E-mail ou senha incorretos." });
    }
  } catch (error) {
    console.error("Erro ao tentar fazer login:", error);
    return res.status(500).json({ erro: "Erro interno ao tentar fazer login." });
  }
}

// Exporta as funções
module.exports = { cadastrarUsuario, login };
