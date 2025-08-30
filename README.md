# NutriLife - Sua Jornada para uma Vida Saudável

## 📋 Sobre o Projeto

O NutriLife é uma plataforma web completa desenvolvida para auxiliar usuários em sua jornada rumo a uma vida mais saudável. O projeto oferece ferramentas práticas e interativas baseadas em fontes confiáveis da área de nutrição e saúde.

## ✨ Funcionalidades Principais

### 🏠 **Página Inicial**
- Apresentação da plataforma
- Blog com conteúdo sobre nutrição
- Sistema de filtros por categoria
- Busca e ordenação de posts
- Formulário de contato

### 📊 **Calculadora de IMC**
- Cálculo automático do Índice de Massa Corporal
- Classificação do resultado
- Recomendações personalizadas
- Interface responsiva e intuitiva

### 🔥 **Calculadora de Calorias** *(Em desenvolvimento)*
- Cálculo de necessidades calóricas diárias
- Baseado em idade, peso, altura e nível de atividade
- Recomendações nutricionais

### 🍳 **Banco de Receitas** *(Em desenvolvimento)*
- Receitas saudáveis e nutritivas
- Filtros por tipo de dieta
- Informações nutricionais

### 📝 **Diário Alimentar** *(Em desenvolvimento)*
- Registro de refeições diárias
- Acompanhamento de progresso
- Relatórios e estatísticas

## 🛠️ Tecnologias Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Firebase (Firestore, Authentication)
- **Estilização**: CSS Grid, Flexbox
- **Ícones**: FontAwesome
- **Hospedagem**: Firebase Hosting

## 🚀 Otimizações Implementadas

### Performance
- ✅ Remoção de arquivos duplicados e desnecessários
- ✅ Otimização de código JavaScript com boas práticas
- ✅ CSS otimizado e consolidado
- ✅ Estruturas de dados eficientes
- ✅ Event listeners otimizados

### Código
- ✅ Funções modulares e reutilizáveis
- ✅ Baixo acoplamento e alta coesão
- ✅ Padrões de estilo consistentes
- ✅ Tratamento de erros robusto
- ✅ Validações de formulário aprimoradas

### Acessibilidade
- ✅ Atributos ARIA implementados
- ✅ Navegação por teclado
- ✅ Labels e descrições adequadas
- ✅ Contraste de cores otimizado

### SEO
- ✅ Meta tags otimizadas
- ✅ Estrutura semântica HTML
- ✅ URLs amigáveis
- ✅ Títulos e descrições adequados

## 📁 Estrutura do Projeto

```
NutriLife/
├── index.html              # Página principal
├── imc.html               # Calculadora de IMC
├── cal.html               # Calculadora de Calorias
├── receitas.html          # Banco de Receitas
├── diario.html            # Diário Alimentar
├── css/
│   ├── links/             # Estilos de links
│   ├── pages/             # Estilos específicos das páginas
│   ├── global/            # Estilos globais
│   └── fonts/             # Fontes customizadas
├── js/
│   ├── firebase-config.js # Configuração Firebase
│   ├── blog_firebase_private_slug.js # Sistema de blog
│   ├── imc.js             # Lógica da calculadora IMC
│   ├── navigation.js      # Navegação automática
│   └── contact.js         # Formulário de contato
├── images/                # Imagens e assets
└── README.md              # Documentação
```

## 🔧 Configuração e Instalação

### Pré-requisitos
- Navegador web moderno
- Conta no Firebase (para funcionalidades do blog)

### Configuração do Firebase
1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/)
2. Ative o Authentication e Firestore
3. Configure as regras de segurança do Firestore
4. Atualize `js/firebase-config.js` com suas credenciais
5. Adicione os UIDs de administradores no array `NUTRILIFE_ADMIN_UIDS`

### Executando Localmente
1. Clone o repositório
2. Abra `index.html` em um servidor local
3. Configure o Firebase conforme instruções acima

## 📝 Blog - Funcionalidades

### Para Usuários
- Visualização de posts
- Filtros por categoria
- Busca por texto
- Ordenação (mais recentes, mais antigas, título)
- Compartilhamento de links

### Para Administradores
- Login com Firebase Authentication
- Criação de posts
- Edição de posts existentes
- Exclusão de posts
- Fixar/desafixar posts
- Categorização personalizada

## 🎨 Design e UX

- **Design Responsivo**: Adaptável a todos os dispositivos
- **Interface Intuitiva**: Navegação clara e objetiva
- **Feedback Visual**: Estados de loading e confirmações
- **Acessibilidade**: Compatível com leitores de tela
- **Performance**: Carregamento rápido e fluido

## 🔒 Segurança

- Autenticação via Firebase
- Validação de dados no frontend e backend
- Sanitização de conteúdo HTML
- Regras de segurança do Firestore
- Controle de acesso por UID

## 📈 Melhorias Futuras

- [ ] Implementar calculadora de calorias
- [ ] Desenvolver banco de receitas
- [ ] Criar diário alimentar
- [ ] Adicionar sistema de comentários
- [ ] Implementar notificações push
- [ ] Adicionar modo escuro
- [ ] Criar aplicativo mobile

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Contato

- **Email**: contato@nutrilife.com
- **Horário**: Seg-Sex: 9h às 18h
- **Suporte**: Resposta em até 24h

---

**NutriLife** - Transformando vidas através da nutrição consciente! 🌱 
