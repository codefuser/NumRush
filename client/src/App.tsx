import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header.js';
import { Footer } from './components/Footer.js';
import { HomeScreen } from './components/HomeScreen.js';
import { LobbyScreen } from './components/LobbyScreen.js';
import { GameScreen } from './components/GameScreen.js';
import { ResultsScreen } from './components/ResultsScreen.js';
import { PracticeScreen } from './components/PracticeScreen.js';
import { CreateGameModal } from './components/CreateGameModal.js';
import { JoinGameModal } from './components/JoinGameModal.js';
import { LeaderboardModal } from './components/LeaderboardModal.js';
import { ProfileModal } from './components/ProfileModal.js';
import { HowToPlayModal } from './components/HowToPlayModal.js';
import { socketService } from './services/socket.js';
import type { ActiveSessionData } from './services/socket.js';
import { soundManager } from './services/audio.js';
import type {
  Screen,
  RoomState,
  MatchState,
  MatchResults,
  RoomSettings,
} from './types/index.js';

export const App: React.FC = () => {
  // 1. Persistent User Identity
  const [userId] = useState<string>(() => {
    let id = localStorage.getItem('numrush_user_id');
    if (!id) {
      id = 'user_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('numrush_user_id', id);
    }
    return id;
  });

  const [displayName, setDisplayName] = useState<string>(() => {
    return localStorage.getItem('numrush_display_name') || `Player_${Math.floor(1000 + Math.random() * 9000)}`;
  });

  // 2. Navigation & Game State
  const [screen, setScreen] = useState<Screen>('HOME');
  const [room, setRoom] = useState<RoomState | null>(null);
  const [match, setMatch] = useState<MatchState | null>(null);
  const [results, setResults] = useState<MatchResults | null>(null);

  // Timers & Countdown
  const [countdownRemaining, setCountdownRemaining] = useState<number | null>(null);
  const [serverRemainingSeconds, setServerRemainingSeconds] = useState<number>(180);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [isJoinOpen, setIsJoinOpen] = useState<boolean>(false);
  const [joinInitialCode, setJoinInitialCode] = useState<string>('');
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState<boolean>(false);

  // Feedback & Loading
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle URL Join query parameter (e.g. ?join=NR-7K2P9)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinCode = params.get('join') || params.get('room');
    if (joinCode) {
      setJoinInitialCode(joinCode.toUpperCase());
      setIsJoinOpen(true);
    }
  }, []);

  // Update display name handler
  const handleUpdateDisplayName = (name: string) => {
    setDisplayName(name);
    localStorage.setItem('numrush_display_name', name);
  };

  // 3. Socket.IO Lifecycle Listeners
  useEffect(() => {
    const socket = socketService.init();

    // A. Room Created
    socket.on('room:created', (data: { room: RoomState }) => {
      setIsLoading(false);
      setIsCreateOpen(false);
      setRoom(data.room);
      setScreen('LOBBY');
      socketService.saveActiveSession({
        roomId: data.room.id,
        roomCode: data.room.roomCode,
        userId,
        displayName,
        timestamp: Date.now(),
      });
    });

    // B. Room Joined
    socket.on('room:joined', (data: { room: RoomState }) => {
      setIsLoading(false);
      setIsJoinOpen(false);
      setRoom(data.room);

      socketService.saveActiveSession({
        roomId: data.room.id,
        roomCode: data.room.roomCode,
        userId,
        displayName,
        timestamp: Date.now(),
      });

      if (data.room.status === 'PLAYING' && data.room.currentMatch) {
        setMatch(data.room.currentMatch);
        setScreen('GAME');
      } else {
        setScreen('LOBBY');
      }
    });

    // C. Player Joined room
    socket.on('room:playerJoined', (data: { player: any }) => {
      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          players: {
            ...prev.players,
            [data.player.id]: data.player,
          },
        };
      });
    });

    // D. Player Left / Kicked
    socket.on('room:playerLeft', (data: { playerId: string }) => {
      setRoom((prev) => {
        if (!prev) return prev;
        const updated = { ...prev.players };
        delete updated[data.playerId];
        return { ...prev, players: updated };
      });
    });

    socket.on('room:kicked', () => {
      alert('You have been removed from the room by the host.');
      setRoom(null);
      setMatch(null);
      socketService.clearActiveSession();
      setScreen('HOME');
    });

    // E. Player Ready update
    socket.on('room:playerReadyUpdated', (data: { playerId: string; isReady: boolean }) => {
      setRoom((prev) => {
        if (!prev || !prev.players[data.playerId]) return prev;
        return {
          ...prev,
          players: {
            ...prev.players,
            [data.playerId]: {
              ...prev.players[data.playerId],
              isReady: data.isReady,
            },
          },
        };
      });
    });

    // F. Host Migration
    socket.on('room:hostMigrated', (data: { newHostId: string; newHostName: string }) => {
      setRoom((prev) => {
        if (!prev) return prev;
        const updated = { ...prev.players };
        Object.values(updated).forEach((p) => {
          p.isHost = p.id === data.newHostId;
        });
        return { ...prev, hostId: data.newHostId, players: updated };
      });
    });

    // G. Game Countdown Start
    socket.on('game:countdown', (data: { countdownSeconds: number; currentTarget: number; maxTarget: number }) => {
      setCountdownRemaining(data.countdownSeconds);
      setScreen('GAME');
    });

    socket.on('game:countdownTick', (data: { remaining: number }) => {
      setCountdownRemaining(data.remaining);
    });

    // H. Game Started
    socket.on('game:started', (data: any) => {
      setCountdownRemaining(null);
      setServerRemainingSeconds(data.durationSeconds);

      setMatch((prev) => ({
        id: data.matchId,
        roomId: room?.id || '',
        status: 'RUNNING',
        settings: room?.settings || ({} as any),
        shuffledGrid: data.shuffledGrid,
        currentTarget: data.currentTarget,
        maxTarget: data.maxTarget,
        startedAt: data.startedAt,
        countdownEndsAt: data.startedAt,
        endsAt: data.endsAt,
        claims: [],
        claimedMap: {},
        playerStats: {},
        lastClaimTimestamp: data.startedAt,
      }));

      setScreen('GAME');
    });

    // I. Number Claimed (broadcast to all)
    socket.on('game:numberClaimed', (data: any) => {
      soundManager.playCorrect();

      setMatch((prev) => {
        if (!prev) return prev;
        const updatedClaimedMap = {
          ...prev.claimedMap,
          [data.number]: {
            number: data.number,
            playerId: data.claimedBy.playerId,
            playerName: data.claimedBy.displayName,
            playerColor: data.claimedBy.color,
            serverClaimedAt: data.serverClaimedAt,
            actionId: '',
          },
        };

        return {
          ...prev,
          currentTarget: data.nextTarget,
          claimedMap: updatedClaimedMap,
        };
      });

      // Update room player scores
      setRoom((prev) => {
        if (!prev) return prev;
        const updatedPlayers = { ...prev.players };
        Object.entries(data.scores as Record<string, number>).forEach(([pid, score]) => {
          if (updatedPlayers[pid]) {
            updatedPlayers[pid].score = score;
          }
        });
        return { ...prev, players: updatedPlayers };
      });
    });

    // J. Wrong Claim rejection
    socket.on('game:claimRejected', () => {
      soundManager.playWrong();
    });

    // K. Timer Updates from authoritative server
    socket.on('game:timerUpdated', (data: { remainingSeconds: number }) => {
      setServerRemainingSeconds(data.remainingSeconds);
    });

    // L. Game Finished
    socket.on('game:finished', (data: { results: MatchResults }) => {
      setResults(data.results);
      setCountdownRemaining(null);
      setScreen('RESULTS');
    });

    // M. Play Again Ready
    socket.on('room:playAgainReady', (data: { room: RoomState }) => {
      setRoom(data.room);
      setMatch(null);
      setResults(null);
      setScreen('LOBBY');
    });

    // N. Reconnection Snapshot
    socket.on('game:stateSnapshot', (data: any) => {
      if (data.success && data.room) {
        setRoom(data.room);
        if (data.currentMatch && data.currentMatch.status === 'RUNNING') {
          setMatch(data.currentMatch);
          const remaining = Math.max(0, Math.ceil((data.currentMatch.endsAt - Date.now()) / 1000));
          setServerRemainingSeconds(remaining);
          setScreen('GAME');
        } else if (data.room.status === 'FINISHED' && data.room.lastResults) {
          setResults(data.room.lastResults);
          setScreen('RESULTS');
        } else {
          setScreen('LOBBY');
        }
      }
    });

    // O. Room Error
    socket.on('room:error', (data: { message: string }) => {
      setIsLoading(false);
      setErrorMessage(data.message);
      setTimeout(() => setErrorMessage(null), 5000);
    });

    return () => {
      socket.off('room:created');
      socket.off('room:joined');
      socket.off('room:playerJoined');
      socket.off('room:playerLeft');
      socket.off('room:kicked');
      socket.off('room:playerReadyUpdated');
      socket.off('room:hostMigrated');
      socket.off('game:countdown');
      socket.off('game:countdownTick');
      socket.off('game:started');
      socket.off('game:numberClaimed');
      socket.off('game:claimRejected');
      socket.off('game:timerUpdated');
      socket.off('game:finished');
      socket.off('room:playAgainReady');
      socket.off('game:stateSnapshot');
      socket.off('room:error');
    };
  }, [userId, displayName, room?.id]);

  // Actions
  const handleCreateRoom = (settings: RoomSettings) => {
    setIsLoading(true);
    const socket = socketService.getSocket();
    socket.emit('room:create', {
      displayName,
      userId,
      settings,
    });
  };

  const handleJoinRoom = (roomCode: string, password?: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    const socket = socketService.getSocket();
    socket.emit('room:join', {
      roomCode,
      displayName,
      userId,
      password,
    });
  };

  const handleSetReady = (isReady: boolean) => {
    if (!room) return;
    const socket = socketService.getSocket();
    socket.emit('room:ready', { roomId: room.id, isReady });
  };

  const handleStartGame = () => {
    if (!room) return;
    const socket = socketService.getSocket();
    socket.emit('room:start', { roomId: room.id });
  };

  const handleLeaveRoom = () => {
    if (room) {
      const socket = socketService.getSocket();
      socket.emit('room:leave', { roomId: room.id });
    }
    socketService.clearActiveSession();
    setRoom(null);
    setMatch(null);
    setResults(null);
    setScreen('HOME');
  };

  const handleKickPlayer = (targetPlayerId: string) => {
    if (!room) return;
    const socket = socketService.getSocket();
    socket.emit('room:kick', { roomId: room.id, targetPlayerId });
  };

  const handleClaimNumber = useCallback(
    (number: number) => {
      if (!room || !match || match.status !== 'RUNNING') return;
      const socket = socketService.getSocket();
      const actionId = `act_${userId}_${number}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      socket.emit('game:claimNumber', {
        roomId: room.id,
        matchId: match.id,
        number,
        actionId,
        clientTimestamp: Date.now(),
      });
    },
    [room, match, userId]
  );

  const handlePlayAgain = () => {
    if (!room) return;
    const socket = socketService.getSocket();
    socket.emit('game:playAgain', { roomId: room.id });
  };

  const handleResumeSession = (session: ActiveSessionData) => {
    setIsLoading(true);
    const socket = socketService.getSocket();
    socket.emit('game:requestSnapshot', { roomId: session.roomId, userId: session.userId });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0B0F19] text-gray-100">
      {/* Global Header (Only on menu/lobby screens, hidden during GAME for full-screen immersion) */}
      {screen !== 'GAME' && (
        <Header
          currentScreen={screen}
          setScreen={setScreen}
          playerDisplayName={displayName}
        />
      )}

      {/* Main Body Content based on screen */}
      <main className="flex-1 flex flex-col">
        {screen === 'HOME' && (
          <HomeScreen
            displayName={displayName}
            userId={userId}
            onUpdateDisplayName={handleUpdateDisplayName}
            onOpenCreateModal={() => setIsCreateOpen(true)}
            onOpenJoinModal={(code) => {
              setJoinInitialCode(code || '');
              setIsJoinOpen(true);
            }}
            onOpenPractice={() => setScreen('PRACTICE')}
            onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
            onOpenProfile={() => setIsProfileOpen(true)}
            onResumeActiveSession={handleResumeSession}
          />
        )}

        {screen === 'LOBBY' && room && (
          <LobbyScreen
            room={room}
            currentPlayerId={userId}
            onSetReady={handleSetReady}
            onStartGame={handleStartGame}
            onLeaveRoom={handleLeaveRoom}
            onKickPlayer={handleKickPlayer}
          />
        )}

        {screen === 'GAME' && room && match && (
          <GameScreen
            room={room}
            match={match}
            currentPlayerId={userId}
            countdownRemaining={countdownRemaining}
            serverRemainingSeconds={serverRemainingSeconds}
            onClaimNumber={handleClaimNumber}
            onLeaveRoom={handleLeaveRoom}
          />
        )}

        {screen === 'RESULTS' && results && room && (
          <ResultsScreen
            results={results}
            room={room}
            currentPlayerId={userId}
            onPlayAgain={handlePlayAgain}
            onReturnToLobby={() => setScreen('LOBBY')}
            onReturnHome={() => {
              socketService.clearActiveSession();
              setScreen('HOME');
            }}
          />
        )}

        {screen === 'PRACTICE' && (
          <PracticeScreen onBack={() => setScreen('HOME')} />
        )}
      </main>

      {/* Global Footer */}
      {screen !== 'GAME' && (
        <Footer onOpenHowToPlay={() => setIsHowToPlayOpen(true)} />
      )}

      {/* Modal Dialogs */}
      {isCreateOpen && (
        <CreateGameModal
          onClose={() => setIsCreateOpen(false)}
          onCreateRoom={handleCreateRoom}
          isLoading={isLoading}
        />
      )}

      {isJoinOpen && (
        <JoinGameModal
          initialCode={joinInitialCode}
          onClose={() => setIsJoinOpen(false)}
          onJoin={handleJoinRoom}
          isLoading={isLoading}
          errorMessage={errorMessage}
        />
      )}

      {isLeaderboardOpen && (
        <LeaderboardModal
          currentUserId={userId}
          onClose={() => setIsLeaderboardOpen(false)}
        />
      )}

      {isProfileOpen && (
        <ProfileModal
          userId={userId}
          currentName={displayName}
          onUpdateName={handleUpdateDisplayName}
          onClose={() => setIsProfileOpen(false)}
        />
      )}

      {isHowToPlayOpen && (
        <HowToPlayModal onClose={() => setIsHowToPlayOpen(false)} />
      )}
    </div>
  );
};

export default App;
