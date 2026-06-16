import { useState } from 'react';
import {
  FileText, Plus, Pencil, Trash2, X, Check, ChevronDown, FolderOpen } from 'lucide-react';
import { useAppStore } from '@/store';
import type { Document } from '@/types';

interface DocumentManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DocumentManager({ isOpen, onClose }: DocumentManagerProps) {
  const { documents, currentDocId, switchDocument, createDocument, renameDocument, deleteDocument } = useAppStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleStartRename = (doc: Document, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(doc.id);
    setEditName(doc.name);
  };

  const handleSaveRename = (id: string, e: React.FormEvent) => {
    e.preventDefault();
    if (editName.trim()) {
      renameDocument(id, editName.trim());
    }
    setEditingId(null);
    setEditName('');
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
    setEditName('');
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (documents.length <= 1) {
      alert('至少需要保留一个文档');
      return;
    }
    const doc = documents.find(d => d.id === id);
    if (confirm(`确定要删除文档"${doc?.name}"吗？`)) {
      deleteDocument(id);
    }
  };

  const handleSwitch = (id: string) => {
    if (id !== currentDocId) {
      switchDocument(id);
      onClose();
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
    >
      <div
        className="w-[480px] max-h-[80vh] flex flex-col rounded-xl shadow-2xl"
        style={{ backgroundColor: 'var(--color-bg-secondary)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center gap-2">
            <FolderOpen size={20} style={{ color: 'var(--color-accent)' }} />
            <span
              className="text-lg font-semibold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              文档管理
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {documents.map((doc) => (
            <div
              key={doc.id}
              onClick={() => handleSwitch(doc.id)}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-150 border ${
                doc.id === currentDocId ? 'border-transparent' : ''
              }`}
              style={{
                backgroundColor: doc.id === currentDocId
                  ? 'var(--color-accent-bg)'
                  : 'var(--color-bg-tertiary)',
                borderColor: doc.id === currentDocId
                  ? 'var(--color-accent)'
                  : 'var(--color-border)',
              }}
              onMouseEnter={(e) => {
                if (doc.id !== currentDocId) {
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (doc.id !== currentDocId) {
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
                }
              }}
            >
              <FileText
                size={18}
                style={{
                  color:
                    doc.id === currentDocId
                      ? 'var(--color-accent)'
                      : 'var(--color-text-muted)',
                }}
              />

              <div className="flex-1 min-w-0">
                {editingId === doc.id ? (
                  <form onSubmit={(e) => handleSaveRename(doc.id, e)} className="flex items-center gap-2">
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 px-2 py-1 rounded border text-sm outline-none"
                      style={{
                        backgroundColor: 'var(--color-bg-secondary)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text-primary)',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button
                      type="submit"
                      className="p-1 rounded"
                      style={{ color: 'var(--color-accent)' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Check size={16} />
                    </button>
                    <button
                      type="button"
                      className="p-1 rounded"
                      style={{ color: 'var(--color-text-muted)' }}
                      onClick={handleCancelRename}
                    >
                      <X size={16} />
                    </button>
                  </form>
                ) : (
                  <>
                    <div
                      className="text-sm font-medium truncate"
                      style={{
                        color:
                          doc.id === currentDocId
                            ? 'var(--color-accent)'
                            : 'var(--color-text-primary)',
                      }}
                    >
                      {doc.name}
                    </div>
                    <div
                      className="text-xs mt-0.5"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      更新于 {formatDate(doc.updatedAt)}
                    </div>
                  </>
                )}
              </div>

              {editingId !== doc.id && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => handleStartRename(doc, e)}
                    className="p-1.5 rounded-md transition-colors"
                    style={{ color: 'var(--color-text-muted)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                      e.currentTarget.style.color = 'var(--color-accent)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--color-text-muted)';
                    }}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={(e) => handleDelete(doc.id, e)}
                    className="p-1.5 rounded-md transition-colors"
                    style={{ color: 'var(--color-text-muted)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                      e.currentTarget.style.color = '#ef4444';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--color-text-muted)';
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
          </div>
        </div>

        <div
          className="px-5 py-4 border-t"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <button
            onClick={createDocument}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200"
            style={{
              backgroundColor: 'var(--color-accent)',
              color: '#ffffff',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-accent-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-accent)';
            }}
          >
            <Plus size={16} />
            新建文档
          </button>
        </div>
      </div>
    </div>
  );
}
