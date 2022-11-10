const BASE_URL = 'https://movie-list.alphacamp.io'
const INDEX_URL = BASE_URL + '/api/v1/movies/'
const POSTER_URL = BASE_URL + '/posters/'
const MOVIE_PER_PAGE = 12

const dataPanel = document.querySelector('#data-panel')
const searchForm = document.querySelector('#search-form')
const searchInput = document.querySelector('#search-input')
const paginator = document.querySelector('#paginator')


// 用來存放電影資料的容器
const movies = JSON.parse(localStorage.getItem('favoriteMovies'))
// 用來存放搜尋電影結果的容器
let filteredMovies = []
// 預設初始頁面顯示在第一頁
let currentPage = 1

// 在按鈕設監聽
dataPanel.addEventListener('click', function onPanelClicked(event) {
  if (event.target.matches('.btn-show-movie')) {
    showMovieModal(event.target.dataset.id)
  } else if (event.target.matches('.btn-remove-favorite')) {
    removeFromFavorite(Number(event.target.dataset.id))
  }
})

// 在 search bar 設監聽
searchForm.addEventListener('submit', function onSearchFormSubmitted(event) {
  // 取消預設事件
  event.preventDefault()
  // 取得搜尋關鍵字
  const keyword = searchInput.value.trim().toLowerCase()
  // 定義一個 filteredMovies 變數來裝篩選後符合條件的電影資料
  // 方法二：filter條件篩選
  filteredMovies = movies.filter((movie) =>
    movie.title.toLowerCase().includes(keyword)
  )
  //錯誤處理：無符合條件的結果
  if (filteredMovies.length === 0) {
    return alert(`您輸入的關鍵字：${keyword} 沒有符合條件的電影`)
  }
  currentPage = 1
  renderPaginator(filteredMovies.length)
  renderMovieList(getMovieByPage(currentPage))
})

// 建立即時顯示搜尋結果
searchInput.addEventListener('input', function onSearchFormInput() {
  const keyword = searchInput.value.trim().toLowerCase()
  filteredMovies = movies.filter((movie) =>
    movie.title.toLowerCase().includes(keyword)
  )
  if (filteredMovies.length === 0) {
    searchInput.value = ''
    return alert(`您輸入的關鍵字：${keyword} 沒有符合條件的電影`)
  }
  currentPage = 1
  renderPaginator(filteredMovies.length)
  renderMovieList(getMovieByPage(currentPage))
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
  renderMovieList(getMovieByPage(currentPage))
})

// 將 api 取得的資料渲染出來
function renderMovieList(data) {
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
          <button class="btn btn-primary btn-show-movie" data-bs-toggle="modal" data-bs-target="#movie-modal" data-id="${item.id}">More</button>
          <button class="btn btn-danger btn-remove-favorite" data-id="${item.id}">X</button>
        </div>
      </div>
    </div>
  </div>`
  })

  dataPanel.innerHTML = rawHTML
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

// 此處設計刪除我的最愛
function removeFromFavorite(id) {
  if (!movies || !movies.length) return
  // local storage 的資料，現在是存在 movies
  // 透過 id 找到要刪除電影的 index
  const movieIndex = movies.findIndex((movie) => movie.id === id)
  // 找不到這部電影
  if (movieIndex === -1) return
  // 刪除該筆電影
  movies.splice(movieIndex, 1)
  // 存回 local storage
  localStorage.setItem('favoriteMovies', JSON.stringify(movies))
  renderPaginator(movies.length)
  renderMovieList(getMovieByPage(currentPage))
  // 根據在不同頁面進行電影刪除，重新渲染畫面
  // 假設我的最愛目前有六頁，我在隨便一頁刪除電影時，例如第三頁，當我電影刪到剩五頁的數量時，我還是能停留在第三頁，不會頁數跳掉
  if (currentPage >= 1 && currentPage <= Math.ceil(movies.length / MOVIE_PER_PAGE)) {
    renderMovieList(getMovieByPage(currentPage))
    // 這段是用來處理在最後一頁進行刪除動作的情況，當我從第六頁開始刪除時，刪到第六頁沒東西時，我可以順利跳轉到第五頁，而不會出現空頁面
  } else if (movies.length % MOVIE_PER_PAGE === 0 && currentPage !== 1) {
    currentPage--
    renderMovieList(getMovieByPage(currentPage))
    paginator.lastElementChild.classList.add('active')
  }

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

// 此處設計放在每一分頁的電影清單是哪幾部
function getMovieByPage(page) {
  const data = filteredMovies.length ? filteredMovies : movies
  const startIndex = (page - 1) * MOVIE_PER_PAGE
  // 從選出來的電影總清單中，切出我們設定好的範圍，得出一個新的陣列，之後再用 renderMovieList(data) 渲染電影畫面
  return data.slice(startIndex, startIndex + MOVIE_PER_PAGE)
}
renderPaginator(movies.length)
renderMovieList(getMovieByPage(currentPage))