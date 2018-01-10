import React,{ Component } from 'react';
import ReactDom from 'react-dom';
import {BrowserRouter, HashRouter, Route, withRouter, Switch} from 'react-router-dom';
import { connect,Provider } from 'react-redux';
import store,{collapsed,CONSTANT} from './reducer/reducer';
import LoginBox from './containers/LoginBox';
import RegisterBox from './containers/RegisterBox';
import HomeLayout from './containers/HomeLayout';

//css
const h4Style = {
    // textAlign:'center',
    height:'100%'
};

class App extends React.Component {
    componentWillMount(){
        // history.back();
        if(location.href.indexOf('code=') !== -1){
            console.log(location.href);
            alert('before-router');
        }
    }
render(){
    // console.log(location.href);
    return (
            <div style={h4Style}>
                <Switch>
                    {/*<Route exact path='/login' component={LoginBox}/>*/}
                    <Route path='/register' component={RegisterBox}/>
                    <Route path='/home' component={HomeLayout}/>
                    <Route exact path='/' component={LoginBox}/>
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
        <HashRouter>
        <App1/>
        </HashRouter>
    </Provider>,
    document.getElementById('main'));