export type BookSection =
  | 'novels'
  | 'theatre'
  | 'poetry-collections'
  | 'special-editions';

export type LiteraryLanguage = 'मराठी' | 'हिंदी' | 'English' | 'Hinglish';
export type PoemLanguage = 'मराठी' | 'हिंदी' | 'English';

export type PoemCategory =
  | 'विरह'
  | 'एकतर्फी प्रेम'
  | 'आठवणी'
  | 'सौंदर्य'
  | 'निसर्ग'
  | 'प्रेम'
  | 'जीवन'
  | 'Unsaid Feelings';

export interface PoemSong {
  title: string;
  artist?: string;
  youtubeUrl?: string;
  altYoutubeUrls?: string[];
}

export interface BookPublication {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  author: string;
  authorCreditLabel?: string;
  section: BookSection;
  editionLabel?: string;
  editionGroup?: string;
  language: LiteraryLanguage;
  genre: string;
  pageCount: number;
  pdfUrl: string;
  originalFilename: string;
  coverPageNumber: number;
  customCoverUrl?: string;
  coverTone: 'midnight' | 'obsidian' | 'crimson-slate' | 'parchment-gold';
  description: string;
  structureHighlights: string[];
  published: boolean;
  featured: boolean;
  recentlyAdded?: boolean;
  releaseOrder: number;
  createdAt: string;
}

export interface PoemEntry {
  id: string;
  slug: string;
  number?: number;
  title: string;
  englishSubtitle?: string;
  body: string;
  language: PoemLanguage;
  category: PoemCategory;
  author: string;
  sourcePublicationSlug?: string;
  sourceTitle?: string;
  partName?: string;
  dateLabel?: string;
  dedication?: string;
  songs?: PoemSong[];
  audioUrl?: string;
  audioDurationLabel?: string;
  featured?: boolean;
  recentlyAdded?: boolean;
  published: boolean;
  createdAt: string;
}

export interface JournalPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  sourceLabel: string;
  relatedBookSlug?: string;
  language: LiteraryLanguage;
  publishedAt: string;
  published: boolean;
}

export interface StoryChapterIndex {
  numberLabel: string;
  title: string;
  page: number;
  partLabel?: string;
  note?: string;
}

export interface StoryCharacterProfile {
  id: string;
  name: string;
  role: string;
  appearanceLabel: string;
  description: string;
  quote?: string;
}

export interface StoryArchiveDossier {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  bookSlug: string;
  alternateBookSlug?: string;
  language: LiteraryLanguage;
  genre: string;
  summary: string;
  settingLabel: string;
  chapters: StoryChapterIndex[];
  characters: StoryCharacterProfile[];
}

export interface TheatreSceneItem {
  sceneNumber: string;
  title: string;
  page: number;
}

export interface TheatreActItem {
  actNumber: string;
  title: string;
  actPage: number;
  closingQuestionTitle?: string;
  closingQuestionPage?: number;
  scenes: TheatreSceneItem[];
}

export interface TheatreCharacterItem {
  name: string;
  role: string;
}

export interface TheatreExcerptLine {
  type: 'stage' | 'dialogue';
  speaker?: string;
  cue?: string;
  text: string;
}

export interface TheatreExcerptScene {
  id: string;
  heading: string;
  page: number;
  lines: TheatreExcerptLine[];
}

export type MoodKey =
  | 'viraha'
  | 'ektarfi'
  | 'suspense'
  | 'aatmashodh'
  | 'aathvani'
  | 'saundarya'
  | 'nisarga'
  | 'unsaid';

export interface MidnightExcerpt {
  id: string;
  quote: string;
  highlightLine?: string;
  highlightTag?: string;
  sourceTitle: string;
  sourceType: 'book' | 'theatre' | 'poem' | 'journal';
  targetUrl: string;
  pageLabel?: string;
  language: LiteraryLanguage;
  moodKey: MoodKey;
  translations: {
    hi: string;
    en: string;
    highlightLineHi?: string;
    highlightLineEn?: string;
  };
}

export interface MoodDefinition {
  key: MoodKey;
  title: string;
  devanagariLabel: string;
  description: string;
  poemCategories: PoemCategory[];
  bookSlugs: string[];
  journalSlugs: string[];
}

export interface PoetrySongComposition {
  songTitle: string;
  ragaMood: string;
  styleTag: string;
  tempoBpm: number;
  rootMidi: number;
  scaleIntervals: number[];
  chordProgression: string[];
  vocalTone: 'intimate-male' | 'warm-female' | 'deep-baritone';
  sections: {
    label: string;
    lines: string[];
  }[];
  performanceScript: string;
  vocalAudioBase64?: string;
  vocalMimeType?: string;
}

export interface SavedStanzaNote {
  id: string;
  poemId: string;
  poemSlug: string;
  poemTitle: string;
  stanzaText: string;
  note?: string;
  createdAt: string;
}
