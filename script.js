document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const animeGrid = document.getElementById('anime-grid');
    const loadMoreBtn = document.getElementById('load-more');
    const listTitle = document.getElementById('list-title');
    const loadingElement = document.getElementById('loading');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const menuToggle = document.getElementById('menu-toggle');
    const nav = document.querySelector('nav');
    const modal = document.getElementById('anime-modal');
    const closeModal = document.querySelector('.close-modal');
    const modalBody = document.getElementById('modal-body');
    const typeFilter = document.getElementById('type-filter');
    const genreFilter = document.getElementById('genre-filter');
    const sortFilter = document.getElementById('sort-filter');
    
    // State variables
    let currentPage = 1;
    let currentCategory = 'top';
    let isLoading = false;
    let hasMore = true;
    
    // Initialize the app
    init();
    
    function init() {
        fetchTopAnime();
        setupEventListeners();
    }
    
    function setupEventListeners() {
        // Navigation category clicks
        document.querySelectorAll('nav a').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                if (this.classList.contains('active')) return;
                
                // Update active state
                document.querySelector('nav a.active').classList.remove('active');
                this.classList.add('active');
                
                // Reset and fetch new category
                currentCategory = this.dataset.category;
                currentPage = 1;
                hasMore = true;
                animeGrid.innerHTML = '';
                updateListTitle();
                fetchAnimeByCategory();
            });
        });
        
        // Load more button
        loadMoreBtn.addEventListener('click', function() {
            if (!isLoading && hasMore) {
                currentPage++;
                fetchAnimeByCategory();
            }
        });
        
        // Search functionality
        searchBtn.addEventListener('click', searchAnime);
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') searchAnime();
        });
        
        // Mobile menu toggle
        menuToggle.addEventListener('click', function() {
            nav.classList.toggle('active');
        });
        
        // Modal close
        closeModal.addEventListener('click', function() {
            modal.style.display = 'none';
        });
        
        // Close modal when clicking outside
        window.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
        
        // Filter changes
        typeFilter.addEventListener('change', function() {
            resetAndFetch();
        });
        
        genreFilter.addEventListener('change', function() {
            resetAndFetch();
        });
        
        sortFilter.addEventListener('change', function() {
            resetAndFetch();
        });
    }
    
    function resetAndFetch() {
        currentPage = 1;
        hasMore = true;
        animeGrid.innerHTML = '';
        fetchAnimeByCategory();
    }
    
    function updateListTitle() {
        const titles = {
            'top': 'Top Anime',
            'airing': 'Currently Airing',
            'upcoming': 'Upcoming Anime',
            'movie': 'Top Anime Movies'
        };
        listTitle.textContent = titles[currentCategory] || 'Anime List';
    }
    
    async function fetchAnimeByCategory() {
        let url;
        
        switch(currentCategory) {
            case 'top':
                url = `https://api.jikan.moe/v4/top/anime?page=${currentPage}`;
                break;
            case 'airing':
                url = `https://api.jikan.moe/v4/top/anime?filter=airing&page=${currentPage}`;
                break;
            case 'upcoming':
                url = `https://api.jikan.moe/v4/top/anime?filter=upcoming&page=${currentPage}`;
                break;
            case 'movie':
                url = `https://api.jikan.moe/v4/top/anime?type=movie&page=${currentPage}`;
                break;
            default:
                url = `https://api.jikan.moe/v4/top/anime?page=${currentPage}`;
        }
        
        // Apply filters
        const type = typeFilter.value;
        const genre = genreFilter.value;
        const sort = sortFilter.value;
        
        if (type !== 'all') {
            url += `&type=${type}`;
        }
        
        if (genre !== 'all') {
            // Note: Jikan API doesn't support genre filtering in top endpoint
            // This would require using the search endpoint with genre_id
            // For simplicity, we'll just show a message
            alert('Genre filtering requires using the search feature. Please use the search box for genre filtering.');
            return;
        }
        
        if (sort !== 'score') {
            // Jikan API doesn't support sorting in top endpoint
            // We would need to fetch all and sort client-side
            // For simplicity, we'll just show a message
            alert('Sorting requires client-side implementation. Currently sorted by score as provided by the API.');
            return;
        }
        
        fetchAnime(url);
    }
    
    async function fetchTopAnime() {
        const url = 'https://api.jikan.moe/v4/top/anime';
        fetchAnime(url);
    }
    
    async function searchAnime() {
        const query = searchInput.value.trim();
        if (!query) return;
        
        // Reset for new search
        currentPage = 1;
        hasMore = true;
        animeGrid.innerHTML = '';
        listTitle.textContent = `Search Results for "${query}"`;
        
        const url = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&page=${currentPage}`;
        fetchAnime(url);
    }
    
    async function fetchAnime(url) {
        if (isLoading) return;
        
        isLoading = true;
        loadingElement.style.display = 'block';
        loadMoreBtn.style.display = 'none';
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            // Check if we've reached the end
            if (data.pagination && !data.pagination.has_next_page) {
                hasMore = false;
                loadMoreBtn.style.display = 'none';
            } else {
                loadMoreBtn.style.display = 'block';
            }
            
            displayAnime(data.data);
        } catch (error) {
            console.error('Error fetching anime:', error);
            animeGrid.innerHTML = '<p class="error">Failed to load anime. Please try again later.</p>';
        } finally {
            isLoading = false;
            loadingElement.style.display = 'none';
        }
    }
    
    function displayAnime(animeList) {
        if (!animeList || animeList.length === 0) {
            animeGrid.innerHTML = '<p>No anime found.</p>';
            return;
        }
        
        animeList.forEach(anime => {
            const animeCard = document.createElement('div');
            animeCard.className = 'anime-card';
            animeCard.innerHTML = `
                <img src="${anime.images?.jpg?.image_url || 'https://via.placeholder.com/300x450'}" alt="${anime.title}">
                <div class="anime-info">
                    <h3>${anime.title}</h3>
                    <div class="anime-meta">
                        <span>${anime.type || 'N/A'}</span>
                        <span class="anime-score"><i class="fas fa-star"></i>${anime.score || 'N/A'}</span>
                    </div>
                </div>
            `;
            
            animeCard.addEventListener('click', () => showAnimeDetails(anime));
            animeGrid.appendChild(animeCard);
        });
    }
    
    async function showAnimeDetails(anime) {
        loadingElement.style.display = 'block';
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        try {
            // Fetch more detailed information
            const response = await fetch(`https://api.jikan.moe/v4/anime/${anime.mal_id}/full`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const { data } = await response.json();
            
            // Format genres
            const genres = data.genres?.map(g => g.name).join(', ') || 'N/A';
            
            // Format studios
            const studios = data.studios?.map(s => s.name).join(', ') || 'N/A';
            
            // Format date
            const startDate = data.aired?.prop?.from 
                ? `${data.aired.prop.from.year}-${data.aired.prop.from.month}-${data.aired.prop.from.day}`
                : 'N/A';
            
            // Create modal content
            modalBody.innerHTML = `
                <div class="modal-anime">
                    <div class="modal-poster">
                        <img src="${data.images?.jpg?.large_image_url || data.images?.jpg?.image_url || 'https://via.placeholder.com/300x450'}" alt="${data.title}">
                    </div>
                    <div class="modal-content">
                        <h2 class="modal-title">${data.title}</h2>
                        <div class="modal-meta">
                            <span>${data.type || 'N/A'}</span>
                            <span>${data.status || 'N/A'}</span>
                            <span>${data.episodes || '?'} eps</span>
                            <span>${data.duration || 'N/A'}</span>
                        </div>
                        <div class="modal-score">
                            <i class="fas fa-star"></i> ${data.score || 'N/A'} ${data.scored_by ? `(${Intl.NumberFormat().format(data.scored_by)} votes)` : ''}
                        </div>
                        <div class="modal-synopsis">
                            <h3>Synopsis</h3>
                            <p>${data.synopsis || 'No synopsis available.'}</p>
                        </div>
                        <div class="modal-details">
                            <div class="modal-detail">
                                <strong>Japanese Title</strong>
                                <span>${data.title_japanese || 'N/A'}</span>
                            </div>
                            <div class="modal-detail">
                                <strong>Genres</strong>
                                <span>${genres}</span>
                            </div>
                            <div class="modal-detail">
                                <strong>Studios</strong>
                                <span>${studios}</span>
                            </div>
                            <div class="modal-detail">
                                <strong>Premiered</strong>
                                <span>${startDate}</span>
                            </div>
                            <div class="modal-detail">
                                <strong>Rating</strong>
                                <span>${data.rating || 'N/A'}</span>
                            </div>
                            <div class="modal-detail">
                                <strong>Source</strong>
                                <span>${data.source || 'N/A'}</span>
                            </div>
                        </div>
                        ${data.trailer?.url ? `
                        <div class="modal-trailer">
                            <h3>Trailer</h3>
                            <a href="${data.trailer.url}" target="_blank" class="btn">
                                <i class="fab fa-youtube"></i> Watch Trailer
                            </a>
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error fetching anime details:', error);
            modalBody.innerHTML = '<p class="error">Failed to load anime details. Please try again later.</p>';
        } finally {
            loadingElement.style.display = 'none';
        }
    }
});