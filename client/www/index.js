(function () {
  'use strict';

  var points = {
      '3': 100,
      '4': 400,
      '5': 1200,
      '6': 2000,
      '7': 3400
  };
  function swap(a, b, arr) {
      var tmp = arr[a];
      arr[a] = arr[b];
      arr[b] = tmp;
  }
  function permutations(letters) {
      var permutations = [];
      var generate = function (n) {
          if (n == 1)
              permutations.push(letters.join(''));
          else {
              for (var i = 0; i != n; i++) {
                  generate(n - 1);
                  swap(n % 2 ? 0 : i, n - 1, letters);
              }
          }
      };
      generate(letters.length);
      return permutations;
  }
  function powerSet(letters) {
      var set = [[]];
      for (var i = 0; i < letters.length; i++) {
          for (var j = 0, len = set.length; j < len; j++) {
              set.push(set[j].concat(letters[i]));
          }
      }
      return set;
  }
  var dictSets;
  function computeAnswers(baseWord) {
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
      var letters = baseWord.split('');
      var ps = powerSet(letters).filter(function (x) { return x.length >= 3; });
      console.timeEnd('powerSet');
      var result = [];
      console.time('permute');
      for (var _i = 0, ps_1 = ps; _i < ps_1.length; _i++) {
          var s = ps_1[_i];
          for (var _a = 0, _b = permutations(s); _a < _b.length; _a++) {
              var permutation = _b[_a];
              if (dictSets[permutation.length].has(permutation)) {
                  result.push(permutation);
              }
          }
      }
      console.timeEnd('permute');
      // Array.from(new Set(arr)) is a fast? dedupe method
      return Array.from(new Set(result)).sort(function (a, b) {
          return b.length - a.length || a.localeCompare(b);
      });
  }
  // precondition: the guess string length is valid (3-7)
  // returns number of points for the word
  function computeGuessPoints(guess) {
      var arr = wordList[guess.length];
      if (!Array.isArray(arr))
          throw new Error('Invalid guess');
      if (arr.indexOf(guess) === -1)
          return 0;
      return points[guess.length] || 0;
  }
  function shuffle(word) {
      var letters = word.split('');
      // fisher-yates shuffle
      var currentIndex = letters.length;
      var temp;
      var randomIndex;
      while (currentIndex !== 0) {
          randomIndex = Math.floor(Math.random() * currentIndex);
          currentIndex--;
          temp = letters[currentIndex];
          letters[currentIndex] = letters[randomIndex];
          letters[randomIndex] = temp;
      }
      return letters.join('');
  }
  function randomWord(words) {
      return words[Math.floor(Math.random() * words.length)];
  }
  var INIT = 1;
  var STARTED = 2;
  var ENDED = 3;
  var game = {
      state: INIT,
      wordLength: 6,
      baseWord: '',
      dictionary: [],
      history: [],
      score: 0
  };
  var Game = function () {
      game.dictionary = game.wordLength === 6 ? words6 : words7;
      game.baseWord = randomWord(game.dictionary);
      var boardLetters = shuffle(game.baseWord).split('').map(function (letter) { return ({ letter: letter, guessed: false }); });
      var guess = [];
      var secondsRemaining = 60;
      var addGuess = function (x) {
          guess.push(x);
          x.guessed = true;
          redraw();
      };
      var submitGuess = function () {
          if (guess.length < 3)
              return;
          var guessWord = guess.map(function (x) { return x.letter; }).join('');
          if (game.history.indexOf(guessWord) === -1) {
              var points_1 = computeGuessPoints(guessWord);
              if (points_1 === 0) {
                  alert('nope!');
              }
              else {
                  game.history.push(guessWord);
              }
              game.score += points_1;
          }
          else {
              alert('duplicate! 0 points');
          }
          guess.forEach(function (x) { return x.guessed = false; });
          guess.length = 0;
          redraw();
      };
      var removeGuess = function (index) {
          var x = guess[index];
          if (x) {
              guess.splice(index, 1);
              x.guessed = false;
          }
          redraw();
      };
      var onKeyPress = function (e) {
          if (e.key === 'Enter')
              return submitGuess();
          for (var _i = 0, boardLetters_1 = boardLetters; _i < boardLetters_1.length; _i++) {
              var x = boardLetters_1[_i];
              if (x.letter === e.key && !x.guessed) {
                  addGuess(x);
                  break;
              }
          }
      };
      var onKeyDown = function (e) {
          if (e.key === 'Backspace') {
              e.preventDefault();
              return removeGuess(guess.length - 1);
          }
      };
      window.addEventListener('keypress', onKeyPress);
      window.addEventListener('keydown', onKeyDown);
      console.log({ baseWord: game.baseWord, boardLetters: boardLetters });
      var interval = setInterval(function () {
          secondsRemaining--;
          if (secondsRemaining === 0) {
              game.state = ENDED;
              clearInterval(interval);
          }
          redraw();
      }, 1000);
      return {
          onremove: function () {
              clearInterval(interval);
              window.removeEventListener('keypress', onKeyPress);
              window.removeEventListener('keydown', onKeyDown);
          },
          view: function () {
              var guessPlaceholders = [];
              for (var i = guess.length; i < game.wordLength; i++) {
                  guessPlaceholders.push(m('button.Guess-placeholder[disabled]', '_'));
              }
              return [
                  m('.Time', 'time: ', secondsRemaining),
                  m('.Score', 'score: ', game.score),
                  m('br'),
                  m('', guess.map(function (x, i) { return (m('button.Guess', {
                      onclick: function () { return removeGuess(i); }
                  }, x.letter)); }), guessPlaceholders),
                  m('', boardLetters.map(function (x) { return (m('button.Letter-choice', {
                      disabled: x.guessed,
                      onclick: function () { return addGuess(x); }
                  }, x.letter)); })),
                  m('br'),
                  m('button.Button', {
                      disabled: guess.length < 3,
                      onclick: submitGuess
                  }, 'add guess'),
              ];
          }
      };
  };
  var GameOver = function () {
      var gameEndedTime = Date.now();
      var answers = [];
      game.history.sort(function (a, b) { return b.length - a.length; });
      var startOver = function () {
          game.state = INIT;
          game.score = 0;
          game.history.length = 0;
          redraw();
      };
      var showAllAnswers = function () {
          console.time('compute');
          answers = computeAnswers(game.baseWord);
          console.timeEnd('compute');
          redraw();
      };
      var onKeyPress = function (e) {
          if (e.key === 'a')
              return showAllAnswers();
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
          onremove: function () {
              window.removeEventListener('keypress', onKeyPress);
          },
          view: function () {
              return [
                  m('.Score', 'Score: ', game.score),
                  m('table.Score-board', game.history.map(function (word) { return (m('tr', m('td', word), m('td', computeGuessPoints(word)) // TODO: don't need to re-compute these here if they're saved in history
                  )); })),
                  m('button.Button.mR10', {
                      onclick: startOver
                  }, m('u', 'n'), 'ew game'),
                  m('button.Button', {
                      disabled: answers.length !== 0,
                      onclick: showAllAnswers
                  }, 'show all ', m('u', 'a'), 'nswers'),
                  answers.length > 0 ? (m('table.Score-board', answers.map(function (word) { return (m('tr', m('td', {
                      class: game.history.indexOf(word) !== -1 ? 'highlight' : ''
                  }, word), m('td', computeGuessPoints(word)) // TODO: don't need to re-compute these here if they're saved in history
                  )); }))) : null
              ];
          }
      };
  };
  var GameSettings = function () {
      var newGame = function (wordLength) {
          game.wordLength = wordLength;
          game.state = STARTED;
          redraw();
      };
      var onKeyPress = function (e) {
          if (e.key === '6')
              return newGame(6);
          if (e.key === '7')
              return newGame(7);
      };
      window.addEventListener('keypress', onKeyPress);
      return {
          onremove: function () {
              window.removeEventListener('keypress', onKeyPress);
          },
          view: function () {
              return [
                  m('button.Button.mR10', {
                      onclick: function () {
                          newGame(6);
                      }
                  }, m('u', '6'), ' letters'),
                  m('button.Button', {
                      onclick: function () {
                          newGame(7);
                      }
                  }, m('u', '7'), ' letters')
              ];
          }
      };
  };
  var App = {
      view: function () {
          if (game.state === INIT)
              return m(GameSettings);
          if (game.state === STARTED)
              return m(Game);
          if (game.state === ENDED)
              return m(GameOver);
      }
  };
  var mountNode = document.getElementById('app');
  function redraw() {
      console.time('render');
      m.render(mountNode, m(App));
      console.timeEnd('render');
  }
  redraw();

}());
