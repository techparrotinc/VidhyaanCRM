'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'

export interface ManualItem {
  id: string
  name: string
  amount: number
  quantity: number
}

type ManualItemsEditorProps = {
  items: ManualItem[]
  onAdd: (item: ManualItem) => void
  onRemove: (id: string) => void
}

export default function ManualItemsEditor({ items, onAdd, onRemove }: ManualItemsEditorProps) {
  const [newItemName, setNewItemName] = useState('')
  const [newItemAmount, setNewItemAmount] = useState('')

  const handleAdd = () => {
    if (!newItemName.trim() || !newItemAmount || isNaN(Number(newItemAmount))) return
    onAdd({
      id: Date.now().toString(),
      name: newItemName.trim(),
      amount: Number(newItemAmount),
      quantity: 1
    })
    setNewItemName('')
    setNewItemAmount('')
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Invoice Items <span className="text-red-500">*</span>
        </label>
        <span className="text-xs text-slate-400">
          {items.length} item{items.length !== 1 ? 's' : ''} added
        </span>
      </div>

      {/* List of Manual Items */}
      {items.length > 0 && (
        <div className="flex flex-col gap-2">
          {items.map(item => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                <p className="text-xs text-slate-400">₹{item.amount.toLocaleString('en-IN')}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <p className="text-sm font-bold text-slate-900">
                  ₹{item.amount.toLocaleString('en-IN')}
                </p>
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Manual Item Inputs */}
      <div className="border border-dashed border-slate-300 rounded-xl p-3">
        <div className="flex items-center gap-2">
          {/* Item name — flex-1 */}
          <input
            type="text"
            placeholder="Item name e.g. Book Set"
            value={newItemName}
            onChange={e => setNewItemName(e.target.value)}
            className="flex-1 min-w-0 h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />

          {/* Amount — fixed width */}
          <div className="relative flex-shrink-0 w-28">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none select-none">₹</span>
            <input
              type="number"
              placeholder="Amount"
              value={newItemAmount}
              onChange={e => setNewItemAmount(e.target.value)}
              min={0}
              className="w-full h-9 pl-7 pr-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          {/* Add button — icon + label */}
          <button
            type="button"
            onClick={handleAdd}
            disabled={!newItemName.trim() || !newItemAmount}
            className="h-9 px-3 flex items-center gap-1 text-sm font-medium border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0 bg-white"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
