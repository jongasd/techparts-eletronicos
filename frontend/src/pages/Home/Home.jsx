
import './Home.css';
import { useNavigate } from 'react-router-dom';

import icones from '../../assets/icones'

const modulos = [
    { nome: 'Dashboard', icone: icones.dashboard, rota: '/dashboard'},
    { nome: 'Sistema', icone: icones.sistema, rota: '/sistema'},
    { nome: 'Produtos', icone: icones.produtos, rota: '/produtos'},
    { nome: 'Estoque', icone: icones.estoque, rota: '/estoque'},
    { nome: 'Funcionários', icone: icones.funcionarios, rota: '/funcionarios'},
    { nome: 'Clientes', icone: icones.clientes, rota: '/clientes'},
];

function Home() {
    const navigate = useNavigate()
    return (
        <div className="home-page">

            {/* Cabeçalho */}
            <header className="home-header">
                <div className="home-brand">
                    <span className="brand-name">TECHPARTS</span>
                    <span className="brand-divider"></span>
                    <span className="brand-panel">AdminPanel</span>
                </div>

                <nav className="header-actions" aria-label="Ações do usuário">
                    <button type="button" className="profile-action" onClick={() => navigate('/perfil')}>
                        <span>PERFIL</span>
                        <img
                            src={icones.perfil}
                            alt=""
                            className="header-icon-image"
                        />
                    </button>

                    <button type="button" aria-label="Notificações">
                        <img
                            src={icones.notificacoes}
                            alt=""
                            className="header-icon-image"
                        />
                    </button>

                    <button type="button" aria-label="Configurações">
                        <img
                            src={icones.configuracoes}
                            alt=""
                            className="header-icon-image"
                        />
                    </button>

                    <button type="button" aria-label="Ajuda">
                        <img
                            src={icones.ajuda}
                            alt=""
                            className="header-icon-image"
                        />
                    </button>
                </nav>
            </header>

            {/* Banner principal */}
            <section className="home-hero">
                <h1>O que quer consultar primeiro?</h1>
                <p>
                    Selecione um módulo abaixo para gerenciar sua
                    operação técnica de precisão.
                </p>
            </section>

            {/* Módulos */}
            <main className="home-main">
                <div className="modules-grid">
                    {modulos.map((modulo) => (
                        <button
                            type="button"
                            className="module-card"
                            key={modulo.nome}
                            onClick={() => navigate(modulo.rota)}
                        >
                            <span className="module-icon">
                                <img
                                    src={modulo.icone}
                                    alt=""
                                    className="module-icon-image"
                                />
                            </span>

                            <span className="module-name">
                                {modulo.nome}
                            </span>
                        </button>
                    ))}
                </div>
            </main>

            {/* Rodapé */}
            <footer className="home-footer">
                <span>© 2026 Corporate Precision Systems</span>

                <nav aria-label="Links institucionais">
                    <a href="#privacidade">Privacy Policy</a>
                    <a href="#termos">Terms of Service</a>
                    <a href="#suporte">Contact Support</a>
                </nav>
            </footer>

        </div>
    );
}

export default Home;