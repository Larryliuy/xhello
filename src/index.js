import React,{ Component } from 'react';
import ReactDom from 'react-dom';
import {BrowserRouter, Route, withRouter} from 'react-router-dom';
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
render(){
    return (

            <div style={h4Style}>
                <Route exact path='/' component={LoginBox}/>
                <Route path='/register' component={RegisterBox}/>
                <Route path='/home' component={HomeLayout}/>
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
        <BrowserRouter>
        <App1/>
        </BrowserRouter>
    </Provider>,
    document.getElementById('main'));