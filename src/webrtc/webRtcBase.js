let normalQuitUsers = {}; /** 正常退出的用户*/


/**
 * 添加到正常退出名单
 * */
function addToNormalQuitUsers(userId) {
    normalQuitUsers[userId] = true;
}
/**
 * 添加到正常退出名单
 * */
function removeToNormalQuitUsers(userId) {
    if(normalQuitUsers[userId]){
        delete normalQuitUsers[userId];
    }
}

/**
 * 清空正常退出名单
 * */
function emptyNormalQuitUsers() {
    normalQuitUsers = {};
}

/**
 * 获得正常退出名单
 * */

function getNormalQuitUsers() {
    return normalQuitUsers;
}

export { getNormalQuitUsers, addToNormalQuitUsers, removeToNormalQuitUsers, emptyNormalQuitUsers }