import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';

interface TimerState {
	time: number;
	isRunning: boolean;
	isBreak: boolean;
	pomodoroCount: number;
}

const DEFAULT_POMODORO = 25 * 60;
const DEFAULT_BREAK = 5 * 60;

const stored = browser ? localStorage.getItem('pomodoro-timer') : null;
const initial: TimerState = stored
	? JSON.parse(stored)
	: {
			time: DEFAULT_POMODORO,
			isRunning: false,
			isBreak: false,
			pomodoroCount: 0
		};

export const timer = writable<TimerState>(initial);

timer.subscribe((value) => {
	if (browser) {
		localStorage.setItem('pomodoro-timer', JSON.stringify(value));
	}
});

export const formattedTime = derived(timer, ($timer) => {
	const minutes = Math.floor($timer.time / 60);
	const seconds = $timer.time % 60;
	return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
});

export function startTimer() {
	timer.update((s) => ({ ...s, isRunning: true }));
}

export function pauseTimer() {
	timer.update((s) => ({ ...s, isRunning: false }));
}

export function tickTimer() {
	timer.update((s) => ({ ...s, time: Math.max(0, s.time - 1) }));
}

export function toggleTimerMode() {
	timer.update((s) => ({
		...s,
		isBreak: !s.isBreak,
		time: s.isBreak ? DEFAULT_POMODORO : DEFAULT_BREAK
	}));
}

export function resetTimer() {
	timer.set({ time: DEFAULT_POMODORO, isRunning: false, isBreak: false, pomodoroCount: 0 });
}

export function setBreakDuration(duration: number) {
	timer.update((s) => ({ ...s, isBreak: true, time: duration * 60 }));
}

export function setWorkDuration(duration: number) {
	timer.update((s) => ({ ...s, isBreak: false, time: duration * 60 }));
}

export function incrementPomodoro() {
	timer.update((s) => ({ ...s, pomodoroCount: s.pomodoroCount + 1 }));
}
