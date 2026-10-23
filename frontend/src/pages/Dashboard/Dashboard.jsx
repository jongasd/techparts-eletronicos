
import { useState } from 'react';

import icones from '../../assets/icones'

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

// Dados demonstrativos. Depois serão substituídos pela API.
const dadosSemanais = [
    { periodo: 'Seg', lucro: 12000 },
    { periodo: 'Ter', lucro: 19000 },
    { periodo: 'Qua', lucro: 15000 },
    { periodo: 'Qui', lucro: 25000 },
    { periodo: 'Sex', lucro: 22000 },
    { periodo: 'Sáb', lucro: 30000 },
    { periodo: 'Dom', lucro: 28000 }
];

const dadosMensais = [
    { periodo: 'Jan', lucro: 23500 },
    { periodo: 'Fev', lucro: 15500 },
    { periodo: 'Mar', lucro: 2700 },
    { periodo: 'Abr', lucro: 3600 },
    { periodo: 'Mai', lucro: 7000 },
    { periodo: 'Jun', lucro: 13500 },
    { periodo: 'Jul', lucro: 29000 },
    { periodo: 'Ago', lucro: 18000 },
    { periodo: 'Set', lucro: 7500 },
    { periodo: 'Out', lucro: 4300 },
    { periodo: 'Nov', lucro: 13500 },
    { periodo: 'Dez', lucro: 25200 }
];

const modulos = [
    { nome: 'Dashboard', icone: icones.dashboard },
    { nome: 'Sistema', icone: icones.sistema },
    { nome: 'Produtos', icone: icones.produtos },
    { nome: 'Estoque', icone: icones.estoque },
    { nome: 'Funcionários', icone: icones.funcionarios },
    { nome: 'Clientes', icone: icones.clientes }
];

function Dashboard() {
    const [periodo, setPeriodo] = useState('Semanal');
    const [menuAberto, setMenuAberto] = useState(true);

    const dadosGrafico =
        periodo === 'Mensal' ? dadosMensais : dadosSemanais;

    return (
        <div className={`dashboard-layout ${menuAberto ? '' : 'sidebar-recolhida'}`}>

            {/* BARRA LATERAL */}
            <aside className="dashboard-sidebar">

                <button
                    type="button"
                    className="sidebar-brand"
                    onClick={() => setMenuAberto(!menuAberto)}
                    aria-label={menuAberto ? 'Recolher menu lateral' : 'Expandir menu lateral'}
                    title="Mostrar ou esconder menu"
                >

                    {menuAberto && (
                        <span className="brand-text">
                            <strong>TECHPARTS</strong>
                            <small>ELETRÔNICOS</small>
                        </span>
                    )}
                </button>

                <nav className="sidebar-navigation" aria-label="Menu principal">
                    {modulos.map(({ nome, icone }) => (
                    <button
                        key={nome}
                        type="button"
                        className={`sidebar-link ${nome === 'Dashboard' ? 'active' : ''}`}
                        title={nome}
                        onClick={() => {
                        if (nome !== 'Dashboard') {
                            console.log(`Abrir módulo: ${nome}`);
                        }
                        }}
                    >
                        <img
                        src={icone}
                        alt=""
                        className="sidebar-icon"
                        />

                        {menuAberto && <span>{nome}</span>}
                    </button>
                    ))}
                </nav>

                <button
                    type="button"
                    className="logout-button"
                    title="Encerrar sessão"
                    onClick={() => console.log('Encerrar sessão')}
                >
                    {menuAberto && <span>ENCERRAR SESSÃO</span>}
                </button>
            </aside>

            {/* ÁREA PRINCIPAL */}
            <div className="dashboard-content">

                {/* BARRA SUPERIOR */}
                <header className="dashboard-topbar">
                    <div className="topbar-spacer" />

                    <label className="dashboard-search">
                        <input
                            type="search"
                            placeholder="Buscar no sistema..."
                            aria-label="Buscar no sistema"
                        />
                    </label>

                    <button type="button" className="topbar-icon" aria-label="Notificações">
                        
                    </button>

                    <button type="button" className="topbar-icon" aria-label="Ajuda">
                        
                    </button>

                    <div className="topbar-divider" />

                    <button
                        type="button"
                        className="topbar-profile"
                        onClick={() => console.log('Abrir perfil')}
                    >
                        <span>PERFIL</span>
                        <span className="profile-avatar">
                            
                        </span>
                    </button>
                </header>

                {/* CONTEÚDO */}
                <main className="dashboard-main">

                    {/* INDICADORES */}
                    <section className="metrics-grid" aria-label="Indicadores gerais">

                        <article className="metric-card">
                            <span className="metric-label">CHECAR ESTOQUE</span>
                            <strong className="metric-value">40 Dias</strong>
                            <span className="metric-positive">
                                
                                12 dias restantes
                            </span>
                        </article>

                        <article className="metric-card">
                            <span className="metric-label">MARGEM BRUTA</span>
                            <strong className="metric-value">32%</strong>
                            <span className="metric-positive">
                                
                                +4.2% este mês
                            </span>
                        </article>

                        <article className="metric-card">
                            <span className="metric-label">ATIVOS TOTAIS</span>
                            <strong className="metric-value">R$ 1.2M</strong>
                            <span className="metric-muted">Capacidade: 84%</span>
                        </article>

                        <article className="metric-card">
                            <span className="metric-label">VENDAS DO MÊS</span>
                            <strong className="metric-value">R$85.400</strong>
                            <span className="metric-positive">
                                
                                +8,5% em relação ao mês anterior
                            </span>
                        </article>

                    </section>

                    {/* GRÁFICO */}
                    <section className="dashboard-panel profit-panel">

                        <div className="panel-heading">
                            <h2>LUCRO {periodo.toUpperCase()}</h2>

                            <div className="period-selector" aria-label="Período do gráfico">
                                <button
                                    type="button"
                                    className={periodo === 'Mensal' ? 'selected' : ''}
                                    aria-pressed={periodo === 'Mensal'}
                                    onClick={() => setPeriodo('Mensal')}
                                >
                                    Mensal
                                </button>

                                <button
                                    type="button"
                                    className={periodo === 'Semanal' ? 'selected' : ''}
                                    aria-pressed={periodo === 'Semanal'}
                                    onClick={() => setPeriodo('Semanal')}
                                >
                                    Semanal
                                </button>
                            </div>
                        </div>

                        <div className="profit-chart">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={dadosGrafico}
                                    margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
                                >
                                    <CartesianGrid
                                        vertical={false}
                                        stroke="#e2e6eb"
                                    />

                                    <XAxis
                                        dataKey="periodo"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#929aa5', fontSize: 12 }}
                                        dy={8}
                                    />

                                    <YAxis
                                        domain={[0, 30000]}
                                        ticks={[0, 5000, 10000, 15000, 20000, 25000, 30000]}
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#929aa5', fontSize: 11 }}
                                        tickFormatter={(valor) =>
                                            valor.toLocaleString('pt-BR')
                                        }
                                        width={48}
                                    />

                                    <Tooltip
                                        formatter={(valor) => [
                                            `R$ ${Number(valor).toLocaleString('pt-BR')}`,
                                            'Lucro'
                                        ]}
                                        labelFormatter={(label) => `Período: ${label}`}
                                    />

                                    <Bar
                                        dataKey="lucro"
                                        fill="#06395c"
                                        radius={[7, 7, 0, 0]}
                                        maxBarSize={40}
                                        animationDuration={350}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </section>

                    {/* PAINÉIS INFERIORES */}
                    <section className="bottom-panels">

                        <article className="dashboard-panel team-panel">
                            <h2>Equipe &amp; Funcionários</h2>

                            <div className="team-stat">
                                <span className="stat-icon">
                                    
                                </span>

                                <div className="team-stat-text">
                                    <strong>Total de Ativos</strong>
                                    <span>Funcionários em campo</span>
                                </div>

                                <strong className="stat-number">142</strong>
                            </div>

                            <div className="team-stat">
                                <span className="stat-icon">
                                    
                                </span>

                                <div className="team-stat-text">
                                    <strong>Equipes de Manutenção</strong>
                                    <span>Técnicos especializados</span>
                                </div>

                                <strong className="stat-number">08</strong>
                            </div>

                            <div className="efficiency">
                                <span className="section-caption">EFICIÊNCIA DA EQUIPE</span>

                                <div className="progress-track">
                                    <div className="progress-value" style={{ width: '92%' }} />
                                </div>

                                <div className="progress-labels">
                                    <span>Performance: 92%</span>
                                    <span>Meta: 85%</span>
                                </div>
                            </div>
                        </article>

                        <article className="dashboard-panel clients-panel">
                            <h2>Visão Geral de Clientes</h2>

                            <div className="client-metrics">
                                <div className="client-metric">
                                    <span>NOVOS (30 DIAS)</span>
                                    <strong>+24</strong>
                                </div>

                                <div className="client-metric">
                                    <span>CHURN RATE</span>
                                    <strong className="churn-value">1.2%</strong>
                                </div>
                            </div>

                            <span className="section-caption">
                                PRINCIPAIS CLIENTES POR VOLUME
                            </span>

                            <div className="client-volume">
                                <span className="client-initials">IN</span>
                                <div className="volume-track">
                                    <div style={{ width: '80%' }} />
                                </div>
                                <strong>80%</strong>
                            </div>

                            <div className="client-volume">
                                <span className="client-initials">ME</span>
                                <div className="volume-track">
                                    <div style={{ width: '65%' }} />
                                </div>
                                <strong>65%</strong>
                            </div>

                            <div className="client-volume">
                                <span className="client-initials">TC</span>
                                <div className="volume-track">
                                    <div style={{ width: '40%' }} />
                                </div>
                                <strong>40%</strong>
                            </div>
                        </article>

                    </section>
                </main>

                {/* RODAPÉ */}
                <footer className="dashboard-footer">
                    <span>© 2026 Corporate Precision Systems</span>

                    <nav aria-label="Links institucionais">
                        <a href="#privacidade">Privacy Policy</a>
                        <a href="#termos">Terms of Service</a>
                        <a href="#suporte">Contact Support</a>
                    </nav>
                </footer>

            </div>
        </div>
    );
}

export default Dashboard;