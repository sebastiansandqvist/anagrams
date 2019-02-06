import * as mithril from 'mithril-global';

interface WordList {
  '3': string[];
  '4': string[];
  '5': string[];
  '6': string[];
  '7': string[];
  [key: string]: string[] | undefined; // TODO: how to remove this while keeping strict mode?
}

declare global {
  const m: typeof mithril;
  const wordList: WordList;
  const words6: string[];
  const words7: string[];
}
