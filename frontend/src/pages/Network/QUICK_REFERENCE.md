# Broker Network - Quick Reference

## 🚀 Quick Start

### File Structure
```
Network/
├── BrokerNetworkView.tsx     # Main container
├── hooks/
│   └── useNetworkWebSocket.ts
├── components/
│   ├── AvatarCircle.tsx
│   └── ExternalBrokerModal.tsx
└── tabs/
    ├── DiscoverTab.tsx
    ├── ConnectionsTab.tsx
    ├── RequestsTab.tsx
    ├── ChatTab/
    └── ExternalBrokersTab/
```

---

## 📝 Common Tasks

### **Adding a New Feature to a Tab**

1. **Identify the tab** (e.g., DiscoverTab)
2. **Update the tab component**
3. **Add props if state is needed**
4. **Update parent if API calls needed**

Example:
```typescript
// 1. Add handler in BrokerNetworkView.tsx
const handleNewFeature = async (data) => {
  // API call
  // Update state
};

// 2. Pass to tab component
<DiscoverTab
  onNewFeature={handleNewFeature}
  // ... other props
/>

// 3. Use in DiscoverTab.tsx
<button onClick={() => props.onNewFeature(data)}>
  New Feature
</button>
```

---

### **Adding a New Tab**

1. **Create tab component** in `tabs/NewTab.tsx`
2. **Add to tabs array** in BrokerNetworkView
3. **Add tab rendering** in main component
4. **Export from** `tabs/index.ts`

```typescript
// 1. Create tabs/NewTab.tsx
export const NewTab: React.FC<NewTabProps> = (props) => {
  return <div>New Tab Content</div>;
};

// 2. Import and add to tabs array
const tabs = [
  // ... existing tabs
  { id: 'newtab', label: 'New Tab', icon: SomeIcon },
];

// 3. Add rendering
{tab === 'newtab' && (
  <NewTab {...props} />
)}
```

---

### **Debugging WebSocket Issues**

```typescript
// Check connection status
console.log('WS Online:', online);
console.log('Reconnect count:', reconnectCount);

// Check message handling
const handleWsMessage = (msg: WsOutbound) => {
  console.log('WS Message:', msg);
  // ... rest of handler
};

// Check if messages are being sent
wsSend({ type: 'test', data: 'hello' });
```

---

### **Adding New API Calls**

```typescript
// 1. Add in BrokerNetworkView.tsx
const loadNewData = async () => {
  setLoading(true);
  try {
    const response = await networkApi.getNewData();
    setNewData(response.data);
  } catch (error) {
    console.error('Failed to load:', error);
  } finally {
    setLoading(false);
  }
};

// 2. Call in useEffect
useEffect(() => {
  loadNewData();
}, []);

// 3. Pass to tab component
<SomeTab newData={newData} loading={loading} />
```

---

## 🔧 Component Props Reference

### **DiscoverTab**
```typescript
{
  brokers: BrokerProfile[];
  loading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onConnect: (brokerId: string) => void;
  onOpenChat: (brokerId: string) => void;
  currentUserId?: string;
}
```

### **ConnectionsTab**
```typescript
{
  connections: Connection[];
  onOpenChat: (peerId: string) => void;
}
```

### **RequestsTab**
```typescript
{
  pendingIn: ConnectionRequest[];
  pendingOut: ConnectionRequest[];
  onRespond: (reqId: string, action: 'accept' | 'reject') => void;
}
```

### **ChatTab**
```typescript
{
  conversations: Conversation[];
  activeConv: Conversation | null;
  messages: Message[];
  msgInput: string;
  online: boolean;
  typingUser: string | null;
  propertyContext: any;
  propertyReferences: Map<string, any>;
  currentUserId?: string;
  onSelectConversation: (conv: Conversation) => void;
  onMsgInputChange: (value: string) => void;
  onSendMessage: () => void;
  onTyping: () => void;
  onClearPropertyContext: () => void;
  onPropertyClick: (property: any) => void;
}
```

### **ExternalBrokersTab**
```typescript
{
  brokers: ExternalBroker[];
  loading: boolean;
  search: string;
  currentUserId?: string;
  onSearchChange: (value: string) => void;
  onAdd: () => void;
  onEdit: (broker: ExternalBroker) => void;
  onView: (broker: ExternalBroker) => void;
  onDelete: (broker: ExternalBroker) => void;
  deletingId: string | null;
}
```

---

## 🎨 Styling Patterns

### **Responsive Grid**
```typescript
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Cards */}
</div>
```

### **Responsive Flex**
```typescript
<div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
  {/* Content */}
</div>
```

### **Button Styles**
```typescript
// Primary
className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"

// Secondary
className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"

// Danger
className="bg-red-100 text-red-700 px-2 py-1 rounded-lg hover:bg-red-200"

// Success
className="bg-green-100 text-green-700 px-2 py-1 rounded-lg hover:bg-green-200"
```

### **Card Style**
```typescript
className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
```

---

## 🐛 Common Issues & Solutions

### **Issue: Component not re-rendering**
**Solution**: Check if props are actually changing
```typescript
useEffect(() => {
  console.log('Props changed:', props);
}, [props]);
```

### **Issue: WebSocket not connecting**
**Solution**: Check token and API URL
```typescript
const token = localStorage.getItem('enfor_token');
console.log('Token:', token ? 'Present' : 'Missing');
console.log('API URL:', ENV.API_URL);
```

### **Issue: Messages not sending**
**Solution**: Check WebSocket connection and message format
```typescript
console.log('WS Online:', online);
console.log('Active Conversation:', activeConv);
console.log('Message Input:', msgInput);
```

### **Issue: State not updating**
**Solution**: Ensure you're using functional updates
```typescript
// ❌ Wrong
setMessages([...messages, newMessage]);

// ✅ Right
setMessages(prev => [...prev, newMessage]);
```

---

## 📦 Import Patterns

### **From Parent**
```typescript
import { BrokerProfile, Connection } from './types';
import { useNetworkWebSocket } from './hooks/useNetworkWebSocket';
import { DiscoverTab, ChatTab } from './tabs';
import { AvatarCircle } from './components';
```

### **From Child Components**
```typescript
import { AvatarCircle } from '../components/AvatarCircle';
import { ConversationList } from './ConversationList';
```

---

## 🧪 Testing Snippets

### **Test Component Rendering**
```typescript
import { render, screen } from '@testing-library/react';
import { DiscoverTab } from './DiscoverTab';

test('renders broker cards', () => {
  const mockBrokers = [/* mock data */];
  render(<DiscoverTab brokers={mockBrokers} {...otherProps} />);
  expect(screen.getByText(mockBrokers[0].name)).toBeInTheDocument();
});
```

### **Test Event Handlers**
```typescript
import { fireEvent } from '@testing-library/react';

test('calls onConnect when connect button clicked', () => {
  const handleConnect = jest.fn();
  render(<DiscoverTab onConnect={handleConnect} {...otherProps} />);
  
  fireEvent.click(screen.getByText('Connect'));
  expect(handleConnect).toHaveBeenCalledWith(mockBroker.id);
});
```

---

## 🔍 Performance Tips

### **Memoize Expensive Computations**
```typescript
const filteredBrokers = useMemo(() => 
  brokers.filter(b => b.name.includes(search)),
  [brokers, search]
);
```

### **Memoize Components**
```typescript
export const DiscoverTab = React.memo<DiscoverTabProps>((props) => {
  // component code
});
```

### **Use Callback for Handlers**
```typescript
const handleConnect = useCallback((brokerId: string) => {
  // handler code
}, [/* dependencies */]);
```

---

## 📱 Mobile Testing Checklist

- [ ] Tabs scroll horizontally on small screens
- [ ] Cards stack properly in single column
- [ ] Buttons are thumb-sized (44x44px min)
- [ ] Text is readable (14px+ font size)
- [ ] Touch targets don't overlap
- [ ] Modal fits in viewport
- [ ] Input fields zoom properly

---

## 🚨 Before Committing

- [ ] No console errors
- [ ] All tabs load correctly
- [ ] WebSocket connects
- [ ] Responsive on mobile/tablet/desktop
- [ ] No TypeScript errors
- [ ] Imports are clean
- [ ] No unused variables
- [ ] Code is formatted

---

## 📚 Related Documentation

- [REFACTORING_GUIDE.md](./REFACTORING_GUIDE.md) - Complete refactoring details
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [types.ts](./types.ts) - TypeScript type definitions
- [Backend API Docs](#) - API endpoints reference

---

## 💡 Pro Tips

1. **Use barrel exports** from `tabs/index.ts` and `components/index.ts`
2. **Keep components focused** - one responsibility per component
3. **Props over state** - pass data down, events up
4. **Name handlers clearly** - `onConnect`, `handleConnect` convention
5. **Document complex logic** - add comments for non-obvious code
6. **Test on mobile** - use Chrome DevTools device emulation
7. **Check WebSocket state** - always verify `online` before sending

---

## 🆘 Need Help?

1. Check the [REFACTORING_GUIDE.md](./REFACTORING_GUIDE.md)
2. Review [ARCHITECTURE.md](./ARCHITECTURE.md)
3. Look at similar components for patterns
4. Console log props/state to debug
5. Ask the team!

---

**Last Updated**: 2026-08-18
**Maintained By**: Development Team
