# Broker Network Architecture

## Component Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                   BrokerNetworkView.tsx                      │
│  (Main Container - State Management & Orchestration)         │
│                                                              │
│  • Manages all state (brokers, connections, messages, etc.) │
│  • Handles API calls & data fetching                        │
│  • WebSocket message handling                               │
│  • Tab switching logic                                      │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ Uses
                   │
      ┌────────────┴────────────┐
      │                         │
      ▼                         ▼
┌──────────────┐      ┌──────────────────┐
│    Hooks     │      │   Components     │
├──────────────┤      ├──────────────────┤
│              │      │                  │
│ useNetwork   │      │ AvatarCircle     │◄───┐
│ WebSocket    │      │                  │    │
│              │      │ ExternalBroker   │    │ Shared
│              │      │ Modal            │    │ Across
│              │      │                  │    │ Tabs
└──────────────┘      └──────────────────┘    │
                                               │
                   ┌───────────────────────────┘
                   │
      ┌────────────┴────────────────────────────────┐
      │                  Tabs                       │
      │   (Receive data & handlers as props)       │
      └──┬───────┬────────┬────────┬──────────┬────┘
         │       │        │        │          │
    ┌────▼──┐ ┌─▼────┐ ┌─▼─────┐ ┌▼───────┐ ┌▼────────┐
    │Discover│ │Connec│ │Request│ │ Chat   │ │External │
    │  Tab   │ │tions │ │  Tab  │ │  Tab   │ │Brokers  │
    │        │ │ Tab  │ │       │ │        │ │  Tab    │
    └────────┘ └──────┘ └───────┘ └───┬────┘ └────┬────┘
                                      │            │
                          ┌───────────┴────┐  ┌────▼────────┐
                          │                │  │             │
                    ┌─────▼──────┐  ┌──────▼────┐  ┌───────▼─────┐
                    │Conversation│  │Message    │  │External     │
                    │   List     │  │  Area     │  │Broker Card  │
                    └────────────┘  └─────┬─────┘  └─────────────┘
                                          │
                                    ┌─────▼─────────┐
                                    │Property       │
                                    │Reference Card │
                                    └───────────────┘
```

---

## Data Flow

```
┌──────────────────────────────────────────────────────────────┐
│                      User Interaction                         │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                   Tab Component (View)                        │
│  • Receives data as props                                    │
│  • Displays UI                                               │
│  • Calls event handlers                                      │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         │ Event Handler Call
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│              BrokerNetworkView (Controller)                   │
│  • Receives event                                            │
│  • Updates state                                             │
│  • Makes API call if needed                                  │
│  • Broadcasts update to relevant tabs                        │
└────────────────────────┬─────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
┌──────────────────┐          ┌──────────────────┐
│   API Server     │          │   WebSocket      │
│   (REST)         │          │   Server         │
└────────┬─────────┘          └────────┬─────────┘
         │                              │
         │ Response                     │ Real-time Update
         │                              │
         ▼                              ▼
┌──────────────────────────────────────────────────────────────┐
│              BrokerNetworkView (Controller)                   │
│  • Receives response                                         │
│  • Updates state                                             │
│  • Re-renders affected tabs                                  │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         │ Props Update
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                   Tab Component (View)                        │
│  • Receives new props                                        │
│  • Re-renders with updated data                              │
└──────────────────────────────────────────────────────────────┘
```

---

## State Management

### **Parent Component State**
```typescript
// BrokerNetworkView.tsx manages all state

// Discovery
const [brokers, setBrokers] = useState<BrokerProfile[]>([]);
const [search, setSearch] = useState('');

// Connections
const [connections, setConnections] = useState<Connection[]>([]);
const [pendingIn, setPendingIn] = useState<ConnectionRequest[]>([]);
const [pendingOut, setPendingOut] = useState<ConnectionRequest[]>([]);

// Chat
const [conversations, setConversations] = useState<Conversation[]>([]);
const [activeConv, setActiveConv] = useState<Conversation | null>(null);
const [messages, setMessages] = useState<Message[]>([]);

// External Brokers
const [extBrokers, setExtBrokers] = useState<ExternalBroker[]>([]);
```

### **Child Components**
- **Stateless**: Receive all data as props
- **Event-driven**: Call parent handlers for actions
- **Pure**: Same props = same output

---

## Communication Patterns

### **1. Parent → Child (Data Flow)**
```typescript
// Parent passes data down
<DiscoverTab
  brokers={brokers}
  loading={loading}
  search={search}
  // ...
/>
```

### **2. Child → Parent (Event Flow)**
```typescript
// Child calls parent handler
<DiscoverTab
  onConnect={handleConnect}
  onOpenChat={openChatWith}
  // ...
/>
```

### **3. WebSocket Updates**
```typescript
// WebSocket → Parent → All affected children
const handleWsMessage = (msg: WsOutbound) => {
  // Update relevant state
  // All subscribed components re-render automatically
};
```

### **4. Cross-Tab Navigation**
```typescript
// Example: Discover Tab → Chat Tab
const openChatWith = async (peerId: string) => {
  // 1. Create/find conversation
  // 2. Set active conversation
  // 3. Switch to chat tab
  setTab('chat');
};
```

---

## WebSocket Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                  useNetworkWebSocket Hook                     │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Connection Management                               │   │
│  │  • Auto-connect on mount                            │   │
│  │  • Exponential backoff retry                        │   │
│  │  • Clean disconnect on unmount                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Message Handling                                    │   │
│  │  • Parse incoming JSON                              │   │
│  │  • Call onMessage callback                          │   │
│  │  • Handle errors gracefully                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Public API                                          │   │
│  │  • online: boolean                                  │   │
│  │  • send: (data: object) => void                    │   │
│  │  • reconnectCount: number                           │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
         │                                    ▲
         │ WebSocket Events                   │ Send Messages
         │                                    │
         ▼                                    │
┌─────────────────────────────────────────────────────────────┐
│                    WebSocket Server                          │
│                  (Backend Real-time API)                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Responsibilities Matrix

| Component | State | API Calls | WebSocket | Renders |
|-----------|-------|-----------|-----------|---------|
| **BrokerNetworkView** | ✅ All | ✅ All | ✅ Handle | Tabs |
| **useNetworkWebSocket** | ✅ Connection | ❌ | ✅ Manage | - |
| **AvatarCircle** | ❌ | ❌ | ❌ | Avatar |
| **DiscoverTab** | ❌ | ❌ | ❌ | Broker Grid |
| **ConnectionsTab** | ❌ | ❌ | ❌ | Connection List |
| **RequestsTab** | ❌ | ❌ | ❌ | Request Lists |
| **ChatTab** | ❌ | ❌ | ❌ | Chat Layout |
| **ConversationList** | ❌ | ❌ | ❌ | Conv. Sidebar |
| **MessageArea** | ❌ | ❌ | ❌ | Messages |
| **PropertyReferenceCard** | ❌ | ❌ | ❌ | Property Info |
| **ExternalBrokersTab** | ❌ | ❌ | ❌ | Broker Grid |
| **ExternalBrokerCard** | ❌ | ❌ | ❌ | Broker Card |
| **ExternalBrokerModal** | ❌ | ❌ | ❌ | Form Modal |

✅ = Responsible | ❌ = Not Responsible

---

## API Integration Map

```
┌────────────────────────────────────────────────────────────┐
│              BrokerNetworkView (API Layer)                  │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  loadBrokers()          → networkApi.getBrokers()         │
│  loadConnections()      → networkApi.getConnections()     │
│  loadRequests()         → networkApi.getPendingRequests() │
│  loadConversations()    → networkApi.getConversations()   │
│  loadExtBrokers()       → externalBrokerApi.getAll()      │
│                                                            │
│  handleConnect()        → networkApi.sendRequest()        │
│  handleRespond()        → networkApi.respondRequest()     │
│  handleSendMessage()    → networkApi.sendMessage()        │
│                                                            │
│  handleExtSubmit()      → externalBrokerApi.create()      │
│  handleExtDelete()      → externalBrokerApi.delete()      │
│                                                            │
└────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP / WebSocket
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│                      Backend API                            │
│                                                            │
│  /network/brokers              (GET)                       │
│  /network/connections          (GET)                       │
│  /network/requests             (GET, POST)                 │
│  /network/conversations        (GET)                       │
│  /network/messages             (POST)                      │
│  /external-brokers             (GET, POST, PUT, DELETE)    │
│  /network/ws                   (WebSocket)                 │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## Rendering Flow

```
1. User loads page
   └─→ BrokerNetworkView mounts
       └─→ useNetworkWebSocket connects
       └─→ All data loading functions called
           ├─→ loadBrokers()
           ├─→ loadConnections()
           ├─→ loadRequests()
           ├─→ loadConversations()
           └─→ loadExtBrokers()

2. Data arrives
   └─→ State updated
       └─→ React re-renders
           └─→ Active tab receives new props
               └─→ Tab component renders with data

3. User interacts
   └─→ Event handler called
       └─→ Parent updates state / calls API
           └─→ State updated
               └─→ Affected components re-render

4. WebSocket message arrives
   └─→ handleWsMessage called
       └─→ State updated based on message type
           └─→ Affected tabs re-render
```

---

## Error Handling Strategy

```
┌────────────────────────────────────────────────────────────┐
│                    Error Boundaries                         │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Level 1: Component Level                                 │
│  • Try-catch in async functions                           │
│  • Default values for missing data                        │
│  • Graceful degradation                                   │
│                                                            │
│  Level 2: Parent Level                                    │
│  • Error state management                                 │
│  • Toast notifications                                    │
│  • Retry mechanisms                                       │
│                                                            │
│  Level 3: Global Level (Future)                           │
│  • React Error Boundaries                                 │
│  • Fallback UI                                            │
│  • Error logging                                          │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## Performance Optimization Points

### **Current**
- ✅ Refs to avoid stale closures
- ✅ useCallback for stable handlers
- ✅ Modular components for better splitting

### **Future Opportunities**
- 🔄 React.memo() on tab components
- 🔄 useMemo() for filtered/sorted lists
- 🔄 Debounce search inputs
- 🔄 Virtualized lists for long conversations
- 🔄 Lazy loading for tabs
- 🔄 Code splitting per tab

---

## Testing Strategy

```
┌────────────────────────────────────────────────────────────┐
│                    Testing Pyramid                          │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  E2E Tests (Few)                                           │
│  └─→ Full user flows across tabs                          │
│                                                            │
│  Integration Tests (Some)                                  │
│  └─→ BrokerNetworkView with mocked API                    │
│  └─→ Tab components with callbacks                        │
│                                                            │
│  Unit Tests (Many)                                         │
│  └─→ Individual components                                │
│  └─→ useNetworkWebSocket hook                             │
│  └─→ Helper functions                                     │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## Security Considerations

### **Implemented**
- ✅ Token-based WebSocket authentication
- ✅ Input sanitization in forms
- ✅ URL validation for images

### **Recommendations**
- 🔐 XSS prevention in message display
- 🔐 CSRF protection on API calls
- 🔐 Rate limiting for message sending
- 🔐 Content Security Policy headers

---

## Accessibility (a11y)

### **Current**
- ✅ Semantic HTML
- ✅ Keyboard navigation (buttons)
- ✅ ARIA labels on icons

### **Improvements Needed**
- ⚠️ Focus management in modals
- ⚠️ Screen reader announcements
- ⚠️ Keyboard shortcuts for navigation
- ⚠️ ARIA live regions for updates

---

## Mobile Considerations

### **Implemented**
- ✅ Responsive grid layouts
- ✅ Touch-friendly tap targets
- ✅ Scrollable tab navigation
- ✅ Collapsible sections

### **Best Practices**
- 📱 Minimum 44x44px touch targets
- 📱 Thumb-friendly button placement
- 📱 Reduced animation on mobile
- 📱 Optimized image sizes

---

## Browser Support

### **Target Browsers**
- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

### **Compatibility**
- ✅ ES6+ features (transpiled by build)
- ✅ WebSocket API
- ✅ Flexbox & Grid
- ✅ CSS custom properties

---

This architecture provides a solid, maintainable foundation for the Broker Network feature with clear separation of concerns and excellent developer experience! 🚀
