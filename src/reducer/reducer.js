import { combineReducers , createStore } from 'redux';

/*action
* 定义类型常量和action创建函数
* */
export const CONSTANT = {
    ISLOGINED:'ISLOGINED',
    VIEWMODEL:'VIEWMODEL',
    SKINCOLOR:'SKINCOLOR',
    CURRENTCHANNELID:'CURRENTCHANNELID',
    CURRENTROOMID:'CURRENTROOMID'
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
const homeInitState = {viewModel:false,skinColor:'green',currentChannelId:1,currentRoomId :0};
export const homeState = (state = homeInitState,action)=>{
    let tmpState = state;
    switch (action.type){
        case CONSTANT.VIEWMODEL:
            return Object.assign({},tmpState,{viewModel:action.val.viewModel});
        case CONSTANT.SKINCOLOR:
            return Object.assign({},tmpState,{skinColor:action.val.skinColor});
        default:
            console.log('default')
            return homeInitState;
    }
};

/*多个reducer合成一个reducer*/
const reducer = combineReducers({loginState,homeState});

export default createStore(reducer);
