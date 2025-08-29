# PollMaster - Next.js Polling Application

A modern, full-featured polling application built with Next.js 15, TypeScript, and Tailwind CSS. PollMaster allows users to create polls, vote on them, and track results in real-time.

## 🚀 Features

- **User Authentication**: Supabase auth (email/password)
- **Poll Creation**: Create polls with multiple options, descriptions, and customizable settings
- **Voting System**: Simple and intuitive voting interface with real-time results
- **Dashboard**: Track your polls, view statistics, and manage your account
- **Responsive Design**: Beautiful UI that works on all devices
- **Modern Tech Stack**: Built with Next.js 15, TypeScript, and Tailwind CSS

## 🧰 Environment Variables

Create a `.env.local` at the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Get these from your Supabase project settings (Project URL and anon public API key).

## 🗃️ Database (Supabase)

Schema SQL: `supabase/migrations/0001_polls.sql`

Apply in Supabase SQL Editor:
1. Open your project → SQL Editor
2. Paste contents of `supabase/migrations/0001_polls.sql`
3. Run and save as migration

Tables created:
- `public.polls` (owner: `auth.users.id`)
- `public.poll_options`
- `public.votes`

Features:
- RLS enabled with policies for read/write
- Trigger `trg_votes_single_vote` to enforce single-vote when `allow_multiple_votes = false`
- Trigger `trg_polls_min_options` to ensure at least 2 options when activating a poll
- View `public.poll_results` for aggregated results

## 🛠️ Setup

1. Install deps and run:
```bash
npm install
npm run dev
```

2. Configure Supabase Auth (email/password enabled) in your Supabase dashboard.

3. Apply the database schema (see section above).

4. Visit `/auth/register` to create a user, then `/auth/login` to sign in.

## 🛠️ Project Structure

```
alx-polly/
├── app/
│   ├── (auth)/                 # Authentication routes
│   │   ├── login/             # User login page
│   │   └── register/          # User registration page
│   ├── (dashboard)/           # Dashboard routes
│   │   └── page.tsx          # User dashboard
│   ├── polls/                 # Poll-related routes
│   │   ├── page.tsx          # All polls listing
│   │   ├── create/           # Create new poll
│   │   │   └── page.tsx      # Poll creation form
│   │   └── [id]/             # Dynamic poll routes
│   │       └── page.tsx      # Individual poll view
│   ├── components/            # Reusable components
│   │   ├── ui/               # Shadcn UI components
│   │   │   ├── button.tsx    # Button component
│   │   │   ├── card.tsx      # Card component
│   │   │   ├── input.tsx     # Input component
│   │   │   ├── label.tsx     # Label component
│   │   │   └── textarea.tsx  # Textarea component
│   │   └── navigation.tsx    # Main navigation
│   ├── lib/                  # Utility functions
│   │   └── utils.ts          # Common utilities
│   ├── types/                # TypeScript type definitions
│   │   └── index.ts          # App types and interfaces
│   ├── hooks/                # Custom React hooks
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home page
├── public/                   # Static assets
├── package.json              # Dependencies and scripts
└── README.md                 # Project documentation
```

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Shadcn/UI (Radix UI primitives)
- **Icons**: Lucide React
- **State Management**: React hooks (useState, useEffect)
- **Routing**: Next.js file-based routing

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd alx-polly
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📱 Pages & Features

### Home Page (`/`)
- Hero section with app introduction
- Feature highlights
- Recent polls showcase
- Call-to-action for sign up

### Authentication (`/auth/*`)
- **Login** (`/auth/login`): User sign-in form
- **Register** (`/auth/register`): New user registration

### Dashboard (`/dashboard`)
- User statistics and overview
- Recent polls created by the user
- Quick actions (create poll, view all polls)

### Polls (`/polls/*`)
- **All Polls** (`/polls`): Browse and search all available polls
- **Create Poll** (`/polls/create`): Form to create new polls
- **Individual Poll** (`/polls/[id]`): View and vote on specific polls

## 🎨 UI Components

The app uses a custom component library built with Shadcn/UI:

- **Button**: Multiple variants (default, outline, ghost, etc.)
- **Card**: Content containers with header, content, and footer
- **Input**: Text input fields with validation states
- **Label**: Form labels with accessibility features
- **Textarea**: Multi-line text input

## 🔧 Customization

### Adding New Components

1. Create new components in `app/components/ui/`
2. Follow the existing pattern using Radix UI primitives
3. Use the `cn()` utility for class name merging

### Styling

- Global styles are in `app/globals.css`
- Component-specific styles use Tailwind CSS classes
- Custom CSS variables can be added to `globals.css`

### TypeScript Types

- All app types are defined in `app/types/index.ts`
- Extend existing interfaces or create new ones as needed

## 🚧 Future Enhancements

- [ ] Real-time voting with WebSockets
- [ ] User authentication with NextAuth.js
- [ ] Database integration (PostgreSQL + Prisma)
- [ ] Poll analytics and charts
- [ ] Email notifications
- [ ] Social sharing features
- [ ] Mobile app (React Native)

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🤝 Support

For questions or support, please open an issue in the repository or contact the development team.

---

Built with ❤️ using Next.js and modern web technologies.
