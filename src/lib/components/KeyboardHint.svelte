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
