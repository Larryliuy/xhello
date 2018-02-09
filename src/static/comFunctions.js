/**
 * 整体说明，可变变量使用let定义，需要se6及以上才可以直接使用
 */

/**
 * 用于生产随机字符串的数组
 * @param randomFlag 是否随机
 * @param min 生成随机字符串的最小位数
 * @param max 生成随机字符串的最大位数
 * @returns {string} 返回生成的随机数
 */
function randomWord(randomFlag, min, max){
    let str = "",
        range = min,
        pos,
        arr = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

    // 随机产生
    if(randomFlag){
        range = Math.round(Math.random() * (max-min)) + min;
    }
    for(let i=0; i<range; i++){
        pos = Math.round(Math.random() * (arr.length-1));
        str += arr[pos];
    }
    return str;
}

/**
 * 用于截取uri参数
 * @param str URL 问号‘?’后面的字符串
 * @param name key=value的key值
 * @returns {*}
 * @constructor
 */
function GetQueryString(str,name) {
    let reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
    let r = str.match(reg);
    if (r != null) return decodeURI(r[2]);
    return null;
}

/**
 * 用于调整麦序的函数，不属于通用型函数
 * @param onMicusers 数组列表
 * @param orderInfo 需要调整的用户信息，type === 'up'表示向上移动，type === 'down'表示向下移动
 * @returns {*} 返回值是调整之后的新数组
 */

function ajustUserOrder(onMicusers,orderInfo) {
    let userTpm,onMicusersTpm = onMicusers;
    console.log(onMicusersTpm);
    console.log(onMicusersTpm[0]);
    if(orderInfo.type === 'up'){
        for(let i = 0,len = onMicusers.length; i < len; i++){
            if(onMicusersTpm[i].id == orderInfo.userId){
                console.log('index:'+i);
                userTpm = onMicusersTpm[i];
                onMicusersTpm[i] = onMicusersTpm[i-1];
                onMicusersTpm[i-1] = userTpm;
                break;
            }
        }
    }else if(orderInfo.type === 'down'){
        for(let i = 0,len = onMicusers.length; i < len; i++){
            if(onMicusersTpm[i].id == orderInfo.userId){
                console.log('index:'+i);
                userTpm = onMicusersTpm[i];
                onMicusersTpm[i] = onMicusersTpm[i+1];
                onMicusersTpm[i+1] = userTpm;
                break;
            }
        }
    }else{
        console.error('orderInfo.type错误:'+orderInfo.type);
    }
    return onMicusersTpm;
}

/**
 * 用于调整房间顺序的函数，不属于通用型函数
 * @param onMicusers 数组列表
 * @param orderInfo 需要调整的用户信息，type === 'up'表示向上移动，type === 'down'表示向下移动
 * @returns {*} 返回值是调整之后的新数组
 */

function ajustRoomOrder(roomList,orderInfo) {
    let roomTpm,newRoomList = roomList;
    console.log(newRoomList);
    console.log(newRoomList[0]);
    if(orderInfo.type === 'up'){
        for(let i = 0,len = roomList.length; i < len; i++){
            if(newRoomList[i].roomId == orderInfo.roomId){
                console.log('index:'+i);
                roomTpm = newRoomList[i];
                roomTpm.order = Number(roomTpm.order)-1;//更改order值
                newRoomList[i] = newRoomList[i-1];
                newRoomList[i].order = Number(newRoomList[i].order)+1;//更改order值
                newRoomList[i-1] = roomTpm;
                break;
            }
        }
    }else if(orderInfo.type === 'down'){
        for(let i = 0,len = roomList.length; i < len; i++){
            if(newRoomList[i].roomId == orderInfo.roomId){
                console.log('index:'+i);
                roomTpm = newRoomList[i];
                roomTpm.order = Number(roomTpm.order)+1;//更改order值
                newRoomList[i] = newRoomList[i+1];
                newRoomList[i].order = Number(newRoomList[i].order)-1;//更改order值
                newRoomList[i+1] = roomTpm;
                break;
            }
        }
    }else{
        console.error('orderInfo.type错误:'+orderInfo.type);
    }
    return newRoomList;
}

export { randomWord, GetQueryString, ajustUserOrder, ajustRoomOrder }