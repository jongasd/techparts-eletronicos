import icones from '../../assets/icones';
import './System.css';

function System() {
    return (
        <div className="system-page">

            {/* CABEÇALHO */}
            <section className="system-heading">
                <h1>SISTEMA</h1>
                <span>v4.2.1-stable</span>
            </section>

            {/* DESEMPENHO E MANUTENÇÃO */}
            <section className="system-overview">

                <div className="system-performance">
                    <h2>
                      <img src={icones.desempenho} alt=''/>Desempenho Global do Sistema</h2>

                    {/* Gráfico será implementado aqui */}
                </div>

                <div className="system-maintenance">
                    <h2>Manutenção</h2>
                    <p>
                        Último backup realizado há 14 minutos.
                        Servidores operando em 100% da capacidade.
                    </p>

                    <button type="button">
                        Agendar Verificação
                    </button>
                </div>

            </section>

            {/* INDICADORES */}
            <section className="system-metrics">

                <div className="system-metric">
                    <span>HARDWARE ID</span>
                    <strong>TP-772-X</strong>
                </div>

                <div className="system-metric">
                    <span>UPTIME TOTAL</span>
                    <strong>
                      99.98%
                      <img src={icones.check} alt=''/>
                      </strong>
                </div>

                <div className="system-metric">
                    <span>USUÁRIOS ATIVOS</span>
                    <strong>
                      1,204
                      <img src={icones.procurar_user} alt=''/>
                      </strong>
                </div>

            </section>

            {/* INTEGRAÇÕES */}
            <section className="system-integrations">

                <div className="system-integrations-content">

                    <div className="system-api-icon">
                        <img src={icones.api} alt="" />
                    </div>

                    <div>
                        <h2>Integrações API</h2>
                        <p>
                            Conexão ativa com 12 terminais externos e gateways de pagamento.
                        </p>
                    </div>

                </div>

                <button type="button">
                    Configurar
                </button>

            </section>

        </div>
    );
}

export default System;