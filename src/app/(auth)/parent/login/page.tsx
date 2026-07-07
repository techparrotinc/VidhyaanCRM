import { redirect } from 'next/navigation'

// Login is unified — role is detected from the phone number.
// Route kept alive for old links and bookmarks.
export default function ParentLoginRedirect() {
  redirect('/login')
}
