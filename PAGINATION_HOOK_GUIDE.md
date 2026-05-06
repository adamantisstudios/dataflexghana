# Smart Pagination Hook - Usage Guide

## Overview
The `useSmartPagination` hook provides efficient pagination with smart loading of pages. It's designed to handle large datasets by only loading pages as needed, reducing memory usage and improving performance.

## Installation

The hook is already created at: `/hooks/use-smart-pagination.ts`

## Usage

### Basic Usage

```typescript
import { useSmartPagination } from "@/hooks/use-smart-pagination"

export default function MyComponent() {
  const [data, setData] = useState([])
  
  // Use the hook
  const {
    currentPage,
    totalPages,
    paginatedData,
    goToPage,
    nextPage,
    prevPage,
  } = useSmartPagination(data, 10, 3) // 10 items per page, preload 3 pages
  
  return (
    <>
      {paginatedData.map((item) => (
        <div key={item.id}>{item.name}</div>
      ))}
      
      <button onClick={prevPage}>Previous</button>
      <span>Page {currentPage} of {totalPages}</span>
      <button onClick={nextPage}>Next</button>
    </>
  )
}
```

### Advanced Usage with Filtering

```typescript
import { useSmartPagination } from "@/hooks/use-smart-pagination"

export default function OrdersPage() {
  const [allOrders, setAllOrders] = useState([])
  const [statusFilter, setStatusFilter] = useState("all")
  
  // Filter all orders (applied before pagination)
  const filteredOrders = useMemo(() => {
    if (statusFilter === "all") return allOrders
    return allOrders.filter((order) => order.status === statusFilter)
  }, [allOrders, statusFilter])
  
  // Pagination on filtered data
  const {
    currentPage,
    totalPages,
    paginatedData: displayedOrders,
    goToPage,
    nextPage,
    prevPage,
    totalLoadedItems,
  } = useSmartPagination(filteredOrders, 10, 3)
  
  return (
    <>
      {/* Filter Controls */}
      <select value={statusFilter} onChange={(e) => {
        setStatusFilter(e.target.value)
        goToPage(1) // Reset to page 1 when filter changes
      }}>
        <option value="all">All Orders</option>
        <option value="pending">Pending</option>
        <option value="completed">Completed</option>
      </select>
      
      {/* Display Data */}
      <table>
        <tbody>
          {displayedOrders.map((order) => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>{order.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Pagination Controls */}
      <div>
        <span>Page {currentPage} of {totalPages} • {filteredOrders.length} total • {totalLoadedItems} loaded</span>
        <button onClick={prevPage} disabled={currentPage === 1}>Previous</button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
          <button
            key={i + 1}
            onClick={() => goToPage(i + 1)}
            style={{ fontWeight: currentPage === i + 1 ? "bold" : "normal" }}
          >
            {i + 1}
          </button>
        ))}
        {totalPages > 5 && <span>...</span>}
        <button onClick={nextPage} disabled={currentPage === totalPages}>Next</button>
      </div>
    </>
  )
}
```

## API Reference

### Hook Signature

```typescript
useSmartPagination<T>(
  allData: T[],
  itemsPerPage: number = 10,
  initialPagesToLoad: number = 3
): UsePaginationReturn<T>
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `allData` | `T[]` | Required | Complete dataset to paginate |
| `itemsPerPage` | `number` | 10 | Items displayed per page |
| `initialPagesToLoad` | `number` | 3 | Number of pages to preload initially |

### Return Value

```typescript
interface UsePaginationReturn {
  // State
  currentPage: number           // Current page (1-indexed)
  itemsPerPage: number          // Items per page
  totalPages: number            // Total number of pages
  hasMore: boolean              // Is there a next page?
  paginatedData: any[]          // Data for current page only
  totalLoadedItems: number      // Count of items from loaded pages
  
  // Methods
  goToPage: (page: number) => void    // Go to specific page
  nextPage: () => void                 // Go to next page
  prevPage: () => void                 // Go to previous page
  preloadPages: (pages: number[]) => void  // Manually preload pages
  isPageLoaded: (page: number) => boolean  // Check if page is loaded
}
```

## How It Works

### Smart Loading Strategy

1. **Initial Load**: Pages 1-3 are loaded automatically
2. **Navigation**: When user goes to page 4, it's loaded automatically
3. **Memory Efficient**: Only stores data for loaded pages
4. **Efficient UI**: Only renders current page

### Example Flow

```
allData: [item1, item2, ..., item250] (250 items)
itemsPerPage: 10
totalPages: 25

Initial: Load pages 1-3 (items 1-30)
  - Page 1: items 1-10 (displayed)
  - Page 2: items 11-20 (loaded, not displayed)
  - Page 3: items 21-30 (loaded, not displayed)

User clicks "Next" → go to Page 2
  - paginatedData: items 11-20

User clicks Page 5 → go to Page 5
  - Page 5 loads automatically
  - paginatedData: items 41-50

Memory Usage: ~3 pages in memory (pages 1, 2, 3, 5)
```

## Best Practices

### 1. Reset Page When Data Changes
```typescript
// When filters change, reset to page 1
useEffect(() => {
  goToPage(1)
}, [filters, goToPage])
```

### 2. Disable Navigation When Invalid
```typescript
<button 
  onClick={nextPage} 
  disabled={currentPage === totalPages}
>
  Next Page
</button>
```

### 3. Show Loading State for New Pages
```typescript
const [loadingPage, setLoadingPage] = useState(false)

const handleGoToPage = (page) => {
  setLoadingPage(true)
  goToPage(page)
  setTimeout(() => setLoadingPage(false), 100)
}
```

### 4. Display Pagination Info
```typescript
<div>
  Page {currentPage} of {totalPages} 
  • {allData.length} total items 
  • {totalLoadedItems} loaded
</div>
```

### 5. Large Datasets
For datasets with 10,000+ items, consider:
- Increasing initial pages: `useSmartPagination(data, 10, 1)`
- Implementing server-side pagination
- Using virtual scrolling

## Performance Characteristics

### Memory Usage
```
10 items/page, load 3 pages: ~3KB per item = ~90KB overhead
10 items/page, load 5 pages: ~150KB overhead
```

### Rendering Performance
```
// Good - only renders 10 items
{paginatedData.map(item => <ItemCard key={item.id} {...item} />)}

// Bad - renders all items then hides them
{allData.map((item, i) => (
  <div style={{display: i >= currentPage * 10 ? 'none' : 'block'}}>
    <ItemCard {...item} />
  </div>
))}
```

## Common Patterns

### Infinite Scroll Alternative
```typescript
// Show more button instead of pagination
const handleShowMore = () => {
  preloadPages([currentPage + 1, currentPage + 2, currentPage + 3])
  goToPage(currentPage + 1)
}

<button onClick={handleShowMore}>Load More</button>
```

### Quick Navigation
```typescript
// Jump to page
const [jumpPage, setJumpPage] = useState("")

const handleJump = () => {
  const page = parseInt(jumpPage)
  if (page >= 1 && page <= totalPages) {
    goToPage(page)
    setJumpPage("")
  }
}

<input
  type="number"
  value={jumpPage}
  onChange={(e) => setJumpPage(e.target.value)}
  min="1"
  max={totalPages}
/>
<button onClick={handleJump}>Go</button>
```

### Responsive Pagination
```typescript
// Show fewer buttons on mobile
const visiblePages = window.innerWidth < 640 ? 3 : 5

{Array.from({ length: Math.min(totalPages, visiblePages) }, (_, i) => (
  <button key={i + 1} onClick={() => goToPage(i + 1)}>
    {i + 1}
  </button>
))}
```

## Troubleshooting

### Issue: Pagination not updating
```typescript
// Wrong - hook doesn't see data changes
const [orders, setOrders] = useState([])
const { paginatedData } = useSmartPagination(orders)

// Right - update allOrders state that hook watches
setAllOrders(newOrders)
```

### Issue: Filters not working
```typescript
// Wrong - mixing pagination concerns
const [filteredOrders] = useState([])
const { paginatedData } = useSmartPagination(filteredOrders)

// Right - filter before pagination
const filteredOrders = useMemo(() => {
  return allOrders.filter(order => order.status === "pending")
}, [allOrders, statusFilter])

const { paginatedData } = useSmartPagination(filteredOrders)
```

### Issue: Performance degradation
```typescript
// Wrong - re-filtering on every render
const { paginatedData } = useSmartPagination(
  allOrders.filter(o => o.status === filter),  // Creates new array each render
  10,
  3
)

// Right - use useMemo for filtering
const filtered = useMemo(() => 
  allOrders.filter(o => o.status === filter),
  [allOrders, filter]
)
const { paginatedData } = useSmartPagination(filtered, 10, 3)
```

## Migration from Old Pagination

### Before (Full Load)
```typescript
const [orders, setOrders] = useState([])
const [currentPage, setCurrentPage] = useState(1)

const paginatedOrders = orders.slice(
  (currentPage - 1) * 10, 
  currentPage * 10
)
const totalPages = Math.ceil(orders.length / 10)
```

### After (Smart Load)
```typescript
const [orders, setOrders] = useState([])

const { currentPage, totalPages, paginatedData: paginatedOrders } = 
  useSmartPagination(orders, 10, 3)
```

## See Also
- `IMPLEMENTATION_SUMMARY.md` - Overall implementation details
- `Orders Page`: `/app/admin/agents/[id]/data-orders/page.tsx` - Real-world usage
- `Wallet Page`: `/app/admin/agents/[id]/wallet/page.tsx` - Another example

---

**Last Updated**: 2026-05-06  
**Version**: 1.0
