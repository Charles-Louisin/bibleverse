export interface Bible {
  id: string;
  dblId: string;
  abbreviation: string;
  abbreviationLocal: string;
  copyright: string;
  language: Language;
  countries: Country[];
  name: string;
  nameLocal: string;
  description: string;
  descriptionLocal: string;
  relatedDbl: string;
  type: string;
  updatedAt: string;
  audioBibles?: AudioBible[];
}

export interface Language {
  id: string;
  name: string;
  nameLocal: string;
  script: string;
  scriptDirection: string;
}

export interface Country {
  id: string;
  name: string;
  nameLocal: string;
}

export interface AudioBible {
  id: string;
  name: string;
  nameLocal: string;
  dblId: string;
  language: {
    id: string;
    name: string;
  };
}

export interface Book {
  id: string;
  bibleId: string;
  abbreviation: string;
  name: string;
  nameLong: string;
  chapters: Chapter[];
}

export interface Chapter {
  id: string;
  bibleId: string;
  bookId: string;
  number: string;
  reference: string;
  content?: string;
  verseCount?: number;
  next?: {
    id: string;
    bookId: string;
    number: string;
  };
  previous?: {
    id: string;
    bookId: string;
    number: string;
  };
}

export interface Verse {
  id: string;
  bibleId: string;
  bookId: string;
  chapterId: string;
  reference: string;
  content: string;
}

export interface Section {
  id: string;
  bibleId: string;
  bookId: string;
  chapterId: string;
  title: string;
  content: string;
}

export interface SearchResult {
  query: string;
  limit: number;
  offset: number;
  total: number;
  verses: Verse[];
}

export interface AudioData {
  id: string;
  url: string;
  mimeType: string;
  _fallback?: boolean;
  format: string;
  duration: number;
}

export interface ApiResponse<T> {
  data: T;
  meta: {
    fums: string;
    fumsId: string;
    fumsJsInclude: string;
    fumsJs: string;
    fumsNoScript: string;
  };
} 