<script lang="ts">
	import IconLoading from '~icons/eos-icons/bubble-loading'

	let loading = false

	function clear() {
		loading = true
	}
</script>

<h1 class="header">Scripture Central Question-Answering Demo</h1>
<p class="subheader">
	This is a demonstration of a Question-Answering system for Scripture Central.
</p>
<form action="/search" on:submit={clear}>
	<input type="search" class={loading ? 'loading' : ''} placeholder="Ask a question" name="q" />
</form>

{#if loading}
	<p>
		<IconLoading /> &nbsp; Please wait
	</p>
{/if}

<style>
	.subheader {
		margin-bottom: 3rem;
	}

	.loading {
		opacity: 0.5;
	}
</style>
