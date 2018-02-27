// import cookieUtil from '../libs/cookieUtil';

const cookieUtil = {
    get:(name)=>{
        let cookieName = encodeURIComponent(name)+'=',
            cookieStart = document.cookie.indexOf(cookieName),
            cookieValue = null;
        if(cookieStart > -1){
            let cookieEnd = document.cookie.indexOf(';',cookieStart);
            if(cookieEnd == -1){
                cookieEnd = document.cookie.length;
            }
            cookieValue = decodeURIComponent(document.cookie.substring(cookieStart+cookieName.length,cookieEnd))
        }
        return cookieValue;
    },
    set:(name,value,expires,path,domain,secure)=> {
        let cookieText = encodeURIComponent(name) + '=' + encodeURIComponent(value);
        if (expires instanceof Date) {
            cookieText += ";expires=" + expires.toGMTString();
        }
        if (path) {
            cookieText += ";path=" + path;
        }

        if (secure) {
            cookieText += ";secure=" + secure;
        }
        document.cookie = cookieText;
    },
    unset:(name,path,domain,secure)=>{
        cookieUtil.set(name,'',new Date(0),path,domain,secure);
    }

};

function callback(user)
{
    console.log(user);
    let accessToken = cookieUtil.get('accessToken');
    let args = 'access_token='+accessToken+'&oauth_consumer_key='+user.client_id+'&openid='+user.openid;
    let path = 'https://graph.qq.com/user/get_user_info?';
    let url = path + args;
    let script = document.createElement('script');
    script.src = url;
    document.body.appendChild(script);
}