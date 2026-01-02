import type { HistoryState } from './types';
import { CONFIG } from './config';

export class HistoryManager {
	private history: HistoryState[] = [];
	private currentIndex: number = -1;
	private maxHistory: number = CONFIG.MAX_HISTORY;

	saveState(canvasJSON: string): void {
		// Remove any states after current index (when undoing then making new changes)
		this.history = this.history.slice(0, this.currentIndex + 1);

		// Add new state
		this.history.push({
			canvasJSON,
			timestamp: Date.now()
		});

		// Limit history size
		if (this.history.length > this.maxHistory) {
			this.history.shift();
		} else {
			this.currentIndex++;
		}
	}

	undo(): HistoryState | null {
		if (!this.canUndo()) return null;
		this.currentIndex--;
		return this.history[this.currentIndex];
	}

	redo(): HistoryState | null {
		if (!this.canRedo()) return null;
		this.currentIndex++;
		return this.history[this.currentIndex];
	}

	canUndo(): boolean {
		return this.currentIndex > 0;
	}

	canRedo(): boolean {
		return this.currentIndex < this.history.length - 1;
	}

	clear(): void {
		this.history = [];
		this.currentIndex = -1;
	}

	getCurrentState(): HistoryState | null {
		if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
			return this.history[this.currentIndex];
		}
		return null;
	}
}
