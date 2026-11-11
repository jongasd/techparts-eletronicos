import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../services/api";
import "./Clients.css";

function Clientes() {
  const navigate = useNavigate();
  const [tela, setTela] = useState("lista");
  const [clientes, setClientes] = useState([]);
  const [pesquisa, setPesquisa] = useState("");
  const [formulario, setFormulario] = useState({ nome_cliente: "", cpf: "", telefone: "", email: "" });
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let montado = true;

    apiRequest("/clientes")
      .then((resposta) => {
        if (montado) setClientes(resposta.dados || []);
      })
      .catch((error) => {
        if (!montado) return;
        setErro(error.message || "Não foi possível carregar os clientes.");
        if (error.message.includes("Token") || error.message.includes("Sessão")) {
          navigate("/");
        }
      })
      .finally(() => {
        if (montado) setCarregando(false);
      });

    return () => { montado = false; };
  }, [navigate]);

  const clientesFiltrados = useMemo(() => clientes.filter((cliente) =>
    cliente.nome_cliente.toLowerCase().includes(pesquisa.trim().toLowerCase())
  ), [clientes, pesquisa]);

  function atualizarCampo(e) {
    setFormulario((anterior) => ({ ...anterior, [e.target.name]: e.target.value }));
  }

  async function cadastrarCliente(e) {
    e.preventDefault();
    setErro("");
    setSalvando(true);

    try {
      const resposta = await apiRequest("/clientes", {
        method: "POST",
        body: JSON.stringify({
          nome_cliente: formulario.nome_cliente.trim(),
          cpf: formulario.cpf.trim(),
          telefone: formulario.telefone.trim(),
          email: formulario.email.trim(),
        }),
      });
      setClientes((anteriores) => [
        ...anteriores,
        { id_cliente: resposta.id, ...formulario, nome_cliente: formulario.nome_cliente.trim(), ativo: 1 },
      ]);
      setFormulario({ nome_cliente: "", cpf: "", telefone: "", email: "" });
      setPesquisa("");
      setTela("lista");
    } catch (error) {
      setErro(error.message || "Não foi possível cadastrar o cliente.");
    } finally {
      setSalvando(false);
    }
  }

  async function removerCliente(cliente) {
    if (!window.confirm(`Desativar o cliente ${cliente.nome_cliente}?`)) return;
    setErro("");
    try {
      await apiRequest(`/clientes/${cliente.id_cliente}`, { method: "DELETE" });
      setClientes((anteriores) => anteriores.filter(
        (item) => item.id_cliente !== cliente.id_cliente
      ));
    } catch (error) {
      setErro(error.message || "Não foi possível desativar o cliente.");
    }
  }

  return (
    <div className="clients-layout">
        <main className="clients-page">
          {tela === "lista" ? (
            <>
              {/* CABEÇALHO DA LISTAGEM */}
              <div className="clients-topo">
                <div className="clients-titulo">
                  <h1>CLIENTES</h1>
                  <div className="clients-linha-titulo"></div>
                </div>

                <div className="clients-botoes">
                  <button
                    type="button"
                    className="clients-btn-novo"
                    onClick={() => setTela("cadastro")}
                  >
                    <span>+</span> NOVO CLIENTE
                  </button>
                </div>
              </div>

              {/* FILTRO */}
              <div className="clients-filtro visivel" id="filtro-cliente">
                <input
                  type="text"
                  placeholder="Buscar cliente por nome..."
                  value={pesquisa}
                  onChange={(e) => setPesquisa(e.target.value)}
                />
              </div>

              {erro && <p className="clients-erro" role="alert">{erro}</p>}

              {/* CONTEÚDO PRINCIPAL */}
              <div className="clients-conteudo">
                {/* CARD PRINCIPAL */}
                <section className="clients-card-principal">
                  {carregando || clientesFiltrados.length === 0 ? (
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

                      <h2>{carregando ? "Carregando clientes..." : clientes.length ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}</h2>

                      {!carregando && !clientes.length && <p>Cadastre o primeiro cliente para começar.</p>}
                    </div>
                  ) : (
                    <div className="clients-lista">
                      {clientesFiltrados.map((cliente) => (
                        <div className="clients-item" key={cliente.id_cliente}>
                          <div className="clients-avatar">
                            {cliente.nome_cliente.charAt(0).toUpperCase()}
                          </div>

                          <div className="clients-info">
                            <h3>{cliente.nome_cliente}</h3>
                            <p>{cliente.email || `ID ${cliente.id_cliente}`}</p>
                            <span>{[cliente.telefone, cliente.cpf].filter(Boolean).join(" · ") || "Sem dados de contato"}</span>
                          </div>

                          <button
                            type="button"
                            className="clients-btn-excluir"
                            aria-label={`Desativar ${cliente.nome_cliente}`}
                            onClick={() => removerCliente(cliente)}
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
                      <strong>{clientes.filter((cliente) => Number(cliente.ativo) === 1).length}</strong>
                    </div>

                    <div className="clients-metrica">
                      <span>Resultados</span>
                      <strong>{clientesFiltrados.length}</strong>
                    </div>
                  </section>

                  {/* INSIGHTS TECH */}
                  <section className="clients-card-insights">
                    <div className="clients-insights-texto">
                      <span>BASE DE CLIENTES</span>
                      <p>{clientes.length} registros ativos no banco de dados.</p>
                    </div>
                  </section>
                </aside>
              </div>
            </>
          ) : (
            /* TELA DE CADASTRO */

            <div className="clients-cadastro">
              {/* TÍTULO */}
              <div className="clients-titulo">
                <h1>CLIENTES</h1>
                <div className="clients-linha-titulo"></div>
              </div>

              {/* ÁREA DO CADASTRO */}
              <div className="clients-cadastro-conteudo clients-cadastro-simples">
                {/* FORMULÁRIO */}
                <div className="clients-formulario-area">
                  <h2>Informações Cadastrais</h2>

                  <div className="clients-linha-formulario"></div>
                  {erro && <p className="clients-erro" role="alert">{erro}</p>}

                  <form onSubmit={cadastrarCliente}>
                    {/* NOME */}
                    <div className="clients-campo">
                      <label htmlFor="nome-cliente">NOME COMPLETO</label>

                      <input
                        id="nome-cliente"
                        type="text"
                        name="nome_cliente"
                        placeholder="Nome do cliente"
                        value={formulario.nome_cliente}
                        onChange={atualizarCampo}
                        required
                      />
                    </div>

                    <div className="clients-campos-duplos">
                      <div className="clients-campo">
                        <label htmlFor="cpf-cliente">CPF</label>
                        <input
                          id="cpf-cliente"
                          type="text"
                          name="cpf"
                          placeholder="000.000.000-00"
                          value={formulario.cpf}
                          onChange={atualizarCampo}
                        />
                      </div>
                      <div className="clients-campo">
                        <label htmlFor="telefone-cliente">TELEFONE</label>
                        <input
                          id="telefone-cliente"
                          type="tel"
                          name="telefone"
                          placeholder="(11) 99999-9999"
                          value={formulario.telefone}
                          onChange={atualizarCampo}
                        />
                      </div>
                    </div>

                    <div className="clients-campo">
                      <label htmlFor="email-cliente">E-MAIL</label>
                      <input
                        id="email-cliente"
                        type="email"
                        name="email"
                        placeholder="cliente@exemplo.com"
                        value={formulario.email}
                        onChange={atualizarCampo}
                      />
                    </div>

                    {/* BOTÃO CADASTRAR */}
                    <button type="submit" className="clients-btn-adicionar" disabled={salvando}>
                      {salvando ? "Salvando..." : "Adicionar Cliente"}
                    </button>
                  </form>
                </div>
              </div>

              {/* VOLTAR */}
              <button
                type="button"
                className="clients-voltar"
                onClick={() => setTela("lista")}
              >
                Voltar para clientes
              </button>
            </div>
          )}
        </main>
      </div>
  );
}

export default Clientes;
