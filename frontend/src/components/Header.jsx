import './Header.css'

function Header({nomeLoja, mensagem, quantidade}){
    return(
        <header>
            <nav className="navbar autoparts-navbar">
                <div className="container">
                    <a href="#" className="navbar-brand">
                        🚗 {nomeLoja}
                        <br/>
                            {mensagem}
                    </a>
                    <ul className="nav gap-2">
                        <li className="nav-item"><a href="#" className="nav-link">Inicio</a></li>
                        <li className="nav-item"><a href="#" className="nav-link">Produtos</a></li>
                        <li className="nav-item"><a href="#" className="nav-link">Carrinho {quantidade > 0 && <span className="quantidade">{quantidade}</span>}</a></li>
                    </ul>
                </div>
            </nav>
        </header>
    )
}
export default Header;