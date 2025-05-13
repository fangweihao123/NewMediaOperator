import api from './config'

export const initializeCrawler = () => {
    return api.post('/crawler/init');
}

export const getVideos = (secUid) => {
    return api.get(`/crawler/videos/${secUid}`);
}

export const getMessages = () => {
    return api.get('/crawler/messages');
} 