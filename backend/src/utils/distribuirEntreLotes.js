/**
 * Decide em quais lotes uma devolução volta a entrar.
 *
 * `consumos`: linhas de tbl_saida_lote da saída para o produto, SEMPRE na
 *   mesma ordem (id_saida_lote ASC). Cada uma diz quanto aquele lote deu.
 * `jaDevolvido`: total já devolvido dessa saída/produto em devoluções
 *   anteriores. Essas unidades "ocupam" os primeiros lotes da lista; a nova
 *   devolução continua de onde a anterior parou. Assim nenhum lote recebe de
 *   volta mais do que forneceu, sem precisar de coluna extra no banco.
 * `quantidade`: quanto devolver agora.
 *
 * Retorna { alocacoes: [{ id_lote, quantidade }], naoRastreado }.
 * `naoRastreado > 0` significa que a saída não tem lote registrado para essa
 * parte (venda anterior ao controle de lotes).
 */
const distribuirEntreLotes = (consumos, jaDevolvido, quantidade) => {
  let pular = jaDevolvido;
  let restante = quantidade;
  const alocacoes = [];

  for (const consumo of consumos) {
    let disponivel = Number(consumo.quantidade);

    if (pular > 0) {
      const consumido = Math.min(pular, disponivel);
      pular -= consumido;
      disponivel -= consumido;
    }

    if (disponivel <= 0 || restante <= 0) continue;

    const devolver = Math.min(disponivel, restante);
    alocacoes.push({ id_lote: consumo.id_lote, quantidade: devolver });
    restante -= devolver;
  }

  return { alocacoes, naoRastreado: restante };
};

module.exports = distribuirEntreLotes;
