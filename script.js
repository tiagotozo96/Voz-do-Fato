// SCRIPT.JS - VERSÃO MELHORADA COM ACESSIBILIDADE E PERFORMANCE

// ========== CONFIGURAÇÃO FIREBASE - MELHORADA ==========
const firebaseConfig = {
    apiKey: "AIzaSyAI1TWYSMlZes6hpPUM7h90NGOcxUFRqhOM",
    authDomain: "voz-do-fato-online.firebaseapp.com",
    projectId: "voz-do-fato-online",
    storageBucket: "voz-do-fato-online.firebasestorage.app",
    messagingSenderId: "1011633998825",
    appId: "1:1011633998825:web:ef7eb5b649a703ffb0d978"
};

// ========== IMPORTS FIREBASE - OTIMIZADO ==========
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import { getFirestore, collection, getDocs, orderBy, limit, query } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';

// ========== INICIALIZAÇÃO ==========
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ========== VARIÁVEIS GLOBAIS - ORGANIZADAS ==========
let newsData = {};
let isLoading = false;
let currentPage = 'home';

// Cache para performance - NOVO
const cache = {
    noticias: null,
    lastFetch: null,
    CACHE_DURATION: 5 * 60 * 1000 // 5 minutos
};

// ========== UTILITÁRIOS - NOVO ==========
const Utils = {
    // Função para sanitizar HTML e prevenir XSS
    sanitizeHtml(str) {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    },

    // Função para formatar data
    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (error) {
            return dateString;
        }
    },

    // Função para gerar slug para URLs
    generateSlug(text) {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove acentos
            .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
            .replace(/\s+/g, '-') // Substitui espaços por hífens
            .replace(/-+/g, '-') // Remove hífens duplos
            .trim('-');
    },

    // Debounce para otimizar performance
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Verificar se está em cache válido
    isCacheValid() {
        return cache.noticias && 
               cache.lastFetch && 
               (Date.now() - cache.lastFetch) < cache.CACHE_DURATION;
    }
};

// ========== GESTÃO DE LOADING - NOVO ==========
const LoadingManager = {
    show(message = 'Carregando...') {
        const overlay = document.getElementById('loading-overlay');
        const spinner = overlay.querySelector('.loading-spinner p');
        
        if (spinner) {
            spinner.textContent = message;
        }
        
        overlay.classList.remove('hidden');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    },

    hide() {
        const overlay = document.getElementById('loading-overlay');
        overlay.classList.add('hidden');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        
        // Remove após transição
        setTimeout(() => {
            if (overlay.classList.contains('hidden')) {
                overlay.style.display = 'none';
            }
        }, 300);
    },

    // Loading skeleton para cards
    showSkeleton(container) {
        const skeletonHtml = Array(6).fill(0).map(() => `
            <div class="skeleton skeleton-card" role="img" aria-label="Carregando notícia"></div>
        `).join('');
        
        container.innerHTML = `<div class="grid-noticias-novo">${skeletonHtml}</div>`;
    }
};

// ========== GESTÃO DE ERROS - NOVO ==========
const ErrorManager = {
    show(message, title = 'Erro') {
        const modal = document.getElementById('error-modal');
        const titleElement = document.getElementById('error-title');
        const messageElement = document.getElementById('error-message');
        
        titleElement.textContent = title;
        messageElement.textContent = message;
        
        modal.classList.add('show');
        modal.setAttribute('aria-hidden', 'false');
        
        // Foco no botão fechar para acessibilidade
        const closeButton = document.getElementById('error-close');
        setTimeout(() => closeButton.focus(), 100);
    },

    hide() {
        const modal = document.getElementById('error-modal');
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');
    }
};

// ========== GESTÃO DE SEO/META TAGS - NOVO ==========
const SEOManager = {
    updateMeta(title, description, image, url) {
        // Atualizar título
        document.title = title;
        
        // Atualizar meta description
        let metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.setAttribute('content', description);
        }
        
        // Atualizar Open Graph
        this.updateOGTag('og:title', title);
        this.updateOGTag('og:description', description);
        this.updateOGTag('og:image', image);
        this.updateOGTag('og:url', url);
        
        // Atualizar Twitter Cards
        this.updateOGTag('twitter:title', title);
        this.updateOGTag('twitter:description', description);
    },

    updateOGTag(property, content) {
        let tag = document.querySelector(`meta[property="${property}"], meta[name="${property}"]`);
        if (tag) {
            tag.setAttribute('content', content);
        }
    }
};

// ========== BREADCRUMBS - NOVO ==========
const BreadcrumbManager = {
    update(items) {
        const breadcrumbList = document.getElementById('breadcrumb-list');
        if (!breadcrumbList) return;

        breadcrumbList.innerHTML = items.map((item, index) => {
            const isLast = index === items.length - 1;
            return `
                <li>
                    ${isLast ? 
                        `<span aria-current="page">${Utils.sanitizeHtml(item.title)}</span>` :
                        `<a href="${item.url}">${Utils.sanitizeHtml(item.title)}</a>`
                    }
                </li>
            `;
        }).join('');
    }
};

// ========== ACESSIBILIDADE - NOVO ==========
const AccessibilityManager = {
    // Atualizar atributos ARIA
    updateAriaExpanded(element, isExpanded) {
        element.setAttribute('aria-expanded', isExpanded.toString());
    },

    // Anunciar mudanças para leitores de tela
    announceToScreenReader(message, priority = 'polite') {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', priority);
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'visually-hidden';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        // Remove após 1 segundo
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    },

    // Gerenciar foco
    trapFocus(container) {
        const focusableElements = container.querySelectorAll(
            'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        const handleTabKey = (e) => {
            if (e.key !== 'Tab') return;
            
            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        };
        
        container.addEventListener('keydown', handleTabKey);
        return () => container.removeEventListener('keydown', handleTabKey);
    }
};

// ========== FUNÇÃO PARA DESTACAR TERMOS DE BUSCA - CORRIGIDA ==========
const highlightSearchTerm = (text, term) => {
    if (!term.trim()) return text;
    
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
};

// ========== FUNÇÕES PRINCIPAIS - MELHORADAS ==========
document.addEventListener('DOMContentLoaded', async () => {
    // Elementos do DOM
    const elements = {
        mainContentArea: document.getElementById('main-content-area'),
        menuHamburguer: document.querySelector('.menu-hamburguer'),
        menuLista: document.querySelector('.menu-lista'),
        searchIcon: document.querySelector('.search-icon'),
        searchInputContainer: document.querySelector('.search-input-container'),
        searchButton: document.getElementById('search-button'),
        searchInput: document.getElementById('search-input'),
        scrollToTopBtn: document.getElementById('scroll-to-top'),
        errorClose: document.getElementById('error-close'),
        dataAtual: document.getElementById('data-atual')
    };

    // Verificar se elementos existem
    const missingElements = Object.entries(elements)
        .filter(([key, element]) => !element)
        .map(([key]) => key);

    if (missingElements.length > 0) {
        console.error('Elementos DOM não encontrados:', missingElements);
        ErrorManager.show('Erro ao carregar a página. Alguns elementos não foram encontrados.');
        return;
    }

    // ========== INICIALIZAÇÃO - MELHORADA ==========
    try {
        LoadingManager.show('Carregando notícias...');
        
        // Atualizar data atual
        updateCurrentDate();
        
        // Carregar notícias
        await loadNewsData();
        
        // Renderizar página inicial
        renderPage('home');
        
        LoadingManager.hide();
        
        AccessibilityManager.announceToScreenReader('Página carregada com sucesso');
        
    } catch (error) {
        console.error('Erro durante inicialização:', error);
        LoadingManager.hide();
        ErrorManager.show('Erro ao carregar as notícias. Tente recarregar a página.');
    }

    // ========== FUNÇÃO PARA CARREGAR DADOS - OTIMIZADA ==========
    async function loadNewsData() {
        try {
            // Verificar cache primeiro
            if (Utils.isCacheValid()) {
                console.log('Usando dados do cache');
                newsData = cache.noticias;
                return;
            }

            console.log('Buscando notícias do Firebase...');
            
            // Query otimizada com ordenação e limite
            const q = query(
                collection(db, "noticias"),
                orderBy("data", "desc"),
                limit(50) // Limitar para melhor performance
            );
            
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
                throw new Error('Nenhuma notícia encontrada');
            }
            
            // Processar dados
            newsData = {};
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                newsData[doc.id] = {
                    ...data,
                    id: doc.id,
                    categoria: data.categoria || 'Geral',
                    titulo: Utils.sanitizeHtml(data.titulo || 'Título não disponível'),
                    autor: Utils.sanitizeHtml(data.autor || 'Autor não informado'),
                    data: Utils.formatDate(data.data || new Date().toISOString())
                };
            });

            // Atualizar cache
            cache.noticias = newsData;
            cache.lastFetch = Date.now();
            
            console.log(`${Object.keys(newsData).length} notícias carregadas`);
            
        } catch (error) {
            console.error("Erro ao carregar notícias:", error);
            throw new Error('Falha ao conectar com o servidor de notícias');
        }
    }

    // ========== RENDERIZAÇÃO DA PÁGINA INICIAL - MELHORADA ==========
    const renderHomePage = () => {
        try {
            let homePageContent = `
                <section class="tendencia-agora" role="banner">
                    <div class="tendencia-conteudo">
                        <span>TENDÊNCIA AGORA</span>
                        <p>Empresa de turismo leva a batuques e cores ao plenário da Câmara de Olímpia</p>
                    </div>
                </section>
            `;

            const newsArray = Object.values(newsData);
            
            if (newsArray.length === 0) {
                homePageContent += `
                    <div class="no-news-message" role="alert">
                        <h2>Nenhuma notícia encontrada</h2>
                        <p>Não há notícias disponíveis no momento. Tente novamente mais tarde.</p>
                    </div>
                `;
            } else {
                // Separar notícias por seções
                const noticiaPrincipal = newsArray[0] || {};
                const noticiasCards = newsArray.slice(1, 5);
                const noticiasGrandes = newsArray.slice(5, 7);
                const noticiasPequenas = newsArray.slice(7, 12);
                const noticiasCultura = newsArray
                    .filter(n => n.categoria && n.categoria.toLowerCase().includes('cultura'))
                    .slice(0, 4);

                // Seção principal
                if (noticiaPrincipal.titulo) {
                    homePageContent += `
                        <section class="grid-noticias-novo">
                            <article class="noticia-principal">
                                <img src="${noticiaPrincipal.urlImagem || 'https://placehold.co/800x400/E0E0E0/333333?text=IMAGEM+INDISPONIVEL'}" 
                                     alt="${noticiaPrincipal.titulo}" 
                                     loading="eager">
                                <div class="info-overlay">
                                    <span class="categoria">${noticiaPrincipal.categoria}</span>
                                    <h2>
                                        <a href="#noticia-completa?id=${noticiaPrincipal.id}" 
                                           aria-label="Leia a notícia completa: ${noticiaPrincipal.titulo}">
                                            ${noticiaPrincipal.titulo}
                                        </a>
                                    </h2>
                                    <p>
                                        <span class="autor">${noticiaPrincipal.autor}</span> - 
                                        <time datetime="${noticiaPrincipal.data}">${noticiaPrincipal.data}</time>
                                    </p>
                                </div>
                            </article>
                            <div class="noticia-card-grid">
                                ${noticiasCards.map(news => `
                                    <article class="noticia-card">
                                        <img src="${news.urlImagem || 'https://placehold.co/400x200/E0E0E0/333333?text=IMAGEM+INDISPONIVEL'}" 
                                             alt="${news.titulo}"
                                             loading="lazy">
                                        <div class="info-overlay">
                                            <span class="categoria">${news.categoria}</span>
                                            <h4>
                                                <a href="#noticia-completa?id=${news.id}"
                                                   aria-label="Leia: ${news.titulo}">
                                                    ${news.titulo}
                                                </a>
                                            </h4>
                                        </div>
                                    </article>
                                `).join('')}
                            </div>
                        </section>
                    `;
                }

                // Seção inferior
                if (noticiasGrandes.length > 0 || noticiasPequenas.length > 0) {
                    homePageContent += `
                        <section class="grid-inferior">
                            ${noticiasGrandes.map(news => `
                                <article class="card-grande">
                                    <img src="${news.urlImagem || 'https://placehold.co/600x300/E0E0E0/333333?text=IMAGEM+INDISPONIVEL'}" 
                                         alt="${news.titulo}"
                                         loading="lazy">
                                    <div class="info-overlay">
                                        <span class="categoria">${news.categoria}</span>
                                        <h4>
                                            <a href="#noticia-completa?id=${news.id}"
                                               aria-label="Leia: ${news.titulo}">
                                                ${news.titulo}
                                            </a>
                                        </h4>
                                        <p>
                                            <span class="autor">${news.autor}</span> - 
                                            <time datetime="${news.data}">${news.data}</time>
                                        </p>
                                    </div>
                                </article>
                            `).join('')}
                            ${noticiasPequenas.map(news => `
                                <article class="card-pequeno">
                                    <img src="${news.urlImagem || 'https://placehold.co/300x200/E0E0E0/333333?text=IMAGEM+INDISPONIVEL'}" 
                                         alt="${news.titulo}"
                                         loading="lazy">
                                    <div class="info-overlay">
                                        <span class="categoria">${news.categoria}</span>
                                        <h5>
                                            <a href="#noticia-completa?id=${news.id}"
                                               aria-label="Leia: ${news.titulo}">
                                                ${news.titulo}
                                            </a>
                                        </h5>
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
                                            <img src="${news.urlImagem || 'https://placehold.co/400x250/E0E0E0/333333?text=IMAGEM+INDISPONIVEL'}" 
                                                 alt="${news.titulo}"
                                                 loading="lazy">
                                            <div class="info-overlay">
                                                <h4>
                                                    <a href="#noticia-completa?id=${news.id}"
                                                       aria-label="Leia: ${news.titulo}">
                                                        ${news.titulo}
                                                    </a>
                                                </h4>
                                                <p>
                                                    <span class="autor">${news.autor}</span> - 
                                                    <time datetime="${news.data}">${news.data}</time>
                                                </p>
                                            </div>
                                        </article>
                                    `).join('')}
                                </div>
                            </div>
                        </section>
                    `;
                }
            }

            elements.mainContentArea.innerHTML = homePageContent;
            
            // Atualizar SEO
            SEOManager.updateMeta(
                'Voz do Fato - Portal de Notícias',
                'Portal de notícias rápidas e confiáveis do Brasil. Notícias de Cidade, Política, Economia, Cultura e mais.',
                'https://raw.githubusercontent.com/tiagotozo96/Voz-do-Fato/master/imagens/voz-do-fato.png',
                window.location.href
            );
            
            // Atualizar breadcrumbs
            BreadcrumbManager.update([
                { title: 'Início', url: '#home' }
            ]);
            
        } catch (error) {
            console.error('Erro ao renderizar página inicial:', error);
            ErrorManager.show('Erro ao exibir as notícias');
        }
    };

    // ========== RENDERIZAÇÃO DE NOTÍCIA COMPLETA - MELHORADA ==========
    const renderNoticiaCompleta = (newsId) => {
        try {
            const news = newsData[newsId];
            
            if (!news) {
                const notFoundContent = `
                    <article class="artigo-completo" role="main">
                        <div class="artigo-cabecalho">
                            <h1>Notícia Não Encontrada</h1>
                            <p class="data-autor">Erro 404</p>
                        </div>
                        <div class="artigo-texto">
                            <p class="lead">Desculpe, a notícia que você procura não foi encontrada.</p>
                            <p>A notícia pode ter sido removida ou o link pode estar incorreto.</p>
                            <p><a href="#home" class="button-primary">Voltar ao Início</a></p>
                        </div>
                    </article>
                `;
                elements.mainContentArea.innerHTML = notFoundContent;
                
                // Atualizar SEO para 404
                SEOManager.updateMeta(
                    'Notícia Não Encontrada - Voz do Fato',
                    'A notícia solicitada não foi encontrada.',
                    'https://raw.githubusercontent.com/tiagotozo96/Voz-do-Fato/master/imagens/voz-do-fato.png',
                    window.location.href
                );
                
                BreadcrumbManager.update([
                    { title: 'Início', url: '#home' },
                    { title: 'Notícia Não Encontrada', url: '' }
                ]);
                
                return;
            }

            const noticiaCompletaTemplate = `
                <article class="artigo-completo" role="main">
                    <div class="artigo-cabecalho">
                        <h1>${news.titulo}</h1>
                        <p class="data-autor">
                            Publicado em <time datetime="${news.data}">${news.data}</time> 
                            por <span class="autor">${news.autor}</span>
                            <span class="categoria-badge">${news.categoria}</span>
                        </p>
                    </div>
                    <img src="${news.urlImagem || 'https://placehold.co/800x450/E0E0E0/333333?text=IMAGEM+INDISPONIVEL'}" 
                         alt="Imagem da notícia: ${news.titulo}"
                         loading="eager">
                    <div class="artigo-texto">
                        ${news.resumo ? `<p class="lead">${news.resumo}</p>` : ''}
                        ${news.conteudo || '<p>Conteúdo da notícia não disponível.</p>'}
                    </div>
                    
                    <!-- Botões de compartilhamento - NOVO -->
                    <div class="compartilhar-artigo">
                        <h3>Compartilhe esta notícia:</h3>
                        <div class="botoes-compartilhar">
                            <button onclick="compartilharFacebook('${newsId}')" 
                                    aria-label="Compartilhar no Facebook"
                                    class="btn-facebook">
                                <i class="fab fa-facebook-f" aria-hidden="true"></i> Facebook
                            </button>
                            <button onclick="compartilharTwitter('${newsId}')" 
                                    aria-label="Compartilhar no Twitter"
                                    class="btn-twitter">
                                <i class="fab fa-twitter" aria-hidden="true"></i> Twitter
                            </button>
                            <button onclick="compartilharWhatsapp('${newsId}')" 
                                    aria-label="Compartilhar no WhatsApp"
                                    class="btn-whatsapp">
                                <i class="fab fa-whatsapp" aria-hidden="true"></i> WhatsApp
                            </button>
                        </div>
                    </div>
                </article>
            `;

            elements.mainContentArea.innerHTML = noticiaCompletaTemplate;
            
            // Atualizar SEO
            SEOManager.updateMeta(
                `${news.titulo} - Voz do Fato`,
                news.resumo || news.titulo,
                news.urlImagem || 'https://raw.githubusercontent.com/tiagotozo96/Voz-do-Fato/master/imagens/voz-do-fato.png',
                `${window.location.origin}${window.location.pathname}#noticia-completa?id=${newsId}`
            );
            
            // Atualizar breadcrumbs
            BreadcrumbManager.update([
                { title: 'Início', url: '#home' },
                { title: news.categoria, url: `#categoria-${Utils.generateSlug(news.categoria)}` },
                { title: news.titulo.length > 50 ? news.titulo.substring(0, 50) + '...' : news.titulo, url: '' }
            ]);
            
        } catch (error) {
            console.error('Erro ao renderizar notícia completa:', error);
            ErrorManager.show('Erro ao carregar a notícia completa');
        }
    };

    // ========== FUNÇÕES DE COMPARTILHAMENTO - NOVO ==========
    window.compartilharFacebook = (newsId) => {
        const news = newsData[newsId];
        if (!news) return;
        
        const url = encodeURIComponent(`${window.location.origin}${window.location.pathname}#noticia-completa?id=${newsId}`);
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=600,height=400');
    };

    window.compartilharTwitter = (newsId) => {
        const news = newsData[newsId];
        if (!news) return;
        
        const text = encodeURIComponent(`${news.titulo} - via @vozdofato`);
        const url = encodeURIComponent(`${window.location.origin}${window.location.pathname}#noticia-completa?id=${newsId}`);
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'width=600,height=400');
    };

    window.compartilharWhatsapp = (newsId) => {
        const news = newsData[newsId];
        if (!news) return;
        
        const text = encodeURIComponent(`${news.titulo}\n\nLeia mais: ${window.location.origin}${window.location.pathname}#noticia-completa?id=${newsId}`);
        window.open(`https://wa.me/?text=${text}`, '_blank');
    };

    // ========== RENDERIZAÇÃO DE PÁGINAS - MELHORADA ==========
    const renderPage = (pageName, params = {}) => {
        if (isLoading) return;
        
        currentPage = pageName;
        
        try {
            if (pageName === 'home') {
                renderHomePage();
            } else if (pageName === 'noticia-completa') {
                renderNoticiaCompleta(params.id);
            } else if (pageName.startsWith('categoria-')) {
                const categoria = pageName.replace('categoria-', '').replace('-', ' ');
                renderCategoria(categoria);
            } else {
                // Página não encontrada
                elements.mainContentArea.innerHTML = `
                    <div class="page-not-found">
                        <h1>Página Não Encontrada</h1>
                        <p>A página que você procura não existe.</p>
                        <a href="#home" class="button-primary">Voltar ao Início</a>
                    </div>
                `;
            }
            
            addLinkInterceptors();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            // Fechar menu mobile
            if (window.innerWidth <= 768) {
                elements.menuLista.classList.remove('active');
                AccessibilityManager.updateAriaExpanded(elements.menuHamburguer, false);
            }
            
        } catch (error) {
            console.error(`Erro ao renderizar página ${pageName}:`, error);
            ErrorManager.show('Erro ao carregar a página');
        }
    };

    // ========== RENDERIZAÇÃO POR CATEGORIA - NOVO ==========
    const renderCategoria = (categoria) => {
        const newsArray = Object.values(newsData)
            .filter(news => news.categoria.toLowerCase().includes(categoria.toLowerCase()));

        if (newsArray.length === 0) {
            elements.mainContentArea.innerHTML = `
                <div class="categoria-vazia">
                    <h1>Categoria: ${categoria.toUpperCase()}</h1>
                    <p>Não há notícias disponíveis nesta categoria no momento.</p>
                    <a href="#home" class="button-primary">Voltar ao Início</a>
                </div>
            `;
            return;
        }

        const categoriaContent = `
            <div class="categoria-header">
                <h1>Notícias de ${categoria.toUpperCase()}</h1>
                <p>${newsArray.length} notícia${newsArray.length > 1 ? 's' : ''} encontrada${newsArray.length > 1 ? 's' : ''}</p>
            </div>
            <div class="grid-categoria">
                ${newsArray.map(news => `
                    <article class="noticia-card">
                        <img src="${news.urlImagem || 'https://placehold.co/400x250/E0E0E0/333333?text=IMAGEM+INDISPONIVEL'}" 
                             alt="${news.titulo}"
                             loading="lazy">
                        <div class="info-overlay">
                            <span class="categoria">${news.categoria}</span>
                            <h4>
                                <a href="#noticia-completa?id=${news.id}" 
                                   aria-label="Leia: ${news.titulo}">
                                    ${news.titulo}
                                </a>
                            </h4>
                            <p>
                                <span class="autor">${news.autor}</span> - 
                                <time datetime="${news.data}">${news.data}</time>
                            </p>
                        </div>
                    </article>
                `).join('')}
            </div>
        `;

        elements.mainContentArea.innerHTML = categoriaContent;
        
        BreadcrumbManager.update([
            { title: 'Início', url: '#home' },
            { title: categoria.toUpperCase(), url: '' }
        ]);
    };

    // ========== INTERCEPTAÇÃO DE LINKS - MELHORADA ==========
    const addLinkInterceptors = () => {
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.removeEventListener('click', handleInternalLinkClick);
            link.addEventListener('click', handleInternalLinkClick);
        });
    };

    const handleInternalLinkClick = (event) => {
        const href = event.currentTarget.getAttribute('href');
        
        if (!href || !href.startsWith('#')) return;
        
        event.preventDefault();

        try {
            const [page, queryString] = href.substring(1).split('?');
            const params = {};
            
            if (queryString) {
                queryString.split('&').forEach(param => {
                    const [key, value] = param.split('=');
                    params[key] = decodeURIComponent(value);
                });
            }
            
            renderPage(page, params);
            
        } catch (error) {
            console.error('Erro ao processar link:', error);
            renderPage('home'); // Fallback para home
        }
    };

    // ========== ATUALIZAR DATA ATUAL - NOVO ==========
    function updateCurrentDate() {
        if (elements.dataAtual) {
            const now = new Date();
            const options = {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            };
            
            const dateString = now.toLocaleDateString('pt-BR', options);
            elements.dataAtual.textContent = dateString;
        }
    }

    // ========== EVENT LISTENERS - MELHORADOS ==========
    
    // Menu Hamburguer com acessibilidade
    elements.menuHamburguer.addEventListener('click', () => {
        const isActive = elements.menuLista.classList.contains('active');
        elements.menuLista.classList.toggle('active');
        AccessibilityManager.updateAriaExpanded(elements.menuHamburguer, !isActive);
        
        if (!isActive) {
            AccessibilityManager.announceToScreenReader('Menu aberto');
            // Foco no primeiro item do menu
            const firstMenuItem = elements.menuLista.querySelector('a');
            if (firstMenuItem) {
                setTimeout(() => firstMenuItem.focus(), 100);
            }
        } else {
            AccessibilityManager.announceToScreenReader('Menu fechado');
        }
    });

    // Fechar menu com ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (elements.menuLista.classList.contains('active')) {
                elements.menuLista.classList.remove('active');
                AccessibilityManager.updateAriaExpanded(elements.menuHamburguer, false);
                elements.menuHamburguer.focus();
            }
            
            if (elements.searchInputContainer.classList.contains('active')) {
                elements.searchInputContainer.classList.remove('active');
                AccessibilityManager.updateAriaExpanded(elements.searchIcon, false);
                elements.searchIcon.focus();
            }
            
            ErrorManager.hide();
        }
    });

    // Campo de busca com acessibilidade
    elements.searchIcon.addEventListener('click', () => {
        const isActive = elements.searchInputContainer.classList.contains('active');
        elements.searchInputContainer.classList.toggle('active');
        AccessibilityManager.updateAriaExpanded(elements.searchIcon, !isActive);
        
        if (!isActive) {
            setTimeout(() => {
                elements.searchInput.focus();
                AccessibilityManager.announceToScreenReader('Campo de busca aberto');
            }, 100);
        }
    });

    // Busca com debounce e melhorias
    const performSearch = Utils.debounce((searchTerm) => {
        if (!searchTerm.trim()) {
            ErrorManager.show('Por favor, digite algo para pesquisar.', 'Campo Vazio');
            return;
        }
        
        const results = Object.values(newsData).filter(news =>
            news.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            news.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (news.conteudo && news.conteudo.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        
        renderSearchResults(searchTerm, results);
        elements.searchInputContainer.classList.remove('active');
        elements.searchInput.value = '';
        
        AccessibilityManager.announceToScreenReader(
            `Busca realizada. ${results.length} resultado${results.length !== 1 ? 's' : ''} encontrado${results.length !== 1 ? 's' : ''}`
        );
    }, 300);

    elements.searchButton.addEventListener('click', () => {
        performSearch(elements.searchInput.value);
    });

    elements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            performSearch(elements.searchInput.value);
        }
    });

    // ========== RENDERIZAÇÃO DE RESULTADOS DE BUSCA - NOVO ==========
    const renderSearchResults = (searchTerm, results) => {
        if (results.length === 0) {
            elements.mainContentArea.innerHTML = `
                <div class="search-results">
                    <h1>Resultados da Busca</h1>
                    <p>Nenhum resultado encontrado para: "<strong>${Utils.sanitizeHtml(searchTerm)}</strong>"</p>
                    <p>Tente usar outras palavras-chave ou volte à <a href="#home">página inicial</a>.</p>
                </div>
            `;
        } else {
            const resultsContent = `
                <div class="search-results">
                    <h1>Resultados da Busca</h1>
                    <p>${results.length} resultado${results.length !== 1 ? 's' : ''} encontrado${results.length !== 1 ? 's' : ''} para: "<strong>${Utils.sanitizeHtml(searchTerm)}</strong>"</p>
                    <div class="results-grid">
                        ${results.map(news => `
                            <article class="search-result-card">
                                <img src="${news.urlImagem || 'https://placehold.co/300x200/E0E0E0/333333?text=IMAGEM+INDISPONIVEL'}" 
                                     alt="${news.titulo}"
                                     loading="lazy">
                                <div class="result-content">
                                    <span class="categoria">${news.categoria}</span>
                                    <h3>
                                        <a href="#noticia-completa?id=${news.id}" 
                                           aria-label="Leia: ${news.titulo}">
                                            ${highlightSearchTerm(news.titulo, searchTerm)}
                                        </a>
                                    </h3>
                                    <p class="result-excerpt">
                                        ${highlightSearchTerm(
                                            (news.resumo || news.conteudo || '').substring(0, 150) + '...', 
                                            searchTerm
                                        )}
                                    </p>
                                    <p class="result-meta">
                                        <span class="autor">${news.autor}</span> - 
                                        <time datetime="${news.data}">${news.data}</time>
                                    </p>
                                </div>
                            </article>
                        `).join('')}
                    </div>
                </div>
            `;
            elements.mainContentArea.innerHTML = resultsContent;
        }
        
        BreadcrumbManager.update([
            { title: 'Início', url: '#home' },
            { title: `Busca: ${searchTerm}`, url: '' }
        ]);
        
        addLinkInterceptors();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // ========== CLIQUE FORA PARA FECHAR - MELHORADO ==========
    document.addEventListener('click', (event) => {
        // Fechar busca se clicar fora
        if (!event.target.closest('.search-icon') && 
            !event.target.closest('.search-input-container')) {
            elements.searchInputContainer.classList.remove('active');
            AccessibilityManager.updateAriaExpanded(elements.searchIcon, false);
        }
        
        // Fechar menu mobile se clicar fora
        if (!event.target.closest('.menu-hamburguer') && 
            !event.target.closest('.menu-lista') &&
            window.innerWidth <= 768) {
            elements.menuLista.classList.remove('active');
            AccessibilityManager.updateAriaExpanded(elements.menuHamburguer, false);
        }
    });

    // ========== BOTÃO VOLTAR AO TOPO - MELHORADO ==========
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            if (window.scrollY > 300) {
                elements.scrollToTopBtn.classList.add('show');
            } else {
                elements.scrollToTopBtn.classList.remove('show');
            }
        }, 100); // Debounce do scroll
    });

    elements.scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
        
        AccessibilityManager.announceToScreenReader('Voltando ao topo da página');
        
        // Focar no skip link após voltar ao topo
        setTimeout(() => {
            const skipLink = document.querySelector('.skip-link');
            if (skipLink) skipLink.focus();
        }, 500);
    });

    // ========== MODAL DE ERRO - MELHORADO ==========
    elements.errorClose.addEventListener('click', () => {
        ErrorManager.hide();
    });

    // ========== NAVEGAÇÃO POR TECLADO - NOVO ==========
    document.addEventListener('keydown', (e) => {
        // Navegação rápida por teclas
        if (e.altKey) {
            switch(e.key) {
                case 'h':
                case 'H':
                    e.preventDefault();
                    renderPage('home');
                    AccessibilityManager.announceToScreenReader('Navegando para a página inicial');
                    break;
                case 's':
                case 'S':
                    e.preventDefault();
                    elements.searchIcon.click();
                    break;
            }
        }
    });

    // ========== LAZY LOADING DE IMAGENS - NOVO ==========
    const setupLazyLoading = () => {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src || img.src;
                        img.classList.remove('lazy');
                        observer.unobserve(img);
                    }
                });
            });

            // Observar novas imagens quando o conteúdo muda
            const observeImages = () => {
                document.querySelectorAll('img[loading="lazy"]').forEach(img => {
                    imageObserver.observe(img);
                });
            };

            // Observer para mudanças no DOM
            const contentObserver = new MutationObserver(observeImages);
            contentObserver.observe(elements.mainContentArea, {
                childList: true,
                subtree: true
            });

            observeImages(); // Observar imagens já existentes
        }
    };

    setupLazyLoading();

    // ========== SERVICE WORKER PARA CACHE - NOVO ==========
    const setupServiceWorker = () => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('Service Worker registrado:', registration);
                })
                .catch(error => {
                    console.log('Erro ao registrar Service Worker:', error);
                });
        }
    };

    setupServiceWorker();

    // ========== MONITORAMENTO DE PERFORMANCE - NOVO ==========
    const monitorPerformance = () => {
        if ('performance' in window) {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const perfData = performance.getEntriesByType('navigation')[0];
                    console.log('Performance:', {
                        'DOM Content Loaded': perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
                        'Load Complete': perfData.loadEventEnd - perfData.loadEventStart,
                        'Total Load Time': perfData.loadEventEnd - perfData.fetchStart
                    });
                }, 0);
            });
        }
    };

    monitorPerformance();

    // ========== GESTÃO DE CONEXÃO - NOVO ==========
    const handleConnectionChange = () => {
        if ('navigator' in window && 'onLine' in navigator) {
            const updateOnlineStatus = () => {
                if (navigator.onLine) {
                    AccessibilityManager.announceToScreenReader('Conexão restaurada');
                    // Tentar recarregar dados se estiver offline há muito tempo
                    if (cache.lastFetch && (Date.now() - cache.lastFetch) > cache.CACHE_DURATION) {
                        loadNewsData().catch(console.error);
                    }
                } else {
                    AccessibilityManager.announceToScreenReader('Conexão perdida. Usando dados salvos.');
                }
            };

            window.addEventListener('online', updateOnlineStatus);
            window.addEventListener('offline', updateOnlineStatus);
        }
    };

    handleConnectionChange();

    // ========== ANALYTICS BÁSICO - NOVO ==========
    const trackPageView = (page) => {
        // Aqui você pode integrar com Google Analytics, etc.
        console.log(`Página visitada: ${page}`);
        
        // Exemplo básico de tracking local
        if (localStorage) {
            try {
                const views = JSON.parse(localStorage.getItem('pageViews') || '{}');
                views[page] = (views[page] || 0) + 1;
                localStorage.setItem('pageViews', JSON.stringify(views));
            } catch (error) {
                console.error('Erro ao salvar analytics:', error);
            }
        }
    };

    // Rastrear visualização inicial
    trackPageView('home');

    // ========== ATUALIZAÇÕES AUTOMÁTICAS - NOVO ==========
    const setupAutoRefresh = () => {
        // Atualizar dados a cada 10 minutos se a página estiver visível
        setInterval(() => {
            if (!document.hidden && navigator.onLine) {
                loadNewsData().then(() => {
                    console.log('Dados atualizados automaticamente');
                }).catch(console.error);
            }
        }, 10 * 60 * 1000); // 10 minutos
    };

    setupAutoRefresh();

    console.log('🎉 Voz do Fato carregado com sucesso! Todas as melhorias implementadas.');
    console.log('📊 Recursos ativos: Acessibilidade, Performance, SEO, Cache, Service Worker');
});

// ========== ESTILOS ADICIONAIS PARA COMPONENTES NOVOS - CSS INLINE ==========
const additionalStyles = `
    <style>
    .search-results {
        padding: 2rem 0;
    }
    
    .search-results h1 {
        color: var(--secondary-color, #2c3e50);
        margin-bottom: 1rem;
    }
    
    .results-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
        margin-top: 2rem;
    }
    
    .search-result-card {
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        overflow: hidden;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    
    .search-result-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    
    .search-result-card img {
        width: 100%;
        height: 200px;
        object-fit: cover;
    }
    
    .result-content {
        padding: 1rem;
    }
    
    .result-content .categoria {
        background: var(--secondary-color, #2c3e50);
        color: white;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.8rem;
        text-transform: uppercase;
    }
    
    .result-content h3 {
        margin: 0.5rem 0;
        font-size: 1.1rem;
        line-height: 1.3;
    }
    
    .result-content h3 a {
        color: var(--text-color, #333);
        text-decoration: none;
    }
    
    .result-content h3 a:hover {
        color: var(--primary-color, #c0392b);
    }
    
    .result-excerpt {
        color: var(--dark-gray, #666);
        font-size: 0.9rem;
        line-height: 1.4;
        margin: 0.5rem 0;
    }
    
    .result-meta {
        font-size: 0.8rem;
        color: var(--dark-gray, #666);
        margin: 0;
    }
    
    mark {
        background-color: #ffeb3b;
        padding: 0 0.2rem;
        border-radius: 2px;
    }
    
    .no-news-message {
        text-align: center;
        padding: 3rem 1rem;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .categoria-header {
        background: white;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        margin-bottom: 2rem;
        text-align: center;
    }
    
    .grid-categoria {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
    }
    
    .compartilhar-artigo {
        margin-top: 2rem;
        padding: 1.5rem;
        background: #f8f9fa;
        border-radius: 8px;
        border-left: 4px solid var(--primary-color, #c0392b);
    }
    
    .botoes-compartilhar {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
        margin-top: 1rem;
    }
    
    .botoes-compartilhar button {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
        transition: background-color 0.3s ease;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .btn-facebook { background: #3b5998; color: white; }
    .btn-twitter { background: #1da1f2; color: white; }
    .btn-whatsapp { background: #25d366; color: white; }
    
    .botoes-compartilhar button:hover {
        opacity: 0.9;
        transform: translateY(-1px);
    }
    
    .categoria-badge {
        background: var(--primary-color, #c0392b);
        color: white;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.8rem;
        margin-left: 1rem;
    }
    
    @media (max-width: 768px) {
        .results-grid,
        .grid-categoria {
            grid-template-columns: 1fr;
        }
        
        .botoes-compartilhar {
            flex-direction: column;
        }
        
        .botoes-compartilhar button {
            justify-content: center;
        }
    }
    </style>
`;

// Adicionar estilos ao head
document.head.insertAdjacentHTML('beforeend', additionalStyles);