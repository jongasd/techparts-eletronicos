import icones from '../../assets/icones';
import './Stock.css';

const produtos = [
    { id: '#TP-0942', nome: 'Intel Core i9-13900K', categoria: 'PROCESSADORES', quantidade: 42, preco: 'R$ 3.899,00', status: 'NORMAL' },
    { id: '#TP-1288', nome: 'Corsair Vengeance 32GB DDR5', categoria: 'MEMÓRIA RAM', quantidade: 156, preco: 'R$ 1.150,00', status: 'NORMAL' },
    { id: '#TP-2201', nome: 'Samsung 980 Pro 2TB NVMe', categoria: 'ARMAZENAMENTO', quantidade: 8, preco: 'R$ 980,00', status: 'BAIXO' },
    { id: '#TP-4402', nome: 'NVIDIA RTX 4080 Founders', categoria: 'PLACAS DE VÍDEO', quantidade: 12, preco: 'R$ 8.490,00', status: 'NORMAL' },
    { id: '#TP-5521', nome: 'EVGA SuperNOVA 850W Gold', categoria: 'FONTES ATX', quantidade: 0, preco: 'R$ 745,00', status: 'ESGOTADO' },
    { id: '#TP-6610', nome: 'Noctua NH-D15 chromax.black', categoria: 'COOLERS', quantidade: 25, preco: 'R$ 620,00', status: 'NORMAL' },
    { id: '#TP-7788', nome: 'Lian Li PC-O11 Dynamic', categoria: 'GABINETES', quantidade: 15, preco: 'R$ 1.250,00', status: 'NORMAL' },
    { id: '#TP-1055', nome: 'AMD Ryzen 7 7800X3D', categoria: 'PROCESSADORES', quantidade: 5, preco: 'R$ 2.450,00', status: 'BAIXO' }
];

function Stock() {
    return (
        <div className="stock-page">

            <h1 className="stock-title">ESTOQUE</h1>

            <section className="stock-metrics">
                <div className="metric-card">
                    <span className="metric-label">TOTAL DE ITENS</span>

                    <div className="metric-info">
                        <strong>12.450</strong>
                        <img
                            src={icones.usuario}
                            alt=""
                            className="metric-icon"
                        />
                    </div>
                </div>

                <div className="metric-card">
                    <span className="metric-label">VALOR DO ESTOQUE</span>

                    <div className="metric-info">
                        <strong>R$ 2.1M</strong>
                        <img src={icones.dinheiro} alt="" className="metric-icon" />
                    </div>
                </div>

                <div className="metric-card">
                    <span className="metric-label">ITENS EM BAIXA</span>

                    <div className="metric-info">
                        <strong className="metric-warning">14</strong>
                        <img src={icones.atencao} alt="" className="metric-icon-danger" />
                    </div>
                </div>

                <div className="metric-card">
                    <span className="metric-label">GIRO DE ESTOQUE</span>

                    <div className="metric-info">
                        <strong>12 dias</strong>
                        <img src={icones.repor} alt="" className="metric-icon" />
                    </div>
                </div>
            </section>

            <section className="stock-table-container">

                <div className="stock-toolbar">
                    <input
                        type="search"
                        placeholder="Pesquisar componentes, IDs ou categorias..."
                    />

                    <div className="stock-filter">
                        <img src={icones.filtro}alt=''/>
                        Filtros
                    </div>
                </div>

                <table className="stock-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>PRODUTO</th>
                            <th>QUANTIDADE</th>
                            <th>PREÇO UNITÁRIO</th>
                            <th>STATUS</th>
                            <th>AÇÕES</th>
                        </tr>
                    </thead>

                    <tbody>
                        {produtos.map((produto) => (
                            <tr key={produto.id}>
                                <td>{produto.id}</td>

                                <td>
                                    <strong>{produto.nome}</strong>
                                    <small>{produto.categoria}</small>
                                </td>

                                <td>{produto.quantidade} un.</td>

                                <td>{produto.preco}</td>

                                <td>
                                    <span className={`stock-status ${produto.status.toLowerCase()}`}>
                                        {produto.status}
                                    </span>
                                </td>

                                <td>
                                    <div className="stock-actions">
                                        <img src={icones.excluir} alt="Excluir produto" className='stock-delete-icon'/>
                                        <img src={icones.editar} alt="Editar produto" />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

            </section>

        </div>
    );
}

export default Stock;
