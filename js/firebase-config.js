
// ===== CONFIGURAÇÃO FIREBASE - Otimizado =====
// Preencha com os dados do seu app web Firebase (Config SDK).
// Em seguida, liste os UIDs que poderão publicar/editar posts.

// Configuração do Firebase
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyBFnEcrrEK2Q-sTwsytZbjBygdac94ElF4",
  authDomain: "nutri-life-436ae.firebaseapp.com",
  projectId: "nutri-life-436ae",
  storageBucket: "nutri-life-436ae.firebasestorage.app",
  messagingSenderId: "1041931544112",
  appId: "1:1041931544112:web:35a86a7b2a2a1d68b52ff5",
  measurementId: "G-1KDB8JDS5V"
};

// UIDs de administradores (encontre no painel de Authentication após criar os usuários)
window.NUTRILIFE_ADMIN_UIDS = [
  "Pkfvcnfw8aWtdH6QAdcDQQVkF7i2"
];

// Configurações adicionais do app
window.NUTRILIFE_CONFIG = {
  // Configurações do blog
  blog: {
    maxExcerptLength: 320,
    defaultCategory: 'Sem categoria',
    categories: [
      'Dieta Low Carb',
      'Vegetariana',
      'Vegana',
      'Esportiva',
      'Hábitos Saudáveis',
      'Receitas',
      'Dicas de Nutrição'
    ]
  },
  
  // Configurações de performance
  performance: {
    debounceDelay: 300,
    maxPostsPerPage: 50
  }
};
