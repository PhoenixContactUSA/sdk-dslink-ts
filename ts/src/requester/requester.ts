import {RequesterUpdate, RequestUpdater} from "./interface";
import {Listener, Stream, StreamSubscription} from "../utils/async";
import {Request} from "./request";
import {ConnectionHandler} from "../common/connection_handler";
import {RemoteNode, RemoteNodeCache} from "./node_cache";
import {ReqSubscribeListener, SubscribeRequest} from "./request/subscribe";
import {DSError, ProcessorResult, StreamStatus} from "../common/interfaces";
import {ValueUpdate} from "../common/value";
import {ListController, RequesterListUpdate} from "./request/list";
import {Permission} from "../common/permission";
import {RequesterInvokeStream, RequesterInvokeUpdate} from "./request/invoke";
import {SetController} from "./request/set";
import {RemoveController} from "./request/remove";


export class Requester extends ConnectionHandler {
  _requests: Map<number, Request> = new Map<number, Request>();

  /// caching of nodes
  readonly nodeCache: RemoteNodeCache;

  _subscription: SubscribeRequest;

  constructor(cache?: RemoteNodeCache) {
    super();
    this.nodeCache = cache ? cache : new RemoteNodeCache();
    this._subscription = new SubscribeRequest(this, 0);
    this._requests.set(0, this._subscription);
  }

  get subscriptionCount(): number {
    return this._subscription.subscriptions.size;
  }

  get openRequestCount(): number {
    return this._requests.size;
  }

  onData = (list: any[]) => {
    if (Array.isArray(list)) {
      for (let resp of list) {
        if ((resp != null && resp instanceof Object)) {
          this._onReceiveUpdate(resp);
        }
      }
    }
  };

  _onReceiveUpdate(m: any) {
    if (typeof m['rid'] === 'number' && this._requests.has(m['rid'])) {
      this._requests.get(m['rid'])._update(m);
    }
  }

  onError: Stream<DSError> = new Stream<DSError>();


  lastRid = 0;

  getNextRid(): number {
    do {
      if (this.lastRid < 0x7FFFFFFF) {
        ++this.lastRid;
      } else {
        this.lastRid = 1;
      }
    } while (this._requests.has(this.lastRid));
    return this.lastRid;
  }

  getSendingData(currentTime: number, waitingAckId: number): ProcessorResult {
    let rslt: ProcessorResult = super.getSendingData(currentTime, waitingAckId);
    return rslt;
  }

  sendRequest(m: { [key: string]: any }, updater: RequestUpdater) {
    return this._sendRequest(m, updater);
  }


  _sendRequest(m: { [key: string]: any }, updater: RequestUpdater): Request {
    m['rid'] = this.getNextRid();
    let req: Request;
    if (updater != null) {
      req = new Request(this, this.lastRid, updater, m);
      this._requests.set(this.lastRid, req);
    }
    if (this._conn) {
      this.addToSendList(m);
    }
    return req;
  }

  isNodeCached(path: string): boolean {
    return this.nodeCache.isNodeCached(path);
  }

  /**
   * Subscribe a path and get the value in a async callback
   *
   * @param path - The path to subscribe
   * @param callback - The callback
   * @param qos - The qos level of the subscription
   */
  subscribe(path: string, callback: (update: ValueUpdate) => void,
            qos: number = 0): ReqSubscribeListener {
    let node: RemoteNode = this.nodeCache.getRemoteNode(path);
    node._subscribe(this, callback, qos);
    return new ReqSubscribeListener(this, path, callback);
  }

  unsubscribe(path: string, callback: (update: ValueUpdate) => void) {
    let node: RemoteNode = this.nodeCache.getRemoteNode(path);
    node._unsubscribe(this, callback);
  }

  onValueChange(path: string, qos: number = 0): Stream<ValueUpdate> {
    let listener: ReqSubscribeListener;
    let stream: Stream<ValueUpdate>;
    stream = new Stream<ValueUpdate>(() => {

      if (listener == null) {
        listener = this.subscribe(path, (update: ValueUpdate) => {
          stream.add(update);
        }, qos);
      }
    }, () => {
      if (listener) {
        listener.close();
        listener = null;
      }
    });
    return stream;
  }

  subscribeOnce(path: string, timeoutMs: number = 0): Promise<ValueUpdate> {
    return new Promise((resolve, reject) => {
      let timer: any;
      let listener = this.subscribe(path, (update: ValueUpdate) => {
        resolve(update);

        if (listener != null) {
          listener.close();
          listener = null;
        }
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
      });
      if (timeoutMs > 0) {
        timer = setTimeout(() => {
          timer = null;
          if (listener) {
            listener.close();
            listener = null;
          }
          reject(new Error(`failed to receive value, timeout: ${timeoutMs}ms`));
        }, timeoutMs);
      }
    });
  }

  listOnce(path: string): Promise<RemoteNode> {
    return new Promise((resolve, reject) => {
      let sub = this.list(path, (update) => {
        resolve(update.node);

        if (sub != null) {
          sub.close();
        }
      });
    });

  }

  list(path: string, callback: Listener<RequesterListUpdate>): StreamSubscription<RequesterListUpdate> {
    let node: RemoteNode = this.nodeCache.getRemoteNode(path);
    return node._list(this).listen(callback);
  }

  invoke(path: string, params: { [key: string]: any } = {}, callback?: Listener<RequesterInvokeUpdate>,
         maxPermission: number = Permission.CONFIG): RequesterInvokeStream {
    let node: RemoteNode = this.nodeCache.getRemoteNode(path);
    let stream = node._invoke(params, this, maxPermission);
    if (callback) {
      stream.listen(callback);
    }
    return stream;
  }

  set(path: string, value: object,
      maxPermission: number = Permission.CONFIG): Promise<RequesterUpdate> {
    return new SetController(this, path, value, maxPermission).future;
  }

  remove(path: string): Promise<RequesterUpdate> {
    return new RemoveController(this, path).future;
  }

  /// close the request from requester side and notify responder
  closeRequest(request: Request) {
    if (this._requests.has(request.rid)) {
      if (request.streamStatus !== StreamStatus.closed) {
        this.addToSendList({'method': 'close', 'rid': request.rid});
      }
      this._requests.delete(request.rid);
      request.close();
    }
  }

  _connected: boolean = false;

  onDisconnected() {
    if (!this._connected) return;
    this._connected = false;

    let newRequests = new Map<number, Request>();
    newRequests.set(0, this._subscription);
    for (let [n, req] of this._requests) {
      if (req.rid <= this.lastRid && !(req.updater instanceof ListController)) {
        req._close(DSError.DISCONNECTED);
      } else {
        newRequests.set(req.rid, req);
        req.updater.onDisconnect();
      }
    }
    this._requests = newRequests;
  }

  onReconnected() {
    if (this._connected) return;
    this._connected = true;

    super.onReconnected();

    for (let [n, req] of this._requests) {
      req.updater.onReconnect();
      req.resend();
    }
  }
}
