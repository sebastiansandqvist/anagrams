(function () {
  'use strict';

  console.log({ wordList: wordList, words6: words6, words7: words7 });
  var points = {
      '3': 100,
      '4': 400,
      '5': 1200,
      '6': 2000,
      '7': 3400
  };
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
      history: [],
      score: 0
  };
  var Game = function () {
      var goodWords = game.wordLength === 6 ? words6 : words7;
      var baseWord = randomWord(goodWords);
      var boardLetters = shuffle(baseWord).split('').map(function (letter) { return ({ letter: letter, guessed: false }); });
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
              // console.time('compute guess points');
              var points_1 = computeGuessPoints(guessWord);
              // console.timeEnd('compute guess points');
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
          if (e.key === 'Backspace')
              return removeGuess(guess.length - 1);
      };
      window.addEventListener('keypress', onKeyPress);
      window.addEventListener('keydown', onKeyDown);
      console.log({ baseWord: baseWord, boardLetters: boardLetters });
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
              return [
                  m('.Time', 'time: ', secondsRemaining),
                  m('.Score', 'score: ', game.score),
                  m('br'),
                  m('', guess.length === 0 ? m('.Guess-placeholder') : null, guess.map(function (x, i) { return (m('button.Guess', {
                      onclick: function () { return removeGuess(i); }
                  }, x.letter)); })),
                  m('', boardLetters.map(function (x) { return (m('button.Letter-choice', {
                      disabled: x.guessed,
                      onclick: function () { return addGuess(x); }
                  }, x.letter)); })),
                  m('br'),
                  m('button.Button', {
                      disabled: guess.length < 3,
                      onclick: submitGuess
                  }, 'add guess')
              ];
          }
      };
  };
  var GameOver = function () {
      game.history.sort(function (a, b) { return b.length - a.length; });
      var newGame = function () {
          game.state = INIT;
          game.score = 0;
          game.history.length = 0;
          redraw();
      };
      return {
          view: function () {
              return [
                  m('.Score', 'Score: ', game.score),
                  m('table.Score-board', game.history.map(function (word) { return (m('tr', m('td', word), m('td', computeGuessPoints(word)) // TODO: don't need to re-compute these here if they're saved in history
                  )); })),
                  m('button.Button', {
                      onclick: newGame
                  }, 'new game')
              ];
          }
      };
  };
  var GameSettings = {
      view: function () {
          return [
              m('button.Button.mR10', {
                  onclick: function () {
                      game.wordLength = 6;
                      game.state = STARTED;
                      redraw();
                  }
              }, '6 letters'),
              m('button.Button', {
                  onclick: function () {
                      game.wordLength = 6;
                      game.state = STARTED;
                      redraw();
                  }
              }, '7 letters')
          ];
      }
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
      // console.time('render');
      m.render(mountNode, m(App));
      // console.timeEnd('render');
  }
  redraw();

}());
