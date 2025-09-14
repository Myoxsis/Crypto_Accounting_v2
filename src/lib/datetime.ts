import dayjs from 'dayjs'

export function combineDateTime(dateStr: string, timeStr?: string): string {
  const d = dayjs(dateStr)
  if (!timeStr) return d.hour(dayjs().hour()).minute(dayjs().minute()).second(dayjs().second()).format('YYYY-MM-DDTHH:mm:ss')
  const [h, m] = timeStr.split(':').map(Number)
  return d.hour(h || 0).minute(m || 0).second(0).format('YYYY-MM-DDTHH:mm:ss')
}
