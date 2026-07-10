const userAgent = process.env.npm_config_user_agent || ''

if (!userAgent.startsWith('pnpm')) {
  console.error('\nThis project uses pnpm only. Please run:\n\n  pnpm install\n')
  process.exit(1)
}
