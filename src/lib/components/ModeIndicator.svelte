<script lang="ts">
	import { timer } from '$lib/stores';
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
