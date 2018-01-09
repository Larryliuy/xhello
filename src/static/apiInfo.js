/*const loginApi = 'http://192.168.6.3:82/softwares/xtell_projects_dev/24_YUN_VIDEO/server/app/api/user/login.php';
const registerApi = 'http://192.168.6.3:82/softwares/xtell_projects_dev/24_YUN_VIDEO/server/app/api/user/register.php';*/
const loginApi = 'http://a701.xtell.cn:82/softwares/xtell_projects_dev/24_YUN_VIDEO/server/app/api/user/login.php';
const registerApi = 'http://a701.xtell.cn:82/softwares/xtell_projects_dev/24_YUN_VIDEO/server/app/api/user/register.php';
const generalApi = 'http://a701.xtell.cn:82/softwares/xtell_projects_dev/24_YUN_VIDEO/server/app/api/ApiGeneral.php';
const redirect_uri = 'http://a701.xtell.cn:82/softwares/xtell_projects_dev/24_YUN_VIDEO/src/web/index.html#/';
function getGeneralArgs(action,table,cond) {
    return '?action='+action+'&table='+table+'&cond='+cond;
}
export {loginApi, registerApi, generalApi, redirect_uri, getGeneralArgs};
