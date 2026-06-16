import { useState, useMemo, useEffect } from 'react';
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
  CheckSquare,
  Square,
  Archive,
  MoveRight,
  Layers,
  List,
  RefreshCw,
  Check,
  MoreHorizontal,
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
    selectedDocIds,
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
    toggleDocSelection,
    setDocSelected,
    selectAllFilteredDocs,
    clearDocSelection,
    batchAddTags,
    batchRemoveTags,
    batchMoveToFolder,
    batchDelete,
    batchArchiveByDate,
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
  const [batchMode, setBatchMode] = useState(false);
  const [batchMenuOpen, setBatchMenuOpen] = useState(false);
  const [showBatchTagModal, setShowBatchTagModal] = useState(false);
  const [showBatchMoveModal, setShowBatchMoveModal] = useState(false);
  const [batchTagInput, setBatchTagInput] = useState('');
  const [batchFolderId, setBatchFolderId] = useState<string | null>(null);
  const [batchNewFolderName, setBatchNewFolderName] = useState('');
  const [showBatchNewFolder, setShowBatchNewFolder] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    danger?: boolean;
  } | null>(null);

  const filteredDocs = getFilteredDocuments();

  const selectedCount = useMemo(() => selectedDocIds.length, [selectedDocIds]);
  const totalCount = useMemo(() => filteredDocs.length, [filteredDocs]);

  const batchTagPreview = useMemo(() => {
    if (!batchTagInput.trim()) return [];
    return batchTagInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t);
  }, [batchTagInput]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!isOpen && batchMode) {
      clearDocSelection();
      setBatchMode(false);
      setShowBatchTagModal(false);
      setShowBatchMoveModal(false);
    }
  }, [isOpen, batchMode, clearDocSelection]);

  const showToast = (message: string) => {
    setToast(message);
  };

  const handleClose = () => {
    if (batchMode) {
      clearDocSelection();
      setBatchMode(false);
    }
    setShowBatchTagModal(false);
    setShowBatchMoveModal(false);
    onClose();
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
      showToast('至少需要保留一个文档');
      return;
    }
    const doc = documents.find((d) => d.id === id);
    setConfirmDialog({
      title: '删除文档',
      message: `确定要删除文档"${doc?.name}"吗？`,
      danger: true,
      onConfirm: () => {
        deleteDocument(id);
        setConfirmDialog(null);
        showToast('文档已删除');
      },
    });
  };

  const handleSwitchDoc = (id: string) => {
    if (id !== currentDocId) {
      switchDocument(id);
      onClose();
    }
  };

  const handleRowClick = (doc: Document, e: React.MouseEvent) => {
    if (batchMode) {
      if ((e.target as HTMLElement).closest('[data-checkbox-area]')) {
        return;
      }
      handleSwitchDoc(doc.id);
    } else {
      handleSwitchDoc(doc.id);
    }
  };

  const handleCheckboxClick = (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!batchMode) {
      setBatchMode(true);
    }
    toggleDocSelection(docId);
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
    const folder = folders.find((f) => f.id === id);
    setConfirmDialog({
      title: '删除分组',
      message: `确定要删除分组"${folder?.name}"吗？该分组下的文档将变为未分组状态。`,
      danger: true,
      onConfirm: () => {
        deleteFolder(id);
        setConfirmDialog(null);
        showToast('分组已删除');
      },
    });
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

  const handleToggleBatchMode = () => {
    if (batchMode) {
      clearDocSelection();
    }
    setBatchMode(!batchMode);
    setBatchMenuOpen(false);
    setShowBatchTagModal(false);
    setShowBatchMoveModal(false);
  };

  const handleSelectAll = () => {
    selectAllFilteredDocs();
  };

  const handleClearSelection = () => {
    clearDocSelection();
  };

  const handleBatchAddTags = () => {
    setShowBatchTagModal(true);
    setBatchTagInput('');
  };

  const handleConfirmBatchAddTags = () => {
    const tags = batchTagInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t);
    if (tags.length === 0) {
      showToast('请输入至少一个标签');
      return;
    }
    batchAddTags(tags);
    const count = selectedDocIds.length;
    setShowBatchTagModal(false);
    setBatchTagInput('');
    showToast(`成功添加标签到 ${count} 篇文档`);
  };

  const handleBatchRemoveTag = (tag: string) => {
    batchRemoveTags([tag]);
    showToast(`已从选中文档移除标签"${tag}"`);
  };

  const handleBatchMove = () => {
    setShowBatchMoveModal(true);
    setBatchFolderId(null);
    setBatchNewFolderName('');
    setShowBatchNewFolder(false);
  };

  const handleConfirmBatchMove = () => {
    let targetFolderId = batchFolderId;
    if (showBatchNewFolder && batchNewFolderName.trim()) {
      createFolder(batchNewFolderName.trim());
      const newFolder = [...folders].find(
        (f) => f.name === batchNewFolderName.trim()
      );
      if (newFolder) {
        targetFolderId = newFolder.id;
      }
    }
    batchMoveToFolder(targetFolderId);
    const count = selectedDocIds.length;
    setShowBatchMoveModal(false);
    setBatchFolderId(null);
    setBatchNewFolderName('');
    setShowBatchNewFolder(false);
    showToast(`已移动 ${count} 篇文档`);
  };

  const handleBatchArchive = () => {
    if (selectedCount === 0) {
      showToast('请先选择文档');
      return;
    }
    const monthGroups = new Set<string>();
    const selectedDocs = documents.filter((d) => selectedDocIds.includes(d.id));
    for (const doc of selectedDocs) {
      const date = new Date(doc.updatedAt);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      monthGroups.add(`${year}年${month}月`);
    }
    setConfirmDialog({
      title: '按时间归档',
      message: `将把 ${selectedCount} 篇文档按更新时间归档到 ${monthGroups.size} 个月份分组中，是否继续？`,
      onConfirm: () => {
        batchArchiveByDate();
        setConfirmDialog(null);
        showToast(`已归档 ${selectedCount} 篇文档到 ${monthGroups.size} 个分组`);
      },
    });
  };

  const handleBatchDelete = () => {
    if (selectedCount === 0) {
      showToast('请先选择文档');
      return;
    }
    if (documents.length - selectedCount < 1) {
      showToast('至少需要保留一个文档');
      return;
    }
    setConfirmDialog({
      title: '批量删除',
      message: `确定要删除选中的 ${selectedCount} 篇文档吗？此操作不可恢复。`,
      danger: true,
      onConfirm: () => {
        batchDelete();
        setConfirmDialog(null);
        showToast('已删除选中文档');
      },
    });
  };

  const sortOptions: { value: SortType; label: string; icon: typeof Clock }[] = [
    { value: 'updatedAt', label: '更新时间', icon: Clock },
    { value: 'name', label: '标题', icon: FileText },
    { value: 'createdAt', label: '创建时间', icon: Calendar },
  ];

  if (!isOpen) return null;

  const isDocSelected = (docId: string) => selectedDocIds.includes(docId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
    >
      <div
        className="w-full max-w-[800px] flex flex-col rounded-xl shadow-2xl overflow-hidden"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          height: '75vh',
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

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleBatchMode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150"
              style={{
                backgroundColor: batchMode
                  ? 'var(--color-accent-bg)'
                  : 'var(--color-bg-tertiary)',
                color: batchMode
                  ? 'var(--color-accent)'
                  : 'var(--color-text-secondary)',
              }}
              onMouseEnter={(e) => {
                if (!batchMode) {
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (!batchMode) {
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
                }
              }}
            >
              {batchMode ? <CheckSquare size={14} /> : <Square size={14} />}
              {batchMode ? '退出批量' : '批量模式'}
            </button>

            <button
              onClick={handleClose}
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
        </div>

        {toast && (
          <div
            className="shrink-0 px-4 py-2 text-sm text-center animate-in fade-in slide-in-from-top-2"
            style={{
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              color: '#22c55e',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            {toast}
          </div>
        )}

        {batchMode && (
          <div
            className="shrink-0 px-5 py-3 border-b flex items-center gap-4 flex-wrap"
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-bg-tertiary)',
            }}
          >
            <div
              className="text-sm font-medium"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              已选中{' '}
              <span
                className="font-bold"
                style={{ color: 'var(--color-accent)' }}
              >
                {selectedCount}
              </span>{' '}
              / 共 {totalCount} 篇
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150"
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
                <List size={12} />
                全选
              </button>

              <button
                onClick={handleClearSelection}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-secondary)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
                }}
              >
                <RefreshCw size={12} />
                清除选择
              </button>
            </div>

            <div
              className="w-px h-5 shrink-0"
              style={{ backgroundColor: 'var(--color-border)' }}
            />

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={handleBatchAddTags}
                disabled={selectedCount === 0}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-secondary)',
                }}
                onMouseEnter={(e) => {
                  if (selectedCount > 0) {
                    e.currentTarget.style.backgroundColor = 'var(--color-accent-bg)';
                    e.currentTarget.style.color = 'var(--color-accent)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
                  e.currentTarget.style.color = 'var(--color-text-secondary)';
                }}
              >
                <Tag size={12} />
                批量加标签
              </button>

              <button
                onClick={handleBatchMove}
                disabled={selectedCount === 0}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-secondary)',
                }}
                onMouseEnter={(e) => {
                  if (selectedCount > 0) {
                    e.currentTarget.style.backgroundColor = 'var(--color-accent-bg)';
                    e.currentTarget.style.color = 'var(--color-accent)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
                  e.currentTarget.style.color = 'var(--color-text-secondary)';
                }}
              >
                <MoveRight size={12} />
                批量移动
              </button>

              <button
                onClick={handleBatchArchive}
                disabled={selectedCount === 0}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-secondary)',
                }}
                onMouseEnter={(e) => {
                  if (selectedCount > 0) {
                    e.currentTarget.style.backgroundColor = 'var(--color-accent-bg)';
                    e.currentTarget.style.color = 'var(--color-accent)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
                  e.currentTarget.style.color = 'var(--color-text-secondary)';
                }}
              >
                <Archive size={12} />
                按时间归档
              </button>

              <button
                onClick={handleBatchDelete}
                disabled={selectedCount === 0}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                }}
                onMouseEnter={(e) => {
                  if (selectedCount > 0) {
                    e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                }}
              >
                <Trash2 size={12} />
                批量删除
              </button>
            </div>
          </div>
        )}

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
                  backgroundColor:
                    filter.folderId === null
                      ? 'var(--color-accent-bg)'
                      : 'transparent',
                  color:
                    filter.folderId === null
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
                <Layers size={14} />
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
                          backgroundColor:
                            filter.folderId === folder.id
                              ? 'var(--color-accent-bg)'
                              : 'transparent',
                          color:
                            filter.folderId === folder.id
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
                    className={`transition-transform duration-200 ${
                      showAdvancedFilter ? 'rotate-180' : ''
                    }`}
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
                      backgroundColor:
                        filter.tag === null
                          ? 'var(--color-accent-bg)'
                          : 'var(--color-bg-tertiary)',
                      color:
                        filter.tag === null
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
                  {filteredDocs.map((doc) => {
                    const selected = isDocSelected(doc.id);
                    const isCurrent = doc.id === currentDocId;

                    return (
                      <div
                        key={doc.id}
                        onClick={(e) => handleRowClick(doc, e)}
                        className="p-3 rounded-lg cursor-pointer transition-all duration-150 border relative overflow-hidden"
                        style={{
                          backgroundColor: selected
                            ? 'var(--color-accent-bg)'
                            : isCurrent
                            ? 'var(--color-accent-bg)'
                            : 'var(--color-bg-tertiary)',
                          borderColor: selected
                            ? 'var(--color-accent)'
                            : isCurrent
                            ? 'var(--color-accent)'
                            : 'var(--color-border)',
                        }}
                        onMouseEnter={(e) => {
                          if (!selected && !isCurrent) {
                            e.currentTarget.style.backgroundColor =
                              'var(--color-bg-hover)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!selected && !isCurrent) {
                            e.currentTarget.style.backgroundColor =
                              'var(--color-bg-tertiary)';
                          }
                        }}
                      >
                        {selected && (
                          <div
                            className="absolute left-0 top-0 bottom-0 w-1"
                            style={{ backgroundColor: 'var(--color-accent)' }}
                          />
                        )}

                        <div className="flex items-start gap-3">
                          {batchMode && (
                            <div
                              data-checkbox-area
                              onClick={(e) => handleCheckboxClick(doc.id, e)}
                              className="shrink-0 mt-0.5 cursor-pointer p-0.5 rounded transition-colors"
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  'var(--color-bg-hover)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                            >
                              {selected ? (
                                <CheckSquare
                                  size={16}
                                  style={{ color: 'var(--color-accent)' }}
                                />
                              ) : (
                                <Square
                                  size={16}
                                  style={{ color: 'var(--color-text-muted)' }}
                                />
                              )}
                            </div>
                          )}

                          <FileText
                            size={18}
                            className="mt-0.5 shrink-0"
                            style={{
                              color:
                                isCurrent || selected
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
                                        isCurrent || selected
                                          ? 'var(--color-accent)'
                                          : 'var(--color-text-primary)',
                                    }}
                                  >
                                    {doc.name}
                                  </span>
                                  {isCurrent && (
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
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showBatchTagModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          onClick={() => setShowBatchTagModal(false)}
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
        >
          <div
            className="w-[420px] max-w-[90vw] rounded-xl shadow-2xl overflow-hidden"
            style={{ backgroundColor: 'var(--color-bg-secondary)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <div className="flex items-center gap-2">
                <Tag size={18} style={{ color: 'var(--color-accent)' }} />
                <span
                  className="text-base font-semibold"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  批量添加标签
                </span>
              </div>
              <button
                onClick={() => setShowBatchTagModal(false)}
                className="p-1 rounded transition-colors"
                style={{ color: 'var(--color-text-muted)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <div
                  className="text-sm font-medium mb-2"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  输入标签（多个标签用逗号分隔）
                </div>
                <input
                  type="text"
                  autoFocus
                  value={batchTagInput}
                  onChange={(e) => setBatchTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleConfirmBatchAddTags();
                    }
                  }}
                  placeholder="例如：重要, 已完成, 待审核"
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none border transition-all"
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

              {batchTagPreview.length > 0 && (
                <div>
                  <div
                    className="text-xs font-medium mb-2"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    标签预览
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {batchTagPreview.map((tag, idx) => (
                      <span
                        key={`${tag}-${idx}`}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: 'var(--color-accent-bg)',
                          color: 'var(--color-accent)',
                        }}
                      >
                        <Tag size={10} />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div
                className="text-xs px-3 py-2 rounded-lg"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  color: 'var(--color-text-muted)',
                }}
              >
                将应用到选中的 {selectedCount} 篇文档
              </div>
            </div>

            <div
              className="flex gap-2 px-5 py-4 border-t"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <button
                onClick={() => {
                  setShowBatchTagModal(false);
                  setBatchTagInput('');
                }}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  color: 'var(--color-text-secondary)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
                }}
              >
                取消
              </button>
              <button
                onClick={handleConfirmBatchAddTags}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  backgroundColor: 'var(--color-accent)',
                  color: '#ffffff',
                }}
              >
                确认添加
              </button>
            </div>
          </div>
        </div>
      )}

      {showBatchMoveModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          onClick={() => setShowBatchMoveModal(false)}
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
        >
          <div
            className="w-[420px] max-w-[90vw] rounded-xl shadow-2xl overflow-hidden"
            style={{ backgroundColor: 'var(--color-bg-secondary)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <div className="flex items-center gap-2">
                <MoveRight size={18} style={{ color: 'var(--color-accent)' }} />
                <span
                  className="text-base font-semibold"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  批量移动到分组
                </span>
              </div>
              <button
                onClick={() => setShowBatchMoveModal(false)}
                className="p-1 rounded transition-colors"
                style={{ color: 'var(--color-text-muted)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <div
                  className="text-sm font-medium mb-2"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  选择目标分组
                </div>
                <div className="space-y-1.5 max-h-52 overflow-y-auto">
                  <button
                    onClick={() => {
                      setBatchFolderId(null);
                      setShowBatchNewFolder(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
                    style={{
                      backgroundColor:
                        batchFolderId === null && !showBatchNewFolder
                          ? 'var(--color-accent-bg)'
                          : 'var(--color-bg-tertiary)',
                      color:
                        batchFolderId === null && !showBatchNewFolder
                          ? 'var(--color-accent)'
                          : 'var(--color-text-secondary)',
                    }}
                  >
                    <Layers size={14} />
                    <span className="flex-1 text-left">无分组</span>
                    {batchFolderId === null && !showBatchNewFolder && (
                      <Check size={14} />
                    )}
                  </button>

                  {folders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => {
                        setBatchFolderId(folder.id);
                        setShowBatchNewFolder(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
                      style={{
                        backgroundColor:
                          batchFolderId === folder.id
                            ? 'var(--color-accent-bg)'
                            : 'var(--color-bg-tertiary)',
                        color:
                          batchFolderId === folder.id
                            ? 'var(--color-accent)'
                            : 'var(--color-text-secondary)',
                      }}
                    >
                      <Folder size={14} />
                      <span className="flex-1 text-left truncate">
                        {folder.name}
                      </span>
                      {batchFolderId === folder.id && <Check size={14} />}
                    </button>
                  ))}

                  {!showBatchNewFolder ? (
                    <button
                      onClick={() => {
                        setShowBatchNewFolder(true);
                        setBatchFolderId(null);
                        setBatchNewFolderName('');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
                      style={{
                        backgroundColor: 'var(--color-bg-tertiary)',
                        color: 'var(--color-text-secondary)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--color-accent)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--color-text-secondary)';
                      }}
                    >
                      <Plus size={14} />
                      新建分组...
                    </button>
                  ) : (
                    <div
                      className="p-3 rounded-lg space-y-2"
                      style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                    >
                      <input
                        autoFocus
                        value={batchNewFolderName}
                        onChange={(e) => setBatchNewFolderName(e.target.value)}
                        placeholder="输入新分组名称"
                        className="w-full px-2.5 py-1.5 rounded text-sm outline-none border"
                        style={{
                          backgroundColor: 'var(--color-bg-secondary)',
                          borderColor: 'var(--color-border)',
                          color: 'var(--color-text-primary)',
                        }}
                      />
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            if (batchNewFolderName.trim()) {
                              setBatchFolderId('__new__');
                            }
                          }}
                          className="flex-1 px-2 py-1 rounded text-xs font-medium"
                          style={{
                            backgroundColor: batchNewFolderName.trim()
                              ? 'var(--color-accent)'
                              : 'var(--color-bg-hover)',
                            color: batchNewFolderName.trim()
                              ? '#ffffff'
                              : 'var(--color-text-muted)',
                          }}
                          disabled={!batchNewFolderName.trim()}
                        >
                          使用此分组
                        </button>
                        <button
                          onClick={() => {
                            setShowBatchNewFolder(false);
                            setBatchNewFolderName('');
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
                    </div>
                  )}
                </div>
              </div>

              <div
                className="text-xs px-3 py-2 rounded-lg"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  color: 'var(--color-text-muted)',
                }}
              >
                将移动选中的 {selectedCount} 篇文档
              </div>
            </div>

            <div
              className="flex gap-2 px-5 py-4 border-t"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <button
                onClick={() => {
                  setShowBatchMoveModal(false);
                  setBatchFolderId(null);
                  setBatchNewFolderName('');
                  setShowBatchNewFolder(false);
                }}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  color: 'var(--color-text-secondary)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
                }}
              >
                取消
              </button>
              <button
                onClick={handleConfirmBatchMove}
                disabled={
                  batchFolderId === null &&
                  !(showBatchNewFolder && batchNewFolderName.trim())
                }
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: 'var(--color-accent)',
                  color: '#ffffff',
                }}
              >
                确认移动
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDialog && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center"
          onClick={() => setConfirmDialog(null)}
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
          <div
            className="w-[380px] max-w-[90vw] rounded-xl shadow-2xl overflow-hidden"
            style={{ backgroundColor: 'var(--color-bg-secondary)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5">
              <div
                className="text-base font-semibold mb-2"
                style={{
                  color: confirmDialog.danger ? '#ef4444' : 'var(--color-text-primary)',
                }}
              >
                {confirmDialog.title}
              </div>
              <div
                className="text-sm leading-relaxed"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {confirmDialog.message}
              </div>
            </div>

            <div
              className="flex gap-2 px-5 py-4 border-t"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <button
                onClick={() => setConfirmDialog(null)}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  color: 'var(--color-text-secondary)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
                }}
              >
                取消
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  backgroundColor: confirmDialog.danger ? '#ef4444' : 'var(--color-accent)',
                  color: '#ffffff',
                }}
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
