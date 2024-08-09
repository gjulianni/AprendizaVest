CREATE TABLE tbusuario (
  idusuario SERIAL NOT NULL,
  nome VARCHAR(100) NOT NULL,
  mail VARCHAR(100) NOT NULL,
  senha VARCHAR(100) NOT NULL,
  PRIMARY KEY(idusuario),
  UNIQUE(mail)
);

CREATE TABLE materias (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL
);

CREATE TABLE questoes (
    id SERIAL PRIMARY KEY,
    materia_id INT REFERENCES materias(id),
    enunciado TEXT NOT NULL
);

CREATE TABLE respostas (
    id SERIAL PRIMARY KEY,
    questao_id INT REFERENCES questoes(id),
    alternativas TEXT NOT NULL,
    correta BOOLEAN NOT NULL
);

CREATE TABLE avaliacoes (
    id SERIAL PRIMARY KEY,
    id_usuario INT REFERENCES tbusuario(idusuario),
    materia_id INT REFERENCES materias(id),
    score INT DEFAULT 0,
    datahorario TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE avaliacoesinfo (
    id SERIAL PRIMARY KEY,
    avaliacao_id INT REFERENCES avaliacoes(id),
    questao_id INT REFERENCES questoes(id),
    res_selecionada_id INT REFERENCES respostas(id),
    correta BOOLEAN NOT NULL
);


