export interface SavedSoloGame {
  maxNumber: number;
  gameMode: 'COMPLETE_GRID' | 'TIME_ATTACK';
  timeLimitSeconds: number;
  grid: number[];
  currentTarget: number;
  claimedNumbers: number[];
  elapsedSeconds: number;
  correctClicks: number;
  wrongClicks: number;
  reactionTimes: number[];
  savedAt: number;
}

const STORAGE_KEY = 'numrush_solo_saved_game_v1';

export const soloStorage = {
  getSavedGame(): SavedSoloGame | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return null;
      const parsed: SavedSoloGame = JSON.parse(data);
      // Validate
      if (
        Array.isArray(parsed.grid) &&
        parsed.grid.length > 0 &&
        parsed.currentTarget >= 1 &&
        parsed.currentTarget <= parsed.maxNumber
      ) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  },

  saveGame(game: SavedSoloGame): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
    } catch (e) {
      console.error('Failed to save solo game progress', e);
    }
  },

  clearSavedGame(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear solo game progress', e);
    }
  },
};
