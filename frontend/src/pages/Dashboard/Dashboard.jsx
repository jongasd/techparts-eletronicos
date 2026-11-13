
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip
} from 'recharts';

import './Dashboard.css';
import { apiRequest } from '../../services/api';

function Dashboard() {
    const navigate = useNavigate();
    const [dias, setDias] = useState(7);
    const [resumo, setResumo] = useState(null);
    const [movimentacoes, setMovimentacoes] = useState({ entradas: [], saidas: [] });
    const [categorias, setCategorias] = useState([]);
    const [estoqueBaixo, setEstoqueBaixo] = useState([]);
    const [totalClientes, setTotalClientes] = useState(0);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');

    useEffect(() => {
        let montado = true;

        Promise.all([
            apiRequest('/dashboard/resumo'),
            apiRequest('/dashboard/produtos-categoria'),
            apiRequest(`/dashboard/movimentacoes?dias=${dias}`),
            apiRequest('/dashboard/estoque-baixo'),
            apiRequest('/clientes?pagina=1&limite=1'),
        ])
            .then(([dadosResumo, dadosCategorias, dadosMovimentacoes, dadosBaixos, dadosClientes]) => {
                if (!montado) return;
                setResumo(dadosResumo);
                setCategorias(dadosCategorias || []);
                setMovimentacoes(dadosMovimentacoes || { entradas: [], saidas: [] });
                setEstoqueBaixo(dadosBaixos || []);
                setTotalClientes(Number(dadosClientes.total || 0));
            })
            .catch((error) => {
                if (!montado) return;
                setErro(error.message || 'Não foi possível carregar o dashboard.');
                if (error.message.includes('Token') || error.message.includes('Sessão')) {
                    navigate('/');
                }
            })
            .finally(() => {
                if (montado) setCarregando(false);
            });

        return () => { montado = false; };
    }, [dias, navigate]);

    const dadosGrafico = useMemo(() => {
        const totalizar = (itens) => new Map(itens.map((item) => [
            String(item.data).slice(0, 10), Number(item.total)
        ]));
        const entradas = totalizar(movimentacoes.entradas || []);
        const saidas = totalizar(movimentacoes.saidas || []);

        return Array.from({ length: dias }, (_, indice) => {
            const data = new Date();
            data.setHours(12, 0, 0, 0);
            data.setDate(data.getDate() - (dias - indice - 1));
            const chave = data.toISOString().slice(0, 10);
            return {
                periodo: data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                entradas: entradas.get(chave) || 0,
                saidas: saidas.get(chave) || 0,
            };
        });
    }, [dias, movimentacoes]);

    const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
    const numero = (valor) => Number(valor || 0).toLocaleString('pt-BR');

    return (
        <>
            <h1 className="stock-title">DASHBOARD</h1>
            {erro && <p className="dashboard-error" role="alert">{erro}</p>}
            {/* INDICADORES */}
            <section className="metrics-grid" aria-label="Indicadores gerais">

                <article className="metric-card">
                    <span className="metric-label">PRODUTOS ATIVOS</span>
                    <strong className="metric-value">{carregando ? '...' : numero(resumo?.total_produtos_ativos)}</strong>
                    <span className="metric-muted">Cadastrados no estoque</span>
                </article>

                <article className="metric-card">
                    <span className="metric-label">VALOR EM ESTOQUE</span>
                    <strong className="metric-value">{carregando ? '...' : moeda.format(Number(resumo?.valor_total_estoque || 0))}</strong>
                    <span className="metric-muted">Preço atual × quantidade</span>
                </article>

                <article className="metric-card">
                    <span className="metric-label">ABAIXO DO MÍNIMO</span>
                    <strong className="metric-value">{carregando ? '...' : numero(resumo?.produtos_abaixo_minimo)}</strong>
                    <span className="metric-muted">Produtos para repor</span>
                </article>

                <article className="metric-card">
                    <span className="metric-label">MOVIMENTAÇÕES HOJE</span>
                    <strong className="metric-value">{carregando ? '...' : numero(Number(resumo?.entradas_hoje || 0) + Number(resumo?.saidas_hoje || 0))}</strong>
                    <span className="metric-muted">Entradas e saídas</span>
                </article>

            </section>

            {/* GRÁFICO */}
            <section className="dashboard-panel profit-panel">

                <div className="panel-heading">
                    <h2>MOVIMENTAÇÕES · {dias} DIAS</h2>

                    <div className="period-selector" aria-label="Período do gráfico">
                        <button
                            type="button"
                            className={dias === 7 ? 'selected' : ''}
                            aria-pressed={dias === 7}
                            onClick={() => setDias(7)}
                        >
                            7 dias
                        </button>

                        <button
                            type="button"
                            className={dias === 30 ? 'selected' : ''}
                            aria-pressed={dias === 30}
                            onClick={() => setDias(30)}
                        >
                            30 dias
                        </button>
                    </div>
                </div>

                <div className="profit-chart">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={dadosGrafico}
                            margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
                        >
                            <CartesianGrid vertical={false} stroke="#e2e6eb" />

                            <XAxis
                                dataKey="periodo"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#929aa5', fontSize: 12 }}
                                dy={8}
                            />

                            <YAxis
                                allowDecimals={false}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#929aa5', fontSize: 11 }}
                                tickFormatter={numero}
                                width={48}
                            />

                            <Tooltip
                                formatter={(valor, nome) => [numero(valor), nome]}
                            />

                            <Bar dataKey="entradas" name="Entradas" fill="#087f5b" radius={[5, 5, 0, 0]} maxBarSize={28} />
                            <Bar dataKey="saidas" name="Saídas" fill="#c45432" radius={[5, 5, 0, 0]} maxBarSize={28} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </section>

            {/* PAINÉIS INFERIORES */}
            <section className="bottom-panels">

                <article className="dashboard-panel team-panel">
                    <h2>Produtos abaixo do mínimo</h2>
                    {carregando ? <p>Carregando alertas...</p> : estoqueBaixo.length ? estoqueBaixo.slice(0, 5).map((produto) => (
                        <div className="team-stat" key={produto.id_produto}>
                            <span className="stat-icon" aria-hidden="true">!</span>
                            <div className="team-stat-text">
                                <strong>{produto.nome_produto}</strong>
                                <span>Estoque / mínimo</span>
                            </div>
                            <strong className="stat-number">{numero(produto.quantidade_estoque)} / {numero(produto.quantidade_minima)}</strong>
                        </div>
                    )) : <p>Nenhum produto abaixo do mínimo.</p>}
                </article>

                <article className="dashboard-panel clients-panel">
                    <h2>Clientes e categorias</h2>

                    <div className="client-metrics">
                        <div className="client-metric">
                            <span>CLIENTES ATIVOS</span>
                            <strong>{carregando ? '...' : numero(totalClientes)}</strong>
                        </div>

                        <div className="client-metric">
                            <span>CATEGORIAS</span>
                            <strong>{carregando ? '...' : numero(categorias.length)}</strong>
                        </div>
                    </div>

                    <span className="section-caption">
                        PRODUTOS POR CATEGORIA
                    </span>

                    {categorias.slice(0, 4).map((item) => {
                        const maiorTotal = Math.max(...categorias.map((categoria) => Number(categoria.total)), 1);
                        const percentual = Math.max(Number(item.total) > 0 ? 6 : 0, Number(item.total) / maiorTotal * 100);
                        return (
                            <div className="client-volume" key={item.categoria}>
                                <span className="client-initials">{item.categoria.slice(0, 2).toUpperCase()}</span>
                                <div className="volume-track" aria-label={`${item.categoria}: ${numero(item.total)} produtos`}>
                                    <div style={{ width: `${percentual}%` }} />
                                </div>
                                <strong>{numero(item.total)}</strong>
                            </div>
                        );
                    })}
                </article>

            </section>
        </>
    );
}

export default Dashboard;
