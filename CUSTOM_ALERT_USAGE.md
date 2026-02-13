# Custom Alert Usage Guide

The app now uses a beautiful custom alert system that matches the app's green theme with smooth animations.

## How to Use

### Basic Usage

Replace `Alert.alert()` with `showAlert()`:

```typescript
import { showAlert } from '@/utils/alert';

// Simple alert
showAlert('Title', 'Message');

// With buttons
showAlert(
  'Sign Out',
  'Are you sure you want to sign out?',
  [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Sign Out', style: 'destructive', onPress: () => { /* ... */ } }
  ]
);
```

### Convenience Functions

```typescript
import { showSuccess, showError, showWarning, showInfo } from '@/utils/alert';

// Success alert (green icon)
showSuccess('Success!', 'Your password has been reset successfully!');

// Error alert (red icon)
showError('Error', 'Failed to load data. Please try again.');

// Warning alert (orange icon)
showWarning('Warning', 'This action cannot be undone.');

// Info alert (blue icon)
showInfo('Information', 'Please check your email for verification.');
```

### Button Styles

- `'default'` - Primary green gradient button
- `'cancel'` - Gray outlined button
- `'destructive'` - Red gradient button (for dangerous actions)

### Alert Types

- `'success'` - Green checkmark icon
- `'error'` - Red X icon
- `'warning'` - Orange warning icon
- `'info'` - Blue info icon

### Features

✅ Smooth spring animations
✅ Haptic feedback on interactions
✅ Beautiful gradient buttons
✅ Type-specific icons and colors
✅ Matches app's green theme
✅ Backdrop blur effect
✅ Responsive design

### Migration Example

**Before:**
```typescript
Alert.alert(
  'Delete Account',
  'Are you sure? This cannot be undone.',
  [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: handleDelete }
  ]
);
```

**After:**
```typescript
showAlert(
  'Delete Account',
  'Are you sure? This cannot be undone.',
  [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: handleDelete }
  ],
  'warning'
);
```




