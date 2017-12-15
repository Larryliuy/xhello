import React,{ Component } from 'react';
import RightClickPanel from '../components/RightClickPanel';

import store,{ CONTANT } from '../reducer/reducer';

let state = store.getState();
store.subscribe(function(){
    state = store.getState();
});

class RightClickPanelBox extends React.Component{
    constructor(props){
        super(props);
    }
    render(){
        return (<div id='right-click'
        style={{position:'absolute',
            width:'160px',height:'100%',
            display:state.homeState.location.display,
            left:state.homeState.location.x,
            top:state.homeState.location.y}}
        >
            <RightClickPanel></RightClickPanel>
        </div>)
    }
}

export default RightClickPanelBox;