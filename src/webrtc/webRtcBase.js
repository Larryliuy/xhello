let normalQuitUsers = {},unexpectedUsers={}; /** 正常退出的用户*/

/**
 * 获得正常退出名单
 * */

function getNormalQuitUsers() {
    return normalQuitUsers;
}
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
 * 获得异常退出名单
 * */

function getUnexpectedUsers() {
    return unexpectedUsers;
}

/**
 * 添加到异常退出名单
 * */
function addUnexpectedUsers(userId) {
    unexpectedUsers[userId] = true;
}

/**
 * 删除到异常退出名单
 * */
function removeUnexpectedUsers(userId) {
    if(unexpectedUsers[userId]){
        delete unexpectedUsers[userId];
    }
}
/**
 * 清空异常退出名单
 * */
function emptyUnexpectedUsers() {
    unexpectedUsers = {};
}


export {
    getNormalQuitUsers, addToNormalQuitUsers, removeToNormalQuitUsers, emptyNormalQuitUsers,
    getUnexpectedUsers, addUnexpectedUsers, removeUnexpectedUsers, emptyUnexpectedUsers,
};