const pool = require('../db/pool');
const config = require('../config');
const {
    DIETAS,
    FAMILIAS,
    normalizarDieta,
    normalizarPeriodo,
    semAcento
} = require('../config/constants');

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
            usuarioId: row.criado_por,
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

        const resultado = await pool.query(
            `INSERT INTO dinossauros (
                nome, nome_cientifico, periodo_id, dieta, descricao,
                comprimento, regiao, ano_descoberta, familia, destaque, criado_por
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
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
                usuarioId
            ]
        );

        return Dinosaur.mapear({
            ...resultado.rows[0],
            periodo_nome: periodoRow.nome
        });
    }

    static async buscarPorId(id) {
        const resultado = await pool.query(
            `SELECT d.*, p.nome AS periodo_nome
             FROM dinossauros d
             JOIN periodos p ON p.id = d.periodo_id
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

        const resultado = await pool.query(
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
                updated_at = NOW()
             WHERE id = $12
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
                id
            ]
        );

        const atualizado = Dinosaur.mapear({
            ...resultado.rows[0],
            periodo_nome: periodoNome
        });

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
            `SELECT d.*, p.nome AS periodo_nome
             FROM dinossauros d
             JOIN periodos p ON p.id = d.periodo_id
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
