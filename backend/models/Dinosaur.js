const pool = require('../db/pool');
const config = require('../config');
const {
    DIETAS,
    FAMILIAS,
    normalizarDieta,
    normalizarPeriodo,
    semAcento
} = require('../config/constants');
const { geocodificar, espalhar } = require('../config/geocodigo');

const SORT_MAP = {
    nome: 'd.nome',
    periodo: 'p.nome',
    dieta: 'd.dieta',
    familia: 'd.familia',
    nomeCientifico: 'd.nome_cientifico',
    anoDescoberta: 'd.ano_descoberta',
    id: 'd.id'
};

class Dinosaur {
    static DIETAS_VALIDAS = DIETAS;

    static mapear(row) {
        if (!row) return null;

        return {
            id: row.id,
            nome: row.nome,
            nomeCientifico: row.nome_cientifico,
            periodo: row.periodo_nome,
            periodoId: row.periodo_id,
            dieta: row.dieta,
            familia: row.familia,
            descricao: row.descricao,
            comprimento: row.comprimento !== null ? Number(row.comprimento) : null,
            regiao: row.regiao,
            foto: row.foto,
            fotoUrl: row.foto ? `${config.publicUrl}${row.foto}` : null,
            anoDescoberta: row.ano_descoberta,
            destaque: Boolean(row.destaque),
            latitude: row.latitude !== null && row.latitude !== undefined ? Number(row.latitude) : null,
            longitude: row.longitude !== null && row.longitude !== undefined ? Number(row.longitude) : null,
            usuarioId: row.criado_por,
            autorNome: row.autor_nome || null,
            criadoEm: row.created_at,
            atualizadoEm: row.updated_at
        };
    }

    static async buscarPeriodoId(nomePeriodo) {
        const periodo = normalizarPeriodo(nomePeriodo);
        const resultado = await pool.query('SELECT id, nome FROM periodos');
        const encontrado = resultado.rows.find(
            (row) => semAcento(row.nome) === semAcento(periodo)
        );

        if (!encontrado) {
            throw new Error('Período inválido. Opções: Triássico, Jurássico, Cretáceo');
        }

        return encontrado;
    }

    static validarDieta(dieta) {
        const normalizada = normalizarDieta(dieta);
        if (!DIETAS.includes(normalizada)) {
            throw new Error(`Dieta inválida. Opções: ${DIETAS.join(', ')}`);
        }
        return normalizada;
    }

    static validarFamilia(familia) {
        if (!familia) return null;
        if (!FAMILIAS.includes(familia)) {
            throw new Error(`Família inválida. Opções: ${FAMILIAS.join(', ')}`);
        }
        return familia;
    }

    static async garantirEstrutura() {
        await pool.query(
            `ALTER TABLE dinossauros
             ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION`
        );
        await pool.query(
            `ALTER TABLE dinossauros
             ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION`
        );
    }

    static async aplicarCoordenadas(id, regiao, nome) {
        await Dinosaur.garantirEstrutura();
        const ponto = await geocodificar(regiao, nome);
        if (!ponto) return null;
        await pool.query(
            `UPDATE dinossauros
             SET latitude = $1, longitude = $2
             WHERE id = $3`,
            [ponto.lat, ponto.lng, id]
        );
        return ponto;
    }

    static async listarMapa() {
        await Dinosaur.garantirEstrutura();
        const resultado = await pool.query(
            `SELECT d.*, p.nome AS periodo_nome, u.nome AS autor_nome
             FROM dinossauros d
             JOIN periodos p ON p.id = d.periodo_id
             LEFT JOIN usuarios u ON u.id = d.criado_por
             ORDER BY d.id ASC`
        );

        for (const row of resultado.rows) {
            if (row.latitude !== null && row.longitude !== null) continue;
            const ponto = await Dinosaur.aplicarCoordenadas(row.id, row.regiao, row.nome);
            if (ponto) {
                row.latitude = ponto.lat;
                row.longitude = ponto.lng;
            }
        }

        const pontos = resultado.rows
            .map(Dinosaur.mapear)
            .filter((dino) => Number.isFinite(dino.latitude) && Number.isFinite(dino.longitude))
            .map((dino) => ({
                id: dino.id,
                nome: dino.nome,
                fotoUrl: dino.fotoUrl,
                regiao: dino.regiao,
                lat: dino.latitude,
                lng: dino.longitude
            }));

        return espalhar(pontos);
    }

    static chaveNome(valor) {
        return semAcento(String(valor || '').replace(/\s+/g, ' '));
    }

    static async garantirUnico({ nome, nomeCientifico, ignorarId } = {}) {
        const nomeChave = Dinosaur.chaveNome(nome);
        const cientificoChave = Dinosaur.chaveNome(nomeCientifico);

        if (!nomeChave && !cientificoChave) return;

        const resultado = await pool.query(
            'SELECT id, nome, nome_cientifico FROM dinossauros'
        );

        const repetido = resultado.rows.find((row) => {
            if (ignorarId && Number(row.id) === Number(ignorarId)) return false;
            const mesmoNome = nomeChave && Dinosaur.chaveNome(row.nome) === nomeChave;
            const mesmoCientifico =
                cientificoChave && Dinosaur.chaveNome(row.nome_cientifico) === cientificoChave;
            return mesmoNome || mesmoCientifico;
        });

        if (!repetido) return;

        const peloNome = nomeChave && Dinosaur.chaveNome(repetido.nome) === nomeChave;
        throw new Error(
            peloNome
                ? `Este dinossauro já está na DinoPédia: ${repetido.nome}. Abra a ficha para editar.`
                : `Já existe um dinossauro com o nome científico ${repetido.nome_cientifico}. Abra a ficha para editar.`
        );
    }

    static async criar({
        nome,
        nomeCientifico,
        periodo,
        dieta,
        familia,
        descricao,
        comprimento,
        regiao,
        anoDescoberta,
        destaque,
        usuarioId
    }) {
        if (!nome || !nomeCientifico || !periodo || !dieta || !descricao || !usuarioId) {
            throw new Error(
                'Nome, nome científico, período, dieta, descrição e usuário são obrigatórios'
            );
        }

        const dietaNormalizada = Dinosaur.validarDieta(dieta);
        const familiaNormalizada = Dinosaur.validarFamilia(familia);
        const periodoRow = await Dinosaur.buscarPeriodoId(periodo);
        await Dinosaur.garantirUnico({ nome, nomeCientifico });
        await Dinosaur.garantirEstrutura();
        const ponto = await geocodificar(regiao, nome);

        const resultado = await pool.query(
            `INSERT INTO dinossauros (
                nome, nome_cientifico, periodo_id, dieta, descricao,
                comprimento, regiao, ano_descoberta, familia, destaque, criado_por,
                latitude, longitude
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
             RETURNING *`,
            [
                nome,
                nomeCientifico,
                periodoRow.id,
                dietaNormalizada,
                descricao,
                comprimento ?? null,
                regiao ?? null,
                anoDescoberta ?? null,
                familiaNormalizada,
                Boolean(destaque),
                usuarioId,
                ponto ? ponto.lat : null,
                ponto ? ponto.lng : null
            ]
        );

        return Dinosaur.buscarPorId(resultado.rows[0].id);
    }

    static async buscarPorId(id) {
        const resultado = await pool.query(
            `SELECT d.*, p.nome AS periodo_nome, u.nome AS autor_nome
             FROM dinossauros d
             JOIN periodos p ON p.id = d.periodo_id
             LEFT JOIN usuarios u ON u.id = d.criado_por
             WHERE d.id = $1`,
            [id]
        );

        return Dinosaur.mapear(resultado.rows[0]);
    }

    static async atualizar(id, dados) {
        const atual = await Dinosaur.buscarPorId(id);
        if (!atual) {
            throw new Error('Dinossauro não encontrado');
        }

        const proximo = { ...atual };

        if (dados.nome !== undefined) proximo.nome = dados.nome;
        if (dados.nomeCientifico !== undefined) proximo.nomeCientifico = dados.nomeCientifico;
        if (dados.descricao !== undefined) proximo.descricao = dados.descricao;
        if (dados.comprimento !== undefined) proximo.comprimento = dados.comprimento;
        if (dados.regiao !== undefined) proximo.regiao = dados.regiao;
        if (dados.anoDescoberta !== undefined) proximo.anoDescoberta = dados.anoDescoberta;
        if (dados.foto !== undefined) proximo.foto = dados.foto;
        if (dados.destaque !== undefined) proximo.destaque = Boolean(dados.destaque);

        if (dados.dieta !== undefined) {
            proximo.dieta = Dinosaur.validarDieta(dados.dieta);
        }

        if (dados.familia !== undefined) {
            proximo.familia = Dinosaur.validarFamilia(dados.familia);
        }

        let periodoId = atual.periodoId;
        let periodoNome = atual.periodo;
        if (dados.periodo !== undefined) {
            const periodoRow = await Dinosaur.buscarPeriodoId(dados.periodo);
            periodoId = periodoRow.id;
            periodoNome = periodoRow.nome;
            proximo.periodo = periodoNome;
            proximo.periodoId = periodoId;
        }

        if (!proximo.nome || !proximo.nomeCientifico || !proximo.dieta || !proximo.descricao) {
            throw new Error('Nome, nome científico, dieta e descrição não podem ficar vazios');
        }

        await Dinosaur.garantirUnico({
            nome: proximo.nome,
            nomeCientifico: proximo.nomeCientifico,
            ignorarId: id
        });

        await Dinosaur.garantirEstrutura();
        const regiaoMudou =
            dados.regiao !== undefined && String(dados.regiao || '') !== String(atual.regiao || '');
        let latitude = atual.latitude;
        let longitude = atual.longitude;
        if (regiaoMudou || latitude == null || longitude == null) {
            const ponto = await geocodificar(proximo.regiao, proximo.nome);
            latitude = ponto ? ponto.lat : null;
            longitude = ponto ? ponto.lng : null;
        }

        await pool.query(
            `UPDATE dinossauros SET
                nome = $1,
                nome_cientifico = $2,
                periodo_id = $3,
                dieta = $4,
                descricao = $5,
                comprimento = $6,
                regiao = $7,
                ano_descoberta = $8,
                familia = $9,
                foto = $10,
                destaque = $11,
                latitude = $12,
                longitude = $13,
                updated_at = NOW()
             WHERE id = $14
             RETURNING *`,
            [
                proximo.nome,
                proximo.nomeCientifico,
                periodoId,
                proximo.dieta,
                proximo.descricao,
                proximo.comprimento ?? null,
                proximo.regiao ?? null,
                proximo.anoDescoberta ?? null,
                proximo.familia ?? null,
                proximo.foto ?? null,
                Boolean(proximo.destaque),
                latitude,
                longitude,
                id
            ]
        );

        const atualizado = await Dinosaur.buscarPorId(id);

        return { anterior: atual, atualizado };
    }

    static async deletar(id) {
        const resultado = await pool.query(
            'DELETE FROM dinossauros WHERE id = $1 RETURNING id',
            [id]
        );

        if (!resultado.rows[0]) {
            throw new Error('Dinossauro não encontrado');
        }

        return true;
    }

    static async buscarComFiltros(filtros) {
        const condicoes = [];
        const valores = [];

        if (filtros.nome) {
            valores.push(`%${filtros.nome}%`);
            condicoes.push(`d.nome ILIKE $${valores.length}`);
        }

        if (filtros.periodo) {
            valores.push(normalizarPeriodo(filtros.periodo));
            condicoes.push(`p.nome = $${valores.length}`);
        }

        if (filtros.dieta) {
            valores.push(normalizarDieta(filtros.dieta));
            condicoes.push(`d.dieta = $${valores.length}`);
        }

        if (filtros.familia) {
            valores.push(filtros.familia);
            condicoes.push(`d.familia = $${valores.length}`);
        }

        if (filtros.destaque === 'true' || filtros.destaque === true) {
            condicoes.push('d.destaque = TRUE');
        }

        if (filtros.criadoPor) {
            valores.push(filtros.criadoPor);
            condicoes.push(`d.criado_por = $${valores.length}`);
        }

        const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';
        const sortColumn = SORT_MAP[filtros.sort] || 'd.id';
        const ordem = filtros.order === 'desc' ? 'DESC' : 'ASC';
        const page = parseInt(filtros.page, 10) || 1;
        const limit = parseInt(filtros.limit, 10) || 50;
        const offset = (page - 1) * limit;

        const count = await pool.query(
            `SELECT COUNT(*)::int AS total
             FROM dinossauros d
             JOIN periodos p ON p.id = d.periodo_id
             ${where}`,
            valores
        );

        const total = count.rows[0].total;
        valores.push(limit);
        valores.push(offset);

        const resultado = await pool.query(
            `SELECT d.*, p.nome AS periodo_nome, u.nome AS autor_nome
             FROM dinossauros d
             JOIN periodos p ON p.id = d.periodo_id
             LEFT JOIN usuarios u ON u.id = d.criado_por
             ${where}
             ORDER BY ${sortColumn} ${ordem}
             LIMIT $${valores.length - 1} OFFSET $${valores.length}`,
            valores
        );

        return {
            data: resultado.rows.map(Dinosaur.mapear),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
}

module.exports = Dinosaur;
