import React,{ Component } from 'react'
import UploadAvatar from '../components/UploadAvatar';
import store from "../reducer/reducer";
let state = store.getState();
store.subscribe(function () {
    state = store.getState();
});
class AdvertisementBox extends React.Component{
    state={visible:false};
    onClickHandle(e){
        // console.log(e.button);
        if(state.homeState.userInfo.level <=2){
            this.setState({visible:true});
        }
    }
    handOk(){
        this.setState({visible: false});
    }
    handleCancel(){
        this.setState({visible: false});
    }
    render(){
        return (<div onClick={(e)=>this.onClickHandle(e)} className='advertisement-box'>
            <img src='./images/ads.png' />
            <UploadAvatar visible={this.state.visible}
                          title={'请上传广告图片'}
                          handleOk={this.handOk.bind(this)}
                          handleCancel={this.handleCancel.bind(this)}
            >
            </UploadAvatar>
        </div>)
    }
}

export default AdvertisementBox;