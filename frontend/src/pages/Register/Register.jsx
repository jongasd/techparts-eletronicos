import './Register.css'

import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'

import chipImage from '../../assets/chip.png'
import chipIcon from '../../assets/chip-icon.png'
import lockIcon from '../../assets/lock.png'

function Register() {
    const navigate = useNavigate()
    function voltarLogin(){
        navigate('/')
    }

    const [nome, setNome] = useState('')
    const [email, setEmail] = useState('')
    const [senha, setSenha] = useState('')
    const [cpf, setCpf] = useState('')
    const [telefone, setTelefone] = useState('')
    const [erro, setErro] = useState('')
    const [carregando, setCarregando] = useState(false)

    async function cadastrar(e) {
        e.preventDefault()

        setErro('')
        setCarregando(true)
        try{
            const resposta = await fetch(
                'http://localhost:3000/clientes',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        nome, email, senha, cpf, telefone
                    })
                }
            )

            if (!resposta.ok){
                throw new Error('Não foi possível realizar o cadastro')
            }

            navigate('/')
        } catch (error) {
            setErro(error.message || 'Erro ao realizar cadastro.')
        } finally {
            setCarregando(false)
        }
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

                    <form onSubmit={cadastrar}>
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
                                    placeholder="Ex: João Silva" value={nome} onChange={(e) => setNome(e.target.value)} required
                                />

                            </div>

                        </div>

                        {/* Email */}
                        <div className='mb-3'>

                            <div className="email-label">

                                <label
                                    htmlFor="email"
                                    className="form-label">
                                    EMAIL
                                </label>

                            </div>

                            <div className="input-container">

                                <input
                                    type="text"
                                    id="email"
                                    className="form-control register-input"
                                    placeholder="joao@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} required
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
                                    placeholder="••••••••" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete='new-password'required
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
                                    type='number'
                                    id="cpf"
                                    className="form-control register-input"
                                    placeholder="000.000.000-00" value={cpf} onChange={(e) => setCpf(e.target.value)} required
                                />

                            </div>

                            <div className="name-label">

                                <label htmlFor="cpf" className="form-label">
                                    TELEFONE - CELULAR
                                </label>

                            </div>

                            <div className="input-container">

                                <input
                                    type="number"
                                    id="telefone"
                                    className="form-control register-input"
                                    placeholder="(99)9999-9999" value={telefone} onChange={(e) => setTelefone(e.target.value)} required
                                />

                            </div>

                        </div>
                    
                        {erro && (
                            <p className='text-danger mt-2'>
                                {erro}
                            </p>
                        )}

                        {/* Botão */}
                        <button className="btn register-button w-100" type='submit' disabled={carregando}>
                            {carregando ? 'Cadastrando...' : 'Cadastrar e voltar à tela inicial'}
                        </button>

                        <br/>

                        <p className="register-text">
                            <Link to={"/"}>
                                Cancelar cadastro
                            </Link>
                        </p>
                    </form>

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