import { writable } from 'svelte/store';
import { browser } from '$app/environment';

interface Settings {
	pomodoroDuration: number;
	breakDuration: number;
	longBreakDuration: number;
	longBreakInterval: number;
	soundEnabled: boolean;
	soundVolume: number;
	notificationsEnabled: boolean;
}

const defaults: Settings = {
	pomodoroDuration: 25,
	breakDuration: 5,
	longBreakDuration: 15,
	longBreakInterval: 4,
	soundEnabled: true,
	soundVolume: 30,
	notificationsEnabled: false
};

const stored = browser ? localStorage.getItem('pomodoro-settings') : null;
const initial = stored ? { ...defaults, ...JSON.parse(stored) } : defaults;

export const settings = writable<Settings>(initial);

if (browser) {
	settings.subscribe((value) => localStorage.setItem('pomodoro-settings', JSON.stringify(value)));
}
