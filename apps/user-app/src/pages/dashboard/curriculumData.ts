// AI Engineering Curriculum — structured data for the roadmap component.
// BACKEND INTEGRATION: Replace MOCK_PROGRESS with your API call:
//   const { data: progress } = useQuery(['curriculum-progress'], () => api.get('/users/me/curriculum-progress'))
//   Shape: Record<segmentId, ProgressStatus>

export type ProgressStatus = 'completed' | 'current' | 'locked';

export interface Topic  { id: string; title: string; }
export interface Course { id: string; title: string; topics: Topic[]; }
export interface Segment { id: string; label: string; weeks: string; courses: Course[]; }
export interface CurriculumTrack { id: string; label: string; prereq: string; segments: Segment[]; }

// ── TRACK A · 3 MONTHS ────────────────────────────────────────────────────────
const A3M: CurriculumTrack = {
  id: 'A3M', label: 'Track A · 3 Months', prereq: 'Backend or Fullstack experience',
  segments: [
    { id:'A3M-S1', label:'S1 — Python for AI Engineering', weeks:'Weeks 1–2', courses:[
      { id:'A3M-S1-C1', title:'Python Rapid Onboarding for Engineers', topics:[
        {id:'a1t1',title:'Python syntax crash course (type hints, comprehensions, generators)'},
        {id:'a1t2',title:'OOP — classes, dunder methods, inheritance, dataclasses'},
        {id:'a1t3',title:'Functional patterns — map/filter/reduce, closures, decorators'},
        {id:'a1t4',title:'Tooling — venv, pip, pyproject.toml, Jupyter, VS Code'},
        {id:'a1t5',title:'Async Python — async/await, event loops, aiohttp basics'},
      ]},
      { id:'A3M-S1-C2', title:'Scientific Python Stack', topics:[
        {id:'a1t6',title:'NumPy — arrays, broadcasting, vectorized ops, linear algebra'},
        {id:'a1t7',title:'Pandas — DataFrames, groupby, merging, cleaning pipelines'},
        {id:'a1t8',title:'Matplotlib & Seaborn — visualization for data and model evaluation'},
        {id:'a1t9',title:'Data pipelines — reading CSVs/JSONs/APIs, handling missing data'},
      ]},
    ]},
    { id:'A3M-S2', label:'S2 — Mathematics for Machine Learning', weeks:'Weeks 2–3', courses:[
      { id:'A3M-S2-C1', title:'Linear Algebra Essentials', topics:[
        {id:'a2t1',title:'Scalars, vectors, matrices — notation and intuition'},
        {id:'a2t2',title:'Matrix operations — multiplication, transpose, inverse'},
        {id:'a2t3',title:'Dot products, norms, cosine similarity'},
        {id:'a2t4',title:'Eigenvalues and eigenvectors — PCA intuition'},
      ]},
      { id:'A3M-S2-C2', title:'Statistics and Probability for ML', topics:[
        {id:'a2t5',title:'Probability distributions — normal, binomial, Bernoulli'},
        {id:'a2t6',title:"Bayes' theorem and its role in ML"},
        {id:'a2t7',title:'Descriptive stats — mean, variance, std dev, correlation'},
        {id:'a2t8',title:'Information theory basics — entropy, cross-entropy, loss functions'},
      ]},
      { id:'A3M-S2-C3', title:'Calculus and Optimization Intuition', topics:[
        {id:'a2t9',title:'Derivatives and gradients — what they mean, chain rule'},
        {id:'a2t10',title:'Gradient descent — intuition, learning rate, convergence'},
        {id:'a2t11',title:'Partial derivatives and Jacobians (conceptual only)'},
      ]},
    ]},
    { id:'A3M-S3', label:'S3 — Machine Learning Foundations', weeks:'Weeks 3–5', courses:[
      { id:'A3M-S3-C1', title:'The ML Paradigm', topics:[
        {id:'a3t1',title:'Supervised, unsupervised, and reinforcement learning taxonomy'},
        {id:'a3t2',title:'The ML workflow — problem → data → features → model → evaluation'},
        {id:'a3t3',title:'Feature engineering — encoding, scaling, selection'},
        {id:'a3t4',title:'Train/validation/test splits — leakage, stratification, cross-validation'},
      ]},
      { id:'A3M-S3-C2', title:'Classical Algorithms', topics:[
        {id:'a3t5',title:'Linear regression — cost function, normal equation, gradient descent'},
        {id:'a3t6',title:'Logistic regression — sigmoid, binary and multi-class'},
        {id:'a3t7',title:'Decision trees, Random Forests, Gradient Boosting (XGBoost, LightGBM)'},
        {id:'a3t8',title:'Support Vector Machines — conceptual + scikit-learn usage'},
        {id:'a3t9',title:'K-Means clustering and DBSCAN'},
        {id:'a3t10',title:'Dimensionality reduction — PCA and t-SNE'},
      ]},
      { id:'A3M-S3-C3', title:'Model Evaluation and Improvement', topics:[
        {id:'a3t11',title:'Classification metrics — accuracy, precision, recall, F1, AUC-ROC'},
        {id:'a3t12',title:'Regression metrics — MAE, MSE, RMSE, R²'},
        {id:'a3t13',title:'Overfitting and underfitting — bias-variance tradeoff'},
        {id:'a3t14',title:'Regularization — L1 (Lasso), L2 (Ridge), dropout'},
        {id:'a3t15',title:'Hyperparameter tuning — grid search, random search, Optuna'},
      ]},
    ]},
    { id:'A3M-S4', label:'S4 — Deep Learning and Neural Networks', weeks:'Weeks 5–7', courses:[
      { id:'A3M-S4-C1', title:'Neural Network Fundamentals', topics:[
        {id:'a4t1',title:'Perceptrons and multi-layer networks — architecture intuition'},
        {id:'a4t2',title:'Activation functions — ReLU, sigmoid, tanh, softmax'},
        {id:'a4t3',title:'Backpropagation and gradient descent — forward pass, loss, backward pass'},
        {id:'a4t4',title:'Implementing a neural net from scratch with NumPy'},
      ]},
      { id:'A3M-S4-C2', title:'PyTorch Essentials', topics:[
        {id:'a4t5',title:'Tensors and autograd — computation graphs, .backward()'},
        {id:'a4t6',title:'Building models with nn.Module and nn.Sequential'},
        {id:'a4t7',title:'Training loops — optimizers (Adam, SGD), loss functions, epochs'},
        {id:'a4t8',title:'Datasets, DataLoaders, and batching'},
        {id:'a4t9',title:'GPU training with CUDA — .to(device) patterns'},
      ]},
      { id:'A3M-S4-C3', title:'CNNs and Transfer Learning', topics:[
        {id:'a4t10',title:'Convolutional layers, pooling, feature maps'},
        {id:'a4t11',title:'Pre-trained CNN models — ResNet, EfficientNet, ViT'},
        {id:'a4t12',title:'Transfer learning — fine-tuning vs feature extraction'},
        {id:'a4t13',title:'torchvision and image preprocessing pipelines'},
      ]},
    ]},
    { id:'A3M-S5', label:'S5 — NLP and Large Language Models', weeks:'Weeks 7–9', courses:[
      { id:'A3M-S5-C1', title:'NLP Foundations', topics:[
        {id:'a5t1',title:'Text preprocessing — tokenization, stop words, stemming, lemmatization'},
        {id:'a5t2',title:'Text representations — Bag of Words, TF-IDF'},
        {id:'a5t3',title:'Word embeddings — Word2Vec, GloVe, semantic relationships'},
        {id:'a5t4',title:'Sentence transformers and semantic similarity'},
      ]},
      { id:'A3M-S5-C2', title:'Transformers and the LLM Landscape', topics:[
        {id:'a5t5',title:'Attention mechanism and transformer architecture — intuition'},
        {id:'a5t6',title:'BERT, GPT, T5 — encoder-only, decoder-only, encoder-decoder'},
        {id:'a5t7',title:'Modern LLMs — GPT-4o, Claude, Gemini, Llama 3, Mistral, Qwen'},
        {id:'a5t8',title:'HuggingFace — Hub, Transformers library, Pipelines, Inference API'},
        {id:'a5t9',title:'Ollama — running open models locally'},
      ]},
      { id:'A3M-S5-C3', title:'Prompt Engineering', topics:[
        {id:'a5t10',title:'Prompt anatomy — role, context, instruction, output format'},
        {id:'a5t11',title:'Zero-shot, few-shot, chain-of-thought prompting'},
        {id:'a5t12',title:'System prompts, role assignment, context window management'},
        {id:'a5t13',title:'Advanced — ReAct, Tree-of-Thought, meta-prompting'},
        {id:'a5t14',title:'Prompt injection attacks and safety considerations'},
      ]},
    ]},
    { id:'A3M-S6', label:'S6 — Generative AI Engineering', weeks:'Weeks 9–11', courses:[
      { id:'A3M-S6-C1', title:'LLM APIs and the OpenAI Platform', topics:[
        {id:'a6t1',title:'Chat Completions API — messages array, roles, parameters'},
        {id:'a6t2',title:'Token counting and context window management'},
        {id:'a6t3',title:'Streaming responses'},
        {id:'a6t4',title:'Pricing and cost optimization strategies'},
        {id:'a6t5',title:'Other providers — Anthropic, Google Gemini, Cohere, Together AI, Groq'},
      ]},
      { id:'A3M-S6-C2', title:'Embeddings and Vector Databases', topics:[
        {id:'a6t6',title:'Embeddings — what they encode, OpenAI and open-source models'},
        {id:'a6t7',title:'Vector DB landscape — Chroma, Pinecone, Qdrant, Weaviate, pgvector'},
        {id:'a6t8',title:'Indexing and querying — HNSW, IVFFlat, approximate nearest neighbor'},
        {id:'a6t9',title:'Metadata filtering and hybrid search'},
      ]},
      { id:'A3M-S6-C3', title:'RAG (Retrieval-Augmented Generation)', topics:[
        {id:'a6t10',title:'RAG architecture — ingestion pipeline, retrieval, augmented generation'},
        {id:'a6t11',title:'Chunking strategies — fixed-size, semantic, recursive, hierarchical'},
        {id:'a6t12',title:'Retrieval optimization — reranking, HyDE, multi-query'},
        {id:'a6t13',title:'RAG evaluation — faithfulness, relevance, groundedness (RAGAS)'},
        {id:'a6t14',title:'Frameworks — LangChain vs LlamaIndex vs raw implementation'},
      ]},
      { id:'A3M-S6-C4', title:'AI Agents', topics:[
        {id:'a6t15',title:'Agent architecture — perception, memory, action, planning loop'},
        {id:'a6t16',title:'Tool use and function calling — OpenAI tools API, Anthropic tool use'},
        {id:'a6t17',title:'ReAct pattern — reasoning and acting cycles'},
        {id:'a6t18',title:'Multi-agent systems — orchestration, CrewAI and LangGraph basics'},
        {id:'a6t19',title:'Memory systems — conversation history, vector memory, episodic memory'},
      ]},
    ]},
    { id:'A3M-S7', label:'S7 — AI Deployment, APIs, and MLOps', weeks:'Weeks 11–12', courses:[
      { id:'A3M-S7-C1', title:'Serving AI Models as APIs', topics:[
        {id:'a7t1',title:'FastAPI — async routes, Pydantic models, dependency injection, middleware'},
        {id:'a7t2',title:'Packaging AI apps — Docker, docker-compose, multi-stage builds'},
        {id:'a7t3',title:'Deployment targets — Railway, Render, HuggingFace Spaces, AWS Lambda'},
        {id:'a7t4',title:'Streaming LLM responses via SSE and WebSockets'},
      ]},
      { id:'A3M-S7-C2', title:'MLOps Essentials', topics:[
        {id:'a7t5',title:'Experiment tracking — MLflow or Weights & Biases'},
        {id:'a7t6',title:'Model versioning and model registry concepts'},
        {id:'a7t7',title:'Monitoring AI systems — latency, token cost, error rates, data drift'},
        {id:'a7t8',title:'CI/CD for ML — GitHub Actions basics for model testing'},
        {id:'a7t9',title:'Caching, rate limiting, observability, LLM-specific logging'},
      ]},
    ]},
    { id:'A3M-S8', label:'S8 — AI Ethics, Responsible AI, and Capstone', weeks:'Week 12+', courses:[
      { id:'A3M-S8-C1', title:'AI Ethics and Safety', topics:[
        {id:'a8t1',title:'Bias and fairness — sources, measurement, mitigation'},
        {id:'a8t2',title:'AI safety — prompt injection, jailbreaking, adversarial inputs'},
        {id:'a8t3',title:'Privacy in AI — training data, PII in prompts, GDPR implications'},
        {id:'a8t4',title:'Regulatory landscape — EU AI Act overview, NIST AI RMF'},
      ]},
      { id:'A3M-S8-C2', title:'Capstone Project', topics:[
        {id:'a8t5',title:'Project scoping — problem definition, architecture planning, tech stack'},
        {id:'a8t6',title:'Implementation sprint — iterative development with daily Gitea commits'},
        {id:'a8t7',title:'Technical documentation — README, architecture diagram, API docs'},
        {id:'a8t8',title:'Presentation and demo — project defence to instructors and cohort'},
      ]},
    ]},
  ],
};

// ── TRACK B · 3 MONTHS ────────────────────────────────────────────────────────
const B3M: CurriculumTrack = {
  id: 'B3M', label: 'Track B · 3 Months', prereq: 'Basic computer literacy only',
  segments: [
    { id:'B3M-S1', label:'S1 — Python Programming Foundations', weeks:'Weeks 1–3', courses:[
      { id:'B3M-S1-C1', title:'Absolute Python Basics', topics:[
        {id:'b1t1',title:'Variables and data types — int, float, string, bool'},
        {id:'b1t2',title:'Operators, expressions, print statements'},
        {id:'b1t3',title:'Conditionals — if/elif/else'},
        {id:'b1t4',title:'Loops — for, while, break, continue'},
        {id:'b1t5',title:'Data structures — lists, tuples, dictionaries, sets'},
        {id:'b1t6',title:'Functions — definition, parameters, return values'},
      ]},
      { id:'B3M-S1-C2', title:'Tooling, Files, and the Command Line', topics:[
        {id:'b1t7',title:'Terminal basics — navigation, files, running Python scripts'},
        {id:'b1t8',title:'VS Code setup, extensions, debugging basics'},
        {id:'b1t9',title:'Git basics — init, add, commit, push (Gitea workflow)'},
        {id:'b1t10',title:'Virtual environments, pip, installing packages'},
        {id:'b1t11',title:'Reading and writing files — txt, JSON, CSV'},
      ]},
      { id:'B3M-S1-C3', title:'Functions, Modules, and OOP Basics', topics:[
        {id:'b1t12',title:'Function scope, default arguments, *args and **kwargs'},
        {id:'b1t13',title:'Importing modules — os, json, datetime, random'},
        {id:'b1t14',title:'Introduction to classes and objects'},
        {id:'b1t15',title:'Error handling — try/except/finally'},
      ]},
    ]},
    { id:'B3M-S2', label:'S2 — Python for AI and Data', weeks:'Weeks 4–5', courses:[
      { id:'B3M-S2-C1', title:'NumPy and Pandas Essentials', topics:[
        {id:'b2t1',title:'NumPy arrays — creation, indexing, slicing, basic ops'},
        {id:'b2t2',title:'Why NumPy — vectorization vs Python loops'},
        {id:'b2t3',title:'Pandas Series and DataFrames — loading, inspecting, filtering'},
        {id:'b2t4',title:'Data cleaning — nulls, duplicates, type conversion'},
      ]},
      { id:'B3M-S2-C2', title:'Working with APIs in Python', topics:[
        {id:'b2t5',title:'HTTP basics — GET, POST, headers, JSON responses'},
        {id:'b2t6',title:'The requests library — calling REST APIs'},
        {id:'b2t7',title:'API keys, environment variables, .env files'},
        {id:'b2t8',title:'Handling API errors, retries, rate limits'},
      ]},
    ]},
    { id:'B3M-S3', label:'S3 — LLMs, Prompt Engineering, and AI APIs', weeks:'Weeks 6–7', courses:[
      { id:'B3M-S3-C1', title:'What are LLMs? (Conceptual)', topics:[
        {id:'b3t1',title:'What is a language model — tokens, probabilities, generation'},
        {id:'b3t2',title:'AI vs ML vs LLM — taxonomy without equations'},
        {id:'b3t3',title:'Popular models — GPT-4o, Claude, Gemini, Llama, Mistral'},
        {id:'b3t4',title:'Context windows, tokenization, temperature'},
        {id:'b3t5',title:'Open vs closed source models — tradeoffs'},
      ]},
      { id:'B3M-S3-C2', title:'OpenAI API and Prompt Engineering', topics:[
        {id:'b3t6',title:'Chat Completions API — messages, roles, parameters'},
        {id:'b3t7',title:'Prompt patterns — zero-shot, few-shot, role prompting'},
        {id:'b3t8',title:'System prompts — persona and constraints'},
        {id:'b3t9',title:'Chain-of-thought prompting'},
        {id:'b3t10',title:'Token cost awareness'},
      ]},
      { id:'B3M-S3-C3', title:'Open Source Models and HuggingFace', topics:[
        {id:'b3t11',title:'HuggingFace Hub — browsing models, understanding model cards'},
        {id:'b3t12',title:'Inference API — using models without running them locally'},
        {id:'b3t13',title:'Ollama — running open models locally'},
      ]},
    ]},
    { id:'B3M-S4', label:'S4 — Embeddings, Vector Databases, and RAG', weeks:'Weeks 8–9', courses:[
      { id:'B3M-S4-C1', title:'Embeddings and Semantic Search', topics:[
        {id:'b4t1',title:'What embeddings are — numbers that represent meaning'},
        {id:'b4t2',title:'Generating embeddings — OpenAI Embeddings API, sentence-transformers'},
        {id:'b4t3',title:'Cosine similarity — finding similar content'},
        {id:'b4t4',title:'Vector databases — Chroma (local), Pinecone basics'},
        {id:'b4t5',title:'Indexing and querying a vector database'},
      ]},
      { id:'B3M-S4-C2', title:'RAG from Scratch', topics:[
        {id:'b4t6',title:'What RAG is and why it exists'},
        {id:'b4t7',title:'Document ingestion — loading PDFs, text, web pages'},
        {id:'b4t8',title:'Chunking — splitting documents intelligently'},
        {id:'b4t9',title:'The RAG pipeline: embed → store → retrieve → generate'},
        {id:'b4t10',title:'LangChain for RAG — chains and retrieval QA'},
      ]},
    ]},
    { id:'B3M-S5', label:'S5 — AI Agents and Basic Deployment', weeks:'Weeks 10–11', courses:[
      { id:'B3M-S5-C1', title:'AI Agents (Applied)', topics:[
        {id:'b5t1',title:'What is an agent — the sense, think, act loop'},
        {id:'b5t2',title:'Tool and function calling — giving an LLM the ability to act'},
        {id:'b5t3',title:'Building simple agents with LangChain or raw function calling'},
        {id:'b5t4',title:'Memory in agents — conversation history, external memory'},
      ]},
      { id:'B3M-S5-C2', title:'Deploying AI Applications', topics:[
        {id:'b5t5',title:'FastAPI basics — building a simple AI API endpoint'},
        {id:'b5t6',title:'Streamlit and Gradio — building quick AI UIs'},
        {id:'b5t7',title:'Deploying to Railway or Render'},
        {id:'b5t8',title:'Environment variables in production and basic security'},
      ]},
    ]},
    { id:'B3M-S6', label:'S6 — AI Ethics and Capstone', weeks:'Week 12', courses:[
      { id:'B3M-S6-C1', title:'Responsible AI (Applied)', topics:[
        {id:'b6t1',title:'Bias in AI — what it looks like in LLM outputs'},
        {id:'b6t2',title:'Prompt injection attacks — how they work and how to defend'},
        {id:'b6t3',title:'Hallucinations — why they happen and how RAG mitigates them'},
        {id:'b6t4',title:'Responsible use of AI in products'},
      ]},
      { id:'B3M-S6-C2', title:'Capstone Project', topics:[
        {id:'b6t5',title:'Scoping and planning an AI application'},
        {id:'b6t6',title:'Building and iterating with daily Gitea commits'},
        {id:'b6t7',title:'Presenting and demoing to the cohort'},
      ]},
    ]},
  ],
};

export const CURRICULUM: CurriculumTrack[] = [A3M, B3M];

// BACKEND INTEGRATION POINT
// The backend engineer should expose an endpoint like:
//   GET /users/me/curriculum-progress
// returning: { trackId: string; progress: Record<segmentId, ProgressStatus> }
// Replace MOCK_PROGRESS below with the API response in CurriculumRoadmap.tsx
export const MOCK_PROGRESS: Record<string, ProgressStatus> = {
  'A3M-S1': 'completed',
  'A3M-S2': 'current',
};
