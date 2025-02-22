import type { PageServerLoad } from './$types'
import { dev, building } from '$app/environment'
import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'
import { env } from '$env/dynamic/private'
import { error } from '@sveltejs/kit'
import { getUserId } from '$lib/server/utils'

let redis: Redis
let ratelimit: Ratelimit

if (!building) { 
	redis = new Redis({
		url: env.UPSTASH_REDIS_REST_URL,
		token: env.UPSTASH_REDIS_REST_TOKEN
	})

	ratelimit = new Ratelimit({
		redis,
		limiter: Ratelimit.slidingWindow(100, '86400 s')
	})
}

export const load: PageServerLoad = async (event) => {
	const q = event.url.searchParams.get('q')
	console.log('q', q)
	const userId = getUserId(event)

	if (!q) {
		return { q: null, results: null, loading: false }
	}

	if (!dev) {
		// rate limit
		const rateLimitAttempt = await ratelimit.limit(userId.toString())
		if (!rateLimitAttempt.success) {
			//   const timeRemaining = Math.floor(
			//     (rateLimitAttempt.reset - new Date().getTime()) / 1000
			//   );
			throw error(
				429,
				`
          Too many requests. 
          Generating answers is somewhat expensive so we set a limit of 100 queries per day.
          Please try again after this time tomorrow.
      `
			)
		}
	}

	const requestUrl = `${env.SERVER_HOST}/search_results?q=${encodeURIComponent(q)}`
	try {
		const response = await event.fetch(requestUrl)
		if (response.ok) {
			return response.json();
		} else {
			console.log('Error:', requestUrl, response.status);
		}
	} catch (error) {
		console.error('Fetch error:', requestUrl, error);
	}
}
