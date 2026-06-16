import { useState, useEffect, useMemo } from 'react';
import { X, FileDown, Eye, List, FileText, Settings, Layout } from 'lucide-react';
import type { PdfExportTemplate, HeadingItem } from '@/types';
import { generatePreviewHtml, getDefaultTemplate, exportToPdf } from '@/utils/exportPdf';

interface PdfExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  previewElement: React.RefObject<HTMLDivElement> | null;
  outline: HeadingItem[];
  defaultFilename?: string;
}

export default function PdfExportDialog({
  isOpen,
  onClose,
  previewElement,
  outline,
  defaultFilename = 'document',
}: PdfExportDialogProps) {
  const [filename, setFilename] = useState(defaultFilename.replace('.pdf', ''));
  const [includeOutline, setIncludeOutline] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [showPreview, setShowPreview] = useState(false);
  const [template, setTemplate] = useState<PdfExportTemplate>(getDefaultTemplate());
  const [activeTab, setActiveTab] = useState<'basic' | 'template' | 'preview'>('basic');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFilename(defaultFilename.replace('.pdf', ''));
      setIncludeOutline(false);
      setOrientation('portrait');
      setShowPreview(false);
      setTemplate(getDefaultTemplate());
      setActiveTab('basic');
      setExporting(false);
    }
  }, [isOpen, defaultFilename]);

  const updateTemplate = <K extends keyof PdfExportTemplate>(
    key: K,
    value: PdfExportTemplate[K]
  ) => {
    setTemplate((prev) => ({ ...prev, [key]: value }));
  };

  const updateMargin = (side: 'top' | 'bottom' | 'left' | 'right', value: number) => {
    setTemplate((prev) => ({
      ...prev,
      margin: { ...prev.margin, [side]: value },
    }));
  };

  const previewHtml = useMemo(() => {
    if (!previewElement?.current) return '';
    const markdownBody = previewElement.current.querySelector(
      '.markdown-body'
    ) as HTMLElement | null;
    if (!markdownBody) return '';
    return generatePreviewHtml({
      contentElement: markdownBody,
      filename,
      includeOutline,
      orientation,
      outline,
      template,
      documentName: template.coverTitle || filename,
    });
  }, [previewElement, filename, includeOutline, orientation, outline, template]);

  const handleExport = async () => {
    if (!previewElement?.current || exporting) return;
    const markdownBody = previewElement.current.querySelector(
      '.markdown-body'
    ) as HTMLElement | null;
    if (!markdownBody) return;

    setExporting(true);
    try {
      await exportToPdf({
        contentElement: markdownBody,
        filename: filename || 'document',
        includeOutline,
        orientation,
        outline,
        template,
        documentName: template.coverTitle || filename,
      });
      onClose();
    } finally {
      setExporting(false);
    }
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIncludeOutline((prev) => !prev);
  };

  const createCheckboxRow = (
    checked: boolean,
    onChange: () => void,
    icon: React.ReactNode,
    title: string,
    description: string
  ) => (
    <div
      className="flex items-start gap-3 p-4 rounded-lg cursor-pointer transition-all duration-150 border-2"
      style={{
        backgroundColor: checked
          ? 'rgba(13, 148, 136, 0.1)'
          : 'var(--color-bg-tertiary)',
        borderColor: checked ? '#0d9488' : 'var(--color-border)',
      }}
      onClick={onChange}
    >
      <div
        className="mt-0.5 flex items-center justify-center w-5 h-5 rounded border-2 transition-all duration-150"
        style={{
          backgroundColor: checked ? '#0d9488' : 'transparent',
          borderColor: checked ? '#0d9488' : 'var(--color-text-muted)',
        }}
        onClick={(e) => {
          e.stopPropagation();
          onChange();
        }}
      >
        {checked && (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ffffff"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
      <label className="flex-1 text-sm cursor-pointer select-none">
        <span
          className="flex items-center gap-1.5 font-medium"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {icon}
          {title}
        </span>
        <span
          className="block text-xs mt-1"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {description}
        </span>
      </label>
    </div>
  );

  const renderTabButton = (
    tabId: 'basic' | 'template' | 'preview',
    icon: React.ReactNode,
    label: string
  ) => (
    <button
      type="button"
      onClick={() => setActiveTab(tabId)}
      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-all duration-200 rounded-lg"
      style={{
        backgroundColor:
          activeTab === tabId ? 'rgba(13, 148, 136, 0.15)' : 'transparent',
        color: activeTab === tabId ? '#0d9488' : 'var(--color-text-secondary)',
      }}
    >
      {icon}
      {label}
    </button>
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
    >
      <div
        className="w-full max-w-[640px] max-h-[90vh] flex flex-col rounded-xl shadow-2xl"
        style={{ backgroundColor: 'var(--color-bg-secondary)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center gap-2">
            <FileDown size={20} style={{ color: '#0d9488' }} />
            <span
              className="text-lg font-semibold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              导出 PDF
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
          className="flex gap-1 px-3 py-2 border-b"
          style={{ borderColor: 'var(--color-border)' }}
        >
          {renderTabButton('basic', <Settings size={16} />, '基础设置')}
          {renderTabButton('template', <Layout size={16} />, '模板设置')}
          {renderTabButton('preview', <Eye size={16} />, '预览')}
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {activeTab === 'basic' && (
            <div className="p-5 space-y-5">
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  文件名
                </label>
                <div className="flex items-center">
                  <input
                    autoFocus
                    type="text"
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border outline-none text-sm transition-colors"
                    style={{
                      backgroundColor: 'var(--color-bg-tertiary)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-primary)',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#0d9488';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'var(--color-border)';
                    }}
                    placeholder="请输入文件名"
                  />
                  <span
                    className="ml-2 text-sm"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    .pdf
                  </span>
                </div>
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  纸张方向
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setOrientation('portrait')}
                    className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border"
                    style={{
                      backgroundColor:
                        orientation === 'portrait'
                          ? 'rgba(13, 148, 136, 0.15)'
                          : 'var(--color-bg-tertiary)',
                      borderColor:
                        orientation === 'portrait'
                          ? '#0d9488'
                          : 'var(--color-border)',
                      color:
                        orientation === 'portrait'
                          ? '#0d9488'
                          : 'var(--color-text-primary)',
                    }}
                  >
                    <FileText size={16} className="inline-block mr-2" />
                    纵向
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrientation('landscape')}
                    className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border"
                    style={{
                      backgroundColor:
                        orientation === 'landscape'
                          ? 'rgba(13, 148, 136, 0.15)'
                          : 'var(--color-bg-tertiary)',
                      borderColor:
                        orientation === 'landscape'
                          ? '#0d9488'
                          : 'var(--color-border)',
                      color:
                        orientation === 'landscape'
                          ? '#0d9488'
                          : 'var(--color-text-primary)',
                    }}
                  >
                    <FileText
                      size={16}
                      className="inline-block mr-2"
                      style={{ transform: 'rotate(90deg)' }}
                    />
                    横向
                  </button>
                </div>
              </div>

              {createCheckboxRow(
                includeOutline,
                () => setIncludeOutline(!includeOutline),
                <List size={16} />,
                '包含标题大纲',
                `在 PDF 开头生成目录导航页，当前文档共 ${outline.length} 个标题`
              )}

              {includeOutline && (
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    目录样式
                  </label>
                  <select
                    value={template.outlineStyle}
                    onChange={(e) =>
                      updateTemplate(
                        'outlineStyle',
                        e.target.value as 'numbered' | 'bulleted' | 'none'
                      )
                    }
                    className="w-full px-3 py-2 rounded-lg border outline-none text-sm transition-colors"
                    style={{
                      backgroundColor: 'var(--color-bg-tertiary)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-primary)',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#0d9488';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'var(--color-border)';
                    }}
                  >
                    <option value="numbered">编号式</option>
                    <option value="bulleted">项目符号式</option>
                    <option value="none">无</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {activeTab === 'template' && (
            <div className="p-5 space-y-6">
              <div>
                <h3
                  className="text-sm font-semibold mb-3 flex items-center gap-2"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  <span
                    className="w-1 h-4 rounded-full"
                    style={{ backgroundColor: '#0d9488' }}
                  ></span>
                  封面设置
                </h3>
                <div className="space-y-3">
                  {createCheckboxRow(
                    template.coverPage,
                    () => updateTemplate('coverPage', !template.coverPage),
                    <FileText size={16} />,
                    '启用封面',
                    '在 PDF 第一页生成封面页'
                  )}

                  {template.coverPage && (
                    <div className="space-y-3 pl-8">
                      <div>
                        <label
                          className="block text-sm font-medium mb-2"
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          封面标题
                        </label>
                        <input
                          type="text"
                          value={template.coverTitle}
                          onChange={(e) =>
                            updateTemplate('coverTitle', e.target.value)
                          }
                          className="w-full px-3 py-2 rounded-lg border outline-none text-sm transition-colors"
                          style={{
                            backgroundColor: 'var(--color-bg-tertiary)',
                            borderColor: 'var(--color-border)',
                            color: 'var(--color-text-primary)',
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#0d9488';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = 'var(--color-border)';
                          }}
                          placeholder="请输入封面标题"
                        />
                      </div>
                      <div>
                        <label
                          className="block text-sm font-medium mb-2"
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          封面副标题
                        </label>
                        <input
                          type="text"
                          value={template.coverSubtitle}
                          onChange={(e) =>
                            updateTemplate('coverSubtitle', e.target.value)
                          }
                          className="w-full px-3 py-2 rounded-lg border outline-none text-sm transition-colors"
                          style={{
                            backgroundColor: 'var(--color-bg-tertiary)',
                            borderColor: 'var(--color-border)',
                            color: 'var(--color-text-primary)',
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#0d9488';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = 'var(--color-border)';
                          }}
                          placeholder="请输入封面副标题"
                        />
                      </div>
                      {createCheckboxRow(
                        template.coverDate,
                        () =>
                          updateTemplate('coverDate', !template.coverDate),
                        <span>📅</span>,
                        '显示日期',
                        '在封面上显示当前日期'
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3
                  className="text-sm font-semibold mb-3 flex items-center gap-2"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  <span
                    className="w-1 h-4 rounded-full"
                    style={{ backgroundColor: '#0d9488' }}
                  ></span>
                  页眉页脚
                </h3>
                <div className="space-y-3">
                  {createCheckboxRow(
                    template.header,
                    () => updateTemplate('header', !template.header),
                    <span>📌</span>,
                    '启用页眉',
                    '在每一页顶部显示页眉文字'
                  )}

                  {template.header && (
                    <div className="pl-8">
                      <input
                        type="text"
                        value={template.headerText}
                        onChange={(e) =>
                          updateTemplate('headerText', e.target.value)
                        }
                        className="w-full px-3 py-2 rounded-lg border outline-none text-sm transition-colors"
                        style={{
                          backgroundColor: 'var(--color-bg-tertiary)',
                          borderColor: 'var(--color-border)',
                          color: 'var(--color-text-primary)',
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#0d9488';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'var(--color-border)';
                        }}
                        placeholder="请输入页眉文字"
                      />
                    </div>
                  )}

                  {createCheckboxRow(
                    template.footer,
                    () => updateTemplate('footer', !template.footer),
                    <span>📎</span>,
                    '启用页脚',
                    '在每一页底部显示页脚文字'
                  )}

                  {template.footer && (
                    <div className="pl-8">
                      <input
                        type="text"
                        value={template.footerText}
                        onChange={(e) =>
                          updateTemplate('footerText', e.target.value)
                        }
                        className="w-full px-3 py-2 rounded-lg border outline-none text-sm transition-colors"
                        style={{
                          backgroundColor: 'var(--color-bg-tertiary)',
                          borderColor: 'var(--color-border)',
                          color: 'var(--color-text-primary)',
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#0d9488';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'var(--color-border)';
                        }}
                        placeholder="请输入页脚文字"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3
                  className="text-sm font-semibold mb-3 flex items-center gap-2"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  <span
                    className="w-1 h-4 rounded-full"
                    style={{ backgroundColor: '#0d9488' }}
                  ></span>
                  页码
                </h3>
                <div className="space-y-3">
                  {createCheckboxRow(
                    template.pageNumber,
                    () => updateTemplate('pageNumber', !template.pageNumber),
                    <span>🔢</span>,
                    '显示页码',
                    '在页面底部显示页码'
                  )}

                  {template.pageNumber && (
                    <div className="pl-8">
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        页码位置
                      </label>
                      <div className="flex gap-2">
                        {(['bottom-left', 'bottom-center', 'bottom-right'] as const).map(
                          (pos) => (
                            <button
                              key={pos}
                              type="button"
                              onClick={() =>
                                updateTemplate('pageNumberPosition', pos)
                              }
                              className="flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 border"
                              style={{
                                backgroundColor:
                                  template.pageNumberPosition === pos
                                    ? 'rgba(13, 148, 136, 0.15)'
                                    : 'var(--color-bg-tertiary)',
                                borderColor:
                                  template.pageNumberPosition === pos
                                    ? '#0d9488'
                                    : 'var(--color-border)',
                                color:
                                  template.pageNumberPosition === pos
                                    ? '#0d9488'
                                    : 'var(--color-text-primary)',
                              }}
                            >
                              {pos === 'bottom-left'
                                ? '左下'
                                : pos === 'bottom-center'
                                ? '底部居中'
                                : '右下'}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3
                  className="text-sm font-semibold mb-3 flex items-center gap-2"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  <span
                    className="w-1 h-4 rounded-full"
                    style={{ backgroundColor: '#0d9488' }}
                  ></span>
                  排版
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        字体大小 (px)
                      </label>
                      <input
                        type="number"
                        min={12}
                        max={18}
                        value={template.fontSize}
                        onChange={(e) =>
                          updateTemplate(
                            'fontSize',
                            Math.min(
                              18,
                              Math.max(12, parseInt(e.target.value) || 12)
                            )
                          )
                        }
                        className="w-full px-3 py-2 rounded-lg border outline-none text-sm transition-colors"
                        style={{
                          backgroundColor: 'var(--color-bg-tertiary)',
                          borderColor: 'var(--color-border)',
                          color: 'var(--color-text-primary)',
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#0d9488';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'var(--color-border)';
                        }}
                      />
                    </div>
                    <div>
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        行高
                      </label>
                      <input
                        type="number"
                        min={1.2}
                        max={2.0}
                        step={0.1}
                        value={template.lineHeight}
                        onChange={(e) =>
                          updateTemplate(
                            'lineHeight',
                            Math.min(
                              2.0,
                              Math.max(1.2, parseFloat(e.target.value) || 1.2)
                            )
                          )
                        }
                        className="w-full px-3 py-2 rounded-lg border outline-none text-sm transition-colors"
                        style={{
                          backgroundColor: 'var(--color-bg-tertiary)',
                          borderColor: 'var(--color-border)',
                          color: 'var(--color-text-primary)',
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#0d9488';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'var(--color-border)';
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      边距 (px)
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['top', 'bottom', 'left', 'right'] as const).map(
                        (side) => (
                          <div key={side}>
                            <label
                              className="block text-xs mb-1"
                              style={{ color: 'var(--color-text-muted)' }}
                            >
                              {side === 'top'
                                ? '上'
                                : side === 'bottom'
                                ? '下'
                                : side === 'left'
                                ? '左'
                                : '右'}
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={200}
                              value={template.margin[side]}
                              onChange={(e) =>
                                updateMargin(
                                  side,
                                  Math.max(
                                    0,
                                    Math.min(
                                      200,
                                      parseInt(e.target.value) || 0
                                    )
                                  )
                                )
                              }
                              className="w-full px-2 py-1.5 rounded-lg border outline-none text-sm transition-colors"
                              style={{
                                backgroundColor: 'var(--color-bg-tertiary)',
                                borderColor: 'var(--color-border)',
                                color: 'var(--color-text-primary)',
                              }}
                              onFocus={(e) => {
                                e.target.style.borderColor = '#0d9488';
                              }}
                              onBlur={(e) => {
                                e.target.style.borderColor =
                                  'var(--color-border)';
                              }}
                            />
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preview' && (
            <div
              className="h-full"
              style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
            >
              <div className="p-4 flex justify-center overflow-auto">
                <div
                  className="shadow-lg"
                  style={{
                    width: orientation === 'landscape' ? '500px' : '360px',
                    minHeight: '500px',
                    background: '#ffffff',
                    transform: 'scale(0.6)',
                    transformOrigin: 'top center',
                  }}
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </div>
            </div>
          )}
        </div>

        <div
          className="flex justify-end gap-3 p-5 pt-3 border-t"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-primary)',
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
            type="button"
            onClick={handleExport}
            disabled={exporting || !filename.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            style={{
              backgroundColor: '#0d9488',
              color: '#ffffff',
            }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = '#0f766e';
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = '#0d9488';
              }
            }}
          >
            <FileDown size={16} />
            {exporting ? '导出中...' : '导出 PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}
