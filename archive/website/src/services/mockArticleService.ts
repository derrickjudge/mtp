/**
 * Mock Article Service
 * Provides mock article data for development and testing
 */

export interface Article {
  id: number;
  title: string;
  slug: string;
  content: string;
  summary: string;
  featured_image: string;
  author_id: number;
  author_name: string;
  published: boolean;
  published_at: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  category: {
    id: number;
    name: string;
  };
}

export interface NewArticle {
  title: string;
  content: string;
  summary?: string;
  featured_image?: string;
  author_id: number;
  published?: boolean;
  tags?: string[];
  category_id: number;
}

export interface ArticleFilter {
  category_id?: number;
  author_id?: number;
  published?: boolean;
  tag?: string;
  search?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Sample mock articles
const MOCK_ARTICLES: Article[] = [
  {
    id: 1,
    title: "The Beauty of Street Photography",
    slug: "beauty-street-photography",
    content: `<p>Street photography is a genre of photography that captures everyday life in public places. It's an art form that requires patience, quick reflexes, and an eye for the extraordinary in the mundane.</p>
    <p>The best street photographers have the ability to tell a compelling story with a single frame, capturing moments of humanity that might otherwise go unnoticed.</p>
    <h2>Tips for Aspiring Street Photographers</h2>
    <ul>
      <li>Be observant and patient</li>
      <li>Use a small, unobtrusive camera</li>
      <li>Understand light and composition</li>
      <li>Respect your subjects' privacy</li>
      <li>Shoot frequently to develop your eye</li>
    </ul>
    <p>Remember, the goal isn't just to document what you see, but to create images that evoke emotion and tell stories about the human condition.</p>`,
    summary: "Exploring the art and craft of capturing life on the streets through photography.",
    featured_image: "https://picsum.photos/id/1005/1200/800",
    author_id: 1,
    author_name: "admin",
    published: true,
    published_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    tags: ["photography", "street", "urban", "tips"],
    category: {
      id: 2,
      name: "Street"
    }
  },
  {
    id: 2,
    title: "Understanding Light in Portrait Photography",
    slug: "understanding-light-portrait-photography",
    content: `<p>Light is the essence of photography, and nowhere is this more apparent than in portrait photography.</p>
    <p>The way light interacts with your subject's features can make or break a portrait. Understanding how to work with different lighting conditions is essential for creating compelling portraits.</p>
    <h2>Types of Lighting for Portraits</h2>
    <ul>
      <li><strong>Split lighting:</strong> Creates a dramatic effect by illuminating half the face</li>
      <li><strong>Rembrandt lighting:</strong> Creates a triangle of light on the cheek</li>
      <li><strong>Butterfly lighting:</strong> Creates a butterfly-shaped shadow under the nose</li>
      <li><strong>Loop lighting:</strong> Creates a small shadow of the nose on the cheek</li>
    </ul>
    <p>Each lighting pattern creates a different mood and emphasizes different facial features. The key is to match the lighting to your subject and the story you want to tell.</p>`,
    summary: "A guide to understanding and utilizing different lighting techniques to create stunning portrait photographs.",
    featured_image: "https://picsum.photos/id/64/1200/800",
    author_id: 3,
    author_name: "editor",
    published: true,
    published_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    tags: ["photography", "portrait", "lighting", "techniques"],
    category: {
      id: 3,
      name: "Portrait"
    }
  },
  {
    id: 3,
    title: "The Role of Photography in Conservation",
    slug: "role-photography-conservation",
    content: `<p>Photography has long been a powerful tool for conservation efforts around the world.</p>
    <p>From the iconic landscapes captured by Ansel Adams that helped establish national parks to the disturbing images of environmental destruction that spur policy change, photographs have the power to move people to action.</p>
    <h2>How Photographers Are Making a Difference</h2>
    <p>Today's conservation photographers work at the intersection of environmental science, storytelling, and activism. Their images serve as visual documents of both the beauty of the natural world and the threats it faces.</p>
    <p>Organizations like the International League of Conservation Photographers (iLCP) connect photographers with scientists and conservation organizations to create visual stories that can influence public opinion and policy.</p>
    <h2>Key Conservation Photography Projects</h2>
    <ul>
      <li>Documenting endangered species in their natural habitats</li>
      <li>Revealing the impacts of climate change</li>
      <li>Showing the consequences of habitat destruction</li>
      <li>Highlighting successful conservation efforts</li>
    </ul>
    <p>Through these visual stories, photographers help bridge the gap between scientific understanding and public awareness, making complex environmental issues accessible and emotionally resonant.</p>`,
    summary: "Examining how photographers are contributing to environmental conservation through their work.",
    featured_image: "https://picsum.photos/id/15/1200/800",
    author_id: 1,
    author_name: "admin",
    published: true,
    published_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 35 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 28 * 86400000).toISOString(),
    tags: ["photography", "nature", "conservation", "environment"],
    category: {
      id: 1,
      name: "Nature"
    }
  },
  {
    id: 4,
    title: "Architectural Photography: Finding Beauty in Structures",
    slug: "architectural-photography-beauty-structures",
    content: `<p>Architectural photography is the art of capturing buildings and structures in a way that is both aesthetically pleasing and true to their form and purpose.</p>
    <h2>The Technical Aspects</h2>
    <p>Architectural photography often involves specialized equipment:</p>
    <ul>
      <li>Tilt-shift lenses to correct perspective distortion</li>
      <li>Tripods for long exposures in low light</li>
      <li>Graduated filters to balance bright skies and darker buildings</li>
    </ul>
    <h2>Composition Considerations</h2>
    <p>When photographing architecture, pay attention to:</p>
    <ul>
      <li>Leading lines that guide the viewer's eye</li>
      <li>Symmetry and patterns in the structure</li>
      <li>The interplay of light and shadow</li>
      <li>The relationship between the building and its environment</li>
    </ul>
    <p>The best architectural photographs reveal the vision of the architect while also expressing the photographer's unique perspective.</p>`,
    summary: "A look at the techniques and considerations for capturing stunning architectural photographs.",
    featured_image: "https://picsum.photos/id/129/1200/800",
    author_id: 2,
    author_name: "user",
    published: true,
    published_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 18 * 86400000).toISOString(),
    tags: ["photography", "architecture", "urban", "techniques"],
    category: {
      id: 4,
      name: "Architecture"
    }
  },
  {
    id: 5,
    title: "The Ethics of Documentary Photography",
    slug: "ethics-documentary-photography",
    content: `<p>Documentary photography aims to create a truthful and objective record of events, but it is never completely free from ethical considerations.</p>
    <h2>Key Ethical Challenges</h2>
    <ul>
      <li><strong>Consent:</strong> When and how should photographers obtain permission from their subjects?</li>
      <li><strong>Representation:</strong> How can photographers avoid perpetuating stereotypes or misrepresenting communities?</li>
      <li><strong>Context:</strong> How can images be presented with enough context to avoid misinterpretation?</li>
      <li><strong>Harm:</strong> What is the photographer's responsibility when documenting suffering?</li>
    </ul>
    <p>These questions don't have simple answers, but thoughtful photographers consider them carefully in their work.</p>
    <h2>Guidelines for Ethical Documentary Photography</h2>
    <ul>
      <li>Respect the dignity and rights of subjects</li>
      <li>Provide accurate context for images</li>
      <li>Consider the potential impact of publication</li>
      <li>Be transparent about methods and any manipulation</li>
    </ul>
    <p>By approaching documentary photography ethically, photographers can maintain the medium's power as a tool for truth-telling while respecting the rights and dignity of those they photograph.</p>`,
    summary: "Exploring the complex ethical considerations involved in documentary photography.",
    featured_image: "https://picsum.photos/id/160/1200/800",
    author_id: 3,
    author_name: "editor",
    published: false,
    published_at: "",
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    tags: ["photography", "documentary", "ethics", "journalism"],
    category: {
      id: 2,
      name: "Street"
    }
  }
];

// Sample categories (reusing the same as photos for consistency)
const MOCK_CATEGORIES = [
  { id: 1, name: 'Nature', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 2, name: 'Street', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 3, name: 'Portrait', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 4, name: 'Architecture', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

// Keep track of the next available ID
let nextId = Math.max(...MOCK_ARTICLES.map(article => article.id)) + 1;

/**
 * Get articles with optional filtering and pagination
 */
export async function getArticles(
  page: number = 1,
  limit: number = 10,
  filter: ArticleFilter = {}
): Promise<ApiResponse<PaginatedResponse<Article>>> {
  console.log(`[MOCK-ARTICLES] Fetching articles (page ${page}, limit ${limit})`, filter);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  let filteredArticles = [...MOCK_ARTICLES];
  
  // Apply filters
  if (filter.category_id) {
    filteredArticles = filteredArticles.filter(article => article.category.id === filter.category_id);
  }
  
  if (filter.author_id) {
    filteredArticles = filteredArticles.filter(article => article.author_id === filter.author_id);
  }
  
  if (filter.published !== undefined) {
    filteredArticles = filteredArticles.filter(article => article.published === filter.published);
  }
  
  if (filter.tag) {
    filteredArticles = filteredArticles.filter(article => article.tags.includes(filter.tag));
  }
  
  if (filter.search) {
    const searchTerm = filter.search.toLowerCase();
    filteredArticles = filteredArticles.filter(article => 
      article.title.toLowerCase().includes(searchTerm) || 
      article.content.toLowerCase().includes(searchTerm) ||
      article.summary.toLowerCase().includes(searchTerm) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }
  
  // Sort by published date (newest first)
  filteredArticles.sort((a, b) => {
    if (!a.published_at && !b.published_at) return 0;
    if (!a.published_at) return 1;
    if (!b.published_at) return -1;
    return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
  });
  
  // Calculate pagination
  const total = filteredArticles.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedArticles = filteredArticles.slice(startIndex, endIndex);
  
  return {
    success: true,
    data: {
      items: paginatedArticles,
      total,
      page,
      limit,
      totalPages
    }
  };
}

/**
 * Get published articles (for public view)
 */
export async function getPublishedArticles(
  page: number = 1,
  limit: number = 10,
  filter: Omit<ArticleFilter, 'published'> = {}
): Promise<ApiResponse<PaginatedResponse<Article>>> {
  return getArticles(page, limit, { ...filter, published: true });
}

/**
 * Get featured articles (for homepage)
 */
export async function getFeaturedArticles(limit: number = 3): Promise<ApiResponse<Article[]>> {
  console.log(`[MOCK-ARTICLES] Fetching featured articles (limit ${limit})`);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Get only published articles, sorted by published date
  const publishedArticles = MOCK_ARTICLES
    .filter(article => article.published)
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
  
  return {
    success: true,
    data: publishedArticles.slice(0, limit)
  };
}

/**
 * Get article by ID
 */
export async function getArticleById(id: number): Promise<ApiResponse<Article>> {
  console.log(`[MOCK-ARTICLES] Fetching article by ID: ${id}`);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const article = MOCK_ARTICLES.find(a => a.id === id);
  
  if (!article) {
    return {
      success: false,
      error: 'Article not found'
    };
  }
  
  return {
    success: true,
    data: { ...article }
  };
}

/**
 * Get article by slug
 */
export async function getArticleBySlug(slug: string): Promise<ApiResponse<Article>> {
  console.log(`[MOCK-ARTICLES] Fetching article by slug: ${slug}`);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const article = MOCK_ARTICLES.find(a => a.slug === slug);
  
  if (!article) {
    return {
      success: false,
      error: 'Article not found'
    };
  }
  
  return {
    success: true,
    data: { ...article }
  };
}

/**
 * Create a new article
 */
export async function createArticle(newArticle: NewArticle): Promise<ApiResponse<Article>> {
  console.log('[MOCK-ARTICLES] Creating article:', newArticle.title);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Get category
  const category = MOCK_CATEGORIES.find(c => c.id === newArticle.category_id);
  if (!category) {
    return {
      success: false,
      error: 'Invalid category'
    };
  }
  
  // Generate slug
  const slug = generateSlug(newArticle.title);
  
  // Check if slug already exists
  if (MOCK_ARTICLES.some(a => a.slug === slug)) {
    return {
      success: false,
      error: 'An article with a similar title already exists'
    };
  }
  
  const now = new Date().toISOString();
  
  const article: Article = {
    id: nextId++,
    title: newArticle.title,
    slug,
    content: newArticle.content,
    summary: newArticle.summary || newArticle.content.substring(0, 150).replace(/<\/?[^>]+(>|$)/g, "") + "...",
    featured_image: newArticle.featured_image || `https://picsum.photos/id/${Math.floor(Math.random() * 100)}/1200/800`,
    author_id: newArticle.author_id,
    author_name: MOCK_ARTICLES.find(a => a.author_id === newArticle.author_id)?.author_name || "Unknown",
    published: newArticle.published || false,
    published_at: newArticle.published ? now : "",
    created_at: now,
    updated_at: now,
    tags: newArticle.tags || [],
    category: {
      id: category.id,
      name: category.name
    }
  };
  
  // Add to mock database
  MOCK_ARTICLES.push(article);
  
  return {
    success: true,
    data: { ...article }
  };
}

/**
 * Update an article
 */
export async function updateArticle(id: number, articleData: Partial<Article>): Promise<ApiResponse<Article>> {
  console.log(`[MOCK-ARTICLES] Updating article with ID: ${id}`);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const articleIndex = MOCK_ARTICLES.findIndex(a => a.id === id);
  
  if (articleIndex === -1) {
    return {
      success: false,
      error: 'Article not found'
    };
  }
  
  const currentArticle = MOCK_ARTICLES[articleIndex];
  
  // Check if title changed and we need a new slug
  let slug = currentArticle.slug;
  if (articleData.title && articleData.title !== currentArticle.title) {
    slug = generateSlug(articleData.title);
    
    // Check if new slug already exists (excluding current article)
    if (MOCK_ARTICLES.some(a => a.slug === slug && a.id !== id)) {
      return {
        success: false,
        error: 'An article with a similar title already exists'
      };
    }
  }
  
  // Check if category changed
  let category = currentArticle.category;
  if (articleData.category && typeof articleData.category === 'object') {
    category = articleData.category;
  } else if (articleData.category_id) {
    const newCategory = MOCK_CATEGORIES.find(c => c.id === articleData.category_id);
    if (!newCategory) {
      return {
        success: false,
        error: 'Invalid category'
      };
    }
    category = {
      id: newCategory.id,
      name: newCategory.name
    };
  }
  
  // Handle publishing
  let publishedAt = currentArticle.published_at;
  if (articleData.published !== undefined && articleData.published !== currentArticle.published) {
    if (articleData.published) {
      publishedAt = new Date().toISOString();
    } else {
      publishedAt = "";
    }
  }
  
  // Update the article
  const updatedArticle = {
    ...currentArticle,
    ...articleData,
    slug,
    category,
    published_at: publishedAt,
    updated_at: new Date().toISOString()
  };
  
  MOCK_ARTICLES[articleIndex] = updatedArticle;
  
  return {
    success: true,
    data: { ...updatedArticle }
  };
}

/**
 * Delete an article
 */
export async function deleteArticle(id: number): Promise<ApiResponse<null>> {
  console.log(`[MOCK-ARTICLES] Deleting article with ID: ${id}`);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const articleIndex = MOCK_ARTICLES.findIndex(a => a.id === id);
  
  if (articleIndex === -1) {
    return {
      success: false,
      error: 'Article not found'
    };
  }
  
  // Remove the article
  MOCK_ARTICLES.splice(articleIndex, 1);
  
  return {
    success: true,
    data: null
  };
}

/**
 * Get article categories
 */
export async function getCategories(): Promise<ApiResponse<typeof MOCK_CATEGORIES>> {
  console.log('[MOCK-ARTICLES] Fetching categories');
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return {
    success: true,
    data: [...MOCK_CATEGORIES]
  };
}
