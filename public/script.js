let allMovies = [];
let filteredMovies = [];

// Get the base URL dynamically - updated for Render
const API_BASE_URL = (() => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:3006';
    }
    return window.location.origin;
})();
function createModalsFields(movies, { clear = false } = {}) {
    const container = document.getElementById('movies-container');

    if (clear) container.innerHTML = '';

    if (movies.length === 0 && clear) {
        container.innerHTML = `
            <div class="no-movies">
                <i class="fas fa-film"></i>
                <h3>Nenhum filme encontrado</h3>
                <p>Tente ajustar os filtros para ver mais resultados</p>
            </div>
        `;
        return;
    }

    movies.forEach((movie) => {
        const safeId = movie.title.replace(/\W+/g, '-');

        if (document.getElementById(safeId)) return;

        const card = document.createElement('div');
        card.classList.add('movie-card');
        card.id = safeId;
        card.style.backgroundImage = `url(${movie.poster || 'placeholder.jpg'})`;
        card.addEventListener('click', () => openModal(movie));

        const cardInfo = document.createElement('div');
        cardInfo.classList.add('movie-card-info');
        cardInfo.innerHTML = `
            <div class="movie-card-title">${movie.title || 'N/A'}</div>
            <div class="movie-card-genres">${movie.genres?.join(', ') || 'N/A'}</div>
            <div class="movie-card-rating">
                <i class="fas fa-star"></i>
                ${movie.imdb?.rating || 'N/A'}
            </div>
        `;
        card.appendChild(cardInfo);

        container.appendChild(card);
    });

    updateMoviesStats(movies.length);
}

function updateMoviesStats(count) {
    const statsElement = document.getElementById('movies-stats');
    const totalMovies = allMovies.length;

    if (count === totalMovies) {
        statsElement.textContent = `Exibindo todos os ${totalMovies} filmes`;
    } else {
        statsElement.textContent = `Exibindo ${count} de ${totalMovies} filmes`;
    }
}

function populateFilters(movies) {
    const genres = new Set();
    const years = new Set();

    movies.forEach(movie => {
        if (movie.genres) {
            movie.genres.forEach(genre => genres.add(genre));
        }
        if (movie.year) {
            years.add(movie.year);
        }
    });

    const genreFilter = document.getElementById('genre-filter');
    if (genreFilter) {
        const sortedGenres = Array.from(genres).sort();
        genreFilter.innerHTML = '<option value="">Todos os Gêneros</option>';
        sortedGenres.forEach(genre => {
            const option = document.createElement('option');
            option.value = genre;
            option.textContent = genre;
            genreFilter.appendChild(option);
        });
    }

    const yearFilter = document.getElementById('year-filter');
    if (yearFilter) {
        const sortedYears = Array.from(years).sort((a, b) => b - a); // Descending order
        yearFilter.innerHTML = '<option value="">Todos os Anos</option>';
        sortedYears.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearFilter.appendChild(option);
        });
    }
}

function applyFilters() {
    const genreFilter = document.getElementById('genre-filter');
    const yearFilter = document.getElementById('year-filter');
    const ratingFilter = document.getElementById('rating-filter');

    const genreValue = genreFilter ? genreFilter.value : '';
    const yearValue = yearFilter ? yearFilter.value : '';
    const ratingValue = ratingFilter ? ratingFilter.value : '';

    filteredMovies = allMovies.filter(movie => {
        if (genreValue && (!movie.genres || !movie.genres.includes(genreValue))) {
            return false;
        }

        if (yearValue && movie.year != yearValue) {
            return false;
        }

        if (ratingValue) {
            const movieRating = movie.imdb?.rating;
            if (!movieRating || movieRating < parseFloat(ratingValue)) {
                return false;
            }
        }

        return true;
    });

    createModalsFields(filteredMovies, { clear: true });
}

function clearFilters() {
    const genreFilter = document.getElementById('genre-filter');
    const yearFilter = document.getElementById('year-filter');
    const ratingFilter = document.getElementById('rating-filter');

    if (genreFilter) genreFilter.value = '';
    if (yearFilter) yearFilter.value = '';
    if (ratingFilter) ratingFilter.value = '';

    filteredMovies = [...allMovies];
    createModalsFields(filteredMovies, { clear: true });
}

function setupFilterListeners() {
    const genreFilter = document.getElementById('genre-filter');
    const yearFilter = document.getElementById('year-filter');
    const ratingFilter = document.getElementById('rating-filter');
    const clearButton = document.getElementById('clear-filters');

    if (genreFilter) genreFilter.addEventListener('change', applyFilters);
    if (yearFilter) yearFilter.addEventListener('change', applyFilters);
    if (ratingFilter) ratingFilter.addEventListener('change', applyFilters);
    if (clearButton) clearButton.addEventListener('click', clearFilters);
}

function Search(query, clear = false) {
    fetch(`${API_BASE_URL}/movies/search/${query}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    })
        .then(response => response.json())
        .then(data => {
            if (clear) {
                allMovies = data;
                filteredMovies = [...allMovies];
                populateFilters(allMovies);
            }
            createModalsFields(data, { clear });
        })
        .catch(error => {
            console.error('Error fetching movies:', error);
            alert('Error fetching movies. Check console for details.');
        });
}

function openModal(movie) {
    const modal = document.getElementById('movie-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalPlot = document.getElementById('modal-plot');
    const modalGenres = document.getElementById('modal-genres');
    const modalRuntime = document.getElementById('modal-runtime');
    const modalCast = document.getElementById('modal-cast');
    const modalLanguage = document.getElementById('modal-language');
    const modalReleased = document.getElementById('modal-released');
    const modalDirectors = document.getElementById('modal-directors');
    const modalWriters = document.getElementById('modal-writers');
    const modalYear = document.getElementById('modal-year');
    const modalIMDB = document.getElementById('modal-imdb');
    const modalTomatoes = document.getElementById('modal-Tomatoes');
    const modalComments = document.getElementById('modal-Comments');

    // Set movie data
    modalTitle.textContent = movie.title || 'N/A';
    modalPlot.textContent = movie.fullplot || movie.plot || 'N/A';
    modalGenres.textContent = movie.genres?.join(', ') || 'N/A';
    modalRuntime.textContent = movie.runtime ? movie.runtime + ' min' : 'N/A';
    modalCast.textContent = movie.cast?.join(', ') || 'N/A';
    modalLanguage.textContent = movie.languages?.join(', ') || 'N/A';
    modalReleased.textContent = movie.released ? new Date(movie.released).toDateString() : 'N/A';
    modalDirectors.textContent = movie.directors?.join(', ') || 'N/A';
    modalWriters.textContent = movie.writers?.join(', ') || 'N/A';
    modalYear.textContent = movie.year || 'N/A';
    modalIMDB.textContent = movie.imdb?.rating ? `${movie.imdb.rating} (${movie.imdb.votes || 0} votes)` : 'N/A';
    modalTomatoes.textContent = movie.tomatoes?.viewer?.rating ? `${movie.tomatoes.viewer.rating} (${movie.tomatoes.viewer.numReviews || 0} reviews)` : 'N/A';

    modalComments.innerHTML = `
        <h2>Comments</h2>
        <div id="comments-list"></div>
        <div class="comment-input">
            <input type="text" id="new-comment-input" placeholder="Write a comment..." />
            <button id="submit-comment">Post</button>
        </div>
    `;

    const commentsList = document.getElementById('comments-list');

    GetComments(movie._id).then(comments => {
        if (!comments.length) {
            commentsList.innerHTML = `<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">No comments yet. Be the first to comment!</p>`;
            return;
        }

        comments.forEach(comment => {
            const commentEl = document.createElement('div');
            commentEl.classList.add('comment-box');
            const initials = comment.name.split(' ').map(n => n[0]).join('').toUpperCase();
            commentEl.innerHTML = `
                <div class="comment-avatar">${initials}</div>
                <div class="comment-content">
                    <div class="comment-name">${comment.name}</div>
                    <div class="comment-text" data-id="${comment._id}">${comment.text}</div>
                    <div>
                        <button class="edit-comment" data-id="${comment._id}">Edit</button>
                        <button class="delete-comment" data-id="${comment._id}">Delete</button>
                    </div>
                </div>
            `;
            commentsList.appendChild(commentEl);
        });

        // Edit functionality
        document.querySelectorAll('.edit-comment').forEach(button => {
            button.addEventListener('click', async () => {
                const commentId = button.dataset.id;
                const currentText = button.closest('.comment-content').querySelector('.comment-text').textContent;
                const newText = prompt('Edit your comment:', currentText);
                if (!newText || newText === currentText) return;

                try {
                    const response = await fetch(`${API_BASE_URL}/Comments/update/${commentId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text: newText })
                    });

                    if (response.ok) {
                        openModal(movie);
                    } else {
                        const error = await response.json();
                        alert('Failed to update comment: ' + (error.error || 'Unknown error'));
                    }
                } catch (error) {
                    console.error('Error updating comment:', error);
                    alert('Network error occurred');
                }
            });
        });

        document.querySelectorAll('.delete-comment').forEach(button => {
            button.addEventListener('click', async () => {
                const commentId = button.dataset.id;

                if (!confirm('Are you sure you want to delete this comment?')) return;

                try {
                    const response = await fetch(`${API_BASE_URL}/Comments/delete/${commentId}`, {
                        method: 'DELETE'
                    });

                    if (response.ok) {
                        openModal(movie);
                    } else {
                        const error = await response.json();
                        alert('Failed to delete comment: ' + (error.error || 'Unknown error'));
                    }
                } catch (error) {
                    console.error('Error deleting comment:', error);
                    alert('Network error occurred');
                }
            });
        });
    });

    document.getElementById('submit-comment').addEventListener('click', async () => {
        const input = document.getElementById('new-comment-input');
        const text = input.value.trim();
        if (!text) {
            alert('Please enter a comment');
            return;
        }

        const newComment = {
            name: "Anonymous User",
            email: "anonymous@example.com",
            movie_id: movie._id,
            text
        };

        try {
            const response = await fetch(`${API_BASE_URL}/Comments/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newComment)
            });

            if (response.ok) {
                input.value = '';
                openModal(movie);
            } else {
                const error = await response.json();
                alert('Failed to add comment: ' + (error.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error adding comment:', error);
            alert('Network error occurred');
        }
    });

    document.getElementById('new-comment-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('submit-comment').click();
        }
    });

    // Show the modal
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function GetLivros() {
    // Show loading state
    const container = document.getElementById('movies-container');
    const statsElement = document.getElementById('movies-stats');

    if (container) container.innerHTML = '<div class="loading"></div>';
    if (statsElement) statsElement.textContent = 'Carregando filmes...';

    fetch(`${API_BASE_URL}/movies`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            allMovies = data;
            filteredMovies = [...allMovies];

            populateFilters(allMovies);
            createModalsFields(filteredMovies, { clear: true });
            setupFilterListeners();
        })
        .catch(error => {
            console.error('Error fetching movies:', error);
            if (container) {
                container.innerHTML = `
                    <div class="no-movies">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Erro ao carregar filmes</h3>
                        <p>Verifique se o servidor está funcionando</p>
                    </div>
                `;
            }
            if (statsElement) statsElement.textContent = 'Erro ao carregar dados';
        });
}

function GetComments(id) {
    return fetch(`${API_BASE_URL}/Comments/${id}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .catch(error => {
            console.error('Error fetching Comments:', error);
            return [];
        });
}

// AI Query functionality
document.addEventListener('DOMContentLoaded', function() {
    const askAiButton = document.getElementById('ask-ai');
    if (askAiButton) {
        askAiButton.addEventListener('click', async () => {
            const queryInput = document.getElementById('ai-query');
            const userTypeSelect = document.getElementById('user-type');
            const responseDiv = document.getElementById('ai-response');

            if (!queryInput || !userTypeSelect || !responseDiv) return;

            const query = queryInput.value;
            const userType = userTypeSelect.value;

            if (!query.trim()) return;

            responseDiv.innerHTML = '<p>AI is thinking...</p>';

            try {
                const response = await fetch(`${API_BASE_URL}/movies/query`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query, userType })
                });

                const data = await response.json();
                responseDiv.innerHTML = `<div class="ai-answer">${data.response}</div>`;
                console.log(`titulo = ${data.Titles}`)

                let first = true;
                for (const title of data.Titles) {
                    Search(title, first);
                    first = false;
                }

            } catch (error) {
                responseDiv.innerHTML = '<p>Error getting AI response</p>';
            }
        });
    }
});

function closeModal() {
    const modal = document.getElementById('movie-modal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});

window.onload = GetLivros;