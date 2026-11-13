
import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';

import icones from '../../assets/icones';
import Confirmacao from '../Confirmacao/Confirmacao';

import './Sidebar.css';

function Sidebar({ menuAberto, setMenuAberto }) {
    const location = useLocation();
    const navigate = useNavigate();

    const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);

    // Módulos da sidebar
    const modulos = [
        { nome: 'Dashboard', icone: icones.dashboard, rota: '/dashboard' },
        { nome: 'Sistema', icone: icones.sistema, rota: '/sistema' },
        { nome: 'Produtos', icone: icones.produtos, rota: '/produtos' },
        { nome: 'Estoque', icone: icones.estoque, rota: '/estoque' },
        { nome: 'Funcionários', icone: icones.funcionarios, rota: '/funcionarios' },
        { nome: 'Clientes', icone: icones.clientes, rota: '/clientes' }
    ];

    // Confirma o encerramento da sessão
    function encerrarSessao() {
        setMostrarConfirmacao(false);
        navigate('/');
    }

    return (
        <aside className="dashboard-sidebar">

            {/* IDENTIFICAÇÃO DA LOJA */}

            <button
                type="button"
                className="sidebar-brand"
                onClick={() => setMenuAberto(!menuAberto)}
                aria-label={menuAberto ? 'Recolher menu lateral' : 'Expandir menu lateral'}
                title="Mostrar ou esconder menu"
            >
                <img src={icones.logo} alt="" className="brand-logo" />

                {menuAberto && (
                    <span className="brand-text">
                        <strong>TECHPARTS</strong>
                        <small>ELETRÔNICOS</small>
                    </span>
                )}
            </button>


            {/* NAVEGAÇÃO */}

            <nav className="sidebar-navigation" aria-label="Menu principal">

                {modulos.map(({ nome, icone, rota }) => (
                    <button
                        key={nome}
                        type="button"
                        className={`sidebar-link ${location.pathname === rota ? 'active' : ''}`}
                        title={nome}
                        onClick={() => {
                            if (rota) {
                                navigate(rota);
                            } else {
                                console.log(`Abrir módulo: ${nome}`);
                            }
                        }}
                    >
                        <img src={icone} alt="" className="sidebar-icon" />

                        {menuAberto && <span>{nome}</span>}
                    </button>
                ))}

            </nav>


            {/* ENCERRAR SESSÃO */}

            <button
                type="button"
                className="logout-button"
                title="Encerrar sessão"
                onClick={() => setMostrarConfirmacao(true)}
            >
                <img src={icones.sair} alt="" className="sair" />

                {menuAberto && <span>ENCERRAR SESSÃO</span>}
            </button>


            {/* POP-UP DE CONFIRMAÇÃO */}

            {mostrarConfirmacao && (
                <Confirmacao
                    titulo="Encerrar sessão?"
                    mensagem="Tem certeza de que deseja sair da sua conta? Você precisará entrar novamente para acessar o sistema."
                    aoConfirmar={encerrarSessao}
                    aoCancelar={() => setMostrarConfirmacao(false)}
                />
            )}

        </aside>
    );
}

export default Sidebar;