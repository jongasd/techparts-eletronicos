import './Footer.css';

function Footer() {
    return (
        <footer className="dashboard-footer">
            <span>© 2026 Corporate Precision Systems</span>

            <nav aria-label="Links institucionais">
                <a href="#privacidade">Privacy Policy</a>
                <a href="#termos">Terms of Service</a>
                <a href="#suporte">Contact Support</a>
            </nav>
        </footer>
    );
}

export default Footer;