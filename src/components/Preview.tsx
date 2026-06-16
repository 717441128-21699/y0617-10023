import { forwardRef } from 'react';
import { useAppStore } from '@/store';

interface PreviewProps {
  scrollRatio: number;
}

const Preview = forwardRef<HTMLDivElement, PreviewProps>(({ scrollRatio }, ref) => {
  const { html } = useAppStore();

  return (
    <div className="flex flex-col h-full">
      <div
        className="h-10 flex items-center px-4 border-b text-xs font-medium uppercase tracking-wider"
        style={{
          backgroundColor: 'var(--color-bg-tertiary)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-muted)',
        }}
      >
        预览
      </div>

      <div
        ref={ref}
        className="flex-1 overflow-y-auto"
        style={{ backgroundColor: 'var(--color-bg-primary)' }}
        data-scroll-ratio={scrollRatio}
      >
        <article
          className="markdown-body py-6 px-8"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
});

Preview.displayName = 'Preview';

export default Preview;
