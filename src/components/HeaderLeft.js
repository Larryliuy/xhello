import React,{ Component } from 'react'



const headLeftImg={
    verticalAlign:'sub',
    paddingRight:'5px',
    height:'18px'
}
function collectImgClick() {
    console.log("点击收藏")
}
class HeaderLeft extends Component{
    render(){
        const onlineNumber = 3;
        const roomName = '100房间';
        return (<div style={{paddingLeft:'10px',display:'inline-block',width:'100%',height:'100%',fontSize:'0px'}}>
                    <div style={{height:'50%',width:'100%',fontSize:'14px',textAlign:'left',lineHeight:'20px'}}>
                        <img style={{padding:'0 5px',height:'28px'}} src="./images/icons/star.png" alt="logo"/>
                        <label>{roomName}</label>
                    </div>
                    <div style={{height:'50%',width:'100%',color:'white',fontSize:'14px',lineHeight:'24px'}}>
                        在线:
                        <label style={{paddingRight:'23px'}}>{onlineNumber}</label>
                        <img onClick={collectImgClick}
                             style={headLeftImg}
                             src="./images/icons/star.png"
                             alt=""/>
                        <label style={{marginRight:'8px'}}>收藏</label>
                        <img style={headLeftImg} src="./images/icons/plane.png" alt=""/>飞机票
                    </div>
                </div>)
    }
}

export default HeaderLeft

