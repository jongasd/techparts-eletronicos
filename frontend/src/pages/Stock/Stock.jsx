import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../../services/api';
import icones from '../../assets/icones';
import './Stock.css';

function Stock() {
    const navigate = useNavigate();
    const [produtos, setProdutos] = useState([]);
    const [pesquisa, setPesquisa] = useState('');
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');

    useEffect(() => {
        let montado = true;

        Promise.all([apiRequest('/produtos'), apiRequest('/categorias')])
            .then(([respostaProdutos, respostaCategorias]) => {
                if (!montado) return;
                const categorias = respostaCategorias.dados || [];
                setProdutos((respostaProdutos.dados || []).map((produto) => ({
                    ...produto,
                    categoria: categorias.find(
                        (item) => Number(item.id_categoria) === Number(produto.id_categoria)
                    )?.nome || 'Sem categoria',
                    quantidade: Number(produto.quantidade_estoque),
                    minimo: Number(produto.quantidade_minima),
                    preco: Number(produto.preco),
                })));
            })
            .catch((error) => {
                if (!montado) return;
                setErro(error.message || 'Não foi possível carregar o estoque.');
                if (error.message.includes('Token') || error.message.includes('Sessão')) {
                    navigate('/');
                }
            })
            .finally(() => {
                if (montado) setCarregando(false);
            });

        return () => { montado = false; };
    }, [navigate]);

    const produtosFiltrados = useMemo(() => produtos.filter((produto) =>
        `${produto.id_produto} ${produto.nome_produto} ${produto.categoria}`
            .toLowerCase()
            .includes(pesquisa.trim().toLowerCase())
    ), [produtos, pesquisa]);

    const quantidadeTotal = produtos.reduce((soma, produto) => soma + produto.quantidade, 0);
    const valorTotal = produtos.reduce((soma, produto) => soma + produto.quantidade * produto.preco, 0);
    const itensBaixos = produtos.filter((produto) => produto.quantidade <= produto.minimo).length;
    const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className="stock-page">

            <h1 className="stock-title">ESTOQUE</h1>

            {erro && <p className="stock-error" role="alert">{erro}</p>}

            <section className="stock-metrics">
                <div className="stock-metric">
                    <span className="metric-label">TOTAL DE ITENS</span>
                    <strong>{carregando ? '...' : quantidadeTotal.toLocaleString('pt-BR')}</strong>
                </div>

                <div className="stock-metric">
                    <span className="metric-label">VALOR DO ESTOQUE</span>
                    <strong>{carregando ? '...' : moeda.format(valorTotal)}</strong>
                </div>

                <div className="stock-metric">
                    <span className="metric-label">ITENS EM BAIXA</span>
                    <strong className="metric-warning">{carregando ? '...' : itensBaixos}</strong>
                </div>

                <div className="stock-metric">
                    <span className="metric-label">PRODUTOS ATIVOS</span>
                    <strong>{carregando ? '...' : produtos.length}</strong>
                </div>
            </section>

            <section className="stock-table-container">

                <div className="stock-toolbar">
                    <input
                        type="search"
                        placeholder="Pesquisar componentes, IDs ou categorias..."
                        value={pesquisa}
                        onChange={(event) => setPesquisa(event.target.value)}
                    />

                    <Link to="/produtos" className="stock-new-item">GERENCIAR PRODUTOS</Link>
                </div>

                <table className="stock-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>PRODUTO</th>
                            <th>QUANTIDADE</th>
                            <th>PREÇO UNITÁRIO</th>
                            <th>STATUS</th>
                            <th>AÇÕES</th>
                        </tr>
                    </thead>

                    <tbody>
                        {carregando ? (
                            <tr><td colSpan="6">Carregando estoque...</td></tr>
                        ) : produtosFiltrados.map((produto) => {
                            const status = produto.quantidade <= 0
                                ? 'ESGOTADO'
                                : produto.quantidade <= produto.minimo ? 'BAIXO' : 'NORMAL';
                            return (
                            <tr key={produto.id_produto}>
                                <td>#{produto.id_produto}</td>

                                <td>
                                    <strong>{produto.nome_produto}</strong>
                                    <small>{produto.categoria}</small>
                                </td>

                                <td>{produto.quantidade} un.</td>

                                <td>{moeda.format(produto.preco)}</td>

                                <td>
                                    <span className={`stock-status ${status.toLowerCase()}`}>
                                        {status}
                                    </span>
                                </td>

                                <td>
                                    <div className="stock-actions">
                                        <Link to="/produtos" aria-label={`Editar ${produto.nome_produto}`} title="Editar produto">
                                            <img src={icones.editar} alt="" />
                                        </Link>
                                    </div>
                                </td>
                            </tr>
                            );
                        })}
                        {!carregando && produtosFiltrados.length === 0 && (
                            <tr><td colSpan="6">Nenhum produto encontrado.</td></tr>
                        )}
                    </tbody>
                </table>

            </section>

        </div>
    );
}

export default Stock;
