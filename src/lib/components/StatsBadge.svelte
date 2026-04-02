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
