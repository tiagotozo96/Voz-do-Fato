// script.js content

// 1. Configure o Firebase com suas credenciais
const firebaseConfig = {
    apiKey: "AIzaSyAI1TWYSMlZes6hpPUM7h90NGOcxUFRqhOM",
    authDomain: "voz-do-fato-online.firebaseapp.com",
    projectId: "voz-do-fato-online",
    storageBucket: "voz-do-fato-online.firebasestorage.app",
    messagingSenderId: "1011633998825",
    appId: "1:1011633998825:web:ef7eb5b649a703ffb0d978"
};

// 2. Importe os módulos necessários do Firebase (usando módulos ES6)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import { getFirestore, collection, getDocs } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';

// 3. Inicialize o Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Armazenaremos os dados das notícias aqui, usando o ID do documento como chave
let newsData = {};

document.addEventListener('DOMContentLoaded', async () => {
    const mainContentArea = document.getElementById('main-content-area');
    const menuHamburguer = document.querySelector('.menu-hamburguer');
    const menuLista = document.querySelector('.menu-lista');
    const searchIcon = document.querySelector('.search-icon');
    
    // Novo seletor para o container do campo de busca
    const searchInputContainer = document.querySelector('.search-input-container');
    const searchButton = document.getElementById('search-button');
    const searchInput = document.getElementById('search-input');
    
    const scrollToTopBtn = document.getElementById('scroll-to-top');

    // --- Funções de Funcionalidade ---

    // Função para renderizar a página inicial com dados do Firestore
    const renderHomePage = () => {
        let homePageContent = `
            <section class="tendencia-agora">
                <div class="tendencia-conteudo">
                    <span>TENDÊNCIA AGORA</span>
                    <p>Empresa de turismo leva a batuques e cores ao plenário da Câmara de Olímpia</p>
                </div>
            </section>
        `;

        const newsArray = Object.values(newsData);
        // Condição corrigida: agora renderiza se houver alguma notícia
        if (newsArray.length > 0) {
            // Separa as notícias para renderização de forma flexível
            const noticiaPrincipal = newsArray[0] || {};
            const noticiasCards = newsArray.slice(1, 5);
            const noticiasGrandes = newsArray.slice(5, 7);
            const noticiasPequenas = newsArray.slice(7, 12);
            // Filtra as notícias de cultura de forma segura
            const noticiasCultura = newsArray.filter(n => n.categoria && n.categoria.toLowerCase() === 'cultura').slice(0, 4);

            // Seção principal
            if (noticiaPrincipal && noticiaPrincipal.titulo) {
                homePageContent += `
                    <section class="grid-noticias-novo">
                        <article class="noticia-principal">
                            <img src="${noticiaPrincipal.urlImagem}" alt="Imagem da notícia principal">
                            <div class="info-overlay">
                                <span class="categoria">${noticiaPrincipal.categoria}</span>
                                <h2><a href="#noticia-completa?id=${noticiaPrincipal.id}">${noticiaPrincipal.titulo}</a></h2>
                                <p>${noticiaPrincipal.autor} - ${noticiaPrincipal.data}</p>
                            </div>
                        </article>
                        <div class="noticia-card-grid">
                            ${noticiasCards.map(news => `
                                <article class="noticia-card">
                                    <img src="${news.urlImagem}" alt="Descrição da imagem do card">
                                    <div class="info-overlay">
                                        <span class="categoria">${news.categoria}</span>
                                        <h4><a href="#noticia-completa?id=${news.id}">${news.titulo}</a></h4>
                                    </div>
                                </article>
                            `).join('')}
                        </div>
                    </section>
                `;
            }

            // Seção de grid inferior
            if (noticiasGrandes.length > 0 || noticiasPequenas.length > 0) {
                homePageContent += `
                    <section class="grid-inferior">
                        ${noticiasGrandes.map(news => `
                            <article class="card-grande">
                                <img src="${news.urlImagem}" alt="Imagem da notícia">
                                <div class="info-overlay">
                                    <span class="categoria">${news.categoria}</span>
                                    <h4><a href="#noticia-completa?id=${news.id}">${news.titulo}</a></h4>
                                    <p>${news.autor} - ${news.data}</p>
                                </div>
                            </article>
                        `).join('')}
                        ${noticiasPequenas.map(news => `
                            <article class="card-pequeno">
                                <img src="${news.urlImagem}" alt="Imagem da notícia">
                                <div class="info-overlay">
                                    <span class="categoria">${news.categoria}</span>
                                    <h5><a href="#noticia-completa?id=${news.id}">${news.titulo}</a></h5>
                                </div>
                            </article>
                        `).join('')}
                    </section>
                `;
            }

            // Seção de cultura
            if (noticiasCultura.length > 0) {
                homePageContent += `
                    <section class="secao-cultura">
                        <div class="secao-titulo">
                            <h3>CULTURA E LAZER</h3>
                        </div>
                        <div class="conteudo-com-anuncio">
                            <div class="grid-cultura">
                                ${noticiasCultura.map(news => `
                                    <article class="noticia-cultura">
                                        <img src="${news.urlImagem}" alt="Imagem da notícia">
                                        <div class="info-overlay">
                                            <h4><a href="#noticia-completa?id=${news.id}">${news.titulo}</a></h4>
                                            <p>${news.autor} - ${news.data}</p>
                                        </div>
                                    </article>
                                `).join('')}
                            </div>
                        </div>
                    </section>
                `;
            }
        }

        mainContentArea.innerHTML = homePageContent;
        document.title = 'Voz do Fato';
        addLinkInterceptors();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Função para renderizar o conteúdo da notícia completa com dados do Firestore
    const renderNoticiaCompleta = (newsId) => {
        const news = newsData[newsId] || {
            titulo: 'Notícia Não Encontrada',
            autor: 'Desconhecido',
            data: 'Data Desconhecida',
            urlImagem: 'https://placehold.co/800x500/E0E0E0/333333?text=IMAGEM+PADRAO',
            conteudo: '<p class="lead">Desculpe, a notícia que você procura não foi encontrada.</p><p>Por favor, verifique o link ou retorne à página inicial.</p>'
        };

        const noticiaCompletaTemplate = `
            <article class="artigo-completo">
                <div class="artigo-cabecalho">
                    <h1>${news.titulo}</h1>
                    <p class="data-autor">Publicado em ${news.data} por ${news.autor}</p>
                </div>
                <img src="${news.urlImagem}" alt="Imagem detalhada do artigo">
                <div class="artigo-texto">
                    ${news.conteudo}
                </div>
            </article>
        `;

        mainContentArea.innerHTML = noticiaCompletaTemplate;
        document.title = `${news.titulo} - Voz do Fato`;
        addLinkInterceptors();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const renderPage = (pageName, params = {}) => {
        if (pageName === 'home') {
            renderHomePage();
        } else if (pageName === 'noticia-completa') {
            renderNoticiaCompleta(params.id);
        }
        // Fechar o menu em mobile
        if (window.innerWidth <= 768) {
            menuLista.classList.remove('active');
        }
    };
    
    // Intercepta cliques em links para simular navegação SPA
    const addLinkInterceptors = () => {
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.removeEventListener('click', handleInternalLinkClick);
            link.addEventListener('click', handleInternalLinkClick);
        });
    };

    const handleInternalLinkClick = (event) => {
        const href = event.currentTarget.getAttribute('href');
        if (href.startsWith('#')) {
            event.preventDefault();

            const [page, queryString] = href.substring(1).split('?');
            const params = {};
            if (queryString) {
                queryString.split('&').forEach(param => {
                    const [key, value] = param.split('=');
                    params[key] = value;
                });
            }
            renderPage(page, params);
        }
    };

    // Menu Hamburguer
    menuHamburguer.addEventListener('click', () => {
        menuLista.classList.toggle('active');
    });

    // Lógica para o novo campo de busca
    const searchInputContainer = document.querySelector('.search-input-container');
    const searchButton = document.getElementById('search-button');
    const searchInput = document.getElementById('search-input');

    searchIcon.addEventListener('click', () => {
        searchInputContainer.classList.toggle('active');
        if (searchInputContainer.classList.contains('active')) {
            searchInput.focus();
        }
    });

    // Botão de busca
    searchButton.addEventListener('click', () => {
        const searchTerm = searchInput.value.trim();
        if (searchTerm) {
            alert(`Você pesquisou por: "${searchTerm}"`);
            searchInputContainer.classList.remove('active');
            searchInput.value = '';
        } else {
            alert('Por favor, digite algo para pesquisar.');
        }
    });
    
    // Esconde o campo de busca se o usuário clicar fora dele
    document.addEventListener('click', (event) => {
        if (!event.target.closest('.search-icon') && !event.target.closest('.search-input-container')) {
            searchInputContainer.classList.remove('active');
        }
    });

    // Botão Voltar ao Topo
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            scrollToTopBtn.classList.add('show');
        } else {
            scrollToTopBtn.classList.remove('show');
        }
    });

    scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // --- Inicialização ---

    // Conecta ao Firestore e busca as notícias
    console.log("Conectando ao Firestore e buscando notícias...");
    const querySnapshot = await getDocs(collection(db, "noticias"));
    
    // Converte a coleção para um objeto newsData, usando o ID do documento como chave
    querySnapshot.forEach((doc) => {
        // Garantindo que a categoria e outros campos existam para evitar erros
        const data = doc.data();
        newsData[doc.id] = { 
            ...data, 
            id: doc.id,
            categoria: data.categoria || ''
        };
    });

    console.log("Notícias carregadas do Firestore:", newsData);

    // Renderiza a página inicial com os dados do Firestore
    renderPage('home');
});
