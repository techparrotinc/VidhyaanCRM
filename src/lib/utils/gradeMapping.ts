export function mapGradeValue(
  grade: string | null | undefined
): string {
  if (!grade) return ''
  const g = grade.toLowerCase()
    .trim()
    .replace(/[\s\/\-]+/g, '_')

  const map: Record<string, string> = {
    'pre_kg': 'pre_kg',
    'pre_kg_nursery': 'pre_kg',
    'nursery': 'nursery',
    'lkg': 'lkg',
    'ukg': 'ukg',
    'kg': 'ukg',
    'class_1': 'class_1',
    'grade_1': 'class_1',
    'class_2': 'class_2',
    'grade_2': 'class_2',
    'class_3': 'class_3',
    'grade_3': 'class_3',
    'class_4': 'class_4',
    'class_5': 'class_5',
    'class_6': 'class_6',
    'class_7': 'class_7',
    'class_8': 'class_8',
    'class_9': 'class_9',
    'class_10': 'class_10',
    'class_11': 'class_11_science',
    'class_12': 'class_12_science',
  }

  if (map[g]) return map[g]
  const num = grade.match(/\d+/)
  if (num) {
    const n = parseInt(num[0])
    if (n >= 1 && n <= 10)
      return 'class_' + n
  }
  return grade
}
