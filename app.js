const API_KEY = '3fd2be6f0c70a2a598f084ddfb75487c';
const API_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

const loadingSpinner = document.getElementById('loading-spinner');
const toast = document.getElementById('toast');
const navLinks = document.querySelectorAll('.nav-link');
const navbarToggle = document.querySelector('.navbar-toggle');
const navbarMenu = document.querySelector('.navbar-menu');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const pages = document.querySelectorAll('.page');

let currentPage = 'home';
let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

document.addEventListener('DOMContentLoaded', initApp);

function initApp() {

  showPage('home');

  fetchTrendingMovies();
  fetchPopularMovies();
  fetchTopRatedMovies();
  fetchGenres();

  setupEventListeners();

  updateAuthUI();

  updateWatchlistUI();
}

function setupEventListeners() {

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = link.dataset.page;
      showPage(page);

      if (navbarMenu.classList.contains('active')) {
        navbarMenu.classList.remove('active');
      }
    });
  });

  navbarToggle.addEventListener('click', () => {
    navbarMenu.classList.toggle('active');
  });

  searchButton.addEventListener('click', handleSearch);
  searchInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  });

  document.getElementById('login-form').addEventListener('submit', handleLogin);
  document.getElementById('signup-form').addEventListener('submit', handleSignup);

  document.getElementById('add-to-watchlist').addEventListener('click', handleAddToWatchlist);

  document.addEventListener('click', (e) => {

    if (e.target.closest('.movie-card')) {
      const movieId = e.target.closest('.movie-card').dataset.id;
      if (movieId) {
        fetchMovieDetails(movieId);
      }
    }

    if (e.target.closest('.genre-card')) {
      const genreId = e.target.closest('.genre-card').dataset.id;
      const genreName = e.target.closest('.genre-card').textContent;
      if (genreId) {
        fetchMoviesByGenre(genreId, genreName);
      }
    }

    if (e.target.classList.contains('cta-button')) {
      const page = e.target.dataset.page;
      if (page) {
        showPage(page);
      }
    }
  });
}

function showPage(pageId) {

  pages.forEach(page => {
    page.classList.remove('active');
  });

  const targetPage = document.getElementById(`${pageId}-page`);
  if (targetPage) {
    targetPage.classList.add('active');
    currentPage = pageId;

    window.scrollTo(0, 0);

    if (pageId === 'categories') {
      if (document.querySelectorAll('#genres-grid .genre-card').length === 0) {
        fetchGenres();
      }
    }
  }
}

async function fetchData(endpoint, params = {}) {
  showLoading();

  try {
    const queryParams = new URLSearchParams({
      api_key: API_KEY,
      ...params
    });

    const response = await fetch(`${API_BASE_URL}${endpoint}?${queryParams}`);

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    hideLoading();
    return data;
  } catch (error) {
    hideLoading();
    showToast('Error fetching data. Please try again.', 'error');
    console.error('Error fetching data:', error);
    return null;
  }
}

async function fetchTrendingMovies() {
  const data = await fetchData('/trending/movie/day');
  if (data && data.results) {
    renderMovies(data.results, 'trending-movies');
  }
}

async function fetchPopularMovies() {
  const data = await fetchData('/movie/popular');
  if (data && data.results) {
    renderMovies(data.results, 'popular-movies');
  }
}

async function fetchTopRatedMovies() {
  const data = await fetchData('/movie/top_rated');
  if (data && data.results) {
    renderMovies(data.results, 'top-rated-movies');
  }
}

async function fetchMovieDetails(movieId) {
  const data = await fetchData(`/movie/${movieId}`, { append_to_response: 'credits,similar' });
  if (data) {
    renderMovieDetails(data);
    showPage('movie-details');
  }
}

async function fetchGenres() {
  const data = await fetchData('/genre/movie/list');
  if (data && data.genres) {
    renderGenres(data.genres);
  }
}

async function fetchMoviesByGenre(genreId, genreName) {
  const data = await fetchData('/discover/movie', { with_genres: genreId });
  if (data && data.results) {
    document.getElementById('category-title').textContent = genreName || 'Category';
    renderMovies(data.results, 'category-movies');
  }
}

async function handleSearch() {
  const query = searchInput.value.trim();
  if (query) {
    const data = await fetchData('/search/movie', { query });
    if (data && data.results) {
      document.getElementById('category-title').textContent = `Search Results for "${query}"`;
      renderMovies(data.results, 'category-movies');
      showPage('categories');
    }
  }
}

function renderMovies(movies, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';

  movies.forEach(movie => {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.dataset.id = movie.id;

    const posterPath = movie.poster_path
      ? `${IMAGE_BASE_URL}/w500${movie.poster_path}`
      : 'https://via.placeholder.com/500x750?text=No+Image';

    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
    const year = movie.release_date ? new Date(movie.release_date).getFullYear() : '';

    card.innerHTML = `
      <div class="movie-card-poster">
        <img src="${posterPath}" alt="${movie.title}">
        <div class="movie-card-overlay">
          <button>Təfərrüatlara baxın</button>
        </div>
      </div>
      <div class="movie-card-content">
        <h3 class="movie-card-title">${movie.title}</h3>
        <div class="movie-card-info">
          <span>${year}</span>
          <span class="movie-card-rating">
            <i class="fas fa-star"></i> ${rating}
          </span>
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

function renderMovieDetails(movie) {
  const backdropPath = movie.backdrop_path
    ? `${IMAGE_BASE_URL}/original${movie.backdrop_path}`
    : 'https://via.placeholder.com/1280x720?text=No+Backdrop';
  document.getElementById('movie-backdrop').src = backdropPath;
  const posterPath = movie.poster_path
    ? `${IMAGE_BASE_URL}/w500${movie.poster_path}`
    : 'https://via.placeholder.com/500x750?text=No+Poster';
  document.getElementById('movie-poster').src = posterPath;

  document.getElementById('movie-title').textContent = movie.title;
  document.getElementById('movie-year').textContent = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : '';
  document.getElementById('movie-runtime').textContent = movie.runtime
    ? `${movie.runtime} min`
    : '';
  document.getElementById('movie-rating').textContent = movie.vote_average
    ? `★ ${movie.vote_average.toFixed(1)}/10`
    : '';
  document.getElementById('movie-overview').textContent = movie.overview || 'No overview available';

  const genresContainer = document.getElementById('movie-genres');
  genresContainer.innerHTML = '';
  if (movie.genres && movie.genres.length > 0) {
    movie.genres.forEach(genre => {
      const genreSpan = document.createElement('span');
      genreSpan.textContent = genre.name;
      genresContainer.appendChild(genreSpan);
    });
  }

  const watchlistButton = document.getElementById('add-to-watchlist');
  watchlistButton.dataset.id = movie.id;

  const isInWatchlist = watchlist.some(item => item.id === movie.id);
  if (isInWatchlist) {
    watchlistButton.innerHTML = '<i class="fas fa-bookmark"></i> İzləmə siyahısından silin';
  } else {
    watchlistButton.innerHTML = '<i class="far fa-bookmark"></i> İzləmə siyahısına əlavə edin';
  }

  const castContainer = document.getElementById('movie-cast');
  castContainer.innerHTML = '';

  if (movie.credits && movie.credits.cast && movie.credits.cast.length > 0) {

    const topCast = movie.credits.cast.slice(0, 8);

    topCast.forEach(person => {
      const profilePath = person.profile_path
        ? `${IMAGE_BASE_URL}/w185${person.profile_path}`
        : 'https://via.placeholder.com/185x185?text=No+Image';

      const castCard = document.createElement('div');
      castCard.className = 'cast-card';
      castCard.innerHTML = `
        <div class="cast-image">
          <img src="${profilePath}" alt="${person.name}">
        </div>
        <div class="cast-name">${person.name}</div>
        <div class="cast-character">${person.character}</div>
      `;

      castContainer.appendChild(castCard);
    });
  }

  if (movie.similar && movie.similar.results && movie.similar.results.length > 0) {
    renderMovies(movie.similar.results.slice(0, 8), 'similar-movies');
  }
}

function renderGenres(genres) {
  const container = document.getElementById('genres-grid');
  if (!container) return;

  container.innerHTML = '';

  genres.forEach(genre => {
    const card = document.createElement('div');
    card.className = 'genre-card';
    card.dataset.id = genre.id;
    card.textContent = genre.name;

    container.appendChild(card);
  });
}

function handleAddToWatchlist() {
  if (!currentUser) {
    showToast('Filmləri izləmə siyahınıza əlavə etmək üçün daxil olun', 'error');
    showPage('login');
    return;
  }

  const movieId = parseInt(this.dataset.id);
  const isInWatchlist = watchlist.some(item => item.id === movieId);

  if (isInWatchlist) {

    watchlist = watchlist.filter(item => item.id !== movieId);
    this.innerHTML = '<i class="far fa-bookmark"></i> İzləmə siyahısına əlavə edin';
    showToast('İzləmə siyahısından silindi');
  } else {

    const title = document.getElementById('movie-title').textContent;
    const posterPath = document.getElementById('movie-poster').src;
    const year = document.getElementById('movie-year').textContent;
    const rating = document.getElementById('movie-rating').textContent.replace('★ ', '').replace('/10', '');

    watchlist.push({
      id: movieId,
      title,
      poster_path: posterPath,
      release_date: year ? `${year}-01-01` : '',
      vote_average: parseFloat(rating) || 0
    });

    this.innerHTML = '<i class="fas fa-bookmark"></i> İzləmə siyahısından silin';
    showToast('İzləmə siyahısına əlavə edildi');
  }

  localStorage.setItem('watchlist', JSON.stringify(watchlist));
  updateWatchlistUI();
}

function updateWatchlistUI() {
  const container = document.getElementById('watchlist-movies');
  const emptyWatchlist = document.getElementById('empty-watchlist');

  if (!container || !emptyWatchlist) return;

  if (watchlist.length === 0) {
    container.style.display = 'none';
    emptyWatchlist.style.display = 'block';
  } else {
    container.style.display = 'grid';
    emptyWatchlist.style.display = 'none';

    container.innerHTML = '';

    watchlist.forEach(movie => {
      const card = document.createElement('div');
      card.className = 'movie-card';
      card.dataset.id = movie.id;

      const year = movie.release_date ? new Date(movie.release_date).getFullYear() : '';
      const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';

      card.innerHTML = `
        <div class="movie-card-poster">
          <img src="${movie.poster_path}" alt="${movie.title}">
          <div class="movie-card-overlay">
            <button>View Details</button>
          </div>
        </div>
        <div class="movie-card-content">
          <h3 class="movie-card-title">${movie.title}</h3>
          <div class="movie-card-info">
            <span>${year}</span>
            <span class="movie-card-rating">
              <i class="fas fa-star"></i> ${rating}
            </span>
          </div>
        </div>
      `;

      container.appendChild(card);
    });
  }
}

function handleSignup(e) {
  e.preventDefault();

  const name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;
  const confirmPassword = document.getElementById('signup-confirm').value;

  if (!name || !email || !password) {
    showToast('Zəhmət olmasa bütün sahələri doldurun', 'error');
    return;
  }

  if (password !== confirmPassword) {
    showToast('Parollar uyğun gəlmir', 'error');
    return;
  }

  const user = { name, email };

  const users = JSON.parse(localStorage.getItem('users')) || [];
  const existingUser = users.find(u => u.email === email);

  if (existingUser) {
    showToast('Bu e-poçtu olan istifadəçi artıq mövcuddur', 'error');
    return;
  }

  users.push({ ...user, password });
  localStorage.setItem('users', JSON.stringify(users));

  currentUser = user;
  localStorage.setItem('currentUser', JSON.stringify(currentUser));

  updateAuthUI();

  showToast('Hesab uğurla yaradıldı!');
  showPage('home');
}

function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  if (!email || !password) {
    showToast('Zəhmət olmasa bütün sahələri doldurun', 'error');
    return;
  }

  const users = JSON.parse(localStorage.getItem('users')) || [];
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    showToast('Yanlış e-poçt və ya parol', 'error');
    return;
  }

  currentUser = { name: user.name, email: user.email };
  localStorage.setItem('currentUser', JSON.stringify(currentUser));

  updateAuthUI();

  showToast('Uğurla daxil olundu!');
  showPage('home');
}

function handleLogout() {

  currentUser = null;
  localStorage.removeItem('currentUser');


  watchlist = [];
  localStorage.removeItem('watchlist');


  updateAuthUI();
  updateWatchlistUI();


  showToast('Uğurla çıxıldı!');
  showPage('home');
}

function updateAuthUI() {
  const loginLink = document.querySelector('.nav-link[data-page="login"]');
  const signupLink = document.querySelector('.nav-link[data-page="signup"]');

  if (currentUser) {

    loginLink.textContent = `Salam, ${currentUser.name}`;
    loginLink.removeAttribute('data-page');
    loginLink.href = '#';


    signupLink.textContent = 'Çıxın';
    signupLink.removeAttribute('data-page');
    signupLink.href = '#';
    signupLink.addEventListener('click', handleLogout);
  } else {

    loginLink.textContent = 'Daxil ol';
    loginLink.setAttribute('data-page', 'login');

    signupLink.textContent = 'Qeydiyyat';
    signupLink.setAttribute('data-page', 'signup');
    signupLink.removeEventListener('click', handleLogout);
  }
}

function showLoading() {
  loadingSpinner.classList.add('active');
}

function hideLoading() {
  loadingSpinner.classList.remove('active');
}

function showToast(message, type = 'success') {
  toast.textContent = message;
  toast.className = 'toast';

  if (type === 'error') {
    toast.classList.add('error');
  }

  toast.classList.add('active');

  setTimeout(() => {
    toast.classList.remove('active');
  }, 3000);
}
