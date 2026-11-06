
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Header from '../../components/Header';
import Footer from '../../components/Footer';

import './Clients.css';

function Clients() {

    const navigate = useNavigate();

    // Controla qual tela será exibida
    const [tela, setTela] = useState('lista');

    // Armazena os clientes cadastrados
    const [clientes, setClientes] = useState([]);

    // Armazena os dados do formulário
    const [formulario, setFormulario] = useState({
        nome: '',
        cpf: '',
        telefone: '',
        email: ''
    });

    // Armazena as tags selecionadas
    const [tagsSelecionadas, setTagsSelecionadas] = useState([]);

    const tags = [
        'Vendas',
        'Engenharia',
        'Suporte',
        'Logística',
        'Administração'
    ];

    // Atualiza os campos do formulário
    function atualizarCampo(e) {
        const { name, value } = e.target;

        setFormulario({
            ...formulario,
            [name]: value
        });
    }

    // Seleciona ou remove uma tag
    function selecionarTag(tag) {
        if (tagsSelecionadas.includes(tag)) {
            setTagsSelecionadas(
                tagsSelecionadas.filter((item) => item !== tag)
            );
        } else {
            setTagsSelecionadas([...tagsSelecionadas, tag]);
        }
    }

    // Cadastra um cliente
    function cadastrarCliente(e) {
        e.preventDefault();

        const novoCliente = {
            id: Date.now(),
            ...formulario,
            tags: tagsSelecionadas
        };

        setClientes([...clientes, novoCliente]);

        setFormulario({
            nome: '',
            cpf: '',
            telefone: '',
            email: ''
        });

        setTagsSelecionadas([]);

        setTela('lista');
    }

    // Remove um cliente
    function removerCliente(id) {
        setClientes(clientes.filter((cliente) => cliente.id !== id));
    }

    return (
        <div className="clients-layout">

            {/* HEADER */}
            <Header />

            {/* CONTEÚDO DAS PÁGINAS */}
            <main className="clients-page">

                {tela === 'lista' ? (

                    <>
                        {/* CABEÇALHO DA LISTAGEM */}
                        <div className="clients-topo">

                            <div className="clients-titulo">
                                <h1>CLIENTES</h1>
                                <div className="clients-linha-titulo"></div>
                            </div>

                            <div className="clients-botoes">

                                <button
                                    className="clients-btn-filtrar"
                                    onClick={() => {
                                        const campo = document.getElementById('filtro-cliente');
                                        campo.classList.toggle('visivel');
                                    }}
                                >
                                    <span>☰</span> FILTRAR
                                </button>

                                <button
                                    className="clients-btn-novo"
                                    onClick={() => setTela('cadastro')}
                                >
                                    <span>+</span> NOVO CLIENTE
                                </button>

                            </div>
                        </div>

                        {/* FILTRO */}
                        <div className="clients-filtro" id="filtro-cliente">
                            <input
                                type="text"
                                placeholder="Buscar cliente por nome..."
                                onChange={(e) => {
                                    const valor = e.target.value.toLowerCase();

                                    document.querySelectorAll('.clients-item').forEach((item) => {
                                        item.style.display = item.textContent.toLowerCase().includes(valor)
                                            ? 'flex'
                                            : 'none';
                                    });
                                }}
                            />
                        </div>

                        {/* CONTEÚDO PRINCIPAL */}
                        <div className="clients-conteudo">

                            {/* CARD PRINCIPAL */}
                            <section className="clients-card-principal">

                                {clientes.length === 0 ? (

                                    <div className="clients-estado-vazio">

                                        <div className="clients-icone-vazio">
                                            <svg
                                                width="40"
                                                height="40"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                                <circle cx="9" cy="7" r="4" />
                                                <path d="M19 8v6m3-3h-6" />
                                            </svg>
                                        </div>

                                        <h2>Base de Clientes Vazia</h2>

                                        <p>
                                            Inicie sua gestão corporativa adicionando novos
                                            clientes ao sistema TECHPARTS ou importando
                                            planilhas externas.
                                        </p>

                                    </div>

                                ) : (

                                    <div className="clients-lista">

                                        {clientes.map((cliente) => (

                                            <div className="clients-item" key={cliente.id}>

                                                <div className="clients-avatar">
                                                    {cliente.nome.charAt(0).toUpperCase()}
                                                </div>

                                                <div className="clients-info">
                                                    <h3>{cliente.nome}</h3>
                                                    <p>{cliente.email}</p>
                                                    <span>{cliente.telefone}</span>
                                                </div>

                                                <button
                                                    className="clients-btn-excluir"
                                                    onClick={() => removerCliente(cliente.id)}
                                                >
                                                    ×
                                                </button>

                                            </div>

                                        ))}

                                    </div>

                                )}

                            </section>

                            {/* COLUNA LATERAL */}
                            <aside className="clients-lateral">

                                {/* MÉTRICAS */}
                                <section className="clients-card-metricas">

                                    <h2>MÉTRICAS RÁPIDAS</h2>

                                    <div className="clients-metrica">
                                        <span>Total Ativos</span>
                                        <strong>{clientes.length}</strong>
                                    </div>

                                    <div className="clients-metrica">
                                        <span>Novos (Mês)</span>
                                        <strong>
                                            {clientes.filter((cliente) => {
                                                const data = new Date(Number(cliente.id));
                                                const hoje = new Date();

                                                return data.getMonth() === hoje.getMonth() &&
                                                    data.getFullYear() === hoje.getFullYear();
                                            }).length}
                                        </strong>
                                    </div>

                                    <div className="clients-metrica">
                                        <span>Inadimplência</span>
                                        <strong className="clients-inadimplencia">0%</strong>
                                    </div>

                                </section>

                                {/* INSIGHTS TECH */}
                                <section className="clients-card-insights">

                                    <div className="clients-grafico">
                                        <svg viewBox="0 0 180 100" width="180">
                                            <rect
                                                x="2" y="2"
                                                width="176" height="96"
                                                rx="12"
                                                fill="none"
                                                stroke="rgba(255,255,255,0.3)"
                                            />

                                            {[20, 30, 40, 55, 65, 75, 90, 100].map((altura, index) => (
                                                <rect
                                                    key={index}
                                                    x={18 + index * 18}
                                                    y={85 - altura * 0.7}
                                                    width="8"
                                                    height={altura * 0.7}
                                                    fill="rgba(255,255,255,0.5)"
                                                    rx="2"
                                                />
                                            ))}
                                        </svg>
                                    </div>

                                    <div className="clients-insights-texto">
                                        <span>INSIGHTS TECH</span>
                                        <p>
                                            Potencialize suas vendas
                                            <br />
                                            com análise de dados.
                                        </p>
                                    </div>

                                </section>

                            </aside>

                        </div>
                    </>

                ) : (

                    /* =================================
                       TELA DE CADASTRO DE CLIENTE
                    ================================= */

                    <div className="clients-cadastro">

                        {/* TÍTULO */}
                        <div className="clients-titulo">
                            <h1>CLIENTES</h1>
                            <div className="clients-linha-titulo"></div>
                        </div>

                        {/* ÁREA DO FORMULÁRIO */}
                        <div className="clients-cadastro-conteudo">

                            {/* IMAGEM DO CLIENTE */}
                            <div className="clients-imagem-area">

                                <div className="clients-avatar-grande">

                                    <svg
                                        viewBox="0 0 180 180"
                                        width="180"
                                        height="180"
                                    >
                                        <circle cx="90" cy="90" r="88" fill="#999999" />
                                        <circle cx="90" cy="68" r="31" fill="#f1f1f1" />
                                        <path
                                            d="M30 160 Q45 115 90 115 Q135 115 150 160"
                                            fill="#f1f1f1"
                                        />
                                    </svg>

                                    <div className="clients-icone-adicionar">
                                        +
                                    </div>

                                </div>

                                <span>Adicionar Imagem</span>

                            </div>

                            {/* FORMULÁRIO */}
                            <div className="clients-formulario-area">

                                <h2>Informações Cadastrais</h2>

                                <div className="clients-linha-formulario"></div>

                                <form onSubmit={cadastrarCliente}>

                                    {/* NOME */}
                                    <div className="clients-campo">
                                        <label>NOME COMPLETO</label>

                                        <input
                                            type="text"
                                            name="nome"
                                            placeholder="Nome completo"
                                            value={formulario.nome}
                                            onChange={atualizarCampo}
                                            required
                                        />
                                    </div>

                                    {/* CPF E TELEFONE */}
                                    <div className="clients-campos-duplos">

                                        <div className="clients-campo">
                                            <label>CPF</label>

                                            <input
                                                type="text"
                                                name="cpf"
                                                placeholder="999.999.999-99"
                                                value={formulario.cpf}
                                                onChange={atualizarCampo}
                                                required
                                            />
                                        </div>

                                        <div className="clients-campo">
                                            <label>TELEFONE</label>

                                            <input
                                                type="tel"
                                                name="telefone"
                                                placeholder="(11) 99999-9999"
                                                value={formulario.telefone}
                                                onChange={atualizarCampo}
                                                required
                                            />
                                        </div>

                                    </div>

                                    {/* EMAIL */}
                                    <div className="clients-campo">
                                        <label>E-MAIL</label>

                                        <input
                                            type="email"
                                            name="email"
                                            placeholder="E-mail"
                                            value={formulario.email}
                                            onChange={atualizarCampo}
                                            required
                                        />
                                    </div>

                                    {/* BOTÃO CADASTRAR */}
                                    <button
                                        type="submit"
                                        className="clients-btn-adicionar"
                                    >
                                        Adicionar Cliente
                                    </button>

                                </form>

                            </div>

                        </div>

                        {/* TAGS RÁPIDAS */}
                        <div className="clients-tags-area">

                            <strong>TAGS RÁPIDAS:</strong>

                            <div className="clients-tags">

                                {tags.map((tag) => (

                                    <button
                                        key={tag}
                                        type="button"
                                        className={`clients-tag ${
                                            tagsSelecionadas.includes(tag) ? 'selecionada' : ''
                                        }`}
                                        onClick={() => selecionarTag(tag)}
                                    >
                                        {tag}
                                    </button>

                                ))}

                            </div>

                        </div>

                        {/* VOLTAR */}
                        <button
                            type="button"
                            className="clients-voltar"
                            onClick={() => setTela('lista')}
                        >
                            Voltar para clientes
                        </button>

                    </div>

                )}

            </main>

            {/* FOOTER */}
            <Footer />

        </div>
    );
}

export default Clients;
