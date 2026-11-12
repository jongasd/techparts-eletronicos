import './Login.css'

import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'

import icones from '../../assets/icones' 

import chipImage from '../../assets/chip.png'
import { apiRequest, saveAuthToken } from '../../services/api'

function Login() {
    const navigate = useNavigate()
    const [login, setLogin] = useState('')
    const [senha, setSenha] = useState('')
    const [lembrar, setLembrar] = useState(false)
    const [erro, setErro] = useState('')
    const [carregando, setCarregando] = useState(false)
    const [mostrarSenha, setMostrarSenha] = useState(false)

    async function entrar(event) {
        event.preventDefault()
        setErro('')
        setCarregando(true)

        try {
            const resposta = await apiRequest('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ login, senha })
            })

            saveAuthToken(resposta.token, lembrar)
            navigate('/home')
        } catch (error) {
            setErro(error.message || 'Não foi possível entrar.')
        } finally {
            setCarregando(false)
        }
    }

    return (
        <div className="login-page">

            {/* Lado esquerdo */}
            <section className="login-brand">

                <div className="brand-content">

                    <div className="chip-icon">
                        <img
                            src={icones.logo}
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


                    <form onSubmit={entrar}>
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
                                value={login}
                                onChange={(event) => setLogin(event.target.value)}
                                autoComplete="username"
                                required
                            />

                            <img
                                src={icones.usuario}
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
                                type={mostrarSenha ? "text" : "password"}
                                id="senha"
                                className="form-control login-input"
                                placeholder="••••••••"
                                value={senha}
                                onChange={(event) => setSenha(event.target.value)}
                                autoComplete="current-password"
                                required
                            />

                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setMostrarSenha(!mostrarSenha)}
                                aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                            >
                                <img
                                    src={icones.visibilidade}
                                    alt=""
                                />
                            </button>

                        </div>

                        <Link
                            to="/recuperar-senha"
                            className="forgot-password"
                        >
                            Esqueceu a senha?
                        </Link>

                    </div>


                    {/* Checkbox */}
                    <div className="form-check mb-4">

                        <input
                            type="checkbox"
                            id="lembrar"
                            className="form-check-input"
                            checked={lembrar}
                            onChange={(event) => setLembrar(event.target.checked)}
                        />

                        <label
                            htmlFor="lembrar"
                            className="form-check-label"
                        >
                            Manter conectado neste dispositivo
                        </label>

                    </div>


                    {/* Botão */}
                    {erro && <p className="text-danger" role="alert">{erro}</p>}

                    <button className="btn login-button w-100" type="submit" disabled={carregando}>
                        {carregando ? 'Entrando...' : 'Login'}
                        <span>→</span>
                    </button>
                    </form>


                    {/* Separador */}
                    <hr />


                    {/* Cadastro */}
                    <p className="register-text">
                        Precisa de acesso? Solicite ao administrador do sistema.
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