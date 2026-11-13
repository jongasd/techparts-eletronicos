
import './Confirmacao.css';

function Confirmacao({ titulo, mensagem, aoConfirmar, aoCancelar }) {
    return (
        <div className="confirmacao-overlay">
            <div
                className="confirmacao-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirmacao-titulo"
            >
                <div className="confirmacao-icone">
                    !
                </div>

                <h2 id="confirmacao-titulo">
                    {titulo}
                </h2>

                <p>
                    {mensagem}
                </p>

                <div className="confirmacao-acoes">
                    <button
                        type="button"
                        className="confirmacao-cancelar"
                        onClick={aoCancelar}
                    >
                        Cancelar
                    </button>

                    <button
                        type="button"
                        className="confirmacao-confirmar"
                        onClick={aoConfirmar}
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Confirmacao;
