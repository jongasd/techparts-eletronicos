
import { useMemo, useState } from 'react';
import './Employee.css';

import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import Sidebar from '../../components/Sidebar/Sidebar';

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

const departamentos = [
    'Vendas',
    'Engenharia',
    'Suporte',
    'Logística',
    'Administração'
];

function Employee() {
     // Controla a abertura e o fechamento da Sidebar
    const [menuAberto, setMenuAberto] = useState(true);

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

    // Pesquisa e filtragem dos funcionários
    const funcionariosFiltrados = useMemo(() => {
        return funcionarios.filter((funcionario) => {
            const correspondeNome = funcionario.nome
                .toLowerCase()
                .includes(pesquisa.toLowerCase());

            const correspondeDepartamento =
                filtro === 'Todos' ||
                funcionario.departamento === filtro;

            return correspondeNome && correspondeDepartamento;
        });
    }, [funcionarios, pesquisa, filtro]);

    // Cadastro de funcionário
    function cadastrarFuncionario(e) {
        e.preventDefault();

        if (!novoFuncionario.nome.trim()) {
            return;
        }

        const novo = {
            id: Date.now(),
            nome: novoFuncionario.nome.trim().toUpperCase(),
            departamento: novoFuncionario.departamento,
            inicial: novoFuncionario.nome.trim()[0].toUpperCase(),
            cor: '#24577d',
            foto: null
        };

        setFuncionarios((atual) => [...atual, novo]);

        setNovoFuncionario({
            nome: '',
            departamento: 'Vendas'
        });

        setModalAberto(false);
    }

    // Exportação dos funcionários para CSV
    function exportarRelatorio() {
        const cabecalho = ['ID', 'Nome', 'Departamento'];

        const linhas = funcionariosFiltrados.map((funcionario) => [
            funcionario.id,
            `"${funcionario.nome.replace(/"/g, '""')}"`,
            funcionario.departamento
        ]);

        const conteudo = [
            cabecalho.join(';'),
            ...linhas.map((linha) => linha.join(';'))
        ].join('\n');

        const arquivo = new Blob(
            ['\uFEFF' + conteudo],
            { type: 'text/csv;charset=utf-8;' }
        );

        const url = URL.createObjectURL(arquivo);
        const link = document.createElement('a');

        link.href = url;
        link.download = 'relatorio-funcionarios.csv';
        link.click();

        URL.revokeObjectURL(url);
    }

    return (
        <div className="funcionarios-page">

            {/* BARRA SUPERIOR */}
            <Header />

                {/* MENU LATERAL */}
                <Sidebar
                    menuAberto={menuAberto}
                    setMenuAberto={setMenuAberto}
                />

            {/* CONTEÚDO PRINCIPAL */}
            <main className="funcionarios-conteudo">

                {/* TÍTULO E BOTÕES */}
                <div className="funcionarios-cabecalho">

                    <div>
                        <h1>FUNCIONÁRIOS</h1>
                        <div className="titulo-linha"></div>
                    </div>

                    <div className="botoes-cabecalho">

                        <button
                            className="btn-exportar"
                            onClick={exportarRelatorio}
                        >
                            <span>⇩</span>
                            EXPORTAR RELATÓRIO
                        </button>

                        <button
                            className="btn-novo-funcionario"
                            onClick={() => setModalAberto(true)}
                        >
                            <span>＋</span>
                            NOVO FUNCIONÁRIO
                        </button>

                    </div>

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
                                            alt={funcionario.nome}
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
                        className={`tag-botao ${filtro === 'Todos' ? 'ativa' : ''}`}
                        onClick={() => setFiltro('Todos')}
                    >
                        Todos
                    </button>

                    {departamentos.map((departamento) => (
                        <button
                            key={departamento}
                            className={`tag-botao ${
                                filtro === departamento ? 'ativa' : ''
                            }`}
                            onClick={() => setFiltro(departamento)}
                        >
                            {departamento}
                        </button>
                    ))}

                </section>

            </main>

            {/* RODAPÉ */}
               <Footer />

            {/* MODAL DE CADASTRO */}
            {modalAberto && (
                <div className="modal-overlay">

                    <div className="modal-funcionario">

                        <div className="modal-cabecalho">
                            <h2>NOVO FUNCIONÁRIO</h2>

                            <button
                                type="button"
                                onClick={() => setModalAberto(false)}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={cadastrarFuncionario}>

                            <label htmlFor="nome-funcionario">
                                Nome completo
                            </label>

                            <input
                                id="nome-funcionario"
                                type="text"
                                placeholder="Digite o nome do funcionário"
                                value={novoFuncionario.nome}
                                onChange={(e) =>
                                    setNovoFuncionario({
                                        ...novoFuncionario,
                                        nome: e.target.value
                                    })
                                }
                                required
                            />

                            <label htmlFor="departamento">
                                Departamento
                            </label>

                            <select
                                id="departamento"
                                value={novoFuncionario.departamento}
                                onChange={(e) =>
                                    setNovoFuncionario({
                                        ...novoFuncionario,
                                        departamento: e.target.value
                                    })
                                }
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

        </div>
    );
}

export default Employee;
