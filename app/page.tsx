import { redirect } from 'next/navigation'

export default function HomePage() {
  // Redirect users to the polls dashboard
  redirect('/polls')
}
