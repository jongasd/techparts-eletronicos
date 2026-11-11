
import './Perfil.css';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import perfilIcon from '../../assets/pfp-icon.png';
import { apiRequest } from '../../services/api';

function formatarTelefone(valor) {
    const numeros = valor.replace(/\D/g, '').slice(0, 11);

    if (numeros.length === 0) return '';

    if (numeros.length <= 2) {
        return `(${numeros}`;
    }

    const ddd = numeros.slice(0, 2);
    const restante = numeros.slice(2);

    if (numeros.length > 10) {
        if (restante.length <= 5) {
            return `(${ddd}) ${restante}`;
        }

        return `(${ddd}) ${restante.slice(0, 5)}-${restante.slice(5)}`;
    }

    if (restante.length <= 4) {
        return `(${ddd}) ${restante}`;
    }

    return `(${ddd}) ${restante.slice(0, 4)}-${restante.slice(4)}`;
}

function Perfil() {
    const navigate = useNavigate();

    const [dados, setDados] = useState(null);
    const [senhaForm, setSenhaForm] = useState({
        senha_atual: '',
        senha_nova: ''
    });

    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [trocandoSenha, setTrocandoSenha] = useState(false);
    const [erro, setErro] = useState('');
    const [mensagem, setMensagem] = useState('');

    useEffect(() => {
        let montado = true;

        apiRequest('/auth/perfil')
            .then((resposta) => {
                if (montado) {
                    setDados({
                        ...resposta.dados,
                        telefone: resposta.dados.telefone
                            ? formatarTelefone(resposta.dados.telefone)
                            : ''
                    });
                }
            })
            .catch((error) => {
                if (!montado) return;

                setErro(error.message || 'Não foi possível carregar o perfil.');

                if (
                    error.message?.includes('Token') ||
                    error.message?.includes('Sessão')
                ) {
                    navigate('/');
                }
            })
            .finally(() => {
                if (montado) setCarregando(false);
            });

        return () => {
            montado = false;
        };
    }, [navigate]);

    function atualizarCampo(e) {
        const { name, value } = e.target;

        const valorFinal = name === 'telefone'
            ? formatarTelefone(value)
            : value;

        setDados((dadosAtuais) => ({
            ...dadosAtuais,
            [name]: valorFinal
        }));
    }

    async function salvarAlteracoes(e) {
        e.preventDefault();

        setErro('');
        setMensagem('');
        setSalvando(true);

        try {
            const resposta = await apiRequest('/auth/perfil', {
                method: 'PUT',
                body: JSON.stringify({
                    nome_funcionario: dados.nome_funcionario,
                    login: dados.login,
                    telefone: dados.telefone.replace(/\D/g, '')
                })
            });

            if (resposta.dados) {
                setDados((dadosAtuais) => ({
                    ...dadosAtuais,
                    ...resposta.dados,
                    telefone: resposta.dados.telefone
                        ? formatarTelefone(resposta.dados.telefone)
                        : dadosAtuais.telefone
                }));
            }

            setMensagem('Perfil atualizado com sucesso.');
        } catch (error) {
            setErro(error.message || 'Não foi possível salvar o perfil.');
        } finally {
            setSalvando(false);
        }
    }

    async function alterarSenha(e) {
        e.preventDefault();

        setErro('');
        setMensagem('');
        setTrocandoSenha(true);

        try {
            await apiRequest('/auth/senha', {
                method: 'PUT',
                body: JSON.stringify(senhaForm)
            });

            setSenhaForm({
                senha_atual: '',
                senha_nova: ''
            });

            setMensagem('Senha alterada com sucesso.');
        } catch (error) {
            setErro(error.message || 'Não foi possível alterar a senha.');
        } finally {
            setTrocandoSenha(false);
        }
    }

    return (
        <div className="perfil-page">
            <header className="perfil-header">
                <div className="perfil-brand">
                    <Link to="/home" className="brand-name">
                        TECHPARTS
                    </Link>

                    <span className="brand-divider" />
                    <span className="brand-panel">Perfil</span>
                </div>

                <nav className="perfil-header-actions">
                    <Link to="/home">Voltar ao sistema</Link>
                </nav>
            </header>

            <main className="perfil-main">
                <section className="perfil-identidade">
                    <div className="foto-botao">
                        <img
                            className="foto-perfil"
                            src={perfilIcon}
                            alt="Ícone de perfil"
                        />
                    </div>

                    <h1>
                        {dados?.nome_funcionario?.split(' ').slice(0, 2).join(' ') ||
                            (carregando ? 'Carregando...' : 'Perfil')}
                    </h1>

                    <p>{dados?.nome_role || ''}</p>
                </section>

                <div className="perfil-divisor" />

                <section className="perfil-formulario">
                    <h2>Informações Cadastrais</h2>
                    <div className="perfil-titulo-linha" />

                    {erro && (
                        <p className="perfil-feedback perfil-feedback-erro" role="alert">
                            {erro}
                        </p>
                    )}

                    {mensagem && (
                        <p className="perfil-feedback perfil-feedback-sucesso" role="status">
                            {mensagem}
                        </p>
                    )}

                    {carregando ? (
                        <p>Carregando perfil...</p>
                    ) : dados && (
                        <>
                            <form onSubmit={salvarAlteracoes}>
                                <div className="campo campo-completo">
                                    <label htmlFor="nome">NOME COMPLETO</label>

                                    <input
                                        id="nome"
                                        name="nome_funcionario"
                                        value={dados.nome_funcionario || ''}
                                        onChange={atualizarCampo}
                                        required
                                        className="campo-editavel"
                                    />
                                </div>

                                <div className="campos-duplos">
                                    <div className="campo">
                                        <label htmlFor="login">LOGIN</label>

                                        <input
                                            id="login"
                                            name="login"
                                            value={dados.login || ''}
                                            onChange={atualizarCampo}
                                            required
                                            className="campo-editavel"
                                        />
                                    </div>

                                    <div className="campo">
                                        <label htmlFor="telefone">TELEFONE</label>

                                        <input
                                            id="telefone"
                                            name="telefone"
                                            type="tel"
                                            inputMode="numeric"
                                            maxLength={15}
                                            value={dados.telefone || ''}
                                            onChange={atualizarCampo}
                                            className="campo-editavel"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="campos-duplos">
                                    <div className="campo">
                                        <label htmlFor="cpf">CPF</label>

                                        <input
                                            id="cpf"
                                            name="cpf"
                                            value={dados.cpf || ''}
                                            readOnly
                                            className="campo-bloqueado"
                                        />
                                    </div>

                                    <div className="campo">
                                        <label htmlFor="perfil-funcao">FUNÇÃO</label>

                                        <input
                                            id="perfil-funcao"
                                            value={dados.nome_role || ''}
                                            readOnly
                                            className="campo-bloqueado"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="salvar-perfil"
                                    disabled={salvando}
                                >
                                    {salvando ? 'Salvando...' : 'Salvar perfil'}
                                </button>
                            </form>

                            <section className="perfil-password">
                                <h2>Alterar senha</h2>
                                <div className="perfil-titulo-linha" />

                                <form onSubmit={alterarSenha}>
                                    <div className="campo">
                                        <label htmlFor="senha-atual">SENHA ATUAL</label>

                                        <input
                                            id="senha-atual"
                                            type="password"
                                            autoComplete="current-password"
                                            value={senhaForm.senha_atual}
                                            onChange={(event) =>
                                                setSenhaForm({
                                                    ...senhaForm,
                                                    senha_atual: event.target.value
                                                })
                                            }
                                            required
                                        />
                                    </div>

                                    <div className="campo">
                                        <label htmlFor="senha-nova">NOVA SENHA</label>

                                        <input
                                            id="senha-nova"
                                            type="password"
                                            autoComplete="new-password"
                                            minLength={8}
                                            value={senhaForm.senha_nova}
                                            onChange={(event) =>
                                                setSenhaForm({
                                                    ...senhaForm,
                                                    senha_nova: event.target.value
                                                })
                                            }
                                            required
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="salvar-perfil"
                                        disabled={trocandoSenha}
                                    >
                                        {trocandoSenha ? 'Alterando...' : 'Alterar senha'}
                                    </button>
                                </form>
                            </section>
                        </>
                    )}
                </section>
            </main>

            <footer className="perfil-footer">
                <span>© 2026 TECHPARTS ELETRÔNICOS</span>
            </footer>
        </div>
    );
}

export default Perfil;
