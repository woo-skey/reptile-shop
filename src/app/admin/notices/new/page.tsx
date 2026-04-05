import NoticeWriteForm from '@/components/notice/NoticeWriteForm'

export default function NewNoticePage() {
  return (
    <div>
      <h2 className="text-base font-semibold mb-6" style={{ color: 'var(--foreground)' }}>
        공지 작성
      </h2>

      <NoticeWriteForm />
    </div>
  )
}
