---
title: React Performance Optimization - Advanced Guide
created: 2026-02-12
updated: 2026-02-12
tags: ["react", "performance", "optimization", "frontend", "javascript"]
summary: Comprehensive guide to React performance optimization including memoization, code splitting, lazy loading, rendering optimization, and advanced patterns for building high-performance React applications
ai_refined: true
---

# React Performance Optimization - Advanced Guide

## Table of Contents

1. Understanding React Performance
2. Rendering Optimization
3. State Management Performance
4. Code Splitting and Lazy Loading
5. Memoization Techniques
6. Virtual Lists and Windowing
7. Image and Asset Optimization
8. Network Performance
9. Bundle Size Optimization
10. Performance Monitoring
11. Advanced Patterns
12. Real-World Case Studies

## 1. Understanding React Performance

### 1.1 React Rendering Process

**Render Phase:**
```
State/Props Change
    ↓
Component Re-render
    ↓
Virtual DOM Creation
    ↓
Reconciliation (Diffing)
    ↓
Commit Phase
    ↓
DOM Updates
```

**Key Concepts:**
- React re-renders when state or props change
- Virtual DOM minimizes actual DOM operations
- Reconciliation algorithm determines what changed
- Batching groups multiple updates

### 1.2 Common Performance Issues

**Unnecessary Re-renders:**
```javascript
// Problem: Parent re-renders cause all children to re-render
function Parent() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <button onClick={() => setCount(count + 1)}>Count: {count}</button>
      <ExpensiveChild /> {/* Re-renders even though props didn't change */}
    </div>
  );
}
```

**Large Component Trees:**
- Deep nesting causes cascading re-renders
- Props drilling through many levels
- Context updates affecting many components

**Heavy Computations:**
- Expensive calculations on every render
- Large data transformations
- Complex filtering/sorting operations

### 1.3 Performance Metrics

**Key Metrics to Track:**
- Time to Interactive (TTI)
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Component render time
- Re-render frequency

**Measuring Performance:**
```javascript
// React DevTools Profiler
import { Profiler } from 'react';

function onRenderCallback(
  id, // component id
  phase, // "mount" or "update"
  actualDuration, // time spent rendering
  baseDuration, // estimated time without memoization
  startTime,
  commitTime,
  interactions
) {
  console.log(`${id} took ${actualDuration}ms to render`);
}

<Profiler id="App" onRender={onRenderCallback}>
  <App />
</Profiler>
```

## 2. Rendering Optimization

### 2.1 React.memo

**Basic Usage:**
```javascript
const ExpensiveComponent = React.memo(({ data, onAction }) => {
  console.log('ExpensiveComponent rendered');
  
  return (
    <div>
      <h2>{data.title}</h2>
      <p>{data.description}</p>
      <button onClick={onAction}>Action</button>
    </div>
  );
});
```

**Custom Comparison:**
```javascript
const UserCard = React.memo(
  ({ user, onEdit }) => {
    return (
      <div>
        <h3>{user.name}</h3>
        <p>{user.email}</p>
        <button onClick={() => onEdit(user.id)}>Edit</button>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Return true if props are equal (skip re-render)
    return (
      prevProps.user.id === nextProps.user.id &&
      prevProps.user.name === nextProps.user.name &&
      prevProps.user.email === nextProps.user.email
    );
  }
);
```

**When to Use React.memo:**
- Component renders often with same props
- Component is expensive to render
- Component is pure (same props = same output)

**When NOT to Use:**
- Props change frequently
- Component is cheap to render
- Premature optimization

### 2.2 useMemo Hook

**Expensive Calculations:**
```javascript
function DataTable({ data, filters }) {
  // Without useMemo: Recalculates on every render
  // const filteredData = data.filter(item => 
  //   filters.every(f => f.test(item))
  // );
  
  // With useMemo: Only recalculates when dependencies change
  const filteredData = useMemo(() => {
    console.log('Filtering data...');
    return data.filter(item => 
      filters.every(f => f.test(item))
    );
  }, [data, filters]);
  
  const sortedData = useMemo(() => {
    console.log('Sorting data...');
    return [...filteredData].sort((a, b) => 
      a.name.localeCompare(b.name)
    );
  }, [filteredData]);
  
  return (
    <table>
      {sortedData.map(item => (
        <tr key={item.id}>
          <td>{item.name}</td>
          <td>{item.value}</td>
        </tr>
      ))}
    </table>
  );
}
```

**Complex Derived State:**
```javascript
function Dashboard({ transactions }) {
  const statistics = useMemo(() => {
    console.log('Calculating statistics...');
    
    return {
      total: transactions.reduce((sum, t) => sum + t.amount, 0),
      average: transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length,
      byCategory: transactions.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {}),
      byMonth: transactions.reduce((acc, t) => {
        const month = new Date(t.date).getMonth();
        acc[month] = (acc[month] || 0) + t.amount;
        return acc;
      }, {})
    };
  }, [transactions]);
  
  return (
    <div>
      <h2>Total: ${statistics.total}</h2>
      <h3>Average: ${statistics.average}</h3>
      <CategoryChart data={statistics.byCategory} />
      <MonthlyChart data={statistics.byMonth} />
    </div>
  );
}
```

**Object/Array Creation:**
```javascript
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  
  // Memoize object to prevent child re-renders
  const userConfig = useMemo(() => ({
    id: userId,
    theme: 'dark',
    permissions: ['read', 'write']
  }), [userId]);
  
  return <UserSettings config={userConfig} />;
}
```

### 2.3 useCallback Hook

**Preventing Function Recreation:**
```javascript
function TodoList({ todos }) {
  const [filter, setFilter] = useState('all');
  
  // Without useCallback: New function on every render
  // const handleDelete = (id) => {
  //   deleteTodo(id);
  // };
  
  // With useCallback: Stable function reference
  const handleDelete = useCallback((id) => {
    deleteTodo(id);
  }, []); // No dependencies - function never changes
  
  const handleToggle = useCallback((id) => {
    toggleTodo(id);
  }, []);
  
  const filteredTodos = useMemo(() => {
    return todos.filter(todo => {
      if (filter === 'active') return !todo.completed;
      if (filter === 'completed') return todo.completed;
      return true;
    });
  }, [todos, filter]);
  
  return (
    <div>
      <FilterButtons filter={filter} setFilter={setFilter} />
      {filteredTodos.map(todo => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onDelete={handleDelete}
          onToggle={handleToggle}
        />
      ))}
    </div>
  );
}

// TodoItem is memoized, so stable callbacks prevent re-renders
const TodoItem = React.memo(({ todo, onDelete, onToggle }) => {
  console.log('TodoItem rendered:', todo.id);
  
  return (
    <div>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
      />
      <span>{todo.text}</span>
      <button onClick={() => onDelete(todo.id)}>Delete</button>
    </div>
  );
});
```

**Event Handlers with Dependencies:**
```javascript
function SearchBar({ onSearch, debounceMs = 300 }) {
  const [query, setQuery] = useState('');
  
  // Debounced search with useCallback
  const debouncedSearch = useCallback(
    debounce((searchQuery) => {
      onSearch(searchQuery);
    }, debounceMs),
    [onSearch, debounceMs]
  );
  
  const handleChange = useCallback((e) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  }, [debouncedSearch]);
  
  return (
    <input
      type="text"
      value={query}
      onChange={handleChange}
      placeholder="Search..."
    />
  );
}
```

### 2.4 Component Splitting

**Extract Static Content:**
```javascript
// Before: Entire component re-renders
function ProductPage({ product }) {
  const [quantity, setQuantity] = useState(1);
  
  return (
    <div>
      <ProductHeader title={product.name} />
      <ProductImages images={product.images} />
      <ProductDescription text={product.description} />
      <QuantitySelector value={quantity} onChange={setQuantity} />
      <AddToCartButton product={product} quantity={quantity} />
    </div>
  );
}

// After: Only QuantitySelector re-renders
const ProductHeader = React.memo(({ title }) => <h1>{title}</h1>);
const ProductImages = React.memo(({ images }) => (
  <div>{images.map(img => <img key={img} src={img} />)}</div>
));
const ProductDescription = React.memo(({ text }) => <p>{text}</p>);

function QuantitySelector({ value, onChange }) {
  return (
    <div>
      <button onClick={() => onChange(value - 1)}>-</button>
      <span>{value}</span>
      <button onClick={() => onChange(value + 1)}>+</button>
    </div>
  );
}
```

**Lift State Down:**
```javascript
// Before: count state causes entire form to re-render
function Form() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <input value={name} onChange={e => setName(e.target.value)} />
      <input value={email} onChange={e => setEmail(e.target.value)} />
      <Counter count={count} setCount={setCount} />
    </div>
  );
}

// After: count state isolated in Counter component
function Form() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  
  return (
    <div>
      <input value={name} onChange={e => setName(e.target.value)} />
      <input value={email} onChange={e => setEmail(e.target.value)} />
      <Counter />
    </div>
  );
}

function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <button onClick={() => setCount(count - 1)}>-</button>
      <span>{count}</span>
      <button onClick={() => setCount(count + 1)}>+</button>
    </div>
  );
}
```

## 3. State Management Performance

### 3.1 Context Optimization

**Problem: Context Updates Cause All Consumers to Re-render:**
```javascript
// Bad: Single context with all state
const AppContext = createContext();

function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('light');
  const [notifications, setNotifications] = useState([]);
  
  return (
    <AppContext.Provider value={{ user, setUser, theme, setTheme, notifications, setNotifications }}>
      {children}
    </AppContext.Provider>
  );
}

// Any component using context re-renders when ANY value changes
```

**Solution: Split Contexts:**
```javascript
// Good: Separate contexts for different concerns
const UserContext = createContext();
const ThemeContext = createContext();
const NotificationsContext = createContext();

function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('light');
  const [notifications, setNotifications] = useState([]);
  
  return (
    <UserContext.Provider value={{ user, setUser }}>
      <ThemeContext.Provider value={{ theme, setTheme }}>
        <NotificationsContext.Provider value={{ notifications, setNotifications }}>
          {children}
        </NotificationsContext.Provider>
      </ThemeContext.Provider>
    </UserContext.Provider>
  );
}

// Components only re-render when their specific context changes
function UserProfile() {
  const { user } = useContext(UserContext); // Only re-renders on user changes
  return <div>{user?.name}</div>;
}
```

**Separate State and Dispatch:**
```javascript
const StateContext = createContext();
const DispatchContext = createContext();

function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        {children}
      </DispatchContext.Provider>
    </StateContext.Provider>
  );
}

// Components using only dispatch don't re-render on state changes
function AddButton() {
  const dispatch = useContext(DispatchContext);
  return <button onClick={() => dispatch({ type: 'ADD' })}>Add</button>;
}
```

### 3.2 Zustand for Performance

```javascript
import create from 'zustand';

// Create store with selectors
const useStore = create((set) => ({
  user: null,
  theme: 'light',
  notifications: [],
  
  setUser: (user) => set({ user }),
  setTheme: (theme) => set({ theme }),
  addNotification: (notification) => 
    set((state) => ({ 
      notifications: [...state.notifications, notification] 
    }))
}));

// Components only re-render when selected state changes
function UserProfile() {
  const user = useStore((state) => state.user); // Only re-renders on user change
  return <div>{user?.name}</div>;
}

function ThemeToggle() {
  const theme = useStore((state) => state.theme);
  const setTheme = useStore((state) => state.setTheme);
  
  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      Toggle Theme
    </button>
  );
}
```

### 3.3 React Query for Server State

```javascript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Fetch data with caching
function UserList() {
  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000 // 10 minutes
  });
  
  if (isLoading) return <Loading />;
  
  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}

// Mutations with optimistic updates
function UpdateUserButton({ userId }) {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: updateUser,
    onMutate: async (newUser) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['users', userId] });
      
      // Snapshot previous value
      const previousUser = queryClient.getQueryData(['users', userId]);
      
      // Optimistically update
      queryClient.setQueryData(['users', userId], newUser);
      
      return { previousUser };
    },
    onError: (err, newUser, context) => {
      // Rollback on error
      queryClient.setQueryData(['users', userId], context.previousUser);
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: ['users', userId] });
    }
  });
  
  return (
    <button onClick={() => mutation.mutate({ name: 'New Name' })}>
      Update
    </button>
  );
}
```

## 4. Code Splitting and Lazy Loading

### 4.1 Route-Based Code Splitting

```javascript
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Lazy load route components
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

### 4.2 Component-Based Code Splitting

```javascript
// Load heavy components on demand
function ProductPage({ product }) {
  const [show3DView, setShow3DView] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  
  return (
    <div>
      <ProductInfo product={product} />
      
      <button onClick={() => setShow3DView(true)}>
        View 3D Model
      </button>
      
      {show3DView && (
        <Suspense fallback={<Loading />}>
          <Heavy3DViewer model={product.model} />
        </Suspense>
      )}
      
      <button onClick={() => setShowReviews(true)}>
        Load Reviews
      </button>
      
      {showReviews && (
        <Suspense fallback={<Loading />}>
          <ReviewsList productId={product.id} />
        </Suspense>
      )}
    </div>
  );
}

const Heavy3DViewer = lazy(() => import('./Heavy3DViewer'));
const ReviewsList = lazy(() => import('./ReviewsList'));
```

### 4.3 Library Code Splitting

```javascript
// Split heavy libraries
const ChartComponent = lazy(() => 
  import('recharts').then(module => ({
    default: module.LineChart
  }))
);

// Conditional loading
async function exportToExcel(data) {
  const XLSX = await import('xlsx');
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  XLSX.writeFile(workbook, 'export.xlsx');
}
```

### 4.4 Prefetching

```javascript
import { Link } from 'react-router-dom';

// Prefetch on hover
function NavigationLink({ to, children }) {
  const prefetch = () => {
    // Dynamically import the component
    import(`./pages/${to}`);
  };
  
  return (
    <Link to={to} onMouseEnter={prefetch}>
      {children}
    </Link>
  );
}

// Prefetch with Intersection Observer
function ProductCard({ product }) {
  const ref = useRef();
  
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        // Prefetch product details page
        import('./pages/ProductDetails');
      }
    });
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  return (
    <div ref={ref}>
      <h3>{product.name}</h3>
      <Link to={`/products/${product.id}`}>View Details</Link>
    </div>
  );
}
```

## 5. Virtual Lists and Windowing

### 5.1 React Window

```javascript
import { FixedSizeList } from 'react-window';

function VirtualizedList({ items }) {
  const Row = ({ index, style }) => (
    <div style={style} className="list-item">
      <h4>{items[index].title}</h4>
      <p>{items[index].description}</p>
    </div>
  );
  
  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={80}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}
```

### 5.2 Variable Size Lists

```javascript
import { VariableSizeList } from 'react-window';

function VariableList({ items }) {
  const listRef = useRef();
  
  const getItemSize = (index) => {
    // Calculate dynamic height based on content
    return items[index].expanded ? 200 : 80;
  };
  
  const Row = ({ index, style }) => {
    const item = items[index];
    
    return (
      <div style={style}>
        <h4>{item.title}</h4>
        {item.expanded && <p>{item.content}</p>}
        <button onClick={() => toggleExpand(index)}>
          {item.expanded ? 'Collapse' : 'Expand'}
        </button>
      </div>
    );
  };
  
  const toggleExpand = (index) => {
    // Update item and reset cache
    updateItem(index);
    listRef.current.resetAfterIndex(index);
  };
  
  return (
    <VariableSizeList
      ref={listRef}
      height={600}
      itemCount={items.length}
      itemSize={getItemSize}
      width="100%"
    >
      {Row}
    </VariableSizeList>
  );
}
```

### 5.3 Infinite Scrolling

```javascript
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';

function InfiniteList() {
  const { ref, inView } = useInView();
  
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['items'],
    queryFn: ({ pageParam = 0 }) => fetchItems(pageParam),
    getNextPageParam: (lastPage, pages) => lastPage.nextCursor
  });
  
  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);
  
  return (
    <div>
      {data?.pages.map((page, i) => (
        <div key={i}>
          {page.items.map(item => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      ))}
      
      <div ref={ref}>
        {isFetchingNextPage && <Loading />}
      </div>
    </div>
  );
}
```

## 6. Image Optimization

### 6.1 Lazy Loading Images

```javascript
function LazyImage({ src, alt, ...props }) {
  const [imageSrc, setImageSrc] = useState(null);
  const imgRef = useRef();
  
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setImageSrc(src);
        observer.disconnect();
      }
    });
    
    if (imgRef.current) {
      observer.observe(imgRef.current);
    }
    
    return () => observer.disconnect();
  }, [src]);
  
  return (
    <img
      ref={imgRef}
      src={imageSrc || 'placeholder.jpg'}
      alt={alt}
      {...props}
    />
  );
}
```

### 6.2 Progressive Image Loading

```javascript
function ProgressiveImage({ src, placeholder }) {
  const [currentSrc, setCurrentSrc] = useState(placeholder);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setCurrentSrc(src);
      setLoading(false);
    };
  }, [src]);
  
  return (
    <div className={`image-container ${loading ? 'loading' : 'loaded'}`}>
      <img src={currentSrc} alt="" />
    </div>
  );
}
```

### 6.3 Next.js Image Component

```javascript
import Image from 'next/image';

function OptimizedImage() {
  return (
    <Image
      src="/photo.jpg"
      alt="Optimized"
      width={800}
      height={600}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,..."
      loading="lazy"
      quality={85}
    />
  );
}
```

## 7. Bundle Size Optimization

### 7.1 Analyze Bundle

```bash
# Webpack Bundle Analyzer
npm install --save-dev webpack-bundle-analyzer

# Add to webpack config
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  plugins: [
    new BundleAnalyzerPlugin()
  ]
};

# Run build
npm run build -- --analyze
```

### 7.2 Tree Shaking

```javascript
// Bad: Import entire library
import _ from 'lodash';
const result = _.debounce(fn, 300);

// Good: Import specific function
import debounce from 'lodash/debounce';
const result = debounce(fn, 300);

// Better: Use lodash-es for tree shaking
import { debounce } from 'lodash-es';
const result = debounce(fn, 300);
```

### 7.3 Dynamic Imports

```javascript
// Load library only when needed
async function handleExport() {
  const { saveAs } = await import('file-saver');
  const blob = new Blob([data], { type: 'text/plain' });
  saveAs(blob, 'export.txt');
}

// Conditional polyfills
async function loadPolyfills() {
  if (!window.IntersectionObserver) {
    await import('intersection-observer');
  }
}
```

## 8. Performance Monitoring

### 8.1 React DevTools Profiler

```javascript
import { Profiler } from 'react';

function App() {
  const onRender = (
    id,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime
  ) => {
    console.log({
      id,
      phase,
      actualDuration,
      baseDuration
    });
    
    // Send to analytics
    if (actualDuration > 16) {
      analytics.track('slow-render', {
        component: id,
        duration: actualDuration
      });
    }
  };
  
  return (
    <Profiler id="App" onRender={onRender}>
      <YourApp />
    </Profiler>
  );
}
```

### 8.2 Custom Performance Hooks

```javascript
function useRenderCount() {
  const renderCount = useRef(0);
  
  useEffect(() => {
    renderCount.current += 1;
    console.log(`Rendered ${renderCount.current} times`);
  });
  
  return renderCount.current;
}

function useWhyDidYouUpdate(name, props) {
  const previousProps = useRef();
  
  useEffect(() => {
    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changedProps = {};
      
      allKeys.forEach(key => {
        if (previousProps.current[key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current[key],
            to: props[key]
          };
        }
      });
      
      if (Object.keys(changedProps).length > 0) {
        console.log('[why-did-you-update]', name, changedProps);
      }
    }
    
    previousProps.current = props;
  });
}
```

## 9. Real-World Case Studies

### 9.1 E-commerce Product List

**Before Optimization:**
- 1000 products rendered at once
- Each product card re-renders on any state change
- Images load immediately
- Bundle size: 2.5 MB

**Optimizations Applied:**
1. Virtual scrolling (react-window)
2. React.memo on ProductCard
3. Lazy loading images
4. Code splitting for filters

**After Optimization:**
- Only 20 products rendered at once
- 90% reduction in re-renders
- Images load on demand
- Bundle size: 800 KB
- Load time: 5s → 1.2s

### 9.2 Dashboard with Real-time Data

**Before:**
- Entire dashboard re-renders on data update
- Heavy chart library loaded upfront
- No data caching

**Optimizations:**
1. Split contexts for different data streams
2. Lazy load chart library
3. React Query for data caching
4. useMemo for calculations

**After:**
- Only affected widgets re-render
- 60% faster initial load
- Smooth real-time updates

## Conclusion

React performance optimization requires:

1. **Measure First**: Use profiling tools
2. **Identify Bottlenecks**: Find actual problems
3. **Apply Techniques**: Use appropriate optimizations
4. **Monitor**: Track improvements
5. **Iterate**: Continuously improve

Remember: Premature optimization is the root of all evil. Optimize based on real performance data, not assumptions.

> Fast React apps provide better user experience and higher engagement.
