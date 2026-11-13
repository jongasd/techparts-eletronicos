
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../../services/api';

import './Employee.css';

function Employee() {
    const navigate = useNavigate();
    const [funcionarios, setFuncionarios] = useState([]);
    const [pesquisa, setPesquisa] = useState('');
    const [filtro, setFiltro] = useState('Todos');
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');

    useEffect(() => {
        let montado = true;

        apiRequest('/funcionarios')
            .then((resposta) => {
                if (montado) setFuncionarios(resposta.dados || []);
            })
            .catch((error) => {
                if (!montado) return;
                setErro(error.message || 'Não foi possível carregar os funcionários.');
                if (error.message.includes('Token') || error.message.includes('Sessão')) {
                    navigate('/');
                }
            })
            .finally(() => {
                if (montado) setCarregando(false);
            });

        return () => { montado = false; };
    }, [navigate]);

    const funcionariosFiltrados = useMemo(() => {
        return funcionarios.filter((funcionario) => {
            const correspondeNome = funcionario.nome_funcionario
                .toLowerCase()
                .includes(pesquisa.trim().toLowerCase());
            const situacao = Number(funcionario.ativo) === 1 ? 'Ativos' : 'Inativos';
            return correspondeNome && (filtro === 'Todos' || situacao === filtro);
        });
    }, [funcionarios, pesquisa, filtro]);

    async function desativarFuncionario(funcionario) {
        if (!window.confirm(`Desativar o acesso de ${funcionario.nome_funcionario}?`)) return;
        setErro('');
        try {
            await apiRequest(`/funcionarios/${funcionario.id_funcionario}`, { method: 'DELETE' });
            setFuncionarios((anteriores) => anteriores.map((item) =>
                item.id_funcionario === funcionario.id_funcionario ? { ...item, ativo: 0 } : item
            ));
        } catch (error) {
            setErro(error.message || 'Não foi possível desativar o funcionário.');
        }
    }

    // =========================================
    // EXPORTAR FUNCIONÁRIOS PARA CSV
    // =========================================

    function exportarRelatorio() {

        const cabecalho = [
            'ID',
            'Nome',
            'Login',
            'Perfil',
            'Situação'
        ];

        // Escapa aspas e envolve os valores em aspas.
        function escaparCSV(valor) {
            return `"${String(valor).replace(/"/g, '""')}"`;
        }

        const linhas = funcionariosFiltrados.map((funcionario) => [
            funcionario.id_funcionario,
            funcionario.nome_funcionario,
            funcionario.login,
            funcionario.nome_role,
            Number(funcionario.ativo) === 1 ? 'Ativo' : 'Inativo'
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
                    <h1 className="employee-title">FUNCIONÁRIOS</h1>
                    <div className="titulo-linha"></div>
                </div>

                <div className="botoes-cabecalho">

                    <button
                        type="button"
                        className="btn-exportar"
                        onClick={exportarRelatorio}
                    >
                        EXPORTAR RELATÓRIO
                    </button>

                    <Link to="/register" className="btn-novo-funcionario">
                        CRIAR ACESSO
                    </Link>

                </div>

            </div>

            {erro && <p className="funcionarios-erro" role="alert">{erro}</p>}

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

                {carregando ? (
                    <div className="nenhum-funcionario">Carregando funcionários...</div>
                ) : funcionariosFiltrados.length > 0 ? (

                    funcionariosFiltrados.map((funcionario) => (

                        <article
                            className="funcionario-card"
                            key={funcionario.id_funcionario}
                        >

                            <div
                                className="funcionario-avatar"
                                style={{
                                    backgroundColor: funcionario.cor
                                }}
                            >

                                <span>{funcionario.nome_funcionario.charAt(0).toUpperCase()}</span>

                            </div>

                            <h3>{funcionario.nome_funcionario}</h3>

                            <p>{funcionario.login}</p>

                            <span className="departamento-tag">
                                {funcionario.nome_role}
                            </span>

                            <span className={`funcionario-situacao ${Number(funcionario.ativo) === 1 ? 'ativo' : 'inativo'}`}>
                                {Number(funcionario.ativo) === 1 ? 'Ativo' : 'Inativo'}
                            </span>

                            {Number(funcionario.ativo) === 1 && (
                                <button
                                    type="button"
                                    className="btn-desativar-funcionario"
                                    onClick={() => desativarFuncionario(funcionario)}
                                >
                                    Desativar acesso
                                </button>
                            )}

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

                {['Ativos', 'Inativos'].map((situacao) => (

                    <button
                        key={situacao}
                        type="button"
                        className={`tag-botao ${
                            filtro === situacao ? 'ativa' : ''
                        }`}
                        onClick={() => setFiltro(situacao)}
                    >
                        {situacao}
                    </button>

                ))}

            </section>

        </main>
    );

}

export default Employee;