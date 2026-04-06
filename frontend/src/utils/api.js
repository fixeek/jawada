import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const api = {
  // Multi-file validation (4 current + 4 previous quarter slots)
  async validateMulti({ kpiData, visitDetails, timeData, eclaims,
                        prevKpiData, prevVisitDetails, prevTimeData, prevEclaims }) {
    const form = new FormData()
    if (kpiData)          form.append('kpi_data', kpiData)
    if (visitDetails)      form.append('visit_details', visitDetails)
    if (timeData)          form.append('time_data', timeData)
    if (eclaims)           form.append('eclaims', eclaims)
    if (prevKpiData)       form.append('prev_kpi_data', prevKpiData)
    if (prevVisitDetails)  form.append('prev_visit_details', prevVisitDetails)
    if (prevTimeData)      form.append('prev_time_data', prevTimeData)
    if (prevEclaims)       form.append('prev_eclaims', prevEclaims)
    const { data } = await axios.post(`${BASE}/api/validate-multi`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return data
  },

  // Multi-file calculate
  async calculateMulti(sessionId, quarter, facilityName) {
    const form = new FormData()
    form.append('session_id', sessionId)
    form.append('quarter', quarter)
    form.append('facility_name', facilityName)
    const { data } = await axios.post(`${BASE}/api/calculate-multi`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return data
  },

  // Legacy single-file endpoints (kept for compatibility)
  async validate(file) {
    const form = new FormData()
    form.append('file', file)
    const { data } = await axios.post(`${BASE}/api/validate`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return data
  },

  async calculate(fileId, quarter, facilityName) {
    const form = new FormData()
    form.append('file_id', fileId)
    form.append('quarter', quarter)
    form.append('facility_name', facilityName)
    const { data } = await axios.post(`${BASE}/api/calculate`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return data
  },

  async getResults(runId) {
    const { data } = await axios.get(`${BASE}/api/results/${runId}`)
    return data
  },

  async getAuditLog(facilityName) {
    const { data } = await axios.get(`${BASE}/api/audit/${encodeURIComponent(facilityName)}`)
    return data
  },
}
