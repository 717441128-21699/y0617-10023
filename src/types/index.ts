export interface HeadingItem {
  id: string;
  text: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
}

export type Theme = 'light' | 'dark';

export interface Document {
  id: string;
  name: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface PdfExportOptions {
  filename: string;
  includeOutline: boolean;
  orientation: 'portrait' | 'landscape';
}

export interface SearchMatch {
  index: number;
  element: HTMLElement;
  text: string;
}
