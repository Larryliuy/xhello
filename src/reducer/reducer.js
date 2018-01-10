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
    MESSAGEDATA:'MESSAGEDATA'
};
function toggleLogin() {
    return {
        type:CONSTANT.ISLOGINED,
        val:false
    }
}
export function collapsed(bool) {
    return {
        type:CONSTANT.VIEWMODEL,
        val:bool
    }
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
const homeInitState = {viewModel:false,skinColor:'#108ee9',
    lastRoomInfo:{},//上次房间信息
    currentRoomInfo :{},//当前房间信息
    roomMicrophoneUser:[],//房间麦序列表
    userInfo:{},//用户信息
    allRoomList:[],//所有房间用户数据
    searchResult:[],//用户查找结果
    searchKeyword:'',//用户查找关键字
    location:{x:0,y:0,display:'none',obj:0},//房间列表右键点击定位及目标
    roomStatus:{},//用于存储各房间打开/关闭状态
    messageData:[],//用于存储各房间打开/关闭状态
};
export const homeState = (state = homeInitState,action)=>{
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
        case CONSTANT.ROOMSTATUS:
            return Object.assign({},tmpState,{roomStatus:action.val});
        case CONSTANT.MESSAGEDATA:
            return Object.assign({},tmpState,{messageData:action.val});
        default:
            // console.log('default');
            return homeInitState;
    }
};

/*多个reducer合成一个reducer*/
const reducer = combineReducers({loginState,homeState});

export default createStore(reducer);
