import { useState } from 'react';
import {
  Folder,
  FileText,
  Plus,
  Trash2,
  Edit3,
  Search,
  Filter,
  X,
  ChevronDown,
  Tag,
  Clock,
  Calendar,
  Check,
} from 'lucide-react';
import { useAppStore } from '@/store';
import type { Document, Folder as FolderType, SortType } from '@/types';

interface DocumentManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DocumentManager({ isOpen, onClose }: DocumentManagerProps) {
  const {
    folders,
    documents,
    filter,
    availableTags,
    currentDocId,
    setFilterKeyword,
    setFilterTag,
    setFilterFolder,
    setFilterDateRange,
    setFilterSortType,
    resetFilter,
    createFolder,
    renameFolder,
    deleteFolder,
    moveDocument,
    addDocumentTag,
    removeDocumentTag,
    switchDocument,
    renameDocument,
    deleteDocument,
    getFilteredDocuments,
  } = useAppStore();

  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [movingDocId, setMovingDocId] = useState<string | null>(null);
  const [tagInputDocId, setTagInputDocId] = useState<string | null>(null);
  const [tagInputValue, setTagInputValue] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');

  const filteredDocs = getFilteredDocuments();

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateForInput = (timestamp: number | null) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toISOString().split('T')[0];
  };

  const handleStartRenameDoc = (doc: Document, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingDocId(doc.id);
    setEditingName(doc.name);
  };

  const handleSaveRenameDoc = (id: string, e: React.FormEvent) => {
    e.preventDefault();
    if (editingName.trim()) {
      renameDocument(id, editingName.trim());
    }
    setEditingDocId(null);
    setEditingName('');
  };

  const handleCancelRenameDoc = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingDocId(null);
    setEditingName('');
  };

  const handleDeleteDoc = (id: string, e: React.MouseEvent) => {
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

  const handleSwitchDoc = (id: string) => {
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

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      createFolder(newFolderName.trim());
      setNewFolderName('');
      setShowNewFolder(false);
    }
  };

  const handleStartRenameFolder = (folder: FolderType, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFolderId(folder.id);
    setEditingFolderName(folder.name);
  };

  const handleSaveRenameFolder = (id: string, e: React.FormEvent) => {
    e.preventDefault();
    if (editingFolderName.trim()) {
      renameFolder(id, editingFolderName.trim());
    }
    setEditingFolderId(null);
    setEditingFolderName('');
  };

  const handleCancelRenameFolder = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFolderId(null);
    setEditingFolderName('');
  };

  const handleDeleteFolder = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const folder = folders.find(f => f.id === id);
    if (confirm(`确定要删除分组"${folder?.name}"吗？该分组下的文档将变为未分组状态。`)) {
      deleteFolder(id);
    }
  };

  const handleMoveDocument = (docId: string, folderId: string | null) => {
    moveDocument(docId, folderId);
    setMovingDocId(null);
  };

  const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      const date = new Date(value);
      date.setHours(0, 0, 0, 0);
      setFilterDateRange(date.getTime(), filter.dateTo);
    } else {
      setFilterDateRange(null, filter.dateTo);
    }
  };

  const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      const date = new Date(value);
      date.setHours(0, 0, 0, 0);
      setFilterDateRange(filter.dateFrom, date.getTime());
    } else {
      setFilterDateRange(filter.dateFrom, null);
    }
  };

  const sortOptions: { value: SortType; label: string; icon: typeof Clock }[] = [
    { value: 'updatedAt', label: '更新时间', icon: Clock },
    { value: 'name', label: '标题', icon: FileText },
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
        className="w-full max-w-[750px] flex flex-col rounded-xl shadow-2xl overflow-hidden"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          height: '70vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-5 py-4 border-b shrink-0"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center gap-2">
            <Folder size={20} style={{ color: 'var(--color-accent)' }} />
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

        <div className="flex flex-1 overflow-hidden">
          <div
            className="w-[180px] border-r flex flex-col shrink-0"
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-bg-tertiary)',
            }}
          >
            <div className="p-3 flex-1 overflow-y-auto">
              <div
                className="text-xs font-medium mb-2"
                style={{ color: 'var(--color-text-muted)' }}
              >
                分组
              </div>

              <button
                onClick={() => setFilterFolder(null)}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 mb-1"
                style={{
                  backgroundColor: filter.folderId === null
                    ? 'var(--color-accent-bg)'
                    : 'transparent',
                  color: filter.folderId === null
                    ? 'var(--color-accent)'
                    : 'var(--color-text-secondary)',
                }}
                onMouseEnter={(e) => {
                  if (filter.folderId !== null) {
                    e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (filter.folderId !== null) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <Folder size={14} />
                <span className="flex-1 text-left truncate">全部文档</span>
              </button>

              <div className="space-y-0.5 mt-1">
                {folders.map((folder) => (
                  <div key={folder.id}>
                    {editingFolderId === folder.id ? (
                      <form
                        onSubmit={(e) => handleSaveRenameFolder(folder.id, e)}
                        className="flex items-center gap-1 px-2 py-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          autoFocus
                          value={editingFolderName}
                          onChange={(e) => setEditingFolderName(e.target.value)}
                          className="flex-1 px-1.5 py-1 rounded text-xs outline-none border"
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
                          onClick={handleCancelRenameFolder}
                        >
                          <X size={12} />
                        </button>
                      </form>
                    ) : (
                      <div
                        className="group flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm cursor-pointer transition-all duration-150"
                        style={{
                          backgroundColor: filter.folderId === folder.id
                            ? 'var(--color-accent-bg)'
                            : 'transparent',
                          color: filter.folderId === folder.id
                            ? 'var(--color-accent)'
                            : 'var(--color-text-secondary)',
                        }}
                        onClick={() => setFilterFolder(folder.id)}
                        onMouseEnter={(e) => {
                          if (filter.folderId !== folder.id) {
                            e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (filter.folderId !== folder.id) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        <Folder size={14} className="shrink-0" />
                        <span className="flex-1 truncate">{folder.name}</span>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button
                            onClick={(e) => handleStartRenameFolder(folder, e)}
                            className="p-0.5 rounded"
                            style={{ color: 'var(--color-text-muted)' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = 'var(--color-accent)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = 'var(--color-text-muted)';
                            }}
                          >
                            <Edit3 size={10} />
                          </button>
                          <button
                            onClick={(e) => handleDeleteFolder(folder.id, e)}
                            className="p-0.5 rounded"
                            style={{ color: 'var(--color-text-muted)' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = '#ef4444';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = 'var(--color-text-muted)';
                            }}
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div
              className="p-3 border-t shrink-0"
              style={{ borderColor: 'var(--color-border)' }}
            >
              {showNewFolder ? (
                <form onSubmit={handleCreateFolder} className="space-y-2">
                  <input
                    autoFocus
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="分组名称"
                    className="w-full px-2 py-1.5 rounded text-sm outline-none border"
                    style={{
                      backgroundColor: 'var(--color-bg-secondary)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-primary)',
                    }}
                  />
                  <div className="flex gap-1">
                    <button
                      type="submit"
                      className="flex-1 px-2 py-1 rounded text-xs font-medium"
                      style={{
                        backgroundColor: 'var(--color-accent)',
                        color: '#ffffff',
                      }}
                    >
                      创建
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewFolder(false);
                        setNewFolderName('');
                      }}
                      className="px-2 py-1 rounded text-xs font-medium"
                      style={{
                        backgroundColor: 'var(--color-bg-hover)',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      取消
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setShowNewFolder(true)}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    color: 'var(--color-text-secondary)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-accent-bg)';
                    e.currentTarget.style.color = 'var(--color-accent)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
                    e.currentTarget.style.color = 'var(--color-text-secondary)';
                  }}
                >
                  <Plus size={14} />
                  新建分组
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            <div
              className="px-4 py-3 border-b space-y-3 shrink-0"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--color-text-muted)' }}
                  />
                  <input
                    type="text"
                    value={filter.keyword}
                    onChange={(e) => setFilterKeyword(e.target.value)}
                    placeholder="搜索文档标题或内容..."
                    className="w-full pl-8 pr-3 py-2 rounded-lg text-sm outline-none border transition-all"
                    style={{
                      backgroundColor: 'var(--color-bg-tertiary)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-primary)',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--color-accent)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'var(--color-border)';
                    }}
                  />
                </div>
                <button
                  onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150"
                  style={{
                    backgroundColor: showAdvancedFilter
                      ? 'var(--color-accent-bg)'
                      : 'var(--color-bg-tertiary)',
                    color: showAdvancedFilter
                      ? 'var(--color-accent)'
                      : 'var(--color-text-secondary)',
                  }}
                  onMouseEnter={(e) => {
                    if (!showAdvancedFilter) {
                      e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!showAdvancedFilter) {
                      e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
                    }
                  }}
                >
                  <Filter size={14} />
                  高级筛选
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${showAdvancedFilter ? 'rotate-180' : ''}`}
                  />
                </button>
              </div>

              {showAdvancedFilter && (
                <div
                  className="p-3 rounded-lg space-y-3"
                  style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Calendar
                        size={14}
                        style={{ color: 'var(--color-text-muted)' }}
                      />
                      <span
                        className="text-xs font-medium"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        时间范围：
                      </span>
                    </div>
                    <input
                      type="date"
                      value={formatDateForInput(filter.dateFrom)}
                      onChange={handleDateFromChange}
                      className="px-2 py-1 rounded text-xs outline-none border"
                      style={{
                        backgroundColor: 'var(--color-bg-secondary)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text-primary)',
                      }}
                    />
                    <span style={{ color: 'var(--color-text-muted)' }}>至</span>
                    <input
                      type="date"
                      value={formatDateForInput(filter.dateTo)}
                      onChange={handleDateToChange}
                      className="px-2 py-1 rounded text-xs outline-none border"
                      style={{
                        backgroundColor: 'var(--color-bg-secondary)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text-primary)',
                      }}
                    />
                    <button
                      onClick={resetFilter}
                      className="ml-auto px-3 py-1 rounded text-xs font-medium transition-colors"
                      style={{
                        backgroundColor: 'var(--color-bg-secondary)',
                        color: 'var(--color-text-secondary)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--color-accent)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--color-text-secondary)';
                      }}
                    >
                      重置筛选
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <Clock size={14} style={{ color: 'var(--color-text-muted)' }} />
                  <span
                    className="text-xs font-medium"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    排序：
                  </span>
                </div>
                <div className="flex gap-1.5">
                  {sortOptions.map((opt) => {
                    const Icon = opt.icon;
                    const active = filter.sortType === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setFilterSortType(opt.value)}
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
                    标签：
                  </span>
                  <button
                    onClick={() => setFilterTag(null)}
                    className="px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-150"
                    style={{
                      backgroundColor: filter.tag === null
                        ? 'var(--color-accent-bg)'
                        : 'var(--color-bg-tertiary)',
                      color: filter.tag === null
                        ? 'var(--color-accent)'
                        : 'var(--color-text-secondary)',
                    }}
                  >
                    全部
                  </button>
                  {availableTags.map((tag) => {
                    const active = filter.tag === tag;
                    return (
                      <button
                        key={tag}
                        onClick={() => setFilterTag(active ? null : tag)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-150"
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
                  <Folder
                    size={40}
                    style={{ color: 'var(--color-text-muted)' }}
                    className="mb-3 opacity-50"
                  />
                  <p
                    className="text-sm"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    没有匹配的文档
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredDocs.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => handleSwitchDoc(doc.id)}
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
                          e.currentTarget.style.backgroundColor =
                            'var(--color-bg-hover)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (doc.id !== currentDocId) {
                          e.currentTarget.style.backgroundColor =
                            'var(--color-bg-tertiary)';
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
                          {editingDocId === doc.id ? (
                            <form
                              onSubmit={(e) => handleSaveRenameDoc(doc.id, e)}
                              className="flex items-center gap-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                autoFocus
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
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
                                onClick={handleCancelRenameDoc}
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
                                className="text-xs mt-0.5 flex items-center gap-1"
                                style={{ color: 'var(--color-text-muted)' }}
                              >
                                <Clock size={10} />
                                更新于 {formatDate(doc.updatedAt)}
                              </div>
                            </>
                          )}

                          {editingDocId !== doc.id && (
                            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                              {doc.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px]"
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
                                    <X size={10} />
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
                                  className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] transition-colors"
                                  style={{
                                    backgroundColor: 'var(--color-bg-secondary)',
                                    color: 'var(--color-text-muted)',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.color =
                                      'var(--color-accent)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.color =
                                      'var(--color-text-muted)';
                                  }}
                                >
                                  <Plus size={10} />
                                  标签
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {editingDocId !== doc.id && tagInputDocId !== doc.id && (
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => handleStartRenameDoc(doc, e)}
                                className="p-1.5 rounded-md transition-colors"
                                style={{ color: 'var(--color-text-muted)' }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor =
                                    'var(--color-bg-hover)';
                                  e.currentTarget.style.color =
                                    'var(--color-accent)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor =
                                    'transparent';
                                  e.currentTarget.style.color =
                                    'var(--color-text-muted)';
                                }}
                              >
                                <Edit3 size={13} />
                              </button>
                              <button
                                onClick={(e) => handleDeleteDoc(doc.id, e)}
                                className="p-1.5 rounded-md transition-colors"
                                style={{ color: 'var(--color-text-muted)' }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor =
                                    'var(--color-bg-hover)';
                                  e.currentTarget.style.color = '#ef4444';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor =
                                    'transparent';
                                  e.currentTarget.style.color =
                                    'var(--color-text-muted)';
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>

                            {movingDocId === doc.id ? (
                              <select
                                value={doc.folderId || ''}
                                onChange={(e) =>
                                  handleMoveDocument(
                                    doc.id,
                                    e.target.value || null
                                  )
                                }
                                onClick={(e) => e.stopPropagation()}
                                onBlur={() => setMovingDocId(null)}
                                className="text-xs px-1.5 py-1 rounded border outline-none"
                                style={{
                                  backgroundColor: 'var(--color-bg-secondary)',
                                  borderColor: 'var(--color-border)',
                                  color: 'var(--color-text-primary)',
                                }}
                                autoFocus
                              >
                                <option value="">无分组</option>
                                {folders.map((folder) => (
                                  <option key={folder.id} value={folder.id}>
                                    {folder.name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMovingDocId(doc.id);
                                }}
                                className="text-[10px] px-2 py-0.5 rounded transition-colors"
                                style={{
                                  backgroundColor: 'var(--color-bg-secondary)',
                                  color: 'var(--color-text-muted)',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.color =
                                    'var(--color-accent)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.color =
                                    'var(--color-text-muted)';
                                }}
                              >
                                移动到分组
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
