<script lang="ts">
	import IconLoading from '~icons/eos-icons/bubble-loading'
	import IconThumbsDown from '~icons/uil/thumbs-down'
	import IconThumbsUp from '~icons/uil/thumbs-up'
	import type { PageData } from './$types'
	import showdown from 'showdown'; // showdown imported
	import sanitizeHtml from 'sanitize-html'; //sanitize-html imported
	import { env } from '$env/dynamic/public'


	export let data: PageData

	let searchRef: HTMLInputElement

	type SearchResult = {
		ratedUp: boolean
		ratedDown: boolean
		id: number
	}

	function clear() {
		data.answer = null
		data.results = null
		data.loading = true
	}

	function reset() {
		data.q = ''
		searchRef.focus()
	}

	async function rate(resultId: number, score: number) {
		await fetch('/api/rate', {
			method: 'POST',
			body: JSON.stringify({
				session: data.session,
				result: resultId,
				score: score
			})
		})
	}

	function rateUp(ratedUp: boolean, ratedDown: boolean): [number, boolean, boolean] {
		let score: number
		if (ratedUp) {
			score = -1
			ratedUp = false
		} else if (ratedDown) {
			score = 2
			ratedDown = false
			ratedUp = true
		} else {
			score = 1
			ratedUp = true
		}
		return [score, ratedUp, ratedDown]
	}

	function rateDown(ratedUp: boolean, ratedDown: boolean): [number, boolean, boolean] {
		let score: number
		if (ratedDown) {
			score = 1
			ratedDown = false
		} else if (ratedUp) {
			score = -2
			ratedUp = false
			ratedDown = true
		} else {
			score = -1
			ratedDown = true
		}
		return [score, ratedUp, ratedDown]
	}

	async function rateUpResult(result: SearchResult) {
		let score: number
		let ratedUp: boolean
		let ratedDown: boolean
		;[score, ratedUp, ratedDown] = rateUp(result.ratedUp, result.ratedDown)
		await rate(result.id, score)
		result.ratedUp = ratedUp
		result.ratedDown = ratedDown
		data.results = data.results
	}

	async function rateDownResult(result: SearchResult) {
		let score: number
		let ratedUp: boolean
		let ratedDown: boolean
		;[score, ratedUp, ratedDown] = rateDown(result.ratedUp, result.ratedDown)
		await rate(result.id, score)
		result.ratedUp = ratedUp
		result.ratedDown = ratedDown
		data.results = data.results
	}

	async function rateUpAnswer() {
		let score: number
		let ratedUp: boolean
		let ratedDown: boolean
		;[score, ratedUp, ratedDown] = rateUp(data.answerRatedUp, data.answerRatedDown)
		await rate(0, score)
		data.answerRatedUp = ratedUp
		data.answerRatedDown = ratedDown
	}

	async function rateDownAnswer() {
		let score: number
		let ratedUp: boolean
		let ratedDown: boolean
		;[score, ratedUp, ratedDown] = rateDown(data.answerRatedUp, data.answerRatedDown)
		await rate(0, score)
		data.answerRatedUp = ratedUp
		data.answerRatedDown = ratedDown
	}


 //converting the markdown to html
	function convertMarkdownToHtml(markdownContent: string) {
    	let converter = new showdown.Converter();
    	let html = converter.makeHtml(markdownContent);
    	return html;
	}

	function sanitizeHtmlContent(htmlContent: string) {
    	let sanitizedHTML = sanitizeHtml(htmlContent);
    	return sanitizedHTML;
	}

	function convertAndSanitize(markdownContent: string) {
		let htmlContent = convertMarkdownToHtml(markdownContent)
		let sanitizedHTML = sanitizeHtmlContent(htmlContent);
		return sanitizedHTML
	}
// adding footnotes
	function addFootnotes(text: string) {
		const regex = /\[\^([^\]]+)\]/g;

		// Use the replace method to replace all matches with the desired format
		const resultString = text.replace(regex,'<a href="#search_result_$1">$1</a> ')
		let sanitizedHTML = sanitizeHtmlContent(resultString);
		return sanitizedHTML		
	}

//removing markdown
	function removeMarkdown(text: string) {
  		const patterns = [
    		/!\[(.*?)]\(.*?\)/g, // Images
    		/\[(.*?)]\(.*?\)/g, // Links
    		/`{1,3}(.*?)`{1,3}/g, // Inline code and code blocks
    		/(?:^|\n) *> *(.*)/g, // Blockquotes
    		/(?:^|\n) *#{1,6} */g, // Headers
    		/(?:^|\n)-{3,}(?:$|\n)/g, // Horizontal rules
    		/(?:^|\n)={3,}(?:$|\n)/g, // Horizontal rules
    		/\n{2,}/g, // Extra newlines
    		/ {2,}/g, // Extra spaces
  		];

		patterns.forEach((pattern) => {
			text = text.replace(pattern, '');
		});

		return text;
	}

	let answer = ""
	let answerKey = ""

	function streamAnswer(key: string) {
		console.log('key=', key);
		answer = "";
		const evtSource = new EventSource( `${env.PUBLIC_SERVER_HOST}/stream_answer?key=${key}`);
		evtSource.onmessage = function(event) {
			answer += event.data;
		}
		evtSource.onerror = function() {
			evtSource.close();
		}
	}

	$: answerKey = data.key
	$: streamAnswer(answerKey);

</script>

<h4 class="header"><a href="/">Scripture Central QA</a></h4>
<form on:submit={clear}>
	<div id="search-wrapper">
		<input
			id="search"
			type="search"
			class={data.loading ? 'loading' : ''}
			placeholder="Ask a question"
			name="q"
			bind:this={searchRef}
			bind:value={data.q}
		/>
		{#if data.q}
			<span tabindex="0" role="button" class="reset" on:keypress={reset} on:click={reset}
				>&nbsp;</span
			>
		{/if}
	</div>
</form>

{#if answer && data && data.results}
	<h4>Computer-generated answer</h4>
	{#if data.results.length > 0} 
	<div class="answer-header">
		<!-- Displays the existing message if search results are available -->
		Computer-generated answers may be incorrect. Please review the results below.
	</div>
	{:else}
		<!-- change the message if no search results are available -->
		<div class="answer-header">
			We were unable to find the answer in our database. Here is what ChatGPT says.
		</div>
{/if}
	<div>{@html addFootnotes(answer)}</div>
	<div>
		<span
			class="rating"
			class:rated-up={data.answerRatedUp}
			title="Good Answer"
			on:keypress={rateUpAnswer}
			on:click={rateUpAnswer}><IconThumbsUp /></span
		>
		<span
			class="rating"
			class:rated-down={data.answerRatedDown}
			title="Needs Work"
			on:keypress={rateDownAnswer}
			on:click={rateDownAnswer}><IconThumbsDown /></span
		>
	</div>
{/if}
{#if data && data.results && data.results.length > 0}
	<h4>Results</h4>
	{#each data.results as result}
		<div class="result">
			{#if result.url} <!--check if the result.url exists-->
			<a id="search_result_{result.index}" href={result.url}>{result.index}. {result.title}</a><br /> <!--display the title and index as an anchor-->
			<a href={result.url} class="url" target="_blank">{result.url}</a><br /> <!-- Display the url as a clickable link -->
			{:else}
			<span id="search_result_{result.index}">{result.index}. {result.title}</span><br /> <!--display the title and index without an anchor-->
			{/if}

			<!--<div class="author-date">{result.author}</div>-->
			<div>{@html convertAndSanitize(removeMarkdown(result.text))}</div> <!--sanitized the html and removed markdown before displaying-->
			<div>
				<span
					class="rating"
					class:rated-up={result.ratedUp}
					title="Relevant"
					on:keypress={() => rateUpResult(result)}
					on:click={() => rateUpResult(result)}><IconThumbsUp /></span 
				>
				<span
					class="rating"
					class:rated-down={result.ratedDown}
					title="Not Relevant"
					on:keypress={() => rateDownResult(result)}
					on:click={() => rateDownResult(result)}><IconThumbsDown /></span
				>
			</div>
		</div>
	{/each}
{/if}
{#if data && data.loading}
	<p>
		<IconLoading /> &nbsp; Please wait
	</p>
{/if}


<style>
	
	.answer-header {
		margin-top: -2rem;
		margin-bottom: 2rem;
		font-size: smaller;
	}
	.result {
		margin-bottom: 1rem;
	}

	#search-wrapper {
		position: relative;
	} 

	#search-wrapper .reset {
		position: absolute;
		right: 1em;
		padding: var(--form-element-spacing-vertical) var(--form-element-spacing-horizontal);
		background-image: var(--icon-close);
		background-position: center left 1.125rem;
		background-size: 1rem auto;
		background-repeat: no-repeat;
		opacity: 0.5;
		cursor: pointer;
		background-color: inherit;
		border: inherit;
	}

	#search {
		display: inline-block;
		width: 100%;
	}

	.loading {
		opacity: 0.5;
	}

	.rating {
		cursor: pointer;
	}
	.rated-up {
		color: rgb(0, 224, 0);
	}
	.rated-down {
		color: red;
	}

	.url {
		font-size: smaller;
	}
</style>
