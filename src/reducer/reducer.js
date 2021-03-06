import { combineReducers , createStore } from 'redux';

/*action
* 定义类型常量和action创建函数
* */
export const CONSTANT = {
    ISLOGINED:'ISLOGINED',
    VIEWMODEL:'VIEWMODEL',
    SKINCOLOR:'SKINCOLOR',
    CURRENTCHANNELID:'CURRENTCHANNELID',
    CURRENTROOMINFO:'CURRENTROOMINFO',
    LASTROOMINFO:'LASTROOMINFO',
    SEARCHKEYWORD:'SEARCHKEYWORD',
    SEARCHRESULT:'SEARCHRESULT',
    ALLROOMLIST:'ALLROOMLIST',
    LOCATION:'LOCATION',
    USERINFO:'USERINFO',
    ROOMMICROPHONEUSER:'ROOMMICROPHONEUSER',
    ROOMSTATUS:'ROOMSTATUS',
    MESSAGEDATA:'MESSAGEDATA',
    SENDDATA:'SENDDATA',
    FIRSTUSERAVATAR:'FIRSTUSERAVATAR',
    PREOFFERCOUNT:'PREOFFERCOUNT',
    MICROPHONEMODE:'MICROPHONEMODE',
    MICROPHONEOPEN:'MICROPHONEOPEN',
    MICROPHONEINPUT:'MICROPHONEINPUT',
    MICROPHONEINPUTUSERS:'MICROPHONEINPUTUSERS',
    MYAUDIOTRACK:'MYAUDIOTRACK',
    USERIDLIST:'USERIDLIST',
    USERINFOLIST:'USERINFOLIST',
    NUMBERONE:'NUMBERONE',
    ISYOUKU:'ISYOUKU',
    ISANSWER:'ISANSWER',
};
export function collapsed(bool) {
    return {
        type:CONSTANT.VIEWMODEL,
        val:bool
    };
}

/*reducer
处理这个视图和数据状态
*/
const loginInitState = false;
export const loginState = (state = loginInitState,action) => {
    switch (action.type){
        case CONSTANT.ISLOGINED:
            return true;
        default:
            return loginInitState;
    }
};
const homeInitState = {
    viewModel:false,
    skinColor:'#108ee9',
    lastRoomInfo:{},//上次房间信息
    currentRoomInfo :{},//当前房间信息
    roomMicrophoneUser:[],//房间麦序列表
    userInfo:{},//用户信息
    allRoomList:[],//所有房间用户数据
    searchResult:[],//用户查找结果
    searchKeyword:'',//用户查找关键字
    location:{x:0,y:0,display:'none',obj:0},//房间列表右键点击定位及目标
    roomStatus:{},//用于存储各房间打开/关闭状态
    messageData:[],//所有消息数据
    sendData:'',//自己发送的消息数据
    firstUserAvatar:'./images/avatar.png',//麦序第一个用户的头像
    preOfferCount:0,
    numberOne:0,//表示老大的id
    isAnswer:false,//表示是否是被连接节点
    microphoneMode:1,//表示自由模式
    microphoneOpen:false,//表示自己麦克风的开关状态
    microphoneInput:false,//表示麦克风是否有音源舒服
    microphoneInputUsers:{},//表示有音源输入的其他人
    myAudioTrack:'',//自己的音轨
    userIdList:'',//循环给用户发送preOffer的ID列表
    userInfoList:'',//循环给用户发送preOffer的列表
    isYouku:false//点播的连接是否是youku(优酷)
};
let homeState = (state = homeInitState,action)=>{
    let tmpState = state;
    switch (action.type){
        case CONSTANT.CURRENTROOMINFO:
            return Object.assign({},tmpState,{currentRoomInfo:action.val});
        case CONSTANT.LASTROOMINFO:
            return Object.assign({},tmpState,{lastRoomInfo:action.val});
        case CONSTANT.SKINCOLOR:
            return Object.assign({},tmpState,{skinColor:action.val});
        case CONSTANT.SEARCHRESULT:
            return Object.assign({},tmpState,{searchResult:action.val});
        case CONSTANT.SEARCHKEYWORD:
            return Object.assign({},tmpState,{searchKeyword:action.val});
        case CONSTANT.ALLROOMLIST:
            return Object.assign({},tmpState,{allRoomList:action.val});
        case CONSTANT.LOCATION:
            return Object.assign({},tmpState,{location:action.val});
        case CONSTANT.USERINFO:
            return Object.assign({},tmpState,{userInfo:action.val});
        case CONSTANT.ROOMMICROPHONEUSER:
            return Object.assign({},tmpState,{roomMicrophoneUser:action.val});
        case CONSTANT.MICROPHONEMODE:
            return Object.assign({},tmpState,{microphoneMode:action.val});
        case CONSTANT.MICROPHONEOPEN:
            return Object.assign({},tmpState,{microphoneOpen:action.val});
        case CONSTANT.MICROPHONEINPUT:
            return Object.assign({},tmpState,{microphoneInput:action.val});
        case CONSTANT.MICROPHONEINPUTUSERS:
            return Object.assign({},tmpState,{microphoneInputUsers:action.val});
        case CONSTANT.ROOMSTATUS:
            return Object.assign({},tmpState,{roomStatus:action.val});
        case CONSTANT.MESSAGEDATA:
            return Object.assign({},tmpState,{messageData:action.val});
        case CONSTANT.SENDDATA:
            return Object.assign({},tmpState,{sendData:action.val});
        case CONSTANT.FIRSTUSERAVATAR:
            return Object.assign({},tmpState,{firstUserAvatar:action.val});
        case CONSTANT.PREOFFERCOUNT:
            return Object.assign({},tmpState,{preOfferCount:action.val});
        case CONSTANT.MYAUDIOTRACK:
            return Object.assign({},tmpState,{myAudioTrack:action.val});
        case CONSTANT.USERIDLIST:
            return Object.assign({},tmpState,{userIdList:action.val});
        case CONSTANT.USERINFOLIST:
            return Object.assign({},tmpState,{userInfoList:action.val});
        case CONSTANT.NUMBERONE:
            return Object.assign({},tmpState,{numberOne:action.val});
        case CONSTANT.ISYOUKU:
            return Object.assign({},tmpState,{isYouku:action.val});
        case CONSTANT.ISANSWER:
            return Object.assign({},tmpState,{isAnswer:action.val});
        default:
            // console.log('default');
            return homeInitState;
    }
};



/*多个reducer合成一个reducer*/
const reducer = combineReducers({loginState,homeState});
export { homeState };
export default createStore(reducer);
