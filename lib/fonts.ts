import { Darker_Grotesque } from 'next/font/google'

/**
 * Configuration de la police Darker Grotesque selon la charte graphique Cruzmi
 *
 * Utilisations :
 * - Grands titres : Bold (700)
 * - Sous-titres : Semibold (600)
 * - Textes : Regular (400)
 */
export const darkerGrotesque = Darker_Grotesque({
  subsets: ['latin'],
  weight: ['400', '600', '700'], // Regular, Semibold, Bold
  variable: '--font-darker-grotesque',
  display: 'swap',
})

/**
 * Classes utilitaires pour les tailles de police selon la charte
 */
export const fontSizes = {
  /** Grands titres - 50px - Darker Grotesque Bold */
  title: 'text-5xl font-bold', // 48px/50px avec font-bold (700)

  /** Sous-titres - 30px - Darker Grotesque Semibold */
  subtitle: 'text-3xl font-semibold', // 30px avec font-semibold (600)

  /** Textes - 16px - Darker Grotesque Regular */
  body: 'text-base font-normal', // 16px avec font-normal (400)
} as const
