import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header.js';
import { HomeScreen } from './components/HomeScreen.js';
import { LobbyScreen } from './components/LobbyScreen.js';
import { GameScreen } from './components/GameScreen.js';
import { ResultsScreen } from './components/ResultsScreen.js';
import { PracticeScreen } from './components/PracticeScreen.js';
import { SoloSetupModal, SoloGameConfig } from './components/SoloSetupModal.js';
import { CreateGameModal } from './components/CreateGameModal.js';
import { JoinGameModal } from './components/JoinGameModal.js';
import { LeaderboardModal } from './components/LeaderboardModal.js';
import { ProfileModal } from './components/ProfileModal.js';
import { HowToPlayModal } from './components/HowToPlayModal.js';
import { LoadingScreen } from './components/LoadingScreen.js';
import { WelcomeNameModal } from './components/WelcomeNameModal.js';
import { api } from './services/api.js';
import { socketService } from './services/socket.js';
import type { ActiveSessionData } from './services/socket.js';
import { soundManager } from './services/audio.js';
import { playerStatsService } from './services/playerStatsService.js';
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

  const [isNameModalOpen, setIsNameModalOpen] = useState<boolean>(() => {
    return !localStorage.getItem('numrush_display_name');
  });

  const handleSaveInitialName = (name: string) => {
    handleUpdateDisplayName(name);
    api.updateProfile(userId, name);
    setIsNameModalOpen(false);
  };

  // 2. Navigation & Game State
  const [screen, setScreen] = useState<Screen>('HOME');
  const [room, setRoom] = useState<RoomState | null>(null);
  const [match, setMatch] = useState<MatchState | null>(null);
  const [results, setResults] = useState<MatchResults | null>(null);

  // Sync refs to avoid stale closures in stable callbacks
  const roomRef = useRef<RoomState | null>(room);
  roomRef.current = room;
  const matchRef = useRef<MatchState | null>(match);
  matchRef.current = match;

  // Timers & Countdown
  const [countdownRemaining, setCountdownRemaining] = useState<number | null>(null);
  const [serverRemainingSeconds, setServerRemainingSeconds] = useState<number>(180);
  const [serverElapsedSeconds, setServerElapsedSeconds] = useState<number>(0);

  // Modals
  const [isSoloSetupOpen, setIsSoloSetupOpen] = useState<boolean>(false);
  const [soloConfig, setSoloConfig] = useState<SoloGameConfig>({
    maxNumber: 50,
    gameMode: 'COMPLETE_GRID',
    timeLimitSeconds: 180,
  });
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [isJoinOpen, setIsJoinOpen] = useState<boolean>(false);
  const [joinInitialCode, setJoinInitialCode] = useState<string>('');
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState<boolean>(false);
  const [isAppLoading, setIsAppLoading] = useState<boolean>(true);

  const handleStartSolo = (config: SoloGameConfig) => {
    setSoloConfig(config);
    setIsSoloSetupOpen(false);
    setScreen('PRACTICE');
  };

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

    // Auto-reconnect active session on socket connect
    const handleConnect = () => {
      const activeSession = socketService.getActiveSession();
      const currentRoomId = roomRef.current?.id || activeSession?.roomId;
      if (currentRoomId) {
        socket.emit('game:requestSnapshot', { roomId: currentRoomId, userId });
      }
    };
    socket.on('connect', handleConnect);

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
    socket.on('room:joined', (data: { room: RoomState; remainingSeconds?: number; elapsedSeconds?: number; isUnlimited?: boolean; countdownRemaining?: number | null }) => {
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

      if ((data.room.status === 'PLAYING' || data.room.status === 'COUNTDOWN') && data.room.currentMatch) {
        setMatch(data.room.currentMatch);
        if (data.elapsedSeconds !== undefined) {
          setServerElapsedSeconds(data.elapsedSeconds);
        }
        if (data.remainingSeconds !== undefined) {
          setServerRemainingSeconds(data.remainingSeconds);
        } else if (data.room.currentMatch.endsAt) {
          const isUnlimited = (data.room.currentMatch.settings?.durationSeconds ?? 0) <= 0;
          setServerRemainingSeconds(isUnlimited ? 0 : Math.max(0, Math.ceil((data.room.currentMatch.endsAt - Date.now()) / 1000)));
        }

        if (data.room.status === 'COUNTDOWN') {
          const cd = data.countdownRemaining ?? Math.max(0, Math.ceil((data.room.currentMatch.countdownEndsAt - Date.now()) / 1000));
          setCountdownRemaining(cd);
        } else {
          setCountdownRemaining(null);
        }
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

    // C2. Player Reconnected
    socket.on('room:playerReconnected', (data: { playerId: string; displayName?: string }) => {
      setRoom((prev) => {
        if (!prev || !prev.players[data.playerId]) return prev;
        return {
          ...prev,
          players: {
            ...prev.players,
            [data.playerId]: {
              ...prev.players[data.playerId],
              isConnected: true,
            },
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
    socket.on('game:countdown', (data: any) => {
      setCountdownRemaining(data.countdownSeconds);
      if (data.shuffledGrid && data.matchId) {
        setMatch({
          id: data.matchId,
          roomId: roomRef.current?.id || '',
          status: 'COUNTDOWN',
          settings: roomRef.current?.settings || ({} as any),
          shuffledGrid: data.shuffledGrid,
          currentTarget: data.currentTarget,
          maxTarget: data.maxTarget,
          startedAt: data.countdownEndsAt || Date.now() + data.countdownSeconds * 1000,
          countdownEndsAt: data.countdownEndsAt || Date.now() + data.countdownSeconds * 1000,
          endsAt: (data.countdownEndsAt || Date.now()) + (data.durationSeconds || 180) * 1000,
          claims: [],
          claimedMap: {},
          playerStats: {},
          lastClaimTimestamp: Date.now(),
        });
      }
      setScreen('GAME');
    });

    socket.on('game:countdownTick', (data: { remaining: number }) => {
      setCountdownRemaining(data.remaining);
    });

    // H. Game Started
    socket.on('game:started', (data: any) => {
      setCountdownRemaining(0); // Show GO!
      setTimeout(() => {
        setCountdownRemaining(null);
      }, 700);

      setServerRemainingSeconds(data.durationSeconds);

      setMatch((prev) => ({
        id: data.matchId,
        roomId: roomRef.current?.id || prev?.roomId || '',
        status: 'RUNNING',
        settings: roomRef.current?.settings || prev?.settings || ({} as any),
        shuffledGrid: data.shuffledGrid || prev?.shuffledGrid || [],
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
            updatedPlayers[pid] = { ...updatedPlayers[pid], score };
          }
        });
        return { ...prev, players: updatedPlayers };
      });
    });

    // J. Wrong Claim rejection - auto-syncs target and claimedMap if desynchronized
    socket.on('game:claimRejected', (data: any) => {
      soundManager.playWrong();
      if (data?.currentTarget) {
        setMatch((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            currentTarget: data.currentTarget,
            claimedMap: data.claimedMap ? { ...prev.claimedMap, ...data.claimedMap } : prev.claimedMap,
          };
        });
      }
    });

    // K. Timer Updates from authoritative server
    socket.on('game:timerUpdated', (data: { remainingSeconds: number; elapsedSeconds?: number; isUnlimited?: boolean }) => {
      setServerRemainingSeconds(data.remainingSeconds);
      if (data.elapsedSeconds !== undefined) {
        setServerElapsedSeconds(data.elapsedSeconds);
      }
    });

    // L. Game Finished
    socket.on('game:finished', (data: { results: MatchResults }) => {
      setResults(data.results);
      setCountdownRemaining(null);
      setScreen('RESULTS');

      // Instantly record persistent local career stats
      const myRanking = data.results.rankings.find((r) => r.playerId === userId);
      const won = data.results.winner?.playerId === userId && !data.results.isTie;
      if (myRanking) {
        playerStatsService.recordMatchResult({
          userId,
          displayName,
          score: myRanking.score,
          won,
          accuracy: myRanking.accuracy,
          avgReactionTimeMs: myRanking.avgReactionTimeMs,
          gameMode: data.results.gameMode,
          matchId: data.results.matchId,
        });
      }

      api.getProfile(userId);
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
      setIsLoading(false);
      if (data.success && data.room) {
        setRoom(data.room);
        if (data.currentMatch && (data.currentMatch.status === 'RUNNING' || data.room.status === 'PLAYING')) {
          setMatch(data.currentMatch);
          if (data.elapsedSeconds !== undefined) {
            setServerElapsedSeconds(data.elapsedSeconds);
          }
          const isUnlimited = (data.currentMatch.settings?.durationSeconds ?? data.room.settings?.durationSeconds ?? 0) <= 0;
          const remaining = data.remainingSeconds !== undefined
            ? data.remainingSeconds
            : (isUnlimited ? 0 : Math.max(0, Math.ceil((data.currentMatch.endsAt - Date.now()) / 1000)));
          setServerRemainingSeconds(remaining);
          setCountdownRemaining(null);
          setScreen('GAME');
        } else if (data.currentMatch && data.room.status === 'COUNTDOWN') {
          setMatch(data.currentMatch);
          const cd = data.countdownRemaining !== undefined
            ? data.countdownRemaining
            : Math.max(0, Math.ceil((data.currentMatch.countdownEndsAt - Date.now()) / 1000));
          setCountdownRemaining(cd);
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
      socket.off('connect', handleConnect);
      socket.off('room:created');
      socket.off('room:joined');
      socket.off('room:playerJoined');
      socket.off('room:playerReconnected');
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
  }, [userId, displayName]);

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

  const handleJoinRoom = (roomCode: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    const socket = socketService.getSocket();
    socket.emit('room:join', {
      roomCode,
      displayName,
      userId,
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

  // Smooth local timer while match is RUNNING
  useEffect(() => {
    if (screen !== 'GAME' || match?.status !== 'RUNNING' || countdownRemaining !== null) return;
    const isUnlimited = !match.settings.durationSeconds || match.settings.durationSeconds <= 0;
    const timer = setInterval(() => {
      if (isUnlimited) {
        setServerElapsedSeconds((prev) => prev + 1);
      } else {
        setServerRemainingSeconds((prev) => Math.max(0, prev - 1));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [screen, match?.status, match?.settings.durationSeconds, countdownRemaining]);

  const handleClaimNumber = useCallback(
    (number: number) => {
      const curRoom = roomRef.current;
      const curMatch = matchRef.current;
      if (!curRoom || !curMatch || curMatch.status !== 'RUNNING') return;
      const socket = socketService.getSocket();
      const actionId = `act_${userId}_${number}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      socket.emit(
        'game:claimNumber',
        {
          roomId: curRoom.id,
          matchId: curMatch.id,
          number,
          actionId,
          userId,
          clientTimestamp: Date.now(),
        },
        (res: any) => {
          if (res && !res.success) {
            console.warn('[Claim] Server rejected claim:', res.reason);
          }
        }
      );
    },
    [userId]
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
      {/* 0. Initial App Launch Landing / Loading Screen */}
      {isAppLoading && (
        <LoadingScreen onLoaded={() => setIsAppLoading(false)} />
      )}

      {/* Global Header (Only on menu/lobby screens, hidden during GAME for full-screen immersion) */}
      {screen !== 'GAME' && (
        <Header
          currentScreen={screen}
          setScreen={setScreen}
          playerDisplayName={displayName}
          onOpenProfile={() => setIsProfileOpen(true)}
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
            onOpenPractice={() => setIsSoloSetupOpen(true)}
            onStartSoloGame={handleStartSolo}
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
          <PracticeScreen
            config={soloConfig}
            userId={userId}
            displayName={displayName}
            onBack={() => setScreen('HOME')}
            onChangeSettings={() => {
              setScreen('HOME');
              setIsSoloSetupOpen(true);
            }}
          />
        )}
      </main>

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

      {isSoloSetupOpen && (
        <SoloSetupModal
          onClose={() => setIsSoloSetupOpen(false)}
          onStartGame={handleStartSolo}
        />
      )}

      {/* Welcome Name Setup Modal for First Time Users */}
      {!isAppLoading && isNameModalOpen && (
        <WelcomeNameModal onSaveName={handleSaveInitialName} />
      )}
    </div>
  );
};

export default App;
