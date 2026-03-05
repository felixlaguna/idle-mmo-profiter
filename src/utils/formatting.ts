import type { ResourceSkill } from '../types'

/**
 * Format a resource skill name for display.
 * Capitalizes the first letter.
 *
 * @param skill - Resource skill name (e.g., 'mining', 'woodcutting')
 * @returns Formatted skill name (e.g., 'Mining', 'Woodcutting')
 */
export function formatSkillName(skill: ResourceSkill | null): string {
  if (!skill) return 'Skill'
  return skill.charAt(0).toUpperCase() + skill.slice(1)
}
