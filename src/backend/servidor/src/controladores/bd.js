// Importa o pacote pg e desestrutura a propriedade Pool
const {Pool} = require("pg");
const dotenv = require("dotenv");
dotenv.config();

// Configura o pool de conexão, passando um objeto de configuração 
// contendo as informações necessárias para se conectar ao BD do PostgreSQL



const pool = new Pool({
  user: process.env.BDUSUARIO,
  host: process.env.BDHOST,
  database: process.env.BDNOME,
  password: process.env.BDSENHA,
  port: process.env.BDPORTA
});



// Configura o pool de conexão, passando um objeto de configuração 
// A URI de conexão precisa estar na variável de ambiente BDURI do arquivo .env
/* const pool = new Pool({
  connectionString: process.env.BDURI,
  ssl: {
    rejectUnauthorized: false // Ajuste necessário caso esteja utilizando SSL e seu ambiente requeira essa configuração
  }
});
*/
// Exporta a variável pool
module.exports = { pool };
