import React,{ Component } from 'react';
import ReactDom from 'react-dom';
import {BrowserRouter, HashRouter, Route, withRouter, Switch, Redirect} from 'react-router-dom';
import { connect,Provider } from 'react-redux';
import store,{collapsed,CONSTANT} from './reducer/reducer';
import WS, {getDateString, getSendData, send} from "./static/webSocket";
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