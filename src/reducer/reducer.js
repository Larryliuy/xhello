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
    SEARCHKEYWORD:'SEARCHKEYWORD',
    SEARCHRESULT:'SEARCHRESULT',
    ALLROOMLIST:'ALLROOMLIST',
    LOCATION:'LOCATION',
    USERINFO:'USERINFO'
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
    lastRoomInfo:{id:1,online:3,living:false,title:'房间'},
    currentRoomInfo :{id:1,online:3,living:false,title:'房间1'},
    userInfo:{id:7,userName:'larry',sex:1,level:1,avatar:'./images/avatar.png'},
    allRoomList:[],
    searchResult:[],
    searchKeyword:'',
    location:{x:0,y:0,display:'none',obj:0}
};
export const homeState = (state = homeInitState,action)=>{
    let tmpState = state;
    switch (action.type){
        case CONSTANT.CURRENTROOMINFO:
            return Object.assign({},tmpState,{currentRoomInfo:action.val});
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
        default:
            // console.log('default');
            return homeInitState;
    }
};

/*多个reducer合成一个reducer*/
const reducer = combineReducers({loginState,homeState});

export default createStore(reducer);
