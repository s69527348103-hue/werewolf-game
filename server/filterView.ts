// Turns the server's authoritative GameState into what one specific player
// is allowed to see. This is the actual privacy boundary for online play —
// unlike the local pass-and-play build, other players' secrets never even
// reach this client's browser.
import type { GameState, Player } from '../src/engine/types';

export function filterViewForPlayer(game: GameState, viewerId: string | null): GameState {
  const isGameOver = game.currentPhase === 'GAME_OVER';
  const viewer = game.players.find((p) => p.id === viewerId) ?? null;
  const viewerRole = viewer?.role ?? null;

  const revealVotes = isGameOver || game.currentPhase === 'VOTE_RESULT' || game.currentPhase === 'CHECK_WIN';

  const players: Player[] = game.players.map((p) => {
    const isSelf = p.id === viewerId;
    // A player's role stops being a secret once they're out of the game —
    // eliminated-by-vote and killed-at-night both reveal immediately, same
    // as the local build's elimination-reveal screen and public log already
    // do; game-over reveals everyone regardless.
    const roleRevealed = isGameOver || isSelf || !p.isAlive;
    let next = p;
    if (!roleRevealed) {
      next = { ...next, role: null, team: null, suspicion: {}, isProtected: false };
    }
    if (!revealVotes && !isSelf) {
      next = { ...next, voteTarget: null };
    }
    return next;
  });

  return {
    ...game,
    players,
    nightTarget: isGameOver || viewerRole === 'WEREWOLF' ? game.nightTarget : null,
    doctorTarget: isGameOver || viewerRole === 'DOCTOR' ? game.doctorTarget : null,
    seerTarget: isGameOver || viewerRole === 'SEER' ? game.seerTarget : null,
    seerResult: isGameOver || viewerRole === 'SEER' ? game.seerResult : null,
    votes: revealVotes ? game.votes : {},
  };
}
