const IN_USE = '\uC0AC\uC6A9\uC911' // Korean status: in-use
const UNUSED = '\uBBF8\uC0AC\uC6A9' // Korean status: unused

export const TEMPLATE_STATUS = {
  IN_USE,
  UNUSED
}

export const normalizeTemplateStatus = (rawStatus) => {
  const status = String(rawStatus || '').trim()
  if (!status) return UNUSED

  // Accept both compact and spaced variants, e.g. "사용중" and "사용 중".
  const compact = status.replace(/\s+/g, '')
  if (compact === IN_USE) return IN_USE
  if (compact === UNUSED) return UNUSED

  return status
}

export const isTemplateInUse = (rawStatus) => {
  return normalizeTemplateStatus(rawStatus) === IN_USE
}