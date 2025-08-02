// Chave da API RAWG
const API_KEY = "29ff43bfdbf04ac79cc88f6a1f4efb17"
const API_BASE_URL = "https://api.rawg.io/api"

// Elementos do DOM
const searchInput = document.getElementById("searchInput")
const searchButton = document.getElementById("searchButton")
const gameGrid = document.getElementById("gameGrid")
const loading = document.getElementById("loading")
const error = document.getElementById("error")
const noResults = document.getElementById("noResults")
const initialMessage = document.getElementById("initialMessage")
const resultsCount = document.getElementById("resultsCount")
const pagination = document.getElementById("pagination")
const prevPageBtn = document.getElementById("prevPage")
const nextPageBtn = document.getElementById("nextPage")
const pageInfo = document.getElementById("pageInfo")
const platformFilter = document.getElementById("platformFilter")
const genreFilter = document.getElementById("genreFilter")
const sortFilter = document.getElementById("sortFilter")
const gameModal = document.getElementById("gameModal")
const modalContent = document.getElementById("modalContent")
const closeModal = document.getElementById("closeModal")
const themeToggle = document.getElementById("themeToggle")
const pageLoader = document.getElementById("pageLoader")
const popularTags = document.querySelectorAll(".popular-tag")

// Elementos de comparação
const compareBar = document.getElementById("compareBar")
const compareGamesContainer = document.getElementById("compareGamesContainer")
const compareButton = document.getElementById("compareButton")
const clearCompareButton = document.getElementById("clearCompareButton")
const compareModal = document.getElementById("compareModal")
const compareContent = document.getElementById("compareContent")
const closeCompareModal = document.getElementById("closeCompareModal")

// Elementos de favoritos
const favoritesToggle = document.getElementById("favoritesToggle")
const favoritesCount = document.getElementById("favoritesCount")
const favoritesModal = document.getElementById("favoritesModal")
const favoritesContent = document.getElementById("favoritesContent")
const noFavorites = document.getElementById("noFavorites")
const closeFavoritesModal = document.getElementById("closeFavoritesModal")
const clearFavorites = document.getElementById("clearFavorites")

// Estado da aplicação
const currentState = {
    query: "",
    platform: "",
    genre: "",
    sort: "-relevance",
    page: 1,
    totalPages: 0,
    totalResults: 0,
}

// Estado de comparação
let compareGames = []
const MAX_COMPARE_GAMES = 3

// Estado de favoritos
let favorites = []

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
    // Simular carregamento da página
    setTimeout(() => {
        pageLoader.style.opacity = "0"
        setTimeout(() => {
            pageLoader.style.display = "none"
        }, 500)
    }, 2000)

    setupEventListeners()
    checkThemePreference()
    loadFavorites()
    updateFavoritesCount()
})

// Configurar event listeners
function setupEventListeners() {
    // Busca
    searchButton.addEventListener("click", () => {
        currentState.page = 1
        searchGames()
    })

    searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            currentState.page = 1
            searchGames()
        }
    })

    // Tags populares
    popularTags.forEach((tag) => {
        tag.addEventListener("click", () => {
            searchInput.value = tag.dataset.search
            currentState.page = 1
            searchGames()
        })
    })

    // Filtros
    platformFilter.addEventListener("change", () => {
        currentState.platform = platformFilter.value
        currentState.page = 1
        if (currentState.query) searchGames()
    })

    genreFilter.addEventListener("change", () => {
        currentState.genre = genreFilter.value
        currentState.page = 1
        if (currentState.query) searchGames()
    })

    sortFilter.addEventListener("change", () => {
        currentState.sort = sortFilter.value
        currentState.page = 1
        if (currentState.query) searchGames()
    })

    // Paginação
    prevPageBtn.addEventListener("click", () => {
        if (currentState.page > 1) {
            currentState.page--
            searchGames()
            window.scrollTo({ top: 0, behavior: "smooth" })
        }
    })

    nextPageBtn.addEventListener("click", () => {
        if (currentState.page < currentState.totalPages) {
            currentState.page++
            searchGames()
            window.scrollTo({ top: 0, behavior: "smooth" })
        }
    })

    // Modal de detalhes
    closeModal.addEventListener("click", () => {
        gameModal.classList.remove("show")
        setTimeout(() => {
            gameModal.style.display = "none"
            document.body.style.overflow = "auto"
        }, 300)
    })

    gameModal.addEventListener("click", (e) => {
        if (e.target === gameModal) {
            gameModal.classList.remove("show")
            setTimeout(() => {
                gameModal.style.display = "none"
                document.body.style.overflow = "auto"
            }, 300)
        }
    })

    // Tema
    themeToggle.addEventListener("click", toggleTheme)

    // Comparação
    compareButton.addEventListener("click", showCompareModal)
    clearCompareButton.addEventListener("click", clearCompareGames)

    closeCompareModal.addEventListener("click", () => {
        compareModal.classList.remove("show")
        setTimeout(() => {
            compareModal.style.display = "none"
            document.body.style.overflow = "auto"
        }, 300)
    })

    compareModal.addEventListener("click", (e) => {
        if (e.target === compareModal) {
            compareModal.classList.remove("show")
            setTimeout(() => {
                compareModal.style.display = "none"
                document.body.style.overflow = "auto"
            }, 300)
        }
    })

    // Favoritos
    favoritesToggle.addEventListener("click", showFavoritesModal)
    closeFavoritesModal.addEventListener("click", () => {
        favoritesModal.classList.remove("show")
        setTimeout(() => {
            favoritesModal.style.display = "none"
            document.body.style.overflow = "auto"
        }, 300)
    })

    favoritesModal.addEventListener("click", (e) => {
        if (e.target === favoritesModal) {
            favoritesModal.classList.remove("show")
            setTimeout(() => {
                favoritesModal.style.display = "none"
                document.body.style.overflow = "auto"
            }, 300)
        }
    })

    clearFavorites.addEventListener("click", () => {
        if (confirm("Tem certeza que deseja remover todos os jogos favoritos?")) {
            favorites = []
            saveFavorites()
            updateFavoritesCount()
            renderFavorites()
            showNotification("Favoritos limpos", "Todos os jogos foram removidos dos favoritos", "info")
        }
    })
}

// Buscar jogos
async function searchGames() {
    const query = searchInput.value.trim()

    if (!query) {
        showInitialMessage()
        return
    }

    currentState.query = query
    showLoading()

    try {
        // Construir URL com parâmetros
        let url = `${API_BASE_URL}/games?key=${API_KEY}&search=${encodeURIComponent(query)}&page=${currentState.page}&page_size=12`

        if (currentState.platform) {
            url += `&platforms=${currentState.platform}`
        }

        if (currentState.genre) {
            url += `&genres=${currentState.genre}`
        }

        if (currentState.sort) {
            url += `&ordering=${currentState.sort}`
        }

        const response = await fetch(url)
        const data = await response.json()

        if (data.results && data.results.length > 0) {
            renderGames(data.results)
            updatePagination(data)
        } else {
            showNoResults()
        }
    } catch (err) {
        console.error("Erro ao buscar jogos:", err)
        showError()
    }
}

// Renderizar jogos
function renderGames(games) {
    hideAllMessages()
    gameGrid.innerHTML = ""

    games.forEach((game) => {
        const card = document.createElement("div")
        card.className = "game-card"
        card.setAttribute("data-id", game.id)

        // Verificar se o jogo já está na lista de comparação
        const isInCompare = compareGames.some((g) => g.id === game.id)

        // Verificar se o jogo já está nos favoritos
        const isInFavorites = favorites.some((f) => f.id === game.id)

        // Preparar plataformas
        let platformsHTML = ""
        if (game.parent_platforms) {
            platformsHTML = game.parent_platforms
                .slice(0, 4)
                .map((p) => {
                    const platform = p.platform.slug
                    let icon = "gamepad"

                    if (platform === "pc") icon = "desktop"
                    else if (platform === "playstation") icon = "playstation"
                    else if (platform === "xbox") icon = "xbox"
                    else if (platform === "nintendo") icon = "nintendo-switch"
                    else if (platform === "android") icon = "android"
                    else if (platform === "ios") icon = "apple"

                    return `<div class="platform-icon"><i class="fab fa-${icon}"></i></div>`
                })
                .join("")
        }

        // Preparar gêneros
        let genresHTML = ""
        if (game.genres && game.genres.length > 0) {
            genresHTML = game.genres
                .slice(0, 3)
                .map((genre) => `<span class="genre-tag">${genre.name}</span>`)
                .join("")
        }

        // Formatar data de lançamento
        const releaseDate = game.released ? formatDate(game.released) : "Desconhecido"

        card.innerHTML = `
            <div class="game-image">
                <img src="${game.background_image || "https://via.placeholder.com/300x180?text=Sem+Imagem"}" alt="${game.name}">
                <div class="game-rating">
                    <i class="fas fa-star"></i> ${game.rating.toFixed(1)}
                </div>
                <div class="game-platforms">
                    ${platformsHTML}
                </div>
                <div class="game-actions">
                    <div class="favorite-btn ${isInFavorites ? "active" : ""}" data-id="${game.id}">
                        <i class="fas fa-heart"></i>
                    </div>
                    <div class="compare-btn ${isInCompare ? "active" : ""}" data-id="${game.id}">
                        <i class="fas fa-balance-scale"></i>
                    </div>
                </div>
                ${isInCompare ? `<div class="compare-badge">${compareGames.findIndex((g) => g.id === game.id) + 1}</div>` : ""}
            </div>
            <div class="game-info">
                <h3 class="game-title">${game.name}</h3>
                <div class="game-meta">
                    <div class="meta-item">
                        <i class="fas fa-calendar-alt"></i> ${releaseDate}
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-gamepad"></i> ${game.added.toLocaleString()} jogadores
                    </div>
                </div>
                <div class="game-genres">
                    ${genresHTML}
                </div>
            </div>
        `

        // Adicionar evento de clique para abrir o modal
        card.addEventListener("click", (e) => {
            // Se o clique foi em um botão de ação, não abrir o modal de detalhes
            if (e.target.closest(".favorite-btn") || e.target.closest(".compare-btn")) {
                e.stopPropagation()
                return
            }
            getGameDetails(game.id)
        })

        // Adicionar evento para o botão de favoritos
        const favoriteBtn = card.querySelector(".favorite-btn")
        if (favoriteBtn) {
            favoriteBtn.addEventListener("click", (e) => {
                e.stopPropagation()
                toggleFavorite(game)
            })
        }

        // Adicionar evento para o botão de comparar
        const compareBtn = card.querySelector(".compare-btn")
        if (compareBtn) {
            compareBtn.addEventListener("click", (e) => {
                e.stopPropagation()
                toggleCompareGame(game)
            })
        }

        gameGrid.appendChild(card)
    })
}

// Obter detalhes do jogo para o modal
async function getGameDetails(gameId) {
    showLoading()

    try {
        // Buscar detalhes do jogo
        const gameResponse = await fetch(`${API_BASE_URL}/games/${gameId}?key=${API_KEY}`)
        const gameData = await gameResponse.json()

        // Buscar screenshots
        const screenshotsResponse = await fetch(`${API_BASE_URL}/games/${gameId}/screenshots?key=${API_KEY}`)
        const screenshotsData = await screenshotsResponse.json()

        renderGameModal(gameData, screenshotsData.results || [])
    } catch (err) {
        console.error("Erro ao buscar detalhes do jogo:", err)
        showNotification("Erro", "Não foi possível carregar os detalhes deste jogo", "error")
    } finally {
        hideLoading()
    }
}

// Renderizar modal com detalhes do jogo
function renderGameModal(game, screenshots) {
    // Verificar se o jogo está nos favoritos
    const isInFavorites = favorites.some((f) => f.id === game.id)

    // Preparar plataformas
    let platformsHTML = ""
    if (game.parent_platforms) {
        platformsHTML = game.parent_platforms
            .map((p) => {
                return `<div class="detail-platform">${p.platform.name}</div>`
            })
            .join("")
    }

    // Preparar gêneros
    let genresHTML = ""
    if (game.genres && game.genres.length > 0) {
        genresHTML = game.genres.map((genre) => `<span class="tag">${genre.name}</span>`).join("")
    }

    // Preparar lojas
    let storesHTML = ""
    if (game.stores && game.stores.length > 0) {
        storesHTML = game.stores
            .map(
                (store) =>
                    `<a href="https://${store.store.domain}" target="_blank" class="store-link">
                <i class="fas fa-shopping-cart"></i> ${store.store.name}
            </a>`,
            )
            .join("")
    }

    // Preparar screenshots
    let screenshotsHTML = ""
    if (screenshots.length > 0) {
        screenshotsHTML = screenshots
            .slice(0, 6)
            .map(
                (screenshot) =>
                    `<div class="screenshot">
                <img src="${screenshot.image}" alt="Screenshot do jogo">
            </div>`,
            )
            .join("")
    }

    // Formatar data de lançamento
    const releaseDate = game.released ? formatDate(game.released) : "Desconhecido"

    // Construir HTML do modal
    modalContent.innerHTML = `
        <div class="game-detail-header">
            <img src="${game.background_image || "https://via.placeholder.com/1200x600?text=Sem+Imagem"}" alt="${game.name}">
            <div class="game-detail-overlay">
                <h2 class="game-detail-title">${game.name}</h2>
                <div class="game-detail-meta">
                    <div class="detail-meta-item">
                        <i class="fas fa-star"></i> ${game.rating.toFixed(1)}/5 (${game.ratings_count} avaliações)
                    </div>
                    <div class="detail-meta-item">
                        <i class="fas fa-calendar-alt"></i> ${releaseDate}
                    </div>
                    <div class="detail-meta-item">
                        <i class="fas fa-gamepad"></i> ${game.added.toLocaleString()} jogadores
                    </div>
                    <div class="detail-meta-item favorite-toggle-detail ${isInFavorites ? "active" : ""}" data-id="${game.id}">
                        <i class="fas fa-heart"></i> ${isInFavorites ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                    </div>
                </div>
                <div class="game-detail-platforms">
                    ${platformsHTML}
                </div>
            </div>
        </div>
        <div class="game-detail-content">
            <div class="detail-section">
                <h3 class="detail-section-title">Sobre o Jogo</h3>
                <div class="game-description">
                    ${game.description_raw || "Sem descrição disponível."}
                </div>
            </div>
            
            ${screenshots.length > 0
            ? `
            <div class="detail-section">
                <h3 class="detail-section-title">Screenshots</h3>
                <div class="game-screenshots">
                    ${screenshotsHTML}
                </div>
            </div>
            `
            : ""
        }
            
            <div class="detail-section">
                <h3 class="detail-section-title">Informações</h3>
                <div class="game-info-grid">
                    <div class="info-card">
                        <h4 class="info-card-title">Gêneros</h4>
                        <div class="info-card-content tags-list">
                            ${genresHTML || "Não disponível"}
                        </div>
                    </div>
                    
                    <div class="info-card">
                        <h4 class="info-card-title">Desenvolvedor</h4>
                        <div class="info-card-content">
                            ${game.developers && game.developers.length > 0 ? game.developers[0].name : "Desconhecido"}
                        </div>
                    </div>
                    
                    <div class="info-card">
                        <h4 class="info-card-title">Publicadora</h4>
                        <div class="info-card-content">
                            ${game.publishers && game.publishers.length > 0 ? game.publishers[0].name : "Desconhecido"}
                        </div>
                    </div>
                    
                    <div class="info-card">
                        <h4 class="info-card-title">Classificação Etária</h4>
                        <div class="info-card-content">
                            ${game.esrb_rating ? game.esrb_rating.name : "Não classificado"}
                        </div>
                    </div>
                </div>
            </div>
            
            ${storesHTML
            ? `
            <div class="detail-section">
                <h3 class="detail-section-title">Onde Comprar</h3>
                <div class="stores-list">
                    ${storesHTML}
                </div>
            </div>
            `
            : ""
        }
        </div>
    `

    // Adicionar evento para o botão de favoritos no modal
    const favoriteToggleDetail = modalContent.querySelector(".favorite-toggle-detail")
    if (favoriteToggleDetail) {
        favoriteToggleDetail.addEventListener("click", () => {
            toggleFavorite(game)
            favoriteToggleDetail.classList.toggle("active")
            favoriteToggleDetail.innerHTML = `<i class="fas fa-heart"></i> ${favorites.some((f) => f.id === game.id) ? "Remover dos favoritos" : "Adicionar aos favoritos"}`
        })
    }

    // Exibir o modal
    gameModal.style.display = "block"
    document.body.style.overflow = "hidden" // Impedir rolagem da página
    setTimeout(() => {
        gameModal.classList.add("show")
    }, 10)
}

// Atualizar paginação
function updatePagination(data) {
    const totalResults = data.count
    const resultsPerPage = 12
    const totalPages = Math.ceil(totalResults / resultsPerPage)

    currentState.totalPages = totalPages
    currentState.totalResults = totalResults

    // Atualizar informações de resultados
    resultsCount.textContent = `${totalResults} jogos encontrados`

    // Atualizar informações de página
    pageInfo.textContent = `Página ${currentState.page} de ${totalPages}`

    // Habilitar/desabilitar botões de paginação
    prevPageBtn.disabled = currentState.page <= 1
    nextPageBtn.disabled = currentState.page >= totalPages

    // Mostrar paginação
    pagination.classList.remove("hidden")
}

// Funções de controle de exibição
function showLoading() {
    hideAllMessages()
    loading.classList.remove("hidden")
}

function hideLoading() {
    loading.classList.add("hidden")
}

function showError() {
    hideAllMessages()
    error.classList.remove("hidden")
}

function showNoResults() {
    hideAllMessages()
    noResults.classList.remove("hidden")
}

function showInitialMessage() {
    hideAllMessages()
    initialMessage.classList.remove("hidden")
    pagination.classList.add("hidden")
}

function hideAllMessages() {
    loading.classList.add("hidden")
    error.classList.add("hidden")
    noResults.classList.add("hidden")
    initialMessage.classList.add("hidden")
}

// Alternar tema
function toggleTheme() {
    const html = document.documentElement
    const isDark = html.classList.contains("dark")

    if (isDark) {
        html.classList.remove("dark")
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>'
        localStorage.setItem("theme", "light")
        showNotification("Tema alterado", "Modo claro ativado", "info")
    } else {
        html.classList.add("dark")
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>'
        localStorage.setItem("theme", "dark")
        showNotification("Tema alterado", "Modo escuro ativado", "info")
    }
}

// Verificar preferência de tema
function checkThemePreference() {
    const savedTheme = localStorage.getItem("theme")
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches

    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
        document.documentElement.classList.add("dark")
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>'
    } else {
        document.documentElement.classList.remove("dark")
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>'
    }
}

// Formatar data
function formatDate(dateString) {
    const options = { day: "2-digit", month: "2-digit", year: "numeric" }
    return new Date(dateString).toLocaleDateString("pt-BR", options)
}

// Adicionar ou remover jogo da comparação
function toggleCompareGame(game) {
    const index = compareGames.findIndex((g) => g.id === game.id)

    if (index !== -1) {
        // Remover jogo
        compareGames.splice(index, 1)
        showNotification("Jogo removido", `${game.name} removido da comparação`, "info")
    } else {
        // Adicionar jogo se não exceder o limite
        if (compareGames.length < MAX_COMPARE_GAMES) {
            compareGames.push(game)
            showNotification("Jogo adicionado", `${game.name} adicionado à comparação`, "success")
        } else {
            showNotification("Limite atingido", `Você só pode comparar até ${MAX_COMPARE_GAMES} jogos de uma vez`, "warning")
            return
        }
    }

    updateCompareBar()

    // Atualizar os botões de comparação na interface
    const compareButtons = document.querySelectorAll(".compare-btn")
    compareButtons.forEach((btn) => {
        const gameId = Number.parseInt(btn.getAttribute("data-id"))
        const isInCompare = compareGames.some((g) => g.id === gameId)

        if (isInCompare) {
            btn.classList.add("active")

            // Adicionar badge se não existir
            const card = btn.closest(".game-card")
            if (!card.querySelector(".compare-badge")) {
                const index = compareGames.findIndex((g) => g.id === gameId)
                const badge = document.createElement("div")
                badge.className = "compare-badge"
                badge.textContent = index + 1
                card.querySelector(".game-image").appendChild(badge)
            }
        } else {
            btn.classList.remove("active")

            // Remover badge se existir
            const card = btn.closest(".game-card")
            const badge = card.querySelector(".compare-badge")
            if (badge) badge.remove()
        }
    })
}

// Atualizar a barra de comparação
function updateCompareBar() {
    if (compareGames.length > 0) {
        compareBar.classList.remove("hidden")
        renderCompareGames()
    } else {
        compareBar.classList.add("hidden")
    }
}

// Renderizar jogos na barra de comparação
function renderCompareGames() {
    compareGamesContainer.innerHTML = ""

    compareGames.forEach((game, index) => {
        const gameItem = document.createElement("div")
        gameItem.className = "compare-game-item"

        gameItem.innerHTML = `
            <img src="${game.background_image || "https://via.placeholder.com/300x180?text=Sem+Imagem"}" alt="${game.name}">
            <div class="compare-game-info">
                <div class="compare-game-title">${game.name}</div>
                <div class="compare-game-rating">
                    <i class="fas fa-star"></i> ${game.rating.toFixed(1)}
                </div>
            </div>
            <div class="remove-compare-game" data-id="${game.id}">
                <i class="fas fa-times"></i>
            </div>
        `

        compareGamesContainer.appendChild(gameItem)

        // Adicionar evento para remover jogo da comparação
        gameItem.querySelector(".remove-compare-game").addEventListener("click", () => {
            removeGameFromCompare(game.id)
        })
    })

    // Atualizar estado do botão de comparar
    compareButton.disabled = compareGames.length < 2
    if (compareGames.length < 2) {
        compareButton.style.opacity = "0.5"
        compareButton.style.cursor = "not-allowed"
    } else {
        compareButton.style.opacity = "1"
        compareButton.style.cursor = "pointer"
    }
}

// Remover jogo da comparação
function removeGameFromCompare(gameId) {
    const game = compareGames.find((g) => g.id === gameId)
    const index = compareGames.findIndex((g) => g.id === gameId)

    if (index !== -1) {
        compareGames.splice(index, 1)
        updateCompareBar()

        if (game) {
            showNotification("Jogo removido", `${game.name} removido da comparação`, "info")
        }

        // Atualizar os botões de comparação na interface
        const compareButton = document.querySelector(`.compare-btn[data-id="${gameId}"]`)
        if (compareButton) {
            compareButton.classList.remove("active")

            // Remover badge se existir
            const card = compareButton.closest(".game-card")
            const badge = card.querySelector(".compare-badge")
            if (badge) badge.remove()
        }
    }
}

// Limpar todos os jogos da comparação
function clearCompareGames() {
    compareGames = []
    updateCompareBar()
    showNotification("Comparação limpa", "Todos os jogos foram removidos da comparação", "info")

    // Atualizar todos os botões de comparação na interface
    const compareButtons = document.querySelectorAll(".compare-btn")
    compareButtons.forEach((btn) => {
        btn.classList.remove("active")

        // Remover badge se existir
        const card = btn.closest(".game-card")
        const badge = card.querySelector(".compare-badge")
        if (badge) badge.remove()
    })
}

// Mostrar modal de comparação
async function showCompareModal() {
    if (compareGames.length < 2) {
        showNotification("Comparação incompleta", "Selecione pelo menos 2 jogos para comparar", "warning")
        return
    }

    showLoading()

    try {
        // Buscar detalhes completos de cada jogo
        const detailedGames = await Promise.all(
            compareGames.map(async (game) => {
                const response = await fetch(`${API_BASE_URL}/games/${game.id}?key=${API_KEY}`)
                return await response.json()
            }),
        )

        renderCompareModal(detailedGames)
    } catch (err) {
        console.error("Erro ao buscar detalhes dos jogos para comparação:", err)
        showNotification("Erro", "Não foi possível carregar os detalhes para comparação", "error")
    } finally {
        hideLoading()
    }
}

// Renderizar modal de comparação
function renderCompareModal(games) {
    compareContent.innerHTML = ""

    games.forEach((game) => {
        const column = document.createElement("div")
        column.className = "compare-column"

        // Preparar plataformas
        let platformsHTML = ""
        if (game.parent_platforms) {
            platformsHTML = game.parent_platforms
                .map((p) => `<span class="compare-platform">${p.platform.name}</span>`)
                .join("")
        }

        // Preparar gêneros
        let genresHTML = ""
        if (game.genres && game.genres.length > 0) {
            genresHTML = game.genres.map((genre) => `<span class="compare-genre">${genre.name}</span>`).join("")
        }

        // Preparar tags
        let tagsHTML = ""
        if (game.tags && game.tags.length > 0) {
            tagsHTML = game.tags
                .slice(0, 5)
                .map((tag) => `<span class="compare-tag">${tag.name}</span>`)
                .join("")
        }

        // Determinar classe de metacritic
        let metacriticClass = ""
        if (game.metacritic) {
            if (game.metacritic >= 75) metacriticClass = "metacritic-good"
            else if (game.metacritic >= 50) metacriticClass = "metacritic-mixed"
            else metacriticClass = "metacritic-bad"
        }

        column.innerHTML = `
            <div class="compare-image">
                <img src="${game.background_image || "https://via.placeholder.com/300x180?text=Sem+Imagem"}" alt="${game.name}">
            </div>
            <h3 class="compare-title">${game.name}</h3>
            
            <div class="compare-section">
                <div class="compare-detail">
                    <div class="compare-detail-label">Lançamento</div>
                    <div class="compare-detail-value">${game.released ? formatDate(game.released) : "Desconhecido"}</div>
                </div>
                
                <div class="compare-detail">
                    <div class="compare-detail-label">Avaliação</div>
                    <div class="compare-rating">
                        <i class="fas fa-star"></i> ${game.rating.toFixed(1)}/5
                    </div>
                </div>
                
                ${game.metacritic
                ? `
                <div class="compare-detail">
                    <div class="compare-detail-label">Metacritic</div>
                    <span class="compare-metacritic ${metacriticClass}">${game.metacritic}</span>
                </div>
                `
                : ""
            }
            </div>
            
            <div class="compare-section">
                <div class="compare-section-title">Plataformas</div>
                <div class="compare-platforms">
                    ${platformsHTML || "Não disponível"}
                </div>
            </div>
            
            <div class="compare-section">
                <div class="compare-section-title">Gêneros</div>
                <div class="compare-genres">
                    ${genresHTML || "Não disponível"}
                </div>
            </div>
            
            <div class="compare-section">
                <div class="compare-section-title">Desenvolvedor</div>
                <div class="compare-detail-value">
                    ${game.developers && game.developers.length > 0 ? game.developers[0].name : "Desconhecido"}
                </div>
            </div>
            
            <div class="compare-section">
                <div class="compare-section-title">Publicadora</div>
                <div class="compare-detail-value">
                    ${game.publishers && game.publishers.length > 0 ? game.publishers[0].name : "Desconhecido"}
                </div>
            </div>
            
            <div class="compare-section">
                <div class="compare-section-title">Classificação Etária</div>
                <div class="compare-detail-value">
                    ${game.esrb_rating ? game.esrb_rating.name : "Não classificado"}
                </div>
            </div>
            
            ${game.tags && game.tags.length > 0
                ? `
            <div class="compare-section">
                <div class="compare-section-title">Tags</div>
                <div class="compare-tags">
                    ${tagsHTML}
                </div>
            </div>
            `
                : ""
            }
            
            ${game.description_raw
                ? `
            <div class="compare-section">
                <div class="compare-section-title">Descrição</div>
                <div class="compare-detail-value" style="max-height: 150px; overflow-y: auto; font-size: 0.85rem;">
                    ${game.description_raw.substring(0, 300)}${game.description_raw.length > 300 ? "..." : ""}
                </div>
            </div>
            `
                : ""
            }
        `

        compareContent.appendChild(column)
    })

    // Exibir o modal
    compareModal.style.display = "block"
    document.body.style.overflow = "hidden" // Impedir rolagem da página
    setTimeout(() => {
        compareModal.classList.add("show")
    }, 10)
}

// Adicionar ou remover jogo dos favoritos
function toggleFavorite(game) {
    const index = favorites.findIndex((f) => f.id === game.id)

    if (index !== -1) {
        // Remover jogo
        favorites.splice(index, 1)
        showNotification("Removido dos favoritos", `${game.name} removido dos favoritos`, "info")
    } else {
        // Adicionar jogo
        favorites.push(game)
        showNotification("Adicionado aos favoritos", `${game.name} adicionado aos favoritos`, "success")
    }

    saveFavorites()
    updateFavoritesCount()

    // Atualizar os botões de favoritos na interface
    const favoriteButtons = document.querySelectorAll(`.favorite-btn[data-id="${game.id}"]`)
    favoriteButtons.forEach((btn) => {
        btn.classList.toggle("active")
    })
}

// Salvar favoritos no localStorage
function saveFavorites() {
    localStorage.setItem("gameVerseFavorites", JSON.stringify(favorites))
}

// Carregar favoritos do localStorage
function loadFavorites() {
    const savedFavorites = localStorage.getItem("gameVerseFavorites")
    if (savedFavorites) {
        favorites = JSON.parse(savedFavorites)
    }
}

// Atualizar contador de favoritos
function updateFavoritesCount() {
    favoritesCount.textContent = favorites.length
}

// Mostrar modal de favoritos
function showFavoritesModal() {
    renderFavorites()

    favoritesModal.style.display = "block"
    document.body.style.overflow = "hidden" // Impedir rolagem da página
    setTimeout(() => {
        favoritesModal.classList.add("show")
    }, 10)
}

// Renderizar favoritos
function renderFavorites() {
    if (favorites.length === 0) {
        favoritesContent.innerHTML = ""
        noFavorites.classList.remove("hidden")
        return
    }

    noFavorites.classList.add("hidden")
    favoritesContent.innerHTML = ""

    favorites.forEach((game) => {
        const card = document.createElement("div")
        card.className = "game-card"
        card.setAttribute("data-id", game.id)

        // Preparar plataformas
        let platformsHTML = ""
        if (game.parent_platforms) {
            platformsHTML = game.parent_platforms
                .slice(0, 4)
                .map((p) => {
                    const platform = p.platform.slug
                    let icon = "gamepad"

                    if (platform === "pc") icon = "desktop"
                    else if (platform === "playstation") icon = "playstation"
                    else if (platform === "xbox") icon = "xbox"
                    else if (platform === "nintendo") icon = "nintendo-switch"
                    else if (platform === "android") icon = "android"
                    else if (platform === "ios") icon = "apple"

                    return `<div class="platform-icon"><i class="fab fa-${icon}"></i></div>`
                })
                .join("")
        }

        // Preparar gêneros
        let genresHTML = ""
        if (game.genres && game.genres.length > 0) {
            genresHTML = game.genres
                .slice(0, 3)
                .map((genre) => `<span class="genre-tag">${genre.name}</span>`)
                .join("")
        }

        // Formatar data de lançamento
        const releaseDate = game.released ? formatDate(game.released) : "Desconhecido"

        card.innerHTML = `
            <div class="game-image">
                <img src="${game.background_image || "https://via.placeholder.com/300x180?text=Sem+Imagem"}" alt="${game.name}">
                <div class="game-rating">
                    <i class="fas fa-star"></i> ${game.rating.toFixed(1)}
                </div>
                <div class="game-platforms">
                    ${platformsHTML}
                </div>
                <div class="game-actions">
                    <div class="favorite-btn active" data-id="${game.id}">
                        <i class="fas fa-heart"></i>
                    </div>
                </div>
            </div>
            <div class="game-info">
                <h3 class="game-title">${game.name}</h3>
                <div class="game-meta">
                    <div class="meta-item">
                        <i class="fas fa-calendar-alt"></i> ${releaseDate}
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-gamepad"></i> ${game.added.toLocaleString()} jogadores
                    </div>
                </div>
                <div class="game-genres">
                    ${genresHTML}
                </div>
            </div>
        `

        // Adicionar evento de clique para abrir o modal
        card.addEventListener("click", (e) => {
            // Se o clique foi no botão de favoritos, não abrir o modal de detalhes
            if (e.target.closest(".favorite-btn")) {
                e.stopPropagation()
                return
            }
            getGameDetails(game.id)
        })

        // Adicionar evento para o botão de favoritos
        const favoriteBtn = card.querySelector(".favorite-btn")
        if (favoriteBtn) {
            favoriteBtn.addEventListener("click", (e) => {
                e.stopPropagation()
                toggleFavorite(game)
                renderFavorites() // Atualizar a lista de favoritos
            })
        }

        favoritesContent.appendChild(card)
    })
}

// Mostrar notificação
function showNotification(title, message, type = "info") {
    const notificationContainer = document.getElementById("notificationContainer")

    const notification = document.createElement("div")
    notification.className = `notification ${type}`

    let icon = "info-circle"
    if (type === "success") icon = "check-circle"
    else if (type === "warning") icon = "exclamation-triangle"
    else if (type === "error") icon = "times-circle"

    notification.innerHTML = `
        <div class="notification-icon">
            <i class="fas fa-${icon}"></i>
        </div>
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        </div>
        <div class="notification-progress"></div>
    `

    notificationContainer.appendChild(notification)

    // Remover notificação após 3 segundos
    setTimeout(() => {
        notification.style.animation = "slideOut 0.3s forwards"
        setTimeout(() => {
            notification.remove()
        }, 300)
    }, 3000)
}

// Inicializar a aplicação
init()

function init() {
    // Já configurado no DOMContentLoaded
}
