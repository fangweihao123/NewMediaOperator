import { createStore } from 'vuex'

export default createStore({
  state: {
    account: null,
    videos: []
  },
  mutations: {
    setAccount(state, account) {
      state.account = account
    },
    setVideos(state, videos) {
      state.videos = videos
    }
  },
  actions: {
    updateAccount({ commit }, account) {
      commit('setAccount', account)
    },
    updateVideos({ commit }, videos) {
      commit('setVideos', videos)
    }
  },
  getters: {
    isLoggedIn: state => !!state.account,
    getAccount: state => state.account,
    getVideos: state => state.videos
  }
}) 