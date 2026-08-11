import save from '../managers/SaveManager.js';

// Ordem oficial das fases do jogo, atravessando os biomas.
//
// A progressão é LINEAR (`02_CONTINENTE.md`, ordem definitiva; e
// `06_INTERFACE_UX.md`, Seção 2.2): uma fase abre a seguinte, e só. Concentrar
// isso numa lista única evita que cada mapa de bioma invente sua própria regra
// de desbloqueio — e é ela que decide também quais REGIÕES já estão abertas.
//
// `id` é o que vai para o save. Nunca renomeie um id já publicado: um save
// antigo deixaria de reconhecer a fase e o jogador perderia progresso.
export const FASES = [
  { id: 'vila_1', regiao: 'vila', nome: 'Despertar', cena: 'Fase1Scene' },
  { id: 'vila_2', regiao: 'vila', nome: 'Arredores', cena: 'Fase2Scene' },
  { id: 'bosque_1', regiao: 'bosque', nome: 'Orla do Bosque', cena: 'BosqueFase1Scene' },
  { id: 'bosque_2', regiao: 'bosque', nome: 'Subida das Raízes', cena: 'BosqueFase2Scene' },
  { id: 'bosque_3', regiao: 'bosque', nome: 'Mata Cerrada', cena: 'BosqueFase3Scene' },
  { id: 'bosque_4', regiao: 'bosque', nome: 'Raízes da Árvore', cena: 'BosqueBossScene' },
];

/** Índice de uma fase na ordem oficial. */
export function indiceDaFase(id) {
  return FASES.findIndex((f) => f.id === id);
}

/**
 * Uma fase está liberada se for a primeira do jogo ou se a anterior já foi
 * concluída. Sem exceções: é o que mantém a jornada legível.
 */
export function faseLiberada(id) {
  const i = indiceDaFase(id);
  if (i <= 0) return true;
  return save.faseConcluida(FASES[i - 1].id);
}

/** Fases de uma região, na ordem. */
export function fasesDaRegiao(regiao) {
  return FASES.filter((f) => f.regiao === regiao);
}

/**
 * Uma região está liberada quando sua primeira fase está liberada — ou seja,
 * quando a última fase da região anterior foi concluída.
 */
export function regiaoLiberada(regiao) {
  const primeira = fasesDaRegiao(regiao)[0];
  return primeira ? faseLiberada(primeira.id) : false;
}

/** A próxima fase não concluída, para o "Continuar" do menu. */
export function proximaFase() {
  return FASES.find((f) => !save.faseConcluida(f.id)) || FASES[FASES.length - 1];
}
