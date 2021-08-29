const Symbols = [
  'https://image.flaticon.com/icons/svg/105/105223.svg', // 黑桃
  'https://image.flaticon.com/icons/svg/105/105220.svg', // 愛心
  'https://image.flaticon.com/icons/svg/105/105212.svg', // 方塊
  'https://image.flaticon.com/icons/svg/105/105219.svg', // 梅花
]

//定義遊戲過程的5個狀態
const GAME_STATE = {
  FirstCardAwaits: "FirstCardAwaits",
  SecondCardAwaits: "SecondCardAwaits",
  CardsMatchFailed: "CardsMatchFailed",
  CardsMatched: "CardsMatched",
  GameFinished: "GameFinished",
}

//可以看到變化的動作都在這裡新增
const view = {
  getCardContent(index) {
    const number = this.transformNumber((index % 13) + 1)
    const symbol = Symbols[Math.floor(index / 13)]
    return `<p>${number}</p>
      <img src="${symbol}" alt="">
      <p>${number}</p>`
  },

  getCardElement(index) {
    return `<div data-index="${index}" class="card back">
    </div>`
  },

  transformNumber(number) {
    switch (number) {
      case 1:
        return 'A'
      case 11:
        return 'J'
      case 12:
        return 'Q'
      case 13:
        return 'K'
      default:
        return number
    }
  },

  flipCards(...cards) {
    cards.map(card => {
      if (card.classList.contains('back')) {
        card.classList.remove('back')
        card.innerHTML = this.getCardContent(Number(card.dataset.index))
        return
      }
      card.classList.add('back')
      card.innerHTML = null
    })
  },


  displayCards(indexes) { //indexes為直接傳入的有52牌組的陣列
    const rootElement = document.querySelector('#cards')
    rootElement.innerHTML = indexes.map(index => this.getCardElement(index)).join('')
  },

  //配對後將牌加上顏色的css
  pairCards(...cards) {
    cards.map(card => {
      card.classList.add('paired')
    })
  },

  //新增renderScorew和嘗試次數
  renderScores(scores) {
    document.querySelector('.score').textContent = `Scores: ${scores}`
  },

  renderTimes(times) {
    document.querySelector('.tried').textContent = `You've tried ${times} times`
  },

  //下動畫
  appendWrongAnimation(...cards) {
    cards.map(card => {
      card.classList.add('wrong')
      card.addEventListener('animationend', event => event.target.classList.remove('wrong'), { once: true })
    })
  },

  //遊戲結束的畫面
  showGameFinished() {
    const div = document.createElement('div')
    div.classList.add('completed')
    div.innerHTML = `
      <p>Complete!</p>
      <p>Score: ${model.score}</p>
      <p>You've tried: ${model.triedTimes} times</p>
    `
    const header = document.querySelector('#header')
    header.before(div)
  },
}

const utility = {
  getRandomNumberArray(count) {
    const number = Array.from(Array(count).keys())
    for (let index = number.length - 1; index > 0; index--) {
      let randomIndex = Math.floor(Math.random() * (index + 1));
      [number[index], number[randomIndex]] = [number[randomIndex], number[index]]
    }
    return number
  }
}

//和流程有關的程式碼
const controller = {
  currentState: GAME_STATE.FirstCardAwaits,  // 定義初始狀態
  generateCards() {
    view.displayCards(utility.getRandomNumberArray(52)) //原本是把utility.getRandomNumberArray(52)放在displayCards()裡的
  },

  dispatchCardAction(card) {
    if (!card.classList.contains('back'))
      return
    switch (this.currentState) {
      case GAME_STATE.FirstCardAwaits:
        view.flipCards(card)
        model.revealedCards.push(card)
        this.currentState = GAME_STATE.SecondCardAwaits
        break
      case GAME_STATE.SecondCardAwaits:
        view.renderTimes(model.triedTimes += 1)
        view.flipCards(card)
        model.revealedCards.push(card)
        //判斷是否配對成功
        if (model.isRevealedCardsMatched()) {
          //配對成功
          view.renderScores(model.scores += 10)
          this.currentState = GAME_STATE.CardsMatched
          view.pairCards(...model.revealedCards)
          model.revealedCards = []
          if (model.scores === 260) {
            console.log('showGameFinished')
            this.currentState = GAME_STATE.GameFinished
            view.showGameFinished()  // 加在這裡
            return
          }
          this.currentState = GAME_STATE.FirstCardAwaits
        } else {
          //配對失敗
          this.currentState = GAME_STATE.CardsMatchFailed
          view.appendWrongAnimation(...model.revealedCards) //加動畫
          setTimeout(this.resetCards, 1000)
        }
        break
    }
  },
  resetCards() {
    view.flipCards(...model.revealedCards)
    model.revealedCards = []
    controller.currentState = GAME_STATE.FirstCardAwaits
  }
}


//和資料相關的程式碼，遊戲中重要的資料為翻開兩張牌的數字
//revealedCards 是一個暫存牌組，使用者每次翻牌時，就先把卡片丟進這個牌組，集滿兩張牌時就要檢查配對有沒有成功，檢查完以後，這個暫存牌組就需要清空。
const model = {
  revealedCards: [],

  isRevealedCardsMatched() {  //運用這個回傳的布林值到 controller 裡去設計 if/else 流程
    return this.revealedCards[0].dataset.index % 13 === this.revealedCards[1].dataset.index % 13
  },

  //新增Score/Triedtimes的變數，因為是資料處理的部分所以在model裡新增
  scores: 0,
  triedTimes: 0,
}

//程式中所有動作應該由 controller 統一發派，view 或 model 等其他元件只有在被 controller 呼叫時，才會動作。現在讓我們調整架構，不要讓 controller 以外的內部函式暴露在 global 的區域。
controller.generateCards() // 取代 view.displayCards()



//每一張卡片綁監聽器
document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('click', event => {
    console.log(card)
    controller.dispatchCardAction(card)
  })
})

