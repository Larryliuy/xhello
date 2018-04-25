import React,{ Component } from 'react'
import store from "../reducer/reducer";
import { Button } from 'antd';
let state = store.getState();
store.subscribe(function () {
    state = store.getState();
});
const testClick = function () {
    let content, fileName, saveBtn;
    content = window.localStorage.getItem(state.homeState.userInfo.name);
    fileName = state.homeState.userInfo.name+'_test.txt';
    saveBtn = document.querySelector( '#test-doc' );
    // content.addEventListener( 'change', function self(){
    //     saveBtn.setAttribute( 'href', 'data:text/paint; utf-8,' + content.value );
    //     return self;
    // }() );
    saveBtn.setAttribute( 'href', 'data:text/paint; utf-8,' + content );
    saveBtn.setAttribute( 'download', fileName);
};

const TestDoc=()=>(<div>
    <a id={'test-doc'} onClick={testClick}><Button style={{position:'absolute',right:'20px',bottom:'10px',zIndex:1000}}>测试文档</Button></a>
</div>);

export default TestDoc;