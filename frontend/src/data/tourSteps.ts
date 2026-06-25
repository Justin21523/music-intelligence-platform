export interface TourStep {
  id: string
  title: string
  subtitle: string
  route: string
  anchor: string
  description: string
  stats: string[]
  // Bilingual fields (optional — falls back to English when not set)
  titleZh?: string
  subtitleZh?: string
  descriptionZh?: string
  statsZh?: string[]
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'data-gen',
    title: 'Raw Data Generation',
    subtitle: 'Step 1 · Ingestion',
    titleZh: '原始資料生成',
    subtitleZh: '第 1 步 · 資料攝取',
    route: '/',
    anchor: 'stats-cards',
    description:
      'A synthetic dataset is generated with realistic statistical distributions. Tracks follow a power-law play-count distribution. Listening events are weighted toward popular tracks, mirroring real-world music consumption.',
    descriptionZh:
      '以真實統計分布生成合成資料集。歌曲播放次數遵循冪次定律分布，收聽事件偏向熱門歌曲，模擬真實音樂消費模式。',
    stats: ['10,000 tracks across 15 genres', '800 artists · 500 users', '50,000 listening events'],
    statsZh: ['10,000 首歌曲涵蓋 15 種音樂類型', '800 位藝人 · 500 位用戶', '50,000 筆收聽記錄'],
  },
  {
    id: 'cleaning',
    title: 'Data Cleaning',
    subtitle: 'Step 2 · Preprocessing',
    titleZh: '資料清洗',
    subtitleZh: '第 2 步 · 前處理',
    route: '/',
    anchor: 'top-tracks',
    description:
      'The cleaning pipeline removes duplicates, fills missing audio features with column medians, clips bounded features to [0, 1], and normalizes string fields. Outlier play counts are preserved — they reflect real long-tail distributions.',
    descriptionZh:
      '清洗 Pipeline 移除重複資料，以欄位中位數填補缺失 Audio Feature，將有界特徵裁剪至 [0,1]，並正規化字串欄位。離群播放次數予以保留，反映真實長尾分布。',
    stats: ['Nulls filled with column medians', 'Audio features clipped to [0, 1]', 'Timestamps validated & parsed'],
    statsZh: ['缺值以欄位中位數填補', 'Audio feature 裁剪至 [0, 1]', '時間戳記驗證與解析'],
  },
  {
    id: 'features',
    title: 'Audio Feature Extraction',
    subtitle: 'Step 3 · Feature Engineering',
    titleZh: 'Audio Feature 提取',
    subtitleZh: '第 3 步 · 特徵工程',
    route: '/genres',
    anchor: 'audio-scatter',
    description:
      'Nine audio features are extracted per track and min-max normalized. A tag TF-IDF matrix (10K × 500) and 384-dim sentence embeddings (MiniLM-L6) are also built. Together, these form the feature space for content-based models.',
    descriptionZh:
      '每首歌提取 9 種 audio feature 並進行 min-max 正規化。同時建立 TF-IDF 標籤矩陣（10K × 500）與 384 維句向量嵌入（MiniLM-L6）。這些共同構成 content-based 模型的特徵空間。',
    stats: ['9 features/track: Energy, Dance, Valence…', '384-dim embeddings via MiniLM-L6-v2', '500-term TF-IDF tag vocabulary'],
    statsZh: ['每首歌 9 種特徵：Energy, Dance, Valence…', '384 維 MiniLM-L6-v2 向量嵌入', '500 詞 TF-IDF 標籤詞彙表'],
  },
  {
    id: 'catalog',
    title: 'Catalog Exploration',
    subtitle: 'Step 4 · EDA',
    titleZh: '目錄探索分析',
    subtitleZh: '第 4 步 · 探索性資料分析',
    route: '/genres',
    anchor: 'genre-pie',
    description:
      'The catalog spans 65 release years (1960–2025). Genre distribution is uneven — Hip-Hop and Classical dominate. The energy × danceability scatter reveals distinct genre clusters that content-based models exploit.',
    descriptionZh:
      '目錄橫跨 65 個發行年份（1960–2025）。音樂類型分布不均，Hip-Hop 與 Classical 佔主導。Energy × Danceability 散點圖揭示清晰的類型聚類，Content-based 模型正是利用這些特徵。',
    stats: ['15 genres detected', 'Power-law play-count distribution', '1960–2025 release year range'],
    statsZh: ['偵測到 15 種音樂類型', '播放次數呈冪次定律分布', '涵蓋年份：1960–2025'],
  },
  {
    id: 'training',
    title: 'Model Training',
    subtitle: 'Step 5 · ML Models',
    titleZh: '模型訓練',
    subtitleZh: '第 5 步 · 機器學習模型',
    route: '/evaluation',
    anchor: 'eval-chart',
    description:
      'Five recommender models are trained: a popularity baseline, item-item cosine similarity, ALS matrix factorization (implicit feedback), content-based user profiling, and a weighted hybrid ensemble combining all three signals.',
    descriptionZh:
      '訓練 5 種推薦模型：熱門度基準線、物品間餘弦相似度、ALS 矩陣分解（隱式回饋）、Content-based 用戶畫像，以及整合三種信號的加權 Hybrid 模型。',
    stats: ['Popularity 1.8 MB · Item-Sim 4.7 MB', 'ALS 8.7 MB (50 factors, α=40)', 'Hybrid = ALS×0.5 + Content×0.4 + Pop×0.1'],
    statsZh: ['Popularity 1.8 MB · Item-Sim 4.7 MB', 'ALS 8.7 MB（50 個因子，α=40）', 'Hybrid = ALS×0.5 + Content×0.4 + Pop×0.1'],
  },
  {
    id: 'search',
    title: 'Search & Retrieval',
    subtitle: 'Step 6 · Retrieval',
    titleZh: '搜尋與檢索',
    subtitleZh: '第 6 步 · 資料檢索',
    route: '/search',
    anchor: 'search-input',
    description:
      'BM25 keyword search and FAISS vector search are merged via Reciprocal Rank Fusion. BM25 handles exact queries ("electronic house"), while FAISS surfaces semantically similar tracks. The hybrid RRF α=0.5 balances both signals.',
    descriptionZh:
      'BM25 關鍵字搜尋與 FAISS 向量搜尋透過 Reciprocal Rank Fusion（RRF）融合。BM25 處理精確查詢（如「electronic house"），FAISS 則找出語意相似的歌曲。Hybrid RRF α=0.5 平衡兩種信號。',
    stats: ['BM25 index: 2.3 MB on 10K tracks', 'FAISS FlatIP on 384-dim vectors', 'RRF fusion (k=60) for re-ranking'],
    statsZh: ['BM25 索引：2.3 MB，涵蓋 10K 首歌', 'FAISS FlatIP 384 維向量索引', 'RRF 融合（k=60）重新排序'],
  },
  {
    id: 'similar-songs',
    title: 'Vector Similarity Search',
    subtitle: 'Step 7 · Similarity',
    titleZh: '向量相似搜尋',
    subtitleZh: '第 7 步 · 相似度查詢',
    route: '/similar',
    anchor: 'similar-results',
    description:
      'Given any track, FAISS retrieves the top-K most similar songs by cosine distance in 384-dim MiniLM embedding space. Every track is a vector — nearby vectors share musical DNA: similar tempo, energy, mood, and genre.',
    descriptionZh:
      '給定任意一首歌，FAISS 在 384 維 MiniLM 嵌入空間中以餘弦距離找出 Top-K 相似歌曲。每首歌都是一個向量 — 距離近的向量代表相似的音樂基因：tempo、energy、情緒與音樂類型。',
    stats: ['384-dim MiniLM-L6 embeddings', 'FAISS FlatIP index', 'Top-10 nearest neighbors | <10ms per query'],
    statsZh: ['384 維 MiniLM-L6 向量嵌入', 'FAISS FlatIP 索引', 'Top-10 最近鄰 | <10ms 查詢時間'],
  },
  {
    id: 'recs',
    title: 'Personalized Recommendations',
    subtitle: 'Step 8 · Inference',
    titleZh: '個人化推薦',
    subtitleZh: '第 8 步 · 模型推論',
    route: '/recommend',
    anchor: 'rec-list',
    description:
      'The hybrid model scores all unheard tracks for a user by fusing ALS collaborative scores with content-based audio similarity. It outperforms either model alone by combining user-behaviour signals with acoustic profile matching.',
    descriptionZh:
      'Hybrid 模型融合 ALS 協作過濾分數與 Content-based 音頻相似度，對用戶未聽過的歌曲進行排序。結合用戶行為信號與音頻畫像匹配，表現優於單一模型。',
    stats: ['Top-10 recs per user, <50ms latency', 'Filter-already-heard by default', 'Model selectable: Pop / ALS / Content / Hybrid'],
    statsZh: ['每位用戶 Top-10 推薦，延遲 <50ms', '預設過濾已收聽歌曲', '可選模型：Pop / ALS / Content / Hybrid'],
  },
  {
    id: 'eval',
    title: 'Evaluation Results',
    subtitle: 'Step 9 · Metrics',
    titleZh: '模型評估結果',
    subtitleZh: '第 9 步 · 評估指標',
    route: '/evaluation',
    anchor: 'eval-table',
    description:
      'Models are evaluated on held-out interactions. Item-similarity achieves best catalog coverage (18.8%). Content-based produces the most novel recommendations (novelty=18.1). The hybrid balances accuracy and diversity across all dimensions.',
    descriptionZh:
      '模型在 held-out 互動資料上評估。Item-Similarity 達到最佳 Coverage（18.8%）。Content-based 產生最新穎的推薦（Novelty=18.1）。Hybrid 在所有維度上均衡 Accuracy 與 Diversity。',
    stats: ['Item-Sim coverage: 18.8% of catalog', 'Content novelty: 18.1 (most obscure)', 'Metrics: Precision · nDCG · Coverage · Novelty'],
    statsZh: ['Item-Sim Coverage: 18.8% 的目錄', 'Content Novelty: 18.1（最冷門）', '指標：Precision · nDCG · Coverage · Novelty'],
  },
  {
    id: 'network-global',
    title: 'Global Artist Network',
    subtitle: 'Step 10 · Network Graph',
    titleZh: '全局藝人網絡',
    subtitleZh: '第 10 步 · 網絡圖譜',
    route: '/artists',
    anchor: 'network-graph',
    description:
      'Force-directed graph of 150 top artists — each bubble is an artist, sized by influence, colored by music community detected via Louvain algorithm.',
    descriptionZh:
      '150 位頂級藝人的 Force-directed 圖譜 — 每個圓泡代表一位藝人，大小反映影響力，顏色依 Louvain 演算法偵測的音樂社群著色。',
    stats: ['150 top artists plotted', 'Louvain community detection', 'Node size = influence score'],
    statsZh: ['150 位頂級藝人', 'Louvain 社群偵測', '節點大小 = 影響力指數'],
  },
  {
    id: 'network-sna',
    title: 'Social Network Analysis',
    subtitle: 'Step 11 · SNA Metrics',
    titleZh: '社會網絡分析',
    subtitleZh: '第 11 步 · SNA 指標',
    route: '/artists',
    anchor: 'sna-stats',
    description:
      'Betweenness centrality reveals the key connectors — artists that bridge multiple communities and act as musical "crossroads".',
    descriptionZh:
      'Betweenness Centrality 揭示關鍵節點 — 那些橫跨多個音樂社群、作為音樂「十字路口」的藝人。',
    stats: ['Betweenness centrality ranked', 'Community bridge detection', 'Cross-genre connector artists'],
    statsZh: ['Betweenness Centrality 排名', '跨社群橋接節點偵測', '跨音樂類型連結藝人'],
  },
  {
    id: 'search-facet',
    title: 'Facet Search & Filtering',
    subtitle: 'Step 12 · Discovery',
    titleZh: '多維度篩選搜尋',
    subtitleZh: '第 12 步 · 音樂探索',
    route: '/search',
    anchor: 'facet-panel',
    description:
      'Browse 10,000 tracks with multi-dimensional filters: genre, release year, energy level, and explicit content toggle.',
    descriptionZh:
      '以多維度篩選瀏覽 10,000 首歌曲：音樂類型、發行年份、Energy 範圍與成人歌詞篩選器。',
    stats: ['10,000 tracks indexed', 'Filter: genre · year · energy', 'Real-time result count updates'],
    statsZh: ['10,000 首歌曲已建立索引', '篩選條件：類型 · 年份 · Energy', '即時更新搜尋結果數量'],
  },
  {
    id: 'user-dna',
    title: 'User Music DNA',
    subtitle: 'Step 13 · Taste Profile',
    titleZh: '用戶音樂 DNA',
    subtitleZh: '第 13 步 · 品味畫像',
    route: '/analytics/dna',
    anchor: 'dna-radar',
    description:
      'Radar chart comparing your actual listening profile vs. model recommendations — visualizes taste alignment across 5 audio dimensions.',
    descriptionZh:
      '雷達圖比較用戶實際收聽畫像與模型推薦畫像 — 在 5 個 Audio 維度上視覺化品味對齊程度。',
    stats: ['5 audio dimensions compared', 'Listen profile vs. rec profile', 'Gap = model taste accuracy'],
    statsZh: ['比較 5 個 Audio 維度', '收聽畫像 vs 推薦畫像', '差異 = 模型品味準確度'],
  },
  {
    id: 'model-disagree',
    title: 'Model Disagreement Map',
    subtitle: 'Step 14 · Analytics',
    titleZh: '模型分歧地圖',
    subtitleZh: '第 14 步 · 模型分析',
    route: '/analytics/disagreement',
    anchor: 'disagree-heat',
    description:
      'Which models agree? Which diverge? The overlap heatmap reveals when collaborative vs. content models pick completely different tracks.',
    descriptionZh:
      '哪些模型意見一致？哪些分歧？重疊熱力圖揭示 Collaborative vs Content 模型何時選出截然不同的歌曲。',
    stats: ['Track-level model agreement', 'ALS vs Content overlap heatmap', 'High disagreement = niche picks'],
    statsZh: ['歌曲層級的模型共識分析', 'ALS vs Content 重疊熱力圖', '高分歧 = 冷門選擇'],
  },
  {
    id: 'popularity-bias',
    title: 'Popularity Bias',
    subtitle: 'Step 15 · Bias Analysis',
    titleZh: '熱門偏差分析',
    subtitleZh: '第 15 步 · 偏差分析',
    route: '/analytics/popularity',
    anchor: 'pop-chart',
    description:
      'See how often models recommend mainstream hits vs. niche tracks — and which model has the biggest "blockbuster bias".',
    descriptionZh:
      '觀察各模型推薦主流熱門歌曲 vs 冷門歌曲的頻率 — 以及哪個模型的「熱門偏差」最嚴重。',
    stats: ['Popularity model: 95% mainstream', 'ALS: balanced hit/niche mix', 'Content: most adventurous picks'],
    statsZh: ['Popularity 模型：95% 主流熱門', 'ALS：主流 / 冷門均衡', 'Content：最具探索性的推薦'],
  },
  {
    id: 'catalog-time',
    title: 'Catalog Timeline',
    subtitle: 'Step 16 · Temporal EDA',
    titleZh: '目錄時間線',
    subtitleZh: '第 16 步 · 時間序列分析',
    route: '/analytics/timeline',
    anchor: 'timeline-chart',
    description:
      'How music catalog coverage evolved over decades — and which genres dominated each era from 1960 to today.',
    descriptionZh:
      '音樂目錄如何跨越數十年演進 — 以及哪些音樂類型主導了從 1960 年到今日的每個時代。',
    stats: ['Coverage spans 1960–2024', 'Genre dominance per decade', 'Power-law recency bias visible'],
    statsZh: ['涵蓋年份：1960–2024', '各年代主流音樂類型', '可見明顯的近期偏差（recency bias）'],
  },
  {
    id: 'tradeoff',
    title: 'Model Tradeoff Frontier',
    subtitle: 'Step 17 · Tradeoff Space',
    titleZh: '模型權衡邊界',
    subtitleZh: '第 17 步 · 權衡分析',
    route: '/analytics/tradeoff',
    anchor: 'tradeoff-bubble',
    description:
      'Novelty × Diversity × Coverage bubble chart reveals the accuracy-discovery tradeoff every recommender system must navigate.',
    descriptionZh:
      'Novelty × Diversity × Coverage 氣泡圖揭示每個推薦系統都必須面對的準確度 vs 探索性權衡。',
    stats: ['Bubble size = catalog coverage', 'X-axis: novelty score', 'Y-axis: intra-list diversity'],
    statsZh: ['氣泡大小 = Catalog Coverage', 'X 軸：Novelty 分數', 'Y 軸：清單內多樣性 Diversity'],
  },
  {
    id: 'correlation',
    title: 'Feature Correlations',
    subtitle: 'Step 18 · Feature Analysis',
    titleZh: 'Audio Feature 相關矩陣',
    subtitleZh: '第 18 步 · 特徵分析',
    route: '/analytics/correlation',
    anchor: 'corr-matrix',
    description:
      '9×9 Pearson correlation matrix reveals hidden relationships between audio features — energy correlates with loudness, but opposes acousticness.',
    descriptionZh:
      '9×9 Pearson 相關矩陣揭示 Audio Feature 之間的隱藏關係 — Energy 與 Loudness 正相關，卻與 Acousticness 負相關。',
    stats: ['Energy ↔ Loudness: r=0.78', 'Energy ↔ Acoustic: r=−0.70', 'Dance ↔ Valence: r=0.30'],
    statsZh: ['Energy ↔ Loudness: r=0.78', 'Energy ↔ Acoustic: r=−0.70', 'Dance ↔ Valence: r=0.30'],
  },
  {
    id: 'patterns',
    title: 'Listening Patterns',
    subtitle: 'Step 19 · Temporal Patterns',
    titleZh: '收聽時間模式',
    subtitleZh: '第 19 步 · 時間行為分析',
    route: '/analytics/patterns',
    anchor: 'patterns-chart',
    description:
      'When do people listen? Hour-of-day bars and a GitHub-style heatmap reveal peak listening times and day-of-week habits.',
    descriptionZh:
      '人們何時收聽音樂？24 小時條形圖與 GitHub 風格熱力圖揭示收聽高峰時段與星期習慣。',
    stats: ['Peak hours: 20h–22h daily', 'Lunch spike: 12h–14h', 'Weekend mornings +34% vs weekday'],
    statsZh: ['每日收聽高峰：20h–22h', '午間高峰：12h–14h', '週末早晨比平日 +34%'],
  },
  {
    id: 'cohorts',
    title: 'User Cohort Taste Map',
    subtitle: 'Step 20 · Cohort Analysis',
    titleZh: '用戶群體口味地圖',
    subtitleZh: '第 20 步 · 群體分析',
    route: '/analytics/cohorts',
    anchor: 'cohorts-heat',
    description:
      'Age group × genre preference matrix — do 18-24s prefer Hip-Hop while 45-54s favor Classical? The data decides.',
    descriptionZh:
      '年齡群體 × 音樂類型偏好矩陣 — 18-24 歲是否偏好 Hip-Hop？45-54 歲是否傾向 Classical？數據說話。',
    stats: ['5 age groups × 6 genres', '18-24: Hip-Hop 92% affinity', '55+: Classical 90% affinity'],
    statsZh: ['5 個年齡群體 × 6 種音樂類型', '18-24 歲：Hip-Hop 92% 偏好度', '55+ 歲：Classical 90% 偏好度'],
  },
  {
    id: 'geography',
    title: 'Geographic Distribution',
    subtitle: 'Step 21 · Geo Analysis',
    titleZh: '地理分佈分析',
    subtitleZh: '第 21 步 · 地理分析',
    route: '/analytics/geography',
    anchor: 'geography-chart',
    description:
      'Artist count broken down by country of origin, with dominant genre per region. Reveals market concentration and the global spread of music production — which countries punch above their weight in the catalog.',
    descriptionZh:
      '依來源國統計藝人數量，並呈現各地區主流音樂類型。揭示市場集中度與全球音樂製作的分布 — 哪些國家在目錄中的佔比超出預期。',
    stats: ['Country-level artist aggregation', 'Top genre per region', 'Ranked by artist count'],
    statsZh: ['國家層級藝人統計', '各地區主流音樂類型', '依藝人數量排序'],
  },
  {
    id: 'pipeline',
    title: 'Run Your Own Pipeline',
    subtitle: 'Step 22 · End-to-End',
    titleZh: '執行自己的 Pipeline',
    subtitleZh: '第 22 步 · 端到端',
    route: '/upload',
    anchor: 'pipeline-runner',
    description:
      'Upload your own listening data or use the sample dataset to retrain all 5 models end-to-end and explore your personal recommendations.',
    descriptionZh:
      '上傳自己的收聽資料或使用範例資料集，端到端重新訓練所有 5 種模型，探索個人化推薦結果。',
    stats: ['CSV upload or sample dataset', 'All 5 models retrained live', 'Full pipeline: ~30 seconds'],
    statsZh: ['CSV 上傳或使用範例資料集', '即時重新訓練全部 5 種模型', '完整 Pipeline：~30 秒'],
  },
]
