import { writable } from 'svelte/store';
import { browser } from '$app/environment';

interface Task {
	id: number;
	text: string;
	completed: boolean;
}

const stored = browser ? localStorage.getItem('pomodoro-tasks') : null;
const initial: Task[] = stored ? JSON.parse(stored) : [];

function createTasksStore() {
	const { subscribe, update } = writable<Task[]>(initial);
	let nextId = Math.max(0, ...initial.map((t) => t.id), 0) + 1;

	return {
		subscribe,
		add: (text: string) => update((tasks) => [...tasks, { id: nextId++, text, completed: false }]),
		toggle: (id: number) =>
			update((tasks) => tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))),
		delete: (id: number) => update((tasks) => tasks.filter((t) => t.id !== id)),
		clear: () => update(() => [])
	};
}

export const tasks = createTasksStore();

if (browser) {
	tasks.subscribe((value) => localStorage.setItem('pomodoro-tasks', JSON.stringify(value)));
}
