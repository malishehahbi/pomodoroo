<script lang="ts">
	import { timer, settings } from '$lib/stores';

	let { size = 280, strokeWidth = 8 } = $props();

	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;

	let progress = $derived.by(() => {
		const currentTimer = $timer;
		const currentSettings = $settings;
		const total = currentTimer.isBreak
			? currentSettings.breakDuration * 60
			: currentSettings.pomodoroDuration * 60;
		return (currentTimer.time / total) * circumference;
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
