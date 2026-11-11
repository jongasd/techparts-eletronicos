
import { useEffect, useMemo, useState } from 'react';

import './Employee.css';

// =========================================
// FUNCIONÁRIOS INICIAIS
// =========================================

const funcionariosIniciais = [
    {
        id: 1,
        nome: 'SOFIA MARCOLONGO DOS SANTOS',
        departamento: 'Vendas',
        inicial: 'S',
        cor: '#f47700',
        foto: null
    },
    {
        id: 2,
        nome: 'JONAS DANIEL DE BRITO LOPES',
        departamento: 'Engenharia',
        inicial: 'J',
        cor: '#811da3',
        foto: null
    },
    {
        id: 3,
        nome: 'AGATHA HELENA SILVA MONTEIRO',
        departamento: 'Administração',
        inicial: 'A',
        cor: '#a54b25',
        foto: 'https://i.pravatar.cc/150?img=37'
    },
    {
        id: 4,
        nome: 'JOÃO SILVA',
        departamento: 'Suporte',
        inicial: 'J',
        cor: '#263746',
        foto: 'https://i.pravatar.cc/150?img=12'
    }
];

// =========================================
// DEPARTAMENTOS
// =========================================

const departamentos = [
    'Vendas',
    'Engenharia',
    'Suporte',
    'Logística',
    'Administração'
];

function Employee() {

    // =========================================
    // ESTADOS
    // =========================================

    const [funcionarios, setFuncionarios] = useState(
        funcionariosIniciais
    );

    const [pesquisa, setPesquisa] = useState('');
    const [filtro, setFiltro] = useState('Todos');
    const [modalAberto, setModalAberto] = useState(false);

    const [novoFuncionario, setNovoFuncionario] = useState({
        nome: '',
        departamento: 'Vendas'
    });

    // =========================================
    // FECHAR MODAL COM ESC
    // =========================================

    useEffect(() => {

        if (!modalAberto) return;

        function fecharComEsc(e) {
            if (e.key === 'Escape') {
                setModalAberto(false);
            }
        }

        document.addEventListener('keydown', fecharComEsc);

        return () => {
            document.removeEventListener('keydown', fecharComEsc);
        };

    }, [modalAberto]);

    // =========================================
    // PESQUISA E FILTRAGEM
    // =========================================

    const funcionariosFiltrados = useMemo(() => {

        return funcionarios.filter((funcionario) => {

            const correspondeNome = funcionario.nome
                .toLowerCase()
                .includes(pesquisa.trim().toLowerCase());

            const correspondeDepartamento =
                filtro === 'Todos' ||
                funcionario.departamento === filtro;

            return correspondeNome && correspondeDepartamento;

        });

    }, [funcionarios, pesquisa, filtro]);

    // =========================================
    // ATUALIZAR FORMULÁRIO
    // =========================================

    function atualizarCampo(e) {

        const { name, value } = e.target;

        setNovoFuncionario((atual) => ({
            ...atual,
            [name]: value
        }));

    }

    // =========================================
    // CADASTRAR FUNCIONÁRIO
    // =========================================

    function cadastrarFuncionario(e) {

        e.preventDefault();

        const nome = novoFuncionario.nome.trim();

        if (!nome) {
            return;
        }

        const novo = {
            id: Date.now(),
            nome: nome.toUpperCase(),
            departamento: novoFuncionario.departamento,
            inicial: nome.charAt(0).toUpperCase(),
            cor: '#24577d',
            foto: null
        };

        setFuncionarios((atual) => [...atual, novo]);

        setNovoFuncionario({
            nome: '',
            departamento: 'Vendas'
        });

        // Limpa a pesquisa e o filtro para facilitar
        // a visualização do funcionário recém-cadastrado.
        setPesquisa('');
        setFiltro('Todos');

        setModalAberto(false);

    }

    // =========================================
    // EXPORTAR FUNCIONÁRIOS PARA CSV
    // =========================================

    function exportarRelatorio() {

        const cabecalho = [
            'ID',
            'Nome',
            'Departamento'
        ];

        // Escapa aspas e envolve os valores em aspas.
        function escaparCSV(valor) {
            return `"${String(valor).replace(/"/g, '""')}"`;
        }

        const linhas = funcionariosFiltrados.map((funcionario) => [
            funcionario.id,
            funcionario.nome,
            funcionario.departamento
        ]);

        const conteudo = [
            cabecalho.map(escaparCSV).join(';'),
            ...linhas.map((linha) =>
                linha.map(escaparCSV).join(';')
            )
        ].join('\n');

        const arquivo = new Blob(
            ['\uFEFF' + conteudo],
            { type: 'text/csv;charset=utf-8;' }
        );

        const url = URL.createObjectURL(arquivo);

        const link = document.createElement('a');

        link.href = url;
        link.download = 'relatorio-funcionarios.csv';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Libera a URL depois de dar tempo ao navegador
        // para iniciar o download.
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 1000);

    }

    // =========================================
    // RENDERIZAÇÃO
    // =========================================

    return (
        <main className="funcionarios-conteudo">

            {/* TÍTULO E BOTÕES */}

            <div className="funcionarios-cabecalho">

                <div>
                    <h1>FUNCIONÁRIOS</h1>
                    <div className="titulo-linha"></div>
                </div>

                <div className="botoes-cabecalho">

                    <button
                        type="button"
                        className="btn-exportar"
                        onClick={exportarRelatorio}
                    >
                        <span aria-hidden="true">⇩</span>
                        EXPORTAR RELATÓRIO
                    </button>

                    <button
                        type="button"
                        className="btn-novo-funcionario"
                        onClick={() => setModalAberto(true)}
                    >
                        <span aria-hidden="true">＋</span>
                        NOVO FUNCIONÁRIO
                    </button>

                </div>

            </div>

            {/* PESQUISA */}

            <div className="funcionarios-pesquisa">

                <input
                    type="search"
                    placeholder="Buscar funcionário pelo nome..."
                    aria-label="Buscar funcionário pelo nome"
                    value={pesquisa}
                    onChange={(e) => setPesquisa(e.target.value)}
                />

            </div>

            {/* LISTAGEM DOS FUNCIONÁRIOS */}

            <section className="funcionarios-grid">

                {funcionariosFiltrados.length > 0 ? (

                    funcionariosFiltrados.map((funcionario) => (

                        <article
                            className="funcionario-card"
                            key={funcionario.id}
                        >

                            <div
                                className="funcionario-avatar"
                                style={{
                                    backgroundColor: funcionario.cor
                                }}
                            >

                                {funcionario.foto ? (

                                    <img
                                        src={funcionario.foto}
                                        alt={`Foto de ${funcionario.nome}`}
                                    />

                                ) : (

                                    <span>
                                        {funcionario.inicial}
                                    </span>

                                )}

                            </div>

                            <h3>{funcionario.nome}</h3>

                            <span className="departamento-tag">
                                {funcionario.departamento}
                            </span>

                        </article>

                    ))

                ) : (

                    <div className="nenhum-funcionario">
                        Nenhum funcionário encontrado.
                    </div>

                )}

            </section>

            {/* TAGS RÁPIDAS */}

            <section className="tags-rapidas">

                <span className="tags-titulo">
                    TAGS RÁPIDAS:
                </span>

                <button
                    type="button"
                    className={`tag-botao ${filtro === 'Todos' ? 'ativa' : ''}`}
                    onClick={() => setFiltro('Todos')}
                >
                    Todos
                </button>

                {departamentos.map((departamento) => (

                    <button
                        key={departamento}
                        type="button"
                        className={`tag-botao ${
                            filtro === departamento ? 'ativa' : ''
                        }`}
                        onClick={() => setFiltro(departamento)}
                    >
                        {departamento}
                    </button>

                ))}

            </section>

            {/* MODAL DE CADASTRO */}

            {modalAberto && (

                <div
                    className="modal-overlay"
                    onClick={() => setModalAberto(false)}
                >

                    <div
                        className="modal-funcionario"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="titulo-modal"
                        onClick={(e) => e.stopPropagation()}
                    >

                        <div className="modal-cabecalho">

                            <h2 id="titulo-modal">
                                NOVO FUNCIONÁRIO
                            </h2>

                            <button
                                type="button"
                                aria-label="Fechar cadastro"
                                onClick={() => setModalAberto(false)}
                            >
                                ×
                            </button>

                        </div>

                        <form onSubmit={cadastrarFuncionario}>

                            {/* NOME */}

                            <label htmlFor="nome-funcionario">
                                Nome completo
                            </label>

                            <input
                                id="nome-funcionario"
                                type="text"
                                name="nome"
                                placeholder="Digite o nome do funcionário"
                                value={novoFuncionario.nome}
                                onChange={atualizarCampo}
                                autoFocus
                                required
                            />

                            {/* DEPARTAMENTO */}

                            <label htmlFor="departamento">
                                Departamento
                            </label>

                            <select
                                id="departamento"
                                name="departamento"
                                value={novoFuncionario.departamento}
                                onChange={atualizarCampo}
                            >

                                {departamentos.map((departamento) => (

                                    <option
                                        key={departamento}
                                        value={departamento}
                                    >
                                        {departamento}
                                    </option>

                                ))}

                            </select>

                            {/* BOTÕES */}

                            <div className="modal-botoes">

                                <button
                                    type="button"
                                    className="btn-cancelar"
                                    onClick={() => setModalAberto(false)}
                                >
                                    CANCELAR
                                </button>

                                <button
                                    type="submit"
                                    className="btn-salvar"
                                >
                                    CADASTRAR
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </main>
    );

}

export default Employee;