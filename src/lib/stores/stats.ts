import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

interface Stats {
	[date: string]: number;
}

const stored = browser ? localStorage.getItem('pomodoro-stats') : null;
const initial: Stats = stored ? JSON.parse(stored) : {};

function getDateKey(date: Date = new Date()): string {
	return date.toISOString().split('T')[0];
}

function createStatsStore() {
	const { subscribe, update } = writable<Stats>(initial);

	return {
		subscribe,
		increment: () =>
			update((stats) => {
				const key = getDateKey();
				return { ...stats, [key]: (stats[key] || 0) + 1 };
			}),
		getWeekCount: (stats: Stats): number => {
			const now = new Date();
			let count = 0;
			for (let i = 6; i >= 0; i--) {
				const d = new Date(now);
				d.setDate(d.getDate() - i);
				count += stats[getDateKey(d)] || 0;
			}
			return count;
		}
	};
}

export const stats = createStatsStore();

export const todayCount = derived(stats, ($stats) => {
	const key = getDateKey();
	return $stats[key] || 0;
});

export const weekCount = derived(stats, ($stats) => {
	const now = new Date();
	let count = 0;
	for (let i = 6; i >= 0; i--) {
		const d = new Date(now);
		d.setDate(d.getDate() - i);
		count += $stats[getDateKey(d)] || 0;
	}
	return count;
});

if (browser) {
	stats.subscribe((value) => localStorage.setItem('pomodoro-stats', JSON.stringify(value)));
}
