
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import icones from "../../assets/icones";
import chipImage from "../../assets/chip.png";

import "./ForgotPassword.css";

function ForgotPassword() {

    const navigate = useNavigate();

    const [etapa, setEtapa] = useState("email");

    const [email, setEmail] = useState("");
    const [codigo, setCodigo] = useState("");

    const [senha, setSenha] = useState("");
    const [confirmarSenha, setConfirmarSenha] = useState("");

    const [mensagem, setMensagem] = useState("");

    // PRIMEIRA ETAPA: ENVIAR E-MAIL
    function enviarCodigo(e) {
        e.preventDefault();

        setMensagem("");
        setEtapa("codigo");
    }

    // SEGUNDA ETAPA: VERIFICAR CÓDIGO
    function verificarCodigo(e) {
        e.preventDefault();

        setMensagem("");
        setEtapa("senha");
    }

    // TERCEIRA ETAPA: REDEFINIR SENHA
    function redefinirSenha(e) {
        e.preventDefault();

        if (senha.length < 8) {
            setMensagem("A senha deve possuir pelo menos 8 caracteres.");
            return;
        }

        if (senha !== confirmarSenha) {
            setMensagem("As senhas informadas não coincidem.");
            return;
        }

        // Futuramente será feita a atualização pela API
        navigate("/");
    }

    return (
        <div className="login-page">

            {/* LADO ESQUERDO */}
            <section className="login-brand">

                <div className="brand-content">

                    <div className="chip-icon">
                        <img
                            src={icones.logo}
                            alt="Ícone de chip"
                        />
                    </div>

                    <h1>
                        TECHPARTS <span>ELETRÔNICOS</span>
                    </h1>

                    <p>O futuro começa aqui.</p>

                </div>

                <div className="chip-background">
                    <img
                        src={chipImage}
                        alt="Chip eletrônico"
                    />
                </div>

            </section>


            {/* LADO DIREITO */}
            <section className="recovery-area">

                <div className="recovery-card">

                    {/* ETAPA 1: E-MAIL */}
                    {etapa === "email" && (

                        <>
                            <h2>RECUPERAÇÃO DE SENHA</h2>

                            <p className="recovery-description">
                                Informe seu e-mail para iniciar o processo
                                de recuperação de senha.
                            </p>

                            <form onSubmit={enviarCodigo}>

                                <label
                                    htmlFor="email-recuperacao"
                                    className="recovery-label"
                                >
                                    MEIO DE CONTATO
                                </label>

                                <div className="recovery-input-container">

                                    <input
                                        type="email"
                                        id="email-recuperacao"
                                        className="recovery-input"
                                        placeholder="Digite seu e-mail de cadastro"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />

                                    <img
                                        src={icones.usuario}
                                        alt=""
                                        className="recovery-input-icon"
                                    />

                                </div>

                                <button
                                    type="submit"
                                    className="recovery-button"
                                >
                                    Redefinir senha
                                    <span>→</span>
                                </button>

                            </form>
                        </>

                    )}


                    {/* ETAPA 2: CÓDIGO */}
                    {etapa === "codigo" && (

                        <>
                            <h2>CÓDIGO DE RECUPERAÇÃO</h2>

                            <p className="recovery-description">
                                Enviaremos um código em seu e-mail.
                                Verifique sua caixa de entrada.
                            </p>

                            <form onSubmit={verificarCodigo}>

                                <label
                                    htmlFor="codigo-recuperacao"
                                    className="recovery-label"
                                >
                                    CÓDIGO
                                </label>

                                <div className="recovery-input-container">

                                    <input
                                        type="text"
                                        id="codigo-recuperacao"
                                        className="recovery-input"
                                        placeholder="Digite o código enviado em seu e-mail"
                                        value={codigo}
                                        onChange={(e) => setCodigo(e.target.value)}
                                        required
                                    />

                                    <img
                                        src={icones.usuario}
                                        alt=""
                                        className="recovery-input-icon"
                                    />

                                </div>

                                <button
                                    type="submit"
                                    className="recovery-button"
                                >
                                    Redefinir senha
                                    <span>→</span>
                                </button>

                            </form>
                        </>

                    )}


                    {/* ETAPA 3: NOVA SENHA */}
                    {etapa === "senha" && (

                        <>
                            <h2>REDEFINIR SENHA</h2>

                            <p className="recovery-description">
                                Digite aqui a sua nova senha para início de sessão.
                            </p>

                            <form onSubmit={redefinirSenha}>

                                {/* NOVA SENHA */}
                                <div className="recovery-password-group">

                                    <label
                                        htmlFor="nova-senha"
                                        className="recovery-label"
                                    >
                                        NOVA SENHA
                                    </label>

                                    <input
                                        type="password"
                                        id="nova-senha"
                                        className="recovery-input"
                                        placeholder="Digite sua nova senha"
                                        value={senha}
                                        onChange={(e) => {
                                            setSenha(e.target.value);
                                            setMensagem("");
                                        }}
                                        required
                                    />

                                </div>


                                {/* CONFIRMAR SENHA */}
                                <div className="recovery-password-group">

                                    <label
                                        htmlFor="confirmar-senha"
                                        className="recovery-label"
                                    >
                                        CONFIRME A NOVA SENHA
                                    </label>

                                    <div className="recovery-input-container">

                                        <input
                                            type="password"
                                            id="confirmar-senha"
                                            className="recovery-input"
                                            placeholder="••••••••"
                                            value={confirmarSenha}
                                            onChange={(e) => {
                                                setConfirmarSenha(e.target.value);
                                                setMensagem("");
                                            }}
                                            required
                                        />

                                    </div>

                                </div>


                                <button
                                    type="submit"
                                    className="recovery-button"
                                >
                                    Login
                                    <span>→</span>
                                </button>

                            </form>
                        </>

                    )}


                    {/* MENSAGEM DE ERRO */}
                    {mensagem && (
                        <p className="recovery-message" role="alert">
                            {mensagem}
                        </p>
                    )}

                </div>


                {/* RODAPÉ */}
                <footer className="login-footer">

                    <a href="#">Privacidade</a>
                    <a href="#">Termos de Uso</a>
                    <a href="#">Suporte</a>

                </footer>

            </section>

        </div>
    );
}

export default ForgotPassword;
