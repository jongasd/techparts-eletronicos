import './Register.css'

import { Link } from 'react-router-dom'
import { useState } from 'react'

import chipImage from '../../assets/chip.png'
import chipIcon from '../../assets/chip-icon.png'
import lockIcon from '../../assets/lock.png'
import { apiRequest, getAuthToken } from '../../services/api'


// Formata o CPF: 000.000.000-00
function formatarCPF(valor) {
    const numeros = valor.replace(/\D/g, '').slice(0, 11);

    let formatado = numeros;

    if (numeros.length > 3) {
        formatado = numeros.slice(0, 3) + '.' + numeros.slice(3);
    }

    if (numeros.length > 6) {
        formatado = numeros.slice(0, 3) + '.' +
                    numeros.slice(3, 6) + '.' +
                    numeros.slice(6);
    }

    if (numeros.length > 9) {
        formatado = numeros.slice(0, 3) + '.' +
                    numeros.slice(3, 6) + '.' +
                    numeros.slice(6, 9) + '-' +
                    numeros.slice(9);
    }

    return formatado;
}


// Formata o telefone: (00) 00000-0000
function formatarTelefone(valor) {
    const numeros = valor.replace(/\D/g, '').slice(0, 11);

    if (numeros.length <= 2) {
        return numeros.length ? `(${numeros}` : '';
    }

    const ddd = numeros.slice(0, 2);
    const numero = numeros.slice(2);

    if (numeros.length <= 10) {
        if (numero.length <= 4) {
            return `(${ddd}) ${numero}`;
        }

        return `(${ddd}) ${numero.slice(0, 4)}-${numero.slice(4)}`;
    }

    if (numero.length <= 5) {
        return `(${ddd}) ${numero}`;
    }

    return `(${ddd}) ${numero.slice(0, 5)}-${numero.slice(5)}`;
}

function Register() {
    const [nome, setNome] = useState('')
    const [login, setLogin] = useState('')
    const [senha, setSenha] = useState('')
    const [idRole, setIdRole] = useState('3')
    const [erro, setErro] = useState('')
    const [sucesso, setSucesso] = useState('')
    const [carregando, setCarregando] = useState(false)

    
    async function cadastrar(e) {
        e.preventDefault();

        setErro('')
        setSucesso('')

        if (!getAuthToken()) {
            setErro('Entre com uma conta administradora para criar acessos de funcionários.')
            return
        }

        setCarregando(true)
        try {
            await apiRequest('/auth/registrar', {
                method: 'POST',
                body: JSON.stringify({
                    nome_funcionario: nome.trim(),
                    login: login.trim(),
                    senha,
                    id_role: Number(idRole)
                })
            })

            setSucesso('Acesso de funcionário criado com sucesso.')
            setNome('')
            setLogin('')
            setSenha('')
            setIdRole('3')
        } catch (error) {
            setErro(error.message || 'Não foi possível criar o acesso.')
        } finally {
            setCarregando(false);
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
                        Crie um acesso para um funcionário. Esta ação exige uma conta administradora.
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

                        {/* Login */}
                        <div className='mb-3'>

                            <div className="email-label">

                                <label
                                    htmlFor="login"
                                    className="form-label">
                                    LOGIN
                                </label>

                            </div>

                            <div className="input-container">
                                
                                <input
                                    type="text"
                                    id="login"
                                    className="form-control register-input"
                                    placeholder="Ex.: joao.silva"
                                    value={login}
                                    onChange={(e) => setLogin(e.target.value)}
                                    autoComplete="username"
                                    required
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
                                    placeholder="Mínimo de 8 caracteres"
                                    value={senha}
                                    onChange={(e) => setSenha(e.target.value)}
                                    autoComplete="new-password"
                                    minLength={8}
                                    required
                                />

                                <img
                                    src={lockIcon}
                                    alt=""
                                    className="input-icon"
                                />

                            </div>

                        </div>

                        {/* Perfil */}
                        <div className="mb-4">
                            <div className="name-label">

                                <label htmlFor="perfil" className="form-label">
                                    PERFIL
                                </label>

                            </div>

                            <div className="input-container">

                                <select
                                    id="perfil"
                                    className="form-control register-input"
                                    value={idRole}
                                    onChange={(e) => setIdRole(e.target.value)}
                                >
                                    <option value="3">Funcionário</option>
                                    <option value="2">Gerente</option>
                                </select>

                            </div>

                        </div>
                    
                        {sucesso && <p className="text-success mt-2" role="status">{sucesso}</p>}

                        {erro && (
                            <p className='text-danger mt-2' role="alert">
                                {erro}
                            </p>
                        )}

                        {/* Botão */}
                        <button className="btn register-button w-100" type='submit' disabled={carregando}>
                            {carregando ? 'Criando acesso...' : 'Criar acesso de funcionário'}
                        </button>

                        <br/>

                        <p className="register-text">
                            <Link to={"/"}>
                                Voltar ao login
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