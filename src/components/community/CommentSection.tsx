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
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')

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
    if (!currentUserId) return

    setActionError('')
    setActionLoadingId(commentId)
    const supabase = createClient()
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('author_id', currentUserId)

    if (!error) {
      setComments((prev) => prev.filter((c) => c.id !== commentId))
      if (editingId === commentId) {
        setEditingId(null)
        setEditingContent('')
      }
    } else {
      setActionError('댓글 삭제에 실패했습니다.')
    }

    setActionLoadingId(null)
  }

  const startEdit = (comment: CommentWithProfile) => {
    setActionError('')
    setEditingId(comment.id)
    setEditingContent(comment.content)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingContent('')
  }

  const handleEditSave = async (commentId: string) => {
    if (!currentUserId) return

    const nextContent = editingContent.trim()
    if (!nextContent) {
      setActionError('수정할 내용을 입력해주세요.')
      return
    }

    setActionError('')
    setActionLoadingId(commentId)

    const supabase = createClient()
    const { data, error } = await supabase
      .from('comments')
      .update({ content: nextContent })
      .eq('id', commentId)
      .eq('author_id', currentUserId)
      .select('id, content')
      .single()

    if (error || !data) {
      setActionError('댓글 수정에 실패했습니다.')
      setActionLoadingId(null)
      return
    }

    setComments((prev) =>
      prev.map((comment) =>
        comment.id === commentId
          ? {
              ...comment,
              content: data.content,
            }
          : comment
      )
    )

    setEditingId(null)
    setEditingContent('')
    setActionLoadingId(null)
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
                  {comment.profiles?.username ? (
                    <Link
                      href={`/u/${encodeURIComponent(comment.profiles.username)}`}
                      className="text-xs font-medium hover:underline"
                      style={{ color: '#C9A227' }}
                    >
                      {comment.profiles.display_name ?? comment.profiles.username}
                    </Link>
                  ) : (
                    <span className="text-xs font-medium" style={{ color: '#C9A227' }}>
                      {comment.profiles?.display_name ?? '알 수 없음'}
                    </span>
                  )}
                  <span className="text-xs" style={{ color: 'var(--foreground)', opacity: 0.3 }}>
                    {new Date(comment.created_at).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul',  month: 'short', day: 'numeric' })}
                  </span>
                </div>
                {editingId === comment.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      className="glass-input w-full px-3 py-2 text-sm"
                      style={{ color: 'var(--foreground)' }}
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditSave(comment.id)}
                        disabled={actionLoadingId === comment.id}
                        className="text-xs px-2.5 py-1 rounded-md border disabled:opacity-50"
                        style={{ color: '#C9A227', borderColor: 'rgba(201,162,39,0.35)' }}
                      >
                        저장
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        disabled={actionLoadingId === comment.id}
                        className="text-xs px-2.5 py-1 rounded-md border disabled:opacity-50"
                        style={{ color: 'var(--foreground)', opacity: 0.65, borderColor: 'rgba(255,255,255,0.2)' }}
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.75 }}>
                    {comment.content}
                  </p>
                )}
              </div>
              {currentUserId === comment.author_id && (
                <div className="flex items-center gap-2 shrink-0 mt-0.5">
                  {editingId !== comment.id && (
                    <button
                      type="button"
                      onClick={() => startEdit(comment)}
                      className="text-xs"
                      style={{ color: '#C9A227', opacity: 0.85 }}
                    >
                      수정
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(comment.id)}
                    disabled={actionLoadingId === comment.id}
                    className="text-xs disabled:opacity-50"
                    style={{ color: 'rgba(239,68,68,0.6)' }}
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {actionError && (
        <p
          role="alert"
          aria-live="polite"
          className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-lg mb-4"
        >
          {actionError}
        </p>
      )}

      {/* 댓글 입력 */}
      {currentUserId ? (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <label htmlFor="new-comment-input" className="sr-only">
            댓글 입력
          </label>
          <input
            id="new-comment-input"
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="댓글을 입력하세요"
            maxLength={500}
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
