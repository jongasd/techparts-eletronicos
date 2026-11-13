import icones from '../../assets/icones';
import './Header.css';
import { useNavigate } from 'react-router-dom';

function Header() {
    const navigate = useNavigate();

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

            <div className="topbar-divider" />

            <button
                type="button"
                className="topbar-profile"
                onClick={() => navigate('/perfil')}
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