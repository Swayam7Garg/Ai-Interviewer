import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ParticleBackground } from '../components/ParticleBackground';
import { api } from '../utils/api';
import type { SessionDetail } from '../utils/api';
import { useTheme } from '../context/ThemeContext';
const ROLE_DOMAINS: Record<string, string[]> = {
  'Senior Frontend Engineer': ['React & Component Architecture', 'State Management', 'Browser Rendering & Performance', 'CSS & Animations', 'Testing & Tooling'],
  'Backend SDE': ['System Design & Scalability', 'Database Design', 'API Design', 'Caching Strategies', 'Concurrency & Microservices'],
  'Full Stack SDE': ['End-to-End Architecture', 'REST API Design', 'Database Selection', 'Authentication Flows', 'Deployment & DevOps'],
  'ML Engineer': ['Model Selection & Evaluation', 'Feature Engineering', 'Training Pipeline Design', 'MLOps & Deployment', 'NLP & Deep Learning'],
  'Data Scientist': ['Statistical Foundations', 'Exploratory Data Analysis', 'A/B Testing', 'Python Data Stack', 'Business Communication'],
  'Java Developer': ['JVM Internals & GC', 'Spring Boot & Security', 'Concurrency', 'Design Patterns', 'JPA & Hibernate'],
  'Mobile Engineer': ['React Native / Flutter', 'App Performance', 'State Management Mobile', 'App Store Deployment', 'Offline-first Patterns'],
  'Product Manager': ['Product Strategy', 'User Research', 'Metrics & OKRs', 'Stakeholder Management', 'A/B Testing & Data'],
};

const DOMAIN_DETAILS: Record<string, { icon: string; desc: string; actions: string[] }> = {
  'React & Component Architecture': {
    icon: 'widgets',
    desc: 'Understanding components, hooks, lifecycle, performance, and custom hook design.',
    actions: [
      'Study React rendering cycles and reconciliation algorithm.',
      'Refactor components to use design patterns like Compound Components or Render Props.',
      'Read the official React documentation on Hooks state preservation and synchronization.'
    ]
  },
  'State Management': {
    icon: 'account_tree',
    desc: 'Managing state flows, global vs local state, Redux/Zustand, and state normalization.',
    actions: [
      'Build a small app using Zustand or Redux Toolkit to practice state normalization.',
      'Understand the trade-offs of Context API vs external store libraries.',
      'Review React state patterns, lifting state up, and local-first UI updates.'
    ]
  },
  'Browser Rendering & Performance': {
    icon: 'speed',
    desc: 'Critical rendering path, DOM manipulation, reflows/repaints, web vitals, and bundle size.',
    actions: [
      'Learn to use Chrome DevTools Performance panel to profile frame rates and CPU usage.',
      'Study Web Vitals (LCP, FID/INP, CLS) and how to optimize them.',
      'Implement code splitting (React.lazy, dynamic imports) to optimize initial load time.'
    ]
  },
  'CSS & Animations': {
    icon: 'palette',
    desc: 'Layout systems (Flexbox, Grid), styling solutions, transitions, hardware acceleration.',
    actions: [
      'Master CSS Grid layouts and flex alignments under responsive conditions.',
      'Learn about CSS animation performance (transform/opacity) and hardware acceleration.',
      'Practice building responsive micro-interactions using vanilla CSS and Framer Motion.'
    ]
  },
  'Testing & Tooling': {
    icon: 'build',
    desc: 'Unit, integration, and E2E testing. Bundlers (Vite, Webpack) and CI/CD pipelines.',
    actions: [
      'Write integration tests using Jest / Vitest and React Testing Library.',
      'Learn E2E testing with Cypress or Playwright.',
      'Understand bundler configuration (Vite config, asset hashing, treeshaking).'
    ]
  },
  'System Design & Scalability': {
    icon: 'lan',
    desc: 'Designing highly available systems, horizontal scaling, load balancers, rate limiting.',
    actions: [
      'Study System Design Primer on GitHub for scalable architectural concepts.',
      'Understand the CAP theorem and trade-offs between SQL vs NoSQL.',
      'Practice designing a URL shortener or a chat application from scratch.'
    ]
  },
  'Database Design': {
    icon: 'database',
    desc: 'Normalization, indexing, transaction isolation levels, query optimization.',
    actions: [
      'Analyze query execution plans (EXPLAIN ANALYZE) to locate slow-performing joins.',
      'Read about database indexing strategies (B-Trees, Hash indexes).',
      'Understand transaction isolation levels (Read Committed, Serializable) and concurrency issues.'
    ]
  },
  'API Design': {
    icon: 'api',
    desc: 'RESTful practices, GraphQL, gRPC, versioning, error handling, status codes.',
    actions: [
      'Review REST API design best practices and standard status code usage.',
      'Implement structured error formats and standard validation rules (JSON Schema).',
      'Compare GraphQL and gRPC protocols for internal vs external communications.'
    ]
  },
  'Caching Strategies': {
    icon: 'memory',
    desc: 'Redis, Memcached, cache eviction policies (LRU, LFU), cache-aside, write-through.',
    actions: [
      'Study Redis data structures (hashes, sorted sets) and cache eviction policies.',
      'Implement cache-aside pattern with TTLs to solve stale data issues.',
      'Understand cache stampede (thundering herd) and how to mitigate it with locking.'
    ]
  },
  'Concurrency & Microservices': {
    icon: 'alt_route',
    desc: 'Asynchronous processing, message queues, saga patterns, event sourcing.',
    actions: [
      'Learn about message brokers like RabbitMQ or Apache Kafka.',
      'Study the Saga Pattern and outbox pattern for distributed transactions.',
      'Understand thread pools, event loops, and concurrency paradigms in your language of choice.'
    ]
  },
  'End-to-End Architecture': {
    icon: 'view_quilt',
    desc: 'Connecting frontend to backend, MVC pattern, data serialization, state hydration.',
    actions: [
      'Design an end-to-end user request pipeline from DNS lookup to DB response.',
      'Review Server-Side Rendering (SSR) vs Single Page Application (SPA) architectures.',
      'Implement cross-origin resource sharing (CORS) rules and secure headers.'
    ]
  },
  'REST API Design': {
    icon: 'settings_ethernet',
    desc: 'Designing clean endpoints, serialization formats, validation, query filtering.',
    actions: [
      'Standardize API payloads using modern specs like JSON:API or OpenAPI.',
      'Implement sorting, filtering, and pagination on database queries.',
      'Practice writing request validation middleware in your backend framework.'
    ]
  },
  'Database Selection': {
    icon: 'storage',
    desc: 'Choosing SQL vs Document store vs Key-Value store, schema design.',
    actions: [
      'Create a matrix comparing PostgreSQL, MongoDB, Redis, and Cassandra for specific use cases.',
      'Learn how to design schemas for high write throughput vs high read throughput.',
      'Understand database replication, sharding, and write/read separation.'
    ]
  },
  'Authentication Flows': {
    icon: 'fingerprint',
    desc: 'OAuth2, JWT, sessions, cookies, CSRF/XSS mitigation, role-based access control (RBAC).',
    actions: [
      'Implement stateless authentication using JWT with secure, HTTP-only cookies.',
      'Study OAuth 2.0 Authorization Code flow with PKCE for single-page apps.',
      'Learn how to prevent XSS, CSRF, and SQL Injection attacks in web applications.'
    ]
  },
  'Deployment & DevOps': {
    icon: 'cloud_sync',
    desc: 'Docker containers, CI/CD pipelines, SSL certificates, cloud services (AWS/GCP/Vercel).',
    actions: [
      'Write a Dockerfile and docker-compose configurations for multi-container local setups.',
      'Configure a GitHub Actions workflow to build, test, and deploy a web application.',
      'Study cloud hosting basics (EC2, S3, RDS) and serverless deployment models.'
    ]
  },
  'Model Selection & Evaluation': {
    icon: 'analytics',
    desc: 'Choosing the right algorithm, bias-variance tradeoff, ROC/AUC, F1-score, cross-validation.',
    actions: [
      'Practice tuning hyperparameters using Grid Search or Bayesian Optimization.',
      'Understand evaluation metrics for classification, regression, and ranking tasks.',
      'Learn to detect and mitigate dataset imbalance issues using SMOTE or custom loss weights.'
    ]
  },
  'Feature Engineering': {
    icon: 'construction',
    desc: 'Imputation, scaling, encoding categorical variables, dimensionality reduction.',
    actions: [
      'Implement standard preprocessing pipelines using Scikit-Learn or Pandas.',
      'Study dimensionality reduction techniques like PCA, t-SNE, and UMAP.',
      'Create meaningful domain-specific features from raw timestamps and text fields.'
    ]
  },
  'Training Pipeline Design': {
    icon: 'reorder',
    desc: 'Data loaders, reproducibility, distributed training, checkpointing.',
    actions: [
      'Write modular, reproducible PyTorch or TensorFlow training scripts with configuration seeds.',
      'Use data loaders with parallel worker threads to eliminate GPU starvation.',
      'Implement model checkpointing and early stopping based on validation loss.'
    ]
  },
  'MLOps & Deployment': {
    icon: 'smart_toy',
    desc: 'Model registry (MLflow), containerization, model serving, inference optimization.',
    actions: [
      'Serve a machine learning model using FastAPI and containerize it with Docker.',
      'Learn about model optimization techniques like quantization and pruning.',
      'Track experiments and register models using MLflow or Weights & Biases.'
    ]
  },
  'NLP & Deep Learning': {
    icon: 'psychology',
    desc: 'Embeddings, transformers, attention mechanisms, fine-tuning large language models.',
    actions: [
      'Fine-tune an LLM or BERT model using Hugging Face Transformers library.',
      'Study Transformer architecture, self-attention, and positional encoding mechanisms.',
      'Implement semantic search or RAG pipeline using vector databases like Chroma or Pinecone.'
    ]
  },
  'Statistical Foundations': {
    icon: 'calculate',
    desc: 'Probability distributions, hypothesis testing, central limit theorem, p-values.',
    actions: [
      'Review foundational statistics including t-tests, ANOVA, and chi-squared tests.',
      'Understand the power of a statistical test and Type I vs Type II errors.',
      'Practice calculating confidence intervals for different distribution shapes.'
    ]
  },
  'Exploratory Data Analysis': {
    icon: 'query_stats',
    desc: 'Data profiling, anomaly detection, correlation analysis, data visualization.',
    actions: [
      'Perform detailed data profiling using Seaborn or Plotly in Jupyter Notebooks.',
      'Implement outlier detection using Isolation Forests or IQR method.',
      'Analyze correlation matrices and check for multicollinearity in feature sets.'
    ]
  },
  'A/B Testing': {
    icon: 'compare_arrows',
    desc: 'Experiment design, sample size calculation, power analysis, novelty effects.',
    actions: [
      'Calculate minimum detectable effect (MDE) and sample size using G*Power or Python.',
      'Learn how to handle multiple testing corrections (Bonferroni, FDR).',
      'Study user-split mechanisms, hashing user IDs, and tracking novelty/learning effects.'
    ]
  },
  'Python Data Stack': {
    icon: 'terminal',
    desc: 'Pandas efficiency, NumPy vectorization, data manipulation and aggregation.',
    actions: [
      'Optimize Pandas operations by replacing loops with vectorized NumPy array computations.',
      'Learn to use Polars or Dask for processing larger-than-memory datasets.',
      'Practice complex data aggregation and windowing queries in SQL and Pandas.'
    ]
  },
  'Business Communication': {
    icon: 'forum',
    desc: 'Translating model outputs to business value, slide decks, executive summaries.',
    actions: [
      'Practice creating data storytelling decks that highlight ROI and business impact.',
      'Refine reports to lead with key takeaways rather than technical details.',
      'Learn to explain complex machine learning algorithms using simple analogies.'
    ]
  },
  'JVM Internals & GC': {
    icon: 'developer_board',
    desc: 'Memory model (Heap vs Stack), Garbage Collectors (G1, ZGC), class loading.',
    actions: [
      'Study JVM memory structure, Eden/Survivor spaces, and garbage collection phases.',
      'Use tools like VisualVM or JProfiler to analyze heap dumps and memory leaks.',
      'Understand JIT compilation, profiling flags, and class loader hierarchy.'
    ]
  },
  'Spring Boot & Security': {
    icon: 'shield_lock',
    desc: 'Spring MVC, dependency injection, Spring Security, filter chains, OAuth2.',
    actions: [
      'Understand Spring Bean lifecycle, scopes (singleton vs prototype), and proxies.',
      'Configure custom Spring Security filter chains for JWT authentication.',
      'Read about Spring Boot auto-configuration mechanism and custom starter creation.'
    ]
  },
  'Concurrency': {
    icon: 'sync_alt',
    desc: 'Java Memory Model, synchronized, volatile, Lock API, ForkJoinPool, Virtual Threads.',
    actions: [
      'Practice writing thread-safe code using Java Concurrent Collections (e.g. ConcurrentHashMap).',
      'Understand the difference between Platform Threads and Virtual Threads in Java 21+.',
      'Review thread pool configurations (ThreadPoolExecutor) and queue rejection policies.'
    ]
  },
  'Design Patterns': {
    icon: 'pattern',
    desc: 'Creational, structural, and behavioral patterns applied in Java frameworks.',
    actions: [
      'Study classic GoF design patterns (Singleton, Factory, Strategy, Observer) in Java.',
      'Analyze how Spring uses Template Method and Proxy design patterns internally.',
      'Refactor repetitive logic using behavioral patterns like State or Strategy.'
    ]
  },
  'JPA & Hibernate': {
    icon: 'link',
    desc: 'ORM concepts, N+1 query problem, caching levels, transactional management.',
    actions: [
      'Identify and fix the N+1 query problem using JOIN FETCH or Entity Graphs.',
      'Understand Hibernate first-level and second-level caching mechanisms.',
      'Study transactional propagation behaviors (e.g., REQUIRED, REQUIRES_NEW).'
    ]
  },
  'React Native / Flutter': {
    icon: 'smartphone',
    desc: 'Cross-platform architectures, bridge/communication channels, native modules.',
    actions: [
      'Learn about React Native New Architecture (Fabric, TurboModules) or Flutter rendering engine.',
      'Write custom native bridges to access platform-specific hardware APIs.',
      'Implement native UI components and integrate them into cross-platform files.'
    ]
  },
  'App Performance': {
    icon: 'auto_graph',
    desc: 'Render profiling, memory usage, image optimization, startup time.',
    actions: [
      'Use React Native Performance Monitor or Flutter DevTools to profile FPS and CPU usage.',
      'Implement aggressive image caching, resizing, and SVG usage to conserve memory.',
      'Optimize app start time by JS module preloading or bundle configuration.'
    ]
  },
  'State Management Mobile': {
    icon: 'hub',
    desc: 'Managing state locally, syncing offline actions, reactive programming.',
    actions: [
      'Understand mobile-friendly state management options like Redux, MobX, or Provider/Riverpod.',
      'Implement local storage serialization and action queues for offline use.',
      'Study state lifecycle hooks specific to mobile application frames.'
    ]
  },
  'App Store Deployment': {
    icon: 'publish',
    desc: 'App Store / Play Store guidelines, signing certificates, Fastlane automation.',
    actions: [
      'Setup Fastlane for automated beta deployments to TestFlight and Google Play.',
      'Understand iOS provisioning profiles, signing certificates, and App Store Connect rules.',
      'Learn how to safely coordinate app updates with database schema migrations.'
    ]
  },
  'Offline-first Patterns': {
    icon: 'cloud_off',
    desc: 'SQLite, Realm DB, data syncing protocols, optimistic UI updates.',
    actions: [
      'Build an offline-first app utilizing local DBs (WatermelonDB, Realm) and synchronizers.',
      'Implement optimistic UI rendering so user actions feel instantaneous without network delay.',
      'Design conflict resolution rules (last write wins, manual merging) for server sync.'
    ]
  },
  'Product Strategy': {
    icon: 'ads_click',
    desc: 'Market sizing, competitive analysis, product positioning, long-term vision.',
    actions: [
      'Practice writing Product Requirement Documents (PRDs) that clearly outline product visions.',
      'Analyze market opportunities using frameworks like Blue Ocean Strategy or SWOT.',
      'Learn how to define and communicate a 3-year product vision and roadmap.'
    ]
  },
  'User Research': {
    icon: 'group',
    desc: 'Qualitative interviews, user personas, journey mapping, feedback analysis.',
    actions: [
      'Draft interview scripts for target user profiles to uncover core pain points.',
      'Build structured user personas and map detailed product journey paths.',
      'Establish a feedback loop to ingest customer support tickets into product backlogs.'
    ]
  },
  'Metrics & OKRs': {
    icon: 'flag',
    desc: 'Defining North Star metrics, cohort analysis, setting target key results.',
    actions: [
      'Identify North Star metrics for SaaS, e-commerce, and marketplace platforms.',
      'Develop specific, measurable OKRs that align engineering teams with business value.',
      'Set up cohort retention analytics to measure long-term user engagement.'
    ]
  },
  'Stakeholder Management': {
    icon: 'handshake',
    desc: 'Negotiation, conflict resolution, presenting roadmaps, managing expectations.',
    actions: [
      'Learn prioritize backlog requests using RICE framework (Reach, Impact, Confidence, Effort).',
      'Refine communication style to adapt to technical, business, and executive stakeholders.',
      'Practice saying "no" to feature requests by explaining data-driven trade-offs.'
    ]
  },
  'A/B Testing & Data': {
    icon: 'science',
    desc: 'Interpreting dashboards, defining metrics, evaluating significance.',
    actions: [
      'Draft experiment sheets defining test hypothesis, metrics, and duration.',
      'Understand statistical concepts like p-values, sample power, and minimum detectable effect.',
      'Practice interpreting experiment results and planning subsequent iterations.'
    ]
  }
};

const getWeakDomains = (activeSession: any, roleName: string) => {
  // 1. Try local storage first
  const targetId = activeSession.id;
  if (targetId && targetId !== 'mock-session') {
    const stored = localStorage.getItem(`weak_domains_${targetId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.domains) && parsed.domains.length > 0) {
          return parsed.domains;
        }
      } catch (e) {
        console.error(e);
      }
    }
  }

  // 2. Fallback to scanning answers
  const roleDomains = ROLE_DOMAINS[roleName] || [];
  const weakList: string[] = [];
  if (activeSession && Array.isArray(activeSession.answers)) {
    activeSession.answers.forEach((ans: any) => {
      const score = ans.scores?.overallScore;
      if (score !== undefined && score < 60) {
        const qText = (ans.questionText || '').toLowerCase();
        const matchedDomain = roleDomains.find(d => qText.includes(d.split(' ')[0].toLowerCase()));
        if (matchedDomain && !weakList.includes(matchedDomain)) {
          weakList.push(matchedDomain);
        }
      }
    });
  }
  return weakList;
};

export const SummaryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionIdParam = searchParams.get('sessionId');

  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<(SessionDetail & { type: string; answers: any[] }) | null>(null);
  const [aiSummary, setAiSummary] = useState<{ executive_summary: string, action_plan: string[] } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [proctoringData, setProctoringData] = useState<{ enabled: boolean; warnings: string[]; warningCount: number; logs: any[] } | null>(null);
  
  // Checklist dynamic states
  const [checklist, setChecklist] = useState<Array<{ id: number; text: string; done: boolean }>>([]);

  useEffect(() => {
    const fetchSessionDetails = async () => {
      setLoading(true);
      try {
        let targetId = sessionIdParam;
        if (!targetId) {
          // Fallback to fetch dashboard stats and get the latest session ID
          const stats = await api.getDashboardStats();
          if (stats.recentSessions && stats.recentSessions.length > 0) {
            targetId = stats.recentSessions[0].id;
          }
        }

        if (targetId) {
          const pKey = `proctoring_session_${targetId}`;
          const pDataStr = localStorage.getItem(pKey);
          if (pDataStr) {
            try {
              setProctoringData(JSON.parse(pDataStr));
            } catch (e) {
              console.error('Failed to parse proctoring logs', e);
            }
          }
          const detail = await api.getSessionDetail(targetId);
          
          // Map backend questions list to component's expected answers structure
          const answersList = (detail.questions || []).map((q: any) => {
            if (q.answer) {
              return {
                id: q.id,
                questionText: q.questionText,
                responseText: q.answer.answerText,
                scores: q.answer.score,
              };
            }
            return null;
          }).filter(Boolean);

          const mappedDetail = {
            ...detail,
            type: detail.interviewType,
            answers: answersList,
          };

          setSession(mappedDetail);
          if (answersList.length > 0) {
            setExpandedId((answersList[0] as any).id);
            
            try {
              const summaryData = await api.getAiReportSummary(targetId);
              if (summaryData && summaryData.executive_summary) {
                setAiSummary(summaryData);
                const list = (summaryData.action_plan || []).map((text: string, idx: number) => ({
                  id: idx + 1,
                  text,
                  done: false
                }));
                setChecklist(list);
              } else {
                const list = answersList.map((ans: any, idx: number) => ({
                  id: idx + 1,
                  text: ans.scores?.aiFeedbackJson?.topWeakness 
                    ? `Work on: ${ans.scores.aiFeedbackJson.topWeakness}`
                    : `Refine delivery structure for Question ${idx + 1}`,
                  done: false
                }));
                setChecklist(list);
              }
            } catch (err) {
              console.error('Failed to load AI summary', err);
              const list = answersList.map((ans: any, idx: number) => ({
                id: idx + 1,
                text: ans.scores?.aiFeedbackJson?.topWeakness 
                  ? `Work on: ${ans.scores.aiFeedbackJson.topWeakness}`
                  : `Refine delivery structure for Question ${idx + 1}`,
                done: false
              }));
              setChecklist(list);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load session details', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSessionDetails();
  }, [sessionIdParam]);

  const toggleCheck = (id: number) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, done: !item.done } : item));
  };

  const handleDownload = async () => {
    if (!sessionIdParam) return;
    try {
      const res = await api.getSessionReportUrl(sessionIdParam);
      if (res && res.url) {
        window.open(res.url, '_blank');
      } else {
        alert('Your PDF report is still being compiled by the backend worker. Please try again in a few seconds!');
      }
    } catch (err) {
      console.error('Failed to download PDF report', err);
      alert('Failed to obtain PDF download link. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-on-surface flex items-center justify-center flex-col gap-4 font-body">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="font-bold text-sm text-on-surface-variant">Generating Performance Report...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background text-on-surface flex items-center justify-center flex-col gap-4 font-body">
        <p className="font-bold text-lg text-error">Session Report Not Found</p>
        <p className="text-sm text-on-surface-variant">We couldn't retrieve the details for this interview session. Please return to the dashboard.</p>
        <button 
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 bg-primary text-on-primary rounded-lg font-bold text-sm shadow hover:opacity-90 transition-opacity"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  const activeSession = session;

  return (
    <div className={`${isDark ? 'theme-joy-dark bg-background text-on-surface' : 'theme-joy bg-background text-on-surface'} min-h-screen transition-colors duration-300 relative overflow-x-hidden font-body`}>
      <ParticleBackground theme="joy" />

      {/* TopAppBar */}
      <header className="bg-surface border-b border-outline-variant shadow-lg flex justify-between items-center px-6 py-4 w-full top-0 z-50 fixed">
        <div className="flex items-center gap-4">
          <span 
            onClick={() => navigate(api.getCurrentUser() ? '/dashboard' : '/')}
            className="text-2xl font-black text-primary tracking-tighter cursor-pointer"
          >
            TechPrep
          </span>
          <div className="hidden md:flex gap-6 ml-8 text-sm">
            <button 
              onClick={() => navigate('/dashboard')}
              className="text-on-surface-variant font-medium hover:text-primary transition-colors"
            >
              Dashboard
            </button>
            <button 
              onClick={() => navigate('/session')}
              className="text-on-surface-variant font-medium hover:text-primary transition-colors"
            >
              Practice
            </button>
            <button 
              onClick={() => navigate('/history')}
              className="text-on-surface-variant font-medium hover:text-primary transition-colors"
            >
              History
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            className="p-2 rounded-full hover:bg-surface-container transition-colors text-on-surface-variant"
            onClick={toggleTheme}
          >
            <span className="material-symbols-outlined">
              {isDark ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-28 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Score Dial & Executive Summary (1/3 width) */}
          <section className="flex flex-col gap-6">
            <div className="bg-surface rounded-2xl p-8 border border-outline-variant shadow-lg text-center flex flex-col items-center">
              <h2 className="font-bold text-lg text-on-surface-variant mb-6 uppercase tracking-wider">Interview score</h2>
              
              {/* Radial Dial */}
              <div className="relative w-40 h-40 flex items-center justify-center rounded-full p-4 bg-gradient-to-tr from-primary via-secondary to-tertiary">
                <div className="bg-surface w-full h-full rounded-full flex flex-col items-center justify-center shadow-inner">
                  <span className="text-5xl font-black text-on-surface">
                    {activeSession.overallScore || 0}
                  </span>
                  <span className="text-[10px] font-bold text-on-surface-variant -mt-1">SCORE</span>
                </div>
                <div className="absolute top-0 right-0 bg-secondary text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg border-4 border-surface shadow-md">
                  {(activeSession.overallScore || 0) >= 90 ? 'A+' : (activeSession.overallScore || 0) >= 80 ? 'A-' : (activeSession.overallScore || 0) >= 70 ? 'B' : 'C'}
                </div>
              </div>

              <div className="mt-8">
                <h3 className="font-black text-xl text-on-surface">{activeSession.role}</h3>
                <p className="text-xs text-on-surface-variant font-semibold mt-1">
                  Completed {activeSession.endedAt ? new Date(activeSession.endedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
                </p>
              </div>
            </div>

            {/* Executive Summary Card */}
            <div className="bg-surface rounded-2xl p-6 border border-outline-variant shadow-lg flex flex-col gap-4">
              <h3 className="font-bold text-lg text-primary">Executive Summary</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                {aiSummary?.executive_summary || `The candidate practiced a ${activeSession.type} interview session for the role of ${activeSession.role}. Performance shows key strengths in logical articulation with some recommendations for technical details.`}
              </p>
            </div>

            {/* Proctoring Card */}
            {proctoringData && proctoringData.enabled && (
              <div className="bg-surface rounded-2xl p-6 border border-outline-variant shadow-lg flex flex-col gap-4">
                <h3 className="font-bold text-lg text-primary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">security</span> Anti-Cheat Proctoring
                </h3>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    proctoringData.warningCount >= 3 
                      ? 'bg-error/10 text-error border border-error/30 animate-pulse' 
                      : 'bg-success/10 text-success border border-success/30'
                  }`}>
                    {proctoringData.warningCount >= 3 ? '🔴 SUSPICIOUS / REVIEW REQ.' : '🟢 SECURE / VERIFIED'}
                  </span>
                  <span className="text-xs text-on-surface-variant font-bold">
                    {proctoringData.warningCount} Proctoring Warning(s)
                  </span>
                </div>
                {proctoringData.logs && proctoringData.logs.length > 0 ? (
                  <div className="border border-outline-variant rounded-xl overflow-hidden max-h-[160px] overflow-y-auto">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead>
                        <tr className="bg-surface-container border-b border-outline-variant">
                          <th className="p-2 font-bold text-on-surface-variant">Time</th>
                          <th className="p-2 font-bold text-on-surface-variant">Infraction Event</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant">
                        {proctoringData.logs.map((log: any, idx: number) => (
                          <tr key={idx} className="hover:bg-surface-container/30">
                            <td className="p-2 text-on-surface-variant font-mono whitespace-nowrap">{log.timestamp}</td>
                            <td className="p-2 text-on-surface text-xs">{log.event}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-on-surface-variant italic">No compliance issues detected. Zero cheating indicators flagged.</p>
                )}
              </div>
            )}
          </section>

          {/* Right Column: Detailed Bento Breakdown & Accordion (2/3 width) */}
          <section className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Domain Weakness Report */}
            {(() => {
              const weakList = getWeakDomains(activeSession, activeSession.role || 'Senior Frontend Engineer');
              const allRoleDomains = ROLE_DOMAINS[activeSession.role || 'Senior Frontend Engineer'] || [];

              return (
                <div className="bg-surface rounded-2xl p-6 border border-outline-variant shadow-lg flex flex-col gap-6">
                  <div>
                    <h3 className="font-black text-xl text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">analytics</span>
                      Domain Performance Report
                    </h3>
                    <p className="text-xs text-on-surface-variant font-medium mt-1">
                      A breakdown of your technical proficiency across key topics evaluated for the <strong className="text-primary">{activeSession.role || 'Senior Frontend Engineer'}</strong> role.
                    </p>
                  </div>

                  {weakList.length > 0 ? (
                    <div className="space-y-4">
                      <div className="bg-error/10 border border-error/20 p-4 rounded-xl flex gap-3 items-start">
                        <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                        <div>
                          <p className="font-bold text-sm text-error">Topics Requiring Attention</p>
                          <p className="text-xs text-on-surface-variant leading-relaxed mt-0.5">
                            You scored below the 60% competency benchmark in {weakList.length} key {weakList.length === 1 ? 'area' : 'areas'}. Review the curated study actions below to build proficiency.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {weakList.map((domainName: string) => {
                          const details = DOMAIN_DETAILS[domainName] || {
                            icon: 'school',
                            desc: `Technical concepts and best practices related to ${domainName}.`,
                            actions: [
                              `Study core principles of ${domainName} in official docs.`,
                              `Practice designing and implementation scenarios.`,
                              `Review mock interview answers in this domain.`
                            ]
                          };

                          return (
                            <div key={domainName} className="p-5 bg-surface-container rounded-xl border border-outline-variant flex flex-col justify-between gap-4">
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-lg bg-error/10 text-error flex items-center justify-center">
                                    <span className="material-symbols-outlined text-base">{details.icon}</span>
                                  </div>
                                  <h4 className="font-bold text-sm text-on-surface leading-tight">{domainName}</h4>
                                </div>
                                <p className="text-xs text-on-surface-variant leading-relaxed">{details.desc}</p>
                              </div>

                              <div className="pt-3 border-t border-outline-variant/60">
                                <h5 className="text-[10px] font-black text-secondary uppercase tracking-wider mb-2">Recommended Study Plan:</h5>
                                <ul className="space-y-2">
                                  {details.actions.map((act, i) => (
                                    <li key={i} className="flex gap-2 items-start text-[11px] text-on-surface-variant font-medium">
                                      <span className="material-symbols-outlined text-primary text-xs mt-0.5">menu_book</span>
                                      <span>{act}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-success/5 border border-success/20 p-5 rounded-xl flex flex-col gap-4">
                      <div className="flex gap-3 items-start">
                        <span className="material-symbols-outlined text-success" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        <div>
                          <p className="font-bold text-sm text-success">All Evaluation Domains Cleared!</p>
                          <p className="text-xs text-on-surface-variant leading-relaxed mt-0.5">
                            Outstanding! You demonstrated robust domain understanding and scored above the 60% competency threshold across all evaluated topics.
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-2 border-t border-success/10">
                        {allRoleDomains.map(d => (
                          <span key={d} className="text-[10px] bg-success/15 text-success px-2.5 py-1 rounded-full font-bold border border-success/20 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[10px]">done</span> {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Action Checklist & Strengths */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-surface rounded-2xl p-6 border border-outline-variant shadow-md flex flex-col justify-between">
                <h4 className="font-bold text-base text-secondary mb-4">Improvement Checklist</h4>
                <div className="space-y-3">
                  {checklist.length > 0 ? (
                    checklist.map(item => (
                      <label 
                        key={item.id}
                        className="flex items-start gap-3 cursor-pointer text-xs font-semibold select-none"
                      >
                        <input 
                          type="checkbox"
                          checked={item.done}
                          onChange={() => toggleCheck(item.id)}
                          className="mt-0.5 accent-primary h-4.5 w-4.5 cursor-pointer rounded-md"
                        />
                        <span className={`${item.done ? 'line-through text-on-surface-variant/40' : 'text-on-surface'}`}>
                          {item.text}
                        </span>
                      </label>
                    ))
                  ) : (
                    <p className="text-xs text-on-surface-variant">No immediate improvements checklist generated. Good job!</p>
                  )}
                </div>
              </div>

              <div className="bg-surface rounded-2xl p-6 border border-outline-variant shadow-md">
                <h4 className="font-bold text-base text-primary mb-4">Core Strengths</h4>
                <ul className="space-y-2 text-xs font-semibold text-on-surface-variant pl-4 list-disc">
                  {activeSession.answers.map((ans: any, idx: number) => (
                    ans.scores?.aiFeedbackJson?.topStrength ? (
                      <li key={ans.id}>{ans.scores.aiFeedbackJson.topStrength}</li>
                    ) : (
                      <li key={ans.id}>Clear response formatting in Question {idx + 1}.</li>
                    )
                  ))}
                </ul>
              </div>
            </div>

            {/* Question Breakdown Accordion */}
            <div className="bg-surface rounded-2xl p-6 border border-outline-variant shadow-lg">
              <h3 className="font-black text-xl mb-6 text-on-surface">Question-by-Question Review</h3>
              
              <div className="space-y-4">
                {activeSession.answers.map((review: any, idx: number) => {
                  const isExpanded = expandedId === review.id;
                  const scoreObj = review.scores;
                  return (
                    <div 
                      key={review.id} 
                      className="border border-outline-variant rounded-xl overflow-hidden transition-all"
                    >
                      {/* Header */}
                      <button 
                        onClick={() => setExpandedId(isExpanded ? null : review.id)}
                        className="w-full text-left p-5 bg-surface-container flex justify-between items-center gap-4 hover:bg-surface-container-high transition-colors"
                      >
                        <div className="flex-grow">
                          <span className="text-[10px] font-bold text-primary uppercase">Question {idx + 1} Review</span>
                          <h4 className="font-bold text-sm text-on-surface mt-0.5 leading-snug">
                            {review.questionText}
                          </h4>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="bg-secondary/20 text-secondary px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">
                            {scoreObj?.overallScore || 0}/100
                          </span>
                          <span className="material-symbols-outlined text-on-surface-variant transition-transform duration-300">
                            {isExpanded ? 'expand_less' : 'expand_more'}
                          </span>
                        </div>
                      </button>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="p-6 bg-surface space-y-6 divide-y divide-outline-variant">
                          {/* Transcript */}
                          <div className="space-y-2">
                            <h5 className="text-xs font-bold text-on-surface-variant uppercase">Your Response</h5>
                            <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap italic">
                              "{review.responseText}"
                            </p>
                          </div>

                          {/* Interviewer Live Correction */}
                          {scoreObj?.aiFeedbackJson?.interviewerCorrection && (
                            <div className="pt-6">
                              <div className="bg-primary-container/10 p-5 rounded-xl border border-primary/20 flex gap-3.5 items-start">
                                <span className="material-symbols-outlined text-primary animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>face</span>
                                <div>
                                  <h5 className="text-xs font-bold text-primary uppercase">Interviewer's Verbal Correction</h5>
                                  <p className="text-sm text-on-surface mt-1 leading-relaxed italic font-medium">
                                    "{scoreObj.aiFeedbackJson.interviewerCorrection}"
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Technical Breakdown */}
                          {(scoreObj?.aiFeedbackJson?.whatWasCorrect || 
                            scoreObj?.aiFeedbackJson?.technicalErrors || 
                            scoreObj?.aiFeedbackJson?.keyConceptsMissed) && (
                            <div className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                              {/* What Was Correct */}
                              <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10 space-y-2">
                                <h6 className="text-xs font-bold text-emerald-500 uppercase flex items-center gap-1.5">
                                  <span className="material-symbols-outlined text-sm">check_circle</span> Genuinely Correct
                                </h6>
                                {scoreObj.aiFeedbackJson.whatWasCorrect && scoreObj.aiFeedbackJson.whatWasCorrect.length > 0 ? (
                                  <ul className="list-disc pl-4 space-y-1 text-xs text-on-surface-variant font-semibold">
                                    {scoreObj.aiFeedbackJson.whatWasCorrect.map((item: string, i: number) => (
                                      <li key={i}>{item}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-xs text-on-surface-variant italic">No specific correct points marked.</p>
                                )}
                              </div>

                              {/* Technical Errors */}
                              <div className="p-4 bg-error/5 rounded-xl border border-error/10 space-y-2">
                                <h6 className="text-xs font-bold text-error uppercase flex items-center gap-1.5">
                                  <span className="material-symbols-outlined text-sm">cancel</span> Factual Errors
                                </h6>
                                {scoreObj.aiFeedbackJson.technicalErrors && scoreObj.aiFeedbackJson.technicalErrors.length > 0 ? (
                                  <ul className="list-disc pl-4 space-y-1 text-xs text-error font-semibold">
                                    {scoreObj.aiFeedbackJson.technicalErrors.map((item: string, i: number) => (
                                      <li key={i}>{item}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-xs text-emerald-500 font-semibold italic flex items-center gap-1">
                                    ✓ Zero factual errors detected.
                                  </p>
                                )}
                              </div>

                              {/* Key Concepts Missed */}
                              <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/10 space-y-2">
                                <h6 className="text-xs font-bold text-amber-500 uppercase flex items-center gap-1.5">
                                  <span className="material-symbols-outlined text-sm">lightbulb</span> Concepts Missed
                                </h6>
                                {scoreObj.aiFeedbackJson.keyConceptsMissed && scoreObj.aiFeedbackJson.keyConceptsMissed.length > 0 ? (
                                  <ul className="list-disc pl-4 space-y-1 text-xs text-on-surface-variant font-semibold">
                                    {scoreObj.aiFeedbackJson.keyConceptsMissed.map((item: string, i: number) => (
                                      <li key={i}>{item}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-xs text-on-surface-variant italic">No major concepts missed.</p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Ideal Answer outline */}
                          {scoreObj?.aiFeedbackJson?.idealAnswerOutline && (
                            <div className="pt-6 space-y-2">
                              <h5 className="text-xs font-bold text-secondary uppercase flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">assignment</span> Ideal Answer Blueprint
                              </h5>
                              <div className="p-4 bg-surface-container rounded-xl border border-outline-variant">
                                <p className="text-xs text-on-surface-variant leading-relaxed whitespace-pre-wrap font-semibold">
                                  {scoreObj.aiFeedbackJson.idealAnswerOutline}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* STAR analysis */}
                          {scoreObj?.aiFeedbackJson?.star && (
                            <div className="pt-6 space-y-4">
                              <h5 className="text-xs font-bold text-secondary uppercase">STAR Analysis</h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-3.5 bg-surface-container rounded-xl border border-outline-variant">
                                  <span className="text-[10px] font-black text-primary uppercase">Situation</span>
                                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{scoreObj.aiFeedbackJson.star.situation}</p>
                                </div>
                                <div className="p-3.5 bg-surface-container rounded-xl border border-outline-variant">
                                  <span className="text-[10px] font-black text-secondary uppercase">Task</span>
                                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{scoreObj.aiFeedbackJson.star.task}</p>
                                </div>
                                <div className="p-3.5 bg-surface-container rounded-xl border border-outline-variant">
                                  <span className="text-[10px] font-black text-tertiary uppercase">Action</span>
                                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{scoreObj.aiFeedbackJson.star.action}</p>
                                </div>
                                <div className="p-3.5 bg-surface-container rounded-xl border border-outline-variant">
                                  <span className="text-[10px] font-black text-primary uppercase">Result</span>
                                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{scoreObj.aiFeedbackJson.star.result}</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Advice */}
                          {!scoreObj?.aiFeedbackJson?.interviewerCorrection && scoreObj?.aiFeedbackJson?.coachingAdvice && (
                            <div className="pt-6 flex gap-3.5 items-start bg-primary-container/10 p-4 rounded-xl border border-primary/20">
                              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>insights</span>
                              <div>
                                <h5 className="text-xs font-bold text-primary uppercase">Coaching Advice</h5>
                                <p className="text-xs text-on-surface mt-1 leading-relaxed font-medium">
                                  {scoreObj.aiFeedbackJson.coachingAdvice}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mt-4">
              <button 
                onClick={() => navigate('/session')}
                className="w-full sm:w-auto px-10 py-4 border-2 border-primary text-primary font-bold rounded-full bouncy hover:bg-primary/10 transition-colors text-sm"
              >
                Practice Again
              </button>
              <button 
                onClick={handleDownload}
                className="w-full sm:w-auto px-10 py-4 bg-primary text-white font-bold rounded-full bouncy shadow-md hover:brightness-110 transition-all text-sm"
              >
                Download PDF Review
              </button>
            </div>

          </section>
        </div>
      </main>

      {/* Mobile nav bar */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3 bg-surface shadow-lg border-t border-outline-variant rounded-t-xl">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary"
        >
          <span className="material-symbols-outlined">dashboard</span>
          <span className="text-[10px] font-medium">Home</span>
        </button>
        <button 
          onClick={() => navigate('/session')}
          className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary"
        >
          <span className="material-symbols-outlined">exercise</span>
          <span className="text-[10px] font-medium">Practice</span>
        </button>
        <button 
          onClick={() => navigate('/history')}
          className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary"
        >
          <span className="material-symbols-outlined">history</span>
          <span className="text-[10px] font-medium">History</span>
        </button>
      </nav>
    </div>
  );
};
