import icones from '../../assets/icones';
import { useState, useEffect } from 'react';
import './System.css';

const desempenhoSemanal = [
    { dia: 'Seg', valor: 45 },
    { dia: 'Ter', valor: 65 },
    { dia: 'Qua', valor: 90 },
    { dia: 'Qui', valor: 52 },
    { dia: 'Sex', valor: 70 },
    { dia: 'Sáb', valor: 35 },
    { dia: 'Dom', valor: 58 }
];

// Retorna a data atual no fuso de Brasília
function getBrasiliaDateKey(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(date);

    const values = {};

    parts.forEach(part => {
        values[part.type] = part.value;
    });

    return `${values.year}-${values.month}-${values.day}`;
}

// Formata o horário de Brasília
function getBrasiliaTime(date) {
    return new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23'
    }).format(date);
}

function System() {
     // Controla a abertura do calendário
    const [showCalendar, setShowCalendar] = useState(false);

    // Mês que está sendo visualizado
    const [visibleMonth, setVisibleMonth] = useState(() => {
        const today = new Date();

        return new Date(Date.UTC(
            today.getFullYear(),
            today.getMonth(),
            1
        ));
    });

    // Data e horário selecionados
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');

    // Agendamento confirmado
    const [scheduledAt, setScheduledAt] = useState(null);

    // Última verificação realizada
    const [lastVerificationAt, setLastVerificationAt] = useState(
        Date.now() - 14 * 60 * 1000
    );

    // Relógio para atualizar os minutos
    const [now, setNow] = useState(Date.now());

    // Atualiza o relógio a cada 30 segundos
    useEffect(() => {
        const timer = setInterval(() => {
            setNow(Date.now());
        }, 30000);

        return () => clearInterval(timer);
    }, []);

    // Informações do mês exibido
    const year = visibleMonth.getUTCFullYear();
    const month = visibleMonth.getUTCMonth();

    const firstDay = new Date(Date.UTC(year, month, 1));

    // Semana começa na segunda-feira
    const startingDay = (firstDay.getUTCDay() + 6) % 7;

    const totalDays = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

    // Dias do calendário
    const calendarDays = [
        ...Array(startingDay).fill(null),
        ...Array.from({ length: totalDays }, (_, i) => i + 1)
    ];

    // Data atual em Brasília
    const todayKey = getBrasiliaDateKey(new Date());

    // Nome do mês
    const monthName = new Intl.DateTimeFormat('pt-BR', {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC'
    }).format(visibleMonth);


    // Navegar entre os meses
    function changeMonth(direction) {
        setVisibleMonth(
            new Date(Date.UTC(year, month + direction, 1))
        );
    }


    // Criar a data selecionada
    function getDateKey(day) {
        return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }


    // Confirmar agendamento
    function handleSchedule() {
        if (!selectedDate || !selectedTime) return;

        // Horário fixo de Brasília (GMT-3)
        const date = new Date(
            `${selectedDate}T${selectedTime}:00-03:00`
        );

        // Impede agendamentos no passado
        if (date.getTime() <= Date.now()) {
            alert('Escolha uma data e um horário futuros.');
            return;
        }

        setScheduledAt(date);
        setShowCalendar(false);
        setSelectedDate('');
        setSelectedTime('');
    }


    // Concluir verificação
    function handleCompleteVerification() {
        setLastVerificationAt(Date.now());
        setScheduledAt(null);
        setNow(Date.now());
    }

        // Minutos desde a última verificação
    const elapsedMinutes = Math.floor(
        (now - lastVerificationAt) / 60000
    );

    // Dias até a próxima verificação
    const daysUntil = scheduledAt
        ? Math.max(
            0,
            Math.round(
                (
                    Date.UTC(
                        ...getBrasiliaDateKey(scheduledAt)
                            .split('-')
                            .map(Number).map((v, i) => i === 1 ? v - 1 : v)
                    ) -
                    Date.UTC(
                        ...todayKey.split('-')
                            .map(Number).map((v, i) => i === 1 ? v - 1 : v)
                    )
                ) / 86400000
            )
        )
        : null;

    return (
        <div className="system-page">

            {/* CABEÇALHO */}
            <section className="system-heading">
                <h1 className="system-title">SISTEMA</h1>
                <span>v4.2.1-stable</span>
            </section>

            {/* DESEMPENHO E MANUTENÇÃO */}
            <section className="system-overview">

                <div className="system-performance">
                    <h2>
                      <img src={icones.desempenho} alt=''/>Desempenho Global do Sistema</h2>

                    <div className="system-chart">

                        <div className="system-chart-bars">
                            {desempenhoSemanal.map((item) => (
                                <div className="system-chart-column" key={item.dia}>

                                    <div className="system-chart-bar-container">
                                        <div
                                            className={`system-chart-bar ${
                                                item.dia === 'Qua' ? 'highlight' : ''
                                            }`}
                                            style={{ height: `${item.valor}%` }}
                                        />
                                    </div>

                                    <span>{item.dia}</span>

                                </div>
                            ))}
                        </div>

                    </div>
                </div>

                <div className="system-maintenance">

                    <h2>Manutenção</h2>

                    {/* MENSAGEM DE MANUTENÇÃO */}
                    {scheduledAt ? (

                        <div className="system-scheduled-info">

                            <p>
                                Próxima verificação em {daysUntil} dias
                                às {getBrasiliaTime(scheduledAt)}
                            </p>

                            <span>
                                {new Intl.DateTimeFormat('pt-BR', {
                                    timeZone: 'America/Sao_Paulo',
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                }).format(scheduledAt)}
                                {' • Horário de Brasília'}
                            </span>

                            {/* Concluir quando chegar o horário */}
                            {now >= scheduledAt.getTime() && (
                                <button
                                    type="button"
                                    onClick={handleCompleteVerification}
                                    className="system-complete-button"
                                >
                                    Concluir verificação
                                </button>
                            )}

                        </div>

                    ) : (

                        <p>
                            Agende uma verificação do sistema para garantir que tudo esteja funcionando corretamente. <br/>
                            Servidores operando em 100% da capacidade.
                        </p>

                    )}


                    {/* BOTÃO PRINCIPAL */}
                    <button
                        type="button"
                        onClick={() => {
                            setShowCalendar(!showCalendar);
                            setSelectedDate('');
                            setSelectedTime('');
                        }}
                    >
                        {scheduledAt ? 'Alterar agendamento' : 'Agendar verificação'}
                    </button>


                    {/* CALENDÁRIO */}
                    {showCalendar && (

                        <div className="system-calendar">

                            {/* CABEÇALHO DO CALENDÁRIO */}
                            <div className="system-calendar-header">

                                <button
                                    type="button"
                                    onClick={() => changeMonth(-1)}
                                >
                                    &#8249;
                                </button>

                                <strong>{monthName}</strong>

                                <button
                                    type="button"
                                    onClick={() => changeMonth(1)}
                                >
                                    &#8250;
                                </button>

                            </div>


                            {/* DIAS DA SEMANA */}
                            <div className="system-calendar-grid">

                                {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => (
                                    <span key={day} className="system-weekday">
                                        {day}
                                    </span>
                                ))}


                                {/* DIAS DO MÊS */}
                                {calendarDays.map((day, index) => {

                                    if (!day) {
                                        return (
                                            <span key={`empty-${index}`} />
                                        );
                                    }

                                    const dateKey = getDateKey(day);

                                    const isSelected = selectedDate === dateKey;
                                    const isToday = todayKey === dateKey;
                                    const isPast = dateKey < todayKey;

                                    return (
                                        <button
                                            key={dateKey}
                                            type="button"
                                            disabled={isPast}
                                            className={`
                                                system-calendar-day
                                                ${isSelected ? 'selected' : ''}
                                                ${isToday ? 'today' : ''}
                                            `}
                                            onClick={() => setSelectedDate(dateKey)}
                                        >
                                            {day}
                                        </button>
                                    );
                                })}

                            </div>


                            {/* HORÁRIO */}
                            <div className="system-calendar-time">

                                <label htmlFor="verification-time">
                                    Horário da verificação
                                </label>

                                <input
                                    id="verification-time"
                                    type="time"
                                    value={selectedTime}
                                    onChange={(e) => setSelectedTime(e.target.value)}
                                />

                                <span>Horário de Brasília (GMT-3)</span>

                            </div>


                            {/* CONFIRMAR */}
                            <button
                                type="button"
                                className="system-calendar-confirm"
                                disabled={!selectedDate || !selectedTime}
                                onClick={handleSchedule}
                            >
                                {selectedDate ? 'Agendar' : 'Agendar verificação'}
                            </button>

                        </div>

                    )}

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
            </section>

        </div>
    );
}

export default System;