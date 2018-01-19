import React,{ Component } from 'react';
import ReactDom from 'react-dom';
import {BrowserRouter, HashRouter, Route, withRouter, Switch, Redirect} from 'react-router-dom';
import { connect,Provider } from 'react-redux';
import store,{collapsed,CONSTANT} from './reducer/reducer';
import WS, {getDateString, getSendData, send} from "./static/wsInstace";
import LoginBox from './containers/LoginBox';
import RegisterBox from './containers/RegisterBox';
import HomeLayout from './containers/HomeLayout';
import {onLeave} from './webrtc/webRtcCom';
let state = store.getState();
store.subscribe(function () {
    state = store.getState()
});

//css
const h4Style = {
    // textAlign:'center',
    height:'100%'
};

class App extends React.Component {
    componentDidMount(){
        //页面刷新时关闭socket
        window.addEventListener('beforeunload', function (event) {
            let data = state.homeState.userInfo.name + "<p>离开了房间</p>" + state.homeState.lastRoomInfo.title,
                leaveMsg = getSendData(
                    'leave_room',
                    state.homeState.currentRoomInfo.roomId,
                    state.homeState.currentRoomInfo.roomName,
                    state.homeState.userInfo,
                    data);
            // WS.send(JSON.stringify(enterMsg));
            send(JSON.stringify(leaveMsg),function(){
            });
            WS.close();
            onLeave();
            // event.returnValue = "离开页面将丢失信息";
            // return "离开页面将丢失信息！";
        });
    }
render(){
    // console.log(location.href);
    return (
            <div style={h4Style}>
                <Switch>
                    <Route path='/register' component={RegisterBox}/>
                    {state.homeState.userInfo.id && <Route path='/home' component={HomeLayout}/>}
                    <Route path='/' component={LoginBox}/>
                </Switch>
            </div>
        )
}

}


function mapStateToProps(state) {
    return {
        loginState:state.loginState,
        homeState:state.homeState
    }
}
//映射Redux action到组件属性
function mapDispatchToProps(dispatch) {
    return {
        onClick:dispatch(collapsed(CONSTANT.COLLAPSED))
    }
}


const App1=withRouter(connect(mapStateToProps)(App));

ReactDom.render(
    <Provider store={store}>
        <HashRouter basename='/'>
        <App1/>
        </HashRouter>
    </Provider>,
    document.getElementById('main'));