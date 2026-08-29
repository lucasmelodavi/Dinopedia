CREATE TABLE IF NOT EXISTS periodos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    confirmado BOOLEAN NOT NULL DEFAULT FALSE,
    codigo_confirmacao VARCHAR(10),
    codigo_expira BIGINT
);

CREATE TABLE IF NOT EXISTS dinossauros (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    nome_cientifico VARCHAR(200) NOT NULL,
    periodo_id INTEGER NOT NULL REFERENCES periodos(id),
    dieta VARCHAR(20) NOT NULL,
    descricao TEXT NOT NULL,
    comprimento NUMERIC(6,2),
    regiao VARCHAR(200),
    foto VARCHAR(500),
    ano_descoberta INTEGER,
    familia VARCHAR(100),
    destaque BOOLEAN NOT NULL DEFAULT FALSE,
    criado_por INTEGER REFERENCES usuarios(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS topicos (
    id SERIAL PRIMARY KEY,
    dinossauro_id INTEGER NOT NULL REFERENCES dinossauros(id) ON DELETE CASCADE,
    categoria VARCHAR(50) NOT NULL,
    texto TEXT NOT NULL,
    usuario_id INTEGER REFERENCES usuarios(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS edicoes (
    id SERIAL PRIMARY KEY,
    dinossauro_id INTEGER NOT NULL REFERENCES dinossauros(id) ON DELETE CASCADE,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
    campo VARCHAR(100) NOT NULL,
    valor_antigo TEXT,
    valor_novo TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dinossauros_periodo ON dinossauros(periodo_id);
CREATE INDEX IF NOT EXISTS idx_topicos_dinossauro ON topicos(dinossauro_id);
CREATE INDEX IF NOT EXISTS idx_edicoes_dinossauro ON edicoes(dinossauro_id);
CREATE INDEX IF NOT EXISTS idx_edicoes_usuario ON edicoes(usuario_id);

ALTER TABLE dinossauros ADD COLUMN IF NOT EXISTS destaque BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS foto VARCHAR(500);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS descricao TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS pontos INTEGER NOT NULL DEFAULT 0;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS enfeites TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS favorito_id INTEGER REFERENCES dinossauros(id) ON DELETE SET NULL;
ALTER TABLE dinossauros ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE dinossauros ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE dinossauros ADD COLUMN IF NOT EXISTS tipo VARCHAR(30) NOT NULL DEFAULT 'dinossauro';
ALTER TABLE dinossauros ADD COLUMN IF NOT EXISTS atributos JSONB NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS seguidores (
    seguidor_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    seguido_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (seguidor_id, seguido_id),
    CHECK (seguidor_id <> seguido_id)
);

CREATE INDEX IF NOT EXISTS idx_seguidores_seguido ON seguidores(seguido_id);
CREATE INDEX IF NOT EXISTS idx_seguidores_seguidor ON seguidores(seguidor_id);

CREATE TABLE IF NOT EXISTS imagens (
    id SERIAL PRIMARY KEY,
    caminho VARCHAR(300) UNIQUE NOT NULL,
    mime VARCHAR(80) NOT NULL,
    dados BYTEA NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pontos_eventos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo VARCHAR(40) NOT NULL,
    pontos INTEGER NOT NULL,
    referencia VARCHAR(120) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pontos_eventos_unico
    ON pontos_eventos (usuario_id, tipo, referencia);
CREATE INDEX IF NOT EXISTS idx_pontos_eventos_usuario ON pontos_eventos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_pontos ON usuarios(pontos DESC);

INSERT INTO periodos (nome) VALUES
    ('Triássico'),
    ('Jurássico'),
    ('Cretáceo'),
    ('Paleógeno'),
    ('Neógeno'),
    ('Pleistoceno'),
    ('Holoceno'),
    ('Outro')
ON CONFLICT (nome) DO NOTHING;
