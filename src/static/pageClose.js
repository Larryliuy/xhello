/*let s = "test";
function fclose()
{
    if(s=="no")
        alert("unload me!="+s+"这是刷新页面！");
    else
        alert("这是关闭页面");
}
function fload()
{
    alert("load me!="+s);
}
function bfunload()
{
    s = "no";
}*/

import WS,{ instanceWS } from './webSocket';

window.onunload = function(){
    let a_n = window.event.screenX - window.screenLeft;
    let a_b = a_n > document.documentElement.scrollWidth-20;
    if(a_b && window.event.clientY< 0 || window.event.altKey){
        alert('关闭页面行为');
        console.log('close');
        WS.close();
        return '关闭成功';
    }else{
        console.log('upload');
        alert('跳转或者刷新页面行为');
        // upload();
        return '刷新成功';
    }
};

function upload(){
    WS.close();
    instanceWS();
}

/*
window.onunload = fclose;
window.onload = fload;
window.onbeforeunload = bfunload;*/
