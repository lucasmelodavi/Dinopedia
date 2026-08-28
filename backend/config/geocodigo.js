const { semAcento } = require('./constants');

const LOCAIS = [
    { chaves: ['hell creek', 'dakota do norte', 'dakota do sul'], lat: 47.6, lng: -104.5 },
    { chaves: ['morrison', 'colorado', 'utah', 'wyoming'], lat: 39.7, lng: -107.5 },
    { chaves: ['montana'], lat: 47.0, lng: -109.6 },
    { chaves: ['alberta', 'canada', 'canada'], lat: 53.9, lng: -110.5 },
    { chaves: ['texas'], lat: 31.5, lng: -99.3 },
    { chaves: ['novo mexico', 'new mexico'], lat: 34.3, lng: -106.0 },
    { chaves: ['estados unidos', 'eua', 'usa', 'america do norte'], lat: 39.8, lng: -98.6 },
    { chaves: ['mexico', 'coahuila'], lat: 27.3, lng: -102.0 },
    { chaves: ['patagonia', 'neuquen', 'chubut', 'santa cruz'], lat: -43.3, lng: -68.5 },
    { chaves: ['argentina', 'vale da lua'], lat: -38.4, lng: -63.6 },
    { chaves: ['chile'], lat: -35.7, lng: -71.5 },
    { chaves: ['brasil', 'minas gerais', 'maranhao', 'ceara'], lat: -14.2, lng: -51.9 },
    { chaves: ['amazonia'], lat: -3.5, lng: -62.0 },
    { chaves: ['peru'], lat: -9.2, lng: -75.0 },
    { chaves: ['colombia'], lat: 4.6, lng: -74.3 },
    { chaves: ['deserto de gobi', 'gobi', 'mongolia'], lat: 43.5, lng: 104.0 },
    { chaves: ['liaoning', 'china'], lat: 35.9, lng: 104.2 },
    { chaves: ['india'], lat: 21.1, lng: 78.0 },
    { chaves: ['japao'], lat: 36.2, lng: 138.3 },
    { chaves: ['quirguistao', 'quirguizistan'], lat: 41.2, lng: 74.8 },
    { chaves: ['coreia'], lat: 36.5, lng: 127.9 },
    { chaves: ['russia', 'siberia'], lat: 61.5, lng: 99.0 },
    { chaves: ['asia'], lat: 45.0, lng: 90.0 },
    { chaves: ['nigersaurus', 'niger'], lat: 17.6, lng: 8.1 },
    { chaves: ['marrocos', 'kem kem'], lat: 30.9, lng: -4.4 },
    { chaves: ['egito', 'bahariya'], lat: 26.8, lng: 30.8 },
    { chaves: ['tunisia'], lat: 34.0, lng: 9.0 },
    { chaves: ['africa do sul'], lat: -28.5, lng: 24.7 },
    { chaves: ['tanzania', 'tendaguru'], lat: -9.5, lng: 39.1 },
    { chaves: ['madagascar'], lat: -19.4, lng: 46.7 },
    { chaves: ['saara', 'africa'], lat: 18.0, lng: 9.0 },
    { chaves: ['inglaterra', 'reino unido', 'gra-bretanha', 'ilha de wight'], lat: 52.4, lng: -1.5 },
    { chaves: ['alemanha', 'solnhofen'], lat: 51.2, lng: 10.4 },
    { chaves: ['franca', 'frança'], lat: 46.2, lng: 2.2 },
    { chaves: ['espanha', 'portugal'], lat: 40.0, lng: -4.5 },
    { chaves: ['italia'], lat: 42.8, lng: 12.6 },
    { chaves: ['europa'], lat: 50.0, lng: 10.0 },
    { chaves: ['australia', 'queensland'], lat: -25.3, lng: 133.8 },
    { chaves: ['nova zelandia'], lat: -41.5, lng: 172.8 },
    { chaves: ['antartida', 'antartica'], lat: -78.0, lng: 20.0 }
];

const NOMES = [
    { chaves: ['eoraptor'], lat: -29.8, lng: -67.9 },
    { chaves: ['tiranossauro', 'tyrannosaurus'], lat: 47.6, lng: -104.5 },
    { chaves: ['estegossauro', 'stegosaurus'], lat: 39.7, lng: -107.5 },
    { chaves: ['triceratopo', 'triceratops'], lat: 47.6, lng: -104.5 },
    { chaves: ['velociraptor'], lat: 43.5, lng: 104.0 },
    { chaves: ['espinossauro', 'spinosaurus'], lat: 30.9, lng: -4.4 },
    { chaves: ['braquiossauro', 'brachiosaurus'], lat: 39.7, lng: -107.5 },
    { chaves: ['argentinossauro', 'argentinosaurus'], lat: -38.9, lng: -68.1 },
    { chaves: ['giganotossauro', 'giganotosaurus'], lat: -39.0, lng: -69.2 },
    { chaves: ['carnotauro', 'carnotaurus'], lat: -42.9, lng: -71.1 },
    { chaves: ['ankilossauro', 'ankylosaurus'], lat: 47.6, lng: -104.5 },
    { chaves: ['diplodoco', 'diplodocus'], lat: 39.7, lng: -107.5 },
    { chaves: ['alossauro', 'allosaurus'], lat: 39.7, lng: -107.5 },
    { chaves: ['iguanodonte', 'iguanodon'], lat: 50.8, lng: 4.4 },
    { chaves: ['dilofossauro', 'dilophosaurus'], lat: 35.8, lng: -111.5 },
    { chaves: ['parassaurolofo', 'parasaurolophus'], lat: 51.4, lng: -112.6 },
    { chaves: ['brontossauro', 'brontosaurus', 'apatossauro', 'apatosaurus'], lat: 39.7, lng: -107.5 },
    { chaves: ['compsognato', 'compsognathus'], lat: 48.9, lng: 11.0 }
];

const cache = new Map();

function chave(texto) {
    return semAcento(String(texto || ''))
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

function peloDicionario(regiao) {
    const texto = chave(regiao);
    if (!texto) return null;

    let melhor = null;
    let tamanho = 0;
    for (const local of [...LOCAIS, ...NOMES]) {
        for (const item of local.chaves) {
            const termo = chave(item);
            if (termo.length < 4) continue;
            if (texto === termo || texto.includes(termo)) {
                if (termo.length >= tamanho) {
                    melhor = local;
                    tamanho = termo.length;
                }
            }
        }
    }
    return melhor ? { lat: melhor.lat, lng: melhor.lng, origem: 'ficha' } : null;
}

async function peloNominatim(regiao) {
    const controlador = new AbortController();
    const tempo = setTimeout(() => controlador.abort(), 2500);
    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(regiao)}`;
        const resposta = await fetch(url, {
            signal: controlador.signal,
            headers: {
                'User-Agent': 'Dinopedia/1.0 (https://dinopedia.onrender.com)',
                Accept: 'application/json'
            }
        });
        if (!resposta.ok) return null;
        const lista = await resposta.json();
        const primeiro = Array.isArray(lista) ? lista[0] : null;
        const lat = Number(primeiro && primeiro.lat);
        const lng = Number(primeiro && primeiro.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        return { lat, lng, origem: 'ficha' };
    } catch {
        return null;
    } finally {
        clearTimeout(tempo);
    }
}

async function geocodificar(regiao, nome) {
    const conhecido = peloDicionario(regiao) || peloDicionario(nome);
    if (conhecido) return conhecido;

    const texto = String(regiao || '').trim();
    if (!texto) return null;

    const id = chave(texto);
    if (cache.has(id)) return cache.get(id);

    const ponto = await peloNominatim(texto);
    cache.set(id, ponto);
    return ponto;
}

function espalhar(pontos) {
    const grupos = new Map();
    pontos.forEach((ponto, indice) => {
        const chaveGrupo = `${Number(ponto.lat).toFixed(1)}:${Number(ponto.lng).toFixed(1)}`;
        if (!grupos.has(chaveGrupo)) grupos.set(chaveGrupo, []);
        grupos.get(chaveGrupo).push(indice);
    });

    const saida = pontos.map((ponto) => ({ ...ponto }));
    grupos.forEach((indices) => {
        if (indices.length < 2) return;
        indices.forEach((indice, ordem) => {
            const angulo = (ordem / indices.length) * Math.PI * 2;
            const raio = 2.4;
            saida[indice] = {
                ...saida[indice],
                lat: Number(saida[indice].lat) + Math.sin(angulo) * raio,
                lng: Number(saida[indice].lng) + Math.cos(angulo) * raio
            };
        });
    });
    return saida;
}

module.exports = { geocodificar, espalhar };
