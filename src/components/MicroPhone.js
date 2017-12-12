import React,{ Component }  from 'react'
import { Select, List, Icon } from 'antd';
const Option = Select.Option;



class MicroPhone extends React.Component {
    handleChange(e){
        console.log(e)
    }
    render(){
        const data = ['larry1','larry2','larry3','larry1','larry2','larry3','larry1','larry2','larry3'];
        return (<div className='microphone-a'>
            {/*头像区域*/}
            <div className="avatar-area" >
                <img src='./images/avatar.png' />
                <p className='user-name'>larry</p>
            </div>
            <div className='online-total'>上麦总人数：3</div>
            <div className='microphone'>
                <Select defaultValue='主席模式' onChange={e => {this.handleChange(e)}}>
                    <Option value="主席模式">主席模式</Option>
                    <Option value="麦序模式">麦序模式</Option>
                    <Option value="自由模式">自由模式</Option>
                </Select>
                <span> 上麦 |</span>
                <span> 放麦 |</span>
                <span> 禁麦</span>
            </div>
            <div className='microphone-list'>
                <List
                    size='small'
                    dataSource={data}
                    renderItem={item => (<List.Item><Icon className='list-icon' type="user" />{item}</List.Item>)}
                />
            </div>
        </div>)
    }
}

export default MicroPhone;