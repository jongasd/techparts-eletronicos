import './Register.css'

import { Link, useNavigate } from 'react-router-dom'

import chipImage from '../assets/chip.png'
import chipIcon from '../assets/chip-icon.png'
import lockIcon from '../assets/lock.png'

function Register() {
    const navigate = useNavigate()
    function voltarLogin(){
        navigate('/')
    }

    return (
        <div className="register-page">

            {/* Lado esquerdo */}
            <section className="register-brand">

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
            <section className="register-area">

                <div className="register-card">

                    <h2>Cadastro</h2>

                    <p className="register-description">
                        Preencha os campos abaixo para criar sua conta corporativa.
                    </p>


                    {/* Nome */}
                    <div className="mb-4">
                        <div className="name-label">

                            <label htmlFor="nome" className="form-label">
                                NOME COMPLETO
                            </label>

                        </div>

                        <div className="input-container">

                            <input
                                type="text"
                                id="nome"
                                className="form-control register-input"
                                placeholder="Ex: João Silva"
                            />

                        </div>

                    </div>

                    {/* Email */}
                    <div className='mb-3'>

                        <div className="email-label">

                            <label
                                htmlFor="senha"
                                className="form-label">
                                EMAIL
                            </label>

                        </div>

                        <div className="input-container">

                            <input
                                type="text"
                                id="nome"
                                className="form-control register-input"
                                placeholder="joao@gmail.com"
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
                                className="form-control register-input"
                                placeholder="••••••••"
                            />

                            <img
                                src={lockIcon}
                                alt=""
                                className="input-icon"
                            />

                        </div>

                    </div>

                    {/* CPF e TEL */}
                    <div className="mb-4">
                        <div className="name-label">

                            <label htmlFor="cpf" className="form-label">
                                CPF
                            </label>

                        </div>

                        <div className="input-container">

                            <input
                                type='text'
                                id="cpf"
                                className="form-control register-input"
                                placeholder="000.000.000-00"
                            />

                        </div>

                        <div className="name-label">

                            <label htmlFor="cpf" className="form-label">
                                TELEFONE - CELULAR
                            </label>

                        </div>

                        <div className="input-container">

                            <input
                                type="text"
                                id="telefone"
                                className="form-control register-input"
                                placeholder="(99)9999-9999"
                            />

                        </div>

                    </div>

                    


                    {/* Botão */}
                    <button className="btn register-button w-100" onClick={voltarLogin}>
                        Cadastrar e voltar à tela inicial
                    </button>

                    <br/>

                    <p className="register-text">
                        <Link to={"/"}>
                            Cancelar cadastro
                        </Link>
                    </p>


                    {/* Separador */}
                    <hr />


                    {/* Cadastro */}
                    <p className="register-text">
                        © 2026 TECHPARTS ELETRÔNICOS.
                        <br/>
                        Sua privacidade e segurança de dados são nossa prioridade.
                    </p>

                </div>


                {/* Links inferiores */}
                <footer className="register-footer">

                    <a href="#">Privacidade</a>
                    <a href="#">Termos de Uso</a>
                    <a href="#">Suporte</a>

                </footer>

            </section>

        </div>
    )
}

export default Register