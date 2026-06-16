import { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Eye,
  FileDown,
  ArrowLeft,
  FileText,
  Check,
  Image,
  User,
  Building,
  Calendar,
  Type,
  Hash,
  AlignLeft,
  Droplets,
} from 'lucide-react';
import type { PdfExportTemplate, HeadingItem } from '@/types';
import {
  generatePreviewHtml,
  getDefaultTemplate,
  exportToPdf,
} from '@/utils/exportPdf';

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
  const [filename, setFilename] = useState(
    defaultFilename.replace('.pdf', '')
  );
  const [includeOutline, setIncludeOutline] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    'portrait'
  );
  const [template, setTemplate] =
    useState<PdfExportTemplate>(getDefaultTemplate());
  const [activeTab, setActiveTab] = useState<
    'basic' | 'header' | 'cover' | 'preview'
  >('basic');
  const [exporting, setExporting] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFilename(defaultFilename.replace('.pdf', ''));
      setIncludeOutline(false);
      setOrientation('portrait');
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

  const updateMargin = (
    side: 'top' | 'bottom' | 'left' | 'right',
    value: number
  ) => {
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

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      updateTemplate('coverLogo', base64);
    };
    reader.readAsDataURL(file);

    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  const clearLogo = () => {
    updateTemplate('coverLogo', '');
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
        className="mt-0.5 flex items-center justify-center w-5 h-5 rounded border-2 transition-all duration-150 shrink-0"
        style={{
          backgroundColor: checked ? '#0d9488' : 'transparent',
          borderColor: checked ? '#0d9488' : 'var(--color-text-muted)',
        }}
        onClick={(e) => {
          e.stopPropagation();
          onChange();
        }}
      >
        {checked && <Check size={14} color="#ffffff" strokeWidth={3} />}
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

  const createInputWithIcon = (
    icon: React.ReactNode,
    value: string,
    onChange: (v: string) => void,
    placeholder: string
  ) => (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors"
      style={{
        backgroundColor: 'var(--color-bg-tertiary)',
        borderColor: 'var(--color-border)',
      }}
    >
      <span style={{ color: 'var(--color-text-muted)' }}>{icon}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent outline-none text-sm"
        style={{ color: 'var(--color-text-primary)' }}
        placeholder={placeholder}
      />
    </div>
  );

  const renderTabButton = (
    tabId: 'basic' | 'header' | 'cover' | 'preview',
    icon: React.ReactNode,
    label: string
  ) => (
    <button
      type="button"
      onClick={() => setActiveTab(tabId)}
      className="relative flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-sm font-medium transition-all duration-200"
      style={{
        color:
          activeTab === tabId ? '#0d9488' : 'var(--color-text-secondary)',
      }}
    >
      {icon}
      {label}
      {activeTab === tabId && (
        <span
          className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t"
          style={{ backgroundColor: '#0d9488' }}
        />
      )}
    </button>
  );

  const pageNumberPositions: {
    value: PdfExportTemplate['pageNumberPosition'];
    label: string;
  }[] = [
    { value: 'top-left', label: '顶部左' },
    { value: 'top-right', label: '顶部右' },
    { value: 'bottom-left', label: '底部左' },
    { value: 'bottom-center', label: '底部中' },
    { value: 'bottom-right', label: '底部右' },
  ];

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
    >
      <div
        className="w-full max-w-[640px] flex flex-col rounded-xl shadow-2xl"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          height: '80vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-5 py-4 border-b shrink-0"
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
          className="flex border-b shrink-0 px-2"
          style={{ borderColor: 'var(--color-border)' }}
        >
          {renderTabButton('basic', <AlignLeft size={16} />, '基础设置')}
          {renderTabButton('header', <Hash size={16} />, '页眉页脚')}
          {renderTabButton('cover', <FileText size={16} />, '封面')}
          {renderTabButton('preview', <Eye size={16} />, '预览')}
        </div>

        <div
          className="flex-1 overflow-y-auto min-h-0"
          style={{ maxHeight: 'calc(80vh - 140px)' }}
        >
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
                    className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border flex items-center justify-center gap-2"
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
                    <FileText size={16} />
                    纵向
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrientation('landscape')}
                    className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border flex items-center justify-center gap-2"
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
                      style={{ transform: 'rotate(90deg)' }}
                    />
                    横向
                  </button>
                </div>
              </div>

              {createCheckboxRow(
                includeOutline,
                () => setIncludeOutline(!includeOutline),
                <Hash size={16} />,
                '包含目录',
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

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    className="flex items-center gap-1.5 text-sm font-medium"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    <Droplets size={16} />
                    水印
                  </label>
                  <div
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                    style={{
                      backgroundColor: template.watermarkEnabled
                        ? 'rgba(13, 148, 136, 0.1)'
                        : 'var(--color-bg-tertiary)',
                    }}
                    onClick={() =>
                      updateTemplate('watermarkEnabled', !template.watermarkEnabled)
                    }
                  >
                    <div
                      className="w-9 h-5 rounded-full relative transition-colors"
                      style={{
                        backgroundColor: template.watermarkEnabled
                          ? '#0d9488'
                          : 'var(--color-text-muted)',
                      }}
                    >
                      <div
                        className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
                        style={{
                          transform: template.watermarkEnabled
                            ? 'translateX(18px)'
                            : 'translateX(2px)',
                        }}
                      />
                    </div>
                  </div>
                </div>
                <input
                  type="text"
                  value={template.watermarkText}
                  onChange={(e) =>
                    updateTemplate('watermarkText', e.target.value)
                  }
                  disabled={!template.watermarkEnabled}
                  className="w-full px-3 py-2 rounded-lg border outline-none text-sm transition-colors disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--color-bg-tertiary)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                  onFocus={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.target.style.borderColor = '#0d9488';
                    }
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--color-border)';
                  }}
                  placeholder="请输入水印文字"
                />
              </div>

              <div>
                <h3
                  className="text-sm font-semibold mb-3 flex items-center gap-2"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  <span
                    className="w-1 h-4 rounded-full"
                    style={{ backgroundColor: '#0d9488' }}
                  />
                  排版
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        <div className="flex items-center gap-1.5">
                          <Type size={14} />
                          字体大小 (px)
                        </div>
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
                        <div className="flex items-center gap-1.5">
                          <AlignLeft size={14} />
                          行高
                        </div>
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
                      四边边距 (px)
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

          {activeTab === 'header' && (
            <div className="p-5 space-y-6">
              <div>
                <h3
                  className="text-sm font-semibold mb-3 flex items-center gap-2"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  <span
                    className="w-1 h-4 rounded-full"
                    style={{ backgroundColor: '#0d9488' }}
                  />
                  页眉区域
                </h3>
                <div className="space-y-3">
                  {createCheckboxRow(
                    template.header,
                    () => updateTemplate('header', !template.header),
                    <Hash size={16} />,
                    '启用页眉',
                    '在每一页顶部显示页眉'
                  )}

                  {template.header && (
                    <div className="space-y-3 pl-8">
                      <div>
                        <label
                          className="block text-sm font-medium mb-2"
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          页眉文字
                        </label>
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

                      {createCheckboxRow(
                        template.headerIncludeTitle,
                        () =>
                          updateTemplate(
                            'headerIncludeTitle',
                            !template.headerIncludeTitle
                          ),
                        <FileText size={16} />,
                        '包含文档标题',
                        '在页眉中显示文档名称'
                      )}

                      {createCheckboxRow(
                        template.headerIncludePageNumber,
                        () =>
                          updateTemplate(
                            'headerIncludePageNumber',
                            !template.headerIncludePageNumber
                          ),
                        <Hash size={16} />,
                        '在页眉显示页码',
                        '将页码放在页眉区域（顶部）'
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
                  />
                  页脚区域
                </h3>
                <div className="space-y-3">
                  {createCheckboxRow(
                    template.footer,
                    () => updateTemplate('footer', !template.footer),
                    <Hash size={16} />,
                    '启用页脚',
                    '在每一页底部显示页脚'
                  )}

                  {template.footer && (
                    <div className="space-y-3 pl-8">
                      <div>
                        <label
                          className="block text-sm font-medium mb-2"
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          页脚文字
                        </label>
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

                      {createCheckboxRow(
                        template.footerIncludeDate,
                        () =>
                          updateTemplate(
                            'footerIncludeDate',
                            !template.footerIncludeDate
                          ),
                        <Calendar size={16} />,
                        '包含导出日期',
                        '在页脚中显示导出当天日期'
                      )}

                      {createCheckboxRow(
                        template.footerIncludePageNumber,
                        () =>
                          updateTemplate(
                            'footerIncludePageNumber',
                            !template.footerIncludePageNumber
                          ),
                        <Hash size={16} />,
                        '在页脚显示页码',
                        '将页码放在页脚区域（底部）'
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
                  />
                  页码选项
                </h3>
                <div className="space-y-4 pl-2">
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      页码位置
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {pageNumberPositions.map((pos) => (
                        <button
                          key={pos.value}
                          type="button"
                          onClick={() =>
                            updateTemplate('pageNumberPosition', pos.value)
                          }
                          className="px-2 py-2 rounded-lg text-xs font-medium transition-all duration-200 border"
                          style={{
                            backgroundColor:
                              template.pageNumberPosition === pos.value
                                ? 'rgba(13, 148, 136, 0.15)'
                                : 'var(--color-bg-tertiary)',
                            borderColor:
                              template.pageNumberPosition === pos.value
                                ? '#0d9488'
                                : 'var(--color-border)',
                            color:
                              template.pageNumberPosition === pos.value
                                ? '#0d9488'
                                : 'var(--color-text-primary)',
                          }}
                        >
                          {pos.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      起始页码
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={9999}
                      value={template.pageNumberStartFrom}
                      onChange={(e) =>
                        updateTemplate(
                          'pageNumberStartFrom',
                          Math.max(1, parseInt(e.target.value) || 1)
                        )
                      }
                      className="w-32 px-3 py-2 rounded-lg border outline-none text-sm transition-colors"
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
              </div>
            </div>
          )}

          {activeTab === 'cover' && (
            <div className="p-5 space-y-5">
              {createCheckboxRow(
                template.coverPage,
                () => updateTemplate('coverPage', !template.coverPage),
                <FileText size={16} />,
                '启用封面',
                '在 PDF 第一页生成独立封面页'
              )}

              {template.coverPage && (
                <div className="space-y-4 pl-2">
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
                      placeholder={`默认使用文件名：${filename}`}
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
                      placeholder="请输入封面副标题（可选）"
                    />
                  </div>

                  {createCheckboxRow(
                    template.coverDate,
                    () => updateTemplate('coverDate', !template.coverDate),
                    <Calendar size={16} />,
                    '显示日期',
                    '在封面上显示当前导出日期'
                  )}

                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      作者
                    </label>
                    {createInputWithIcon(
                      <User size={16} />,
                      template.coverAuthor,
                      (v) => updateTemplate('coverAuthor', v),
                      '请输入作者姓名'
                    )}
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      公司 / 组织
                    </label>
                    {createInputWithIcon(
                      <Building size={16} />,
                      template.coverCompany,
                      (v) => updateTemplate('coverCompany', v),
                      '请输入公司或组织名称'
                    )}
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      <div className="flex items-center gap-1.5">
                        <Image size={16} />
                        Logo 图片
                      </div>
                    </label>
                    <div className="flex items-start gap-3">
                      {template.coverLogo ? (
                        <div
                          className="relative w-20 h-20 rounded-lg border-2 overflow-hidden flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: 'var(--color-bg-tertiary)',
                            borderColor: 'var(--color-border)',
                          }}
                        >
                          <img
                            src={template.coverLogo}
                            alt="Logo 预览"
                            className="max-w-full max-h-full object-contain p-2"
                          />
                          <button
                            type="button"
                            onClick={clearLogo}
                            className="absolute top-1 right-1 p-1 rounded-full transition-colors"
                            style={{
                              backgroundColor: 'rgba(0,0,0,0.6)',
                              color: '#fff',
                            }}
                            title="移除 Logo"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <div
                          className="w-20 h-20 rounded-lg border-2 border-dashed flex items-center justify-center shrink-0"
                          style={{
                            borderColor: 'var(--color-border)',
                          }}
                        >
                          <Image
                            size={24}
                            style={{ color: 'var(--color-text-muted)' }}
                          />
                        </div>
                      )}
                      <div className="flex-1 space-y-2">
                        <button
                          type="button"
                          onClick={() => logoInputRef.current?.click()}
                          className="w-full px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border flex items-center justify-center gap-2"
                          style={{
                            backgroundColor: 'var(--color-bg-tertiary)',
                            borderColor: 'var(--color-border)',
                            color: 'var(--color-text-primary)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#0d9488';
                            e.currentTarget.style.color = '#0d9488';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor =
                              'var(--color-border)';
                            e.currentTarget.style.color =
                              'var(--color-text-primary)';
                          }}
                        >
                          <Image size={16} />
                          选择本地图片
                        </button>
                        <p
                          className="text-xs"
                          style={{ color: 'var(--color-text-muted)' }}
                        >
                          支持 PNG、JPG、SVG 等格式，将在封面顶部居中显示
                        </p>
                      </div>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'preview' && (
            <div
              className="h-full flex flex-col"
              style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
            >
              <div className="p-3 border-b flex items-center justify-between shrink-0"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <button
                  type="button"
                  onClick={() => setActiveTab('basic')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    color: 'var(--color-text-secondary)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      'var(--color-bg-hover)';
                    e.currentTarget.style.color = '#0d9488';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--color-text-secondary)';
                  }}
                >
                  <ArrowLeft size={16} />
                  返回设置
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
              <div className="flex-1 overflow-auto p-4 flex justify-center">
                <div
                  style={{
                    transform: orientation === 'landscape' ? 'scale(0.5)' : 'scale(0.6)',
                    transformOrigin: 'top center',
                  }}
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </div>
            </div>
          )}
        </div>

        {activeTab !== 'preview' && (
          <div
            className="flex justify-end gap-3 p-5 pt-3 border-t shrink-0"
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
                e.currentTarget.style.backgroundColor =
                  'var(--color-bg-tertiary)';
              }}
            >
              取消
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                color: 'var(--color-text-primary)',
                borderColor: 'var(--color-border)',
                border: '1px solid',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#0d9488';
                e.currentTarget.style.color = '#0d9488';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.color = 'var(--color-text-primary)';
              }}
            >
              <Eye size={16} />
              预览
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
        )}
      </div>
    </div>
  );
}
