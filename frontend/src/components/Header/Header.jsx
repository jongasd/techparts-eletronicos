import icones from '../../assets/icones';
import './Header.css';

function Header() {
    return (
        <header className="dashboard-topbar">
            <div className="topbar-spacer" />

            <label className="dashboard-search">
                <img
                    src={icones.procura}
                    alt=""
                    className="search-icon"
                />
                <input
                    type="search"
                    placeholder="Buscar no sistema..."
                    aria-label="Buscar no sistema"
                />
            </label>

            <button
                type="button"
                className="topbar-icon"
                aria-label="Notificações"
            >
                <img src={icones.notificacoes} alt="" />
            </button>

            <button
                type="button"
                className="topbar-icon"
                aria-label="Ajuda"
            >
                <img src={icones.ajuda} alt="" />
            </button>

            <div className="topbar-divider" />

            <button
                type="button"
                className="topbar-profile"
                onClick={() => console.log('Abrir perfil')}
            >
                <span>PERFIL</span>
                <img
                    src={icones.perfil}
                    alt="Foto de perfil"
                    className="profile-avatar"
                />
            </button>
        </header>
    );
}

export default Header;