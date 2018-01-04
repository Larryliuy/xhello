/*const loginApi = 'http://192.168.6.3:82/softwares/xtell_projects_dev/24_YUN_VIDEO/server/app/api/user/login.php';
const registerApi = 'http://192.168.6.3:82/softwares/xtell_projects_dev/24_YUN_VIDEO/server/app/api/user/register.php';*/
const loginApi = 'http://a701.xtell.cn:82/softwares/xtell_projects_dev/24_YUN_VIDEO/server/app/api/user/login.php';
const registerApi = 'http://a701.xtell.cn:82/softwares/xtell_projects_dev/24_YUN_VIDEO/server/app/api/user/register.php';
function getGeneralApi(action,table,cond) {
    return 'http://a701.xtell.cn:82/softwares/xtell_projects_dev/24_YUN_VIDEO/server/app/api/ApiGeneral.php?action='+action+'&table='+table+'&cond='+cond;
}
export {loginApi, registerApi, getGeneralApi};