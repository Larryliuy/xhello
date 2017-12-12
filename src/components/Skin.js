import React, { Component } from 'react';
import { Popover, Icon, List, Card } from 'antd';
import store,{CONSTANT} from '../reducer/reducer';

let state = store.getState();
store.subscribe(function () {
    state = store.getState()
});

const text = <span>请选择颜色</span>;
const color = [
                {color:'red'},
                {color:'blue'},
                {color:'green'},
                {color:'#eee'},
                {color:'#c9dbf5'},
                {color:'#108ee9'}
              ];
const clickHandle = (e) => {
    if(!e.target.style.backgroundColor) return;
    console.log(e.target.style.backgroundColor);
    store.dispatch({type:CONSTANT.SKINCOLOR,val:{skinColor:e.target.style.backgroundColor}})
};
const content = (
    <div style={{width:'200px'}} onClick={clickHandle}>
        <List
            grid={{ gutter: 16, column: 6 }}
            dataSource={color}
            renderItem={item => (
                <List.Item>
                    <Card style={{backgroundColor:item.color,width:'30px',height:'30px'}}></Card>
                </List.Item>
            )}
        />
    </div>
);

class Skin extends React.Component{
    render(){
        return (
            <Popover placement="bottom" title={text} content={content} trigger="click">
                <Icon style={{color:'blue'}} type="skin" />
            </Popover>
        )
    }
}

export default Skin;