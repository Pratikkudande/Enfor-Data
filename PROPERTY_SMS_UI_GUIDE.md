# Property SMS Feature - UI Guide

## Visual Changes

### 1. Message Templates Section - New Button

**Location**: Right Column → Message Templates Section → Bottom

**Before**: Only "Add Another Message" button

**After**: Two buttons:
```
┌─────────────────────────────────────────┐
│  ➕ Add Another Message                 │  ← Blue, dashed border
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  🏠 Select Property                      │  ← NEW! Indigo, dashed border
└─────────────────────────────────────────┘
```

### 2. Property Selection Modal

**Triggered by**: Clicking "Select Property" button

**Modal Structure**:
```
┌──────────────────────────────────────────────────────┐
│  🏠 Select Properties                     ✕          │
│  3 properties selected (Showing For Sale only)       │
├──────────────────────────────────────────────────────┤
│  🔍 Search properties...                             │
├──────────────────────────────────────────────────────┤
│  Select All / Deselect All                           │
├──────────────────────────────────────────────────────┤
│  ☑ 2 BHK Apartment in Hinjewadi                      │
│     [For Sale] [Apartment]                           │
│     2 BHK • Hinjewadi • ₹45.00 Lakh • 850 Sq.Ft.   │
│     Client: 9876543210                                │
│                                                       │
│  ☐ 3 BHK House in Baner                              │
│     [For Sale] [House]                               │
│     3 BHK • Baner • ₹1.20 Cr • 1500 Sq.Ft.          │
│                                                       │
│  ☑ 1 BHK Apartment in Kothrud                        │
│     [For Sale] [Apartment]                           │
│     1 BHK • Kothrud • ₹30.00 Lakh • 600 Sq.Ft.     │
├──────────────────────────────────────────────────────┤
│  [Cancel]           [Submit (2 selected)]            │
└──────────────────────────────────────────────────────┘
```

### 3. Message Templates After Property Selection

**Property messages appear with indigo theme**:

```
┌────────────────────────────────────────────────────────┐
│  Message #1                                      [Remove]│  ← Blue theme (manual)
│  Manual message                                          │
├────────────────────────────────────────────────────────┤
│  Property for Rent: 2 BHK Apartment, Hinjewadi  [Remove]│  ← Indigo theme (property)
│  Auto-generated from property data                       │
│                                                          │
│  📝 Template Text Preview            [👁 Preview / Edit] │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Property for Rent: [2 BHK Apartment, Hinjewadi]   │ │
│  │                                                    │ │
│  │ Details: [₹45.00 Lakh, 850 Sq.Ft.]               │ │
│  │                                                    │ │
│  │ Contact: [ABC Realty - 9876543210]                │ │
│  └────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│  Property for Rent: 3 BHK House, Baner          [Remove]│  ← Indigo theme (property)
│  Auto-generated from property data                       │
│                                                          │
│  📝 Template Text Preview            [👁 Preview / Edit] │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Property for Rent: [3 BHK House, Baner]           │ │
│  │                                                    │ │
│  │ Details: [₹1.20 Cr, 1500 Sq.Ft.]                 │ │
│  │                                                    │ │
│  │ Contact: [ABC Realty - 9876543210]                │ │
│  └────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

## Color Coding

| Element | Color | Purpose |
|---------|-------|---------|
| Manual Messages | Blue | User-entered variable values |
| Property Messages | Indigo | Auto-generated from property data |
| "Add Another Message" | Blue dashed | Add manual message template |
| "Select Property" | Indigo dashed | Open property selection modal |

## Template Category Filtering

### FOR_SALE Templates
- Shows only properties where `listing_type = 'sale'`
- Tag displayed: "For Sale" (Green badge)

### FOR_RENT / LIST_FOR_RENT Templates
- Shows only properties where `listing_type = 'rent'`
- Tag displayed: "For Rent" (Blue badge)

### OTHER Categories
- Shows all properties (no filtering)

## Auto-Variable Mapping

When a property is selected, variables are automatically filled:

| Variable | Format | Example |
|----------|--------|---------|
| VAR1 | {Bedrooms} BHK {Type}, {Location} | "2 BHK Apartment, Hinjewadi" |
| VAR2 | ₹{Price}, {Area} Sq.Ft. | "₹45.00 Lakh, 850 Sq.Ft." |
| VAR3 | {Firm Name} - {Contact} | "ABC Realty - 9876543210" |

## User Actions

### Select Property
1. Click "🏠 Select Property" button
2. Modal opens with filtered properties
3. Search/filter as needed
4. Check properties to select
5. Click "Submit (X selected)"
6. Property messages appear in templates section

### Remove Property Message
1. Click "Remove" button on property message
2. Message removed from templates
3. Property removed from selection

### Edit Property Variables
1. Click "Edit" toggle on property message
2. Variables become editable
3. Modify as needed
4. Click "Preview" to see result

### Send Messages
1. Review all message templates (manual + property)
2. Check recipient count
3. Click "Send X message(s) to Y recipient(s)"
4. Confirmation shows success/failure count

## Recipient Information

**Left Column**: Select Recipients
- Shows total: Clients + Building Contacts + Properties
- Example: "Select Recipients (5 selected)" = 2 clients + 1 building contact + 2 properties

**Send Button**:
- Disabled if no recipients
- Shows count: "Send 3 message(s) to 5 recipient(s)"
  - 3 messages = 1 manual + 2 properties
  - 5 recipients = 2 clients + 1 building + 2 property clients

## Error Handling

### No Client Associated with Property
- Property appears in selection modal
- When sending, SMS skipped for that property
- Counted as "failed" in result

### Missing Property Data
- Variable shows empty if data missing
- User can edit before sending

### Invalid Phone Number
- SMS skipped
- Counted as "failed" in result

## Responsive Design

- Modal: Max width 2xl, scrollable on small screens
- Property list: Max height 400px, scrollable
- Templates: Scrollable container for many messages
- Buttons: Full width on mobile, inline on desktop
