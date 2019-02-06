console.log({ wordList, words6, words7 });

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
  history: string[];
  score: number;
}

const game: GameState = {
  state: INIT,
  wordLength: 6,
  history: [],
  score: 0
}

interface Choice {
  letter: string;
  guessed: boolean;
}

const Game = () => {

  const goodWords = game.wordLength === 6 ? words6 : words7;
  const baseWord = randomWord(goodWords);
  const boardLetters: Choice[] = shuffle(baseWord).split('').map((letter) => ({ letter, guessed: false }));
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
      // console.time('compute guess points');
      const points = computeGuessPoints(guessWord);
      // console.timeEnd('compute guess points');
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
    if (e.key === 'Backspace') return removeGuess(guess.length - 1);
  };

  window.addEventListener('keypress', onKeyPress);
  window.addEventListener('keydown', onKeyDown);

  console.log({ baseWord, boardLetters });

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
        }, 'add guess')
      ];
    }
  };
};

const GameOver = () => {
  game.history.sort((a, b) => b.length - a.length);

  const newGame = () => {
    game.state = INIT;
    game.score = 0;
    game.history.length = 0;
    redraw();
  };

  return {
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
        m('button.Button', {
          onclick: newGame
        }, 'new game')
      ];
    }
  };
};

const GameSettings = {
  view() {
    return [
      m('button.Button.mR10', {
        onclick() {
          game.wordLength = 6;
          game.state = STARTED;
          redraw();
        }
      }, '6 letters'),
      m('button.Button', {
        onclick() {
          game.wordLength = 6;
          game.state = STARTED;
          redraw();
        }
      }, '7 letters')
    ];
  }
}

const App = {
  view() {
    if (game.state === INIT) return m(GameSettings);
    if (game.state === STARTED) return m(Game);
    if (game.state === ENDED) return m(GameOver);
  }
};

const mountNode = document.getElementById('app');

function redraw() {
  // console.time('render');
  m.render(<Element>mountNode, m(App));
  // console.timeEnd('render');
}

redraw();
