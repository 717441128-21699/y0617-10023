import { useState } from 'react';
import {
  FileText, Plus, Pencil, Trash2, X, Check, FolderOpen, Tag, SortAsc, Clock, Calendar, Hash, XCircle
} from 'lucide-react';
import { useAppStore } from '@/store';
import type { Document, SortType } from '@/types';

interface DocumentManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DocumentManager({ isOpen, onClose }: DocumentManagerProps) {
  const {
    documents,
    currentDocId,
    switchDocument,
    createDocument,
    renameDocument,
    deleteDocument,
    addDocumentTag,
    removeDocumentTag,
    sortType,
    setSortType,
    filterTag,
    setFilterTag,
    availableTags,
    getFilteredDocuments,
  } = useAppStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [tagInputDocId, setTagInputDocId] = useState<string | null>(null);
  const [tagInputValue, setTagInputValue] = useState('');

  const filteredDocs = getFilteredDocuments();

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

  const handleAddTag = (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTagInputDocId(docId);
    setTagInputValue('');
  };

  const handleSaveTag = (docId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (tagInputValue.trim()) {
      addDocumentTag(docId, tagInputValue.trim());
    }
    setTagInputDocId(null);
    setTagInputValue('');
  };

  const handleCancelTag = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTagInputDocId(null);
    setTagInputValue('');
  };

  const handleRemoveTag = (docId: string, tag: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeDocumentTag(docId, tag);
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

  const sortOptions: { value: SortType; label: string; icon: typeof Hash }[] = [
    { value: 'updatedAt', label: '更新时间', icon: Clock },
    { value: 'name', label: '标题', icon: SortAsc },
    { value: 'createdAt', label: '创建时间', icon: Calendar },
  ];

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
    >
      <div
        className="w-full max-w-[560px] max-h-[85vh] flex flex-col rounded-xl shadow-2xl"
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
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: 'var(--color-accent-bg)',
                color: 'var(--color-accent)',
              }}
            >
              {filteredDocs.length} 篇
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

        <div
          className="px-5 py-3 border-b space-y-3"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center gap-2">
            <SortAsc size={14} style={{ color: 'var(--color-text-muted)' }} />
            <span
              className="text-xs font-medium"
              style={{ color: 'var(--color-text-muted)' }}
            >
              排序：
            </span>
            <div className="flex gap-1.5">
              {sortOptions.map((opt) => {
                const Icon = opt.icon;
                const active = sortType === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setSortType(opt.value)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150"
                    style={{
                      backgroundColor: active
                        ? 'var(--color-accent-bg)'
                        : 'var(--color-bg-tertiary)',
                      color: active
                        ? 'var(--color-accent)'
                        : 'var(--color-text-secondary)',
                    }}
                  >
                    <Icon size={12} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {availableTags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Tag size={14} style={{ color: 'var(--color-text-muted)' }} />
              <span
                className="text-xs font-medium"
                style={{ color: 'var(--color-text-muted)' }}
              >
                标签筛选：
              </span>
              <button
                onClick={() => setFilterTag(null)}
                className="px-2 py-0.5 rounded text-xs transition-all duration-150"
                style={{
                  backgroundColor: filterTag === null
                    ? 'var(--color-accent-bg)'
                    : 'var(--color-bg-tertiary)',
                  color: filterTag === null
                    ? 'var(--color-accent)'
                    : 'var(--color-text-secondary)',
                }}
              >
                全部
              </button>
              {availableTags.map((tag) => {
                const active = filterTag === tag;
                return (
                  <button
                    key={tag}
                    onClick={() => setFilterTag(active ? null : tag)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-all duration-150"
                    style={{
                      backgroundColor: active
                        ? 'var(--color-accent-bg)'
                        : 'var(--color-bg-tertiary)',
                      color: active
                        ? 'var(--color-accent)'
                        : 'var(--color-text-secondary)',
                    }}
                  >
                    <Tag size={10} />
                    {tag}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {filteredDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FolderOpen size={32} style={{ color: 'var(--color-text-muted)' }} className="mb-3 opacity-50" />
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                没有匹配的文档
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => handleSwitch(doc.id)}
                  className="p-3 rounded-lg cursor-pointer transition-all duration-150 border"
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
                  <div className="flex items-start gap-3">
                    <FileText
                      size={18}
                      className="mt-0.5 shrink-0"
                      style={{
                        color:
                          doc.id === currentDocId
                            ? 'var(--color-accent)'
                            : 'var(--color-text-muted)',
                      }}
                    />

                    <div className="flex-1 min-w-0">
                      {editingId === doc.id ? (
                        <form
                          onSubmit={(e) => handleSaveRename(doc.id, e)}
                          className="flex items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
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
                          />
                          <button
                            type="submit"
                            className="p-1 rounded"
                            style={{ color: 'var(--color-accent)' }}
                          >
                            <Check size={14} />
                          </button>
                          <button
                            type="button"
                            className="p-1 rounded"
                            style={{ color: 'var(--color-text-muted)' }}
                            onClick={handleCancelRename}
                          >
                            <X size={14} />
                          </button>
                        </form>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <span
                              className="text-sm font-medium truncate"
                              style={{
                                color:
                                  doc.id === currentDocId
                                    ? 'var(--color-accent)'
                                    : 'var(--color-text-primary)',
                              }}
                            >
                              {doc.name}
                            </span>
                            {doc.id === currentDocId && (
                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0"
                                style={{
                                  backgroundColor: 'var(--color-accent)',
                                  color: '#ffffff',
                                }}
                              >
                                当前
                              </span>
                            )}
                          </div>
                          <div
                            className="text-xs mt-0.5"
                            style={{ color: 'var(--color-text-muted)' }}
                          >
                            更新于 {formatDate(doc.updatedAt)}
                          </div>
                        </>
                      )}

                      {editingId !== doc.id && (
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          {doc.tags.map((tag) => (
                            <span
                              key={tag}
                              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px]"
                              style={{
                                backgroundColor: 'var(--color-bg-secondary)',
                                color: 'var(--color-text-secondary)',
                              }}
                            >
                              <Tag size={9} />
                              {tag}
                              <button
                                onClick={(e) => handleRemoveTag(doc.id, tag, e)}
                                className="ml-0.5 rounded hover:opacity-70"
                              >
                                <XCircle size={10} />
                              </button>
                            </span>
                          ))}

                          {tagInputDocId === doc.id ? (
                            <form
                              onSubmit={(e) => handleSaveTag(doc.id, e)}
                              className="flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                autoFocus
                                value={tagInputValue}
                                onChange={(e) => setTagInputValue(e.target.value)}
                                placeholder="标签名"
                                className="w-20 px-1.5 py-0.5 rounded border text-xs outline-none"
                                style={{
                                  backgroundColor: 'var(--color-bg-secondary)',
                                  borderColor: 'var(--color-border)',
                                  color: 'var(--color-text-primary)',
                                }}
                              />
                              <button
                                type="submit"
                                className="p-0.5 rounded"
                                style={{ color: 'var(--color-accent)' }}
                              >
                                <Check size={12} />
                              </button>
                              <button
                                type="button"
                                className="p-0.5 rounded"
                                style={{ color: 'var(--color-text-muted)' }}
                                onClick={handleCancelTag}
                              >
                                <X size={12} />
                              </button>
                            </form>
                          ) : (
                            <button
                              onClick={(e) => handleAddTag(doc.id, e)}
                              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] transition-colors"
                              style={{
                                backgroundColor: 'var(--color-bg-secondary)',
                                color: 'var(--color-text-muted)',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = 'var(--color-accent)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = 'var(--color-text-muted)';
                              }}
                            >
                              <Plus size={10} />
                              标签
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {editingId !== doc.id && tagInputDocId !== doc.id && (
                      <div className="flex items-center gap-1 shrink-0">
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
                          <Pencil size={13} />
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
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
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
