export function toSessionUser(profile) {
  const groups = profile.groups || []

  return {
    ...profile,
    role: profile.is_staff || groups.includes('Admin')
      ? 'Admin'
      : groups.includes('Librarian')
        ? 'Librarian'
        : 'Member',
    initials: (profile.first_name || profile.username || 'U')
      .slice(0, 2)
      .toUpperCase(),
  }
}

export function clearStoredTokens() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
}