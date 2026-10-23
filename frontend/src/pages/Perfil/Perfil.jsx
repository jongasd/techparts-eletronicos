
import './Perfil.css';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import perfilIcon from '../../assets/pfp-icon.png';
import notificacoesIcon from '../../assets/notification-icon.png';
import configuracoesIcon from '../../assets/config-icon.png';
import ajudaIcon from '../../assets/help-icon.png';

function Perfil() {
    const navigate = useNavigate();
    const inputFoto = useRef(null);

    const [foto, setFoto] = useState(null);

    // Dados ilustrativos: depois, carregue-os da API.
    const [dados, setDados] = useState({
        nome: 'João Silva de Oliveira',
        email: 'joao.silva@techparts.com',
        telefone: '(11) 98765-4321',
        cpf: '123.456.789-00',
        funcao: 'Administrador de Infraestrutura',
    });

    function atualizarCampo(e) {
        const { name, value } = e.target;

        setDados((dadosAtuais) => ({
            ...dadosAtuais,
            [name]: value,
        }));
    }

    function selecionarFoto(e) {
        const arquivo = e.target.files?.[0];

        if (!arquivo) return;

        if (!arquivo.type.startsWith('image/')) {
            alert('Selecione um arquivo de imagem.');
            e.target.value = '';
            return;
        }

        setFoto(URL.createObjectURL(arquivo));
    }

    function removerFoto() {
        setFoto(null);

        if (inputFoto.current) {
            inputFoto.current.value = '';
        }
    }

    async function salvarAlteracoes(e) {
        e.preventDefault();

        // Aqui você enviará email e telefone para a API.
        // A foto também precisará ser enviada ao servidor
        // para continuar disponível após recarregar a página.

        console.log('Dados editáveis:', {
            email: dados.email,
            telefone: dados.telefone,
        });

        alert('Exemplo visual: conecte esta ação à sua API.');
    }

    return (
        <div className="perfil-page">

            <header className="perfil-header">
                <div className="perfil-brand">
                    <span className="brand-name" onClick={() => navigate('/home')}>TECHPARTS</span>
                    <span className="brand-divider" />
                    <span className="brand-panel">AdminPanel</span>
                </div>

                <nav className="perfil-header-actions">
                    <button type="button" aria-label="Notificações">
                        <img src={notificacoesIcon} alt="" />
                    </button>

                    <button type="button" aria-label="Configurações">
                        <img src={configuracoesIcon} alt="" />
                    </button>

                    <button type="button" aria-label="Ajuda">
                        <img src={ajudaIcon} alt="" />
                    </button>
                </nav>
            </header>

            <main className="perfil-main">

                <section className="perfil-identidade">
                    <button
                        type="button"
                        className="foto-botao"
                        onClick={() => inputFoto.current?.click()}
                        aria-label="Escolher foto de perfil"
                    >
                        <img
                            className="foto-perfil"
                            src={foto || perfilIcon}
                            alt="Foto de perfil"
                        />
                    </button>

                    <input
                        ref={inputFoto}
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={selecionarFoto}
                    />

                    <h1>{dados.nome.split(' ').slice(0, 2).join(' ')}</h1>

                    <p>{dados.funcao}</p>

                    {foto && (
                        <button
                            type="button"
                            className="remover-foto"
                            onClick={removerFoto}
                        >
                            Excluir foto de perfil
                        </button>
                    )}
                </section>

                <div className="perfil-divisor" />

                <section className="perfil-formulario">
                    <h2>Informações Cadastrais</h2>
                    <div className="perfil-titulo-linha" />

                    <form onSubmit={salvarAlteracoes}>
                        <div className="campo campo-completo">
                            <label htmlFor="nome">NOME COMPLETO</label>
                            <input
                                id="nome"
                                name="nome"
                                value={dados.nome}
                                readOnly
                            />
                        </div>

                        <div className="campos-duplos">
                            <div className="campo">
                                <label htmlFor="email">E-MAIL</label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={dados.email}
                                    onChange={atualizarCampo}
                                    required
                                />
                            </div>

                            <div className="campo">
                                <label htmlFor="telefone">TELEFONE</label>
                                <input
                                    id="telefone"
                                    name="telefone"
                                    type="tel"
                                    value={dados.telefone}
                                    onChange={atualizarCampo}
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
                                    value={dados.cpf}
                                    readOnly
                                />
                            </div>

                            <div className="campo">
                                <label htmlFor="funcao">FUNÇÃO</label>
                                <textarea
                                    id="funcao"
                                    name="funcao"
                                    value={dados.funcao}
                                    readOnly
                                    rows={2}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="salvar-perfil"
                        >
                            Salvar Alterações
                        </button>
                    </form>
                </section>
            </main>

            <footer className="perfil-footer">
                <span>© 2026 Corporate Precision Systems</span>

                <nav>
                    <a href="#privacidade">Privacy Policy</a>
                    <a href="#termos">Terms of Service</a>
                    <a href="#suporte">Contact Support</a>
                </nav>
            </footer>
        </div>
    );
}

export default Perfil;