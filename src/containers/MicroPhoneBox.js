import React,{ Component }  from 'react'
import MicroPhone from '../components/MicroPhone'

class MicroPhoneBox extends React.Component {
    render(){
        return (<div className='microphone_area'><MicroPhone></MicroPhone></div>)
    }
}

export default MicroPhoneBox;