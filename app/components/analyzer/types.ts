export type PosTag = {
  token: string;
  tag: string;
};

export type AnalyzeResponse = {
  original_text: string;
  tokens: string[];
  lexicon_tokens: string[];
  pos_tags: PosTag[];
  sentences: string[];
  punctuated_text: string;
};

export type LexiconEntry = {
  word: string;
  frequency: number;
  pmi: number;
  right_entropy: number;
  left_entropy: number;
};

export type LexiconResponse = {
  original_text: string;
  total_entries: number;
  entries: LexiconEntry[];
};
