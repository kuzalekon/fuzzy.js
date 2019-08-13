import { newStemmer } from 'snowball-stemmers';

export interface FuzzyOptions {
  delimiter?: string;
  stemmerLocale?: string;
  textThreshold?: number;
  wordThreshold?: number;
  tokenLength?: number;
  minWordLength?: number;
}

export interface FuzzyInstance {
  compare(firstText: string, secondText: string): number;
  equals(firstText: string, secondText: string): boolean;
}

export function create({
  delimiter = ' ',
  stemmerLocale = 'english',
  textThreshold = 0.25,
  wordThreshold = 0.45,
  tokenLength = 2,
  minWordLength = 3
}: FuzzyOptions = {}): FuzzyInstance {
  const stemmer = newStemmer(stemmerLocale);

  return { compare, equals };

  function equals(firstText: string, secondText: string): boolean {
    return textThreshold <= compare(firstText, secondText);
  }

  function compare(firstText: string, secondText: string): number {
    const firstTokenSet = getNormalizedTokens(firstText);
    const secondTokenSet = getNormalizedTokens(secondText);
    const equalTokenSet = getEqualTokens(firstTokenSet, secondTokenSet);

    return (1.0 * equalTokenSet.length) / (firstTokenSet.length + secondTokenSet.length - equalTokenSet.length);
  }

  function getEqualTokens(firstTokenSet: string[], secondTokenSet: string[]): string[] {
    const equalTokenSet = [];
    const usedTokenSet = new Array(secondTokenSet.length).fill(false);

    for (let i = 0, n = firstTokenSet.length; i < n; ++i) {
      for (let j = 0, n = secondTokenSet.length; j < n; ++j) {
        if (!usedTokenSet[j]) {
          if (isTokensEqual(firstTokenSet[i], secondTokenSet[j])) {
            equalTokenSet.push(firstTokenSet[i]);
            usedTokenSet[j] = true;
            break;
          }
        }
      }
    }

    return equalTokenSet;

    function isTokensEqual(firstToken: string, secondToken: string): boolean {
      const firstTokenLength = firstToken.length - tokenLength + 1;
      const secondTokenLength = secondToken.length - tokenLength + 1;
      const usedTokenSet = new Array(secondTokenLength).fill(false);
      let equalTokenCount = 0;

      for (let i = 0; i < firstTokenLength; ++i) {
        const firstSubToken = firstToken.substr(i, tokenLength)
        for (let j = 0; j < secondTokenLength; ++j) {
          if (!usedTokenSet[j]) {
            const secondSubToken = secondToken.substr(j, tokenLength)
            if (firstSubToken.localeCompare(secondSubToken) === 0) {
              equalTokenCount++;
              usedTokenSet[j] = true;
              break;
            }
          }
        }
      }

      return wordThreshold <= (1.0 * equalTokenCount) / (firstTokenLength + secondTokenLength - equalTokenCount);
    }
  }

  function getNormalizedTokens(text: string): string[] {
    return text
      .trim()
      .replace(/['`~!@#$%^&*()_|+-=?;:'",.<>\{\}\[\]\\\/]/gi, '')
      .toLocaleLowerCase()
      .split(delimiter)
      .filter(w => w.length >= minWordLength)
      .map(w => stemmer.stem(w));
  }
}

export default create();
