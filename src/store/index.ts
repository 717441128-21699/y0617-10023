import { create } from 'zustand';
import { marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import type { HeadingItem, Theme } from '@/types';
import { defaultMarkdown } from '@/utils/defaultContent';

marked.use(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    },
  })
);

marked.setOptions({
  gfm: true,
  breaks: true,
});

interface AppState {
  markdown: string;
  html: string;
  outline: HeadingItem[];
  theme: Theme;
  setMarkdown: (markdown: string) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  parseMarkdown: (markdown: string) => string;
  extractOutline: (markdown: string) => HeadingItem[];
}

const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

const parseMarkdownToHtml = (markdown: string): string => {
  let headingIndex = 0;
  const headingMap = new Map<string, number>();

  const renderer = new marked.Renderer();
  const originalHeading = renderer.heading.bind(renderer);

  renderer.heading = (tokens) => {
    const text = tokens.text;
    const level = tokens.depth;
    let baseId = slugify(text);
    if (!baseId) {
      baseId = `heading-${headingIndex}`;
    }
    
    let id = baseId;
    const count = headingMap.get(baseId) || 0;
    if (count > 0) {
      id = `${baseId}-${count}`;
    }
    headingMap.set(baseId, count + 1);
    headingIndex++;

    return `<h${level} id="${id}">${text}</h${level}>\n`;
  };

  return marked.parse(markdown, { renderer }) as string;
};

const extractOutlineFromMarkdown = (markdown: string): HeadingItem[] => {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const headings: HeadingItem[] = [];
  const headingMap = new Map<string, number>();
  let match;

  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length as 1 | 2 | 3 | 4 | 5 | 6;
    const text = match[2].trim();
    let baseId = slugify(text);
    if (!baseId) {
      baseId = `heading-${headings.length}`;
    }
    
    let id = baseId;
    const count = headingMap.get(baseId) || 0;
    if (count > 0) {
      id = `${baseId}-${count}`;
    }
    headingMap.set(baseId, count + 1);

    headings.push({ id, text, level });
  }

  return headings;
};

export const useAppStore = create<AppState>((set, get) => {
  const savedTheme = (typeof localStorage !== 'undefined' 
    ? localStorage.getItem('md-editor-theme') as Theme | null 
    : null) || 'light';
  
  const initialHtml = parseMarkdownToHtml(defaultMarkdown);
  const initialOutline = extractOutlineFromMarkdown(defaultMarkdown);

  return {
    markdown: defaultMarkdown,
    html: initialHtml,
    outline: initialOutline,
    theme: savedTheme,

    setMarkdown: (markdown: string) => {
      const html = get().parseMarkdown(markdown);
      const outline = get().extractOutline(markdown);
      set({ markdown, html, outline });
    },

    setTheme: (theme: Theme) => {
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', theme);
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('md-editor-theme', theme);
      }
      set({ theme });
    },

    toggleTheme: () => {
      const newTheme = get().theme === 'light' ? 'dark' : 'light';
      get().setTheme(newTheme);
    },

    parseMarkdown: parseMarkdownToHtml,
    extractOutline: extractOutlineFromMarkdown,
  };
});
