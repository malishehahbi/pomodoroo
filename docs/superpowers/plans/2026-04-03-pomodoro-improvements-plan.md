# Pomodoro Timer Improvements Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the existing Pomodoro app with enhanced UI/UX, persistence, notifications, statistics, and full accessibility.

**Architecture:** Svelte 5 stores with localStorage sync. Components split into focused files. Progress ring SVG for visual countdown. Accessible timer with ARIA live regions.

**Tech Stack:** Svelte 5, shadcn-svelte components, localStorage, Web Notifications API

---

## File Structure

```
src/lib/
├── stores/
│   ├── timer.ts      # Timer state, interval logic, persistence
│   ├── tasks.ts      # Task list with persistence
│   ├── settings.ts   # User preferences with persistence
│   └── stats.ts      # Statistics tracking with persistence
├── components/
│   ├── ProgressRing.svelte  # SVG circular progress indicator
│   ├── StatsBadge.svelte    # Today's/weekly counts display
│   ├── ModeIndicator.svelte # Visual mode with color transitions
│   └── KeyboardHint.svelte  # Keyboard shortcut hint
└── utils.ts          # Existing utilities
src/routes/
├── +page.svelte     # Main timer page (refactored)
└── +layout.svelte   # Layout (add skip link)
```

---

## Chunk 1: Core Stores (Timer, Tasks, Settings, Stats)

**Files:**

- Create: `src/lib/stores/timer.ts`
- Create: `src/lib/stores/tasks.ts`
- Create: `src/lib/stores/settings.ts`
- Create: `src/lib/stores/stats.ts`

### Task 1: Timer Store

- [ ] **Step 1: Create timer store with persistence**

```typescript
// src/lib/stores/timer.ts
import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';

interface TimerState {
	time: number;
	isRunning: boolean;
	isBreak: boolean;
	pomodoroCount: number;
	intervalId: ReturnType<typeof setInterval> | null;
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
			pomodoroCount: 0,
			intervalId: null
		};

function createTimerStore() {
	const { subscribe, set, update } = writable<TimerState>(initial);

	return {
		subscribe,
		start: () => update((s) => ({ ...s, isRunning: true })),
		pause: () => update((s) => ({ ...s, isRunning: false })),
		tick: () => update((s) => ({ ...s, time: Math.max(0, s.time - 1) })),
		setTime: (time: number) => update((s) => ({ ...s, time })),
		toggleMode: () =>
			update((s) => ({
				...s,
				isBreak: !s.isBreak,
				time: s.isBreak ? DEFAULT_POMODORO : DEFAULT_BREAK
			})),
		incrementPomodoro: () => update((s) => ({ ...s, pomodoroCount: s.pomodoroCount + 1 })),
		reset: () =>
			set({
				time: DEFAULT_POMODORO,
				isRunning: false,
				isBreak: false,
				pomodoroCount: 0,
				intervalId: null
			}),
		setBreak: (duration: number) => update((s) => ({ ...s, isBreak: true, time: duration * 60 })),
		setWork: (duration: number) => update((s) => ({ ...s, isBreak: false, time: duration * 60 }))
	};
}

export const timer = createTimerStore();
export const formattedTime = derived(timer, ($timer) => {
	const minutes = Math.floor($timer.time / 60);
	const seconds = $timer.time % 60;
	return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
});

// Persistence
if (browser) {
	timer.subscribe((value) => {
		const { intervalId, ...toSave } = value;
		localStorage.setItem('pomodoro-timer', JSON.stringify(toSave));
	});
}
```

### Task 2: Tasks Store

- [ ] **Step 2: Create tasks store with persistence**

```typescript
// src/lib/stores/tasks.ts
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
	let nextId = Math.max(0, ...initial.map((t) => t.id)) + 1;

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
```

### Task 3: Settings Store

- [ ] **Step 3: Create settings store with persistence**

```typescript
// src/lib/stores/settings.ts
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
```

### Task 4: Stats Store

- [ ] **Step 4: Create stats store with persistence**

```typescript
// src/lib/stores/stats.ts
import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

interface Stats {
	[date: string]: number; // date in YYYY-MM-DD format
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
export const todayCount = derived(stats, ($stats) => $stats[getDateKey()] || 0);
export const weekCount = derived(stats, ($stats) => {
	const store = createStatsStore();
	let count = 0;
	const now = new Date();
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
```

- [ ] **Step 5: Create stores index**

```typescript
// src/lib/stores/index.ts
export { timer, formattedTime } from './timer';
export { tasks } from './tasks';
export { settings } from './settings';
export { stats, todayCount, weekCount } from './stats';
```

---

## Chunk 2: UI Components

**Files:**

- Create: `src/lib/components/ProgressRing.svelte`
- Create: `src/lib/components/StatsBadge.svelte`
- Create: `src/lib/components/ModeIndicator.svelte`
- Create: `src/lib/components/KeyboardHint.svelte`

### Task 5: Progress Ring Component

- [ ] **Step 6: Create ProgressRing component**

```svelte
<!-- src/lib/components/ProgressRing.svelte -->
<script lang="ts">
	import { timer } from '$lib/stores';
	import { settings } from '$lib/stores';

	let { size = 280, strokeWidth = 8 } = $props();

	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;

	let progress = $derived.by(() => {
		const $timer = $timer;
		const $settings = $settings;
		const total = $timer.isBreak ? $settings.breakDuration * 60 : $settings.pomodoroDuration * 60;
		return ($timer.time / total) * circumference;
	});

	let prefersReducedMotion = $state(false);

	if (typeof window !== 'undefined') {
		prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}
</script>

<svg width={size} height={size} class="progress-ring" aria-hidden="true">
	<circle
		class="progress-ring-bg"
		stroke="currentColor"
		stroke-width={strokeWidth}
		fill="transparent"
		r={radius}
		cx={size / 2}
		cy={size / 2}
	/>
	<circle
		class="progress-ring-progress"
		class:animate={!prefersReducedMotion}
		stroke="currentColor"
		stroke-width={strokeWidth}
		fill="transparent"
		r={radius}
		cx={size / 2}
		cy={size / 2}
		stroke-dasharray={circumference}
		stroke-dashoffset={circumference - progress}
		stroke-linecap="round"
	/>
</svg>

<style>
	.progress-ring {
		transform: rotate(-90deg);
	}
	.progress-ring-bg {
		opacity: 0.15;
	}
	.progress-ring-progress {
		transition: stroke-dashoffset 0.3s ease;
	}
	.progress-ring-progress.animate {
		transition: stroke-dashoffset 1s linear;
	}
</style>
```

### Task 6: Stats Badge Component

- [ ] **Step 7: Create StatsBadge component**

```svelte
<!-- src/lib/components/StatsBadge.svelte -->
<script lang="ts">
	import { todayCount, weekCount } from '$lib/stores';
</script>

<div class="stats-badge" role="status" aria-label="Statistics">
	<div class="stat">
		<span class="stat-value">{$todayCount}</span>
		<span class="stat-label">Today</span>
	</div>
	<div class="stat-divider"></div>
	<div class="stat">
		<span class="stat-value">{$weekCount}</span>
		<span class="stat-label">This week</span>
	</div>
</div>

<style>
	.stats-badge {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem 1.25rem;
		background: var(--muted);
		border-radius: 0.5rem;
		font-size: 0.875rem;
	}
	.stat {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.125rem;
	}
	.stat-value {
		font-size: 1.25rem;
		font-weight: 600;
	}
	.stat-label {
		font-size: 0.75rem;
		color: var(--muted-foreground);
	}
	.stat-divider {
		width: 1px;
		height: 2rem;
		background: var(--border);
	}
</style>
```

### Task 7: Mode Indicator Component

- [ ] **Step 8: Create ModeIndicator component**

```svelte
<!-- src/lib/components/ModeIndicator.svelte -->
<script lang="ts">
	import { timer } from '$lib/stores';

	let mode = $derived($timer.isBreak ? 'break' : 'work');
</script>

<div
	class="mode-indicator"
	class:break={$timer.isBreak}
	role="status"
	aria-live="polite"
	aria-label={$timer.isBreak ? 'Break mode' : 'Work mode'}
>
	<span class="mode-dot" aria-hidden="true"></span>
	<span class="mode-text">{$timer.isBreak ? 'Break' : 'Work'}</span>
</div>

<style>
	.mode-indicator {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.375rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.875rem;
		font-weight: 500;
		background: rgba(232, 93, 4, 0.1);
		color: #e85d04;
		transition: all 0.3s ease;
	}
	.mode-indicator.break {
		background: rgba(14, 165, 233, 0.1);
		color: #0ea5e9;
	}
	.mode-dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
		background: currentColor;
	}
</style>
```

### Task 8: Keyboard Hint Component

- [ ] **Step 9: Create KeyboardHint component**

```svelte
<!-- src/lib/components/KeyboardHint.svelte -->
<script lang="ts">
	import { timer } from '$lib/stores';
</script>

<div class="keyboard-hint" aria-hidden="true">
	<kbd>Space</kbd>
	<span>to {$timer.isRunning ? 'pause' : 'start'}</span>
</div>

<style>
	.keyboard-hint {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.75rem;
		color: var(--muted-foreground);
	}
	kbd {
		padding: 0.125rem 0.375rem;
		background: var(--muted);
		border: 1px solid var(--border);
		border-radius: 0.25rem;
		font-family: inherit;
		font-size: 0.75rem;
	}
</style>
```

---

## Chunk 3: Main Page Integration

**Files:**

- Modify: `src/routes/+page.svelte`

### Task 9: Refactor Main Page

- [ ] **Step 10: Rewrite main page with stores and components**

```svelte
<!-- src/routes/+page.svelte -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Drawer from '$lib/components/ui/drawer';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Settings, Plus, Trash2, Bell, BellOff, Volume2, VolumeX } from '@lucide/svelte';
	import { Toaster, toast } from '$lib/components/ui/sonner';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { timer, formattedTime, tasks, settings, stats, todayCount, weekCount } from '$lib/stores';
	import ProgressRing from '$lib/components/ProgressRing.svelte';
	import StatsBadge from '$lib/components/StatsBadge.svelte';
	import ModeIndicator from '$lib/components/ModeIndicator.svelte';
	import KeyboardHint from '$lib/components/KeyboardHint.svelte';

	let intervalId: ReturnType<typeof setInterval> | null = null;
	let startSound: HTMLAudioElement;
	let endSound: HTMLAudioElement;
	let newTaskText = $state('');
	let activeTab = $state<'tasks' | 'settings'>('tasks');

	onMount(() => {
		startSound = new Audio('/sounds/start.mp3');
		endSound = new Audio('/sounds/end.mp3');
		startSound.volume = $settings.soundVolume / 100;
		endSound.volume = $settings.soundVolume / 100;

		const handleKey = (e: KeyboardEvent) => {
			if (e.code === 'Space' && e.target === document.body) {
				e.preventDefault();
				$timer.isRunning ? pauseTimer() : startTimer();
			}
		};
		window.addEventListener('keydown', handleKey);
		return () => window.removeEventListener('keydown', handleKey);
	});

	onDestroy(() => {
		if (intervalId) clearInterval(intervalId);
	});

	function startTimer() {
		if ($timer.isRunning) return;
		if ($settings.soundEnabled) startSound?.play();
		timer.start();
		intervalId = setInterval(() => {
			if ($timer.time > 0) {
				timer.tick();
			} else {
				handleTimerComplete();
			}
		}, 1000);
	}

	function pauseTimer() {
		if (intervalId) clearInterval(intervalId);
		intervalId = null;
		timer.pause();
	}

	function handleTimerComplete() {
		if (intervalId) clearInterval(intervalId);
		intervalId = null;

		if ($settings.soundEnabled) endSound?.play();

		if (!$timer.isBreak) {
			stats.increment();
			toast.success('Pomodoro complete! Time for a break.');
		} else {
			toast.success('Break over! Ready to focus?');
		}

		if (
			$settings.notificationsEnabled &&
			'Notification' in window &&
			Notification.permission === 'granted'
		) {
			new Notification($timer.isBreak ? 'Break Over' : 'Pomodoro Complete', {
				body: $timer.isBreak ? 'Ready to focus?' : 'Time for a break!',
				icon: '/favicon.svg'
			});
		}

		if (
			!$timer.isBreak &&
			$timer.pomodoroCount > 0 &&
			$timer.pomodoroCount % $settings.longBreakInterval === 0
		) {
			timer.setBreak($settings.longBreakDuration);
			toast.info(
				`Time for a long break! You've completed ${$settings.longBreakInterval} pomodoros.`
			);
		} else {
			timer.toggleMode();
		}
		timer.pause();
	}

	function resetTimer() {
		pauseTimer();
		timer.reset();
	}

	function addTask() {
		if (newTaskText.trim()) {
			tasks.add(newTaskText);
			newTaskText = '';
		}
	}

	async function requestNotificationPermission() {
		if ('Notification' in window && Notification.permission === 'default') {
			const permission = await Notification.requestPermission();
			settings.update((s) => ({ ...s, notificationsEnabled: permission === 'granted' }));
			toast.info(permission === 'granted' ? 'Notifications enabled!' : 'Notifications disabled');
		}
	}
</script>

<svelte:head>
	<title>{$formattedTime} - Pomodoro Timer</title>
</svelte:head>

<a href="#main-timer" class="skip-link">Skip to timer</a>

<div class="container">
	<header>
		<h1 id="timer-title">Pomodoro Timer</h1>
		<Drawer.Root>
			<Drawer.Trigger asChild let:builder>
				<Button
					variant="outline"
					size="icon"
					builders={[builder]}
					aria-label="Open settings and tasks"
				>
					<Settings class="h-5 w-5" />
				</Button>
			</Drawer.Trigger>
			<Drawer.Content>
				<ScrollArea class="h-[80vh]">
					<div class="mx-auto w-full max-w-sm p-4">
						<Drawer.Header>
							<Drawer.Title>Settings & Tasks</Drawer.Title>
							<Drawer.Description>Customize your timer and manage your tasks</Drawer.Description>
						</Drawer.Header>

						<div class="tabs" role="tablist">
							<button
								role="tab"
								aria-selected={activeTab === 'tasks'}
								class="tab"
								class:active={activeTab === 'tasks'}
								onclick={() => (activeTab = 'tasks')}
							>
								Tasks
							</button>
							<button
								role="tab"
								aria-selected={activeTab === 'settings'}
								class="tab"
								class:active={activeTab === 'settings'}
								onclick={() => (activeTab = 'settings')}
							>
								Settings
							</button>
						</div>

						{#if activeTab === 'tasks'}
							<div class="space-y-4 pt-4">
								<div class="flex gap-2">
									<Input
										placeholder="Add a task..."
										bind:value={newTaskText}
										onkeydown={(e) => e.key === 'Enter' && addTask()}
										aria-label="New task name"
									/>
									<Button onclick={addTask} size="icon" aria-label="Add new task">
										<Plus class="h-4 w-4" />
									</Button>
								</div>
								<div class="max-h-64 space-y-2 overflow-y-auto">
									{#each $tasks as task (task.id)}
										<div class="flex items-center gap-2 rounded border p-2">
											<Checkbox
												checked={task.completed}
												onCheckedChange={() => tasks.toggle(task.id)}
												aria-label={`Mark task "${task.text}" as complete`}
											/>
											<span
												class="flex-1"
												class:line-through={task.completed}
												class:text-muted-foreground={task.completed}
											>
												{task.text}
											</span>
											<Button
												variant="ghost"
												size="icon"
												onclick={() => tasks.delete(task.id)}
												aria-label={`Delete task ${task.text}`}
											>
												<Trash2 class="h-4 w-4" />
											</Button>
										</div>
									{/each}
									{#if $tasks.length === 0}
										<p class="py-4 text-center text-sm text-muted-foreground">
											No tasks yet. Add one above!
										</p>
									{/if}
								</div>
							</div>
						{:else}
							<div class="space-y-4 pt-4">
								<div class="space-y-2">
									<Label for="pomodoro">Pomodoro (minutes)</Label>
									<Input
										id="pomodoro"
										type="number"
										bind:value={$settings.pomodoroDuration}
										min="1"
										max="60"
									/>
								</div>
								<div class="space-y-2">
									<Label for="break">Break (minutes)</Label>
									<Input
										id="break"
										type="number"
										bind:value={$settings.breakDuration}
										min="1"
										max="30"
									/>
								</div>
								<div class="space-y-2">
									<Label for="longBreak">Long Break (minutes)</Label>
									<Input
										id="longBreak"
										type="number"
										bind:value={$settings.longBreakDuration}
										min="10"
										max="60"
									/>
								</div>
								<div class="space-y-2">
									<Label for="interval">Long Break After (pomodoros)</Label>
									<Input
										id="interval"
										type="number"
										bind:value={$settings.longBreakInterval}
										min="2"
										max="10"
									/>
								</div>

								<div class="flex items-center justify-between">
									<Label for="sound">Sound</Label>
									<Button
										variant="ghost"
										size="icon"
										onclick={() =>
											settings.update((s) => ({ ...s, soundEnabled: !s.soundEnabled }))}
										aria-label={$settings.soundEnabled ? 'Disable sound' : 'Enable sound'}
									>
										{#if $settings.soundEnabled}
											<Volume2 class="h-4 w-4" />
										{:else}
											<VolumeX class="h-4 w-4" />
										{/if}
									</Button>
								</div>

								<div class="space-y-2">
									<Label for="volume">Volume: {$settings.soundVolume}%</Label>
									<Input
										id="volume"
										type="range"
										min="0"
										max="100"
										bind:value={$settings.soundVolume}
										class="p-0"
									/>
								</div>

								<div class="flex items-center justify-between">
									<Label for="notifications">Notifications</Label>
									<Button
										variant="outline"
										size="sm"
										onclick={requestNotificationPermission}
										disabled={$settings.notificationsEnabled}
									>
										{#if $settings.notificationsEnabled}
											<Bell class="mr-2 h-4 w-4" />
											Enabled
										{:else}
											<BellOff class="mr-2 h-4 w-4" />
											Enable
										{/if}
									</Button>
								</div>
							</div>
						{/if}

						<Drawer.Footer>
							<Drawer.Close>
								<Button variant="outline">Close</Button>
							</Drawer.Close>
						</Drawer.Footer>
					</div>
				</ScrollArea>
			</Drawer.Content>
		</Drawer.Root>
	</header>

	<main
		id="main-timer"
		class="timer-display"
		role="timer"
		aria-live="polite"
		aria-labelledby="timer-title"
	>
		<div class="timer-ring">
			<ProgressRing />
			<div class="timer-content">
				<ModeIndicator />
				<div class="timer-time" aria-hidden="true">{$formattedTime}</div>
				<div class="sr-only">
					{$Math.floor($timer.time / 60)} minutes {$timer.time % 60} seconds remaining
				</div>
				<KeyboardHint />
			</div>
		</div>

		<div class="timer-controls">
			{#if !$timer.isRunning}
				<Button onclick={startTimer} class="px-6 py-3 text-lg">Start</Button>
			{:else}
				<Button onclick={pauseTimer} variant="secondary" class="px-6 py-3 text-lg">Pause</Button>
			{/if}
			<Button onclick={resetTimer} variant="destructive" class="px-6 py-3 text-lg">Reset</Button>
		</div>

		<div class="pomodoro-progress" aria-label="Pomodoro progress">
			{#each Array($settings.longBreakInterval) as _, i}
				<span
					class="tomato"
					class:completed={i < $timer.pomodoroCount % $settings.longBreakInterval}>🍅</span
				>
			{/each}
		</div>

		<StatsBadge />

		<p class="pomodoro-count">Pomodoros completed: {$timer.pomodoroCount}</p>
	</main>
</div>

<Toaster />

<style>
	.skip-link {
		position: absolute;
		top: -40px;
		left: 0;
		background: var(--primary);
		color: var(--primary-foreground);
		padding: 0.5rem 1rem;
		z-index: 100;
		transition: top 0.2s;
	}
	.skip-link:focus {
		top: 0;
	}
	.container {
		display: flex;
		flex-direction: column;
		align-items: center;
		min-height: 100vh;
		padding: 2rem 1rem;
		background: var(--background);
	}
	header {
		width: 100%;
		max-width: 36rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}
	h1 {
		font-size: 1.5rem;
		font-weight: 700;
	}
	.timer-display {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2rem;
	}
	.timer-ring {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.timer-content {
		position: absolute;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}
	.timer-time {
		font-size: 4rem;
		font-weight: 700;
		font-family: ui-monospace, monospace;
		letter-spacing: -0.05em;
	}
	.timer-controls {
		display: flex;
		gap: 1rem;
	}
	.pomodoro-progress {
		display: flex;
		gap: 0.25rem;
		font-size: 1.5rem;
	}
	.tomato {
		opacity: 0.3;
		transition: opacity 0.3s;
	}
	.tomato.completed {
		opacity: 1;
	}
	.pomodoro-count {
		font-size: 1rem;
		color: var(--muted-foreground);
	}
	.tabs {
		display: flex;
		gap: 0.5rem;
		border-bottom: 1px solid var(--border);
		margin-bottom: 1rem;
	}
	.tab {
		padding: 0.5rem 1rem;
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		color: var(--muted-foreground);
		cursor: pointer;
		transition: all 0.2s;
	}
	.tab.active {
		color: var(--foreground);
		border-bottom-color: var(--primary);
	}
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>
```

### Task 10: Update Layout

- [ ] **Step 11: Add skip link support to layout**

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="description" content="A minimal, beautiful Pomodoro timer" />
</svelte:head>

{@render children()}
```

---

## Chunk 4: Verification

- [ ] **Step 12: Run type check**

```bash
npm run check
```

- [ ] **Step 13: Run build**

```bash
npm run build
```

- [ ] **Step 14: Test in browser**
- Timer starts/pauses/resets
- Mode switches with color change
- Progress ring animates
- Tasks persist after refresh
- Settings persist after refresh
- Stats update correctly
- Keyboard shortcut works
- Accessibility: skip link, ARIA labels, focus states

---

## Notes

- Audio files already exist at `/sounds/start.mp3` and `/sounds/end.mp3`
- Color transitions handled via CSS transitions on mode indicator
- Notification permission requested on first timer start
- Stats auto-calculate weekly count from daily data
