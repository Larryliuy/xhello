import React,{ Component } from 'react'
import { List, Avatar } from 'antd';


class MessageList extends React.Component{
    constructor(props) {
        super(props)
    }
    render(){
        const data = [{username:'larry',time:'2017-12-11 13:12'},
            {username:'larry',time:'2017-12-11 13:12'},
            {username:'larry',time:'2017-12-11 13:12'},
            {username:'larry',time:'2017-12-11 13:12'},
            {username:'larry',time:'2017-12-11 13:12'},
            {username:'larry',time:'2017-12-11 13:12'},
            {username:'larry',time:'2017-12-11 13:12'},
            {username:'larry',time:'2017-12-11 13:12'},
            {username:'larry',time:'2017-12-11 13:12'},
            {username:'larry',time:'2017-12-11 13:12'},
            {username:'larry',time:'2017-12-11 13:12'},
            {username:'larry',time:'2017-12-11 13:12'},
            {username:'larry',time:'2017-12-11 13:12'},
            {username:'larry',time:'2017-12-11 13:12'},
            {username:'larry',time:'2017-12-11 13:12'}];
        return (<List
            size="small"
            itemLayout="horizontal"
            dataSource={data}
            renderItem={item => (
                <List.Item>
                    <List.Item.Meta
                        avatar={<Avatar src="https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png" />}
                        title={<p>{item.username} {item.time}</p>}
                        description={<p style={{color:'red'}}>111</p>}
                    />
                </List.Item>
            )}
        />)
    }
}


export default MessageList