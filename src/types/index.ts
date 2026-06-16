export interface HeadingItem {
  id: string;
  text: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
}

export type Theme = 'light' | 'dark';

export interface DocumentVersion {
  id: string;
  content: string;
  name: string;
  savedAt: number;
  description?: string;
}

export interface Document {
  id: string;
  name: string;
  content: string;
  tags: string[];
  folderId: string | null;
  versions: DocumentVersion[];
  createdAt: number;
  updatedAt: number;
}

export interface Folder {
  id: string;
  name: string;
  createdAt: number;
}

export interface PdfExportTemplate {
  coverPage: boolean;
  coverTitle: string;
  coverSubtitle: string;
  coverDate: boolean;
  coverAuthor: string;
  coverCompany: string;
  coverLogo: string;
  header: boolean;
  headerText: string;
  headerIncludeTitle: boolean;
  headerIncludePageNumber: boolean;
  footer: boolean;
  footerText: string;
  footerIncludeDate: boolean;
  footerIncludePageNumber: boolean;
  pageNumber: boolean;
  pageNumberPosition: 'bottom-left' | 'bottom-center' | 'bottom-right' | 'top-left' | 'top-right';
  pageNumberStartFrom: number;
  outlineStyle: 'numbered' | 'bulleted' | 'none';
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  margin: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  watermarkText: string;
  watermarkEnabled: boolean;
}

export interface PdfExportOptions {
  filename: string;
  includeOutline: boolean;
  orientation: 'portrait' | 'landscape';
  template: PdfExportTemplate;
}

export interface SearchMatchItem {
  index: number;
  element: HTMLElement | null;
  text: string;
  context: string;
  heading: string;
  scope: SearchScope;
}

export type SearchScope = 'all' | 'heading' | 'content' | 'code';

export interface SearchOptions {
  scope: SearchScope;
  caseSensitive: boolean;
  wholeWord: boolean;
}

export type SortType = 'name' | 'updatedAt' | 'createdAt';

export interface DocumentFilter {
  keyword: string;
  tag: string | null;
  folderId: string | null;
  dateFrom: number | null;
  dateTo: number | null;
  sortType: SortType;
}

export type DiffOperation = 'added' | 'removed' | 'unchanged' | 'modified';

export interface DiffLine {
  type: DiffOperation;
  content: string;
  lineNumber: number;
}

export interface DiffBlock {
  type: DiffOperation;
  lines: DiffLine[];
  heading?: string;
}
