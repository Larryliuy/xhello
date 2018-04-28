/*const loginApi = 'http://192.168.6.3:82/softwares/xtell_projects_dev/24_YUN_VIDEO/server/app/api/user/login.php';
const registerApi = 'http://192.168.6.3:82/softwares/xtell_projects_dev/24_YUN_VIDEO/server/app/api/user/register.php';*/
const loginApi = '../../server/app/api/user/login.php';
const registerApi = '../../server/app/api/user/register.php';
const blockIpApi = '../../server/app/api/ApiBlockIp.php';
const blockUserApi = '../../server/app/api/ApiBlockUser.php';
const uploadJpegApi = '../../server/app/api/ApiUploadJpeg.php';
const getImgApi = '../../server/files/';//https://a701.xtell.cn/softwares/xtell_projects_dev/24_YUN_VIDEO/server/app/api/../../files/FILEID.dat
const getUserInfoApi = '../../server/app/api/ApiGetqqUserInfo.php';
const generalApi = '../../server/app/api/ApiGeneral.php';
const redirect_uri = encodeURIComponent('https://a701.xtell.cn/softwares/xtell_projects_dev/24_YUN_VIDEO/src/web/index.php');
const homePage = location.href.substring(0,location.href.indexOf('index.php')+9)+'#/';
const domian = 'xhello.cn';
// function getGeneralArgs(action,table,cond) {
//     return '?action='+action+'&table='+table+'&cond='+cond;
// }
export {
    loginApi, registerApi, generalApi, redirect_uri,
    domian, homePage , blockIpApi, blockUserApi,
    uploadJpegApi, getImgApi, getUserInfoApi
};

