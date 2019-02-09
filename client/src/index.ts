interface Option {
  label: string;
  checked: boolean;
}

interface RadioGroupAttrs {
  options: Option[];
  name: string;
}


interface Points {
  '3': number;
  '4': number;
  '5': number;
  '6': number;
  '7': number;
  [key: string]: number | undefined; // TODO: how to remove this while keeping strict mode?
}

const points: Points = {
  '3': 100,
  '4': 400,
  '5': 1200,
  '6': 2000,
  '7': 3400
}

function swap(a: number, b: number, arr: string[]) {
  const tmp = arr[a];
  arr[a] = arr[b];
  arr[b] = tmp;
};

function permutations(letters: string[]) {
  const permutations: string[] = [];

  const generate = (n: number) => {
    if (n == 1) permutations.push(letters.join(''));
    else {
      for (let i = 0; i != n; i++) {
        generate(n - 1);
        swap(n % 2 ? 0 : i, n - 1, letters);
      }
    }
  }

  generate(letters.length);
  return permutations;
}

function powerSet(letters: string[]) {
  const set: string[][] = [[]];
  for (let i = 0; i < letters.length; i++) {
    for (let j = 0, len = set.length; j < len; j++) {
      set.push(set[j].concat(letters[i]));
    }
  }
  return set;
}

interface DictSets {
  '3': Set<string>;
  '4': Set<string>;
  '5': Set<string>;
  '6': Set<string>;
  '7': Set<string>;
};

let dictSets: DictSets;

function computeAnswers(baseWord: string) {
  console.time('dictSet');
  if (!dictSets) {
    dictSets = {
      '3': new Set(wordList[3]),
      '4': new Set(wordList[4]),
      '5': new Set(wordList[5]),
      '6': new Set(wordList[6]),
      '7': new Set(wordList[7])
    };
  }
  console.timeEnd('dictSet');

  console.time('powerSet');
  const letters = baseWord.split('');
  const ps = powerSet(letters).filter((x) => x.length >= 3);
  console.timeEnd('powerSet');

  const result: string[] = [];

  console.time('permute');
  for (const s of ps) {
    for (const permutation of permutations(s)) {
      if ((<Set<string>>(<any>dictSets)[permutation.length]).has(permutation)) {
        result.push(permutation);
      }
    }
  }
  console.timeEnd('permute');

  // Array.from(new Set(arr)) is a fast? dedupe method
  return Array.from(new Set(result)).sort((a, b) => {
    return b.length - a.length || a.localeCompare(b);
  });
}

// precondition: the guess string length is valid (3-7)
// returns number of points for the word
function computeGuessPoints(guess: string): number {
  const arr: string[] | undefined = wordList[guess.length];
  if (!Array.isArray(arr)) throw new Error('Invalid guess');
  if (arr.indexOf(guess) === -1) return 0;
  return points[guess.length] || 0;
}

function shuffle(word: string) {
  const letters = word.split('');

  // fisher-yates shuffle
  let currentIndex = letters.length;
  let temp;
  let randomIndex;

  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    temp = letters[currentIndex];
    letters[currentIndex] = letters[randomIndex];
    letters[randomIndex] = temp;
  }

  return letters.join('');
}

function randomWord(words: string[]) {
  return words[Math.floor(Math.random() * words.length)];
}

const INIT = 1;
const STARTED = 2;
const ENDED = 3;

interface GameState {
  state: number;
  wordLength: number;
  baseWord: string;
  dictionary: string[];
  history: string[];
  score: number;
}

const game: GameState = {
  state: INIT,
  wordLength: 6,
  baseWord: '',
  dictionary: [],
  history: [],
  score: 0
}

interface Choice {
  letter: string;
  guessed: boolean;
}

const Game = () => {

  game.dictionary = game.wordLength === 6 ? words6 : words7;
  game.baseWord = randomWord(game.dictionary);
  const boardLetters: Choice[] = shuffle(game.baseWord).split('').map((letter) => ({ letter, guessed: false }));
  const guess: Choice[] = [];
  let secondsRemaining = 60;

  const addGuess = (x: Choice) => {
    guess.push(x);
    x.guessed = true;
    redraw();
  }

  const submitGuess = () => {
    if (guess.length < 3) return;
    const guessWord = guess.map((x) => x.letter).join('');
    if (game.history.indexOf(guessWord) === -1) {
      const points = computeGuessPoints(guessWord);
      if (points === 0) {
        alert('nope!');
      }
      else {
        game.history.push(guessWord);
      }
      game.score += points;
    }
    else {
      alert('duplicate! 0 points');
    }
    guess.forEach((x) => x.guessed = false);
    guess.length = 0;
    redraw();
  }

  const removeGuess = (index: number) => {
    const x = guess[index];
    if (x) {
      guess.splice(index, 1);
      x.guessed = false;
    }
    redraw();
  };

  const onKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter') return submitGuess();
    for (const x of boardLetters) {
      if (x.letter === e.key && !x.guessed) {
        addGuess(x);
        break;
      }
    }
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      e.stopPropagation();
      return removeGuess(guess.length - 1);
    }
  };

  window.addEventListener('keypress', onKeyPress);
  window.addEventListener('keydown', onKeyDown);

  console.log({ baseWord: game.baseWord, boardLetters });

  const interval = setInterval(() => {
    secondsRemaining--;
    if (secondsRemaining === 0) {
      game.state = ENDED;
      clearInterval(interval);
    }
    redraw();
  }, 1000);

  return {
    onremove() {
      clearInterval(interval);
      window.removeEventListener('keypress', onKeyPress);
      window.removeEventListener('keydown', onKeyDown);
    },
    view() {
      return [
        m('.Time', 'time: ', secondsRemaining),
        m('.Score', 'score: ', game.score),
        m('br'),
        m('',
          guess.length === 0 ? m('.Guess-placeholder') : null,
          guess.map((x, i) => (
            m('button.Guess', {
              onclick: () => removeGuess(i)
            }, x.letter)
          ))
        ),
        m('',
          boardLetters.map((x) => (
            m('button.Letter-choice', {
              disabled: x.guessed,
              onclick: () => addGuess(x)
            }, x.letter)
          ))
        ),
        m('br'),
        m('button.Button', {
          disabled: guess.length < 3,
          onclick: submitGuess
        }, 'add guess'), // TODO: get a good enter symbol icon svg
      ];
    }
  };
};

const GameOver = () => {

  const gameEndedTime = Date.now();
  let answers: string[] = [];
  game.history.sort((a, b) => b.length - a.length);

  const startOver = () => {
    game.state = INIT;
    game.score = 0;
    game.history.length = 0;
    redraw();
  };

  const showAllAnswers = () => {
    console.time('compute');
    answers = computeAnswers(game.baseWord);
    console.timeEnd('compute');
    redraw();
  };

  const onKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'a') return showAllAnswers();
    if (e.key === 'n') {
      // prevent accidental restarts that could occur
      // if the player attempted to type "n" as a letter
      // during a guess in the final moment of the game
      if (Date.now() - gameEndedTime > 1000)
        return startOver();
    }
  };

  window.addEventListener('keypress', onKeyPress);

  return {
    onremove() {
      window.removeEventListener('keypress', onKeyPress);
    },
    view() {
      return [
        m('.Score', 'Score: ', game.score),
        m('table.Score-board',
          game.history.map((word) => (
            m('tr',
              m('td', word),
              m('td', computeGuessPoints(word)) // TODO: don't need to re-compute these here if they're saved in history
            )
          ))
        ),
        answers.length > 0 ? (
          m('table.Score-board',
            answers.map((word) => (
              m('tr',
                m('td', {
                  class: game.history.indexOf(word) !== -1 ? 'highlight' : ''
                }, word),
                m('td', computeGuessPoints(word)) // TODO: don't need to re-compute these here if they're saved in history
              )
            ))
          )
        ) : null,
        m('button.Button.mR10', {
          onclick: startOver
        }, m('u', 'n'), 'ew game'),
        answers.length === 0 ? (
          m('button.Button.mR10', {
            onclick: showAllAnswers
          }, 'show all ', m('u', 'a'), 'nswers')
        ) : null
      ];
    }
  };
};

const GameSettings = () => {

  const newGame = (wordLength: number) => {
    game.wordLength = wordLength;
    game.state = STARTED;
    redraw();
  }

  const onKeyPress = (e: KeyboardEvent) => {
    if (e.key === '6') return newGame(6);
    if (e.key === '7') return newGame(7);
  };

  window.addEventListener('keypress', onKeyPress);

  return {
    onremove() {
      window.removeEventListener('keypress', onKeyPress);
    },
    view() {
      return [
        m('button.Button.mR10', {
          onclick() {
            newGame(6);
          }
        }, m('u', '6'), ' letters'),
        m('button.Button', {
          onclick() {
            newGame(7);
          }
        }, m('u', '7'), ' letters')
      ];
    }
  };
};

const App = {
  view() {
    if (game.state === INIT) return m(GameSettings);
    if (game.state === STARTED) return m(Game);
    if (game.state === ENDED) return m(GameOver);
  }
};

const mountNode = document.getElementById('app');

function redraw() {
  console.time('render');
  m.render(<Element>mountNode, m(App));
  console.timeEnd('render');
}

redraw();
