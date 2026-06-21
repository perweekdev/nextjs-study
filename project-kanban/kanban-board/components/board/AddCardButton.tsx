'use client'

import { useState } from 'react'

type Props = {
  columnId: string
}

export default function AddCardButton({ columnId }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="mt-2">
      {open ? (
        <div className="bg-white border rounded-lg p-2 space-y-2">
          <input
            className="w-full border rounded p-1.5 text-sm"
            placeholder="카드 제목 입력..."
            autoFocus
          />
          <div className="flex gap-2">
            <button className="bg-blue-500 text-white text-xs px-3 py-1 rounded">
              추가
            </button>
            <button
              onClick={() => setOpen(false)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="w-full text-left text-sm text-gray-400 hover:text-gray-700 hover:bg-gray-200 px-2 py-1.5 rounded-lg"
        >
          + 카드 추가
        </button>
      )}
    </div>
  )
}