/*const loginApi = 'http://192.168.6.3:82/softwares/xtell_projects_dev/24_YUN_VIDEO/server/app/api/user/login.php';
const registerApi = 'http://192.168.6.3:82/softwares/xtell_projects_dev/24_YUN_VIDEO/server/app/api/user/register.php';*/
const loginApi = '../../server/app/api/user/login.php';
const registerApi = '../../server/app/api/user/register.php';
const generalApi = '../../server/app/api/ApiGeneral.php';
const redirect_uri = 'https://a701.xtell.cn/softwares/xtell_projects_dev/24_YUN_VIDEO/src/web/index.php';
function getGeneralArgs(action,table,cond) {
    return '?action='+action+'&table='+table+'&cond='+cond;
}
export { loginApi, registerApi, generalApi, redirect_uri };
