---
title: Web Performance Optimization - Complete Guide
created: 2026-02-06
updated: 2026-02-13
tags: ["performance", "web", "optimization", "frontend", "core-web-vitals"]
related_logs: []
ai_refined: true
---

# Web Performance Optimization - Complete Guide


# Web Performance Optimization

## Table of Contents

1. Introduction to Web Performance
2. Core Web Vitals
3. Loading Performance
4. Rendering Performance
5. JavaScript Optimization
6. CSS Optimization
7. Image and Media Optimization
8. Network Optimization
9. Caching Strategies
10. Performance Monitoring
11. Advanced Techniques
12. Case Studies

## 1. Introduction to Web Performance

### 1.1 Why Performance Matters

**Business Impact:**
- 1 second delay = 7% reduction in conversions
- 53% of mobile users abandon sites that take > 3 seconds to load
- Google uses page speed as a ranking factor
- Amazon found every 100ms of latency cost 1% in sales

**User Experience:**
- Fast sites feel more reliable
- Better engagement and retention
- Improved accessibility
- Lower bounce rates

**Technical Benefits:**
- Reduced server costs
- Better SEO rankings
- Improved mobile experience
- Lower bandwidth usage

### 1.2 Performance Budget

Set measurable targets for your application:

```javascript
// performance-budget.json
{
  "timings": {
    "firstContentfulPaint": 1500,
    "largestContentfulPaint": 2500,
    "timeToInteractive": 3500,
    "totalBlockingTime": 300,
    "cumulativeLayoutShift": 0.1
  },
  "resourceSizes": {
    "javascript": 300000,
    "css": 50000,
    "images": 500000,
    "fonts": 100000,
    "total": 1000000
  },
  "resourceCounts": {
    "scripts": 10,
    "stylesheets": 5,
    "fonts": 3,
    "images": 20
  }
}
```

## 2. Core Web Vitals

### 2.1 Largest Contentful Paint (LCP)

**Definition:** Time until the largest content element is rendered

**Target:** < 2.5 seconds

**Common Issues:**
- Slow server response times
- Render-blocking resources
- Slow resource load times
- Client-side rendering

**Optimization Strategies:**

**1. Optimize Server Response Time:**
```javascript
// Use CDN for static assets
const cdnUrl = 'https://cdn.example.com';

// Implement caching headers
res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

// Use HTTP/2 or HTTP/3
// Enable compression (gzip, brotli)
```

**2. Preload Critical Resources:**
```html
<!-- Preload hero image -->
<link rel="preload" as="image" href="/hero.jpg" />

<!-- Preload critical fonts -->
<link rel="preload" as="font" type="font/woff2" 
      href="/fonts/main.woff2" crossorigin />

<!-- Preload critical CSS -->
<link rel="preload" as="style" href="/critical.css" />
```

**3. Optimize Images:**
```html
<!-- Use modern formats -->
<picture>
  <source srcset="hero.avif" type="image/avif" />
  <source srcset="hero.webp" type="image/webp" />
  <img src="hero.jpg" alt="Hero" width="1200" height="600" />
</picture>

<!-- Responsive images -->
<img srcset="small.jpg 400w, medium.jpg 800w, large.jpg 1200w"
     sizes="(max-width: 600px) 400px, (max-width: 1200px) 800px, 1200px"
     src="large.jpg" alt="Responsive" />
```

**4. Server-Side Rendering:**
```typescript
// Next.js example
export async function getServerSideProps() {
  const data = await fetchData();
  return { props: { data } };
}

export default function Page({ data }) {
  return <div>{data.content}</div>;
}
```

### 2.2 First Input Delay (FID)

**Definition:** Time from user interaction to browser response

**Target:** < 100 milliseconds

**Common Issues:**
- Heavy JavaScript execution
- Long tasks blocking main thread
- Large bundles
- Unoptimized third-party scripts

**Optimization Strategies:**

**1. Code Splitting:**
```javascript
// Dynamic imports
const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <HeavyComponent />
    </Suspense>
  );
}
```

**2. Break Up Long Tasks:**
```javascript
// Bad: Long synchronous task
function processLargeArray(items) {
  items.forEach(item => {
    // Heavy processing
    processItem(item);
  });
}

// Good: Break into chunks
async function processLargeArray(items) {
  const chunkSize = 100;
  
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    
    await new Promise(resolve => {
      requestIdleCallback(() => {
        chunk.forEach(processItem);
        resolve();
      });
    });
  }
}
```

**3. Web Workers:**
```javascript
// main.js
const worker = new Worker('worker.js');

worker.postMessage({ data: largeDataset });

worker.onmessage = (e) => {
  console.log('Result:', e.data);
};

// worker.js
self.onmessage = (e) => {
  const result = heavyComputation(e.data);
  self.postMessage(result);
};
```

**4. Optimize Third-Party Scripts:**
```html
<!-- Defer non-critical scripts -->
<script src="analytics.js" defer></script>

<!-- Async for independent scripts -->
<script src="ads.js" async></script>

<!-- Use facade pattern for heavy embeds -->
<div id="youtube-facade" data-video-id="abc123">
  <img src="thumbnail.jpg" />
  <button onclick="loadYouTube()">Play Video</button>
</div>
```

### 2.3 Cumulative Layout Shift (CLS)

**Definition:** Sum of all unexpected layout shifts

**Target:** < 0.1

**Common Issues:**
- Images without dimensions
- Ads/embeds/iframes without reserved space
- Web fonts causing FOIT/FOUT
- Dynamic content injection

**Optimization Strategies:**

**1. Set Image Dimensions:**
```html
<!-- Always specify width and height -->
<img src="photo.jpg" width="800" height="600" alt="Photo" />

<!-- Use aspect-ratio CSS -->
<style>
  .image-container {
    aspect-ratio: 16 / 9;
  }
  .image-container img {
    width: 100%;
    height: auto;
  }
</style>
```

**2. Reserve Space for Ads:**
```css
.ad-slot {
  min-height: 250px;
  background: #f0f0f0;
}

.ad-slot::before {
  content: 'Advertisement';
  display: block;
  text-align: center;
  padding: 20px;
  color: #999;
}
```

**3. Font Loading Strategies:**
```css
/* Use font-display */
@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/custom.woff2') format('woff2');
  font-display: swap; /* or optional, fallback */
}

/* Preload critical fonts */
```

```html
<link rel="preload" as="font" type="font/woff2"
      href="/fonts/custom.woff2" crossorigin />
```

**4. Avoid Dynamic Content Insertion:**
```javascript
// Bad: Inserting content without reserved space
function showBanner() {
  const banner = document.createElement('div');
  banner.innerHTML = 'Important message!';
  document.body.insertBefore(banner, document.body.firstChild);
}

// Good: Use fixed position or reserve space
function showBanner() {
  const banner = document.getElementById('banner-placeholder');
  banner.style.display = 'block';
  banner.innerHTML = 'Important message!';
}
```

## 3. Loading Performance

### 3.1 Critical Rendering Path

**Understanding the Process:**
```
1. HTML parsing → DOM construction
2. CSS parsing → CSSOM construction
3. DOM + CSSOM → Render Tree
4. Layout calculation
5. Paint
6. Composite
```

**Optimization:**

**1. Minimize Critical Resources:**
```html
<!-- Inline critical CSS -->
<style>
  /* Above-the-fold styles */
  body { margin: 0; font-family: sans-serif; }
  .header { background: #333; color: white; }
</style>

<!-- Load non-critical CSS asynchronously -->
<link rel="preload" as="style" href="non-critical.css"
      onload="this.onload=null;this.rel='stylesheet'" />
```

**2. Defer Non-Critical JavaScript:**
```html
<!-- Critical inline script -->
<script>
  // Minimal code for initial render
  window.APP_CONFIG = { apiUrl: '/api' };
</script>

<!-- Defer everything else -->
<script src="app.js" defer></script>
```

### 3.2 Resource Hints

**DNS Prefetch:**
```html
<!-- Resolve DNS early for external domains -->
<link rel="dns-prefetch" href="https://api.example.com" />
<link rel="dns-prefetch" href="https://cdn.example.com" />
```

**Preconnect:**
```html
<!-- Establish early connection -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
```

**Prefetch:**
```html
<!-- Fetch resources for next navigation -->
<link rel="prefetch" href="/next-page.html" />
<link rel="prefetch" href="/next-page-data.json" />
```

**Preload:**
```html
<!-- High-priority resource loading -->
<link rel="preload" as="script" href="critical.js" />
<link rel="preload" as="image" href="hero.jpg" />
```

### 3.3 Lazy Loading

**Images:**
```html
<!-- Native lazy loading -->
<img src="image.jpg" loading="lazy" alt="Lazy loaded" />

<!-- Intersection Observer for custom logic -->
<img data-src="image.jpg" class="lazy" alt="Custom lazy" />
```

```javascript
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      img.classList.remove('lazy');
      observer.unobserve(img);
    }
  });
});

document.querySelectorAll('img.lazy').forEach(img => {
  observer.observe(img);
});
```

**Components:**
```javascript
// React lazy loading
const HeavyChart = lazy(() => import('./HeavyChart'));

function Dashboard() {
  return (
    <Suspense fallback={<Skeleton />}>
      <HeavyChart data={data} />
    </Suspense>
  );
}
```

## 4. Rendering Performance

### 4.1 Avoid Layout Thrashing

**Bad Practice:**
```javascript
// Reading and writing DOM in loop causes reflow
elements.forEach(el => {
  const height = el.offsetHeight; // Read (reflow)
  el.style.height = height + 10 + 'px'; // Write (reflow)
});
```

**Good Practice:**
```javascript
// Batch reads, then batch writes
const heights = elements.map(el => el.offsetHeight);
elements.forEach((el, i) => {
  el.style.height = heights[i] + 10 + 'px';
});
```

### 4.2 Use CSS Transforms

**Bad (triggers layout):**
```css
.box {
  position: absolute;
  left: 0;
  transition: left 0.3s;
}
.box:hover {
  left: 100px; /* Triggers layout */
}
```

**Good (GPU accelerated):**
```css
.box {
  transform: translateX(0);
  transition: transform 0.3s;
  will-change: transform;
}
.box:hover {
  transform: translateX(100px); /* Composite only */
}
```

### 4.3 RequestAnimationFrame

```javascript
// Bad: Direct DOM manipulation
function animate() {
  element.style.left = element.offsetLeft + 1 + 'px';
  setTimeout(animate, 16);
}

// Good: Sync with browser paint
function animate() {
  element.style.left = element.offsetLeft + 1 + 'px';
  requestAnimationFrame(animate);
}
```

### 4.4 Virtual Scrolling

```javascript
// React Window example
import { FixedSizeList } from 'react-window';

function VirtualList({ items }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          {items[index].name}
        </div>
      )}
    </FixedSizeList>
  );
}
```

## 5. JavaScript Optimization

### 5.1 Tree Shaking

**Enable in Webpack:**
```javascript
// webpack.config.js
module.exports = {
  mode: 'production',
  optimization: {
    usedExports: true,
    sideEffects: false
  }
};
```

**Package.json:**
```json
{
  "sideEffects": false
}
```

**Import Specific Functions:**
```javascript
// Bad: Imports entire library
import _ from 'lodash';

// Good: Import specific function
import debounce from 'lodash/debounce';

// Better: Use lodash-es for tree shaking
import { debounce } from 'lodash-es';
```

### 5.2 Code Splitting

**Route-based:**
```javascript
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

function App() {
  return (
    <Router>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
```

**Component-based:**
```javascript
// Load heavy component only when needed
function ProductPage() {
  const [show3D, setShow3D] = useState(false);
  
  return (
    <div>
      <button onClick={() => setShow3D(true)}>
        View 3D Model
      </button>
      
      {show3D && (
        <Suspense fallback={<Loading />}>
          <Heavy3DViewer />
        </Suspense>
      )}
    </div>
  );
}
```

### 5.3 Debouncing and Throttling

```javascript
// Debounce: Execute after delay
function debounce(func, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

// Usage: Search input
const handleSearch = debounce((query) => {
  fetchResults(query);
}, 300);

// Throttle: Execute at most once per interval
function throttle(func, interval) {
  let lastTime = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastTime >= interval) {
      lastTime = now;
      func.apply(this, args);
    }
  };
}

// Usage: Scroll handler
const handleScroll = throttle(() => {
  updateScrollPosition();
}, 100);
```

## 6. CSS Optimization

### 6.1 Critical CSS

**Extract and Inline:**
```javascript
// Using critical package
const critical = require('critical');

critical.generate({
  inline: true,
  base: 'dist/',
  src: 'index.html',
  target: 'index-critical.html',
  width: 1300,
  height: 900
});
```

### 6.2 Remove Unused CSS

**PurgeCSS:**
```javascript
// postcss.config.js
module.exports = {
  plugins: [
    require('@fullhuman/postcss-purgecss')({
      content: ['./src/**/*.html', './src/**/*.js'],
      defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || []
    })
  ]
};
```

### 6.3 CSS Containment

```css
/* Limit layout recalculation scope */
.card {
  contain: layout style paint;
}

/* For independent components */
.widget {
  contain: strict;
}
```

## 7. Image and Media Optimization

### 7.1 Modern Image Formats

**AVIF and WebP:**
```html
<picture>
  <source srcset="image.avif" type="image/avif" />
  <source srcset="image.webp" type="image/webp" />
  <img src="image.jpg" alt="Optimized" />
</picture>
```

**Compression:**
```bash
# ImageMagick
convert input.jpg -quality 85 output.jpg

# cwebp for WebP
cwebp -q 80 input.jpg -o output.webp

# avif
avifenc --min 0 --max 63 -a end-usage=q -a cq-level=18 input.jpg output.avif
```

### 7.2 Responsive Images

```html
<img
  srcset="small.jpg 400w,
          medium.jpg 800w,
          large.jpg 1200w,
          xlarge.jpg 1600w"
  sizes="(max-width: 600px) 400px,
         (max-width: 1000px) 800px,
         (max-width: 1400px) 1200px,
         1600px"
  src="large.jpg"
  alt="Responsive image"
/>
```

### 7.3 Video Optimization

```html
<!-- Lazy load video -->
<video preload="none" poster="thumbnail.jpg" controls>
  <source src="video.webm" type="video/webm" />
  <source src="video.mp4" type="video/mp4" />
</video>

<!-- Autoplay with intersection observer -->
<video muted loop playsinline data-autoplay>
  <source src="background.mp4" type="video/mp4" />
</video>
```

```javascript
const videos = document.querySelectorAll('[data-autoplay]');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.play();
    } else {
      entry.target.pause();
    }
  });
});

videos.forEach(video => observer.observe(video));
```

## 8. Network Optimization

### 8.1 HTTP/2 and HTTP/3

**Benefits:**
- Multiplexing (multiple requests over single connection)
- Server push
- Header compression
- Binary protocol

**Enable in Nginx:**
```nginx
server {
  listen 443 ssl http2;
  listen [::]:443 ssl http2;
  
  # HTTP/3
  listen 443 quic reuseport;
  add_header Alt-Svc 'h3=":443"; ma=86400';
}
```

### 8.2 Compression

**Brotli and Gzip:**
```nginx
# Nginx configuration
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1000;

brotli on;
brotli_types text/plain text/css application/json application/javascript;
```

**Dynamic Compression:**
```javascript
// Express.js
const compression = require('compression');
app.use(compression());
```

### 8.3 CDN Strategy

**Multi-CDN Setup:**
```javascript
const cdnUrls = {
  primary: 'https://cdn1.example.com',
  fallback: 'https://cdn2.example.com',
  origin: 'https://origin.example.com'
};

function getAssetUrl(path) {
  return `${cdnUrls.primary}${path}`;
}

// Fallback on error
function handleCDNError(img) {
  if (img.src.includes(cdnUrls.primary)) {
    img.src = img.src.replace(cdnUrls.primary, cdnUrls.fallback);
  } else {
    img.src = img.src.replace(cdnUrls.fallback, cdnUrls.origin);
  }
}
```

## 9. Caching Strategies

### 9.1 HTTP Caching

**Cache-Control Headers:**
```javascript
// Immutable assets (with hash in filename)
res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

// HTML (always revalidate)
res.setHeader('Cache-Control', 'no-cache');

// API responses (short cache)
res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600');
```

### 9.2 Service Worker Caching

```javascript
// service-worker.js
const CACHE_NAME = 'v1';
const urlsToCache = [
  '/',
  '/styles/main.css',
  '/scripts/main.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit
        if (response) {
          return response;
        }
        
        // Fetch from network
        return fetch(event.request).then(response => {
          // Cache new responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        });
      })
  );
});
```

### 9.3 Application Cache

**LocalStorage/IndexedDB:**
```javascript
// Cache API responses
async function fetchWithCache(url, options = {}) {
  const cacheKey = `cache_${url}`;
  const cached = localStorage.getItem(cacheKey);
  
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;
    
    // Return cached if less than 5 minutes old
    if (age < 5 * 60 * 1000) {
      return data;
    }
  }
  
  const response = await fetch(url, options);
  const data = await response.json();
  
  localStorage.setItem(cacheKey, JSON.stringify({
    data,
    timestamp: Date.now()
  }));
  
  return data;
}
```

## 10. Performance Monitoring

### 10.1 Real User Monitoring (RUM)

```javascript
// Web Vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  const body = JSON.stringify(metric);
  
  // Use sendBeacon if available
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/analytics', body);
  } else {
    fetch('/analytics', { body, method: 'POST', keepalive: true });
  }
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

### 10.2 Performance Observer

```javascript
// Monitor long tasks
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.warn('Long task detected:', {
      duration: entry.duration,
      startTime: entry.startTime
    });
  }
});

observer.observe({ entryTypes: ['longtask'] });

// Monitor resource timing
const resourceObserver = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.duration > 1000) {
      console.warn('Slow resource:', entry.name, entry.duration);
    }
  }
});

resourceObserver.observe({ entryTypes: ['resource'] });
```

### 10.3 Lighthouse CI

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [push]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            https://example.com
            https://example.com/about
          uploadArtifacts: true
```

## 11. Advanced Techniques

### 11.1 Predictive Prefetching

```javascript
// Prefetch on hover
document.querySelectorAll('a').forEach(link => {
  link.addEventListener('mouseenter', () => {
    const url = link.href;
    const prefetch = document.createElement('link');
    prefetch.rel = 'prefetch';
    prefetch.href = url;
    document.head.appendChild(prefetch);
  });
});

// ML-based prefetching (using quicklink)
import quicklink from 'quicklink';

quicklink.listen({
  threshold: 0.5, // Prefetch when 50% visible
  timeout: 2000
});
```

### 11.2 Edge Computing

```javascript
// Cloudflare Workers
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const cache = caches.default;
  let response = await cache.match(request);
  
  if (!response) {
    response = await fetch(request);
    
    // Cache for 1 hour
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', 'public, max-age=3600');
    
    response = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
    
    event.waitUntil(cache.put(request, response.clone()));
  }
  
  return response;
}
```

### 11.3 Progressive Hydration

```javascript
// React Server Components + Selective Hydration
import { lazy, Suspense } from 'react';

// Server Component (no JS sent to client)
async function ServerComponent() {
  const data = await fetchData();
  return <div>{data.content}</div>;
}

// Client Component (hydrated on demand)
const InteractiveWidget = lazy(() => import('./InteractiveWidget'));

export default function Page() {
  return (
    <>
      <ServerComponent />
      <Suspense fallback={<div>Loading...</div>}>
        <InteractiveWidget />
      </Suspense>
    </>
  );
}
```

## 12. Case Studies

### 12.1 E-commerce Site Optimization

**Before:**
- LCP: 4.2s
- FID: 180ms
- CLS: 0.25
- Bounce rate: 45%

**Optimizations Applied:**
1. Implemented image lazy loading
2. Added critical CSS inlining
3. Enabled Brotli compression
4. Implemented service worker caching
5. Optimized third-party scripts

**After:**
- LCP: 1.8s (57% improvement)
- FID: 65ms (64% improvement)
- CLS: 0.08 (68% improvement)
- Bounce rate: 28% (38% reduction)
- Conversion rate: +23%

### 12.2 News Website Optimization

**Before:**
- Page weight: 3.2 MB
- Load time: 8.5s
- 127 requests

**Optimizations Applied:**
1. Implemented responsive images
2. Lazy loaded ads and embeds
3. Removed unused CSS (reduced by 70%)
4. Implemented HTTP/2 push
5. Added CDN for static assets

**After:**
- Page weight: 890 KB (72% reduction)
- Load time: 2.1s (75% improvement)
- 43 requests (66% reduction)
- Page views per session: +35%

## Conclusion

Web performance optimization is an ongoing process that requires:

1. **Measurement**: Use tools like Lighthouse, WebPageTest, Chrome DevTools
2. **Prioritization**: Focus on Core Web Vitals and user-centric metrics
3. **Implementation**: Apply techniques systematically
4. **Monitoring**: Track real user metrics continuously
5. **Iteration**: Continuously improve based on data

Remember: Every millisecond counts. Fast sites provide better user experience, higher engagement, and improved business outcomes.

## Tools and Resources

**Performance Testing:**
- Lighthouse
- WebPageTest
- Chrome DevTools
- PageSpeed Insights

**Monitoring:**
- Google Analytics
- New Relic
- Datadog
- Sentry Performance

**Optimization:**
- ImageOptim
- Squoosh
- Webpack Bundle Analyzer
- PurgeCSS

**Learning:**
- web.dev
- MDN Performance Guide
- High Performance Browser Networking
- Designing for Performance

> Performance is not a feature, it's a requirement.


> 本文档由 Clawdbot 在对话中自动生成并命名。

> 本文档由 Clawdbot 在对话中自动生成并命名。