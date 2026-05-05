<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { toast } from 'svelte-sonner';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Drawer from '$lib/components/ui/drawer';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import {
		Settings,
		Plus,
		Trash2,
		Sun,
		Moon,
		Volume2,
		VolumeX,
		Play,
		Pause,
		RotateCcw,
		Coffee,
		Flame,
		Target,

		PlayCircle,

		PlaneLanding,

		SkipForward



	} from '@lucide/svelte';
	import { Toaster } from '$lib/components/ui/sonner';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import {
		timer,
		formattedTime,
		tasks,
		settings,
		stats,
		todayCount,
		weekCount,
		totalCount,
		startTimer as startTimerFn,
		pauseTimer as pauseTimerFn,
		tickTimer,
		toggleTimerMode,
		resetTimer as resetTimerFn,
		setBreakDuration,
		setWorkDuration
	} from '$lib/stores';
	import { mode, toggleMode } from 'mode-watcher';

	let intervalId: ReturnType<typeof setInterval> | null = null;
	let startSound: HTMLAudioElement;
	let pauseSound: HTMLAudioElement;
	let endSound: HTMLAudioElement;
	let newTaskText = $state('');
	let drawerOpen = $state(false);

	onMount(() => {
		startSound = new Audio('/sounds/start.mp3');
		endSound = new Audio('/sounds/end.mp3');
		pauseSound = new Audio('/sounds/pause.mp3');
		updateVolumes();

		const handleKey = (e: KeyboardEvent) => {
			if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

			if (e.code === 'Space') {
				e.preventDefault();
				$timer.isRunning ? pauseTimer() : startTimer();
			} else if (e.code === 'KeyS' && !e.metaKey && !e.ctrlKey) {
				e.preventDefault();
				drawerOpen = !drawerOpen;
			}
		};
		window.addEventListener('keydown', handleKey);
		return () => window.removeEventListener('keydown', handleKey);
	});

	onDestroy(() => {
		if (intervalId) clearInterval(intervalId);
	});

	function updateVolumes() {
		if (startSound && endSound) {
			startSound.volume = $settings.soundVolume / 100;
			endSound.volume = $settings.soundVolume / 100;
		}
	}

	$effect(() => {
		updateVolumes();
	});

	function startTimer() {
		if ($timer.isRunning) return;
		if ($settings.soundEnabled) startSound?.play();
		startTimerFn();
		intervalId = setInterval(() => {
			if ($timer.time > 0) {
				tickTimer();
			} else {
				handleTimerComplete();
			}
		}, 1000);
	}

	function pauseTimer() {
		if (intervalId) clearInterval(intervalId);
		intervalId = null;
		if ($settings.soundEnabled) pauseSound?.play();
		pauseTimerFn();
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
				body: $timer.isBreak ? 'Ready to focus?' : 'Time for a break!'
			});
		}

		if (
			!$timer.isBreak &&
			$timer.pomodoroCount > 0 &&
			$timer.pomodoroCount % $settings.longBreakInterval === 0
		) {
			setBreakDuration($settings.longBreakDuration);
			toast.info(`Time for a long break!`);
		} else {
			toggleTimerMode();
		}
		pauseTimerFn();
	}

	function resetTimer() {
		pauseTimer();
		resetTimerFn($settings.pomodoroDuration);
	}

	function skipBreak() {
		pauseTimer();
		toggleTimerMode();
		setWorkDuration($settings.pomodoroDuration);
		toast.info('Skipped break, starting work session');
	}

	function setShortBreak() {
		pauseTimer();
		setBreakDuration($settings.breakDuration);
		toast.info('Short break activated');
	}

	function setLongBreak() {
		pauseTimer();
		setBreakDuration($settings.longBreakDuration);
		toast.info('Long break activated');
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

	function applySettings() {
		if ($timer.isBreak) {
			setBreakDuration($settings.breakDuration);
		} else {
			setWorkDuration($settings.pomodoroDuration);
		}
		toast.success('Settings applied');
	}

	let progress = $derived.by(() => {
		const total = $timer.isBreak ? $settings.breakDuration * 60 : $settings.pomodoroDuration * 60;
		return ($timer.time / total) * 100;
	});

	let completedTasks = $derived($tasks.filter((t) => t.completed).length);
</script>

<svelte:head>
	<title>{$formattedTime} - Pomodoro</title>
</svelte:head>

<a href="#main-timer" class="skip-link">Skip to timer</a>

<div class="progress-bar" style="width: {progress}%"></div>

<div class="container">
	<header>
		<Button
			variant="ghost"
			size="icon"
			onclick={() => (drawerOpen = true)}
			aria-label="Open settings [S]"
		>
			<Settings class="h-5 w-5" />
		</Button>
		<Button variant="ghost" size="icon" onclick={() => toggleMode()} aria-label="Toggle theme">
			{#if mode.current === 'dark'}
				<Sun class="h-5 w-5" />
			{:else}
				<Moon class="h-5 w-5" />
			{/if}
		</Button>
	</header>

	<div class="content-wrapper">
		<main id="main-timer" role="timer" aria-live="polite">
			<div class="mode-badge" class:break={$timer.isBreak}>
				{$timer.isBreak ? 'Break' : 'Work'}
			</div>

			<div class="timer">{$formattedTime}</div>

			<div class="controls">
				{#if !$timer.isRunning}
					<Button onclick={startTimer} class="btn-primary">
						<Play class="mr-2 h-4 w-4" />Start
					</Button>
				{:else}
					<Button onclick={pauseTimer} class="btn-primary">
						<Pause class="mr-2 h-4 w-4" />Pause
					</Button>
				{/if}
				<Button onclick={resetTimer} class="btn-outline">
					<RotateCcw class="mr-2 h-4 w-4" />Reset
				</Button>
			</div>

			{#if $timer.isBreak}
				<div class="break-controls">
					<Button onclick={skipBreak} class="btn-ghost">
						<SkipForward class="mr-1 h-4 w-4" />Skip
					</Button>
					<Button onclick={setShortBreak} class="btn-ghost">
						<!-- <Coffee class="mr-1 h-4 w-4" /> -->
						Short Break
					</Button>
					<Button onclick={setLongBreak} class="btn-ghost">
						<!-- <Flame class="mr-1 h-4 w-4" /> -->
						Long Break
					</Button>
				</div>
			{/if}
		</main>

		<section class="analytics" aria-label="Statistics">
			<div class="stat-card">
				<!-- <Target class="h-5 w-5" /> -->
				<span class="stat-value">{$todayCount}</span>
				<span class="stat-label">Today</span>
			</div>
			<div class="stat-card">
				<!-- <Flame class="h-5 w-5" /> -->
				<span class="stat-value">{$weekCount}</span>
				<span class="stat-label">This week</span>
			</div>
			<div class="stat-card">
				<!-- <Coffee class="h-5 w-5" /> -->
				<span class="stat-value">{$totalCount}</span>
				<span class="stat-label">All time</span>
			</div>
		</section>

		<section class="tasks-section" aria-label="Tasks">
			<div class="tasks-header">
				<h2>Tasks</h2>
				<span class="tasks-count">{completedTasks}/{$tasks.length}</span>
			</div>

			<div class="tasks-input">
				<Input
					placeholder="Add task..."
					bind:value={newTaskText}
					onkeydown={(e) => e.key === 'Enter' && addTask()}
				/>
				<Button onclick={addTask} size="icon">
					<Plus class="h-4 w-4" />
				</Button>
			</div>

			<ScrollArea class="h-48">
				<div class="tasks-list">
					{#each $tasks as task (task.id)}
						<div class="task-item" class:completed={task.completed}>
							<Checkbox checked={task.completed} onCheckedChange={() => tasks.toggle(task.id)} />
							<span class="task-text">{task.text}</span>
							<Button variant="ghost" size="icon" onclick={() => tasks.delete(task.id)}>
								<Trash2 class="h-4 w-4" />
							</Button>
						</div>
					{/each}
					{#if $tasks.length === 0}
						<p class="no-tasks">No tasks yet</p>
					{/if}
				</div>
			</ScrollArea>
		</section>
	</div>
</div>

<Drawer.Root bind:open={drawerOpen}>
	<Drawer.Content>
		<ScrollArea class="h-[80vh]">
			<div class="mx-auto w-full max-w-sm p-4">
				<Drawer.Header>
					<Drawer.Title>Settings</Drawer.Title>
				</Drawer.Header>

				<div class="space-y-6">
					<div class="space-y-3">
						<Label>Timer (minutes)</Label>
						<div class="grid grid-cols-3 gap-2">
							<div class="space-y-1">
								<Label for="pomodoro" class="text-xs">Work</Label>
								<Input
									id="pomodoro"
									type="number"
									bind:value={$settings.pomodoroDuration}
									min="1"
									max="60"
								/>
							</div>
							<div class="space-y-1">
								<Label for="break" class="text-xs">Break</Label>
								<Input
									id="break"
									type="number"
									bind:value={$settings.breakDuration}
									min="1"
									max="30"
								/>
							</div>
							<div class="space-y-1">
								<Label for="longBreak" class="text-xs">Long</Label>
								<Input
									id="longBreak"
									type="number"
									bind:value={$settings.longBreakDuration}
									min="10"
									max="60"
								/>
							</div>
						</div>
					</div>

					<div class="space-y-2">
						<Label for="interval">Long break after (pomodoros)</Label>
						<Input
							id="interval"
							type="number"
							bind:value={$settings.longBreakInterval}
							min="2"
							max="10"
						/>
					</div>

					<div class="flex items-center justify-between">
						<Label>Sound</Label>
						<Button
							variant="ghost"
							size="icon"
							onclick={() => settings.update((s) => ({ ...s, soundEnabled: !s.soundEnabled }))}
						>
							{#if $settings.soundEnabled}
								<Volume2 class="h-4 w-4" />
							{:else}
								<VolumeX class="h-4 w-4" />
							{/if}
						</Button>
					</div>

					<div class="space-y-2">
						<Label>Volume: {$settings.soundVolume}%</Label>
						<input
							type="range"
							min="0"
							max="100"
							bind:value={$settings.soundVolume}
							class="w-full accent-primary"
						/>
					</div>

					<div class="flex items-center justify-between">
						<Label>Notifications</Label>
						<Button
							variant="outline"
							size="sm"
							onclick={requestNotificationPermission}
							disabled={$settings.notificationsEnabled}
						>
							{$settings.notificationsEnabled ? 'Enabled' : 'Enable'}
						</Button>
					</div>

					<Button onclick={applySettings} class="w-full">Apply</Button>

					<p class="text-center text-xs text-muted-foreground">
						Space = Start/Pause | S = Settings
					</p>
				</div>

				<Drawer.Footer>
					<Drawer.Close>
						<Button variant="outline" class="w-full">Close</Button>
					</Drawer.Close>
				</Drawer.Footer>
			</div>
		</ScrollArea>
	</Drawer.Content>
</Drawer.Root>

<Toaster />

<style>
	.progress-bar {
		position: fixed;
		top: 0;
		left: 0;
		height: 4px;
		background: var(--primary);
		transition: width 1s linear;
		z-index: 50;
	}
	.skip-link {
		position: absolute;
		top: -40px;
		left: 0;
		background: var(--primary);
		color: var(--primary-foreground);
		padding: 0.5rem 1rem;
		z-index: 100;
	}
	.skip-link:focus {
		top: 0;
	}
	.container {
		margin-inline: auto;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		padding: 2rem 1rem;
		gap: 2rem;
	}
	header {
		justify-content: space-between;
		width: 100%;
		max-width: 28rem;
		display: flex;
		gap: 0.5rem;
		z-index: 10;
	}
	.content-wrapper {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2rem;
		width: 100%;
		max-width: 28rem;
	}
	main {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}
	.mode-badge {
		padding: 0.25rem 1rem;
		border-radius: 9999px;
		font-size: 0.875rem;
		font-weight: 500;
		background: rgba(232, 93, 4, 0.15);
		color: #e85d04;
	}
	.mode-badge.break {
		background: rgba(14, 165, 233, 0.15);
		color: #0ea5e9;
	}
	.timer {
		font-size: 5rem;
		font-weight: 700;
		font-family: ui-monospace, monospace;
		letter-spacing: -0.05em;
	}
	.controls {
		display: flex;
		gap: 0.75rem;
	}
	.btn-primary {
		background: var(--primary);
		color: var(--primary-foreground);
		border: none;
		padding: 0.5rem 1.25rem;
		border-radius: 0.5rem;
		font-weight: 500;
		display: flex;
		align-items: center;
		cursor: pointer;
		transition: opacity 0.2s;
	}
	.btn-primary:hover {
		opacity: 0.9;
	}
	.btn-outline {
		background: transparent;
		border: 1px solid var(--border);
		color: var(--foreground);
		padding: 0.5rem 1.25rem;
		border-radius: 0.5rem;
		font-weight: 500;
		display: flex;
		align-items: center;
		cursor: pointer;
		transition: background 0.2s;
	}
	.btn-outline:hover {
		background: var(--muted);
	}
	.btn-ghost {
		background: transparent;
		border: none;
		color: var(--muted-foreground);
		padding: 0.25rem 0.75rem;
		font-size: 0.875rem;
		cursor: pointer;
		transition: color 0.2s;
	}
	.btn-ghost:hover {
		color: var(--foreground);
	}
	.break-controls {
		display: flex;
		gap: 0.5rem;
	}
	.analytics {
		display: flex;
		gap: 1rem;
	}
	.stat-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding: 0.75rem 1rem;
		background: var(--muted);
		border-radius: 0.5rem;
	}
	.stat-value {
		font-size: 1.25rem;
		font-weight: 600;
	}
	.stat-label {
		font-size: 0.75rem;
		color: var(--muted-foreground);
	}
	.tasks-section {
		width: 100%;
		max-width: 400px;
	}
	.tasks-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
	}
	.tasks-header h2 {
		font-size: 1rem;
		font-weight: 600;
	}
	.tasks-count {
		font-size: 0.875rem;
		color: var(--muted-foreground);
	}
	.tasks-input {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}
	.tasks-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.task-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
		border: 1px solid var(--border);
		border-radius: 0.375rem;
	}
	.task-item.completed {
		opacity: 0.6;
	}
	.task-item.completed .task-text {
		text-decoration: line-through;
	}
	.task-text {
		flex: 1;
		font-size: 0.875rem;
	}
	.no-tasks {
		text-align: center;
		color: var(--muted-foreground);
		font-size: 0.875rem;
		padding: 1rem;
	}
</style>
