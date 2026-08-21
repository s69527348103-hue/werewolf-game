import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useGameStore } from './store/gameStore';
import { GameLogPanel } from './components/ui/GameLogPanel';
import { MainMenu } from './components/screens/MainMenu';
import { HowToPlay } from './components/screens/HowToPlay';
import { CreateGame } from './components/screens/CreateGame';
import { PlayerLobby } from './components/screens/PlayerLobby';
import { OnlineEntry } from './components/screens/OnlineEntry';
import { OnlineRoom } from './components/screens/OnlineRoom';
import { RoleReveal } from './components/screens/RoleReveal';
import { NightPhase } from './components/screens/NightPhase';
import { WerewolfAction } from './components/screens/WerewolfAction';
import { DoctorAction } from './components/screens/DoctorAction';
import { SeerAction } from './components/screens/SeerAction';
import { NightResult } from './components/screens/NightResult';
import { DayAnnouncement } from './components/screens/DayAnnouncement';
import { Discussion } from './components/screens/Discussion';
import { Voting } from './components/screens/Voting';
import { VoteResult } from './components/screens/VoteResult';
import { WinScreen } from './components/screens/WinScreen';
import { GameSummary } from './components/screens/GameSummary';

type AppView = 'MENU' | 'HOW_TO_PLAY' | 'CREATE_GAME' | 'PLAYER_LOBBY' | 'ONLINE_ENTRY' | 'PLAYING';

function App() {
  const [view, setView] = useState<AppView>('MENU');
  const [targetCount, setTargetCount] = useState(8);
  const [postGameStage, setPostGameStage] = useState<'WIN' | 'SUMMARY'>('WIN');
  const game = useGameStore((s) => s.game);
  const reset = useGameStore((s) => s.reset);

  function backToMenu() {
    reset();
    setPostGameStage('WIN');
    setView('MENU');
  }

  function playAgain() {
    const wasOnline = useGameStore.getState().mode === 'online';
    reset();
    setPostGameStage('WIN');
    setView(wasOnline ? 'MENU' : 'CREATE_GAME');
  }

  if (view === 'MENU') {
    return (
      <MainMenu
        onNewGame={() => setView('CREATE_GAME')}
        onPlayOnline={() => setView('ONLINE_ENTRY')}
        onHowToPlay={() => setView('HOW_TO_PLAY')}
      />
    );
  }

  if (view === 'HOW_TO_PLAY') {
    return <HowToPlay onBack={() => setView('MENU')} />;
  }

  if (view === 'CREATE_GAME') {
    return (
      <CreateGame
        onBack={() => setView('MENU')}
        onNext={(_roomName, count) => {
          useGameStore.getState().dispatch({ type: 'SET_ROOM_NAME', roomName: _roomName });
          setTargetCount(count);
          setView('PLAYER_LOBBY');
        }}
      />
    );
  }

  if (view === 'PLAYER_LOBBY') {
    return (
      <PlayerLobby targetCount={targetCount} onBack={() => setView('CREATE_GAME')} onStart={() => setView('PLAYING')} />
    );
  }

  if (view === 'ONLINE_ENTRY') {
    return <OnlineEntry onBack={() => setView('MENU')} onJoined={() => setView('PLAYING')} />;
  }

  return (
    <>
      <GameRouter postGameStage={postGameStage} setPostGameStage={setPostGameStage} onPlayAgain={playAgain} onMainMenu={backToMenu} />
      {game.gameStatus === 'playing' && <GameLogPanel log={game.log} />}
    </>
  );
}

function GameRouter({
  postGameStage,
  setPostGameStage,
  onPlayAgain,
  onMainMenu,
}: {
  postGameStage: 'WIN' | 'SUMMARY';
  setPostGameStage: (s: 'WIN' | 'SUMMARY') => void;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}) {
  const phase = useGameStore((s) => s.game.currentPhase);

  return (
    <AnimatePresence mode="wait">
      {(() => {
        switch (phase) {
          case 'LOBBY':
            return <OnlineRoom key="online-room" />;
          case 'ROLE_REVEAL':
            return <RoleReveal key="role-reveal" />;
          case 'NIGHT':
            return <NightPhase key="night" />;
          case 'WEREWOLF_ACTION':
            return <WerewolfAction key="werewolf" />;
          case 'DOCTOR_ACTION':
            return <DoctorAction key="doctor" />;
          case 'SEER_ACTION':
            return <SeerAction key="seer" />;
          case 'NIGHT_RESULT':
            return <NightResult key="night-result" />;
          case 'DAY':
            return <DayAnnouncement key="day" />;
          case 'DISCUSSION':
            return <Discussion key="discussion" />;
          case 'VOTING':
            return <Voting key="voting" />;
          case 'VOTE_RESULT':
            return <VoteResult key="vote-result" />;
          case 'GAME_OVER':
            return postGameStage === 'WIN' ? (
              <WinScreen key="win" onViewSummary={() => setPostGameStage('SUMMARY')} />
            ) : (
              <GameSummary key="summary" onPlayAgain={onPlayAgain} onMainMenu={onMainMenu} />
            );
          default:
            return null;
        }
      })()}
    </AnimatePresence>
  );
}

export default App;
