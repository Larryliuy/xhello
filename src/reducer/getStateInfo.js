import store from "./reducer";

let state = store.getState();
store.subscribe(function () {
    state = store.getState()
});

let uId = state.homeState.userInfo.id,
    uName = state.homeState.userInfo.userName,
    uLevel = state.homeState.userInfo.level,
    uSex = state.homeState.userInfo.sex;
let rId = state.homeState.currentRoomInfo.id,
    rName = state.homeState.currentRoomInfo.title,
    rOnline = state.homeState.currentRoomInfo.online,
    rLiving = state.homeState.currentRoomInfo.living;
console.log('get:'+rName);
export { uId, uName, uLevel, uSex, rId, rName, rOnline, rLiving };
export default state;