
import { useLocation, useNavigate } from 'react-router-dom';
import icones from '../../assets/icones';
import './Sidebar.css';

function Sidebar({ menuAberto, setMenuAberto }) {
  const location = useLocation();
  const navigate = useNavigate();

  const modulos = [
    { nome: 'Dashboard', icone: icones.dashboard, rota: '/dashboard' },
    { nome: 'Sistema', icone: icones.sistema, rota: '/sistema' },
    { nome: 'Produtos', icone: icones.produtos },
    { nome: 'Estoque', icone: icones.estoque, rota: '/estoque' },
    { nome: 'Funcionários', icone: icones.funcionarios },
    { nome: 'Clientes', icone: icones.clientes }
  ];

  return (
    <aside className="dashboard-sidebar">

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

      <nav className="sidebar-navigation" aria-label="Menu principal">
        {modulos.map(({ nome, icone, rota }) => (
          <button
            key={nome}
            type="button"
            className={`sidebar-link ${rota && location.pathname === rota ? 'active' : ''}`}
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

      <button
        type="button"
        className="logout-button"
        title="Encerrar sessão"
        onClick={() => navigate('/')}
      >
        <img src={icones.sair} alt="" className="sair" />
        {menuAberto && <span>ENCERRAR SESSÃO</span>}
      </button>

    </aside>
  );
}

export default Sidebar;