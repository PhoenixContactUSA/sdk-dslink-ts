// part of dslink.responder;
export class Response {
    constructor() {
        this._sentStreamStatus = StreamStatus.initialize;
        /// close the response now, no need to send more response update
    }
    get sentStreamStatus() { return this._sentStreamStatus; }
    Response(responder, rid, [], type = null) { }
    ;
    /// close the request from responder side and also notify the requester
    close(err = null) {
        _sentStreamStatus = StreamStatus.closed;
        responder.closeResponse(rid, error, err, response, this);
    }
}
/// close the response now, no need to send more response update
void _close();
{ }
prepareSending();
{
    if (!_pendingSending) {
        _pendingSending = true;
        responder.addProcessor(this);
    }
}
_pendingSending: boolean = false;
startSendingData(currentTime, number, waitingAckId, number);
{
    _pendingSending = false;
}
ackReceived(receiveAckId, number, startTime, number, currentTime, number);
{
    // TODO: implement ackReceived
}
/// for the broker trace action
getTraceData(change, string = '+');
ResponseTrace;
{
    return null;
}
//# sourceMappingURL=response.js.map