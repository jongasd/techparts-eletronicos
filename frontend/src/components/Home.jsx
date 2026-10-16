
import './Home.css';

import dashboardIcon from '../assets/dashboard-icon.png';
import sistemaIcon from '../assets/config-icon.png';
import produtosIcon from '../assets/products-icon.png';
import estoqueIcon from '../assets/stock-icon.png';
import funcionariosIcon from '../assets/workers-icon.png';
import clientesIcon from '../assets/customers-icon.png';

import perfilIcon from '../assets/pfp-icon.png';
import notificacoesIcon from '../assets/notification-icon.png';
import configuracoesIcon from '../assets/config-icon.png';
import ajudaIcon from '../assets/help-icon.png';

const modulos = [
    { nome: 'Dashboard', icone: dashboardIcon },
    { nome: 'Sistema', icone: sistemaIcon },
    { nome: 'Produtos', icone: produtosIcon },
    { nome: 'Estoque', icone: estoqueIcon },
    { nome: 'Funcionários', icone: funcionariosIcon },
    { nome: 'Clientes', icone: clientesIcon },
];

function Home() {
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
                    <button type="button" className="profile-action">
                        <span>PERFIL</span>
                        <img
                            src={perfilIcon}
                            alt=""
                            className="header-icon-image"
                        />
                    </button>

                    <button type="button" aria-label="Notificações">
                        <img
                            src={notificacoesIcon}
                            alt=""
                            className="header-icon-image"
                        />
                    </button>

                    <button type="button" aria-label="Configurações">
                        <img
                            src={configuracoesIcon}
                            alt=""
                            className="header-icon-image"
                        />
                    </button>

                    <button type="button" aria-label="Ajuda">
                        <img
                            src={ajudaIcon}
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
                            onClick={() => console.log(
                                `Módulo selecionado: ${modulo.nome}`
                            )}
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