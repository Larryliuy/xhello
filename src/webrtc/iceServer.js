let stun_server = {
        urls: 'stun:turn.xtell.cn:3479'
    },/** stun服务器*/
    turn_server_self = {
        urls: 'turn:turn.xtell.cn:3478',
        credential: 'webrtc',
        username: 'webrtc'
    },
    turn_server = {
        urls: 'turn:13.250.13.83:3478?transport=udp',
        credential: 'YzYNCouZM1mhqhmseWk6',
        username: 'YzYNCouZM1mhqhmseWk6'
    },/** TURN服务器*/
    iceServers = [
        stun_server,
        {
            urls: 'stun:stun.freeswitch.org'
        },
        {
            urls: 'stun:stun.xten.com'
        },
        {
            urls: 'stun:stun.ekiga.net'
        },
        turn_server,
        turn_server_self,
        {
            url: 'turn:192.158.29.39:3478?transport=udp',
            credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
            username: '28224511:1379330808'
        },
        {
            url: 'turn:192.158.29.39:3478?transport=tcp',
            credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
            username: '28224511:1379330808'
        },
        {
            url: 'turn:turn.bistri.com:80',
            credential: 'homeo',
            username: 'homeo'
        },
        {
            url: 'turn:turn.anyfirewall.com:443?transport=tcp',
            credential: 'webrtc',
            username: 'webrtc'
        },
        stun_server,

    ];/** ice服务器*/

export { iceServers };