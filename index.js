const BASE_URL = 'https://movie-list.alphacamp.io'
const INDEX_URL = BASE_URL + '/api/v1/movies/'
const POSTER_URL = BASE_URL + '/posters/'
const MOVIE_PER_PAGE = 12

const dataPanel = document.querySelector('#data-panel')
const searchForm = document.querySelector('#search-form')
const searchInput = document.querySelector('#search-input')
const paginator = document.querySelector('#paginator')
const changeMode = document.querySelector('#icon-change-mode')
const resetMode = document.querySelectorAll('#icon-change-mode i')

// 用來存放所有電影資料的容器
const movies = []
// 用來存放搜尋電影結果的容器
let filteredMovies = []
// 預設初始排版模式為圖片庫
let currentMode = "card"
// 預設初始頁面顯示在第一頁
let currentPage = 1

// 取得資料，
axios.get(INDEX_URL).then((response) => {
  // console.log(response.data.results)

  // 方法一：用 for 迴圈來丟資料進去
  // for (const movie of response.data.results) {
  //   movies.push(movie)
  // }
  // 方法二：... 三個點點就是展開運算子，他的主要功用是「展開陣列元素」
  movies.push(...response.data.results)
  // 將電影的數量放進去，讓 renderPaginator() 計算要分出幾個分頁
  renderPaginator(movies.length)
  // 串接 API 拿到電影總清單 movies 以後 ，不要一口氣全部輸出，只要顯示第 1 頁的資料就好
  renderMovie(currentMode)
}).catch((error) => console.log(error))

// 在按鈕設監聽
dataPanel.addEventListener('click', function onPanelClicked(event) {
  const id = event.target.dataset.id
  const target = event.target
  const parent = target.parentElement
  if (target.matches('.btn-show-movie')) {
    showMovieModal(Number(id))
  }
  // 新增下列判斷式
  else if (target.matches(".btn-add-favorite")) {
    addToFavorite(Number(id))
    // 符合條件，所以移除 + 符號
    target.remove()
    // 經由 favoriteButtonHTML 的判斷，加上 X 符號
    parent.innerHTML += favoriteButtonHTML(Number(id))
  } else if (target.matches(".btn-remove-favorite")) {
    cancelFromHome(Number(id))
    // 符合條件，所以移除 X 符號
    target.remove()
    // 經由 favoriteButtonHTML 的判斷，加上 + 符號
    parent.innerHTML += favoriteButtonHTML(Number(id))
  }
})

// 在 search bar 設監聽
searchForm.addEventListener('submit', function onSearchFormSubmitted(event) {
  // 取消預設事件
  event.preventDefault()
  // 取得搜尋關鍵字
  const keyword = searchInput.value.trim().toLowerCase()
  // 定義一個 filteredMovies 變數來裝篩選後符合條件的電影資料
  // 因為搜尋結果也要分頁，代表其他地方也想取用這個變數，需要把 filteredMovies 變成全域變數，所以就放到外面
  // let filteredMovies = []

  // 方法一：for-of
  // for (const movie of movies) {
  //   if (movie.title.toLowerCase().includes(keyword)) {
  //     filteredMovies.push(movie)
  //   }
  // }

  // 方法二：filter條件篩選
  filteredMovies = movies.filter((movie) =>
    movie.title.toLowerCase().includes(keyword)
  )
  //錯誤處理：無符合條件的結果
  if (filteredMovies.length === 0) {
    searchInput.value = ''
    return alert(`您輸入的關鍵字：${keyword} 沒有符合條件的電影`)
  }
  // 當我在其他頁面(非第一頁)進行搜尋時，我的搜尋結果會從第一頁開始，避免搜尋出空頁面，所以將 currentPage 重新設回第一頁
  currentPage = 1
  // 重製分頁器
  renderPaginator(filteredMovies.length)
  renderMovie(currentMode)
})

// 建立即時顯示搜尋結果
searchInput.addEventListener('input', function onSearchFormSubmitted() {
  const keyword = searchInput.value.trim().toLowerCase()
  filteredMovies = movies.filter((movie) =>
    movie.title.toLowerCase().includes(keyword)
  )
  if (filteredMovies.length === 0) {
    searchInput.value = ''
    return alert(`您輸入的關鍵字：${keyword} 沒有符合條件的電影`)
  }
  // 當我在其他頁面(非第一頁)進行搜尋時，我的搜尋結果會從第一頁開始，避免搜尋出空頁面，所以將 currentPage 重新設回第一頁
  currentPage = 1
  renderPaginator(filteredMovies.length)
  renderMovie(currentMode)
})
// 在 paginator 設監聽
paginator.addEventListener('click', function onPaginatorClicked(event) {
  // 如果被點擊的不是 <a> 標籤，就不做任何動作
  if (event.target.tagName !== 'A') return
  // 透過 dataset 取得被點擊的頁數
  currentPage = Number(event.target.dataset.page)
  // 判斷是一般瀏覽畫面還是搜尋畫面的頁碼
  renderPaginator(filteredMovies.length !== 0 ? filteredMovies.length : movies.length)
  // 根據指定的分頁重新渲染畫面
  renderMovie(currentMode)
})

// 監聽 icon 現在是哪一個模式
changeMode.addEventListener('click', function onChangeModeClicked(event) {
  for (let i = 0; i < resetMode.length; i++) {
    console.log(resetMode[i])
    resetMode[i].classList.remove('changeMode')
  }
  if (event.target.matches('#card-mode-button')) {
    event.target.classList.add('changeMode')
    currentMode = "card"
    renderMovie(currentMode)
  } else if (event.target.matches('#list-mode-button')) {
    event.target.classList.add('changeMode')
    currentMode = "list"
    renderMovie(currentMode)
  }
})

// 新增用來記錄要渲染哪個排版模式
function renderMovie(mode) {
  if (mode === "card") {
    renderMovieCard(getMovieByPage(currentPage))
  } else {
    renderMovieList(getMovieByPage(currentPage))
  }
}

// 將 api 取得的資料渲染出來，這裡重新修改成卡片模式
function renderMovieCard(data) {
  let rawHTML = ''
  data.forEach((item) => {
    rawHTML += `<div class="col-sm-3">
    <div class="mb-2">
      <div class="card">
        <img src="${POSTER_URL + item.image}" class="card-img-top" alt="Movie Poster">
        <div class="card-body">
          <h5 class="card-title">${item.title}</h5>
        </div>
        <div class="card-footer">
          <button class="btn btn-primary btn-show-movie" data-bs-toggle="modal" data-bs-target="#movie-modal" 
          data-id="${item.id}">More</button>
          ${favoriteButtonHTML(item.id)}
        </div>
      </div>
    </div>
  </div>`
  })
  dataPanel.innerHTML = rawHTML
}

// 新增列表模式
function renderMovieList(data) {
  let rawHTML = `<ul class="list-group col-sm-12 mb-2">`
  data.forEach((item) => {
    rawHTML += `
      <li class="list-group-item d-flex justify-content-between">
        <p class="list-title">${item.title}</p>
        <div>
          <button class="btn btn-primary btn-show-movie" data-bs-toggle="modal" data-bs-target="#movie-modal"
            data-id="${item.id}">More</button>
          ${favoriteButtonHTML(item.id)}
        </div>
      </li>`
  })
  rawHTML += '</ul>'
  dataPanel.innerHTML = rawHTML
}

// 參考別人做法，讓蒐藏電影的按鈕可以改變 
function favoriteButtonHTML(id) {
  // 用來檢查是否已經有儲存影片了，我的程式之前就是少了這項判斷，所以重整頁面時，蒐藏的按鈕會一直跑會預設圖示(例如點擊完變成 X 符號，但一重整頁面又變回 + 符號)
  const favoriteMovies = JSON.parse(localStorage.getItem("favoriteMovies")) || []
  let btnHTML = ''

  if (!favoriteMovies.some(movie => movie.id === id)) {
    // 蒐藏電影清單裡沒有這部電影，所以主頁的蒐藏按鈕依然呈現加號
    btnHTML = `<button type="button" class="btn btn-info btn-add-favorite" data-id="${id}">+</button>`
  } else {
    // 蒐藏電影清單裡有這部電影，所以主頁的蒐藏按鈕呈現叉叉，讓你可以進行刪除的動作
    btnHTML = `<button type="button" class="btn btn-danger btn-remove-favorite" data-id="${id}">X</button>`
  }
  return btnHTML
}

// 用資料的 id 將特定電影資料渲染到 modal
function showMovieModal(id) {
  // 找出 Modal 裡我們想要替換的地方
  const modalTitle = document.querySelector('#movie-modal-title')
  const modalImage = document.querySelector('#movie-modal-image')
  const modalDate = document.querySelector('#movie-modal-date')
  const modalDescription = document.querySelector('#movie-modal-description')
  axios.get(INDEX_URL + id).then((response) => {
    const data = response.data.results
    modalTitle.innerText = data.title
    modalDate.innerText = 'Release date: ' + data.release_date
    modalDescription.innerText = data.description
    modalImage.innerHTML = `<img src="${POSTER_URL + data.image
      }" alt="movie-poster" class="img-fluid">`
  }).catch((error) => console.log(error))
}

// 此處設計收藏電影清單
function addToFavorite(id) {
  // 去取目前在 local storage 的資料，放進收藏清單，因為取出的資料是字串，需用 JSON.parse() 轉成物件做運算，如果裡面沒資料就回傳空陣列
  const list = JSON.parse(localStorage.getItem('favoriteMovies')) || []

  // 傳入電影的 id，請 find 去電影總表中查看，找出 id 相同的電影物件回傳，暫存在 movie
  const movie = movies.find((movie) => movie.id === id)

  // 假設點擊的電影已經存在 list 裡的話，就跳出提醒文字
  if (list.some((movie) => movie.id === id)) {
    return alert('此電影已經在收藏清單中！')
  } else {
    // 如果沒有這部電影，就推進 list
    list.push(movie)
  }

  // 最後將 list 資料用 JSON.stringify() 轉成字串，把更新後的資料同步到 local storage
  localStorage.setItem('favoriteMovies', JSON.stringify(list))
}

// 新增此處設計可以直接從主頁就取消蒐藏，不用跳到我的最愛再來刪除
function cancelFromHome(id) {
  let list = JSON.parse(localStorage.getItem('favoriteMovies'))
  const listIndex = list.findIndex(item => item.id === id)
  list.splice(listIndex, 1)
  localStorage.setItem('favoriteMovies', JSON.stringify(list))
}

// 此處設計放在每一分頁的電影清單是哪幾部
function getMovieByPage(page) {
  // 如果搜尋結果有東西，條件判斷為 true，會回傳 filteredMovies，反之，則回傳 movies，然後用 data 保存回傳值
  const data = filteredMovies.length ? filteredMovies : movies
  // page 1 → movies 0 ~ 11
  // page 2 → movies 12 ~ 23
  // page 3 → movies 24 ~ 35
  // ...
  const startIndex = (page - 1) * MOVIE_PER_PAGE
  // 從選出來的電影總清單中，切出我們設定好的範圍，得出一個新的陣列，之後再用 renderMovieList(data) 渲染電影畫面
  return data.slice(startIndex, startIndex + MOVIE_PER_PAGE)
}

// 按照電影的總數量計算出會有多少分頁數
function renderPaginator(amount) {
  // 計算總頁數
  const numberOfPages = Math.ceil(amount / MOVIE_PER_PAGE)
  // 製作 template
  let paginatorHTML = ''
  for (let page = 1; page <= numberOfPages; page++) {
    // 判斷只有在當下頁面才加上 active
    let pageActive = currentPage === page ? 'active' : ''
    paginatorHTML += `
    <li class="page-item ${pageActive}"><a class="page-link" href="#" data-page="${page}">${page}</a></li>
    `
  }
  paginator.innerHTML = paginatorHTML
}