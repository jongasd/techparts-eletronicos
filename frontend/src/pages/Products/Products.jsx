
import { useMemo, useState } from "react";
import "./Products.css";

function Products() {

    // Produtos fictícios para testar a página
    const [produtos, setProdutos] = useState([
        {
            id: 1,
            nome: "Processador Core i9 14th Gen",
            descricao: "Intel Precision Series",
            sku: "PRC-INT-14900K",
            categoria: "Placas",
            preco: 3890.00,
            estoque: 42,
            status: "Ativo",
            imagem: ""
        },
        {
            id: 2,
            nome: 'Monitor Ultrawide 34" QHD',
            descricao: "Precision Visuais",
            sku: "MON-VIS-34QHD",
            categoria: "Periféricos",
            preco: 2450.00,
            estoque: 8,
            status: "Ativo",
            imagem: ""
        },
        {
            id: 3,
            nome: "SSD NVMe Gen5 2TB",
            descricao: "Extreme Storage Pro",
            sku: "STO-XTR-02TB",
            categoria: "Armazenamento",
            preco: 1150.00,
            estoque: 124,
            status: "Inativo",
            imagem: ""
        }
    ]);

    // Estados dos filtros
    const [pesquisa, setPesquisa] = useState("");
    const [categoriaSelecionada, setCategoriaSelecionada] = useState("Todas");
    const [statusSelecionado, setStatusSelecionado] = useState("Todos");

    // Estado do formulário de cadastro
    const [modalAberto, setModalAberto] = useState(false);

    const [novoProduto, setNovoProduto] = useState({
        nome: "",
        descricao: "",
        sku: "",
        categoria: "",
        preco: "",
        estoque: "",
        status: "Ativo",
        imagem: ""
    });

    // Categorias disponíveis
    const categorias = [
        "Placas",
        "Periféricos",
        "Armazenamento",
        "Processadores",
        "Memórias",
        "Acessórios"
    ];

    // Filtra os produtos conforme os campos selecionados
    const produtosFiltrados = useMemo(() => {

        return produtos.filter((produto) => {

            const correspondePesquisa = produto.nome
                .toLowerCase()
                .includes(pesquisa.toLowerCase());

            const correspondeCategoria =
                categoriaSelecionada === "Todas" ||
                produto.categoria === categoriaSelecionada;

            const correspondeStatus =
                statusSelecionado === "Todos" ||
                produto.status === statusSelecionado;

            return (
                correspondePesquisa &&
                correspondeCategoria &&
                correspondeStatus
            );
        });

    }, [produtos, pesquisa, categoriaSelecionada, statusSelecionado]);

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

        const leitor = new FileReader();

        leitor.onload = () => {
            setNovoProduto((anterior) => ({
                ...anterior,
                imagem: leitor.result
            }));
        };

        leitor.readAsDataURL(arquivo);
    }

    // Cadastra um novo produto
    function cadastrarProduto(e) {
        e.preventDefault();

        if (
            !novoProduto.nome.trim() ||
            !novoProduto.sku.trim() ||
            !novoProduto.categoria ||
            novoProduto.preco === "" ||
            novoProduto.estoque === ""
        ) {
            alert("Preencha todos os campos obrigatórios.");
            return;
        }

        const produto = {
            ...novoProduto,
            id: Date.now(),
            preco: Number(novoProduto.preco),
            estoque: Number(novoProduto.estoque)
        };

        setProdutos((anterior) => [...anterior, produto]);

        // Limpa o formulário
        setNovoProduto({
            nome: "",
            descricao: "",
            sku: "",
            categoria: "",
            preco: "",
            estoque: "",
            status: "Ativo",
            imagem: ""
        });

        setModalAberto(false);
    }

    // Exporta os produtos filtrados para CSV
    function exportarProdutos() {

        const cabecalho = [
            "Nome",
            "Descrição",
            "SKU",
            "Categoria",
            "Preço",
            "Estoque",
            "Status"
        ];

        const linhas = produtosFiltrados.map((produto) => [
            produto.nome,
            produto.descricao,
            produto.sku,
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
                        onClick={() => setModalAberto(true)}
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
                        <option key={categoria} value={categoria}>
                            {categoria}
                        </option>
                    ))}

                </select>

            </div>

            {/* FILTRO POR STATUS */}
            <div className="products-status-filtros">

                <button
                    className={statusSelecionado === "Todos" ? "selecionado" : ""}
                    onClick={() => setStatusSelecionado("Todos")}
                >
                    Todos
                </button>

                <button
                    className={statusSelecionado === "Ativo" ? "selecionado" : ""}
                    onClick={() => setStatusSelecionado("Ativo")}
                >
                    Ativos
                </button>

                <button
                    className={statusSelecionado === "Inativo" ? "selecionado" : ""}
                    onClick={() => setStatusSelecionado("Inativo")}
                >
                    Inativos
                </button>

            </div>

            {/* TABELA DE PRODUTOS */}
            <div className="products-tabela-container">

                <table className="products-tabela">

                    <thead>
                        <tr>
                            <th>PRODUTO</th>
                            <th>SKU</th>
                            <th>CATEGORIA</th>
                            <th>PREÇO</th>
                            <th>ESTOQUE</th>
                            <th>STATUS</th>
                            <th>AÇÕES</th>
                        </tr>
                    </thead>

                    <tbody>

                        {produtosFiltrados.length > 0 ? (

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

                                    <td>{produto.sku}</td>

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
                                        -
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

                            <h2>NOVO PRODUTO</h2>

                            <button
                                type="button"
                                onClick={() => setModalAberto(false)}
                            >
                                ×
                            </button>

                        </div>

                        <form onSubmit={cadastrarProduto}>

                            <label>Nome do produto *</label>

                            <input
                                type="text"
                                name="nome"
                                value={novoProduto.nome}
                                onChange={atualizarCampo}
                                placeholder="Digite o nome do produto"
                                required
                            />

                            <label>Descrição</label>

                            <input
                                type="text"
                                name="descricao"
                                value={novoProduto.descricao}
                                onChange={atualizarCampo}
                                placeholder="Descrição do produto"
                            />

                            <label>Imagem do produto</label>

                            <input
                                type="file"
                                accept="image/png, image/jpeg, image/webp"
                                onChange={selecionarImagem}
                            />

                            {novoProduto.imagem && (
                                <div className="products-preview-container">

                                    <img
                                        src={novoProduto.imagem}
                                        alt="Prévia do produto"
                                        className="products-preview"
                                    />

                                    <button
                                        type="button"
                                        className="products-remover-imagem"
                                        onClick={() =>
                                            setNovoProduto((anterior) => ({
                                                ...anterior,
                                                imagem: ""
                                            }))
                                        }
                                    >
                                        Remover imagem
                                    </button>

                                </div>
                            )}

                            <label>SKU *</label>

                            <input
                                type="text"
                                name="sku"
                                value={novoProduto.sku}
                                onChange={atualizarCampo}
                                placeholder="Ex.: PRC-INT-14900K"
                                required
                            />

                            <label>Categoria *</label>

                            <select
                                name="categoria"
                                value={novoProduto.categoria}
                                onChange={atualizarCampo}
                                required
                            >
                                <option value="">Selecione uma categoria</option>

                                {categorias.map((categoria) => (
                                    <option key={categoria} value={categoria}>
                                        {categoria}
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
                                name="estoque"
                                value={novoProduto.estoque}
                                onChange={atualizarCampo}
                                min="0"
                                step="1"
                                placeholder="0"
                                required
                            />

                            <label>Status</label>

                            <select
                                name="status"
                                value={novoProduto.status}
                                onChange={atualizarCampo}
                            >
                                <option value="Ativo">Ativo</option>
                                <option value="Inativo">Inativo</option>
                            </select>

                            <div className="products-modal-acoes">

                                <button
                                    type="button"
                                    onClick={() => setModalAberto(false)}
                                >
                                    CANCELAR
                                </button>

                                <button type="submit">
                                    CADASTRAR PRODUTO
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
