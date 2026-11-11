
import './Perfil.css';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import perfilIcon from '../../assets/pfp-icon.png';
import notificacoesIcon from '../../assets/notification-icon.png';
import ajudaIcon from '../../assets/help-icon.png';


function formatarTelefone(valor) {
    const numeros = valor.replace(/\D/g, '').slice(0, 11);

    if (numeros.length === 0) return '';

    if (numeros.length <= 2) {
        return `(${numeros}`;
    }

    const ddd = numeros.slice(0, 2);
    const restante = numeros.slice(2);

    // Celular: (11) 98765-4321
    if (numeros.length > 10) {
        if (restante.length <= 5) {
            return `(${ddd}) ${restante}`;
        }

        return `(${ddd}) ${restante.slice(0, 5)}-${restante.slice(5)}`;
    }

    // Telefone fixo: (11) 2345-6789
    if (restante.length <= 4) {
        return `(${ddd}) ${restante}`;
    }

    return `(${ddd}) ${restante.slice(0, 4)}-${restante.slice(4)}`;
}

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

        const valorFinal =
            name === 'telefone'
                ? formatarTelefone(value)
                : value;

        setDados((dadosAtuais) => ({
            ...dadosAtuais,
            [name]: valorFinal,
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

        // Remove a formatação do telefone
        const telefoneSemFormatacao = dados.telefone.replace(/\D/g, '');

        try {
            // Requisição para atualizar os dados do usuário
            const resposta = await fetch(
                'http://localhost:3000/clientes/ID_DO_USUARIO',
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: dados.email,
                        telefone: telefoneSemFormatacao
                    })
                }
            );

            // Verifica se a requisição foi realizada corretamente
            if (!resposta.ok) {
                throw new Error('Não foi possível atualizar o perfil.');
            }

            // Converte a resposta da API para JSON
            const resultado = await resposta.json();

            console.log('Perfil atualizado:', resultado);

            alert('Perfil atualizado com sucesso!');

        } catch (error) {
            console.error('Erro:', error);

            alert(error.message);
        }
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
                                className="campo-bloqueado"
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
                                    value={dados.telefone}
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
                                    value={dados.cpf}
                                    readOnly
                                    className="campo-bloqueado"
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
                                    className="campo-bloqueado"
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