# Design Guidelines: Plataforma de Streaming de Música

## Design Approach
**Reference-Based Approach**: Inspirado em Spotify, Apple Music e YouTube Music, criando uma identidade visual própria que combina a elegância minimalista da Apple Music com a energia vibrante do Spotify e a familiaridade do YouTube.

**Key Design Principles**:
- Conteúdo em primeiro lugar: O visual deve destacar músicas, artistas e playlists
- Imersão através de cores dinâmicas extraídas das capas de álbuns
- Navegação intuitiva e previsível
- Performance visual através de dark mode por padrão

## Core Design Elements

### A. Color Palette

**Dark Mode (Padrão)**:
- Background Principal: 18 8% 8% (quase preto com leve toque quente)
- Background Secundário: 18 8% 12% (cards, sidebars)
- Background Elevated: 18 8% 16% (modais, dropdowns)
- Text Primary: 0 0% 98%
- Text Secondary: 0 0% 65%
- Primary Brand: 142 76% 36% (verde vibrante similar ao Spotify mas com identidade própria)
- Primary Hover: 142 76% 42%
- Accent Dynamic: Cores extraídas automaticamente das capas de álbuns/playlists (feature visual diferenciadora)

**Light Mode** (opcional para futuro):
- Background: 0 0% 98%
- Surface: 0 0% 100%
- Primary: 142 70% 32%

### B. Typography

**Font Families**:
- Primary: 'Inter' (interface, controles, menus) - Google Fonts
- Display: 'Outfit' (títulos de playlists, nomes de artistas) - Google Fonts
- Monospace: 'JetBrains Mono' (timestamps, duração) - Google Fonts

**Hierarchy**:
- Hero Title: text-5xl md:text-6xl font-bold (Outfit)
- Section Headers: text-2xl md:text-3xl font-semibold (Outfit)
- Card Titles: text-lg font-medium (Inter)
- Body Text: text-base font-normal (Inter)
- Metadata: text-sm text-secondary (Inter)
- Micro: text-xs (duração, estatísticas)

### C. Layout System

**Spacing Units**: Usar primariamente 2, 4, 6, 8, 12, 16 do Tailwind
- Component padding interno: p-4 ou p-6
- Section spacing: gap-8 ou gap-12
- Card spacing: gap-4 ou gap-6
- Sidebar padding: p-6
- Container max-width: max-w-screen-2xl

**Grid Patterns**:
- Playlists/Albums: grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6
- Featured content: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Search results: grid-cols-1 com itens em lista vertical

### D. Component Library

**Navigation**:
- Sidebar persistente (240px desktop): Logo, navegação principal, playlists do usuário
- Top bar: Busca global, perfil do usuário, configurações
- Mobile: Bottom navigation bar com 4-5 itens principais

**Player de Música** (fixo no bottom):
- Altura: 90px desktop, 72px mobile
- Seções: Info da música (esquerda) | Controles centrais | Volume e extras (direita)
- Controles: Anterior, Play/Pause (destaque), Próximo, Shuffle, Repeat
- Progress bar: altura de 4px, interactive hover com tooltip de tempo
- Background: Backdrop blur com opacity 95% sobre fundo escuro

**Cards de Música/Playlist**:
- Aspect ratio: 1:1 para capas
- Hover state: Escala sutil (scale-105), overlay escuro com botão play central
- Informações abaixo da capa: Título (truncate), artista/descrição (text-sm text-secondary)
- Border radius: rounded-lg (8px)

**Forms (Login/Cadastro)**:
- Inputs: Altura h-12, rounded-lg, border com focus ring na cor primary
- Background inputs: bg-background-secondary com border sutil
- Labels: mb-2, text-sm font-medium
- Buttons: h-12, rounded-lg, full-width em mobile

**Dashboard/Home**:
- Hero section: Sem imagem de fundo grande, usar grid de playlists recentes/recomendadas
- Seções horizontais scrolláveis: "Tocadas recentemente", "Recomendadas", "Suas playlists"
- Row spacing: mb-8 ou mb-12

**Modais**:
- Criar/Editar Playlist: Formulário centralizado, max-w-md
- Configurações de perfil: Modal maior, max-w-2xl com tabs
- Background overlay: bg-black/60 com backdrop-blur

**Lists & Tables**:
- Track lists: Hover em rows inteiras, alternating backgrounds sutis
- Colunas: Número, Título/Artista, Álbum, Duração, Ações
- Row height: h-14 para conforto visual

### E. Iconography
**Library**: Heroicons (outline para navegação, solid para actions)
- Play/Pause: Tamanho w-6 h-6 em controles principais, w-12 h-12 em overlays
- Navigation icons: w-5 h-5
- Actions (like, add): w-5 h-5

### F. Interactions & Animations
**Minimal & Purposeful**:
- Hover states: transition-colors duration-200
- Card hover: transition-transform duration-300 ease-out
- Player controls: Sem animações elaboradas, apenas feedback visual direto
- Loading states: Skeleton screens com pulse suave
- Page transitions: Fade simples, sem slides elaborados

## Images
**Capas de Álbuns/Playlists**: Elemento visual central - sempre usar imagens reais das thumbnails do YouTube
- Placeholder: Gradiente com ícone de música quando sem imagem
- Loading: Skeleton com aspect-ratio preservado
- Quality: Preferir resoluções médias para performance (480x480)

**Profile Pictures**: Avatar circular, 40px padrão, 80px em perfil, 32px em player

**No Large Hero Images**: O app não usa hero sections tradicionais com imagens de fundo. O conteúdo (playlists, músicas) é o visual principal.

## Visual Identity Differentiators
- **Cor dinâmica**: Sistema que extrai cores dominantes das capas e aplica em gradientes sutis em backgrounds de detalhes
- **Densidade controlada**: Mais espaçoso que Spotify, mais compacto que Apple Music
- **Typography mix**: Outfit para display cria personalidade, Inter mantém legibilidade