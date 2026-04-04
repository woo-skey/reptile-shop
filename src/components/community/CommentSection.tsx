'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Comment, Profile } from '@/types'
import Link from 'next/link'

type CommentWithProfile = Comment & { profiles: Pick<Profile, 'display_name' | 'username'> }

interface Props {
  postId: string
  initialComments: Comment[]
  currentUserId?: string
}

export default function CommentSection({ postId, initialComments, currentUserId }: Props) {
  const [comments, setComments] = useState<CommentWithProfile[]>(
    initialComments as unknown as CommentWithProfile[]
  )
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || !currentUserId) return
    setLoading(true)

    const supabase = createClient()
    const { data: profileData } = await supabase
      .from('profiles')
      .select('display_name, username')
      .eq('id', currentUserId)
      .single()

    const { data, error } = await supabase
      .from('comments')
      .insert({ post_id: postId, author_id: currentUserId, content: content.trim() })
      .select()
      .single()

    if (!error && data) {
      // 로컬 state 즉시 업데이트
      setComments((prev) => [
        ...prev,
        {
          ...(data as Comment),
          profiles: profileData as Pick<Profile, 'display_name' | 'username'>,
        },
      ])
      setContent('')
    }

    setLoading(false)
  }

  const handleDelete = async (commentId: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('comments').delete().eq('id', commentId)
    if (!error) {
      setComments((prev) => prev.filter((c) => c.id !== commentId))
    }
  }

  return (
    <div className="glass-card px-6 py-6">
      <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
        댓글 <span style={{ color: '#C9A227' }}>{comments.length}</span>
      </h2>

      {/* 댓글 목록 */}
      <div className="space-y-4 mb-6">
        {comments.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: 'var(--foreground)', opacity: 0.35 }}>
            첫 번째 댓글을 남겨보세요.
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium" style={{ color: '#C9A227' }}>
                    {comment.profiles?.display_name}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--foreground)', opacity: 0.3 }}>
                    {new Date(comment.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <p className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.75 }}>
                  {comment.content}
                </p>
              </div>
              {currentUserId === comment.author_id && (
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="text-xs shrink-0 mt-0.5"
                  style={{ color: 'rgba(239,68,68,0.6)' }}
                >
                  삭제
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* 댓글 입력 */}
      {currentUserId ? (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="댓글을 입력하세요"
            className="glass-input flex-1 px-3 py-2 text-sm"
            style={{ color: 'var(--foreground)' }}
          />
          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="px-4 py-2 rounded-lg text-sm disabled:opacity-50 shrink-0"
            style={{ backgroundColor: '#456132', color: '#F5F0E8', border: '1px solid #C9A227' }}
          >
            등록
          </button>
        </form>
      ) : (
        <p className="text-sm text-center py-2" style={{ color: 'var(--foreground)', opacity: 0.4 }}>
          <Link href="/login" style={{ color: '#C9A227' }}>로그인</Link>하면 댓글을 남길 수 있습니다.
        </p>
      )}
    </div>
  )
}
