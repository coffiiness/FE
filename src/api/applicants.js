import applicantApi from './applicantClient'

export const applicantAuthApi = {
  signup(data) {
    return applicantApi.post('/applicants/signup', data)
  },
  login(data) {
    return applicantApi.post('/applicants/login', data)
  }
}
