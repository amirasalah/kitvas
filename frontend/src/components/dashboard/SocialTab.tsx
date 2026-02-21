'use client'

import { trpc } from '@/app/providers'
import type { Period } from './TimePeriodSelector'

export function SocialTab({ period }: { period: Period }) {
  const { data: redditPosts, isLoading: redditLoading } = trpc.dashboard.redditHot.useQuery({ period })
  const { data: tweets, isLoading: tweetsLoading } = trpc.dashboard.twitterTrending.useQuery({ period })

  const isLoading = redditLoading || tweetsLoading

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-white/40 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-white/40 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Reddit */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-white text-[10px] font-bold">R</span>
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Reddit</h3>
          <span className="text-xs text-gray-400">({(redditPosts || []).length} posts)</span>
        </div>

        {(!redditPosts || redditPosts.length === 0) ? (
          <div className="text-center py-8 text-sm text-gray-400">
            No Reddit posts yet. Set REDDIT_CLIENT_ID/SECRET to enable.
          </div>
        ) : (
          <div className="space-y-2">
            {redditPosts.map((post: any) => (
              <a
                key={post.id}
                href={`https://reddit.com${post.permalink}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 bg-white/50 rounded-lg border border-gray-100 hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0 text-center">
                    <div className="text-sm font-bold text-orange-600">{formatScore(post.score)}</div>
                    <div className="text-[10px] text-gray-400">pts</div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-orange-500 font-medium mb-0.5">
                      r/{post.subreddit}
                    </div>
                    <h4 className="text-sm text-gray-900 line-clamp-2">{post.title}</h4>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                      <span>{post.numComments} comments</span>
                      <span>{timeAgo(post.createdUtc)}</span>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* X/Twitter */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-5 h-5 rounded-full bg-gray-900 flex items-center justify-center text-white text-[10px] font-bold">X</span>
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">X / Twitter</h3>
          <span className="text-xs text-gray-400">({(tweets || []).length} tweets)</span>
        </div>

        {(!tweets || tweets.length === 0) ? (
          <div className="text-center py-8 text-sm text-gray-400">
            No tweets yet. Set X_BEARER_TOKEN to enable.
          </div>
        ) : (
          <div className="space-y-2">
            {tweets.map((tweet: any) => (
              <a
                key={tweet.id}
                href={`https://x.com/${tweet.authorUsername}/status/${tweet.tweetId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 bg-white/50 rounded-lg border border-gray-100 hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0 text-center">
                    <div className="text-sm font-bold text-gray-700">{formatScore(tweet.likeCount)}</div>
                    <div className="text-[10px] text-gray-400">likes</div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-gray-500 font-medium mb-0.5">
                      @{tweet.authorUsername}
                    </div>
                    <p className="text-sm text-gray-900 line-clamp-3">{tweet.text}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span>{tweet.retweetCount} RT</span>
                      <span>{tweet.replyCount} replies</span>
                      <span>{timeAgo(tweet.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function formatScore(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}
