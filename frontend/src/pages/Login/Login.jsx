import './Login.css'

import { Link, useNavigate } from 'react-router-dom'

import chipImage from '../../assets/chip.png'
import chipIcon from '../../assets/chip-icon.png'
import userIcon from '../../assets/user.png'
import lockIcon from '../../assets/lock.png'

function Login() {
    const navigate = useNavigate()
    
    function irHome(){
        navigate('/home')
    }
    return (
        <div className="login-page">

            {/* Lado esquerdo */}
            <section className="login-brand">

                <div className="brand-content">

                    <div className="chip-icon">
                        <img
                            src={chipIcon}
                            alt="Ícone de chip"
                        />
                    </div>

                    <h1>
                        TECHPARTS <span>ELETRÔNICOS</span>
                    </h1>

                    <p>O futuro começa aqui.</p>

                </div>

                <div className="chip-background">
                    <img src={chipImage} alt="Chip eletrônico" />
                </div>

            </section>


            {/* Lado direito */}
            <section className="login-area">

                <div className="login-card">

                    <h2>Bem-vindo!</h2>

                    <p className="login-description">
                        Acesse sua conta corporativa para gerenciar pedidos
                        e suporte técnico.
                    </p>


                    {/* Nome */}
                    <div className="mb-4">

                        <label htmlFor="nome" className="form-label">
                            NOME
                        </label>

                        <div className="input-container">

                            <input
                                type="text"
                                id="nome"
                                className="form-control login-input"
                                placeholder="Digite seu nome de usuário"
                            />

                            <img
                                src={userIcon}
                                alt=""
                                className="input-icon"
                            />

                        </div>

                    </div>

                    {/* Senha */}
                    <div className="mb-3">

                        <div className="password-label">

                            <label
                                htmlFor="senha"
                                className="form-label"
                            >
                                SENHA
                            </label>

                        </div>

                        <div className="input-container">

                            <input
                                type="password"
                                id="senha"
                                className="form-control login-input"
                                placeholder="••••••••"
                            />

                            <img
                                src={lockIcon}
                                alt=""
                                className="input-icon"
                            />

                            <a
                                href="#"
                                className="forgot-password"
                            >
                                Esqueceu a senha?
                            </a>

                        </div>

                    </div>


                    {/* Checkbox */}
                    <div className="form-check mb-4">

                        <input
                            type="checkbox"
                            id="lembrar"
                            className="form-check-input"
                        />

                        <label
                            htmlFor="lembrar"
                            className="form-check-label"
                        >
                            Manter conectado neste dispositivo
                        </label>

                    </div>


                    {/* Botão */}
                    <button className="btn login-button w-100" type='button' onClick={irHome}>
                        Login
                        <span>→</span>
                    </button>


                    {/* Separador */}
                    <hr />


                    {/* Cadastro */}
                    <p className="register-text">
                        Não tem uma conta?{' '}
                        <Link to={"/register"}>
                            Cadastre-se
                        </Link>
                    </p>

                </div>


                {/* Links inferiores */}
                <footer className="login-footer">

                    <a href="#">Privacidade</a>
                    <a href="#">Termos de Uso</a>
                    <a href="#">Suporte</a>

                </footer>

            </section>

        </div>
    )
}

export default Login