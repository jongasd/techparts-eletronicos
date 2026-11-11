
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, resolveApiUrl } from "../../services/api";
import "./Products.css";

function Products() {
    const navigate = useNavigate();
    const [produtos, setProdutos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState("");

    // Estados dos filtros
    const [pesquisa, setPesquisa] = useState("");
    const [categoriaSelecionada, setCategoriaSelecionada] = useState("Todas");
    // Estado do formulário de cadastro
    const [modalAberto, setModalAberto] = useState(false);
    const [produtoEditando, setProdutoEditando] = useState(null);
    const [arquivoImagem, setArquivoImagem] = useState(null);
    const [imagemPreview, setImagemPreview] = useState("");
    const arquivoImagemRef = useRef(null);

    const [novoProduto, setNovoProduto] = useState({
        nome_produto: "",
        localizacao: "",
        id_categoria: "",
        preco: "",
        quantidade_estoque: "0",
        quantidade_minima: "0"
    });

    useEffect(() => {
        let montado = true;

        async function carregar() {
            try {
                const [respostaProdutos, respostaCategorias] = await Promise.all([
                    apiRequest("/produtos"),
                    apiRequest("/categorias")
                ]);

                if (!montado) return;

                const categoriasApi = respostaCategorias.dados || [];
                setCategorias(categoriasApi);
                setProdutos((respostaProdutos.dados || []).map((produto) => ({
                    ...produto,
                    nome: produto.nome_produto,
                    descricao: produto.localizacao || "",
                    categoria: categoriasApi.find(
                        (categoria) => Number(categoria.id_categoria) === Number(produto.id_categoria)
                    )?.nome || "Sem categoria",
                    preco: Number(produto.preco),
                    estoque: Number(produto.quantidade_estoque),
                    status: Number(produto.ativo) === 1 ? "Ativo" : "Inativo",
                    imagem: resolveApiUrl(produto.imagem_url)
                })));
            } catch (error) {
                if (!montado) return;
                setErro(error.message || "Não foi possível carregar os produtos.");
                if (error.message.includes("Token") || error.message.includes("Sessão")) {
                    navigate("/");
                }
            } finally {
                if (montado) setCarregando(false);
            }
        }

        carregar();
        return () => { montado = false; };
    }, [navigate]);

    // Filtra os produtos conforme os campos selecionados
    const produtosFiltrados = useMemo(() => {

        return produtos.filter((produto) => {

            const correspondePesquisa = produto.nome
                .toLowerCase()
                .includes(pesquisa.toLowerCase());

            const correspondeCategoria =
                categoriaSelecionada === "Todas" ||
                produto.categoria === categoriaSelecionada;

            return correspondePesquisa && correspondeCategoria;
        });

    }, [produtos, pesquisa, categoriaSelecionada]);

    // Atualiza os campos do formulário
    function atualizarCampo(e) {
        const { name, value } = e.target;

        setNovoProduto((anterior) => ({
            ...anterior,
            [name]: value
        }));
    }

    // Seleciona e carrega a imagem do produto
    function selecionarImagem(e) {
        const arquivo = e.target.files[0];

        if (!arquivo) return;

        const formatosPermitidos = [
            "image/png",
            "image/jpeg",
            "image/webp"
        ];

        if (!formatosPermitidos.includes(arquivo.type)) {
            alert("Selecione uma imagem PNG, JPG ou WEBP.");
            e.target.value = "";
            return;
        }

        // Limite de 5 MB
        if (arquivo.size > 5 * 1024 * 1024) {
            alert("A imagem deve ter no máximo 5 MB.");
            e.target.value = "";
            return;
        }

        setArquivoImagem(arquivo);
        const leitor = new FileReader();

        leitor.onload = () => {
            setImagemPreview(leitor.result);
        };

        leitor.readAsDataURL(arquivo);
    }

    // Cadastra ou atualiza um produto
    async function salvarProduto(e) {
        e.preventDefault();

        if (
            !novoProduto.nome_produto.trim() ||
            !novoProduto.id_categoria ||
            novoProduto.preco === "" ||
            novoProduto.quantidade_estoque === "" ||
            novoProduto.quantidade_minima === ""
        ) {
            alert("Preencha todos os campos obrigatórios.");
            return;
        }

        setErro("");
        setSalvando(true);
        const dados = new FormData();
        Object.entries(novoProduto).forEach(([campo, valor]) => dados.append(campo, valor));
        if (arquivoImagem) dados.append("imagem", arquivoImagem);

        try {
            const caminho = produtoEditando
                ? `/produtos/${produtoEditando.id_produto}`
                : "/produtos";
            await apiRequest(caminho, {
                method: produtoEditando ? "PUT" : "POST",
                body: dados
            });

            const resposta = await apiRequest("/produtos");
            setProdutos((resposta.dados || []).map((produto) => ({
                ...produto,
                nome: produto.nome_produto,
                descricao: produto.localizacao || "",
                categoria: categorias.find(
                    (categoria) => Number(categoria.id_categoria) === Number(produto.id_categoria)
                )?.nome || "Sem categoria",
                preco: Number(produto.preco),
                estoque: Number(produto.quantidade_estoque),
                status: Number(produto.ativo) === 1 ? "Ativo" : "Inativo",
                imagem: resolveApiUrl(produto.imagem_url)
            })));
            limparFormulario();
        } catch (error) {
            setErro(error.message || "Não foi possível salvar o produto.");
        } finally {
            setSalvando(false);
        }
    }

    function limparFormulario() {
        setNovoProduto({
            nome_produto: "",
            localizacao: "",
            id_categoria: "",
            preco: "",
            quantidade_estoque: "0",
            quantidade_minima: "0"
        });
        setProdutoEditando(null);
        setArquivoImagem(null);
        setImagemPreview("");
        if (arquivoImagemRef.current) arquivoImagemRef.current.value = "";
        setModalAberto(false);
    }

    function editarProduto(produto) {
        setProdutoEditando(produto);
        setNovoProduto({
            nome_produto: produto.nome_produto,
            localizacao: produto.localizacao || "",
            id_categoria: String(produto.id_categoria),
            preco: String(produto.preco),
            quantidade_estoque: String(produto.quantidade_estoque),
            quantidade_minima: String(produto.quantidade_minima)
        });
        setImagemPreview(resolveApiUrl(produto.imagem_url));
        setArquivoImagem(null);
        setModalAberto(true);
    }

    async function desativarProduto(produto) {
        if (!window.confirm(`Desativar o produto ${produto.nome_produto}?`)) return;

        setErro("");
        try {
            await apiRequest(`/produtos/${produto.id_produto}/desativar`, { method: "PUT" });
            setProdutos((anteriores) => anteriores.filter(
                (item) => item.id_produto !== produto.id_produto
            ));
        } catch (error) {
            setErro(error.message || "Não foi possível desativar o produto.");
        }
    }

    async function removerImagem() {
        if (arquivoImagem) {
            setArquivoImagem(null);
            setImagemPreview(produtoEditando ? resolveApiUrl(produtoEditando.imagem_url) : "");
            if (arquivoImagemRef.current) arquivoImagemRef.current.value = "";
            return;
        }

        if (!produtoEditando || !produtoEditando.imagem_url) return;
        try {
            await apiRequest(`/produtos/${produtoEditando.id_produto}/imagem`, { method: "DELETE" });
            setImagemPreview("");
            setProdutoEditando({ ...produtoEditando, imagem_url: null });
            setProdutos((anteriores) => anteriores.map((produto) =>
                produto.id_produto === produtoEditando.id_produto
                    ? { ...produto, imagem_url: null, imagem: "" }
                    : produto
            ));
        } catch (error) {
            setErro(error.message || "Não foi possível remover a imagem.");
        }
    }

    // Exporta os produtos filtrados para CSV
    function exportarProdutos() {

        const cabecalho = [
            "Nome",
            "Localização",
            "ID",
            "Categoria",
            "Preço",
            "Estoque",
            "Status"
        ];

        const linhas = produtosFiltrados.map((produto) => [
            produto.nome,
            produto.descricao,
            produto.id_produto,
            produto.categoria,
            produto.preco.toFixed(2).replace(".", ","),
            produto.estoque,
            produto.status
        ]);

        const conteudo = [cabecalho, ...linhas]
            .map((linha) =>
                linha.map((campo) =>
                    `"${String(campo).replace(/"/g, '""')}"`
                ).join(";")
            )
            .join("\n");

        const arquivo = new Blob(
            ["\uFEFF" + conteudo],
            { type: "text/csv;charset=utf-8;" }
        );

        const url = URL.createObjectURL(arquivo);
        const link = document.createElement("a");

        link.href = url;
        link.download = "relatorio-produtos.csv";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    }

    return (
        <div className="products-page">
            {erro && <div className="products-erro" role="alert">{erro}</div>}

            {/* CABEÇALHO DA PÁGINA */}
            <div className="products-topo">

                <h1>PRODUTOS</h1>

                <div className="products-acoes">

                    <button
                        className="products-btn-exportar"
                        onClick={exportarProdutos}
                    >
                        EXPORTAR
                    </button>

                    <button
                        className="products-btn-novo"
                        onClick={() => {
                            setProdutoEditando(null);
                            setNovoProduto({ nome_produto: "", localizacao: "", id_categoria: "", preco: "", quantidade_estoque: "0", quantidade_minima: "0" });
                            setArquivoImagem(null);
                            setImagemPreview("");
                            setModalAberto(true);
                        }}
                    >
                        + NOVO PRODUTO
                    </button>

                </div>

            </div>

            {/* ÁREA DE PESQUISA E FILTROS */}
            <div className="products-filtros">

                <input
                    type="text"
                    className="products-pesquisa"
                    placeholder="Pesquisar produto pelo nome..."
                    value={pesquisa}
                    onChange={(e) => setPesquisa(e.target.value)}
                />

                <select
                    className="products-categoria"
                    value={categoriaSelecionada}
                    onChange={(e) =>
                        setCategoriaSelecionada(e.target.value)
                    }
                >
                    <option value="Todas">Todas as categorias</option>

                    {categorias.map((categoria) => (
                        <option key={categoria.id_categoria} value={categoria.nome}>
                            {categoria.nome}
                        </option>
                    ))}

                </select>

            </div>

            {/* TABELA DE PRODUTOS */}
            <div className="products-tabela-container">

                <table className="products-tabela">

                    <thead>
                        <tr>
                            <th>PRODUTO</th>
                            <th>ID</th>
                            <th>CATEGORIA</th>
                            <th>PREÇO</th>
                            <th>ESTOQUE</th>
                            <th>STATUS</th>
                            <th>AÇÕES</th>
                        </tr>
                    </thead>

                    <tbody>

                        {carregando ? (
                            <tr>
                                <td colSpan="7" className="products-sem-resultados">Carregando produtos...</td>
                            </tr>
                        ) : produtosFiltrados.length > 0 ? (

                            produtosFiltrados.map((produto) => (

                                <tr key={produto.id}>

                                    <td>
                                        <div className="products-info">

                                            {produto.imagem && (
                                                <img
                                                    src={produto.imagem}
                                                    alt={produto.nome}
                                                    className="products-imagem-tabela"
                                                />
                                            )}

                                            <div>
                                                <strong>{produto.nome}</strong>
                                                <span>{produto.descricao}</span>
                                            </div>

                                        </div>
                                    </td>

                                    <td>{produto.id_produto}</td>

                                    <td>{produto.categoria}</td>

                                    <td>
                                        {produto.preco.toLocaleString("pt-BR", {
                                            style: "currency",
                                            currency: "BRL"
                                        })}
                                    </td>

                                    <td>{produto.estoque} un</td>

                                    <td>
                                        <span
                                            className={`products-status ${
                                                produto.status === "Ativo"
                                                    ? "status-ativo"
                                                    : "status-inativo"
                                            }`}
                                        >
                                            {produto.status}
                                        </span>
                                    </td>

                                    <td>
                                        <div className="products-item-actions">
                                            <button type="button" onClick={() => editarProduto(produto)}>Editar</button>
                                            <button type="button" onClick={() => desativarProduto(produto)}>Desativar</button>
                                        </div>
                                    </td>

                                </tr>

                            ))

                        ) : (

                            <tr>
                                <td colSpan="7" className="products-sem-resultados">
                                    Nenhum produto encontrado.
                                </td>
                            </tr>

                        )}

                    </tbody>

                </table>

            </div>

            {/* MODAL DE NOVO PRODUTO */}
            {modalAberto && (

                <div
                    className="products-modal-overlay"
                    onClick={() => setModalAberto(false)}
                >

                    <div
                        className="products-modal"
                        onClick={(e) => e.stopPropagation()}
                    >

                        <div className="products-modal-cabecalho">

                            <h2>{produtoEditando ? "EDITAR PRODUTO" : "NOVO PRODUTO"}</h2>

                            <button
                                type="button"
                                onClick={limparFormulario}
                            >
                                ×
                            </button>

                        </div>

                        {erro && <p className="text-danger" role="alert">{erro}</p>}

                        <form onSubmit={salvarProduto}>

                            <label>Nome do produto *</label>

                            <input
                                type="text"
                                name="nome_produto"
                                value={novoProduto.nome_produto}
                                onChange={atualizarCampo}
                                placeholder="Digite o nome do produto"
                                required
                            />

                            <label>Descrição</label>

                            <input
                                type="text"
                                name="localizacao"
                                value={novoProduto.localizacao}
                                onChange={atualizarCampo}
                                placeholder="Ex.: corredor A, prateleira 2"
                            />

                            <label>Imagem do produto</label>

                            <input
                                type="file"
                                accept="image/png, image/jpeg, image/webp"
                                onChange={selecionarImagem}
                                ref={arquivoImagemRef}
                            />

                            {imagemPreview && (
                                <div className="products-preview-container">

                                    <img
                                        src={imagemPreview}
                                        alt="Prévia do produto"
                                        className="products-preview"
                                    />

                                    <button
                                        type="button"
                                        className="products-remover-imagem"
                                        onClick={removerImagem}
                                    >
                                        Remover imagem
                                    </button>

                                </div>
                            )}

                            <label>Categoria *</label>

                            <select
                                name="id_categoria"
                                value={novoProduto.id_categoria}
                                onChange={atualizarCampo}
                                required
                            >
                                <option value="">Selecione uma categoria</option>

                                {categorias.map((categoria) => (
                                    <option key={categoria.id_categoria} value={categoria.id_categoria}>
                                        {categoria.nome}
                                    </option>
                                ))}

                            </select>

                            <label>Preço (R$) *</label>

                            <input
                                type="number"
                                name="preco"
                                value={novoProduto.preco}
                                onChange={atualizarCampo}
                                min="0"
                                step="0.01"
                                placeholder="0,00"
                                required
                            />

                            <label>Quantidade em estoque *</label>

                            <input
                                type="number"
                                name="quantidade_estoque"
                                value={novoProduto.quantidade_estoque}
                                onChange={atualizarCampo}
                                min="0"
                                step="1"
                                placeholder="0"
                                required
                            />

                            <label>Estoque mínimo *</label>

                            <input
                                type="number"
                                name="quantidade_minima"
                                value={novoProduto.quantidade_minima}
                                onChange={atualizarCampo}
                                min="0"
                                step="1"
                                required
                            />

                            <div className="products-modal-acoes">

                                <button
                                    type="button"
                                    onClick={limparFormulario}
                                >
                                    CANCELAR
                                </button>

                                <button type="submit" disabled={salvando}>
                                    {salvando ? "SALVANDO..." : produtoEditando ? "SALVAR ALTERAÇÕES" : "CADASTRAR PRODUTO"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </div>
    );
}

export default Products;
