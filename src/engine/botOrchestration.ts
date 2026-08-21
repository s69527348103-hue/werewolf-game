// Pure bot-turn logic, parameterized by (game, dispatch) instead of any
// particular store. Used by the browser (local pass-and-play) and by the
// online server (authoritative rooms) alike — neither React nor Node/browser
// globals are referenced here.
import type { GameAction } from './reducer';
import type { GameState } from './types';
import {
  aiChooseDoctorTarget,
  aiChooseSeerTarget,
  aiChooseVoteTarget,
  aiChooseWerewolfTarget,
  aiGenerateDiscussionLine,
} from '../ai/aiActions';

type Dispatch = (action: GameAction) => void;

export function aliveWerewolves(game: GameState) {
  return game.players.filter((p) => p.isAlive && p.role === 'WEREWOLF');
}

export function autoResolveWerewolfTurn(game: GameState, dispatch: Dispatch) {
  const wolves = aliveWerewolves(game);
  const leader = wolves.find((w) => w.isBot) ?? wolves[0];
  if (!leader) {
    dispatch({ type: 'CONFIRM_WEREWOLF_ACTION' });
    return;
  }
  const targetId = aiChooseWerewolfTarget(
    leader,
    game.players.filter((p) => p.isAlive),
  );
  if (targetId) dispatch({ type: 'SET_WEREWOLF_TARGET', targetId });
  dispatch({ type: 'CONFIRM_WEREWOLF_ACTION' });
}

export function autoResolveDoctorTurn(game: GameState, dispatch: Dispatch) {
  const doctor = game.players.find((p) => p.isAlive && p.role === 'DOCTOR');
  if (doctor) {
    const targetId = aiChooseDoctorTarget(doctor, game.players.filter((p) => p.isAlive));
    if (targetId) dispatch({ type: 'SET_DOCTOR_TARGET', targetId });
  }
  dispatch({ type: 'CONFIRM_DOCTOR_ACTION' });
}

export function autoResolveSeerTurn(game: GameState, dispatch: Dispatch) {
  const seer = game.players.find((p) => p.isAlive && p.role === 'SEER');
  if (seer) {
    const checked = new Set(
      game.nightHistory.filter((n) => n.seerTargetId).map((n) => n.seerTargetId as string),
    );
    const targetId = aiChooseSeerTarget(seer, game.players.filter((p) => p.isAlive), checked);
    if (targetId) dispatch({ type: 'SET_SEER_TARGET', targetId });
  }
  dispatch({ type: 'REVEAL_SEER_RESULT' });
  dispatch({ type: 'CONFIRM_SEER_ACTION' });
}

export function botDiscussionLine(game: GameState): { playerId: string; text: string } | null {
  const aliveBots = game.players.filter((p) => p.isAlive && p.isBot);
  if (aliveBots.length === 0) return null;
  const speaker = aliveBots[Math.floor(Math.random() * aliveBots.length)];
  const others = game.players.filter((p) => p.isAlive && p.id !== speaker.id);
  const target = others[Math.floor(Math.random() * others.length)];
  const text = aiGenerateDiscussionLine(speaker, target?.name ?? null);
  return { playerId: speaker.id, text };
}

export function runBotVoting(game: GameState, dispatch: Dispatch) {
  const alive = game.players.filter((p) => p.isAlive);
  const eligibleIds = game.tiedCandidateIds.length > 0 ? game.tiedCandidateIds : alive.map((p) => p.id);
  alive
    .filter((p) => p.isBot)
    .forEach((bot) => {
      const pool = alive.filter((p) => eligibleIds.includes(p.id) && p.id !== bot.id);
      const source = pool.length > 0 ? pool : alive.filter((p) => p.id !== bot.id);
      const targetId = aiChooseVoteTarget(bot, source);
      if (targetId) dispatch({ type: 'CAST_VOTE', voterId: bot.id, targetId });
    });
}
