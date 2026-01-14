# PostPilot Landing Page - Component Guide

## Component Showcase

### 1. Navigation Bar
```
┌─────────────────────────────────────────┐
│ 🚀 PostPilot      [Sign In] [Get Started]│
└─────────────────────────────────────────┘
```
- Light white background with 80% opacity
- Glass-morphism blur effect
- Shadow for depth
- Fixed positioning

---

### 2. Hero Section with Stats
```
┌──────────────────────────────────────┐
│                                      │
│  Social Media, Powered by AI         │
│                                      │
│  [Start Free Trial] [Watch Demo]     │
│                                      │
│  ┌─────┐ ┌─────┐ ┌─────┐           │
│  │300% │ │10min│ │12+  │           │
│  │Reach│ │Time │ │Plat │           │
│  └─────┘ └─────┘ └─────┘           │
│                                      │
└──────────────────────────────────────┘
```

---

### 3. Card Flip Animation (AI Features)
```
FRONT VIEW (Normal)          BACK VIEW (Hover)
┌─────────────────┐         ┌─────────────────┐
│ ✨              │         │ Generate captions│
│ Content Gen     │  FLIP   │ hashtags, and   │
│ 📝              │ ──────> │ full posts using│
│                 │         │ advanced AI     │
└─────────────────┘         └─────────────────┘
```

**Features:**
- Uses CSS perspective
- Smooth 500ms transitions
- Scale on hover (1.05x)
- Opacity fade effect

---

### 4. How It Works Steps
```
┌─────────┐        ┌──────────────┐        ┌──────────┐
│  🔗     │        │      ✨      │        │    🎯    │
│CONNECT  │───────▶│ CREATE/GEN   │───────▶│ OPTIMIZE │
└─────────┘        └──────────────┘        └──────────┘
                                                 │
                                          ┌──────▼───────┐
                                          │      📊      │
                                          │ POST & ANALYZE
                                          └───────────────┘
```

---

### 5. Testimonial Card
```
┌─────────────────────────────────────┐
│ ⭐⭐⭐⭐⭐                           │
│                                     │
│ "PostPilot's AI increased my reach" │
│ "by 400%. I went from struggling"   │
│                                     │
│ ┌──┐                                │
│ │🎬│ Sarah Chen                     │
│ └──┘ Content Creator • 250K         │
└─────────────────────────────────────┘
```

**Hover Effects:**
- Border color changes
- Scale to 1.05x
- Shadow increases
- Light background shift

---

### 6. Comparison Table
```
┌───────────────────┬──────────┬────────┬──────────┬──────────┐
│ Feature           │PostPilot │ Buffer │Hootsuite │SocialBee │
├───────────────────┼──────────┼────────┼──────────┼──────────┤
│AI Content Gen     │✓ GPT-4   │ Basic  │ Basic    │ Basic    │
├───────────────────┼──────────┼────────┼──────────┼──────────┤
│Auto-Reposting     │✓ Yes     │ ✗      │ ✗        │ ✗        │
├───────────────────┼──────────┼────────┼──────────┼──────────┤
│Predictive AI      │✓ Yes     │ ✗      │ ✗        │ ✗        │
└───────────────────┴──────────┴────────┴──────────┴──────────┘
```

**Features:**
- Gradient header (blue to cyan)
- Hover row highlighting
- Professional styling
- Clear comparison

---

### 7. Pricing Cards
```
STARTER                PROFESSIONAL ⭐          ENTERPRISE
┌──────────────┐      ┌──────────────┐         ┌──────────────┐
│ $19/month    │      │ $49/month    │         │ Custom/month │
│              │      │ ⭐ Popular   │         │              │
│ ✓ 4 accounts │      │              │         │ ✓ Everything │
│ ✓ AI Content │      │ ✓ Unlimited  │         │ ✓ + Manager  │
│ ✓ Scheduling │      │ ✓ Advanced   │         │ ✓ + API      │
│              │      │ ✓ Analytics  │         │              │
│[Get Started] │      │[Start Free]  │         │[Contact]     │
└──────────────┘      └──────────────┘         └──────────────┘
```

**Styling:**
- "Most Popular" badge above card
- Gradient highlights for featured plan
- Enhanced shadows
- Hover scale effects

---

### 8. FAQ Expandable
```
CLOSED STATE                OPEN STATE
┌─────────────────────┐    ┌─────────────────────┐
│ How does... +       │    │ How does... -       │
└─────────────────────┘    │                     │
                           │ Our AI analyzes...  │
                           │                     │
                           │ This can increase..│
                           │                     │
                           └─────────────────────┘
```

**Features:**
- Smooth expand/collapse
- Rotation animation on +/- icon
- Light background with borders
- Better readability on expand

---

### 9. CTA Section
```
┌─────────────────────────────────────┐
│      GRADIENT BACKGROUND            │
│      (Blue to Cyan)                 │
│                                     │
│  Ready to Win at Social?            │
│  Join thousands of creators...      │
│                                     │
│  [START FREE TRIAL] [SIGN IN]       │
│                                     │
└─────────────────────────────────────┘
```

**Features:**
- Bold gradient background
- White text for contrast
- Strong CTA buttons
- Compelling messaging

---

### 10. Footer
```
┌─────────────────────────────────────────┐
│  PostPilot      Product      Company    │
│  AI-powered...  Features     About      │
│                 Pricing      Blog       │
│                 Security     Careers    │
│                              Contact    │
│                                         │
│  © 2026 PostPilot. All rights...        │
└─────────────────────────────────────────┘
```

**Features:**
- Light gray background
- Clear link organization
- Professional layout
- Copyright info

---

## Color Palette

### Primary Colors
- **Blue:** #2563EB (rgb(37, 99, 235))
- **Cyan:** #0891B2 (rgb(8, 145, 178))

### Background Colors
- **White:** #FFFFFF
- **Light Gray:** #F3F4F6
- **Gray:** #D1D5DB

### Text Colors
- **Dark:** #111827 (gray-900)
- **Medium:** #4B5563 (gray-600)
- **Light:** #9CA3AF (gray-400)

### Accent Colors
- **Success Green:** #16A34A
- **Yellow Stars:** #FBBF24

---

## Typography Scale

```
h1 (Hero):     5xl-7xl font-black leading-tight
h2 (Section):  5xl-6xl font-black
h3 (Card):     2xl-3xl font-bold
h4 (Label):    xl font-semibold
p (Body):      base-xl font-medium/light
```

---

## Spacing System

- **xs:** 0.5rem (4px)
- **sm:** 1rem (8px)
- **md:** 1.5rem (12px)
- **lg:** 2rem (16px)
- **xl:** 2.5rem (20px)
- **2xl:** 3rem (24px)
- **3xl:** 4rem (32px)

---

## Border Radius

- **Cards:** rounded-2xl (1rem)
- **Buttons:** rounded-xl (0.75rem)
- **Small:** rounded-lg (0.5rem)

---

## Shadow System

- **sm:** box-shadow: 0 1px 2px rgba(...)
- **md:** box-shadow: 0 4px 6px rgba(...)
- **lg:** box-shadow: 0 10px 15px rgba(...)
- **xl:** box-shadow: 0 20px 25px rgba(...)
- **2xl:** box-shadow: 0 25px 50px rgba(...)

---

## Hover & Active States

**Buttons:**
- Scale: 1.05x
- Shadow: Increases depth
- Color: Shifts darker

**Cards:**
- Border: Changes to blue
- Shadow: Increases to lg/xl
- Scale: 1.05x

**Links:**
- Color: Changes to blue-600
- No underline (smooth transition)

---

## Animation Timings

- **Fast:** 150ms (hover effects)
- **Normal:** 300ms (general transitions)
- **Smooth:** 500ms (card flips, complex animations)

---

## Responsive Breakpoints

- **Mobile:** Default (< 768px)
- **Tablet:** md (768px+)
- **Desktop:** lg (1024px+)

---

## Accessibility Features

✅ WCAG 2.1 AA Compliance
✅ Contrast ratios 7:1+ for text
✅ Clear focus states
✅ Semantic HTML
✅ Alt text for images (when added)
✅ Keyboard navigation ready

---

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- No IE 11 support (intentional)

---

## Performance Optimizations

- CSS Grid/Flexbox (no floats)
- Transform animations (GPU accelerated)
- Will-change properties (where needed)
- Lazy loading ready (for images)
- Code splitting possible (for sections)

---

This design creates a professional, modern landing page that effectively communicates PostPilot's unique AI advantages while maintaining excellent usability and visual appeal.
