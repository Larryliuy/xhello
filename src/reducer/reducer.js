import { combineReducers , createStore } from 'redux';

/*action
* 定义类型常量和action创建函数
* */
export const CONSTANT = {
    ISLOGINED:'ISLOGINED',
    VIEWMODEL:'VIEWMODEL',
    SKINCOLOR:'SKINCOLOR',
    CURRENTCHANNELID:'CURRENTCHANNELID',
    CURRENTROOMINFO:'CURRENTROOMINFO'
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
const homeInitState = {viewModel:false,skinColor:'#108ee9',currentChannelId:1,currentRoomInfo :{id:1,online:3,living:false}};
export const homeState = (state = homeInitState,action)=>{
    let tmpState = state;
    switch (action.type){
        case CONSTANT.CURRENTROOMINFO:
            return Object.assign({},tmpState,{currentRoomInfo:action.val});
        case CONSTANT.SKINCOLOR:
            return Object.assign({},tmpState,{skinColor:action.val});
        default:
            console.log('default')
            return homeInitState;
    }
};

/*多个reducer合成一个reducer*/
const reducer = combineReducers({loginState,homeState});

export default createStore(reducer);
