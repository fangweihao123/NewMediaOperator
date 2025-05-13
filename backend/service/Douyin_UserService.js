const axios = require('axios');

class Douyin_UserService{
    constructor(AuthInfo){
        this.baseUrl = 'https://open.douyin.com/oauth/userinfo/';
        this.clientKey = process.env.DOUYIN_CLIENT_KEY;
        this.clientSecret = process.env.DOUYIN_CLIENT_SECRET;
        this.AuthInfo = AuthInfo;
    }

    async GetAuthUserInfo(){
        try {
            const authInfos = await this.AuthInfo.findAll();
            const results = [];

            for (const authInfo of authInfos) {
                const response = await axios.post(this.baseUrl, {
                    access_token: authInfo.accessToken,
                    open_id: authInfo.open_id
                });
            
                if (response.data && response.data.message === 'success') {
                    results.push(response.data.data);
                }
            }
            return results;
        } catch (error) {
            console.error('Error fetching user info:', error);
            throw error;
        }
    }
}

module.exports = Douyin_UserService;