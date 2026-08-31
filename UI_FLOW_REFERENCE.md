# DLT SMS Template System - UI Flow Reference

## Complete User Journey

### Flow 1: Adding a DLT Template

```
┌──────────────────────────────────────────────────────────────┐
│  SMS Marketing → Templates Tab                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  [DLT Templates (0)] [Basic Templates (0)]           │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  DLT Templates                    [+ Add DLT Template]       │
│  Regulatory compliant SMS templates approved by telecom...   │
│                                                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │  🛡️ No DLT templates yet                            │     │
│  │  Add your first DLT template to send compliant      │     │
│  │  promotional SMS                                     │     │
│  └────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────┘

                        ↓ Click "Add DLT Template"

┌──────────────────────────────────────────────────────────────┐
│  Add DLT Template                                   [×]       │
│  Register a new approved SMS template                         │
│  ──────────────────────────────────────────────────────────  │
│                                                               │
│  Header / Entity ID *          Template ID *                 │
│  [202603                 ]    [1277178600920660252     ]     │
│                                                               │
│  Template Name *                                              │
│  [SalePropertyAlert                                     ]     │
│                                                               │
│  Template Type *               Provider *                     │
│  [Promotional      ▼]         [JIO          ▼]              │
│                                                               │
│  Template Content *                                           │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Property for Sale: {#var#}                          │    │
│  │ Details: ₹{#var#}                                   │    │
│  │ Contact: {#var#}                                    │    │
│  │ - ENFOR DATA                                        │    │
│  └─────────────────────────────────────────────────────┘    │
│  Use {#var#} or {#alp#} for variable placeholders.           │
│  Variables detected: 3                                        │
│                                                               │
│  Sample Content (Optional)                                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Property for Sale: 2BHK Apartment                   │    │
│  │ Details: ₹50,00,000                                 │    │
│  │ Contact: 9876543210                                 │    │
│  │ - ENFOR DATA                                        │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  Status *                                                     │
│  [Active           ▼]                                        │
│                                                               │
│  [Cancel]                              [Add Template]        │
└──────────────────────────────────────────────────────────────┘

                        ↓ Click "Add Template"

┌──────────────────────────────────────────────────────────────┐
│  SMS Marketing → Templates Tab                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  [DLT Templates (1)] [Basic Templates (0)]           │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  DLT Templates                    [+ Add DLT Template]       │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  🛡️ SalePropertyAlert                       [🗑️]      │    │
│  │  [Active] [Promotional]                             │    │
│  │  ┌───────────────────────────────────────────────┐  │    │
│  │  │ Property for Sale: {#var#}                    │  │    │
│  │  │ Details: ₹{#var#}                             │  │    │
│  │  │ Contact: {#var#}                              │  │    │
│  │  │ - ENFOR DATA                                  │  │    │
│  │  └───────────────────────────────────────────────┘  │    │
│  │  Header: 202603    Template ID: 127717860...        │    │
│  │  Variables: 3      Provider: JIO                    │    │
│  └─────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

### Flow 2: Sending SMS with DLT Template

```
┌──────────────────────────────────────────────────────────────┐
│  SMS Marketing → Send Tab                                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  [📝 Manual Message]  [📄 DLT Template (1)]          │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  Choose DLT Template                                          │
│  Select an approved template to send compliant SMS            │
│                                                               │
│  ┌─────────────────────────────────┐  ┌──────────────────┐  │
│  │ 🛡️ SalePropertyAlert       │  │ RentPropertyAlert│  │
│  │ [Active] [Promotional]      │  │ [Active] [Promo] │  │
│  │ ┌─────────────────────────┐ │  │ ┌──────────────┐ │  │
│  │ │ Property for Sale: {...}│ │  │ │ Property for │ │  │
│  │ │ Details: ₹{#var#}       │ │  │ │ Rent: {...}  │ │  │
│  │ │ Contact: {#var#}        │ │  │ │ ...          │ │  │
│  │ └─────────────────────────┘ │  │ └──────────────┘ │  │
│  │ 3 variable(s)        JIO    │  │ 3 variable(s)    │  │
│  └─────────────────────────────┘  └──────────────────┘  │
└──────────────────────────────────────────────────────────────┘

                    ↓ Click on SalePropertyAlert

┌────────────────────────────────────────────────────────────────────┐
│  Send SMS with DLT Template                              [×]       │
│  SalePropertyAlert                                                  │
│  ──────────────────────────────────────────────────────────────── │
│                                                                     │
│  ┌──────────────────────────┐  ┌──────────────────────────────┐  │
│  │ Template Text Preview    │  │ Select Recipients (0 selected)│  │
│  │ ┌──────────────────────┐ │  │                               │  │
│  │ │ Property for Sale:   │ │  │ [Search clients...          ]│  │
│  │ │ {#VAR1#}             │ │  │                               │  │
│  │ │ Details: ₹{#VAR2#}   │ │  │ [Select All]                 │  │
│  │ │ Contact: {#VAR3#}    │ │  │                               │  │
│  │ │ - ENFOR DATA         │ │  │ ☐ Rajesh Kumar               │  │
│  │ └──────────────────────┘ │  │   9876543210                 │  │
│  │                          │  │ ☐ Priya Sharma               │  │
│  │ Configure DLT Variables  │  │   9123456789                 │  │
│  │ (3)                      │  │ ☐ Amit Patel                 │  │
│  │                          │  │   9988776655                 │  │
│  │ Variable 1 (VAR)         │  │                               │  │
│  │ [                      ] │  │                               │  │
│  │                          │  │                               │  │
│  │ Variable 2 (VAR)         │  │                               │  │
│  │ [                      ] │  │                               │  │
│  │                          │  │                               │  │
│  │ Variable 3 (VAR)         │  │                               │  │
│  │ [                      ] │  │                               │  │
│  └──────────────────────────┘  └──────────────────────────────┘  │
│                                                                     │
│  [Cancel]                          [Send to 0 recipient(s)]        │
└────────────────────────────────────────────────────────────────────┘

                    ↓ User fills variables and selects clients

┌────────────────────────────────────────────────────────────────────┐
│  Send SMS with DLT Template                              [×]       │
│  SalePropertyAlert                                                  │
│  ──────────────────────────────────────────────────────────────── │
│                                                                     │
│  ┌──────────────────────────┐  ┌──────────────────────────────┐  │
│  │ Template Text Preview    │  │ Select Recipients (2 selected)│  │
│  │ ┌──────────────────────┐ │  │                               │  │
│  │ │ Property for Sale:   │ │  │ [Search clients...          ]│  │
│  │ │ 2BHK Apartment       │ │  │                               │  │
│  │ │ Details: ₹50,00,000  │ │  │ [Deselect All]               │  │
│  │ │ Contact: 9876543210  │ │  │                               │  │
│  │ │ - ENFOR DATA         │ │  │ ☑ Rajesh Kumar               │  │
│  │ └──────────────────────┘ │  │   9876543210                 │  │
│  │     ↑ Live Preview!      │  │ ☑ Priya Sharma               │  │
│  │                          │  │   9123456789                 │  │
│  │ Configure DLT Variables  │  │ ☐ Amit Patel                 │  │
│  │ (3)                      │  │   9988776655                 │  │
│  │                          │  │                               │  │
│  │ Variable 1 (VAR)         │  │                               │  │
│  │ [2BHK Apartment       ] │  │                               │  │
│  │                          │  │                               │  │
│  │ Variable 2 (VAR)         │  │                               │  │
│  │ [50,00,000            ] │  │                               │  │
│  │                          │  │                               │  │
│  │ Variable 3 (VAR)         │  │                               │  │
│  │ [9876543210           ] │  │                               │  │
│  └──────────────────────────┘  └──────────────────────────────┘  │
│                                                                     │
│  [Cancel]                   [📨 Send to 2 recipient(s)]           │
└────────────────────────────────────────────────────────────────────┘

                        ↓ Click "Send to 2 recipient(s)"

┌────────────────────────────────────────────────────────────────────┐
│  ✅ Success!                                                        │
│                                                                     │
│  DLT messages sent!                                                 │
│  Successful: 2                                                      │
│  Failed: 0                                                          │
│  Total: 2                                                           │
│                                                                     │
│                                        [OK]                         │
└────────────────────────────────────────────────────────────────────┘
```

## UI Components Breakdown

### 1. Templates Tab - DLT Template Card
```
┌──────────────────────────────────────────────┐
│  🛡️ SalePropertyAlert              [🗑️]      │
│  [Active] [Promotional]                      │
│  ┌────────────────────────────────────────┐  │
│  │ Property for Sale: {#var#}             │  │
│  │ Details: ₹{#var#}                      │  │
│  │ Contact: {#var#}                       │  │
│  │ - ENFOR DATA                           │  │
│  └────────────────────────────────────────┘  │
│  Header: 202603    Template ID: 127717860... │
│  Variables: 3      Provider: JIO             │
└──────────────────────────────────────────────┘
```

### 2. Send Tab - Template Selection Card
```
┌──────────────────────────────────────┐
│ 🛡️ SalePropertyAlert                 │
│ [Active] [Promotional]               │
│ ┌──────────────────────────────────┐ │
│ │ Property for Sale: {#var#}       │ │
│ │ Details: ₹{#var#}                │ │
│ │ Contact: {#var#}                 │ │
│ │ - ENFOR DATA                     │ │
│ └──────────────────────────────────┘ │
│ 3 variable(s)              JIO       │
└──────────────────────────────────────┘
    ↑ Click to open send modal
```

### 3. Variable Configuration Form
```
┌─────────────────────────────────────┐
│ Configure DLT Variables (3)         │
│                                     │
│ Variable 1 (VAR)                    │
│ ┌─────────────────────────────────┐ │
│ │ Enter value for variable 1      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Variable 2 (VAR)                    │
│ ┌─────────────────────────────────┐ │
│ │ Enter value for variable 2      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Variable 3 (VAR)                    │
│ ┌─────────────────────────────────┐ │
│ │ Enter value for variable 3      │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### 4. Live Preview Panel
```
┌─────────────────────────────────────┐
│ Template Text Preview               │
│ ┌─────────────────────────────────┐ │
│ │ Property for Sale:              │ │
│ │ 2BHK Apartment in Andheri       │ │
│ │ Details: ₹75,00,000             │ │
│ │ Contact: 9876543210             │ │
│ │ - ENFOR DATA                    │ │
│ └─────────────────────────────────┘ │
│        ↑ Updates in real-time!      │
└─────────────────────────────────────┘
```

### 5. Client Selection List
```
┌─────────────────────────────────────┐
│ Select Recipients (2 selected)      │
│                                     │
│ [Search clients...                ] │
│                                     │
│ [Select All]                        │
│                                     │
│ ☑ Rajesh Kumar                      │
│   9876543210                        │
│ ☑ Priya Sharma                      │
│   9123456789                        │
│ ☐ Amit Patel                        │
│   9988776655                        │
│ ☐ Sunita Reddy                      │
│   9900112233                        │
│                                     │
└─────────────────────────────────────┘
```

## Color Coding

### Status Badges
- 🟢 **Active** - Green background (`bg-green-100 text-green-800`)
- 🔵 **Approved** - Blue background (`bg-blue-100 text-blue-800`)
- 🟡 **Registered** - Yellow background (`bg-yellow-100 text-yellow-800`)
- ⚫ **Inactive** - Gray background (`bg-gray-100 text-gray-800`)
- 🔴 **Rejected** - Red background (`bg-red-100 text-red-800`)

### Template Type Badges
- 🟣 **Promotional** - Purple background (`bg-purple-100 text-purple-800`)
- 🔵 **Service** - Blue background (`bg-blue-100 text-blue-800`)

## Keyboard Shortcuts & UX Tips

1. **Search in Client List**: Start typing to filter clients instantly
2. **Select All Toggle**: Click once to select all, click again to deselect
3. **Real-time Preview**: Preview updates as you type in variable fields
4. **Validation**: "Send" button is disabled until all variables are filled
5. **Confirmation**: Alert shows success/failure counts after sending
6. **Template Cards**: Click anywhere on the card to select (not just a button)

## Responsive Design
- Desktop: Side-by-side layout (preview + client list)
- Tablet: Stacked layout with equal widths
- Mobile: Single column, scrollable

## Accessibility
- All inputs have labels
- Color-coded status with text labels (not color-only)
- Keyboard navigable
- Screen reader friendly
- Clear error messages
